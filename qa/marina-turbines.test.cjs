/* ARCADE-0001: Marina's phase-two rotors must sit inside the painted engine faces. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const scope=vm.createContext({Math,Image:class{constructor(){this.naturalWidth=320;this.naturalHeight=318;}}});
vm.runInContext('function picture(p){const i=new Image();i.src=p;return i;}',scope);
for(const f of ['levels.js','arena-effects.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),scope);
const turbines=vm.runInContext('MARINA_TURBINES',scope),overscan=vm.runInContext('MARINA_ROTOR_OVERSCAN',scope);
assert.equal(vm.runInContext('STATIC_ARENAS[0][0]',scope),'marina-remake/engine-room.jpg');
// turbine.png: blades end about 145 px from the 160 px radius, then a riveted rim the painted engines lack.
assert.ok(overscan*145/160>=1,'the sprite rim falls outside the painted fan opening');
for(const [x,y,rx,ry,rate,hubRx,hubRy] of turbines){
 assert.ok(rate!==0&&hubRx>0&&hubRy>0&&hubRx<rx&&hubRy<ry,'each rotor keeps the painted brass hub in front');
}
for(const time of [0,40,333]){
 const ops=[];let filterSet=false,rotor=null;
 const ctx=new Proxy({},{get(t,k){if(k in t)return t[k];return (...a)=>ops.push([k,...a]);},set(t,k,v){if(k==='filter'&&v!=='none')filterSet=true;t[k]=v;return true;}});
 ctx.drawImage=(img,...a)=>{if(String(img.src).endsWith('marina/turbine.png'))rotor=rotor||a;ops.push(['drawImage',img.src,...a]);};
 vm.runInContext('drawPhaseTwoAtmosphere',scope)(ctx,0,time);
 assert.equal(filterSet,false,'no per-frame canvas filter (qa/FILTER-BUDGET.md)');
 const [front]=turbines;const size=front[2]*overscan;
 assert.deepEqual(rotor,[-size,-size,size*2,size*2]);
 const hubs=ops.filter(o=>o[0]==='ellipse'&&turbines.some(t=>o[3]===t[5]&&o[4]===t[6]));
 assert.equal(hubs.length,turbines.length,'hub ellipse cut out of each rotor clip');
 assert.ok(ops.filter(o=>o[0]==='clip'&&o[1]==='evenodd').length>=turbines.length*2);
}
console.log('marina turbines ok: '+turbines.length+' rotors');
