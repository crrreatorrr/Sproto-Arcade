#!/usr/bin/env node
// Builds dist/arcade-sim.server.js, the story-mode replay verifier the metaverse hub runs in its
// goja (ES5) server runtime, and runtime/story/sim-version.js, which tells the browser the same
// version for the logs it records.
//   node tools/build-server-sim.mjs           write both files
//   node tools/build-server-sim.mjs --check   fail if either committed file differs from a fresh build
//
// The simulation is not copied by hand. The build parses the game's own classic scripts, starts
// from what runtime/story/server-entry.js uses (resetRun, update, simState, ...) and takes every
// top-level declaration those need, transitively, plus top-level statements that fill in those
// tables (for example the loop that adds signature shapes to `boxes`). A needed name that only
// exists in the browser (document, window, location, ...) fails the build, as does any name it
// cannot resolve. The result is transpiled to ES5 with TypeScript (see arraysOnly below) and
// wrapped in one function so only `ARCADE_SIM_VERSION` and `ArcadeSim` become globals.
//
// Version: line 1 of the bundle is exactly
//   var ARCADE_SIM_VERSION = '<16 hex>';
// and the 16 hex digits are the first 16 of sha256 over the BODY: every byte after line 1's "\n".
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const BUNDLE_PATH=path.join(root,'dist/arcade-sim.server.js');
export const VERSION_PATH=path.join(root,'runtime/story/sim-version.js');
// Load order in legacy.html; each file's statements keep their order.
const SOURCES=['levels.js','arena-effects.js','codebreak.js','art/bosses/sheet-data.js','art/rework/bosses/05-neon/sheet-data.js','game.js'];
const PRELUDE=['runtime/story/sim-math.js','runtime/story/replay.js'];
const ENTRY='runtime/story/server-entry.js';
// ECMAScript built-ins the simulation may use. Browser globals are deliberately absent.
const BUILTINS=new Set(['Math','Object','Array','Number','String','Boolean','JSON','Set','Map','Infinity','NaN','undefined',
  'isNaN','isFinite','parseInt','parseFloat','Error','TypeError','RangeError','DataView','ArrayBuffer','RegExp','structuredClone',
  'ARCADE_SIM_VERSION']);
const BROWSER=new Set(['window','document','location','navigator','performance','requestAnimationFrame','cancelAnimationFrame',
  'Image','AudioContext','localStorage','sessionStorage','fetch','setTimeout','setInterval','console','Date','crypto','URLSearchParams',
  'Option','HTMLElement','globalThis','self','queueMicrotask','Promise','WebAssembly']);

const read=file=>fs.readFileSync(path.join(root,file),'utf8');

