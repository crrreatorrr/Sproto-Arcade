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
// Second, shorter barrage (story phase 1 only asks for it): half the waves, entering the row
// pattern two rows on, with the same dodge rules.
for(const stage of [1,13,2,3,4,5,6,7,8,9,10]){
 const first=D.plan({...options,stage}),second=D.plan({...options,stage,tick:D.START+1500,lastCycle:0,cycle:1});
 assert.equal(first.cycle,0);assert.equal(second.cycle,1);
 const wavesOf=plan=>[...new Set(plan.shots.map(s=>Number(s.id.split('-').at(-2))))];
 assert.equal(wavesOf(second).length,Math.floor(wavesOf(first).length/2),'cycle 1 is half the waves');
 const rowOf=(plan,wave)=>{const shots=plan.shots.filter(s=>Number(s.id.split('-').at(-2))===wave),low=Math.max(...shots.map(s=>{const c=D.damageRect(s);return c.y+c.h/2;}));return(low>arena.floor-72?'floor':'middle')+':'+shots.length;};
 for(const wave of wavesOf(second))assert.equal(rowOf(second,wave),rowOf(first,wave+2),'cycle 1 starts two rows into the pattern');
 const length=Math.max(...second.shots.map(s=>s.delay+s.active));
 assert.ok(length>=250&&length<=420,`cycle 1 lasts 250-420 ticks (stage ${stage}: ${length})`);
 assert.ok(length<Math.max(...first.shots.map(s=>s.delay+s.active))-100,'and is clearly shorter than the first');
 for(const shot of second.shots){
  const core=D.damageRect(shot);
  if(core.y+core.h/2>arena.floor-72)assert.ok(core.y+core.h<arena.floor,'cycle 1 floor missiles can be jumped');
  else if(core.y+core.h>arena.floor-110)assert.ok(core.y+core.h<arena.floor-72,'cycle 1 middle rows clear a crouch');
 }
 assert.equal(D.plan({...options,stage,lastCycle:1,cycle:1}),null,'a cycle is planned once');
 assert.equal(D.plan({...options,stage,lastCycle:0}),null,'one barrage unless a later cycle is asked for');
 assert.equal(D.plan({...options,stage,lastCycle:0,cycle:0}),null);
}
// Flight walls (Mudline 3, Moonkeep 7): the opening starts on the saucer, then moves (on Moonkeep far
// enough that a pilot who never steers is hit), and never further than the saucer can fly in time.
for(const stage of [3,7])for(const phase of [0,1])for(const startY of [120,340,560]){
 const flightArena={left:0,right:1280,top:51,bottom:597,floor:startY},plan=D.plan({...options,stage,phase,arena:flightArena,player:{x:260,y:startY},flight:true});
 const waves=[...new Set(plan.shots.map(s=>Number(s.id.split('-').at(-2))))].map(wave=>plan.shots.filter(s=>Number(s.id.split('-').at(-2))===wave));
 const spacing=waves[1][0].delay-waves[0][0].delay,SAUCER=31,SPEED=10.4;
 // Heights where the saucer's 62px band clears every missile core of a wall.
 const safe=wall=>{const ys=[];for(let y=82;y<=566;y++)if(wall.every(s=>{const c=D.damageRect(s);return y+SAUCER<=c.y||y-SAUCER>=c.y+c.h;}))ys.push(y);return ys;};
 let y=Math.max(82,Math.min(566,startY)),moved=0,stationaryHit=false;
 waves.forEach((wall,index)=>{
  const open=safe(wall);
  assert.ok(open.length>=100,'each wall keeps a gap much taller than the saucer');
  assert.ok(open.every(v=>v>=82&&v<=566),'the opening lies inside the flight bounds');
  if(index===0)assert.ok(open.includes(y),'the first wall opens where the saucer already is');
  if(!open.includes(Math.max(82,Math.min(566,startY))))stationaryHit=true;
  const target=open.reduce((a,b)=>Math.abs(b-y)<Math.abs(a-y)?b:a),travel=Math.ceil(Math.abs(target-y)/SPEED);
  assert.ok(travel<=spacing-20,`the next opening is reachable with 20 ticks spare (stage ${stage} phase ${phase}: ${travel} of ${spacing})`);
  moved=Math.max(moved,Math.abs(target-y));y=target;
 });
 if(stage===7&&startY===340)assert.ok(stationaryHit,'on Moonkeep a saucer that never moves vertically is hit');
 if(stage===7&&startY===340)assert.ok(moved>=20,'mid-arena Moonkeep walls ask for real movement');
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
