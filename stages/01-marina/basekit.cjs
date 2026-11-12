/* End-to-end fixed-tick base-kit controller; no HP, target or phase mutation. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),context=vm.createContext({console});
const runtime=process.argv[2]||path.join(root,'runtime/core/world.js');
// Isolate the authored encounter contract; qa/density-modern.test.cjs covers the barrage.
for(const f of [path.join(root,'levels.js'),path.join(root,'phase-powerups.js'),path.join(root,'runtime/contract.js'),runtime,path.join(__dirname,'stage.js')])vm.runInContext(fs.readFileSync(f,'utf8'),context,{filename:f});
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
  if(wake&&wake.x-p.x<110&&wake.x>p.x&&p.y>530)input.up=true;
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
const special=new A.World(stage,{seed:17});
special.step({beam:true,bomb:true});
for(let i=0;i<5;i++)special.step({});
const volley=special.shots.filter(s=>s.type==='boatTorpedo');
assert.equal(volley.length,3);
assert.equal(new Set(volley.map(s=>s.y)).size,3);
assert.ok(volley.every(s=>s.vx>0&&s.vy===0));
const lanes=volley.map(s=>s.y);
for(let i=0;i<2;i++)special.step({});
assert.deepEqual(volley.map(s=>s.y),lanes,'three torpedoes stay in their horizontal lanes');
const mine=special.shots.find(s=>s.type==='waterMine');
assert.ok(mine);
let y=special.player.y-26-28,vy=-9.8;
for(let i=0;i<70;i++){
 y+=vy*.75;vy+=.31*.75;
 if(y>591){
  assert.equal(mine.y+mine.h/2,591);
  assert.equal(mine.bounces,1);
  assert.ok(special.effects.some(e=>e.type==='navalSplash'));
  break;
 }
 assert.ok(Math.abs(mine.y+mine.h/2-y)<1e-8,'mine matches the beach-ball trajectory');
 special.step({});
}
console.log(JSON.stringify({full,practice,reproducible:true,inputs:'steering and dash; autofire baseline',specials:'three horizontal torpedoes and beach-ball mine arc'},null,2));
