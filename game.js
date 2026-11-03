'use strict';

const W = 1280, H = 720, FLOOR = 604, PANORAMA_WIDTH = 2176;
const COURSE_LENGTH = PANORAMA_WIDTH * 2 + 280;
const requestedLevel = Number(new URLSearchParams(location.search).get('level'));
const firstLevel = Math.max(0,LEVELS.findIndex(level=>level.id===requestedLevel));
const bossLevels = new Map([[0,0],[3,1],[6,2],[9,3]]);
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const ui = Object.fromEntries(['hearts','count','location','boss','cue','dash','missile-status','bomb-status','notice','eyebrow','title','description','start'].map(id => [id, document.getElementById(id)]));
const hud = document.querySelector('.hud'), overlay = document.querySelector('.overlay');
const levelSelect = document.getElementById('level-select');
for (const [index,level] of LEVELS.entries()) {
  levelSelect.add(new Option(String(index+1).padStart(2,'0')+' · '+level.title,index));
}
levelSelect.value = String(firstLevel);
const pictures = new Map(), keys = new Set(), pressed = new Set();
const acts = [
  {id:'bront',name:'Fat Head Dave',tag:'The Breakwater',hp:146,color:'#ff855e',moves:['quake','slabs','eruption','rush','drop']},
  {id:'zephyr',name:'Halloween 2008',tag:'The Lantern King',hp:167,color:'#ffbf5b',moves:['rain','ricochet','eruption','sweep','drop']},
  {id:'bigswole',name:'Big Swole',tag:'The Walking Wall',hp:185,color:'#87d7ff',moves:['rush','drop','crossfire','eruption','quake']},
  {id:'sprotosales',name:'Bot Sales',tag:'The Final Pitch',hp:203,color:'#efa7ff',moves:['fan','rift','crossfire','ricochet','drop']}
];
const moves = {
  quake:{name:'Floor shock',tip:'Jump',tell:28,active:38,rest:31},
  slabs:{name:'High and low',tip:'Duck, then jump',tell:34,active:57,rest:26},
  rush:{name:'Shoulder charge',tip:'Dash left to get clear',tell:37,active:29,rest:33},
  rain:{name:'Lantern drop',tip:'Leave the marked lanes',tell:38,active:52,rest:29},
  ricochet:{name:'Wild bounce',tip:'Watch the arcs',tell:26,active:49,rest:28},
  sweep:{name:'Low sweep',tip:'Jump the wave',tell:31,active:44,rest:27},
  fan:{name:'Rift volley',tip:'Find a gap',tell:28,active:56,rest:29},
  drop:{name:'Colossal leap',tip:'Clear the landing lane, then jump',tell:34,active:45,rest:32},
  crossfire:{name:'Crossfire',tip:'Jump or dash through a gap',tell:34,active:61,rest:31},
  eruption:{name:'Floor eruption',tip:'Leave the marked floor',tell:37,active:48,rest:28},
  rift:{name:'Rift pillars',tip:'Find clear floor',tell:42,active:36,rest:26}
};
const MAX_HP=5;
const BOSS_HOME=1010, BOSS_MIN=798, BOSS_MAX=1070, BOSS_FRONT=205;
const MISSILE_COOLDOWN=120, BOMB_COOLDOWN=180;
const boxes = {
  spark:{w:23,h:8,color:'#ffde65',art:'player/spit'},
  missile:{w:27,h:13,color:'#6aebff',art:'player/missile'},
  bomb:{w:23,h:23,color:'#99fb92',art:'player/bomb'},
  boulder:{w:33,h:30,color:'#ff9356',art:'boss/ground-shot'},
  prism:{w:35,h:13,color:'#ff6884',art:'boss/high-shot'},
  pumpkin:{w:25,h:25,color:'#ffba58',art:'boss/bounce-shot'},
  orb:{w:19,h:19,color:'#f3a1ff',art:'boss/spread-shot'}
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const active = (...codes) => codes.some(code => keys.has(code));
const tapped = (...codes) => codes.some(code => pressed.has(code));
const controls = new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Space','KeyC','KeyV','ShiftLeft','ShiftRight','Escape']);
let mode = 'loading', player, boss, bullets, sparks, hazards, camera, time, banner, audio, act, transition, shake, levelIndex, foes, panoramaTiles;

function picture(path) {
  if (!pictures.has(path)) {
    const image = new Image();
    image.src = path;
    pictures.set(path, image);
  }
  return pictures.get(path);
}

function drawBackground() {
  const tile = panoramaTiles[levelIndex];
  const first = Math.floor(camera/PANORAMA_WIDTH);
  const last = Math.floor((camera+W)/PANORAMA_WIDTH);
  for (let i=first;i<=last;i++) {
    const reversed = i%2!==0;
    ctx.save();
    ctx.translate(i*PANORAMA_WIDTH-Math.round(camera)+(reversed?PANORAMA_WIDTH:0),0);
    ctx.scale(reversed?-1:1,1);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(tile,0,0);
    ctx.restore();
  }
}
function drawShade() {
  const shade = ctx.createLinearGradient(0, H - 108, 0, H);
  shade.addColorStop(0, '#100b1600');
  shade.addColorStop(1, '#100b16aa');
  ctx.fillStyle = shade;
  ctx.fillRect(0, H - 108, W, 108);
}

function sprite(id, frame, x, y, facing, scale = 1) {
  const [path, anchorX, anchorY] = frame ?? ART.sprites[id].poses[0];
  const image = picture(path);
  if (!image.naturalWidth) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.imageSmoothingEnabled=false;
  ctx.scale(facing * scale, scale);
  ctx.drawImage(image, -anchorX, -anchorY);
  ctx.restore();
}

function walk(id, distance) {
  const art = ART.sprites[id];
  const loop = art.walk.length ? art.walk : [art.poses[2],art.poses[3],art.poses[4],art.poses[5]];
  const step=Math.floor(distance/12);
  return loop[((step%loop.length)+loop.length)%loop.length];
}

function sound(freq, end, length, volume = .04) {
  if (!audio || audio.state !== 'running') return;
  const oscillator = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(freq, now);
  oscillator.frequency.exponentialRampToValueAtTime(end, now + length);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(.001, now + length);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + length);
}

