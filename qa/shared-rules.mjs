#!/usr/bin/env node
// Independent black-box contract fixtures. No art or UI required.
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const context=vm.createContext({console});
const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
load('runtime/contract.js');
for(const file of fs.readdirSync(path.join(root,'runtime/weapons')).filter(f=>f.endsWith('.js')&&!/test|fixture/.test(f)).sort())load('runtime/weapons/'+file);
load('runtime/core/world.js');
const A=context.Arcade;
const phase=n=>({name:'Contract '+n,mode:'fixed',camera:'fixed',spawn:{x:120,y:600},practiceSpawn:{x:220,y:600},objective:'Fixture',enter(w){w.platform({id:'floor',x:0,y:600,w:1280});},update(){}});
const stage={id:'qa-contract',eligibleWeapons:['prism-rail','echo-decoy'],phases:[phase(0),phase(1)]};
const create=options=>new A.World(stage,options);
let passed=0;function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(e){console.error('FAIL '+name);throw e;}}
const front=(w,rule='dash')=>w.hazard({id:'front',source:'qa-front',rule,x:250,y:0,w:12,h:720,vx:-250,active:2});
test('shield cannot substitute for marked dash',()=>{const w=create();front(w);w.step({shield:true});assert.equal(w.player.hp,4);assert(w.events.some(e=>e.type==='hit'&&e.source==='qa-front'));});
test('active dash counters swept front',()=>{const w=create();front(w);w.step({dash:true});assert.equal(w.player.hp,5);assert(w.events.some(e=>e.type==='counter'&&e.rule==='dash'));});
test('last active dash tick counters front',()=>{const w=create();w.step({dash:true});for(let i=0;i<9;i++)w.step({});assert.equal(w.player.dash,1);w.hazard({id:'last-frame',source:'last-frame',rule:'dash',x:w.player.x+80,y:0,w:12,h:720,vx:-150,active:2});w.step({});assert.equal(w.player.hp,5);assert(w.events.some(e=>e.type==='counter'));});
test('early dash expires before front',()=>{const w=create();w.step({dash:true});for(let i=0;i<12;i++)w.step({});w.hazard({id:'front',source:'early',rule:'dash',x:w.player.x-4,y:0,w:8,h:720,active:2});w.step({});assert.equal(w.player.hp,4);});
test('late dash does not undo prior hit',()=>{const w=create();front(w);w.step({});w.step({dash:true});assert.equal(w.player.hp,4);});
test('shield-only pulse rejects dash',()=>{const w=create();front(w,'shield');w.step({dash:true});assert.equal(w.player.hp,4);});
test('shield-only pulse accepts shield',()=>{const w=create();front(w,'shield');w.step({shield:true});assert.equal(w.player.hp,5);});
test('restart clears transient state and failure in one input',()=>{const w=create();w.hazard({id:'stale',source:'stale',rule:'ordinary',x:900,y:0,w:5,h:5,active:100});w.cue('stale cue');w.lose('test fall');w.step({retry:true});assert.equal(w.state,'playing');assert.equal(w.player.hp,5);assert.equal(w.hazards.length,0);assert(!w.failure);});
test('phase transition clears hazards and reaches phase2',()=>{const w=create();front(w);w.advancePhase();for(let i=0;i<95;i++)w.step({});assert.equal(w.phaseIndex,1);assert.equal(w.state,'playing');assert.equal(w.hazards.length,0);});
test('practice spawn and restart preserve practice phase',()=>{const w=create({practice:true,phase:1});assert.equal(w.phaseIndex,1);assert.equal(w.player.x,220);w.lose('test');w.restart();assert.equal(w.phaseIndex,1);assert.equal(w.player.x,220);});
test('loot draws do not change attack seed stream',()=>{const a=create({seed:42}),b=create({seed:42});if(a.weapons)a.weapons.opportunity('qa',{guaranteed:true});for(let i=0;i<10;i++)assert.equal(a.attackRandom(),b.attackRandom());});
console.log(JSON.stringify({status:'passed',fixtures:passed,kind:'black-box-shared-contract'}));
