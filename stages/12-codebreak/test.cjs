const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),scope=vm.createContext({});
for(const file of ['runtime/contract.js','stages/12-codebreak/stage.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),scope);
const stage=scope.Arcade.stages.get('12-codebreak');
function mock(index){const w={phaseTick:0,player:{x:260,y:640,grounded:true},platforms:[],targets:[],hazards:[],events:[],data:{},drops:[],state:'playing',camera:{x:0,y:0},platform(p){this.platforms.push(p);return p;},target(t){this.targets.push(t);return t;},hazard(h){this.hazards.push(h);return h;},cue(t){this.cueText=t;},drop(...args){this.drops.push(args);},advancePhase(){this.state='transition';},clear(){this.state='clear';}};stage.phases[index].enter(w);return w;}
const climb=mock(0);assert.equal(climb.platforms.filter(p=>p.id.startsWith('ascent-')).length,18);assert.equal(climb.platforms.filter(p=>p.id.startsWith('recovery-')).length,4);
climb.phaseTick=150;stage.phases[0].update(climb);assert.equal(climb.hazards[0].source,'12-codebreak/warrant-drop');assert.equal(climb.hazards[0].windup,65);
climb.phaseTick=10000;stage.phases[0].update(climb);assert.equal(climb.state,'playing','timer alone cannot clear climb');
const top=climb.platforms.find(p=>p.id==='ascent-17');climb.player={x:top.x+100,y:top.y,grounded:true};stage.phases[0].update(climb);assert.equal(climb.state,'transition');assert.equal(climb.drops.length,1);
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
   assert.ok(target,'a next foothold is reachable from every authored landing');
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
 assert.equal(w.state,'clear');assert.equal(w.player.hp,5);assert.ok(counters>0);assert.equal(w.weapons,null,'fixture runs with base kit and no drop module');
 const checkpoint=new World(stage,{phase:0,practice:true,sector:2});assert.equal(checkpoint.player.y,-530);assert.equal(checkpoint.player.grounded,true);
 checkpoint.step({right:true});checkpoint.step({retry:true});assert.equal(checkpoint.player.y,-530);assert.equal(checkpoint.tick,0);
 const shield=new World(stage,{phase:1,practice:true});
 for(let i=0;i<360;i++)shield.step({shield:i%150===0});
 assert.equal(shield.targets[0].open,false);assert.equal(shield.data.countered,0);assert.equal(shield.targets[0].hp,12);
 console.log('PASS real runtime base-kit start-to-clear (seed 37), HP5, required summit dash, checkpoint restart and shield-only rejection');
}