function announce(message, frames = 110) {
  banner = frames;
  ui.notice.textContent = message;
  ui.notice.hidden = false;
}

function setOverlay(next, label, title, description, button) {
  mode = next;
  overlay.hidden = next === 'play';
  levelSelect.parentElement.hidden = next!=='title' && next!=='won';
  ui.eyebrow.textContent = label;
  ui.title.textContent = title;
  ui.description.textContent = description;
  ui.start.textContent = button;
  if (!overlay.hidden) ui.start.focus();
}

function begin(index = firstLevel, retryBoss = false) {
  levelIndex = index;
  levelSelect.value = String(index);
  document.title = LEVELS[index].title + ' • Sproto Arcade';
  act = bossLevels.get(index);
  time = 0;
  camera = retryBoss ? COURSE_LENGTH : 0;
  shake = 0;
  transition = 0;
  player = {x:260,y:FLOOR,vx:0,vy:0,hp:MAX_HP,inv:0,
    grounded:true,crouch:false,dash:0,dashWait:0,airDash:true,shot:0,distance:0,jumpBuffer:0,missileWait:0,bombWait:0};
  boss = null;
  foes = Array.from({length:9},(_,i)=>({
    id:i%3===2?'rune':i%2?'mox':'zephyr',x:630+i*480,y:i%3===2?FLOOR-132:FLOOR,
    hp:i%3===2?2:3,flash:0,distance:0,cooldown:55+i%3*19
  }));
  bullets = [];
  sparks = [];
  hazards = [];
  hud.hidden = false;
  setOverlay('play','','','','');
  if (retryBoss) startBoss();
  else announce(LEVELS[index].title,100);
  refreshHud();
}

function startBoss() {
  const kit = acts[act];
  boss = {...kit,x:BOSS_HOME,y:FLOOR,hp:kit.hp,max:kit.hp,scale:kit.id==='sprotosales'?4.65:4.40,
    phase:1,step:0,age:0,move:null,flash:0,lanes:[],startX:BOSS_HOME,distance:0,moving:false};
  player.hp=MAX_HP;
  player.inv=35;
  bullets=[];
  hazards=[];
  sparks=[];
  foes=[];
  announce(kit.name + '  •  ' + kit.tag,100);
}

function clearLevel() {
  if (levelIndex+1===LEVELS.length) {
    levelSelect.value=String(firstLevel);
    setOverlay('won','Campaign clear','That’s all, Sproto!','The last giant is down.','Play again');
  } else {
    setOverlay('clear','Level clear',LEVELS[levelIndex].title,'Next up: '+LEVELS[levelIndex+1].title,'Next level');
  }
}

