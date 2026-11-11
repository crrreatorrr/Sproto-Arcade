#!/usr/bin/env node
// Controller smoke (gamepad.js) in real Chromium over a local HTTP server, with a stubbed
// navigator.getGamepads. Checks for both pages: the press held when the pad appears is latched,
// A starts a run, the A that started it does not jump, gameplay buttons send the keyboard's own
// key codes, Start pauses, B resumes, D-pad moves menu focus, and keyboard input still works.
// Also the keyboard menu keys (arrows/WASD move focus, Enter confirms) and the prompt swaps.
// Not part of qa/run-all.mjs (browser checks are separate). A real controller still needs a human.
//   node qa/gamepad-browser.mjs [root]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const TYPES={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
// window.__pad(names, axes) sets the fake pad; null unplugs it. Every key event is logged.
const STUB=`(()=>{const NAMES={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,VIEW:8,MENU:9,UP:12,DOWN:13,LEFT:14,RIGHT:15};
  let pad=null;window.__keys=[];
  for(const t of ['keydown','keyup'])window.addEventListener(t,e=>window.__keys.push((e.isTrusted?'kb:':'pad:')+t+':'+e.code),true);
  window.__pad=(down,axes)=>{if(down===null){pad=null;return;}const buttons=Array.from({length:17},()=>({pressed:false,value:0}));
    for(const n of down)buttons[NAMES[n]]={pressed:true,value:1};
    pad={index:0,id:'QA pad (STANDARD GAMEPAD)',mapping:'standard',connected:true,timestamp:performance.now(),buttons,axes:axes||[0,0,0,0]};};
  navigator.getGamepads=()=>[pad,null,null,null];
  const fill=CanvasRenderingContext2D.prototype.fillText;window.__text=[];
  CanvasRenderingContext2D.prototype.fillText=function(t,...a){window.__text.push(String(t));if(window.__text.length>400)window.__text.shift();return fill.call(this,t,...a);};})()`;
