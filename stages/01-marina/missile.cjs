/* Six-stage authoring diagnostics, NOT earned clears. Controlled setup exercises real
   stage guards + runtime emissions/travel. Existing basekit/verify files earn clears. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),runtimeRoot=process.argv[2]||root,c=vm.createContext({console});
for(const f of ['runtime/contract.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
vm.runInContext(fs.readFileSync(path.join(runtimeRoot,'runtime/core/world.js'),'utf8'),c);
const cases=[
 ['01-marina',400,w=>{w.data.unlocked=true;w.data.valveBroken=true;w.data.ventUntil=550;},w=>{w.data.ventUntil=w.phaseTick+210;}],
 ['02-last-light',180,()=>{},w=>{w.phaseTick=60;}],
 ['04-ranch',200,w=>{w.data.crossed=true;Object.assign(w.player,{x:3900,grounded:true});},w=>{w.player.grounded=false;}],
 ['05-neon',180,w=>{Object.assign(w.player,{grounded:true,support:'sign-low',y:510});},w=>{w.player.grounded=false;}],
 ['06-circuit',240,w=>{Object.assign(w.data,{countered:true,openUntil:370});},w=>{w.data.openUntil=w.phaseTick+190;w.target({id:'relay-active',x:740,y:500,w:65,h:100,hp:4,open:true});}],
 ['08-crown',300,w=>{w.data.openUntil=450;w.data.openRule='dash';},w=>{w.data.openUntil=w.phaseTick+210;}]
];
const results=[];
for(const [id,tick,eligible,protect] of cases){
 vm.runInContext(fs.readFileSync(path.join(root,'stages',id,'stage.js'),'utf8'),c);
 const stage=c.Arcade.stages.get(id),w=new c.Arcade.World(stage,{phase:1,practice:true,seed:17});
 assert.equal(typeof w.slowMissile,'function');eligible(w);w.phaseTick=tick;w.phase.update(w);
 const m=w.hazards.find(h=>h.missile);assert.ok(m,id+' emits in safe window');
 assert.equal(m.sprite,'missile');assert.ok(m.pressure);assert.equal(m.rule,'ordinary');
 assert.ok(m.windup>=90);assert.ok(Math.hypot(m.vx,m.vy)<=1.2);assert.ok(Math.abs(m.x+m.w/2-w.player.x)>=360);
 const x=m.x,y=m.y,vx=m.vx,vy=m.vy;
 // Change lanes after the committed warning; real hazard updates must leave a safe route.
 w.player.y=360;const hp=w.player.hp;
 for(let n=0;n<240;n++)w.updateHazards();
 assert.ok(Math.hypot(m.x-x,m.y-y)>100,id+' actually travels after warning');
 assert.equal(m.vx,vx);assert.equal(m.vy,vy);assert.equal(w.player.hp,hp,id+' safe escape from locked line');
 assert.ok(w.hazards.filter(h=>h.missile).length<=1);assert.ok(w.hazards.filter(h=>h.pressure).length<=2);
 // A live missile is removed immediately on the first protected stage update.
 w.phaseTick++;protect(w);w.phase.update(w);assert.equal(w.hazards.filter(h=>h.missile).length,0,id+' protected window clears missile');
 results.push({stage:id,emitted:tick,activeTravelTicks:150,protectedCleanup:true,lockedAimEscape:true});
}
console.log(JSON.stringify({diagnostic:true,earnedClear:false,results},null,2));
