// Crash guard (runtime/crash-guard.js) and both rAF loops: the story loop in game.js and the
// Machine Trials loop in rework.js. Each loop function is taken from the real source and run with
// stand-ins: one throw never stops the game, a throw inside a fixed step stops further steps that
// frame, CRASH_HALT_FRAMES failing frames in a row halt the game (one halt, stepping stops, the loop
// stays alive), one bad frame recovers, 120 Hz frames still halt, and the console is not spammed.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const acorn=require('acorn'),walk=require('acorn-walk');
const root=path.resolve(__dirname,'../..');
const {CrashGuard,CRASH_HALT_FRAMES,CRASH_LOG_LIMIT,showPanel,PANEL_ID}=require('../crash-guard.js');

/** Source of the named function declarations anywhere in file (top level or inside the IIFE). */
function functions(file,names){
 const text=fs.readFileSync(path.join(root,file),'utf8'),ast=acorn.parse(text,{ecmaVersion:'latest',sourceType:'script'}),out={};
 walk.full(ast,node=>{if(node.type==='FunctionDeclaration'&&names.includes(node.id.name))out[node.id.name]=text.slice(node.start,node.end);});
 for(const name of names)assert.ok(out[name],`${file} declares function ${name}`);
 return names.map(n=>out[n]).join('\n');
}

const DT=1000/60;
function harness(file,names,globals){
 const queued=[],log=[];
 const ctx=vm.createContext({
  ...globals,
  ArcadeCrash:null,
  requestAnimationFrame:fn=>{queued.push(fn);return queued.length;},
 });
 const guard=new CrashGuard(CRASH_HALT_FRAMES,CRASH_LOG_LIMIT,(...args)=>log.push(args));
 ctx.ArcadeCrash={runFrame:(step,now,onThrow)=>guard.runFrame(step,now,onThrow)};
 ctx.globalThis=ctx;
 vm.runInContext(functions(file,names),ctx);
 let now=1000;
 const h={ctx,guard,log,queued,
  start(){ctx.loop(now);this.pump(1);}, // the first pumped frame runs step 1
  pump(frames,stepsPerFrame=1){for(let i=0;i<frames;i++){const calls=queued.splice(0);now+=stepsPerFrame*DT+0.05;for(const fn of calls)fn(now);}}};
 return h;
}

function story(throwsOn){
 let steps=0;
 const h=harness('game.js',['loop','storyFrame'],{
  mode:'play',player:{},replayRecorder:null,inputFrame:null,pressed:new Set(),last:1000,carry:0,
  readKeyboardFrame:()=>({}),render:()=>{},
  update:()=>{steps++;if(throwsOn(steps))throw new Error('boom from a story step');},
 });
 h.steps=()=>steps;return h;
}

function trials(throwsOn){
 let steps=0;
 const el={textContent:'',hidden:true};
 const world={state:'playing',seed:1,tick:0,failure:'',phaseIndex:0,stage:{operator:'x'},restart(){},
  step(){steps++;this.tick++;if(throwsOn(steps))throw new Error('boom from a trials step');}};
 const h=harness('rework.js',['loop','trialsFrame'],{
  world,paused:false,acc:0,last:1000,visibleState:'playing',soundTick:-1,held:new Set(),press:new Set(),
  input:()=>({retry:false}),render:Object.assign(()=>{},{lastCue:''}),overlay:()=>{},$:()=>el,
  recordKey:()=>'',readRecords:()=>({}),records:()=>{},localStorage:{setItem(){}},
 });
 h.steps=()=>steps;return h;
}

for(const [name,make] of [['story (game.js)',story],['trials (rework.js)',trials]]){
 // A single throw: the loop keeps scheduling and the game recovers.
 {const h=make(n=>n===2);h.start();h.pump(5);
  assert.equal(h.queued.length,1,`${name}: loop still scheduled`);
  assert.ok(h.steps()>=5,`${name}: steps continue after one throw`);
  assert.equal(h.guard.total,1);assert.equal(h.guard.halted,false,`${name}: one bad frame does not halt`);}
 // A throwing step ends that frame's fixed steps.
 {const h=make(n=>n>=2);h.start();const before=h.steps();h.pump(1,4);
  assert.equal(h.steps()-before,1,`${name}: no further steps in the frame that threw`);}
 // A streak halts once; stepping stops; the loop stays alive.
 {const h=make(n=>n>=2);let halts=0;h.guard.onHalt(()=>halts++);h.start();h.pump(CRASH_HALT_FRAMES);
  assert.equal(h.guard.halted,true,`${name}: halts after ${CRASH_HALT_FRAMES} failing frames`);
  const at=h.steps();h.pump(60);
  assert.equal(h.steps(),at,`${name}: simulation paused while halted`);
  assert.equal(h.queued.length,1,`${name}: loop alive while halted`);assert.equal(halts,1);}
 // 120 Hz: frames with no step due neither clear nor extend the streak.
 {const h=make(n=>n>=2);h.start();for(let i=0;i<4*CRASH_HALT_FRAMES;i++)h.pump(1,0.5);
  assert.equal(h.guard.halted,true,`${name}: halts at 120 Hz too`);}
 // No console spam.
 {const h=make(n=>n>=2);h.start();for(let i=0;i<600;i++){h.pump(1);if(h.guard.halted)h.guard.resume();}
  assert.ok(h.guard.total>500);
  assert.ok(h.log.length<=CRASH_LOG_LIMIT+2+600/CRASH_HALT_FRAMES,`${name}: ${h.log.length} console lines for 600 failing frames`);
  assert.ok(h.log[0][1] instanceof Error,'first error logged with its stack');}
}

