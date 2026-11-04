'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),ctx=vm.createContext({console});
for(const p of ['runtime/contract.js','runtime/core/world.js'])vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),ctx,{filename:p});
const A=ctx.Arcade,phase={mode:'flight',spawn:{x:120,y:600},update(){}};
const world=(pi=1)=>new A.World({id:'missile-fixture',number:1,phases:[phase,phase]},{phase:pi,seed:93});
const emit=w=>w.slowMissile({id:'missile'}),check=(name,fn)=>{fn();console.log('PASS '+name);};
check('phase two introduction, global cooldown and same-tick dedup use actual emissions',()=>{
 const w=world();w.phaseTick=179;assert.equal(emit(w),null);w.phaseTick=180;
 assert.equal(w.slowMissile({id:'missile',enabled:false}),null);assert.equal(w.missileNextTick,180);
 const h=emit(w);assert.ok(h);assert.equal(h.id,'missile:180');assert.equal(w.missileNextTick,660);
 w.hazards=[];assert.equal(w.slowMissile({id:'other'}),null);w.phaseTick=659;assert.equal(emit(w),null);
 w.phaseTick=660;assert.ok(emit(w));const p1=world(0);p1.phaseTick=999;assert.equal(emit(p1),null);
});
check('warning, speed, far visible spawn, committed aim and bounded whole-screen lifetime',()=>{
 const w=world();w.camera={x:2200,y:-1800};w.player.x=2300;w.player.y=-1550;w.phaseTick=180;
 const h=w.slowMissile({id:'m',speed:999,windup:1});assert.equal(h.windup,90);assert.equal(h.w,44);assert.equal(h.h,18);
 assert.ok(Math.hypot(h.vx,h.vy)<=1.2+1e-9);assert.ok(h.x+h.w/2-w.player.x>=360);
 assert.ok(h.x>=2200&&h.x+h.w<=3480);assert.ok(h.y>=-1560&&h.y+h.h<=-1120);
 assert.ok(h.active*Math.hypot(h.vx,h.vy)>=1600-1e-9);assert.ok(h.active<=3200);
 const [x,y,vx,vy]=[h.x,h.y,h.vx,h.vy];w.player.x=3000;w.player.y=-1200;
 for(let i=0;i<90;i++)w.updateHazards();assert.equal(h.x,x);assert.equal(h.y,y);
 w.updateHazards();assert.equal(h.vx,vx);assert.equal(h.vy,vy);assert.equal(h.x,x+vx);assert.equal(h.y,y+vy);
 const normal=world();normal.phaseTick=180;const defaultMissile=emit(normal);assert.ok(Math.abs(Math.hypot(defaultMissile.vx,defaultMissile.vy)-1.1)<1e-9);
});
check('missile prioritizes oldest background pressure and never removes base attacks',()=>{
 const w=world();w.phaseTick=660;
 const base=w.hazard({id:'base',x:0,y:0,w:10,h:10,active:999}),old=w.pressure({id:'old'}),fresh=w.pressure({id:'fresh'});old.age=100;
 const m=emit(w);assert.ok(m);assert.ok(w.hazards.includes(base));assert.ok(w.hazards.includes(fresh));assert.ok(!w.hazards.includes(old));
 assert.equal(w.hazards.filter(h=>h.pressure).length,2);assert.equal(w.slowMissile({id:'second'}),null);
 w.phaseTick=840;assert.equal(w.pressure({id:'third'}),null);
 w.pressure({id:'ordinary',enabled:false});assert.ok(w.hazards.includes(m));assert.ok(!w.hazards.includes(fresh));
 w.slowMissile({id:'m',enabled:false});assert.equal(w.hazards.length,1);assert.equal(w.hazards[0],base);
});
check('mandatory fronts clear and block pressure without consuming missile cooldown',()=>{
 for(const rule of ['dash','shield']){
  const w=world();w.phaseTick=180;const front=w.hazard({id:'front',rule,windup:90,active:30});
  assert.equal(emit(w),null);assert.equal(w.missileNextTick,180);front.resolved=true;assert.ok(emit(w));
  w.hazard({id:'next',rule,windup:90,active:30});assert.equal(w.hazards.filter(h=>h.pressure).length,0);
  w.phaseTick=660;assert.equal(emit(w),null);assert.equal(w.missileNextTick,660);
 }
});
check('camera culls active missiles, warning persists, expiry is bounded and phase/retry reset',()=>{
 const w=world();w.phaseTick=180;const h=emit(w);w.camera.x=5000;w.updateHazards();assert.ok(w.hazards.includes(h));
 h.age=h.windup;w.updateHazards();assert.equal(w.hazards.length,0);
 w.restart();assert.equal(w.missileNextTick,180);w.phaseTick=180;const next=emit(w);next.age=next.windup+next.active-1;w.updateHazards();assert.equal(w.hazards.length,0);
 w.enterPhase(1,true);w.phaseTick=180;assert.ok(emit(w));w.enterPhase(0,true);assert.equal(w.hazards.length,0);assert.equal(w.missileNextTick,180);
});
check('ordinary missile has legal basic-movement escape and shield/dash counters',()=>{
 // A missile aimed at the original centre leaves a whole upper and lower lane open.
 const w=world();w.phaseTick=180;const h=emit(w);const originalY=w.player.y;
 for(let i=0;i<30;i++)w.step({up:true});assert.ok(w.player.y<originalY-100);
 for(let i=0;i<1100;i++)w.step({});assert.equal(w.player.hp,5);assert.equal(w.state,'playing');assert.equal(h.resolved,false);
 for(const defense of ['dash','shield']){
  const c=world();c.phaseTick=180;const m=emit(c);m.age=m.windup;m.x=c.player.x-22;m.y=c.player.y-35;c.player[defense]=2;
  c.updateHazards();assert.equal(c.player.hp,5);assert.equal(m.resolved,true);assert.equal(c.events.at(-1).type,'counter');
 }
});
check('missile emission is replay deterministic and consumes no attack random numbers',()=>{
 const a=world(),b=world(),control=world();a.phaseTick=b.phaseTick=180;
 const x=emit(a),y=emit(b);assert.equal(JSON.stringify(x),JSON.stringify(y));assert.equal(a.attackRandom(),control.attackRandom());
 a.restart();a.phaseTick=180;assert.equal(JSON.stringify(emit(a)),JSON.stringify(y));
});
console.log('7 slow missile fixtures passed');