function refreshHud() {
  ui.hearts.textContent = '♥'.repeat(player.hp) + '♡'.repeat(MAX_HP-player.hp);
  ui.count.textContent = 'LEVEL ' + (levelIndex+1) + ' / ' + LEVELS.length;
  ui.location.textContent = LEVELS[levelIndex].title;
  ui.boss.hidden = !boss;
  if (boss) {
    ui.boss.firstElementChild.textContent = boss.name + '  ·  PHASE ' + boss.phase + ' / 3';
    ui.boss.querySelector('progress').value = boss.hp/boss.max;
  }
  ui.dash.textContent=player.dashWait?'DASH RECHARGING':'DASH READY';
  ui.dash.classList.toggle('ready',!player.dashWait);
  showCooldown(ui['missile-status'],player.missileWait);
  showCooldown(ui['bomb-status'],player.bombWait);
  const m = boss?.move && moves[boss.move];
  const message = !boss?.hp || !m ? (!boss ? Math.min(100,Math.floor(camera/COURSE_LENGTH*100))+'% explored  ·  Keep moving →' : '') : boss.age <= m.tell ? m.name + '  ·  ' + m.tip :
    boss.age > m.tell+m.active ? 'EXPOSED  ·  Jump to hit the weak spot' : '';
  if (ui.cue.textContent!==message) ui.cue.textContent=message;
}

function showCooldown(label,frames) {
  const text=frames?(Math.ceil(frames/6)/10).toFixed(1)+'s':'Ready';
  if (label.textContent!==text) label.textContent=text;
}

function puff(x,y,color,count=9) {
  for (let i=0;i<count;i++) {
    const angle=i/count*Math.PI*2, speed=2+Math.random()*8;
    sparks.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:18,color});
  }
}

function hurt(contact = false) {
  if (player.inv || (!contact && player.dash) || !player.hp) return;
  player.hp--;
  player.inv=71;
  shake=12;
  puff(player.x,player.y-58,'#fff0cc',15);
  sound(135,47,.21,.11);
  if (!player.hp) setOverlay('lost','Knockout','Down for the count!',boss ? boss.name + ' wins this round.' : 'Try the stage again.', boss ? 'Rematch boss' : 'Retry level');
}

function fire(x,y,vx,vy,shape,own,gravity=0,bounces=0,laser=false) {
  bullets.push({x,y,vx,vy,shape,own,gravity,bounces,laser,age:0});
}

function movePlayer() {
  const p=player;
  if (p.inv) p.inv--;
  if (p.dashWait) p.dashWait--;
  if (p.missileWait) p.missileWait--;
  if (p.bombWait) p.bombWait--;
  if (p.jumpBuffer) p.jumpBuffer--;
  if (tapped('Space','ArrowUp','KeyW')) p.jumpBuffer=7;
  const dx=Number(active('ArrowRight','KeyD'))-Number(active('ArrowLeft','KeyA'));
  p.crouch=active('ArrowDown','KeyS') && p.grounded && !p.dash;
  if (p.jumpBuffer && p.grounded && !p.dash) {
    p.jumpBuffer=0;
    p.grounded=false;
    p.crouch=false;
    p.vy=-18.3;
    puff(p.x,p.y,'#efe3c8',5);
    sound(195,400,.12);
  }
  if (!p.dashWait && (p.grounded || p.airDash) && tapped('ShiftLeft','ShiftRight')) {
    p.dash=11;
    p.dashDir=dx || 1;
    p.dashWait=24;
    p.airDash=false;
    p.crouch=false;
    sound(470,155,.13);
  }
  const target=dx*(p.crouch?3.8:11.6);
  p.vx += (target-p.vx)*(dx?.63:.76);
  const prevX=p.x;
  p.x=clamp(p.x+(p.dash?p.dashDir*25:p.vx),58,W-58);
  p.distance+=p.x-prevX;
  if (!boss) {
    const scroll = Math.max(0,p.x-455);
    p.x-=scroll;
    camera+=scroll;
    for (const object of [...bullets,...sparks,...hazards]) object.x-=scroll;
  }
  if (p.dash) {
    if (time%2===0) puff(p.x,p.y-52,'#f6c774',4);
  } else if (!p.grounded) {
    const released=!active('Space','ArrowUp','KeyW');
    p.vy += released && p.vy<0 ? 1.28 : .94;
    p.y+=p.vy;
    if (p.y>=FLOOR) {
      p.y=FLOOR;
      p.vy=0;
      p.grounded=true;
      p.airDash=true;
      puff(p.x,p.y,'#efe3c8',6);
    }
  }
  p.shot=(p.shot+1)%9;
  if (p.shot===1) {
    const y=p.y-(p.crouch?74:109);
    fire(p.x+44,y,25,0,'spark',true);
    if (time%18<9) sound(500,250,.047,.019);
  }
  if ((!boss || boss.hp) && !p.missileWait && tapped('KeyC')) {
    p.missileWait=MISSILE_COOLDOWN;
    fire(p.x+30,p.y-88,12,-5,'missile',true);
    sound(590,860,.075,.025);
  }
  if ((!boss || boss.hp) && !p.bombWait && tapped('KeyV')) {
    p.bombWait=BOMB_COOLDOWN;
    fire(p.x,p.y-103,5,-14,'bomb',true,.46);
    sound(260,430,.10,.035);
  }
}

