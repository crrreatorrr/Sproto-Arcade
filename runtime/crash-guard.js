/* Crash guard for both pages (browser only; never part of the server sim bundle).
 *
 * One thrown error must not freeze the game forever. The rAF loops (game.js story loop,
 * rework.js Machine Trials loop) run each frame through ArcadeCrash.runFrame and always
 * reschedule. A frame that throws ends there (no further fixed steps on a half-applied state)
 * and is counted; CRASH_HALT_FRAMES failures in a row halt the game: the loops stop stepping and
 * a "Something broke" panel offers Reload. A single bad frame followed by a good one just resets
 * the streak.
 *
 * Window `error` and `unhandledrejection` are counted too, but they only extend a streak that a
 * failing frame started, so they never halt the game by themselves. Browser noise (ResizeObserver
 * loop warnings, cross-origin "Script error.", other origins' scripts, AbortError/NotAllowedError
 * rejections) is ignored, and the events are never preventDefault-ed: the browser still logs them.
 * A same-origin error while the page scripts are still starting (before DOMContentLoaded) is held;
 * it becomes a boot failure (the panel offers Retry) only if the page never reached the point
 * where it starts its loop (ArcadeCrash.markStarted). Otherwise it is an ordinary counted error.
 *
 * Console output is rate-limited: the guard writes at most CRASH_LOG_LIMIT lines (distinct
 * errors by message and stack, the halt line, the "further errors" note). A caught frame error
 * is also handed once to `reportError`, so the browser and page-error checks still see it; the
 * guard's window listener does not count it a second time.
 *
 * ArcadeCrash.onCrash(fn) is the hook for an opt-in crash reporter (hub Diagnostics, later).
 * Nothing here sends data anywhere. */
