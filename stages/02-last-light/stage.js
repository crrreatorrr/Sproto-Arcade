/* Morelight: cover return, then aimed mirror reflection. */
(function(A){'use strict';
const C=420;function floor(w){w.platform({id:'light-floor',x:0,y:600,w:1280,h:70});}
function text(c,s,x,y,col='#fff1c8'){c.fillStyle=col;c.font='bold 18px system-ui';c.fillText(s,x,y);}
function draw(c,w,mirror){
 c.fillStyle='#342b51';c.fillRect(990,335,230,265);c.strokeStyle='#e7c693';c.lineWidth=8;c.strokeRect(1020,350,130,90);
 const iris=w.targets.find(t=>t.id==='light-iris');c.fillStyle=iris?.open?'#fff7be':'#4a4a65';c.beginPath();c.arc(1090,530,48,0,Math.PI*2);c.fill();
 if(mirror){c.strokeStyle='#9f98bd';c.lineWidth=14;c.beginPath();c.moveTo(740,280);c.lineTo(1250,280);c.moveTo(1080,280);c.lineTo(1080,340);c.stroke();c.strokeStyle='#c9f2ff';c.lineWidth=12;c.beginPath();c.moveTo(650,600);c.lineTo(695,500);c.stroke();text(c,'BAIT BEAM HERE →',345,485);text(c,'MIRROR / REAR HOUSING',740,320);}
 else{c.fillStyle='#805c70';c.fillRect(480,480,100,120);c.strokeStyle='#ffd69d';c.strokeRect(480,480,100,120);text(c,'COVER ←',300,468);}
 if(w.data.lockY){c.setLineDash([10,10]);c.strokeStyle='#ffe5ba';c.lineWidth=3;c.beginPath();c.moveTo(1060,w.data.lockY);c.lineTo(w.data.lockX,w.data.lockY);c.stroke();c.setLineDash([]);}
 if(w.data.reflectedUntil>w.phaseTick){c.strokeStyle='#fff5b7';c.lineWidth=7;c.beginPath();c.moveTo(mirror?675:530,w.data.lockY);c.lineTo(1090,530);c.stroke();}text(c,iris?.open?'IRIS OPEN':'IRIS ARMORED',985,630);text(c,mirror?'MIRROR GANTRY':'PRISM PROJECTOR',970,305);
}
function core(w,hp,next){w.target({id:'light-iris',x:1040,y:490,w:100,h:110,hp,maxHp:hp,open:false,label:'Iris housing',onDefeat(z){next?z.advancePhase():z.clear();}});}
function attack(w,reflect){const t=w.phaseTick%C,cycle=Math.floor(w.phaseTick/C);
 if(t===60){const aim=w.redirectVolley({id:'light-aim-'+w.phaseIndex+'-'+cycle,eligibleAim:true,rule:'ordinary',targetX:w.player.x,targetY:w.player.y-26});w.data.lockX=aim.targetX;w.data.lockY=aim.targetY;w.cue(reflect?'LENS LOCKED: hold a beam line through the mirror, then move.':'LENS LOCKED: hide left of the booth.',100);}
 if(t===120){const y=w.data.lockY??574,behind=(w.data.lockX??850)<(reflect?650:480),aligned=y>=(reflect?500:480)&&y<=600;
  const returned=behind&&aligned;w.data.returned=returned;
  // A booth/mirror blocks the locked lane geometrically. Exposed players still receive the beam.
  const edge=aligned?(reflect?700:580):0;
  w.hazard({id:'light-beam-'+w.phaseIndex+'-'+cycle,source:reflect?'light.house-of-mirrors.beam':'light.iris-shot.beam',rule:'ordinary',x:edge,y:y-8,w:1060-edge,h:16,windup:0,active:2,recovery:20,cue:returned?'LIGHT RETURN — HOUSING EXPOSED':'BEAM RELEASE'});
  w.data.openUntil=returned?w.phaseTick+210:0;
  if(returned){w.data.returns++;w.data.reflectedUntil=w.phaseTick+24;w.events.push({type:reflect?'reflection':'coverReturn',source:reflect?'light.house-of-mirrors.mirror':'light.iris-shot.booth',x:reflect?675:530,y,cycle});w.cue(reflect?'MIRROR RETURN: shoot the exposed rear housing.':'COVER RETURN: shoot the opened iris.',180);if(w.data.returns===1)w.drop('light-first-return',w.player.x+55,574);}
 }
 const iris=w.targets.find(t=>t.id==='light-iris');if(iris){iris.open=w.phaseTick<w.data.openUntil;w.progress=1-iris.hp/iris.maxHp;}
 if(reflect&&w.phaseTick>=600&&t===340)w.hazard({id:'light-reprise-'+cycle,source:'light.iris-shot.reprise',rule:'ordinary',x:1180,y:568,w:40,h:32,vx:-7,windup:75,active:180,recovery:0,cue:'LOW PROJECTOR SHOT — JUMP OR SHIELD'});
 // Keep mirror bait, committed beam and first second of the return free of background shots.
 if(reflect)w.slowMissile?.({id:'light-slow-missile',start:180,period:480,speed:1.1,windup:90,enabled:t>=180});
 if(reflect)w.pressure?.({id:'light-prism-motes',start:660,period:60,styles:['orb','diamond'],speed:2.25,windup:90,maxAlive:2,lane:'low',side:'far',enabled:t>=180});
 w.objective=iris?.open?'Housing exposed: land baseline shots.':reflect?'Bait the locked beam from left of the low mirror.':'Move left of the booth before the iris locks its lane.';
}
A.registerStage({id:'02-last-light',number:2,title:'Last Light Bar',operator:'Morelight',operatorSprite:'vela',color:'#bba6ed',eligibleWeapons:['prism-rail','echo-decoy'],phases:[
{name:'Iris Shot',machine:'Prism Projector',mode:'fixed',camera:'fixed',spawn:{x:760,y:600},practiceSpawn:{x:760,y:600},pilot:{x:1080,y:430},hudLabel:'IRIS / COVER RETURN',objective:'Use the booth to return the locked beam; shoot the opened iris.',attackIds:['light.iris-shot.beam'],enter(w){floor(w);Object.assign(w.data,{returns:0,openUntil:0,lockX:760,lockY:574});core(w,22,true);w.cue('MOVE LEFT: the booth blocks Morelight’s locked beam.',200);},update(w){attack(w,false);},draw(c,w){draw(c,w,false);}},
{name:'House of Mirrors',machine:'Mirror Gantry',mode:'fixed',camera:'fixed',spawn:{x:850,y:600},practiceSpawn:{x:850,y:600},pilot:{x:1080,y:430},hudLabel:'REFLECT / REAR HOUSING',objective:'Stand behind the low mirror to bait a return into the rear housing.',attackIds:['light.house-of-mirrors.beam','light.iris-shot.reprise'],enter(w){floor(w);Object.assign(w.data,{returns:0,openUntil:0,lockX:850,lockY:574});core(w,26,false);w.cue('NEW TASK: booths fold away. Bait a low beam through the angled mirror.',240);},update(w){attack(w,true);},draw(c,w){draw(c,w,true);}}
]});})(Arcade);
