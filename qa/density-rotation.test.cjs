/* Real native C pixels stay unchanged; only the shared Canvas/numeric transform rotates. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const scope=vm.createContext({Image:class{constructor(){this.complete=true;this.naturalWidth=2048;this.naturalHeight=512;}}});
for(const f of ['runtime/story/sim-math.js','density-attacks.js','boss-sheets.js'])vm.runInContext(fs.readFileSync(f,'utf8'),scope);
const D=scope.ArcadeDensityAttacks,art=scope.ArcadeBossSheets;
const multiply=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
const inversePoint=(m,x,y)=>{const det=m[0]*m[3]-m[1]*m[2];return[(m[3]*(x-m[4])-m[2]*(y-m[5]))/det,(-m[1]*(x-m[4])+m[0]*(y-m[5]))/det];};
let cases=0;
for(const id of [11,12]){
 const path=`art/generated/missiles/${id}/missile.png`,meta=JSON.parse(fs.readFileSync(path.replace('.png','.json'),'utf8'));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),meta.outputSha256);
 assert.match(meta.sourceSha256,/^[0-9a-f]{64}$/);
 if(fs.existsSync(meta.sourceFile))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(meta.sourceFile)).digest('hex'),meta.sourceSha256,'available native input hash stays exact');
 assert.equal(meta.rotation,-3*Math.PI/4);assert.deepEqual(meta.rotationMatrix,[-Math.SQRT1_2,-Math.SQRT1_2]);
 const original=D.missileGeometry[id];D.missileGeometry[id]={bounds:meta.bounds,core:meta.core,rotation:meta.rotation,rotationMatrix:meta.rotationMatrix,orientedBounds:meta.orientedBounds,sourceSha256:meta.outputSha256};
 Object.assign(art.missileAssets[id],{ready:true,bounds:meta.bounds});
 for(const size of [32,38,44])for(const vx of [-1.5,1.5])for(let frame=0;frame<4;frame++){
  let matrix=[1,0,0,1,0,0],stack=[],draw;
  const ctx={filter:'none',save(){stack.push([...matrix]);},restore(){matrix=stack.pop();},translate(x,y){matrix=multiply(matrix,[1,0,0,1,x,y]);},scale(x,y){matrix=multiply(matrix,[x,0,0,y,0,0]);},rotate(a){matrix=multiply(matrix,[Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);},drawImage(img,...args){draw={matrix:[...matrix],args};}};
  const shot={stage:id,source:`boss-density-${id}`,density:true,x:200,y:300,w:size,h:size,vx};
  ctx.save();ctx.translate(shot.x+size/2,shot.y+size/2);ctx.scale(vx<0?-1:1,1);
  assert.ok(art.drawDensityMissile(ctx,shot,{x:-size/2,y:-size/2,w:size,h:size},frame*7));ctx.restore();
  const [sx,sy,sw,sh,dx,dy,dw,dh]=draw.args,core=D.damageRect(shot),native=meta.core;
  assert.ok(Math.abs(core.w-core.h)<1e-12);assert.ok(Math.abs(core.w-Math.min(native[2],native[3])/Math.SQRT2*D.missileTransform(D.missileGeometry[id],shot).scale)<1e-12);
  for(let iy=0;iy<=8;iy++)for(let ix=0;ix<=8;ix++){
   const [x,y]=inversePoint(draw.matrix,core.x+core.w*ix/8,core.y+core.h*iy/8);
   const sourceX=(sx%512)+(x-dx)*sw/dw,sourceY=sy+(y-dy)*sh/dh;
   assert.ok(sourceX>=native[0]-1e-8&&sourceX<=native[0]+native[2]+1e-8&&sourceY>=native[1]-1e-8&&sourceY<=native[1]+native[3]+1e-8,'every safe-square sample stays in native opaque core after actual Canvas transform');
  }
  // Native up-right nose vector (+1,-1) must become horizontal travel direction.
  const noseX=draw.matrix[0]-draw.matrix[2],noseY=draw.matrix[1]-draw.matrix[3];
  assert.equal(Math.sign(noseX),Math.sign(vx));assert.ok(Math.abs(noseY)<1e-12,'corrected nose is horizontal');
  const transform=D.missileTransform(D.missileGeometry[id],shot),o=meta.orientedBounds;
  assert.ok(o[2]*transform.scale<=size+1e-9&&o[3]*transform.scale<=size+1e-9,'actual oriented pixels fit game-size box without squeezing');
  cases++;
 }
 if(original)D.missileGeometry[id]=original;else delete D.missileGeometry[id];
}
// Existing upright sprites retain their exact numeric rectangle formula.
for(let id=1;id<=13;id++)if(![11,12].includes(id)){
 const g={bounds:[12,40,450,230],core:[120,90,230,130]},before=D.missileGeometry[id];D.missileGeometry[id]=g;
 for(const vx of [-1,1]){const shot={stage:id,x:7,y:11,w:38,h:38,vx},s=38/450,sign=vx<0?1:-1;
  assert.deepEqual(JSON.parse(JSON.stringify(D.damageRect(shot))),{x:26+(120+115-12-225)*s*sign-230*s/2,y:30+(90+65-40-115)*s-130*s/2,w:230*s,h:130*s});}
 if(before)D.missileGeometry[id]=before;else delete D.missileGeometry[id];
}
console.log(`PASS ${cases} actual C11/12 size/frame/direction Canvas transforms;3888 opaque-core sample containment checks; horizontal noses, actual-alpha fitting, source hashes and all11 nonrotated geometry preservation`);