function startMove() {
  const b=boss;
  const order=b.moves;
  b.move=order[b.step++%order.length];
  if (b.phase===3 && b.step%3===0) b.move=act===3?'rift':order[2];
  b.age=0;
  b.startX=b.x;
  const center=clamp(player.x+player.vx*6,110,W-110);
  b.lanes=b.move==='rain' ? [center,clamp(center-180,85,W-85),clamp(center+180,85,W-85)] :
    b.move==='rift' ? [center,clamp(center-242,90,W-90)] :
    b.move==='eruption' ? [center,clamp(center-175,85,W-85)] :
    b.move==='drop' ? [clamp(center+125,BOSS_MIN,BOSS_MAX)] : [];
  if ((b.move==='rift' || b.move==='eruption') && b.phase>=2) b.lanes.push(clamp(center+235,90,W-90));
  b.lanes=b.lanes.filter((lane,i,lanes)=>!lanes.slice(0,i).some(other=>Math.abs(other-lane)<73));
  sound(196,125,.14,.045);
}

function attackBoss(t) {
  const b=boss, x=b.x-146, hard=b.phase>=2;
  const speedFactor=1+act*.08;
  const shot=(y,speed,shape,vy=0,gravity=0,bounces=0)=>fire(x,y,-speed*speedFactor,vy,shape,false,gravity,bounces);
  switch (b.move) {
    case 'quake':
    case 'sweep':
      if (t===0 || (t===24 && (hard || b.move==='sweep'))) {
        for (const dir of [-1,1]) fire(b.x,FLOOR-24,dir*(b.move==='sweep'?15.3:12.8),0,'boulder',false);
        shake=10;
        puff(b.x,FLOOR,b.color,20);
        sound(102,42,.22,.10);
      }
      break;
    case 'slabs':
      if (t===0 || (b.phase===3 && t===39)) shot(FLOOR-99,13,'prism');
      if (t===19 || (hard && t===44)) shot(FLOOR-25,14.6,'boulder');
      break;
    case 'rush': {
      b.x=Math.max(BOSS_MIN,b.startX-(t+1)*(hard?15:12));
      if (t%4===0) puff(b.x,FLOOR-30,b.color,4);
      break;
    }
    case 'drop': {
      const f=Math.min(1,(t+1)/32);
      b.x=b.startX+(b.lanes[0]-b.startX)*f;
      b.y=FLOOR-Math.sin(Math.PI*f)*187;
      if (t===31) {
        for (const dir of [-1,1]) fire(b.x,FLOOR-21,dir*(12+act),0,'boulder',false);
        puff(b.x,FLOOR,b.color,24);
        shake=15;
        sound(97,38,.23,.11);
      }
      break;
    }
    case 'crossfire':
      if (t%12===0) {
        const right=t%24===0;
        const low=t%24===0 || (b.phase===3 && t===36);
        const y=FLOOR-(low?23:99);
        fire(right?W-4:4,y,(right?-1:1)*(12+act),0,low?'boulder':'prism',false,0,0,!low);
      }
      break;
    case 'rain':
      for (const [i,lane] of b.lanes.entries()) if (t===i*8) fire(lane,-20,0,9.5,'pumpkin',false,.21);
      if (t===27 || (hard && t===46)) shot(FLOOR-22,hard?13:11.4,'pumpkin');
      break;
    case 'ricochet':
      if (t===0 || t===15 || t===29 || (hard && t===42)) {
        shot(FLOOR-151,8.4+(t%3), 'pumpkin',-5.7,.30,2);
      }
      break;
    case 'fan':
      if (t===0 || (hard && t===27) || (b.phase===3 && t===47)) {
        const aim=Math.atan2(player.y-60-(FLOOR-184),Math.min(-90,player.x-x));
        const angles=t===0 ? [-.48,-.24,.24,.48] : b.phase===3 ? [-.55,-.27,0,.27,.55] : [-.34,0,.34];
        for (const delta of angles) fire(x,FLOOR-184,Math.cos(aim+delta)*10.7,Math.sin(aim+delta)*10.7,'orb',false);
      }
      break;
    case 'rift':
    case 'eruption': {
      const rift=b.move==='rift';
      for (const [i,x] of b.lanes.entries()) {
        if (t===i*(rift?6:9)) {
          hazards.push({x,w:rift?84:65,height:rift?384:190+act*28,age:0});
          sound(rift?380:138,65,.21,.07);
        }
      }
      if (t===28 && (rift || hard)) shot(FLOOR-99,12,'prism');
      break;
    }
  }
}

const playerHeight=()=>player.crouch?72:110;

