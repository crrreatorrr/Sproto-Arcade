/* ARCADE-0001, ARCADE-0002: Marina's phase-two rotors must sit inside the painted fan openings. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const scope=vm.createContext({Math,Image:class{constructor(){this.naturalWidth=320;this.naturalHeight=318;}}});
vm.runInContext('function picture(p){const i=new Image();i.src=p;return i;}',scope);
for(const f of ['levels.js','arena-effects.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),scope);
const turbines=vm.runInContext('MARINA_TURBINES',scope),overscan=vm.runInContext('MARINA_ROTOR_OVERSCAN',scope);
assert.equal(vm.runInContext('STATIC_ARENAS[0][0]',scope),'marina-remake/engine-room.jpg');
// Inner edge of each painted brass housing ring in the 1280x720 arena, measured from engine-room.jpg.
// The engines are seen at an angle, so each opening is centred right of its painted hub.
const painted=[{hub:[-3,283],ring:[40,289,108,157]},{hub:[288,293],ring:[305,300,92,123]}];
// The rear engine's left side is hidden behind the front engine's housing.
const frontHousing=[92,285,170,210];
const inside=([cx,cy,rx,ry],x,y,margin=0)=>((x-cx)/(rx+margin))**2+((y-cy)/(ry+margin))**2<=1;
assert.equal(turbines.length,painted.length);
for(const [i,[x,y,rx,ry,rate,hubRx,hubRy,opening]] of turbines.entries()){
 const {hub,ring}=painted[i];
 assert.ok(rate!==0,'each rotor turns');
 assert.ok(Math.abs(x-hub[0])<=3&&Math.abs(y-hub[1])<=3,'rotor turns about the painted hub');
 const [ox,oy,orx,ory]=opening;
 // The clip stays a few pixels inside the painted ring so its bolts stay visible.
 assert.ok(Math.abs(ox-ring[0])<=3&&Math.abs(oy-ring[1])<=3,'clip is centred on the painted opening');
 assert.ok(orx<=ring[2]-2&&orx>=ring[2]-8&&ory<=ring[3]-2&&ory>=ring[3]-8,'clip follows the inner edge of the housing ring');
 // turbine.png: blades end about 145 px from the 160 px radius, then a riveted rim the painted engines lack.
 // The blades must reach the clip edge everywhere it is on screen, so no gap shows inside the ring.
 const tip=overscan*145/160;
 for(let a=0;a<360;a+=2){
  const px=ox+orx*Math.cos(a*Math.PI/180),py=oy+ory*Math.sin(a*Math.PI/180);
  if(px<0||py>434||(i===1&&inside(frontHousing,px,py)))continue;
  assert.ok(inside([x,y,rx*tip,ry*tip],px,py),'blades reach the painted ring at '+a+' deg on rotor '+i);
 }
 // turbine.png: the copper hub plate and its bolt ring end 68 px from the centre.
 const plate=rx*overscan*68/160;
 assert.ok(hubRx>=plate&&hubRy>=plate*ry/rx,'the hub cut hides the sprite copper plate');
 assert.ok(hubRx<orx&&hubRy<ory,'each rotor keeps the painted brass hub in front');
}
for(const time of [0,40,333]){
 const ops=[];let filterSet=false,rotor=null;
 const ctx=new Proxy({},{get(t,k){if(k in t)return t[k];return (...a)=>ops.push([k,...a]);},set(t,k,v){if(k==='filter'&&v!=='none')filterSet=true;t[k]=v;return true;}});
 ctx.drawImage=(img,...a)=>{if(String(img.src).endsWith('marina/turbine.png'))rotor=rotor||a;ops.push(['drawImage',img.src,...a]);};
 vm.runInContext('drawPhaseTwoAtmosphere',scope)(ctx,0,time);
 assert.equal(filterSet,false,'no per-frame canvas filter (qa/FILTER-BUDGET.md)');
 const [front]=turbines;const size=front[2]*overscan;
 assert.deepEqual(rotor,[-size,-size,size*2,size*2]);
 for(const [x,y,rx,ry,rate,hubRx,hubRy,[ox,oy,orx,ory]] of turbines){
  assert.equal(ops.filter(o=>o[0]==='ellipse'&&o[1]===ox&&o[2]===oy&&o[3]===orx&&o[4]===ory).length,1,'rotor clipped to the painted opening');
  assert.equal(ops.filter(o=>o[0]==='ellipse'&&o[1]===x&&o[2]===y&&o[3]===hubRx&&o[4]===hubRy).length,1,'hub ellipse cut out of each rotor clip');
  assert.equal(ops.filter(o=>o[0]==='translate'&&o[1]===x&&o[2]===y).length,1,'rotor centred on the painted hub');
 }
 assert.ok(ops.filter(o=>o[0]==='clip'&&o[1]==='evenodd').length>=turbines.length*2);
 const housing=ops.filter(o=>o[0]==='ellipse'&&o[1]===frontHousing[0]&&o[2]===frontHousing[1]&&o[3]===frontHousing[2]&&o[4]===frontHousing[3]);
 assert.equal(housing.length,1,'rear rotor masked by the front engine housing');
}
console.log('marina turbines ok: '+turbines.length+' rotors');
