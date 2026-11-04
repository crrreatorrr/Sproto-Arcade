/* Verse prototype. Authored route before the fixed orbital showroom. */
(function(A){
 'use strict';
 const fronts=[1050,2250,3450],end=4500;
 function label(ctx,text,x,y){ctx.fillStyle='#fff0c9';ctx.font='bold 18px system-ui';ctx.fillText(text,x,y);}
 function launchFront(w){const d=w.data,x=fronts[d.crossings];d.frontAttempt++;d.frontId='rift-'+d.crossings+'-'+d.frontAttempt;w.player.dashWait=0;
  w.hazard({id:d.frontId,source:'demo-rift-'+d.crossings,rule:'dash',x,y:0,w:30,h:720,windup:90,active:1800,recovery:0,cue:'≫ RIFT FRONT · SHIFT THROUGH ≫'});
  d.frontLive=true;w.cue('RIFT FRONT: ready your directional dash (Shift). Shield cannot cross.',180);
 }
 const p1={name:'Live Demo',machine:'Sales Carrier',mode:'flight',camera:'horizontal',hudLabel:'ROUTE / RIFTS',objective:'Fly through debris lanes and dash three demonstration rifts; reach the carrier.',spawn:{x:180,y:350},practiceSpawn:{x:180,y:350},pilot:{x:4700,y:300},
  enter(w){Object.assign(w.data,{crossings:0,frontLive:false,frontAttempt:0,rearm:0,rewarded:false});w.cue('FORWARD FLIGHT: choose a debris lane. Broken chevrons require Shift dash.',240);
   for(const [i,x]of [650,1550,2750,3950].entries()){const high=i%2===0;w.hazard({id:'debris-'+i,source:'carrier-debris-'+(high?'high':'low'),rule:'ordinary',x,y:high?90:435,w:230,h:175,active:20000,cue:'DEBRIS: choose the open lane'});}
  },
  update(w){const d=w.data,p=w.player;p.x+=2.5;p.y=A.clamp(p.y,65,665);
   for(const e of w.events){if(e.type==='counter'&&e.source==='demo-rift-'+d.crossings){d.crossings++;d.frontLive=false;d.rearm=0;w.cue('RIFT CLEARED — choose the next debris lane',150);if(!d.rewarded){d.rewarded=true;w.drop('verse-first-rift',p.x+100,Math.max(90,p.y-140));}}
    else if(e.type==='hit'&&e.source==='demo-rift-'+d.crossings){d.frontLive=false;d.rearm=90;w.cue('Rift held you back. Read the chevrons, then DASH through.',150);}}
   if(d.rearm>0)d.rearm--;
   if(d.crossings<3){const x=fronts[d.crossings];if(!d.frontLive&&!d.rearm&&p.x>=x-650)launchFront(w);if(!p.dash)p.x=Math.min(p.x,x-48);}
   if(w.phaseTick>600&&w.phaseTick%300===120){
    let volley={eligibleAim:true,rule:'ordinary',x:p.x+750,y:160,targetX:p.x,targetY:p.y-26};if(w.redirectVolley)volley=w.redirectVolley(volley);
    const dx=volley.targetX-volley.x,dy=volley.targetY-volley.y,len=Math.hypot(dx,dy)||1;
    w.hazard({id:'demo-bolt-'+w.phaseTick,source:'demo-drone-volley',rule:'ordinary',x:volley.x,y:volley.y,w:24,h:24,vx:dx/len*8,vy:dy/len*8,windup:50,active:180,cue:'DRONE UNFOLDING: move after its aim locks'});
   }
   w.progress=Math.min(1,p.x/end);w.objective=d.crossings<3?'RIFT '+(d.crossings+1)+'/3 — choose lane, then dash the marked front':'ALL RIFTS CLEARED — reach the carrier at 4500m';
   if(d.crossings===3&&p.x>=end)w.advancePhase();
  },
  draw(ctx,w){
   ctx.strokeStyle='#8f6fa8';ctx.lineWidth=3;for(let x=0;x<=end;x+=300){ctx.beginPath();ctx.moveTo(x,70);ctx.lineTo(x,650);ctx.stroke();label(ctx,String(x)+'m',x,680);}
   for(let i=0;i<fronts.length;i++){const x=fronts[i];ctx.fillStyle=i<w.data.crossings?'#68b992':'#e5b6ff';ctx.font='bold 40px system-ui';ctx.fillText('≫',x-100,340);ctx.fillText('≫',x+80,340);label(ctx,'RIFT '+(i+1),x-45,230);}
   ctx.fillStyle='#433052';ctx.fillRect(4520,200,330,320);ctx.strokeStyle='#c7a1e3';ctx.strokeRect(4520,200,330,320);ctx.fillStyle='#161a2c';ctx.fillRect(4650,230,100,80);label(ctx,'SALES CARRIER',4540,560);label(ctx,'EXIT TO SHOWROOM',4250,120);
  }
 };
 function orbit(w){const c=w.phaseTick%480,side=Math.floor(c/120),angle=[Math.PI,Math.PI*1.5,0,Math.PI*.5][side];return{c,side,angle,x:640+Math.cos(angle)*250,y:350+Math.sin(angle)*210};}
 const p2={drawsTargetLabels:true,name:'Limited-Time Offer',machine:'Orbital Showroom',mode:'orbit',camera:'fixed',hudLabel:'CABIN CORE',objective:'Read the hinged module, match its exposed side, then fire; use the brief center lane.',spawn:{x:220,y:350},practiceSpawn:{x:220,y:350},pilot:{x:640,y:310},
  enter(w){Object.assign(w.data,{lastSide:-1,centerWindow:false});
   w.target({id:'showroom-core',x:350,y:310,w:80,h:80,hp:54,maxHp:54,open:false,label:'HINGED MODULE',onDefeat(){w.clear();}});
   w.cue('ORBITAL DUEL: module hinges in order LEFT → TOP → RIGHT → BOTTOM. Match its side.',240);
  },
  update(w){const d=w.data,p=w.player,o=orbit(w),t=w.targets.find(t=>t.id==='showroom-core');
   // Geometry remains fixed; the four module positions cycle with clear preparation.
   if(d.lastSide!==o.side){d.lastSide=o.side;w.cue('MODULE '+['LEFT','TOP','RIGHT','BOTTOM'][o.side]+' opening — move to the same side',90);}
   d.centerWindow=o.c>=420&&o.c<465;
   if(t){t.x=o.x-40;t.y=o.y-40;
    const sameSide=o.side===0?p.x<570:o.side===1?p.y<290:o.side===2?p.x>710:p.y>460;
    t.open=(o.c%120>=35&&o.c%120<110&&sameSide)||d.centerWindow;
    w.progress=1-t.hp/54;
   }
   // The central obstruction has a marked, brief crossing lane; routes around it remain open.
   const inCabin=p.x>565&&p.x<715&&p.y>285&&p.y<465;
   if(inCabin&&!d.centerWindow){const dx=p.x-640,dy=p.y-375;if(Math.abs(dx)>Math.abs(dy))p.x=dx<0?560:720;else p.y=dy<0?280:470;}
   if(w.phaseTick>600&&w.phaseTick%360===60){
    const side=o.side;w.hazard({id:'showroom-volley-'+w.phaseTick,source:'showroom-side-volley',rule:'ordinary',x:side===0?1160:80,y:p.y-38,w:26,h:26,vx:side===0?-7:7,windup:50,active:170,cue:'DEMO DRONE: side volley locked'});
   }
   // Bring back the Phase1 rift only once the orbit has been taught in isolation.
   if(w.phaseTick>=600&&w.phaseTick%600===60){w.player.dashWait=0;w.hazard({id:'showroom-rift-'+w.phaseTick,source:'showroom-demo-rift',rule:'dash',x:1220,y:0,w:28,h:720,vx:-9,windup:90,active:145,cue:'≫ RETURNING DEMO RIFT · SHIFT ≫'});}
   w.objective=d.centerWindow?'CENTER LANE OPEN — short route through cabin':t&&t.open?'MODULE EXPOSED — punish from the matching side':'HINGE '+['LEFT','TOP','RIGHT','BOTTOM'][o.side]+' — move to that side for the opening';
  },
  draw(ctx,w){const o=orbit(w);ctx.save();
   ctx.strokeStyle='#ad8bc9';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(640,350,250,210,0,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle=w.data.centerWindow?'#3d6b65':'#513956';ctx.fillRect(565,245,150,200);ctx.strokeStyle='#eed4fc';ctx.strokeRect(565,245,150,200);ctx.fillStyle='#161a2c';ctx.fillRect(600,255,80,70);
   for(let i=0;i<4;i++){const a=[Math.PI,Math.PI*1.5,0,Math.PI*.5][i],x=640+Math.cos(a)*250,y=350+Math.sin(a)*210;ctx.fillStyle=i===o.side?'#f8d486':'#5c4c70';ctx.fillRect(x-50,y-50,100,100);label(ctx,['LEFT','TOP','RIGHT','BOTTOM'][i],x-35,y-65);}
   label(ctx,w.data.centerWindow?'CENTER LANE OPEN':'CENTRAL CABIN — ORBIT AROUND',440,640);label(ctx,'BOT SALES · LIMITED-TIME OFFER',420,85);ctx.restore();
  }
 };
 A.registerStage({id:'10-verse',number:10,title:'Verse Gate',operator:'Bot Sales',operatorSprite:'sprotosales',color:'#d7a2ef',eligibleWeapons:['prism-rail','echo-decoy'],phases:[p1,p2]});
})(Arcade);
