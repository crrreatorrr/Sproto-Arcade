#!/usr/bin/env node
// Re-run existing legal input sequences against the current simulation. A failed
// clear is never rewritten; use story-bot.mjs to find a new controller sequence.
import fs from 'node:fs';
import path from 'node:path';
import {loadSourceSim,root} from './build-server-sim.mjs';

const sim=loadSourceSim(),directory=path.join(root,'qa/golden');
const requested=process.argv.slice(2).map(Number).filter(Number.isInteger);
const files=fs.readdirSync(directory).filter(f=>/^story-\d\d\.json$/.test(f)&&(!requested.length||requested.includes(Number(f.slice(6,8))))).sort();
const results=[];
for(const file of files){
 const target=path.join(directory,file),old=JSON.parse(fs.readFileSync(target,'utf8'));
 const log=structuredClone(old.log);
 if(log.godMode!==false)throw Error(file+': only genuine god-mode-free input logs may be refreshed');
 log.simVersion=sim.ARCADE_SIM_VERSION;delete log.claimed.endHash;
 let verified=sim.verifyClear(log);
 // A legitimate sequence can now finish sooner. Keep exactly the inputs that
 // actually earned that clear, rather than padding or forcing a result.
 if(!verified.ok&&/^cleared at tick \d+ but the log runs /.test(verified.error||'')){
  const decoded=sim.decodeInputs(log.inputs,log.ticks);
  if(decoded.error)throw Error(decoded.error);
  log.ticks=verified.ticks;log.inputs=sim.encodeInputs(decoded.masks.slice(0,log.ticks));log.claimed.ticks=log.ticks;
  verified=sim.verifyClear(log);
 }
 if(!verified.ok){results.push({file,status:'needs-new-controller',reason:verified.error});continue;}
 log.claimed.endHash=verified.endHash;
 const confirmed=sim.verifyClear(log);if(!confirmed.ok)throw Error(file+': end-hash confirmation failed');
 const fresh={...old,source:'tools/refresh-story-goldens.mjs; existing story-bot inputs fully replayed on current simulation',
  expect:{ok:true,kind:confirmed.kind,stage:confirmed.stage,bossId:confirmed.bossId,godMode:false,ticks:confirmed.ticks,endHash:confirmed.endHash},log};
 fs.writeFileSync(target,JSON.stringify(fresh,null,1)+'\n');results.push({file,status:'verified',ticks:confirmed.ticks,endHash:confirmed.endHash});
}
console.log(JSON.stringify({version:sim.ARCADE_SIM_VERSION,results},null,2));
if(results.some(r=>r.status!=='verified'))process.exitCode=1;
