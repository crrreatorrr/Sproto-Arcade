const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),scope=vm.createContext({});
const runtime=path.resolve(process.argv[2]||path.join(root,'runtime/core/world.js'));
for(const file of [path.join(root,'runtime/contract.js'),runtime,path.join(__dirname,'stage.js')])vm.runInContext(fs.readFileSync(file,'utf8'),scope);
const A=scope.Arcade,stage=A.stages.get('09-hatchery');
const w=new A.World(stage,{seed:37});let target=null,jumped=false;
for(let t=0;t<6000&&w.state!=='clear'&&w.state!=='lost';t++){
 if(w.state==='transition'){w.step({});continue;}
 const p=w.player;
 if(w.phaseIndex===0){
  if(p.grounded&&p.y>500){target=w.platforms.filter(q=>q.y<p.y-10&&q.y>=p.y-145&&q.active!==false).sort((a,b)=>b.y-a.y)[0];jumped=false;}
  if(p.y===500&&p.grounded)w.step({right:p.x<820,shield:p.shieldWait===0});
  else if(target){const destination=Math.max(target.x+40,Math.min(target.x+target.w-40,p.x)),dx=destination-p.x;
   const input={left:dx<-5,right:dx>5,jump:p.grounded||(!jumped&&p.vy>0&&p.y>target.y-20),shield:p.shieldWait===0};
   if(input.jump&&!p.grounded)jumped=true;w.step(input);
  }else w.step({});
 }else w.step({right:p.facing<0,shield:p.shieldWait===0,jump:p.grounded&&w.phaseTick>=690&&w.phaseTick%300===120});
}
assert.equal(w.state,'clear');assert.ok(w.player.hp>0);assert.equal(w.weapons,null);
console.log('PASS Hatchery base-kit full run',w.tick,'ticks HP',w.player.hp);
const podWorld=new A.World(stage),pod=podWorld.data.pods[0],shell=podWorld.targets.find(t=>t.id===pod.id+'-shell'),foot=podWorld.platforms.find(t=>t.id===pod.id+'-foot');
assert.equal(pod.state,'shell');assert.equal(foot.active,undefined);podWorld.damageTarget(shell,2,'fixture-shot');assert.equal(pod.state,'broken');assert.equal(foot.active,false);assert.ok(podWorld.data.openUntil>0);
const hatchWorld=new A.World(stage);hatchWorld.phaseTick=299;hatchWorld.step({});assert.equal(hatchWorld.data.pods[0].state,'hatched');assert.equal(hatchWorld.platforms.find(t=>t.id==='pod-a-foot').active,false);assert.ok(hatchWorld.hazards.some(h=>h.source==='09-hatchery/hatch-timer'));
const lane=new A.World(stage,{phase:1,practice:true});lane.step({});const core=lane.targets.find(t=>t.id==='crawler-hatch');assert.equal(core.open,false);const blocker=lane.targets.find(t=>t.id==='conveyor-first-shell');const oldX=blocker.x;lane.step({});assert.ok(blocker.x<oldX);lane.damageTarget(blocker,2,'fixture-shot');lane.step({});assert.equal(core.open,true);assert.equal(lane.data.pods[0].state,'broken');
const untouched=new A.World(stage,{phase:1});untouched.phaseTick=10;stage.phases[1].update(untouched);assert.equal(untouched.targets[0].hp,18);assert.equal(untouched.state,'playing');
console.log('PASS pod shell/break/hatch footing lifecycle, moving shell and actual lane gate');