// The guard on its own.
{const g=new CrashGuard(3,5,()=>{});g.frameFailed(Error('a'));g.frameFailed(Error('a'));g.frameOk();g.frameFailed(Error('a'));assert.equal(g.halted,false);
 const seen=[];g.onCrash(()=>{throw Error('bad listener');});const off=g.onCrash(i=>seen.push(i.source+':'+i.message));g.report(Error('x'),'frame');off();g.report(Error('y'),'frame');
 assert.deepEqual(seen,['frame:Error: x']);}
// Window handlers: errors before DOMContentLoaded are boot failures (halt at once, Retry); later ones count.
{const log=[],g=new CrashGuard(3,5,(...a)=>log.push(a)),target=new EventTarget();let booting=true,haltSource=null;
 g.onHalt(i=>{haltSource=i.source;});g.installGlobal(target,()=>booting);
 const fire=(type,extra)=>{const e=Object.assign(new Event(type,{cancelable:true}),extra);target.dispatchEvent(e);return e;};
 booting=false;
 const first=fire('error',{error:Error('handler threw')});fire('unhandledrejection',{reason:Error('rejected')});
 assert.equal(first.defaultPrevented,true);assert.equal(g.total,2);assert.equal(g.halted,false);
 fire('error',{error:Error('handler threw')});assert.equal(g.halted,true);assert.equal(haltSource,'error');
 assert.equal(log.filter(a=>/^\[Crash\] (error|unhandledrejection):/.test(a[0])).length,2,'each distinct error logged once');
 g.uninstallGlobal();fire('error',{error:Error('later')});assert.equal(g.total,3);
 const b=new CrashGuard(3,5,()=>{}),t2=new EventTarget();let src=null;b.onHalt(i=>{src=i.source;});b.installGlobal(t2,()=>true);
 t2.dispatchEvent(Object.assign(new Event('error',{cancelable:true}),{error:new ReferenceError('Arcade is not defined')}));
 assert.equal(b.halted,true);assert.equal(src,'boot');}

// The panel on a stand-in DOM.
{class El{constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.listeners={};this.style={};this.textContent='';}
  setAttribute(k,v){this.attrs[k]=v;}appendChild(c){this.children.push(c);return c;}addEventListener(t,f){(this.listeners[t]??=[]).push(f);}
  text(){return this.textContent+this.children.map(c=>c.text()).join('');}find(tag){for(const c of this.children){if(c.tag===tag)return c;const d=c.find(tag);if(d)return d;}return null;}}
 const head=new El('head'),body=new El('body'),screen=new El('div'),all=[];
 const doc={head,body,createElement:t=>{const e=new El(t);all.push(e);return e;},querySelector:s=>s==='.screen'?screen:null,getElementById:id=>all.find(e=>e.id===id)||null};
 let reloads=0;
 assert.ok(showPanel(doc,'reload',()=>reloads++));assert.equal(showPanel(doc,'reload',()=>reloads++),null,'shown once');
 assert.equal(screen.children.length,1,'panel sits over the game screen');
 assert.match(screen.children[0].text(),/Something broke/);assert.equal(screen.children[0].id,PANEL_ID);
 const button=screen.children[0].find('button');assert.equal(button.textContent,'Reload');button.listeners.click[0]();assert.equal(reloads,1);
 const doc2={...doc,getElementById:()=>null};const s2=new El('div');doc2.querySelector=()=>s2;showPanel(doc2,'retry',()=>{});assert.equal(s2.find('button').textContent,'Retry');}

// Both pages load the guard before the scripts whose loops use it.
for(const [page,script] of [['legacy.html','game.js'],['index.html','rework.js']]){
 const html=fs.readFileSync(path.join(root,page),'utf8'),guardAt=html.indexOf('src="runtime/crash-guard.js'),scriptAt=html.indexOf(`src="${script}`);
 assert.ok(guardAt>=0&&guardAt<scriptAt,`${page} loads runtime/crash-guard.js before ${script}`);
}
console.log(JSON.stringify({status:'passed',kind:'crash-guard',loops:['game.js story','rework.js trials']}));
