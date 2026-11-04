/* Real-runtime base-kit simulation. No player/target/phase mutation. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),runtimeRoot=process.argv[2]||root,context=vm.createContext({console});
for(const f of [path.join(root,'runtime/contract.js'),path.join(runtimeRoot,'runtime/core/world.js'),path.join(__dirname,'stage.js')])vm.runInContext(fs.readFileSync(f,'utf8'),context,{filename:f});
const A=context.Arcade,stage=A.stages.get('02-last-light');
function controller(w){const p=w.player;let input={}; const goal=w.phaseIndex?440:300;if(p.x>goal+5)input.left=true;else if(p.facing<0)input.right=true;const h=w.hazards.find(h=>h.source==='light.iris-shot.reprise'&&!h.resolved&&h.age>=h.windup);if(h&&h.x-p.x<175&&h.x>p.x&&p.grounded)input.jump=true; return input;}
function run(options={},control=controller,limit=10000){const w=new A.World(stage,options);let hits=0,counters={},returns=0,reflections=0;for(let i=0;i<limit&&!['clear','lost'].includes(w.state);i++){w.step(control(w));for(const e of w.events){if(e.type==='reflection')reflections++;if(e.type==='hit')hits++;if(e.type==='counter')counters[e.rule]=(counters[e.rule]||0)+1;}returns=Math.max(returns,w.data.returns||0);}return{world:w,summary:{state:w.state,ticks:w.tick,hp:w.player.hp,hits,counters,returns,reflections}};}
const full=run({seed:17}),practice=run({seed:17,phase:1,practice:true});for(const r of [full,practice]){assert.equal(r.world.state,'clear');assert.equal(r.world.player.hp,5);assert.equal(r.summary.hits,0);}
assert.deepEqual(run({seed:17}).summary,full.summary);assert.ok(full.summary.reflections>=2);assert.ok(practice.summary.reflections>=2);
// Exposed stationary players cannot return either beam and cannot clear.
for(const phase of [0,1]){const fail=run({phase},()=>({}),2600);assert.notEqual(fail.world.state,'clear');assert.equal(fail.world.data.returns,0);}
// A high jump at lock breaks the low-mirror sightline even from its safe side.
const badAim=run({phase:1},w=>({left:w.player.x>550,jump:w.phaseTick===48}),130);assert.equal(badAim.world.data.returns,0);assert.equal(badAim.world.targets[0].open,false);
console.log(JSON.stringify({stage:stage.id,full:full.summary,practice:practice.summary,reproducible:true,inputs:'movement/jump/dash/shield and baseline autofire only'},null,2));
