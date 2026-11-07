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
console.log(`PASS ${cases} production core-anchor/containment cases; ${boosted} small silhouettes enlarged; contrast, full-span guards and simulation immutability`);
