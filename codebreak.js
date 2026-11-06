'use strict';

const CODE_SCROLL=2.86, CODE_LOOP=14400;
const CODE_SPACING=120, CODE_ENTRY_Y=528;
const CODE_CENTERS=[260,440,625,808,988,805,620,433,245,405,570,410];
const CODE_SHOTS=[
  {name:'Shoulder missiles',frames:[42,57],sprite:0,speed:11,spread:[-.21,.21],size:[31,75]},
  {name:'Dorsal railguns',frames:[52],sprite:2,speed:20,spread:[-.12,.12],size:[32,125]},
  {name:'Rotary cannon',frames:[39,46,53,60,67],sprite:1,speed:15,spread:[0],size:[15,49]},
  {name:'Plasma cannon',frames:[52],sprite:3,speed:8,spread:[-.35,0,.35],size:[66,66]},
  {name:'Chest emitter',frames:[58],sprite:4,speed:23,spread:[0],size:[46,168]},
  {name:'Vertical ion laser',beam:'vertical',frames:[69],sprite:2},
  {name:'Horizontal heat laser',beam:'horizontal',frames:[69],sprite:4},
  {name:'Twin ion sweep',beam:'vertical',sweep:true,frames:[69],sprite:2},
  {name:'Twin heat sweep',beam:'horizontal',sweep:true,frames:[69],sprite:4}
];
const CODE_AIR_ATTACKS=[
  [0,2,5,1,3,6],
  [0,2,5,1,3,6],
  [7,0,2,5,1,3,6],
  [8,0,2,5,1,3,6]
];
const CODE_ARENA_ATTACK_COUNT=7;
const CODE_CHARACTER_SCALE=.56;
const CODE_MECHA_SCALE=.84;
const CODE_BEAM_WARNING=48, CODE_BEAM_DURATION=24, CODE_SWEEP_DURATION=94;
const CODE_THRUSTER_FEET=[[[100,314],[191,306]],[[100,312],[208,301]],[[104,313],[184,302]],[[108,313],[198,306]]];
const CODE_BOSS_HEIGHT=484*CODE_MECHA_SCALE;
const CODE_ATTACK_SIDES=[.22,.78,.22,.78];
let codeShots=[];
const isCodebreak=()=>Boolean(LEVELS[levelIndex]?.codebreak);
const isCodebreakClimb=()=>isCodebreak() && boss?.phase!==2;
const codeArt=(name)=>picture('art/codebreak/'+name);
const codeFrame=(group,index)=>codeArt(group+'-'+index+'.png');

function codebreakImages() {
  const images=[codeArt('shaft.webp'),codeArt('platform.png'),codeArt('arena.webp'),codeArt('head.png'),codeFrame('shot',4),codeArt('beam-vertical.png'),codeArt('beam-horizontal.png')];
  for (const group of ['fly','thrust','shot','wreck','attack0','attack1','attack2','attack3','attack4']) {
    for (let i=0;i<4;i++) images.push(codeFrame(group,i));
  }
  return images;
}

function codePlatform(row) {
  if (row%8===6) return null;
  const center=CODE_CENTERS[row%CODE_CENTERS.length];
  const width=row===0?384:row%5===0?238:290;
  return {x:center-width/2,width,y:CODE_ENTRY_Y-row*CODE_SPACING+camera};
}

function codebreakPlatformAt(x,from,to) {
  const row=Math.floor((CODE_ENTRY_Y+camera-from+1e-7)/CODE_SPACING);
  if (row<0 || row>CODE_LOOP/CODE_SPACING+4) return;
  const platform=codePlatform(row);
  if (platform && x>=platform.x && x<=platform.x+platform.width && to+1e-7>=platform.y) return platform;
}

function startCodebreak() {
  boss={name:'Bitcoin Sheriff',phase:1,x:270,y:640,hp:1,max:1,attackIndex:0,age:0,shift:0,wreck:0,aimX:260,aimY:350,shotRate:1,section:0};
  bullets=[];
  codeShots=[];
  hazards=[];
  impacts=[];
  sparks=[];
  player.y=CODE_ENTRY_Y;
  announce('CODEBREAK ASCENT · CLIMB OR FALL',110);
  showLevelControls();
}

