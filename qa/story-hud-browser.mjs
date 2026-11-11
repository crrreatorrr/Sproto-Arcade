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
  check('barrage knockout reports the barrage',()=>{assert.equal(r.mode,'lost');assert.match(r.description,/^Knocked out by the missile barrage\.\nPhase 1 · section \d of 4 · Fat Head Dave at \d+%\nBarrage tip: read the row/);});
  r=await drive(page,{phase:1,until:"mode!=='play'",each:"const s=bullets.find(b=>!b.own);if(s&&boss.move!=='ceilingSweep'){godMode=false;player.hp=1;player.inv=0;player.dash=0;player.x=clamp(s.x,58,740);player.y=Math.min(FLOOR,s.y+40);}"});
  check('ordinary knockout names the attack',()=>{assert.equal(r.mode,'lost');assert.match(r.description,/^Knocked out during [A-Z -]+\.\nPhase 1 · section \d of 4 · Fat Head Dave at \d+%\nTip: a dash passes through/);});
  r=await drive(page,{phase:2,setup:"boss.hp=Math.floor(boss.max*.45);",until:"boss.move==='shieldPulse'&&boss.age>=2"});
  check('shield pulse cue',()=>assert.match(r.cue,/^SHIELD PULSE CHARGING · GET READY TO SHIELD \(X\)$/));
  r=await drive(page,{until:"ui.cue.textContent.startsWith('SHIELD NOW')||mode!=='play'"});
  check('shield now cue',()=>assert.equal(r.cue,'SHIELD NOW · X'));
  r=await drive(page,{until:"mode!=='play'",setup:"godMode=false;player.hp=1;player.inv=0;"});
  check('pulse knockout explains the phase-2 retry rule',()=>{assert.equal(r.mode,'lost');assert.match(r.description,/^Hit by the shield pulse\.\nPhase 2 · section 3 of 4 · Fat Head Dave at \d+%\nTip: only the shield stops a pulse.*\nRETRY PHASE 2: full health, phase 2 only\. That clear saves your progress as a rank C checkpoint clear\.\nRESTART LEVEL: from phase 1\. Only a full run earns a rank and a best time\.$/);});
  const choice=await page.evaluate(()=>({cue:ui.cue.textContent,full:document.getElementById('restart-full').hidden,start:ui.start.textContent}));
  check('phase-2 knockout offers the full run beside the checkpoint retry, with no stale cue',()=>{assert.equal(choice.cue,'');assert.equal(choice.full,false);assert.equal(choice.start,'Retry phase 2');});
  await page.click('#restart-full');await page.waitForFunction(()=>mode==='play',null,{timeout:60000});
  const fresh=await page.evaluate(()=>{const out={phase:boss.phase,checkpoint:phaseCheckpointRun,recorder:Boolean(replayRecorder),hp:boss.hp===boss.max,hidden:document.getElementById('restart-full').hidden};mode='paused';return out;});
  check('Restart level begins a full, recorded run from phase 1',()=>assert.deepEqual(fresh,{phase:1,checkpoint:false,recorder:true,hp:true,hidden:true}));
  const hub=await page.evaluate(()=>{godMode=false;begin(0,false,2,777);mode='paused';const real=window.ArcadeHub.connected;window.ArcadeHub.connected=()=>true;const text=failReport('x wins this round.');window.ArcadeHub.connected=real;return text;});
  check('in a hub session the retry line states the Ticket rule and the Coin',()=>assert.match(hub,/That clear saves your progress but earns no Tickets\. The Breakwater Coin still counts\.\nRESTART LEVEL: from phase 1\. Only this full run earns the 20 Tickets, and a rank\.$/));
  const pad=await page.evaluate(()=>{document.documentElement.dataset.input='gamepad';const text=coachText()+'|'+FAIL_TIPS.ceilingSweep();delete document.documentElement.dataset.input;return text;});
  check('controller wording',()=>{assert.match(pad,/left stick or D-pad/);assert.match(pad,/crouch \(STICK ↓\).*shield \(X \/ LT\)/);});
  // Knockout screens never keep a cue, and a phase-1 knockout has no second action.
  r=await drive(page,{phase:1,until:"mode!=='play'",each:"if(densityShots.length&&godMode){godMode=false;player.hp=1;player.inv=0;}"});
  const dead=await page.evaluate(()=>{refreshHud();return{cue:ui.cue.textContent,full:document.getElementById('restart-full').hidden,start:ui.start.textContent};});
  check('no cue behind a barrage knockout; phase 1 has one action',()=>assert.deepEqual(dead,{cue:'',full:true,start:'Rematch boss'}));
  // In-game feedback window (feedback-link.js): feedbackPause/feedbackResume around every screen.
  const fb=await page.evaluate(()=>{
   const out={};godMode=true;begin(0,false,1,777);mode='play';for(let i=0;i<2000&&!densityShots.length;i++){inputFrame=NO_INPUT;update();}
   const hash=()=>ArcadeReplay.hashState(simState());let t=time,token=feedbackPause(),h=hash();
   for(let i=0;i<30;i++)storyFrame(performance.now()+i*17);
   out.barrage={token,paused:mode==='paused',still:time===t&&hash()===h,ducked:ArcadeAudio.music.ducked,overlay:overlay.hidden,cue:ui.cue.textContent.startsWith('MISSILE BARRAGE')};
   feedbackResume(token);out.barrage.resumed=mode==='play'&&!ArcadeAudio.music.ducked&&densityShots.length>0;
   godMode=false;begin(0,false,2,777);player.hp=1;player.inv=0;mode='play';for(let i=0;i<4000&&mode==='play';i++){inputFrame=NO_INPUT;update();}
   h=hash();token=feedbackPause();feedbackResume(token);
   out.lost={token,mode,phase:boss.phase,same:hash()===h,full:document.getElementById('restart-full').hidden};
   retryCurrentPhase();out.lost.retry={phase:boss.phase,checkpoint:phaseCheckpointRun};
   let reports=0;const real=ArcadeHub.reportHubClear;ArcadeHub.reportHubClear=()=>{reports++;};
   time=1500;clearLevel();token=feedbackPause();feedbackResume(token);ArcadeHub.reportHubClear=real;
   out.clear={token,mode,reports,text:ui.description.textContent.split('\n')[1]};mode='paused';return out;});
  check('feedback window mid-barrage pauses without a tick, ducks the music, and resumes',()=>assert.deepEqual(fb.barrage,{token:'play',paused:true,still:true,ducked:true,overlay:true,cue:true,resumed:true}));
  check('feedback window on the knockout screen keeps the screen and the phase-2 retry',()=>assert.deepEqual(fb.lost,{token:'lost',mode:'lost',phase:2,same:true,full:false,retry:{phase:2,checkpoint:true}}));
  check('feedback window on the clear screen reports nothing again',()=>{assert.equal(fb.clear.token,'clear');assert.equal(fb.clear.mode,'clear');assert.equal(fb.clear.reports,1);assert.match(fb.clear.text,/^Rank C/);});
  const red=await page.evaluate(()=>({forge:moveLabel('forgePress'),portal:moveLabel('portalRing')}));
  check('Redkev signature cues say what to do',()=>{assert.match(red.forge,/JUMP THE BALL/);assert.match(red.portal,/FROM BEHIND: CROUCH/);});
  assert.deepEqual(errors,[]);await page.close();
 }
 { // Redkev: Portal Ring's first shot comes from behind, so its lane is marked during the tell.
  const {page,errors}=await openStory(browser,13);
  const mark=await page.evaluate(()=>{godMode=true;begin(levelIndex,false,2,777);mode='paused';Object.assign(boss,{move:'portalRing',age:4,tell:32});
   const y=FLOOR+SIGNATURE_PATTERNS.portalRing[0][2],pixel=()=>[...ctx.getImageData(22,y,1,1).data];time=3;render();const lit=pixel();boss.move='quake';render();const plain=pixel();return{lit,plain};});
  check('Portal Ring marks the left edge during its tell',()=>{assert.notDeepEqual(mark.lit,mark.plain);assert.ok(mark.lit[0]>200&&mark.lit[1]>150);});
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
