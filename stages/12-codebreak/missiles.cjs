"use strict";
// Prolonged samples validate actual active travel and guards; legal clears remain in stage controllers.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),runtime=path.resolve(process.argv[2]||path.join(root,'runtime/core/world.js')),scope=vm.createContext({});
const ids=['03-mudline','07-moonkeep','09-hatchery','10-verse','11-rooftop','12-codebreak'];
for(const f of [path.join(root,'density-attacks.js'),path.join(root,'phase-powerups.js'),path.join(root,'runtime/contract.js'),runtime,...ids.map(id=>path.join(root,'stages',id,'stage.js'))])vm.runInContext(fs.readFileSync(f,'utf8'),scope);
const A=scope.Arcade;
const safe={
 '03-mudline':w=>{Object.assign(w.player,{x:220,y:390});Object.assign(w.data,{introduced:true,gateUnlocked:false});},
 '07-moonkeep':w=>{Object.assign(w.player,{x:400,y:390,grounded:false,support:null});Object.assign(w.data,{crossed:true,crossedAt:0});},
 '09-hatchery':w=>Object.assign(w.player,{x:160,y:600,grounded:true,support:'conveyor-floor'}),
 '10-verse':w=>Object.assign(w.player,{x:220,y:350}),
 '11-rooftop':w=>{Object.assign(w.player,{x:4500,y:600,grounded:true});w.camera.x=3860;},
 '12-codebreak':w=>{Object.assign(w.player,{x:260,y:600,grounded:true,support:'summit-floor'});Object.assign(w.data,{countered:1,ventOpenedAt:0});}
};
const protectedStates={
 '03-mudline':[w=>w.player.y=250,w=>w.player.y=550,w=>Object.assign(w.data,{gateUnlocked:true,countered:false,unlockTick:w.phaseTick}),w=>Object.assign(w.data,{gateUnlocked:true,countered:true,unlockTick:w.phaseTick-59})],
 '07-moonkeep':[w=>w.data.crossed=false,w=>w.data.crossedAt=w.phaseTick-59],
 '09-hatchery':[w=>w.player.support='conveyor-first-foot',w=>w.player.grounded=false,w=>Object.assign(w.data.pods[0],{state:'shell',x:w.player.x,born:w.phaseTick-240})],
 '10-verse':[w=>w.phaseTick=420,w=>Object.assign(w.player,{x:640,y:350})],
 '11-rooftop':[w=>w.player.grounded=false,w=>w.player.x=3000,w=>w.player.x=6300,w=>w.player.x=6900,w=>w.player.x=7200],
 '12-codebreak':[w=>w.data.countered=0,w=>w.data.ventOpenedAt=w.phaseTick-59,w=>w.player.grounded=false]
};
const slowSources={'03-mudline':'mudline-slow-missile','07-moonkeep':'moonkeep-slow-missile','09-hatchery':'hatchery-slow-missile','10-verse':'verse-slow-missile','11-rooftop':'goldie.extraction-slow-missile','12-codebreak':'codebreak-slow-missile'};
const report=[];
for(const id of ids){
 const stage=A.stages.get(id),w=new A.World(stage,{phase:1,seed:37});safe[id](w);w.player.hp=100000;for(const t of w.targets)t.hp=t.maxHp=100000;
 let emitted=0,active=0,peak=0,first=null;const hazard=w.hazard.bind(w);w.hazard=s=>{const h=hazard(s);if(s.source===slowSources[id]){assert.ok(s.pressure&&s.missile&&!s.density,'this audit selects only the authored slow-missile helper');emitted++;first??=w.phaseTick;assert.ok(w.phaseTick>=180);assert.equal(h.windup,90);assert.ok(Math.abs(Math.hypot(h.vx,h.vy)-1.1)<1e-9);assert.equal(h.rule,'ordinary');assert.ok(Math.abs(h.x+h.w/2-w.player.x)>=360);}return h;};
 for(let n=0;n<2400;n++){w.step({});assert.equal(w.state,'playing');const pool=w.hazards.filter(h=>h.pressure&&!h.removed),missiles=pool.filter(h=>h.missile);assert.ok(pool.length<=2);assert.ok(missiles.length<=1);peak=Math.max(peak,pool.length);active+=missiles.filter(h=>h.age>h.windup).length;}
 assert.ok(emitted>0,id+' emits');assert.ok(active>0,id+' missile survives warning and travels');
 for(const protect of protectedStates[id]){const q=new A.World(stage,{phase:1});safe[id](q);q.phaseTick=300;q.events=[];protect(q);q.hazard({id:'guard-probe',missile:true,pressure:true,rule:'ordinary',x:30,y:300,w:44,h:18,active:500});q.phase.update(q);assert.equal(q.hazards.some(h=>h.missile),false,id+' protects route/punish');}
 // A stationary committed line leaves a legal vertical evade: ordinary jump on floor,
 // or 120px flight displacement at the open side. Use actual input/physics and no power.
 const evade=new A.World(stage,{phase:1});safe[id](evade);evade.phaseTick=300;evade.events=[];evade.phase.update(evade);const missile=evade.hazards.find(h=>h.missile&&h.source===slowSources[id]);assert.ok(missile,id+' fair pose emits');const velocity=[missile.vx,missile.vy],line=missile.y;
 for(let t=0;t<18;t++)evade.step(['flight','orbit'].includes(evade.phase.mode)?{down:true}:{jump:t===0});
 assert.deepEqual([missile.vx,missile.vy],velocity,'committed aim');assert.ok(Math.abs(evade.player.y-26-(line+9))>35,id+' standard movement exits committed line');assert.equal(evade.player.hp,5,id+' warning permits escape without damage');
 report.push({id,emitted,activeTicks:active,peak,first,guards:protectedStates[id].length});
}
console.log(JSON.stringify(report,null,2));console.log('PASS six-stage missile active travel, total pool, guarded commitments and legal standard movement off committed line.');
