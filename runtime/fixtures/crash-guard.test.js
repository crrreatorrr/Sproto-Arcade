// Crash guard (runtime/crash-guard.js) and both rAF loops: the story loop in game.js and the
// Machine Trials loop in rework.js. Each loop function is taken from the real source and run with
// stand-ins: one throw never stops the game, a throw inside a fixed step stops further steps that
// frame, CRASH_HALT_FRAMES failing frames in a row halt the game (one halt, stepping stops, the loop
// stays alive), one bad frame recovers, 120 Hz frames still halt, and the console is not spammed.
// Then the guard on its own: window errors are never preventDefault-ed, browser noise and other
// origins are ignored, global errors alone never halt, an early error is a boot failure only when
// the page never started, frame errors reach reportError once, and both pages' ?v= keys are fresh.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const acorn=require('acorn'),walk=require('acorn-walk');
const root=path.resolve(__dirname,'../..');
const {CrashGuard,CRASH_HALT_FRAMES,CRASH_LOG_LIMIT,showPanel,PANEL_ID,isBenignError,isBenignRejection}=require('../crash-guard.js');

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
 const guard=new CrashGuard(CRASH_HALT_FRAMES,CRASH_LOG_LIMIT,(...args)=>log.push(args),null);
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
  assert.ok(h.log.length<=CRASH_LOG_LIMIT,`${name}: ${h.log.length} console lines for 600 failing frames (halt and "further errors" lines included)`);
  assert.ok(h.log[0][1] instanceof Error,'first error logged with its stack');}
 // The loop's error reaches reportError once, so page-error checks still see it.
 {const h=make(n=>n===2),surfaced=[];h.guard.surface=e=>surfaced.push(e);h.start();h.pump(4);
  assert.equal(surfaced.length,1,`${name}: frame error surfaced once`);assert.match(surfaced[0].message,/^boom from/);}
}

// The guard on its own.
{const g=new CrashGuard(3,5,()=>{});g.frameFailed(Error('a'));g.frameFailed(Error('a'));g.frameOk();g.frameFailed(Error('a'));assert.equal(g.halted,false);
 const seen=[];g.onCrash(()=>{throw Error('bad listener');});const off=g.onCrash(i=>seen.push(i.source+':'+i.message));g.report(Error('x'),'frame');off();g.report(Error('y'),'frame');
 assert.deepEqual(seen,['frame:Error: x']);}
/** A stand-in window that records preventDefault. */
function fakeWindow(g,origin='https://game.example'){
 const target=new EventTarget();g.installGlobal(target,origin);
 const fire=(type,extra)=>{const e=Object.assign(new Event(type,{cancelable:true}),extra);target.dispatchEvent(e);return e;};
 return fire;
}
// Window handlers: counted, logged once each, never preventDefault-ed (the browser keeps logging).
{const log=[],g=new CrashGuard(3,5,(...a)=>log.push(a),null),fire=fakeWindow(g),thrown=Error('handler threw');
 const first=fire('error',{error:thrown,message:'handler threw'}),rej=fire('unhandledrejection',{reason:Error('rejected')});
 fire('error',{error:thrown,message:'handler threw'});
 assert.equal(first.defaultPrevented,false,'error events are not preventDefault-ed');assert.equal(rej.defaultPrevented,false,'rejections are not preventDefault-ed');
 assert.equal(g.total,3);assert.equal(g.halted,false,'global errors alone never halt');
 assert.equal(log.filter(a=>/^\[Crash\] (error|unhandledrejection):/.test(a[0])).length,2,'each distinct error logged once');
 g.uninstallGlobal();fire('error',{error:Error('later')});assert.equal(g.total,3);}
// Global errors extend a streak only once a failing frame started it.
{const g=new CrashGuard(3,5,()=>{},null),fire=fakeWindow(g);
 for(let i=0;i<10;i++)fire('unhandledrejection',{reason:Error('fetch '+i)});
 g.frameFailed(Error('f'));assert.equal(g.halted,false,'a streak of one, not eleven');
 fire('error',{error:Error('a')});assert.equal(g.halted,false);fire('error',{error:Error('b')});assert.equal(g.halted,true,'globals can tip a frame streak');
 const r=new CrashGuard(3,5,()=>{},null);r.frameFailed(Error('a'));r.frameFailed(Error('a'));r.resetStreak();r.frameFailed(Error('a'));assert.equal(r.halted,false,'resetStreak clears the streak');}
// Browser noise and other origins are ignored; our own scripts still count.
{const g=new CrashGuard(3,5,()=>{},null),fire=fakeWindow(g);
 fire('error',{message:'ResizeObserver loop completed with undelivered notifications.',error:null});
 fire('error',{message:'Script error.',error:null,filename:''});
 fire('error',{message:'Uncaught Error: ext',error:Error('ext'),filename:'chrome-extension://abc/content.js'});
 fire('error',{message:'Uncaught Error: ad',error:Error('ad'),filename:'https://ads.example/x.js'});
 fire('unhandledrejection',{reason:Object.assign(Error('play() interrupted'),{name:'AbortError'})});
 fire('unhandledrejection',{reason:{name:'NotAllowedError',message:'autoplay refused'}});
 assert.equal(g.total,0,'noise ignored');
 fire('error',{message:'ours',error:Error('ours'),filename:'https://game.example/game.js'});fire('error',{message:'nofile',error:Error('nofile'),filename:''});
 assert.equal(g.total,2,'same-origin errors count');
 assert.equal(isBenignError({message:'Script error.',error:Error('x')},'https://game.example'),false);
 assert.equal(isBenignError({message:'x',error:Error('x'),filename:'stages/01-marina/stage.js'},'https://game.example'),false);
 assert.equal(isBenignRejection(Error('a')),false);}