const frames=(page,n=4)=>page.evaluate(n=>new Promise(ok=>{let i=0;const f=()=>++i>=n?ok():requestAnimationFrame(f);requestAnimationFrame(f);}),n);
const press=async(page,down,axes)=>{await page.evaluate(([d,a])=>window.__pad(d,a),[down,axes]);await frames(page);};
const tap=async(page,name)=>{await press(page,[name]);await press(page,[]);};
const padKeys=page=>page.evaluate(()=>window.__keys.filter(k=>k.startsWith('pad:')));
const clearKeys=page=>page.evaluate(()=>{window.__keys.length=0;});
const focused=page=>page.evaluate(()=>document.activeElement?.id||document.activeElement?.tagName);
const browser=await chromium.launch();
const results={};
async function open(url,ready){
  const page=await browser.newPage();await page.addInitScript(()=>{try{localStorage.setItem('sproto-arcade-coach-v1','1');}catch{}}); /* first-run card already seen */const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(STUB);
  await page.goto(origin+url);
  await page.waitForFunction(ready,null,{timeout:180000});
  return {page,errors};
}
try{
  { // Story mode (legacy.html), the page the hub opens.
    const {page,errors}=await open('/legacy.html?unlockAll=1',()=>{const s=document.getElementById('start');return s&&!s.disabled&&s.textContent!=='Loading…';});
    // Keyboard menus before any pad: arrows/WASD move focus, Enter presses the focused button.
    await page.evaluate(()=>document.activeElement?.blur());
    await page.keyboard.press('ArrowDown');
    assert.equal(await focused(page),'start','with nothing focused, a direction key lands on Start');
    await page.keyboard.press('KeyW');
    assert.notEqual(await focused(page),'start','W moves focus up the title menu');
    await page.keyboard.press('KeyS');await page.keyboard.press('ArrowDown');
    assert.equal(await focused(page),'start','S / Down come back to Start');
    assert.equal(await page.evaluate(()=>mode),'title','menu keys do not start the game');
    // The A that confirmed the hub portal is still held when the pad first appears.
    await press(page,['A']);
    assert.equal(await page.evaluate(()=>mode),'title','held-at-connect A is latched');
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.input),'gamepad','prompts switch to the controller');
    assert.equal(await page.evaluate(()=>getComputedStyle(document.getElementById('pad-help')).display),'flex');
    await press(page,[]);
    // The first direction lands on Start when nothing has focus; the next moves off it
    // (up into the level select / portraits), then back down.
    await page.evaluate(()=>document.activeElement?.blur());
    await tap(page,'UP');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'start');
    await tap(page,'UP');
    const upFocus=await page.evaluate(()=>document.activeElement?.id||document.activeElement?.tagName);
    assert.notEqual(upFocus,'start','D-pad up moves focus');
    await tap(page,'DOWN');await tap(page,'DOWN');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'start');
    // A starts the run; keep A held through the start: it must not jump.
    await clearKeys(page);
    await press(page,['A']);
    await page.waitForFunction(()=>mode==='play',null,{timeout:180000});
    await frames(page,6);
    assert.deepEqual(await padKeys(page),[],'the A that started the run is not sent as Space');
    await press(page,[]);
    const weaponLabel=()=>page.evaluate(()=>getComputedStyle(document.querySelector('.missile-key b'),'::after').content);
    assert.equal(await weaponLabel(),'"Y"','weapons bar shows the controller button for C');
    await press(page,['A']);
    assert.deepEqual(await padKeys(page),['pad:keydown:Space'],'A is Space');
    await press(page,[]);
    for(const [button,code] of [['B','ShiftLeft'],['RT','ShiftLeft'],['X','KeyX'],['LT','KeyX'],['Y','KeyC'],['RB','KeyV'],['LEFT','ArrowLeft'],['DOWN','ArrowDown']]){
      await clearKeys(page);await press(page,[button]);await press(page,[]);
      assert.deepEqual(await padKeys(page),['pad:keydown:'+code,'pad:keyup:'+code],button+' sends '+code);
    }
    await clearKeys(page);await press(page,[],[1,0,0,0]);await press(page,[]);
    assert.deepEqual(await padKeys(page),['pad:keydown:ArrowRight','pad:keyup:ArrowRight'],'left stick moves right');
    await clearKeys(page);await press(page,[],[0,-1,0,0]);await press(page,[]);
    assert.deepEqual(await padKeys(page),[],'stick up does not jump on foot');
    // Holding right while pausing: the key is released on the screen change.
    await clearKeys(page);await press(page,['RIGHT']);await press(page,['RIGHT','MENU']);
    assert.equal(await page.evaluate(()=>mode),'paused','Start pauses');
    assert.ok((await padKeys(page)).includes('pad:keyup:ArrowRight'),'held keys are released when the pause menu opens');
    await press(page,[]);
    await tap(page,'B');
    assert.equal(await page.evaluate(()=>mode),'play','B resumes');
    await tap(page,'MENU');
    assert.equal(await page.evaluate(()=>mode),'paused');
    await tap(page,'MENU');
    assert.equal(await page.evaluate(()=>mode),'play','Start resumes');
    // Keyboard still works next to the pad.
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>mode),'paused','keyboard Escape still pauses');
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.input),'keyboard','prompts follow the keyboard again');
    assert.equal(await weaponLabel(),'none','weapons bar shows the keyboard letter again');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>mode),'play','Escape closes the pause menu');
    await page.keyboard.press('Escape');
    // Unplug and replug while holding A: latched again.
    await press(page,null);await press(page,['A']);
    assert.equal(await page.evaluate(()=>mode),'paused','replug with A held does not resume');
    assert.deepEqual(errors,[]);
    results.story='passed';
    await page.close();
  }
  { // Return to hub is reachable from the pause menu when a hub session is live.
    const {page,errors}=await open('/legacy.html?unlockAll=1',()=>{const s=document.getElementById('start');return s&&!s.disabled&&s.textContent!=='Loading…';});
    await page.evaluate(()=>{const b=document.getElementById('hub-return');b.hidden=false;document.getElementById('hub-bar').hidden=false;window.__hubExit=0;b.addEventListener('click',()=>window.__hubExit++);});
    await press(page,[]);
    await tap(page,'A');
    await page.waitForFunction(()=>mode==='play',null,{timeout:180000});
    await tap(page,'MENU');
    assert.equal(await page.evaluate(()=>mode),'paused');
    await tap(page,'DOWN');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'hub-return','D-pad down reaches Return to hub');
    await tap(page,'A');
    assert.equal(await page.evaluate(()=>window.__hubExit),1,'A on Return to hub clicks it');
    assert.deepEqual(errors,[]);
    results.storyHubReturn='passed';
    await page.close();
  }
  { // Keyboard Space confirms a focused menu button exactly once on both pages (Machine Trials
    // reserves Space for jumping, so gamepad.js presses the button itself).
    for(const [url,ready,button,started] of [
      ['/legacy.html?unlockAll=1',()=>{const s=document.getElementById('start');return s&&!s.disabled&&s.textContent!=='Loading…';},'start',()=>mode==='play'],
      ['/index.html',()=>window.ArcadeApp&&document.getElementById('status').textContent.includes('registered'),'resume',()=>Boolean(ArcadeApp.world)&&document.getElementById('curtain').hidden]]){
      const {page,errors}=await open(url,ready);
      await page.evaluate(id=>{window.__clicks=0;const b=document.getElementById(id);b.addEventListener('click',()=>window.__clicks++);b.focus();},button);
      await page.keyboard.press('Space');
      await page.waitForFunction(started,null,{timeout:180000});
      await frames(page,10);
      assert.equal(await page.evaluate(()=>window.__clicks),1,url+': Space presses the button once');
      assert.deepEqual(errors,[]);
      await page.close();
    }
    results.keyboardSpace='passed';
  }
  { // Machine Trials (index.html).
    const {page,errors}=await open('/index.html',()=>window.ArcadeApp&&document.getElementById('status').textContent.includes('registered'));
    // Keyboard menus: a direction lands on the main button, Right changes a select, Enter in a
    // select moves on to the main button, Down/S leave a select.
    await page.keyboard.press('ArrowDown');
    assert.equal(await focused(page),'resume','with nothing focused, a direction key lands on the main button');
    await page.evaluate(()=>document.getElementById('stage').focus());
    const stageBefore=await page.evaluate(()=>document.getElementById('stage').selectedIndex);
    await page.keyboard.press('KeyD');
    assert.equal(await page.evaluate(()=>document.getElementById('stage').selectedIndex),stageBefore+1,'D changes the selected encounter');
    await page.keyboard.press('KeyA');
    assert.equal(await page.evaluate(()=>document.getElementById('stage').selectedIndex),stageBefore,'A changes it back');
    await page.keyboard.press('Enter');
    assert.equal(await focused(page),'resume','Enter in a select moves on to the main button');
    await page.evaluate(()=>document.getElementById('seed').focus());
    await page.keyboard.press('ArrowUp');
    assert.equal(await page.evaluate(()=>document.getElementById('seed').value),'778','the seed field keeps its own arrow keys');
    await page.keyboard.press('ArrowDown');
    await page.evaluate(()=>document.activeElement?.blur());
    await press(page,[]);
    // Focus starts nowhere: a direction lands on the primary button, left/right change a select.
    await tap(page,'UP');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'resume');
    await tap(page,'UP');
    const setupFocus=await page.evaluate(()=>document.activeElement.tagName);
    assert.ok(['SELECT','INPUT','BUTTON','A'].includes(setupFocus),'D-pad up reaches the setup row');
    await page.evaluate(()=>document.getElementById('pilot').focus());
    const before=await page.evaluate(()=>document.getElementById('pilot').selectedIndex);
    await tap(page,'RIGHT');
    assert.equal(await page.evaluate(()=>document.getElementById('pilot').selectedIndex),before+1,'D-pad right changes the selected pilot');
    await page.evaluate(()=>document.getElementById('resume').focus());
    await tap(page,'A');
    await page.waitForFunction(()=>ArcadeApp.world&&document.getElementById('curtain').hidden,null,{timeout:180000});
    for(const [button,code] of [['A','Space'],['B','ShiftLeft'],['X','KeyX'],['Y','KeyC'],['RB','KeyV'],['LB','KeyF'],['VIEW','KeyE']]){
      await clearKeys(page);await press(page,[button]);await press(page,[]);
      assert.deepEqual(await padKeys(page),['pad:keydown:'+code,'pad:keyup:'+code],button+' sends '+code);
    }
    await frames(page,4);
    const hud=await page.evaluate(()=>window.__text.slice(-60).join('\n'));
    assert.ok(/X SHIELD .*\bY \S+ +RB /.test(hud),'canvas HUD names the controller buttons: '+hud.split('\n').find(t=>t.includes('SHIELD')));
    await tap(page,'MENU');
    assert.equal(await page.evaluate(()=>ArcadeApp.paused),true,'Start pauses');
    await tap(page,'B');
    assert.equal(await page.evaluate(()=>ArcadeApp.paused),false,'B resumes');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>ArcadeApp.paused),true,'keyboard Escape still pauses');
    await frames(page,2);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>ArcadeApp.paused),false,'Escape closes the pause screen');
    await frames(page,4);
    const kbHud=await page.evaluate(()=>window.__text.slice(-60).join('\n'));
    assert.ok(/X SHIELD .* C \S+ +V /.test(kbHud),'canvas HUD shows keyboard letters again');
    assert.deepEqual(errors,[]);
    results.trials='passed';
    await page.close();
  }
  console.log(JSON.stringify({status:'passed',kind:'gamepad-browser-smoke',results,limitations:['navigator.getGamepads is stubbed; a real controller and human play are not exercised.']},null,2));
}finally{
  await browser.close();server.close();
}
