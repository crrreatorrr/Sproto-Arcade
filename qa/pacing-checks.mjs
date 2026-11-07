#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const c=vm.createContext({console});for(const f of ['density-attacks.js','phase-powerups.js','runtime/contract.js','runtime/core/world.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c,{filename:f});
const phase={mode:'fixed',spawn:{x:260,y:600},enter(w){w.platform({id:'floor',x:0,y:600,w:1280});},update(){}};
const stage={id:'pace-fixture',number:8,phases:[phase,phase]};const create=(p=1,s=stage)=>new c.Arcade.World(s,{phase:p});const speed=h=>Math.hypot(h.vx,h.vy);const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const shot=(w,rule,vx=12,vy=9)=>w.hazard({id:rule,rule,x:1000,y:400,w:20,h:20,vx,vy,active:43,windup:31,recovery:12});
test('both phases use same vector speed caps and preserve exact travel',()=>{for(const rule of ['ordinary','dash','shield']){const a=shot(create(0),rule),b=shot(create(1),rule),cap=rule==='ordinary'?6:8;assert(speed(a)<=cap);near(a.vx,b.vx);near(a.vy,b.vy);near(a.active*a.vx,43*12);near(a.active*a.vy,43*9);near(a.vx/a.vy,12/9);assert.equal(a.windup,31);assert.equal(a.recovery,12);}});
test('slower and stationary hazards unchanged; unnumbered fixtures unchanged',()=>{for(const [vx,vy] of [[0,0],[2,1]]){const h=shot(create(),'ordinary',vx,vy);near(h.vx,vx);near(h.vy,vy);assert.equal(h.active,43);}const h=shot(create(1,{...stage,number:undefined}),'ordinary');near(speed(h),15);assert.equal(h.active,43);});
assert.equal(typeof create().pressure,'function','World.pressure API required');
const request={id:'qa-pressure',start:600,period:180,styles:['orb','seed','diamond'],speed:2.5,windup:75,maxAlive:2};
const at=(w,t,extra={})=>{w.phaseTick=t;return w.pressure({...request,...extra});};
test('Phase1 and first 599 ticks stay pressure-free even with early start',()=>{assert.equal(at(create(0),600),null);const w=create();for(let t=0;t<600;t++)assert.equal(at(w,t,{start:0,period:1}),null);assert.equal(w.hazards.length,0);});
test('slow committed warning visible spawn and cue preservation',()=>{const w=create();w.cue('mandatory lesson',123);const h=at(w,600);assert(h&&h.pressure);assert.equal(h.rule,'ordinary');near(speed(h),2.5);assert(h.windup>=75);assert(h.y>=w.camera.y+240);assert(Math.abs(h.x+h.w/2-w.player.x)>=360);assert.equal(w.cueText,'mandatory lesson');const vx=h.vx,vy=h.vy;w.player.x=1000;w.player.y=300;w.updateHazards();near(h.vx,vx);near(h.vy,vy);});
test('stable id/tick dedup and global population cap',()=>{const w=create();assert(at(w,600));assert.equal(at(w,600),null);assert(at(w,780));assert.equal(at(w,960),null);assert.equal(w.hazards.filter(h=>h.pressure).length,2);});
test('distinct style cycle and combat RNG independence',()=>{const w=create(),control=create(),styles=[];for(const t of [600,780,960]){w.hazards=[];styles.push(at(w,t).sprite);}assert.equal(new Set(styles).size,3);for(let i=0;i<20;i++)near(w.attackRandom(),control.attackRandom());});
test('disabled windows remove old pressures',()=>{const w=create();at(w,600);assert.equal(at(w,601,{enabled:false}),null);assert.equal(w.hazards.length,0);});
test('mandatory fronts immediately clear pressure and suppress further pressure',()=>{for(const rule of ['dash','shield']){const w=create();at(w,600);w.hazard({id:'front',rule,x:1100,y:0,w:20,h:720,windup:90,active:200});assert(!w.hazards.some(h=>h.pressure));assert.equal(at(w,780),null);}});
test('unsafe same-side near-edge spawn defers',()=>{const w=create();w.player.x=1200;assert.equal(at(w,600,{side:'right'}),null);});
test('pressure speed and lifetime bounded and no duplicate IDs',()=>{const w=create();const h=at(w,600,{speed:999,maxAlive:99});assert(speed(h)<=3);assert(h.active<=900);assert(h.windup>=75);assert.equal(new Set(w.hazards.map(h=>h.id)).size,w.hazards.length);});
test('retry and phase entry reset pressure state',()=>{const w=create();at(w,600);w.step({retry:true});assert.equal(w.hazards.length,0);assert(at(w,600));w.enterPhase(0,false);assert.equal(w.hazards.length,0);w.enterPhase(1,false);assert(at(w,600));});
console.log(JSON.stringify({status:'passed',kind:'independent-gameplay-pacing-contract',fixtures:passed,limitations:['Synthetic fixtures validate the runtime contract, not human reaction comfort or route fairness.']}));
