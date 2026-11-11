#!/usr/bin/env node
// Story replay goldens in Node: qa/server-sim-cases.js against the ES2020 source simulation
// (extracted from game.js by tools/build-server-sim.mjs) and against the committed ES5 bundle
// dist/arcade-sim.server.js. Both must pass and agree hash for hash. tools/goja-verify runs the
// same cases in goja, the hub's server engine.
//   node qa/server-sim-goldens.mjs [root] [--write-fuzz] [--collision-disabled]
// --write-fuzz records the fuzz hashes (qa/golden/fuzz.json) that goja must then reproduce.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const args=process.argv.slice(2);
const root=path.resolve(args.find(a=>!a.startsWith('--'))||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
// The source simulation needs the dev tools (npm ci); without them only the bundle is checked.
let loadSourceSim=null,buildSimSource=null;
try { require.resolve('acorn',{paths:[root]}); ({loadSourceSim,buildSimSource}=await import(path.join(root,'tools/build-server-sim.mjs'))); } catch {}
const runCases=require(path.join(root,'qa/server-sim-cases.js'));
const collisionDisabled=args.includes('--collision-disabled');
// The user explicitly changed Moonkeep to UFO flight. Its old grounded clear/fuzz
// artifacts stay archived; the other eleven historical levels must still match.
const exclusions=collisionDisabled?[{stage:7,reason:'User-authorized Moonkeep UFO flight and vertical dragon movement replace the historical grounded encounter.'}]:[];
const goldenDir=path.join(root,collisionDisabled?'qa/golden-disabled':'qa/golden');
const goldens=fs.readdirSync(goldenDir).filter(f=>/^story-\d+\.json$/.test(f)).sort().map(f=>JSON.parse(fs.readFileSync(path.join(goldenDir,f),'utf8')));
const fuzzFile=path.join(goldenDir,'fuzz.json');
const write=args.includes('--write-fuzz');
if(collisionDisabled&&write)throw Error('Historical disabled fixtures are read-only; --write-fuzz is not permitted');
const fuzzExpect=!write && fs.existsSync(fuzzFile)?JSON.parse(fs.readFileSync(fuzzFile,'utf8')):null;
const now=()=>performance.now();

const defaultBundle=require(path.join(root,'dist/arcade-sim.server.js'));
function forceDisabled(text,source=false){
 const marker='return api;';
 if(!source&&text.split(marker).length!==2)throw Error('Expected one simulation API return for test-only collision override');
 // Restore the historical feature configuration explicitly. These archived runs
 // predate density barrages and random items as well as fitted sprite hitboxes.
 // Density's API is frozen; override the source flag before evaluating either
 // engine rather than attempting to mutate a frozen property in strict ES5.
 let historical=text.replace(/(Object\.freeze\(\{\s*enabled:\s*)(?:true|false)/g,'$1false')
   .replace(/(\b(?:const|let|var)\s+assetsReady\s*=\s*)(?:true|false)/g,'$1false')
   // Rules changed on purpose after these runs were recorded keep their old form behind a
   // HISTORICAL_* constant in game.js (false in production). The archive replays with them on.
   .replace(/(\b(?:const|let|var)\s+HISTORICAL_[A-Z_]+\s*=\s*)(?:true|false)/g,'$1true');
 if(/Object\.freeze\(\{\s*enabled:\s*true/.test(historical)||/\b(?:const|let|var)\s+assetsReady\s*=\s*true/.test(historical)||/\b(?:const|let|var)\s+HISTORICAL_[A-Z_]+\s*=\s*false/.test(historical))throw Error('Historical feature flags could not be disabled');
 const overrides='\nSPRITE_HITBOXES.enabled = false;\n';
 const rewritten=source?historical+overrides+'return api;':historical.replace(marker,overrides+marker);
 const scope=vm.createContext({structuredClone,ARCADE_SIM_VERSION:defaultBundle.ARCADE_SIM_VERSION});
 vm.runInContext(source?'var ArcadeSim=(function(){'+rewritten+'})();':rewritten,scope,{filename:source?'arcade-sim.historical-source.js':'arcade-sim.historical-bundle.js'});
 return scope.ArcadeSim;
}
const engines=collisionDisabled?{
 ...(buildSimSource?{source:forceDisabled(buildSimSource().source,true)}:{}),
 bundle:forceDisabled(fs.readFileSync(path.join(root,'dist/arcade-sim.server.js'),'utf8'))
}:{...(loadSourceSim?{source:loadSourceSim()}:{}),bundle:defaultBundle};
const report={};
let failed=0;
for (const [name,sim] of Object.entries(engines)) {
  const r=runCases(sim,goldens,fuzzExpect,now,{excludedStages:exclusions.map(e=>e.stage)});
  failed+=r.failed;
  const timings=r.results.filter(x=>x.name.startsWith('golden ') && x.ms!==undefined).map(x=>x.ms);
  report[name]={version:sim.ARCADE_SIM_VERSION,passed:r.passed,failed:r.failed,
    failures:r.results.filter(x=>!x.pass),
    replayMs:{perGolden:Object.fromEntries(r.results.filter(x=>x.ms!==undefined).map(x=>[x.name.replace('golden ',''),x.ms])),
      max:Math.max(...timings),mean:Math.round(timings.reduce((a,b)=>a+b,0)/timings.length*10)/10},
    fuzzHashes:r.fuzzHashes};
}
if (report.source && report.source.version!==report.bundle.version) { failed++; report.versionMismatch=[report.source.version,report.bundle.version]; }
if (report.source && JSON.stringify(report.source.fuzzHashes)!==JSON.stringify(report.bundle.fuzzHashes)) { failed++; report.fuzzSourceVsBundle='differ'; }
if (write && !failed) fs.writeFileSync(fuzzFile,JSON.stringify({note:'Hashes of qa/server-sim-cases.js fuzz logs, recorded in Node; goja must match.',hashes:report.bundle.fuzzHashes},null,1)+'\n');
const sizes=goldens.map(g=>({level:g.level,ticks:g.log.ticks,inputsBytes:g.log.inputs.length,logBytes:JSON.stringify(g.log).length}));
for (const r of Object.values(report)) if (r && r.fuzzHashes) delete r.fuzzHashes;
console.log(JSON.stringify({kind:'story-replay-goldens',collisionMode:collisionDisabled?'historical-forced-disabled':'production-default',historicalOverrides:collisionDisabled?{spriteHitboxes:false,densityAttacks:false,phasePowerups:false,historicalTuning:true}:null,fixtureDirectory:path.relative(root,goldenDir),status:failed?'failed':'passed',goldens:goldens.length-exclusions.length,archivedFixtures:goldens.length,exclusions,fuzzRecorded:write&&!failed,sizes,engines:report,
  limitations:['Golden runs come from tools/story-bot.mjs, a scripted lookahead player, not human play.','Node only here; tools/goja-verify runs the same cases in goja.',
    ...(loadSourceSim?[]:['Source simulation skipped: run npm ci for the build tools; the bundle was checked.'])]},null,1));
if (failed) process.exitCode=1;