function refreshCodebreakHud() {
  const climbing=boss.phase===1;
  ui.boss.firstElementChild.textContent='BITCOIN SHERIFF · PHASE '+boss.phase+'/2'+
    (climbing?' · '+(boss.section+1)+'/'+CODE_ATTACK_SIDES.length:'');
  ui.boss.querySelector('progress').value=climbing?clamp(camera/CODE_LOOP,0,1):boss.hp/boss.max;
  ui.cue.textContent=boss.wreck?'':boss.shift?'SUMMIT REACHED':time<110&&climbing?'JUMP TO THE NEXT PLATFORM':
    boss.age>19&&boss.age<attackForCodebreak().frames[0]?attackForCodebreak().name.toUpperCase():'';
}

function attackForCodebreak() {
  return CODE_SHOTS[boss.phase===1?CODE_AIR_ATTACKS[boss.section][boss.attackIndex]:boss.attackIndex];
}

function codeAttackMuzzle(sprite) {
  const b=boss;
  if (b.phase===1) {
    const offset=sprite===1?-48:sprite===2?56:0;
    const facing=b.section%2?-1:1;
    return [b.x+offset*facing*CODE_MECHA_SCALE,b.y-(sprite===0?289:265)*CODE_MECHA_SCALE];
  }
  const offsets=[[-42,420],[-84,390],[-132,280],[-144,215],[-54,273]];
  const [x,y]=offsets[b.attackIndex];
  return [b.x+x*CODE_MECHA_SCALE,FLOOR-y*CODE_MECHA_SCALE];
}

function updateCodeAttack() {
  const b=boss, attack=attackForCodebreak(), climbing=b.phase===1;
  b.age++;
  if (b.age===(climbing && !attack.beam?1:21)) {
    b.aimX=player.x;
    b.aimY=player.y-playerHeight()/2;
  }
  if (attack.beam) {
    const lanes=codeBeamLanes(attack);
    if (b.age===attack.frames[0]) sound(940,150,.26,.085);
    if (lanes.some(lane=>{const r=combatHitbox({x:lane.x,y:lane.y,w:lane.width,h:lane.height},'beams','codebreak.'+attack.beam);return lane.live && player.x+12>r.x && player.x-12<r.x+r.w &&
        player.y>r.y && player.y-playerHeight()<r.y+r.h;})) hurt();
  } else if (attack.frames.includes(b.age)) {
    const [x,y]=codeAttackMuzzle(attack.sprite);
    const direction=climbing?-Math.PI/2+clamp(SimMath.atan2(b.aimX-x,Math.max(90,y-b.aimY)),-1.28,1.28):
      Math.PI+clamp((y-b.aimY)/Math.max(200,x-b.aimX),-.61,.61);
    for (const spread of attack.spread) {
      const angle=direction+spread;
      codeShots.push(bindCombatWeapon({x,y,angle,vx:SimMath.cos(angle)*attack.speed,vy:SimMath.sin(angle)*attack.speed,attack}));
    }
    sound(attack.sprite===2?710:300,100,.11,.045);
  }
  const count=climbing?CODE_AIR_ATTACKS[b.section].length:CODE_ARENA_ATTACK_COUNT;
  if (b.age>=(climbing?230:151)-Math.floor((1-b.hp/b.max)*22)) {
    b.age=0;
    b.attackIndex=(b.attackIndex+1)%count;
  }
}

function codeBeamLanes(attack) {
  if (!attack.beam || boss.shift || boss.wreck) return [];
  const age=boss.age-attack.frames[0];
  const duration=attack.sweep?CODE_SWEEP_DURATION:CODE_BEAM_DURATION;
  if (age< -CODE_BEAM_WARNING || age>=duration) return [];
  const vertical=attack.beam==='vertical', thickness=vertical?64:42;
  let positions=[Math.round(vertical?boss.aimX:boss.aimY)];
  if (attack.sweep) {
    const limit=vertical?W:H;
    const progress=Math.max(0,age)/(duration-1);
    const sweep=vertical?progress:1-progress;
    const first=Math.round(limit*(.12+.44*sweep));
    positions=[first,first+Math.round(limit*.31)];
  }
  return positions.map(position=>({
    x:vertical?position-thickness/2:0,
    y:vertical?0:position-thickness/2,
    width:vertical?thickness:W,
    height:vertical?H:thickness,
    live:age>=0
  }));
}

function drawCodeBeam(attack) {
  for (const lane of codeBeamLanes(attack)) drawCodeBeamLane(attack,lane);
}

