#!/usr/bin/env node
// Actual offline legacy entry, routing smoke only, not base-kit completion.
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {openBrowser,wait} from './browser-cdp.mjs';
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const browser=await openBrowser(pathToFileURL(path.join(root,'legacy.html')).href);
try{
 let ready=false;
 for(let i=0;i<600;i++){
  ready=await browser.evaluate("!!document.getElementById('start') && !document.getElementById('start').disabled");
  if(ready)break;await wait(100);
 }
 if(!ready)throw Error('Art did not finish loading within 60 seconds: '+await browser.evaluate("document.getElementById('start')?.textContent"));
 const result=await browser.evaluate(`(()=>{
 const rows=[];
 for(let i=0;i<LEVELS.length;i++){
  const row={number:i+1,title:LEVELS[i].title,seed:'legacy-unseeded',entry:'selector/start',build:'a25acb1'};
  try{
   begin(i);update();render();row.start={mode,hp:player.hp,phase:boss.phase??'chase'};
   if(isChase())row.phase2='not implemented in baseline';
   else if(isCodebreak()){startCodebreakArena();update();render();row.phase2=boss.phase;}
   else{startStageShift();for(let n=0;n<STAGE_SHIFT_END;n++)update();render();row.phase2=boss.phase;}
   player.inv=player.shield=player.dash=0;
   while(player.hp){hurt(false,true);player.inv=0;}
   row.loss=mode;ui.start.click();row.retry={mode,hp:player.hp,phase:boss.phase??'chase',bullets:bullets.length,hazards:hazards.length};
   clearLevel();row.clearRoute=mode;row.result='routing passed (phase/clear invoked, not earned)';
  }catch(e){row.result='failed';row.error=e.stack;}
  rows.push(row);
 }
 return {status:rows.every(r=>!r.error)?'passed':'failed',kind:'forced-routing-smoke',rows};
})()`);
 result.errors=browser.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.text);
 console.log(JSON.stringify(result,null,2));
 if(result.status!=='passed'||result.errors.length)process.exitCode=1;
}finally{await browser.close();}
