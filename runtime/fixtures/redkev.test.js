/* Stable campaign IDs, hidden-until-ready placement, and real legacy ID13 mechanics. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),root=path.resolve(__dirname,'../..');
function config(ready){const s=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'levels.js'),'utf8').replace(/const REDKEV_READY=(?:true|false);/,'const REDKEV_READY='+ready+';')+';globalThis.config={LEVELS,mechanicsIndex,order:campaignLevelIndices(),nextCampaignLevel,campaignLevelNumber};',s);return s.config;}
const pending=config(false),live=config(true);assert.deepEqual(Array.from(pending.order),[0,1,2,3,4,5,6,7,8,9,10,11]);assert.deepEqual(Array.from(live.order),[0,12,1,2,3,4,5,6,7,8,9,10,11]);assert.equal(live.nextCampaignLevel(0),12);assert.equal(live.nextCampaignLevel(12),1);assert.equal(live.nextCampaignLevel(11),-1);assert.equal(live.campaignLevelNumber(12),2);assert.equal(live.LEVELS[12].id,13);assert.equal(live.mechanicsIndex(12),0);for(let i=0;i<12;i++){assert.equal(live.LEVELS[i].id,i+1);assert.equal(live.mechanicsIndex(i),i);}
(async()=>{
 const {loadSourceSim}=await import(path.join(root,'tools/build-server-sim.mjs')),sim=loadSourceSim({dev:true}),d=sim._dev;
 d.reset(0,'rivet',0,37);const original=d.state().boss;d.reset(12,'rivet',0,37);const red=d.state().boss;
 assert.equal(red.id,'redkev');assert.equal(red.name,'Redkev');for(const key of ['hp','max','phaseTwoHealth','archetype','shotRate','scale','phase'])assert.deepEqual(red[key],original[key],key+' inherits Marina gameplay');
 // Plan item D5: Redkev has his own move order, signatures and cadence; Fat Head Dave keeps his.
 assert.equal(original.cadence,1);assert.equal(red.cadence,1.01);
 assert.deepEqual(Array.from(original.moves),['quake','bankShot','rush','slabs','drop']);assert.deepEqual(Array.from(red.moves),['rush','slabs','quake','drop','bankShot']);
 const kit=live.LEVELS&&vm.runInContext('REDKEV_KIT',(()=>{const s=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'levels.js'),'utf8')+';globalThis.REDKEV_KIT=REDKEV_KIT;globalThis.tables={BOSS_SECTION_ATTACKS,BOSS_SIGNATURES,SIGNATURE_PATTERNS,bossKitOverride};',s);return s;})());
 assert.deepEqual(Array.from(kit.signatures),['forgePress','portalRing']);
 const seenMoves=level=>{d.reset(level,'rivet',0,37);const seen=new Set(),orderSeen=[];for(let phase=1;phase<=2;phase++)for(const fraction of [1,.74,.49,.24]){const snap=d.snapshot(),b=snap.s.boss;if(phase===2){b.phase=2;b.max=b.phaseTwoHealth;b.pulses=new Set([2,3]);}b.hp=Math.ceil(b.max*fraction);b.move=null;b.age=35;b.step=0;b.section=-1;snap.s.densityPhaseKey='';snap.s.densityPhaseClock=-100000;snap.s.player.hp=5;d.restore(snap);for(let i=0;i<1500&&d.state().mode==='play';i++){const s=d.snapshot();s.s.boss.hp=Math.ceil(s.s.boss.max*fraction);s.s.player.hp=5;s.s.player.inv=5;s.s.densityPhaseClock=-100000;d.restore(s);d.step(0);const m=d.state().boss.move;if(m&&orderSeen.at(-1)!==m){orderSeen.push(m);seen.add(m);}}}return{seen,orderSeen};};
 const dave=seenMoves(0),kev=seenMoves(12);
 for(const move of ['forgePress','portalRing'])assert.ok(kev.seen.has(move)&&!dave.seen.has(move),'Redkev alone uses '+move);
 for(const move of ['anchorRun','bellSweep'])assert.ok(dave.seen.has(move)&&!kev.seen.has(move),'Fat Head Dave alone uses '+move);
 for(const move of ['ceilingSweep','arenaHazard','hammer','ripple','comet','floorSaw','eyeShot','minefall','needleFall','starCross'])assert.ok(kev.seen.has(move),'Redkev still uses '+move);
 assert.notDeepEqual(kev.orderSeen.slice(0,6),dave.orderSeen.slice(0,6),'the two fights open differently');
 assert.equal(dave.orderSeen[0],'airLanes');assert.equal(kev.orderSeen[0],'rush');
 const log={schema:1,simVersion:sim.ARCADE_SIM_VERSION,seed:37,rules:{mode:'story',level:13,shieldWait:0},loadout:{pilot:'rivet'},ticks:1,inputs:sim.encodeInputs([0]),claimed:{kind:'boss',stage:13,bossId:'redkev',ticks:1},godMode:false};const r=sim.verifyClear(log);assert.equal(r.ok,false);assert.match(r.error,/no clear within/,'ID13 resolves in actual server verifier but no clear is fabricated');assert.equal(r.stage,13);assert.equal(r.bossId,'redkev');
 console.log('PASS gated Redkev campaign1→13→2, stable prior12IDs/unlocks, Marina arena and health with the Redkev kit, and real serverID13 validation');
})().catch(e=>{console.error(e);process.exitCode=1;});