function updateBoss() {
  const b=boss;
  if (b.flash) b.flash--;
  const phase=b.hp>b.max*.68?1:b.hp>b.max*.34?2:3;
  if (phase!==b.phase) {
    b.phase=phase;
    announce(phase===3?'Final phase!':'The giant picks up the pace!',65);
    sound(220,640,.19,.06);
  }
  if (!b.move) {
    if (++b.age>=36) startMove();
    return;
  }
  const m=moves[b.move], t=b.age-m.tell;
  if (t>=0 && t<m.active) attackBoss(t);
  if (t>=m.active) {
    b.x+=clamp(BOSS_HOME-b.x,-8,8);
  }
  if (++b.age >= m.tell+m.active+Math.max(9,m.rest-(b.phase-1)*7-act*4)) startMove();
}

function keepPlayerLeft() {
  const p=player, front=boss.x-BOSS_FRONT;
  if (p.x<front) return;
  if (boss.hp && p.y-playerHeight()<boss.y && p.y>boss.y-110*boss.scale) {
    hurt(true);
    p.x=front-32;
    p.vx=-7;
    p.dash=0;
  } else {
    p.x=front;
    p.vx=Math.min(0,p.vx);
  }
}

function defeatBoss() {
  bullets = bullets.filter(b=>b.own);
  hazards=[];
  shake=22;
  transition=108;
  puff(boss.x,FLOOR-230,boss.color,50);
  sound(235,900,.4,.095);
  announce('KNOCKOUT!',100);
}

function boxBlast(shot) {
  shot.dead=true;
  hazards.push({x:shot.x,y:shot.y,w:152,height:152,age:0,blast:true});
  puff(shot.x,shot.y,boxes.bomb.color,14);
  sound(170,72,.15,.05);
}

function steer(shot) {
  const target = boss?.hp ? boss : !boss ? foes.find(e=>e.hp && e.x-camera>20 && e.x-camera<W+140) : null;
  if (!target) return;
  const dx=target.x-(boss?0:camera)-shot.x;
  if (shot.shape==='missile') {
    const dy=target.y-(boss?175:70)-shot.y, length=Math.hypot(dx,dy)||1;
    shot.vx+=(dx/length*18-shot.vx)*.15;
    shot.vy+=(dy/length*18-shot.vy)*.15;
  } else if (shot.shape==='bomb') {
    shot.vx+=(clamp(dx*.09,-16,16)-shot.vx)*.16;
  }
}

function updateFoes() {
  for (const e of foes) {
    const x=e.x-camera;
    if (!e.hp || x<-80 || x>W+80) continue;
    if (e.flash) e.flash--;
    const direction = x > player.x ? -1 : 1;
    if (e.id==='rune') e.y=FLOOR-125+Math.sin(time*.065+e.x)*32;
    else {
      e.x+=direction*1.55;
      e.distance+=1.55;
    }
    if (--e.cooldown<=0) {
      e.cooldown=108;
      const dy=player.y-75-(e.y-70);
      fire(x,e.y-70,direction*8,clamp(dy/85,-4,4),'orb',false);
    }
    if (Math.abs(x-player.x)<32 && player.y>e.y-93 && player.y-playerHeight()<e.y) hurt();
  }
}

function hitFoe(foe,damage,shot) {
  foe.hp=Math.max(0,foe.hp-damage);
  foe.flash=5;
  puff(foe.x-camera,shot.y,boxes[shot.shape].color,foe.hp?5:12);
}

function updateBullets() {
  const p=player,b=boss;
  for (const shot of bullets) {
    if (shot.dead) continue;
    shot.age++;
    if (shot.own && shot.shape!=='spark') steer(shot);
    shot.x+=shot.vx;
    shot.y+=shot.vy;
    shot.vy+=shot.gravity;
    if (shot.y>FLOOR-13 && shot.bounces>0) {
      shot.y=FLOOR-13;
      shot.vy=-Math.max(6.5,Math.abs(shot.vy)*.72);
      shot.bounces--;
      puff(shot.x,FLOOR,b?.color ?? boxes[shot.shape].color,5);
    }
    if (shot.shape==='bomb' && shot.own) {
      if (shot.y>=FLOOR-12) {
        shot.y=FLOOR-12;
        boxBlast(shot);
        if (!b) for (const foe of foes) {
          if (foe.hp && Math.abs(shot.x-(foe.x-camera))<130 && foe.y>=FLOOR-94) hitFoe(foe,4,shot);
        }
        if (b?.hp && Math.abs(shot.x-b.x)<198 && b.y>=FLOOR-92) hitBoss(shot,4);
        if (b && !b.hp && transition===108) break;
      }
      continue;
    }
    if (shot.age>145 || shot.x<-55 || shot.x>W+55 || shot.y<-135 || shot.y>FLOOR+36) {
      shot.dead=true;
      continue;
    }
    if (!shot.own) {
      const box=boxes[shot.shape];
      if (Math.abs(shot.x-p.x)<18+box.w/2 && shot.y+box.h/2>p.y-playerHeight() &&
        shot.y-box.h/2<p.y+3 && !p.dash) {
        shot.dead=true;
        hurt();
        if (!p.hp) break;
      }
      continue;
    }
    if (!b) {
      const foe=foes.find(e=>e.hp && Math.abs(e.x-camera-shot.x)<41 && shot.y>e.y-132 && shot.y<e.y+6);
      if (foe) {
        shot.dead=true;
        hitFoe(foe,shot.shape==='missile'?2:1,shot);
      }
      continue;
    }
    if (!b.hp || Math.abs(shot.x-b.x)>147 || shot.y<b.y-116*b.scale || shot.y>b.y-12) continue;
    const m=b.move && moves[b.move];
    const exposed=m && b.age>m.tell+m.active;
    const weak=exposed && Math.abs(shot.y-(FLOOR-222))<34;
    hitBoss(shot,shot.shape==='missile'?2:weak?3:1);
    if (weak) sound(750,970,.08,.035);
    if (!b.hp) break;
  }
  bullets=bullets.filter(shot=>!shot.dead);
}