(function(root){
'use strict';
const CRASH_HALT_FRAMES=3,CRASH_LOG_LIMIT=5,PANEL_ID='crash-panel',MAX_SIGNATURES=100;

/** Browser noise, not a game error: ResizeObserver loop warnings, a cross-origin "Script error."
 * with no error object, an error thrown by another origin's script (extensions, injected ads). */
function isBenignError(ev,origin){
 const message=typeof ev?.message==='string'?ev.message:'';
 if(/ResizeObserver loop/.test(message))return true;
 if((ev?.error===undefined||ev?.error===null)&&/^Script error\.?$/.test(message.trim()))return true;
 if(origin&&ev?.filename){try{if(new URL(ev.filename,origin).origin!==origin)return true;}catch{/* keep it */}}
 return false;
}
/** Rejections that are not game errors: an aborted fetch or media play, autoplay refused. */
function isBenignRejection(reason){return typeof reason==='object'&&reason!==null&&(reason.name==='AbortError'||reason.name==='NotAllowedError');}

function describeTarget(t){
 if(typeof t!=='object'||t===null||typeof t.tagName!=='string')return'';
 const url=typeof t.src==='string'&&t.src?' src="'+t.src+'"':typeof t.href==='string'&&t.href?' href="'+t.href+'"':'';
 return' on <'+t.tagName.toLowerCase()+url+'>';
}
function describe(error){
 if(error instanceof Error)return{message:error.name+': '+error.message,stack:error.stack||''};
 if(typeof error==='string')return{message:error,stack:''};
 if(typeof error==='object'&&error!==null){
  // A DOM Event (an <img> or <script> load failure rejected as-is): name it, not {"isTrusted":true}.
  if((typeof Event!=='undefined'&&error instanceof Event)||(typeof error.type==='string'&&typeof error.isTrusted==='boolean'))return{message:'Event "'+String(error.type)+'"'+describeTarget(error.target),stack:''};
  if(typeof error.message==='string')return{message:(typeof error.name==='string'&&error.name?error.name:'Error')+': '+error.message,stack:typeof error.stack==='string'?error.stack:''};
  try{const json=JSON.stringify(error);if(json&&json!=='{}')return{message:json,stack:''};}catch{/* not JSON */}
  return{message:Object.prototype.toString.call(error),stack:''};
 }
 return{message:String(error),stack:''};
}

class CrashGuard{
 /** surface hands a caught frame error back to the browser once. Left out: globalThis.reportError; null: never. */
 constructor(haltFrames=CRASH_HALT_FRAMES,logLimit=CRASH_LOG_LIMIT,log=(...args)=>console.error(...args),surface){
  this.haltFrames=haltFrames;this.logLimit=logLimit;this.log=log;this.surface=surface;
  this.total=0;this.consecutive=0;this.halted=false;this.suppressed=0;
  this.streakHasFrame=false;this.lines=0;this.logged=new Set();this.surfaced=new WeakSet();
  this.crashListeners=[];this.haltListeners=[];this.uninstall=null;
  this.booting=false;this.started=false;this.bootErrors=[];
 }
 /** fn({source,error,message,stack,total,consecutive,halted}) for every error. Returns an unsubscribe. */
 onCrash(fn){this.crashListeners.push(fn);return()=>{this.crashListeners=this.crashListeners.filter(f=>f!==fn);};}
 /** fn(info) once, when the game halts. Returns an unsubscribe. */
 onHalt(fn){this.haltListeners.push(fn);return()=>{this.haltListeners=this.haltListeners.filter(f=>f!==fn);};}
 frameOk(){this.resetStreak();}
 /** Ends the current streak without un-halting (the tab became visible again, boot finished). */
 resetStreak(){this.consecutive=0;this.streakHasFrame=false;}
 frameFailed(error){return this.report(error,'frame');}
 /** source: 'frame' | 'error' | 'unhandledrejection' | 'boot'. Returns whether the game is halted. */
 report(error,source){
  this.total++;
  if(source==='frame')this.streakHasFrame=true;
  // Global errors only extend a streak a failing frame started.
  if(source==='frame'||source==='boot'||this.streakHasFrame)this.consecutive++;
  const {message,stack}=describe(error),tipping=!this.halted&&(source==='boot'||(this.streakHasFrame&&this.consecutive>=this.haltFrames));
  if(tipping)this.halted=true;
  if(this.write(source,message+'\n'+stack,error)&&source==='frame')this.surfaceOnce(error);
  const info={source,error,message,stack,total:this.total,consecutive:this.consecutive,halted:this.halted};
  for(const fn of this.crashListeners.slice())this.safely(fn,info);
  if(tipping){
   this.say(source==='boot'?'[Crash] the game could not start ('+this.total+' error(s) this session)':'[Crash] game halted after '+this.consecutive+' failure(s) in a row ('+this.total+' error(s) this session)');
   for(const fn of this.haltListeners.slice())this.safely(fn,info);
  }
  return this.halted;
 }
 resume(){this.halted=false;this.resetStreak();}
 /**
  * One guarded frame. step(now) returns false when it proves nothing (the sim is running but no
  * fixed step fell due, e.g. on a 120 Hz screen); onThrow() drops the step backlog.
  */
 runFrame(step,now,onThrow){
  this.started=true;
  try{if(!this.halted&&step(now)!==false)this.frameOk();}
  catch(err){try{onThrow?.();}catch{/* the error being reported matters more */}this.frameFailed(err);}
 }
 /** The page scripts are starting: same-origin window errors are held until endBoot(). */
 beginBoot(){this.booting=true;this.started=false;this.bootErrors=[];}
 /** The page reached the point where it starts (or will start) its loop. */
 markStarted(){this.started=true;}
 /** Startup is over (DOMContentLoaded): held errors are a boot failure only if the page never started. */
 endBoot(){
  if(!this.booting)return;
  this.booting=false;
  const held=this.bootErrors;this.bootErrors=[];
  held.forEach((err,i)=>this.report(err,i===0&&!this.started?'boot':'error'));
  if(!this.halted)this.resetStreak();
 }
 /** Listens on target (window); origin is the page's origin, for ignoring other origins' scripts. */
 installGlobal(target,origin=root.location?.origin){
  this.uninstall?.();
  const onError=e=>{
   // A frame error we handed to reportError: already counted.
   if(typeof e.error==='object'&&e.error!==null&&this.surfaced.has(e.error))return;
   if(isBenignError(e,origin))return;
   const err=e.error??e.message??'Unknown error';
   if(this.booting){this.bootErrors.push(err);return;}
   this.report(err,'error');
  };
  const onRejection=e=>{if(!isBenignRejection(e.reason))this.report(e.reason,'unhandledrejection');};
  target.addEventListener('error',onError);target.addEventListener('unhandledrejection',onRejection);
  this.uninstall=()=>{target.removeEventListener('error',onError);target.removeEventListener('unhandledrejection',onRejection);this.uninstall=null;};
 }
 uninstallGlobal(){this.uninstall?.();}
 /** Logs a distinct error once (within the line cap). Returns true the first time it is seen. */
 write(source,signature,error){
  if(this.logged.has(signature)||this.logged.size>=MAX_SIGNATURES){this.suppressed++;return false;}
  this.logged.add(signature);
  if(!this.say('[Crash] '+source+':',error))this.suppressed++;
  return true;
 }
 /** One console line, within the cap; the last line allowed is the "further errors" note. */
 say(...args){
  if(this.lines>=this.logLimit)return false;
  this.lines++;
  if(this.lines===this.logLimit){this.log('[Crash] further errors are counted but not logged');return false;}
  this.log(...args);return true;
 }
 surfaceOnce(error){
  if(typeof error!=='object'||error===null||this.surfaced.has(error))return;
  const surface=this.surface===undefined?(typeof root.reportError==='function'?e=>root.reportError(e):null):this.surface;
  if(!surface)return;
  this.surfaced.add(error);
  try{surface(error);}catch{/* best effort */}
 }
 safely(fn,info){try{fn(info);}catch(err){const d=describe(err);this.write(info.source,'listener: '+d.message+'\n'+d.stack,err);}}
}

const STYLE='#'+PANEL_ID+'{position:absolute;inset:0;z-index:50;display:grid;place-items:center;padding:12px;text-align:center;background:radial-gradient(ellipse,#211122f0 0%,#160c1be8 60%,#0b0610d0 100%)}'+
 '#'+PANEL_ID+' .crash-card{max-width:min(460px,90%)}#'+PANEL_ID+' h2{margin:0 0 .4em;font:900 italic clamp(22px,4vw,48px)/1 Georgia,serif;color:#ffcc59}'+
 '#'+PANEL_ID+' p{margin:0 0 1.1em;font-weight:650;color:#fff0c9}'+
 // The story mode's primary button (legacy.html), so the panel matches the game on both pages.
 '#'+PANEL_ID+' button{font:900 clamp(10px,1.3vw,15px) system-ui;letter-spacing:.1em;text-transform:uppercase;border:1px solid #fff1bd;background:#ffcc59;color:#21131d;padding:.65em 1.5em;border-radius:3px;cursor:pointer;box-shadow:0 4px 0 #8a4e34;margin:auto}'+
 '#'+PANEL_ID+' button:hover{background:#fff0bc}#'+PANEL_ID+' button:focus-visible{outline:3px solid white;outline-offset:4px}';

/** The "Something broke" panel ('reload' | 'retry'), once, over the game screen. */
function showPanel(doc,kind,reload){
 if(doc.getElementById(PANEL_ID))return null;
 const style=doc.createElement('style');style.textContent=STYLE;(doc.head||doc.body).appendChild(style);
 const host=doc.querySelector('.screen')||doc.body,panel=doc.createElement('div');
 panel.id=PANEL_ID;panel.setAttribute('role','alertdialog');panel.setAttribute('aria-label','Something broke');
 if(host===doc.body)panel.style.position='fixed';
 const card=doc.createElement('div');card.className='crash-card';
 const title=doc.createElement('h2');title.textContent='Something broke';
 const text=doc.createElement('p');text.textContent=kind==='retry'?'Sproto Arcade could not start. Check your connection and try again.':'The game hit an error and paused. Reloading usually fixes it.';
 const button=doc.createElement('button');button.type='button';button.textContent=kind==='retry'?'Retry':'Reload';
 button.addEventListener('click',()=>reload());
 card.appendChild(title);card.appendChild(text);card.appendChild(button);panel.appendChild(card);host.appendChild(panel);
 button.focus?.();
 return panel;
}

const guard=new CrashGuard();
const api={CRASH_HALT_FRAMES,CRASH_LOG_LIMIT,PANEL_ID,CrashGuard,guard,showPanel,isBenignError,isBenignRejection,describe,
 onCrash:fn=>guard.onCrash(fn),
 markStarted:()=>guard.markStarted(),
 runFrame:(step,now,onThrow)=>guard.runFrame(step,now,onThrow)};
root.ArcadeCrash=api;
if(typeof module==='object'&&module.exports)module.exports=api;

// In a page: wire the window handlers and the panel.
if(typeof window!=='undefined'&&typeof document!=='undefined'&&root===window){
 if(document.readyState==='loading'){guard.beginBoot();document.addEventListener('DOMContentLoaded',()=>guard.endBoot());}
 guard.installGlobal(window);
 // Errors while the tab was hidden (no frames ran) must not count toward a halt once it is back.
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')guard.resetStreak();});
 guard.onHalt(info=>{
  const show=()=>showPanel(document,info.source==='boot'?'retry':'reload',()=>location.reload());
  if(document.body)show();else document.addEventListener('DOMContentLoaded',show);
 });
}
})(typeof globalThis!=='undefined'?globalThis:this);
