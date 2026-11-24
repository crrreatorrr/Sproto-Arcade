/* Phase-2 entry and start-grace rules of 2026-11-24 (docs/PHASE-POWERUPS.md), on the real story
 * simulation extracted from game.js (tools/build-server-sim.mjs, the source of
 * dist/arcade-sim.server.js):
 *  - reaching phase 2 restores full hearts, as a phase-2 retry does;
 *  - the first phase-2 attack lands after the arena banner has gone, and soon after;
 *  - the Rooftop chase ignores a held left for its first half second;
 *  - standing auto-fire damages the phase-2 bosses of Last Light Bar and Circuit Gate.
 * State edits (boss health, player hearts) only set up the situation; every tick is the real update(). */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const LEFT=1,JUMP=16,HOLD=32,MISSILE=256,BOMB=512;

(async()=>{
  const {loadSourceSim}=await import(path.join(root,'tools/build-server-sim.mjs'));
  const sim=loadSourceSim({dev:true}),dev=sim._dev;
  const enemies=s=>s.bullets.filter(b=>!b.own).length+s.hazards.length+(s.vaultBeam?1:0)+(s.codeShots||[]).length;

  // Boss levels: wear phase 1 down with a state edit, arrive hurt, and watch phase 2 open.
  const openings=[];
  for(let level=0;level<sim.levels.length;level++){
    const stage=sim.levels[level].stage;
    if(stage===11||stage===12)continue;
    dev.reset(level,'rivet',0,7);
    let start=-1,first=null,bannerAtStart=0;
    for(let n=0;n<4000&&first===null;n++){
      let s=dev.state();
      assert.equal(s.mode,'play',sim.levels[level].title+' is still in play');
      if(start<0){
        s.player.hp=2; // hurt, and never knocked out before the phase change
        if(s.boss.phase===1&&!s.phaseShift&&s.boss.hp>1&&n>120)s.boss.hp=1;
      }else s.player.inv=5; // nothing can end the run while the opening is measured
      dev.step(MISSILE|BOMB|(n%40<20?JUMP|HOLD:HOLD));
      s=dev.state();
      if(start<0&&s.boss.phase===2&&!s.phaseShift){
        start=s.time;bannerAtStart=s.banner;
        assert.equal(s.player.hp,5,sim.levels[level].title+': phase 2 starts with full hearts');
        assert.equal(enemies(s),0,sim.levels[level].title+': nothing hostile is carried into phase 2');
      }else if(start>=0&&enemies(s)){
        first=s.time-start;
        assert.equal(s.banner,0,sim.levels[level].title+': the banner is gone when the first attack lands (tick '+first+')');
      }
      assert.ok(start<0||s.time-start<200,sim.levels[level].title+': phase 2 does attack');
    }
    assert.equal(bannerAtStart,85);
    assert.ok(first>85&&first<=140,sim.levels[level].title+': first phase-2 attack at tick '+first);
    openings.push(first);
  }
  assert.equal(openings.length,12);
  assert.ok(openings.filter(tick=>tick<=87).length>=11,'the grace is the smallest that clears the banner: '+openings);
  console.log('PASS phase 2 of all 12 boss fights starts at five hearts and first attacks after the 85-tick banner (ticks '+openings.join(', ')+')');

  // Codebreak: the committed golden's inputs reach the arena; the edit makes the player arrive hurt.
  {
    const golden=JSON.parse(fs.readFileSync(path.join(root,'qa/golden/story-12.json'),'utf8'));
    const masks=sim.decodeInputs(golden.log.inputs,golden.log.ticks).masks,level=sim.levels.findIndex(l=>l.stage===12);
    dev.reset(level,'rivet',0,golden.log.seed);
    let start=-1,first=null,hurt=false;
    for(let i=0;i<masks.length&&first===null;i++){
      let s=dev.state();
      if(start<0&&s.boss.shift&&!hurt){s.player.hp=Math.min(s.player.hp,2);hurt=true;}
      dev.step(masks[i]);s=dev.state();
      assert.equal(s.mode,'play');
      if(start<0&&s.boss.phase===2){start=s.time;assert.equal(s.player.hp,5,'the Codebreak arena starts with full hearts');assert.equal(s.banner,104);}
      else if(start>=0&&s.codeShots.length){first=s.time-start;assert.equal(s.banner,0,'the arena banner is gone at the first volley');}
    }
    assert.ok(hurt&&first>105&&first<=110,'first arena volley at tick '+first);
    console.log('PASS the Codebreak arena starts at five hearts and its first volley leaves at tick '+first+', after the 105-tick banner');
  }

  // Rooftop chase: a left held from the first tick no longer ends the run inside four ticks.
  {
    const level=sim.levels.findIndex(l=>l.stage===11);
    dev.reset(level,'rivet',0,1);
    for(let n=0;n<30;n++)dev.step(LEFT);
    let s=dev.state();
    assert.equal(s.mode,'play','holding left through the 30-tick start grace is survived');
    assert.equal(s.player.x,220,'and the runner has not moved back');
    let caught=0;
    for(let n=0;n<10&&s.mode==='play';n++){dev.step(LEFT);s=dev.state();caught=s.time;}
    assert.equal(s.mode,'lost','after the grace, running into Goldie still ends the chase');
    assert.equal(caught,34);
    dev.reset(level,'rivet',0,1);
    for(let n=0;n<30;n++)dev.step(0);
    assert.equal(dev.state().player.x,220,'no input holds the same place as before');
    console.log('PASS the chase start grace ignores a held left for 30 ticks and nothing more');
  }

  // Standing auto-fire (no input at all) hurts the two phase-2 bosses it used to pass under.
  for(const stage of [2,6]){
    const level=sim.levels.findIndex(l=>l.stage===stage);
    dev.reset(level,'rivet',0,1234);
    let start=-1,hpAtStart=0,dealt=0;
    for(let n=0;n<12000;n++){
      let s=dev.state();
      s.player.hp=5;
      if(start<0&&s.boss.phase===1&&!s.phaseShift&&s.boss.hp>1&&n>120)s.boss.hp=1;
      dev.step(0);s=dev.state();
      assert.equal(s.mode,'play');
      if(start<0&&s.boss.phase===2&&!s.phaseShift){start=s.time;hpAtStart=s.boss.hp;}
      if(start>=0&&s.time-start===600){dealt=hpAtStart-s.boss.hp;break;}
    }
    assert.ok(start>0&&dealt>=20,sim.levels[level].title+': standing fire dealt '+dealt+' in the first 10 s of phase 2');
    console.log('PASS '+sim.levels[level].title+' phase 2: standing auto-fire deals damage ('+dealt+' in 10 s)');
  }
})().catch(error=>{console.error(error);process.exit(1);});
