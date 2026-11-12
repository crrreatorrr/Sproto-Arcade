'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const scope=vm.createContext({});
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
for(const file of ['sprite-hitboxes.js','density-attacks.js','phase-powerups.js','runtime/contract.js','runtime/core/world.js'])vm.runInContext(read(file),scope,{filename:file});
const H=vm.runInContext('({config:SPRITE_HITBOXES,rect:spriteHitboxRect,value:spriteHitboxValue,cycle:spriteWeaponCycle,variant:spriteModernWeaponVariant,row:spriteWeaponRow})',scope);
const base={x:100,y:200,w:80,h:40};
assert.equal(typeof H.config.enabled,'boolean','production geometry has an explicit deterministic activation flag');
H.config.enabled=false; // Exercise the historical mode independently of the production default.
H.config.stages={'1':{'0':{targets:{enemy:{rect:[.25,.25,.5,.5]}},projectiles:{dart:{rect:[.25,.25,.5,.5]}}}}};
assert.equal(H.rect(base,1,0,'targets','enemy'),base,'disabled table retains the exact authored object');
H.config.enabled=true;
assert.deepEqual(JSON.parse(JSON.stringify(H.rect(base,'01-marina',0,'targets','enemy'))),{x:120,y:210,w:40,h:20});
assert.deepEqual(base,{x:100,y:200,w:80,h:40},'geometry lookup never mutates an entity');
assert.equal(H.rect(base,1,1,'targets','enemy'),base,'phase scope cannot leak');
H.config.stages['1']['0'].targets.bad={rect:[0,0,NaN,-1]};
assert.equal(H.rect(base,1,0,'targets','bad'),base,'invalid geometry fails closed to authored bounds');
console.log('PASS disabled defaults, numeric geometry, phase isolation and immutable anchors');

const phase={mode:'fixed',spawn:{x:100,y:600},enter(w){w.platform({id:'floor',x:0,y:600,w:1280});},update(){}};
const stage={id:'01-marina',phases:[phase,phase]};
const world=()=>new scope.Arcade.World(stage,{seed:39});
for(const defense of [null,'dash','shield']){
 const w=world();const h=w.hazard({id:'one',source:'dart',x:350,y:530,w:100,h:100,vx:-500,windup:2,active:3});
 w.step({});w.step({});assert.equal(w.player.hp,5,'warning cannot contact');
 w.step(defense?{[defense]:true}:{});assert.equal(w.player.hp,defense?5:4);
 assert.equal(w.events.filter(e=>e.type===(defense?'counter':'hit')).length,1,'swept inset must detect a fast crossing');
 w.step({});assert.equal(w.events.filter(e=>e.type==='hit'||e.type==='counter').length,0,'contact resolves once');
 assert.equal(h.w,100);assert.equal(h.h,100);assert.equal(h.vx,-500);assert.equal(h.windup,2);assert.equal(h.active,3);
 w.restart();assert.equal(w.hazards.length,0);assert.equal(w.player.hp,5);
}
console.log('PASS swept collision-only insets, exact warnings, defensive rules and retry');

function targetWorld(open=true){const w=world();w.target({id:'enemy',x:200,y:500,w:100,h:100,hp:9,open});return w;}
function shot(w,x,vx){w.shots=[{id:'fixture-shot',x,y:550,w:10,h:6,vx,vy:0,damage:2,ttl:20,hit:new Set()}];w.updateShots();}
const edge=targetWorld();shot(edge,200,5);assert.equal(edge.targets[0].hp,9,'authored fringe outside new core must miss');
const hit=targetWorld();shot(hit,100,220);assert.equal(hit.targets[0].hp,7,'fast shot crossing inset core must hit');
const armored=targetWorld(false);shot(armored,100,220);assert.equal(armored.targets[0].hp,9,'collision never bypasses armor/open state');
armored.targets[0].open=true;shot(armored,100,220);assert.equal(armored.targets[0].hp,7);
assert.deepEqual([hit.targets[0].x,hit.targets[0].y,hit.targets[0].w,hit.targets[0].h],[200,500,100,100]);
const blast=targetWorld();blast.blast({x:180,y:550,radius:30,damage:2});assert.equal(blast.targets[0].hp,9);
blast.blast({x:180,y:550,radius:50,damage:2});assert.equal(blast.targets[0].hp,7,'blast closest-point uses the same target core');
hit.phase={...phase,mode:'flight'};hit.autoFire();const aimed=hit.shots.at(-1),dx=250-100,dy=550-(600-26),length=Math.hypot(dx,dy);
assert.equal(aimed.vx,dx/length*16);assert.equal(aimed.vy,dy/length*16,'autofire still aims at authored center');
console.log('PASS target edge/core hits, open state, splash consistency and unchanged aiming');

