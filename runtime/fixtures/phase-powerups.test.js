const assert=require('node:assert/strict'),P=require('../../phase-powerups.js');
const bounds={x:80,y:240,w:700,h:350};
const a=P.create({seed:777,attempt:0,phase:0}),b=P.create({seed:777,attempt:0,phase:0});assert.deepEqual(a,b);
assert.notDeepEqual(a.plans.map(p=>p.at),P.create({seed:777,attempt:1,phase:0}).plans.map(p=>p.at),'fresh attempts change timings even with same UI seed');assert.notEqual(a.plans[0].at,a.plans[1].at,'life and shield have separate random times');
assert.notDeepEqual(a,P.create({seed:777,attempt:0,phase:1}));
for(let tick=0;tick<1800;tick++){P.step(a,{tick,ready:true,bounds});P.step(b,{tick,ready:true,bounds});assert.deepEqual(a,b);assert.ok(a.pickups.length<=2);}
assert.equal(a.pickups.length,0);assert.ok(a.plans.every(p=>p.spawned&&p.done));assert.deepEqual(P.step(a,{tick:9999,ready:true,bounds}),[],'expired pickups never respawn');
const locked=P.create({seed:7});P.step(locked,{tick:9999,ready:false,bounds});assert.equal(locked.pickups.length,0);assert.ok(locked.plans.every(p=>!p.spawned),'asset gate prevents unapproved items');
const ttl=P.create();P.step(ttl,{tick:1000,ready:true,bounds});assert.equal(ttl.pickups.length,2);P.step(ttl,{tick:1239,ready:true,bounds});assert.equal(ttl.pickups.length,2);P.step(ttl,{tick:1240,ready:true,bounds});assert.equal(ttl.pickups.length,0,'uncollected pickup expires exactly at240ticks');
const shield=P.create();P.step(shield,{tick:1000,ready:true,bounds});const item=shield.pickups.find(p=>p.kind==='shield');const events=P.step(shield,{tick:1001,ready:true,player:{...item},bounds});assert.ok(events.some(e=>e.type==='collect'&&e.kind==='shield'));assert.ok(P.activeShield(shield,1600));assert.equal(P.activeShield(shield,1601),false,'collected shield expires at600ticks');const forced=JSON.parse(JSON.stringify(shield));assert.equal(P.absorb(forced,1100,{mandatory:true}),false,'cannot counter mandatory gates');assert.equal(P.activeShield(forced,1100),false,'actual mandatory hit still breaks pickup shield');assert.equal(forced.absorbedAt,1100);assert.ok(P.activeShield(shield,1100),'fresh separate shield remains for ordinary hit case');assert.equal(P.absorb(shield,1100),true);assert.equal(P.absorb(shield,1100),false,'shield absorbs exactly one eligible hit');
const life=P.create();P.step(life,{tick:1000,ready:true,bounds});const heart=life.pickups.find(p=>p.kind==='life');const gains=P.step(life,{tick:1001,ready:true,player:{...heart},bounds}).filter(e=>e.type==='collect'&&e.kind==='life');assert.equal(gains.length,1);assert.equal(Math.min(5,4+gains.length),5);assert.equal(Math.min(5,5+gains.length),5);assert.ok(P.visible({expiresAt:240},179));assert.notEqual(P.visible({expiresAt:240},180),P.visible({expiresAt:240},186));
// Story mode spreads the two items over the phase's expected length (plan item B1).
for(let seed=1;seed<=400;seed++)for(const span of [1400,1800,5000,6603,7200]){
 const spread=P.create({seed,attempt:seed%3,phase:seed%2,span}),early=P.create({seed,attempt:seed%3,phase:seed%2});
 const [first,second]=spread.plans.map(p=>p.at).sort((x,y)=>x-y);
 assert.ok(first>=Math.floor(span*.18)&&first<=Math.floor(span*.40),'first item lands in 18-40% of the span');
 assert.ok(second>=Math.floor(span*.58)&&second<=Math.floor(span*.82),'second item lands in 58-82% of the span');
 assert.deepEqual(spread.plans.map(p=>[p.kind,p.u,p.v]),early.plans.map(p=>[p.kind,p.u,p.v]),'span changes timing only: same draws, same places');
 assert.equal(spread.plans.find(p=>p.kind==='shield').at<spread.plans.find(p=>p.kind==='life').at,early.plans.find(p=>p.kind==='shield').at<early.plans.find(p=>p.kind==='life').at,'same item comes first');
 assert.deepEqual(spread,P.create({seed,attempt:seed%3,phase:seed%2,span}),'a span plan is reproducible');
 const [e1,e2]=early.plans.map(p=>p.at).sort((x,y)=>x-y);
 assert.ok(e1>=180&&e1<=540&&e2-e1>=150&&e2-e1<=450,'without a span the original windows are kept exactly');
}
assert.deepEqual(P.create({seed:9,span:0}),P.create({seed:9}),'span 0 means no span');
{ // A heart waits for a hurt player; a barrage or a hit holds everything back.
 const held=P.create({seed:5,span:1400}),lifeAt=held.plans.find(p=>p.kind==='life').at,shieldAt=held.plans.find(p=>p.kind==='shield').at,last=Math.max(lifeAt,shieldAt);
 for(let tick=0;tick<=last+300;tick++)P.step(held,{tick,ready:true,hold:{life:true},bounds});
 assert.ok(held.plans.find(p=>p.kind==='shield').spawned,'the shield is not held by hold.life');
 assert.ok(!held.plans.find(p=>p.kind==='life').spawned,'a heart never appears while the player is at full health');
 const events=P.step(held,{tick:last+301,ready:true,hold:{life:false},bounds});
 assert.deepEqual(events.filter(e=>e.type==='spawn'),[{type:'spawn',kind:'life'}],'the held heart appears on the first tick it is allowed');
 assert.equal(held.pickups.find(p=>p.kind==='life').expiresAt,last+301+P.PICKUP_TTL,'its four seconds start when it appears');
 const busy=P.create({seed:5,span:1400});
 for(let tick=0;tick<=last+50;tick++)P.step(busy,{tick,ready:false,bounds});
 assert.ok(busy.plans.every(p=>!p.spawned),'nothing spawns while not ready');
 assert.equal(P.step(busy,{tick:last+51,ready:true,bounds}).filter(e=>e.type==='spawn').length,2,'both appear on the first ready tick');
 assert.equal(busy.plans.filter(p=>p.spawned).length,2);
}
console.log('PASS independent seeded pickup plans, varied attempt/phase timing, maxone each,240tick expiry/norespawn,600tick onehit shield, mandatory-gate protection and readiness gate');
// Real World integration with an explicitly test-only accepted-art override.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),root=path.resolve(__dirname,'../..'),scope=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'phase-powerups.js'),'utf8').replace('const assetsReady=false;','const assetsReady=true;'),scope);
for(const file of ['density-attacks.js','runtime/contract.js','runtime/core/world.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),scope);
const W=scope.Arcade.World,stage={id:'item-test',number:7,phases:[{mode:'flight',spawn:{x:200,y:350}},{mode:'flight',spawn:{x:200,y:350}}]},world=new W(stage,{seed:777});
world.phaseTick=1000;world.updatePhasePowerups();assert.equal(world.phasePowerups.pickups.length,2);
Object.assign(world.phasePowerups.pickups.find(p=>p.kind==='life'),{x:600,y:500});
let orb=world.phasePowerups.pickups.find(p=>p.kind==='shield');Object.assign(world.player,{x:orb.x+16,y:orb.y+40});world.updatePhasePowerups();assert.ok(scope.ArcadePhasePowerups.activeShield(world.phasePowerups,1000));
const required=new W(stage,{seed:777});required.phaseTick=1000;required.updatePhasePowerups();const requiredOrb=required.phasePowerups.pickups.find(p=>p.kind==='shield');Object.assign(required.player,{x:requiredOrb.x+16,y:requiredOrb.y+40});required.updatePhasePowerups();required.hit({rule:'dash',source:'required-front'});assert.equal(required.player.hp,4,'pickup shield cannot bypass required dash');assert.equal(scope.ArcadePhasePowerups.activeShield(required.phasePowerups,1000),false,'first actual mandatory hit breaks shield');assert.equal(required.phasePowerups.absorbedAt,1000);world.hit({rule:'ordinary',source:'ordinary'});assert.equal(world.player.hp,5);assert.equal(scope.ArcadePhasePowerups.activeShield(world.phasePowerups,1000),false);world.hit({rule:'ordinary',source:'second'});assert.equal(world.player.hp,5,'same-frame overlapping ordinary hit is blocked by shield absorb grace');world.hit({rule:'dash',source:'required-during-grace'});assert.equal(world.player.hp,4,'mandatory front still damages during grace');for(let t=0;t<60;t++)world.step({});assert.equal(world.player.inv,0);world.hit({rule:'ordinary',source:'after-grace'});assert.equal(world.player.hp,3,'ordinary hit damages after grace expires');
let hp=world.phasePowerups.pickups.find(p=>p.kind==='life');Object.assign(world.player,{x:hp.x+16,y:hp.y+40});world.updatePhasePowerups();assert.equal(world.player.hp,4);world.phaseTick=2000;world.updatePhasePowerups();assert.equal(world.phasePowerups.pickups.length,0);const timings=world.phasePowerups.plans.map(p=>p.at).join();world.lose('retry');world.restart();assert.notEqual(world.phasePowerups.plans.map(p=>p.at).join(),timings);assert.equal(world.player.hp,5);world.enterPhase(1,true);assert.equal(world.phasePowerups.phase,1);assert.equal(world.phasePowerups.pickups.length,0);
const ground=P.create();P.step(ground,{tick:1000,ready:true,surfaces:[]});assert.equal(ground.pickups.length,0,'ground spawning waits for a reachable surface');P.step(ground,{tick:1001,ready:true,surfaces:[{x:100,y:500,w:200}]});assert.equal(ground.pickups.length,2);assert.ok(ground.pickups.every(p=>p.y===468&&p.x>=100&&p.x+p.w<=300));
console.log('PASS real World item collection, extra heart, onehit shield vs mandatory front, phase/reset isolation and ground surface placement (test-only art gate enabled)');
