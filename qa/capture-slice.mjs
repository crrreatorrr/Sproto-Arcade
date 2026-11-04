// Private visual QA captures, not Library deliverables.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {openBrowser,wait} from './browser-cdp.mjs';
const qaDir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(process.argv[2]||path.join(qaDir,'..')),destination=path.resolve(process.argv[3]||path.join(qaDir,'artifacts'));
fs.mkdirSync(destination,{recursive:true});const b=await openBrowser(pathToFileURL(path.join(root,'index.html')).href);
try{for(let i=0;i<100;i++){if(await b.evaluate('!!globalThis.ArcadeApp'))break;await wait(100);}
 const entries=[['01-marina',1,170,'marina-pressure'],['03-mudline',1,30,'mudline-shutters'],['11-rooftop',1,30,'rooftop-extraction'],['12-codebreak',0,20,'codebreak-climb'],['12-codebreak',1,180,'codebreak-summit']];const rows=[];
 for(const [id,phase,ticks,name]of entries){
  await b.evaluate(`document.getElementById('stage').value=${JSON.stringify(id)};document.getElementById('entry').value='${phase}';document.getElementById('start').click()`);await wait(60);
  await b.evaluate(`(()=>{const w=ArcadeApp.world;while(w.phaseTick<${ticks}&&w.state==='playing')w.step({});ArcadeApp.render();})()`);await wait(100);
  const capture=await b.send('Page.captureScreenshot',{format:'png'});const file=path.join(destination,name+'.png');fs.writeFileSync(file,Buffer.from(capture.data,'base64'));
  rows.push({file,...await b.evaluate(`(()=>{const w=ArcadeApp.world;return {stage:w.stage.id,phase:w.phaseIndex,tick:w.phaseTick,state:w.state,hp:w.player.hp,objective:w.objective,cue:w.cueText,player:{x:w.player.x,y:w.player.y}};})()`)});
 }
 console.log(JSON.stringify(rows,null,2));
}finally{await b.close();}
