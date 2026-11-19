#!/usr/bin/env node
// Build budget gate for the web build in dist/ (tools/build-web.mjs).
//   node qa/build-budget.mjs [repo] [distDir]
// Fails when dist/ ships archived reference art (art/reference/), or a canonical boss phase PNG
// next to the -presentation.webp the game actually draws. tools/build-web.mjs runs this on every
// build; qa/run-all.mjs runs it too and reports a skip when no web build is present.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ARCHIVED=/^art\/reference\//;

function walk(dir,base=dir){
  if(!fs.existsSync(dir))return[];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
    const full=path.join(dir,e.name);
    return e.isDirectory()?walk(full,base):[path.relative(base,full).split(path.sep).join('/')];
  });
}

/** Returns the list of budget violations for a built directory (empty when it passes). */
export function budgetViolations(dist){
  const files=walk(dist),set=new Set(files),problems=[];
  for(const file of files){
    if(ARCHIVED.test(file))problems.push('archived reference art in dist/: '+file);
    const webp=file.replace(/\.png$/,'-presentation.webp');
    if(webp!==file&&set.has(webp))problems.push('duplicate canonical PNG next to its presentation WebP: '+file);
  }
  return problems;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
  const dist=path.resolve(process.argv[3]||path.join(root,'dist'));
  if(!fs.existsSync(path.join(dist,'build-manifest.json'))){
    console.log(JSON.stringify({status:'skipped',kind:'build-budget',reason:'no web build in '+path.relative(root,dist)+' (run node tools/build-web.mjs first)'}));
  }else{
    const problems=budgetViolations(dist);
    console.log(JSON.stringify({status:problems.length?'failed':'passed',kind:'build-budget',dist:path.relative(root,dist)||'.',problems:problems.slice(0,50),count:problems.length},null,1));
    if(problems.length)process.exitCode=1;
  }
}
