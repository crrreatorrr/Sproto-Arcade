'use strict';
// Long technical samples deliberately keep targets/player alive. These are density/guard
// checks, not substitutes for the unmodified base-kit clear controllers in each stage.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),runtime=path.resolve(process.argv[2]||path.join(root,'runtime/core/world.js'));
const scope=vm.createContext({});
for(const file of [path.join(root,'runtime/contract.js'),runtime,...['03-mudline','07-moonkeep','09-hatchery','10-verse','12-codebreak'].map(id=>path.join(root,'stages',id,'stage.js'))])vm.runInContext(fs.readFileSync(file,'utf8'),scope);
const A=scope.Arcade,results=[];
const poses={
 '03-mudline':w=>{Object.assign(w.player,{x:220,y:390});Object.assign(w.data,{introduced:true,gateUnlocked:false});},
 '07-moonkeep':w=>{Object.assign(w.player,{x:1100,y:420,grounded:true,support:'upper-landing'});Object.assign(w.data,{crossed:true,crossedAt:0});},
 '09-hatchery':w=>Object.assign(w.player,{x:160,y:600,grounded:true,support:'conveyor-floor'}),
 '10-verse':w=>Object.assign(w.player,{x:220,y:350}),
 '12-codebreak':w=>Object.assign(w.player,{x:260,y:600,grounded:true,support:'summit-floor'})
};
for(const [id,setup] of Object.entries(poses)){
 const stage=A.stages.get(id),w=new A.World(stage,{phase:1,seed:37});setup(w);
 // Audit ordinary style alternation separately from the missile-priority shared pool.
 w.slowMissile=()=>null;w.player.hp=100000;for(const t of w.targets)t.hp=t.maxHp=100000;
 const emitted=[],authored=[],hazard=w.hazard.bind(w);let peak=0,activePeak=0;const activeStyles=new Set();
 w.hazard=spec=>{const h=hazard(spec);if(spec.pressure&&!spec.missile){
  assert.ok(w.phaseTick>=600);assert.ok(h.windup>=75);assert.ok(Math.hypot(h.vx,h.vy)>=2&&Math.hypot(h.vx,h.vy)<=3);
  assert.ok(Math.abs(h.x+h.w/2-w.player.x)>=360);emitted.push({tick:w.phaseTick,sprite:h.sprite});
 }else authored.push({source:h.source,speed:Math.hypot(h.vx,h.vy),authored:h.authoredSpeed,windup:h.windup,active:h.active});return h;};
 for(let i=0;i<3000;i++){w.step({});assert.equal(w.state,'playing');peak=Math.max(peak,w.hazards.filter(h=>h.pressure&&!h.removed).length);const active=w.hazards.filter(h=>h.pressure&&!h.missile&&!h.removed&&h.age>=h.windup);activePeak=Math.max(activePeak,active.length);for(const h of active)activeStyles.add(h.sprite);assert.ok(peak<=2);}
 assert.ok(emitted.length>=2,id+' must produce real pressure');const styles=[...new Set(emitted.map(h=>h.sprite))];assert.ok(styles.length>=2,id+' must emit both distinct styles');assert.equal(activeStyles.size,2,id+' both styles must survive the warning and actually travel');assert.ok(activePeak>0);
 // Exercise a protected state with a pre-existing projectile: it must disappear
 // on that update, rather than only suppressing the next scheduled emission.
 hazard({id:'guard-probe',pressure:true,rule:'ordinary',x:20,y:300,w:20,h:20,active:500});
 if(id==='03-mudline')Object.assign(w.data,{gateUnlocked:true,countered:true,unlockTick:w.phaseTick});
 if(id==='07-moonkeep')Object.assign(w.data,{crossed:false});
 if(id==='09-hatchery')Object.assign(w.player,{y:510,support:'conveyor-first-foot'});
 if(id==='10-verse')w.phaseTick=900; // center lane
 if(id==='12-codebreak')w.data.openUntil=w.phaseTick+210;
 stage.phases[1].update(w);assert.equal(w.hazards.some(h=>h.pressure&&!h.missile),false,id+' clears pressure during its protected setup');
 results.push({id,emitted:emitted.length,styles,peak,activePeak,first:emitted[0].tick,authored});
}
// Actual capped scanner active interval and the procedural pose share a deadline.
const cb=A.stages.get('12-codebreak'),scanner=new A.World(cb,{phase:1});
for(let i=0;i<90;i++)scanner.step({});const h=scanner.hazards.find(h=>h.source==='12-codebreak/summit-scanner');assert.ok(h);assert.equal(h.active,158);
scanner.phaseTick=90+h.windup+h.active-1;assert.equal(cb.phases[1].pose(scanner).scannerState,'release');
scanner.phaseTick++;assert.equal(cb.phases[1].pose(scanner).scannerState,'retract');
console.log(JSON.stringify(results.map(({authored,...r})=>({...r,attacks:[...new Map(authored.map(h=>[h.source,h])).values()]})),null,2));
console.log('PASS five-stage real runtime pressure population/styles, protected-state cleanup and normalized scanner pose deadline.');