function drawCodeBeamLane(attack,lane) {
  const {x,y,width,height,live}=lane;
  const vertical=attack.beam==='vertical';
  ctx.save();
  ctx.translate(x,y);
  ctx.globalAlpha=live?.9+.1*SimMath.sin(time*1.3):.24+.18*SimMath.sin(time*.56);
  if (!vertical && (boss.phase===2 || boss.section%2)) {
    ctx.translate(width,0);
    ctx.scale(-1,1);
  }
  if(!globalThis.ArcadeBossSheets?.drawProjectile(ctx,12,{laser:true,source:'12-codebreak/summit-scanner',age:boss.age,vy:vertical?1:0},{x:0,y:0,w:width,h:height},{phaseIndex:boss.phase-1,variant:globalThis.ArcadeBossSheets.legacyVariant(boss,'codebreak'),tick:time}))ctx.drawImage(codeArt('beam-'+attack.beam+'.png'),0,0,width,height);
  if (!live) {
    ctx.globalAlpha=.82;
    ctx.fillStyle=vertical?'#ffcaef':'#fff0ab';
    for (let mark=time%24-24;mark<(vertical?height:width);mark+=24) {
      if (vertical) {
        ctx.fillRect(0,mark,3,14);
        ctx.fillRect(width-3,mark,3,14);
      } else {
        ctx.fillRect(mark,0,14,3);
        ctx.fillRect(mark,height-3,14,3);
      }
    }
  }
  ctx.restore();
}

function updateCodeShots() {
  for (const shot of codeShots) {
    shot.x+=shot.vx;
    shot.y+=shot.vy;
    const [width,length]=shot.attack.size;
    const radiusX=(Math.abs(SimMath.cos(shot.angle))*length+Math.abs(SimMath.sin(shot.angle))*width)*.34;
    const radiusY=(Math.abs(SimMath.sin(shot.angle))*length+Math.abs(SimMath.cos(shot.angle))*width)*.34;
    const key='code:'+shot.attack.sprite,profile=combatHitboxProfile('projectiles',key,shot);
    const r=profile?combatHitbox({x:shot.x-radiusX,y:shot.y-radiusY,w:radiusX*2,h:radiusY*2},'projectiles',key,shot):null;
    const contact=r?player.x+18*CODE_CHARACTER_SCALE>r.x&&player.x-18*CODE_CHARACTER_SCALE<r.x+r.w&&r.y+r.h>player.y-playerHeight()&&r.y<player.y:
      Math.abs(shot.x-player.x)<18*CODE_CHARACTER_SCALE+radiusX&&shot.y+radiusY>player.y-playerHeight()&&shot.y-radiusY<player.y;
    if (contact && !player.dash) {
      hurt();
      shot.spent=true;
    }
  }
  codeShots=codeShots.filter(s=>!s.spent && s.y>-160 && s.y<H+180 && s.x>-160 && s.x<W+160);
}

function startCodebreakArena() {
  boss.phase=2;
  boss.shift=0;
  boss.hp=boss.max=360;
  boss.x=1052;
  boss.y=FLOOR;
  boss.attackIndex=boss.age=0;
  Object.assign(player,{x:260,y:FLOOR,vy:0,grounded:true,airJump:true,airDash:true,dash:0,inv:70});
  showLevelControls();
  announce('BITCOIN SHERIFF · SIEGE MODE',105);
}

const CODE_PLAYER_WEAPONS={
  greenLaser:{speed:23,tracking:.32,damage:1},
  missile:{speed:16,tracking:.16,damage:2},
  bomb:{speed:12,tracking:.12,damage:4}
};

function codeTargetY() {
  return boss.y-(boss.phase===1?220:245)*CODE_MECHA_SCALE;
}

function fireCodeWeapon(shape) {
  const x=player.x, y=player.y-(player.crouch?74:101)*CODE_CHARACTER_SCALE;
  const angle=SimMath.atan2(codeTargetY()-y,boss.x-x);
  const {speed}=CODE_PLAYER_WEAPONS[shape];
  fire(x+SimMath.cos(angle)*26*CODE_CHARACTER_SCALE,y+SimMath.sin(angle)*26*CODE_CHARACTER_SCALE,
    SimMath.cos(angle)*speed,SimMath.sin(angle)*speed,shape,true);
}

