/* Real-runtime pressure audit; idle legal inputs, no world/HP/objective mutation. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),runtimeRoot=process.argv[2]||root,c=vm.createContext({console});
for(const f of [path.join(root,'density-attacks.js'),path.join(root,'phase-powerups.js'),path.join(root,'runtime/contract.js'),path.join(runtimeRoot,'runtime/core/world.js'),path.join(__dirname,'stage.js')])vm.runInContext(fs.readFileSync(f,'utf8'),c);
const stage=c.Arcade.stages.get('06-circuit'),w=new c.Arcade.World(stage,{phase:1,practice:true,seed:17});
assert.equal(typeof w.pressure,'function','pressure runtime required');
// Isolate the older background-pressure lesson from the separately audited missiles.
w.slowMissile=()=>null;
let calls=0,protectedTicks=0,activeTicks=0,maxAlive=0;const emitted=[],original=w.hazard.bind(w),pressure=w.pressure.bind(w);
w.hazard=spec=>{const h=original(spec);if(spec.pressure&&!spec.missile){emitted.push({tick:w.phaseTick,style:h.sprite,speed:Math.hypot(h.vx,h.vy),windup:h.windup});assert.ok(w.phaseTick>=600);assert.ok(h.windup>=75);assert.ok(Math.hypot(h.vx,h.vy)<=3);}return h;};
w.pressure=spec=>{calls++;const h=pressure(spec);if(!spec.enabled){protectedTicks++;assert.equal(w.hazards.filter(h=>h.pressure&&!h.missile).length,0);}return h;};
for(let tick=0;tick<3600&&w.state==='playing';tick++){w.step({});const alive=w.hazards.filter(h=>h.pressure);maxAlive=Math.max(maxAlive,alive.length);if(alive.some(h=>h.age>=h.windup))activeTicks++;assert.ok(alive.length<=2);if(w.hazards.some(h=>!h.resolved&&['dash','shield'].includes(h.rule)))assert.equal(alive.length,0);}
assert.ok(calls>600);assert.ok(protectedTicks>0);assert.ok(emitted.length>=2);assert.ok(new Set(emitted.map(h=>h.style)).size>=2);assert.ok(activeTicks>0);
console.log(JSON.stringify({stage:stage.id,legalIdleTicks:w.phaseTick,state:w.state,emitted:emitted.length,styles:[...new Set(emitted.map(h=>h.style))],activePressureTicks:activeTicks,maxAlive,protectedTicks,first:emitted[0]},null,2));
