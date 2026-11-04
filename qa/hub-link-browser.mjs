#!/usr/bin/env node
// Story mode ↔ hub link (hub-link.js, story-progress.js, hub-ui.js) in real Chromium.
//  1. Offline: the real vendored SDK finds no ticket, the game plays, progress stays local.
//  2. Hub session: the SDK bundle is swapped for a recording stub. Checks the cloud-save merge,
//     Relic unlocks, the first-boss Relic report (god mode included), Tickets only outside god
//     mode, no second Relic report once owned, and Return to hub.
//  3. index.html forwards a hub ticket (#t=) to story mode.
// No real Nakama: the live wire format is covered by metaverse-hub's SDK and server tests.
//   node qa/hub-link-browser.mjs [root]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const TYPES={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const STUB=`var HubSdk={createHubSdk:function(){
  var calls=window.__hubCalls=[];var relics=['cones_tip'];var cloud={data:{v:1,cleared:[4],unlocked:['sproto831'],updatedAt:1},updatedAt:1};
  return {
    init:async function(g){calls.push(['init',g]);return {playerId:'p1',ranked:false,relics:relics.slice(),effects:{},ticketsCapLeft:200,serverTime:0};},
    getSession:function(){return {token:'t',playerId:'p1',game:'sproto-arcade',ranked:false,expiresAt:Date.now()+1e6};},
    loadSave:async function(){calls.push(['loadSave']);return cloud;},
    writeSave:async function(d){calls.push(['writeSave',JSON.parse(JSON.stringify(d))]);cloud={data:d,updatedAt:2};return cloud;},
    getTicketBalance:async function(){return {balance:40,sessionCapLeft:200,dailyCapLeft:1000,serverTime:0};},
    reportEvent:async function(e,d,k){calls.push(['reportEvent',e,d,k]);if(e==='arcade.boss_defeated'&&d.boss==='bront'&&relics.indexOf('breakwater_coin')<0){relics.push('breakwater_coin');return {granted:'breakwater_coin'};}return {};},
    earnTickets:async function(a,r,k){calls.push(['earnTickets',a,r,k]);return {balance:60,capped:false};},
    exit:function(r){calls.push(['exit',r]);}
  };}};`;
const browser=await chromium.launch();
const results={};
async function open(page){
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(origin+'/legacy.html');
  await page.waitForFunction(()=>!document.getElementById('start').disabled,null,{timeout:120000});
  await page.evaluate(()=>window.ArcadeHub.ready);
  return errors;
}
const locked=page=>page.evaluate(()=>[...document.querySelectorAll('#sproto-portraits button:disabled')].map(b=>b.dataset.fighter).sort());
// Clear a level the way play does: begin() then the game's own clearLevel().
const clear=(page,level,god)=>page.evaluate(([level,god])=>{godMode=god;begin(level);clearLevel();godMode=false;return window.ArcadeHub.state.save;},[level,god]);
try{
  { // 1. Offline.
    const page=await browser.newPage();
    const errors=await open(page);
    assert.equal(await page.evaluate(()=>window.ArcadeHub.state.status),'offline');
    assert.equal(await page.evaluate(()=>document.getElementById('hub-bar').hidden),true);
    assert.deepEqual(await locked(page),['morelight','sproto1668','sproto1815','sproto831']);
    assert.match(await page.getAttribute('[data-fighter="morelight"]','title'),/Clear Last Light Bar, or own/);
    const save=await clear(page,1,false);
    assert.deepEqual(save.cleared,[1]);
    assert.deepEqual(await locked(page),['sproto1668','sproto1815','sproto831']);
    assert.match(await page.textContent('#description'),/New Sproto: Morelight/);
    await page.reload();await page.waitForFunction(()=>!document.getElementById('start').disabled,null,{timeout:120000});
    assert.deepEqual(await locked(page),['sproto1668','sproto1815','sproto831'],'progress survives a reload');
    assert.deepEqual(errors,[]);
    results.offline='passed';
    await page.close();
  }
  { // 2. Hub session with the recording stub.
    const page=await browser.newPage();
    await page.route('**/vendor/hub-sdk/hub-sdk.iife.js',r=>r.fulfill({contentType:'text/javascript',body:STUB}));
    const errors=await open(page);
    await page.waitForFunction(()=>window.ArcadeHub.state.status==='online');
    const state=await page.evaluate(()=>window.ArcadeHub.state);
    assert.deepEqual(state.save.cleared,[4],'cloud progress merged in');
    assert.deepEqual(state.save.unlocked,['sproto831']);
    assert.deepEqual(await locked(page),['morelight','sproto1815'],"Cone's Tip opens Goldie; the cloud save opens The Villain");
    assert.equal(await page.evaluate(()=>document.getElementById('hub-return').hidden),false);
    assert.match(await page.textContent('#hub-status'),/Tickets 40/);
    await clear(page,0,true); // first boss in god mode: Relic yes, Tickets no
    await page.waitForFunction(()=>window.__hubCalls.some(c=>c[0]==='writeSave'&&c[1].cleared.includes(0)));
    await clear(page,0,false); // again without god mode: Tickets yes, no second Relic report
    await clear(page,2,true); // later level in god mode: nothing sent but the save
    await page.waitForFunction(()=>window.__hubCalls.filter(c=>c[0]==='writeSave').some(c=>c[1].cleared.includes(2)));
    const calls=await page.evaluate(()=>window.__hubCalls);
    const events=calls.filter(c=>c[0]==='reportEvent');
    assert.equal(events.length,1,'one Relic report');
    assert.equal(events[0][1],'arcade.boss_defeated');
    assert.deepEqual(events[0][2],{boss:'bront'});
    const earns=calls.filter(c=>c[0]==='earnTickets');
    assert.equal(earns.length,1,'Tickets only for the non-god clear');
    assert.deepEqual(earns[0].slice(1,3),[20,'arcade_clear']);
    assert.match(earns[0][3],/^arcade:clear:0:/);
    assert.deepEqual(calls.filter(c=>c[0]==='writeSave').at(-1)[1].cleared,[0,2,4]);
    assert.match(await page.textContent('#hub-status'),/Breakwater Coin owned/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('sproto-arcade-hub-pending-v1')),'[]','nothing left queued');
    await page.click('#hub-return');
    assert.deepEqual((await page.evaluate(()=>window.__hubCalls)).at(-1),['exit','return']);
    assert.deepEqual(errors,[]);
    results.hubSession='passed';
    await page.close();
  }
  { // 3. index.html forwards a ticket.
    const page=await browser.newPage();
    // The SDK strips #t= as soon as it tries to redeem it, so note the hash story mode arrived with.
    await page.addInitScript(()=>{if(location.pathname.endsWith('/legacy.html'))sessionStorage.setItem('arrivedHash',location.hash);});
    await page.goto(origin+'/index.html#t=abc123');
    await page.waitForFunction(()=>location.pathname.endsWith('/legacy.html'),null,{timeout:30000});
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('arrivedHash')),'#t=abc123');
    await page.waitForFunction(()=>window.ArcadeHub&&window.ArcadeHub.state.status!=='connecting',null,{timeout:30000});
    assert.equal(await page.evaluate(()=>location.hash),'','the SDK consumed the ticket');
    const plain=await browser.newPage();
    await plain.goto(origin+'/index.html');
    assert.match(plain.url(),/index\.html$/,'no ticket stays on Machine Trials');
    results.ticketForward='passed';
  }
  console.log(JSON.stringify({status:'passed',kind:'hub-link-browser',results,limitations:['The SDK is stubbed in case 2; no Nakama server runs here.']},null,2));
}finally{await browser.close();server.close();}
