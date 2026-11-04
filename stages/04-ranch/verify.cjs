const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),c=vm.createContext({console});for(const f of [root+'/runtime/contract.js',process.argv[2]||root+'/runtime/core/world.js',__dirname+'/stage.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});const A=c.Arcade,s=A.stages.get('04-ranch');
const originalHazard=A.World.prototype.hazard;A.World.prototype.hazard=function(spec){const existed=this.hazards.some(h=>h.id===spec.id),h=originalHazard.call(this,spec);if(spec.pressure&&!existed){this.pressureEvidence??=[];this.pressureEvidence.push({tick:this.phaseTick,sprite:h.sprite});}return h;};
function run(phase){const w=new A.World(s,{phase,seed:21});let age=-1;for(let t=0;t<5000&&w.state==='playing';t++){const p=w.player,target=w.targets[0],i={right:p.x<(w.data.defeated?3550:target.x-400)};if(!phase){if(p.grounded&&w.hazards.some(h=>h.source==='ranch.harvest-roll'&&h.age>=h.windup&&h.x>p.x&&h.x-p.x<180))i.jump=true;}else{const start=2800+w.data.offset;if(age<0&&p.x>=start-40){i.jump=true;age=0;}else if(age>=0)age++;if(age===30)i.jump=true;if(age===41)i.dash=true;}if(w.hazards.some(h=>h.rule==='ordinary'&&Math.abs(h.x-p.x)<150))i.shield=true;w.step(i);w.missileActiveTicks=(w.missileActiveTicks||0)+Number(w.hazards.some(h=>h.missile&&h.age>=h.windup));}return w;}
for(const phase of [0,1]){const w=run(phase);assert.equal(w.state,phase?'clear':'transition',`phase${phase+1} x${w.player.x} hp${w.player.hp} fail${w.failure}`);assert.ok(w.player.hp>0);if(phase)assert.equal(w.data.crossed,true);if(phase)assert.equal(new Set((w.pressureEvidence||[]).map(h=>h.sprite)).size,2,'legal route sees missile plus compatible background style');if(phase)console.log('Ranch legal-route pressure emissions:',JSON.stringify(w.pressureEvidence||[]),'active missile ticks:',w.missileActiveTicks||0);console.log(`Ranch phase${phase+1}: ${w.state}, ${w.tick} ticks, HP${w.player.hp}, base kit.`);}
// Isolated moving-car geometry uses the production runtime's platform carry rules.
function trial(launch,delay,dash){const fixture={id:'train-gap',phases:[0,1].map(()=>({mode:'horizontal',camera:'horizontal',spawn:{x:2500,y:600},enter(w){w.data={o:0};w.platform({id:'a',x:0,y:600,w:2800});w.platform({id:'b',x:3280,y:600,w:1500});},update(w){w.data.o+=.6;for(const p of w.platforms)p.x+=.6;}}))},w=new A.World(fixture);let age=-1;for(let t=0;t<180&&w.state==='playing';t++){const i={right:true};if(age<0&&w.player.x>=2800+w.data.o-launch){i.jump=true;age=0;}else if(age>=0)age++;if(age===delay)i.jump=true;if(age===dash)i.dash=true;w.step(i);if(w.player.grounded&&w.player.x>3280+w.data.o-16)return true;}return false;}
let no=0,yes=0;for(let launch=-20;launch<=140;launch+=10)for(let delay=1;delay<=55;delay++)if(trial(launch,delay,-1))no++;for(let d=15;d<=50;d++)if(trial(40,30,d))yes++;assert.equal(no,0);assert.ok(yes>=5);console.log(`Moving coupling: ${no} no-dash successes /935 samples; ${yes} successful dash ages.`);
const w=new A.World(s,{phase:1,practice:true});w.data.crossed=true;w.step({retry:true});assert.equal(w.data.crossed,false);assert.equal(w.player.x,2300);console.log('Ranch practice/retry snapshot passed.');

// Controlled authoring probe: pressure scheduling/clearance, separate from legal-input clears above.
{
 const q=new A.World(s,{phase:1,seed:17});assert.equal(typeof q.pressure,'function','new shared runtime required');
 // Isolate the older background lesson; missiles have their own 180tick diagnostic.
 q.slowMissile=()=>null;
 Object.assign(q.data,{crossed:true});Object.assign(q.player,{x:3900,y:600,grounded:true});
 q.phaseTick=599;q.phase.update(q);assert.equal(q.hazards.filter(h=>h.pressure&&!h.missile).length,0,'isolated first600ticks');
 const emitted=[];
 for(const tick of [660,720,780]){q.phaseTick=tick;q.phase.update(q);for(const h of q.hazards.filter(h=>h.pressure&&!h.missile))if(!emitted.includes(h))emitted.push(h);assert.ok(q.hazards.filter(h=>h.pressure&&!h.missile).length<=2);}
 assert.equal(emitted.length,2,'two bounded pressure additions');assert.equal(new Set(emitted.map(h=>h.sprite)).size,2,'distinct slow projectile styles');
 for(const h of emitted){assert.equal(h.source,'ranch.engine-pressure');assert.ok(Math.hypot(h.vx,h.vy)>=2&&Math.hypot(h.vx,h.vy)<=3);assert.ok(h.windup>=75);assert.ok(Math.abs(h.x+h.w/2-q.player.x)>=360);assert.ok(h.y>=q.camera.y+240);}
 q.data.crossed=false;q.player.x=2750;
 q.phaseTick=901;q.phase.update(q);assert.equal(q.hazards.filter(h=>h.pressure&&!h.missile).length,0,'protected route clears existing pressure on nonscheduled ticks');
 console.log('Phase2 pressure: 2 distinct styles, speed2.5, cap2, >=90tick warning; protected route removes existing pressure.');
}
