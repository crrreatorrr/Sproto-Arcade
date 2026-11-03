'use strict';

const W = 1280, H = 720, FLOOR = 604, BLEND = 176, STRIDE = W - BLEND;
const route = ART.route;
const END = (route.length - 1) * STRIDE + W;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const ui = Object.fromEntries(['hearts','count','location','boss','notice','eyebrow','title','description','start'].map(id => [id, document.getElementById(id)]));
const hud = document.querySelector('.hud'), overlay = document.querySelector('.overlay');
const pictures = new Map(), keys = new Set(), pressed = new Set();
const bossAt = new Map(['bront','zephyr','bigswole','rune'].map((id,i) => [Math.floor((route.length-1)*(i+1)/4),id]));
const platforms = route.flatMap((_,i) => i % 3 === 1 && !bossAt.has(i) ? [{x:i*STRIDE+545,y:FLOOR-116,w:228}] : []);
const names = {bront:'Bront',zephyr:'Zephyr',bigswole:'Big Swole',rune:'Rune'};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const active = (...codes) => codes.some(code => keys.has(code));
const tapped = (...codes) => codes.some(code => pressed.has(code));
const controls = new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Space','KeyZ','ShiftLeft','ShiftRight','Escape']);
let mode = 'loading', player, enemies, bullets, sparks, camera, checkpoint, scene, time, banner, gate, audio;

function picture(path) {
  if (!pictures.has(path)) {
    const image = new Image();
    image.src = path;
    pictures.set(path, image);
  }
  return pictures.get(path);
}

const ranch = document.createElement('canvas');
ranch.width = W;
ranch.height = H;
drawRanch(ranch.getContext('2d'), 0);

function background(index) {
  const path = route[index][1];
  return path ? picture(path) : ranch;
}

function drawBackground() {
  ctx.fillStyle = '#241b2b';
  ctx.fillRect(0, 0, W, H);
  const first = Math.max(0, Math.floor((camera - W) / STRIDE) + 1);
  const last = Math.min(route.length - 1, Math.floor((camera + W) / STRIDE));
  for (let i = first; i <= last; i++) {
    const image = background(i), x = Math.round(i * STRIDE - camera);
    if (image !== ranch && !image.naturalWidth) continue;
    ctx.drawImage(image, BLEND, 0, image.width - BLEND, image.height, x + BLEND, 0, STRIDE, H);
    if (i === first) ctx.drawImage(image, 0, 0, BLEND, image.height, x, 0, BLEND, H);
    else for (let stripe = 0; stripe < BLEND; stripe += 8) {
      ctx.globalAlpha = (stripe + 8) / BLEND;
      ctx.drawImage(image, stripe, 0, 8, image.height, x + stripe, 0, 8, H);
    }
    ctx.globalAlpha = 1;
  }
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
  ctx.scale(facing * scale, scale);
  ctx.drawImage(image, -anchorX, -anchorY);
  ctx.restore();
}

function walk(id, distance) {
  const art = ART.sprites[id];
  const loop = art.walk.length ? art.walk : [art.poses[2],art.poses[3],art.poses[4],art.poses[5]];
  return loop[Math.floor(distance / 12) % loop.length];
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
  ui.eyebrow.textContent = label;
  ui.title.textContent = title;
  ui.description.textContent = description;
  ui.start.textContent = button;
  if (!overlay.hidden) ui.start.focus();
}

function spawn(id, x, type, offset = 0) {
  const boss = type === 'boss', flyer = type === 'fly';
  const hp = boss ? 20 : flyer ? 2 : 3;
  enemies.push({id,x,home:x,y:FLOOR-(flyer ? 148 : 0),type,offset,hp,max:hp,
    cooldown:80+offset,windup:0,flash:0,facing:-1,distance:0,charge:0,volley:0,born:false});
}

function begin(from = 0) {
  checkpoint = scene = from;
  time = 0;
  camera = clamp(from * STRIDE, 0, END-W);
  player = { x:from * STRIDE + 245,y:FLOOR,vy:0,face:1,hp:4,inv:0,
    grounded:true,crouch:false,dash:0,dashWait:0,airDash:true,shot:0,distance:0,moving:false };
  enemies = [];
  bullets = [];
  sparks = [];
  gate = null;
  for (let i = from; i < route.length; i++) {
    const base = i * STRIDE;
    if (bossAt.has(i)) {
      spawn(bossAt.get(i),base+895,'boss');
    } else {
      spawn(i % 2 ? 'mox' : 'zephyr',base + 680,i % 3 === 2 ? 'caster' : 'runner');
      if (i % 2) spawn('rune',base + 970,'fly',i * 7 % 36);
    }
  }
  hud.hidden = false;
  setOverlay('play','','','','');
  announce(from ? 'Checkpoint restored!' : 'Ready? Wallop!');
  refreshHud();
}

