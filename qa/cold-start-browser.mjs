#!/usr/bin/env node
// Level 1 cold start: bytes and requests the story page needs before Start is enabled.
//   node qa/cold-start-browser.mjs [dir] [--json out.json]
// Serves [dir] (default: dist/, else the repo) on loopback, opens legacy.html in a fresh Chromium
// profile (no cache), waits until the Start button reads "Start level", and counts every
// same-origin response finished by then. Requests made after that (background prefetch) are
// reported separately. Browser check: not part of qa/run-all.mjs.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const jsonAt=args.indexOf('--json');const jsonOut=jsonAt>=0?args.splice(jsonAt,2)[1]:null;
const dir=path.resolve(args[0]||(fs.existsSync(path.join(root,'dist','legacy.html'))?path.join(root,'dist'):root));
const TYPES={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json'};

const server=http.createServer((req,res)=>{
  const file=path.join(dir,decodeURIComponent(new URL(req.url,'http://x').pathname));
  if(!file.startsWith(dir)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream','content-length':fs.statSync(file).size});
  fs.createReadStream(file).pipe(res);
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch();
try{
  const page=await (await browser.newContext()).newPage();
  // A request belongs to the boot when it was issued before Start became enabled.
  const rows=[],issued=new Map();let phase='boot';
  await page.exposeFunction('__coldStartReady',()=>{phase='after';});
  page.on('request',request=>issued.set(request,phase));
  page.on('requestfinished',async request=>{
    const u=new URL(request.url());if(u.origin!==origin)return;
    const sizes=await request.sizes().catch(()=>null);
    rows.push({phase:issued.get(request)||phase,path:decodeURIComponent(u.pathname).replace(/^\//,''),bytes:sizes?sizes.responseBodySize:0});
  });
  // Flip to "after" in the page the moment Start is enabled, before any later request is issued.
  await page.addInitScript(()=>{
    new MutationObserver((_,obs)=>{const b=document.getElementById('start');if(b&&!b.disabled&&/Start level/.test(b.textContent)){obs.disconnect();window.__coldStartReady();}})
      .observe(document,{subtree:true,childList:true,attributes:true,characterData:true});
  });
  const started=Date.now();
  await page.goto(origin+'/legacy.html');
  await page.waitForFunction(()=>{const b=document.getElementById('start');return b&&!b.disabled&&/Start level/.test(b.textContent);},null,{timeout:180000});
  const readyMs=Date.now()-started;
  await page.waitForLoadState('networkidle').catch(()=>{});
  await page.waitForTimeout(500);
  const boot=rows.filter(r=>r.phase==='boot'),after=rows.filter(r=>r.phase==='after');
  const sum=list=>list.reduce((n,r)=>n+r.bytes,0);
  const byType=list=>Object.entries(list.reduce((m,r)=>{const k=path.extname(r.path)||'(none)';m[k]=m[k]||{requests:0,bytes:0};m[k].requests++;m[k].bytes+=r.bytes;return m;},{}));
  const report={kind:'cold-start',dir:path.relative(root,dir)||'.',untilStart:{requests:boot.length,bytes:sum(boot),megabytes:+(sum(boot)/1e6).toFixed(2),ms:readyMs,byType:Object.fromEntries(byType(boot))},
    backgroundAfterStart:{requests:after.length,megabytes:+(sum(after)/1e6).toFixed(2)},
    largest:boot.sort((a,b)=>b.bytes-a.bytes).slice(0,15).map(r=>[r.path,r.bytes])};
  console.log(JSON.stringify(report,null,1));
  if(jsonOut)fs.writeFileSync(jsonOut,JSON.stringify({...report,boot:boot.map(r=>r.path).sort()},null,1));
}finally{await browser.close();server.close();}
