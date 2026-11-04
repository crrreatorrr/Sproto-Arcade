#!/usr/bin/env node
// Browser adapter lifecycle fixtures. Clears/loss/transition are explicitly invoked.
import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';import {openBrowser,wait} from './browser-cdp.mjs';
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));const b=await openBrowser(pathToFileURL(path.join(root,'index.html')).href),checks=[];
const key=async(code,key,type='keyDown',autoRepeat=false)=>b.send('Input.dispatchKeyEvent',{type,code,key,autoRepeat});
const tap=async(code,name)=>{await key(code,name);await wait(35);await key(code,name,'keyUp');};
async function check(name,fn){try{const detail=await fn();if(detail===false)throw Error('Expected assertion was false');checks.push({name,status:'passed',detail});}catch(e){checks.push({name,status:'failed',error:e.message});}}
async function start(id,entry='0'){await b.evaluate(`(()=>{document.getElementById('stage').value=${JSON.stringify(id)};document.getElementById('stage').dispatchEvent(new Event('change'));document.getElementById('entry').value=${JSON.stringify(entry)};document.getElementById('entry').dispatchEvent(new Event('change'));document.getElementById('start').click();})()`);await wait(60);}
try{
 for(let i=0;i<100;i++){if(await b.evaluate('!!globalThis.ArcadeApp'))break;await wait(100);}
 await check('reserved action cannot replace dash; chosen key replaces Shift',async()=>{
  await start('01-marina');await b.evaluate("document.getElementById('dash-key').click()");await tap('KeyX','x');
  const reserved=await b.evaluate("document.getElementById('dash-key').textContent.includes('Reserved')");await tap('KeyQ','q');await tap('KeyQ','q');
  const remapped=await b.evaluate("ArcadeApp.world.player.dashWait>0 && document.getElementById('dash-key').textContent.startsWith('q')");
  await tap('KeyR','r');await tap('ShiftLeft','Shift');const oldDisabled=await b.evaluate('ArcadeApp.world.player.dashWait===0');
  await b.evaluate("document.getElementById('dash-key').click()");await tap('ShiftLeft','Shift');
  if(!reserved||!remapped||!oldDisabled)throw Error(JSON.stringify({reserved,remapped,oldDisabled}));return {reserved,remapped,oldDisabled};
 });
 await check('Escape repeat does not toggle pause twice',async()=>{
  await start('01-marina');await key('Escape','Escape');await wait(20);await key('Escape','Escape','keyDown',true);await wait(50);
  const paused=await b.evaluate('ArcadeApp.paused');await key('Escape','Escape','keyUp');await tap('Escape','Escape');const resumed=await b.evaluate('!ArcadeApp.paused');if(!paused||!resumed)throw Error('Pause state repeated');return {paused,resumed};
 });
 await check('transformation can pause; dispatched blur pauses it and clears movement',async()=>{
  await start('01-marina');await b.evaluate('ArcadeApp.world.advancePhase()');await tap('Escape','Escape');
  const before=await b.evaluate('({paused:ArcadeApp.paused,state:ArcadeApp.world.state,tick:ArcadeApp.world.tick,transition:ArcadeApp.world.transitionTick})');await wait(120);
  const fixed=await b.evaluate(`ArcadeApp.world.tick===${before.tick} && ArcadeApp.world.transitionTick===${before.transition}`);
  await b.evaluate("document.getElementById('resume').click()");await wait(50);await key('ArrowRight','ArrowRight');await b.evaluate("window.dispatchEvent(new Event('blur'))");
  const blur=await b.evaluate('({paused:ArcadeApp.paused,state:ArcadeApp.world.state,tick:ArcadeApp.world.tick})');await wait(80);const blurFrozen=await b.evaluate(`ArcadeApp.world.tick===${blur.tick}`);await key('ArrowRight','ArrowRight','keyUp');
  await b.evaluate("document.getElementById('resume').click()");await wait(1650);
  const final=await b.evaluate('({state:ArcadeApp.world.state,phase:ArcadeApp.world.phaseIndex,x:ArcadeApp.world.player.x,spawn:ArcadeApp.world.phase.spawn.x})');
  if(!before.paused||before.state!=='transition'||!fixed||!blur.paused||!blurFrozen||final.phase!==1||final.x!==final.spawn)throw Error(JSON.stringify({before,fixed,blur,blurFrozen,final}));return {before,fixed,blur,blurFrozen,final};
 });
 await check('full, phase practice and sector records use independent keys',async()=>{
  await b.evaluate("localStorage.removeItem('arcade-v1-records')");
  const records=[];for(const [entry,ticks]of [['0',240],['1',120],['sector-2',180],['sector-3',360]]){
   await start('11-rooftop',entry);const snapshot=await b.evaluate(`(()=>{const w=ArcadeApp.world;w.tick=${ticks};w.clear();return {phase:w.options.phase,sector:w.options.sector,practice:w.practice};})()`);await wait(65);records.push({entry,...snapshot});
  }
  const stored=await b.evaluate("JSON.parse(localStorage.getItem('arcade-v1-records'))");const expected={'11-rooftop:full':240,'11-rooftop:practice:phase1:sector0':120,'11-rooftop:practice:phase0:sector2':180,'11-rooftop:practice:phase0:sector3':360};
  for(const [k,v]of Object.entries(expected))if(stored[k]!==v)throw Error(JSON.stringify({expected,stored}));
  return {records,stored,forcedClear:true};
 });
 await check('next encounter appears after full clear and advances selector',async()=>{
  await start('01-marina');await b.evaluate('ArcadeApp.world.clear()');await wait(55);const visible=await b.evaluate("!document.getElementById('next').hidden");await b.evaluate("document.getElementById('next').click()");await wait(50);
  const world=await b.evaluate('({id:ArcadeApp.world.stage.id,state:ArcadeApp.world.state,practice:ArcadeApp.world.practice})');
  const selector=await b.evaluate("document.getElementById('stage').value");if(!visible||world.id==='01-marina'||world.state!=='playing'||world.practice||selector!==world.id)throw Error(JSON.stringify({visible,world,selector}));return {visible,world,selector,forcedClear:true};
 });
 const errors=b.events.filter(e=>e.method==='Runtime.exceptionThrown'||(e.method==='Log.entryAdded'&&e.params.entry.level==='error')).map(e=>e.params.exceptionDetails?.exception?.description||e.params.entry?.text||e.method);
 const failed=checks.filter(c=>c.status!=='passed').length;console.log(JSON.stringify({build:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),workingTree:execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}).trim(),status:failed||errors.length?'failed':'passed',kind:'offline-adapter-regression',checks,errors,limitations:['Transition and clear are invoked explicitly to test adapter routing, not gameplay completion.','Blur is a dispatched browser event; no operating-system focus-switch claim.']},null,2));if(failed||errors.length)process.exitCode=1;
}finally{await b.close();}
