'use strict';

const W = 1280, H = 720, FLOOR = 604, BLEND = 192, STRIDE = W - BLEND;
const route = ART.route;
const LOOP_LENGTH = route.length * STRIDE;
const wrap = (value, period) => ((value % period) + period) % period;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const ui = Object.fromEntries(['hearts','count','location','notice','eyebrow','title','description','start'].map(id => [id, document.getElementById(id)]));
const hud = document.querySelector('.hud'), overlay = document.querySelector('.overlay');
const pictures = new Map(), overlaps = new Map(), aligned = new Map(), keys = new Set(), pressed = new Set();
const ledges = [1,4].map(i => ({x:i*STRIDE+545,y:FLOOR-116,w:228}));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const active = (...codes) => codes.some(code => keys.has(code));
const tapped = (...codes) => codes.some(code => pressed.has(code));
const controls = new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Space','KeyZ','ShiftLeft','ShiftRight','Escape']);
let mode = 'loading', player, enemies, bullets, sparks, camera, checkpoint, scene, time, banner, audio, lap, spawnedLap;

function picture(path) {
  if (!pictures.has(path)) {
    const image = new Image();
    image.src = path;
    pictures.set(path, image);
  }
  return pictures.get(path);
}

function background(index) {
  return picture(route[wrap(index,route.length)][1]);
}

function drawBackground() {
  ctx.fillStyle = '#241b2b';
  ctx.fillRect(0, 0, W, H);
  const first = Math.floor((camera - W) / STRIDE) + 1;
  const last = Math.floor((camera + W) / STRIDE);
  for (let i = first; i <= last; i++) {
    const image = aligned.get(background(i)), x = Math.round(i * STRIDE - camera);
    ctx.drawImage(image, BLEND, 0, image.width-BLEND, image.height, x+BLEND, 0, STRIDE, H);
    if (i === first) ctx.drawImage(image, 0, 0, BLEND, image.height, x, 0, BLEND, H);
    else ctx.drawImage(overlaps.get(image), x, 0);
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
  const hp = type === 'fly' ? 2 : 3;
  enemies.push({id,x,home:x,y:FLOOR-(type === 'fly' ? 148 : 0),type,offset,hp,
    cooldown:80+offset,windup:0,flash:0,facing:-1,distance:0,born:false});
}

function begin(from = 0) {
  checkpoint = scene = from;
  time = 0;
  camera = Math.max(0,from * STRIDE - 220);
  lap = Math.floor(from / route.length);
  spawnedLap = lap - 1;
  player = { x:from * STRIDE + 245,y:FLOOR,vy:0,face:1,hp:4,inv:0,
    grounded:true,crouch:false,dash:0,dashWait:0,airDash:true,shot:0,distance:0,moving:false };
  enemies = [];
  bullets = [];
  sparks = [];
  seedThrough(lap + 1);
  hud.hidden = false;
  setOverlay('play','','','','');
  announce(from ? 'Checkpoint restored!' : 'Ready? Wallop!');
  refreshHud();
}

function seedThrough(lastLap) {
  while (spawnedLap < lastLap) {
    const start = ++spawnedLap * LOOP_LENGTH;
    for (let i = 0; i < route.length; i++) {
      const base = start + i * STRIDE;
      spawn(i % 2 ? 'mox' : 'zephyr',base+680,i % 3 === 2 ? 'caster' : 'runner');
      if (i % 2) spawn('rune',base+970,'fly',i * 7 % 36);
    }
  }
}

function refreshHud() {
  ui.hearts.textContent = '♥'.repeat(player.hp) + '♡'.repeat(4-player.hp);
  ui.count.textContent = 'TIDEBREAK MARINA • LAP ' + (lap + 1);
  ui.location.textContent = route[wrap(scene,route.length)][0];
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
  if (!player.hp) setOverlay('lost','That’s a wrap!','Knockout!','Reached ' + route[wrap(scene,route.length)][0] + '.', 'Retry checkpoint');
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
  p.x = Math.max(p.x,65,checkpoint*STRIDE-160);
  p.moving = Math.abs(oldX-p.x) > .1;
  p.distance += Math.abs(oldX-p.x);
  if (p.dash) {
    p.dash--;
    if (time % 3 === 0) puff(p.x,p.y-25,'#f6c774',3);
  } else {
    const px = wrap(p.x,LOOP_LENGTH);
    const ledge = ledges.find(l => px > l.x-12 && px < l.x+l.w+12 && p.y <= l.y+.1 && p.y+p.vy+.68 >= l.y);
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
  const p = player;
  const distance = Math.abs(p.x-e.x);
  if (!e.born && distance > 690) return;
  e.born = true;
  if (distance > 1100) return;
  e.flash = Math.max(0,e.flash-1);
  e.facing = p.x < e.x ? -1 : 1;
  if (e.type === 'fly') e.y = FLOOR - 150 + Math.sin((time+e.offset)*.045)*49;
  if (e.windup) {
    e.windup--;
    if (!e.windup) enemyAttack(e);
  } else if (e.type === 'runner') {
    e.x = clamp(e.x+e.facing*2.7,e.home-280,e.home+230);
    e.distance += 2.7;
  } else if (e.type === 'fly' || distance < 610) {
    e.cooldown--;
    if (e.cooldown <= 0) e.windup = 26;
  }
  const pHeight = p.crouch ? 59 : 100;
  if (Math.abs(e.x-p.x) < 31 && p.y > e.y-94 && p.y-pHeight < e.y-5) hurt();
}

function enemyAttack(e) {
  e.cooldown = 96;
  const dx = e.facing;
  if (e.type === 'fly') {
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
      Math.abs(e.x-b.x) < 44 &&
      b.y > e.y - 130 && b.y < e.y + 8);
    if (!target) return true;
    target.hp--;
    target.flash = 5;
    puff(b.x,b.y,'#ffe487',target.hp ? 6 : 18);
    return false;
  });
}