function updateCodePlayerShots() {
  const targetY=codeTargetY();
  for (const shot of bullets) {
    const {speed,tracking,damage}=CODE_PLAYER_WEAPONS[shot.shape];
    const dx=boss.x-shot.x, dy=targetY-shot.y;
    const distance=SimMath.hypot(dx,dy)||1;
    shot.vx+=(dx/distance*speed-shot.vx)*tracking;
    shot.vy+=(dy/distance*speed-shot.vy)*tracking;
    shot.x+=shot.vx;
    shot.y+=shot.vy;
    if (SimMath.hypot(boss.x-shot.x,targetY-shot.y)<combatHitboxValue(40,'boss','damage','radius')) {
      if (boss.phase===2) hitBoss(shot,damage);
      else {
        shot.dead=true;
        impacts.push({...playerImpacts[shot.shape],x:shot.x,y:shot.y,age:0});
      }
    }
    if (++shot.age>145) shot.dead=true;
    if (!boss.hp) break;
  }
  bullets=bullets.filter(shot=>!shot.dead);
}

function updateCodebreak() {
  const b=boss,p=player;
  if (b.shift) {
    if (++b.shift===80) startCodebreakArena();
  } else if (b.wreck) {
    if (++b.wreck===115) clearLevel();
    return;
  } else if (b.phase===1) {
    const nextCamera=Math.min(CODE_LOOP,time*CODE_SCROLL);
    p.y+=nextCamera-camera;
    camera=nextCamera;
    movePlayer();
    const section=Math.min(CODE_ATTACK_SIDES.length-1,Math.floor(camera/CODE_LOOP*CODE_ATTACK_SIDES.length));
    if (section!==b.section) {
      b.age=0;
      b.attackIndex=0;
    }
    b.section=section;
    const sideX=W*CODE_ATTACK_SIDES[b.section];
    const targetX=sideX+SimMath.sin(time*.031)*54;
    b.x+=clamp((targetX-b.x)*.08,-10,10);
    const flightY=clamp(p.y+259,H-138,H-70)+SimMath.sin(time*.034)*5;
    b.y+=clamp((flightY-b.y)*.09,-10,10);
    if (time>110 && Math.abs(b.x-sideX)<100) updateCodeAttack();
    updateCodeShots();
    if (mode==='play') updateCodePlayerShots();
    if (mode==='play' && p.y>H+46) {
      p.hp=0;
      setOverlay('lost','Ascent failed','Signal lost','You fell into the code shaft.','Retry level');
    } else if (mode==='play' && camera>=CODE_LOOP) {
      b.shift=1;
      codeShots=[];
      bullets=[];
      sound(310,70,.45,.085);
    }
  } else {
    movePlayer();
    p.x=Math.min(p.x,b.x-200*CODE_MECHA_SCALE);
    updateCodeAttack();
    updateCodeShots();
    if (mode==='play') updateCodePlayerShots();
    if (!b.hp && mode==='play') {
      b.wreck=1;
      bullets=[];
      codeShots=[];
      sound(165,38,.65,.12);
    }
  }
  if (p.dash) p.dash--;
  if (banner && --banner===0) ui.notice.hidden=true;
  impacts=impacts.filter(effect=>++effect.age<effect.duration);
  sparks=sparks.filter(s=>--s.life>0);
  refreshHud();
}

function drawCodebreakBackground() {
  ctx.imageSmoothingEnabled=false;
  if (mode!=='title' && boss?.phase===2) {
    const arena=sceneryTile(['codebreak/arena.webp',.84],W);
    if (arena) {
      ctx.drawImage(arena,0,0);
      drawCodeServerMotion(arena);
    }
    return;
  }
  const shaft=codeArt('shaft.webp');
  if (!shaft.naturalWidth) return;
  const offset=(mode==='title'||mode==='won')?0:camera%CODE_LOOP;
  const bottom=H+offset;
  // Sample only the visible slice of the looping vertical panorama.
  const start=(CODE_LOOP-bottom%CODE_LOOP)%CODE_LOOP;
  const end=Math.min(CODE_LOOP,start+H);
  const first=end-start;
  const ratio=shaft.height/CODE_LOOP;
  ctx.drawImage(shaft,0,start*ratio,shaft.width,first*ratio,0,0,W,first);
  if (first<H) ctx.drawImage(shaft,0,0,shaft.width,(H-first)*ratio,0,first,W,H-first);
}

// Regions are measured on the 688 × 384 arena preview and follow the painted fixtures.
const CODE_SERVER_LIGHTS=[
  [537,47,9,27],[594,47,10,27],[558,97,19,10],
  [461,145,12,24],[480,131,13,61],[502,131,10,61],
  [498,251,12,26],[520,244,16,15],[415,136,16,31],
  [39,126,44,56],[55,190,39,31],[387,167,15,37]
];
const CODE_SERVER_DATA=[
  [552,143,36,38],[206,184,18,86],[285,184,18,86],
  [137,152,31,99],[317,151,29,84]
];
let codeLightTile, codeLightMasks;

