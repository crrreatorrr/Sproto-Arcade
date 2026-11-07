'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),ctx=vm.createContext({console});
for(const p of ['density-attacks.js','phase-powerups.js','runtime/contract.js','runtime/core/world.js'])vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),ctx,{filename:p});
const A=ctx.Arcade,phase={mode:'fixed',spawn:{x:120,y:600},enter(w){w.platform({id:'floor',x:0,y:600,w:1280});},update(){}};
const world=(phaseIndex=1,number=1)=>new A.World({id:'pacing-fixture',number,phases:[phase,phase]},{phase:phaseIndex,seed:93});
const check=(name,fn)=>{fn();console.log('PASS '+name);};
check('both campaign phases share caps and preserve direction and exact travel',()=>{
 for(const rule of ['ordinary','dash','shield'])for(const pi of [0,1]){
  const w=world(pi),h=w.hazard({id:'travel',rule,x:0,y:0,w:1,h:1,vx:-12,vy:16,active:13,windup:99});
  assert.ok(Math.hypot(h.vx,h.vy)<=(rule==='ordinary'?6:8)+1e-9);
  assert.ok(Math.abs(h.vx/h.vy+12/16)<1e-12);assert.ok(Math.abs(h.vx*h.active+156)<1e-9);assert.ok(Math.abs(h.vy*h.active-208)<1e-9);
  assert.equal(h.windup,99);assert.equal(h.authoredSpeed,20);
  for(let i=0;i<h.windup+h.active;i++)w.updateHazards();
  assert.ok(Math.abs(h.x+156)<1e-8);assert.ok(Math.abs(h.y-208)<1e-8);
 }
});
check('slow and stationary geometry stay authored and unnumbered fixtures bypass caps',()=>{
 for(const [vx,vy] of [[0,0],[1,2]]){const h=world().hazard({id:'slow',vx,vy,active:13});assert.equal(h.vx,vx);assert.equal(h.vy,vy);assert.equal(h.active,13);}
 const h=world(1,null).hazard({id:'fast',vx:150,active:5});assert.equal(h.vx,150);assert.equal(h.active,5);
});
check('phase two pressure starts after introduction and respects cadence without replacing cue',()=>{
 const w=world();w.cue('critical lesson',99);w.phaseTick=599;assert.equal(w.pressure({id:'p',start:0}),null);
 w.phaseTick=600;const h=w.pressure({id:'p',start:0,windup:5});assert.ok(h);assert.equal(h.windup,75);assert.equal(w.cueText,'critical lesson');
 assert.equal(w.pressure({id:'p',start:0}),null);w.phaseTick=601;assert.equal(w.pressure({id:'p',start:0}),null);
 const p1=world(0);p1.phaseTick=660;assert.equal(p1.pressure({id:'p'}),null);
});
check('pressure is slow, visible, committed and leaves low/high defensive routes',()=>{
 const w=world();w.phaseTick=660;const low=w.pressure({id:'low',lane:'low'});assert.equal(Math.hypot(low.vx,low.vy),2.5);assert.ok(low.x-w.player.x>=360);assert.ok(low.y>=w.camera.y+240);assert.ok(low.y+low.h<=680);assert.ok(low.y<w.player.y&&low.y+low.h>w.player.y-52);
 const high=w.pressure({id:'high',lane:'high'});assert.ok(high.y+high.h<w.player.y-52);
 const vx=low.vx,vy=low.vy;w.player.x=900;w.player.y=260;for(let i=0;i<76;i++)w.updateHazards();assert.equal(low.vx,vx);assert.equal(low.vy,vy);
});
check('population cap is global and expiry allows later emissions',()=>{
 const w=world();w.phaseTick=660;assert.ok(w.pressure({id:'p'}));assert.ok(w.pressure({id:'q'}));assert.equal(w.pressure({id:'r'}),null);
 for(let i=0;i<676;i++)w.updateHazards();assert.equal(w.hazards.length,0);w.phaseTick=840;assert.ok(w.pressure({id:'p'}));
});
check('protected intervals and unresolved critical fronts clear all pressure immediately',()=>{
 const w=world();w.phaseTick=660;w.pressure({id:'p'});assert.equal(w.pressure({id:'p',enabled:false}),null);assert.equal(w.hazards.length,0);
 w.phaseTick=840;w.pressure({id:'p'});w.hazard({id:'mandatory',rule:'dash',windup:90,active:1});assert.equal(w.hazards.filter(h=>h.pressure).length,0);
 w.phaseTick=1020;assert.equal(w.pressure({id:'p'}),null);w.hazards[0].resolved=true;w.phaseTick=1200;assert.ok(w.pressure({id:'p'}));
});
check('pressure style cycling and dedup consume no combat RNG and restart cleanly',()=>{
 const w=world(),control=world(),sprites=[];
 for(let n=0;n<5;n++){w.hazards=[];w.phaseTick=660+n*180;const h=w.pressure({id:'p',styles:['orb','seed','diamond','roller','bolt']});sprites.push(h.sprite);assert.equal(w.pressure({id:'p'}),null);}
 assert.equal(sprites.join(','),'orb,seed,diamond,roller,bolt');assert.equal(w.attackRandom(),control.attackRandom());
 w.restart();assert.equal(w.hazards.length,0);w.phaseTick=660;assert.ok(w.pressure({id:'p'}));w.enterPhase(0,true);assert.equal(w.pressureTicks.size,0);
});
check('near-side spawn defers and scrolling cameras retain visible warning bounds',()=>{
 const w=world();w.phaseTick=660;assert.equal(w.pressure({id:'near',side:'left'}),null);
 w.camera={x:2200,y:-1800};w.player.x=2300;w.player.y=-1550;const h=w.pressure({id:'scroll',lane:'aimed',speed:999});assert.ok(h);assert.ok(h.x>=2200&&h.x+h.w<=3480);assert.ok(h.y>=-1560);assert.ok(Math.hypot(h.vx,h.vy)<=3+1e-9);assert.ok(h.active<=900);
});
console.log('8 pacing fixtures passed');
