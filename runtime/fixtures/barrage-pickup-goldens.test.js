/* Plan items B1 and B2 against the committed golden clears (qa/golden/story-NN.json), replayed
 * through the real story simulation (tools/build-server-sim.mjs, the bundle's source):
 *  - no pickup appears while a barrage is live, and no heart appears at five hearts;
 *  - every boss fight's phase 1 has an item after tick 1000 and two barrages, the second one
 *    shorter (250 to 420 ticks) and not before the third health section; phase 2, the chase,
 *    the climb and the Codebreak arena have one.
 * `node runtime/fixtures/barrage-pickup-goldens.test.js --table` prints the per-level figures.
 * These are a lookahead bot's runs, not a person's. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
(async()=>{
  const {loadSourceSim}=await import(path.join(root,'tools/build-server-sim.mjs'));
  const sim=loadSourceSim({dev:true}),dev=sim._dev,rows=[];
  const files=fs.readdirSync(path.join(root,'qa/golden')).filter(f=>/^story-\d\d\.json$/.test(f)).sort();
  assert.equal(files.length,13);
  let spawns=0,hearts=0;
  for(const file of files){
    const gold=JSON.parse(fs.readFileSync(path.join(root,'qa/golden',file),'utf8')),log=gold.log,label=file+' ('+gold.title+')';
    const {masks}=sim.decodeInputs(log.inputs,log.ticks),index=sim.levels.findIndex(l=>l.stage===log.rules.level);
    dev.reset(index,log.loadout.pilot,log.rules.shieldWait,log.seed);
    const boss=![11,12].includes(gold.level),phases={1:{start:0,end:0,barrages:[],spawns:[]},2:{start:0,end:0,barrages:[],spawns:[]}};
    let live=null,seen=new Set(),hits=0,barrageHits=0,hp=5,phaseTick=0,lastPhase=1;
    for(const mask of masks){
      const before=dev.state(),hpBefore=before.player.hp,barrageBefore=before.densityShots.length>0;
      dev.step(mask);
      const s=dev.state(),phase=s.boss.phase===2?2:1,record=phases[phase];
      if(phase!==lastPhase){phases[2].start=s.time;lastPhase=phase;seen=new Set();}
      record.end=s.time;
      if(s.player.hp<hp){hits+=hp-s.player.hp;if(barrageBefore)barrageHits+=hp-s.player.hp;}
      hp=s.player.hp;
      const flying=s.densityShots.length>0;
      if(flying&&!live){live={start:s.time,section:s.boss.max?Math.min(3,Math.floor(4*(s.boss.max-s.boss.hp)/s.boss.max)):0,clock:s.densityPhaseClock};record.barrages.push(live);}
      if(!flying&&live){live.length=s.time-live.start;live=null;}
      for(const item of s.phasePowerupsState?.items.pickups??[]){
        const key=phase+':'+item.id;
        if(seen.has(key))continue;
        seen.add(key);spawns++;if(item.kind==='life')hearts++;
        record.spawns.push({kind:item.kind,tick:s.phasePowerupsState.tick,time:s.time});
        assert.equal(flying,false,label+': a '+item.kind+' appeared during a barrage at tick '+s.time);
        if(item.kind==='life')assert.ok(hpBefore<5,label+': a heart appeared at full health');
      }
    }
    assert.ok(dev.cleared()>=0,label+' clears');
    const one=phases[1],two=phases[2];
    if(boss){
      assert.equal(one.barrages.length,2,label+': phase 1 has two barrages');
      const [first,second]=one.barrages;
      assert.ok(second.length>=250&&second.length<=420,label+': the second barrage lasts 250 to 420 ticks ('+second.length+')');
      assert.ok(second.length<first.length,label+': and is shorter than the first');
      assert.ok(second.section>=2,label+': it starts in the third health section or later');
      assert.ok(second.clock-first.clock>=900,label+': at least 900 phase-clock ticks after the first');
      assert.ok(one.spawns.some(spawn=>spawn.tick>1000),label+': phase 1 has an item after tick 1000');
      assert.equal(two.barrages.length,1,label+': phase 2 has one barrage');
    }else{
      assert.equal(one.barrages.length,1,label+': one barrage before the summit or finish');
      assert.ok(two.barrages.length<=1);
    }
    rows.push({level:gold.level,title:gold.title,clear:gold.expect.ticks,phase1:phases[2].start||gold.expect.ticks,phase2:phases[2].start?gold.expect.ticks-phases[2].start:0,
      p1Barrages:one.barrages.map(b=>b.start+'+'+b.length).join(', '),p2Barrages:two.barrages.map(b=>(b.start-two.start)+'+'+b.length).join(', '),
      p1Items:one.spawns.map(x=>x.kind[0]+'@'+x.tick).join(' '),p2Items:two.spawns.map(x=>x.kind[0]+'@'+x.tick).join(' '),hits,barrageHits});
  }
  if(process.argv.includes('--table')){
    console.log('| Level | Clear ticks (s) | Phase 1 (s) | Phase 2 (s) | P1 barrages start+length | P2 barrage | P1 items | P2 items | Bot hits (in barrage) |\n|---|---|---|---|---|---|---|---|---|');
    for(const r of rows)console.log(`| ${r.level} ${r.title} | ${r.clear} (${Math.round(r.clear/60)}) | ${r.phase1} (${Math.round(r.phase1/60)}) | ${r.phase2} (${Math.round(r.phase2/60)}) | ${r.p1Barrages} | ${r.p2Barrages||'n/a'} | ${r.p1Items||'none'} | ${r.p2Items||'none'} | ${r.hits} (${r.barrageHits}) |`);
  }
  console.log(`PASS 13 golden clears: ${spawns} pickups (${hearts} hearts), none during a barrage, no heart at full health; two phase-1 barrages per boss fight with a short second one`);
})().catch(error=>{console.error(error);process.exit(1);});
