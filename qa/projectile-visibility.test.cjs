/* Readability may grow visible art, but never move or expose its original core. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Image {constructor(){this.complete=true;this.naturalWidth=this.naturalHeight=2048;}}
const scope=vm.createContext({Image});
vm.runInContext(fs.readFileSync('sprite-hitboxes.js','utf8'),scope);
vm.runInContext(fs.readFileSync('boss-sheets.js','utf8'),scope);
const sheets=scope.ArcadeBossSheets,data=vm.runInContext('SPRITE_HITBOXES',scope);
const untouched=JSON.stringify(data);let cases=0,boosted=0;
for(const [id,config]of Object.entries(sheets.manifest))for(const phase of [0,1])for(let row=0;row<4;row++){
 const asset=config.projectiles[phase];if(!asset.ready)continue;
 const core=data.stages[id][phase].projectiles[`orb@${row}`].core;
 for(const size of [24,36,160]){
  const box={x:-size/2,y:-size/2,w:size,h:size};
  const p=sheets.projectilePresentation(id,phase,row,box);assert.ok(p,`${id}/${phase}/${row} has reviewed geometry`);
  const original=scope.spriteProjectileCoreRect({reference:asset.bounds,crop:asset.rowBounds[row],core,visualBox:[size,size],kind:'contain',facing:asset.facing||config.projectileFacing},{x:0,y:0},0);
  assert.ok(Math.abs(p.x-(original.x+original.w/2))<1e-9,'visibility is anchored at the exact original collision core');
  assert.ok(Math.abs(p.y-(original.y+original.h/2))<1e-9);
  assert.ok(p.scale>=1&&p.scale<=2.5,'uniform boost is bounded and never shrinks an attack');
  const expanded={x:p.x-original.w*p.scale/2,y:p.y-original.h*p.scale/2,w:original.w*p.scale,h:original.h*p.scale};
  assert.ok(expanded.x<=original.x+1e-9&&expanded.y<=original.y+1e-9);
  assert.ok(expanded.x+expanded.w>=original.x+original.w-1e-9&&expanded.y+expanded.h>=original.y+original.h-1e-9,'old damaging core stays inside enlarged solid sprite');
  if(size===160)assert.equal(p.scale,1,'already-large silhouettes keep authored size');
  if(p.scale>1)boosted++;cases++;
 }
}
assert.equal(JSON.stringify(data),untouched,'presentation never changes the collision table');
const calls=[],states=[];
const ctx={filter:'none',save(){states.push(this.filter);},restore(){this.filter=states.pop();},translate(){},scale(...a){calls.push(['scale',...a]);},rotate(){},beginPath(){},rect(){},clip(){},drawImage(){calls.push(['draw',this.filter]);}};
const shot={shape:'orb',age:1};const before=JSON.stringify(shot);
sheets.drawProjectile(ctx,1,shot,{x:-12,y:-12,w:24,h:24},{phaseIndex:0,variant:0});
assert.ok(calls.some(c=>c[0]==='scale'&&c[1]>1),'small real projectile grows');
assert.ok(calls.some(c=>c[0]==='draw'&&c[1].includes('#f4fcff')&&c[1].includes('#06111f')),'both bright and dark contrast edges are applied');
assert.equal(ctx.filter,'none','contrast does not leak into surrounding scene');
assert.equal(JSON.stringify(shot),before,'rendering never mutates projectile state');
for(const rule of ['dash','shield']){
 calls.length=0;sheets.drawProjectile(ctx,1,{...shot,rule},{x:-12,y:-12,w:24,h:24},{phaseIndex:0,variant:0});
 assert.ok(!calls.some(c=>c[0]==='scale'&&c[1]>1),'required rule front keeps its authored extent');
}
calls.length=0;
sheets.drawProjectile(ctx,1,{shape:'prism',age:1},{x:0,y:0,w:800,h:16},{phaseIndex:0,variant:1});
assert.ok(!calls.some(c=>c[0]==='scale'&&c[1]>1),'tiled full-span beams retain exact authored span');
assert.ok(calls.filter(c=>c[0]==='draw').every(c=>c[1]==='none'),'tiled fronts keep their original warning presentation');
// Browser path: the keyline is baked once into an offscreen canvas with the same filter string
// and the main canvas only blits it, with no filter of its own.
{
 const baked=[],main=[];
 const surface=()=>{const pen={filter:'none',imageSmoothingEnabled:true,setTransform(){},drawImage(){baked.push(this.filter);}};return{width:0,height:0,getContext:()=>pen};};
 const browser=vm.createContext({Image,document:{createElement:surface}});
 vm.runInContext(fs.readFileSync('sprite-hitboxes.js','utf8'),browser);
 vm.runInContext(fs.readFileSync('density-attacks.js','utf8'),browser);
 vm.runInContext(fs.readFileSync('boss-sheets.js','utf8'),browser);
 const live=browser.ArcadeBossSheets,stack=[];
 const pen={filter:'none',matrix:{a:1,b:0,c:0,d:1,e:0,f:0},save(){stack.push({...this.matrix});},restore(){this.matrix=stack.pop();},
  translate(x,y){const m=this.matrix;m.e+=m.a*x+m.c*y;m.f+=m.b*x+m.d*y;},scale(x,y){const m=this.matrix;m.a*=x;m.b*=x;m.c*=y;m.d*=y;},rotate(){},
  getTransform(){return{...this.matrix};},setTransform(a,b,c,d,e,f){this.matrix={a,b,c,d,e,f};},beginPath(){},rect(){},clip(){},
  drawImage(image){main.push({filter:this.filter,baked:typeof image.getContext==='function',matrix:{...this.matrix}});}};
 for(let i=0;i<3;i++)live.drawProjectile(pen,1,{shape:'orb',age:1},{x:-12,y:-12,w:24,h:24},{phaseIndex:0,variant:0});
 assert.equal(baked.length,1,'one sprite frame at one size is baked once and reused');
 assert.ok(baked[0].includes('#f4fcff')&&baked[0].includes('#06111f'),'the baked outline uses both contrast edges');
 assert.equal(main.length,3);
 assert.ok(main.every(d=>d.baked&&d.filter==='none'&&d.matrix.a===1&&d.matrix.d===1&&Number.isInteger(d.matrix.e)&&Number.isInteger(d.matrix.f)),'the main canvas blits the baked sprite 1:1 with no filter');
 assert.equal(live.outlineStats.builds,1);assert.equal(live.outlineStats.blits,3);assert.equal(live.outlineStats.direct,0);
 live.drawDensityMissile(pen,{stage:1,vx:-5},{x:-20,y:-20,w:40,h:40},0);
 assert.ok(baked[1].includes('#ffffff')&&baked[1].includes('#111522'),'barrage missiles bake their glow the same way');
 main.length=0;live.drawProjectile(pen,1,{shape:'prism',age:1},{x:0,y:0,w:800,h:16},{phaseIndex:0,variant:1});
 assert.ok(main.length>1&&main.every(d=>!d.baked&&d.filter==='none'),'tiled full-span beams still draw directly and unfiltered');
 live.drawProjectile(pen,2,{shape:'orb',age:1},{x:-12,y:-12,w:24,h:24},{phaseIndex:0,variant:0});
 assert.equal(live.outlineCacheSize(),1,'the cache is dropped when the stage changes');
}
console.log(`PASS ${cases} production core-anchor/containment cases; ${boosted} small silhouettes enlarged; contrast, full-span guards and simulation immutability`);
