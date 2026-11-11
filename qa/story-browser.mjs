// Shared helper for the story-mode Playwright checks (qa/filter-budget-browser.mjs,
// qa/story-hud-browser.mjs): a static server on QA_PORT (default 5405) and a page on legacy.html
// that has pressed Start. Chromium must already be installed; nothing here downloads it.
import fs from 'node:fs';import http from 'node:http';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
export const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
export const port=Number(process.env.QA_PORT)||5405;
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.ico':'image/x-icon','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg'};
export function serve(){
 const server=http.createServer((request,response)=>{
  const file=path.join(root,decodeURIComponent(new URL(request.url,'http://x').pathname));
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){response.writeHead(404);response.end();return;}
  response.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(file).pipe(response);
 });
 return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>resolve(server));});
}
export function playwright(){
 const require=createRequire(import.meta.url);
 try{return require('playwright');}catch{return createRequire('/opt/node-tools/node_modules/')('playwright');}
}
// Opens legacy.html?level=<id>, dismisses the first-run card unless coach:true, and starts the level.
export async function openStory(browser,level,{coach=false,init=null,start=true}={}){
 const page=await browser.newPage({viewport:{width:1320,height:900},deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 if(!coach)await page.addInitScript(()=>{try{localStorage.setItem('sproto-arcade-coach-v1','1');}catch{}});
 if(init)await page.addInitScript(init);
 await page.goto(`http://127.0.0.1:${port}/legacy.html?level=${level}`);
 await page.waitForFunction(()=>!document.getElementById('start').disabled,null,{timeout:120000});
 if(start){await page.click('#start');await page.waitForFunction(()=>mode==='play',null,{timeout:120000});}
 return{page,errors};
}