H.config.stages[1][0].projectiles['dart@0']={rect:[.3,0,.4,1]};
H.config.stages[1][0].projectiles['dart@1']={rect:[.1,.1,.8,.8]};
H.config.stages[1][0].projectiles['gate@0']={rect:[.9,.9,.05,.05]};
const bound=world();bound.phaseTick=419;
const early=bound.hazard({id:'before-cycle',source:'dart',x:900,y:200,w:76,h:32,windup:20,active:100});
bound.step({});const late=bound.hazard({id:'after-cycle',source:'dart',x:900,y:200,w:76,h:32,windup:20,active:100});
assert.equal(early.weaponVariant,0);assert.equal(late.weaponVariant,1);
assert.equal(bound.collisionBounds('projectiles',['dart'],early).w,76*.4);
assert.equal(bound.collisionBounds('projectiles',['dart'],late).w,76*.8);
bound.step({});assert.equal(early.weaponVariant,0,'in-flight geometry cannot switch at an encounter-cycle boundary');
bound.restart();assert.equal(bound.hazards.length,0);assert.equal(bound.phaseTick,0);
assert.equal(bound.hazard({id:'restart',source:'dart',x:900,y:200,w:76,h:32}).weaponVariant,0);
bound.enterPhase(1,false);assert.equal(bound.hazards.length,0);
assert.equal(bound.hazard({id:'phase2',source:'dart',x:900,y:200,w:76,h:32}).weaponPhase,1);
assert.equal(H.row(2,{missile:true}),3);assert.equal(H.variant(1,0,'dart','x',420,false),1);
const gate=world(),front=gate.hazard({id:'gate',source:'gate',rule:'dash',x:90,y:500,w:100,h:100,active:1});
assert.equal(gate.collisionBounds('projectiles','gate',front),front,'mandatory fronts always retain full authored span');
gate.step({});assert.equal(gate.player.hp,4,'a narrow motif profile cannot bypass a dash-only gate');
console.log('PASS per-variant profiles, cycle-boundary binding, heavy rows, retries, phase transitions and full-span gates');

const emitting={...phase,update(w){if(w.phaseTick%20===0)w.hazard({id:'dart-'+w.phaseTick,source:'dart',x:1100,y:350+w.attackRandom()*10,w:100,h:100,vx:-2,vy:0,windup:30,active:300});}};
function emissionRun(enabled){H.config.enabled=enabled;const w=new scope.Arcade.World({id:'01-marina',phases:[emitting,emitting]},{seed:917});for(let i=0;i<100;i++)w.step({});for(const h of w.hazards)assert.equal(Object.hasOwn(h,'weaponVariant'),enabled);return JSON.stringify({world:w,nextRandom:w.attackRandom()},(key,value)=>['weaponVariant','weaponPhase'].includes(key)?undefined:value);}
assert.equal(emissionRun(false),emissionRun(true),'collision-only profiles cannot alter emissions, clocks, paths, RNG, state or projectile fields before contact');
console.log('PASS enabled geometry preserves authored emissions, timing, trajectories and RNG');