function refreshHud() {
  ui.hearts.textContent = '♥'.repeat(player.hp) + '♡'.repeat(4-player.hp);
  ui.count.textContent = String(scene + 1).padStart(2,'0') + ' / ' + route.length;
  ui.location.textContent = route[scene][0];
  ui.boss.hidden = !gate;
  if (gate) {
    ui.boss.firstElementChild.textContent = names[gate.id] + (gate.hp <= gate.max / 2 ? ' • Final phase' : '');
    ui.boss.lastElementChild.value = gate.hp / gate.max;
  }
}

function puff(x,y,color,count=9) {
  for (let i=0;i<count;i++) {
    const angle = i / count * Math.PI * 2;
    const speed = 1.5 + Math.random() * 5;
    sparks.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:18,color});
  }
}

function hurt() {
  if (player.inv || player.dash) return;
  player.hp--;
  player.inv = 87;
  puff(player.x,player.y-48,'#fff0cc',15);
  sound(135,47,.21,.11);
  if (!player.hp) setOverlay('lost','That’s a wrap!','Knockout!','Reached ' + route[scene][0] + '.', 'Retry checkpoint');
}

function fire(x,y,vx,vy,shape,own,gravity=0) {
  bullets.push({x,y,vx,vy,shape,own,gravity,age:0});
}

function movePlayer() {
  const p = player;
  p.inv = Math.max(0,p.inv-1);
  p.dashWait = Math.max(0,p.dashWait-1);
  const dx = Number(active('ArrowRight','KeyD')) - Number(active('ArrowLeft','KeyA'));
  if (dx && !p.dash) p.face = dx;
  p.crouch = active('ArrowDown','KeyS') && p.grounded && !p.dash;
  if (p.grounded && tapped('Space','ArrowUp','KeyW')) {
    p.grounded = false;
    p.crouch = false;
    p.vy = -15.5;
    puff(p.x,p.y,'#efe3c8',5);
    sound(195,400,.12);
  }
  if (!p.dashWait && (p.grounded || p.airDash) && tapped('ShiftLeft','ShiftRight')) {
    p.dash = 12;
    p.dashWait = 36;
    p.airDash = false;
    p.crouch = false;
    sound(470,155,.13);
  }
  const oldX = p.x;
  p.x += p.dash ? p.face * 17 : dx * (p.crouch ? 2.4 : 7.6);
  p.x = clamp(p.x,gate ? gate.home-790 : 65,gate ? gate.home+285 : END-68);
  p.moving = Math.abs(oldX-p.x) > .1;
  p.distance += Math.abs(oldX-p.x);
  if (p.dash) {
    p.dash--;
    if (time % 3 === 0) puff(p.x,p.y-25,'#f6c774',3);
  } else {
    const ledge = platforms.find(l => p.x > l.x-12 && p.x < l.x+l.w+12 && p.y <= l.y+.1 && p.y+p.vy+.68 >= l.y);
    const floor = ledge ? ledge.y : FLOOR;
    p.vy += .68;
    p.y += p.vy;
    p.grounded = false;
    if (p.y >= floor) {
      const landing = p.y - p.vy < floor;
      p.y = floor;
      p.vy = 0;
      p.grounded = true;
      p.airDash = true;
      if (landing) puff(p.x,p.y,'#efe3c8',5);
    }
  }
  if (p.shot) p.shot = (p.shot+1) % 21;
  if (!p.shot && active('KeyZ')) p.shot = 1;
  if (p.shot === 6) {
    const y = p.y - (p.crouch ? 74 : 109);
    fire(p.x+p.face*44,y,p.face*14,0,'spark',true);
    sound(520,235,.07,.025);
  }
}

function updateEnemy(e) {
  const p = player, boss = e.type === 'boss';
  const distance = Math.abs(p.x-e.x);
  if (!e.born && distance > (boss ? 560 : 690)) return;
  e.born = true;
  if (distance > 1100) return;
  e.flash = Math.max(0,e.flash-1);
  if (!e.charge) e.facing = p.x < e.x ? -1 : 1;
  if (boss && !gate) {
    gate = e;
    announce(names[e.id] + ' steps up!');
  }
  if (e.type === 'fly') e.y = FLOOR - 150 + Math.sin((time+e.offset)*.045)*49;
  if (e.charge) {
    e.x = clamp(e.x + e.facing * 12,e.home-605,e.home+238);
    e.charge--;
  } else if (e.windup) {
    e.windup--;
    if (!e.windup) enemyAttack(e);
  } else if (e.type === 'runner') {
    e.x = clamp(e.x+e.facing*2.7,e.home-280,e.home+230);
    e.distance += 2.7;
  } else if (e.type === 'fly' || boss || distance < 610) {
    e.cooldown--;
    if (e.cooldown <= 0) e.windup = boss ? 33 : 26;
  }
  const body = boss ? 62 : 31;
  const pHeight = p.crouch ? 59 : 100;
  if (Math.abs(e.x-p.x) < body && p.y > e.y-(boss ? 164 : 94) && p.y-pHeight < e.y-5) hurt();
}