// ---- Minimal scope analysis over an acorn AST: the free identifiers a node references.
function patternNames(node,out=[]) {
  if (!node) return out;
  switch (node.type) {
    case 'Identifier': out.push(node.name); break;
    case 'ObjectPattern': for (const p of node.properties) patternNames(p.type==='RestElement'?p.argument:p.value,out); break;
    case 'ArrayPattern': for (const e of node.elements) patternNames(e,out); break;
    case 'RestElement': patternNames(node.argument,out); break;
    case 'AssignmentPattern': patternNames(node.left,out); break;
  }
  return out;
}
// Default values and computed keys inside a pattern are references.
function patternRefs(node,scope,free) {
  if (!node) return;
  switch (node.type) {
    case 'ObjectPattern': for (const p of node.properties) { if (p.type==='RestElement') patternRefs(p.argument,scope,free); else { if (p.computed) visit(p.key,scope,free); patternRefs(p.value,scope,free); } } break;
    case 'ArrayPattern': for (const e of node.elements) patternRefs(e,scope,free); break;
    case 'RestElement': patternRefs(node.argument,scope,free); break;
    case 'AssignmentPattern': patternRefs(node.left,scope,free); visit(node.right,scope,free); break;
    case 'MemberExpression': visit(node,scope,free); break;
  }
}
// var and function declarations hoisted to a function body (not crossing nested functions).
function hoisted(node,out) {
  if (!node || typeof node!=='object') return out;
  if (Array.isArray(node)) { for (const n of node) hoisted(n,out); return out; }
  if (node.type==='VariableDeclaration' && node.kind==='var') for (const d of node.declarations) patternNames(d.id,out);
  if (node.type==='FunctionDeclaration') { out.push(node.id.name); return out; }
  if (/Function/.test(node.type)) return out;
  for (const key of Object.keys(node)) if (key!=='type' && node[key] && typeof node[key]==='object') hoisted(node[key],out);
  return out;
}
function blockNames(body) {
  const out=[];
  for (const s of body) {
    if (s.type==='VariableDeclaration' && s.kind!=='var') for (const d of s.declarations) patternNames(d.id,out);
    if (s.type==='ClassDeclaration') out.push(s.id.name);
  }
  return out;
}
const child=(scope,names)=>({names:new Set(names),parent:scope});
function bound(scope,name) { for (let s=scope;s;s=s.parent) if (s.names.has(name)) return true; return false; }
function visitFunction(node,scope,free) {
  const names=[];
  for (const p of node.params) patternNames(p,names);
  if (node.type==='FunctionExpression' && node.id) names.push(node.id.name);
  if (node.body.type==='BlockStatement') { hoisted(node.body.body,names); names.push(...blockNames(node.body.body)); }
  names.push('arguments');
  const inner=child(scope,names);
  for (const p of node.params) patternRefs(p,inner,free);
  if (node.body.type==='BlockStatement') for (const s of node.body.body) visit(s,inner,free);
  else visit(node.body,inner,free);
}
function visit(node,scope,free) {
  if (!node || typeof node!=='object') return;
  if (Array.isArray(node)) { for (const n of node) visit(n,scope,free); return; }
  switch (node.type) {
    case 'Identifier': if (!bound(scope,node.name)) free.add(node.name); return;
    case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression': visitFunction(node,scope,free); return;
    case 'MemberExpression': visit(node.object,scope,free); if (node.computed) visit(node.property,scope,free); return;
    case 'Property': case 'MethodDefinition': case 'PropertyDefinition': if (node.computed) visit(node.key,scope,free); visit(node.value,scope,free); return;
    case 'VariableDeclaration': for (const d of node.declarations) { patternRefs(d.id,scope,free); visit(d.init,scope,free); } return;
    case 'BlockStatement': case 'StaticBlock': { const inner=child(scope,blockNames(node.body)); for (const s of node.body) visit(s,inner,free); return; }
    case 'ForStatement': case 'ForInStatement': case 'ForOfStatement': {
      const decl=node.init||node.left;
      const inner=child(scope,decl && decl.type==='VariableDeclaration' && decl.kind!=='var'?decl.declarations.flatMap(d=>patternNames(d.id)):[]);
      for (const key of ['init','test','update','left','right','body']) {
        const n=node[key];
        if (n && (key==='left') && n.type!=='VariableDeclaration') patternRefs(n,inner,free), n.type==='Identifier' && visit(n,inner,free);
        else visit(n,inner,free);
      }
      return;
    }
    case 'SwitchStatement': { visit(node.discriminant,scope,free); const inner=child(scope,blockNames(node.cases.flatMap(c=>c.consequent))); for (const c of node.cases) { visit(c.test,inner,free); visit(c.consequent,inner,free); } return; }
    case 'CatchClause': { const inner=child(scope,patternNames(node.param)); visit(node.body,inner,free); return; }
    case 'LabeledStatement': visit(node.body,scope,free); return;
    case 'BreakStatement': case 'ContinueStatement': return;
    case 'AssignmentExpression': if (node.left.type==='Identifier') visit(node.left,scope,free); else patternRefs(node.left,scope,free); visit(node.right,scope,free); return;
  }
  for (const key of Object.keys(node)) if (!['type','start','end','loc','range'].includes(key)) visit(node[key],scope,free);
}
function freeNames(node) { const free=new Set(); visit(node,child(null,[]),free); return free; }
function declaredNames(stmt) {
  if (stmt.type==='FunctionDeclaration' || stmt.type==='ClassDeclaration') return [stmt.id.name];
  if (stmt.type==='VariableDeclaration') return stmt.declarations.flatMap(d=>patternNames(d.id));
  return [];
}

