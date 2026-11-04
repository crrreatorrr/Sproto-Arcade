#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const context=vm.createContext({console});
vm.runInContext(fs.readFileSync(path.join(root,'levels.js'),'utf8')+';globalThis.QA_LEVELS=LEVELS;',context);
assert.equal(context.QA_LEVELS.length,12);
assert.equal(new Set(context.QA_LEVELS.map(s=>s.id)).size,12);
let scriptCount=0;
for(const entry of ['index.html','legacy.html']){
 const text=fs.readFileSync(path.join(root,entry),'utf8');
 for(const [,src] of text.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)){
  assert(!/^(https?:)?\/\//.test(src),`${entry} has network script ${src}`);
  assert(fs.existsSync(path.join(root,src.split('?')[0])),`${entry} missing ${src}`);scriptCount++;
 }
}
vm.runInContext(fs.readFileSync(path.join(root,'assets.js'),'utf8')+';globalThis.QA_ART=ART;',context);
let assetCount=0;
const missing=[];
function visit(value){
 if(Array.isArray(value)&&typeof value[0]==='string'&&/\.(png|webp|jpg)(\?|$)/.test(value[0])){
  assetCount++;if(!fs.existsSync(path.join(root,value[0].split('?')[0])))missing.push(value[0]);
 }else if(value&&typeof value==='object')for(const child of Object.values(value))visit(child);
}
visit(context.QA_ART);
assert.deepEqual(missing,[],'Missing fighter frames');
console.log(JSON.stringify({status:'passed',stages:12,localScriptReferences:scriptCount,fighterFrameReferences:assetCount,kind:'static-reference-check'},null,2));
