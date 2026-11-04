/* Codebreak Ascent: authored climb and fixed summit siege, placeholder art. */
(function(A){
  'use strict';
  const ID='12-codebreak';
  const LEDGES=Array.from({length:18},(_,i)=>({id:'ascent-'+i,x:[440,760,440,120][i%4],y:550-i*90,w:400,h:22}));
  const SUMMIT=LEDGES[LEDGES.length-1].y;
  function chevrons(ctx,x,y){ctx.save();ctx.strokeStyle='#ffe69a';ctx.lineWidth=5;for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(x+i*20,y-12);ctx.lineTo(x+12+i*20,y);ctx.lineTo(x+i*20,y+12);ctx.stroke();}ctx.restore();}
  function rig(ctx,x,y,anchored,tick){
    ctx.save();ctx.translate(x,y);ctx.fillStyle='#323a52';ctx.strokeStyle='#e4bc61';ctx.lineWidth=5;
    ctx.fillRect(-80,-68,160,110);ctx.strokeRect(-80,-68,160,110);
    ctx.fillStyle='#a8e5ff';ctx.fillRect(-40,-52,80,54);
    
    ctx.strokeStyle='#ffe29b';ctx.beginPath();ctx.moveTo(55,-10);ctx.lineTo(110,-35+Math.sin(tick/20)*8);ctx.stroke();
    if(anchored){for(const x of [-60,60]){ctx.beginPath();ctx.moveTo(x,30);ctx.lineTo(x*1.5,120);ctx.stroke();}}
    else {ctx.fillStyle='#85c7ff';ctx.fillRect(-62,46,25,22+Math.sin(tick/7)*8);ctx.fillRect(37,46,25,22+Math.sin(tick/7)*8);}
    ctx.fillStyle='#fff2c2';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.restore();
  }
  const smooth=n=>{n=A.clamp(n,0,1);return n*n*(3-2*n);};
  // Pose is a pure fixed-tick sample. Draws and display refresh never advance it.
  function summitPose(w){
    const t=w.phaseTick,age=t<90?-1:(t-90)%360;
    const unfold=age<0?0:age<55?smooth(age/55):age<215?1:1-smooth((age-215)/55);
    const recoil=age<75?0:Math.sin((age-75)*.42)*Math.exp(-(age-75)/12)*4;
    const sinceHit=t-(w.data.hitAt??-1000);
    const hit=sinceHit<0?0:Math.sin(sinceHit*.6)*Math.exp(-sinceHit/9)*3;
    const settle=t>=75?0:-95*(1+t/10)*Math.exp(-t/10)*(1-smooth((t-55)/20));
    const open=(w.data.ventOpenedAt<0?0:smooth((t-(w.data.ventOpenedAt??-1000))/18))*(t<w.data.openUntil?1:1-smooth((t-w.data.openUntil)/18));
    return {x:1090+recoil+hit,y:450+settle,feet:[{x:970,y:600},{x:1190,y:600}],unfold,recoil,hit,open,
      scannerAge:age,scannerState:age<0?'anchor':age<55?'unfold':age<75?'windup':age<215?'release':age<270?'retract':'recovery',
      elbowX:1138+unfold*42,elbowY:430-unfold*112,emitterX:1155+unfold*45,emitterY:405-unfold*125};
  }
  function segment(ctx,a,b,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  function summitRig(ctx,w){
    const p=summitPose(w);ctx.save();ctx.lineCap='round';
    // Anchored feet remain on the physical floor while the upper cab settles.
    for(const foot of p.feet){const hip={x:p.x+(foot.x<p.x?-55:55),y:p.y+32},knee={x:(hip.x+foot.x)/2+(foot.x<p.x?-14:14),y:(hip.y+foot.y)/2-5};segment(ctx,hip,knee,18,'#766b69');segment(ctx,knee,foot,12,'#d5af69');ctx.fillStyle='#505569';ctx.fillRect(foot.x-27,592,54,8);}
    // Fixed flank frame and vent exactly match the actual target rectangle.
    ctx.fillStyle='#252e43';ctx.fillRect(1038,478,129,124);ctx.strokeStyle='#d5af69';ctx.lineWidth=5;ctx.strokeRect(1050,490,105,100);
    ctx.fillStyle=w.phaseTick<w.data.openUntil?'#ffdc83':'#59636f';ctx.fillRect(1053,493,99,94);
    for(let i=0;i<5;i++){const y=500+i*17;ctx.fillStyle='#303a4e';ctx.fillRect(1055+(p.open*43),y,95*(1-p.open),7);}
    ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#323a52';ctx.strokeStyle='#e4bc61';ctx.lineWidth=5;ctx.fillRect(-80,-68,160,110);ctx.strokeRect(-80,-68,160,110);ctx.fillStyle='#a8e5ff';ctx.fillRect(-40,-52,80,54);ctx.fillStyle='#304761';ctx.fillRect(-37,-49,74,48);ctx.fillStyle='#fff2c2';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.restore();
    const shoulder={x:p.x+57,y:p.y-15},elbow={x:p.elbowX,y:p.elbowY},emitter={x:p.emitterX,y:p.emitterY};segment(ctx,shoulder,elbow,15,'#706c78');segment(ctx,elbow,emitter,10,'#d5af69');
    ctx.fillStyle='#d5af69';for(const joint of [shoulder,elbow]){ctx.beginPath();ctx.arc(joint.x,joint.y,10,0,Math.PI*2);ctx.fill();}
    ctx.save();ctx.translate(emitter.x,emitter.y);ctx.rotate(-p.unfold*Math.PI/2);ctx.fillStyle='#506277';ctx.fillRect(-19,-25,38,50);ctx.strokeStyle=p.scannerState==='release'?'#fff1ac':'#b7e7ff';ctx.lineWidth=5;ctx.strokeRect(-15,-22,30,44);ctx.restore();
    if(p.unfold>.3){ctx.strokeStyle=p.scannerState==='release'?'#fff3ba':'#c9e1ec';ctx.lineWidth=3;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(emitter.x,emitter.y);ctx.lineTo(emitter.x+side*22*p.unfold,emitter.y-48*p.unfold);ctx.stroke();}}
    ctx.restore();
  }
  function markDrop(w,cycle){
    const x=w.player.x-35,y=w.player.y-170;
    w.hazard({id:'warrant-'+cycle,source:ID+'/warrant-drop',rule:'ordinary',x,y,w:70,h:24,vy:9,windup:65,active:45,recovery:10,cue:'WARRANT DROP — change ledge'});
    w.cue('WARRANT DROP · Reticle locks, then move to the next ledge',100);
  }
  A.registerStage({id:ID,number:12,title:'Codebreak Ascent',operator:'Bitcoin Sheriff',operatorSprite:'sproto3106',color:'#d5af69',eligibleWeapons:['prism-rail','echo-decoy'],practiceSectors:[{id:1,label:'Climb · sector 2',phase:0},{id:2,label:'Climb · sector 3',phase:0}],phases:[{
    name:'Warrant climb',machine:'Warrant Rig',mode:'vertical',camera:'vertical',hudLabel:'ASCENT',objective:'Climb the authored ledges to the summit',spawn:{x:260,y:640},practiceSpawn:{x:260,y:640},pilot:w=>({x:1120,y:w.player.y-178}),pilotHeight:45,
    enter(w){
      w.platform({id:'launch',x:80,y:640,w:480,h:24});
      LEDGES.forEach(p=>w.platform({...p}));
      // Recovery footing is at most two jumps below each sector's last foothold.
      for(const index of [3,7,11,15])w.platform({id:'recovery-'+index,x:80,y:LEDGES[index].y+130,w:1120,h:20});
      if(w.practice&&w.sector>0){const checkpoint=LEDGES[w.sector>=2?12:6];Object.assign(w.player,{x:checkpoint.x+100,y:checkpoint.y,prevX:checkpoint.x+100,prevY:checkpoint.y});}
      w.data.highest=w.player.y;w.data.cache=false;w.data.sector=0;w.data.crossing=false;w.data.nextFront=0;
      w.cue('CLIMB · Jump twice, change sides, Shift for an air dash',180);
    },
    update(w){
      w.data.highest=Math.min(w.data.highest,w.player.y);
      w.progress=A.clamp((640-w.data.highest)/(640-SUMMIT),0,1);
      const sector=Math.min(2,Math.floor(w.progress*3));
      if(sector>w.data.sector){w.data.sector=sector;w.cue('SECTOR '+(sector+1)+' · Recovery ledge below, next foothold above',120);}
      w.objective='Climb to the summit · sector '+(sector+1)+'/3';
      if(w.player.y<SUMMIT+390&&!w.data.crossing&&w.phaseTick>=w.data.nextFront){w.data.nextFront=w.phaseTick+270;w.hazard({id:'upper-warrant-'+w.phaseTick,source:ID+'/upper-crossing',rule:'dash',x:1200,y:SUMMIT-150,w:24,h:550,vx:-9,windup:75,active:140,recovery:20,cue:'» UPPER CROSSING · Dash the marked warrant front'});}
      for(const event of w.events)if(event.type==='counter'&&event.rule==='dash'&&event.source===ID+'/upper-crossing'){w.data.crossing=true;w.cue('UPPER CROSSING SECURED · Land on the summit',150);}
      if(w.player.y<SUMMIT+390&&!w.data.crossing){w.objective='» REQUIRED UPPER CROSSING · Dash through the warrant front';if(w.player.grounded)w.player.dashWait=0;}
      if(w.phaseTick>=150&&w.phaseTick%180===150)markDrop(w,Math.floor(w.phaseTick/180));
      if(!w.data.cache&&w.player.y<150){w.data.cache=true;w.drop('codebreak-first-recovery',w.player.x,w.player.y-20);}
      const top=LEDGES[LEDGES.length-1];
      if(w.data.crossing&&w.player.grounded&&w.player.y<=SUMMIT+2&&w.player.x>=top.x&&w.player.x<=top.x+top.w){w.advancePhase();}
    },
    draw(ctx,w){
      ctx.save();ctx.strokeStyle='#526278';ctx.lineWidth=3;
      for(let y=700;y>SUMMIT-300;y-=90){ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(40,y-65);ctx.moveTo(1240,y);ctx.lineTo(1240,y-65);ctx.stroke();}
      ctx.fillStyle='#dce6ff';ctx.font='bold 18px system-ui';ctx.fillText('SUMMIT →',LEDGES[17].x+100,SUMMIT-30);
      LEDGES.forEach((p,i)=>{if(i%4===1||i%4===3)chevrons(ctx,p.x+20,p.y-35);});
      rig(ctx,1120,w.player.y-180,false,w.phaseTick);ctx.restore();
    }
  },{
    name:'Summit lockdown',machine:'Summit Lockdown',mode:'fixed',camera:'fixed',hudLabel:'CORE',objective:'Dash through the scanner, then shoot the vent',spawn:{x:260,y:600},practiceSpawn:{x:260,y:600},pilot:w=>{const p=summitPose(w);return {x:p.x,y:p.y+2};},pilotHeight:45,pose:summitPose,
    enter(w){
      w.platform({id:'summit-floor',x:20,y:600,w:1240,h:30});
      w.data.openUntil=0;w.data.countered=0;w.data.scannerCycle=-1;w.data.hitAt=-1000;w.data.ventOpenedAt=-1000;
      w.target({id:'summit-core',x:1050,y:490,w:105,h:100,hp:12,maxHp:12,open:false,label:'Side vent · armored',onDefeat:()=>w.clear()});
      w.cue('NEW TASK · Broken chevrons mean DASH, then fire at the vent',180);
    },
    update(w){
      const t=w.phaseTick,cycle=Math.floor(Math.max(0,t-90)/360);
      if(t>=90&&(t-90)%360===0){
        w.data.scannerCycle=cycle;
        w.hazard({id:'summit-scanner-'+cycle,source:ID+'/summit-scanner',rule:'dash',x:1200,y:150,w:24,h:450,vx:-9,windup:75,active:140,recovery:20,cue:'»  » DASH THROUGH SCANNER'});
        w.cue('»  » SHIFT · Dash through the marked scanner',150);
      }
      for(const event of w.events){if(event.type==='counter'&&event.rule==='dash'&&event.source===ID+'/summit-scanner'){
        w.data.countered++;w.data.openUntil=t+210;w.data.ventOpenedAt=t;w.cue('SCANNER COUNTERED · Side vent open — fire!',150);
        if(w.data.countered===1)w.drop('codebreak-scanner-punish',w.player.x,w.player.y-20);
      }}
      if(w.events.some(event=>event.type==='targetHit'&&event.target==='summit-core'))w.data.hitAt=t;
      const core=w.targets.find(target=>target.id==='summit-core');
      if(core){core.open=t<w.data.openUntil;core.label=core.open?'Side vent · OPEN':'Side vent · dash scanner to expose';w.progress=1-core.hp/core.maxHp;}
      w.objective=t<w.data.openUntil?'Vent open · shoot the right side':'Dash through the scanner to unlock the vent';
      // Reintroduce the climbing reticle only after the isolated scanner lesson.
      if(t>=690&&(t-690)%360===0)markDrop(w,'summit-'+Math.floor(t/360));
    },
    draw(ctx,w){
      summitRig(ctx,w);
      ctx.save();
      chevrons(ctx,1140,230);ctx.fillStyle='#fff0bd';ctx.font='bold 18px system-ui';ctx.fillText('DASH SCANNER → EXPOSE VENT',610,200);ctx.restore();
    }
  }]});
})(Arcade);
