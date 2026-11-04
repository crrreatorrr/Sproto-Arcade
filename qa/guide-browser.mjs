#!/usr/bin/env node
// Private sample guide screenshots; no production or human signoff.
import fs from'node:fs';import path from'node:path';import{fileURLToPath,pathToFileURL}from'node:url';import{execFileSync}from'node:child_process';import{openBrowser,wait}from'./browser-cdp.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(process.argv[2]||path.join(here,'..')),destination=path.join(here,'artifacts');fs.mkdirSync(destination,{recursive:true});const rows=[];
for(const stage of ['08-crown','10-verse','12-codebreak']){
 const b=await openBrowser(pathToFileURL(path.join(root,'art/rework/bosses',stage,'gameplay-scale.svg')).href);
 try{await wait(250);const dom=await b.evaluate("({width:document.documentElement.getAttribute('width'),height:document.documentElement.getAttribute('height'),images:document.querySelectorAll('image').length,text:document.querySelectorAll('text').length})");
  const files=[];for(const[view,y]of[['phase1',0],['phase2',1170]]){await b.evaluate('window.scrollTo(0,'+y+')');await wait(100);const c=await b.send('Page.captureScreenshot',{format:'png'}),file=path.join(destination,stage+'-guide-'+view+'.png');fs.writeFileSync(file,Buffer.from(c.data,'base64'));files.push(file);}
  const errors=b.events.filter(e=>e.method==='Runtime.exceptionThrown'||(e.method==='Log.entryAdded'&&e.params.entry.level==='error')).map(e=>e.params.exceptionDetails?.text||e.params.entry?.text);rows.push({stage,dom,files,errors});
 }finally{await b.close();}
}
console.log(JSON.stringify({build:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),workingTree:execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}).trim(),status:rows.every(r=>r.dom.images===2&&!r.errors.length)?'passed':'failed',kind:'offline-guide-sample-load',rows,limitations:['Samples are diagnostic guide screenshots; observer readability review is reported separately.','No production animation or human signoff is claimed.']},null,2));
