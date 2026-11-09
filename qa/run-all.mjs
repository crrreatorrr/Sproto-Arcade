#!/usr/bin/env node
// Local deterministic regression runner. Browser checks are intentionally separate.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync,execFileSync} from 'node:child_process';
const qaDir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(process.argv[2]||path.join(qaDir,'..'));
function discover(dir){if(!fs.existsSync(dir))return[];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?discover(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const tests=['runtime','stages'].flatMap(d=>discover(path.join(root,d))).filter(f=>/\.cjs$|(?:^|[./-])test\.js$/.test(f)).sort();
const runtime=path.join(root,'runtime/core/world.js');
const commands=tests.map(file=>{
 const relative=path.relative(root,file),source=fs.readFileSync(file,'utf8');let args=[];
 if(source.includes('process.argv[2]')){
  // Flight's playthrough accepts repository root; isolated stage/runtime fixtures accept world.js.
  if(/(?:const|let)\s+root\s*=\s*path\.resolve\(process\.argv\[2\]|runtimeRoot\s*=\s*process\.argv\[2\]/.test(source))args=[root];
  else if(source.includes("process.argv[2]||root+'/runtime/core/world.js'")||source.includes("process.argv[2]||path.join(root,'runtime/core/world.js')"))args=[runtime];
  else if(/runtime\s*=\s*(?:path\.resolve\()?process\.argv\[2\]|process\.argv\[2\]\s*\|\|\s*(?:path\.join\(root,\s*['"]\.\.\/arcade-|root\s*\+\s*['"]\/\.\.\/arcade-)/.test(source))args=[runtime];
  else throw Error('Unclassified positional test argument in '+relative+'; add an explicit routing rule before running');
 }
 return {file,relative,args};
});
for(const file of ['static-checks.mjs','shared-rules.mjs','missile-art.mjs','boss-sheets.test.cjs','boss-weapon-variants.cjs','boss-preload.test.cjs','projectile-visibility.test.cjs','density-attacks.test.cjs','density-modern.test.cjs','density-rotation.test.cjs','redkev-render.test.cjs'])commands.push({file:path.join(qaDir,file),relative:'qa/'+file,args:[root]});
commands.push({file:path.join(qaDir,'prepare-density-assets.test.py'),relative:'qa/prepare-density-assets.test.py',args:[],executable:'python3'});
commands.push({file:path.join(root,'tools/verify-density-assets.py'),relative:'tools/verify-density-assets.py',args:[],executable:'python3'});
commands.push({file:path.join(root,'qa/verify-density-assets.test.py'),relative:'qa/verify-density-assets.test.py',args:[],executable:'python3'});
commands.push({file:path.join(root,'tools/test-redkev-geometry.py'),relative:'tools/test-redkev-geometry.py',args:[],executable:'python3'});
commands.push({file:path.join(root,'tools/test-boss-replacement.py'),relative:'tools/test-boss-replacement.py',args:[],executable:'python3'});
commands.push({file:path.join(root,'qa/prepare-redkev-atlas.test.py'),relative:'qa/prepare-redkev-atlas.test.py',args:[],executable:'python3'});
commands.push({file:path.join(root,'qa/redkev-anchors.test.py'),relative:'qa/redkev-anchors.test.py',args:[],executable:'python3'});
// Story replay goldens for the hub's server verifier (bundle always; source simulation after npm ci).
if(fs.existsSync(path.join(qaDir,'server-sim-goldens.mjs')))commands.push({file:path.join(qaDir,'server-sim-goldens.mjs'),relative:'qa/server-sim-goldens.mjs',args:[root]});
commands.push({file:path.join(qaDir,'server-sim-goldens.mjs'),relative:'qa/server-sim-goldens.mjs (historical collision disabled)',args:[root,'--collision-disabled']});
// Historical animation inventory remains archived pre-production evidence; active phase sheets have dedicated checks above.
if(fs.existsSync(path.join(qaDir,'pacing-checks.mjs')))commands.push({file:path.join(qaDir,'pacing-checks.mjs'),relative:'qa/pacing-checks.mjs',args:[root]});
if(fs.existsSync(path.join(qaDir,'missile-checks.mjs')))commands.push({file:path.join(qaDir,'missile-checks.mjs'),relative:'qa/missile-checks.mjs',args:[root]});
const results=[];
for(const command of commands){
 // prepare-redkev-atlas builds several 2048² sheets in pure Python and can pass 60s on a busy runner.
 const r=spawnSync(command.executable||process.execPath,[command.file,...command.args],{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:5*1024*1024});
 const result={file:command.relative,args:command.args.map(a=>a===root?'<repo>':a===runtime?'<repo>/runtime/core/world.js':a),status:r.status===0?'passed':'failed',exit:r.status,signal:r.signal,stdout:r.stdout?.trim(),stderr:r.stderr?.trim(),error:r.error?.message};results.push(result);
 console.error(result.status.toUpperCase()+' '+command.relative);
}
const build=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const dirty=execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}).trim();
const failed=results.filter(r=>r.status!=='passed').length;
console.log(JSON.stringify({build,workingTree:dirty,kind:'deterministic-regression',status:failed?'failed':'passed',commands:results.length,failed,results,limitations:['Scripted fixture controllers are not human playtests.','Run qa/ui-browser.mjs and qa/baseline-browser.mjs separately for actual file:// browser checks.','Full gameplay balance and readability require human playtesting. Controlled visual review is not an earned clear.']},null,2));
if(failed)process.exitCode=1;
