#!/usr/bin/env node
// Story replay goldens in Node: qa/server-sim-cases.js against the ES2020 source simulation
// (extracted from game.js by tools/build-server-sim.mjs) and against the committed ES5 bundle
// dist/arcade-sim.server.js. Both must pass and agree hash for hash. tools/goja-verify runs the
// same cases in goja, the hub's server engine.
//   node qa/server-sim-goldens.mjs [root] [--write-fuzz]
// --write-fuzz records the fuzz hashes (qa/golden/fuzz.json) that goja must then reproduce.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const args=process.argv.slice(2);
const root=path.resolve(args.find(a=>!a.startsWith('--'))||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
// The source simulation needs the dev tools (npm ci); without them only the bundle is checked.
let loadSourceSim=null;
try { require.resolve('acorn',{paths:[root]}); ({loadSourceSim}=await import(path.join(root,'tools/build-server-sim.mjs'))); } catch {}
const runCases=require(path.join(root,'qa/server-sim-cases.js'));
const goldenDir=path.join(root,'qa/golden');
const goldens=fs.readdirSync(goldenDir).filter(f=>/^story-\d+\.json$/.test(f)).sort().map(f=>JSON.parse(fs.readFileSync(path.join(goldenDir,f),'utf8')));
const fuzzFile=path.join(goldenDir,'fuzz.json');
const write=args.includes('--write-fuzz');
const fuzzExpect=!write && fs.existsSync(fuzzFile)?JSON.parse(fs.readFileSync(fuzzFile,'utf8')):null;
const now=()=>performance.now();

const engines={...(loadSourceSim?{source:loadSourceSim()}:{}),bundle:require(path.join(root,'dist/arcade-sim.server.js'))};
const report={};
let failed=0;
for (const [name,sim] of Object.entries(engines)) {
  const r=runCases(sim,goldens,fuzzExpect,now);
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
console.log(JSON.stringify({kind:'story-replay-goldens',status:failed?'failed':'passed',goldens:goldens.length,fuzzRecorded:write&&!failed,sizes,engines:report,
  limitations:['Golden runs come from tools/story-bot.mjs, a scripted lookahead player, not human play.','Node only here; tools/goja-verify runs the same cases in goja.',
    ...(loadSourceSim?[]:['Source simulation skipped: run npm ci for the build tools; the bundle was checked.'])]},null,1));
if (failed) process.exitCode=1;
