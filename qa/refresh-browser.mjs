#!/usr/bin/env node
// Drive the actual browser RAF adapter at controlled display timestamps.
import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';import {openBrowser,wait} from './browser-cdp.mjs';
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const script=`(()=>{let sequence=0;const queue=new Map();globalThis.requestAnimationFrame=callback=>{queue.set(++sequence,callback);return sequence;};globalThis.cancelAnimationFrame=id=>queue.delete(id);globalThis.__qaFrame=time=>{const current=[...queue.values()];queue.clear();for(const callback of current)callback(time);return queue.size;};})();`;
const rows=[];
for(const hz of [30,60,120,144]){
 const b=await openBrowser(pathToFileURL(path.join(root,'index.html')).href,{initScripts:[script]});
 try{
  for(let i=0;i<100;i++){if(await b.evaluate('!!globalThis.ArcadeApp'))break;await wait(100);}
  await b.evaluate(`(()=>{document.getElementById('stage').value='01-marina';document.getElementById('stage').dispatchEvent(new Event('change'));document.getElementById('entry').value='0';document.getElementById('seed').value='777';document.getElementById('start').click();__qaFrame(0);})()`);
  await b.send('Input.dispatchKeyEvent',{type:'keyDown',code:'ArrowRight',key:'ArrowRight'});
  const stamps=[];for(let i=1;i*1000/hz<2400;i++)stamps.push(i*1000/hz);stamps.push(2400.001);
  const snapshot=await b.evaluate(`(()=>{for(const t of ${JSON.stringify(stamps)})__qaFrame(t);const w=ArcadeApp.world;return {tick:w.tick,phase:w.phaseIndex,state:w.state,player:{x:w.player.x,y:w.player.y,vx:w.player.vx,vy:w.player.vy,hp:w.player.hp,dash:w.player.dash},targets:w.targets.map(t=>({id:t.id,hp:t.hp,open:t.open})),hazards:w.hazards.map(h=>({id:h.id,x:h.x,y:h.y,age:h.age,resolved:h.resolved})),shots:w.shots.map(s=>({x:s.x,y:s.y,ttl:s.ttl})),failure:w.failure};})()`);
  const errors=b.events.filter(e=>e.method==='Runtime.exceptionThrown'||(e.method==='Log.entryAdded'&&e.params.entry.level==='error')).map(e=>e.params.exceptionDetails?.text||e.params.entry?.text);
  rows.push({hz,frames:stamps.length,durationMs:2400.001,snapshot,errors});
 }finally{await b.close();}
}
const exact=rows.every(r=>JSON.stringify(r.snapshot)===JSON.stringify(rows[0].snapshot)),status=exact&&rows.every(r=>!r.errors.length)&&rows[0].snapshot.tick===144?'passed':'failed';
console.log(JSON.stringify({build:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),workingTree:execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}).trim(),status,kind:'actual-browser-raf-refresh-fixture',exactSnapshots:exact,rows,limitations:['Controlled RAF timestamps exercise the actual adapter; this does not measure physical monitor behavior or dropped-frame performance.','Uses legal held-right input on Marina, seed777, no world-state mutation.']},null,2));if(status!=='passed')process.exitCode=1;
