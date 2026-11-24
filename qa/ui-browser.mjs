#!/usr/bin/env node
// Actual new offline entry; normal menu/input smoke plus explicit forced lifecycle.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';import {openBrowser,wait} from './browser-cdp.mjs';
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const build=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const browser=await openBrowser(pathToFileURL(path.join(root,'index.html')).href);
try{
 for(let i=0;i<100;i++){if(await browser.evaluate('!!globalThis.ArcadeApp'))break;await wait(100);}
 const stages=await browser.evaluate('[...document.getElementById("stage").options].map(x=>({id:x.value,title:x.textContent}))');
 const rows=[];
 // A held key is read on the next fixed step; on a busy machine that can be later than one 30 ms wait.
 const observed=async expression=>{for(let i=0;i<20;i++){await wait(30);if(await browser.evaluate(expression))return true;}return false;};
 for(const stage of stages)for(const phase of [0,1]){
  await browser.evaluate(`globalThis.__qaPrevWorld=ArcadeApp.world;document.getElementById('stage').value=${JSON.stringify(stage.id)};document.getElementById('entry').value='${phase}';document.getElementById('start').click()`);
  // Start loads the stage's boss art first when it is not in memory yet (rework.js start()), so the
  // new World appears when that finishes, not on the click.
  let started=false;
  for(let i=0;i<300&&!started;i++){started=await browser.evaluate('!!ArcadeApp.world&&ArcadeApp.world!==globalThis.__qaPrevWorld&&!ArcadeApp.paused');if(!started)await wait(100);}
  if(!started)throw Error('Stage '+stage.id+' entry '+phase+' did not start within 30 s: '+await browser.evaluate('document.getElementById("status")?.textContent'));
  await wait(120);
  const initial=await browser.evaluate(`(()=>{const w=ArcadeApp.world;return {state:w.state,phase:w.phaseIndex,practice:w.practice,hp:w.player.hp,tick:w.tick,objective:w.objective,mode:w.phase.mode,targets:w.targets.length,platforms:w.platforms.length,power:w.weapons.snapshot()};})()`);
  // Exercise actual keyboard adapter and fixed-step loop.
  await browser.send('Input.dispatchKeyEvent',{type:'keyDown',code:'ShiftLeft',key:'Shift'});
  const dashObserved=await observed('ArcadeApp.world.player.dash>0 || ArcadeApp.world.player.dashWait>0');await browser.send('Input.dispatchKeyEvent',{type:'keyUp',code:'ShiftLeft',key:'Shift'});
  await browser.send('Input.dispatchKeyEvent',{type:'keyDown',code:'KeyX',key:'x'});
  const shieldObserved=await observed('ArcadeApp.world.player.shieldWait>0');await browser.send('Input.dispatchKeyEvent',{type:'keyUp',code:'KeyX',key:'x'});
  const transition=phase===0?await browser.evaluate(`(()=>{const w=ArcadeApp.world;w.hazard({id:'qa-stale-transition',source:'qa-stale',x:900,y:0,w:10,h:10,active:10000});w.advancePhase();for(let i=0;i<90;i++)w.step({});ArcadeApp.render();return {phase:w.phaseIndex,state:w.state,staleHazards:w.hazards.some(h=>h.id==='qa-stale-transition'),objective:w.objective,power:w.weapons.snapshot()};})()`):null;
  await browser.evaluate('ArcadeApp.world.lose("qa-explicit-loss")');await wait(30);
  await browser.send('Input.dispatchKeyEvent',{type:'keyDown',code:'KeyR',key:'r'});await wait(80);
  await browser.send('Input.dispatchKeyEvent',{type:'keyUp',code:'KeyR',key:'r'});
  const retry=await browser.evaluate(`(()=>{const w=ArcadeApp.world;return {state:w.state,phase:w.phaseIndex,hp:w.player.hp,failure:w.failure,overlay:!document.getElementById('curtain').hidden,power:w.weapons.snapshot()};})()`);
  // R retries the phase the run was lost in (docs/PHASE-POWERUPS.md): a full run that was pushed on
  // to phase 2 above retries phase 2, not the whole encounter.
  const retryPhase=transition?transition.phase:phase;
  const passed=initial.state==='playing'&&initial.phase===phase&&retry.state==='playing'&&retry.phase===retryPhase&&retry.hp===5&&!retry.overlay&&!retry.power&&dashObserved&&shieldObserved&&(!transition||(transition.phase===1&&transition.state==='playing'&&!transition.staleHazards));
  rows.push({stage:stage.id,entry:phase?'phase2-practice':'full-run',seed:777,initial,dashObserved,shieldObserved,transition,retry,result:passed?'passed':'failed'});
 }
 // Pause uses a real Escape edge and stops ticks.
 await browser.send('Input.dispatchKeyEvent',{type:'keyDown',code:'Escape',key:'Escape'});await browser.send('Input.dispatchKeyEvent',{type:'keyUp',code:'Escape',key:'Escape'});
 const t=await browser.evaluate('ArcadeApp.world.tick');await wait(100);const paused=await browser.evaluate(`ArcadeApp.paused && ArcadeApp.world.tick===${t}`);
 await browser.evaluate('document.getElementById("resume").click()');await wait(40);
 const resumed=await browser.evaluate('!ArcadeApp.paused');
 const exceptions=browser.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.exception?.description||e.params.exceptionDetails.text);
 const errors=browser.events.filter(e=>e.method==='Log.entryAdded'&&e.params.entry.level==='error').map(e=>e.params.entry.text);
 const result={build,workingTree:execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}).trim(),kind:'offline-menu-and-keyboard-smoke',status:rows.every(r=>r.result==='passed')&&paused&&resumed&&!exceptions.length?'passed':'failed',registered:stages.length,rows,paused,resumed,exceptions,errors,limitations:['Phase transitions and losses invoked explicitly; no earned completion tested.','Registration count may be partial during integration.','No human comprehension or visual balance validation.']};
 if(process.env.QA_CAPTURE){const capture=await browser.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(process.env.QA_CAPTURE,Buffer.from(capture.data,'base64'));}
 console.log(JSON.stringify(result,null,2));if(result.status!=='passed')process.exitCode=1;
}finally{await browser.close();}
