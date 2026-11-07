/* Atlas adoption must be safe before, during and after image loading. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const created=[];
class FakeImage {
  constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;created.push(this);}
}
const sandbox={Image:FakeImage};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('sprite-hitboxes.js','utf8'),sandbox);vm.runInContext(fs.readFileSync('boss-sheets.js','utf8'),sandbox);
const sheets=sandbox.ArcadeBossSheets;
// Fixture readiness/geometry is independent of which production art has shipped.
for(const config of Object.values(sheets.manifest))for(const asset of [...config.phases,...config.projectiles]){
  asset.ready=false;delete asset.bounds;delete asset.rowBounds;delete asset.facing;
}
const calls=[];
const ctx={save(){},restore(){},translate(...args){calls.push(['translate',...args]);},scale(...args){calls.push(['scale',...args]);},rotate(...args){calls.push(['rotate',...args]);},beginPath(){},rect(...args){calls.push(['rect',...args]);},clip(rule){calls.push(['clip',rule]);},drawImage(...args){calls.push(['draw',...args]);}};
const world={stage:{id:'01-marina'},phaseIndex:0,phaseTick:0,camera:{x:0,y:0},data:{},targets:[],hazards:[],phase:{pilot:{x:1048,y:440}}};
const unchanged=JSON.stringify(world);
assert.equal(sheets.drawMachine(ctx,world),false);
assert.equal(created.length,0,'unapproved/missing files must not issue image requests');
const phase=sheets.manifest[1].phases[0];phase.ready=true;
assert.equal(sheets.drawMachine(ctx,world),false,'pending image preserves the original machine');
assert.equal(created.length,1);
const img=created[0];img.complete=true;img.naturalWidth=1024;img.naturalHeight=1024;
assert.equal(sheets.drawMachine(ctx,world),true);
assert.equal(calls.filter(c=>c[0]==='clip').length,0,'machine replacement must not clip route or rule drawings');
const draw=calls.find(c=>c[0]==='draw');
assert.deepEqual(draw.slice(2,6),[0,0,256,256],'idle frame sampled from fixed phase ticks');
assert.equal(JSON.stringify(world),unchanged,'rendering must never mutate simulation state');
const lastDraw=calls.filter(c=>c[0]==='draw').at(-1);assert.equal(lastDraw[8],lastDraw[9],'square atlas frames must retain aspect ratio');
img.naturalWidth=1023;
assert.equal(sheets.drawMachine(ctx,world),false,'malformed atlases preserve original art');
img.naturalWidth=1024;
world.stage.id='06-circuit';
world.hazards=[{id:'wake-1',source:'circuit.relay-arc.discharge',age:10,windup:20,active:30}];
const warning=sheets.attackPose(world);
world.hazards[0].id='same-source-another-emission';assert.equal(sheets.attackPose(world).row,warning.row,'attack source, not emission ID, selects the animation');assert.ok(warning.row>=1&&warning.row<=3);assert.equal(warning.column,1);
world.hazards[0].age=20;assert.equal(sheets.attackPose(world).column,2);
world.hazards[0].age=32;assert.equal(sheets.attackPose(world).column,3);
world.hazards[0].age=50;assert.equal(sheets.attackPose(world).row,0);
assert.equal(sheets.drawProjectile(ctx,1,{shape:'water',age:0},{x:0,y:0,w:16,h:16}),false);
assert.equal(created.length,1,'unavailable projectile files preserve existing art without a request');
assert.equal(sheets.projectileKind(1,{shape:'prism'},{w:67,h:23}),'ray');
assert.equal(sheets.projectileKind(1,{shape:'pumpkin'},{w:43,h:43}),'large');
assert.equal(sheets.projectileKind(1,{missile:true},{w:82,h:28}),'missile');
assert.equal(sheets.projectileKind(1,{shape:'orb'},{w:24,h:24}),'compact');
assert.equal(sheets.projectileKind(1,{source:'marina-dock-spray',shape:'droplet'},{w:20,h:20}),'compact','spray is not a ray token');
assert.equal(sheets.projectileKind(1,{source:'factory.light-ray.release'},{w:20,h:20}),'ray');
const projectile=sheets.manifest[1].projectiles[0];projectile.ready=true;projectile.rowBounds=[[16,16,224,224],[10,100,220,40],[8,8,240,240],[8,80,240,90]];
sheets.drawProjectile(ctx,1,{shape:'prism',age:0},{x:0,y:0,w:64,h:16},{variant:1});
const ray=created.at(-1);ray.complete=true;ray.naturalWidth=ray.naturalHeight=1024;
assert.equal(sheets.drawProjectile(ctx,1,{shape:'prism',age:0},{x:0,y:0,w:64,h:16},{variant:1}),true);
const rayDraw=calls.filter(c=>c[0]==='draw').at(-1);assert.deepEqual(rayDraw.slice(2,6),[10,356,220,40]);assert.equal(rayDraw[8],59);assert.equal(rayDraw[9],11);
assert.deepEqual(calls.filter(c=>c[0]==='scale').at(-1),['scale',-1,1],'left-authored projectiles normalize to the caller’s right-facing transform');
const rayCount=calls.filter(c=>c[0]==='draw').length;
sheets.drawProjectile(ctx,1,{source:'light.iris-shot.beam',age:0},{x:0,y:0,w:800,h:16},{variant:1});
assert.ok(calls.filter(c=>c[0]==='draw').length-rayCount>1,'long beams must cover their full dangerous span without stretching');
sheets.drawProjectile(ctx,1,{shape:'needle',vy:-4,age:0},{x:0,y:0,w:12,h:54},{variant:1});
assert.deepEqual(calls.filter(c=>c[0]==='rotate').at(-1),['rotate',-Math.PI/2]);
projectile.bounds=[0,0,256,256];projectile.rowBounds=[[96,96,64,64],[64,112,128,32],[32,32,192,192],[8,8,240,240]];
const sizes=[];
for(const variant of [0,1,2]){
  sheets.drawProjectile(ctx,1,{shape:'orb',age:0},{x:0,y:0,w:48,h:48},{variant});
  sizes.push(calls.filter(c=>c[0]==='draw').at(-1).slice(8,10));
}
assert.deepEqual(sizes,[[12,12],[24,6],[36,36]],'same authored shot bounds retain A/B/C atlas width, height and size variation');
projectile.facing='right';
const rightFacingStart=calls.length;
sheets.drawProjectile(ctx,1,{shape:'orb',age:0},{x:0,y:0,w:48,h:48},{variant:0});
assert.equal(calls.slice(rightFacingStart).filter(c=>c[0]==='scale').length,0,'verified phase facing overrides the default source orientation');
delete projectile.facing;
for(const shape of ['orb','prism','missile'])for(const vx of [-4,4]){
  const before=calls.length,angle=Math.atan2(0,vx);
  sheets.drawProjectile(ctx,1,{shape,vx,vy:0,age:0},{x:-24,y:-12,w:48,h:24},{variant:0,directionAngle:angle});
  const emitted=calls.slice(before);
  assert.deepEqual(emitted.filter(c=>c[0]==='rotate'),[['rotate',angle]],shape+' uses one explicit velocity direction');
  assert.equal(emitted.filter(c=>c[0]==='scale').length,1,'source LEFT normalization happens once');
}
for(const angle of [0,Math.PI,-Math.PI/2]){
  const before=calls.length;ctx.rotate(angle+Math.PI/2);
  sheets.drawProjectile(ctx,1,{shape:'orb',age:0},{x:-12,y:-24,w:24,h:48},{variant:0,directionAngle:-Math.PI/2});
  assert.ok(Math.abs(calls.slice(before).filter(c=>c[0]==='rotate').reduce((total,c)=>total+c[1],0)-angle)<1e-10,'Codebreak local +Y caller is corrected to the shot direction');
}
for(const number of Object.keys(sheets.manifest)){
  for(const index of [0,1]){
    const mock={...world,stage:{id:String(number).padStart(2,'0')+'-test'},phaseIndex:index,phase:{pilot:()=>({x:1050,y:400})}};
    const box=sheets.machineBox(mock);
    assert.ok(['x','y','w','h'].every(key=>Number.isFinite(box[key])));assert.ok(box.w>0&&box.h>0);
    if(Number(number)===11)assert.equal(box.flip,index===0,'pursuing aircraft faces its original firing direction');
  }
}
for(const [phaseIndex,expected]of [[0,{x:930,y:185,w:330,h:280}],[1,{x:952,y:222,w:328,h:280}]])assert.deepEqual(JSON.parse(JSON.stringify(sheets.machineBox({stage:{id:'07-moonkeep'},phaseIndex,data:{}}))),expected,'phase-specific dragon draw calibration preserves P1');
for(const [phaseIndex,expected]of [[0,{x:920,y:300,w:320,h:300}],[1,{x:760,y:140,w:510,h:460}]])assert.deepEqual(JSON.parse(JSON.stringify(sheets.machineBox({stage:{id:'08-crown'},phaseIndex,data:{}}))),expected,'phase-specific tank draw calibration preserves P1');
for(const [phaseIndex,expected]of [[0,{x:3858,y:400,w:390,h:220}],[1,{x:3996,y:290,w:390,h:310}]])assert.deepEqual(JSON.parse(JSON.stringify(sheets.machineBox({stage:{id:'04-ranch'},phaseIndex,data:{offset:100}}))),expected,'calibrated harvester/train retain authored routeoffset');
const ranchRegistered=sheets.legacyBox(4,0,{x:100,y:200,w:380,h:498.4});for(const[key,value]of Object.entries({x:-23.3,y:200,w:520.6,h:498.4}))assert.ok(Math.abs(ranchRegistered[key]-value)<1e-9,'approved Ranch scale/offset moves only the drawing and preserves its bottom baseline');
for(const[phaseIndex,expected]of [[0,{x:4595,y:260,w:400,h:340}],[1,{x:920,y:160,w:340,h:440}]])assert.deepEqual(JSON.parse(JSON.stringify(sheets.machineBox({stage:{id:'05-neon'},phaseIndex,data:{}}))),expected,'new Collector P1 uses its measured claw registration while P2 stays unchanged');
console.log('PASS atlas readiness, loading/error fallback, fixed-tick frame sampling, rule-drawing preservation and simulation immutability');

assert.deepEqual(JSON.parse(JSON.stringify(sheets.legacyBox(5,0,{x:-190,y:-510.4,w:380,h:498.4}))),{x:-301,y:-510.4,w:456,h:498.4},'new Collector hover rig retains the floor baseline and opaque homing registration');

for(const [phaseIndex,expected]of [[0,{x:930,y:322,w:320,h:240}],[1,{x:956,y:322,w:320,h:280}]])assert.deepEqual(JSON.parse(JSON.stringify(sheets.machineBox({stage:{id:'12-codebreak'},phaseIndex,data:{},phase:{pilot:()=>({x:1090,y:452})}}))),expected,'summit P2 draw registration keeps fixed vent on leg armor and preserves climb pose');

const salvageMax=sheets.legacyBox(5,0,{x:1070-190,y:600-510.4,w:380,h:498.4});assert.ok(salvageMax.x+salvageMax.w<=1280,'all-column alpha union remains inside viewport at maximum authored boss x');

const salesMax=sheets.legacyBox(10,0,{x:1070-190,y:600-539.4,w:380,h:527.4});assert.equal(Math.round(salesMax.w),494);assert.ok(salesMax.x+salesMax.w<=1280,'carrier full alpha union stays inside viewport at authored boss maximum');
