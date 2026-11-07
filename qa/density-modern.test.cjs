/* Modern World integration for the shared exclusive barrage planner. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope=vm.createContext({Image:class{constructor(){this.complete=true;this.naturalWidth=2048;this.naturalHeight=512;}}});
for(const file of ['sprite-hitboxes.js','density-attacks.js','phase-powerups.js','runtime/contract.js','runtime/core/world.js',...fs.readdirSync('stages').filter(s=>/^\d\d-/.test(s)).map(s=>'stages/'+s+'/stage.js'),'boss-sheets.js']){
 let source=fs.readFileSync(file,'utf8');if(file==='density-attacks.js')source=source.replace('enabled:false','enabled:true');if(file==='phase-powerups.js')source=source.replace('const assetsReady=true;','const assetsReady=false;');vm.runInContext(source,scope,{filename:file});
}
const A=scope.Arcade,D=scope.ArcadeDensityAttacks;
let phases=0;
function world(id,phase=0){
 return new A.World(A.stages.get(id),{phase,practice:true,seed:37});
}
function atDue(w){
 // Place the real phase at its due tick, leaving its authored methods intact.
 w.phaseTick=D.START-1;w.cueTicks=0;w.hazards=[];
 return w;
}
function finish(w){
 const start=w.tick;
 while(w.densityBarrage&&w.tick-start<1800)w.step({});
 assert.equal(w.densityBarrage,null,'the scheduled and live missiles fully drain');
}
for(const stage of A.stages.values())for(const phase of [0,1]){
 const w=new A.World(stage,{phase,practice:true,seed:37});
 w.hit=()=>{};w.autoFire=()=>{};
 // The authored route counters are tested by their stage suites. Here put
 // route phases past the required crossing to inspect the first legal entry.
 if(stage.number===4&&phase===1){w.data.crossed=true;w.player.x=3800;}
 if(stage.number===11){w.data.crossing=true;w.player.x=phase?7300:5200;}
 if(stage.number===10&&phase===0){w.data.crossings=3;w.player.x=4150;w.phaseTick=D.START-1;}
 const authoredUpdate=w.phase.update;let updates=0;
 w.phase={...w.phase,update(q){updates++;authoredUpdate?.(q);}};
 for(let t=0;t<1800&&!w.densityBarrage;t++)w.step({});
 const label=stage.id+'/'+(phase+1),barrage=w.densityBarrage;
 assert.equal(w.phaseIndex,phase,label+' enters in the intended phase');
 assert.ok(barrage,label+' enters at a real authored opening');
 assert.ok(w.phaseTick>=D.START,label+' never starts early');
 assert.ok(barrage.shots.length>=20,label+' schedules a substantial barrage');
 assert.ok(barrage.next<barrage.shots.length,label+' defers future waves');
 assert.ok(w.hazards.some(h=>h.density),label+' emits real missiles immediately');
 assert.ok(w.hazards.filter(h=>h.density).every(h=>h.delay===0&&h.windup===0),label+' has no pre-warning ghost');
 for(const h of w.hazards.filter(h=>h.density)){
  const planned=barrage.shots.find(s=>s.id===h.id);
  assert.deepEqual([h.vx,h.vy,h.active,h.weaponVariant],[planned.vx,planned.vy,planned.active,planned.weaponVariant],label+' retains planned tier speed and art');
 }
 assert.ok(!w.hazards.some(h=>h.pressure),label+' retires ordinary pressure');
 const phaseTick=w.phaseTick,startUpdates=updates;
 const firstDelay=barrage.shots[barrage.next].delay;
 for(let t=1;t<firstDelay;t++)w.step({});
 assert.ok(w.hazards.filter(h=>h.density).every(h=>h.delay===0),label+' keeps scheduled shots invisible');
 w.step({});
 assert.ok(w.hazards.some(h=>h.density&&h.delay===firstDelay),label+' emits the next wave exactly when due');
 finish(w);
 assert.equal(w.phaseTick,phaseTick,label+' freezes the authored phase clock through the final projectile');
 assert.equal(updates,startUpdates,label+' excludes every authored attack update');
 assert.ok(w.phaseElapsed>phaseTick,label+' pickup timers still advance');
 w.step({});
 assert.equal(w.phaseTick,phaseTick+1,label+' resumes the authored tick without skipping');
 assert.equal(updates,startUpdates+1,label+' resumes authored attacks');
 w.phaseTick+=3000;w.hazards=[];w.cueTicks=0;w.updateDensity();
 assert.equal(w.densityBarrage,null,label+' does not schedule a second barrage in the same phase');
 w.restart();assert.equal(w.phaseTick,0);assert.equal(w.densityBarrage,null);assert.equal(w.data.densityLastCycle,undefined);
 phases++;
}
assert.equal(phases,26);
for(const rule of ['ordinary','dash','shield']){
 const w=atDue(world('07-moonkeep'));
 const h=w.hazard({id:'committed-attack',rule,x:1200,y:100,w:20,h:500,windup:2,active:2});
 for(let t=0;t<3;t++){w.step({});assert.equal(w.densityBarrage,null,rule+' windup and live frames block entry');}
 w.step({});
 assert.ok(w.densityBarrage,rule+' expiry opens pending barrage');
 assert.ok(h.removed);
}
for(const [id,phase] of [['04-ranch',1],['10-verse',0],['11-rooftop',0],['11-rooftop',1]]){
 const w=atDue(world(id,phase));w.phaseTick=D.START;
 w.updateDensity();assert.equal(w.densityBarrage,null,id+' must finish its mandatory route crossing first');
}
for(const phase of [0,1]){
 const w=atDue(world('11-rooftop',phase));
 w.data.crossing=true;w.data.lastBurst=Math.floor(D.START/360);w.data.finalCue=true;
 w.player.x=w.phase.barrageRight-10;w.step({});
 assert.ok(w.densityBarrage);
 w.hit=()=>{};
 for(let t=0;t<140;t++)w.step({right:true});
 assert.equal(w.player.x,w.phase.barrageRight,'Rooftop holds at the authored exit during barrage');
 assert.equal(w.state,'playing');
 finish(w);w.step({});
 assert.equal(w.state,phase?'clear':'transition','the authored exit resumes immediately after barrage');
}
for(const id of ['04-ranch','05-neon']){
 const w=atDue(world(id));w.player.x=w.phase.barrageRight-10;w.step({});
 assert.ok(w.densityBarrage);w.hit=()=>{};
 const cameraX=w.camera.x;
 for(let tick=0;tick<100;tick++)w.step({right:true});
 assert.equal(w.camera.x,cameraX,'scrolling camera stays on the active barrage');
 assert.equal(w.player.x,w.phase.barrageRight,'the live boss remains ahead of the route handoff');
}
{
 const w=atDue(world('05-neon'));w.step({});assert.ok(w.densityBarrage);w.hit=()=>{};
 const cameraX=w.camera.x;
 for(let tick=0;tick<300;tick++)w.step({right:true});
 assert.equal(w.camera.x,cameraX);
 assert.equal(w.player.x,cameraX+1260,'player cannot outrun the fixed barrage viewport');
}
{
 const w=atDue(world('01-marina'));
 w.shotClock=4;w.step({});assert.ok(w.densityBarrage);
 const clock=w.shotClock,x=w.player.x,y=w.player.y;
 w.step({right:true,jump:true,beam:true,bomb:true,power:true});
 assert.ok(w.player.x>x&&w.player.y<y,'ground player can move and jump');
 assert.equal(w.shotClock,clock);assert.equal(w.player.beamWait,0);assert.equal(w.player.bombWait,0);assert.equal(w.shots.length,0,'barrage suspends player offense');
 w.step({right:true,dash:true});assert.ok(w.player.dash,'air dash stays available');
 w.advancePhase();assert.equal(w.densityBarrage,null);assert.equal(w.hazards.length,0);
 for(let tick=0;tick<90;tick++)w.step({});
 assert.equal(w.phaseIndex,1);assert.equal(w.phaseTick,0);assert.equal(w.data.densityLastCycle,undefined);
}
for(const down of [false,true]){
 const w=atDue(world('01-marina'));w.step({});w.hazards=[];
 const p=w.player,probe={id:'crouch-test',stage:1,source:'boss-density-1',density:true,x:p.x-16,y:p.y-40,w:32,h:32,active:1};
 const core=D.damageRect(probe);
 probe.x+=p.x-core.x-core.w/2;probe.y+=p.y-43-core.y-core.h/2;
 w.hazard(probe);w.step({down});
 assert.equal(p.hp,down?5:4,'grounded crouch clears a measured missile core at torso height');
}
{
 const w=atDue(world('07-moonkeep',1));w.step({});
 assert.ok(w.densityBarrage.shots.every(h=>h.vy===0),'Moonkeep uses altitude gaps');
 const y=w.player.y;w.step({up:true});assert.ok(w.player.y<y,'UFO can change altitude during the barrage');
 w.lose('barrage');w.restart();assert.equal(w.phaseIndex,1,'death during a phase two barrage retries phase two');assert.equal(w.densityBarrage,null);
}
{
 const w=atDue(world('12-codebreak'));w.step({});
 assert.ok(w.densityBarrage.shots.every(h=>h.vertical&&h.vy>0&&h.vx===0),'Codebreak ascent has lateral gaps in falling waves');
 const x=w.player.x;w.step({right:true});assert.ok(w.player.x>x);
 const cameraY=w.camera.y;
 Object.assign(w.player,{y:cameraY+54,grounded:false,vy:-13});
 w.step({});assert.equal(w.player.y,cameraY+52);assert.equal(w.camera.y,cameraY,'upward movement stays inside the fixed barrage viewport');
}
// Input-only full runs exercise both dodge types with the real player and cores.
for(const id of ['01-marina','13-redkev']){
 const w=new A.World(A.stages.get(id),{seed:17});
 const barrages=new Set();let jumps=0,tucks=0;
 for(let tick=0;tick<10000&&w.state!=='clear'&&w.state!=='lost';tick++){
  const p=w.player,input={};
  if(w.densityBarrage){
   barrages.add(w.phaseIndex);
   input.down=p.grounded;
   if(input.down)tucks++;
   const floor=w.platforms[0].y;
   const imminent=w.hazards.some(h=>{
    if(!h.density||h.resolved)return false;
    const b=w.collisionBounds('projectiles',h.source,h);
    if(b.y+b.h/2<=floor-30)return false;
    const leading=h.vx<0?b.x-p.x-16:p.x-16-b.x-b.w;
    const trailing=h.vx<0?b.x+b.w-p.x+16:p.x+16-b.x;
    return leading<Math.abs(h.vx)*4&&trailing>0;
   });
   if(imminent&&(p.grounded||(p.airJump&&p.vy>=3))){input.jump=true;jumps++;}
  }else{
   if(w.phaseIndex===0){
    if(!barrages.has(0)&&p.facing>0)input.left=true;
    if(barrages.has(0)&&p.facing<0)input.right=true;
   }
   if(w.phaseIndex===1){
    const front=w.hazards.find(h=>h.rule==='dash'&&h.age>=h.windup&&!h.resolved);
    if(front&&front.x>p.x&&front.x-p.x<85&&!p.dashWait){input.dash=true;input.right=true;}
    else if(!p.dash){if(p.x>265)input.left=true;else if(p.facing<0)input.right=true;}
   }
   const wake=w.hazards.find(h=>h.rule==='ordinary'&&h.age>=h.windup&&!h.resolved);
   if(wake&&wake.x>p.x&&wake.x-p.x<110&&p.grounded)input.jump=true;
   // Redkev's raised P2 damage area calls for a jumping shot in the vent window.
   if(id==='13-redkev'&&w.phaseIndex===1&&barrages.has(1)&&w.targets[0].open&&p.grounded)input.jump=true;
  }
  w.step(input);
 }
 assert.equal(w.state,'clear',id+' clears both barrages with ordinary input');
 assert.equal(w.player.hp,5,id+' takes no damage');
 assert.deepEqual([...barrages],[0,1]);assert.ok(jumps>0&&tucks>0);
 console.log(`PASS input-only ${id} clear through both barrages in ${w.tick} ticks`);
}
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
console.log(`PASS ${phases} modern phase configurations: exclusive timeline, delayed emissions, single barrage, route gates, mobility and measured missile cores`);