function update() {
  time++;
  movePlayer();
  const next = Math.max(0,Math.floor((player.x - BLEND/2) / STRIDE));
  if (scene !== next) {
    scene = next;
    const completed = Math.floor(next / route.length);
    if (completed > lap) {
      lap = completed;
      checkpoint = lap * route.length;
      player.hp = 4;
      seedThrough(lap + 1);
      announce('Lap ' + lap + ' clear!');
    }
  }
  for (const enemy of enemies) if (enemy.hp) updateEnemy(enemy);
  if (mode === 'play') updateBullets();
  enemies = enemies.filter(enemy => enemy.hp > 0 && enemy.home >= checkpoint*STRIDE-STRIDE);
  for (const spark of sparks) {
    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.vy += .12;
    spark.life--;
  }
  sparks = sparks.filter(spark => spark.life > 0);
  if (banner && --banner === 0) ui.notice.hidden = true;
  const target = Math.max(0,player.x-W*.41);
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
  const firstLap = Math.floor(camera / LOOP_LENGTH);
  for (const base of [firstLap*LOOP_LENGTH,(firstLap+1)*LOOP_LENGTH]) for (const ledge of ledges) {
    const l = {...ledge,x:base+ledge.x};
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
    const art = ART.sprites[e.id].poses;
    const frame = e.flash ? art[24] : e.windup ? art[29] :
      e.type==='fly' ? art[8] : e.type==='runner' && e.born ? walk(e.id,e.distance) : art[time%50<25?0:1];
    shadow(e.x,FLOOR,41);
    sprite(e.id,frame,e.x,e.y,e.facing,1.03);
    if (e.windup) {
      ctx.fillStyle = '#ffdd7b';
      ctx.font = '900 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('!',e.x,e.y-148);
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

const initial = route.map((_,i) => background(i));
for (const set of Object.values(ART.sprites)) {
  for (const frame of [...Object.values(set.poses),...set.walk,...set.cast]) initial.push(picture(frame[0]));
}
Promise.all(initial.map(img => img.decode())).then(() => {
  // Line up the back edge of the deck before feathering the neighboring panels.
  const deckLines = [.64,.71,.67,.685,.696,.674];
  for (const [index, deckLine] of deckLines.entries()) {
    const source = background(index);
    const image = document.createElement('canvas');
    image.width = W;
    image.height = H;
    const panel = image.getContext('2d');
    const split = Math.round(source.height * deckLine), deck = 486;
    panel.drawImage(source,0,0,source.width,split,0,0,W,deck);
    panel.drawImage(source,0,split,source.width,source.height-split,0,deck,W,H-deck);
    aligned.set(source,image);
    const strip = document.createElement('canvas');
    strip.width = BLEND;
    strip.height = H;
    const blend = strip.getContext('2d');
    blend.drawImage(image, 0, 0, BLEND, image.height, 0, 0, BLEND, H);
    const fade = blend.createLinearGradient(0, 0, BLEND, 0);
    fade.addColorStop(0, 'transparent');
    fade.addColorStop(.22, '#00000020');
    fade.addColorStop(.78, '#000000df');
    fade.addColorStop(1, '#000');
    blend.globalCompositeOperation = 'destination-in';
    blend.fillStyle = fade;
    blend.fillRect(0, 0, BLEND, H);
    overlaps.set(image,strip);
  }
  camera = 0;
  drawBackground();
  mode = 'title';
  ui.start.disabled = false;
  ui.description.textContent = 'Level 01 • Tidebreak Marina. Run the loop and keep going.';
  ui.start.textContent = 'Start run';
  requestAnimationFrame(loop);
}).catch(() => {
  ui.start.textContent = 'Art could not load';
  ui.description.textContent = 'Extract the entire game folder before opening index.html.';
});
