/* Check the real missile cores against the crouch and jump routes. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const scope=vm.createContext({});
vm.runInContext(fs.readFileSync('density-attacks.js','utf8'),scope);
const D=scope.ArcadeDensityAttacks;
const arena={left:0,top:140,right:1280,bottom:604,floor:604};
const options={phase:0,tick:D.START,arena,player:{x:240,y:604},enabled:true};

let previousSpeed=0,previousWaves=0;
for(const stage of [1,13,2,3,4,5,6,7,8,9,10,11,12]){
 const phaseOne=D.plan({...options,stage});
 const firstSpeed=Math.abs(phaseOne.shots[0].vx);
 const waves=new Set(phaseOne.shots.map(s=>s.id.split('-').at(-2))).size;
 assert.ok(firstSpeed>=previousSpeed && waves>=previousWaves,'difficulty follows campaign order');
 previousSpeed=firstSpeed;
 previousWaves=waves;
 for(const phase of [0,1])for(const [standingHeight,crouchHeight] of [[110,72],[52,30]]){
  const input={...options,stage,phase,standingHeight,crouchHeight};
  const volley=D.plan(input);
  assert.equal(JSON.stringify(D.plan(input)),JSON.stringify(volley));
  assert.ok(volley.shots.length>=25 && volley.shots[0].delay===0);
  assert.ok(Math.max(...volley.shots.map(s=>s.delay))>=290,'fire continues for multiple seconds');
  let middle=0,floor=0;
  for(const shot of volley.shots){
   assert.equal(shot.windup,0);
   assert.equal(shot.vy,0);
   const core=D.damageRect(shot);
   if(core.y+core.h/2>arena.floor-crouchHeight){
    assert.ok(core.y+core.h<arena.floor,'floor missiles have an airborne escape');
    floor++;
   }else if(core.y+core.h>arena.floor-standingHeight){
    assert.ok(core.y+core.h<arena.floor-crouchHeight,'a full tuck clears the actual opaque middle-row core');
    middle++;
   }
  }
  assert.ok(middle>0 && floor>0,'each ground barrage has both dodge types');
 }
}
const opts={...options,stage:1};
for(const change of [{tick:D.START-1},{blocked:true},{enabled:false},{liveCount:1},{lastCycle:0},{stage:14}]){
 assert.equal(D.plan({...opts,...change}),null);
}
for(const vertical of [false,true]){
 const player={x:640,y:380};
 const plan=D.plan({...options,stage:12,phase:1,player,flight:!vertical,vertical});
 assert.equal(plan.shots[0].vertical,vertical);
 const first=plan.shots.filter(s=>s.delay===0);
 for(const shot of first){
  const core=D.damageRect(shot);
  assert.ok(vertical?Math.abs(core.x+core.w/2-player.x)>55:Math.abs(core.y+core.h/2-player.y)>55,'the first moving wall has a reachable opening');
 }
 assert.notEqual(plan.shots.filter(s=>s.delay===0).length,0);
 assert.ok(plan.shots.some(s=>s.delay>300));
}
console.log('PASS both crouch-height scales, floor rows, flight and climb openings, 26 phased patterns, progressive speed and staggered immediate launches');

(async()=>{
 const {loadSourceSim}=await import('../tools/build-server-sim.mjs');
 const sim=loadSourceSim({dev:true}),dev=sim._dev;
 for(let level=0;level<13;level++){
  dev.reset(level,'rivet',0,5);
  const snap=dev.snapshot(),s=snap.s,phase=0;
  s.densityPhaseKey=sim.levels[level].stage+':'+phase;
  s.densityPhaseClock=D.START-1;
  if(level===10)s.boss.attackAge=105;
  else if(level===11)s.boss.age=80;
  else Object.assign(s.boss,{move:'rush',age:66,tell:37});
  s.bullets=[{own:false,x:200,y:400}];
  s.time=500;
  dev.restore(snap);
  dev.step(0);
  const started=dev.state();
  assert.ok(started.densityShots.length,'barrage begins in a safe recovery for '+sim.levels[level].stage);
  assert.equal(started.time,501);
  assert.equal(started.densityPausedTicks,1);
  assert.equal(started.boss.age,s.boss.age);
  assert.equal(started.boss.attackAge,s.boss.attackAge);
  assert.equal(started.camera,s.camera);
  assert.equal(started.bullets.length,0);
  assert.equal(started.codeShots.length,0);
  assert.equal(started.hazards.length,0);
  const startedSnapshot=dev.snapshot();
  dev.step(0);
  const second=JSON.stringify(dev.state());
  dev.restore(startedSnapshot);
  dev.step(0);
  assert.equal(JSON.stringify(dev.state()),second,'restored replay keeps barrage timing');
 }
 // Actual movement and collision paths for both ground lanes.
 dev.reset(0,'rivet',0,5);
 const snap=dev.snapshot();
 const s=snap.s;
 s.time=500;
 Object.assign(s,{densityPhaseKey:'1:0',densityPhaseClock:D.START,densityLastCycle:0});
 const wave=D.plan(opts).shots;
 function contact(shot,mask,steps=1){
  const missile={...shot,delay:0,x:s.player.x-shot.w/2-shot.vx*steps};
  s.densityShots=[missile];
  s.player.inv=0;
  dev.restore(snap);
  dev.step(mask);
  for(let i=1;i<steps;i++)dev.step(mask&32);
  return dev.state().player.hp;
 }
 assert.equal(contact(wave[0],0),4,'standing player is struck by the middle row');
 assert.equal(contact(wave[0],8),5,'tuck clears the middle row');
 const floor=wave.find(shot=>shot.delay===74);
 assert.equal(contact(floor,8),4,'tuck cannot avoid the floor row');
 assert.equal(contact(floor,16|32,12),5,'jump clears the floor-row core');
 console.log('PASS actual Story barrage start and attack isolation for all 13 bosses, replay restore, and crouch/jump contacts');
})().catch(error=>{console.error(error);process.exitCode=1;});
