/* End-to-end fixed-tick base-kit controller; no HP, target or phase mutation. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),context=vm.createContext({console});
const runtime=process.argv[2]||path.join(root,'runtime/core/world.js');
for(const f of [path.join(root,'density-attacks.js'),path.join(root,'phase-powerups.js'),path.join(root,'runtime/contract.js'),runtime,path.join(__dirname,'stage.js')])vm.runInContext(fs.readFileSync(f,'utf8'),context,{filename:f});
const A=context.Arcade,stage=A.stages.get('01-marina');
function run(options){
 const world=new A.World(stage,options);let dashCounters=0,hits=0;const pressureIds=new Set(),pressureStyles=new Set();
 for(let i=0;i<7000&&world.state!=='clear'&&world.state!=='lost';i++){
  const p=world.player;let input={};
  if(world.phaseIndex===1){
   const front=world.hazards.find(h=>h.rule==='dash'&&h.age>=h.windup&&!h.resolved);
   if(front&&front.x-p.x<85&&front.x>p.x&&!p.dashWait)input={dash:true,right:true};
   else if(!p.dash){if(p.x>265)input.left=true;else if(p.facing<0)input.right=true;}
  }
  const wake=world.hazards.find(h=>h.rule==='ordinary'&&h.age>=h.windup&&!h.resolved);
  if(wake&&wake.x-p.x<110&&wake.x>p.x&&p.grounded)input.jump=true;
  world.step(input);
  for(const h of world.hazards)if(h.pressure){pressureIds.add(h.id);pressureStyles.add(h.sprite);}
  dashCounters+=world.events.filter(e=>e.type==='counter'&&e.rule==='dash').length;
  hits+=world.events.filter(e=>e.type==='hit').length;
 }
 assert.equal(world.state,'clear');assert.equal(world.player.hp,5);assert.ok(dashCounters>=2);assert.equal(hits,0);
 return {ticks:world.tick,hp:world.player.hp,dashCounters,hits,pressure:pressureIds.size,pressureStyles:[...pressureStyles]};
}
const full=run({seed:17}),practice=run({seed:17,phase:1,practice:true});
assert.deepEqual(run({seed:17}),full);
console.log(JSON.stringify({full,practice,reproducible:true,inputs:'movement/jump/dash only; autofire baseline'},null,2));