function hitBoss(shot,damage) {
  shot.dead=true;
  boss.hp=Math.max(0,boss.hp-damage);
  boss.flash=4;
  puff(shot.x,shot.y,boxes[shot.shape].color,damage>1?8:3);
  if (!boss.hp) defeatBoss();
}

function floorHeight(h) {
  return h.height*Math.min(1,(h.age+1)/9,(35-h.age)/8);
}

function updateHazards() {
  for (const h of hazards) {
    h.age++;
    if (!h.blast && mode==='play' && Math.abs(player.x-h.x)<h.w/2+18 &&
      player.y>FLOOR-floorHeight(h)) hurt();
  }
  hazards=hazards.filter(h=>h.age<(h.blast?13:35));
}

function update() {
  time++;
  movePlayer();
  if (!boss) {
    updateFoes();
    if (mode==='play') updateBullets();
    if (mode==='play' && camera>=COURSE_LENGTH) {
      if (act===undefined) clearLevel();
      else startBoss();
    }
  } else if (transition) {
    keepPlayerLeft();
    updateBullets();
    if (--transition===0) clearLevel();
  } else {
    const previousX=boss.x;
    updateBoss();
    boss.moving=Math.abs(boss.x-previousX)>.5;
    boss.distance+=boss.x-previousX;
    keepPlayerLeft();
    if (mode==='play') updateBullets();
  }
  updateHazards();
  if (player.dash) player.dash--;
  for (const s of sparks) {
    s.x+=s.vx;
    s.y+=s.vy;
    s.vy+=.13;
    s.life--;
  }
  sparks=sparks.filter(s=>s.life>0);
  if (boss) {
    const target=COURSE_LENGTH+PANORAMA_WIDTH*(1-boss.hp/boss.max);
    camera+=(Math.max(camera,target)-camera)*.032;
  }
  if (banner && --banner===0) ui.notice.hidden=true;
  if (shake) shake--;
  refreshHud();
}

function shadow(x,y,w) {
  ctx.fillStyle='#120c1d84';
  ctx.beginPath();
  ctx.ellipse(x,y+1,w,8,0,0,2*Math.PI);
  ctx.fill();
}

function lane(x,width,y,height,color,alpha) {
  ctx.globalAlpha=alpha;
  ctx.fillStyle=color;
  ctx.fillRect(x,y,width,height);
  ctx.globalAlpha=1;
}

function attackArt(name) {
  return picture(`art/attacks/${name}.png`);
}

function attackFrame(folder, index) {
  return attackArt(`${folder}/0${index+1}`);
}

function drawColumn(h) {
  const height=Math.ceil(floorHeight(h)), x=Math.round(h.x-h.w/2);
  const y=FLOOR-height, folder=`hazards/${h.w}px`;
  const top=attackArt(`${folder}/column-top`);
  const middle=attackArt(`${folder}/column-middle`);
  const base=attackArt(`${folder}/column-base`);
  const capHeight=Math.min(top.height,height);
  ctx.drawImage(top,0,0,h.w,capHeight,x,y,h.w,capHeight);
  const baseHeight=Math.min(base.height,height-capHeight);
  for (let offset=capHeight; offset<height-baseHeight; offset+=middle.height) {
    const part=Math.min(middle.height,height-baseHeight-offset);
    ctx.drawImage(middle,0,0,h.w,part,x,y+offset,h.w,part);
  }
  if (baseHeight) {
    ctx.drawImage(base,0,0,h.w,baseHeight,x,FLOOR-baseHeight,h.w,baseHeight);
  }
  if (h.age>=27) {
    const frame=attackFrame(`${folder}/retract`,Math.floor((h.age-27)/2));
    ctx.drawImage(frame,x,FLOOR-frame.height);
  }
}

