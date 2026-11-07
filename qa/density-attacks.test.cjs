/* Exercise real swept contacts across every campaign phase and escape altitude. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope=vm.createContext({});
for(const file of ['runtime/contract.js','runtime/core/world.js','density-attacks.js'])vm.runInContext(fs.readFileSync(file,'utf8'),scope);
const D=scope.ArcadeDensityAttacks,swept=scope.Arcade.sweptContact;
const arena={left:0,top:180,right:1280,bottom:700};
let cases=0,missiles=0;
for(let stage=1;stage<=13;stage++)for(const phase of [0,1])for(const x of [80,640,1200])for(const y of [180,240,390,650,700]){
 const input={stage,phase,tick:D.START,arena,player:{x,y},enabled:true,liveCount:0};
 const original=JSON.stringify(input),a=D.plan(input),b=D.plan(input);
 assert.equal(JSON.stringify(a),JSON.stringify(b),'repeat calls produce byte-identical schedules');
 assert.equal(JSON.stringify(input),original,'planner never mutates player, bounds or caller state');
 assert.ok(a.shots.length>=12&&a.shots.length<=36,'a substantial, bounded curtain is emitted');
 assert.equal(a.shots.length%D.WAVES,0);assert.ok(a.lane.bottom-a.lane.top>=180);
 const escapeY=Math.max(a.lane.top+36,Math.min(a.lane.bottom-36,y));
 const body={x:x-20,y:escapeY-32,w:40,h:64};
 for(const s of a.shots){
  assert.equal(s.vy,0);assert.ok(Math.abs(s.vx)>=1.25&&Math.abs(s.vx)<=1.65+1e-9);
  assert.ok(s.w>=32&&s.w<=44);assert.equal(s.w,s.h);assert.equal(s.coreScale,.65);
  assert.ok(s.windup>=100);assert.ok(Math.abs(s.x+s.w/2-x)>=360);
  assert.ok(s.y+s.h<=a.lane.top||s.y>=a.lane.bottom,'even full art stays out of the green corridor');
  // Analytical swept test over the complete lifetime is stricter than
  // individual fixed ticks, and includes the full sprite rather than core.
  const end={...s,x:s.x+s.vx*s.active};
  assert.equal(swept(body,body,s,end),false,'standing in the marked gap avoids the entire committed trajectory');
  const originalBody={x:x-20,y:y-32,w:40,h:64};
  assert.equal(swept(originalBody,originalBody,s,end),false,'initial committed player altitude is safe even at arena boundaries');
  assert.ok(s.artPath.includes(`/missiles/${String(stage).padStart(2,'0')}/`));
  missiles++;
 }
 assert.ok(a.shots.some(s=>s.windup===100)&&a.shots.some(s=>s.windup===152),'three distinct slow waves');
 assert.ok(a.lane.until<=D.START+D.PERIOD,'next scheduled volley cannot stack with this one');
 cases++;
}
for(const phase of [0,1])for(let stage=1;stage<=13;stage++){
 const opts={stage,phase,tick:D.START,arena,player:{x:200,y:450},enabled:true};
 assert.equal(D.plan({...opts,blocked:true}).clear,true,'mandatory fronts clear and suppress density');
 assert.equal(D.plan({...opts,enabled:false}).clear,true,'unfinished art cannot enable an attack');
 assert.equal(D.plan({...opts,liveCount:1}),null,'existing missiles prevent stacking');
 assert.equal(D.plan({...opts,tick:D.START-1}),null);assert.ok(D.plan({...opts,tick:D.START+1}).shots.length,'a blocked due tick retries at the first legal opening');
 assert.equal(D.plan({...opts,tick:D.START+1,lastCycle:0}),null,'consumed cycle cannot repeat after clearing a front');
 const later=D.plan({...opts,tick:D.START+D.PERIOD});assert.ok(later.shots.length);
 assert.notEqual(later.shots[0].id,D.plan(opts).shots[0].id);
}
// Scrolling camera origins translate the schedule exactly without drifting lanes.
const base={stage:7,phase:1,tick:D.START,arena,player:{x:200,y:390},enabled:true};
const a=D.plan(base),dx=4700,dy=-1200,b=D.plan({...base,arena:{left:dx,top:arena.top+dy,right:1280+dx,bottom:arena.bottom+dy},player:{x:200+dx,y:390+dy}});
for(let i=0;i<a.shots.length;i++){assert.ok(Math.abs((b.shots[i].x-a.shots[i].x)-dx)<1e-9);assert.ok(Math.abs((b.shots[i].y-a.shots[i].y)-dy)<1e-9);}
assert.equal(D.plan({...base,arena:{left:0,top:0,right:400,bottom:720}}),null,'small arenas defer instead of spawning point blank');
assert.equal(D.plan({...base,stage:14}),null);assert.equal(D.plan({...base,phase:2}),null);
console.log(`PASS ${cases} all-boss/phase/edge-altitude deterministic barrage cases; ${missiles} full-sprite swept escape proofs; warning, speed, density, front suppression and camera translation`);

// Execute the actual legacy hook with the gate flipped only inside this VM.
const source=fs.readFileSync('game.js','utf8'),hook=source.slice(source.indexOf('function updateLegacyDensity('),source.indexOf('function update(){'));
let legacyCases=0;
for(let stage=1;stage<=13;stage++)for(const phase of [1,2]){
 const legacy=vm.createContext({});
 vm.runInContext(fs.readFileSync('density-attacks.js','utf8').replace('enabled:false','enabled:true'),legacy);
 vm.runInContext(`var W=1280,FLOOR=604,LEVELS=[{id:${stage}}],levelIndex=0,mode='play',phaseShift=0,transition=0,vaultBeam=null;
 var boss={phase:${phase},hp:100,move:'idle',age:0,tell:0},player={x:200,y:560,hp:5},moves={},densityShots=[],densityLane=null,densityPhaseClock=0,densityPhaseKey='',densityLastCycle=-1,hits=0;
 function isFlying(){return ${stage===7};}function isCodebreak(){return ${stage===12};}function attackForCodebreak(){return{beam:false};}function playerHeight(){return 110;}function hurt(){hits++;}
 `+hook,legacy);
 for(let tick=0;tick<240;tick++)vm.runInContext('updateLegacyDensity()',legacy);
 assert.ok(vm.runInContext('densityShots.length',legacy)>=12,'legacy hook emits for every boss and both phases');
 for(let tick=0;tick<170;tick++)vm.runInContext('updateLegacyDensity()',legacy);
 assert.ok(vm.runInContext('densityShots.some(s=>s.age>145)',legacy),'separate density pool survives legacy ordinary-bullet timeout');
 assert.equal(vm.runInContext('hits',legacy),0,'actual legacy full-height body remains in committed escape lane');
 vm.runInContext("moves.ceilingSweep={active:120};boss.move='ceilingSweep';boss.age=0;boss.tell=90;updateLegacyDensity()",legacy);
 assert.equal(vm.runInContext('densityShots.length',legacy),0,'actual mandatory-front hook clears density immediately');
 assert.equal(vm.runInContext('densityLane',legacy),null);
 vm.runInContext("boss.move='idle';boss.phase=boss.phase===1?2:1;updateLegacyDensity()",legacy);
 assert.equal(vm.runInContext('densityPhaseClock',legacy),1,'phase checkpoint starts a fresh local clock');
 vm.runInContext("mode='lost';updateLegacyDensity()",legacy);assert.equal(vm.runInContext('densityShots.length',legacy),0);
 legacyCases++;
}
const wrappers=vm.createContext({});
vm.runInContext(`var updates=0,renders=0,powerUpdates=0,powerRenders=0;
 function updateLegacyStage(){return;}function updateLegacyDensity(){updates++;}function updatePhasePowerups(){powerUpdates++;}
 function renderLegacyScene(){return;}function drawLegacyDensity(){renders++;}function drawLegacyPhasePowerups(){powerRenders++;}
 `+source.slice(source.indexOf('function update(){'),source.indexOf('function updateLegacyStage()'))+
 source.slice(source.indexOf('function render(){'),source.indexOf('function renderLegacyScene()')),wrappers);
vm.runInContext('update();render();',wrappers);
assert.equal(vm.runInContext('updates',wrappers),1,'stage early return still runs density simulation');
assert.equal(vm.runInContext('renders',wrappers),1,'render early return still draws density');
assert.equal(vm.runInContext('powerUpdates+powerRenders',wrappers),2,'wrappers preserve adjacent powerup hooks');
console.log(`PASS ${legacyCases} actual legacy phase hooks, long lifetime, full-height body avoidance, front cleanup, phase reset and shared stage/render wrappers`);
