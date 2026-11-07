const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),scope=vm.createContext({});
// Isolate the authored encounter contract; qa/density-modern.test.cjs covers the barrage.
for(const file of ['phase-powerups.js','runtime/contract.js','stages/12-codebreak/stage.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),scope);
const stage=scope.Arcade.stages.get('12-codebreak');
function mock(index){const w={phaseTick:0,player:{x:260,y:640,grounded:true},platforms:[],targets:[],hazards:[],events:[],data:{},drops:[],state:'playing',camera:{x:0,y:0},platform(p){this.platforms.push(p);return p;},target(t){this.targets.push(t);return t;},hazard(h){this.hazards.push(h);return h;},cue(t){this.cueText=t;},drop(...args){this.drops.push(args);},advancePhase(){this.state='transition';},clear(){this.state='clear';}};stage.phases[index].enter(w);return w;}
const climb=mock(0);assert.equal(climb.platforms.filter(p=>p.id.startsWith('ascent-')).length,18);assert.equal(climb.platforms.filter(p=>p.id.startsWith('recovery-')).length,4);
climb.phaseTick=150;stage.phases[0].update(climb);assert.equal(climb.hazards[0].source,'12-codebreak/warrant-drop');assert.equal(climb.hazards[0].windup,75);
climb.phaseTick=10000;stage.phases[0].update(climb);assert.equal(climb.state,'playing','timer alone cannot clear climb');
const top=climb.platforms.find(p=>p.id==='ascent-17');climb.player={x:top.x+100,y:top.y,grounded:true,dashWait:0};stage.phases[0].update(climb);assert.equal(climb.state,'playing','upper crossing requires a dash counter');climb.events=[{type:'counter',rule:'dash',source:'12-codebreak/upper-crossing'}];stage.phases[0].update(climb);assert.equal(climb.state,'transition');assert.equal(climb.drops.length,1);
const summit=mock(1);summit.player.y=600;summit.phaseTick=90;stage.phases[1].update(summit);assert.equal(summit.hazards[0].rule,'dash');assert.equal(summit.targets[0].open,false);
summit.phaseTick=250;summit.events=[{type:'counter',rule:'shield',source:'12-codebreak/summit-scanner'}];stage.phases[1].update(summit);assert.equal(summit.targets[0].open,false);
summit.events=[{type:'counter',rule:'dash',source:'12-codebreak/summit-scanner'}];stage.phases[1].update(summit);assert.equal(summit.targets[0].open,true);assert.equal(summit.drops.length,1);
summit.phaseTick=460;summit.events=[];stage.phases[1].update(summit);assert.equal(summit.targets[0].open,false,'vent closes at exact deadline');
summit.phaseTick=690;stage.phases[1].update(summit);assert.equal(summit.hazards.filter(h=>h.source==='12-codebreak/warrant-drop').length,1);
summit.targets[0].onDefeat();assert.equal(summit.state,'clear');
for(const phase of stage.phases){assert.ok(phase.practiceSpawn);assert.ok(phase.objective);assert.ok(phase.machine);}
console.log('PASS Codebreak authored geometry, climb objective, scanner gate, shield rejection, vent timing, return attack and defeat fixtures');
// Optional real-runtime verification. Supply a world.js path during packet isolation.
const runtime=process.argv[2]||(fs.existsSync(path.join(root,'runtime/core/world.js'))?path.join(root,'runtime/core/world.js'):null);
if(runtime){
 vm.runInContext(fs.readFileSync(path.resolve(runtime),'utf8'),scope);
 const World=scope.Arcade.World,w=new World(stage,{seed:37});let target=null,jumped=false,counters=0;
 for(let tick=0;tick<5000&&w.state!=='clear'&&w.state!=='lost';tick++){
  if(w.state==='transition'){w.step({});continue;}
  const p=w.player;
  if(w.phaseIndex===0){
   if(p.grounded){target=w.platforms.filter(q=>q.y<p.y-10&&q.y>=p.y-130).sort((a,b)=>b.y-a.y)[0];jumped=false;}
   if(!target){const front=w.hazards.find(h=>h.rule==='dash'&&!h.resolved&&h.age>=h.windup);const dash=!!(front&&Math.abs(front.x-p.x)<100&&!p.dashWait);w.step({right:dash,dash});continue;}
   const destination=Math.max(target.x+35,Math.min(target.x+target.w-35,p.x)),dx=destination-p.x;
   const input={left:dx<-5,right:dx>5,jump:p.grounded||(!jumped&&p.vy>0&&p.y>target.y-20)};
   if(input.jump&&!p.grounded)jumped=true;
   w.step(input);
  }else{
   const front=w.hazards.find(h=>h.rule==='dash'&&!h.resolved&&h.age>=h.windup);
   const dash=!!(front&&Math.abs(front.x-p.x)<110&&!p.dashWait);
   w.step({right:p.x<700||dash||(p.x<=720&&p.facing<0),left:p.x>720&&!dash,dash});
   counters+=w.events.filter(e=>e.type==='counter'&&e.rule==='dash').length;
  }
 }
 assert.equal(w.state,'clear');assert.ok(w.player.hp>0);assert.ok(counters>0);assert.equal(w.weapons,null,'fixture runs with base kit and no drop module');
 const checkpoint=new World(stage,{phase:0,practice:true,sector:2});assert.equal(checkpoint.player.y,-530);assert.equal(checkpoint.player.grounded,true);
 checkpoint.step({right:true});checkpoint.step({retry:true});assert.equal(checkpoint.player.y,-530);assert.equal(checkpoint.tick,0);
 const shield=new World(stage,{phase:1,practice:true});
 for(let i=0;i<360;i++)shield.step({shield:i%150===0});
 assert.equal(shield.targets[0].open,false);assert.equal(shield.data.countered,0);assert.equal(shield.targets[0].hp,12);
 console.log('PASS real runtime base-kit start-to-clear (seed 37), tick '+w.tick+', HP'+w.player.hp+', required upper/summit dash, checkpoint restart and shield-only rejection');
}
// Articulation is pure fixed-tick sampling: display draw count cannot change motion.
const motion=mock(1),phase=stage.phases[1];let previous=null,maxStep=0;const states=new Set();
for(let tick=0;tick<1200;tick++){
 motion.phaseTick=tick;const pose=phase.pose(motion),again=phase.pose(motion),pilot=phase.pilot(motion);
 assert.deepEqual(JSON.parse(JSON.stringify(pose)),JSON.parse(JSON.stringify(again)));
 assert.equal(pilot.x,pose.x);assert.equal(pilot.y,pose.y+2);
 assert.equal(pose.feet[0].y,600);assert.equal(pose.feet[1].y,600);
 assert.equal(pose.feet[0].x,970);assert.equal(pose.feet[1].x,1190);
 assert.ok(pose.unfold>=0&&pose.unfold<=1);assert.equal(pose.open,0,'closed core must not appear open during intro');
 if(tick===75)assert.equal(pose.y,450,'landing settles before first scanner cue');
 if(previous){for(const key of ['x','y','elbowX','elbowY','emitterX','emitterY'])maxStep=Math.max(maxStep,Math.abs(pose[key]-previous[key]));}
 states.add(pose.scannerState);previous=pose;
}
assert.ok(maxStep<5,'articulated rig has no tick-to-tick jumps');
for(const state of ['anchor','unfold','windup','release','retract','recovery'])assert.ok(states.has(state));
motion.phaseTick=200;motion.data.hitAt=200;assert.equal(phase.pose(motion).hit,0);motion.phaseTick=201;assert.notEqual(phase.pose(motion).hit,0);
motion.data.ventOpenedAt=201;motion.data.openUntil=411;motion.phaseTick=219;assert.equal(phase.pose(motion).open,1);assert.equal(motion.targets[0].x,1050);assert.equal(motion.targets[0].y,490);assert.equal(motion.targets[0].w,105);assert.equal(motion.targets[0].h,100);
const context=new Proxy({}, {get:(_,key)=>typeof key==='string'?((...args)=>{for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),'finite draw geometry '+key);}):undefined,set:()=>true});
for(const tick of [0,74,75,90,144,164,165,304,305,359,450]){motion.phaseTick=tick;phase.draw(context,motion);}
console.log('PASS summit continuous fixed-tick articulation; max step',maxStep.toFixed(3),'px, six scanner states, planted feet, pilot/cab lock, fixed vent bounds and draw smoke');
