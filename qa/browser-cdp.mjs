// Dependency-free local Chrome CDP helper, Node 22+. Chrome uses private scratch.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
export const wait=ms=>new Promise(r=>setTimeout(r,ms));
export async function openBrowser(url){
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'arcade-qa-cdp-'));
 const chrome=process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
 const child=spawn(chrome,['--headless=new','--no-first-run','--no-default-browser-check','--disable-gpu','--allow-file-access-from-files','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 let socket,seq=0;const pending=new Map(),events=[];
 try{
  const file=path.join(profile,'DevToolsActivePort');
  for(let i=0;i<100&&!fs.existsSync(file);i++)await wait(100);
  if(!fs.existsSync(file))throw Error('Chrome did not open a debugging port');
  const port=fs.readFileSync(file,'utf8').split('\n')[0];
  const tabs=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  socket=new WebSocket(tabs.find(x=>x.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}else events.push(m);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url});
  return {send,evaluate,events,async close(){socket.close();child.kill('SIGTERM');await wait(300);fs.rmSync(profile,{recursive:true,force:true});}};
 }catch(e){socket?.close();child.kill('SIGTERM');await wait(300);fs.rmSync(profile,{recursive:true,force:true});throw e;}
}
