const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');const root=path.resolve(__dirname,'../..'),c=vm.createContext({console});for(const f of [root+'/runtime/contract.js',process.argv[2]||root+'/runtime/core/world.js',__dirname+'/stage.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});const A=c.Arcade,s=A.stages.get('05-neon');
const originalHazard=A.World.prototype.hazard;A.World.prototype.hazard=function(spec){const existed=this.hazards.some(h=>h.id===spec.id),h=originalHazard.call(this,spec);if(spec.pressure&&!existed){this.pressureEvidence??=[];this.pressureEvidence.push({tick:this.phaseTick,sprite:h.sprite});}return h;};
function ground(){const w=new A.World(s,{seed:17});for(let t=0;t<4000&&w.state==='playing';t++){const p=w.player,i={right:true};if(w.hazards.some(h=>h.rule==='ordinary'&&Math.abs(h.x-p.x)<200))i.shield=true;w.step(i);}return w;}
const street=ground();assert.equal(street.state,'transition',`street x${street.player.x} hp${street.player.hp} ${street.failure}`);console.log(`Neon street: transition, ${street.tick} ticks HP${street.player.hp}, no powers.`);
function billboard(stayFloor=false){const w=new A.World(s,{phase:1,seed:17});let leg=0;for(let t=0;t<3000&&w.state==='playing';t++){const p=w.player,i={};if(!stayFloor){if(leg===0){i.right=p.x<350;if(p.x>=340&&p.grounded){i.jump=true;leg=1;}}else if(leg===1){if(p.grounded&&p.support==='sign-low')leg=2;}else if(leg===2){i.right=p.x<650;if(p.x>=465&&p.grounded&&p.support==='sign-low'){i.jump=true;leg=3;}}else if(leg===3){i.right=p.x<650;if(p.grounded&&p.support==='sign-mid')leg=4;}else if(leg===4){i.right=p.x<910;if(p.x>=740&&p.grounded&&p.support==='sign-mid'){i.jump=true;leg=5;}}else if(leg===5)i.right=p.x<910;}
if(w.hazards.some(h=>h.rule==='ordinary'&&Math.abs(h.x-p.x)<170))i.shield=true;w.step(i);w.missileActiveTicks=(w.missileActiveTicks||0)+Number(w.hazards.some(h=>h.missile&&h.age>=h.windup));}return w;}
const high=billboard();assert.equal(high.state,'clear',`billboard x${high.player.x} y${high.player.y} hp${high.player.hp} target${high.targets[0].hp} ${high.failure}`);assert.ok(high.player.hp>0);console.log(`Neon billboard: clear, ${high.tick} ticks HP${high.player.hp}, standard jumps and autofire.`);
console.log('Neon fast-climb pressure emissions:',JSON.stringify(high.pressureEvidence||[]),'active missile ticks:',high.missileActiveTicks||0);
const floor=billboard(true);console.log('Neon floor-wait pressure emissions:',JSON.stringify(floor.pressureEvidence||[]));assert.equal(floor.targets[0].hp,20,'ground-level autofire cannot align with elevated drive');console.log('Ground-level autofire cannot bypass vertical alignment.');
const cache=new A.World(s,{seed:17,practice:true});cache.player.x=1840;cache.player.prevX=1840;let leg=0;for(let t=0;t<700&&!cache.data.cache;t++){const p=cache.player,i={right:true};if(leg===0&&p.x>=1900&&p.grounded){i.jump=true;leg=1;}else if(leg===1&&p.grounded&&p.support==='sign-route-entry'&&p.x>=2360){i.jump=true;leg=2;}if(cache.hazards.some(h=>Math.abs(h.x-p.x)<160))i.shield=true;cache.step(i);}assert.equal(cache.data.cache,true,`cache reach x${cache.player.x} y${cache.player.y}`);console.log('Upper route cache reachable with standard jumps.');
const practice=new A.World(s,{phase:1,practice:true});practice.targets[0].hp=1;practice.step({retry:true});assert.equal(practice.targets[0].hp,20);assert.equal(practice.player.x,130);console.log('Neon practice/retry resets targets and safe spawn.');

// Controlled authoring probe: pressure scheduling/clearance, separate from legal-input clears above.
{
 const q=new A.World(s,{phase:1,seed:17});assert.equal(typeof q.pressure,'function','new shared runtime required');
 // Isolate the older background lesson; missiles have their own 180tick diagnostic.
 q.slowMissile=()=>null;
 Object.assign(q.player,{x:130,y:600,grounded:true,support:'floor'});
 q.phaseTick=599;q.phase.update(q);assert.equal(q.hazards.filter(h=>h.pressure&&!h.missile).length,0,'isolated first600ticks');
 const emitted=[];
 for(const tick of [660,780,900]){q.phaseTick=tick;q.phase.update(q);for(const h of q.hazards.filter(h=>h.pressure&&!h.missile))if(!emitted.includes(h))emitted.push(h);assert.ok(q.hazards.filter(h=>h.pressure&&!h.missile).length<=2);}
 assert.equal(emitted.length,2,'two bounded pressure additions');assert.equal(new Set(emitted.map(h=>h.sprite)).size,2,'distinct slow projectile styles');
 for(const h of emitted){assert.equal(h.source,'neon.street-pressure');assert.ok(Math.hypot(h.vx,h.vy)>=2&&Math.hypot(h.vx,h.vy)<=3);assert.ok(h.windup>=75);assert.ok(Math.abs(h.x+h.w/2-q.player.x)>=360);assert.ok(h.y>=q.camera.y+240);}
 q.player.grounded=false;q.player.y=450;
 q.phaseTick=901;q.phase.update(q);assert.equal(q.hazards.filter(h=>h.pressure&&!h.missile).length,0,'protected route clears existing pressure on nonscheduled ticks');
 console.log('Phase2 pressure: 2 distinct styles, speed2.5, cap2, >=90tick warning; protected route removes existing pressure.');
}
