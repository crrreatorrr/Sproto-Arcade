/* Online co-op client (coop-net.js) against the mock relay (qa/coop-mock-relay.cjs), with two
 * simulation peers from the committed server bundle.
 *   node qa/coop-net.test.cjs [repo]
 * Checks the protocol v1 flow end to end: room code create/join, server seed, READY/GO, lockstep
 * with 4-tick input delay under relay latency, hash agreement, desync recovery by snapshot, the
 * reconnect grace and SEAT_DROP rescale, server-only settlement (AFK and agreement rules), and
 * that the client never grants a reward itself. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const Net=require(path.join(root,'coop-net.js'));
const {createRelay}=require(path.join(root,'qa/coop-mock-relay.cjs'));
const bundle=fs.readFileSync(path.join(root,'dist/arcade-sim.server.js'),'utf8');
const peer=()=>{const c=vm.createContext({structuredClone});vm.runInContext(bundle,c);return c.ArcadeSim;};
const golden=JSON.parse(fs.readFileSync(path.join(root,'qa/golden/story-01.json'),'utf8'));
const report={kind:'coop-net',checks:[]};const pass=n=>report.checks.push(n);
const noTimers={setInterval:()=>null,clearInterval:()=>{}};
const frameOfMask=mask=>({mask});

function client(relay,name,inputs,level=1){
  const sim=peer(),transport=relay.transport(name);
  let tick=0,mode='idle',clearTick=null;
  const self={sim,name,outcome:null,events:[],get tick(){return tick;},get mode(){return mode;}};
  const hooks={
    level:()=>level,pilot:()=>'rivet',maskOf:f=>f.mask,frameOf:frameOfMask,
    start:({levelIndex,pilots,seed,seat})=>{self.seat=seat;self.seed=seed;assert.equal(levelIndex,level-1);return Promise.resolve({go(){assert.equal(sim.coop.start(level,pilots,seed),true);mode='play';tick=0;}});},
    tick:()=>tick,snapshot:()=>sim.coop.snapshot(),restore:s=>{sim.coop.restore(s);tick=sim.coop.state().tick;},
    outcome:o=>{self.outcome=o;},
  };
  const session=Net.createSession({transport,hooks,now:()=>relay.clock,timers:noTimers});
  session.onChange(s=>{if(s.lastEvent)self.events.push(s.lastEvent.type);});
  self.session=session;
  // One fixed step of the story loop (game.js storyFrame, online branch).
  self.frame=()=>{
    if(mode!=='play')return;
    session.sample(tick+1,{mask:inputs(tick+1,self)});
    if(!session.ready(tick+1))return;
    const frames=session.take(tick+1);
    if(frames.dropSeat!==undefined)sim.coop.dropSeat(frames.dropSeat);
    mode=sim.coop.step(frames[0].mask,frames[1].mask);tick=sim.coop.state().tick;
    session.afterTick(tick,()=>sim.coop.hash(),mode);
  };
  return self;
}
const masks=peer().decodeInputs(golden.log.inputs,golden.log.ticks).masks;
const DOWN=peer().maskOf({down:true});
const goldenInput=(t,c)=>masks[(t+(c.seat?17:0))%masks.length];
async function run(relay,clients,steps,{every}={}){
  for(let i=0;i<steps;i++){relay.step();for(const c of clients)c.frame();if(every)every(i);await null;}
}
async function setup(opts={},inputs=goldenInput){
  const relay=createRelay({latency:3,...opts});
  const a=client(relay,'alice',inputs),b=client(relay,'bob',inputs);
  await a.session.create();
  const code=a.session.state.code;assert.match(code,/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/);
  await b.session.join(code);
  await run(relay,[a,b],20);
  assert.equal(a.mode,'play');assert.equal(b.mode,'play');assert.equal(a.seed,b.seed,'both seats start from the server seed');
  return {relay,a,b,code};
}

(async()=>{
  // Codes and the join errors.
  {
    const relay=createRelay();const c=client(relay,'carol',()=>0);
    await assert.rejects(c.session.join('ab'),/5 characters/);
    await assert.rejects(c.session.join('ZZZZZ'),/No room/);
    assert.equal(Net.cleanCode(' ab-c1d2e9 '),'ABCD2','codes keep only the 31-character alphabet (no 1 or I/L/O/0)');
    pass('room code validation and not_found');
  }
  // Lockstep through the relay with latency: same hashes, no desync, input delay honoured.
  const {relay,a,b}=await setup();
  await run(relay,[a,b],3000);
  assert.ok(a.tick>1500,'peers advance under 3-step latency each way (6 steps peer to peer, more than the 4-tick delay): '+a.tick);
  assert.ok(Math.abs(a.tick-b.tick)<=Net.INPUT_DELAY+relay.clock,'peers stay within the input delay of each other');
  const m=[...relay.matches.values()][0];
  assert.equal(m.desyncs,0,'no desync in a clean run');assert.ok(m.agreedThrough>=1440,'server agreed hashes through tick '+m.agreedThrough);
  pass('lockstep under relay latency: hashes agreed through tick '+m.agreedThrough);
  report.lockstepTicks=Math.min(a.tick,b.tick);

  // A third peer that joins a full room gets `full`.
  {const c=client(relay,'dave',()=>0);await assert.rejects(c.session.join(m.code),/full/);pass('a third player gets full');}

  // Desync recovery: bob's state is corrupted; the next hash check desyncs, seat 0 snapshots.
  {
    const snap=JSON.parse(b.sim.coop.snapshot());const row=snap.$o.find(([k])=>k==='camera');row[1]+=7;b.sim.coop.restore(JSON.stringify(snap));
    const before=m.desyncs;
    await run(relay,[a,b],600);
    assert.equal(m.desyncs,before+1,'exactly one desync is reported');
    assert.ok(b.events.includes('restored'),'seat 1 restored seat 0 snapshot');
    const agreed=m.agreedThrough;await run(relay,[a,b],300);
    assert.ok(m.agreedThrough>agreed,'hashes agree again after the snapshot');
    pass('desync -> snapshot -> lockstep again');
  }

  // Reconnect grace, then SEAT_DROP: alice continues alone with solo boss health.
  {
    const max=a.sim.coop.state().bossMax;
    b.session.close();
    await run(relay,[a],200);
    assert.equal(a.session.state.peer?.present,false,'alice sees her partner away');
    const stalled=a.tick;await run(relay,[a],100);assert.ok(a.tick-stalled<=Net.INPUT_DELAY+4,'the run waits during the grace');
    await run(relay,[a],relay.clock<0?0:1200);
    assert.ok(a.events.includes('seat-drop'));
    const s=a.sim.coop.state();
    assert.equal(s.seats[1].connected,false);
    assert.ok(s.bossMax<max,'boss health rescaled to one seat: '+max+' -> '+s.bossMax);
    assert.ok(a.tick>stalled+200,'alice plays on after the drop');
    pass('grace then SEAT_DROP at an agreed tick, solo health from then on');
  }

  // Settlement: both clear -> rewards from the server only; an AFK seat earns nothing.
  {
    const ledger=[];
    const {relay:r2,a:p,b:q}=await setup({ledger},(t,c)=>c.name==='bob'?0:(goldenInput(t,c)||DOWN));
    await run(r2,[p,q],1200);
    for(const c of [p,q])c.session.sendResult({status:'clear',level:1,tick:c.tick,god:false});
    await run(r2,[p,q],10);
    assert.equal(p.outcome.status,'clear');assert.deepEqual(p.outcome.rewards,{tickets:20,relics:['breakwater_coin']});
    assert.equal(q.outcome.status!=='clear'||q.outcome.rewards.tickets===0,true);assert.equal(q.outcome.reason,'afk','an idle seat fails the AFK check');
    assert.deepEqual(ledger.map(row=>[row.account,row.type]),[['alice','tickets'],['alice','relic']],'only the server ledger grants, once per account');
    pass('server settles once: active seat paid, AFK seat not');
  }
  // God mode or disagreement pays nobody.
  {
    const ledger=[];const {relay:r3,a:p,b:q}=await setup({ledger});
    await run(r3,[p,q],300);
    p.session.sendResult({status:'clear',level:1,tick:p.tick,god:true});q.session.sendResult({status:'clear',level:1,tick:q.tick,god:false});
    await run(r3,[p,q],10);
    assert.equal(ledger.length,0);assert.equal(p.outcome.rewards.tickets,0);
    pass('god mode in either seat pays no one');
  }
  // The page never grants co-op rewards itself.
  {
    const game=fs.readFileSync(path.join(root,'game.js'),'utf8'),start=game.indexOf('function clearCoopLevel()'),body=game.slice(start,game.indexOf('\n}\n',start));
    assert.ok(body.length>100);
    assert.ok(!/reportHubClear|earnTickets|reportEvent/.test(body),'clearCoopLevel never reports a reward');
    assert.ok(!/earnTickets|reportEvent|reportHubClear/.test(fs.readFileSync(path.join(root,'coop-net.js'),'utf8')),'coop-net.js has no reward call');
    pass('client never self-grants co-op rewards');
  }
  console.log(JSON.stringify({status:'passed',...report},null,1));
})().catch(e=>{console.error(e);process.exitCode=1;});
