#!/usr/bin/env node
// Checks dist/arcade-sim.server.js against the hub's contract (docs/SERVER-SIM.md):
//   - line 1 is `var ARCADE_SIM_VERSION = '<16 hex>';` and the hex is sha256(body)[0:16], where
//     the body is every byte after line 1's newline (so an edited bundle without a new version,
//     or a new version without the matching body, fails);
//   - it equals a fresh build of the sources, and runtime/story/sim-version.js carries the
//     same version (unless --no-rebuild);
//   - it parses as ECMAScript 5 (acorn, ecmaVersion 5), so no ES2015+ syntax;
//   - its only top-level declarations are ARCADE_SIM_VERSION and ArcadeSim, plus the guarded
//     module.exports line;
//   - it mentions none of: WebAssembly/wasm, async/await, Promise, Date, Math.random,
//     import/require, eval/Function, timers, or browser globals (window, document, performance,
//     requestAnimationFrame, ...);
//   - loaded as a plain script it exposes ArcadeSim.verifyClear and ArcadeSim.ARCADE_SIM_VERSION,
//     and verifyClear answers garbage with {ok:false, error, simVersion, godMode, ticks, endHash}.
//   node tools/check-server-bundle.mjs [--no-rebuild]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {BUNDLE_PATH,VERSION_PATH,buildBundle,versionOf,versionScript,root} from './build-server-sim.mjs';
const require=createRequire(import.meta.url);
const acorn=require('acorn'),walk=require('acorn-walk');

const errors=[];
const text=fs.readFileSync(BUNDLE_PATH,'utf8');
const newline=text.indexOf('\n');
const header=text.slice(0,newline), body=text.slice(newline+1);
const match=/^var ARCADE_SIM_VERSION = '([0-9a-f]{16})';$/.exec(header);
if (!match) errors.push('line 1 must be exactly: var ARCADE_SIM_VERSION = \'<16 hex>\';');
const version=match?.[1];
if (match && versionOf(body)!==version) errors.push(`version header ${version} is not sha256(body)[0:16] = ${versionOf(body)}: the bundle changed without its version`);

if (!process.argv.includes('--no-rebuild')) {
  const fresh=buildBundle();
  if (fresh.bundle!==text) errors.push('dist/arcade-sim.server.js differs from a fresh build of the sources: run node tools/build-server-sim.mjs and commit');
  if (!fs.existsSync(VERSION_PATH) || fs.readFileSync(VERSION_PATH,'utf8')!==versionScript(fresh.version)) errors.push('runtime/story/sim-version.js is stale: run node tools/build-server-sim.mjs');
}

let ast=null;
try { ast=acorn.parse(text,{ecmaVersion:5,sourceType:'script'}); }
catch (e) { errors.push('not ES5: '+e.message); }

const FORBIDDEN_NAMES=new Set(['WebAssembly','async','await','Promise','Date','require','import','eval','Function','setTimeout','setInterval',
  'setImmediate','queueMicrotask','window','document','performance','requestAnimationFrame','cancelAnimationFrame','navigator','location',
  'localStorage','sessionStorage','fetch','XMLHttpRequest','globalThis','self','importScripts','process','Image','AudioContext','console']);
if (ast) {
  const top=ast.body.map(n=>n.type==='VariableDeclaration'?n.declarations.map(d=>d.id.name).join(','):n.type);
  if (JSON.stringify(top)!==JSON.stringify(['ARCADE_SIM_VERSION','ArcadeSim','IfStatement'])) errors.push('unexpected top-level statements: '+JSON.stringify(top));
  const found=new Set();
  walk.full(ast,node=>{
    if (node.type==='Identifier' && FORBIDDEN_NAMES.has(node.name)) found.add(node.name);
    if (node.type==='MemberExpression' && !node.computed && node.property.name==='random' && node.object.type==='Identifier' && node.object.name==='Math') found.add('Math.random');
    if (node.type==='MemberExpression' && node.computed && node.property.type==='Literal' && FORBIDDEN_NAMES.has(String(node.property.value))) found.add('['+node.property.value+']');
    if (node.type==='Literal' && typeof node.value==='string' && /wasm|\0asm/i.test(node.value)) found.add('wasm literal');
  });
  // Property names such as `obj.window` are fine; only identifiers count above.
  if (found.size) errors.push('forbidden: '+[...found].join(', '));
}
if (/\bWebAssembly\b|\bMath\s*\.\s*random\b|\bnew\s+Date\b/.test(text)) errors.push('forbidden text (WebAssembly, Math.random or new Date) in the bundle');

let api=null;
try {
  // A bare context: only ECMAScript built-ins, like goja.
  const context=vm.createContext({});
  vm.runInContext(text+'\n;this.__api=ArcadeSim;this.__version=ARCADE_SIM_VERSION;',context,{filename:'arcade-sim.server.js'});
  api=context.__api;
  if (context.__version!==version || api.ARCADE_SIM_VERSION!==version) errors.push('ArcadeSim.ARCADE_SIM_VERSION must equal the header');
  if (typeof api.verifyClear!=='function') errors.push('ArcadeSim.verifyClear missing');
  for (const bad of [null,undefined,7,'x',[],{},{schema:1,simVersion:version}]) {
    const r=api.verifyClear(bad);
    if (!r || r.ok!==false || typeof r.error!=='string' || r.simVersion!==version || typeof r.godMode!=='boolean' || typeof r.ticks!=='number' || !/^[0-9a-f]{16}$/.test(r.endHash))
      errors.push('verifyClear('+JSON.stringify(bad)+') gave '+JSON.stringify(r));
  }
} catch (e) { errors.push('loading the bundle in a bare context failed: '+e.message); }

const result={kind:'server-bundle-check',status:errors.length?'failed':'passed',bundle:path.relative(root,BUNDLE_PATH),version,bytes:Buffer.byteLength(text),errors};
console.log(JSON.stringify(result,null,1));
if (errors.length) process.exitCode=1;