// Execute the actual legacy combat functions in an isolated simulation-only scope.
const legacy=vm.createContext({Math});vm.runInContext(read('sprite-hitboxes.js'),legacy);
const game=read('game.js'),code=read('codebreak.js');
function functions(source,start,end){vm.runInContext(source.slice(source.indexOf('function '+start+'('),source.indexOf('function '+end+'(')),legacy);}
functions(game,'combatWeaponVariant','fire');functions(game,'fire','updateShield');functions(game,'vaultBeamFront','startStageShift');
functions(game,'updateVerseGemLaser','drawVerseGemLaser');
functions(game,'updateBullets','hitBoss');
functions(game,'startChase','updateChase');
functions(game,'floorHeight','startChase');
functions(code,'updateCodeShots','startCodebreakArena');functions(code,'updateCodePlayerShots','updateCodebreak');
functions(code,'updateCodeAttack','codeBeamLanes');
vm.runInContext(`var LEVELS=[{id:1}],levelIndex=0,boss={phase:1,hp:10,max:10,gemAim:0},player={x:140,y:530,dash:0,shield:0,inv:0},boxes={orb:{w:40,h:40}},hits=0,damaged=0;
var SimMath=Math,SAUCER_HALF_WIDTH=44,VAULT_MUZZLE=400,VAULT_BEAM_LIFE=90,vaultBeam={age:0,y:500},VERSE_GEM=[0,0],VERSE_GEM_CHARGE=0,VERSE_GEM_FIRE=0,VERSE_GEM_END=100;
var naval=false;function isNaval(){return naval;}
var CODE_CHARACTER_SCALE=.56,W=1280,H=720,codeShots=[],bullets=[],impacts=[],CODE_PLAYER_WEAPONS={greenLaser:{speed:0,tracking:0,damage:2}},playerImpacts={greenLaser:{}},CODE_AIR_ATTACKS=[[0]],CODE_ARENA_ATTACK_COUNT=7;
function playerHeight(){return 52;}function hurt(){hits++;}function sound(){}function hitBoss(shot,damage){damaged+=damage;shot.dead=true;}function codeTargetY(){return 500;}function isChase(){return false;}var PLAYER_SHOT_RATE=1,ENEMY_ATTACK_RATE=1;
SPRITE_HITBOXES.enabled=true;SPRITE_HITBOXES.stages={'1':{'0':{projectiles:{orb:{rect:[.25,.25,.5,.5]}},beams:{vault:{rect:[0,.5,1,.5]},'verse-gem':{halfWidth:2}}}},'12':{'0':{projectiles:{'code:0':{rect:[.25,.25,.5,.5]}},boss:{damage:{radius:40}},beams:{'codebreak.horizontal':{rect:[0,.75,1,.25]}}},'1':{boss:{damage:{radius:20}}}}};`,legacy);
assert.equal(vm.runInContext('enemyShotContact({x:100,y:500,shape:"orb"},18,478,530)',legacy),false);
vm.runInContext(`var FLOOR=600,mode='play',hazards=[{x:100,w:80,height:200,age:10}];boss.step=1;player.x=100;player.y=590;SPRITE_HITBOXES.stages[1][0].projectiles['floor-column@0']={rect:[0,0,1,.2]};updateHazards()`,legacy);
assert.equal(legacy.hits,0,'floor column bottom inset excludes a player below the fitted core');
vm.runInContext('player.y=430;updateHazards()',legacy);assert.equal(legacy.hits,1,'floor column fitted core still hits');
vm.runInContext('SPRITE_HITBOXES.enabled=false;player.y=590;updateHazards()',legacy);assert.equal(legacy.hits,2,'disabled floor column retains original unbounded-bottom contact');
vm.runInContext('SPRITE_HITBOXES.enabled=true;hits=0;player.x=140;player.y=530',legacy);
vm.runInContext(`boss.step=1;boss.shotRate=1;boss.section=0;SPRITE_HITBOXES.stages[1][0].projectiles['orb@0']={rect:[.25,.25,.5,.5]};SPRITE_HITBOXES.stages[1][0].projectiles['orb@1']={rect:[0,0,1,1]};fire(100,500,0,0,'orb',false);boss.step=2;player.x=132;`,legacy);
assert.equal(legacy.bullets[0].weaponVariant,0);
assert.equal(vm.runInContext('enemyShotContact(bullets[0],18,478,530)',legacy),false,'spawned legacy row survives the next boss move');
assert.equal(vm.runInContext('enemyShotContact({x:100,y:500,shape:"orb"},18,478,530)',legacy),true,'unstamped analytic row follows current emitter');
vm.runInContext('boss.phase=2;var restoredShot=JSON.parse(JSON.stringify(bullets[0]));',legacy);
assert.equal(vm.runInContext('enemyShotContact(restoredShot,18,478,530)',legacy),false,'phase binding survives JSON snapshot/restore without a WeakMap');
vm.runInContext('boss.phase=1',legacy);
vm.runInContext(`SPRITE_HITBOXES.enabled=false;fire(100,500,0,0,'orb',false);SPRITE_HITBOXES.enabled=true;`,legacy);
assert.equal(Object.hasOwn(legacy.bullets.at(-1),'weaponVariant'),false,'disabled-mode shot object fields stay unchanged');
vm.runInContext('player.x=140;boss.step=1',legacy);
vm.runInContext('player.x=350;player.y=490;updateVaultBeam()',legacy);assert.equal(legacy.hits,0);
vm.runInContext('delete SPRITE_HITBOXES.stages[1][0].beams.vault;vaultBeam={age:0,y:500};updateVaultBeam()',legacy);assert.equal(legacy.hits,1);
vm.runInContext('naval=true;hits=0;player.y=552;vaultBeam={age:0,y:500};updateVaultBeam()',legacy);
assert.equal(legacy.hits,0,'a boat below the visible beam uses its own vertical collision band');
vm.runInContext('player.y=475;vaultBeam={age:0,y:500};updateVaultBeam();naval=false',legacy);
assert.equal(legacy.hits,1,'the lower half of a boat above the beam can still be struck');
vm.runInContext('hits=0;player.x=100;player.y=60;updateVerseGemLaser(1)',legacy);assert.equal(legacy.hits,0);
vm.runInContext('delete SPRITE_HITBOXES.stages[1][0].beams["verse-gem"];updateVerseGemLaser(1)',legacy);assert.equal(legacy.hits,1);
vm.runInContext('hits=0;LEVELS[0].id=12;player.x=140;player.y=530;codeShots=[{x:100,y:500,vx:0,vy:0,angle:0,attack:{size:[20,100],sprite:0}}];updateCodeShots()',legacy);assert.equal(legacy.hits,0);
vm.runInContext('delete SPRITE_HITBOXES.stages[12][0].projectiles["code:0"];updateCodeShots()',legacy);assert.equal(legacy.hits,1);
for(const angle of [0,Math.PI/4,Math.PI/2]){
 const radius=(Math.abs(Math.cos(angle))*100+Math.abs(Math.sin(angle))*20)*.34;
 vm.runInContext(`hits=0;player.x=${100+18*.56+radius-1};SPRITE_HITBOXES.stages[12][0].projectiles['code:0']={rect:[.25,.25,.5,.5]};codeShots=[{x:100,y:500,vx:0,vy:0,angle:${angle},attack:{size:[20,100],sprite:0}}];updateCodeShots()`,legacy);
 assert.equal(legacy.hits,0,'inset collision stays correct at angle '+angle);
 vm.runInContext('delete SPRITE_HITBOXES.stages[12][0].projectiles["code:0"];updateCodeShots()',legacy);assert.equal(legacy.hits,1,'authored projected edge is restored');
}
vm.runInContext('hits=0;player.x=150;player.y=110;boss.age=50;boss.section=0;boss.attackIndex=0;function attackForCodebreak(){return {beam:"horizontal",frames:[60]};}function codeBeamLanes(){return [{x:100,y:100,width:100,height:20,live:true}];}updateCodeAttack()',legacy);assert.equal(legacy.hits,0);assert.equal(legacy.boss.age,51);
vm.runInContext('delete SPRITE_HITBOXES.stages[12][0].beams["codebreak.horizontal"];updateCodeAttack()',legacy);assert.equal(legacy.hits,1);assert.equal(legacy.boss.age,52);
vm.runInContext('boss.phase=2;boss.x=200;bullets=[{x:170,y:500,vx:0,vy:0,age:0,shape:"greenLaser"}];updateCodePlayerShots()',legacy);assert.equal(legacy.damaged,0,'phase2 collision radius can shrink without changing aim/tracking');
vm.runInContext('SPRITE_HITBOXES.stages[12][1].boss.damage.radius=40;updateCodePlayerShots()',legacy);assert.equal(legacy.damaged,2);
vm.runInContext('boss.phase=1;bullets=[{x:170,y:500,vx:0,vy:0,age:0,shape:"greenLaser"}];updateCodePlayerShots()',legacy);assert.equal(legacy.damaged,2,'phase1 retains absorption without boss damage');
vm.runInContext(`LEVELS[0].id=1;damaged=0;boss={x:200,y:400,scale:1,hp:10,phase:1,move:'test',age:100,tell:10};var FLOOR=600,SAUCER_BEAM_END=1280,moves={test:{active:20}};function hasMecha(){return false;}function isFlying(){return false;}function isCodebreak(){return false;}function bossWeakY(){return 350;}
SPRITE_HITBOXES.stages[1][0].boss={damage:{rect:[.25,.25,.5,.5]}};bullets=[{x:110,y:350,vx:0,vy:0,rate:1,gravity:0,bounces:0,age:0,own:true,shape:'spark'}];updateBullets()`,legacy);
assert.equal(legacy.damaged,0,'boss fringe outside the new core must miss');
vm.runInContext(`bullets=[{x:200,y:350,vx:0,vy:0,rate:1,gravity:0,bounces:0,age:0,own:true,shape:'spark'}];updateBullets()`,legacy);
assert.equal(legacy.damaged,3,'exposed weakpoint damage multiplier remains unchanged');
vm.runInContext(`LEVELS[0].id=11;var GOLDIE_START_X=90,CHASE_SCROLL=5.4,time=0;function authoredTime(){return time;}function announce(){}function isChase(){return true;}
SPRITE_HITBOXES.stages[11]={'0':{projectiles:{'orb@0':{rect:[.25,.25,.5,.5]},'orb@1':{rect:[0,0,1,1]}},boss:{contact:{reach:19}}}};
SPRITE_HITBOXES.enabled=true;hits=0;player.x=132;player.y=530;startChase();fire(100,500,5.4,0,'orb',false);`,legacy);
assert.equal(Object.hasOwn(legacy.boss,'phase'),false,'fixture uses the real legacy chase object without a phase field');
assert.equal(legacy.bullets[0].weaponPhase,0);assert.equal(legacy.bullets[0].weaponVariant,0);
assert.equal(vm.runInContext("combatHitboxValue(41.65,'boss','contact','reach')",legacy),19,'chase body contact resolves the same phase0 profile');
vm.runInContext('updateChaseAttacks()',legacy);assert.equal(legacy.hits,0,'enabled phase0 inset is applied in the actual chase update');
vm.runInContext("boss.attackIndex=1;fire(100,500,5.4,0,'orb',false);updateChaseAttacks()",legacy);assert.equal(legacy.hits,1,'phase0 variant1 collider follows the next chase weapon');
vm.runInContext("SPRITE_HITBOXES.enabled=false;hits=0;startChase();fire(100,500,5.4,0,'orb',false)",legacy);
assert.equal(Object.hasOwn(legacy.bullets[0],'weaponPhase'),false);assert.equal(Object.hasOwn(legacy.bullets[0],'weaponVariant'),false);
vm.runInContext('updateChaseAttacks()',legacy);assert.equal(legacy.hits,1,'disabled chase retains authored contact behavior');
assert.equal(vm.runInContext("combatHitboxValue(41.65,'boss','contact','reach')",legacy),41.65);
console.log('PASS real phase-less Goldie chase binding, phase0 geometry and disabled baseline');
console.log('PASS actual legacy projectile, vault/ray, rotated Codebreak, beam and phase-damage paths');

