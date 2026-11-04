// Private campaign presentation captures. No gameplay completion claims.
import fs from'node:fs';import path from'node:path';import{fileURLToPath,pathToFileURL}from'node:url';import{openBrowser,wait}from'./browser-cdp.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(process.argv[2]||path.join(here,'..')),destination=path.resolve(process.argv[3]||path.join(here,'artifacts'));fs.mkdirSync(destination,{recursive:true});
const b=await openBrowser(pathToFileURL(path.join(root,'index.html')).href);
try{await wait(250);const rows=[];
 for(const[id,phase,ticks,input,name]of [['07-moonkeep',0,100,{},'moonkeep-lifts'],['07-moonkeep',1,100,{},'moonkeep-rampart'],['09-hatchery',0,100,{},'hatchery-pods'],['09-hatchery',1,180,{},'hatchery-conveyor'],['08-crown',0,140,{},'crown-shield'],['08-crown',1,140,{},'crown-joust'],['03-mudline',1,30,{},'mudline-shutters-fixed'],['10-verse',1,170,{up:true},'verse-top-fixed']]){
  await b.evaluate(`(()=>{document.getElementById('stage').value=${JSON.stringify(id)};document.getElementById('stage').dispatchEvent(new Event('change'));document.getElementById('entry').value='${phase}';document.getElementById('start').click();})()`);await wait(60);
  await b.evaluate(`(()=>{const w=ArcadeApp.world;while(w.phaseTick<${ticks}&&w.state==='playing')w.step(${JSON.stringify(input)});ArcadeApp.render();})()`);await wait(70);
  const screenshot=await b.send('Page.captureScreenshot',{format:'png'}),file=path.join(destination,name+'.png');fs.writeFileSync(file,Buffer.from(screenshot.data,'base64'));
  rows.push({file,...await b.evaluate(`(()=>{const w=ArcadeApp.world;return {stage:w.stage.id,phase:w.phaseIndex,tick:w.phaseTick,state:w.state,player:{x:w.player.x,y:w.player.y},targets:w.targets.map(t=>({id:t.id,x:t.x,y:t.y,w:t.w,h:t.h,open:t.open}))};})()`)});
 }console.log(JSON.stringify(rows,null,2));
}finally{await b.close();}