/** -> {source, included, skipped}: the ES2020 body (prelude, extracted simulation, entry). */
export function buildSimSource({dev=false}={}) {
  const acorn=require('acorn');
  const parse=text=>acorn.parse(text,{ecmaVersion:'latest',sourceType:'script'});
  const statements=[];
  for (const file of SOURCES) {
    const text=read(file);
    parse(text).body.forEach((node,order)=>{
      if (node.type==='ExpressionStatement' && node.directive) return;
      statements.push({file,order,node,text:text.slice(node.start,node.end),declares:declaredNames(node),free:freeNames(node)});
    });
  }
  const entryText=read(ENTRY)+(dev?'\n'+DEV_TAIL:'');
  const entryAst=parse(entryText);
  const provided=new Set(entryAst.body.flatMap(declaredNames));
  for (const file of PRELUDE) for (const n of parse(read(file)).body.flatMap(declaredNames)) provided.add(n);
  const declaredBy=new Map();
  for (const s of statements) for (const n of s.declares) if (!provided.has(n)) declaredBy.set(n,s);
  // Names whose declaration leans on the browser, directly or through another such name.
  const tainted=new Set();
  for (let changed=true;changed;) {
    changed=false;
    for (const s of statements) for (const n of s.declares) {
      if (tainted.has(n) || provided.has(n)) continue;
      if ([...s.free].some(f=>BROWSER.has(f) || (tainted.has(f) && !s.declares.includes(f)))) { tainted.add(n); changed=true; }
    }
  }
  const included=new Set(), names=new Set(), errors=[], skipped=[];
  const need=(name,from)=>{
    if (names.has(name) || provided.has(name) || BUILTINS.has(name)) return;
    const s=declaredBy.get(name);
    if (!s) { errors.push(`${name} (needed by ${from}) is not declared in the simulation sources`); return; }
    if (tainted.has(name)) { errors.push(`${name} (needed by ${from}) depends on the browser`); return; }
    include(s);
  };
  const include=s=>{
    if (included.has(s)) return;
    included.add(s);
    for (const n of s.declares) names.add(n);
    for (const f of s.free) if (!s.declares.includes(f)) need(f,s.declares[0]||s.file+' statement '+s.order);
  };
  for (const f of freeNames(entryAst)) need(f,ENTRY);
  for (const file of PRELUDE) for (const f of freeNames(parse(read(file)))) if (!provided.has(f) && !BUILTINS.has(f)) errors.push(`${file} uses ${f}`);
  // Top-level statements that declare nothing but touch included tables (loops filling `boxes`,
  // `moves`, ...). UI statements (they reach the browser) are skipped and listed.
  for (let changed=true;changed;) {
    changed=false;
    for (const s of statements) {
      if (included.has(s) || s.declares.length || ![...s.free].some(f=>names.has(f))) continue;
      if ([...s.free].some(f=>BROWSER.has(f) || tainted.has(f) || (!names.has(f) && !BUILTINS.has(f) && !declaredBy.has(f) && !provided.has(f)))) {
        if (!skipped.includes(s)) skipped.push(s);
        continue;
      }
      include(s);
      changed=true;
    }
  }
  if (errors.length) throw Error('Server simulation build failed:\n  '+[...new Set(errors)].join('\n  '));
  const parts=[];
  for (const file of PRELUDE) parts.push(`// ---- ${file}\n`+read(file).trim());
  for (const file of SOURCES) {
    const picked=statements.filter(s=>s.file===file && included.has(s));
    if (picked.length) parts.push(`// ---- extracted from ${file}\n`+picked.map(s=>s.text).join('\n'));
  }
  parts.push(`// ---- ${ENTRY}\n`+entryText.trim());
  return {source:parts.join('\n\n')+'\n',
    included:[...included].map(s=>s.declares.join(',')||`${s.file}#${s.order}`),
    skipped:skipped.map(s=>`${s.file}#${s.order}: ${s.text.split('\n')[0].slice(0,90)}`)};
}

// Development-only hooks (never in dist/): direct stepping and state snapshots for the golden
// bot (tools/story-bot.mjs) and the source-vs-bundle tests.
const DEV_TAIL=`api._dev = {
  reset: function (level, pilot, shieldWait, seed) { codeShots = []; clearedAt = -1; clearedHash = ''; resetRun(level, pilot, shieldWait, seed); },
  step: function (mask) { inputFrame = ArcadeReplay.frameOf(mask); update(); },
  state: function () { return simState(); },
  cleared: function () { return clearedAt; },
  snapshot: function () { return structuredClone({ s: simState(), r: cosmeticRandom.state ? cosmeticRandom.state() : null, inputFrame: inputFrame, clearedAt: clearedAt, clearedHash: clearedHash }); },
  restore: function (snap) {
    var c = structuredClone(snap), s = c.s;
    mode = s.mode; time = s.time; levelIndex = s.levelIndex; camera = s.camera; shake = s.shake; banner = s.banner;
    transition = s.transition; phaseShift = s.phaseShift; vaultBeam = s.vaultBeam; player = s.player; boss = s.boss;
    bullets = s.bullets; hazards = s.hazards; sparks = s.sparks; impacts = s.impacts; codeShots = s.codeShots;
    inputFrame = c.inputFrame; clearedAt = c.clearedAt; clearedHash = c.clearedHash;
  }
};`;

/** The ES2020 source simulation evaluated directly (Node's vm), for tests and tools. */
export function loadSourceSim({dev=false}={}) {
  const vm=require('node:vm');
  const {source}=buildSimSource({dev});
  // Same version string as the committed bundle, so version checks behave identically
  // (node tools/build-server-sim.mjs --check catches a stale bundle).
  const header=fs.existsSync(BUNDLE_PATH)?/^var ARCADE_SIM_VERSION = '([0-9a-f]{16})';/.exec(fs.readFileSync(BUNDLE_PATH,'utf8')):null;
  const context=vm.createContext({structuredClone,ARCADE_SIM_VERSION:header?header[1]:buildBundle().version});
  vm.runInContext(`var ArcadeSim = (function () {\n'use strict';\n${source}\nreturn api;\n})();`,context,{filename:'arcade-sim.source.js'});
  return context.ArcadeSim;
}

