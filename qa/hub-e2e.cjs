// Real end-to-end check against a running hub stack (not part of run-all; needs Docker).
//   1. metaverse-hub/server: `docker compose up -d` (Nakama with migration 0025).
//   2. Build this game for it: ARCADE_ALLOW_DEV_KEY=1 NAKAMA_SERVER_KEY=<server/.env key> node tools/build-web.mjs <dir>
//      and link <dir> to metaverse-hub/apps/hub/public/play/sproto-arcade; then `npm run dev` in metaverse-hub.
//   3. KEY=<server key> node qa/hub-e2e.cjs
// It makes a hub session and a portal ticket, opens /play/sproto-arcade/#t=<ticket> through the hub dev
// server, clears level 1 (no god mode) and level 2 (god mode), then checks on the server: the Breakwater
// Coin is granted, 20 Tickets were paid once, and the cloud save holds both clears. A fresh browser
// with a new ticket gets that progress back, and Return to hub lands on /hub/#from=sproto-arcade.
const {chromium}=require('playwright');const fs=require('fs');
const KEY=process.env.KEY, HUB='http://127.0.0.1:5173', NK='http://127.0.0.1:7350';
const basic='Basic '+Buffer.from(KEY+':').toString('base64');
async function j(url,opts){const r=await fetch(url,opts);const t=await r.text();if(!r.ok)throw Error(url+' '+r.status+' '+t);return t?JSON.parse(t):{};}
const rpc=(id,body,token)=>j(`${NK}/v2/rpc/${id}?unwrap=true`,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify(body)});
(async()=>{
  // Hub session the way the plaza makes one (device auth, hub scope), then a portal ticket.
  const dev='e2e-'+Date.now();
  const auth=await j(`${NK}/v2/account/authenticate/device?create=true`,{method:'POST',headers:{'content-type':'application/json',authorization:basic},body:JSON.stringify({id:dev})});
  const hubToken=auth.token;
  const before=await rpc('profile.get',{},hubToken);
  const enter=await rpc('portal.enter',{game:'sproto-arcade',ranked:false},hubToken);
  console.log('ticket ok',!!enter.ticket,'relics before',JSON.stringify(before.relics??before));
  const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push('console '+m.text())});
  await p.goto(`${HUB}/play/sproto-arcade/#t=${enter.ticket}`);
  await p.waitForFunction(()=>location.pathname.endsWith('legacy.html')&&window.ArcadeHub,null,{timeout:60000});
  await p.waitForFunction(()=>window.ArcadeHub.state.status!=='connecting',null,{timeout:60000});
  const st=await p.evaluate(()=>({status:ArcadeHub.state.status,tickets:ArcadeHub.state.tickets,relics:ArcadeHub.state.relics,hash:location.hash}));
  console.log('arcade',JSON.stringify(st));
  if(st.status!=='online')throw Error('not online: '+errs.join(' | '));
  await p.waitForFunction(()=>!document.getElementById('start').disabled,null,{timeout:120000});
  // Beat the first boss without god mode, then level 2 in god mode.
  await p.evaluate(()=>{godMode=false;begin(0);clearLevel();});
  await p.waitForFunction(()=>ArcadeHub.state.relics.includes('breakwater_coin'),null,{timeout:30000});
  await p.waitForTimeout(1500);
  await p.evaluate(()=>{godMode=true;begin(1);clearLevel();godMode=false;});
  await p.waitForTimeout(2500);
  const after=await p.evaluate(()=>({tickets:ArcadeHub.state.tickets,relics:ArcadeHub.state.relics,save:ArcadeHub.state.save,pending:localStorage.getItem('sproto-arcade-hub-pending-v1'),bar:document.getElementById('hub-status').textContent,back:!document.getElementById('hub-return').hidden}));
  console.log('after clears',JSON.stringify(after));
  // Server truth, read with the game session the page holds.
  const session=await p.evaluate(()=>JSON.parse(sessionStorage.getItem('hub:sproto-arcade:session')||'null'));
  const gameToken=session?.token;
  const save=await rpc('save.get',{},gameToken);
  const bal=await rpc('tickets.balance',{game:'sproto-arcade'},gameToken);
  const prof=await rpc('profile.get',{},hubToken);
  console.log('server save',JSON.stringify(save.data),'tickets',bal.balance,'hub relics',JSON.stringify(prof.relics));
  // Reload through a fresh ticket: progress comes back from the cloud on a clean browser.
  const enter2=await rpc('portal.enter',{game:'sproto-arcade',ranked:false},hubToken);
  const ctx=await b.newContext();const p2=await ctx.newPage();
  await p2.goto(`${HUB}/play/sproto-arcade/legacy.html#t=${enter2.ticket}`);
  await p2.waitForFunction(()=>window.ArcadeHub&&ArcadeHub.state.status==='online',null,{timeout:60000});
  await p2.waitForTimeout(800);
  const fresh=await p2.evaluate(()=>({save:ArcadeHub.state.save,morelight:ArcadeHub.isUnlocked('morelight')}));
  console.log('fresh browser',JSON.stringify(fresh));
  // Return to hub.
  await p.click('#hub-return');await p.waitForURL(/\/hub\/#from=sproto-arcade/,{timeout:30000});
  console.log('returned',p.url());
  console.log('errors',JSON.stringify(errs));
  const ok=prof.relics.includes('breakwater_coin')&&bal.balance===20&&save.data.cleared.join()==='0,1'&&fresh.morelight&&fresh.save.cleared.join()==='0,1';
  console.log(ok?'E2E PASSED':'E2E FAILED');await b.close();process.exit(ok?0:1);
})().catch(e=>{console.error('E2E ERROR',e.message);process.exit(1)});
