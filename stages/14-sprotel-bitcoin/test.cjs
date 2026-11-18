/* Controlled contract diagnostics: real story/trials stepping, not an earned clear. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),acorn=require('acorn'),walk=require('acorn-walk');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const plain=v=>JSON.parse(JSON.stringify(v));
const levelsText=read('levels.js');
function config(ready){const c=vm.createContext({});vm.runInContext(levelsText.replace(/const SPROTEL_READY=(?:true|false);/,'const SPROTEL_READY='+ready+';')+';globalThis.config={LEVELS,mechanicsIndex,order:campaignLevelIndices(),nextCampaignLevel,campaignLevelNumber};',c);return c.config;}
const pending=config(false),live=config(true);
assert.deepEqual(Array.from(pending.order),[0,12,1,2,3,4,5,6,7,8,9,10,11]);
assert.deepEqual(Array.from(live.order),[0,12,1,13,2,3,4,5,6,7,8,9,10,11]);
for(let i=0;i<13;i++)assert.equal(live.LEVELS[i].id,i+1,'earlier save IDs stay stable');
assert.equal(live.LEVELS[13].id,14);assert.equal(live.mechanicsIndex(13),1);
assert.equal(live.LEVELS[13].art,live.LEVELS[1].art);assert.equal(live.LEVELS[13].singlePhase,true);
assert.equal(live.nextCampaignLevel(1),13);assert.equal(live.nextCampaignLevel(13),2);
assert.equal(live.LEVELS[13].densityBarrage,false);
assert(live.LEVELS.slice(0,13).every(l=>l.densityBarrage!==false),'existing barrages retain eligibility');

const trials=vm.createContext({});
for(const f of ['levels.js','sprite-hitboxes.js','density-attacks.js','phase-powerups.js','runtime/contract.js','runtime/core/world.js','stages/14-sprotel-bitcoin/stage.js'])vm.runInContext(read(f),trials,{filename:f});
const A=trials.Arcade,stage=A.stages.get('14-sprotel-bitcoin');
assert.equal(stage.phases.length,1);assert.equal(stage.scenery,live.LEVELS[1].art);assert.equal(stage.densityBarrage,false);
const expected=new Map([['beer',0],['cocktail',1],['blueMarlin',2],['diskLaser',0]]);
const w=new A.World(stage,{seed:37,phase:1,practice:true});
assert.equal(w.phaseIndex,0,'a stale practice-phase URL cannot create a nonexistent phase');
// Suppress player damage only, leaving authored attacks, target windows and baseline autofire intact.
w.player.inv=20000;
const trialSeen=new Map();let firstOpen=-1,laserTell=-1,laserRelease=-1;
for(let i=0;i<12000&&w.state==='playing';i++){
 w.step({});
 if(w.cueText.startsWith('DISK LASER')&&laserTell<0)laserTell=w.phaseTick;
 for(const h of w.hazards){
  trialSeen.set(h.sprite,h.weaponVariant);
  assert.equal(h.weaponPhase,0);
  if(h.sprite==='diskLaser'&&laserRelease<0)laserRelease=w.phaseTick;
 }
 if(w.targets[0].open&&firstOpen<0)firstOpen=w.phaseTick;
 assert.equal(w.phaseIndex,0);assert.equal(w.densityBarrage,null);
}
assert.deepEqual([...trialSeen], [...expected]);assert.equal(firstOpen,665);
assert.equal(laserRelease-laserTell,90,'the disk laser has ninety actual warning ticks');
assert.equal(w.state,'clear');assert.equal(w.phaseIndex,0);const trialClearTick=w.tick;
w.restart();w.hazard({id:'stale',active:100});w.lose('fixture');w.step({retry:true});
assert.equal(w.phaseIndex,0);assert.equal(w.player.hp,5);assert.equal(w.hazards.length,0);
assert.equal(w.targets[0].open,false);assert.equal(w.checkpointRetry,false);
// Committed laser aim does not follow the player after the long tell starts.
const aimWorld=new A.World(stage,{seed:37});aimWorld.phaseTick=550;aimWorld.phase.update(aimWorld);
const locked=plain(aimWorld.data.laserAim);aimWorld.player.x=1100;aimWorld.phaseTick=640;aimWorld.phase.update(aimWorld);
const beam=aimWorld.hazards.find(h=>h.sprite==='diskLaser');assert(beam);assert.equal(beam.vx<0,true);
assert.deepEqual(plain(aimWorld.data.laserAim),locked);
const muzzle={x:beam.x+beam.w/2,y:beam.y+beam.h/2};
assert(Math.abs(beam.vy/beam.vx-(locked.y-muzzle.y)/(locked.x-muzzle.x))<1e-10);

const browser=read('rework.js'),game=read('game.js');
function declaration(source,name){let found;walk.simple(acorn.parse(source,{ecmaVersion:'latest'}),{FunctionDeclaration(n){if(n.id.name===name)found=n;}});assert(found,name+' exists');return source.slice(found.start,found.end);}
// Execute actual query handling with a select that enforces the browser's option-value behavior.
const entry={options:[],_value:'',replaceChildren(...options){this.options=options;this._value=options[0]?.value||'';},add(o){this.options.push(o);},get value(){return this._value;},set value(v){this._value=this.options.some(o=>o.value===v)?v:'';}};
const elements={stage:{value:'14-sprotel-bitcoin'},entry};
const bar={id:'02-last-light',phases:[{},{}]},hidden={id:'pending',phases:[{}]};
const menu=vm.createContext({Arcade:{stages:new Map([[stage.id,stage],[bar.id,bar],[hidden.id,hidden]])},stages:[stage,bar],Option:class{constructor(text,value){this.text=text;this.value=value;this.dataset={};}},$:id=>elements[id],records(){},URLSearchParams});
for(const name of ['refreshEntries','applyEntryQuery'])vm.runInContext(declaration(browser,name),menu);
menu.query=new URLSearchParams('stage=14-sprotel-bitcoin&phase=1');vm.runInContext('applyEntryQuery(query)',menu);
assert.equal(entry.value,'0');assert.equal(entry.options.length,1);
menu.query=new URLSearchParams('stage=02-last-light&phase=1');vm.runInContext('applyEntryQuery(query)',menu);assert.equal(entry.value,'1');
menu.query=new URLSearchParams('stage=pending');vm.runInContext('applyEntryQuery(query)',menu);assert.equal(elements.stage.value,bar.id,'pending entries cannot blank the stage select');
// Execute the actual browser retry/begin path: unsupported phase-two checkpoints normalize to P1.
const retry=vm.createContext({LEVELS:live.LEVELS,SPROTEL_READY:true,REDKEV_READY:true,storyTransition:null,firstLevel:13,levelIndex:13,runAttempt:0,godMode:false,selectedSproto:{id:'rivet'},player:{shieldWait:0},boss:{phase:1},keys:new Set(),pressed:new Set(),levelSelect:{},document:{},hud:{},gameScreen:{classList:{remove(){}}},window:{ArcadeReplay:{recorder(){return {};}}},showLevelControls(){},setOverlay(){},refreshHud(){},prefetchLevel(){},nextCampaignLevel:()=>-1,isChase:()=>false,whenReady(i,fn){fn();},resetRun(index){retry.levelIndex=index;retry.player={hp:5,shieldWait:0};retry.boss={phase:1,hp:580};}});
for(const name of ['begin','retryCurrentPhase'])vm.runInContext(declaration(game,name),retry);
vm.runInContext('begin(13,false,2,37)',retry);assert.equal(retry.boss.phase,1);assert.equal(retry.phaseCheckpointRun,false);
vm.runInContext('retryCurrentPhase()',retry);assert.equal(retry.boss.phase,1);assert.equal(retry.player.hp,5);assert.equal(retry.phaseCheckpointRun,false);

(async()=>{
 const {buildSimSource}=await import(path.join(root,'tools/build-server-sim.mjs'));
 const scope=vm.createContext({structuredClone,ARCADE_SIM_VERSION:'sprotel-fixture'});
 vm.runInContext('globalThis.sim=(function(){'+buildSimSource({dev:true}).source+';api.fixtureHit=function(damage){hitBoss({shape:"spark",x:boss.x,y:boss.y-90},damage);};return api;})();',scope);
 const sim=scope.sim,d=sim._dev;d.reset(13,'rivet',0,37);
 const safe=d.snapshot();safe.s.player.inv=20000;d.restore(safe);
 const seen=new Map();let tell=-1,release=-1,previousMove=null;
 for(let tick=0;tick<2500&&d.state().mode==='play';tick++){
  d.step(0);const s=d.state();
  if(s.boss.move==='sprotelDiskLaser'&&previousMove!==s.boss.move&&tell<0)tell=s.time;
  previousMove=s.boss.move;
  for(const shot of s.bullets)if(!shot.own){seen.set(shot.shape,shot.weaponVariant);assert.equal(shot.weaponPhase,0);if(shot.shape==='diskLaser'&&release<0){release=s.time;assert.equal(shot.laser,true);}}
  assert.equal(s.boss.phase,1);assert.equal(s.phaseShift,0);
 }
 assert.deepEqual([...seen],[...expected]);assert(release-tell>=90,'legacy disk laser warning cannot be compressed below ninety frames');
 d.reset(13,'rivet',0,37);sim.fixtureHit(10000);
 assert.equal(d.state().boss.hp,0);assert.equal(d.state().boss.phase,1);assert.equal(d.state().phaseShift,0);assert.equal(d.state().transition,108);
 for(let i=0;i<108;i++)d.step(0);
 assert.equal(d.state().mode,'clear');assert.equal(d.state().boss.phase,1);assert.equal(d.cleared(),108);
 console.log(JSON.stringify({status:'passed',stage:14,campaign:'1 → 13 → 2 → 14 → 3',trialClearTick,firstCoreOpening:firstOpen,trials:[...trialSeen],story:[...seen],diskLaserWarning:{trials:laserRelease-laserTell,story:release-tell},singlePhaseClearAndRetry:true,limitations:['Controlled diagnostics suppress player damage; they are not human playtesting or earned clears.']},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
