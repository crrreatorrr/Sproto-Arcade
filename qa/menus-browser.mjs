#!/usr/bin/env node
// Full-window layout and the shared menu options (menus.js, controls.js) on both pages, in real
// Chromium over a local HTTP server, plus legacy.html from file://. For 1920×1080 and 1280×720 it
// visits every menu screen and one in-game screen, saves a screenshot of each, and checks: no page
// scroll, the 16:9 game screen fills the window (letterboxed), each menu shows Main menu (not on
// the main menu itself), Hub, Controller settings and Full screen, and the menu fits. Then: a
// keyboard remap made in controller settings reaches the game, a controller remap and B/Back work
// with a stubbed pad, Esc closes the panel without resuming, Main menu and Hub confirm mid-run,
// and the Full screen option toggles document.fullscreenElement from the click. 1366×768 and
// 900×560 are checked for page scroll. Not part of qa/run-all.mjs (browser checks are separate).
//   node qa/menus-browser.mjs [repo] [screenshot-dir]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const playwright=(()=>{try{return require('playwright');}catch{return createRequire('/opt/node-tools/node_modules/')('playwright');}})();
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const shots=process.argv[3]?path.resolve(process.argv[3]):null;
if(shots)fs.mkdirSync(shots,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));
 if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(file).pipe(res);
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
// A fake controller: window.__pad(['A']) holds buttons, [] releases, null unplugs.
const PAD=`(()=>{const N={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,VIEW:8,MENU:9,L3:10,R3:11,UP:12,DOWN:13,LEFT:14,RIGHT:15};let pad=null;
 window.__pad=(down)=>{if(down===null){pad=null;return;}const buttons=Array.from({length:17},()=>({pressed:false,value:0}));for(const n of down)buttons[N[n]]={pressed:true,value:1};
  pad={index:0,id:'QA pad (STANDARD GAMEPAD)',mapping:'standard',connected:true,timestamp:performance.now(),buttons,axes:[0,0,0,0]};};
 navigator.getGamepads=()=>[pad,null,null,null];})()`;
const frames=(page,n=4)=>page.evaluate(n=>new Promise(ok=>{let i=0;const f=()=>++i>=n?ok():requestAnimationFrame(f);requestAnimationFrame(f);}),n);
const padPress=async(page,down)=>{await page.evaluate(d=>window.__pad(d),down);await frames(page);};
const padTap=async(page,name)=>{await padPress(page,[name]);await padPress(page,[]);};
const browser=await playwright.chromium.launch();
const results={screens:[],cases:[]};
const pass=name=>results.cases.push(name);

