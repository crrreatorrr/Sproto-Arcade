// HTTP delivery check; does not change gameplay or record approval.
import fs from 'node:fs';
import {openBrowser,wait} from './browser-cdp.mjs';
const origin=process.argv[2]||'http://127.0.0.1:5201';
const paths=['/index.html','/review-start.html','/art-review.html','/art/rework/review/index.html','/qa/playtest.html','/favicon.ico'];
const http=[];
for(const path of paths){const r=await fetch(origin+path);if(!r.ok)throw Error(path+' HTTP '+r.status);http.push({url:origin+path,status:r.status,bytes:(await r.arrayBuffer()).byteLength});}
const b=await openBrowser(origin+'/index.html?stage=12-codebreak&phase=1');
try{
 for(let i=0;i<50;i++){if(await b.evaluate('!!globalThis.ArcadeApp'))break;await wait(100);}
 const selected=await b.evaluate('({stage:document.getElementById("stage").value,entry:document.getElementById("entry").value,stages:Arcade.stages.size,packs:Arcade.assets.size})');
 if(selected.stage!=='12-codebreak'||selected.entry!=='1')throw Error('Practice URL selection failed');
 const images=await b.evaluate(`(async()=>{const paths=[...new Set([...Arcade.assets.values()].flatMap(p=>[p.reference?.path,p.gameplayReview?.path]).filter(Boolean))];return await Promise.all(paths.map(path=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve({path,ok:i.naturalWidth>0});i.onerror=()=>resolve({path,ok:false});i.src=path;})));})()`);
 if(images.length!==27||images.some(i=>!i.ok))throw Error('Guide image HTTP failure');
 await b.evaluate('document.getElementById("start").click()');await wait(300);
 const playing=await b.evaluate('({state:ArcadeApp.world.state,phase:ArcadeApp.world.phaseIndex,practice:ArcadeApp.world.practice,tick:ArcadeApp.world.tick,hp:ArcadeApp.world.player.hp})');
 if(playing.state!=='playing'||playing.phase!==1||!playing.practice||playing.tick<1)throw Error('HTTP practice start failed');
 await b.send('Page.navigate',{url:origin+'/review-start.html'});await wait(150);
 const sliceLinks=await b.evaluate('[...document.querySelectorAll("table a")].map(a=>a.href)');
 if(sliceLinks.length!==12)throw Error('Slice entry links missing');
 const errors=b.events.filter(e=>e.method==='Runtime.exceptionThrown'||(e.method==='Log.entryAdded'&&e.params.entry.level==='error'));
 if(errors.length)throw Error(JSON.stringify(errors));
 const result={status:'passed',origin,serverRoot:'arcade-offline-build',servedGameplayCommit:'de69983',http,selected,playing,guideImages:images.length,guideFailures:images.filter(i=>!i.ok),sliceLinks,browserErrors:errors.length,offlineEntryPreserved:fs.existsSync(new URL('../index.html',import.meta.url)),approvalScope:'incremental by named encounter and phase; slice=Marina,Mudline,Rooftop,Codebreak',generationJobsSubmitted:0,creditsSpentByThisTask:0};
 fs.writeFileSync(new URL('./local-server-check.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
}finally{await b.close();}