// Compare actual Canvas source/destination traces with the pure numeric contact AABB.
const renderScope=vm.createContext({Image:class{constructor(){this.complete=true;this.naturalWidth=this.naturalHeight=2048;}}});
for(const file of ['runtime/story/sim-math.js','sprite-hitboxes.js','boss-sheets.js'])vm.runInContext(read(file),renderScope);
const art=renderScope.ArcadeBossSheets,geometry=vm.runInContext('({rect:spriteProjectileCoreRect,layout:spriteAtlasDestinationRect,valid:spriteProjectileProfileValid,math:SimMath})',renderScope);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function tracedContext(core){
 let matrix=[1,0,0,1,0,0];const stack=[],vertices=[];
 const multiply=b=>{const a=matrix;matrix=[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];};
 return{vertices,beginPath(){},rect(){},clip(){},save(){stack.push(matrix.slice());},restore(){matrix=stack.pop();},translate(x,y){multiply([1,0,0,1,x,y]);},scale(x,y){multiply([x,0,0,y,0,0]);},rotate(a){multiply([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);},
 drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh){for(const [x,y]of [[core[0],core[1]],[core[0]+core[2],core[1]],[core[0]+core[2],core[1]+core[3]],[core[0],core[1]+core[3]]]){const px=dx+(x-sx%512)*dw/sw,py=dy+(y-sy%512)*dh/sh;vertices.push([matrix[0]*px+matrix[2]*py+matrix[4],matrix[1]*px+matrix[3]*py+matrix[5]]);}}};
}
const actualCore={reference:[12,46,488,454],crop:[50,162,424,220],core:[150,250,215,40],visualBox:[36,36],kind:'contain',facing:'left'};
for(const facing of ['left','right'])for(const kind of ['ordinary','chase','codebreak','codebreak-ray'])for(const angle of [0,Math.PI,-Math.PI/2,.63]){
 const codebreak=kind.startsWith('codebreak'),profile={...actualCore,facing,visualBox:kind==='codebreak-ray'?[32,125]:codebreak?[31,75]:kind==='chase'?[67,23]:[36,36],kind:kind==='chase'||kind==='codebreak-ray'?'ray':'contain'};
 const x=100.27,y=380.68,shot={shape:kind==='chase'?'prism':'orb',vx:Math.cos(angle)*4,vy:Math.sin(angle)*4,age:0};
 const config=art.manifest[2],asset=config.projectiles[0];Object.assign(asset,{ready:true,path:'numeric-core-fixture.png',bounds:profile.reference,rowBounds:[profile.crop,profile.crop,profile.crop,profile.crop],facing});
 const ctx=tracedContext(profile.core),center=codebreak?{x,y}:{x:Math.round(x),y:Math.round(y)};ctx.translate(center.x,center.y);if(codebreak)ctx.rotate(angle+Math.PI/2);
 assert.equal(art.drawProjectile(ctx,2,shot,{x:-profile.visualBox[0]/2,y:-profile.visualBox[1]/2,w:profile.visualBox[0],h:profile.visualBox[1]},{phaseIndex:0,variant:0,directionAngle:codebreak?-Math.PI/2:angle}),true);
 const bounds=geometry.rect(profile,center,angle),xs=ctx.vertices.map(p=>p[0]),ys=ctx.vertices.map(p=>p[1]);near(bounds.x,Math.min(...xs));near(bounds.y,Math.min(...ys));near(bounds.w,Math.max(...xs)-Math.min(...xs));near(bounds.h,Math.max(...ys)-Math.min(...ys));
}
assert.equal(geometry.valid({...actualCore,core:[-1,0,2,2]}),false);assert.equal(geometry.rect({...actualCore,visualBox:[1000,10],kind:'ray'},{x:0,y:0},0).w,1000,'continuous tiled beams preserve their full authored span');
// Real legacy ordinary/chase contact consumers use the rendered center and direction.
legacy.exactProfile=JSON.parse(JSON.stringify(actualCore));
vm.runInContext(`SPRITE_HITBOXES.enabled=true;LEVELS[0].id=1;boss={phase:1,step:1,attackIndex:0};SPRITE_HITBOXES.stages[1][0].projectiles['orb@0']=exactProfile;player.y=400;`,legacy);
for(const vx of [-4,4]){
 legacy.testShot={x:100.27,y:380.68,vx,vy:0,shape:'orb',weaponPhase:0,weaponVariant:0};
 const rect=vm.runInContext("combatHitbox({x:80,y:360,w:40,h:40},'projectiles','orb',testShot)",legacy),expected=geometry.rect(actualCore,{x:100,y:381},Math.atan2(0,vx));
 for(const key of ['x','y','w','h'])near(rect[key],expected[key]);
 legacy.contactX=expected.x+expected.w/2;vm.runInContext('player.x=contactX',legacy);assert.equal(vm.runInContext('enemyShotContact(testShot,1,370,390)',legacy),true);
 vm.runInContext('player.x=contactX+100',legacy);assert.equal(vm.runInContext('enemyShotContact(testShot,1,370,390)',legacy),false);
}
legacy.codeProfile={...JSON.parse(JSON.stringify(actualCore)),visualBox:[31,75]};
for(const angle of [0,Math.PI/4,Math.PI/2]){
 legacy.testAngle=angle;vm.runInContext("LEVELS[0].id=12;SPRITE_HITBOXES.stages[12][0].projectiles['code:0@0']=codeProfile;boss={phase:1,step:1,attackIndex:0};hits=0;codeShots=[{x:100.27,y:380.68,vx:0,vy:0,angle:testAngle,weaponPhase:0,weaponVariant:0,attack:{size:[31,75],sprite:0}}]",legacy);
 const rect=geometry.rect(legacy.codeProfile,{x:100.27,y:380.68},angle);legacy.contactX=rect.x+rect.w/2;legacy.contactY=rect.y+rect.h/2+20;vm.runInContext('player.x=contactX;player.y=contactY;updateCodeShots()',legacy);assert.equal(legacy.hits,1,'actual Codebreak consumer uses pure rotated core');
}
console.log('PASS pure rounded raster-core geometry matches real ordinary/chase/Codebreak Canvas transforms, both facings and velocity angles');
for(const chase of [false,true])for(const [vx,vy]of [[-4,1],[4,-1]]){
 const stageId=chase?11:1;legacy.exactProfile=JSON.parse(JSON.stringify(actualCore));
 vm.runInContext(`LEVELS[0].id=${stageId};SPRITE_HITBOXES.enabled=true;SPRITE_HITBOXES.stages[${stageId}][0].projectiles['orb@0']=exactProfile;boss=${chase?'{name:"Goldie",attackIndex:0,attackAge:0}':'{phase:1,step:1,attackIndex:0,hp:10,x:1000,y:500,scale:4.4}'};hits=0;time=0;player.dash=0;bullets=[{x:100.27,y:380.68,vx:${vx},vy:${vy},shape:'orb',weaponPhase:0,weaponVariant:0,rate:1,gravity:0,bounces:0,age:0,own:false}];`,legacy);
 const center={x:Math.round(100.27+vx-(chase?5.4:0)),y:Math.round(380.68+vy)},rect=geometry.rect(actualCore,center,Math.atan2(vy,vx));
 legacy.contactX=rect.x+rect.w/2;legacy.contactY=rect.y+rect.h/2+20;vm.runInContext('player.x=contactX;player.y=contactY;'+(chase?'updateChaseAttacks()':'updateBullets()'),legacy);assert.equal(legacy.hits,1,'real '+(chase?'chase':'ordinary')+' update uses direction-aware core');
}
console.log('PASS actual ordinary/chase updates preserve movement while contacting exact rotated core');
// Dynamic visual boxes follow exactly the current growing-column and clipped-ray transforms.
for(const [width,height]of [[65,40],[65,190],[65,498],[69,32],[800,32]])for(const vx of [-2,0,2]){
 const shot={vx,vy:height>width?-1:0,age:4,source:'layout-fixture'},profile={...actualCore,kind:'auto',visualBox:[1,1]},kind=vm.runInContext('spriteProjectileKind',renderScope)(shot,{w:width,h:height});
 const config=art.manifest[2],asset=config.projectiles[0];Object.assign(asset,{ready:true,bounds:profile.reference,rowBounds:[profile.crop,profile.crop,profile.crop,profile.crop],facing:'left'});
 const center={x:315.25,y:410.5},ctx=tracedContext(profile.core);ctx.translate(center.x,center.y);ctx.scale((vx||1)<0?-1:1,1);
 assert.equal(art.drawProjectile(ctx,2,shot,{x:-width/2,y:-height/2,w:width,h:height},{phaseIndex:0,variant:0}),true);
 const angle=kind==='ray'&&height>width?-Math.PI/2:0,rect=geometry.rect(profile,center,angle,[width,height],{kind,shot,mirrorX:(vx||1)<0}),xs=ctx.vertices.map(p=>p[0]),ys=ctx.vertices.map(p=>p[1]),tiled=kind==='ray'&&Math.max(width,height)>Math.min(width,height)*6;
 if(tiled&&height>width){near(rect.x,Math.min(...xs));near(rect.w,Math.max(...xs)-Math.min(...xs));near(rect.h,height);}
 else if(tiled){near(rect.y,Math.min(...ys));near(rect.h,Math.max(...ys)-Math.min(...ys));near(rect.w,width);}
 else{near(rect.x,Math.min(...xs));near(rect.y,Math.min(...ys));near(rect.w,Math.max(...xs)-Math.min(...xs));near(rect.h,Math.max(...ys)-Math.min(...ys));}
}
// Exercise the actual legacy dynamic consumers rather than a mirrored test implementation.
legacy.dynamicProfile={...JSON.parse(JSON.stringify(actualCore)),kind:'auto',visualBox:[1,1]};
vm.runInContext("LEVELS[0].id=1;boss={phase:1,step:1,hp:10};SPRITE_HITBOXES.stages[1][0].projectiles['floor-column@0']=dynamicProfile;SPRITE_HITBOXES.stages[1][0].beams['vault@0']=dynamicProfile;SPRITE_HITBOXES.enabled=true;",legacy);
for(const age of [2,12,28]){
 vm.runInContext(`hits=0;hazards=[{x:315.3,w:65,height:498,age:${age},weaponVariant:0,weaponPhase:0}];`,legacy);
 const afterAge=age+1,height=Math.max(1,Math.ceil(498*Math.min(1,(afterAge+1)/9,(35-afterAge)/8))),kind=vm.runInContext('spriteProjectileKind',renderScope)({},{w:65,h:height}),rect=geometry.rect(legacy.dynamicProfile,{x:Math.round(315.3-65/2)+65/2,y:600-height/2},kind==='ray'&&height>65?Math.PI/2:0,[65,height],{kind});
 legacy.contactX=rect.x+rect.w/2;legacy.contactY=rect.y+rect.h/2+20;vm.runInContext('player.x=contactX;player.y=contactY;updateHazards()',legacy);assert.equal(legacy.hits,1,'actual growing column uses current visual bounds');
}
for(const age of [0,10]){
 vm.runInContext(`hits=0;vaultBeam={age:${age},y:500,weaponVariant:0,weaponPhase:0};`,legacy);const front=Math.max(0,400-(age+1)*69),width=Math.max(1,400-front),rect=geometry.rect(legacy.dynamicProfile,{x:(front+400)/2,y:500},0,[width,32],{kind:'ray'});
 legacy.contactX=rect.x+rect.w/2;legacy.contactY=rect.y+rect.h/2+20;vm.runInContext('player.x=contactX;player.y=contactY;updateVaultBeam()',legacy);assert.equal(legacy.hits,1,'actual short/tiled vault beam uses current visual bounds');
}
console.log('PASS dynamic growing columns, short/tiled fullspan beams, modern mirror/vertical transforms and actual legacy contact consumers');
H.config.enabled=true;H.config.stages={'1':{'0':{projectiles:{'numeric-fit@0':{...JSON.parse(JSON.stringify(actualCore)),kind:'auto',visualBox:[1,1]}}}}};
const modernCore=world(),modernHazard=modernCore.hazard({id:'numeric-fit-event',source:'numeric-fit',x:250,y:550,w:76,h:64,vx:-300,windup:2,active:1});
modernCore.step({});modernCore.step({});assert.equal(modernCore.player.hp,5);modernCore.step({});assert.equal(modernCore.player.hp,4,'real modern swept contact follows the fitted raster core');assert.equal(modernHazard.x,-50);assert.equal(modernHazard.w,76);assert.equal(modernHazard.windup,2);
const fronts=world();H.config.stages[1][0].projectiles['numeric-front@0']={...JSON.parse(JSON.stringify(actualCore)),kind:'auto',visualBox:[1,1]};
const numericFront=fronts.hazard({id:'numeric-front',source:'numeric-front',rule:'dash',x:100,y:-1000,w:0,h:2200,active:3});assert.equal(fronts.collisionBounds('projectiles','numeric-front',numericFront),numericFront,'mandatory zero-width fullspan fronts bypass raster profiles');
console.log('PASS real modern swept raster-core contact, unchanged anchors/warnings and mandatory front bypass');