// Layout facts for the current screen: page scroll, how the 16:9 screen sits in the window, and
// which menu options the visible menu offers.
function facts(page,menuSelector){
 return page.evaluate(sel=>{
  const se=document.scrollingElement,s=document.querySelector('.screen').getBoundingClientRect(),W=innerWidth,H=innerHeight;
  const panel=[...document.querySelectorAll('.menu-panel')].find(p=>!p.hidden);
  const menu=document.querySelector(sel);
  const opts=menu&&!menu.hidden?[...menu.querySelectorAll('.menu-options [data-menu]')].filter(b=>b.getClientRects().length).map(b=>b.textContent):[];
  const box=panel?panel.querySelector('.menu-panel-card'):menu&&!menu.hidden?menu:null;
  return {scroll:{h:se.scrollHeight,w:se.scrollWidth,H,W},screen:{x:s.x,y:s.y,w:s.width,h:s.height},
   options:opts,menuOverflow:box?(panel?panel.scrollHeight>panel.clientHeight+1:menu.scrollHeight>menu.clientHeight+1):null,
   fullscreen:Boolean(document.fullscreenElement)};
 },menuSelector);
}
function checkLayout(f,label){
 assert.ok(f.scroll.h<=f.scroll.H&&f.scroll.w<=f.scroll.W,`${label}: no page scroll ${JSON.stringify(f.scroll)}`);
 const {x,y,w,h}=f.screen;
 assert.ok(Math.abs(w/h-16/9)<0.01,`${label}: 16:9 screen ${w}×${h}`);
 assert.ok(Math.abs(w-f.scroll.W)<=1||Math.abs(h-f.scroll.H)<=1,`${label}: screen fills the window on one axis ${w}×${h} in ${f.scroll.W}×${f.scroll.H}`);
 assert.ok(x>=-0.5&&y>=-0.5&&x+w<=f.scroll.W+0.5&&y+h<=f.scroll.H+0.5,`${label}: screen inside the window`);
 assert.ok(Math.abs(x-(f.scroll.W-w-x))<=1&&Math.abs(y-(f.scroll.H-h-y))<=1,`${label}: screen centred`);
}
const STANDARD=['Hub','Controller settings','Full screen: Off'];
async function screenAt(page,game,size,name,menuSelector,{main,inGame=false,fits=true}={}){
 await frames(page,3);
 const f=await facts(page,menuSelector);
 checkLayout(f,`${game} ${size} ${name}`);
 if(!inGame){
  const expected=(main?['Main menu']:[]).concat(STANDARD.map(t=>t==='Full screen: Off'&&f.fullscreen?'Full screen: On':t));
  assert.deepEqual(f.options,expected,`${game} ${size} ${name}: menu options`);
  if(fits)assert.equal(f.menuOverflow,false,`${game} ${size} ${name}: the menu fits without scrolling`);
 }else assert.deepEqual(f.options,[],`${game} ${size} ${name}: no menu over play`);
 let file=null;
 if(shots){file=path.join(shots,`${game}-${size}-${name}.png`);await page.screenshot({path:file});}
 results.screens.push({game,size,name,options:f.options,screen:f.screen,file});
}
async function openStory(size,query='?unlockAll=1',{coach=true,pad=false}={}){
 const [w,h]=size.split('x').map(Number);
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 if(coach)await page.addInitScript(()=>{try{localStorage.setItem('sproto-arcade-coach-v1','1');}catch{}});
 if(pad)await page.addInitScript(PAD);
 await page.goto(origin+'/legacy.html'+query);
 await page.waitForFunction(()=>{const s=document.getElementById('start');return s&&!s.disabled&&s.textContent!=='Loading…';},null,{timeout:180000});
 return {page,errors};
}
async function openTrials(size,{pad=false}={}){
 const [w,h]=size.split('x').map(Number);
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 if(pad)await page.addInitScript(PAD);
 await page.goto(origin+'/index.html');
 await page.waitForFunction(()=>window.ArcadeApp&&document.getElementById('status').textContent.includes('registered'),null,{timeout:180000});
 return {page,errors};
}
const storyStart=async page=>{await page.click('#start');await page.waitForFunction(()=>mode==='play'||mode==='coach',null,{timeout:180000});};
const trialsStart=async page=>{await page.click('#resume');await page.waitForFunction(()=>ArcadeApp.world&&document.getElementById('curtain').hidden,null,{timeout:180000});};

