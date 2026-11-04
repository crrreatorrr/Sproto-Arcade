/* Mudline prototype: fixed authored attacks, no production animation. */
(function(A){
  'use strict';
  const ID='03-mudline';
  function live(w,id){return w.targets.find(t=>t.id===id&&!t.removed&&t.hp>0);}
  function text(ctx,s,x,y,color='#fff0c9'){ctx.fillStyle=color;ctx.font='bold 18px system-ui';ctx.fillText(s,x,y);}
  function machine(ctx,w,pump){
    const d=w.data, t=w.phaseTick;
    ctx.save();ctx.fillStyle=pump?'#32495b':'#4b5140';ctx.strokeStyle='#c9d9a4';ctx.lineWidth=5;
    ctx.fillRect(905,180,245,350);ctx.strokeRect(905,180,245,350);
    // The glass belly and intake carry over into the docked pump.
    ctx.fillStyle='#122e34';ctx.fillRect(950,285,150,175);
    ctx.fillStyle='#78ab4d';const fill=pump?110:Math.min(170,(t%360)/70*170);ctx.fillRect(956,455-fill,138,fill);
    ctx.strokeStyle='#b5eee3';ctx.strokeRect(950,285,150,175);
    ctx.fillStyle='#b0beb1';ctx.fillRect(835,340,120,40);
    ctx.fillStyle='#172831';ctx.fillRect(1010,220,80,55);
    if(pump){
      ctx.strokeStyle='#aab7a5';ctx.lineWidth=24;ctx.beginPath();ctx.moveTo(1040,185);ctx.lineTo(1040,120);ctx.lineTo(1170,120);ctx.lineTo(1170,570);ctx.stroke();
      ctx.fillStyle=d.gateUnlocked?'#a7f5ba':'#774a45';ctx.fillRect(835,275,28,150);
      ctx.strokeStyle='#fff0c9';ctx.lineWidth=3;ctx.strokeRect(828,270,42,160);
      text(ctx,'UPPER LATCH',690,225);text(ctx,'LOW INTAKE',690,590);
      text(ctx,d.gateUnlocked?'SHUTTER RELEASED':'SHUTTER LOCKED',870,630);
    }else{
      const c=t%360;
      ctx.fillStyle=c>=70&&c<145?'#ffe294':'#75846d';ctx.fillRect(805,345,70,30);
      text(ctx,c<70?'GLASS FILLING':c<145?'NOZZLE LOCKED':c<300?'VENT OPEN':'RESEAL',925,575);
      if(c>=70&&c<145){ctx.strokeStyle='#ffe294';ctx.setLineDash([12,8]);ctx.beginPath();ctx.moveTo(60,d.aimY);ctx.lineTo(850,d.aimY);ctx.stroke();ctx.setLineDash([]);text(ctx,'LOCKED ALTITUDE — MOVE',220,d.aimY-32);}
    }
    ctx.restore();
  }
  function aimedBelch(w,source){
    const d=w.data, origin={x:835,y:360};
    let target={x:w.player.x,y:d.aimY};
    if(w.redirectVolley){const volley=w.redirectVolley({eligibleAim:true,rule:'ordinary',x:origin.x,y:origin.y,targetX:target.x,targetY:target.y});target={x:volley.targetX??target.x,y:volley.targetY??target.y};}
    // Committed altitude remains fixed after the lock; no homing after release.
    w.hazard({id:source,source:source.replace(/-\d+$/,''),rule:'ordinary',x:820,y:target.y-25,w:70,h:50,vx:-9,active:110,windup:0,cue:'SLUDGE BELCH'});
  }
  const phase1={
    drawsTargetLabels:true,name:'Sludge Belch',machine:'Sludge Dredger',mode:'flight',camera:'fixed',
    objective:'Reposition after the nozzle locks, then punish the glass vent.',hudLabel:'VENT INTEGRITY',
    spawn:{x:220,y:360},practiceSpawn:{x:220,y:360},pilot:{x:1050,y:270},
    enter(w){
      w.data.aimY=360;w.data.rewarded=false;w.data.damageStart=20;
      w.platform({id:'seabed',x:0,y:650,w:1280,h:50});
      w.target({id:'glass-vent',x:925,y:340,w:170,h:100,hp:20,maxHp:20,open:false,label:'GLASS VENT',onDefeat(){w.advancePhase();}});
      w.cue('FLY: arrows · nozzle locks before firing · fire into the open glass vent',240);
    },
    update(w){
      const c=w.phaseTick%360,d=w.data,vent=live(w,'glass-vent');
      if(c===70){d.aimY=w.player.y-26;w.cue('NOZZLE LOCKED: change altitude now',75);}
      if(c===145){aimedBelch(w,'sludge-belch-'+w.phaseTick);w.cue('STEAM ESCAPING: glass vent exposed',150);}
      if(vent){vent.open=c>=155&&c<300;w.progress=1-vent.hp/20;
        if(!d.rewarded&&vent.hp<20){d.rewarded=true;w.drop('mudline-first-vent',w.player.x+70,w.player.y);}}
      w.objective=c<70?'Read the filling glass belly':c<145?'Locked altitude: move above or below':c<300?'Shoot the open glass vent':'Vent sealed: prepare for the next fill';
    },
    draw(ctx,w){machine(ctx,w,false);}
  };
  function shutters(w){
    const d=w.data;d.round++;d.gateUnlocked=false;d.countered=false;d.unlockTick=-1;d.roundHit=false;d.openingHp=null;
    for(const t of w.targets)if(t.id.indexOf('latch-')===0||t.id.indexOf('intake-')===0)t.removed=true;
    const unlock=(world,target)=>{
      if(d.gateUnlocked)return;
      d.gateUnlocked=true;d.unlockTick=world.phaseTick;d.route=target.id.startsWith('latch')?'upper latch':'lower intake';
      for(const t of world.targets)if(t.id.startsWith('latch-')||t.id.startsWith('intake-'))t.removed=true;
      if(!d.introduced&&!d.roundHit){d.introduced=true;d.countered=true;world.cue('CLEAN SHUTTER CYCLE: pump vent exposed. Marked front comes next.',180);}
      else if(d.introduced){
        world.player.dashWait=0;
        world.cue('BROKEN CHEVRONS: flight dash through the pressure front (Shift)',180);
        world.hazard({id:'backflush-'+d.round,source:'backflush-front',rule:'dash',x:1190,y:70,w:28,h:570,vx:-10,windup:90,active:130,recovery:10,cue:'≫  SHIFT THROUGH  ≫'});
      }else{d.countered=false;world.cue('Pressure unstable: avoid damage and release one clean shutter cycle.',150);}
    };
    w.target({id:'latch-'+d.round,x:890,y:190,w:105,h:85,hp:4,maxHp:4,open:true,label:'UPPER LATCH · C BEAM',onDefeat:unlock});
    w.target({id:'intake-'+d.round,x:890,y:550,w:105,h:75,hp:4,maxHp:4,open:false,label:'LOW INTAKE · V BOUNCE',onDefeat:unlock});
    w.cue('SHUTTERS: fly high to beam the latch, or low to bounce into the intake',180);
  }
  const phase2={
    drawsTargetLabels:true,name:'Backflush',machine:'Floodgate Pump',mode:'flight',camera:'fixed',
    objective:'Release a shutter, dash the marked front, then hit the glass vent.',hudLabel:'PUMP INTEGRITY',
    spawn:{x:220,y:345},practiceSpawn:{x:220,y:345},pilot:{x:1050,y:270},
    enter(w){
      Object.assign(w.data,{round:0,introduced:false,gateUnlocked:false,aimY:350,rewarded:false});
      w.platform({id:'bounce-shelf',x:0,y:625,w:1210,h:30});
      w.target({id:'pump-vent',x:985,y:330,w:120,h:140,hp:24,maxHp:24,open:false,label:'GLASS PUMP VENT',onDefeat(){w.clear();}});
      shutters(w);
    },
    update(w){
      const d=w.data,core=live(w,'pump-vent');
      for(const e of w.events){if(e.type==='hit')d.roundHit=true;if(e.type==='counter'&&e.source==='backflush-front'){d.countered=true;d.unlockTick=w.phaseTick;w.cue('PRESSURE VENT OPEN: punish the glass belly',160);}}
      for(const t of w.targets){if(t.id.startsWith('latch-'))t.open=!d.gateUnlocked&&w.player.y<350;if(t.id.startsWith('intake-'))t.open=!d.gateUnlocked&&w.player.y>430;}
      if(core){
        if(d.gateUnlocked&&d.countered&&d.openingHp===null)d.openingHp=core.hp;
        core.open=d.gateUnlocked&&d.countered&&w.phaseTick-d.unlockTick<180&&(d.openingHp-core.hp<8);
        w.progress=1-core.hp/24;
      }
      if(d.gateUnlocked&&!d.introduced&&!d.countered&&w.phaseTick-d.unlockTick>=90)shutters(w);
      if(d.gateUnlocked&&((d.countered&&w.phaseTick-d.unlockTick>=200)||(!d.countered&&w.phaseTick-d.unlockTick>=280)))shutters(w);
      // First 600 ticks isolate the new shutter/front rule before the familiar belch returns.
      if(w.phaseTick>=600&&w.phaseTick%360===70){d.aimY=w.player.y-26;w.cue('NOZZLE LOCKED: reposition while working the shutter',75);}
      if(w.phaseTick>=600&&w.phaseTick%360===145)aimedBelch(w,'pump-sludge-belch-'+w.phaseTick);
      // Keep both high-C and low-V shutter setups, fronts and vent punish isolated.
      w.pressure?.({id:'mudline-silt',start:660,period:150,styles:['orb','diamond'],speed:2.4,windup:90,lane:'high',side:'far',maxAlive:2,enabled:d.introduced&&!d.gateUnlocked&&w.player.x<600&&w.player.y>=350&&w.player.y<=430});
      w.objective=!d.gateUnlocked?'Release UPPER LATCH (fly high/C) or LOW INTAKE (fly low/V)':!d.countered?(!d.introduced?'Pressure unstable — repeat the shutter without taking a hit':'Dash through the marked pressure front — shield cannot counter it'):core&&core.open?'Pump vent OPEN — standard fire deals damage':'Pressure rebuilding — next shutter cycle';
    },
    draw(ctx,w){machine(ctx,w,true);}
  };
  A.registerStage({id:ID,number:3,title:'Mudline Trenches',operator:'Crapto',operatorSprite:'crapto',color:'#9cc96d',eligibleWeapons:['prism-rail','echo-decoy'],phases:[phase1,phase2]});
})(Arcade);
