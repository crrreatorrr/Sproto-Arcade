#!/usr/bin/env node
// Story mode determinism check (co-op groundwork). Real Chromium over a local HTTP server.
// Feeds the same scripted input frames into update() twice per level and requires identical
// state checksums, and a different script to give a different checksum. game.js uses browser
// globals (canvas, Image, DOM), so this runs in a page rather than under node:vm.
//   node qa/replay-browser.mjs [root]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const TYPES={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch();
const TICKS=1800;
try{
  const results=[];
  for(const level of [1,3,11,12]){
    const page=await browser.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(origin+'/legacy.html?level='+level);
    await page.waitForFunction(()=>!document.getElementById('start').disabled,null,{timeout:120000});
    await page.click('#start');
    await page.waitForFunction(()=>document.querySelector('.overlay').hidden,null,{timeout:60000});
    const run=seed=>page.evaluate(([index,ticks,seed])=>{
      // Scripted controller: walk, jump, dash, shield and fire specials on a seeded schedule.
      let s=seed>>>0;const rnd=()=>((s=Math.imul(s^s>>>13,0x5bd1e995)+0x9e3779b9>>>0)/4294967296);
      const frames=[];let held={left:false,right:true,up:false,down:false,jumpHeld:false};
      for(let t=0;t<ticks;t++){
        // Platform levels (chase, codebreak) stand still and use specials only, so the script does not fall.
        const platform=LEVELS[index].chase||LEVELS[index].codebreak;
        if(t%20===0)held=platform?{left:false,right:false,up:false,down:false,jumpHeld:rnd()<.5}:{left:rnd()<.3,right:rnd()<.6,up:rnd()<.25,down:rnd()<.2,jumpHeld:rnd()<.5};
        frames.push({...held,jump:!platform&&rnd()<.05,dash:!platform&&rnd()<.03,shield:rnd()<.02,missile:rnd()<.04,bomb:rnd()<.03});
      }
      const wasGod=godMode;godMode=true;godFire=true;godDamageBoost=false;godHits=0; // survive the whole script
      begin(index);
      for(const frame of frames){if(mode!=='play')break;inputFrame=frame;update();pressed.clear();}
      const round=v=>typeof v==='number'?Math.round(v*1000)/1000:v;
      const pick=(o,keys)=>o?keys.map(k=>round(o[k])):null;
      const state=JSON.stringify({mode,time,camera:round(camera),
        player:pick(player,['x','y','vx','vy','hp','dash','dashWait','shield','shieldWait','missileWait','bombWait','airJump','grounded']),
        boss:pick(boss,['x','y','hp','phase','section','step','age']),
        bullets:(bullets||[]).map(b=>pick(b,['x','y','vx','vy','own','shape'])),
        hazards:(hazards||[]).length,sparks:(sparks||[]).map(p=>pick(p,['x','y','life'])),godHits});
      godMode=wasGod;
      let h=2166136261;for(const c of state){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
      setOverlay('paused','','','','');
      return {checksum:(h>>>0).toString(16),ticks:time,bullets:(bullets||[]).length,mode};
    },[level-1,TICKS,seed]);
    const a=await run(17),b=await run(17),c=await run(18);
    if(errors.length)throw Error('Level '+level+' page errors '+JSON.stringify(errors));
    if(a.checksum!==b.checksum)throw Error('Level '+level+' replay diverged: '+a.checksum+' vs '+b.checksum);
    if(a.checksum===c.checksum)throw Error('Level '+level+' checksum ignores input');
    results.push({level,ticks:a.ticks,checksum:a.checksum,otherScript:c.checksum});
    await page.close();
  }
  console.log(JSON.stringify({status:'passed',kind:'story-deterministic-replay',ticksPerRun:TICKS,results,
    limitations:['God mode keeps the scripted player alive; damage paths are exercised less than in real play.','The scripted runner falls early in the chase and Codebreak (about 60-90 ticks); those runs prove determinism only up to the fall.','Same browser and machine; cross-browser floating-point agreement is not shown.']},null,2));
}finally{await browser.close();server.close();}
