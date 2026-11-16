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
  const heavyHits=new WeakMap(),heavyBounces=new WeakMap();
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

  function drawExhaust(ctx,tick,dash){
    const reach=(dash?16:9)+Math.round(2*Math.sin(tick*.78))+tick%2;
    for(const y of [24,34]){
      pixels(ctx,'#274fb7',[[7,y-4],[7,y+4],[2,y+4],[-reach,y],[-2,y-2]]);
      pixels(ctx,'#31a8ff',[[7,y-3],[7,y+3],[1,y+3],[-reach+4,y],[-1,y-1]]);
      pixels(ctx,'#a4f6ff',[[7,y-2],[7,y+2],[2,y+2],[-reach+7,y]]);
      rect(ctx,white,4,y-1,3,2);
      rect(ctx,cyan,-reach-3,y+(tick%3)-1,2,1);
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
    const t=Math.min(1,(age+1)/(launch+1),(end-age)/7);
    return t*t*(3-2*t);
  }

  function muzzleFlare(ctx,x,y,color,age,size){
    const reach=size+age*2,fade=Math.max(0,1-age/7);
    ctx.save();
    ctx.globalAlpha*=fade;
    pixels(ctx,color,[[x-reach,y],[x-3,y-3],[x,y-reach],[x+3,y-3],[x+reach,y],[x+3,y+3],[x,y+reach],[x-3,y+3]]);
    rect(ctx,white,x-2,y-2,4,4);
    for(let i=0;i<3;i++)rect(ctx,cyan,x+reach+i*4,y+(i-1)*(4+age),3,2);
    ctx.restore();
  }

  function launcher(ctx,age,launch,mount,port,kind){
    const open=opening(age,launch,launch+16);
    if(!open)return;
    const [mx,my]=mount,[px,py]=port;
    const x=mx+(px-mx)*open,y=my+(py-my)*open;
    const charge=kind==='heavy'?violet:cyan;
    ctx.save();
    ctx.translate(mx,my);
    const reach=Math.hypot(x-mx,y-my);
    ctx.rotate(Math.atan2(y-my,x-mx));
    rect(ctx,ink,-6,-8,reach+9,16);
    rect(ctx,slate,-4,-6,reach+5,12);
    rect(ctx,silver,0,-5,reach,3);
    rect(ctx,gunmetal,0,2,reach+1,4);
    rect(ctx,brass,reach-9,-6,4,12);
    rect(ctx,charge,reach-4,-3,5,6);
    ctx.restore();
    if(age>=launch-2&&age<launch)rect(ctx,kind==='heavy'?amber:white,x-4,y-4,8,8);
    if(age>=launch&&age-launch<7)muzzleFlare(ctx,x,y,charge,age-launch,kind==='heavy'?11:8);
  }

  function draw(ctx,picture,p,tick,{missileAge=Infinity,heavyAge=Infinity,missile,heavy,visible=true}={}){
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    ctx.translate(Math.round(p.x),Math.round(p.y));
    if(visible){
      ctx.save();
      ctx.scale(p.facing<0?-2:2,2);
      ctx.translate(-origin[0],-origin[1]);
      drawExhaust(ctx,tick,p.dash);
      hull??=buildHull();
      ctx.drawImage(hull,0,0);
      drawPilot(ctx,picture,p.id,tick);
      ctx.restore();
    }
    if(missile)launcher(ctx,missileAge,missile.launch,missile.mount,missile.port,'missile');
    if(heavy)launcher(ctx,heavyAge,heavy.launch,heavy.mount,heavy.port,'heavy');
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

  function drawMissileTrace(ctx,player,tick){
    const trace=missileTraces.get(player);
    if(!trace)return;
    const {x,y,end}=trace,age=tick-trace.tick;
    const distance=end-x;
    if(age<0||age>=22)return;
    const travel=Math.min(1,age/missileTravel);
    const tip=x+distance*travel;
    ctx.save();
    ctx.globalAlpha*=Math.min(1,(22-age)/14);
    const span=tip-x;
    rect(ctx,ink,x,y-5,span,10);
    rect(ctx,'#2868bf',x,y-3,span,6);
    rect(ctx,'#81e9ff',x,y-1,span,2);
    for(let s=(age*17)%48;s<span;s+=48)rect(ctx,white,x+s,y-1,Math.min(17,span-s),2);
    ctx.restore();
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

  return {draw,missileAge,recordMissile,recordMissileHit,recordHeavyHit,recordHeavyBounce,drawEffects};
})();
