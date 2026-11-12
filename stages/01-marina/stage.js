/* Packet C: Tidebreak Marina prototype. Classic script, no external assets. */
(function (A) {
  'use strict';
  const FLOOR=600, CYCLE=420;
  const VENT={x:1040,y:490,w:110,h:110};
  function floor(w){w.platform({id:'marina-dock',x:0,y:FLOOR,w:1280,h:80});}
  function wake(w,cycle,delay=0){
    w.hazard({id:'marina-wake-'+w.phaseIndex+'-'+cycle,source:'marina.breakwater-slam.wake',rule:'ordinary',x:1020,y:568,w:76,h:32,vx:-9,vy:0,windup:delay,active:126,recovery:12,cue:w.phase?.naval?'BOW PISTON — STEER ABOVE THE LOW WAKE':'BOW PISTON — JUMP THE LOW WAKE'});
  }
  function label(ctx,text,x,y,color='#fff0c9') {ctx.fillStyle=color;ctx.font='bold 18px system-ui';ctx.fillText(text,x,y);}
  function machine(ctx,w,press){
    const t=w.phaseTick%CYCLE,vent=w.targets.find(x=>x.id==='marina-vent');
    if(press){
      ctx.strokeStyle='#648a9b';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(1185,340);ctx.lineTo(1185,230);ctx.lineTo(350,230);ctx.lineTo(350,490);ctx.stroke();
    }
    const generated=globalThis.ArcadeBossSheets?.drawMachine(ctx,w);
    if(!generated){
    ctx.fillStyle=press?'#324d60':'#375c66';ctx.fillRect(970,340,260,260);
    ctx.fillStyle='#102b39';ctx.fillRect(995,370,115,82);
    ctx.strokeStyle='#faad62';ctx.lineWidth=10;ctx.strokeRect(995,370,115,82);
    ctx.fillStyle='#dfb67e';ctx.fillRect(1150,460,28,t>=60&&t<120?80:120);
    ctx.fillStyle='#b6d4d1';ctx.fillRect(1130,press?324:528,76,20);
    ctx.fillStyle=vent&&vent.open?'#f4ffb3':'#172835';ctx.fillRect(1040,490,110,110);
    for(let n=0;n<4;n++){ctx.fillStyle='#628a8d';ctx.fillRect(1044,505+n*22,102,6);}
    }
    if(vent&&vent.open){
      const target=w.collisionBounds?.('targets',vent.id,vent)||vent;
      const x=target.x+12,y=target.y-12;
      ctx.strokeStyle='#edf9ff';ctx.lineWidth=4;for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(x+n*32,y);ctx.quadraticCurveTo(x-22+n*32,y-28,x+4+n*32,y-48);ctx.stroke();}
    }
    if(press){
      for(let n=0;n<3;n++){ctx.fillStyle=t>=30+n*22&&t<190?'#ffe785':'#456372';ctx.fillRect(540+n*190,216,52,28);label(ctx,String(n+1),554+n*190,236,'#192d37');}
      const valve=w.targets.find(x=>x.id==='marina-valve');
      ctx.strokeStyle=valve&&valve.open?'#a9ffce':'#7a8b96';ctx.lineWidth=7;ctx.beginPath();ctx.arc(872,548,30,0,Math.PI*2);ctx.moveTo(850,526);ctx.lineTo(894,570);ctx.moveTo(894,526);ctx.lineTo(850,570);ctx.stroke();
      label(ctx,'RELEASE VALVE',790,485,valve&&valve.open?'#a9ffce':'#9aa5ab');
      label(ctx,'≫  SHIFT THROUGH PRESSURE  ≫',270,310,'#ffdb92');
    }
    // The Trials HUD already names Dave's machine. Keep its enlarged sprite clear.
    if(!generated||w.stage.number!==1)label(ctx,w.stage.number===13?(press?'RED SIEGE CRUISER':'RED INTERCEPTOR'):(press?'DRY DOCK PRESS':'BREAKWATER TUG'),950,315);
    label(ctx,vent&&vent.open?'STEAM: VENT OPEN':'VENT ARMORED',985,635,vent&&vent.open?'#eaffad':'#afb3b7');
  }
  const phase1={
    name:'Breakwater Slam',machine:'Breakwater Tug',mode:'fixed',camera:'fixed',drawsTargetLabels:true,
    objective:'Jump the low wake; fire into the steaming vent.',hudLabel:'VENT INTEGRITY',
    spawn:{x:230,y:FLOOR},practiceSpawn:{x:230,y:FLOOR},pilot:{x:1048,y:440},attackIds:['marina.breakwater-slam.wake'],
    enter(w){
      floor(w);w.data.rewarded=false;w.progress=0;
      w.target({id:'marina-vent',...VENT,hp:18,maxHp:18,open:false,label:'Steam vent',onDefeat(world){world.cue('Tug docks: wheelhouse and piston connect to pressure pipes.',90);world.advancePhase();}});
      w.cue(w.phase?.naval?'Dave raises the piston. Steer above the wake, then shoot the steaming vent.':'Dave raises the piston. Jump the wake, then shoot the steaming vent.',180);
    },
    update(w){
      const t=w.phaseTick%CYCLE,cycle=Math.floor(w.phaseTick/CYCLE),vent=w.targets.find(x=>x.id==='marina-vent');
      if(t===60)w.cue(w.phase?.naval?'PISTON HANGS — LOW WAKE IN 60 TICKS: STEER UP':'PISTON HANGS — LOW WAKE IN 60 TICKS: JUMP',100);
      if(t===120)wake(w,cycle);
      if(vent){vent.open=t>=180&&t<390;w.progress=1-Math.max(0,vent.hp)/18;
        if(t===180)w.cue('STEAM OPENING — FIRE AT THE VENT',160);
        if(!w.data.rewarded&&vent.hp<18){w.data.rewarded=true;w.drop('marina-first-vent-punish',w.player.x+55,FLOOR-24);}
      }
      w.objective=vent&&vent.open?'Vent open: land your baseline shots.':w.phase?.naval?'Steer above the low wake. Steam reveals the vent after the slam.':'Jump the low wake. Steam reveals the vent after the slam.';
    },draw(ctx,w){machine(ctx,w,false);}
  };
  function makeValve(w,cycle){
    w.target({id:'marina-valve',x:838,y:500,w:68,h:100,hp:3,maxHp:3,open:false,label:'Release valve',onDefeat(world){
      world.data.ventUntil=world.phaseTick+210;world.data.valveBroken=true;
      world.cue('PRESSURE RELEASED — VENT OPEN FOR 3.5 SECONDS',180);
    }});w.data.valveCycle=cycle;
  }
  const phase2={
    name:'Pressure Lock',machine:'Dry Dock Press',mode:'fixed',camera:'fixed',drawsTargetLabels:true,
    objective:'Dash the marked pressure front, shoot the release valve, punish the vent.',hudLabel:'PRESSURE / VENT',
    spawn:{x:260,y:FLOOR},practiceSpawn:{x:260,y:FLOOR},pilot:{x:1048,y:440},attackIds:['marina.pressure-lock.front','marina.breakwater-slam.wake'],
    enter(w){
      floor(w);Object.assign(w.data,{unlocked:false,ventUntil:0,valveBroken:false,valveCycle:0});w.progress=0;
      w.target({id:'marina-vent',...VENT,hp:20,maxHp:20,open:false,label:'Pressure vent',onDefeat(world){world.clear();}});
      makeValve(w,0);w.cue('NEW TASK: dash through ≫ pressure, then shoot the valve to vent the press.',240);
    },
    update(w){
      const t=w.phaseTick%CYCLE,cycle=Math.floor(w.phaseTick/CYCLE);
      const vent=w.targets.find(x=>x.id==='marina-vent');
      if(t===30){
        w.data.unlocked=false;w.data.valveBroken=false;makeValve(w,cycle);
        w.cue('PIPES 1 → 2 → 3. PRESSURE FRONT: SHIFT ≫',120);
        w.hazard({id:'marina-pressure-'+cycle,source:'marina.pressure-lock.front',rule:'dash',x:1210,y:0,w:30,h:720,vx:-12,vy:0,windup:90,active:110,recovery:10,cue:'≫ DASH THROUGH THE FULL-HEIGHT FRONT ≫'});
      }
      for(const event of w.events){if(event.type==='counter'&&event.source==='marina.pressure-lock.front'){
        w.data.unlocked=true;w.cue('DASH COUNTER! SHOOT THE RELEASE VALVE',180);
      }}
      const valve=w.targets.find(x=>x.id==='marina-valve');
      if(valve)valve.open=w.data.unlocked&&!w.data.valveBroken;
      if(vent){vent.open=w.phaseTick<w.data.ventUntil;w.progress=1-Math.max(0,vent.hp)/20;}
      // Once the new rule has been introduced alone, reprise the compatible low wake.
      if(w.phaseTick>=600&&t===270)wake(w,cycle);
      // Protect the dash, valve shot and first second of the vent opening.
      w.slowMissile?.({id:'marina-slow-missile',start:180,period:480,speed:1.1,windup:90,enabled:t>=180&&!valve?.open&&(!vent?.open||w.data.ventUntil-w.phaseTick<=150)});
      w.pressure?.({id:'marina-dock-spray',start:660,period:60,styles:['seed','roller'],speed:2.5,windup:90,maxAlive:2,lane:'low',side:'far',enabled:t>=180&&!valve?.open&&(!vent?.open||w.data.ventUntil-w.phaseTick<=150)});
      w.objective=vent&&vent.open?'Pressure released: shoot the steaming vent.':w.data.unlocked?'Shoot the release valve (left of the vent).':'Read the three pipes; dash through the marked pressure front.';
    },draw(ctx,w){machine(ctx,w,true);}
  };
  const groundPhases=[phase1,phase2];
  const phases=groundPhases.map((phase,index)=>({...phase,mode:'flight',naval:true,
    spawn:{x:phase.spawn.x,y:510},practiceSpawn:{x:phase.spawn.x,y:510},
    flightBounds:{left:98,right:790,top:205,bottom:620},
    objective:index?phase.objective:'Steer above the low wake and fire into the steaming vent.'
  }));
  A.registerStage({id:'01-marina',number:1,title:'Tidebreak Marina',operator:'Fat Head Dave',operatorSprite:'bront',color:'#efad76',eligibleWeapons:['prism-rail','ricochet-mine'],phases,groundPhases});
})(Arcade);