try{
 for(const size of ['1920x1080','1280x720']){
  { // Story mode: every overlay screen.
   const {page,errors}=await openStory(size,'?unlockAll=1',{coach:false});
   await screenAt(page,'story',size,'title','.overlay',{main:false});
   await storyStart(page);
   assert.equal(await page.evaluate(()=>mode),'coach');
   await screenAt(page,'story',size,'coach','.overlay',{main:true});
   await page.click('#start');await page.waitForFunction(()=>mode==='play',null,{timeout:180000});await page.waitForTimeout(600);
   await screenAt(page,'story',size,'in-game','.overlay',{inGame:true});
   await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>mode),'paused');
   await screenAt(page,'story',size,'paused','.overlay',{main:true});
   await page.click('.overlay [data-menu="controls"]');
   await screenAt(page,'story',size,'controller-settings','.overlay',{main:true});
   await page.click('#controls-back');
   await page.click('.overlay [data-menu="main"]');
   assert.equal(await page.evaluate(()=>!document.getElementById('menu-confirm').hidden),true,'Main menu mid-run asks first');
   await screenAt(page,'story',size,'confirm-leave','.overlay',{main:true});
   await page.click('#menu-confirm-no');
   assert.equal(await page.evaluate(()=>mode),'paused','Stay keeps the run');
   await page.evaluate(()=>setOverlay('lost','Knockout','Down for the count!',boss.name+' wins this round.','Rematch boss'));
   await screenAt(page,'story',size,'knockout','.overlay',{main:true});
   await page.evaluate(()=>{mode='play';time=1500;clearLevel();});
   assert.equal(await page.evaluate(()=>mode),'clear');
   await screenAt(page,'story',size,'level-clear','.overlay',{main:true});
   await page.evaluate(()=>setOverlay('won','Campaign clear','That’s all, Sproto!','The last giant is down.','Play again'));
   await screenAt(page,'story',size,'campaign-clear','.overlay',{main:true});
   await page.click('.overlay [data-menu="main"]');
   const title=await page.evaluate(()=>({mode,hud:document.querySelector('.hud').hidden,boss:document.getElementById('boss').hidden,dataMode:document.querySelector('.overlay').dataset.mode,select:document.getElementById('sproto-select').hidden}));
   assert.deepEqual(title,{mode:'title',hud:true,boss:true,dataMode:'title',select:false},'Main menu from a results screen goes straight to the title');
   await screenAt(page,'story',size,'title-again','.overlay',{main:false});
   await page.waitForFunction(()=>!document.getElementById('start').disabled&&document.getElementById('start').textContent==='Start level',null,{timeout:180000});
   await page.click('#start');await page.waitForFunction(()=>mode==='play',null,{timeout:180000});
   pass(`story ${size}: every screen, and a new run starts after Main menu`);
   assert.deepEqual(errors,[]);await page.close();
  }
  { // Machine Trials: every curtain.
   const {page,errors}=await openTrials(size);
   await screenAt(page,'trials',size,'main-menu','#curtain',{main:false});
   await trialsStart(page);await page.waitForTimeout(500);
   await screenAt(page,'trials',size,'in-game','#curtain',{inGame:true});
   await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>ArcadeApp.paused),true);
   await screenAt(page,'trials',size,'paused','#curtain',{main:true});
   await page.click('#curtain [data-menu="controls"]');
   await screenAt(page,'trials',size,'controller-settings','#curtain',{main:true});
   await page.click('#controls-back');
   await page.click('#curtain [data-menu="main"]');
   await screenAt(page,'trials',size,'confirm-leave','#curtain',{main:true});
   await page.click('#menu-confirm-no');
   await page.click('#resume');await frames(page,3);
   await page.evaluate(()=>ArcadeApp.world.lose('qa-explicit-loss'));await frames(page,3);
   await screenAt(page,'trials',size,'knockout','#curtain',{main:true});
   await page.click('#resume');await frames(page,3);
   await page.evaluate(()=>{ArcadeApp.world.tick=600;ArcadeApp.world.clear();});await frames(page,3);
   await screenAt(page,'trials',size,'clear','#curtain',{main:true});
   await page.click('#curtain [data-menu="main"]');
   assert.deepEqual(await page.evaluate(()=>({world:ArcadeApp.world,mode:document.getElementById('curtain').dataset.mode,button:document.getElementById('resume').textContent})),{world:null,mode:'menu',button:'Enter encounter'},'Main menu from results returns to the setup curtain');
   await trialsStart(page);
   pass(`trials ${size}: every screen, and a new run starts after Main menu`);
   assert.deepEqual(errors,[]);await page.close();
  }
 }

 { // Story: keyboard remap in controller settings reaches the game; Esc closes the panel only.
  const {page,errors}=await openStory('1280x720','?unlockAll=1&level=2');
  await page.click('.overlay [data-menu="controls"]');
  await page.click('#controls-panel button[data-action="jump"][data-kind="key"][data-slot="0"]');
  assert.match(await page.textContent('#controls-panel button[data-action="jump"][data-kind="key"][data-slot="0"]'),/Press a key/);
  await page.keyboard.press('KeyN');
  assert.match(await page.textContent('#controls-status'),/N twice sends feedback/,'N is refused');
  await page.keyboard.press('KeyJ');
  assert.equal(await page.textContent('#controls-panel button[data-action="jump"][data-kind="key"][data-slot="0"]'),'J');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('sproto-arcade-controls-v1:story')).keys.jump);
  assert.deepEqual(saved,['KeyJ',null],'saved under the story key');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.getElementById('controls-panel').hidden),true,'Esc closes the panel');
  assert.equal(await page.evaluate(()=>mode),'title','and does nothing else');
  await storyStart(page);await page.waitForTimeout(300);
  assert.match(await page.evaluate(()=>coachText()),/Jump: J,/,'game text names the new key');
  const before=await page.evaluate(()=>({y:player.y,grounded:player.y>=FLOOR-1}));
  await page.keyboard.down('KeyJ');
  const held=await page.evaluate(()=>keys.has('Space'));
  await page.waitForTimeout(250);
  const after=await page.evaluate(()=>player.y);
  await page.keyboard.up('KeyJ');await frames(page,2);
  const released=await page.evaluate(()=>!keys.has('Space'));
  assert.ok(held&&released,'J holds the game\'s Space key while down');
  assert.ok(before.grounded&&after<before.y-20,`J jumps (${before.y} -> ${after})`);
  await page.keyboard.down('Space');const spaceIgnored=await page.evaluate(()=>!keys.has('Space'));await page.keyboard.up('Space');
  assert.ok(spaceIgnored,'Space no longer jumps');
  await page.keyboard.press('Escape');
  await page.click('.overlay [data-menu="controls"]');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>mode),'paused','Esc on the panel over Pause does not resume the game');
  await page.click('.overlay [data-menu="controls"]');await page.click('#controls-reset');
  assert.equal(await page.evaluate(()=>ArcadeControls.allDefault()),true);await page.click('#controls-back');
  pass('story: keyboard remap applies in play; Space is freed; Esc only closes the panel');
  // Hub: offline it goes to the hub page the game knows; mid-run it asks first.
  await page.evaluate(()=>{window.__nav=[];ArcadeMenus.navigate=u=>window.__nav.push(u);});
  await page.click('.overlay [data-menu="hub"]');
  assert.equal(await page.evaluate(()=>window.__nav.length),0,'mid-run Hub asks first');
  await page.click('#menu-confirm-yes');
  assert.deepEqual(await page.evaluate(()=>window.__nav),['/hub/']);
  // Hub with a live session exits through hub-link.js.
  await page.evaluate(()=>{window.__exit=0;ArcadeHub.connected=()=>true;ArcadeHub.exit=()=>window.__exit++;setOverlay('clear','Level clear','x','y','Next level');});
  await page.click('.overlay [data-menu="hub"]');
  assert.equal(await page.evaluate(()=>window.__exit),1,'a hub session exits through the SDK, no confirm on a clear screen');
  pass('story: Hub confirms mid-run, navigates offline, exits through the SDK online');
  // Full screen from the click.
  await page.click('.overlay [data-menu="fullscreen"]');
  await page.waitForFunction(()=>document.fullscreenElement||ArcadeMenus.fullscreenRequests>0);await page.waitForTimeout(300);
  const fs1=await page.evaluate(()=>({on:Boolean(document.fullscreenElement),label:document.querySelector('.overlay [data-menu="fullscreen"]').textContent,requests:ArcadeMenus.fullscreenRequests}));
  results.fullscreen={story:fs1};
  if(fs1.on){
   assert.equal(fs1.label,'Full screen: On');
   await page.click('.overlay [data-menu="fullscreen"]');await page.waitForFunction(()=>!document.fullscreenElement);
   assert.equal(await page.evaluate(()=>document.querySelector('.overlay [data-menu="fullscreen"]').textContent),'Full screen: Off');
   // Esc while full screen on a menu only leaves full screen.
   await page.evaluate(()=>setOverlay('paused','Intermission','Paused','x','Resume'));
   await page.click('.overlay [data-menu="fullscreen"]');await page.waitForFunction(()=>document.fullscreenElement);
   await page.keyboard.press('Escape');await page.waitForTimeout(300);
   results.fullscreen.escOnMenu={mode:await page.evaluate(()=>mode),stillFullscreen:await page.evaluate(()=>Boolean(document.fullscreenElement))};
   assert.equal(results.fullscreen.escOnMenu.mode,'paused','Esc in full screen does not also resume');
   await page.evaluate(()=>document.fullscreenElement&&document.exitFullscreen());
  }else assert.equal(fs1.requests,1,'the request is made from the click');
  pass('story: Full screen option toggles document.fullscreenElement'+(fs1.on?'':' (request made; headless refused)'));
  assert.deepEqual(errors,[]);await page.close();
 }

 { // Machine Trials: dash remapped in controller settings dashes in play; the quick remap button shows it.
  const {page,errors}=await openTrials('1280x720');
  await page.click('#curtain [data-menu="controls"]');
  await page.click('#controls-panel button[data-action="dash"][data-kind="key"][data-slot="0"]');
  await page.keyboard.press('KeyQ');
  assert.equal(await page.textContent('#controls-panel button[data-action="dash"][data-kind="key"][data-slot="0"]'),'Q');
  await page.click('#controls-panel button[data-action="dash"][data-kind="key"][data-slot="1"]');
  await page.keyboard.press('Backspace');
  await page.click('#controls-panel button[data-action="shield"][data-kind="key"][data-slot="0"]');
  await page.keyboard.press('KeyF');
  assert.match(await page.textContent('#controls-status'),/Swapped: Pickup power now uses X/);
  await page.click('#controls-back');
  assert.equal(await page.textContent('#dash-key'),'Q · Dash (remap)');
  await trialsStart(page);await frames(page,4);
  await page.keyboard.press('ShiftLeft');await frames(page,3);
  assert.equal(await page.evaluate(()=>ArcadeApp.world.player.dashWait),0,'Shift no longer dashes');
  await page.keyboard.press('KeyQ');await frames(page,3);
  assert.ok(await page.evaluate(()=>ArcadeApp.world.player.dashWait>0),'Q dashes');
  await page.keyboard.press('KeyF');await frames(page,3);
  assert.ok(await page.evaluate(()=>ArcadeApp.world.player.shieldWait>0),'F now shields');
  const hud=await page.evaluate(()=>{const seen=[],c=document.getElementById('arena').getContext('2d'),f=c.fillText;return new Promise(ok=>{c.fillText=function(t,...a){seen.push(String(t));return f.call(this,t,...a);};requestAnimationFrame(()=>requestAnimationFrame(()=>{c.fillText=f;ok(seen.join('\n'));}));});});
  assert.match(hud,/F SHIELD/,'canvas HUD names the new shield key');
  assert.equal(await page.evaluate(()=>ArcadeApp.dashKey),'KeyQ');
  await page.keyboard.press('Escape');
  await page.click('#curtain [data-menu="controls"]');await page.click('#controls-reset');await page.click('#controls-back');
  assert.equal(await page.textContent('#dash-key'),'Shift · Dash (remap)');
  pass('trials: controller-settings remaps (dash, swap shield/power) apply in play and in the HUD');
  await page.evaluate(()=>{window.__nav=[];ArcadeMenus.navigate=u=>window.__nav.push(u);});
  await page.click('#curtain [data-menu="hub"]');await page.click('#menu-confirm-yes');await page.waitForFunction(()=>window.__nav.length===1);
  assert.deepEqual(await page.evaluate(()=>window.__nav),['/hub/']);
  pass('trials: Hub confirms mid-run and goes to the hub page');
  assert.deepEqual(errors,[]);await page.close();
 }

 { // Controller: open settings and rebind a button with the pad alone; B backs out.
  for(const [game,open] of [['story',()=>openStory('1280x720','?unlockAll=1',{pad:true})],['trials',()=>openTrials('1280x720',{pad:true})]]){
   const {page,errors}=await open();
   const host=game==='story'?'.overlay':'#curtain';
   await padPress(page,['A']);await padPress(page,[]); // latched on connect
   await page.evaluate(h=>document.querySelector(h+' [data-menu="controls"]').focus(),host);
   await padTap(page,'A');
   assert.equal(await page.evaluate(()=>Boolean(ArcadeMenus.activePanel())),true,`${game}: A opens controller settings`);
   const first=await page.evaluate(()=>document.activeElement.getAttribute('data-action')+':'+document.activeElement.dataset.kind);
   assert.equal(first,'left:key','focus starts on the first slot');
   await padTap(page,'DOWN');
   assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('data-action')),'right','D-pad moves through the slots');
   await padTap(page,'A');assert.ok(await page.evaluate(()=>ArcadeControls.capturing),'A starts a key capture');
   await padTap(page,'B');assert.equal(await page.evaluate(()=>ArcadeControls.capturing),null,'B cancels it');
   await page.evaluate(()=>document.querySelector('#controls-panel button[data-action="jump"][data-kind="pad"][data-slot="1"]').focus());
   await padTap(page,'A');await padTap(page,'L3');
   assert.deepEqual(await page.evaluate(()=>ArcadeControls.state.pad.jump),['A','L3'],`${game}: L3 bound to jump from the pad`);
   await padTap(page,'B');
   assert.equal(await page.evaluate(()=>ArcadeMenus.activePanel()),null,'B closes the panel');
   await page.evaluate(()=>ArcadeControls.reset());
   pass(`${game}: controller settings work from the pad alone`);
   assert.deepEqual(errors,[]);await page.close();
  }
 }

 { // Other window sizes: still no page scroll; menus scroll inside themselves when needed.
  for(const size of ['1366x768','900x560']){
   const {page,errors}=await openStory(size);
   await screenAt(page,'story',size,'title','.overlay',{main:false,fits:false});
   await storyStart(page);await page.keyboard.press('Escape');
   await screenAt(page,'story',size,'paused','.overlay',{main:true,fits:false});
   await page.click('.overlay [data-menu="controls"]');
   await screenAt(page,'story',size,'controller-settings','.overlay',{main:true,fits:false});
   assert.deepEqual(errors,[]);await page.close();
   const t=await openTrials(size);
   await screenAt(t.page,'trials',size,'main-menu','#curtain',{main:false,fits:false});
   assert.deepEqual(t.errors,[]);await t.page.close();
  }
  pass('1366×768 and 900×560: no page scroll');
 }

 { // legacy.html from file://.
  const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{try{localStorage.setItem('sproto-arcade-coach-v1','1');}catch{}});
  await page.goto(pathToFileURL(path.join(root,'legacy.html')).href);
  await page.waitForFunction(()=>{const s=document.getElementById('start');return s&&!s.disabled&&s.textContent!=='Loading…';},null,{timeout:180000});
  checkLayout(await facts(page,'.overlay'),'story file://');
  await page.click('.overlay [data-menu="controls"]');await page.click('#controls-back');
  await page.click('#start');await page.waitForFunction(()=>mode==='play',null,{timeout:180000});
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>mode),'paused');
  if(shots)await page.screenshot({path:path.join(shots,'story-file-paused.png')});
  assert.deepEqual(errors,[]);await page.close();
  pass('legacy.html from file://: loads, menus open, a level starts and pauses');
 }
 console.log(JSON.stringify({status:'passed',kind:'fullscreen-menus-browser',...results,limitations:['Headless Chromium; a real controller, a real full-screen display and human play are not exercised.']},null,2));
}catch(error){
 console.log(JSON.stringify({status:'failed',kind:'fullscreen-menus-browser',passed:results.cases,error:String(error&&error.stack||error)},null,2));process.exitCode=1;
}finally{await browser.close();server.close();}
