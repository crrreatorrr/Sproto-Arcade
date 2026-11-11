#!/usr/bin/env node
// In-game feedback window (feedback-link.js + the vendored hub SDK's installFeedback) in real
// Chromium, on both pages. The real SDK bundle draws the window; only createHubSdk is swapped for a
// signed-in stub that records what would be sent. No real Nakama.
//  1. Story mode: N twice during play pauses without the Paused overlay, no clock moves, keys do
//     not reach the game, Escape resumes play; from the pause screen (button) and the title screen
//     the prior state survives; a sent note carries level, position, version and a screenshot.
//  2. Machine Trials: the same pause/resume, and N is refused as a dash key.
//  3. No hub session: N twice shows a message, nothing can be sent and the game runs on.
//   node qa/feedback-browser.mjs [root]
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
const sdkScript=/\/vendor\/hub-sdk\/hub-sdk\.iife\.js(?:\?[^#]*)?$/;
// Appended to the real bundle: installFeedback stays real, the session is a stub.
const SIGNED_IN=`;HubSDK=Object.assign({},HubSDK,{createHubSdk:function(){var sent=window.__feedbackSent=[];return {
  init:async function(){return {playerId:'p1',ranked:false,relics:[],effects:{},ticketsCapLeft:200,serverTime:0};},
  getSession:function(){return {token:'t',playerId:'p1',game:'sproto-arcade',ranked:false,expiresAt:Date.now()+1e6};},
  loadSave:async function(){return {data:null,updatedAt:0};},writeSave:async function(d){return {data:d,updatedAt:1};},
  getTicketBalance:async function(){return {balance:0};},reportEvent:async function(){return {};},earnTickets:async function(){return {balance:0};},exit:function(){},
  feedbackAccess:async function(){return {ok:true,username:'p1'};},
  submitFeedback:async function(input){sent.push(input);return {id:'ARCADE-0001'};}
};}});`;
const browser=await chromium.launch();
const results={};
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
async function newPage(signedIn){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  if(signedIn)await page.route(sdkScript,async route=>{const body=fs.readFileSync(path.join(root,'vendor/hub-sdk/hub-sdk.iife.js'),'utf8');await route.fulfill({contentType:'text/javascript',body:body+SIGNED_IN});});
  return {page,errors};
}
const isOpen=page=>page.evaluate(()=>window.ArcadeFeedback.isOpen());
async function doubleN(page){await page.keyboard.press('KeyN');await page.keyboard.press('KeyN');}
// Real key presses first. Software-rendered frames can take long enough that two awaited presses
// land more than the SDK's 400 ms apart; then the same two keydowns are dispatched back to back.
async function openWithKeys(page){
  const opened=()=>page.waitForFunction(()=>window.ArcadeFeedback.isOpen(),null,{timeout:6000}).then(()=>true,()=>false);
  await doubleN(page);
  if(await opened())return 'keys';
  await sleep(500);
  await page.evaluate(()=>{for(let i=0;i<2;i++)for(const type of ['keydown','keyup'])document.body.dispatchEvent(new KeyboardEvent(type,{code:'KeyN',key:'n',bubbles:true,cancelable:true}));});
  if(await opened())return 'dispatched';
  throw Error('N twice did not open the feedback window');
}
async function closeWithEscape(page){await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.ArcadeFeedback.isOpen(),null,{timeout:5000});}
/** Share of sampled pixels in a data-URL image that differ from its first pixel. */
const variety=(page,url)=>page.evaluate(async url=>{
  const image=new Image();image.src=url;await image.decode();
  const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const g=c.getContext('2d');g.drawImage(image,0,0);
  const d=g.getImageData(0,0,c.width,c.height).data;let differ=0,total=0;
  for(let i=0;i<d.length;i+=4*97){total++;if(Math.abs(d[i]-d[0])+Math.abs(d[i+1]-d[1])+Math.abs(d[i+2]-d[2])>24)differ++;}
  return {width:image.width,height:image.height,share:differ/total};
},url);
try{
  { // 1. Story mode, signed in.
    const {page,errors}=await newPage(true);
    await page.goto(origin+'/legacy.html');
    await page.waitForFunction(()=>!document.getElementById('start').disabled,null,{timeout:120000});
    assert.ok(await page.evaluate(()=>window.ArcadeFeedback.ready.then(Boolean)),'feedback installs once the hub link is up');
    const story=()=>page.evaluate(()=>({mode,time,overlayHidden:document.querySelector('.overlay').hidden,held:keys.size+pressed.size,powerTick:phasePowerupsState?.tick??null,
      shield:phasePowerupsState?.items.shieldUntil??null,x:player?.x,button:document.getElementById('feedback-open').getClientRects().length>0}));

    // Title screen: the window opens over it and leaves it as it was.
    assert.equal((await story()).button,false,'no feedback button on the title screen');
    await openWithKeys(page);
    assert.equal((await story()).mode,'title');
    await closeWithEscape(page);
    assert.equal((await story()).mode,'title','title screen survives the window');

    // Play.
    await page.click('#start');
    await page.waitForFunction(()=>mode==='play'&&time>90,null,{timeout:120000});
    await page.keyboard.down('KeyD');
    await openWithKeys(page);
    const frozen=await story();
    assert.equal(frozen.mode,'paused','play is paused');
    assert.equal(frozen.overlayHidden,true,'the Paused overlay stays out of the way');
    assert.equal(frozen.held,0,'held keys are cleared on open');
    await page.keyboard.up('KeyD');
    await page.keyboard.press('KeyA');await page.keyboard.down('Space');
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await sleep(500);
    const later=await story();
    assert.deepEqual({...later},{...frozen},'no clock, pickup timer or position moves, keys do not reach the game, blur changes nothing');
    await page.keyboard.up('Space');
    await closeWithEscape(page);
    assert.equal((await story()).mode,'play','Escape resumes play');
    await page.waitForFunction(t=>time>t+20,frozen.time,{timeout:5000});
    assert.equal(await page.evaluate(()=>document.querySelector('.overlay').hidden),true);

    // Pause screen: the button opens the window; closing it leaves the game paused.
    await page.keyboard.press('Escape');
    const paused=await story();
    assert.equal(paused.mode,'paused');assert.equal(paused.overlayHidden,false);assert.equal(paused.button,true,'Send feedback shows on the pause screen');
    await page.click('#feedback-open');
    await page.waitForFunction(()=>window.ArcadeFeedback.isOpen(),null,{timeout:5000});
    await page.keyboard.press('Enter');await page.keyboard.press('Space'); // Nothing chosen: not sent, and Resume underneath is not pressed.
    await closeWithEscape(page);
    const still=await story();
    assert.equal(still.mode,'paused','still paused after closing');assert.equal(still.overlayHidden,false);assert.equal(still.time,paused.time);
    await page.keyboard.press('Escape');
    assert.equal((await story()).mode,'play','the game\'s own Escape still resumes');

    // Send one note.
    await openWithKeys(page);
    await page.keyboard.press('Digit1');await page.keyboard.press('Enter');
    await page.waitForFunction(()=>window.__feedbackSent.length===1,null,{timeout:5000});
    await page.waitForFunction(()=>!window.ArcadeFeedback.isOpen()&&mode==='play',null,{timeout:5000});
    const sent=await page.evaluate(()=>window.__feedbackSent[0]);
    const meta=sent.meta;
    assert.equal(meta.level,'01 Tidebreak Marina');assert.equal(meta.mode,'story');
    assert.ok(Number.isFinite(meta.position.x)&&Number.isFinite(meta.position.y),'player position');
    assert.ok(meta.gameTime>1,'level time in seconds');
    assert.match(meta.version,/^story · sim [0-9a-f]{16} · game\.js [0-9a-f]{12}$/);
    assert.equal(meta.extra.levelId,1);assert.equal(meta.extra.campaignOrder,1);assert.equal(meta.extra.bossPhase,1);assert.equal(meta.extra.boss,'bront');
    assert.equal(typeof meta.player.hearts,'number');assert.equal(typeof meta.player.dashReady,'boolean');
    assert.ok(meta.breadcrumbs.some(b=>b.type==='level_start'),'level_start breadcrumb');
    assert.deepEqual(sent.categories.length,1);
    const shot=await variety(page,sent.image);
    assert.ok(shot.width>=640&&shot.share>.05,'the screenshot is not blank: '+JSON.stringify(shot));
    assert.deepEqual(errors,[]);
    results.story={version:meta.version,level:meta.level,position:meta.position,gameTime:meta.gameTime,player:meta.player,extra:meta.extra,breadcrumbs:meta.breadcrumbs.map(b=>b.type),screenshot:shot};
    await page.close();
  }
  { // 2. Machine Trials, signed in.
    const {page,errors}=await newPage(true);
    await page.goto(origin+'/index.html');
    await page.waitForFunction(()=>window.Arcade?.stages?.size>0&&window.ArcadeFeedback,null,{timeout:60000});
    assert.ok(await page.evaluate(()=>window.ArcadeFeedback.ready.then(Boolean)));
    const trials=()=>page.evaluate(()=>({paused:ArcadeApp.paused,state:ArcadeApp.world?.state,tick:ArcadeApp.world?.tick,elapsed:ArcadeApp.world?.phaseElapsed,x:ArcadeApp.world?.player.x,curtainHidden:document.getElementById('curtain').hidden,
      button:document.getElementById('feedback-open').getClientRects().length>0}));
    await page.click('#dash-key');await page.keyboard.press('KeyN');
    assert.match(await page.textContent('#dash-key'),/Reserved key/,'N cannot become the dash key');
    assert.equal(await page.evaluate(()=>ArcadeApp.dashKey),'ShiftLeft');
    await page.keyboard.press('KeyQ');
    assert.equal(await page.evaluate(()=>ArcadeApp.dashKey),'KeyQ');
    await page.click('#start');
    await page.waitForFunction(()=>ArcadeApp.world?.state==='playing'&&ArcadeApp.world.tick>60&&!ArcadeApp.paused,null,{timeout:60000});
    await page.keyboard.down('KeyD');
    await openWithKeys(page);
    const frozen=await trials();
    assert.equal(frozen.paused,true);assert.equal(frozen.curtainHidden,true,'no Paused curtain under the window');
    await page.keyboard.up('KeyD');await page.keyboard.press('KeyA');
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await sleep(400);
    assert.deepEqual(await trials(),frozen,'the simulation is stopped');
    await closeWithEscape(page);
    const resumed=await trials();
    assert.equal(resumed.paused,false,'Escape resumes the run');assert.equal(resumed.curtainHidden,true);
    await page.waitForFunction(t=>ArcadeApp.world.tick>t+20,frozen.tick,{timeout:5000});
    await page.keyboard.press('Escape');
    const paused=await trials();
    assert.equal(paused.paused,true);assert.equal(paused.curtainHidden,false);assert.equal(paused.button,true,'Send feedback shows on the Paused curtain');
    await page.click('#feedback-open');
    await page.waitForFunction(()=>window.ArcadeFeedback.isOpen(),null,{timeout:5000});
    await page.keyboard.press('Digit3');await page.keyboard.press('Enter');
    await page.waitForFunction(()=>window.__feedbackSent.length===1&&!window.ArcadeFeedback.isOpen(),null,{timeout:5000});
    const after=await trials();
    assert.equal(after.paused,true,'still paused');assert.equal(after.curtainHidden,false);assert.equal(after.tick,paused.tick);
    const sent=await page.evaluate(()=>window.__feedbackSent[0]),meta=sent.meta;
    assert.equal(meta.mode,'machine-trials');assert.match(meta.level,/^Trials 01 /);assert.match(meta.version,/^trials · rework\.js [0-9a-f]{12}$/);
    assert.ok(Number.isFinite(meta.position.x));assert.equal(meta.extra.bossPhase,1);assert.equal(meta.extra.paused,true);
    assert.ok(meta.breadcrumbs.some(b=>b.type==='level_start'));
    const shot=await variety(page,sent.image);
    assert.ok(shot.share>.05,'the screenshot is not blank: '+JSON.stringify(shot));
    assert.deepEqual(errors,[]);
    results.trials={version:meta.version,level:meta.level,position:meta.position,extra:meta.extra,breadcrumbs:meta.breadcrumbs.map(b=>b.type),screenshot:shot};
    await page.close();
  }
  for(const url of ['/legacy.html','/index.html']){ // 3. No hub session: the real SDK, a message, no pause.
    const {page,errors}=await newPage(false);
    await page.goto(origin+url);
    await page.waitForFunction(()=>window.ArcadeFeedback?.ready,null,{timeout:60000});
    assert.ok(await page.evaluate(()=>window.ArcadeFeedback.ready.then(Boolean)));
    assert.equal(await page.evaluate(()=>window.ArcadeFeedback.allowed),false,url+": guests may not send");
    await page.waitForFunction(()=>!document.getElementById('start').disabled,null,{timeout:120000});
    await page.click('#start');
    const playing=url==='/legacy.html'?()=>mode==='play'&&time>30:()=>ArcadeApp.world?.state==='playing'&&!ArcadeApp.paused&&ArcadeApp.world.tick>30;
    await page.waitForFunction(playing,null,{timeout:120000});
    // The SDK asks the hub who may send a few seconds after start. Once it knows there is no
    // session, N twice only shows a message; before that it opens the window, which cannot send.
    await sleep(4500);
    const answered=()=>page.waitForFunction(()=>window.ArcadeFeedback.isOpen()||Boolean(document.querySelector('[data-hub-feedback]')?.shadowRoot.querySelector('.toast')),null,{timeout:3000}).then(()=>true,()=>false);
    await doubleN(page);
    if(!await answered()){
      await page.evaluate(()=>{for(let i=0;i<2;i++)for(const type of ['keydown','keyup'])document.body.dispatchEvent(new KeyboardEvent(type,{code:'KeyN',key:'n',bubbles:true,cancelable:true}));});
      assert.ok(await answered(),url+': N twice answers with the window or a one-line message');
    }
    if(await isOpen(page))await closeWithEscape(page);
    await page.waitForFunction(playing,null,{timeout:5000});
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.getElementById('feedback-open').getClientRects().length),0,url+': no Send feedback button for guests');
    assert.deepEqual(errors,[]);
    await page.close();
  }
  results.offline='message only';
  console.log(JSON.stringify({kind:'feedback-browser',status:'passed',...results},null,2));
}finally{
  await browser.close();server.close();
}
