#!/usr/bin/env node
// Frame-cost budget for story mode (docs/GAMEPLAY-IMPROVEMENT-PLAN.md, A1 and A2). Headless
// Chromium renders in software, where canvas filters once held the game at 3 to 20 ticks per
// second. Projectile and missile keylines now come from the baked-outline cache in boss-sheets.js.
// This plays level 1 into its first barrage with god mode on and fails under 45 ticks per second
// or when the cache is not doing the drawing. It says nothing about a real GPU.
//   node qa/filter-budget-browser.mjs [repo] [level=1]
import {serve,playwright,openStory} from './story-browser.mjs';
const level=Number(process.argv[3])||1,BUDGET=45;
const server=await serve(),browser=await playwright().chromium.launch();
try{
 const {page,errors}=await openStory(browser,level);
 await page.evaluate(()=>{godMode=true;godUsed=true;godFire=false;});
 const sample=()=>page.evaluate(()=>({tick:time,now:performance.now(),missiles:densityShots.length}));
 const window=async(ms=3000)=>{const a=await sample();await page.waitForTimeout(ms);const b=await sample();return Math.round((b.tick-a.tick)/((b.now-a.now)/1000)*10)/10;};
 const normal=[await window(),await window()];
 for(let i=0;i<1200&&!(await sample()).missiles;i++)await page.waitForTimeout(50);
 const barrage=[];
 for(let i=0;i<3&&(await sample()).missiles;i++)barrage.push(await window());
 const cache=await page.evaluate(()=>({...ArcadeBossSheets.outlineStats,entries:ArcadeBossSheets.outlineCacheSize()}));
 const rates=[...normal,...barrage],slowest=Math.min(...rates);
 const ok=barrage.length>0&&slowest>=BUDGET&&cache.blits>0&&cache.direct<=cache.blits/20&&cache.entries<=256&&!errors.length;
 console.log(JSON.stringify({kind:'story-filter-budget',status:ok?'passed':'failed',level,budgetTicksPerSecond:BUDGET,normal,barrage,slowest,outlineCache:cache,errors,
  limitations:['Headless Chromium software rendering only; no real GPU, phone, Firefox or Safari was measured.','God mode with player fire off, as in the plan\'s audit.']},null,2));
 if(!ok)process.exitCode=1;
}finally{await browser.close();server.close();}