function renderBoss() {
  const b=boss,m=b.move && moves[b.move];
  const telling=m && b.age<m.tell && b.hp;
  if (telling) {
    const pulse=.25+.24*b.age/m.tell+.12*Math.sin(time*.52);
    const fromFloor=b.move==='rift'||b.move==='eruption';
    for (const x of b.lanes) {
      if (fromFloor) {
        const width=b.move==='rift'?84:65;
        const frame=attackFrame(`hazards/${width}px/warning`,Math.floor(b.age*3/m.tell));
        ctx.drawImage(frame,Math.round(x-width/2),FLOOR-frame.height);
      } else {
        lane(x-43,86,180,FLOOR-180,b.color,pulse*.68);
      }
    }
    if (b.move==='quake' || b.move==='sweep') lane(0,W,FLOOR-45,45,b.color,pulse*.72);
    if (b.move==='slabs') lane(0,W,FLOOR-113,28,b.color,pulse*.70);
    if (b.move==='rush') {
      const danger=BOSS_MIN-BOSS_FRONT;
      lane(danger,W-danger,FLOOR-12,12,b.color,pulse*.80);
    }
  }
  for (const h of hazards) {
    if (h.blast) {
      const frame=attackFrame('player/explosion',Math.floor(h.age*5/13));
      const height=Math.round(h.w*frame.height/frame.width);
      ctx.drawImage(frame,Math.round(h.x-h.w/2),FLOOR-height,h.w,height);
    } else {
      drawColumn(h);
    }
  }
  if (!b.hp && transition<12) return;
  const frames=ART.sprites[b.id], art=frames.poses;
  const strike=m && b.age>=m.tell && b.age<m.tell+m.active;
  const exposed=m && b.age>=m.tell+m.active;
  let pose=art[time%48<24?0:1];
  if (!b.hp) pose=frames.death[Math.min(frames.death.length-1,Math.floor((108-transition)/4))] ?? art[24];
  else if (!m) pose=frames.entrance[Math.min(frames.entrance.length-1,Math.floor(b.age/5))] ?? art[0];
  else if (telling) pose=art[b.move==='drop'?7:29];
  else if (strike) {
    if (b.move==='rush') pose=b.age-m.tell<6?art[6]:walk(b.id,b.distance);
    else if (b.move==='drop') pose=art[b.age-m.tell<16?8:b.age-m.tell<32?9:10];
    else if (frames.ranged.length) pose=frames.ranged[Math.min(frames.ranged.length-1,Math.floor((b.age-m.tell)/4))];
    else pose=art[30];
  } else if (b.flash) pose=art[24];
  else if (b.moving) pose=walk(b.id,b.distance);
  shadow(b.x,FLOOR,120);
  ctx.save();
  if (!b.hp) ctx.globalAlpha=clamp((transition-12)/25,0,1);
  if (b.flash && b.hp) ctx.filter='brightness(1.38)';
  sprite(b.id,pose,b.x,b.y,-1,b.scale);
  ctx.restore();
  if (exposed && b.hp) {
    ctx.strokeStyle='#ffe5a1';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.arc(b.x,FLOOR-222,22+Math.sin(time*.18)*3,0,Math.PI*2);
    ctx.stroke();
  }
}

function render() {
  drawBackground();
  drawShade();
  ctx.save();
  if (shake) ctx.translate(Math.sin(time*1.8)*shake*.28,Math.cos(time*2)*shake*.25);
  ctx.imageSmoothingEnabled=false;
  if (boss) renderBoss();
  else for (const e of foes) {
    const x=e.x-camera;
    if (!e.hp || x<-150 || x>W+150) continue;
    const poses=ART.sprites[e.id].poses;
    shadow(x,FLOOR,34);
    sprite(e.id,e.flash?poses[24]:e.id==='rune'?poses[8]:walk(e.id,e.distance),x,e.y,x>player.x?-1:1,1.06);
  }
  const p=player, art=ART.sprites.rivet;
  shadow(p.x,FLOOR,36);
  const cast=art.cast[p.shot<2?2:3];
  const pose=p.dash?art.poses[6]:p.crouch?art.poses[10]:
    p.shot<3?cast:!p.grounded?art.poses[p.vy<0?8:9]:Math.abs(p.vx)>1?walk('rivet',p.distance):art.poses[time%46<23?0:1];
  if (!p.inv || time%8<5) sprite('rivet',pose,p.x,p.y,1,1.20);
  for (const shot of bullets) {
    ctx.save();
    ctx.translate(Math.round(shot.x),Math.round(shot.y));
    ctx.imageSmoothingEnabled=false;
    if (shot.shape==='missile') ctx.rotate(Math.atan2(shot.vy,shot.vx));
    else if (shot.vx<0 && (shot.shape==='boulder' || shot.shape==='prism')) ctx.scale(-1,1);
    const box=boxes[shot.shape];
    if (shot.laser) {
      ctx.drawImage(attackArt('player/laser/muzzle'),-17,-6,10,13);
      ctx.drawImage(attackArt('player/laser/middle'),-7,-6,15,13);
      ctx.drawImage(attackArt('player/laser/tip'),8,-6,10,13);
    } else {
      ctx.drawImage(attackArt(box.art),-Math.floor(box.w/2),-Math.floor(box.h/2));
    }
    ctx.restore();
  }
  for (const s of sparks) {
    ctx.globalAlpha=s.life/18;
    ctx.fillStyle=s.color;
    ctx.fillRect(s.x,s.y,4,4);
  }
  ctx.restore();
}

