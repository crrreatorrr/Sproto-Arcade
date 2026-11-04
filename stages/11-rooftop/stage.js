/* Packet E: authored rooftop prototype. Classic-script / file:// compatible. */
(function (A) {
  'use strict';
  const GROUND=600, END1=10000, END2=8300;
  const gaps=[{start:3800,end:4280,front:4070,source:'goldie.afterburner.dash-crossing'},
    {start:6650,end:7130,front:6920,source:'goldie.cutoff.final-crossing'}];
  const theme={sky:'#191d38',roof:'#485472',edge:'#ffcc79',gold:'#ffcf62'};
  function roof(w,id,x,end,y=GROUND){return w.platform({id,x,y,w:end-x,h:30});}
  function text(ctx,s,x,y,color='#fff0c9',size=20){ctx.fillStyle=color;ctx.font='bold '+size+'px system-ui';ctx.fillText(s,x,y);}
  function chevrons(ctx,x,y){ctx.strokeStyle='#ffe5a0';ctx.lineWidth=5;for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(x+i*19-12,y-15);ctx.lineTo(x+i*19,y);ctx.lineTo(x+i*19-12,y+15);ctx.stroke();}}
  function resetAtLaunch(w,g){const p=w.player;p.x=g.start-120;p.y=GROUND;p.vx=p.vy=0;p.dashWait=0;p.dash=0;p.grounded=true;p.airJump=true;w.cue('Missed the marked crossing — jump, then Shift through the chevrons',180);}
  function mandatoryFront(w,g){
    const d=w.data,p=w.player;
    for(const e of w.events){
      if(e.source===g.source && e.type==='counter' && e.rule==='dash') {d.crossing=true;w.cue('DASH CROSSING — reach the landing roof',130);}
      if(e.source===g.source && e.type==='hit') {resetAtLaunch(w,g);d.frontSerial++;}
    }
    if(!d.crossing && p.x>g.end+60) resetAtLaunch(w,g);
    if(!d.crossing && p.x>g.start-800){
      w.hazard({id:g.source+'.'+d.frontSerial,source:g.source,rule:'dash',x:g.front,y:-1400,w:20,h:2600,windup:0,active:20000,recovery:0,cue:'⋙ Shift • dash only'});
      if(p.x<g.start-40 && p.grounded) {p.dashWait=0;}
    }
  }
  function aimedBurst(w,fromRight,source){
    const p=w.player,origin={x:p.x+(fromRight?650:-450),y:p.y-145};
    let volley={eligibleAim:true,rule:'ordinary',x:origin.x,y:origin.y,targetX:p.x,targetY:p.y-26};
    if(w.redirectVolley) volley=w.redirectVolley(volley);
    const tx=volley.targetX===undefined?p.x:volley.targetX,ty=volley.targetY===undefined?p.y-26:volley.targetY;
    const dx=tx-origin.x,dy=ty-origin.y,len=Math.hypot(dx,dy)||1;
    w.hazard({id:source+'.'+w.phaseTick,source,rule:'ordinary',x:origin.x,y:origin.y,w:28,h:20,vx:dx/len*8,vy:dy/len*8,windup:48,active:130,recovery:10,cue:fromRight?'Goldie banks back — intercept from ahead':'Goldie aims his arm — burst from behind'});
  }
  function machine(ctx,w,glider){
    const p=w.player,x=p.x+(glider?440:-260),y=300+Math.sin(w.phaseTick/45)*22;
    ctx.save();ctx.translate(x,y);ctx.fillStyle='#664a36';ctx.fillRect(-48,-25,96,63);ctx.strokeStyle=theme.gold;ctx.lineWidth=5;ctx.strokeRect(-48,-25,96,63);
    if(glider){ctx.beginPath();ctx.moveTo(-40,0);ctx.lineTo(-170,45);ctx.lineTo(-100,-35);ctx.lineTo(0,-18);ctx.lineTo(100,-35);ctx.lineTo(170,45);ctx.lineTo(40,0);ctx.closePath();ctx.fillStyle='#9687ac';ctx.fill();}
    ctx.fillStyle='#ffcb66';ctx.fillRect(-25,-65,50,46);ctx.fillStyle='#221c2e';ctx.fillRect(-16,-49,10,8);ctx.fillRect(8,-49,10,8);ctx.fillStyle='#d7e6ed';ctx.fillRect(-54,25,22,34);ctx.fillRect(32,25,22,34);ctx.fillStyle='#ff8a50';ctx.fillRect(-50,60,14,24);ctx.fillRect(36,60,14,24);
    text(ctx,'GOLDIE',-45,-82,theme.gold,16);ctx.restore();
  }
  function drawRoute(ctx,w,phase){
    const g=gaps[phase];
    for(const plat of w.platforms){ctx.fillStyle=theme.roof;ctx.fillRect(plat.x,plat.y,plat.w,plat.h);ctx.fillStyle=theme.edge;ctx.fillRect(plat.x,plat.y,plat.w,5);}
    chevrons(ctx,g.start-50,GROUND-35);chevrons(ctx,g.end+30,GROUND-35);
    ctx.strokeStyle='#f9dda0';ctx.setLineDash([13,12]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(g.start,GROUND+55);ctx.lineTo(g.end,GROUND+55);ctx.stroke();ctx.setLineDash([]);
    text(ctx,'JUMP → AIR DASH → LAND',g.start-190,GROUND-100,theme.edge);
    if(!phase){text(ctx,'1 · SPACE: JUMP THE FIRST GAP',700,450);text(ctx,'2 · SHIFT: MARKED DASH CROSSING',3100,450);text(ctx,'3 · UPPER CACHE / LOWER SAFE ROUTE',5200,360);text(ctx,'GLIDER EXTRACTION →',END1-450,470,theme.gold,25);}
    else {text(ctx,'EXTRACTION · GOLDIE OVERTAKES',140,450,theme.gold);text(ctx,'EXIT →',END2-200,460,'#a3ffd6',34);ctx.fillStyle='#89e9cb';ctx.fillRect(END2-35,470,15,130);}
    machine(ctx,w,!!phase);
  }
  function init(w,phase){
    w.data={crossing:false,frontSerial:0,lastBurst:-1,cache:false,sector:0};
    if(!phase){
      roof(w,'jump-launch',0,1100);roof(w,'dash-launch',1260,3800);roof(w,'dash-landing',4280,END1+550);
      roof(w,'upper-entry',5260,5580,510);roof(w,'upper-cache',5650,6450,415);roof(w,'upper-exit',6520,6970,510);
      w.cue('Pursuit: Space jumps. The first roof gap needs a jump, then Shift crosses the marked gap.',220);
    } else {
      roof(w,'extraction-run',0,6650);roof(w,'exit-landing',7130,END2+550);roof(w,'extraction-upper',2850,3580,480);
      w.cue('Goldie unfolds his wings. Reach the exit; dash through his final intercept.',220);
    }
    w.objective=phase?'ESCAPE · reach the marked extraction exit':'ROUTE · jump, dash, then choose a roof';w.progress=0;
  }
  function update(w,phase){
    const p=w.player,d=w.data,end=phase?END2:END1,g=gaps[phase];
    mandatoryFront(w,g);
    // Threats are spatially isolated from mandatory launch windows.
    const safeForShot=p.x>1600 && Math.abs(p.x-g.start)>850 && Math.abs(p.x-g.end)>850 && p.grounded;
    const cycle=Math.floor(w.phaseTick/360);
    if(safeForShot && cycle!==d.lastBurst && (!phase || w.phaseTick>=600)) {
      d.lastBurst=cycle;aimedBurst(w,phase?cycle%2===0:false,phase?'goldie.cutoff.aimed-shot':'goldie.afterburner.aimed-shot');
    }
    if(!phase && p.x>5700 && p.x<6500 && p.y<440 && !d.cache){d.cache=true;w.drop('goldie.upper-roof-cache',p.x+80,415-30);w.cue('Optional roof cache — F uses the pickup, E deliberately swaps it',150);}
    // First extraction crossing teaches the glider without a simultaneous burst.
    if(phase && p.x>5500 && !d.finalCue){d.finalCue=true;w.cue('Goldie banks across the exit. Jump from the chevrons; Shift through the intercept.',200);}
    if(phase && w.phaseTick>600 && p.x>1700 && p.x<5400 && w.phaseTick%540===0) aimedBurst(w,false,'goldie.afterburner.returning-burst');
    w.progress=A.clamp(p.x/end,0,1);
    w.objective=(phase?'ESCAPE':'ROUTE')+' · '+Math.floor(w.progress*100)+'%'+(!d.crossing?' · marked dash crossing ahead':' · dash crossing passed');
    if(p.x>=end && d.crossing && p.grounded && Math.abs(p.y-GROUND)<5) phase?w.clear():w.advancePhase();
  }
  A.registerStage({id:'11-rooftop',number:11,title:'Rooftop Breakaway',operator:'Goldie',operatorSprite:'sproto1668',color:theme.gold,eligibleWeapons:['echo-decoy','prism-rail','ricochet-mine'],
    phases:[
      {name:'Pursuit',drawsPilot:true,pilot:null,machine:'Pursuit Jetpack',mode:'horizontal',camera:'horizontal',objective:'Jump, air dash, choose a route',hudLabel:'Route progress',spawn:{x:130,y:GROUND},practiceSpawn:{x:3300,y:GROUND},attackIds:['goldie.afterburner.aimed-shot','goldie.afterburner.dash-crossing'],enter(w){init(w,0);},update(w){update(w,0);},draw(ctx,w){drawRoute(ctx,w,0);}},
      {name:'Extraction',drawsPilot:true,pilot:null,machine:'Intercept Glider',mode:'horizontal',camera:'horizontal',objective:'Reach the exit through the final intercept',hudLabel:'Escape progress',spawn:{x:130,y:GROUND},practiceSpawn:{x:130,y:GROUND},attackIds:['goldie.cutoff.aimed-shot','goldie.cutoff.final-crossing','goldie.afterburner.returning-burst'],enter(w){init(w,1);},update(w){update(w,1);},draw(ctx,w){drawRoute(ctx,w,1);}}
    ]});
})(Arcade);
