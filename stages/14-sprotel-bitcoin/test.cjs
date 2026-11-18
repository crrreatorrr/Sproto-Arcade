/* Real source/trials stepping. Controlled diagnostics, not earned clears or human playtests. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),acorn=require('acorn'),walk=require('acorn-walk');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),plain=v=>JSON.parse(JSON.stringify(v));
const levelsText=read('levels.js');
function config(ready){const c=vm.createContext({});vm.runInContext(levelsText.replace(/const SPROTEL_READY=(?:true|false);/,'const SPROTEL_READY='+ready+';')+';globalThis.config={LEVELS,mechanicsIndex,order:campaignLevelIndices(),nextCampaignLevel};',c);return c.config;}
const pending=config(false),live=config(true);
assert.deepEqual(Array.from(pending.order),[0,12,1,2,3,4,5,6,7,8,9,10,11]);assert.deepEqual(Array.from(live.order),[0,12,1,13,2,3,4,5,6,7,8,9,10,11]);
for(let i=0;i<13;i++)assert.equal(live.LEVELS[i].id,i+1);
assert.equal(live.LEVELS[13].id,14);assert.equal(live.mechanicsIndex(13),1);assert.equal(live.LEVELS[13].art,live.LEVELS[1].art);assert(!live.LEVELS[13].singlePhase);assert.equal(live.nextCampaignLevel(1),13);assert.equal(live.nextCampaignLevel(13),2);
assert.equal(live.LEVELS[13].densityBarrage,false);assert(live.LEVELS.slice(0,13).every(l=>l.densityBarrage!==false));
const trials=vm.createContext({});for(const f of ['levels.js','sprite-hitboxes.js','sprotel-art.js','boss-sheets.js','density-attacks.js','phase-powerups.js','runtime/contract.js','runtime/core/world.js','stages/14-sprotel-bitcoin/stage.js'])vm.runInContext(read(f),trials,{filename:f});
const A=trials.Arcade,stage=A.stages.get('14-sprotel-bitcoin');assert.equal(stage.phases.length,2);assert.equal(stage.scenery,'art/level-02.jpg');assert.equal(stage.phaseTwoScenery,'art/phase-two/prism-vault.webp');
const p1Shapes=['beer','cocktail','blueMarlin','diskLaser'],p2Shapes=['cocktail','pretzel','nacho','popcorn','blueMarlin','diskLaser','speakerMissile'];
const actionNames=[['beerThrow','cocktailThrow','marlin','diskLaser'],['beerStick','cocktailCannon','snacks','marlin','diskLaser','soundWave']];
const modern=[];
for(const phase of [0,1]){
 const w=new A.World(stage,{seed:37,phase,practice:true});w.targets[0].hp=w.targets[0].maxHp=100000;w.player.inv=20000;
 const seen=new Set(),actions=new Set(),warn=new Map(),release=new Map();let firstOpen=-1,maxSpeakers=0;
 for(let i=0;i<(phase?2160:1440);i++){
  w.step({});assert.equal(w.state,'playing');assert.equal(w.phaseIndex,phase);assert.equal(w.densityBarrage,null);
  const action=w.data.action;if(action&&action!=='idle'){actions.add(action);if(!warn.has(action))warn.set(action,w.phaseTick);}
  for(const h of w.hazards){if(h.sprite)seen.add(h.sprite);if(!release.has(action)&&(h.age===0||h.age===1))release.set(action,w.phaseTick);}
  if(w.targets[0].open&&firstOpen<0)firstOpen=w.phaseTick;
  const speakers=w.hazards.filter(h=>h.sprite==='speakerMissile');maxSpeakers=Math.max(maxSpeakers,speakers.length);
  for(const h of speakers){assert.equal(h.w,96);assert.equal(h.h,56);assert.equal(h.vx,-3.6);assert.equal(h.rule,'ordinary');}
 }
 assert.deepEqual([...actions],actionNames[phase]);assert.deepEqual([...seen],phase?p2Shapes:p1Shapes);assert.equal(firstOpen,phase?1025:665);
 for(const name of actionNames[phase])assert(release.get(name)-warn.get(name)>=(['diskLaser','beerStick'].includes(name)?90:name==='soundWave'?100:phase?60:40),name+' has a complete real warning window');
 if(phase)assert.equal(maxSpeakers,3,'one simultaneous salvo has exactly three smaller speakers');
 w.lose('fixture');w.step({retry:true});assert.equal(w.phaseIndex,phase);assert.equal(w.player.hp,5);assert.equal(w.hazards.length,0);assert.equal(w.targets[0].open,false);
 modern.push({phase,shapes:[...seen],actions:[...actions],firstOpen,maxSpeakers});
}
// Phase 1 transitions, phase 2 clears; practice and checkpoint retries keep phase 2.
const run=new A.World(stage,{seed:37});run.targets[0].open=true;run.damageTarget(run.targets[0],100,'fixture');assert.equal(run.state,'transition');for(let i=0;i<90;i++)run.step({});assert.equal(run.phaseIndex,1);assert.equal(run.state,'playing');run.targets[0].open=true;run.damageTarget(run.targets[0],100,'fixture');assert.equal(run.state,'clear');
const checkpoint=new A.World(stage,{seed:37,phase:1});checkpoint.lose('fixture');checkpoint.step({retry:true});assert.equal(checkpoint.phaseIndex,1);assert.equal(checkpoint.checkpointRetry,true);
// The actual stage strike exists only on native animation frame11, not during the earlier sweep.
const swing=new A.World(stage,{phase:1});swing.data.swingLeft=560;swing.phaseTick=108;swing.phase.update(swing);assert(!swing.hazards.some(h=>h.sprotelMelee));
swing.phaseTick=124;swing.phase.update(swing);const strike=swing.hazards.find(h=>h.sprotelMelee);assert(strike);assert.equal(strike.active,7,'seven subsequent collision passes finish before recovery frame12');
const measured=vm.runInContext('sprotelBeerStickRect',trials)(1,vm.runInContext('sprotelModernBox',trials)(1,swing.data.mechX));
for(const key of ['x','y','w','h'])assert.equal(strike[key],measured[key],'melee uses the same measured frame11 drawing projection');
swing.phaseTick=125;swing.phase.update(swing);assert.equal(swing.targets[0].open,false);swing.phaseTick=132+1080;swing.phase.update(swing);assert.equal(swing.targets[0].open,true,'the drive opens only after the stick strike ends');
// The real World.step order resolves new hazards on the following tick. Its
// last collision must still display frame11; frame12 recovery must be safe.
for(const [lastTick,expectedHp,expectedFrame] of [[131,4,11],[132,5,12]]){
 const w=new A.World(stage,{phase:1,seed:37});w.phaseTick=123;w.data.swingLeft=560;w.step({});assert.equal(w.phaseTick,124);
 const h=w.hazards.find(h=>h.sprotelMelee);assert(h);
 while(w.phaseTick<lastTick-1)w.step({});
 Object.assign(w.player,{x:h.x+h.w/2,y:h.y+h.h/2+26,vy:0,grounded:false,inv:0,shield:0,dash:0});w.step({});
 assert.equal(w.phaseTick,lastTick);assert.equal(trials.ArcadeBossSheets.attackPose(w).frame,expectedFrame);assert.equal(w.player.hp,expectedHp,'melee contact at local'+lastTick+' agrees with the actually displayed pose');
}
// Use the actual imported frame11 beer head against the real standing player.
// A jump starts before impact; dash, shield and leaving the reach are also safe.
function realMelee(input={},outside=false,jumpEarly=false){
 const w=new A.World(stage,{phase:1,seed:37});w.data.swingLeft=560;
 const rect=trials.sprotelBeerStickRect(1,trials.sprotelModernBox(1,560));
 assert(rect.y<600&&rect.y+rect.h>542,'the actual lowered beer head reaches the standing player');
 w.phaseTick=jumpEarly?117:123;Object.assign(w.player,{x:outside?220:rect.x+rect.w/2,y:600,grounded:true,inv:0,shield:0,dash:0});
 if(jumpEarly){w.step({jump:true});while(w.phaseTick<125)w.step({});}
 else{w.step({});w.step(input);}
 assert.equal(w.phaseTick,125);return w.player.hp;
}
assert.equal(realMelee(),4,'standing inside the visible beer head takes damage');
assert.equal(realMelee({},true),5,'backing out of the actual weapon reach is safe');
assert.equal(realMelee({dash:true}),5);assert.equal(realMelee({shield:true}),5);
assert.equal(realMelee({},false,true),5,'jumping before the low strike clears the actual beer head');
// Locked disk aim stays at the warning's position even if the player moves before release.
const aimWorld=new A.World(stage,{seed:37});aimWorld.phaseTick=550;aimWorld.phase.update(aimWorld);const locked=plain(aimWorld.data.lockedAim);aimWorld.player.x=1100;aimWorld.phaseTick=640;aimWorld.phase.update(aimWorld);const laser=aimWorld.hazards.find(h=>h.sprite==='diskLaser');assert(laser&&laser.vx<0);assert.deepEqual(plain(aimWorld.data.lockedAim),locked);
// Audit every real stage release against its measured native weapon attachment.
const modernEvents=[
 [0,0,'beerThrow','beer',[[100,8],[124,11]]],
 [0,1,'cocktailThrow','cocktail',[[100,8],[124,11]]],
 [0,2,'marlin','blueMarlin',[[100,8],[124,11]]],
 [0,3,'diskLaser','diskLaser',[[100,8],[108,9],[116,10],[124,11]]],
 [1,1,'cocktailCannon','cocktail',[[100,8],[112,9],[124,11]]],
 [1,2,'snacks','pretzel',[[100,8]]],[1,2,'snacks','nacho',[[112,9]]],[1,2,'snacks','popcorn',[[124,11]]],
 [1,3,'marlin','blueMarlin',[[100,8],[124,11]]],
 [1,4,'diskLaser','diskLaser',[[100,8],[108,9],[116,10],[124,11]]]
];
const attachment=vm.runInContext('sprotelProjectilePoint',trials),modernBox=vm.runInContext('sprotelModernBox',trials);
function closePoint(actual,expected,label){for(const k of ['x','y'])assert(Math.abs(actual[k]-expected[k])<1e-8,label+' '+k);}
for(const [phase,index,action,shape,events] of modernEvents)for(const [local,frame] of events){
 const w=new A.World(stage,{phase,seed:37});w.phaseTick=index*180+local;w.phase.update(w);
 const h=w.hazards.find(h=>h.sprite===shape);assert(h,action+' actually spawns '+shape);
 closePoint({x:h.x+h.w/2,y:h.y+h.h/2},attachment(phase,action,shape,frame,modernBox(phase,w.data.mechX)),action+' native frame '+frame);
 if(shape==='blueMarlin'){const expectedLane=(local===100?545:410)+h.h/2,arrival=h.y+h.h/2+h.vy*(h.x+h.w/2-220)/Math.abs(h.vx);assert(Math.abs(arrival-expectedLane)<1e-8,'marlin reaches its advertised lane from the visible weapon');}
}
const fanWorld=new A.World(stage,{phase:1,seed:37});fanWorld.data.lockedAim={x:310,y:500};fanWorld.player.x=120;fanWorld.phaseTick=1000;fanWorld.phase.update(fanWorld);
const fan=fanWorld.hazards.filter(h=>h.sprite==='speakerMissile');assert.equal(fan.length,3);assert(fan.every(h=>h.age===0));
for(let lane=0;lane<3;lane++){
 const h=fan[lane];assert.equal(h.w,96);assert.equal(h.h,56);assert.equal(h.vx,-3.6);
 const center={x:h.x+h.w/2,y:h.y+h.h/2},arrival=center.y+h.vy*(center.x-310)/3.6;assert(Math.abs(arrival-(500+(1-lane)*80))<1e-8,'speaker fan reaches three lanes around the locked player position');
 closePoint({x:h.x+h.w/2,y:h.y+h.h/2},attachment(1,'soundWave','speakerMissile.'+lane,8,modernBox(1,900)),'simultaneous speaker lane '+lane);
}
fanWorld.phaseTick=1024;fanWorld.phase.update(fanWorld);assert.equal(fanWorld.hazards.filter(h=>h.sprite==='speakerMissile').length,3,'there is no delayed second speaker salvo');
const browser=read('rework.js'),game=read('game.js');
function declaration(source,name){let found;walk.simple(acorn.parse(source,{ecmaVersion:'latest'}),{FunctionDeclaration(n){if(n.id.name===name)found=n;}});assert(found,name);return source.slice(found.start,found.end);}
// The Sprotel laser keeps its authored size even though laser:true selects generic art too.
let enemyArtExpression;walk.simple(acorn.parse(game,{ecmaVersion:'latest'}),{VariableDeclarator(n){if(n.id.name==='enemyArt')enemyArtExpression=game.slice(n.init.start,n.init.end);}});assert(enemyArtExpression);
const sizing=vm.createContext({sprotelShot:true,sourceArt:['generic-laser',71,23],shot:{shape:'diskLaser'},boxes:{diskLaser:{w:120,h:40}}});assert.deepEqual(plain(vm.runInContext(enemyArtExpression,sizing)),['',120,40]);
const lines=[],cue=vm.createContext({LEVELS:[{id:14}],levelIndex:0,boss:{hp:1,move:'sprotelCocktailCannon',age:10,tell:90,aimX:200,aimY:600},sprotelShotPoint(b,action,shape,t=0){assert.equal(action,'cocktailCannon');assert.equal(shape,'cocktail');assert.equal(t,0,'warning previews the first release frame');return{x:812,y:286};},ctx:{save(){},restore(){},setLineDash(){},beginPath(){},moveTo(x,y){lines.push([x,y]);},lineTo(){},stroke(){},arc(){}}});vm.runInContext(declaration(game,'drawSprotelLaserWarning')+';drawSprotelLaserWarning()',cue);assert.deepEqual(lines,[[812,286]],'cannon warning begins at its measured future release port');
const entry={options:[],_value:'',replaceChildren(...o){this.options=o;this._value=o[0]?.value||'';},add(o){this.options.push(o);},get value(){return this._value;},set value(v){this._value=this.options.some(o=>o.value===v)?v:'';}};
const elements={stage:{value:stage.id},entry},menu=vm.createContext({Arcade:{stages:new Map([[stage.id,stage]])},stages:[stage],Option:class{constructor(text,value){this.text=text;this.value=value;this.dataset={};}},$:id=>elements[id],records(){},URLSearchParams});for(const n of ['refreshEntries','applyEntryQuery'])vm.runInContext(declaration(browser,n),menu);menu.query=new URLSearchParams('stage=14-sprotel-bitcoin&phase=1');vm.runInContext('applyEntryQuery(query)',menu);assert.equal(entry.value,'1');assert.equal(entry.options.length,2);
const retry=vm.createContext({LEVELS:live.LEVELS,SPROTEL_READY:true,REDKEV_READY:true,storyTransition:null,firstLevel:13,levelIndex:13,runAttempt:0,godMode:false,selectedSproto:{id:'rivet'},player:{shieldWait:0},boss:{phase:2},keys:new Set(),pressed:new Set(),levelSelect:{},document:{},hud:{},gameScreen:{classList:{remove(){}}},window:{ArcadeReplay:{recorder(){return {};}}},showLevelControls(){},setOverlay(){},refreshHud(){},prefetchLevel(){},announce(){},PHASE_TWO_NAMES:['','Prism Vault'],mechanicsIndex:()=>1,nextCampaignLevel:()=>-1,isChase:()=>false,isCodebreak:()=>false,isNaval:()=>false,startMove(){retry.moves=(retry.moves||0)+1;},whenReady(i,fn){fn();},resetRun(index){retry.levelIndex=index;retry.player={hp:5,shieldWait:0};retry.boss={phase:1,hp:580,phaseTwoHealth:290};}});for(const n of ['begin','retryCurrentPhase'])vm.runInContext(declaration(game,n),retry);vm.runInContext('begin(13,false,2,37)',retry);assert.equal(retry.boss.phase,2);assert.equal(retry.phaseCheckpointRun,true);assert.equal(retry.boss.hp,290);vm.runInContext('retryCurrentPhase()',retry);assert.equal(retry.boss.phase,2);assert.equal(retry.player.hp,5);assert.equal(retry.phaseCheckpointRun,true);
(async()=>{
 const {buildSimSource}=await import(path.join(root,'tools/build-server-sim.mjs'));const scope=vm.createContext({structuredClone,ARCADE_SIM_VERSION:'sprotel-fixture'});
 vm.runInContext('globalThis.sim=(function(){'+buildSimSource({dev:true}).source+';api.fixtureHit=function(damage){hitBoss({shape:"spark",x:boss.x,y:boss.y-90},damage);};api.fixtureStageShift=STAGE_SHIFT_END;api.fixtureMeleeBox=function(){return sprotelBeerStickBox(boss);};api.fixtureDrawBox=function(){return sprotelLegacyBox(boss.phase-1,bossSheetBox(boss));};api.fixtureAttack=function(move,t,aimX=220,aimY=600){boss.move=move;boss.tell=90;boss.age=90+t;boss.aimX=aimX;boss.aimY=aimY;bullets.length=0;attackBoss(t);return{shots:bullets.slice(),dimensions:boxes.speakerMissile,floor:FLOOR,boss:boss,box:sprotelLegacyBox(boss.phase-1,bossSheetBox(boss))};};return api;})();',scope);
 const sim=scope.sim,d=sim._dev,story=[];
 for(const phase of [1,2]){
  d.reset(13,'rivet',0,37);let snap=d.snapshot();snap.s.boss.phase=phase;snap.s.boss.hp=snap.s.boss.max=100000;snap.s.player.inv=20000;d.restore(snap);
  const seen=new Set(),moves=new Set(),tells=new Map(),releases=new Map();let maxSpeakers=0;
  for(let i=0;i<4000;i++){
   d.step(0);const s=d.state();assert.equal(s.mode,'play');assert.equal(s.boss.phase,phase);assert.equal(s.phaseShift,0);
   if(s.boss.move){moves.add(s.boss.move);if(!tells.has(s.boss.move))tells.set(s.boss.move,s.time);}
   for(const shot of s.bullets)if(!shot.own){seen.add(shot.shape);assert.equal(shot.weaponPhase,phase-1);if(!releases.has(s.boss.move)&&shot.age<=1)releases.set(s.boss.move,s.time);}
   maxSpeakers=Math.max(maxSpeakers,s.bullets.filter(b=>b.shape==='speakerMissile').length);
  }
  assert.deepEqual([...seen],phase===1?p1Shapes:p2Shapes);assert.equal(moves.size,phase===1?4:6);
  if(phase===2)assert.equal(maxSpeakers,3);
  for(const [move,tell] of tells)if(move!=='sprotelBeerStick')assert(releases.get(move)-tell>=(['sprotelDiskLaser','sprotelSoundWave'].includes(move)?90:60),move+' has a real warning');
  story.push({phase,shapes:[...seen],moves:[...moves],maxSpeakers});
 }
 // Actual story attackBoss releases use the same attachment geometry, at the drawn frame.
 const storyEvents=[
  [1,'sprotelBeer','beerThrow','beer',[[0,8],[24,10]]],
  [1,'sprotelDrinks','cocktailThrow','cocktail',[[0,8],[18,10]]],
  [1,'sprotelMarlin','marlin','blueMarlin',[[0,8],[24,11]]],
  [1,'sprotelDiskLaser','diskLaser','diskLaser',[[0,8],[8,8],[16,9],[24,10]]],
  [2,'sprotelCocktailCannon','cocktailCannon','cocktail',[[0,8],[16,9],[32,11]]],
  [2,'sprotelSnacks','snacks','pretzel',[[0,8]]],[2,'sprotelSnacks','snacks','nacho',[[12,9]]],[2,'sprotelSnacks','snacks','popcorn',[[24,10]]],
  [2,'sprotelMarlin','marlin','blueMarlin',[[0,8],[24,11]]],
  [2,'sprotelDiskLaser','diskLaser','diskLaser',[[0,8],[8,8],[16,9],[24,10]]]
 ];
 for(const [phase,move,action,shape,events] of storyEvents)for(const [tick,frame] of events){
  d.reset(13,'rivet',0,37);const state=d.snapshot();state.s.boss.phase=phase;d.restore(state);
  const fired=sim.fixtureAttack(move,tick),shot=fired.shots.find(s=>s.shape===shape);assert(shot,move+' actually fires '+shape);
  closePoint(shot,attachment(phase-1,action,shape,frame,fired.box),move+' release frame '+frame);
  if(shape==='blueMarlin')assert(Math.abs(shot.y+shot.vy*(shot.x-220)/9-(fired.floor-(tick===0?72:205)))<1e-8,'story marlin reaches its advertised lane from the visible launcher');
 }
 // Step the actual game loop across the two frame-boundary releases. Undo its
 // first bullet movement, then compare the source with the actual post-step pose.
 for(const [phase,move,action,elapsed,active,expectedFrame] of [[1,'sprotelDrinks','cocktailThrow',18,38,10],[2,'sprotelCocktailCannon','cocktailCannon',32,44,11]]){
  d.reset(13,'rivet',0,37);const state=d.snapshot();Object.assign(state.s.boss,{phase,move,age:90+elapsed,tell:90,hp:100000,max:100000,section:0,aimX:220,aimY:600});state.s.player.inv=20000;d.restore(state);
  let stepped,shot;for(let tick=0;tick<8&&!shot;tick++){d.step(0);stepped=d.state();shot=stepped.bullets.find(s=>!s.own&&s.shape==='cocktail');}
  assert(shot,move+' releases through the real game loop');assert.equal(shot.age,1,'recover the first displayed projectile position');
  const pose=trials.ArcadeBossSheets.legacyPose(move,stepped.boss.age,stepped.boss.tell,active,stepped.time,1);assert.equal(pose.frame,expectedFrame,'release samples the actual post-increment frame');
  const origin={x:shot.x-shot.vx*shot.rate,y:shot.y-(shot.vy-shot.gravity*shot.rate)*shot.rate};
  closePoint(origin,attachment(phase-1,action,'cocktail',pose.frame,sim.fixtureDrawBox()),move+' game-loop origin matches its displayed animation');
 }
 // The story strike also follows the displayed post-increment frame11 only.
 for(const [elapsed,expectedHp,expectedFrame] of [[22,5,10],[23,4,11],[30,4,11],[31,5,12]]){
  d.reset(13,'rivet',0,37);let state=d.snapshot();Object.assign(state.s.boss,{phase:2,move:'sprotelBeerStick',x:570,startX:1010,age:90+elapsed,tell:90,hp:100000,max:100000,section:0,aimX:220,aimY:604});d.restore(state);
  const rect=sim.fixtureMeleeBox();state=d.snapshot();Object.assign(state.s.player,{x:rect.x+rect.w/2,y:604,grounded:true,inv:0,shield:0,dash:0});d.restore(state);
  let stepped;for(let tick=0;tick<8;tick++){d.step(0);stepped=d.state();if(stepped.boss.age>90+elapsed)break;}
  const pose=trials.ArcadeBossSheets.legacyPose('sprotelBeerStick',stepped.boss.age,stepped.boss.tell,32,stepped.time,0);
  assert.equal(pose.frame,expectedFrame);assert.equal(stepped.player.hp,expectedHp,'actual story beer strike contact at elapsed'+elapsed+' agrees with displayed frame'+expectedFrame);
 }
 d.reset(13,'rivet',0,37);{const state=d.snapshot();state.s.boss.phase=2;d.restore(state);}
 const storyFan=sim.fixtureAttack('sprotelSoundWave',0,310,565);assert.equal(storyFan.dimensions.w,96);assert.equal(storyFan.dimensions.h,56);assert.equal(storyFan.shots.length,3);assert(storyFan.shots.every(s=>s.age===0&&s.shape==='speakerMissile'));
 for(let lane=0;lane<3;lane++){
  const shot=storyFan.shots[lane];assert.equal(shot.vx,-3.6);
  const arrival=shot.y+shot.vy*(shot.x-310)/3.6;assert(Math.abs(arrival-(500+(1-lane)*80))<1e-8,'story speaker fan targets the locked player with eighty-pixel lane spacing');
  closePoint(shot,attachment(1,'soundWave','speakerMissile.'+lane,8,storyFan.box),'story simultaneous speaker lane '+lane);
 }
 assert.equal(sim.fixtureAttack('sprotelSoundWave',24).shots.length,0,'story has no delayed second salvo');
 d.reset(13,'rivet',0,37);sim.fixtureHit(10000);assert.equal(d.state().boss.hp,0);assert.equal(d.state().phaseShift,1);assert.equal(d.state().transition,0);
 for(let i=1;i<sim.fixtureStageShift;i++)d.step(0);assert.equal(d.state().boss.phase,2);assert.equal(d.state().boss.hp,290);assert.equal(d.state().phaseShift,0);
 for(let quarter=0;quarter<4;quarter++)sim.fixtureHit(73);assert.equal(d.state().boss.hp,0,'real hits cross all phase 2 quarters without an unreachable generic shield-pulse floor');assert.equal(d.state().transition,108);for(let i=0;i<108;i++)d.step(0);assert.equal(d.state().mode,'clear');assert.equal(d.state().boss.phase,2);
 console.log(JSON.stringify({status:'passed',stage:14,modern,story,phaseTransition:true,phaseTwoCheckpointAndPractice:true,boundedMelee:true,measuredProjectileOrigins:true,postStepReleaseFrameOrigins:true,threeSimultaneousSmallerSpeakers:true,limitations:['Controlled fixture suppresses player damage and protects target HP while auditing attacks; not a human playtest or earned clear.']},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