function pause() {
  if (mode==='play') setOverlay('paused','Intermission','Paused','Take a breather.','Resume');
  else if (mode==='paused') setOverlay('play','','','','');
}

window.addEventListener('keydown',e=>{
  if (!controls.has(e.code)) return;
  if (mode==='play' || e.code==='Escape') e.preventDefault();
  if (!e.repeat) {
    pressed.add(e.code);
    if (e.code==='Escape') pause();
  }
  keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{
  keys.clear();
  pressed.clear();
  if (mode==='play') pause();
});
ui.start.addEventListener('click',()=>{
  if (!audio && window.AudioContext) audio=new AudioContext();
  audio?.resume().catch(()=>{});
  if (mode==='paused') setOverlay('play','','','','');
  else if (mode==='clear') begin(levelIndex+1);
  else if (mode==='lost') begin(levelIndex,Boolean(boss));
  else begin(Number(levelSelect.value));
});

let last=0,carry=0;
function loop(now) {
  const dt=Math.min(now-last,66);
  last=now;
  if (mode==='play') {
    carry+=dt;
    while (mode==='play' && carry>=1000/60) {
      update();
      pressed.clear();
      carry-=1000/60;
    }
  } else {
    carry=0;
    pressed.clear();
  }
  if (player) render();
  requestAnimationFrame(loop);
}

const panoramas=LEVELS.map(level=>picture(level.art));
const initial=[...panoramas];
for (const id of Object.keys(ART.sprites)) {
  const art=ART.sprites[id];
  for (const frame of [...Object.values(art.poses),...art.walk,...(art.cast??[]),...(art.entrance??[]),...(art.death??[]),...(art.ranged??[])]) initial.push(picture(frame[0]));
}
for (const box of Object.values(boxes)) initial.push(attackArt(box.art));
for (const part of ['muzzle','middle','tip']) initial.push(attackArt(`player/laser/${part}`));
for (let i=0; i<5; i++) initial.push(attackFrame('player/explosion',i));
for (const width of [65,84]) {
  const folder=`hazards/${width}px`;
  for (const part of ['top','middle','base']) initial.push(attackArt(`${folder}/column-${part}`));
  for (let i=0; i<3; i++) initial.push(attackFrame(`${folder}/warning`,i));
  for (let i=0; i<4; i++) initial.push(attackFrame(`${folder}/retract`,i));
}
Promise.all(initial.map(img=>img.decode())).then(()=>{
  panoramaTiles=panoramas.map((image,index)=>{
    const tile=document.createElement('canvas');
    tile.width=PANORAMA_WIDTH;
    tile.height=H;
    const art=tile.getContext('2d');
    const foot=Math.round(image.height*LEVELS[index].foot);
    art.drawImage(image,0,0,image.width,foot,0,0,PANORAMA_WIDTH,FLOOR);
    art.drawImage(image,0,foot,image.width,image.height-foot,0,FLOOR,PANORAMA_WIDTH,H-FLOOR);
    return tile;
  });
  camera=0;
  levelIndex=firstLevel;
  drawBackground();
  ui.title.textContent=LEVELS[firstLevel].title;
  mode='title';
  levelSelect.addEventListener('change',()=>{
    levelIndex=Number(levelSelect.value);
    ui.title.textContent=LEVELS[levelIndex].title;
    drawBackground();
  });
  ui.start.disabled=false;
  ui.start.textContent='Start level';
  requestAnimationFrame(loop);
}).catch(()=>{
  ui.start.textContent='Art could not load';
  ui.description.textContent='Extract the entire game folder before opening index.html.';
});
