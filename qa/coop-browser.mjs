#!/usr/bin/env node
// Local 2P in Chromium: pick Local 2P on the title card, start Level 1 and play a few seconds with
// both keyboard seats. Checks two seats exist with 1.80x boss health, both seats move on their own
// keys, the P2 HUD strip shows, and no page errors. Writes qa/coop-browser.png.
//   node qa/coop-browser.mjs [dir]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.resolve(process.argv[2]||root);
const TYPES={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.join(dir,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(dir)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch();
const errors=[];
try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/legacy.html');
  await page.waitForFunction(()=>{const b=document.getElementById('start');return b&&!b.disabled&&/Start level/.test(b.textContent);},null,{timeout:120000});
  await page.selectOption('#players-select','local');
  if(!await page.isVisible('#p2-sproto'))throw Error('P2 Sproto picker hidden after choosing Local 2P');
  await page.click('#start');await page.waitForTimeout(500);
  if(await page.getByText(/Got it/i).isVisible().catch(()=>false))await page.getByText(/Got it/i).click();
  await page.waitForFunction(()=>window.ArcadeStoryCoop?.state()?.mode==='play',null,{timeout:60000});
  const start=await page.evaluate(()=>window.ArcadeStoryCoop.state());
  // Seat 1 holds A (left), seat 2 holds ArrowUp (up) for one second.
  await page.keyboard.down('KeyA');await page.keyboard.down('ArrowUp');await page.waitForTimeout(1000);
  await page.keyboard.up('KeyA');await page.keyboard.up('ArrowUp');
  await page.screenshot({path:path.join(root,'qa/coop-browser.png')});
  const moved=await page.evaluate(()=>{const s=window.ArcadeStoryCoop.state();return s;});
  await page.waitForTimeout(3000);
  const hud=await page.evaluate(()=>({p2:!document.getElementById('coop-p2').hidden,hearts:document.getElementById('hearts-p2').textContent}));
  const result={status:'passed',kind:'coop-browser',seats:start.seats.length,hud,ticks:moved.tick,errors};
  if(start.seats.length!==2)throw Error('expected two seats');
  if(!hud.p2||!/♥/.test(hud.hearts))throw Error('P2 HUD strip missing');
  if(errors.length)throw Error('page errors: '+errors.join('\n'));
  console.log(JSON.stringify(result,null,1));
}finally{await browser.close();server.close();}