// Boot: an early same-origin error halts with Retry only if the page never reached its loop.
{const g=new CrashGuard(3,5,()=>{},null),fire=fakeWindow(g);let src=null;g.onHalt(i=>{src=i.source;});
 g.beginBoot();fire('error',{error:new ReferenceError('Arcade is not defined')});assert.equal(g.total,0,'held while booting');
 g.endBoot();assert.equal(g.halted,true);assert.equal(src,'boot');}
{const g=new CrashGuard(3,5,()=>{},null),fire=fakeWindow(g);
 g.beginBoot();fire('error',{error:new TypeError('harmless top-level throw in a stage script')});
 fire('error',{message:'Script error.',error:null});fire('error',{error:Error('ext'),filename:'chrome-extension://abc/x.js'});
 g.markStarted();g.endBoot();
 assert.equal(g.halted,false,'a page that started keeps playing');assert.equal(g.total,1,'counted as an ordinary error');
 g.frameFailed(Error('f'));assert.equal(g.halted,false,'the early error does not shorten a later streak');}
{const g=new CrashGuard(3,5,()=>{},null),fire=fakeWindow(g);
 g.beginBoot();fire('error',{message:'Script error.',error:null});g.endBoot();assert.equal(g.halted,false,'cross-origin noise is never a boot failure');}
// Each new frame error reaches reportError once; the re-dispatched window event is not counted again.
{const surfaced=[];let fire;
 const g=new CrashGuard(10,5,()=>{},e=>{surfaced.push(e);fire('error',{error:e,message:e.message});});fire=fakeWindow(g);
 const at=m=>{try{throw Error(m);}catch(e){return e;}},a1=at('a');
 g.frameFailed(a1);g.frameFailed(a1);g.frameFailed(at('b'));
 assert.equal(surfaced.length,2);assert.equal(surfaced[0],a1);assert.equal(g.total,3,'no double counting');
 fire('error',{error:Error('c')});assert.equal(surfaced.length,2,'global errors are not re-surfaced');}
// Dedupe by message and stack; every guard line (halt, "further errors") fits the cap.
{const log=[],g=new CrashGuard(100,5,(...a)=>log.push(a),null),e1=Error('same'),e2=Error('same'),e3=Error('same');
 e1.stack='Error: same\n    at a (game.js:1:1)';e2.stack='Error: same\n    at b (game.js:9:9)';e3.stack=e1.stack;
 g.frameFailed(e1);g.frameFailed(e2);g.frameFailed(e3);assert.equal(log.length,2,'message+stack dedupe');
 const l2=[],h=new CrashGuard(3,5,(...a)=>l2.push(a),null);for(let i=0;i<20;i++)h.frameFailed(Error('distinct '+i));
 assert.equal(l2.length,5);assert.match(String(l2[4][0]),/further errors are counted but not logged/);assert.ok(l2.some(a=>/halted/.test(String(a[0]))));}
// Non-Error rejection reasons read well.
{const g=new CrashGuard(3,5,()=>{},null),seen=[];g.onCrash(i=>seen.push(i.message));
 g.report({type:'error',isTrusted:true,target:{tagName:'IMG',src:'https://game.example/a.png'}},'unhandledrejection');
 g.report({name:'NetworkError',message:'offline'},'unhandledrejection');g.report({code:7},'unhandledrejection');
 assert.deepEqual(seen,['Event "error" on <img src="https://game.example/a.png">','NetworkError: offline','{"code":7}']);}

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
 assert.match(head.children[0].textContent,new RegExp('#'+PANEL_ID+' button\\{[^}]*background:#ffcc59[^}]*box-shadow:0 4px 0 #8a4e34'),'the panel button looks like the game\'s buttons');
 const doc2={...doc,getElementById:()=>null};const s2=new El('div');doc2.querySelector=()=>s2;showPanel(doc2,'retry',()=>{});assert.equal(s2.find('button').textContent,'Retry');}

// Both pages load the guard before the scripts whose loops use it.
for(const [page,script] of [['legacy.html','game.js'],['index.html','rework.js']]){
 const html=fs.readFileSync(path.join(root,page),'utf8'),guardAt=html.indexOf('src="runtime/crash-guard.js'),scriptAt=html.indexOf(`src="${script}`);
 assert.ok(guardAt>=0&&guardAt<scriptAt,`${page} loads runtime/crash-guard.js before ${script}`);
}
// Every local script on both pages carries ?v=<first 12 hex of its sha256>, so an edit reaches cached players.
for(const page of ['index.html','legacy.html']){
 const html=fs.readFileSync(path.join(root,page),'utf8');let n=0;
 for(const [,file,key] of html.matchAll(/src="([^"?]+)\?v=([0-9a-f]+)"/g)){
  n++;assert.equal(key,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex').slice(0,12),`${page}: ${file}?v= matches the file`);
 }
 assert.ok(n>10,`${page} has cache-keyed scripts`);
}
// The start markers that tell a harmless early error from a page that never started.
assert.match(fs.readFileSync(path.join(root,'rework.js'),'utf8'),/requestAnimationFrame\(loop\);globalThis\.ArcadeCrash\?\.markStarted\(\);/);
assert.match(fs.readFileSync(path.join(root,'game.js'),'utf8'),/\nloadInitialLevel\(\);\n[^\n]*\nglobalThis\.ArcadeCrash\?\.markStarted\(\);\n$/);
console.log(JSON.stringify({status:'passed',kind:'crash-guard',loops:['game.js story','rework.js trials']}));
