/* Run: node stages/11-rooftop/verify.cjs [path/to/runtime/core/world.js] */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const c=vm.createContext({console});
for(const f of [path.join(root,'runtime/contract.js'),process.argv[2]||path.join(root,'runtime/core/world.js'),path.join(__dirname,'stage.js')])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const A=c.Arcade,stage=A.stages.get('11-rooftop');
const originalHazard=A.World.prototype.hazard;A.World.prototype.hazard=function(spec){const existed=this.hazards.some(h=>h.id===spec.id),h=originalHazard.call(this,spec);if(spec.pressure&&!existed){this.pressureEvidence??=[];this.pressureEvidence.push({tick:this.phaseTick,sprite:h.sprite});}return h;};
function gapWorld(){return new A.World({id:'gap-fixture',phases:[0,1].map(()=>({mode:'horizontal',spawn:{x:3500,y:600},enter(w){w.platform({id:'launch',x:0,y:600,w:3800});w.platform({id:'land',x:4280,y:600,w:1000});},update(){}}))});}
function jumpTrial(launch,doubleDelay,dashDelay){const w=gapWorld();let age=-1;for(let t=0;t<180&&w.state==='playing';t++){const input={right:true};if(age<0&&w.player.x>=launch){input.jump=true;age=0;}else if(age>=0)age++;if(age===doubleDelay)input.jump=true;if(age===dashDelay)input.dash=true;w.step(input);if(w.player.grounded&&w.player.x>=4280-16)return true;}return false;}
let nondash=0,dash=0;for(let launch=3660;launch<=3830;launch+=10)for(let delay=1;delay<=55;delay++)if(jumpTrial(launch,delay,-99))nondash++;
assert.equal(nondash,0,'480px mandatory gap must fail strongest sampled no-dash double jumps');
const successes=[];for(let dashDelay=15;dashDelay<=45;dashDelay++)if(jumpTrial(3760,34,dashDelay)){dash++;successes.push(dashDelay);}
assert.ok(dash>=6,'dash has forgiving sampled launch window');
function route(phase){const w=new A.World(stage,{phase,seed:13});let jumpedTeach=false,jumpedDash=false,dashAge=-1;const directions=new Set();for(let t=0;t<5000&&w.state==='playing';t++){const p=w.player,gap=phase?6650:3800,input={right:true};if(!phase&&!jumpedTeach&&p.x>=1080){input.jump=true;jumpedTeach=true;}if(!jumpedDash&&p.x>=gap-40){input.jump=true;jumpedDash=true;dashAge=0;}else if(dashAge>=0)dashAge++;if(dashAge===30)input.jump=true;if(dashAge===41)input.dash=true;if(w.hazards.some(h=>!h.resolved&&h.rule==='ordinary'&&Math.abs(h.x-p.x)<180))input.shield=true;w.step(input);for(const h of w.hazards)if(h.rule==='ordinary')directions.add(Math.sign(h.vx));}w.testDirections=directions;return w;}
for(const phase of [0,1]){const w=route(phase);assert.equal(w.state,phase?'clear':'transition',`phase ${phase+1} route completion, x=${w.player.x}, failure=${w.failure}`);assert.equal(w.data.crossing,true);assert.ok(w.player.hp>0);if(phase)assert.equal(w.testDirections.size,2,'extraction projectiles arrive from both sides');if(phase)assert.equal(new Set((w.pressureEvidence||[]).map(h=>h.sprite)).size,2,'legal route sees two pressure styles');if(phase)console.log('Rooftop legal-route pressure emissions:',JSON.stringify(w.pressureEvidence||[]));console.log(`phase ${phase+1}: ${w.state}, ${w.tick} ticks, ${w.player.hp} HP; base kit no power use`);}
// Stationary player never wins and retry erases route state.
const idle=new A.World(stage,{seed:13});for(let i=0;i<4200;i++)idle.step({});assert.equal(idle.state,'playing');idle.data.crossing=true;idle.step({retry:true});assert.equal(idle.data.crossing,false);
console.log(`gap: ${nondash} no-dash landings across 990 samples; dash succeeds ages ${successes.join(',')}`);
console.log('Rooftop fixture passed (simulation only; not human balance validation).');

const cache=new A.World(stage,{seed:13});cache.player.x=5200;cache.player.prevX=5200;cache.data.crossing=true;let jump1=false,jump2=false;for(let t=0;t<300&&!cache.data.cache;t++){const p=cache.player,input={right:true};if(!jump1&&p.x>=5220){input.jump=true;jump1=true;}if(!jump2&&p.x>=5530&&p.grounded){input.jump=true;jump2=true;}cache.step(input);}assert.equal(cache.data.cache,true,'base-kit jump route reaches optional cache');console.log('upper roof cache reachable with standard jumps');

for(const cp of stage.practiceSectors){const w=new A.World(stage,{phase:cp.phase,practice:true,sector:cp.id});assert.equal(w.player.y,600);assert.equal(w.player.hp,5);assert.equal(w.hazards.length,0);assert.equal(w.data.crossing,cp.id===3);w.step({retry:true});assert.equal(w.player.x,{1:800,2:3300,3:5200,4:6150}[cp.id]);}const normal=new A.World(stage,{phase:0,practice:false,sector:3});assert.equal(normal.data.crossing,false);assert.equal(normal.player.x,130);console.log('practice sectors reset to safe base-kit snapshots; normal run cannot skip crossing');

// Controlled authoring probe: pressure scheduling/clearance, separate from legal-input clears above.
{
 const q=new A.World(stage,{phase:1,seed:17});assert.equal(typeof q.pressure,'function','new shared runtime required');
 Object.assign(q.player,{x:4500,y:600,grounded:true});
 q.phaseTick=599;q.phase.update(q);assert.equal(q.hazards.filter(h=>h.pressure).length,0,'isolated first600ticks');
 const emitted=[];
 for(const tick of [660,750,840]){q.phaseTick=tick;q.phase.update(q);for(const h of q.hazards.filter(h=>h.pressure))if(!emitted.includes(h))emitted.push(h);assert.ok(q.hazards.filter(h=>h.pressure).length<=2);}
 assert.equal(emitted.length,2,'two bounded pressure additions');assert.equal(new Set(emitted.map(h=>h.sprite)).size,2,'distinct slow projectile styles');
 for(const h of emitted){assert.equal(h.source,'goldie.extraction-pressure');assert.ok(Math.hypot(h.vx,h.vy)>=2&&Math.hypot(h.vx,h.vy)<=3);assert.ok(h.windup>=75);assert.ok(Math.abs(h.x+h.w/2-q.player.x)>=360);assert.ok(h.y>=q.camera.y+240);}
 q.player.x=6300;
 q.phaseTick=901;q.phase.update(q);assert.equal(q.hazards.filter(h=>h.pressure).length,0,'protected route clears existing pressure on nonscheduled ticks');
 console.log('Phase2 pressure: 2 distinct styles, speed2.5, cap2, >=90tick warning; protected route removes existing pressure.');
}
