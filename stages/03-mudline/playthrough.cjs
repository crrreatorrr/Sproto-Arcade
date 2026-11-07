'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(process.argv[2]||'.');const ctx={};vm.createContext(ctx);
for(const file of ['density-attacks.js','phase-powerups.js','runtime/contract.js','runtime/weapons/weapons.js','runtime/core/world.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
vm.runInContext(fs.readFileSync(path.join(__dirname,'stage.js'),'utf8'),ctx);
const stage=ctx.Arcade.stages.get('03-mudline');
function run(route){
 const w=new ctx.Arcade.World(stage,{seed:23});const log={route,phase1:false,fronts:0,upper:0,lower:0,damage:0,beamHits:0,ballHits:0,ticks:0,phase2Ticks:0};let lockDodgeUntil=0;const bounced=new Set();
 for(let i=0;i<12000&&w.state!=='clear'&&w.state!=='lost';i++){
  const p=w.player,input={};
  if(w.state==='transition'){w.step({});continue;}
  let targetY=350;
  if(w.phaseIndex===0){
   const c=w.phaseTick%360;if(c>=90&&c<175)targetY=150;
  }else{
   log.phase1=true;log.phase2Ticks++;
   if(!w.data.gateUnlocked)targetY=route==='upper'?200:(p.x<680?380:550);
   if(w.phaseTick>=600&&w.phaseTick%360===91)lockDodgeUntil=w.phaseTick+110;
   if(w.phaseTick<lockDodgeUntil&&w.data.gateUnlocked)targetY=targetY<350?500:170;
  }
  if(p.y<targetY-8)input.down=true;if(p.y>targetY+8)input.up=true;
  const goalX=w.phaseIndex===1&&route==='lower'&&!w.data.gateUnlocked?700:220;if(p.x>goalX+15&&!p.dash)input.left=true;if(p.x<goalX-15&&!p.dash)input.right=true;
  const front=w.hazards.find(h=>h.rule==='dash'&&!h.resolved&&h.age>=h.windup&&h.x-p.x<210&&h.x>p.x-20);
  if(front&&!p.dashWait){input.dash=true;input.right=true;input.left=false;input.up=false;input.down=false;}
  if(w.phaseIndex===1&&!w.data.gateUnlocked){
   if(route==='upper'&&p.y<300)input.beam=true;
   if(route==='lower'&&p.y>540)input.bomb=true;
  }
  const ordinary=w.hazards.find(h=>h.rule==='ordinary'&&!h.resolved&&h.age>=h.windup&&Math.abs(h.x-p.x)<180&&Math.abs(h.y-(p.y-26))<100);
  if(ordinary&&!p.shieldWait)input.shield=true;
  for(const shot of w.shots)if(shot.id.startsWith('ball-')&&shot.bounces<3)bounced.add(shot.id);
  w.step(input);
  for(const e of w.events){if(e.type==='counter'&&e.rule==='dash')log.fronts++;if(e.type==='targetHit'&&e.source.startsWith('beam-'))log.beamHits++;if(e.type==='targetHit'&&e.source.startsWith('ball-')){log.ballHits++;if(bounced.has(e.source))log.bouncedBallHits=(log.bouncedBallHits||0)+1;}if(e.type==='targetDefeat'&&e.target.startsWith('latch'))log.upper++;if(e.type==='targetDefeat'&&e.target.startsWith('intake'))log.lower++;if(e.type==='hit')log.damage++;}
  log.ticks=w.tick;
 }
 assert.equal(w.state,'clear',JSON.stringify({log,state:w.state,phase:w.phaseIndex,hp:w.player.hp,data:w.data,targets:w.targets.map(t=>({id:t.id,hp:t.hp,open:t.open}))}));
 assert.equal(log.phase1,true);assert.ok(log.fronts>=2);assert.ok((route==='upper'?log.upper:log.lower)>=2,JSON.stringify(log));assert.ok(route==='upper'?log.beamHits>0:log.ballHits>0,'route must receive its C/V special damage '+JSON.stringify(log));if(route==='lower')assert.ok(log.bouncedBallHits>0,'ball must bounce before target damage');assert.equal(w.weapons.snapshot(),null,'base-kit run must not collect a power');
 return log;
}
const results=[run('upper'),run('lower')];assert.deepEqual([run('upper'),run('lower')],results,'same seed/input must reproduce');
const practice=new ctx.Arcade.World(stage,{seed:23,phase:1,practice:true});assert.equal(practice.phaseIndex,1);assert.equal(practice.weapons.snapshot(),null);practice.hazard({id:'stale',x:0,y:0,w:10,h:10});practice.lose('fixture');practice.step({retry:true});assert.equal(practice.state,'playing');assert.equal(practice.phaseTick,0);assert.ok(!practice.hazards.some(h=>h.id==='stale'));assert.equal(practice.player.hp,5);
console.log(JSON.stringify(results,null,2));
