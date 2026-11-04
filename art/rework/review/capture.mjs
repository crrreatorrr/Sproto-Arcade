// Review-only diagnostic sampling. It does not complete encounters or approve art.
import fs from'node:fs';import path from'node:path';import{pathToFileURL}from'node:url';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
const root=path.resolve(process.argv[2]||'../arcade-integration');
const {openBrowser,wait}=await import(pathToFileURL(path.join(root,'qa/browser-cdp.mjs')));
const dest=fs.mkdtempSync('/tmp/arcade-animation-review-');
const b=await openBrowser(pathToFileURL(path.join(root,'index.html')).href,{initScripts:['window.requestAnimationFrame=()=>0;']});
try{await wait(350);const clip=await b.evaluate('(()=>{const r=document.querySelector("canvas").getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()');const assetPacks=await b.evaluate('[...Arcade.assets.values()].map(p=>({id:p.id,productionApproved:p.productionApproved,clips:p.clips?.length||0,generationIds:p.generationIds?.length||0}))');const stages=await b.evaluate('[...Arcade.stages.values()].sort((a,b)=>a.number-b.number).map(s=>({id:s.id,title:s.title,operator:s.operator}))'),rows=[];
for(const stage of stages)for(let phase=0;phase<2;phase++){
 await b.evaluate(`(()=>{document.getElementById('stage').value=${JSON.stringify(stage.id)};document.getElementById('stage').dispatchEvent(new Event('change'));document.getElementById('entry').value='${phase}';document.getElementById('start').click();ArcadeApp.render();})()`);await wait(25);
 const samples=[];
 for(const tick of[0,60,120,240]){
  const s=await b.evaluate(`(()=>{const w=ArcadeApp.world;while(w.phaseTick<${tick}&&w.state==='playing')w.step({});ArcadeApp.render();const p=typeof w.phase.pilot==='function'?w.phase.pilot(w):w.phase.pilot,h=p?.height||p?.scale||w.phase.pilotHeight||82;return{tick:w.phaseTick,state:w.state,cue:w.cueText,machine:w.phase.machine,signature:w.phase.name,player:{x:w.player.x,y:w.player.y},camera:w.camera,pilot:p,pilotHeight:h,pilotScreen:p?{x:p.x-w.camera.x,feet:p.y-w.camera.y,top:p.y-w.camera.y-h}:null,pose:w.phase.pose?.(w),targets:w.targets.map(t=>({id:t.id,x:t.x,y:t.y,w:t.w,h:t.h,open:t.open})),hazards:w.hazards.map(h=>({id:h.id,source:h.source,age:h.age,windup:h.windup,rule:h.rule,x:h.x,y:h.y}))};})()`);
  await wait(15);await b.evaluate('ArcadeApp.render()');const cap=await b.send('Page.captureScreenshot',{format:'png',clip}),bytes=Buffer.from(cap.data,'base64'),file=path.join(dest,stage.id+'-p'+(phase+1)+'-t'+tick+'.png');fs.writeFileSync(file,bytes);s.capture=file;s.sha256=createHash('sha256').update(bytes).digest('hex');samples.push(s);
 }
 const framing=await b.evaluate(`(()=>{const w=ArcadeApp.world,p=typeof w.phase.pilot==='function'?w.phase.pilot(w):w.phase.pilot;if(p){w.camera.x=p.x-900;ArcadeApp.render();}return{camera:w.camera,diagnosticOnly:true};})()`);
 const cap=await b.send('Page.captureScreenshot',{format:'png',clip}),file=path.join(dest,stage.id+'-p'+(phase+1)+'-boss-frame.png');fs.writeFileSync(file,Buffer.from(cap.data,'base64'));rows.push({...stage,phase:phase+1,samples,diagnosticBossFrame:{...framing,capture:file}});
}
const errors=b.events.filter(e=>e.method==='Runtime.exceptionThrown'||(e.method==='Log.entryAdded'&&e.params.entry.level==='error')).map(e=>e.params.exceptionDetails?.text||e.params.entry?.text);
const result={build:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),workingTree:execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}).trim(),kind:'all-boss-two-phase-placeholder-animation-review',sampling:'Actual file:// Chrome rendering; RAF frozen; neutral diagnostic simulation at phase ticks0,60,120,240; extra camera-only boss framing. No earned clear or human gameplay claim.',stageCount:stages.length,phaseCount:rows.length,screenshotCount:rows.length*5,productionAnimationClips:assetPacks.reduce((n,p)=>n+p.clips,0),assetPacks,privateCaptureDirectory:dest,errors,rows};
fs.writeFileSync(new URL('./report.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({build:result.build,phaseCount:rows.length,screenshotCount:result.screenshotCount,errors,privateCaptureDirectory:dest}));
}finally{await b.close();}
