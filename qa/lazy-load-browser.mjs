#!/usr/bin/env node
// Story mode (legacy.html) loading check. Real Chromium over a local HTTP server.
//   node qa/lazy-load-browser.mjs [root] --baseline   record the preload set of an older checkout
//   node qa/lazy-load-browser.mjs [root]              compare lazy groups with qa/preload-baseline.json,
//                                                     measure time to Start and play-check levels
// The baseline was recorded from the all-at-once preload (git 2420b9d) and is checked in.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const qaDir=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2);
const baselineMode=args.includes('--baseline');
const root=path.resolve(args.find(a=>!a.startsWith('--'))||path.join(qaDir,'..'));
const baselineFile=path.join(qaDir,'preload-baseline.json');
const TYPES={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json','.ico':'image/x-icon','.css':'text/css'};

function serve(dir){
  const server=http.createServer((req,res)=>{
    const file=path.join(dir,decodeURIComponent(new URL(req.url,'http://x').pathname));
    if(!file.startsWith(dir)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream','content-length':fs.statSync(file).size});
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(ok=>server.listen(0,'127.0.0.1',()=>ok(server)));
}

// Records every image path the page asks for, relative to the origin.
const RECORD=`(()=>{const seen=new Set();window.__imagePaths=seen;
  const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
  Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,get(){return d.get.call(this)},
    set(v){const u=new URL(v,location.href);seen.add(u.pathname.slice(1)+u.search);d.set.call(this,v)}});})()`;

async function openPage(browser,origin,query=''){
  const page=await browser.newPage();
  const stats={requests:0,bytes:0,failed:[],errors:[]};
  page.on('response',r=>{stats.requests++;if(r.status()>=400)stats.failed.push(r.status()+' '+r.url());stats.bytes+=Number(r.headers()['content-length']||0)});
  page.on('requestfailed',r=>stats.failed.push('failed '+r.url()));
  page.on('pageerror',e=>stats.errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')stats.errors.push(m.text())});
  await page.addInitScript(RECORD);
  const t0=Date.now();
  // unlockAll: this check picks every Sproto, including the four that story progress locks.
  await page.goto(origin+'/legacy.html'+(query?query+'&':'?')+'unlockAll=1');
  await page.waitForFunction(()=>{const s=document.getElementById('start');return s&&!s.disabled&&s.textContent!=='Loading…'},null,{timeout:180000});
  stats.readyMs=Date.now()-t0;
  return {page,stats};
}

const server=await serve(root);
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch();
try{
  if(baselineMode){
    const {page,stats}=await openPage(browser,origin);
    const paths=[...await page.evaluate(()=>[...window.__imagePaths])].sort();
    const out={recordedFrom:root,note:'Image paths requested before Start enabled under the old all-at-once preload.',requests:stats.requests,megabytes:+(stats.bytes/1e6).toFixed(2),readyMs:stats.readyMs,paths};
    fs.writeFileSync(baselineFile,JSON.stringify(out,null,1)+'\n');
    console.log(JSON.stringify({status:'recorded',paths:paths.length,requests:stats.requests,megabytes:out.megabytes,readyMs:stats.readyMs}));
  }else{
    const baseline=JSON.parse(fs.readFileSync(baselineFile,'utf8'));
    // 1. Cold load to an enabled Start button.
    const cold=await openPage(browser,origin);
    const coldStats={requests:cold.stats.requests,megabytes:+(cold.stats.bytes/1e6).toFixed(2),readyMs:cold.stats.readyMs};
    await cold.page.close();
    // 2. Union of every group covers the old preload set.
    const audit=await openPage(browser,origin,'?assetAudit=1');
    await audit.page.evaluate(()=>window.__arcadeAssets.loadEverything());
    const union=new Set(await audit.page.evaluate(()=>[...window.__imagePaths]));
    const missing=baseline.paths.filter(p=>!union.has(p));
    const extra=[...union].filter(p=>!baseline.paths.includes(p)).sort();
    if(audit.stats.failed.length)throw Error('Audit load failures '+JSON.stringify(audit.stats.failed.slice(0,10)));
    await audit.page.close();
    // 3. Play-check levels: Marina (first boss), Mudline (flight), Hatchery, chase, Codebreak.
    const played=[];
    for(const level of [1,3,9,11,12]){
      const {page,stats}=await openPage(browser,origin,'?level='+level);
      if(level===1){
        // A different Sproto than the default loads on demand before Start.
        await page.click('#sproto-portraits button:nth-child(9)');
        await page.waitForFunction(()=>!document.getElementById('start').disabled,null,{timeout:60000});
      }
      await page.click('#start');
      await page.waitForFunction(()=>document.querySelector('.overlay').hidden,null,{timeout:60000});
      await page.waitForTimeout(2500);
      const frame=await page.evaluate(()=>{const c=document.querySelector('canvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let lit=0;for(let i=0;i<d.length;i+=4*97)if(d[i]+d[i+1]+d[i+2]>30)lit++;return lit;});
      const imgs=await page.evaluate(()=>[...window.__imagePaths]);
      if(stats.failed.length||stats.errors.length)throw Error('Level '+level+' '+JSON.stringify({failed:stats.failed.slice(0,8),errors:stats.errors.slice(0,8)}));
      if(frame<1000)throw Error('Level '+level+' rendered a mostly blank frame');
      played.push({level,readyMs:stats.readyMs,requests:stats.requests,megabytes:+(stats.bytes/1e6).toFixed(2),imagesRequested:imgs.length,litSamples:frame});
      await page.close();
    }
    if(missing.length)throw Error('Lazy groups miss '+missing.length+' old preload paths: '+missing.slice(0,10).join(', '));
    console.log(JSON.stringify({status:'passed',kind:'story-lazy-load-browser',
      before:{requests:baseline.requests,megabytes:baseline.megabytes,readyMs:baseline.readyMs},
      after:coldStats,baselinePaths:baseline.paths.length,unionPaths:union.size,missing:0,extra,played,
      limitations:['Local HTTP timings; a remote host adds latency per request, which the smaller first load reduces further.']},null,2));
  }
}finally{await browser.close();server.close();}
