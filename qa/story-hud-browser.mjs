#!/usr/bin/env node
// Story-mode HUD teaching and fail screen (docs/GAMEPLAY-IMPROVEMENT-PLAN.md, A3 to A5) in
// headless Chromium. The simulation is stepped directly with scripted inputs, so every case is
// deterministic; forced knockouts set the player to one heart first. Not a human playtest.
//   node qa/story-hud-browser.mjs [repo]
import assert from 'node:assert/strict';
import {serve,playwright,openStory} from './story-browser.mjs';
const server=await serve(),browser=await playwright().chromium.launch(),cases=[];
// Runs in the page: restart the level, then step until `until` (source text) is true.
const drive=(page,options)=>page.evaluate(({phase,god,until,limit,setup,each})=>{
 if(phase){godMode=god;godUsed=god;begin(levelIndex,false,phase,777);}
 if(setup)(0,eval)(setup);
 const stop=(0,eval)('()=>'+until),tick=each?(0,eval)('()=>{'+each+'}'):null;let cueAt=-1;
 mode='play';
 for(let i=0;i<limit&&mode==='play';i++){inputFrame=NO_INPUT;if(tick)tick();update();if(stop())break;}
 const result={mode,time,cue:ui.cue.textContent,urgent:ui.cue.classList.contains('urgent'),description:ui.description.textContent,eyebrow:ui.eyebrow.textContent,
  move:boss&&boss.move,age:boss&&boss.age,tell:boss&&boss.tell,hp:player.hp,missiles:densityShots.length};
 if(mode==='play')mode='paused';
 return result;
},{phase:0,god:true,limit:6000,setup:'',each:'',...options});
const check=(name,fn)=>{fn();cases.push(name);};
try{
 { // Level 1: sweep cue, attack names, barrage cue, fail reports.
  const {page,errors}=await openStory(browser,1);
  let r=await drive(page,{phase:1,until:"boss.move==='ceilingSweep'&&boss.age>=2"});
  check('ceiling sweep cue within 2 frames of the tell',()=>{assert.match(r.cue,/^CEILING SWEEP · CROUCH \(↓\) OR SHIELD \(X\)$/);assert.ok(r.urgent);assert.ok(r.age<=2&&r.age<r.tell);});
  r=await drive(page,{until:"mode!=='play'",setup:"godMode=false;player.hp=1;player.inv=0;"});
  check('sweep knockout names the sweep, the phase and the retry cost',()=>{assert.equal(r.mode,'lost');assert.match(r.description,/^Caught standing under the ceiling sweep\.\nPhase 1 · section 1 of 4 · Fat Head Dave at \d+%\nTip: the ceiling sweep cannot be dashed.*crouch \(↓\).*shield \(X\)\.\nRetry restarts phase 1\.$/);});
  r=await drive(page,{phase:1,until:"boss.move&&boss.move!=='ceilingSweep'&&boss.age===2&&boss.age<boss.tell&&time>60"});
  const label=await page.evaluate(()=>moveLabel(boss.move));
  check('ordinary attacks are named during the tell',()=>{assert.equal(r.cue,label);assert.ok(label.length>3);});
  r=await drive(page,{phase:1,until:"densityShots.length>0"});
  check('barrage cue replaces the blank line and gives the first row',()=>{assert.match(r.cue,/^MISSILE BARRAGE · GUNS OFFLINE · (CROUCH \(↓\)|JUMP|SHORT HOP)$/);assert.ok(r.urgent);});
  const lanes=await page.evaluate(()=>{const seen=[];mode='play';for(let i=0;i<900&&densityShots.length;i++){inputFrame=NO_INPUT;update();const lane=barrageLane();if(lane&&seen.at(-1)!==lane)seen.push(lane);}const after=ui.cue.textContent;mode='paused';return{seen,after};});
  check('barrage hint follows the rows and ends with BARRAGE OVER',()=>{assert.ok(lanes.seen.includes('crouch')&&lanes.seen.includes('jump'),JSON.stringify(lanes.seen));assert.equal(lanes.after,'BARRAGE OVER · GUNS ONLINE');});
  r=await drive(page,{phase:1,until:"mode!=='play'",each:"if(densityShots.length&&godMode){godMode=false;player.hp=1;player.inv=0;}"});
  check('barrage knockout reports the barrage',()=>{assert.equal(r.mode,'lost');assert.match(r.description,/^Knocked out by the missile barrage\.\nPhase 1 · section 1 of 4 · Fat Head Dave at \d+%\nBarrage tip: read the row/);});
  r=await drive(page,{phase:1,until:"mode!=='play'",each:"const s=bullets.find(b=>!b.own);if(s&&boss.move!=='ceilingSweep'){godMode=false;player.hp=1;player.inv=0;player.dash=0;player.x=clamp(s.x,58,740);player.y=Math.min(FLOOR,s.y+40);}"});
  check('ordinary knockout names the attack',()=>{assert.equal(r.mode,'lost');assert.match(r.description,/^Knocked out during [A-Z -]+\.\nPhase 1 · section \d of 4 · Fat Head Dave at \d+%\nTip: a dash passes through/);});
  r=await drive(page,{phase:2,setup:"boss.hp=Math.floor(boss.max*.45);",until:"boss.move==='shieldPulse'&&boss.age>=2"});
  check('shield pulse cue',()=>assert.match(r.cue,/^SHIELD PULSE CHARGING · GET READY TO SHIELD \(X\)$/));
  r=await drive(page,{until:"ui.cue.textContent.startsWith('SHIELD NOW')||mode!=='play'"});
  check('shield now cue',()=>assert.equal(r.cue,'SHIELD NOW · X'));
  r=await drive(page,{until:"mode!=='play'",setup:"godMode=false;player.hp=1;player.inv=0;"});
  check('pulse knockout explains the phase-2 retry rule',()=>{assert.equal(r.mode,'lost');assert.match(r.description,/^Hit by the shield pulse\.\nPhase 2 · section 3 of 4 · Fat Head Dave at \d+%\nTip: only the shield stops a pulse.*\nRetry restarts phase 2 with full health\. A clear after a checkpoint retry saves your progress\.$/);});
  const hub=await page.evaluate(()=>{const real=window.ArcadeHub.connected;window.ArcadeHub.connected=()=>true;const text=failReport('x wins this round.');window.ArcadeHub.connected=real;return text;});
  check('in a hub session the retry line states the Ticket rule and the Coin',()=>assert.match(hub,/saves your progress but earns no Tickets\. The Breakwater Coin still counts\.$/));
  const pad=await page.evaluate(()=>{document.documentElement.dataset.input='gamepad';const text=coachText()+'|'+FAIL_TIPS.ceilingSweep();delete document.documentElement.dataset.input;return text;});
  check('controller wording',()=>{assert.match(pad,/left stick or D-pad/);assert.match(pad,/crouch \(STICK ↓\).*shield \(X \/ LT\)/);});
  assert.deepEqual(errors,[]);await page.close();
 }
 { // Flight: the exposed cue no longer says "jump".
  const {page,errors}=await openStory(browser,3);
  const r=await drive(page,{phase:1,until:"boss.move&&moves[boss.move]&&boss.age>boss.tell+moves[boss.move].active&&!densityShots.length"});
  check('flight exposed cue',()=>assert.equal(r.cue,'EXPOSED  ·  Line up with the ring'));
  const b=await drive(page,{until:"densityShots.length>0"});
  check('flight barrage cue',()=>assert.equal(b.cue,'MISSILE BARRAGE · GUNS OFFLINE · FLY THROUGH THE GAP'));
  assert.deepEqual(errors,[]);await page.close();
 }
 { // First-run card: once per browser, then never again.
  const {page,errors}=await openStory(browser,1,{coach:true,start:false});
  await page.click('#start');
  const card=await page.evaluate(()=>({mode,eyebrow:ui.eyebrow.textContent,text:ui.description.textContent,button:ui.start.textContent,select:document.getElementById('sproto-select').hidden}));
  check('first Start shows the controls card',()=>{assert.equal(card.mode,'coach');assert.equal(card.eyebrow,'How to play');assert.match(card.text,/Crouch: ↓/);assert.match(card.text,/SHIELD PULSE/);assert.match(card.text,/EXPOSED/);assert.ok(card.select);});
  await page.click('#start');await page.waitForFunction(()=>mode==='play',null,{timeout:60000});
  check('second press starts the level and remembers the card',()=>{});
  assert.equal(await page.evaluate(()=>localStorage.getItem('sproto-arcade-coach-v1')),'1');
  await page.keyboard.press('Escape');
  const paused=await page.evaluate(()=>({mode,text:ui.description.textContent}));
  check('pause repeats the controls',()=>{assert.equal(paused.mode,'paused');assert.match(paused.text,/Take a breather\.\nMove: ← →/);});
  await page.reload();await page.waitForFunction(()=>!document.getElementById('start').disabled,null,{timeout:120000});
  await page.click('#start');await page.waitForFunction(()=>mode==='play',null,{timeout:60000});
  check('a returning browser starts on the first press',()=>{});
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log(JSON.stringify({kind:'story-hud-teaching',status:'passed',cases,limitations:['Scripted simulation steps in headless Chromium; no human read the cues.']},null,2));
}catch(error){console.log(JSON.stringify({kind:'story-hud-teaching',status:'failed',passed:cases,error:String(error&&error.stack||error)},null,2));process.exitCode=1;}
finally{await browser.close();server.close();}
