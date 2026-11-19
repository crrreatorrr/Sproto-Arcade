#!/usr/bin/env node
// Builds the web copy the hub serves at /play/sproto-arcade/ into dist/ (or the given folder).
//   node tools/build-web.mjs [outDir]
// The repo is ~200 MB, mostly archived authoring art and QA evidence. dist/ holds only what the two
// game pages use:
//   1. every local <script src> of index.html and legacy.html;
//   2. every literal asset path (png/jpg/webp/svg) that exists, found in those scripts and pages,
//      which covers Machine Trials' lazily drawn manifests and fighter frames;
//   3. every request story mode makes when its asset audit loads every level and Sproto, and every
//      request Machine Trials makes while each encounter runs both phases in Chromium.
// Then it serves dist/ and replays (3) against it, failing on any missing file.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {budgetViolations} from '../qa/build-budget.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.resolve(process.argv[2]||path.join(root,'dist'));
const PAGES=['index.html','legacy.html'];
const EXTRA=['favicon.ico'];
// Archived authoring and reference art stays in the repo (AGENTS.md) but never ships in dist/.
const ARCHIVED=/^art\/reference\//;
const TYPES={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json'};

function serve(dir){
  const server=http.createServer((req,res)=>{
    const file=path.join(dir,decodeURIComponent(new URL(req.url,'http://x').pathname));
    if(!file.startsWith(dir)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
  });
  return new Promise(ok=>server.listen(0,'127.0.0.1',()=>ok({server,origin:'http://127.0.0.1:'+server.address().port})));
}

/** Loads both pages the way players do and returns every same-origin path requested plus any misses. */
async function exercise(origin){
  const browser=await chromium.launch();
  const used=new Set(),missing=new Set(),errors=[];
  async function visit(url,run){
    const page=await browser.newPage();
    page.on('pageerror',e=>errors.push(url+': '+e));
    page.on('requestfinished',async request=>{
      const u=new URL(request.url());if(u.origin!==origin)return;
      const response=await request.response();const p=decodeURIComponent(u.pathname).replace(/^\//,'');
      if(!response||response.status()>=400)missing.add(p);else used.add(p);
    });
    page.on('requestfailed',request=>{const u=new URL(request.url());if(u.origin===origin)missing.add(decodeURIComponent(u.pathname).replace(/^\//,''));});
    await page.goto(origin+url);
    await run(page);
    await page.waitForLoadState('networkidle').catch(()=>{});
    await page.close();
  }
  try{
    await visit('/legacy.html?assetAudit=1&unlockAll=1',async page=>{
      await page.waitForFunction(()=>window.__arcadeAssets,null,{timeout:120000});
      await page.evaluate(()=>window.__arcadeAssets.loadEverything());
    });
    await visit('/index.html',async page=>{
      await page.waitForFunction(()=>window.Arcade?.stages?.size>0,null,{timeout:60000});
      const stages=await page.evaluate(()=>[...document.querySelectorAll('#stage option')].map(o=>o.value));
      const pilots=await page.evaluate(()=>[...document.querySelectorAll('#pilot option')].map(o=>o.value));
      for(const id of stages){
        for(const entry of ['0','1']){
          await page.evaluate(([id,entry,pilot])=>{
            document.getElementById('stage').value=id;document.getElementById('stage').dispatchEvent(new Event('change'));
            const e=document.getElementById('entry');if([...e.options].some(o=>o.value===entry))e.value=entry;
            document.getElementById('pilot').value=pilot;
            document.getElementById('start').click();
          },[id,entry,pilots[stages.indexOf(id)%pilots.length]]);
          await page.waitForTimeout(400);
        }
      }
      for(const pilot of pilots){await page.evaluate(p=>{document.getElementById('pilot').value=p;document.getElementById('start').click();},pilot);await page.waitForTimeout(150);}
    });
  }finally{await browser.close();}
  return {used,missing,errors};
}

const literal=/["'`]((?:\.\/)?[A-Za-z0-9_\-./]+?\.(?:png|jpe?g|webp|svg))(?:\?[^"'`]*)?["'`]/g;
function staticFiles(){
  const files=new Set([...PAGES,...EXTRA]);
  // Sprite paths are assembled by the presentation manifest, rather than literal strings.
  // Include every verified atlas even when its first attack occurs after the brief browser audit.
  const sheetScope={};
  vm.runInNewContext(fs.readFileSync(path.join(root,'boss-sprite-presentations.js'),'utf8'),sheetScope);
  if(fs.existsSync(path.join(root,'sprotel-art.js')))vm.runInNewContext(fs.readFileSync(path.join(root,'sprotel-art.js'),'utf8'),sheetScope);
  vm.runInNewContext(fs.readFileSync(path.join(root,'boss-sheets.js'),'utf8'),sheetScope);
  const presentation=new Set(sheetScope.ArcadeBossSheets.presentationPaths().filter(asset=>fs.existsSync(path.join(root,asset))));
  for(const asset of presentation)files.add(asset);
  vm.runInNewContext(fs.readFileSync(path.join(root,'boss-transitions.js'),'utf8'),sheetScope);
  for(const asset of sheetScope.ArcadeBossTransitions.assetPaths())files.add(asset);
  for(const config of Object.values(sheetScope.ArcadeBossSheets.manifest)){
    for(const animation of [...Object.values(config.animations||{}),...(config.phaseAnimations||[]).flatMap(phase=>Object.values(phase)),...Object.values(config.projectileAnimations||{})]){
      for(const asset of animation.pages||[])if(asset.ready)files.add(asset.path);
    }
    // A canonical phase or projectile PNG is only a fallback for its -presentation.webp, which the game draws.
    for(const asset of config.phases)if(asset.ready&&!presentation.has(asset.path.replace(/\.png$/,'-presentation.webp')))files.add(asset.path);
    for(const asset of config.projectiles)if(asset.ready&&!presentation.has(asset.path.replace(/\.png$/,'-presentation.webp')))files.add(asset.path);
  }
  for(const page of PAGES){
    for(const [,src] of fs.readFileSync(path.join(root,page),'utf8').matchAll(/<script[^>]*\bsrc="([^"]+)"/g))files.add(src.split('?')[0]);
  }
  for(const file of [...files].filter(f=>/\.(js|html)$/.test(f))){
    for(const [,ref] of fs.readFileSync(path.join(root,file),'utf8').matchAll(literal)){
      const clean=ref.replace(/^\.\//,'');
      // Authoring provenance strings (sprotel-art.js "source" fields) name archived reference art.
      if(ARCHIVED.test(clean))continue;
      // A PNG with a -presentation.webp beside it is the verified source; the game draws the WebP.
      if(/\.png$/.test(clean)&&fs.existsSync(path.join(root,clean.replace(/\.png$/,'-presentation.webp'))))continue;
      if(fs.existsSync(path.join(root,clean))&&fs.statSync(path.join(root,clean)).isFile())files.add(clean);
    }
  }
  return files;
}

const files=staticFiles();
const source=await serve(root);
let seen;
try{seen=await exercise(source.origin);}finally{source.server.close();}
if(seen.missing.size)throw Error('Source checkout is missing files the game requests:\n'+[...seen.missing].join('\n'));
const archivedRequests=[...seen.used].filter(p=>ARCHIVED.test(p));
if(archivedRequests.length)throw Error('The game requests archived reference art, which dist/ never ships:\n'+archivedRequests.join('\n'));
for(const p of seen.used)if(fs.existsSync(path.join(root,p))&&fs.statSync(path.join(root,p)).isFile())files.add(p);

// dist/arcade-sim.server.js is committed (the hub's server-side replay verifier, built by
// tools/build-server-sim.mjs), so a build into the default dist/ keeps it.
const serverSim=path.join(out,'arcade-sim.server.js'),keptServerSim=fs.existsSync(serverSim)?fs.readFileSync(serverSim):null;
fs.rmSync(out,{recursive:true,force:true});
if(keptServerSim){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(serverSim,keptServerSim);}
let bytes=0;
for(const file of [...files].sort()){
  const dest=path.join(out,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,file),dest);bytes+=fs.statSync(dest).size;
}
// Production hub config: the server key comes from the environment, never from the repo.
const serverKey=process.env.NAKAMA_SERVER_KEY||'';
// With no key, hub-link.js signs in with Nakama's stock key only when served from loopback (the local hub).
if(!serverKey)console.warn('NAKAMA_SERVER_KEY is not set: dist/ signs in to the hub only when served from this machine (localhost); elsewhere it plays offline.');
// ARCADE_ALLOW_DEV_KEY=1 is for local test builds against server/docker-compose.yml only; CI never sets it.
const devBuild=process.env.ARCADE_ALLOW_DEV_KEY==='1';
if(serverKey==='defaultkey'&&!devBuild)throw Error('Refusing the dev server key in dist/; deploy/scripts/check-dist-secrets.sh rejects it too. Set ARCADE_ALLOW_DEV_KEY=1 for a local test build.');
fs.writeFileSync(path.join(out,'hub-config.js'),'/* Generated by tools/build-web.mjs. */\nwindow.SPROTO_ARCADE_HUB={serverUrl:"",serverKey:'+JSON.stringify(serverKey)+',hubUrl:'+JSON.stringify(process.env.SPROTO_ARCADE_HUB_URL||'')+'};\n');
const leaked=[...files].filter(f=>/\.(js|html)$/.test(f)).filter(f=>fs.readFileSync(path.join(out,f),'utf8').includes('defaultkey'));
if(leaked.length&&!devBuild)throw Error('dist/ still contains the dev server key in: '+leaked.join(', '));
const built=await serve(out);
let verify;
try{verify=await exercise(built.origin);}finally{built.server.close();}
if(verify.missing.size)throw Error('dist/ is missing files the game requests:\n'+[...verify.missing].join('\n'));
if(verify.errors.length)throw Error('Page errors against dist/:\n'+verify.errors.join('\n'));
const budget=budgetViolations(out);
if(budget.length)throw Error('dist/ breaks the build budget (qa/build-budget.mjs):\n'+budget.join('\n'));
const summary={status:'passed',kind:'web-build',out:path.relative(root,out)||'.',files:files.size,megabytes:+(bytes/1e6).toFixed(1),requestedInVerify:verify.used.size};
fs.writeFileSync(path.join(out,'build-manifest.json'),JSON.stringify({...summary,list:[...files].sort()},null,1));
console.log(JSON.stringify(summary,null,2));