function enemyAttack(e) {
  const fast = e.hp <= e.max/2;
  e.cooldown = e.type === 'boss' ? (fast ? 47 : 76) : 96;
  e.volley++;
  const dx = e.facing;
  if (e.type === 'boss') {
    if (fast && e.volley%4===0) {
      e.charge = 24;
      return;
    }
    const pattern = (e.volley + ['bront','zephyr','bigswole','rune'].indexOf(e.id)) % 3;
    if (pattern === 0) {
      for (const vy of [-3.7,0,3.7]) fire(e.x+dx*62,e.y-112,dx*7.5,vy,'orb',false);
    } else if (pattern === 1) {
      fire(e.x+dx*63,e.y-26,dx*9.5,0,'boulder',false);
      if (fast) fire(e.x+dx*105,e.y-142,dx*7,0,'boulder',false);
    } else {
      fire(e.x+dx*60,e.y-102,dx*6,-7,'pumpkin',false,.23);
      fire(e.x+dx*60,e.y-102,dx*9,-9.2,'pumpkin',false,.23);
    }
    sound(170,70,.15);
  } else if (e.type === 'fly') {
    const aim = Math.atan2(player.y-65-(e.y-55),player.x-e.x);
    fire(e.x,e.y-55,Math.cos(aim)*6,Math.sin(aim)*6,'orb',false);
  } else {
    fire(e.x+dx*33,e.y-77,dx*7,0,'needle',false);
  }
}

function updateBullets() {
  const p = player;
  bullets = bullets.filter(b => {
    b.age++;
    b.x += b.vx;
    b.y += b.vy;
    b.vy += b.gravity;
    if (b.age > 96 || b.y > FLOOR+18 || b.y < -35 || Math.abs(p.x-b.x) > 1460) return false;
    if (!b.own) {
      if (Math.abs(b.x-p.x)<27 && b.y>=p.y-(p.crouch ? 67 : 105) && b.y<=p.y+4) {
        if (p.dash) return true;
        hurt();
        return false;
      }
      return true;
    }
    const target = enemies.find(e => e.born && e.hp > 0 &&
      Math.abs(e.x-b.x) < (e.type === 'boss' ? 76 : 44) &&
      b.y > e.y - (e.type === 'boss' ? 205 : 130) && b.y < e.y + 8);
    if (!target) return true;
    target.hp--;
    target.flash = 5;
    puff(b.x,b.y,'#ffe487',target.hp ? 6 : 18);
    if (!target.hp && gate === target) {
      gate = null;
      sound(280,940,.3,.075);
      if (target.home >= (route.length-1)*STRIDE) {
        if (p.hp > 0) setOverlay('won','All ' + route.length + ' backdrops cleared','That’s all, Sproto!','The Long Way Home is complete.', 'Play again');
      } else {
        p.hp = 4;
        announce('Knockout!  •  Keep moving →');
      }
    }
    return false;
  });
}

function update() {
  time++;
  movePlayer();
  const next = clamp(Math.floor((player.x - BLEND/2) / STRIDE),0,route.length-1);
  if (scene !== next) {
    scene = next;
    if (next > checkpoint && next%4 === 0 && !gate) {
      checkpoint = next;
      player.hp = 4;
      announce('Checkpoint  •  HP restored');
    }
    for (const i of [next-1,next,next+1,next+2]) if (route[i]) background(i);
  }
  for (const enemy of enemies) if (enemy.hp) updateEnemy(enemy);
  if (mode === 'play') updateBullets();
  enemies = enemies.filter(enemy => enemy.hp > 0);
  for (const spark of sparks) {
    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.vy += .12;
    spark.life--;
  }
  sparks = sparks.filter(spark => spark.life > 0);
  if (banner && --banner === 0) ui.notice.hidden = true;
  const target = clamp(player.x-W*.41,0,END-W);
  camera += (target-camera)*.13;
  refreshHud();
}