H.config.enabled=true;H.config.stages[1]??={};H.config.stages[1][0]??={};H.config.stages[1][0].projectiles??={};H.config.stages[1][0].projectiles['carrier-debris-high@0']={rect:[.8,0,.1,1]};
const debrisWorld=world(),debris=debrisWorld.hazard({id:'environment',source:'carrier-debris-high',rule:'ordinary',x:100,y:530,w:230,h:100,windup:0,active:4});assert.equal(debrisWorld.collisionBounds('projectiles','carrier-debris-high',debris),debris,'carrier environment keeps its authored geometry even if a motif profile is accidentally present');debrisWorld.updateHazards();assert.equal(debrisWorld.player.hp,4,'authored carrier debris fringe remains dangerous');console.log('PASS carrier environment bypasses boss projectile motifs and preserves authored contact');

for(const enabled of [false,true])for(const rate of [.9,1])for(const age of [35-rate,35.1-rate]){legacy.expiredEnabled=enabled;legacy.expiredRate=rate;legacy.expiredAge=age;vm.runInContext('LEVELS[0].id=1;boss={phase:1,step:1,hp:10};SPRITE_HITBOXES.enabled=expiredEnabled;ENEMY_ATTACK_RATE=expiredRate;hits=0;mode=\"play\";player.x=315.3;player.y=600;hazards=[{x:315.3,w:65,height:498,age:expiredAge,weaponVariant:0,weaponPhase:0}];updateHazards()',legacy);assert.equal(legacy.hits,0,'expired zero/negative-height columns cannot gain an extra damaging tick from visual min1px');assert.equal(legacy.hazards.length,0);}
console.log('PASS both modes preserve exact column expiry and zero-height harmlessness');
