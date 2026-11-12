/* Real legacy pose selection must not crash before a ready Redkev atlas draw. */
const fs=require('node:fs'),vm=require('node:vm'),acorn=require('acorn'),assert=require('node:assert/strict');
const ctx=new Proxy({}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),s=vm.createContext({ctx,levelIndex:12,LEVELS:Array.from({length:13},(_,i)=>({id:i+1})),time:80,phaseShift:0,STAGE_BLAST:54,transition:50,FLOOR:604,densityShots:[],hazards:[],moves:{rush:{active:29},quake:{active:38}},phaseTwoMoves:[],isGroundColumn:()=>false,isFlying:()=>false,hasMecha:()=>false,shadow(){},clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),bossWeakY:b=>b.y-222,SimMath:Math,sprite(id,pose){assert.equal(id,'redkev');assert.equal(pose[0],'fighters/poses/redkev/00.png');s.fallbacks++;},fallbacks:0});
vm.runInContext(fs.readFileSync('assets.js','utf8')+';globalThis.reference=ART.sprites.redkev;',s);
assert.deepEqual(Array.from(s.reference.poses[0]),['fighters/poses/redkev/00.png',112,210]);const png=fs.readFileSync(s.reference.poses[0][0]);assert.equal(png.readUInt32BE(16),256);assert.equal(png.readUInt32BE(20),256);
const source=fs.readFileSync('game.js','utf8'),ast=acorn.parse(source,{ecmaVersion:'latest'});for(const node of ast.body)if(node.type==='FunctionDeclaration'&&['walk','bossSheetBox','renderBoss'].includes(node.id.name))vm.runInContext(source.slice(node.start,node.end),s);
s.isNaval=()=>false;
let atlas=true,draws=0;s.ArcadeBossSheets={legacyVariant:()=>0,legacyPose:()=>({row:1,column:2}),drawBoss(ctx,id,phase){assert.equal(id,13);assert.ok([0,1].includes(phase));draws++;return atlas;}};
for(const phase of [1,2])for(const scene of [{move:'rush',age:50,tell:37,distance:90,moving:true},{move:'quake',age:100,tell:28,distance:-90,moving:true},{move:'rush',age:40,tell:37,distance:0,moving:false},{move:null,age:5,distance:0,moving:false}]){
 s.boss={id:'redkev',x:1010,y:604,scale:4.4,hp:100,phase,flash:0,lanes:[],...scene};vm.runInContext('renderBoss()',s);assert.equal(s.fallbacks,0,'ready generated atlas retains canonical identity and never needs fallback draw');
}
assert.equal(draws,8);atlas=false;s.boss.move='rush';s.boss.age=50;s.boss.tell=37;vm.runInContext('renderBoss()',s);assert.equal(s.fallbacks,1,'canonical fallback also resolves the real Redkev asset');
console.log('PASS actual Redkev walk/renderBoss rush, turn, tell and entrance in both phases; ready-atlas path and canonical256px fallback anchor112/210');
