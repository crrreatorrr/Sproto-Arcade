#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import{fileURLToPath,pathToFileURL}from'node:url';import{execFileSync}from'node:child_process';import{openBrowser,wait}from'./browser-cdp.mjs';
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));const pages=[];let packs=[];
for(const file of ['index.html','art-review.html']){
 const b=await openBrowser(pathToFileURL(path.join(root,file)).href);
 try{await wait(250);if(file==='index.html')packs=await b.evaluate('[...Arcade.assets.values()].map(p=>({id:p.id,status:p.status,productionApproved:p.productionApproved,clips:p.clips?.length,generationIds:p.generationIds?.length,reference:p.reference?.path}))');
  else{for(let i=0;i<100;i++){if(await b.evaluate('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'))break;await wait(50);}}
  const images=await b.evaluate('[...document.images].map(i=>({src:i.getAttribute("src"),complete:i.complete,width:i.naturalWidth,height:i.naturalHeight}))');
  const errors=b.events.filter(e=>e.method==='Runtime.exceptionThrown'||(e.method==='Log.entryAdded'&&e.params.entry.level==='error')).map(e=>e.params.exceptionDetails?.text||e.params.entry?.text);pages.push({file,images,errors});
 }finally{await b.close();}
}
const art=pages.find(p=>p.file==='art-review.html'),approved=packs.every(p=>p.productionApproved===false&&p.clips===0&&p.generationIds===0),references=art.images.length===9&&art.images.every(i=>i.complete&&i.width>0);
const result={build:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),workingTree:execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}).trim(),kind:'offline-reference-review',status:approved&&references&&packs.length===6&&pages.every(p=>!p.errors.length)?'passed':'failed',packs,pages,limitations:['Reference SVG guides are not production animations.','No human timing, pose or hit-area signoff is asserted.']};console.log(JSON.stringify(result,null,2));if(result.status!=='passed')process.exitCode=1;