const HELPERS_NOTE='// Generated by tools/build-server-sim.mjs from the game sources. Do not edit; see docs/SERVER-SIM.md.';
export function versionOf(body) { return crypto.createHash('sha256').update(body,'utf8').digest('hex').slice(0,16); }
export const headerLine=version=>`var ARCADE_SIM_VERSION = '${version}';`;

// ES5 output compiles for-of, array spread and array destructuring as plain index loops (TypeScript
// without downlevelIteration). That is several times faster in goja than iterator helpers, but
// only correct for arrays, so every for-of/spread source must be a form known to give an array.
// Iterator calls such as `lanes.entries()` are wrapped in Array.from. Anything else fails the
// build; tests replay the same runs through the ES2020 source and the bundle to catch the rest.
const ARRAY_CALLS=new Set(['map','filter','slice','concat','entries','keys','values','from']);
function arraysOnly(source) {
  const acorn=require('acorn'),walk=require('acorn-walk');
  const ast=acorn.parse(source,{ecmaVersion:'latest',sourceType:'script'});
  const edits=[],errors=[];
  const check=(node,where)=>{
    if (node.type==='Identifier' || node.type==='MemberExpression' || node.type==='ArrayExpression') return;
    if (node.type==='CallExpression' && node.callee.type==='MemberExpression' && !node.callee.computed) {
      const name=node.callee.property.name, onObject=node.callee.object.type==='Identifier' && ['Object','Array'].includes(node.callee.object.name);
      if (['entries','keys','values'].includes(name) && !onObject) { edits.push(node); return; }
      if (ARRAY_CALLS.has(name)) return;
    }
    errors.push(`${where} over \`${source.slice(node.start,node.end).slice(0,60)}\` may not be an array`);
  };
  walk.full(ast,node=>{
    if (node.type==='ForOfStatement') check(node.right,'for-of');
    if (node.type==='ArrayExpression' || node.type==='CallExpression' || node.type==='NewExpression')
      for (const e of node.elements||node.arguments) if (e && e.type==='SpreadElement') check(e.argument,'spread');
  });
  if (errors.length) throw Error('Server simulation build failed:\n  '+errors.join('\n  '));
  let out=source;
  for (const node of edits.sort((a,b)=>b.start-a.start)) out=out.slice(0,node.start)+'Array.from('+out.slice(node.start,node.end)+')'+out.slice(node.end);
  return out;
}

/** -> {bundle, version, body, skipped}. */
export function buildBundle() {
  const ts=require('typescript');
  const built=buildSimSource();
  const source=arraysOnly(built.source),skipped=built.skipped;
  const out=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES5,module:ts.ModuleKind.CommonJS,moduleDetection:ts.ModuleDetectionKind.Legacy,
    removeComments:true,alwaysStrict:false,newLine:ts.NewLineKind.LineFeed}});
  if (out.diagnostics?.length) throw Error('TypeScript: '+out.diagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('\n'));
  const inner=out.outputText.replace(/^"use strict";\n/,'').trim();
  const body=[HELPERS_NOTE,
    'var ArcadeSim = (function () {',
    '"use strict";',
    inner,
    'return api;',
    '})();',
    'if (typeof module !== "undefined" && module && module.exports) module.exports = ArcadeSim;',
    ''].join('\n');
  const version=versionOf(body);
  return {bundle:headerLine(version)+'\n'+body,version,body,skipped};
}

export const versionScript=version=>`/* Generated by tools/build-server-sim.mjs: the replay simulation version the browser stamps on
 * its logs. It equals ARCADE_SIM_VERSION in dist/arcade-sim.server.js. */\nvar ARCADE_SIM_VERSION = '${version}';\n`;

if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const {bundle,version,skipped}=buildBundle();
  const check=process.argv.includes('--check');
  const files=[[BUNDLE_PATH,bundle],[VERSION_PATH,versionScript(version)]];
  if (check) {
    const stale=files.filter(([file,text])=>!fs.existsSync(file) || fs.readFileSync(file,'utf8')!==text).map(([file])=>path.relative(root,file));
    if (stale.length) { console.error('Stale: '+stale.join(', ')+'. Run node tools/build-server-sim.mjs and commit the result.'); process.exit(1); }
    console.log(JSON.stringify({status:'passed',kind:'server-sim-up-to-date',version}));
  } else {
    for (const [file,text] of files) { fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,text); }
    console.log(JSON.stringify({status:'built',version,bytes:Buffer.byteLength(bundle),bundle:path.relative(root,BUNDLE_PATH),
      skippedTopLevelStatements:skipped},null,2));
  }
}
