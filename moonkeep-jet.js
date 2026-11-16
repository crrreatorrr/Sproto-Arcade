/* The Moonkeep player jet is painted at sprite resolution and doubled on screen. */
globalThis.ArcadeMoonkeepJet = (() => {
  'use strict';
  const ink='#121a2e', gunmetal='#263149', slate='#4c5a73', grey='#78869f';
  const silver='#aab8cd', light='#d9e4f0', white='#edf6ff';
  const brass='#a57340', gold='#dfae65', cyan='#4edaff';
  const violet='#a461f2', amber='#ffbc63';
  const canopy=[[44,23],[45,17],[50,11],[56,7],[62,6],[67,7],[72,11],[76,17],[78,23],[75,26],[47,26]];
  const glass=[[46,23],[47,17],[52,12],[58,8],[65,8],[70,11],[74,17],[76,23],[74,24],[48,24]];
  const origin=[48,23];
  const missileTravel=5, missileTraces=new WeakMap(), traceByShot=new WeakMap();
  const heavyLaunches=new WeakMap(),heavyHits=new WeakMap(),heavyBounces=new WeakMap();
  const flightPoses=new WeakMap();
  let hull;

  function rect(ctx,color,x,y,w,h){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}

  function pixels(ctx,color,points){
    ctx.fillStyle=color;
    const rows=points.map(point=>point[1]);
    for(let y=Math.min(...rows);y<Math.max(...rows);y++){
      const ends=[];
      for(let i=0;i<points.length;i++){
        const [x0,y0]=points[i],[x1,y1]=points[(i+1)%points.length],row=y+.5;
        if((y0<=row&&row<y1)||(y1<=row&&row<y0))ends.push(x0+(x1-x0)*(row-y0)/(y1-y0));
      }
      ends.sort((a,b)=>a-b);
      for(let i=0;i<ends.length;i+=2){
        const x=Math.round(ends[i]),width=Math.round(ends[i+1])-x;
        if(width>0)ctx.fillRect(x,y,width,1);
      }
    }
  }

  function drawFin(ctx,x,y,h){
    pixels(ctx,ink,[[x,y],[x+9,y],[x+23,y+h],[x+6,y+h]]);
    pixels(ctx,grey,[[x+1,y+1],[x+9,y+1],[x+21,y+h-1],[x+7,y+h-1]]);
    pixels(ctx,slate,[[x+2,y+3],[x+6,y+4],[x+15,y+h-1],[x+8,y+h-1]]);
    rect(ctx,light,x+1,y+1,9,1);
    const arch=[[x+7,y+h-2],[x+7,y+h-6],[x+11,y+h-10],[x+16,y+h-6],[x+16,y+h-2]];
    pixels(ctx,brass,arch);
    pixels(ctx,gunmetal,[[x+8,y+h-2],[x+8,y+h-6],[x+11,y+h-8],[x+15,y+h-6],[x+15,y+h-2]]);
    rect(ctx,gold,x+11,y+h-9,1,2);
  }

  function drawEngine(ctx,y){
    pixels(ctx,ink,[[7,y],[22,y],[31,y+4],[28,y+11],[8,y+11],[5,y+8],[5,y+3]]);
    pixels(ctx,slate,[[8,y+1],[22,y+1],[27,y+4],[26,y+9],[8,y+9],[6,y+7],[6,y+4]]);
    rect(ctx,grey,9,y+2,14,2);
    rect(ctx,gunmetal,7,y+7,19,2);
    rect(ctx,ink,10,y+1,2,8);
    rect(ctx,brass,12,y+1,3,8);
    rect(ctx,gold,12,y+2,2,2);
    rect(ctx,gunmetal,18,y+2,2,6);
    rect(ctx,ink,6,y+4,2,5);
  }

  function buildHull(){
    const surface=document.createElement('canvas');
    surface.width=98;surface.height=44;
    const ctx=surface.getContext('2d');
    drawFin(ctx,18,4,16);
    drawEngine(ctx,19);
    drawFin(ctx,7,5,17);
    drawEngine(ctx,29);

    pixels(ctx,ink,[[19,21],[30,17],[47,18],[58,20],[73,21],[79,25],[95,28],[97,29],
      [87,33],[77,35],[68,36],[56,39],[27,39],[22,36],[14,34],[15,26]]);
    pixels(ctx,gunmetal,[[18,25],[35,23],[75,24],[93,29],[77,34],[67,35],[56,37],[26,37],[18,33]]);
    pixels(ctx,grey,[[22,21],[32,18],[47,19],[58,21],[76,22],[80,25],[95,29],
      [87,31],[77,32],[56,30],[34,30],[23,29],[18,26]]);
    pixels(ctx,silver,[[23,21],[33,19],[47,20],[59,22],[77,23],[81,26],[93,29],
      [84,29],[71,27],[54,27],[44,25],[21,25]]);
    pixels(ctx,light,[[30,20],[43,20],[47,21],[57,22],[48,23],[42,22],[23,23]]);
    pixels(ctx,white,[[76,24],[81,26],[95,29],[82,27]]);

    pixels(ctx,ink,[[31,27],[52,29],[47,35],[33,42],[19,42],[20,39]]);
    pixels(ctx,grey,[[32,28],[50,29],[46,34],[32,41],[20,41],[22,38]]);
    pixels(ctx,silver,[[32,28],[46,29],[41,33],[24,39],[23,38]]);
    pixels(ctx,light,[[34,28],[42,29],[37,31],[29,33]]);
    pixels(ctx,slate,[[40,32],[46,31],[42,35],[28,41],[24,41]]);
    rect(ctx,ink,22,39,6,2);
    rect(ctx,cyan,23,39,4,1);

    pixels(ctx,gunmetal,[[33,20],[43,20],[46,25],[30,25]]);
    pixels(ctx,ink,[[34,21],[42,21],[44,24],[32,24]]);
    rect(ctx,grey,34,22,8,1);
    rect(ctx,slate,33,24,11,1);
    pixels(ctx,ink,[[53,29],[63,29],[60,35],[49,35]]);
    for(let i=0;i<3;i++)rect(ctx,slate,53-i,30+i*2,8,1);
    rect(ctx,light,45,27,2,1);
    rect(ctx,light,49,28,1,1);
    rect(ctx,ink,72,29,8,3);
    for(let i=0;i<3;i++)rect(ctx,cyan,73+i*2,30,1,1);
    pixels(ctx,ink,[[68,32],[81,33],[77,36],[68,37],[65,35]]);
    rect(ctx,brass,69,34,7,1);
    rect(ctx,ink,84,28,3,2);
    rect(ctx,silver,85,28,2,1);

    pixels(ctx,ink,canopy);
    pixels(ctx,brass,canopy.map(([x,y])=>[x,y+(y<20?1:0)]));
    pixels(ctx,'#12283d',glass);
    pixels(ctx,'#1d3d50',[[48,18],[53,12],[59,9],[66,9],[68,11],[60,11],[52,15]]);
    pixels(ctx,slate,[[50,13],[55,12],[57,15],[57,24],[50,24],[49,19]]);
    rect(ctx,grey,51,13,4,2);
    pixels(ctx,gunmetal,[[70,20],[74,19],[76,23],[74,24],[69,24]]);
    rect(ctx,cyan,72,21,2,1);
    rect(ctx,gold,49,25,23,1);
    return surface;
  }

  function flightPose(p,tick,climbSpeed,active){
    let pose=flightPoses.get(p);
    if(!pose||tick<pose.tick){
      pose={tick:tick-1,y:p.y-(p.vy||0),pitch:0,boost:0};
      flightPoses.set(p,pose);
    }
    const dt=tick-pose.tick;
    if(dt){
      // Use traveled altitude so the nose eases level at the flight limits.
      const vertical=active?Math.max(-1,Math.min(1,(p.y-pose.y)/(dt*climbSpeed))):0;
      const dashing=active&&p.dash>0;
      pose.pitch+=(vertical*.24-pose.pitch)*(1-.82**dt);
      pose.boost+=(Number(dashing)-pose.boost)*(1-(dashing ? .42 : .78)**dt);
      pose.y=p.y;
      pose.tick=tick;
    }
    return pose;
  }

  function drawExhaust(ctx,tick,boost){
    for(const [i,y] of [24,34].entries()){
      const pulse=(tick+i*2)%4;
      const reach=9+Math.round(boost*(37+i*5)+2*Math.sin(tick*.78+i));
      const spread=4+Math.round(boost*4);
      if(boost>.18){
        pixels(ctx,'#171d4a',[[7,y-spread-2],[7,y+spread+2],[-9,y+spread+1],[-reach-7,y],[-11,y-spread-1]]);
        pixels(ctx,'#7943e1',[[4,y-spread-1],[3,y+spread+1],[-11,y+spread],[-reach-4,y],[-12,y-spread]]);
      }
      pixels(ctx,'#274fb7',[[7,y-spread],[7,y+spread],[0,y+spread],[-reach,y],[-4,y-spread+1]]);
      pixels(ctx,'#31a8ff',[[7,y-spread+1],[7,y+spread-1],[-1,y+spread-1],[-reach+4,y],[-2,y-spread+2]]);
      pixels(ctx,'#a4f6ff',[[7,y-2],[7,y+2],[1,y+3],[-Math.round(reach*.67),y],[-3,y-3]]);
      rect(ctx,white,4,y-1,3,2);
      if(boost>.18){
        for(let j=0;j<3;j++){
          const x=-7-j*9-pulse*2;
          if(-x>reach*.77)break;
          const h=6-j;
          pixels(ctx,j===0?white:'#91f1ff',[[x-5,y],[x,y-h],[x+4,y],[x,y+h]]);
          rect(ctx,'#e5fdff',x-2,y-1,4,2);
        }
        for(let j=0;j<5;j++){
          const x=-reach-5-((tick*3+j*11)%24);
          const dy=(j-2)*(2+pulse%2);
          rect(ctx,j%2?cyan:'#a57bf7',x,y+dy,2+j%3,1);
        }
      }else rect(ctx,cyan,-reach-3,y+(tick%3)-1,2,1);
    }
  }

  function drawPilot(ctx,picture,id,tick){
    const pilot=ART.sprites[id];
    const [path,anchorX,anchorY]=pilot.poses[Math.floor(tick/23)%2]??pilot.poses[0];
    const portrait=picture(path);
    if(!portrait?.naturalWidth)return;
    const [sx,sy,sw,sh]=pilot.cockpitCrop??[anchorX-36,anchorY-128,88,83];
    const scale=Math.min(20/sw,15/sh);
    const w=Math.round(sw*scale),h=Math.round(sh*scale);
    ctx.save();ctx.beginPath();ctx.moveTo(...glass[0]);
    for(const point of glass.slice(1))ctx.lineTo(...point);
    ctx.closePath();ctx.clip();
    ctx.drawImage(portrait,sx,sy,sw,sh,Math.round(62-w/2),24-h,w,h);
    ctx.restore();
    pixels(ctx,'#5ba9c4',[[66,8],[70,10],[73,14],[74,17],[72,14],[69,11]]);
    rect(ctx,'#c5f0fa',70,11,2,1);
    rect(ctx,brass,48,24,26,1);
    rect(ctx,gold,50,25,19,1);
  }

  function opening(age,launch,end){
    if(age<0||age>=end)return 0;
    const t=Math.min(1,(age+1)/(launch+1),(end-age)/9);
    return t*t*(3-2*t);
  }

  function octagon(ctx,color,x,y,r){
    const bevel=Math.ceil(r*.45);
    pixels(ctx,color,[[x-bevel,y-r],[x+bevel,y-r],[x+r,y-bevel],[x+r,y+bevel],
      [x+bevel,y+r],[x-bevel,y+r],[x-r,y+bevel],[x-r,y-bevel]]);
  }

  function missilePod(ctx,age){
    // The upper tube is the live bore, aligned with local (0, 0).
    ctx.translate(0,4);
    pixels(ctx,ink,[[-29,-4],[-23,-9],[-5,-9],[3,-6],[3,7],[-5,10],[-23,10],[-28,5]]);
    pixels(ctx,slate,[[-27,-3],[-22,-8],[-7,-8],[-2,-5],[-2,6],[-6,9],[-22,9],[-26,4]]);
    pixels(ctx,silver,[[-26,-3],[-22,-7],[-10,-7],[-12,-4],[-23,-2]]);
    rect(ctx,light,-21,-7,10,1);
    rect(ctx,gunmetal,-23,4,15,4);
    rect(ctx,brass,-21,4,11,1);
    for(let i=0;i<3;i++)rect(ctx,ink,-22+i*4,6,2,2);
    for(const y of [-4,4]){
      rect(ctx,ink,-15,y-2,14,4);
      rect(ctx,grey,-13,y-2,10,1);
      rect(ctx,slate,-8,y-3,7,6);
      octagon(ctx,ink,0,y,4);
      octagon(ctx,age<=0?cyan:grey,0,y,3);
      octagon(ctx,'#182743',0,y,2);
      if(age<0)rect(ctx,white,-1,y-1,2,2);
    }
    rect(ctx,age<0?cyan:'#3951a1',-18,-1,5,2);
  }

  function heavyCannon(ctx,age){
    pixels(ctx,ink,[[-25,-5],[-20,-10],[-8,-11],[-3,-7],[-3,7],[-9,11],[-22,10],[-26,5]]);
    pixels(ctx,slate,[[-24,-4],[-19,-9],[-9,-10],[-4,-6],[-4,6],[-10,10],[-21,9],[-25,4]]);
    rect(ctx,silver,-19,-9,10,2);
    rect(ctx,gunmetal,-25,-4,6,10);
    for(let i=0;i<3;i++)rect(ctx,brass,-24+i*2,-3,1,8);
    octagon(ctx,ink,-13,0,8);
    octagon(ctx,brass,-13,0,7);
    octagon(ctx,'#493286',-13,0,5);
    octagon(ctx,age<=1?'#e0a3ff':violet,-13,0,3);
    rect(ctx,white,-15+(age+24)%4,-3,2,3);
    const spread=age>=0?Math.max(0,3-Math.floor(age/2)):2;
    for(const side of [-1,1]){
      ctx.save();
      ctx.scale(1,side);
      pixels(ctx,ink,[[-12,-8],[-6,-7],[2,-5-spread],[4,-3-spread],[2,-1-spread],[-12,-3]]);
      pixels(ctx,grey,[[-11,-7],[-6,-6],[2,-4-spread],[3,-3-spread],[-3,-3-spread],[-11,-3]]);
      rect(ctx,silver,-10,-6,4,1);
      rect(ctx,age<4?'#e6b3ff':brass,-1,-4-spread,4,1);
      ctx.restore();
    }
    if(age<0)octagon(ctx,age===-1?white:amber,0,0,age===-1?3:2);
  }

  function ignition(ctx,age,heavy){
    if(age<0||age>=11)return;
    const color=heavy?'#c57aff':'#51dfff', spark=heavy?amber:'#9cedff';
    ctx.save();
    ctx.globalAlpha*=Math.min(1,(11-age)/7);
    const radius=(heavy?10:7)+age*2, reach=(heavy?23:17)+age*2;
    if(age<4){
      pixels(ctx,color,[[-5,0],[3,-5],[reach/2|0,-6],[reach,0],[reach/2|0,5],[3,5]]);
      pixels(ctx,white,[[0,0],[4,-3],[reach*.68|0,0],[5,3]]);
    }
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4+age*.07;
      const x=Math.cos(a)*radius*.55+age*1.5,y=Math.sin(a)*radius;
      rect(ctx,i%2?spark:color,x,y,i%2?3:2,2);
    }
    ctx.restore();
  }

  function rotatedMount([x,y],facing,pitch){
    x*=facing;
    return [x*Math.cos(pitch)-y*Math.sin(pitch),x*Math.sin(pitch)+y*Math.cos(pitch)];
  }

  function assembly(ctx,mount,port,open,elapsed,aimSide,angle,heavy){
    const [mx,my]=mount,[px,py]=port;
    const vx=aimSide*Math.cos(angle),vy=Math.sin(angle);
    const recoil=elapsed>0&&elapsed<7?Math.sin(elapsed*Math.PI/7)*(heavy?10:5):0;
    const x=mx+(px-mx)*open-vx*recoil,y=my+(py-my)*open-vy*recoil;
    const back=heavy?19:25,bx=x-vx*back,by=y-vy*back;
    ctx.save();
    ctx.translate(mx,my);
    ctx.rotate(Math.atan2(by-my,bx-mx));
    const length=Math.round(Math.hypot(bx-mx,by-my));
    if(!heavy&&length>=14){
      for(const side of [-1,1]){
        const dy=side*5;
        pixels(ctx,ink,[[-4,dy-3],[length+2,dy-4],[length+3,dy+3],[-4,dy+3]]);
        rect(ctx,slate,0,dy-2,length+2,4);
        rect(ctx,silver,Math.round(length*.38),dy-2,Math.round(length*.54),1);
      }
      octagon(ctx,ink,0,0,8);
      octagon(ctx,slate,0,0,6);
      octagon(ctx,brass,0,0,3);
      octagon(ctx,gunmetal,length,0,7);
      octagon(ctx,grey,length,0,3);
    }else{
      pixels(ctx,ink,[[-5,-6],[length+2,-5],[length+2,5],[-5,6]]);
      pixels(ctx,slate,[[-4,-4],[length+1,-3],[length+1,3],[-4,4]]);
      rect(ctx,silver,1,-3,Math.max(0,length-1),2);
      rect(ctx,brass,-4,-3,5,6);
    }
    ctx.restore();
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(aimSide,1);
    ctx.rotate(angle);
    const scale=1.65*(.58+.42*open);
    ctx.scale(scale,scale);
    if(heavy)heavyCannon(ctx,elapsed);
    else missilePod(ctx,elapsed);
    ctx.restore();
  }

  function weapon(ctx,age,{launch,mount,port,aim,flash=port},facing,pitch,heavy,visible){
    const open=opening(age,launch,launch+22);
    if(!open)return;
    const elapsed=age-launch;
    // Facing mirrors the bay. The weapon swivels to the shot's direction.
    const aimSide=aim[0]<0?-1:1;
    const bearing=Math.atan2(aim[1],Math.abs(aim[0]));
    if(visible){
      const angle=bearing+aimSide*(1-open)*(heavy ? .66 : -.54);
      assembly(ctx,rotatedMount(mount,facing,pitch),elapsed===0?flash:port,open,elapsed,aimSide,angle,heavy);
    }
    ctx.save();
    ctx.translate(...flash);
    ctx.scale(aimSide,1);
    ctx.rotate(bearing);
    ignition(ctx,elapsed,heavy);
    ctx.restore();
  }

  function drawPulse(ctx,port,facing,pitch){
    const [x,y]=rotatedMount(port,facing,pitch);
    if(Math.abs(pitch)>.04){
      for(let i=1;i<4;i++){
        const t=i/4;
        rect(ctx,i===1?white:'#70f5d6',x+(port[0]*facing+8-x)*t,y+(port[1]-y)*t,5-i,3);
      }
    }
    ArcadePlayerProjectiles.drawImpact(ctx,'greenLaser',x,y,1,8);
  }

  function draw(ctx,picture,p,tick,{id=p.id,y=p.y,climbSpeed=10.4,active=true,
    missileAge=Infinity,heavyAge=Infinity,missile,heavy,pulse,visible=true}={}){
    const facing=p.facing<0?-1:1;
    const pose=flightPose(p,tick,climbSpeed,active),pitch=pose.pitch*facing;
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    ctx.translate(Math.round(p.x),Math.round(y));
    if(visible){
      ctx.save();
      ctx.rotate(pitch);
      ctx.scale(facing*2,2);
      ctx.translate(-origin[0],-origin[1]);
      drawExhaust(ctx,tick,pose.boost);
      hull??=buildHull();
      ctx.drawImage(hull,0,0);
      drawPilot(ctx,picture,id,tick);
      ctx.restore();
      if(pulse)drawPulse(ctx,pulse,facing,pitch);
    }
    if(missile)weapon(ctx,missileAge,missile,facing,pitch,false,visible);
    if(heavy)weapon(ctx,heavyAge,heavy,facing,pitch,true,visible);
    ctx.restore();
  }

  // The Story special resolves on its authored line. Its launch trail stays
  // anchored at the firing position, including when the player changes lanes.
  function recordMissile(player,shot,tick,end){
    const trace={x:shot.x,y:shot.y,tick,end};
    missileTraces.set(player,trace);
    traceByShot.set(shot,trace);
  }

  function recordMissileHit(shot){
    const trace=traceByShot.get(shot);
    if(trace){
      trace.end=Math.max(trace.x,shot.x);
      trace.hit=true;
    }
  }

  function missileAge(player,tick){
    const trace=missileTraces.get(player);
    return trace?tick-trace.tick:Infinity;
  }

  function recordHeavyLaunch(player,{x,y},tick){
    heavyLaunches.set(player,{x,y,tick});
  }

  function storyFlash(player,tick,heavy=false){
    const launch=(heavy?heavyLaunches:missileTraces).get(player);
    const age=tick-launch?.tick;
    if(age>=0&&age<11)return [launch.x-Math.round(player.x),launch.y-Math.round(player.y)];
  }

  function drawMissileTrace(ctx,player,tick){
    const trace=missileTraces.get(player);
    if(!trace)return;
    const {x,y,end}=trace,age=tick-trace.tick;
    const distance=end-x;
    if(age<0||age>=22)return;
    const travel=Math.min(1,age/missileTravel);
    const tip=x+distance*travel;
    const spacing=Math.max(11,distance/35);
    for(let i=0,px=x;px<tip-12;i++,px+=spacing){
      const lag=age-(px-x)/distance*missileTravel;
      if(lag>14)continue;
      const py=y+Math.sin(i*1.4+lag*.18)*(2+lag*.46);
      const radius=Math.round(3+lag*.36),length=Math.round(spacing*.74);
      ctx.save();
      ctx.globalAlpha*=1-lag/15;
      rect(ctx,ink,px-1,py-radius,length+2,radius*2);
      rect(ctx,lag<4?'#68daff':'#3674c1',px,py-radius+1,length,radius*2-2);
      rect(ctx,lag<4?white:'#70d5f9',px+2,py-1,Math.max(2,length-4),2);
      ctx.restore();
    }
    if(age<=missileTravel)ArcadePlayerProjectiles.drawShot(ctx,'jetMissile',tip,y,0,0,age);
    if(trace.hit&&age>=missileTravel){
      ArcadePlayerProjectiles.drawImpact(ctx,'jetMissile',end,y,age-missileTravel,16);
    }
  }

  function recordHeavyHit(player,x,y,tick){
    heavyHits.set(player,{x,y,tick});
  }

  function recordHeavyBounce(player,x,y,tick){
    heavyBounces.set(player,{x,y,tick});
  }

  function drawEffects(ctx,player,tick){
    drawMissileTrace(ctx,player,tick);
    const hit=heavyHits.get(player);
    if(hit)ArcadePlayerProjectiles.drawImpact(ctx,'jetHeavy',hit.x,hit.y,tick-hit.tick,20);
    const bounce=heavyBounces.get(player);
    if(bounce&&bounce.tick!==hit?.tick)ArcadePlayerProjectiles.drawBlast(ctx,bounce.x,bounce.y,34,tick-bounce.tick,12,true,'jetHeavy');
  }

  return {draw,missileAge,storyFlash,recordMissile,recordMissileHit,recordHeavyLaunch,recordHeavyHit,recordHeavyBounce,drawEffects};
})();
