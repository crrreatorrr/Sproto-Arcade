'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(process.argv[2]||'.'),ctx={};vm.createContext(ctx);
for(const f of ['runtime/contract.js','runtime/weapons/weapons.js','runtime/core/world.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
vm.runInContext(fs.readFileSync(path.join(__dirname,'stage.js'),'utf8'),ctx);
const stage=ctx.Arcade.stages.get('10-verse');
function run(){const w=new ctx.Arcade.World(stage,{seed:41}),log={ticks:0,riftCounters:0,hits:0,moduleSides:new Set(),collected:false};
 for(let i=0;i<15000&&w.state!=='lost'&&w.state!=='clear';i++){
  const p=w.player,input={};if(w.state==='transition'){w.step({});continue;}
  let gx=p.x,gy=350;
  if(w.phaseIndex===0){input.right=true;const next=[650,1550,2750,3950].findIndex(x=>x+280>p.x);gy=next>=0&&next%2===0?540:210;
   const front=w.hazards.find(h=>h.rule==='dash'&&!h.resolved&&h.age>=h.windup&&h.x-p.x<190&&h.x>=p.x);
   if(front&&!p.dashWait){input.dash=true;input.up=false;input.down=false;}
  }else{
   const side=Math.floor((w.phaseTick%480)/120),g=[[220,350],[640,160],[1020,350],[640,570]][side];gx=g[0];gy=g[1];
   if(p.x<gx-8)input.right=true;if(p.x>gx+8)input.left=true;
   const front=w.hazards.find(h=>h.rule==='dash'&&!h.resolved&&h.age>=h.windup&&h.x-p.x<200&&h.x>p.x-20);
   if(front&&!p.dashWait){input.dash=true;input.right=true;input.left=false;gy=p.y;}
  }
  if(!input.dash){if(p.y<gy-8)input.down=true;if(p.y>gy+8)input.up=true;}
  const ordinary=w.hazards.find(h=>h.rule==='ordinary'&&!h.resolved&&h.age>=h.windup&&Math.abs(h.x-p.x)<180&&Math.abs(h.y-(p.y-26))<100);if(ordinary&&!p.shieldWait)input.shield=true;
  w.step(input);for(const e of w.events){if(e.type==='counter'&&e.rule==='dash')log.riftCounters++;if(e.type==='hit')log.hits++;if(e.type==='targetHit'&&e.target==='showroom-core')log.moduleSides.add(w.data.lastSide);}
  if(w.weapons.snapshot())log.collected=true;log.ticks=w.tick;
 }
 assert.equal(w.state,'clear',JSON.stringify({log,state:w.state,phase:w.phaseIndex,p:w.player,data:w.data,targets:w.targets}));assert.ok(log.riftCounters>=4);assert.ok(log.moduleSides.size>=2);assert.equal(log.collected,false);return{...log,moduleSides:[...log.moduleSides]};
}
const result=run();assert.deepEqual(run(),result);
// No-dash route cannot pass the first required crossing, even with shield.
const noDash=new ctx.Arcade.World(stage,{seed:41});for(let i=0;i<1000;i++)noDash.step({right:true,shield:i%150===0});assert.equal(noDash.phaseIndex,0);assert.equal(noDash.data.crossings,0);assert.ok(noDash.player.x<=1002);
const practice=new ctx.Arcade.World(stage,{seed:41,phase:1,practice:true});assert.equal(practice.weapons.snapshot(),null);practice.lose('fixture');practice.step({retry:true});assert.equal(practice.state,'playing');assert.equal(practice.phaseTick,0);
console.log(JSON.stringify(result,null,2));