function shadow(x,y,w) {
  ctx.fillStyle = '#120c1d65';
  ctx.beginPath();
  ctx.ellipse(x,y+1,w,8,0,0,2*Math.PI);
  ctx.fill();
}

function render() {
  drawBackground();
  ctx.save();
  ctx.translate(-Math.round(camera),0);
  for (const l of platforms) {
    if (l.x+l.w < camera || l.x > camera+W) continue;
    ctx.fillStyle = '#1b1422';
    ctx.fillRect(l.x,l.y,l.w,15);
    ctx.fillStyle = '#f3c67c';
    ctx.fillRect(l.x,l.y,l.w,3);
    ctx.fillStyle = '#9b6448';
    ctx.fillRect(l.x+8,l.y+6,l.w-16,3);
  }
  for (const e of enemies) {
    if (e.x < camera-150 || e.x > camera+W+150) continue;
    const art = ART.sprites[e.id].poses, boss = e.type==='boss';
    const frame = e.flash ? art[24] : e.windup ? art[29] : e.charge ? art[6] :
      e.type==='fly' ? art[8] : e.type==='runner' && e.born ? walk(e.id,e.distance) : art[time%50<25?0:1];
    shadow(e.x,FLOOR,boss?76:41);
    sprite(e.id,frame,e.x,e.y,e.facing,boss?1.58:1.03);
    if (e.windup) {
      ctx.fillStyle = '#ffdd7b';
      ctx.font = '900 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('!',e.x,e.y-(boss?230:148));
    }
  }
  const p = player, art = ART.sprites.rivet;
  shadow(p.x,FLOOR,42);
  const cast = art.cast[p.shot<4?0:p.shot<6?1:p.shot<11?2:3];
  const pose = p.dash ? art.poses[6] : p.crouch ? art.poses[10] :
    p.shot ? cast : !p.grounded ? art.poses[p.vy<0?8:9] : p.moving ? walk('rivet',p.distance) : art.poses[time%46<23?0:1];
  if (!p.inv || time%8<4) sprite('rivet',pose,p.x,p.y,p.face,1.25);
  for (const b of bullets) {
    ctx.save();
    ctx.translate(b.x,b.y);
    ctx.rotate(Math.atan2(b.vy,b.vx));
    ctx.shadowColor = b.own ? '#ffdb52' : '#ff5b82';
    ctx.shadowBlur = 12;
    drawPower(ctx,b.shape,b.age,b.own?'#ffda55':'#ff819a');
    ctx.restore();
  }
  for (const s of sparks) {
    ctx.globalAlpha = s.life/18;
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x,s.y,4,4);
  }
  ctx.restore();
}

function pause() {
  if (mode === 'play') setOverlay('paused','Intermission','Paused','Take a breather.','Resume');
  else if (mode === 'paused') setOverlay('play','','','','');
}

window.addEventListener('keydown',e => {
  if (!controls.has(e.code)) return;
  if (mode === 'play' || e.code === 'Escape') e.preventDefault();
  if (!e.repeat) {
    pressed.add(e.code);
    if (e.code === 'Escape') pause();
  }
  keys.add(e.code);
});
window.addEventListener('keyup',e => keys.delete(e.code));
window.addEventListener('blur',() => {
  keys.clear();
  pressed.clear();
  if (mode === 'play') pause();
});
ui.start.addEventListener('click',() => {
  if (!audio && window.AudioContext) audio = new AudioContext();
  audio?.resume().catch(() => {});
  if (mode === 'paused') setOverlay('play','','','','');
  else begin(mode === 'lost' ? checkpoint : 0);
  canvas.focus();
});

let last = 0, carry = 0;
function loop(now) {
  const dt = Math.min(now-last,66);
  last = now;
  if (mode === 'play') {
    carry += dt;
    while (mode === 'play' && carry >= 1000/60) {
      update();
      pressed.clear();
      carry -= 1000/60;
    }
  } else {
    carry = 0;
    pressed.clear();
  }
  if (player) render();
  requestAnimationFrame(loop);
}

const initial = [background(0),background(1),background(2)];
for (const set of Object.values(ART.sprites)) {
  for (const frame of [...Object.values(set.poses),...set.walk,...set.cast]) initial.push(picture(frame[0]));
}
Promise.all(initial.map(img => img.decode())).then(() => {
  camera = 0;
  drawBackground();
  mode = 'title';
  ui.start.disabled = false;
  ui.description.textContent = route.length + ' backdrops. One continuous run. One shot to fight with.';
  ui.start.textContent = 'Start run';
  requestAnimationFrame(loop);
}).catch(() => {
  ui.start.textContent = 'Art could not load';
  ui.description.textContent = 'Extract the entire game folder before opening index.html.';
});
