/* Shared player projectile presentation for Story and Machine Trials. */
const ArcadePlayerProjectiles = (() => {
  'use strict';
  // Each ramp includes a dark edge for light backgrounds and a pale core for dark ones.
  const mint = ['#101d2d','#14666b','#24d791','#baff73','#f4fff0'];
  const plasma = ['#18152b','#285989','#26eac9','#9efff7','#f4ffff'];
  const rocket = ['#22172b','#843e50','#ff7145','#ffd769','#fff6d2','#4274a1','#92cef0','#e2f7ff'];
  const bomb = ['#221931','#6e439c','#ef75fe','#ffb94f','#fff4da'];
  const water = ['#101b35','#175b9d','#34c8ff','#a3f4ff','#f8ffff'];
  const red = ['#261226','#8f284d','#ff496b','#ffc3a6','#fff4e0'];
  const prism = ['#211434','#7051b7','#d78aff','#b5fdff','#fff4ff'];
  const jetBlue = ['#141d37','#3159a8','#42baff','#9bf1ff','#f3ffff','#4e6e93','#95bbdc','#deefff'];
  const jetViolet = ['#1e1536','#653baf','#bd63f6','#ffc76c','#fff4e6','#895667','#e9a754','#534974'];

  const bolt = [
    '    000000   ',
    '  001122230  ',
    ' 03334444330 ',
    '  002223330  ',
    '    000000   '
  ];
  const laser = [
    '        000000    ',
    ' 00000112223330   ',
    '02333344444444300 ',
    ' 00000223333330   ',
    '        000000    '
  ];
  const missile = [
    '   000      000     ',
    '  05500000006600    ',
    ' 0566655555666630   ',
    '0005566776766633300 ',
    '0231566667766334440 ',
    '0005555666665533300 ',
    ' 0555555555556630   ',
    '  05500000005500    ',
    '   000      000     '
  ];
  const mine = [
    '    00000    ',
    '   0111110   ',
    ' 00122332200 ',
    '0122344432210',
    '0123414123210',
    '0123344433210',
    '0112233322210',
    ' 00122222100 ',
    '  000000000  '
  ];
  const torpedo = [
    '  0000              ',
    ' 012210   000000    ',
    ' 0122100001223330   ',
    '011223332234444330  ',
    '0233444422223443330 ',
    '0112233322233332210 ',
    ' 0122100001222220   ',
    ' 012210   000000    ',
    '  0000              '
  ];
  const jetMissile = [
    '  000          ',
    '  06500   000  ',
    ' 0055660006700 ',
    '035667676676670',
    '024567777777740',
    '035556655664400',
    ' 0056650006700 ',
    '  06500   000  ',
    '  000          '
  ];
  const jetHeavy = [
    '   000000   ',
    '  06655660  ',
    ' 0672112760 ',
    '067123321760',
    '051234432150',
    '051244432150',
    '067123321760',
    ' 0672112760 ',
    '  06655660  ',
    '   000000   '
  ];
  const styles = {
    spark:{body:bolt,colors:mint,size:2,tail:35},
    greenLaser:{body:laser,colors:plasma,size:2,tail:54},
    redLaser:{body:laser,colors:red,size:3,tail:55},
    missile:{body:missile,colors:rocket,size:3,tail:76,impact:43},
    jetMissile:{body:jetMissile,colors:jetBlue,size:3,tail:98,impact:48},
    jetHeavy:{body:jetHeavy,colors:jetViolet,size:4,tail:49,rolling:true,impact:64},
    bomb:{body:mine,colors:bomb,size:4,tail:38,rolling:true,impact:56},
    beachBall:{body:mine,colors:bomb,size:4,tail:35,rolling:true,impact:52},
    boatTorpedo:{body:torpedo,colors:water,size:2,tail:57,impact:43},
    waterMine:{body:mine,colors:water,size:3,tail:36,rolling:true},
    mine:{body:mine,colors:mint,size:3,tail:34,rolling:true,impact:37},
    beam:{body:laser,colors:red,size:2,tail:70},
    prism:{body:laser,colors:prism,size:2,tail:70}
  };
  const radial = Array.from({length:12},(_,i)=>{
    const angle=i*Math.PI/6;
    return [Math.cos(angle),Math.sin(angle)];
  });
  const sprites = new WeakMap();

  function sprite(style) {
    let canvas=sprites.get(style);
    if (canvas) return canvas;
    canvas=document.createElement('canvas');
    canvas.width=style.body[0].length;
    canvas.height=style.body.length;
    const ctx=canvas.getContext('2d');
    for (const [y,row] of style.body.entries()) {
      for (let x=0;x<row.length;x++) {
        if (row[x]===' ') continue;
        ctx.fillStyle=style.colors[Number(row[x])];
        ctx.fillRect(x,y,1,1);
      }
    }
    sprites.set(style,canvas);
    return canvas;
  }

  function pixel(ctx,x,y,size,color,height=size) {
    ctx.fillStyle=color;
    ctx.fillRect(Math.round(x-size/2),Math.round(y-height/2),size,height);
  }

  function flare(ctx,x,y,size,colors) {
    pixel(ctx,x,y,size*3,colors[0],size);
    pixel(ctx,x,y,size,colors[0],size*3);
    pixel(ctx,x,y,size*2,colors[3],Math.max(1,size-2));
    pixel(ctx,x,y,Math.max(1,size-2),colors[4],size*2);
  }

  function trail(ctx,x,y,dx,dy,age,style) {
    // The core keeps its anchor while the exhaust breaks up behind it.
    for (let i=0;i<7;i++) {
      const t=(i+(age*0.44)%1)/7;
      const spread=((i+Math.floor(age/3))%3-1)*(3+8*t);
      const distance=12+style.tail*t, px=x-dx*distance-dy*spread, py=y-dy*distance+dx*spread;
      const size=Math.max(2,Math.round(style.size*(2-t)));
      pixel(ctx,px,py,size+2,style.colors[0]);
      pixel(ctx,px,py,size,style.colors[t<.32?3:t<.7?2:1]);
    }
  }

  function drawShot(ctx,kind,x,y,vx,vy,age,drawSprite) {
    const style=styles[kind]??styles.spark;
    const speed=Math.hypot(vx,vy),angle=speed?Math.atan2(vy,vx):0;
    const animation=Math.floor(age/2)%4,colors=style.colors;
    x=Math.round(x);
    y=Math.round(y);
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    if (speed>.1) trail(ctx,x,y,vx/speed,vy/speed,age,style);
    ctx.translate(x,y);
    if (!drawSprite?.()) {
      ctx.save();
      ctx.rotate(style.rolling?Math.trunc(age/2)*(vx<0?-1:1)*Math.PI/8:angle);
      const frame=sprite(style),w=frame.width*style.size,h=frame.height*style.size;
      if(kind==='missile'||kind==='jetMissile'){
        const jet=14+animation*3,base=-w/2+4;
        pixel(ctx,base-jet/2,0,jet+4,colors[0],12);
        pixel(ctx,base-jet/2,0,jet,colors[2],7);
        pixel(ctx,base-jet*.34,0,Math.round(jet*.68),colors[3],4);
        pixel(ctx,base-3,0,7,colors[4],2);
      }
      ctx.drawImage(frame,-Math.floor(w/2),-Math.floor(h/2),w,h);
      pixel(ctx,Math.round(w*(.19-animation*.073)),0,style.size*2,colors[4],style.size);
      ctx.restore();
    }
    if (style.rolling || kind==='boatTorpedo') {
      const [dx,dy]=radial[Math.floor(age/2)%radial.length];
      flare(ctx,dx*(kind==='beachBall'?22:14),dy*12,2,colors);
      if(kind==='jetHeavy'){
        flare(ctx,dx*26,dy*23,3,colors);
        pixel(ctx,-dx*26,-dy*23,4,colors[2]);
      }
    }
    ctx.restore();
  }

  function drawBeam(ctx,x,y,width,height,age) {
    if (width<=0 || height<=0) return;
    x=Math.round(x);
    y=Math.round(y);
    const band=Math.max(1,Math.round(height*.35)),core=Math.max(1,Math.round(height*.14));
    ctx.save();
    pixel(ctx,x+width/2,y,width,red[0],height);
    pixel(ctx,x+width/2,y,width,red[1],Math.max(1,height-4));
    pixel(ctx,x+width/2,y,width,red[2],band+2);
    pixel(ctx,x+width/2,y,width,red[3],core);
    for (let step=(age*12)%52;step<width;step+=52) {
      const w=Math.min(21,width-step);
      pixel(ctx,x+step+w/2,y,w,red[4],core);
      pixel(ctx,x+step+2,y-band*.9,Math.min(4,w),red[2],2);
    }
    flare(ctx,x+4,y,4,red);
    ctx.restore();
  }

  function drawBurst(ctx,x,y,age,duration,radius,colors,grounded=false) {
    const t=age/duration;
    if (t<0 || t>=1) return;
    const expansion=t*(2-t);
    ctx.save();
    ctx.globalAlpha*=Math.min(1,(1-t)*3.2);
    if(t<.46){
      const core=Math.max(2,Math.round((1-t/.46)*radius*.27));
      pixel(ctx,x,y,core*3,colors[0],core+6);
      pixel(ctx,x,y,core*2+2,colors[2],core+2);
      pixel(ctx,x,y,core+2,colors[3],core*2);
      flare(ctx,x,y,Math.max(2,Math.round(core*.65)),colors);
    }
    for (let i=0;i<radial.length;i++) {
      const [dx,angleY]=radial[i],dy=grounded?-Math.abs(angleY)*.55:angleY;
      const r=radius*expansion*(.55+((i*7)%11)*.045);
      const px=x+dx*r,py=y+dy*r+(grounded?0:(i%3-1)*t*7);
      const size=Math.max(2,Math.round((1-t)*(i%3===0?5:9)));
      const w=size+(i%2===0?4:2),h=size+(i%2===0?1:4);
      pixel(ctx,px,py,w+3,colors[0],h+3);
      pixel(ctx,px,py,w,colors[i%3===0?2:3],h);
      if (t<.65) pixel(ctx,px-dx*2,py-dy*2,Math.max(1,w-4),colors[4],Math.max(1,h-4));
      if (t>.2) {
        pixel(ctx,px+dx*5,py+dy*5,2,i%2===0?colors[2]:colors[3]);
        if (i%2===0) pixel(ctx,x+dx*r*.63,y+dy*r*.63,2,colors[2]);
      }
    }
    ctx.restore();
  }

  function drawImpact(ctx,kind,x,y,age,duration) {
    const style=styles[kind]??styles.spark;
    if(kind==='jetHeavy'){
      drawBlast(ctx,x,y,style.impact,age,duration,false,kind);
      return;
    }
    drawBurst(ctx,x,y,age,duration,style.impact??29,style.colors);
  }

  function drawBlast(ctx,x,y,radius,age,duration,grounded=false,kind=null) {
    const t=age/duration;
    if (t<0 || t>=1) return;
    const colors=styles[kind]?.colors??(grounded?bomb:mint);
    drawBurst(ctx,x,y-(grounded?9:0),age,duration,grounded?Math.min(76,radius):radius,colors,grounded);
    const ring=radius*(.27+.73*t*(2-t));
    ctx.save();
    ctx.globalAlpha*=Math.min(grounded?.78:1,(1-t)*2.5);
    for (const [i,[dx,dy]] of radial.entries()) {
      const px=x+dx*ring,py=y+dy*ring*(grounded?.18:1);
      if(grounded&&dy>.001)continue;
      const w=Math.max(4,Math.round(radius*.09*(1-t)));
      pixel(ctx,px,py,w+3,colors[0],6);
      pixel(ctx,px,py,w,colors[i%2===0?3:2],3);
      if(kind==='jetHeavy'){
        pixel(ctx,px-dx*7,py-dy*7,w*.66,colors[2],2);
        pixel(ctx,px+dx*5,py+dy*5,3,colors[4],2);
      }
    }
    ctx.restore();
  }

  function drawSplash(ctx,x,y,age,duration) {
    const t=age/duration;
    if (t<0 || t>=1) return;
    ctx.save();
    ctx.globalAlpha*=Math.min(1,(1-t)*3);
    const width=14+Math.round(t*112),foamY=y+Math.round(t*4);
    pixel(ctx,x,foamY,width,water[0],7);
    pixel(ctx,x,foamY,width-4,water[1],4);
    for (let i=-3;i<=3;i++) {
      const foam=x+i*width/7,crest=foamY-(i%2===0?3:1);
      pixel(ctx,foam,crest,Math.max(2,Math.round(width/9)),water[2],3);
      if (i%2===0) pixel(ctx,foam+2,crest-1,Math.max(2,Math.round(width/15)),water[4],2);
    }
    for (let i=-4;i<=4;i++) {
      const drift=i*(2+11*t)+(i%2===0?0:5*t);
      const lift=(1-t)*t*(161-12*Math.abs(i)+i%3*9)+4;
      const size=Math.max(2,Math.round((1-t)*7));
      pixel(ctx,x+drift,y-lift,size+3,water[0],size+5);
      pixel(ctx,x+drift,y-lift,size,water[i%2===0?4:3],size+2);
      if (t>.22 && i%2===0) pixel(ctx,x+drift+6,y-lift*.64,3,water[2],2);
    }
    ctx.restore();
  }

  return {drawShot,drawBeam,drawImpact,drawBlast,drawSplash};
})();
