const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'../..');
const scope=vm.createContext({});
for(const file of ['sprite-hitboxes.js','density-attacks.js','phase-powerups.js','runtime/contract.js','runtime/core/world.js','stages/07-moonkeep/stage.js']){
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),scope);
}

const {Arcade,ArcadeDensityAttacks:density}=scope;
const stage=Arcade.stages.get('07-moonkeep');
function trialBreath(phase,low,dodge){
  const w=new Arcade.World(stage,{phase,practice:true,seed:37}),p=w.player;
  const release=phase?(low?82:28):(low?120:177);
  if(phase)Object.assign(w.data,{crossed:true,crossedAt:0});
  w.phaseTick=release-28;
  w.phasePowerups=null;
  w.autoFire=()=>{};
  Object.assign(p,{x:804,y:low?620:240});
  let hit=false;
  for(let i=0;i<116;i++){
    const steer=dodge&&i>=11;
    w.step({up:steer&&low&&p.y>430,down:steer&&!low&&p.y<410});
    hit||=w.events.some(e=>e.type==='hit'&&e.source==='07-moonkeep/dragon-breath');
  }
  return hit;
}

for(const phase of [0,1]){
  for(const low of [true,false]){
    const label='Trials phase '+(phase+1)+(low?' low':' high');
    assert.equal(trialBreath(phase,low,false),true,label+' catches a stationary pilot near the dragon');
    assert.equal(trialBreath(phase,low,true),false,label+' can be avoided by changing altitude');
  }
  for(const [arena,previousCount] of [
    [{left:0,top:51,right:1280,bottom:597},phase?61:48],
    [{left:20,top:188,right:1260,bottom:620},phase?53:39]
  ]){
    const player={x:804,y:390};
    const plan=density.plan({stage:7,phase,tick:density.START,arena,player,flight:true,enabled:true});
    const expectedSpeed=(phase?7.56:6.56)*1.12;
    const spacing=phase?56:60;
    assert.ok(plan.shots.every(s=>Math.abs(Math.abs(s.vx)-expectedSpeed)<1e-9));
    assert.ok(plan.shots.some(s=>s.delay===spacing),'each wave starts six ticks sooner');
    const first=plan.shots.filter(s=>s.delay===0);
    assert.ok(plan.shots.length>previousCount,'the barrage adds missiles across its waves');
    assert.ok(first.every(s=>{
      const box=density.damageRect(s);
      return box.y>=player.y+31||box.y+box.h<=player.y-31;
    }),'the first wall still has an opening at the starting altitude');
  }
}

(async()=>{
  const {loadSourceSim}=await import('../../tools/build-server-sim.mjs');
  const sim=loadSourceSim({dev:true}),dev=sim._dev,level=sim.levels.findIndex(l=>l.stage===7);
  const [LEFT,UP,DOWN]=[1,4,8];
  function storyVolley(phase,move,low,dodge){
    dev.reset(level,'rivet',0,37);
    const snap=dev.snapshot(),s=snap.s;
    const x=840,y=low?566:82;
    s.phasePowerupsState=null;
    Object.assign(s.player,{x,y,inv:0});
    Object.assign(s.boss,{phase,move,age:0,tell:45,aimX:x,aimY:y});
    dev.restore(snap);
    for(let i=0;i<105;i++){
      const p=dev.state().player;
      const climb=low&&p.y>270, dive=!low&&p.y<270;
      const steer=dodge&&i>=11;
      dev.step(steer?((i<31?LEFT:0)|(climb?UP:dive?DOWN:0)):0);
    }
    return dev.state().player.hp;
  }
  for(const phase of [1,2])for(const [move,low] of [['dragonBreath',true],['dragonWingShot',true],['dragonWingShot',false]]){
    const label='Story phase '+phase+' '+move+(low?' low':' high');
    assert.equal(storyVolley(phase,move,low,false),4,label+' hits a stationary pilot near the dragon');
    assert.equal(storyVolley(phase,move,low,true),5,label+' can be avoided by retreating and changing altitude');
  }
  console.log('PASS close high/low pressure, damage-free dodges, and faster/dense Moonkeep walls with an open lane');
})().catch(error=>{console.error(error);process.exitCode=1;});
