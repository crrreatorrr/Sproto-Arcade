#!/usr/bin/env node
// Story mode ↔ hub link (hub-link.js, story-progress.js, hub-ui.js) in real Chromium.
//  1. Offline: the real vendored SDK finds no ticket, the game plays, progress stays local.
//  2. Hub session: the SDK bundle is swapped for a recording stub. Checks the cloud-save merge,
//     Relic unlocks, first-boss Relic reports for repeat wins and phase-2 retries, Tickets only
//     on full clears outside god mode, and Return to hub.
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
const STUB=`var HubSDK={createHubSdk:function(){
  var calls=window.__hubCalls=[];var me=window.__stubPlayer||'p1';var relics=me==='p1'?['cones_tip']:[];
  var cloud=me==='p1'?{data:{v:1,cleared:[4],unlocked:['sproto831'],updatedAt:1},updatedAt:1}:{data:null,updatedAt:0};
  return {
    init:async function(g){calls.push(['init',g]);return {playerId:me,ranked:false,relics:relics.slice(),effects:{},ticketsCapLeft:200,serverTime:0};},
    getSession:function(){return {token:'t',playerId:me,game:'sproto-arcade',ranked:false,expiresAt:Date.now()+1e6};},
    loadSave:async function(){calls.push(['loadSave']);return cloud;},
    writeSave:async function(d){calls.push(['writeSave',JSON.parse(JSON.stringify(d))]);cloud={data:d,updatedAt:2};return cloud;},
    getTicketBalance:async function(){return {balance:40,sessionCapLeft:200,dailyCapLeft:1000,serverTime:0};},
    reportEvent:async function(e,d,k){calls.push(['reportEvent',e,d,k]);if(e==='arcade.boss_defeated'&&d.boss==='bront'&&relics.indexOf('breakwater_coin')<0){relics.push('breakwater_coin');return {granted:'breakwater_coin'};}return {};},
    earnTickets:async function(a,r,k){if(window.__slowEarn)await new Promise(function(ok){setTimeout(ok,window.__slowEarn);});calls.push(['earnTickets',a,r,k]);return {balance:60,capped:false};},
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
// Release pages pin scripts to content hashes; stub the SDK with or without
// that query suffix while leaving every other script on the real browser path.
const sdkScript=/\/vendor\/hub-sdk\/hub-sdk\.iife\.js(?:\?[^#]*)?$/;
// Clear a level the way play does: begin() then the game's own clearLevel().
const clear=(page,level,god,phase=1)=>page.evaluate(([level,god,phase])=>{godMode=god;begin(level,false,phase);clearLevel();godMode=false;return window.ArcadeHub.state.save;},[level,god,phase]);
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
    await page.route(sdkScript,r=>r.fulfill({contentType:'text/javascript',body:STUB}));
    const errors=await open(page);
    await page.waitForFunction(()=>window.ArcadeHub.state.status==='online');
    const state=await page.evaluate(()=>window.ArcadeHub.state);
    assert.deepEqual(state.save.cleared,[4],'cloud progress merged in');
    assert.deepEqual(state.save.unlocked,['sproto831']);
    assert.deepEqual(await locked(page),['morelight','sproto1815'],"Cone's Tip opens Goldie; the cloud save opens The Villain");
    assert.equal(await page.evaluate(()=>document.getElementById('hub-return').hidden),false);
    assert.match(await page.textContent('#hub-status'),/Tickets 40/);
    await page.evaluate(()=>window.ArcadeHub.recordLocalClear(0)); // a previous win without the Coin
    await clear(page,0,false,2);
    await page.waitForFunction(()=>window.ArcadeHub.state.relics.includes('breakwater_coin'));
    assert.deepEqual(await page.evaluate(()=>window.__hubCalls.filter(c=>c[0]==='earnTickets'||c[0]==='writeSave')),[],
      'a phase-2 retry grants the Coin without Tickets or a cloud write');
    await clear(page,0,true);
    await page.waitForFunction(()=>window.__hubCalls.some(c=>c[0]==='writeSave'&&c[1].cleared.includes(0)));
    await clear(page,0,false); // full run with the Coin already owned
    await clear(page,2,true); // later level in god mode: nothing sent but the save
    await page.waitForFunction(()=>window.__hubCalls.filter(c=>c[0]==='writeSave').some(c=>c[1].cleared.includes(2)));
    const calls=await page.evaluate(()=>window.__hubCalls);
    const events=calls.filter(c=>c[0]==='reportEvent');
    assert.equal(events.length,3,'every first-boss win reports the Relic');
    assert.equal(new Set(events.map(c=>c[3])).size,3,'each win gets its own idempotency key');
    for(const event of events){
      assert.equal(event[1],'arcade.boss_defeated');
      assert.equal(event[2].boss,'bront');
    }
    assert.deepEqual(events[0][2],{boss:'bront'},'a phase-2 retry has no full replay');
    // The run's replay log rides along for the hub's server-side check (docs/SERVER-SIM.md).
    const replay=events[1][2].replay;
    assert.deepEqual(Object.keys(events[1][2]).sort(),['boss','replay']);
    assert.equal(replay.schema,1);
    assert.match(replay.simVersion,/^[0-9a-f]{16}$/);
    assert.deepEqual(replay.claimed.kind,'boss');
    assert.equal(replay.claimed.bossId,'bront');
    assert.equal(replay.godMode,true,'this clear was in god mode, so the hub will not count the replay');
    const earns=calls.filter(c=>c[0]==='earnTickets');
    assert.equal(earns.length,1,'Tickets only for the non-god clear');
    assert.deepEqual(earns[0].slice(1,3),[20,'arcade_clear']);
    assert.match(earns[0][3],/^arcade:clear:0:/);
    assert.deepEqual(calls.filter(c=>c[0]==='writeSave').at(-1)[1].cleared,[0,2,4]);
    assert.equal(await page.evaluate(()=>window.ArcadeHub.state.relics.filter(r=>r==='breakwater_coin').length),1);
    assert.match(await page.textContent('#hub-status'),/Breakwater Coin owned/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('sproto-arcade-hub-pending-v1:p1')),'[]','nothing left queued');
    // Overlapping syncs: a slow earn for one clear must not drop the next clear's row.
    await page.evaluate(()=>{window.__slowEarn=400;});
    await clear(page,3,false);await clear(page,4,false);
    await page.waitForFunction(()=>window.__hubCalls.filter(c=>c[0]==='earnTickets').length===3,null,{timeout:10000});
    const levels=(await page.evaluate(()=>window.__hubCalls)).filter(c=>c[0]==='earnTickets').map(c=>c[3].split(':')[2]);
    assert.deepEqual(levels,['0','3','4'],'every non-god clear is paid once');
    await page.waitForFunction(()=>localStorage.getItem('sproto-arcade-hub-pending-v1:p1')==='[]');
    await page.click('#hub-return');
    assert.deepEqual((await page.evaluate(()=>window.__hubCalls)).at(-1),['exit','return']);
    assert.deepEqual(errors,[]);
    results.hubSession='passed';
    await page.close();
  }
  { // 2b. Accounts on one browser stay apart: offline progress goes to the first account only.
    const context=await browser.newContext();
    const page=await context.newPage();
    await page.goto(origin+'/legacy.html');
    await page.waitForFunction(()=>!document.getElementById('start').disabled,null,{timeout:120000});
    await page.evaluate(()=>window.ArcadeHub.ready);
    await clear(page,2,false); // offline, before any sign-in
    await page.route(sdkScript,r=>r.fulfill({contentType:'text/javascript',body:STUB}));
    await page.reload();await page.waitForFunction(()=>window.ArcadeHub?.state.status==='online',null,{timeout:60000});
    assert.deepEqual(await page.evaluate(()=>window.ArcadeHub.state.save.cleared),[2,4],'first account takes over the guest progress');
    await clear(page,5,false);
    await page.addInitScript(()=>{window.__stubPlayer='p2';});
    await page.reload();await page.waitForFunction(()=>window.ArcadeHub?.state.status==='online',null,{timeout:60000});
    const p2=await page.evaluate(()=>({save:window.ArcadeHub.state.save,relics:window.ArcadeHub.state.relics,calls:window.__hubCalls}));
    assert.deepEqual(p2.save.cleared,[],"another account does not inherit p1's progress");
    assert.deepEqual(p2.relics,[]);
    assert.ok(!p2.calls.some(c=>c[0]==='earnTickets'||c[0]==='reportEvent'),"p1's queued writes are not sent as p2");
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('sproto-arcade-story-v1:p1')).cleared),[2,4,5]);
    // Production hub address: play.<domain> games return to <domain>/hub/.
    assert.equal(await page.evaluate(()=>window.ArcadeHub.hubUrlFor({hostname:'play.example.com',protocol:'https:',port:''})),'https://example.com/hub/');
    assert.equal(await page.evaluate(()=>window.ArcadeHub.hubUrlFor({hostname:'127.0.0.1',protocol:'http:',port:'5173'})),'/hub/');
    results.accounts='passed';
    await context.close();
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
