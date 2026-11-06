/* Controlled authoring diagnostics, not earned clears or human playtests. Real phase
 * updates/normalized hazard lifetimes run; stationary scene setups keep routes eligible.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const scope=vm.createContext({Image:class{constructor(){this.complete=true;this.naturalWidth=this.naturalHeight=2048;}}});
const files=['sprite-hitboxes.js','runtime/contract.js','runtime/weapons/weapons.js','runtime/core/world.js',...fs.readdirSync('stages').filter(s=>/^\d\d-/.test(s)).map(s=>'stages/'+s+'/stage.js'),'boss-sheets.js'];
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),scope,{filename:file});
const art=scope.ArcadeBossSheets;
for(const c of Object.values(art.manifest))for(const a of [...c.phases,...c.projectiles])a.ready=true;
let drawn=[];
const ctx=new Proxy({drawImage(image,...args){drawn.push({path:image.src,row:Math.floor(args[1]/512)});}}, {get(o,k){return k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));};},set(o,k,v){o[k]=v;return true;}});
const rows=[];
for(const stage of scope.Arcade.stages.values())for(const phase of [0,1]){
  const w=new scope.Arcade.World(stage,{seed:177,phase,practice:true});
  w.player.hp=100000;
  const bossRows=new Set(),projectileRows=new Set();
  for(let tick=1;tick<=2400;tick++){
    w.phaseTick=w.tick=tick;w.events=[];
    for(const t of w.targets){t.hp=t.maxHp=100000;}
    if(stage.number===3&&phase){w.data.introduced=true;Object.assign(w.player,{x:220,y:360});}
    if(stage.number===4&&phase){w.data.crossed=true;Object.assign(w.player,{x:4000+(w.data.offset||0),y:600,grounded:true});}
    if(stage.number===10){w.player.x=220;w.player.y=350;}
    if(stage.number===11){Object.assign(w.player,{x:2000,y:600,grounded:true});}
    w.updateHazards();w.phase.update(w);
    const before=JSON.stringify(w);
    drawn=[];art.drawMachine(ctx,w);
    for(const d of drawn)if(/\/p[12]\.png$/.test(d.path)&&d.row>0)bossRows.add(d.row);
    for(const h of w.hazards){
      if(h.missile)continue;
      if(!h.removed&&h.age<h.windup+h.active){
        const selection=art.projectileSelection(stage.id,h,w);
        assert.equal(selection.variant,art.weaponVariant(w,h));
        assert.equal(selection.phase,phase);
        const saved=selection.variant,age=h.age,clock=w.phaseTick;
        h.age+=7;w.phaseTick+=7;
        assert.equal(art.weaponVariant(w,h),saved,'in-flight shot variant must not change as its age advances');
        h.age=age;w.phaseTick=clock;
        drawn=[];art.drawProjectile(ctx,stage.id,h,{x:h.x,y:h.y,w:h.w,h:h.h},w);
        for(const d of drawn)if(/projectiles\.png$/.test(d.path)&&d.row<3)projectileRows.add(d.row);
      }
    }
    assert.equal(JSON.stringify(w),before,'rendering and selection must not mutate simulation state');
  }
  assert.deepEqual([...bossRows].sort(),[1,2,3],stage.id+' P'+(phase+1)+' must show all three firing weapons');
  assert.deepEqual([...projectileRows].sort(),[0,1,2],stage.id+' P'+(phase+1)+' must show all three matching projectile motifs');
  rows.push({stage:stage.id,phase,ticks:2400,bossRows:[...bossRows].sort(),projectileRows:[...projectileRows].sort()});
}
// Marina's one authored wake cycles A/B/C, with the same weapon during anticipation
// and its actual emitted projectile. No new gameplay source or projectile is created.
for(let cycle=0;cycle<3;cycle++){
 const w={stage:{id:'01-marina'},phaseIndex:0,phaseTick:cycle*420+90,data:{},hazards:[]};
 const pose=art.attackPose(w);w.phaseTick=cycle*420+120;
 const h={source:'marina.breakwater-slam.wake',id:'marina-wake-0-'+cycle,age:0,windup:0,active:126};
 assert.equal(pose.row-1,art.projectileSelection(1,h,w).row);
}
// Browser-only wrappers preserve return values, arguments, shot fields and original calls.
const wrapper=vm.createContext({ArcadeBossSheets:art,boss:{phase:2,step:3,attackIndex:1},time:90,bullets:[],codeShots:[],hazards:[],vaultBeam:null,isChase:()=>false,isCodebreak:()=>false});
vm.runInContext('var fireCalls=0,codeCalls=0; function fire(x,y,vx,vy,shape,own){fireCalls++;bullets.push({x,y,vx,vy,shape,own,age:0});return 71;} function updateBoss(){hazards.push({x:1,w:65,age:0});vaultBeam={y:200,age:0};return 97;} function updateCodeAttack(){codeCalls++;codeShots.push({attack:{size:[24,12]},x:1,y:2});return 83;}',wrapper);
vm.runInContext(fs.readFileSync('boss-presentation-hooks.js','utf8'),wrapper);
assert.equal(vm.runInContext("fire(1,2,3,4,'prism',false)",wrapper),71);
assert.equal(wrapper.fireCalls,1);
assert.equal(JSON.stringify(wrapper.bullets[0]),JSON.stringify({x:1,y:2,vx:3,vy:4,shape:'prism',own:false,age:0}));
assert.equal(art.shotBinding(wrapper.bullets[0]).variant,2);
wrapper.boss.step=99;assert.equal(art.shotBinding(wrapper.bullets[0]).variant,2,'later boss moves cannot rebind old projectiles');
assert.equal(vm.runInContext('updateCodeAttack()',wrapper),83);assert.equal(wrapper.codeCalls,1);
assert.equal(art.shotBinding(wrapper.codeShots[0]).variant,1);
console.log(JSON.stringify({status:'passed',kind:'presentation-only-weapon-variants',phases:rows,limitations:['Controlled stationary scene eligibility and protected target HP; not earned clears or human playtests.','Canvas operations are mocked; generated image quality requires separate visual inspection.']},null,2));
