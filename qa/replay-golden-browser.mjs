#!/usr/bin/env node
// Client = server check for the story replay verifier. Real Chromium over a local HTTP server:
// for each golden in qa/golden/, legacy.html runs the level through its own game.js (begin(),
// update(), the replay recorder and clearLevel()) on the golden's input frames, and the log the
// page hands to the hub link must equal the golden: same inputs, ticks and end-state hash, the
// bundle's simVersion, and dist/arcade-sim.server.js must accept it.
//   node qa/replay-golden-browser.mjs [root]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const sim=require(path.join(root,'dist/arcade-sim.server.js'));
const goldens=fs.readdirSync(path.join(root,'qa/golden')).filter(f=>/^story-\d+\.json$/.test(f)).sort()
  .map(f=>JSON.parse(fs.readFileSync(path.join(root,'qa/golden',f),'utf8')));
const TYPES={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch();
const results=[];let failed=0;
try{
  for(const gold of goldens){
    const page=await browser.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(origin+'/legacy.html?level='+gold.level);
    await page.waitForFunction(()=>!document.getElementById('start').disabled,null,{timeout:120000});
    await page.click('#start');
    await page.waitForFunction(()=>document.querySelector('.overlay').hidden,null,{timeout:60000});
    const masks=sim.decodeInputs(gold.log.inputs,gold.log.ticks).masks;
    const run=await page.evaluate(([level,masks,seed])=>{
      let captured=null;
      const original=window.ArcadeHub.levelCleared;
      window.ArcadeHub.levelCleared=(index,god,replay)=>{captured=replay;return [];};
      godMode=false;
      begin(LEVELS.findIndex(l=>l.id===level),false,1,seed);
      // The same per-tick path as the game loop: record the frame, then update().
      for(const mask of masks){
        if(mode!=='play')break;
        const frame=ArcadeReplay.frameOf(mask);
        inputFrame=frame;replayRecorder?.push(frame);update();pressed.clear();
      }
      window.ArcadeHub.levelCleared=original;
      const result={mode,time,captured,simVersion:window.ARCADE_SIM_VERSION};
      setOverlay('paused','','','','');
      return result;
    },[gold.level,masks,gold.log.seed]);
    const log=run.captured;
    const problems=[];
    if(errors.length)problems.push('page errors: '+errors.join('; '));
    if(!log)problems.push(`no clear reported (mode ${run.mode} at tick ${run.time})`);
    else{
      if(log.inputs!==gold.log.inputs)problems.push('recorded inputs differ');
      if(log.ticks!==gold.expect.ticks)problems.push(`ticks ${log.ticks} vs ${gold.expect.ticks}`);
      if(log.claimed?.endHash!==gold.expect.endHash)problems.push(`endHash ${log.claimed?.endHash} vs ${gold.expect.endHash}`);
      if(log.simVersion!==sim.ARCADE_SIM_VERSION)problems.push(`page simVersion ${log.simVersion} vs bundle ${sim.ARCADE_SIM_VERSION}`);
      if(log.godMode!==false)problems.push('godMode should be false');
      const verdict=sim.verifyClear({...log,claimed:{...log.claimed,kind:'boss'}});
      if(!verdict.ok||verdict.bossId!==gold.bossId)problems.push('bundle rejected the page log: '+(verdict.error||verdict.bossId));
    }
    if(problems.length)failed++;
    results.push({level:gold.level,bossId:gold.bossId,ticks:log?.ticks,endHash:log?.claimed?.endHash,status:problems.length?'failed':'passed',problems});
    await page.close();
  }
}finally{await browser.close();server.close();}
console.log(JSON.stringify({kind:'story-replay-client-equals-server',status:failed?'failed':'passed',results,
  limitations:['Chromium only; other browsers are not run here. SimMath removes the libm differences, but other engine differences are not exercised.','Inputs are the golden bot runs, fed through the game loop path rather than real key events.']},null,1));
if(failed)process.exitCode=1;
