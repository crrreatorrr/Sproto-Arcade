/* Controlled integration diagnostics: real campaign phase configuration, shared World
 * scheduling, swept contact and cleanup; stationary players isolate the new barrage. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope=vm.createContext({Image:class{constructor(){this.complete=true;this.naturalWidth=2048;this.naturalHeight=512;}}});
for(const file of ['sprite-hitboxes.js','density-attacks.js','phase-powerups.js','runtime/contract.js','runtime/core/world.js',...fs.readdirSync('stages').filter(s=>/^\d\d-/.test(s)).map(s=>'stages/'+s+'/stage.js'),'boss-sheets.js']){
 let source=fs.readFileSync(file,'utf8');if(file==='density-attacks.js')source=source.replace('enabled:false','enabled:true');if(file==='phase-powerups.js')source=source.replace('const assetsReady=true;','const assetsReady=false;');vm.runInContext(source,scope,{filename:file});
}
const A=scope.Arcade,D=scope.ArcadeDensityAttacks;
let phases=0;
function stationary(w){
 w.phase={...w.phase,update(){}};w.hazards=[];w.shots=[];
 w.movePlayer=function(){this.player.prevX=this.player.x;this.player.prevY=this.player.y;};w.autoFire=()=>{};w.updateShots=()=>{};
 w.player.inv=0;w.player.shield=0;w.player.dash=0;w.updateCamera();return w;
}
for(const stage of A.stages.values())for(const phase of [0,1]){
 const w=stationary(new A.World(stage,{phase,practice:true,seed:37}));
 const hp=w.player.hp;w.phaseTick=D.START-1;w.step({});
 assert.ok(w.hazards.filter(h=>h.density).length>=12,stage.id+'/'+phase+' emits a substantial barrage');
 assert.ok(w.data.densityLane,'modern renderer receives the committed green lane');
 const initial=w.hazards.filter(h=>h.density);let survived145=false;
 for(let t=0;t<D.PERIOD-1;t++){
  w.step({});
  survived145 ||=w.hazards.some(h=>h.density&&h.age>145);
  assert.equal(w.player.hp,hp,'the actual 52px body remains safe from every slow missile');
 }
 assert.ok(survived145,'modern missile life is independent from ordinary legacy145 limit');
 assert.ok(w.hazards.every(h=>!h.density),'complete barrage expires before the next scheduled volley');
 w.enterPhase(phase,false);assert.equal(w.phaseTick,0);assert.equal(w.data.densityLane,undefined);assert.equal(w.hazards.filter(h=>h.density).length,0);
 w.restart();assert.equal(w.phaseTick,0,'retry starts a fresh phase-local schedule');phases++;
}
// A real transition resets the phase-local clock and all density state.
{
 const w=stationary(new A.World(A.stages.get('07-moonkeep'),{}));w.phaseTick=D.START-1;w.step({});assert.ok(w.data.densityLane);
 w.advancePhase();assert.equal(w.hazards.filter(h=>h.density).length,0);
 for(let tick=0;tick<90;tick++)w.step({});
 assert.equal(w.phaseIndex,1);assert.equal(w.phaseTick,0);assert.equal(w.data.densityLane,undefined);
}
// Fronts inserted externally before step must purge density BEFORE any collision.
for(const rule of ['dash','shield']){
 const w=stationary(new A.World(A.stages.get('07-moonkeep'),{practice:true}));
 w.hazard({id:'overlapping-density',density:true,source:'boss-density-7',x:w.player.x-16,y:w.player.y-40,w:32,h:32,vx:0,vy:0,windup:0,active:500});
 w.hazard({id:'mandatory-front',rule,x:1200,y:100,w:20,h:500,windup:90,active:100});w.data.densityLane={top:200,bottom:400};
 const hp=w.player.hp;w.step({});assert.equal(w.player.hp,hp,'front cleanup precedes stale density contact');assert.equal(w.hazards.filter(h=>h.density).length,0);assert.equal(w.data.densityLane,null);
}
// Fronts emitted by phase.update are cleared in that same step and cannot reach
// the following collision pass alongside a residual barrage.
{
 const w=stationary(new A.World(A.stages.get('07-moonkeep'),{}));w.phaseTick=D.START-1;w.step({});
 assert.ok(w.hazards.some(h=>h.density));w.phase.update=q=>q.hazard({id:'new-front',rule:'dash',x:1200,y:100,w:20,h:500,windup:90,active:100});
 w.step({});assert.equal(w.hazards.filter(h=>h.density).length,0);assert.equal(w.data.densityLane,null);
}
// A blocked due tick stays pending until the first safe opening. Clearing
// that committed volley later must not re-arm the same cycle.
{
 const w=stationary(new A.World(A.stages.get('07-moonkeep'),{}));w.phaseTick=D.START-1;
 w.hazard({id:'due-front',rule:'dash',x:1200,y:100,w:20,h:500,windup:90,active:1000});
 w.step({});assert.equal(w.hazards.filter(h=>h.density).length,0);assert.equal(w.data.densityLastCycle,undefined);
 w.hazards=[];w.step({});assert.ok(w.hazards.some(h=>h.density));assert.equal(w.data.densityLastCycle,0);
 w.hazard({id:'later-front',rule:'shield',x:1200,y:100,w:20,h:500,windup:90,active:1000});w.step({});
 assert.equal(w.hazards.filter(h=>h.density).length,0);w.hazards=[];w.step({});
 assert.equal(w.hazards.filter(h=>h.density).length,0,'cleared committed cycle cannot emit twice');
 w.phaseTick=D.START+D.PERIOD-1;w.step({});assert.ok(w.hazards.some(h=>h.density));assert.equal(w.data.densityLastCycle,1);
}
// Run actual authored phase.update methods for 2400ticks (no autofire, damage
// or falls). These observations are not earned clears. Route-gated phases
// remain protected until an explicit resolved-front opening is supplied.
const authored=[];
for(const stage of A.stages.values())for(const phase of [0,1]){
 const w=new A.World(stage,{phase,practice:true,seed:42});w.player.hp=100000;w.hit=()=>{};w.lose=()=>{};w.damageTarget=()=>false;w.autoFire=()=>{};
 let emissions=0,frontTicks=0;const hazard=w.hazard.bind(w);w.hazard=spec=>{if(spec.density)emissions++;return hazard(spec);};
 for(let tick=0;tick<2400;tick++){if(w.hazards.some(h=>!h.removed&&!h.resolved&&['dash','shield'].includes(h.rule)))frontTicks++;w.step({});}
 let resolvedGateOpening=false;
 if(!emissions){
  assert.ok(frontTicks>=2390,stage.id+'/'+phase+' cannot starve due to exact-tick gate alignment when safe intervals exist');
  for(const h of w.hazards)if(['dash','shield'].includes(h.rule))h.resolved=true;
  w.updateDensity();resolvedGateOpening=true;
 }
 assert.ok(emissions>0,stage.id+'/'+phase+' emits once an authored or countered-front legal opening exists');
 authored.push({stage:stage.number,phase:phase+1,emissions,frontTicks,resolvedGateOpening});
}
console.log('Authored density observation:',JSON.stringify(authored));
// Measured thin/off-center art has exactly the same contained/mirrored damage
// core in both runtimes and in the actual Canvas renderer transforms.
const previous=D.missileGeometry[1];D.missileGeometry[1]={bounds:[10,20,400,80],core:[60,35,180,40],sourceSha256:'fixture'};
const asset=scope.ArcadeBossSheets.missileAssets[1];asset.ready=true;asset.bounds=[10,20,400,80];
for(const vx of [-1.5,1.5]){
 let matrix={sx:1,sy:1,tx:0,ty:0},stack=[],drawn=null;
 const ctx={filter:'none',save(){stack.push({...matrix});},restore(){matrix=stack.pop();},translate(x,y){matrix.tx+=x*matrix.sx;matrix.ty+=y*matrix.sy;},scale(x,y){matrix.sx*=x;matrix.sy*=y;},drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh){const [cx,cy,cw,ch]=D.missileGeometry[1].core,x=dx+(cx-sx)*dw/sw,y=dy+(cy-sy)*dh/sh;const x2=x+cw*dw/sw,y2=y+ch*dh/sh;drawn={x:matrix.tx+Math.min(x*matrix.sx,x2*matrix.sx),y:matrix.ty+Math.min(y*matrix.sy,y2*matrix.sy),w:Math.abs((x2-x)*matrix.sx),h:Math.abs((y2-y)*matrix.sy)};}};
 const shot={stage:1,source:'boss-density-1',density:true,x:400,y:250,w:32,h:32,vx};
 ctx.save();ctx.translate(shot.x+16,shot.y+16);ctx.scale(vx<0?-1:1,1);
 assert.ok(scope.ArcadeBossSheets.drawDensityMissile(ctx,shot,{x:-16,y:-16,w:32,h:32},0));ctx.restore();
 const expected=D.damageRect(shot);for(const key of ['x','y','w','h'])assert.ok(Math.abs(drawn[key]-expected[key])<1e-9,'measured damage core follows the exact contained/mirrored Canvas art');
 const w=new A.World(A.stages.get('01-marina'),{}),projected=w.collisionBounds('projectiles',[shot.source,'missile'],shot);
 for(const key of ['x','y','w','h'])assert.equal(projected[key],expected[key]);
 assert.ok(expected.h<shot.h*.65,'thin art cannot retain an invisible square damage core');
}
if(previous)D.missileGeometry[1]=previous;else delete D.missileGeometry[1];
// Shared source may also be embedded without optional feature modules.
const bare=vm.createContext({});for(const f of ['runtime/contract.js','runtime/core/world.js','stages/07-moonkeep/stage.js'])vm.runInContext(fs.readFileSync(f,'utf8'),bare);
const bareWorld=new bare.Arcade.World(bare.Arcade.stages.get('07-moonkeep'),{});assert.doesNotThrow(()=>bareWorld.step({}));
console.log(`PASS ${phases} real modern phase configurations: schedules, full lifetime, swept safe corridor, phase/retry reset; pre-collision + newly emitted front cleanup; measured atlas core/Canvas alignment in both directions; optional-module startup`);
