/* Moonkeep: a jet duel against two vertically patrolling dragons. */
(function(A){'use strict';
const ID='07-moonkeep';
const flightBounds={left:80,right:820,top:240,bottom:620};
function bob(w){return Math.sin(w.phaseTick*(w.phaseIndex?.024:.021))*(w.phaseIndex?85:72);}
function moveDragon(w){const y=bob(w);w.data.dragonY=y;for(const target of w.targets)target.y=330+y;}
function pilot(w){return{x:1092,y:278+bob(w)};}
function dragon(ctx,w){
 if(globalThis.ArcadeBossSheets?.drawMachine(ctx,w))return;
 ctx.save();ctx.translate(0,bob(w));
 ctx.strokeStyle='#b9d8e2';ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(1200,460);ctx.lineTo(1090,300);ctx.lineTo(930,360);ctx.stroke();
 ctx.fillStyle='#8594ab';ctx.fillRect(1000,250,180,95);ctx.fillStyle='#355260';ctx.fillRect(1055,220,75,65);
 ctx.fillStyle='#fff0c0';ctx.font='bold 17px system-ui';ctx.fillText('BIG SWOLE',1040,210);
 ctx.restore();
}
function bite(w,cycle){const p=w.player;w.hazard({id:'iron-fang-'+cycle,source:ID+'/iron-fang',rule:'ordinary',x:p.x-55,y:p.y-75,w:110,h:75,windup:60,active:18,recovery:30,cue:'IRON FANG · Jaw locks — change altitude, then punish the joint'});w.cue('JAW LOCKED · Fly off the marked position, then shoot the withdrawing joint',120);}
function airFront(w,cycle){w.hazard({id:'air-front-'+cycle,source:'moonkeep-air-front',rule:'dash',x:1180,y:225,w:28,h:420,vx:-6,windup:90,active:210,recovery:20,cue:'» SKY CURRENT · Fly toward the chevrons and dash through'});}
function breath(w,clock,first,second){
 const next=clock<=first?first:second;
 const until=next-clock;
 const low=(clock<=first)===(w.phaseIndex===0);
 w.data.dragonTell=until>0&&until<=27?until:0;
 if(until===27)w.data.breathAimX=w.player.x;
 if(until===22)w.cue(low?'LOW BREATH · CLIMB':w.phaseIndex?'HIGH BREATH · DIVE · JOINT OPEN':'HIGH BREATH · DIVE',48);
 if(clock!==first&&clock!==second)return;
 const phase=w.phaseIndex;
 // Mouth center in the registered flight box, plus the current patrol offset.
 const x=phase?985:969,y=(phase?384:302)+w.data.dragonY;
 const aimX=w.data.breathAimX??w.player.x;
 // The high pass is shorter so it clears before the next bite windup.
 const dx=(low?aimX:Math.max(340,aimX))-x,dy=(low?flightBounds.bottom-24:flightBounds.top-24)-y;
 const distance=Math.hypot(dx,dy),speed=5.8;
 const active=Math.ceil(distance/speed)+5;
 w.hazard({id:'dragon-breath-'+w.phaseTick,source:ID+'/dragon-breath',rule:'ordinary',sprite:'orb',
  x:x-21,y:y-13,w:42,h:26,vx:dx*speed/distance,vy:dy*speed/distance,active});
}
A.registerStage({id:ID,number:7,title:'Moonkeep Castle',operator:'Big Swole',operatorSprite:'bigswole',color:'#b9d8e2',eligibleWeapons:['prism-rail','echo-decoy'],phases:[{
 name:'Iron Fang flight',machine:'Siege Dragon',mode:'flight',camera:'fixed',flightBounds,pilot,pilotHeight:48,hudLabel:'NECK JOINT',objective:'Fly the jet, evade the locked bite, then punish the neck joint',spawn:{x:180,y:390},practiceSpawn:{x:180,y:390},
 enter(w){w.target({id:'neck-joint',x:1050,y:330,w:110,h:100,hp:12,open:false,onDefeat:()=>w.advancePhase()});w.data.reward=false;w.data.dragonY=0;w.cue('JET FLIGHT · Arrows/WASD move in every direction · evade the locked bite',180);},
 update(w){moveDragon(w);const cycle=w.phaseTick%240;if(cycle===60)bite(w,Math.floor(w.phaseTick/240));breath(w,cycle,120,177);const core=w.targets[0];core.open=cycle>=138&&cycle<235;core.label=core.open?'Neck joint · OPEN':'Neck joint · bait Iron Fang';w.progress=1-core.hp/core.maxHp;w.objective=core.open?'Neck withdrawn · fire into the moving joint':'Fly freely · change altitude after the jaw locks';if(!w.data.reward&&w.events.some(e=>e.type==='targetHit'&&e.target==='neck-joint')){w.data.reward=true;w.drop('moonkeep-first-joint',w.player.x,w.player.y-20);}},
 draw(ctx,w){dragon(ctx,w);}
},{
 name:'Rampart flight',machine:'Rampart Dragon',mode:'flight',camera:'fixed',flightBounds,pilot,pilotHeight:48,hudLabel:'SKY CURRENT',objective:'Dash the marked sky current, then attack the flying dragon',spawn:{x:240,y:390},practiceSpawn:{x:240,y:390},
 enter(w){w.data.crossed=false;w.data.crossedAt=-1;w.data.dragonY=0;w.target({id:'rampart-joint',x:1110,y:330,w:100,h:100,hp:10,open:false,onDefeat:()=>w.clear()});w.cue('NEW TASK · Keep flying; dash through the full-height broken-chevron current',210);},
 update(w){
  moveDragon(w);const t=w.phaseTick;
  if(!w.data.crossed&&t%360===120)airFront(w,Math.floor(t/360));
  if(!w.data.crossed&&w.events.some(e=>e.type==='counter'&&e.source==='moonkeep-air-front')){w.data.crossed=true;w.data.crossedAt=t;w.drop('moonkeep-upper-crossing',w.player.x,w.player.y-20);w.cue('SKY CURRENT BROKEN · Shoot the moving neck joint',150);}
  if(w.data.crossed)breath(w,(t-w.data.crossedAt)%252,28,82);
  if(t>=660&&t%300===60)bite(w,'rampart-'+Math.floor(t/300));
  w.slowMissile?.({id:'moonkeep-slow-missile',start:180,period:480,speed:1.1,windup:90,enabled:w.data.crossed&&t-w.data.crossedAt>=60});
  w.pressure?.({id:'moonkeep-rampart',start:660,period:150,styles:['seed','orb'],speed:2.3,windup:90,lane:'high',side:'far',maxAlive:2,enabled:w.data.crossed&&t-w.data.crossedAt>=180});
  const target=w.targets[0];target.open=w.data.crossed;target.label=w.data.crossed?'Neck joint · OPEN':'Neck joint · dash sky current first';w.progress=w.data.crossed?.5+.5*(1-target.hp/target.maxHp):0;w.objective=w.data.crossed?'Current broken · fire at the dragon while changing altitude':'» Fly toward the marked current and dash through';
 },
 draw(ctx,w){dragon(ctx,w);}
}]});})(Arcade);