function buildCodeLightMasks(arena) {
  const pixels=arena.getContext('2d');
  return [...CODE_SERVER_LIGHTS,...CODE_SERVER_DATA].map(([left,top,width,height])=>{
    const x=Math.round(left*W/688), y=Math.round(top*FLOOR/323);
    const w=Math.round(width*W/688), h=Math.round(height*FLOOR/323);
    const mask=document.createElement('canvas');
    mask.width=w;
    mask.height=h;
    const image=pixels.getImageData(x,y,w,h);
    const rgba=image.data;
    for (let i=0;i<rgba.length;i+=4) {
      const [r,g,b]=[rgba[i],rgba[i+1],rgba[i+2]];
      // Select the luminous green and cyan pixels already painted into the art.
      rgba[i+3]=Math.round(255*clamp((g-r-11)/55,0,1)*clamp((g-48)/94,0,1));
      rgba[i]=Math.min(255,r+28);
      rgba[i+1]=Math.min(255,g+75);
      rgba[i+2]=Math.min(255,b+60);
    }
    mask.getContext('2d').putImageData(image,0,0);
    return {mask,x,y,w,h};
  });
}

function drawCodeServerMotion(arena) {
  if (arena!==codeLightTile) {
    codeLightMasks=buildCodeLightMasks(arena);
    codeLightTile=arena;
  }
  ctx.save();
  ctx.globalCompositeOperation='screen';
  for (const [i,{mask,x,y,w,h}] of codeLightMasks.entries()) {
    if (i<CODE_SERVER_LIGHTS.length) {
      const pulse=.5+.5*SimMath.sin(time*.038+i*2.7);
      ctx.globalAlpha=.08+pulse*.28+Math.max(0,SimMath.sin(time*.16+i*4))**8*.09;
      ctx.drawImage(mask,x,y);
      continue;
    }
    const band=(Math.floor(time/(i%3+2))+i*23)%(h+20)-20;
    for (let offset=0;offset<20;offset+=2) {
      const row=band+offset;
      if (row<0 || row+2>h) continue;
      ctx.globalAlpha=.53*SimMath.sin(Math.PI*(offset+1)/20);
      ctx.drawImage(mask,0,row,w,2,x,y+row,w,2);
    }
  }
  ctx.restore();
}

function drawCodePlatforms() {
  const first=Math.max(0,Math.ceil((CODE_ENTRY_Y+camera-H)/CODE_SPACING));
  const last=Math.floor((CODE_ENTRY_Y+camera)/CODE_SPACING);
  for (let row=first;row<=last;row++) {
    const platform=codePlatform(row);
    if (!platform) continue;
    const {x,width}=platform, y=Math.round(platform.y);
    ctx.drawImage(codeArt('platform.png'),x,y,width,27);
  }
}

function drawCodeMecha(frame,x,y,height,facing=1) {
  const width=height*frame.width/frame.height;
  ctx.save();
  ctx.translate(Math.round(x),Math.round(y));
  ctx.scale(facing,1);
  ctx.drawImage(frame,-width/2,-height,width,height);
  ctx.restore();
}

