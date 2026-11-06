/* Browser-only start gates: decode all four stage atlases before constructing a run. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const created=[];
class Image{
 constructor(){this.complete=false;this.naturalWidth=this.naturalHeight=0;this.promise=new Promise((resolve,reject)=>{this.resolve=(width=2048,height=2048)=>{this.complete=true;this.naturalWidth=width;this.naturalHeight=height;resolve();};this.reject=()=>{this.complete=true;reject(Error('network'));};});created.push(this);}
 decode(){return this.promise;}
}
const scope=vm.createContext({Image,console});
for(const file of ['sprite-hitboxes.js','boss-sheets.js'])vm.runInContext(fs.readFileSync(file,'utf8'),scope,{filename:file});
const art=scope.ArcadeBossSheets;
for(const config of Object.values(art.manifest))for(const asset of [...config.phases,...config.projectiles])asset.ready=false;
const approve=id=>{const c=art.manifest[id];for(const a of [...c.phases,...c.projectiles])a.ready=true;};
(async()=>{
 approve(1);assert.equal(art.stageReady(1),false);assert.equal(created.length,0,'readiness check does not request images');
 const first=art.preloadStage(1);assert.equal(art.preloadStage(1),first,'simultaneous start/prefetch shares one in-flight stage load');assert.equal(created.length,4);
 for(const image of created.slice(0,3))image.resolve();await Promise.resolve();assert.equal(art.stageReady(1),false);created[3].resolve();await first;assert.equal(art.stageReady(1),true);
 await art.preloadStage(1);assert.equal(created.length,4,'warm retry makes no new requests');
 approve(2);let before=created.length,failed=art.preloadStage(2);const group=created.slice(before);group.slice(0,3).forEach(i=>i.resolve());group[3].reject();await assert.rejects(failed);assert.equal(art.stageReady(2),false);
 before=created.length;const retry=art.preloadStage(2);assert.equal(created.length-before,1,'only failed image is evicted/refetched');created.at(-1).resolve();await retry;assert.equal(art.stageReady(2),true);
 approve(3);before=created.length;const invalid=art.preloadStage(3);const bad=created.slice(before);bad[0].resolve(1024,2048);bad.slice(1).forEach(i=>i.resolve());await assert.rejects(invalid,/2048/);assert.equal(art.stageReady(3),false);
 const fixed=art.preloadStage(3);created.at(-1).resolve();await fixed;assert.equal(art.stageReady(3),true);
 // Execute the actual modern start functions, with only DOM/world construction mocked.
 const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:id==='start'?'Start run':'',disabled:false,selectedOptions:[{dataset:{}}]});return elements.get(id);};el('stage').value='04-ranch';el('entry').value='0';el('pilot').value='rivet';el('seed').value='777';
 scope.$=el;scope.constructed=0;scope.Arcade={stages:new Map([['04-ranch',{id:'04-ranch'}],['05-neon',{id:'05-neon'}]]),World:class{constructor(stage,options){scope.constructed++;this.stage=stage;this.options=options;this.tick=0;}}};
 vm.runInContext('var world=null,paused=false,pilot,last=0,acc=0,visibleState="",soundTick=-1,held=new Set(),press=new Set();function records(){}function tone(){}function render(){}',scope);
 const source=fs.readFileSync('rework.js','utf8');vm.runInContext(source.slice(source.indexOf('function startNow(){'),source.indexOf("$('next').onclick")),scope);
 approve(4);before=created.length;const cold=scope.start();assert.equal(scope.constructed,0,'no world or gameplay ticks before decoding');assert.equal(el('start').disabled,true);created.slice(before).forEach(i=>i.resolve());await cold;assert.equal(scope.constructed,1);assert.equal(scope.world.tick,0);assert.equal(el('start').disabled,false);
 assert.equal(scope.start(),undefined,'already decoded retry remains synchronous');assert.equal(scope.constructed,2);
 approve(5);el('stage').value='05-neon';before=created.length;const oldWorld=scope.world,blocked=scope.start(),pending=created.slice(before);pending.slice(0,3).forEach(i=>i.resolve());pending[3].reject();await blocked;assert.equal(scope.world,oldWorld,'failed download cannot start a mismatched fallback run');assert.equal(scope.constructed,2);assert.match(el('start').textContent,/Retry/);assert.equal(el('start').disabled,false);
 const resumed=scope.start();created.at(-1).resolve();await resumed;assert.equal(scope.constructed,3);assert.equal(scope.world.stage.id,'05-neon');
 // The actual legacy whenReady path joins these atlases with its existing groups.
 scope.ui={start:el('start')};scope.loadCore=scope.loadLevel=scope.loadSproto=()=>Promise.resolve();
 vm.runInContext('var selectedSproto={id:"rivet"},LEVELS=[{id:6}],readyGroups=new Set(["core","level:0","sproto:rivet"]);',scope);
 const game=fs.readFileSync('game.js','utf8');vm.runInContext(game.slice(game.indexOf('const bossArtReady='),game.indexOf('function prefetchLevel'))+game.slice(game.indexOf('let pendingStart=0;'),game.indexOf('// Title-screen choices:')),scope);
 approve(6);before=created.length;let starts=0;scope.whenReady(0,()=>starts++);assert.equal(starts,0);assert.equal(el('start').disabled,true);created.slice(before).forEach(i=>i.resolve());await new Promise(setImmediate);assert.equal(starts,1);scope.whenReady(0,()=>starts++);assert.equal(starts,2,'legacy loaded retry remains synchronous');
 approve(7);vm.runInContext('LEVELS[0].id=7',scope);before=created.length;scope.whenReady(0,()=>starts++);const failedLegacy=created.slice(before);failedLegacy.slice(0,3).forEach(i=>i.resolve());failedLegacy[3].reject();await new Promise(setImmediate);assert.equal(starts,2);assert.equal(el('start').disabled,false);assert.match(el('start').textContent,/Retry/);scope.whenReady(0,()=>starts++);created.at(-1).resolve();await new Promise(setImmediate);assert.equal(starts,3);
 // A missing renderer is optional only in historical disabled mode.
 const legacyGate=vm.runInContext('({ready:bossArtReady,load:loadBossArt})',scope);const beforeMissing=scope.constructed;scope.ArcadeBossSheets=undefined;
 vm.runInContext('SPRITE_HITBOXES.enabled=false',scope);assert.equal(scope.start(),undefined);assert.equal(scope.constructed,beforeMissing+1);assert.equal(legacyGate.ready(0),true);await legacyGate.load(0);
 vm.runInContext('SPRITE_HITBOXES.enabled=true',scope);const protectedWorld=scope.world;scope.start();assert.equal(scope.constructed,beforeMissing+1,'enabled geometry cannot start without the renderer');assert.equal(scope.world,protectedWorld);assert.match(el('start').textContent,/Reload/);assert.equal(legacyGate.ready(0),false);await assert.rejects(legacyGate.load(0),/Reload/);let missingStarted=false;scope.whenReady(0,()=>{missingStarted=true;});await new Promise(setImmediate);assert.equal(missingStarted,false);assert.match(el('start').textContent,/Reload/);scope.ArcadeBossSheets=art;vm.runInContext('SPRITE_HITBOXES.enabled=false',scope);
 console.log('PASS stage-scoped four-sheet decode gate, shared loads, retryable failures, invalid dimensions, modern/legacy no pre-start world/ticks and synchronous warm retry');
})().catch(error=>{console.error(error);process.exitCode=1;});
