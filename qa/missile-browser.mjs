#!/usr/bin/env node
// Actual file/HTTP rendering; synthetic hazard arrangement is NOT an earned run.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';import {openBrowser,wait} from './browser-cdp.mjs';
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));const http=process.argv[3];
const urls=[pathToFileURL(path.join(root,'index.html')).href,...(http?[http]:[])];const rows=[];
for(const url of urls){const b=await openBrowser(url);try{
 for(let n=0;n<100&&!await b.evaluate('!!globalThis.ArcadeApp');n++)await wait(100);
 await b.evaluate(`document.getElementById('stage').value='08-crown';document.getElementById('entry').value='1';document.getElementById('start').click()`);
 await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await b.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
 const images=await b.evaluate(`Promise.all(['missile'].map(style=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve({style,loaded:true,width:i.naturalWidth});i.onerror=()=>resolve({style,loaded:false});i.src=Arcade.projectileAssets?.[style]?.path||'art/gameplay/projectiles/'+style+'.svg';})))`);
 const render=await b.evaluate(`(()=>{const w=ArcadeApp.world;w.hazards=[];w.camera={x:0,y:0};const styles=['missile'];for(let i=0;i<1;i++)w.hazard({id:'qa-'+i,source:'qa-render',rule:'ordinary',sprite:styles[i],pressure:true,x:300+i*160,y:420,w:44,h:18,vx:-1.1,missile:true,windup:90,active:1500});
 const ctx=document.getElementById('arena').getContext('2d'),calls=[];const names=['drawImage','strokeRect','setLineDash','lineTo'];const originals={};for(const name of names){originals[name]=ctx[name];ctx[name]=function(...args){calls.push({name,args:name==='drawImage'?[String(args[0].src),...args.slice(1)]:args});return originals[name].apply(this,args);};}
 ArcadeApp.render();const warning=calls.slice();calls.length=0;for(const h of w.hazards)h.age=90;ArcadeApp.render();const active=calls.slice();for(const name of names)ctx[name]=originals[name];
 return {paused:ArcadeApp.paused,hazards:w.hazards.map(h=>({sprite:h.sprite,speed:Math.hypot(h.vx,h.vy),windup:h.windup,box:[h.x,h.y,h.w,h.h]})),warning,active};})()`);
 // First explicit render primes the adapter image cache; allow actual load and rerun.
 await wait(150);const loaded=await b.evaluate(`(()=>{const ctx=document.getElementById('arena').getContext('2d'),old=ctx.drawImage,calls=[];ctx.drawImage=function(...a){if(a[0].src?.includes('/projectiles/'))calls.push({src:a[0].src,box:a.slice(1)});return old.apply(this,a);};ArcadeApp.render();ctx.drawImage=old;return calls;})()`);
 const outlines=render.warning.filter(x=>x.name==='strokeRect'&&x.args[1]===420).length;
 const dashed=render.warning.some(x=>x.name==='setLineDash'&&x.args[0]?.length===2);
 const trajectories=render.warning.filter(x=>x.name==='lineTo').length;
 const exceptions=b.events.filter(x=>x.method==='Runtime.exceptionThrown');const errors=b.events.filter(x=>x.method==='Log.entryAdded'&&x.params.entry.level==='error').map(x=>x.params.entry.text);
 const correctSize=loaded.every(x=>x.box.at(-2)===44&&x.box.at(-1)===18);
 const passed=correctSize&&images.every(x=>x.loaded)&&loaded.length===1&&outlines===1&&dashed&&trajectories>=1&&!exceptions.length&&!errors.length&&render.paused;
 const row={url,status:passed?'passed':'failed',images,projectileDraws:loaded,correctDrawSize44x18:correctSize,warningCollisionOutlines:outlines,dashedWarnings:dashed,trajectoryLineSegments:trajectories,hazards:render.hazards,exceptions,errors};rows.push(row);
 if(process.env.QA_CAPTURE){await b.evaluate("document.getElementById('curtain').hidden=true;for(const h of ArcadeApp.world.hazards)h.age=0;ArcadeApp.render()");const capture=await b.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(process.env.QA_CAPTURE+(url.startsWith('file:')?'-file.png':'-http.png'),Buffer.from(capture.data,'base64'));}
}finally{await b.close();}}
const result={build:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),workingTree:execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}).trim(),kind:'actual-browser-synthetic-missile-rendering',status:rows.every(r=>r.status==='passed')?'passed':'failed',rows,limitations:['Synthetic hazard arrangement checks actual renderer/image loading; it is not a played encounter or clear.','Canvas traces establish draw calls and collision-outline coordinates, not human comprehension.','Campaign legal-input controllers and human playtesting remain separate.']};console.log(JSON.stringify(result,null,2));if(result.status!=='passed')process.exitCode=1;
