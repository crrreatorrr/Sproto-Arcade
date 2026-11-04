const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),scope=vm.createContext({});
const runtime=path.resolve(process.argv[2]||path.join(root,'runtime/core/world.js'));
for(const file of [path.join(root,'runtime/contract.js'),runtime,path.join(__dirname,'stage.js')])vm.runInContext(fs.readFileSync(file,'utf8'),scope);
const A=scope.Arcade,stage=A.stages.get('07-moonkeep');
const w=new A.World(stage,{seed:37});let target=null,jumped=false,startJump=-1;
for(let t=0;t<5000&&w.state!=='clear'&&w.state!=='lost';t++){
 if(w.state==='transition'){w.step({});continue;}
 const p=w.player;
 if(w.phaseIndex===0){
  if(p.grounded&&p.y>420){target=w.platforms.filter(q=>q.y<p.y-10&&q.y>=p.y-145&&q.active!==false).sort((a,b)=>b.y-a.y)[0];jumped=false;}
  if(p.y===420&&p.grounded)w.step({right:p.x<820,shield:p.shieldWait===0});
  else if(target){const destination=Math.max(target.x+40,Math.min(target.x+target.w-40,p.x)),dx=destination-p.x;
   const input={left:dx<-5,right:dx>5,jump:p.grounded||(!jumped&&p.vy>0&&p.y>target.y-20),shield:p.shieldWait===0};
   if(input.jump&&!p.grounded)jumped=true;w.step(input);
  }else w.step({});
 }else if(p.grounded&&p.x<450)w.step({right:true});
 else{if(startJump<0)startJump=w.phaseTick;const age=w.phaseTick-startJump;w.step({right:p.x<1040,jump:age===0||age===35,dash:age===20});}
}
assert.equal(w.state,'clear');assert.ok(w.player.hp>0);assert.equal(w.weapons,null);
console.log('PASS Moonkeep base-kit full run',w.tick,'ticks, HP',w.player.hp);
// Exhaustively sweep the second legal jump time under maximum non-dash speed.
// Starting at x475 is the last legal center on the launch (edge460 + halfwidth16).
let maxX=0;
for(let second=1;second<=100;second++){
 const trial=new A.World(stage,{phase:1,practice:true});trial.player.x=475;trial.player.prevX=475;trial.step({});
 for(let t=0;t<150;t++){trial.step({right:true,jump:t===0||t===second,shield:true});if(trial.player.y<=420)maxX=Math.max(maxX,trial.player.x);if(trial.player.y>520)break;}
 assert.equal(trial.data.crossed,false);assert.equal(trial.targets[0].open,false);
}
assert.ok(maxX<984,'strongest non-dash double jump cannot touch far landing');
console.log('PASS maximum-speed non-dash second-jump sweep, furthest upper X',maxX,'< landing contact984');
let successful=0;
for(let dashAt=14;dashAt<=28;dashAt++){
 const trial=new A.World(stage,{phase:1,practice:true});trial.player.x=450;trial.player.prevX=450;trial.step({});
 for(let t=0;t<140;t++){trial.step({right:trial.player.x<1040,jump:t===0||t===35,dash:t===dashAt});if(trial.data.crossed){successful++;break;}}
}
assert.equal(successful,15,'15-tick forgiving dash launch window');
const recovery=new A.World(stage,{phase:1,practice:true});recovery.player.x=600;recovery.player.y=650;recovery.player.prevY=650;recovery.player.grounded=true;
for(let t=0;t<100;t++)recovery.step({right:true,jump:t===0||t===30});
assert.equal(recovery.data.crossed,false);assert.equal(recovery.targets[0].open,false,'lower approach cannot bypass required upper launch');
const liftWorld=new A.World(stage);const lift=liftWorld.platforms.find(p=>p.id==='lift');liftWorld.player.x=600;liftWorld.player.y=lift.y;liftWorld.player.prevY=lift.y;liftWorld.player.grounded=true;liftWorld.player.support='lift';
liftWorld.step({});const old=liftWorld.player.y;liftWorld.step({});assert.notEqual(liftWorld.player.y,old);assert.equal(liftWorld.player.support,'lift');
console.log('PASS moving-lift rider carry, 15 dash timings, recovery cannot bypass upper crossing');

const route=new A.World(stage,{phase:1,practice:true});Object.assign(route.player,{x:180,y:650,prevY:650,grounded:true});let routeTarget=null,routeJumped=false,returned=false;for(let t=0;t<500;t++){const p=route.player;if(p.grounded&&p.support==='upper-launch'){returned=true;break;}if(p.grounded){routeTarget=route.platforms.filter(q=>q.active!==false&&q.y<p.y-10&&q.y>=p.y-150).sort((a,b)=>b.y-a.y)[0];routeJumped=false;}if(!routeTarget)break;const destination=Math.max(routeTarget.x+35,Math.min(routeTarget.x+routeTarget.w-35,p.x)),dx=destination-p.x;const input={left:dx<-5,right:dx>5,jump:p.grounded||(!routeJumped&&p.vy>0&&p.y>routeTarget.y-20)};if(input.jump&&!p.grounded)routeJumped=true;route.step(input);}assert.equal(returned,true);console.log('PASS legal recovery ledge → step → upper launch return');
