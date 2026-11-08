/* Crash guard for both pages (browser only; never part of the server sim bundle).
 *
 * One thrown error must not freeze the game forever. The rAF loops (game.js story loop,
 * rework.js Machine Trials loop) run each frame through ArcadeCrash.runFrame and always
 * reschedule. A frame that throws ends there (no further fixed steps on a half-applied state)
 * and is counted; CRASH_HALT_FRAMES failing frames in a row halt the game: the loops stop
 * stepping and a "Something broke" panel offers Reload. A single bad frame followed by a good
 * one just resets the streak.
 *
 * Window `error` and `unhandledrejection` feed the same counter. An uncaught error while the page
 * scripts are still starting (before DOMContentLoaded) is a boot failure: the panel offers Retry.
 * Console output is rate-limited: each distinct error is logged once with its stack (at most
 * CRASH_LOG_LIMIT), later ones are only counted.
 *
 * ArcadeCrash.onCrash(fn) is the hook for an opt-in crash reporter (hub Diagnostics, later).
 * Nothing here sends data anywhere. */
(function(root){
'use strict';
const CRASH_HALT_FRAMES=3,CRASH_LOG_LIMIT=5,PANEL_ID='crash-panel';

function describe(error){
 if(error instanceof Error)return{message:error.name+': '+error.message,stack:error.stack||''};
 let message;try{message=typeof error==='string'?error:(JSON.stringify(error)??String(error));}catch{message=String(error);}
 return{message,stack:''};
}

class CrashGuard{
 constructor(haltFrames=CRASH_HALT_FRAMES,logLimit=CRASH_LOG_LIMIT,log=(...args)=>console.error(...args)){
  this.haltFrames=haltFrames;this.logLimit=logLimit;this.log=log;
  this.total=0;this.consecutive=0;this.halted=false;this.suppressed=0;
  this.logged=new Set();this.crashListeners=[];this.haltListeners=[];this.uninstall=null;
 }
 /** fn({source,error,message,stack,total,consecutive,halted}) for every error. Returns an unsubscribe. */
 onCrash(fn){this.crashListeners.push(fn);return()=>{this.crashListeners=this.crashListeners.filter(f=>f!==fn);};}
 /** fn(info) once, when the game halts. Returns an unsubscribe. */
 onHalt(fn){this.haltListeners.push(fn);return()=>{this.haltListeners=this.haltListeners.filter(f=>f!==fn);};}
 frameOk(){this.consecutive=0;}
 frameFailed(error){return this.report(error,'frame');}
 /** source: 'frame' | 'error' | 'unhandledrejection' | 'boot'. Returns whether the game is halted. */
 report(error,source){
  this.total++;this.consecutive++;
  const {message,stack}=describe(error),tipping=!this.halted&&(source==='boot'||this.consecutive>=this.haltFrames);
  if(tipping)this.halted=true;
  this.write(source,message,error);
  const info={source,error,message,stack,total:this.total,consecutive:this.consecutive,halted:this.halted};
  for(const fn of this.crashListeners.slice())this.safely(fn,info);
  if(tipping){
   this.log('[Crash] game halted after '+this.consecutive+' failing frame(s) in a row ('+this.total+' error(s) this session)');
   for(const fn of this.haltListeners.slice())this.safely(fn,info);
  }
  return this.halted;
 }
 resume(){this.halted=false;this.consecutive=0;}
 /**
  * One guarded frame. step(now) returns false when it proves nothing (the sim is running but no
  * fixed step fell due, e.g. on a 120 Hz screen); onThrow() drops the step backlog.
  */
 runFrame(step,now,onThrow){
  try{if(!this.halted&&step(now)!==false)this.frameOk();}
  catch(err){try{onThrow?.();}catch{/* the error being reported matters more */}this.frameFailed(err);}
 }
 /** Listens on target (window). isBooting() true means an uncaught error is a boot failure. */
 installGlobal(target,isBooting=()=>false){
  this.uninstall?.();
  const onError=e=>{e.preventDefault?.();this.report(e.error??e.message??'Unknown error',isBooting()?'boot':'error');};
  const onRejection=e=>{e.preventDefault?.();this.report(e.reason,'unhandledrejection');};
  target.addEventListener('error',onError);target.addEventListener('unhandledrejection',onRejection);
  this.uninstall=()=>{target.removeEventListener('error',onError);target.removeEventListener('unhandledrejection',onRejection);this.uninstall=null;};
 }
 uninstallGlobal(){this.uninstall?.();}
 write(source,message,error){
  if(this.logged.has(message)||this.logged.size>=this.logLimit){this.suppressed++;return;}
  this.logged.add(message);this.log('[Crash] '+source+':',error);
  if(this.logged.size===this.logLimit)this.log('[Crash] further errors are counted but not logged');
 }
 safely(fn,info){try{fn(info);}catch(err){this.write(info.source,'listener: '+describe(err).message,err);}}
}

const STYLE='#'+PANEL_ID+'{position:absolute;inset:0;z-index:50;display:grid;place-items:center;padding:12px;text-align:center;background:radial-gradient(ellipse,#211122f0 0%,#160c1be8 60%,#0b0610d0 100%)}'+
 '#'+PANEL_ID+' .crash-card{max-width:min(460px,90%)}#'+PANEL_ID+' h2{margin:0 0 .4em;font:900 italic clamp(22px,4vw,48px)/1 Georgia,serif;color:#ffcc59}'+
 '#'+PANEL_ID+' p{margin:0 0 1.1em;font-weight:650;color:#fff0c9}';

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
const api={CRASH_HALT_FRAMES,CRASH_LOG_LIMIT,PANEL_ID,CrashGuard,guard,showPanel,
 onCrash:fn=>guard.onCrash(fn),
 runFrame:(step,now,onThrow)=>guard.runFrame(step,now,onThrow)};
root.ArcadeCrash=api;
if(typeof module==='object'&&module.exports)module.exports=api;

// In a page: wire the window handlers and the panel.
if(typeof window!=='undefined'&&typeof document!=='undefined'&&root===window){
 let booting=document.readyState==='loading';
 if(booting)document.addEventListener('DOMContentLoaded',()=>{booting=false;});
 guard.installGlobal(window,()=>booting);
 guard.onHalt(info=>{
  const show=()=>showPanel(document,info.source==='boot'?'retry':'reload',()=>location.reload());
  if(document.body)show();else document.addEventListener('DOMContentLoaded',show);
 });
}
})(typeof globalThis!=='undefined'?globalThis:this);
