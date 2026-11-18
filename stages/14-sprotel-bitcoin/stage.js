/* Sprotel Bitcoin Phase 1, in the existing Last Light Bar. */
(function(A){'use strict';
 const diskMuzzle={x:1079,y:440};
 const attacks=[
  {source:'sprotel.beer',sprite:'beer',w:42,h:54,y:462,vx:-5,vy:-3.5,gravity:.085,cue:'BEER TOSS · Watch the arc, then move underneath'},
  {source:'sprotel.cocktail',sprite:'cocktail',w:38,h:48,y:430,vx:-5.5,vy:-2.5,gravity:.065,cue:'DRINKS ROUND · Two glasses; leave room to dodge'},
  {source:'sprotel.marlin',sprite:'blueMarlin',w:100,h:38,y:545,vx:-6,vy:0,gravity:0,cue:'BLUE MARLIN · Jump the low fish, then stay below the high fish'},
  {source:'sprotel.disk-laser',sprite:'diskLaser',w:120,h:40,y:diskMuzzle.y,gravity:0,cue:'DISK LASER CHARGING · Leave the locked line before it fires'}
 ];
 A.registerStage({id:'14-sprotel-bitcoin',number:14,order:2.5,mechanics:2,densityBarrage:false,
  enabled:()=>typeof SPROTEL_READY!=='undefined'&&SPROTEL_READY,
  title:'Sprotel Bitcoin',operator:'Sprotel Bitcoin',operatorSprite:'sprotel',color:'#18d7e3',scenery:'art/level-02.jpg',sceneryFoot:.801,
  eligibleWeapons:['prism-rail','echo-decoy'],phases:[{
   name:'Last Call · Phase 1',machine:'Jukebox Bartender',mode:'fixed',camera:'fixed',
   spawn:{x:220,y:600},practiceSpawn:{x:220,y:600},pilot:{x:1080,y:330},hudLabel:'JUKEBOX CORE',
   objective:'Dodge the drinks, blue marlins and disk laser. Shoot the jukebox core between attacks.',
   attackIds:attacks.map(a=>a.source),
   enter(w){w.platform({id:'bar-floor',x:0,y:600,w:1280,h:70});w.target({id:'sprotel-core',label:'Jukebox core',x:1015,y:495,w:110,h:90,hp:38,open:false,onDefeat:z=>z.clear()});w.cue('LAST CALL · Drinks, blue marlins, then a laser from the disk.',240);},
   update(w){
    const local=w.phaseTick%180,index=Math.floor(w.phaseTick/180)%4,a=attacks[index],laser=index===3;
    if(local===(laser?10:60)){if(laser)w.data.laserAim={x:w.player.x,y:w.player.y-26};w.cue(a.cue,125);}
    if(laser?[100,108,116,124].includes(local):local===100||local===124){
     const aim=w.data.laserAim||{x:220,y:574},dx=aim.x-diskMuzzle.x,dy=aim.y-diskMuzzle.y,length=Math.hypot(dx,dy)||1;
     w.hazard({id:a.source+'-'+w.phaseTick,source:a.source,sprite:a.sprite,rule:'ordinary',
      x:laser?diskMuzzle.x-a.w/2:905,y:laser?diskMuzzle.y-a.h/2:index===2&&local===124?410:a.y,w:a.w,h:a.h,
      vx:laser?dx*6/length:a.vx,vy:laser?dy*6/length:a.vy,sprotelGravity:a.gravity,windup:0,active:240,recovery:0});
    }
    for(const h of w.hazards)if(h.sprotelGravity)h.vy+=h.sprotelGravity;
    const core=w.targets[0];core.open=w.phaseTick>=665&&local>=125;w.data.attack=index;w.progress=1-core.hp/core.maxHp;
    w.objective=local>=(laser?10:60)&&local<125?a.cue:core.open?'CORE OPEN · Shoot the jukebox core':'CORE ARMORED · Read the next attack';
   },
   draw(c,w){
    globalThis.ArcadeBossSheets?.drawMachine(c,w);const local=w.phaseTick%180;
    if(Math.floor(w.phaseTick/180)%4===3&&local>=10&&local<100&&w.data.laserAim){const aim=w.data.laserAim;c.save();c.strokeStyle='#79ffff';c.lineWidth=2;c.setLineDash([10,10]);c.beginPath();c.moveTo(diskMuzzle.x,diskMuzzle.y);c.lineTo(aim.x,aim.y);c.stroke();c.setLineDash([]);c.beginPath();c.arc(aim.x,aim.y,16,0,Math.PI*2);c.stroke();c.restore();}
   }
  }]
 });
})(Arcade);
