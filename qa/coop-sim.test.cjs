/* Two-seat co-op simulation checks against the committed server bundle (docs/COOP.md).
 *   node qa/coop-sim.test.cjs [repo]
 * - Two independent peers (separate VM contexts) fed the same seed and both seats' inputs agree
 *   hash for hash every 60 ticks for 10,000 ticks.
 * - A snapshot restored into a third peer continues with identical hashes (desync recovery).
 * - Boss health is 1.80x per phase with two seats; pickup timing keeps the solo health (baseMax).
 * - Proximity revive, phase-2 auto-revive, downed-only never rescales, a dropped seat does.
 * - Duration: both seats replay a solo golden's inputs; the co-op clear time is reported against
 *   the solo golden's. This is a scripted comparison, not a balance playtest. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const bundle=fs.readFileSync(path.join(root,'dist/arcade-sim.server.js'),'utf8');
function peer(){const scope=vm.createContext({structuredClone});vm.runInContext(bundle,scope,{filename:'arcade-sim.server.js'});return scope.ArcadeSim;}
const golden=n=>JSON.parse(fs.readFileSync(path.join(root,'qa/golden',`story-${String(n).padStart(2,'0')}.json`),'utf8'));
const masksOf=(sim,g)=>sim.decodeInputs(g.log.inputs,g.log.ticks).masks;
const report={kind:'coop-sim',checks:[],durations:[]};
const pass=name=>report.checks.push(name);

// 1. Lockstep parity: two peers, 10,000 ticks (the run restarts if it ends earlier).
{
  const a=peer(),b=peer(),g=golden(1),m=masksOf(a,g),seed=0x9e3779b9;
  const second=m.map((mask,i)=>m[(i+37)%m.length]);
  let checked=0,restarts=0;
  for(const sim of [a,b])assert.equal(sim.coop.start(1,['rivet','sproto763'],seed),true);
  for(let tick=0;tick<10000;tick++){
    const i=tick%m.length;
    const ma=a.coop.step(m[i],second[i]),mb=b.coop.step(m[i],second[i]);
    assert.equal(ma,mb,'peers agree on the mode at tick '+tick);
    if((tick+1)%60===0){assert.equal(a.coop.hash(),b.coop.hash(),'hash parity at tick '+(tick+1));checked++;}
    if(ma!=='play'){restarts++;for(const sim of [a,b])sim.coop.start(1,['rivet','sproto763'],seed+restarts);}
  }
  assert.ok(checked>=166);pass('10,000-tick two-peer hash parity ('+checked+' checks, '+restarts+' restarts)');
}

// 2. Snapshot restore continues identically.
{
  const a=peer(),c=peer(),g=golden(2),m=masksOf(a,g),seed=12345;
  a.coop.start(2,['rivet','sproto763'],seed);c.coop.start(2,['rivet','sproto763'],seed+1);
  for(let t=0;t<2400&&a.coop.state().mode==='play';t++)a.coop.step(m[t],m[(t+11)%m.length]);
  const snap=a.coop.snapshot();c.coop.restore(snap);
  assert.equal(c.coop.hash(),a.coop.hash(),'restored state hashes the same');
  for(let t=2400;t<4200;t++){a.coop.step(m[t%m.length],m[(t+11)%m.length]);c.coop.step(m[t%m.length],m[(t+11)%m.length]);}
  assert.equal(c.coop.hash(),a.coop.hash(),'restored peer stays in lockstep');
  assert.ok(snap.length<200000,'snapshot is a few KB to tens of KB: '+snap.length);
  report.snapshotBytes=snap.length;pass('snapshot restore keeps lockstep ('+snap.length+' bytes)');
}

// 3. Health scaling, pickup timing and level coverage.
{
  const sim=peer();
  sim.coop.start(1,['rivet','sproto763'],7);
  let s=sim.coop.state();assert.equal(s.bossMax,947,'Fat Head Dave phase 1: round(526 x 1.80)');assert.equal(s.seats.length,2);
  const state=JSON.parse(sim.coop.snapshot());
  const find=(node,key)=>node.$o.find(([k])=>k===key)?.[1];
  const boss=find(state,'boss'),items=find(find(state,'phasePowerupsState'),'items'),plans=find(items,'plans');
  assert.equal(find(boss,'baseMax'),526);assert.equal(find(boss,'phaseTwoHealth'),473);
  const ats=plans.map(p=>find(p,'at'));assert.equal(ats.length,3,'one heart and two shields');
  const span=Math.round(526*6.2);for(const at of ats)assert.ok(at<=Math.ceil(span*.82),'pickup '+at+' falls inside the solo span '+span);
  assert.equal(sim.coop.start(11,['rivet','sproto763'],7),false,'the rooftop chase stays solo');
  assert.equal(sim.coop.start(12,['rivet','sproto763'],7),false,'the Codebreak climb stays solo');
  for(const [level,hp] of [[10,365],[13,263],[14,290]]){sim.coop.start(level,['rivet','sproto763'],3);assert.equal(sim.coop.state().bossMax,Math.round(2*hp*1.8),'level '+level+' phase 1 health');}
  pass('1.80x boss health per phase, solo pickup span, chase and climb stay solo');
}

// Edits a snapshot: fn receives a getter/setter over the decoded {$o} tree.
function edit(sim,fn){
  const state=JSON.parse(sim.coop.snapshot());
  const obj=node=>({get:k=>node.$o.find(([key])=>key===k)?.[1],set:(k,v)=>{const row=node.$o.find(([key])=>key===k);if(row)row[1]=v;else node.$o.push([k,v]);}});
  fn(obj(state),obj);sim.coop.restore(JSON.stringify(state));
}

// 4. Revive, auto-revive, rescaling.
{
  const sim=peer();sim.coop.start(3,['rivet','sproto763'],99);
  for(let t=0;t<200;t++)sim.coop.step(0,0);
  edit(sim,(s,obj)=>{
    const seats=s.get('players');const a=obj(seats[0]),b=obj(seats[1]);
    a.set('hp',0);b.set('x',a.get('x')+20);b.set('y',a.get('y'));s.set('bullets',[]);s.set('hazards',[]);
  });
  assert.equal(sim.coop.state().seats[0].hp,0);
  const maxBefore=sim.coop.state().bossMax;
  for(let t=0;t<89;t++)sim.coop.step(0,0);
  assert.equal(sim.coop.state().bossMax,maxBefore,'a downed seat never rescales the boss');
  let seats=sim.coop.state().seats;
  if(seats[0].hp===0){sim.coop.step(0,0);seats=sim.coop.state().seats;}
  assert.equal(seats[0].hp,2,'a partner in reach for 90 ticks revives at 2 hearts');
  pass('proximity revive after 90 ticks; downed-only keeps 1.80x');

  // Phase 2 stands every downed seat up.
  edit(sim,(s,obj)=>{
    obj(s.get('players')[1]).set('hp',0);
    obj(s.get('players')[1]).set('x',40);
    s.set('phaseShift',1);s.set('bullets',[]);
  });
  for(let t=0;t<2000&&sim.coop.state().phase===1;t++)sim.coop.step(0,0);
  const s=sim.coop.state();assert.equal(s.phase,2);assert.equal(s.seats[1].hp,2,'phase 2 revives a downed seat');assert.equal(s.bossMax,Math.round(286*1.8));
  pass('phase 1 -> 2 auto-revive at 2 hearts');

  // A dropped seat rescales to solo health at that tick.
  const before=sim.coop.state();sim.coop.dropSeat(1);const after=sim.coop.state();
  assert.equal(after.bossMax,286,'one connected seat: solo phase 2 health');
  assert.ok(after.bossHp<=after.bossMax&&after.bossHp>=1&&Math.abs(after.bossHp-Math.ceil(before.bossHp*286/before.bossMax))<=Math.floor(286/4)+1);
  assert.equal(after.seats[1].connected,false);
  pass('seat drop rescales to solo health, proportionally');
}

// 4b. A seat downed in mid-air falls and lands, so the partner can reach it.
{
  const sim=peer();sim.coop.start(2,['rivet','sproto763'],5);
  for(let t=0;t<60;t++)sim.coop.step(0,0);
  edit(sim,(st,obj)=>{const p=obj(st.get('players')[1]);p.set('hp',0);p.set('y',380);p.set('vy',0);p.set('grounded',false);st.set('bullets',[]);});
  for(let t=0;t<120;t++)sim.coop.step(0,0);
  const seat=sim.coop.state().seats[1];
  assert.equal(seat.hp,0);assert.equal(seat.y,604,'the downed seat landed on the floor');
  pass('a seat downed mid-air lands');
}

// 5. Duration parity of the 1.80x health: the same inputs (a solo golden's) drive one seat
//    (partner dropped at tick 0, so solo health) and two seats (1.80x) moving in parallel. Seats are unkillable
//    by a state edit, so the comparison measures damage output against health, not dodging.
{
  const unkillable=sim=>edit(sim,(st,obj)=>{for(const seat of st.get('players')){const p=obj(seat);if(p.get('connected')!==false){p.set('hp',100000);p.set('inv',100000);}}});
  function run(n,seats){
    const sim=peer(),g=golden(n),m=masksOf(sim,g);
    if(!sim.coop.start(g.log.rules.level,[g.log.loadout.pilot,g.log.loadout.pilot],g.log.seed))return null;
    if(seats===1)sim.coop.dropSeat(1);
    unkillable(sim);
    let t=0,mode='play';
    while(mode==='play'&&t<60000){mode=sim.coop.step(m[t%m.length],m[t%m.length]);t++;}
    return mode==='clear'||mode==='won'?sim.coop.state().tick:null;
  }
  for(const n of [1,2,3,4,5,6,7,8,9,10,13,14]){
    if(n===14&&!fs.existsSync(path.join(root,'qa/golden/story-14.json')))continue;
    const one=run(n,1),two=run(n,2);
    report.durations.push({level:n,oneSeat:one,twoSeats:two,ratio:one&&two?+(two/one).toFixed(3):null});
  }
  const ratios=report.durations.map(d=>d.ratio).filter(r=>r!==null);
  assert.equal(ratios.length,report.durations.length,'every level clears with unkillable seats');
  for(const d of report.durations)assert.ok(d.ratio>=0.80&&d.ratio<=1.10,'level '+d.level+' two-seat/one-seat clear time '+d.ratio);
  report.durationNote='Unkillable seats, identical inputs: two seats at 1.80x health against one seat at solo health. Downtime from revives and dodging is not modelled; human playtests decide final balance.';
  pass('two-seat clear time within 0.80-1.10x of one seat on '+ratios.length+' levels');
}
console.log(JSON.stringify({status:'passed',...report},null,1));
