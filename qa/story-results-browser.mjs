#!/usr/bin/env node
// Story-mode results, ranks, saved bests, level select, audio and hit feedback
// (docs/GAMEPLAY-IMPROVEMENT-PLAN.md, C1 to C4) in headless Chromium. Clears are staged by
// calling the game's own clearLevel() on a running level; nothing here is an earned clear, and
// no one listened to the audio: the checks are that it starts, switches, ducks and mutes.
//   node qa/story-results-browser.mjs [repo]
import assert from 'node:assert/strict';
import {serve,playwright,openStory} from './story-browser.mjs';
const server=await serve(),browser=await playwright().chromium.launch(),cases=[];
const check=(name,fn)=>{fn();cases.push(name);};
const oldSave={v:1,cleared:[0,12],unlocked:[],updatedAt:5};
try{
 const {page,errors}=await openStory(browser,1,{start:false,init:`try{if(!localStorage.getItem('sproto-arcade-story-v1'))localStorage.setItem('sproto-arcade-story-v1',${JSON.stringify(JSON.stringify(oldSave))});}catch{}`});
 const title=await page.evaluate(()=>({audio:typeof audio,count:document.getElementById('cleared-count').textContent,options:[...levelSelect.options].map(o=>o.textContent),controls:document.getElementById('audio-controls').hidden}));
 check('a save from before ranks loads, and the title counts cleared levels',()=>{assert.equal(title.count,'2 of 13 cleared');assert.match(title.options[0],/^01 · Tidebreak Marina  —  cleared$/);assert.match(title.options[2],/^03 · Last Light Bar$/);});
 check('no audio context before the first click',()=>{assert.equal(title.audio,'undefined');assert.ok(title.controls);});
 await page.click('#start');await page.waitForFunction(()=>mode==='play',null,{timeout:60000});
 const started=await page.evaluate(()=>({state:audio&&audio.state,playing:ArcadeAudio.music.playing,form:ArcadeAudio.music.form,ducked:ArcadeAudio.music.ducked,voices:ArcadeAudio.voices.length,tracks:ArcadeAudio.tracks.length}));
 check('music starts with the level; a dozen effect voices and four tracks exist',()=>{assert.equal(started.state,'running');assert.equal(started.playing,'harbour');assert.equal(started.form,1);assert.equal(started.ducked,false);assert.ok(started.voices>=12);assert.equal(started.tracks,4);});
 const stage=(setup)=>page.evaluate(code=>{(0,eval)(code);const out={mode,text:ui.description.textContent,best:JSON.parse(JSON.stringify(ArcadeHub.state.save.best||{})),option:levelSelect.options[0].textContent,count:document.getElementById('cleared-count').textContent};return out;},setup);
 // Every sound() call site plays without error, through the effects bus.
 const sounds=await page.evaluate(()=>{let played=0;for(const key of [...ArcadeAudio.voices,'555:140']){const [f,e]=key.split(':').map(Number);sound(f,e,.1,.03);played++;}return played;});
 check('every effect voice and the fallback sweep play',()=>assert.ok(sounds>=13));
 let r=await stage("godMode=false;begin(0,false,1,777);mode='paused';boss.phase=2;refreshHud();window.__form=ArcadeAudio.music.form;boss.phase=1;");
 check('phase 2 switches the music form',()=>assert.equal(r.mode,'paused'));
 assert.equal(await page.evaluate(()=>window.__form),2);
 const par=await page.evaluate(()=>STORY_PAR_TICKS[1]);
 const aTicks=par-120,bTicks=par-240,sTicks=par-360;
 const [aTime,bTime,sTime,parTime]=await page.evaluate(ticks=>ticks.map(fmtTicks),[aTicks,bTicks,sTicks,par]);
 const aBest={0:{ticks:aTicks,hits:1,rank:'A'}};
 r=await stage(`godMode=false;begin(0,false,1,777);time=${aTicks};runStats.hits=1;player.hp=4;runStats.hp=4;clearLevel();`);
 check('a full clear shows time, hits, hearts and rank, and writes a best',()=>{assert.equal(r.mode,'clear');assert.ok(r.text.startsWith(`Time ${aTime} (par ${parTime})  ·  Hits 1  ·  Hearts 4/5\nRank A  ·  New best!\nNext up: `));assert.deepEqual(r.best,aBest);});
 check('level select shows the rank and best time',()=>{assert.equal(r.option,`01 · Tidebreak Marina  —  A  ${aTime}`);assert.equal(r.count,'2 of 13 cleared');});
 r=await stage(`begin(0,false,1,777);time=${bTicks};runStats.hits=4;clearLevel();`);
 check('a faster run with a worse rank leaves the best',()=>{assert.ok(r.text.startsWith(`Time ${bTime} `));assert.ok(r.text.includes(`\nRank B  ·  Best: A in ${aTime}\n`));assert.deepEqual(r.best,aBest);});
 r=await stage("begin(0,false,2,777);time=1500;clearLevel();");
 check('a checkpoint clear is rank C and leaves the best alone',()=>{assert.match(r.text,/^Phase 2 from the checkpoint: 0:25\.0  ·  Hits 0  ·  Hearts 5\/5\nRank C  ·  Checkpoint clear\. Your full-run best is unchanged\.\nNext up/);assert.deepEqual(r.best,aBest);});
 r=await stage("godMode=true;begin(0,false,1,777);time=3000;clearLevel();godMode=false;");
 check('a god-mode clear is not ranked',()=>{assert.match(r.text,/^Time 0:50\.0  ·  God mode: no rank and no best time\n/);assert.deepEqual(r.best,aBest);});
 r=await stage(`begin(0,false,1,777);time=${sTicks};runStats.hits=0;clearLevel();`);
 check('a hitless run under par is an S and replaces the A',()=>{assert.match(r.text,/\nRank S  ·  New best!\n/);assert.deepEqual(r.best,{0:{ticks:sTicks,hits:0,rank:'S'}});});
 // What each clear paid, as the hub-connected player sees it (reportHubClear's rules).
 const paid=await page.evaluate(()=>{const real={c:ArcadeHub.connected,r:ArcadeHub.reportHubClear};ArcadeHub.connected=()=>true;ArcadeHub.reportHubClear=()=>{};const line=()=>ui.description.textContent.split('\n').find(l=>/Tickets/.test(l))||'';const out={};
  godMode=false;begin(0,false,1,777);time=9100;clearLevel();out.full=line();
  begin(0,false,2,777);time=1500;clearLevel();out.checkpoint=line();
  godMode=true;begin(0,false,1,777);time=3000;clearLevel();godMode=false;out.god=line();
  begin(12,false,1,777);time=9100;clearLevel();out.redkev=line();out.redkevRank=/Rank [SAB]/.test(ui.description.textContent);
  ArcadeHub.connected=real.c;ArcadeHub.reportHubClear=real.r;begin(0,false,1,777);time=9100;clearLevel();out.offline=line();return out;});
 check('every clear says whether it paid, and why not',()=>assert.deepEqual(paid,{full:"+20 Tickets for this clear, within the hub's caps.",checkpoint:'No Tickets for this clear: it came after a phase-2 checkpoint retry, and only a full run pays.',god:'No Tickets for this clear: god mode was used.',redkev:"No Tickets for this clear: the hub does not pay for Redkev's Marina yet.",redkevRank:true,offline:''}));
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('sproto-arcade-story-v1')));
 check('the best is in the saved progress',()=>{assert.deepEqual(stored.best[0],{ticks:sTicks,hits:0,rank:'S'});assert.deepEqual(stored.cleared,[0,12]);assert.deepEqual(Object.keys(stored.best),['0','12']);});
 // Hits are counted from lost hearts while the level runs.
 const hits=await page.evaluate(()=>{godMode=false;begin(0,false,1,777);mode='play';for(let i=0;i<3000&&mode==='play'&&player.hp>2;i++){inputFrame=NO_INPUT;update();}const out={hits:runStats.hits,hp:player.hp};mode='paused';return out;});
 check('hits follow lost hearts',()=>{assert.ok(hits.hits>=1);assert.equal(hits.hits,5-hits.hp);});
 // Feedback overlays change pixels and never the simulation.
 const fx=await page.evaluate(()=>{godMode=true;begin(0,false,1,777);mode='paused';const hash=()=>ArcadeReplay.hashState(simState());const before=hash(),keep={hp:player.hp,inv:player.inv};
  const pixel=()=>[...ctx.getImageData(6,360,1,1).data];player.hp=5;player.inv=0;render();const calm=pixel();
  player.hp=1;render();const low=pixel();player.hp=5;player.inv=71;mode='play';render();const flash=pixel();mode='paused';player.inv=0;
  feedback.pops.push({x:640,y:300,at:time});render();const pop=[...ctx.getImageData(640,270,1,1).data];feedback.pops.length=0;render();const noPop=[...ctx.getImageData(640,270,1,1).data];Object.assign(player,keep);
  return{calm,low,flash,pop,noPop,same:before===hash()};});
 check('one-heart vignette, hit flash and weak-spot number draw; state hash unchanged',()=>{assert.ok(fx.low[0]>fx.calm[0]+25);assert.ok(fx.flash.slice(0,3).every((v,i)=>v>fx.calm[i]));assert.notDeepEqual(fx.pop,fx.noPop);assert.ok(fx.same);});
 // Pause: ducked music, volume and mute, remembered after a reload.
 await page.evaluate(()=>{begin(0,false,1,777);});await page.keyboard.press('Escape');
 const paused=await page.evaluate(()=>({mode,ducked:ArcadeAudio.music.ducked,hidden:document.getElementById('audio-controls').hidden}));
 check('pause ducks the music and shows the sound controls',()=>{assert.equal(paused.mode,'paused');assert.ok(paused.ducked);assert.equal(paused.hidden,false);});
 await page.click('#volume-down');await page.click('#volume-down');await page.click('#mute');
 const set=await page.evaluate(()=>({volume:ArcadeAudio.volume,muted:ArcadeAudio.muted,label:document.getElementById('volume-level').textContent,button:document.getElementById('mute').textContent,stored:JSON.parse(localStorage.getItem('sproto-arcade-audio-v1'))}));
 check('volume and mute change and are stored',()=>{assert.ok(Math.abs(set.volume-.6)<1e-9);assert.equal(set.muted,true);assert.equal(set.label,'Muted');assert.equal(set.button,'Unmute');assert.deepEqual(set.stored,{volume:set.volume,muted:true});});
 await page.reload();await page.waitForFunction(()=>!document.getElementById('start').disabled,null,{timeout:120000});
 const again=await page.evaluate(()=>({volume:ArcadeAudio.volume,muted:ArcadeAudio.muted,option:levelSelect.options[0].textContent}));
 check('mute, volume and the best time persist across a reload',()=>{assert.ok(Math.abs(again.volume-.6)<1e-9);assert.equal(again.muted,true);assert.equal(again.option,`01 · Tidebreak Marina  —  S  ${sTime}`);});
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({kind:'story-results-audio-feedback',status:'passed',cases,limitations:['Clears are staged with clearLevel(); none is an earned clear.','Audio is checked for starting, switching, ducking and muting; nobody listened to it.','Headless Chromium only.']},null,2));
}catch(error){console.log(JSON.stringify({kind:'story-results-audio-feedback',status:'failed',passed:cases,error:String(error&&error.stack||error)},null,2));process.exitCode=1;}
finally{await browser.close();server.close();}
