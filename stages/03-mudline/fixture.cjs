'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={};vm.createContext(context);
for(const path of ['runtime/contract.js','stages/03-mudline/stage.js'])vm.runInContext(fs.readFileSync(path,'utf8'),context,{filename:path});
const stage=context.Arcade.stages.get('03-mudline');
function world(phase){
 const w={phaseTick:0,phaseIndex:phase,data:{},targets:[],hazards:[],platforms:[],events:[],player:{x:220,y:340,dashWait:20},drops:[],state:'playing',progress:0,
 target(t){this.targets.push(t);return t;},hazard(h){this.hazards.push(h);return h;},platform(p){this.platforms.push(p);return p;},cue(){},drop(id){this.drops.push(id);},advancePhase(){this.state='transition';},clear(){this.state='clear';},redirectVolley(v){return v;}};
 stage.phases[phase].enter(w);return w;
}
const p1=stage.phases[0],w=world(0),vent=w.targets[0];
for(let t=1;t<=360;t++){w.phaseTick=t;p1.update(w);if(t===90)assert.equal(w.data.aimY,314);if(t===145)assert.equal(w.hazards.length,1);if(t===155)assert.equal(vent.open,true);if(t===300)assert.equal(vent.open,false);}
vent.hp=19;p1.update(w);p1.update(w);assert.deepEqual(w.drops,['mudline-first-vent']);vent.onDefeat(w,vent);assert.equal(w.state,'transition');
const p2=stage.phases[1],a=world(1);
a.phaseTick=1;p2.update(a);assert.equal(a.targets.find(t=>t.id==='latch-1').open,true);assert.equal(a.targets.find(t=>t.id==='intake-1').open,false);
a.player.y=520;p2.update(a);assert.equal(a.targets.find(t=>t.id==='intake-1').open,true);
a.phaseTick=60;a.targets.find(t=>t.id==='intake-1').onDefeat(a,a.targets.find(t=>t.id==='intake-1'));assert.equal(a.data.introduced,true);assert.equal(a.hazards.length,0);p2.update(a);assert.equal(a.targets[0].open,true);
a.phaseTick=260;p2.update(a);assert.equal(a.data.round,2);a.phaseTick=300;a.targets.find(t=>t.id==='latch-2').onDefeat(a,a.targets.find(t=>t.id==='latch-2'));assert.equal(a.hazards[0].rule,'dash');assert.equal(a.hazards[0].windup,90);assert.equal(a.player.dashWait,0);p2.update(a);assert.equal(a.targets[0].open,false);
a.events=[{type:'hit',source:'backflush-front',rule:'dash'}];p2.update(a);assert.equal(a.targets[0].open,false);
a.events=[{type:'counter',source:'backflush-front',rule:'dash'}];p2.update(a);assert.equal(a.targets[0].open,true);
a.targets[0].hp-=8;a.events=[];p2.update(a);assert.equal(a.targets[0].open,false);
a.targets[0].onDefeat(a,a.targets[0]);assert.equal(a.state,'clear');
const b=world(1);b.data.introduced=true;b.phaseTick=10;b.targets.find(t=>t.id==='latch-1').onDefeat(b,b.targets.find(t=>t.id==='latch-1'));b.phaseTick=290;p2.update(b);assert.equal(b.data.round,2);assert.equal(b.targets[0].open,false);
console.log('Mudline authored fixture passed: telegraph, windows, route selection, drop dedup, clean introduction, dash gate, missed-front recovery, phase/clear callbacks. Collision and browser play not covered.');
