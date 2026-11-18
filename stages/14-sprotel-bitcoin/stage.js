/* Sprotel Bitcoin: two bar encounters, with separate readable attack and recovery windows. */
(function(A){'use strict';
 const REST_AT=125,PERIOD=180;
 const phaseOne=[
  {action:'beerThrow',source:'sprotel.beer',sprite:'beer',w:42,h:54,vx:-5,vy:-3.5,gravity:.085,cue:'BEER TOSS · Watch the arc, then move underneath'},
  {action:'cocktailThrow',source:'sprotel.cocktail',sprite:'cocktail',w:38,h:48,vx:-5.5,vy:-2.5,gravity:.065,cue:'DRINKS ROUND · Two glasses; leave room to dodge'},
  {action:'marlin',source:'sprotel.marlin',sprite:'blueMarlin',w:100,h:38,vx:-6,vy:0,gravity:0,cue:'BLUE MARLIN · Jump the low fish, then stay below the high fish'},
  {action:'diskLaser',source:'sprotel.disk-laser',sprite:'diskLaser',w:120,h:40,warning:10,cue:'DISK LASER CHARGING · Leave the locked line before it fires'}
 ];
 const phaseTwo=[
  {action:'beerStick',source:'sprotel.beer-stick',warning:10,cue:'BEER STICK · Jump, dash or leave the marked swing'},
  {action:'cocktailCannon',source:'sprotel.cocktail-cannon',sprite:'cocktail',w:38,h:48,cue:'COCKTAIL CANNON · Leave the locked line before it fires'},
  {action:'snacks',source:'sprotel.snacks',cue:'SNACK VOLLEY · Pretzels, nachos and popcorn fan out'},
  phaseOne[2],phaseOne[3],
  {action:'soundWave',source:'sprotel.sound-wave',sprite:'speakerMissile',w:96,h:56,warning:0,cue:'SOUND WAVE SPECIAL · Three speakers together'}
 ];
 const lerp=(a,b,t)=>a+(b-a)*t;
 function meleeBox(w){return sprotelBeerStickRect(w.phaseIndex,sprotelModernBox(w.phaseIndex,w.data.mechX??900));}
 function muzzle(w,a,shape,local=100){
  const active=w.phaseIndex?32:25,frame=8+Math.min(3,Math.floor(Math.max(0,local-100)/active*4));
  return sprotelProjectilePoint(w.phaseIndex,a.action,shape,frame,sprotelModernBox(w.phaseIndex,w.data.mechX??900));
 }
 function fire(w,a,local){
  if(a.action==='beerStick'){
   if(local===124){const r=meleeBox(w);w.hazard({id:a.source+'-'+w.phaseTick,source:a.source,rule:'ordinary',sprotelMelee:true,...r,windup:0,active:7,recovery:0});}
   return;
  }
  if(a.action==='soundWave'){
   if(local!==100)return;
   for(let lane=0;lane<3;lane++){
    const p=muzzle(w,a,'speakerMissile.'+lane,local),aim=w.data.lockedAim||{x:w.player.x,y:w.player.y-26};
    const vy=(aim.y+(1-lane)*80-p.y)*3.6/Math.max(240,p.x-aim.x);
    w.hazard({id:a.source+'-'+w.phaseTick+'-'+lane,source:a.source,sprite:a.sprite,rule:'ordinary',x:p.x-a.w/2,y:p.y-a.h/2,w:a.w,h:a.h,vx:-3.6,vy,active:360});
   }
   return;
  }
  if(a.action==='snacks'){
   if(![100,112,124].includes(local))return;
   const i=(local-100)/12,shape=['pretzel','nacho','popcorn'][i],p=muzzle(w,a,shape,local),sizes=[[54,40],[42,38],[40,40]];
   w.hazard({id:a.source+'-'+w.phaseTick,source:a.source+'.'+shape,sprite:shape,rule:'ordinary',x:p.x-sizes[i][0]/2,y:p.y-sizes[i][1]/2,w:sizes[i][0],h:sizes[i][1],vx:-5,vy:-1.8+i*1.8,sprotelGravity:.035,active:240});return;
  }
  if(a.action==='diskLaser'||a.action==='cocktailCannon'){
   const frames=a.action==='diskLaser'?[100,108,116,124]:[100,112,124];if(!frames.includes(local))return;
   const p=muzzle(w,a,a.sprite,local),aim=w.data.lockedAim||{x:220,y:574},dx=aim.x-p.x,dy=aim.y-p.y,length=Math.hypot(dx,dy)||1;
   w.hazard({id:a.source+'-'+w.phaseTick,source:a.source,sprite:a.sprite,rule:'ordinary',x:p.x-a.w/2,y:p.y-a.h/2,w:a.w,h:a.h,vx:dx*6/length,vy:dy*6/length,active:240});return;
  }
  if(![100,124].includes(local))return;
  const p=muzzle(w,a,a.sprite,local),vy=a.action==='marlin'?((local===100?545:410)+a.h/2-p.y)*6/Math.max(240,p.x-220):(a.vy||0);
  w.hazard({id:a.source+'-'+w.phaseTick,source:a.source,sprite:a.sprite,rule:'ordinary',x:p.x-a.w/2,y:p.y-a.h/2,
   w:a.w,h:a.h,vx:a.vx,vy,sprotelGravity:a.gravity||0,active:240});
 }
 function update(w,attacks){
  const local=w.phaseTick%PERIOD,index=Math.floor(w.phaseTick/PERIOD)%attacks.length,a=attacks[index],warning=a.warning??(w.phaseIndex?40:60);
  if(local===warning){
   w.data.lockedAim={x:w.player.x,y:w.player.y-26};
   if(a.action==='beerStick')w.data.swingLeft=A.clamp(w.player.x+130,560,820);
   w.cue(a.cue,PERIOD-warning);
  }
  if(a.action==='beerStick'){
   const target=w.data.swingLeft??900;
   if(local<100){const t=A.clamp((local-warning)/(100-warning),0,1),ease=t*t*(3-2*t);w.data.mechX=lerp(900,target,ease);}
   else if(local<132)w.data.mechX=target;
   else w.data.mechX=lerp(target,900,A.clamp((local-132)/48,0,1));
  }else w.data.mechX=900;
  fire(w,a,local);
  for(const h of w.hazards)if(h.sprotelGravity)h.vy+=h.sprotelGravity;
  const core=w.targets[0];core.x=w.data.mechX+115;const recovery=a.action==='beerStick'?132:REST_AT;
  // Each phase first demonstrates its full kit; subsequent openings follow every attack.
  core.open=w.phaseTick>=(attacks.length-1)*PERIOD+REST_AT&&local>=recovery;
  w.data.attack=index;
  w.data.action=local>=warning&&(w.phaseIndex||local<175)?a.action:'idle';w.data.actionAge=Math.max(0,local-warning);
  w.data.actionTell=100-warning;w.data.actionActive=w.phaseIndex?32:25;w.data.actionRest=w.phaseIndex?48:50;
  w.progress=1-core.hp/core.maxHp;
  w.objective=local>=warning&&local<recovery?a.cue:core.open?'CORE OPEN · Shoot the jukebox core':'CORE ARMORED · Read the next attack';
 }
 function draw(c,w,attacks){
  globalThis.ArcadeBossSheets?.drawMachine(c,w);
  const local=w.phaseTick%PERIOD,a=attacks[Math.floor(w.phaseTick/PERIOD)%attacks.length],warning=a.warning??(w.phaseIndex?40:60);
  if(a.action==='beerStick'&&local>=warning&&local<100){const r=meleeBox(w);c.save();c.fillStyle='#ffd24c28';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle='#ffdb73';c.lineWidth=3;c.setLineDash([10,8]);c.strokeRect(r.x,r.y,r.w,r.h);c.restore();}
  if(['diskLaser','cocktailCannon'].includes(a.action)&&local>=warning&&local<100&&w.data.lockedAim){
   const point=muzzle(w,a,a.sprite),aim=w.data.lockedAim;c.save();c.strokeStyle='#79ffff';c.lineWidth=2;c.setLineDash([10,10]);c.beginPath();c.moveTo(point.x,point.y);c.lineTo(aim.x,aim.y);c.stroke();c.setLineDash([]);c.beginPath();c.arc(aim.x,aim.y,16,0,Math.PI*2);c.stroke();c.restore();
  }
 }
 function phase(index){const attacks=index?phaseTwo:phaseOne;return{
  name:index?'Unlimited Happy Hour · Phase 2':'Last Call · Phase 1',machine:index?'Happy Hour Arsenal':'Jukebox Bartender',mode:'fixed',camera:'fixed',
  spawn:{x:220,y:600},practiceSpawn:{x:220,y:600},pilot:{x:1080,y:330},hudLabel:'JUKEBOX CORE',
  objective:index?'Read the beer-stick swing, snack cannons and three speaker missiles. Punish the recovery.':'Dodge the drinks, blue marlins and disk laser. Shoot between attacks.',
  attackIds:attacks.map(a=>a.source),
  enter(w){w.data.mechX=900;w.data.action='idle';w.platform({id:'bar-floor',x:0,y:600,w:1280,h:70});w.target({id:'sprotel-core',label:index?'Lower jukebox drive':'Jukebox core',x:1015,y:495,w:110,h:90,hp:index?42:38,open:false,onDefeat:z=>index?z.clear():z.advancePhase()});w.cue(index?'HAPPY HOUR ARSENAL · Beer stick, snack cannons and three speaker missiles.':'LAST CALL · Drinks, blue marlins, then a laser from the disk.',240);},
  update(w){update(w,attacks);},draw(c,w){draw(c,w,attacks);}
 };}
 A.registerStage({id:'14-sprotel-bitcoin',number:14,order:2.5,mechanics:2,densityBarrage:false,
  enabled:()=>typeof SPROTEL_READY!=='undefined'&&SPROTEL_READY,
  title:'Sprotel Bitcoin',operator:'Sprotel Bitcoin',operatorSprite:'sprotel',color:'#18d7e3',scenery:'art/level-02.jpg',sceneryFoot:.801,phaseTwoScenery:'art/phase-two/prism-vault.webp',phaseTwoSceneryFoot:.758,
  eligibleWeapons:['prism-rail','echo-decoy'],phases:[phase(0),phase(1)]
 });
})(Arcade);