function drawCodebreak() {
  if (boss.shift>=53) {
    ctx.fillStyle='#000';
    ctx.fillRect(0,0,W,H);
    return;
  }
  drawCodebreakBackground();
  const b=boss, attack=attackForCodebreak();
  const fireFrame=b.age>=attack.frames[0] && b.age<=attack.frames.at(-1)+(attack.sweep?CODE_SWEEP_DURATION-1:5);
  const frame=fireFrame?2:b.age>=20 && b.age<attack.frames[0]?1:b.age>attack.frames.at(-1)+5 && b.age<attack.frames.at(-1)+23?3:0;
  if (b.phase===1) {
    drawCodePlatforms();
    const pose=frame?attack.sprite===3?1:attack.sprite===2?3:attack.sprite===1?2:1:0;
    const facing=b.section%2?-1:1;
    for (const [index,[footX,footY]] of CODE_THRUSTER_FEET[pose].entries()) {
      const flame=codeFrame('thrust',(Math.floor(time/3)+index*2)%4);
      const width=28*CODE_MECHA_SCALE;
      const height=(53+7*SimMath.sin(time*.7+index))*CODE_MECHA_SCALE;
      const x=b.x+(footX-160)*CODE_MECHA_SCALE*facing;
      const y=b.y+(footY-320)*CODE_MECHA_SCALE;
      ctx.drawImage(flame,Math.round(x-width/2),Math.round(y),width,height);
    }
    if(!globalThis.ArcadeBossSheets?.drawBoss(ctx,12,0,{row:frame?1+globalThis.ArcadeBossSheets.legacyVariant(b,'codebreak'):0,column:frame||Math.floor(time/6)%4},{x:b.x-160*CODE_MECHA_SCALE,y:b.y-320*CODE_MECHA_SCALE,w:320*CODE_MECHA_SCALE,h:320*CODE_MECHA_SCALE,flip:facing<0}))drawCodeMecha(codeFrame('fly',pose),b.x,b.y,320*CODE_MECHA_SCALE,facing);
    if (!attack.beam && (frame===1 || fireFrame)) {
      const [x,y]=codeAttackMuzzle(attack.sprite);
      ctx.globalAlpha=fireFrame?.88:.3+SimMath.sin(time*.65)*.15;
      ctx.drawImage(codeFrame('shot',attack.sprite),x-15,y-36,30,38);
      ctx.globalAlpha=1;
    }
  } else {
    const wreckFrame=b.wreck?Math.min(3,Math.floor(b.wreck/13)):0;
    const sprite=b.wreck?codeFrame('wreck',wreckFrame):codeFrame('attack'+(attack.beam?4:b.attackIndex),frame);
    if(!globalThis.ArcadeBossSheets?.drawBoss(ctx,12,1,{row:frame?1+globalThis.ArcadeBossSheets.legacyVariant(b,'codebreak'):0,column:frame||Math.floor(time/6)%4},{x:b.x-CODE_BOSS_HEIGHT/2,y:FLOOR-CODE_BOSS_HEIGHT,w:CODE_BOSS_HEIGHT,h:CODE_BOSS_HEIGHT}))drawCodeMecha(sprite,b.x,FLOOR,CODE_BOSS_HEIGHT);
    if (b.wreck>=25) {
      const t=b.wreck-25;
      ctx.save();
      ctx.translate(b.x-55*CODE_MECHA_SCALE-t*10,FLOOR-400*CODE_MECHA_SCALE-t*10+t*t*.045);
      ctx.rotate(-t*.12);
      ctx.scale(CODE_MECHA_SCALE,CODE_MECHA_SCALE);
      ctx.drawImage(codeArt('head.png'),-49,-45,98,90);
      ctx.restore();
    }
  }
  drawCodeBeam(attack);
  drawGroundPlayer();
  for (const shot of codeShots) {
    const [w,h]=shot.attack.size;
    ctx.save();
    ctx.translate(shot.x,shot.y);
    ctx.rotate(shot.angle+Math.PI/2);
    if(!globalThis.ArcadeBossSheets?.drawProjectile(ctx,12,{original:shot,shape:String(shot.attack.sprite),age:shot.age},{x:-w/2,y:-h/2,w,h},{phaseIndex:boss.phase-1,tick:time,directionAngle:-Math.PI/2}))ctx.drawImage(codeFrame('shot',shot.attack.sprite),-w/2,-h/2,w,h);
    ctx.restore();
  }
  for (const shot of bullets) {
    const {art,scale=1}=boxes[shot.shape];
    const sprite=attackArt(art),w=sprite.width*scale,h=sprite.height*scale;
    ctx.save();
    ctx.translate(shot.x,shot.y);
    if (shot.shape!=='bomb') ctx.rotate(SimMath.atan2(shot.vy,shot.vx));
    ctx.drawImage(sprite,-w/2,-h/2,w,h);
    ctx.restore();
  }
  for (const impact of impacts) {
    const sprite=attackArt('player/higgsfield/'+impact.art);
    ctx.globalAlpha=impact.opacity*(1-impact.age/impact.duration);
    ctx.drawImage(sprite,impact.x-sprite.width/2,impact.y-sprite.height/2);
    ctx.globalAlpha=1;
  }
  if (b.shift) {
    const alpha=SimMath.sin(Math.PI*b.shift/53)*.83;
    ctx.fillStyle='rgba(109,255,176,'+alpha+')';
    ctx.fillRect(0,0,W,H);
  }
}
