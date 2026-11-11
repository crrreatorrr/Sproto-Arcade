'use strict';

const W = 1280, H = 720, FLOOR = 604;
const ENEMY_ATTACK_RATE = .9;
const PLAYER_SHOT_RATE = .75;
const GROUND_WARNING_FRAMES = 30;
const SCROLL_STEP = 6.86;
const CHASE_START_Y=552, CHASE_SCROLL=5.4;
const CHASE_ROOF_DROP=24, CHASE_GAP_REDUCTION=16;
const GOLDIE_SCALE=.49, GOLDIE_START_X=90, GOLDIE_MAX_X=104;
const GOLDIE_CATCH_REACH=85*GOLDIE_SCALE;
// Position of the main roof within each building sprite, measured from the top.
const CHASE_BUILDING_ROOFS=[.071,.413,.626,.427,.497,.373,.239,.404,.337,.296];
const CHASE_LOOP_DISTANCE=38880, CHASE_FINISH=CHASE_LOOP_DISTANCE+160;
const GOLDIE_EXHAUST=[[-124,59],[-89,63]];
const GOLDIE_MUZZLE=[140,-25];
const GOLDIE_HOVER_FRAMES=24, GOLDIE_FRAME_SIZE=336;
const CHASE_ATTACKS=[
  {name:'JETPACK BOLTS',shots:[[45,0,15,0,'prism'],[56,18,15,0,'prism']]},
  {name:'ARC BOMBS',shots:[[45,-12,12,-7,'pumpkin',.27],[64,10,11,-5,'pumpkin',.26]]},
  {name:'PLASMA COMETS',shots:[[45,-20,16,2.8,'comet'],[60,21,15,-1.5,'comet']]}
];
const CHASE_LAYOUT=[
  [0,430,CHASE_START_Y],[122,210,490],[140,220,455],[128,292,515],
  [155,171,469],[132,234,520],[140,183,456],[147,300,501],
  [126,224,447],[142,200,483],[137,284,526],[152,190,465],
  [132,221,421],[160,293,492],[135,202,462],[146,240,516],
  [143,193,449],[150,225,486],[138,360,524]
];
const chasePlatforms=[{x:0,width:CHASE_LAYOUT[0][1],y:CHASE_START_Y,building:0}];
let chaseDistance=CHASE_LAYOUT[0][1];
for (let i=0;chaseDistance<CHASE_FINISH;i++) {
  const [gap,width,y]=CHASE_LAYOUT[1+i%(CHASE_LAYOUT.length-1)];
  const x=chaseDistance+gap-CHASE_GAP_REDUCTION;
  const span=x+width<CHASE_FINISH-240?width:Math.max(width,CHASE_FINISH+160-x);
  chasePlatforms.push({x,width:span,y:y+CHASE_ROOF_DROP,building:(i+1)%CHASE_BUILDING_ROOFS.length});
  chaseDistance=x+span;
}
const PLAYER_WALK_CYCLE_DISTANCE = 240;
const SWEEP_EDGE = FLOOR - 91;
const SWEEP_SPEED = .7;
const SWEEP_DESCENT_FRAMES = 36;
const SAUCER_MUZZLE_X = 74, SAUCER_MUZZLE_Y = 12, SAUCER_BEAM_END = W-24;
const RED_BEAM_FRAMES = 30, RED_ARM_DEPLOY = 5, RED_ARM_RETRACT = 7;
const RED_ARM_TIP_X = 113, RED_ARM_TIP_Y = 58;
const BALL_LAUNCH_FRAME = 7, BALL_HATCH_FRAMES = 18;
const BALL_MUZZLE_X = -47, BALL_MUZZLE_Y = -28;
const PANEL_WIDTH=1344, GENERATED_PANEL_WIDTH=3072;
const STAGE_BLAST=54, STAGE_BLACKOUT=82, STAGE_SHIFT_END=96;
const VERSE_GEM_CHARGE=22, VERSE_GEM_FIRE=46, VERSE_GEM_END=64;
const VAULT_MUZZLE=W-110, VAULT_BEAM_LIFE=40, VAULT_WARNING_FRAMES=75;
const requestedLevel = Number(new URLSearchParams(location.search).get('level'));
const firstLevel = Math.max(0,LEVELS.findIndex(level=>level.id===requestedLevel&&(level.id!==13||REDKEV_READY)));
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const ui = Object.fromEntries(['hearts','god-mode','shield-status','count','location','boss','cue','dash','missile-status','bomb-status','notice','eyebrow','title','description','start'].map(id => [id, document.getElementById(id)]));
const hud = document.querySelector('.hud'), overlay = document.querySelector('.overlay');
const gameScreen = canvas.parentElement;
const levelSelect = document.getElementById('level-select');
const sprotoSelect = document.getElementById('sproto-select');
const portraits = document.getElementById('sproto-portraits');
const playable = [
  {id:'rivet',name:'Golden Sproto'},
  {id:'sproto3106',name:'Sproto Sheriff'},
  {id:'sproto3152',name:'Pissing Sproto'},
  {id:'morelight',name:'Morelight',portrait:'vela'},
  {id:'sproto763',name:'rog'},
  {id:'sproto831',name:'The Villain'},
  {id:'sproto943',name:'Artchick'},
  {id:'sproto1477',name:'Stalker'},
  {id:'sproto1668',name:'Goldie'},
  {id:'sproto1815',name:'Jessica'},
  {id:'sproto2101',name:'The Jay'},
  {id:'sproto2177',name:'Spronic'},
  {id:'sproto2569',name:'Clownie'},
  {id:'sproto2884',name:'Sprite'}
];
let selectedSproto=playable[0];
// Locks come from story-progress.js through hub-link.js. Without them (older pages) every Sproto is open.
const sprotoUnlocked=id=>window.ArcadeHub?.isUnlocked(id)??true;
function paintSprotoLocks() {
  for (const button of portraits.querySelectorAll('button[data-fighter]')) {
    const id=button.dataset.fighter, open=sprotoUnlocked(id);
    button.disabled=!open;
    button.classList.toggle('locked',!open);
    button.title=open?'':(window.ArcadeHub?.lockReason(id)??'');
  }
}
for (const fighter of playable) {
  const button=document.createElement('button');
  button.type='button';
  button.dataset.fighter=fighter.id;
  button.setAttribute('aria-pressed',String(fighter===selectedSproto));
  const img=document.createElement('img');
  img.src=`art/portraits/${fighter.portrait??fighter.id}.png`;
  img.alt='';
  const label=document.createElement('span');
  label.textContent=fighter.name;
  button.append(img,label);
  button.addEventListener('click',()=>{
    if (!sprotoUnlocked(fighter.id)) return;
    portraits.querySelector('[aria-pressed="true"]').setAttribute('aria-pressed','false');
    button.setAttribute('aria-pressed','true');
    selectedSproto=fighter;
    if (mode==='title') ui.eyebrow.textContent=fighter.name+' in';
  });
  portraits.append(button);
}
paintSprotoLocks();
for (const index of campaignLevelIndices()) {
  const level=LEVELS[index];
  levelSelect.add(new Option(String(campaignLevelNumber(index)).padStart(2,'0')+' · '+level.title,index));
}
levelSelect.value = String(firstLevel);
const pictures = new Map(), keys = new Set(), pressed = new Set();
const acts = [
  {id:'bront',name:'Fat Head Dave',tag:'The Breakwater',hp:263,color:'#ff855e',moves:['quake', 'bankShot', 'rush', 'slabs', 'drop'],staticMoves:['gearPincer', 'skimmer']},
  {id:'vela',name:'Morelight',tag:'The Prism Keeper',hp:277,color:'#83ceff',moves:['crossfire', 'splitArc', 'fan', 'ricochet', 'sweep'],staticMoves:['slabGates', 'arenaHazard', 'bankShot']},
  {id:'crapto',name:'Crapto',tag:'The Sludge King',hp:286,color:'#f0b075',moves:['ricochet', 'skimmer', 'quake', 'slabs', 'rush'],staticMoves:['gearPincer', 'arenaHazard', 'splitArc']},
  {id:'zephyr',name:'Halloween 2008',tag:'The Lantern King',hp:301,color:'#ffbf5b',moves:['rain', 'bankShot', 'ricochet', 'sweep', 'drop'],staticMoves:['lanternShower', 'arenaHazard', 'slabs']},
  {id:'sproto102',name:'Collector',tag:'The Vault Warden',hp:311,color:'#9be1ff',moves:['slabs', 'skimmer', 'rush', 'crossfire', 'fan'],staticMoves:['slabGates', 'arenaHazard', 'ricochet']},
  {id:'rune',name:'Bongraker',tag:'The Rift Keeper',hp:320,color:'#e6b6ff',moves:['fan', 'splitArc', 'rain', 'sweep', 'ricochet'],staticMoves:['crescentArc', 'arenaHazard', 'crossfire']},
  {id:'bigswole',name:'Big Swole',tag:'The Walking Wall',hp:333,color:'#87d7ff',moves:['rush', 'drop', 'bankShot', 'crossfire', 'quake'],staticMoves:['slabGates', 'arenaHazard', 'splitArc']},
  {id:'alpha777',name:'Alpha 777',tag:'The Jackpot',hp:344,color:'#eff5ae',moves:['rain', 'skimmer', 'slabs', 'quake', 'ricochet'],staticMoves:['gearPincer', 'arenaHazard', 'fan']},
  {id:'highsproto',name:'High Sproto',tag:'The Smoke Signal',hp:355,color:'#a5c4ff',moves:['crossfire', 'bankShot', 'sweep', 'fan', 'rush'],staticMoves:['lanternShower', 'arenaHazard', 'skimmer']},
  {id:'sprotosales',name:'Bot Sales',tag:'The Final Pitch',hp:365,color:'#efa7ff',moves:['fan', 'splitArc', 'crossfire', 'ricochet', 'drop'],staticMoves:['crescentArc', 'arenaHazard', 'slabGates']},
  null,null,
  {id:'redkev',name:'Redkev',tag:'The Red Breakwater',hp:263,color:'#ff3434',moves:['quake','bankShot','rush','slabs','drop'],staticMoves:['gearPincer','skimmer']}
];
const phaseTwoMoves=['gearPincer','lanternShower','slabGates','crescentArc'];
const moves = {
  quake:{tell:28,active:38,rest:31},
  slabs:{tell:34,active:57,rest:26},
  rush:{tell:37,active:29,rest:33},
  rain:{tell:38,active:52,rest:29},
  ricochet:{tell:26,active:49,rest:28},
  sweep:{tell:31,active:44,rest:27},
  fan:{tell:28,active:56,rest:29},
  drop:{tell:34,active:45,rest:32},
  crossfire:{tell:34,active:61,rest:31},
  eruption:{tell:37,active:48,rest:28},
  rift:{tell:42,active:36,rest:26},
  gearPincer:{tell:28,active:52,rest:28},
  lanternShower:{tell:29,active:64,rest:25},
  slabGates:{tell:32,active:66,rest:28},
  crescentArc:{tell:31,active:62,rest:28},
  bankShot:{tell:30,active:49,rest:31},
  skimmer:{tell:28,active:52,rest:29},
  splitArc:{tell:32,active:55,rest:27},
  arenaHazard:{tell:30,active:67,rest:29},
  comet:{tell:28,active:50,rest:26},
  ripple:{tell:30,active:54,rest:27},
  minefall:{tell:32,active:58,rest:29},
  floorSaw:{tell:27,active:51,rest:28},
  hammer:{tell:34,active:53,rest:26},
  starCross:{tell:29,active:54,rest:28},
  needleFall:{tell:30,active:58,rest:27},
  eyeShot:{tell:36,active:55,rest:26},
  shieldPulse:{tell:84,active:32,rest:28},
  ceilingSweep:{tell:78,active:Math.round(28/SWEEP_SPEED),rest:30},
  airMechaMissiles:{tell:43,active:67,rest:35}
};
for (const [name,shots] of Object.entries({...SIGNATURE_PATTERNS,...FLIGHT_PATTERNS})) {
  moves[name]={tell:32,active:shots.at(-1)[0]+23,rest:27};
}
const MAX_HP=5, PHASE_ONE_HEALTH=1065;
const DENSITY_SECOND_GAP=900;
const BOSS_HOME=1010, BOSS_MIN=798, BOSS_MAX=1070, BOSS_FRONT=205;
const MECHA_ROCKETS=['mechaMissile','mechaArc','mechaHoming','mechaWave'];
const MISSILE_COOLDOWN=120, BOMB_COOLDOWN=180;
const SHIELD_DURATION=60, SAUCER_SHIELD_DURATION=180, SHIELD_COOLDOWN=600;
const boxes = {
  spark:{color:'#ffde65',art:'player/higgsfield/spit'},
  greenLaser:{color:'#9aff8f',art:'player/higgsfield/saucer/laser'},
  redLaser:{color:'#ff6274',art:'player/higgsfield/saucer/red-laser'},
  beachBall:{color:'#ffd75c'},
  mechaMissile:{w:80,h:34,color:'#ff975f'},
  mechaArc:{w:76,h:34,color:'#9accff'},
  mechaHoming:{w:72,h:33,color:'#f4a8ff'},
  mechaWave:{w:82,h:28,color:'#ffdc84'},
  missile:{color:'#6aebff',art:'player/higgsfield/missile',scale:2,speed:.6},
  bomb:{color:'#99fb92',art:'player/higgsfield/bomb'},
  boulder:{w:33,h:30,color:'#ff9356'},
  prism:{w:35,h:13,color:'#ff6884'},
  pumpkin:{w:25,h:25,color:'#ffba58'},
  orb:{w:19,h:19,color:'#f3a1ff'},
  gear:{w:38,h:38,color:'#ff8b50'},
  lantern:{w:21,h:43,color:'#ffba54'},
  barnFire:{w:36,h:44,color:'#ff9b52'},
  bioBubble:{w:43,h:43,color:'#c9ff75'},
  slab:{w:35,h:35,color:'#82d6ff'},
  crescent:{w:31,h:37,color:'#ed91ff'},
  comet:{w:33,h:15,color:'#8ff6ff'},
  pearl:{w:27,h:27,color:'#fd9eff'},
  mine:{w:31,h:30,color:'#ffd276'},
  saw:{w:34,h:34,color:'#ff5d72'},
  hammer:{w:35,h:22,color:'#ffd197'},
  star:{w:28,h:28,color:'#ff85c7'},
  needle:{w:14,h:33,color:'#ff6852'},
  eye:{w:33,h:26,color:'#d9a6ff'}
};
const playerImpacts = {
  spark:{art:'spit-impact',duration:7,opacity:.65},
  greenLaser:{art:'saucer/muzzle',duration:7,opacity:.7,size:.52},
  redLaser:{art:'missile-impact',duration:12,opacity:.8,size:.8},
  beachBall:{art:'bomb-impact',duration:16,opacity:.85},
  missile:{art:'missile-impact',duration:15,opacity:1},
  bomb:{art:'bomb-impact',duration:19,opacity:1}
};
const bossShotArt = {
  boulder:['ground-shot',50,42],
  prism:['high-shot',67,23],
  pumpkin:['bounce-shot',43,43],
  orb:['spread-shot',36,36],
  laser:['crossfire-laser',71,23],
  gear:['gear',52,52],
  lantern:['lantern',25,60],
  slab:['slab',52,52],
  crescent:['crescent',42,55],
  comet:['sections/comet',60,28],
  pearl:['sections/pearl',44,44],
  mine:['sections/mine',49,46],
  saw:['sections/saw',53,53],
  hammer:['sections/hammer',57,36],
  star:['sections/star',46,46],
  needle:['sections/needle',25,54],
  eye:['sections/eye',55,42],
  mechaMissile:['mecha/missile',129,56],
  mechaArc:['mecha/arc-rocket',119,58],
  mechaHoming:['mecha/homing-rocket',114,55],
  mechaWave:['mecha/wave-rocket',128,42]
};
const signatureArt = {
  anchor:[42,58,'#ffbd7a'],torpedo:[67,26,'#ff9474'],bell:[43,52,'#a6ffee'],urchin:[49,49,'#e6a4ff'],
  joystick:[44,52,'#ff8ed6'],token:[48,48,'#ffd37d'],dice:[48,48,'#a3a9ff'],pinball:[44,44,'#ff8282'],
  ironball:[52,52,'#ffb066'],anvil:[54,43,'#ff8970'],buzzblade:[51,51,'#c0efff'],shard:[54,36,'#ff91cb'],
  scarab:[48,49,'#cc94ff'],diamond:[48,48,'#a5f9ff'],solar:[51,51,'#ffdd86'],trident:[56,39,'#e7a2ff'],
  prismwedge:[56,39,'#ff8b98'],portal:[52,52,'#8efcff'],meteor:[49,48,'#ffc985'],hourglass:[43,56,'#d7acff']
};
for (const [name,[w,h,color]] of Object.entries(signatureArt)) {
  boxes[name]={w:Math.round(w*.72),h:Math.round(h*.72),color};
  bossShotArt[name]=['signatures/'+name,w,h];
}
const bossAttackImage=name=>picture(`art/attacks/boss/higgsfield/${name}.png`);
const isFlying=()=>Boolean(LEVELS[levelIndex]?.flight);
const isChase=()=>Boolean(LEVELS[levelIndex]?.chase);
const hasMecha=b=>isFlying() && b.phase===2 && LEVELS[levelIndex].id!==7;
const mechaY=b=>b.y-210;
const bossWeakY=b=>hasMecha(b)?mechaY(b)-58:b.y-222;
const shieldDuration=()=>isFlying()?SAUCER_SHIELD_DURATION:SHIELD_DURATION;
const shieldPulseWindup=()=>isFlying()?204:84;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const active = (...codes) => codes.some(code => keys.has(code));
const tapped = (...codes) => codes.some(code => pressed.has(code));
// One player's input for one simulation tick. The simulation reads only this, never the key sets,
// so a second local player or a lockstep network peer can supply frames the same way.
const NO_INPUT=Object.freeze({left:false,right:false,up:false,down:false,jump:false,jumpHeld:false,dash:false,shield:false,missile:false,bomb:false});
function readKeyboardFrame() {
  return {
    left:active('ArrowLeft','KeyA'), right:active('ArrowRight','KeyD'),
    up:active('ArrowUp','KeyW'), down:active('ArrowDown','KeyS'),
    jump:tapped('Space','ArrowUp','KeyW'), jumpHeld:active('Space','ArrowUp','KeyW'),
    dash:tapped('ShiftLeft','ShiftRight'), shield:tapped('KeyX'),
    missile:tapped('KeyC'), bomb:tapped('KeyV')
  };
}
let inputFrame=NO_INPUT;
let replayRecorder=null,phaseCheckpointRun=false,phasePowerupsState=null,runAttempt=0;
// Seeded stream for cosmetic randomness inside the simulation (reset by begin()).
function seededRandom(seed) {
  let state=seed>>>0;
  return ()=>{
    state=(state+0x6d2b79f5)>>>0;
    let t=Math.imul(state^state>>>15,1|state);
    t=(t+Math.imul(t^t>>>7,61|t))^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
let cosmeticRandom=seededRandom(1);
let godMode=false, godFire=true, godDamageBoost=false, godHits=0, lastNine=-Infinity;
// True when god mode was on at any point in the current level. Such clears earn no Tickets.
let godUsed=false;
const controls = new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Space','KeyX','KeyC','KeyV','ShiftLeft','ShiftRight','Escape']);
let mode = 'loading', player, boss, bullets, sparks, impacts, hazards, camera, time, banner, audio, transition, shake, levelIndex, phaseShift, vaultBeam;
let densityShots=[],densityPausedTicks=0,densityPhaseClock=0,densityPhaseKey='',densityLastCycle=-1,densityLastEnd=0;
const tileCache=new Map();

function picture(path) {
  if (!pictures.has(path)) {
    const image = new Image();
    image.src = path;
    pictures.set(path, image);
  }
  return pictures.get(path);
}

function loopPanels(index) {
  const level=LEVELS[index];
  return GENERATED_LOOPS[mechanicsIndex(index)]?.panels ?? [
    [level.art.slice(4),level.foot],
    ...LEVEL_EXTENSIONS[mechanicsIndex(index)].map(name=>[name+'.jpg',.83])
  ];
}

function sceneryTile([file,foot],width) {
  const key=width+':'+file;
  const existing=tileCache.get(key);
  if (existing) {
    tileCache.delete(key);
    tileCache.set(key,existing);
    return existing;
  }
  const image=picture('art/'+file);
  if (!image.naturalWidth) return null;
  const tile=makePanoramaTile(image,foot,width);
  tileCache.set(key,tile);
  if (tileCache.size>8) tileCache.delete(tileCache.keys().next().value);
  return tile;
}

function drawBackground() {
  if (isCodebreak()) return drawCodebreakBackground();
  if (mode!=='title' && mode!=='won' && boss?.phase===2) {
    const tile=sceneryTile(STATIC_ARENAS[mechanicsIndex(levelIndex)],W);
    if (tile) {
      ctx.drawImage(tile,0,0);
      return;
    }
  }
  const panels=loopPanels(levelIndex);
  const generated=GENERATED_LOOPS[mechanicsIndex(levelIndex)];
  const width=generated?GENERATED_PANEL_WIDTH:PANEL_WIDTH;
  const blend=generated?.overlap??128, stride=width-blend;
  const first=Math.max(0,Math.floor((camera-blend)/stride));
  const last=Math.floor((camera+W-1)/stride);
  for (let i=last;i<=last+2;i++) picture('art/'+panels[i%panels.length][0]);
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  for (let i=first;i<=last;i++) {
    const tile=sceneryTile(panels[i%panels.length],width) ?? sceneryTile(panels[0],width);
    if (!tile) continue;
    const x=i*stride-Math.round(camera);
    if (i===first) ctx.drawImage(tile,x,0);
    else {
      ctx.drawImage(tile,blend,0,width-blend,H,
        x+blend,0,width-blend,H);
      for (let stripe=0;!generated && stripe<blend;stripe+=8) {
        ctx.globalAlpha=(stripe+8)/blend;
        ctx.drawImage(tile,stripe,0,8,H,x+stripe,0,8,H);
      }
    }
  }
  ctx.restore();
}

function drawArenaMotion() {
  if (boss.phase===2) {
    drawPhaseTwoAtmosphere(ctx,mechanicsIndex(levelIndex),time);
  } else if (mechanicsIndex(levelIndex)===0) {
    ctx.save();
    ctx.globalCompositeOperation='screen';
    drawBackdropSprite(ctx,0,time,[230,260,660,37,112,4,.033,.28]);
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

function walk(id, distance, frameDistance=12) {
  const art = ART.sprites[id];
  const loop = art.walk.length ? art.walk : [art.poses[2],art.poses[3],art.poses[4],art.poses[5]];
  const step=Math.floor(distance/frameDistance);
  return loop[((step%loop.length)+loop.length)%loop.length];
}

function sound(freq, end, length, volume = .04) {
  if (!audio || audio.state !== 'running') return;
  // story-audio.js synthesises a voice for each call site; without it, the original sweep.
  if (window.ArcadeAudio?.sfx(audio,freq,end,length,volume)) return;
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

// ---- Fail screen and first-run card (browser only; setOverlay is a stub in the server build).
// What ended the run, how far it got, one tip, and what Retry does. Built from the state at the
// moment of the knockout, so hurt() keeps its own strings and the simulation is untouched.
const FAIL_TIPS={
  barrage:{gap:'Barrage tip: every wall has one gap. Fly to it early; the gap shifts between walls.',
    ground:'Barrage tip: read the row. Chest-high rows: crouch. Floor rows: jump. Floor rows with missiles overhead: tap jump for a short hop. A dash also passes through.'},
  ceilingSweep:()=>'Tip: the ceiling sweep cannot be dashed or out-jumped. Hold crouch ('+crouchPrompt()+') until it passes, or raise the shield ('+shieldPrompt()+').',
  shieldPulse:()=>'Tip: only the shield stops a pulse. Press '+shieldPrompt()+' when the cue line says SHIELD NOW; the boss waits until your shield is ready.',
  shot:'Tip: a dash passes through shots and columns. Dash through what you cannot jump.'
};
function failReport(reason) {
  const lines=[];
  if (isChase()) {
    lines.push(densityShots.length?'Knocked out by the missile barrage.':/wins this round/.test(reason)?'Knocked out by Goldie\'s '+CHASE_ATTACKS[boss.attackIndex].name.toLowerCase()+'.':reason);
    lines.push('Rooftops crossed: '+Math.round(clamp((camera+player.x)/CHASE_FINISH,0,1)*100)+'%');
    lines.push(densityShots.length?FAIL_TIPS.barrage.ground:'Tip: hold jump for a long leap and tap it again in the air. A dash keeps its height across a gap.');
    lines.push('Retry restarts the chase.');
    return lines.join('\n');
  }
  const climb=isCodebreak()&&boss.phase===1,barrage=densityShots.length>0;
  const fell=!/wins this round/.test(reason);
  const cause=fell?reason:barrage?'Knocked out by the missile barrage.':
    isCodebreak()?'Knocked out by the Sheriff\'s '+attackForCodebreak().name.toLowerCase()+'.':
    boss.move==='ceilingSweep'?'Caught standing under the ceiling sweep.':
    boss.move==='shieldPulse'?'Hit by the shield pulse.':
    boss.move?'Knocked out during '+moveLabel(boss.move).split(' · ')[0]+'.':'Knocked out.';
  lines.push(cause);
  if (climb) lines.push('Phase 1 · climb '+Math.round(clamp(camera/CODE_LOOP,0,1)*100)+'% complete');
  else if (isCodebreak()) lines.push('Phase 2 · Sheriff at '+Math.ceil(boss.hp/boss.max*100)+'%');
  else lines.push('Phase '+boss.phase+' · section '+(healthSection(boss)+1)+' of 4 · '+boss.name+' at '+Math.ceil(boss.hp/boss.max*100)+'%');
  if (barrage) lines.push(isFlying()||densityShots[0].vertical?FAIL_TIPS.barrage.gap:FAIL_TIPS.barrage.ground);
  else if (fell) lines.push('Tip: land on the wide platforms and save the air jump for a missed ledge.');
  else if (!isCodebreak() && boss.move==='ceilingSweep') lines.push(FAIL_TIPS.ceilingSweep());
  else if (!isCodebreak() && boss.move==='shieldPulse') lines.push(FAIL_TIPS.shieldPulse());
  else lines.push(FAIL_TIPS.shot);
  // Reward wording follows reportHubClear() in hub-link.js.
  if (boss.phase===2) {
    const hub=Boolean(window.ArcadeHub?.connected?.());
    lines.push('Retry restarts phase 2 with full health. A clear after a checkpoint retry saves your progress'+
      (hub?' but earns no Tickets.'+(LEVELS[levelIndex].id===1?' The Breakwater Coin still counts.':''):'.'));
  } else lines.push('Retry restarts '+(isCodebreak()?'the climb':'phase 1')+'.');
  return lines.join('\n');
}
const COACH_KEY='sproto-arcade-coach-v1';
function coachSeen() { try { return localStorage.getItem(COACH_KEY)==='1'; } catch { return true; } }
function coachDone() { try { localStorage.setItem(COACH_KEY,'1'); } catch {} }
function coachText() {
  const pad=padPrompts();
  return [
    pad?'Move: left stick or D-pad  ·  Jump: A, and again in the air  ·  Crouch: stick down':'Move: ← →  ·  Jump: Space, and again in the air  ·  Crouch: ↓',
    (pad?'Dash (B / RT)':'Dash (Shift)')+' passes through shots, columns and missiles.',
    'Shield ('+shieldPrompt()+') is the only answer to a SHIELD PULSE. Crouch or shield under a CEILING SWEEP.',
    'When the cue line says EXPOSED, jump into the ring for triple damage.',
    (pad?'Y and RB':'C and V')+' fire your two specials. In flight levels you fly in all four directions.',
    'Read the cue line under the boss bar: it names each attack and tells you when to act.'
  ].join('\n');
}

function setOverlay(next, label, title, description, button) {
  if (next==='lost') description=failReport(description);
  mode = next;
  window.ArcadeAudio?.music.duck(next!=='play');
  const audioControls=document.getElementById('audio-controls');
  if (audioControls) audioControls.hidden=next!=='paused';
  overlay.hidden = next === 'play';
  levelSelect.parentElement.hidden = next!=='title' && next!=='won';
  sprotoSelect.hidden=levelSelect.parentElement.hidden;
  ui.eyebrow.textContent = label;
  ui.title.textContent = title;
  ui.description.textContent = description;
  ui.start.textContent = button;
  if (!overlay.hidden) ui.start.focus();
}

function showLevelControls() {
  const flying=isFlying(), chase=isChase();
  for (const element of document.querySelectorAll('[data-flight-only], [data-ground-only], [data-boss-only]')) {
    element.hidden=(chase && element.hasAttribute('data-boss-only')) ||
      (!flying && element.hasAttribute('data-flight-only')) ||
      (flying && element.hasAttribute('data-ground-only'));
  }
  document.querySelector('#ground-auto-fire').hidden=chase || flying || isCodebreak();
  document.querySelector('#tracking-auto-fire').hidden=!isCodebreak();
}

function begin(index = firstLevel, carryShield = false, checkpointPhase = 1, seedOverride = null) {
  if(LEVELS[index]?.id===13&&!REDKEV_READY)return;
  const shieldWait=carryShield?player.shieldWait:0;
  levelIndex = index;
  godUsed=godMode;
  showLevelControls();
  levelSelect.value = String(index);
  document.title = LEVELS[index].title + ' • Sproto Arcade';
  gameScreen.classList.remove('stage-blackout');
  hud.hidden = false;
  setOverlay('play','','','','');
  const seed=(seedOverride??window.crypto?.getRandomValues(new Uint32Array(1))[0]??(0x5eed+index+runAttempt++))>>>0;
  resetRun(index,selectedSproto.id,shieldWait,seed);
  phaseCheckpointRun=checkpointPhase===2;
  if(phaseCheckpointRun){
    if(isCodebreak())startCodebreakArena();
    else if(!isChase()){
      boss.phase=2;boss.section=0;boss.hp=boss.max=boss.phaseTwoHealth;boss.step=0;startMove();
      announce(PHASE_TWO_NAMES[mechanicsIndex(levelIndex)],85);
    }
  }
  // Replay log for the hub (runtime/story/replay.js): every tick's input frame from here on.
  replayRecorder=phaseCheckpointRun?null:window.ArcadeReplay?.recorder({simVersion:window.ARCADE_SIM_VERSION,seed,level:LEVELS[index].id,pilot:selectedSproto.id,shieldWait})??null;
  if(typeof storyRunStart==='function')storyRunStart();
  refreshHud();
  prefetchLevel(index);
  if(nextCampaignLevel(index)>=0)prefetchLevel(nextCampaignLevel(index));
}

// ---- Run results, ranks, music cues and hit feedback. Browser only: called from begin(),
// refreshHud(), clearLevel() and render(), none of which the server build keeps, and everything
// is derived from simulation state without writing to it.
const fmtTicks=ticks=>{const tenths=Math.floor(ticks/6);return Math.floor(tenths/600)+':'+String(Math.floor(tenths/10)%60).padStart(2,'0')+'.'+tenths%10;};
const storyPar=index=>(typeof STORY_PAR_TICKS!=='undefined'&&STORY_PAR_TICKS[LEVELS[index].id])||Infinity;
let runStats={hits:0,hp:MAX_HP,absorbed:null};
const feedback={barrageAt:-Infinity,barrageLive:false,fromRight:true,pops:[],seen:new WeakSet()};
function storyRunStart() {
  runStats={hits:0,hp:player.hp,absorbed:phasePowerupsState?.items.absorbedAt??null};
  Object.assign(feedback,{barrageAt:-Infinity,barrageLive:false,pops:[]});
  barrageCue={key:'',floor:0,endedAt:-Infinity};
  if (audio?.state==='running') window.ArcadeAudio?.music.start(audio,LEVELS[levelIndex].id,boss?.phase===2?2:1);
}
// Every tick, from refreshHud: a hit is a lost heart or a broken pickup shield.
function trackRun() {
  const absorbed=phasePowerupsState?.items.absorbedAt??null;
  if (player.hp<runStats.hp) runStats.hits+=runStats.hp-player.hp;
  else if (absorbed!==null && absorbed!==runStats.absorbed) runStats.hits++;
  runStats.hp=player.hp;
  runStats.absorbed=absorbed;
  if (boss?.phase===2) window.ArcadeAudio?.music.phase(2);
  ui.hearts.classList?.toggle('hit',player.inv>=58 && player.hp>0);
}
// The result lines for the clear screen. A full run without god mode is ranked and can set a best;
// a phase-2 checkpoint clear is rank C and never touches the best (docs/PHASE-POWERUPS.md).
function clearResults() {
  const P=window.ArcadeProgress,par=storyPar(levelIndex),ticks=time,hits=runStats.hits;
  const stats='Hits '+hits+'  ·  Hearts '+player.hp+'/'+MAX_HP;
  if (godUsed) return 'Time '+fmtTicks(ticks)+'  ·  God mode: no rank and no best time';
  if (phaseCheckpointRun) return 'Phase 2 from the checkpoint: '+fmtTicks(ticks)+'  ·  '+stats+'\nRank C  ·  Checkpoint clear. Your full-run best is unchanged'+
    (window.ArcadeHub?.connected?.()?', and a checkpoint clear earns no Tickets.':'.');
  const rank=P?.rankFor?.({ticks,hits,par})??'B';
  const saved=window.ArcadeHub?.recordBest?.(levelIndex,{ticks,hits,rank});
  const best=saved?.best;
  return 'Time '+fmtTicks(ticks)+(Number.isFinite(par)?' (par '+fmtTicks(par)+')':'')+'  ·  '+stats+'\nRank '+rank+
    (saved?.improved?'  ·  New best!':best?'  ·  Best: '+best.rank+' in '+fmtTicks(best.ticks):'');
}
// Level select: rank and best time beside each level, and how many are cleared.
function paintLevelSelect() {
  const save=window.ArcadeHub?.state?.save,order=campaignLevelIndices();
  for (const option of levelSelect.options) {
    const index=Number(option.value),best=save?.best?.[index];
    option.textContent=String(campaignLevelNumber(index)).padStart(2,'0')+' · '+LEVELS[index].title+
      (best?'  —  '+best.rank+'  '+fmtTicks(best.ticks):save?.cleared?.includes(index)?'  —  cleared':'');
  }
  const count=document.getElementById('cleared-count');
  if (count) count.textContent=save?order.filter(index=>save.cleared.includes(index)).length+' of '+order.length+' cleared':'';
}
// Drawn last, over the scene: weak-spot hit numbers, the flash when the player is hit, the
// one-heart vignette and the sweep that announces a barrage. No hit-stop; timing is untouched.
function drawFeedback() {
  if (!player || !['play','paused'].includes(mode)) return;
  ctx.save();
  if (boss && !isChase() && !isCodebreak()) {
    const m=boss.move && moves[boss.move],exposed=m && boss.age>boss.tell+m.active;
    for (const impact of impacts) {
      if (impact.age>2 || feedback.seen.has(impact)) continue;
      feedback.seen.add(impact);
      if (exposed && (impact.art==='spit-impact'||impact.art==='saucer/muzzle') && Math.abs(impact.y-bossWeakY(boss))<34) feedback.pops.push({x:impact.x,y:impact.y,at:time});
    }
  }
  feedback.pops=feedback.pops.filter(pop=>time>=pop.at && time-pop.at<30);
  for (const pop of feedback.pops) {
    const age=time-pop.at,fade=1-age/30;
    if (age<10) {
      ctx.globalAlpha=1-age/10;
      ctx.strokeStyle='#fff3c4';
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.arc(pop.x,pop.y,14+age*4.5,0,Math.PI*2);
      ctx.stroke();
      for (let ray=0;ray<6;ray++) {
        const angle=ray*Math.PI/3+.4,inner=20+age*4,outer=inner+14;
        ctx.beginPath();
        ctx.moveTo(pop.x+Math.cos(angle)*inner,pop.y+Math.sin(angle)*inner);
        ctx.lineTo(pop.x+Math.cos(angle)*outer,pop.y+Math.sin(angle)*outer);
        ctx.stroke();
      }
    }
    ctx.globalAlpha=Math.min(1,fade*1.6);
    ctx.font='900 30px system-ui,sans-serif';
    ctx.textAlign='center';
    ctx.lineWidth=5;
    ctx.strokeStyle='#2a1026';
    ctx.fillStyle='#ffe07a';
    ctx.strokeText('3',pop.x,pop.y-18-age*1.6);
    ctx.fillText('3',pop.x,pop.y-18-age*1.6);
  }
  ctx.globalAlpha=1;
  if (densityShots.length && !feedback.barrageLive) { feedback.barrageAt=time; feedback.fromRight=densityShots[0].vx<=0; }
  feedback.barrageLive=densityShots.length>0;
  const sweep=time-feedback.barrageAt;
  if (sweep>=0 && sweep<40) {
    // A hazard band crosses the screen from the side (or edge) the missiles come from.
    const progress=sweep/40,vertical=densityShots[0]?.vertical,span=vertical?H:W,head=progress*(span+360)-180;
    ctx.globalAlpha=.34*(1-progress*progress);
    ctx.fillStyle='#ffb347';
    for (let stripe=0;stripe<5;stripe++) {
      const at=head-stripe*46;
      ctx.beginPath();
      if (vertical) { ctx.moveTo(0,at);ctx.lineTo(W,at-70);ctx.lineTo(W,at-46);ctx.lineTo(0,at+24); }
      else { const x=feedback.fromRight?W-at:at,lean=feedback.fromRight?70:-70; ctx.moveTo(x,0);ctx.lineTo(x+24*Math.sign(lean),0);ctx.lineTo(x+24*Math.sign(lean)+lean,H);ctx.lineTo(x+lean,H); }
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  if (mode==='play' && player.hp>0 && player.inv>=69) {
    ctx.fillStyle='#ffffff38';
    ctx.fillRect(0,0,W,H);
  }
  if (player.hp===1) {
    const pulse=.40+.12*Math.sin(time*.13),edge=ctx.createRadialGradient(W/2,H/2,H*.36,W/2,H/2,H*.92);
    edge.addColorStop(0,'rgba(190,20,45,0)');
    edge.addColorStop(1,'rgba(190,20,45,'+pulse.toFixed(3)+')');
    ctx.fillStyle=edge;
    ctx.fillRect(0,0,W,H);
  }
  ctx.restore();
}

// The simulation part of begin(): no DOM. dist/arcade-sim.server.js replays runs through this.
function resetRun(index, pilot, shieldWait, seed) {
  levelIndex = index;
  cosmeticRandom=seededRandom(seed);
  inputFrame=NO_INPUT;
  densityShots=[];densityPausedTicks=0;densityPhaseClock=0;densityPhaseKey='';densityLastCycle=-1;densityLastEnd=0;
  time = 0;
  camera = 0;
  shake = 0;
  transition = 0;
  phaseShift = 0;
  vaultBeam = null;
  player = {id:pilot,x:isChase()?220:260,y:isChase()?CHASE_START_Y:isCodebreak()?528:isFlying()?340:FLOOR,vx:0,vy:0,hp:MAX_HP,inv:0,
    grounded:true,crouch:false,dash:0,dashWait:0,airDash:true,shot:0,distance:0,jumpBuffer:0,airJump:true,missileWait:0,bombWait:0,shield:0,shieldWait};
  mode = 'play';
  if (isCodebreak()) startCodebreak();
  else if (isChase()) startChase();
  else startBoss();
  // After the encounter exists: the item plan is spread over the phase's expected length.
  phasePowerupsState=typeof ArcadePhasePowerups!=='undefined'&&ArcadePhasePowerups.assetsReady?{seed,phase:0,tick:0,items:ArcadePhasePowerups.create({seed,phase:0,span:powerupSpan(0)})}:null;
}

// Expected length of a phase attempt in ticks, for spreading the two pickups over it
// (docs/PHASE-POWERUPS.md). Phase 1 follows the boss's health: the golden bot spends 6.0 to 7.5
// ticks per point of it.
function powerupSpan(phase) {
  if (isChase()) return 7200;
  if (isCodebreak()) return phase?1800:5000;
  return phase?1400:Math.round(boss.max*6.2);
}

// Everything the simulation carries between ticks; the replay end-state hash covers all of it.
function simState() {
  return {mode,time,levelIndex,camera,shake,banner,transition,phaseShift,vaultBeam,player,boss,...(phasePowerupsState?{phasePowerupsState}:{}),
    ...(ArcadeDensityAttacks.enabled?{densityShots,densityPausedTicks,densityPhaseClock,densityPhaseKey,densityLastCycle,densityLastEnd}:{}),
    bullets,hazards,sparks,impacts,codeShots:isCodebreak()?codeShots:[]};
}

function startBoss() {
  const [archetype,cadence,shotRate]=BOSS_PROFILES[mechanicsIndex(levelIndex)];
  const kit=acts[levelIndex];
  boss = {...kit,archetype,cadence,shotRate,x:BOSS_HOME,y:LEVELS[levelIndex].id===7?FLOOR-70:FLOOR,hp:PHASE_ONE_HEALTH,max:PHASE_ONE_HEALTH,phaseTwoHealth:Math.ceil(kit.hp/2),scale:kit.id==='sprotosales'?4.65:4.40,
    phase:1,section:0,step:0,age:0,tell:0,laserCycle:-1,rocketClock:0,rocketIndex:0,rocketFlash:0,pulses:new Set(),move:null,flash:0,lanes:[],startX:BOSS_HOME,distance:0,moving:false};
  player.hp=MAX_HP;
  player.inv=35;
  bullets=[];
  hazards=[];
  sparks=[];
  impacts=[];
  announce(kit.name + '  •  ' + kit.tag,100);
}

// Hub report ids for each level's boss (docs/SERVER-SIM.md): the acts ids, then Goldie and the
// Bitcoin Sheriff. Only `bront` is confirmed by the hub so far.
const STORY_BOSS_IDS=LEVELS.map(l=>l.id===11?'goldie':l.id===12?'bitcoin_sheriff':acts[l.id-1].id);

function clearLevel() {
  // Replay log of this run, claiming the clear at this tick with this end state.
  const claim={stage:LEVELS[levelIndex].id,bossId:STORY_BOSS_IDS[levelIndex],ticks:time,endHash:window.ArcadeReplay?.hashState(simState())};
  const replay=replayRecorder?.finish({godMode:godUsed,claimed:claim})??null;
  replayRecorder=null;
  // Hub link. Every clear, a phase-2 checkpoint clear included, saves local progress and unlocks.
  // First-boss retries still report the Relic. Tickets and immediate cloud saves require a full run.
  const opened=window.ArcadeHub?.recordLocalClear(levelIndex)??[];
  // Time, hits, hearts and rank; a full-run best is saved before the hub report pushes the save.
  const results=typeof clearResults==='function'?clearResults():'';
  window.ArcadeHub?.reportHubClear(levelIndex,godUsed,replay,{checkpoint:phaseCheckpointRun});
  if (opened.length) paintSprotoLocks();
  if (nextCampaignLevel(levelIndex)<0) {
    levelSelect.value=String(firstLevel);
    setOverlay('won','Campaign clear','That’s all, Sproto!',isChase()?'You escaped across the rooftops.':'The last giant is down.','Play again');
  } else {
    setOverlay('clear','Level clear',LEVELS[levelIndex].title,'Next up: '+LEVELS[nextCampaignLevel(levelIndex)].title,'Next level');
  }
  if (opened.length) ui.description.textContent+='  ·  New Sproto: '+opened.map(id=>playable.find(p=>p.id===id)?.name??id).join(', ');
  if (results) { ui.description.textContent=results+'\n'+ui.description.textContent; paintLevelSelect(); }
}

// ---- Cue line (browser only; refreshHud is a stub in the server build, so nothing here is simulated).
// Attack names shown during a tell, as the chase and the climb already do.
const MOVE_LABELS={
  quake:'SHOCKWAVE · JUMP IT',sweep:'DOUBLE SHOCKWAVE · JUMP IT',slabs:'VOLLEY · HIGH THEN LOW',rush:'CHARGE · BACK OFF',
  rain:'RAIN FROM ABOVE',ricochet:'BOUNCING VOLLEY',fan:'FAN SPREAD',drop:'LEAP SLAM · MOVE',crossfire:'CROSSFIRE · BOTH SIDES',
  eruption:'ERUPTION · LEAVE THE MARKS',rift:'RIFT COLUMNS · LEAVE THE MARKS',gearPincer:'PINCER · LOW, BOTH SIDES',
  lanternShower:'FALLING SHOWER',slabGates:'GATES · HIGH THEN LOW',crescentArc:'ARC SPREAD',bankShot:'BANK SHOT · IT BOUNCES',
  skimmer:'SKIMMER · LOW THEN HIGH',splitArc:'SPLIT ARC',comet:'DIVING COMETS',ripple:'RIPPLE · IT BOUNCES',minefall:'FALLING MINES',
  floorSaw:'FLOOR SAWS · JUMP',hammer:'HAMMERS · HIGH THEN LOW',starCross:'STAR CROSS',needleFall:'NEEDLE RAIN',eyeShot:'AIMED SHOTS',
  airMechaMissiles:'MISSILE RACK',anchorRun:'ANCHOR DROP · THEN TORPEDO',bellSweep:'BELL DROP',cabinetRush:'CABINET RUSH · BOTH SIDES',
  casinoBounce:'CASINO BOUNCE',forgePress:'FORGE PRESS',frostRotor:'ROTOR BLADES · BOTH SIDES',crystalFlank:'CRYSTAL FLANK · BOTH SIDES',
  scarabSkitter:'SCARAB SKITTER · BOTH SIDES',diamondStep:'DIAMOND STEP',solarVolley:'SOLAR VOLLEY',tridentArc:'TRIDENT ARC',
  prismRicochet:'PRISM RICOCHET · BOTH SIDES',portalRing:'PORTAL RING',meteorFall:'METEOR FALL',hourglassDrop:'HOURGLASS DROP',
  airLanes:'LANE SHOTS',airBarrage:'SPREAD SHOTS',airDive:'DIVE FROM ABOVE',airFork:'FORK',airLift:'RISING SHOTS · FROM BELOW',
  airSpiral:'SPIRAL',airPincer:'PINCER · BOTH SIDES',airCrossfire:'CROSSFIRE · BOTH SIDES',airRain:'NEEDLE RAIN',
  airRockets:'ROCKETS · BOTH SIDES',airWings:'WINGS · ABOVE AND BELOW',airMines:'DRIFTING MINES'
};
const moveLabel=move=>MOVE_LABELS[move]??String(move).replace(/([a-z])([A-Z])/g,'$1 $2').toUpperCase();
const padPrompts=()=>document.documentElement?.dataset?.input==='gamepad';
const crouchPrompt=()=>padPrompts()?'STICK ↓':'↓';
const shieldPrompt=()=>padPrompts()?'X / LT':'X';
// What the nearest incoming barrage wave asks for: 'gap', 'crouch', 'hop' or 'jump'.
let barrageCue={key:'',floor:0,endedAt:-Infinity};
function barrageLane() {
  if (!densityShots.length) return '';
  const first=densityShots[0],scale=isCodebreak()?CODE_CHARACTER_SCALE:1;
  if (first.vertical || isFlying()) return 'gap';
  const key=first.id.split('-').slice(0,4).join('-');
  // Every ground plan has a floor row; its lowest missile centre sits about 24px above the floor.
  if (barrageCue.key!==key) barrageCue={...barrageCue,key,floor:Math.max(...densityShots.map(shot=>shot.y+shot.h/2))+24*scale};
  const incoming=densityShots.filter(shot=>shot.vx<0?shot.x+shot.w>player.x-24:shot.x<player.x+24);
  if (!incoming.length) return '';
  const lead=incoming.reduce((a,b)=>b.delay<a.delay?b:a),wave=lead.id.split('-')[4];
  const centres=incoming.filter(shot=>shot.id.split('-')[4]===wave).map(shot=>barrageCue.floor-(shot.y+shot.h/2));
  const low=Math.min(...centres);
  return low>60*scale?'crouch':centres.some(height=>height>150*scale)?'hop':'jump';
}
function barrageCueText() {
  const lane=barrageLane();
  const hint=lane==='gap'?(isFlying()?'FLY THROUGH THE GAP':'MOVE UNDER THE GAP'):lane==='crouch'?'CROUCH ('+crouchPrompt()+')':lane==='hop'?'SHORT HOP':lane==='jump'?'JUMP':'';
  return 'MISSILE BARRAGE · GUNS OFFLINE'+(hint?' · '+hint:'');
}
// Called every tick by refreshHud: the barrage line while missiles fly, then "BARRAGE OVER" for 45 frames.
function barrageCueLine() {
  if (mode==='lost') { barrageCue.active=false; return ''; }
  if (densityShots.length) { barrageCue.active=true; return barrageCueText(); }
  if (barrageCue.active) { barrageCue.active=false; barrageCue.endedAt=time; }
  return time-barrageCue.endedAt<45 && time>=barrageCue.endedAt?'BARRAGE OVER · GUNS ONLINE':'';
}
function setCue(message) {
  if (ui.cue.textContent!==message) ui.cue.textContent=message;
  ui.cue.classList.toggle('urgent',/^(CEILING SWEEP|SHIELD NOW|MISSILE BARRAGE)/.test(message));
}

function refreshHud() {
  trackRun();
  ui['god-mode'].hidden=!godMode;
  ui['god-mode'].textContent='GOD MODE · HITS '+godHits+' · Z FIRE '+(godFire?'ON':'OFF')+' · I '+(godDamageBoost?'20×':'6×')+' DMG';
  ui.hearts.textContent = '♥'.repeat(player.hp) + '♡'.repeat(MAX_HP-player.hp);
  ui.count.textContent = 'LEVEL ' + campaignLevelNumber(levelIndex) + ' / ' + campaignLevelIndices().length;
  ui.location.textContent = LEVELS[levelIndex].title;
  ui.boss.hidden = !boss;
  if (player.shield) ui['shield-status'].textContent='Active';
  else showCooldown(ui['shield-status'],player.shieldWait);
  if (isChase()) {
    ui.boss.firstElementChild.textContent='GOLDIE · ROOFTOP CHASE';
    ui.boss.querySelector('progress').value=clamp((camera+player.x)/CHASE_FINISH,0,1);
    setCue(barrageCueLine()||(authoredTime()<110?'KEEP MOVING · JUMP THE GAPS':boss.attackAge<45?CHASE_ATTACKS[boss.attackIndex].name:''));
    ui.dash.textContent=player.dashWait?'DASH RECHARGING':'DASH READY';
    ui.dash.classList.toggle('ready',!player.dashWait);
    return;
  }
  if (boss) {
    ui.boss.firstElementChild.textContent=boss.name+' · PHASE '+boss.phase+'/2 · SECTION '+(healthSection(boss)+1)+'/4';
    ui.boss.querySelector('progress').value = boss.hp/boss.max;
  }
  ui.dash.textContent=player.dashWait?'DASH RECHARGING':'DASH READY';
  ui.dash.classList.toggle('ready',!player.dashWait);
  showCooldown(ui['missile-status'],player.missileWait);
  showCooldown(ui['bomb-status'],player.bombWait);
  if (isCodebreak()) return refreshCodebreakHud();
  const barrage=barrageCueLine();
  if (densityShots.length) { setCue(barrage);return; }
  const m = boss?.move && moves[boss.move];
  const telling=boss.hp && m && boss.age<=boss.tell;
  const charging=boss.move==='shieldPulse' && boss.age<=boss.tell;
  const shieldNow=charging && (boss.tell-boss.age)/bossAttackRate(boss)<26;
  const arenaTell=mechanicsIndex(levelIndex)!==7 && boss.hp && boss.move==='arenaHazard' && boss.age<=boss.tell;
  // One line at a time, mandatory mechanics first: the sweep needs a crouch or the shield for its
  // whole tell and strike, and nothing else answers it.
  const message=ceilingSweepInProgress()?'CEILING SWEEP · CROUCH ('+crouchPrompt()+') OR SHIELD ('+shieldPrompt()+')':
    charging?(shieldNow?'SHIELD NOW · '+shieldPrompt():'SHIELD PULSE CHARGING · GET READY TO SHIELD ('+shieldPrompt()+')'):
    arenaTell?(PHASE_TWO_HAZARDS[mechanicsIndex(levelIndex)]?.name??'Yacht cannon charging'):
    barrage?barrage:telling?moveLabel(boss.move):
    boss.hp && m && boss.age>boss.tell+m.active?(isFlying()?'EXPOSED  ·  Line up with the ring':'EXPOSED  ·  Jump to hit the weak spot'):'';
  setCue(message);
}

function showCooldown(label,frames) {
  const text=frames?(Math.ceil(frames/6)/10).toFixed(1)+'s':'Ready';
  if (label.textContent!==text) label.textContent=text;
}

function puff(x,y,color,count=9) {
  for (let i=0;i<count;i++) {
    const angle=i/count*Math.PI*2, speed=2+cosmeticRandom()*8;
    sparks.push({x,y,vx:SimMath.cos(angle)*speed,vy:SimMath.sin(angle)*speed,life:18,color});
  }
}

function updatePhasePowerups(){
  if(!phasePowerupsState||mode!=='play'||phaseShift||transition||!player.hp)return;
  const phase=boss?.phase===2?1:0;
  if(phasePowerupsState.phase!==phase){const seed=phasePowerupsState.seed;phasePowerupsState={seed,phase,tick:0,items:ArcadePhasePowerups.create({seed,phase,span:powerupSpan(phase)})};}
  const tick=++phasePowerupsState.tick,flying=isFlying(),bounds={x:80,y:200,w:650,h:350},delta=camera-(phasePowerupsState.camera??camera);
  phasePowerupsState.camera=camera;
  for(const item of phasePowerupsState.items.pickups){if(isChase())item.x-=delta;else if(isCodebreakClimb())item.y+=delta;}
  let surfaces=flying?null:[{x:80,y:FLOOR,w:650}];
  if(isChase())surfaces=chasePlatforms.map(p=>({x:p.x-camera,y:p.y,w:p.width}));
  else if(isCodebreakClimb())surfaces=Array.from({length:Math.ceil(CODE_LOOP/CODE_SPACING)+5},(_,i)=>codePlatform(i)).filter(Boolean).map(p=>({x:p.x,y:p.y,w:p.width}));
  if(surfaces)surfaces=surfaces.filter(p=>Math.abs(p.y-player.y)<=150&&p.x+p.w>60&&p.x<820).map(p=>({x:Math.max(60,p.x),y:p.y,w:Math.min(820,p.x+p.w)-Math.max(60,p.x)})).filter(p=>p.w>=64);
  // Nothing appears during a barrage or in the blink after a hit, and a heart waits for a hurt player.
  const events=ArcadePhasePowerups.step(phasePowerupsState.items,{tick,ready:!densityShots.length&&!player.inv,hold:{life:player.hp>=MAX_HP},player:{x:player.x-18,y:player.y-(flying?31:playerHeight()),w:36,h:flying?62:playerHeight()},bounds,surfaces});
  for(const e of events)if(e.type==='collect'&&e.kind==='life'&&player.hp<MAX_HP)player.hp++;
}

function drawLegacyPhasePowerups(){
  if(!phasePowerupsState||!player)return;
  const flying=isFlying(),height=playerHeight(),diameter=flying?230:height+32;
  globalThis.ArcadeBossSheets?.drawPhasePowerups?.(ctx,phasePowerupsState.items,phasePowerupsState.tick,{x:player.x-diameter/2,y:player.y-(flying?diameter/2:height+16),w:diameter,h:diameter});
}

function hurt(contact = false, force = false) {
  if (player.shield || !player.hp || (!force && (player.inv || (!contact && player.dash)))) return;
  if(phasePowerupsState&&ArcadePhasePowerups.absorb(phasePowerupsState.items,phasePowerupsState.tick,{mandatory:force})){player.inv=71;return;}
  player.inv=71;
  if (godMode) {
    godHits++;
    return;
  }
  player.hp--;
  shake=12;
  puff(player.x,player.y-58,'#fff0cc',15);
  sound(135,47,.21,.11);
  if (!player.hp) setOverlay('lost','Knockout','Down for the count!',boss.name + ' wins this round.', isChase()?'Retry chase':'Rematch boss');
}

// Numeric simulation-only geometry; render/image readiness never influences contact.
function combatWeaponVariant() {
  const id=LEVELS[levelIndex].id,kind=id===11?'chase':id===12?'codebreak':'regular';
  return typeof spriteLegacyWeaponVariant==='function'?spriteLegacyWeaponVariant(boss.step,boss.attackIndex,kind):0;
}
function combatPhaseIndex() {
  // Legacy Goldie's single chase encounter deliberately has no numeric phase field.
  return boss.phase===2?1:0;
}
function bindCombatWeapon(shot) {
  if(typeof spriteWeaponBinding==='function')Object.assign(shot,spriteWeaponBinding(combatPhaseIndex(),combatWeaponVariant()));
  return shot;
}
function combatHitboxContext(kind,shot) {
  const phase=shot&&(shot.weaponPhase===0||shot.weaponPhase===1)?shot.weaponPhase:combatPhaseIndex();
  const variant=shot&&typeof shot.weaponVariant==='number'?shot.weaponVariant:combatWeaponVariant();
  const row=['projectiles','beams'].includes(kind)&&typeof spriteWeaponRow==='function'?spriteWeaponRow(variant,shot):undefined;
  return {phase,row};
}
function combatHitboxProfile(kind,key,shot) {
  const c=combatHitboxContext(kind,shot);
  return typeof spriteHitboxProfile==='function'?spriteHitboxProfile(LEVELS[levelIndex].id,c.phase,kind,key,c.row):null;
}
function combatHitbox(base,kind,key,shot) {
  const c=combatHitboxContext(kind,shot);
  if((kind==='projectiles'||kind==='beams'&&key==='vault')&&shot&&typeof spriteProjectileCoreRect==='function'){
    const profile=combatHitboxProfile(kind,key,shot);
    if(typeof spriteProjectileProfileValid==='function'&&spriteProjectileProfileValid(profile)){
      const code=shot.attack&&typeof shot.angle==='number',column=key==='floor-column',vault=kind==='beams'&&key==='vault';
      let center={x:code?shot.x:Math.round(shot.x),y:code?shot.y:Math.round(shot.y)},angle=code?shot.angle:SimMath.atan2(shot.vy,shot.vx),visualBox,layout;
      if(column){const authoredHeight=floorHeight(shot);if(!(authoredHeight>0))return base;const height=Math.max(1,Math.ceil(authoredHeight));visualBox=[shot.w,height];center={x:Math.round(shot.x-shot.w/2)+shot.w/2,y:FLOOR-height/2};layout=spriteProjectileKind(shot,{w:shot.w,h:height});angle=layout==='ray'&&height>shot.w?Math.PI/2:0;}
      if(vault){const front=vaultBeamFront(shot);visualBox=[Math.max(1,VAULT_MUZZLE-front),32];center={x:(front+VAULT_MUZZLE)/2,y:shot.y};layout='ray';angle=0;}
      const projected=spriteProjectileCoreRect(profile,center,angle,visualBox,{kind:layout,shot});if(projected)return projected;
    }
  }
  return typeof spriteHitboxRect==='function'?spriteHitboxRect(base,LEVELS[levelIndex].id,c.phase,kind,key,c.row):base;
}
function combatHitboxValue(base,kind,key,property,shot) {
  const c=combatHitboxContext(kind,shot);
  return typeof spriteHitboxValue==='function'?spriteHitboxValue(base,LEVELS[levelIndex].id,c.phase,kind,key,property,c.row):base;
}
function enemyShotContact(shot,halfWidth,top,bottom) {
  const box=boxes[shot.shape],keys=[shot.laser?'laser':shot.shape,shot.shape];
  if(!combatHitboxProfile('projectiles',keys,shot))return Math.abs(shot.x-player.x)<halfWidth+box.w/2&&shot.y+box.h/2>top&&shot.y-box.h/2<bottom;
  const b=combatHitbox({x:shot.x-box.w/2,y:shot.y-box.h/2,w:box.w,h:box.h},'projectiles',keys,shot);
  return player.x+halfWidth>b.x&&player.x-halfWidth<b.x+b.w&&b.y+b.h>top&&b.y<bottom;
}

function fire(x,y,vx,vy,shape,own,gravity=0,bounces=0,laser=false) {
  const rate=own?PLAYER_SHOT_RATE*(boxes[shape].speed??1):
    ENEMY_ATTACK_RATE*(isChase()?1:boss.shotRate*(boss.phase===2?1.12:1)*(1+boss.section*.07));
  const shot={x,y,vx,vy,shape,own,gravity,bounces,laser,rate,age:0};
  bullets.push(own?shot:bindCombatWeapon(shot));
}

function updateShield(p, canActivate) {
  if (p.shield) p.shield--;
  if (p.shieldWait) p.shieldWait--;
  if (canActivate && !p.shieldWait && inputFrame.shield) {
    p.shield=shieldDuration();
    p.shieldWait=SHIELD_COOLDOWN;
    sound(480,850,.16,.042);
  }
}

function movePlayer(firing=true) {
  const p=player;
  if (p.inv) p.inv--;
  if (p.dashWait) p.dashWait--;
  if (firing && p.missileWait) p.missileWait--;
  if (firing && p.bombWait) p.bombWait--;
  updateShield(p, isChase()||boss.hp>0);
  const dx=Number(inputFrame.right)-Number(inputFrame.left);
  if (isFlying()) moveSaucer(p,dx);
  else moveGround(p,dx);
  if (!firing) return;
  if (godMode && !godFire) {
    p.shot=4;
    return;
  }
  p.shot=(p.shot+1)%9;
  if (p.shot===1) {
    const flying=isFlying(), y=flying?p.y+SAUCER_MUZZLE_Y:p.y-(p.crouch?74:109);
    if (isCodebreak()) fireCodeWeapon('greenLaser');
    else fire(p.x+(flying?SAUCER_MUZZLE_X:44),y,25,0,flying?'greenLaser':'spark',true);
    if (time%18<9) sound(500,250,.047,.019);
  }
  if (boss.hp && !p.missileWait && inputFrame.missile) {
    p.missileWait=MISSILE_COOLDOWN;
    if (isCodebreak()) fireCodeWeapon('missile');
    else if (!isFlying()) fire(p.x+30,p.y-88,12,-5,'missile',true);
    sound(590,860,.075,.025);
  }
  if (isFlying() && MISSILE_COOLDOWN-p.missileWait===RED_ARM_DEPLOY) {
    fire(p.x+RED_ARM_TIP_X,p.y+RED_ARM_TIP_Y,0,0,'redLaser',true);
    sound(215,560,.16,.045);
  }
  if (boss.hp && !p.bombWait && inputFrame.bomb) {
    p.bombWait=BOMB_COOLDOWN;
    if (isCodebreak()) fireCodeWeapon('bomb');
    else if (!isFlying()) {
      fire(p.x,p.y-103,5,-14,'bomb',true,.46);
      sound(260,430,.10,.035);
    }
  }
  if (isFlying() && BOMB_COOLDOWN-p.bombWait===BALL_LAUNCH_FRAME) {
    fire(p.x+BALL_MUZZLE_X,p.y+BALL_MUZZLE_Y,16,-9.8,'beachBall',true,.31,2);
    sound(260,630,.12,.05);
  }
}

function chasePlatformAt(screenX,fromY,toY) {
  const worldX=screenX+camera;
  return chasePlatforms.find(({x,width,y})=>worldX>=x && worldX<=x+width && fromY<=y && toY>=y);
}

function moveGround(p,dx) {
  if (p.jumpBuffer) p.jumpBuffer--;
  if (inputFrame.jump) p.jumpBuffer=7;
  p.crouch=inputFrame.down && p.grounded && !p.dash;
  if (p.jumpBuffer && (p.grounded || p.airJump) && !p.dash) {
    const fromGround=p.grounded;
    if (!fromGround) p.airJump=false;
    p.jumpBuffer=0;
    p.grounded=false;
    p.crouch=false;
    p.vy=-18.3;
    if (fromGround && !isChase()) puff(p.x,p.y,'#efe3c8',5);
    sound(195,400,.12);
  }
  if (!p.dashWait && (p.grounded || p.airDash) && inputFrame.dash) {
    p.dash=11;
    p.dashDir=Math.sign(dx) || 1;
    p.dashWait=24;
    p.airDash=false;
    p.crouch=false;
    sound(470,155,.13);
  }
  p.vx=dx*(p.crouch?3.1:8.2);
  const prevX=p.x;
  p.x=clamp(p.x+(p.dash?p.dashDir*20:p.vx),58,isChase()?W-360:W-58);
  const platformAt=isCodebreakClimb()?codebreakPlatformAt:isChase()?chasePlatformAt:null;
  if (platformAt && p.grounded && !platformAt(p.x,p.y,p.y)) {
    p.grounded=false;
    p.crouch=false;
  }
  p.walking=p.grounded && !p.dash && !p.crouch && p.x!==prevX;
  if (p.walking) p.distance+=p.x-prevX;
  if (p.dash) {
    if (time%2===0 && !isChase()) puff(p.x,p.y-52,'#f6c774',4);
  } else if (!p.grounded) {
    const released=!inputFrame.jumpHeld;
    p.vy += released && p.vy<0 ? 1.28 : .94;
    const fromY=p.y;
    p.y+=p.vy;
    const landing=platformAt?platformAt(p.x,fromY,p.y)?.y:FLOOR;
    if (landing!==undefined && p.y>=landing) {
      p.y=landing;
      p.vy=0;
      p.grounded=true;
      p.airDash=true;
      p.airJump=true;
      if (!isChase()) puff(p.x,p.y,'#efe3c8',6);
    }
  }
}

function moveSaucer(p,dx) {
  const dy=Number(inputFrame.down)-Number(inputFrame.up);
  const length=SimMath.hypot(dx,dy)||1;
  p.vx=dx/length*10.4;
  p.vy=dy/length*10.4;
  if (!p.dashWait && inputFrame.dash) {
    p.dash=11;
    p.dashWait=24;
    p.dashDir=(dx||(!dy?1:0))/length;
    p.dashY=dy/length;
    sound(470,155,.13);
  }
  const x=p.x,y=p.y;
  p.x=clamp(x+(p.dash?p.dashDir*23:p.vx),82,W-82);
  p.y=clamp(y+(p.dash?p.dashY*23:p.vy),82,FLOOR-38);
  p.flyingMotion=p.x!==x || p.y!==y;
}

const isGroundColumn=move=>move==='rift'||move==='eruption';
const isTravelMove=move=>move==='rush'||move==='drop';

const healthSection=b=>clamp(Math.floor(4*(b.max-b.hp)/b.max),0,3);

function ceilingSweepInProgress() {
  return boss.hp && boss.move==='ceilingSweep' && boss.age<boss.tell+moves.ceilingSweep.active;
}

function startMove() {
  const b=boss;
  const groundMove=b.archetype===3?'rift':'eruption';
  const staticOrder=mechanicsIndex(levelIndex)===0?['arenaHazard',groundMove,...b.staticMoves]:[groundMove,...b.staticMoves];
  const section=healthSection(b);
  if (b.section!==section) {
    b.section=section;
    b.step=0;
  }
  const flight=isFlying()?FLIGHT_POOLS[b.phase-1]:null;
  const base=flight?.base ?? (b.phase===1?b.moves:staticOrder);
  const unlocked=(flight?.unlocks ?? BOSS_SECTION_ATTACKS[mechanicsIndex(levelIndex)][b.phase-1]).slice(0,section+1);
  if (!flight && section>=b.phase) unlocked.splice(b.phase,0,BOSS_SIGNATURES[mechanicsIndex(levelIndex)][b.phase-1]);
  const order=section===0?[base[0],...unlocked,...base.slice(1)]:
    [unlocked.at(-1),...base,...unlocked.slice(0,-1)];
  if (!flight && section===b.phase) {
    const signature=BOSS_SIGNATURES[mechanicsIndex(levelIndex)][b.phase-1];
    order.splice(order.indexOf(signature),1);
    order.unshift(signature);
  }
  if (!flight) order.splice(1,0,'ceilingSweep');
  if (flight && b.phase===2) order.splice(2,0,'arenaHazard');
  const pulse=b.phase===2 && section>=2 && !b.pulses.has(section) && player.shieldWait<=shieldPulseWindup()-30;
  b.move=pulse?'shieldPulse':order[b.step++%order.length];
  if (mechanicsIndex(levelIndex)===0 && b.move==='arenaHazard') b.laserCycle++;
  b.age=0;
  const rate=bossAttackRate(b);
  b.tell=moves[b.move].tell;
  if (pulse) b.tell=Math.ceil(shieldPulseWindup()*rate);
  else if (b.move==='ceilingSweep') {
    b.tell=Math.ceil(b.tell*rate);
    b.sweepDescent=Math.ceil(SWEEP_DESCENT_FRAMES*rate);
    b.sweepHit=false;
    bullets=bullets.filter(shot=>shot.own);
    hazards=[];
    vaultBeam=null;
  } else if (mechanicsIndex(levelIndex)===0 && b.move==='arenaHazard') b.tell=Math.round(VAULT_WARNING_FRAMES*rate)-1;
  else if (b.move==='arenaHazard') b.tell=Math.ceil(44*rate);
  else if (isGroundColumn(b.move)) b.tell=Math.max(b.tell,Math.ceil(GROUND_WARNING_FRAMES*rate));
  b.startX=b.x;
  b.aimX=player.x;
  b.aimY=player.y;
  b.gemAim=null;
  b.gemLaserHit=false;
  const center=clamp(player.x+player.vx*6,110,W-110);
  b.lanes=b.move==='rain' ? [center,clamp(center-180,85,W-85),clamp(center+180,85,W-85)] :
    b.move==='rift' ? [center,clamp(center-242,90,W-90)] :
    b.move==='eruption' ? [center,clamp(center-175,85,W-85)] :
    b.move==='drop' ? [clamp(center+125,BOSS_MIN,BOSS_MAX)] : [];
  if (isGroundColumn(b.move)) b.lanes.push(clamp(center+235,90,W-90));
  b.lanes=b.lanes.filter((lane,i,lanes)=>!lanes.slice(0,i).some(other=>Math.abs(other-lane)<73));
}

const groundLaneDelay=move=>move==='rift'?6:9;

function launchMechaRocket(index, targetY) {
  const b=boss, shape=MECHA_ROCKETS[index%MECHA_ROCKETS.length];
  const y=mechaY(b)-56, x=b.x-96;
  const aim=clamp((targetY-y)/58,-5,5);
  if (shape==='mechaArc') fire(x,y,-10.8,-6.6,shape,false,.23);
  else if (shape==='mechaHoming') fire(x,y,-8.6,aim,shape,false);
  else if (shape==='mechaWave') fire(x,y,-14.7,0,shape,false);
  else fire(x,y,-12.5,aim,shape,false);
  b.rocketFlash=8;
  sound(190,68,.19,.04);
}

function attackBoss(t) {
  const b=boss, x=b.x-146, hard=b.phase>=2;
  const flight=FLIGHT_PATTERNS[b.move];
  if (flight) {
    for (const [frame,side,offset,vx,vy,shape] of flight) {
      if (t!==frame) continue;
      const vertical=side==='top'||side==='bottom';
      const originX=vertical?clamp(b.aimX+offset,85,W-85):side==='left'?-20:side==='right'?W+12:x;
      const originY=vertical?(side==='top'?-22:FLOOR+25):clamp(b.aimY+offset,55,FLOOR-32);
      fire(originX,originY,vx,vy,shape,false);
    }
    return;
  }
  const signature=SIGNATURE_PATTERNS[b.move];
  if (signature) {
    for (const [frame,source,height,vx,vy,shape,gravity,bounces] of signature) {
      if (t!==frame) continue;
      const from=source==='sky'?clamp(player.x+height,70,W-85):source==='left'?-20:source==='right'?W+12:x;
      fire(from,source==='sky'?-25:FLOOR+height,vx,vy,shape,false,gravity,bounces);
    }
    return;
  }
  const shot=(y,speed,shape,vy=0,gravity=0,bounces=0)=>fire(x,y,-speed,vy,shape,false,gravity,bounces);
  switch (b.move) {
    case 'airMechaMissiles':
      if (t%16===0) {
        const lane=clamp(b.aimY+((t/16)%3-1)*95,85,FLOOR-42);
        launchMechaRocket(b.rocketIndex++,lane);
      }
      break;
    case 'ceilingSweep':
      if (t===0) sound(300,62,.36,.1);
      if (!b.sweepHit && !player.shield && (!player.crouch || player.y-playerHeight()<SWEEP_EDGE)) {
        b.sweepHit=true;
        hurt(true,true);
      }
      break;
    case 'shieldPulse':
      if (t===0) {
        b.pulses.add(b.section);
        shake=20;
        hurt(true,true);
        sound(230,44,.46,.14);
      }
      break;
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
      if (t===0 || (hard && t===39)) shot(FLOOR-99,13,'prism');
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
      b.y=FLOOR-SimMath.sin(Math.PI*f)*187;
      if (t===31) {
        for (const dir of [-1,1]) fire(b.x,FLOOR-21,dir*12,0,'boulder',false);
        puff(b.x,FLOOR,b.color,24);
        shake=15;
        sound(97,38,.23,.11);
      }
      break;
    }
    case 'crossfire':
      if (t%12===0) {
        const right=t%24===0;
        const low=t%24===0 || (hard && t===36);
        const y=FLOOR-(low?23:99);
        fire(right?W-4:4,y,(right?-1:1)*12,0,low?'boulder':'prism',false,0,0,!low);
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
      if (t===0 || (hard && t===27) || (hard && t===47)) {
        const aim=SimMath.atan2(player.y-60-(FLOOR-184),Math.min(-90,player.x-x));
        const angles=t===0 ? [-.48,-.24,.24,.48] : hard ? [-.55,-.27,0,.27,.55] : [-.34,0,.34];
        for (const delta of angles) fire(x,FLOOR-184,SimMath.cos(aim+delta)*10.7,SimMath.sin(aim+delta)*10.7,'orb',false);
      }
      break;
    case 'gearPincer':
      if (t===0 || t===32) shot(FLOOR-28,12.7,'gear');
      if (t===16 || t===47) fire(-18,FLOOR-28,11.8,0,'gear',false);
      break;
    case 'lanternShower':
      if (t%12===0) {
        const slot=t/12;
        const lane=clamp(player.x+(slot%3-1)*154,70,W-100);
        fire(lane,-28,slot%2?2.6:-2.6,7.7,'lantern',false,.16);
      }
      if (t===34) shot(FLOOR-24,11.2,'pumpkin');
      break;
    case 'slabGates':
      if (t%15===0) {
        const fromRight=t%30===0;
        const low=t%30===15 || t===60;
        fire(fromRight?x:-22,FLOOR-(low?27:122),fromRight?-12.4:11.6,0,'slab',false);
      }
      break;
    case 'crescentArc':
      if (t===0 || t===36) {
        for (const vy of [-5.2,-1.6,2.2]) shot(FLOOR-152,11,'crescent',vy,.10);
      }
      if (t===19) fire(-20,FLOOR-158,10.8,-3.8,'crescent',false,.12);
      if (t===47) fire(clamp(player.x+115,120,W-90),-24,-3.9,8.4,'crescent',false,.13);
      break;
    case 'bankShot':
      if (t===0) shot(FLOOR-168,9.7,'pumpkin',-6,.25,2);
      if (t===27) fire(-16,FLOOR-113,10,-3,'pumpkin',false,.21,1);
      break;
    case 'skimmer':
      if (t===0) shot(FLOOR-25,15,'boulder');
      if (t===26) shot(FLOOR-101,12,'prism');
      break;
    case 'splitArc':
      if (t===0) shot(FLOOR-166,9,'orb',-6,.15);
      if (t===24) fire(-15,FLOOR-148,9.2,-2.8,'orb',false,.12);
      break;
    case 'arenaHazard':
      if (mechanicsIndex(levelIndex)===9) updateVerseGemLaser(t);
      if (mechanicsIndex(levelIndex)===0 && t===0) {
        vaultBeam=bindCombatWeapon({y:arenaLaserY(),age:0});
        sound(570,130,.24,.08);
      } else if (mechanicsIndex(levelIndex)!==0) {
        for (const [frame,edge,lane,vx,vy,shape,gravity,bounces] of PHASE_TWO_HAZARDS[mechanicsIndex(levelIndex)].shots) {
          if (t!==frame) continue;
          const [x,y]=arenaHazardOrigin(edge,lane);
          fire(x,y,vx,vy,shape,false,gravity,bounces);
          puff(x,y,PHASE_TWO_HAZARDS[mechanicsIndex(levelIndex)].color,7);
          sound(380+levelIndex*35,140,.15,.035);
        }
      }
      break;
    case 'comet':
      if (t===0) fire(W-92,115,-13,5.6,'comet',false);
      if (t===27) fire(-20,244,12.5,4.1,'comet',false);
      break;
    case 'ripple':
      if (t===0) shot(FLOOR-160,8.8,'pearl',-5,.25,1);
      if (t===29) fire(-18,FLOOR-170,9.1,-4.5,'pearl',false,.23,1);
      break;
    case 'minefall':
      if (t===0 || t===26) {
        const x=clamp(player.x+(t===0?-80:105),65,W-100);
        fire(x,-20,t===0?1.8:-1.8,5.8,'mine',false,.23,1);
      }
      break;
    case 'floorSaw':
      if (t===0) shot(FLOOR-22,13.8,'saw');
      if (t===30) fire(-21,FLOOR-22,12.5,0,'saw',false);
      break;
    case 'hammer':
      if (t===0) shot(FLOOR-105,14,'hammer');
      if (t===30) shot(FLOOR-32,12,'hammer',-2.2,.10);
      break;
    case 'starCross':
      if (t===0) fire(W+10,235,-11,3.2,'star',false);
      if (t===26) fire(-20,330,10.5,2.3,'star',false);
      break;
    case 'needleFall':
      if (t===0 || t===20 || t===40) {
        const x=clamp(player.x+(t-20)*8,65,W-90);
        fire(x,-23,0,12.5,'needle',false,.13);
      }
      break;
    case 'eyeShot':
      if (t===0 || t===31) {
        const x=t===0?b.x-145:-20,y=FLOOR-146;
        const dx=player.x-x,dy=player.y-55-y,length=SimMath.hypot(dx,dy)||1;
        fire(x,y,dx/length*11,dy/length*11,'eye',false);
      }
      break;
    case 'rift':
    case 'eruption': {
      const rift=b.move==='rift';
      for (const [i,x] of b.lanes.entries()) {
        if (t===i*groundLaneDelay(b.move)) {
          hazards.push(bindCombatWeapon({x,w:rift?84:65,height:rift?384:190+b.archetype*28,age:0}));
          sound(rift?380:138,65,.21,.07);
        }
      }
      if (t===28 && (rift || hard)) shot(FLOOR-99,12,'prism');
      break;
    }
  }
}

const playerHeight=()=>(player.crouch?72:110)*(isCodebreak()?CODE_CHARACTER_SCALE:1);

const bossAttackRate=b=>ENEMY_ATTACK_RATE*b.cadence*(1+b.section*.08);

function updateBoss() {
  const b=boss, tick=authoredTime();
  if (b.flash) b.flash--;
  if (b.rocketFlash) b.rocketFlash--;
  if (LEVELS[levelIndex].id===7) {
    // Moonkeep's two dragon forms patrol vertically while the player flies.
    b.y=FLOOR-70+SimMath.sin(tick*.025)*(b.phase===1?54:70);
  } else if (hasMecha(b)) {
    const target=FLOOR-72+SimMath.sin(tick*.042)*76;
    b.y+=clamp(target-b.y,-5,5);
  } else if (isFlying()) {
    b.y=FLOOR-28-SimMath.sin(tick*.032)*26;
  }
  const rate=bossAttackRate(b);
  const ticks=Math.floor(tick*rate)-Math.floor((tick-1)*rate);
  for (let i=0;i<ticks;i++) advanceBossMove(b);
  if (hasMecha(b) && b.move!=='shieldPulse' && b.move!=='arenaHazard' && ++b.rocketClock%22===0 && b.rocketFlash<8) {
    launchMechaRocket(b.rocketIndex++,player.y);
  }
}

function advanceBossMove(b) {
  if (!b.move) {
    if (++b.age>=36) startMove();
    return;
  }
  const m=moves[b.move], t=b.age-b.tell;
  if (b.phase===1 && (!isTravelMove(b.move) || t<0 || t>=m.active)) {
    const target=BOSS_HOME+SimMath.sin(authoredTime()*.035)*42;
    b.x+=clamp(target-b.x,-8,8);
  }
  if (t===0) b.startX=b.x;
  if (t>=0 && t<m.active) attackBoss(t);
  if (++b.age >= b.tell+m.active+Math.max(9,m.rest-(b.phase-1)*13-b.section*2)) startMove();
}

function arenaLaserY() {
  return FLOOR-(Math.max(0,boss.laserCycle)%2?26:100);
}

function vaultBeamFront(beam) {
  return Math.max(0,VAULT_MUZZLE-beam.age*69);
}

function updateVaultBeam() {
  if (!vaultBeam) return;
  if (++vaultBeam.age>=VAULT_BEAM_LIFE || !boss.hp) {
    vaultBeam=null;
    return;
  }
  const {y,age}=vaultBeam;
  const front=vaultBeamFront(vaultBeam),r=combatHitbox({x:front,y:y-14,w:VAULT_MUZZLE-front,h:28},'beams','vault',vaultBeam);
  if (age<32 && player.x+18>=r.x && player.x-18<=r.x+r.w &&
      player.y>r.y && player.y-playerHeight()<r.y+r.h) hurt();
}

function startStageShift() {
  phaseShift=1;
  boss.move=null;
  boss.y=LEVELS[levelIndex].id===7?FLOOR-70:FLOOR;
  boss.moving=false;
  bullets=[];
  hazards=[];
  impacts=[];
  vaultBeam=null;
}

function advanceStageShift() {
  phaseShift++;
  if (phaseShift===STAGE_BLAST) sound(155+levelIndex*23,37+levelIndex*12,.52,.13);
  if (phaseShift===STAGE_BLACKOUT) gameScreen.classList.add('stage-blackout');
  if (phaseShift<STAGE_SHIFT_END) return;
  gameScreen.classList.remove('stage-blackout');
  phaseShift=0;
  boss.phase=2;
  boss.section=0;
  boss.hp=boss.max=boss.phaseTwoHealth;
  boss.step=0;
  startMove();
  announce(PHASE_TWO_NAMES[mechanicsIndex(levelIndex)],85);
}

function keepPlayerLeft(contact=true) {
  const p=player;let front=boss.x-(hasMecha(boss)?170:BOSS_FRONT);
  let bossTop=hasMecha(boss)?mechaY(boss)-122:boss.y-110*boss.scale;
  let bossBottom=hasMecha(boss)?mechaY(boss)+122:boss.y;
  if(combatHitboxProfile('boss','contact')){const r=combatHitbox({x:front,y:bossTop,w:(boss.x-front)*2,h:bossBottom-bossTop},'boss','contact');front=r.x;bossTop=r.y;bossBottom=r.y+r.h;}
  if (p.x<front) return;
  const flying=isFlying(), top=flying?p.y-31:p.y-playerHeight(), bottom=flying?p.y+31:p.y;
  if (boss.hp && top<bossBottom && bottom>bossTop) {
    if (contact && !ceilingSweepInProgress()) hurt(true);
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
  if (!boss.hp) return;
  const dx=boss.x-shot.x;
  if (shot.shape==='missile') {
    const dy=(hasMecha(boss)?mechaY(boss):boss.y-175)-shot.y, length=SimMath.hypot(dx,dy)||1;
    shot.vx+=(dx/length*18-shot.vx)*.15;
    shot.vy+=(dy/length*18-shot.vy)*.15;
  } else if (shot.shape==='bomb') {
    shot.vx+=(clamp(dx*.09,-16,16)-shot.vx)*.16;
  }
}

function updateBullets() {
  const p=player,b=boss;
  for (const shot of bullets) {
    if (shot.dead) continue;
    shot.age++;
    if (shot.own && (shot.shape==='missile'||shot.shape==='bomb')) steer(shot);
    if (shot.shape==='mechaHoming' && shot.age<75) {
      const lead=Math.max(14,Math.abs(shot.x-p.x)/8.6);
      const target=clamp((p.y-shot.y)/lead,-5.6,5.6);
      shot.vy+=(target-shot.vy)*.066;
    } else if (shot.shape==='mechaWave') {
      shot.vy=SimMath.sin(shot.age*.25)*6.2;
    }
    const step=shot.rate;
    shot.x+=shot.vx*step;
    shot.y+=shot.vy*step;
    shot.vy+=shot.gravity*step;
    if (shot.y>FLOOR-13 && shot.bounces>0) {
      shot.y=FLOOR-13;
      shot.vy=-Math.max(6.5,Math.abs(shot.vy)*.72);
      shot.bounces--;
      puff(shot.x,FLOOR,shot.own?boxes[shot.shape].color:b.color,5);
    }
    if (shot.shape==='bomb' && shot.own) {
      if (shot.y>=FLOOR-12) {
        shot.y=FLOOR-12;
        boxBlast(shot);
        if (b?.hp && Math.abs(shot.x-b.x)<combatHitboxValue(198,'boss','splash','radius') && b.y>=FLOOR-92) hitBoss(shot,4);
        if (!b.hp) break;
      }
      continue;
    }
    if (shot.age>145 || shot.x<-55 || shot.x>W+55 || shot.y<-135 || shot.y>FLOOR+36) {
      shot.dead=true;
      continue;
    }
    if (!shot.own) {
      const flying=isFlying(), top=flying?p.y-31:p.y-playerHeight(), bottom=flying?p.y+31:p.y+3;
      if (enemyShotContact(shot,flying?58:18,top,bottom) && !p.dash) {
        shot.dead=true;
        hurt();
        if (!p.hp) break;
      }
      continue;
    }
    const mech=hasMecha(b);
    let hitTop=isCodebreak()?FLOOR-CODE_BOSS_HEIGHT:mech?mechaY(b)-122:b.y-116*b.scale;
    let hitBottom=mech?mechaY(b)+122:b.y-12;
    const halfWidth=mech?106:147;
    let hitLeft=b.x-halfWidth,hitRight=b.x+halfWidth;
    const profile=combatHitboxProfile('boss','damage');
    if(profile){const r=combatHitbox({x:hitLeft,y:hitTop,w:halfWidth*2,h:hitBottom-hitTop},'boss','damage');hitLeft=r.x;hitRight=r.x+r.w;hitTop=r.y;hitBottom=r.y+r.h;}
    const beam=shot.shape==='redLaser';
    const inRange=beam
      ?shot.x<=hitRight && SAUCER_BEAM_END>=hitLeft
      :profile?shot.x>=hitLeft&&shot.x<=hitRight:Math.abs(shot.x-b.x)<=halfWidth;
    if (beam) shot.dead=true;
    if (!b.hp || !inRange || shot.y<hitTop || shot.y>hitBottom) continue;
    if (beam) shot.x=Math.max(shot.x,hitLeft);
    const m=b.move && moves[b.move];
    const exposed=m && b.age>b.tell+m.active;
    const weak=exposed && Math.abs(shot.y-bossWeakY(b))<34;
    const damage=shot.shape==='beachBall'?4:shot.shape==='missile'||shot.shape==='redLaser'?2:weak?3:1;
    hitBoss(shot,damage);
    if (weak) sound(750,970,.08,.035);
    if (!b.hp) break;
  }
  bullets=bullets.filter(shot=>!shot.dead);
}

function hitBoss(shot,damage) {
  shot.dead=true;
  let floor=0;
  if (boss.phase===2 && !isCodebreak()) {
    // Keep both shield tests reachable, even if damage outpaces the recharge.
    if (!boss.pulses.has(2)) floor=Math.floor(boss.max/4)+1;
    else if (!boss.pulses.has(3)) floor=1;
  }
  boss.hp=Math.max(floor,boss.hp-damage*(godMode?(godDamageBoost?20:6):1));
  boss.flash=4;
  const effect=playerImpacts[shot.shape];
  const x=shot.shape==='bomb'?clamp(shot.x,boss.x-125,boss.x+125):shot.x;
  const y=shot.shape==='bomb'?(hasMecha(boss)?mechaY(boss)+102:boss.y-55):shot.y;
  impacts.push({...effect,x,y,age:0});
  if (!boss.hp && !isCodebreak()) {
    if (boss.phase===1) startStageShift();
    else defeatBoss();
  }
}

function floorHeight(h) {
  return h.height*Math.min(1,(h.age+1)/9,(35-h.age)/8);
}

function updateHazards() {
  for (const h of hazards) {
    h.age+=h.blast?1:ENEMY_ATTACK_RATE;
    const r=combatHitbox({x:h.x-h.w/2,y:FLOOR-floorHeight(h),w:h.w,h:floorHeight(h)},'projectiles','floor-column',h);
    if (!h.blast && mode==='play' && (combatHitboxProfile('projectiles','floor-column',h)?
      player.x+18>r.x&&player.x-18<r.x+r.w&&player.y>r.y&&player.y-playerHeight()<r.y+r.h:
      Math.abs(player.x-h.x)<h.w/2+18&&player.y>FLOOR-floorHeight(h))) hurt();
  }
  hazards=hazards.filter(h=>h.age<(h.blast?13:35));
}

function startChase() {
  boss={name:'Goldie',x:GOLDIE_START_X,y:390,attackIndex:0,attackAge:0,aimY:430};
  bullets=[];
  hazards=[];
  sparks=[];
  impacts=[];
  announce('ROOFTOP BREAKAWAY',95);
}

function updateChaseAttacks() {
  const b=boss;
  if (authoredTime()>=100) {
    if (b.attackAge===0) b.aimY=player.y-70;
    for (const [frame,offset,vx,vy,shape,gravity] of CHASE_ATTACKS[b.attackIndex].shots) {
      if (b.attackAge!==frame) continue;
      const [muzzleX,muzzleY]=goldieAttachment(...GOLDIE_MUZZLE,goldiePose());
      const y=b.y+muzzleY*GOLDIE_SCALE;
      const aim=clamp((b.aimY+offset-y)/70,-3.7,3.7);
      fire(b.x+muzzleX*GOLDIE_SCALE,y,vx,vy+aim,shape,false,gravity);
      sound(340,110,.16,.05);
    }
    if (++b.attackAge===172) {
      b.attackAge=0;
      b.attackIndex=(b.attackIndex+1)%CHASE_ATTACKS.length;
    }
  }
  for (const shot of bullets) {
    shot.age++;
    shot.x+=shot.vx*shot.rate-CHASE_SCROLL;
    shot.y+=shot.vy*shot.rate;
    shot.vy+=shot.gravity*shot.rate;
    if (enemyShotContact(shot,18,player.y-playerHeight(),player.y) && !player.dash) {
      shot.dead=true;
      hurt();
    }
  }
  bullets=bullets.filter(shot=>!shot.dead && shot.age<170 && shot.x<W+60 && shot.y<H+60);
}

function updateChase() {
  const p=player;
  if (p.dashWait) p.dashWait--;
  if (p.inv) p.inv--;
  updateShield(p, true);
  const dx=Number(inputFrame.right)-Number(inputFrame.left);
  moveGround(p,dx || CHASE_SCROLL/8.2);
  camera+=CHASE_SCROLL;
  p.x-=CHASE_SCROLL;
  const lead=p.x-boss.x;
  const pace=4.25+1.12*clamp(camera/CHASE_FINISH,0,1)+clamp((lead-305)*.035,0,6);
  boss.x=clamp(boss.x+pace-CHASE_SCROLL,GOLDIE_START_X,GOLDIE_MAX_X);
  boss.y=390+SimMath.sin(authoredTime()*.035)*24+SimMath.sin(authoredTime()*.019)*9;
  updateChaseAttacks();
  if (mode!=='play') return;
  if (p.dash) p.dash--;
  if (banner && --banner===0) ui.notice.hidden=true;
  if (p.y>H+60 || boss.x+combatHitboxValue(GOLDIE_CATCH_REACH,'boss','contact','reach')>=p.x || p.x<55) {
    p.hp=0;
    const reason=p.y>H+60?'You fell between the rooftops.':'Goldie caught you.';
    setOverlay('lost','Chase failed','Down for the count!',reason,'Retry chase');
  } else if (camera+p.x>=CHASE_FINISH && p.grounded) {
    clearLevel();
  }
  refreshHud();
}

// Replay time counts all input frames. Authored patterns and scrolling stop
// for the duration of the special attack, then resume at their original beat.
const authoredTime=()=>time-densityPausedTicks;

// A fall out of the arena during a chase or climb barrage. It ends the run, except in god mode,
// where it counts as a god hit (as in hurt()) and the player stands on the nearest platform again.
function barrageFall(){
  if(godMode){
    player.inv=71;
    godHits++;
    rescueFromFall();
    return;
  }
  player.hp=0;
  setOverlay('lost','Barrage failed','Down for the count!','You fell.','Retry level');
}

// God mode only: the nearest platform on screen (the lowest one on the climb), with the player
// standing on it inside the horizontal limits moveGround() keeps.
function rescueFromFall(){
  const p=player,margin=12;
  let target=null;
  if(isCodebreakClimb()){
    for(let row=0;row<=CODE_LOOP/CODE_SPACING+4&&!target;row++){
      const c=codePlatform(row);
      if(c&&c.y<=H-margin)target={left:Math.max(c.x+margin,58),right:Math.min(c.x+c.width-margin,W-58),y:c.y};
    }
  }else{
    let best=Infinity;
    for(const c of chasePlatforms){
      const left=Math.max(c.x-camera+margin,58),right=Math.min(c.x-camera+c.width-margin,W-360);
      if(left>right)continue;
      const distance=p.x<left?left-p.x:p.x>right?p.x-right:0;
      if(distance<best){best=distance;target={left,right,y:c.y};}
    }
  }
  if(!target)return;
  p.x=clamp(p.x,target.left,target.right);
  p.y=target.y;
  p.vy=0;
  p.grounded=true;
  p.crouch=false;
  p.airDash=true;
  p.airJump=true;
}

function barrageRecovery(){
  if(isChase())return boss.attackAge>Math.max(45,...CHASE_ATTACKS[boss.attackIndex].shots.map(shot=>shot[0]));
  if(isCodebreak()){
    const attack=attackForCodebreak();
    return boss.age>Math.max(...attack.frames) && !codeBeamLanes(attack).length;
  }
  const move=moves[boss.move];
  return Boolean(move && boss.age>=boss.tell+move.active && !vaultBeam);
}

function updateLegacyDensity(){
  if(!ArcadeDensityAttacks.enabled || mode!=='play')return false;
  const phase=boss.phase===2?1:0,stage=LEVELS[levelIndex].id,key=stage+':'+phase;
  if(key!==densityPhaseKey){
    densityPhaseKey=key;
    densityPhaseClock=0;
    densityLastCycle=-1;
    densityLastEnd=0;
    densityShots=[];
  }
  if(phaseShift||transition||boss.shift||boss.wreck||boss.hp===0)return false;
  if(!densityShots.length){
    densityPhaseClock++;
    // Phase 1 of a boss fight has a second, shorter barrage: from the third health section on,
    // and no sooner than DENSITY_SECOND_GAP phase-clock ticks after the first one ended. (The
    // phase clock stops while missiles fly.) Phase 2, the chase and the climb keep one.
    const cycle=densityLastCycle+1;
    if(cycle>1 || (cycle===1 && (isChase() || isCodebreak() || boss.phase!==1 || healthSection(boss)<2 ||
       densityPhaseClock<densityLastEnd+DENSITY_SECOND_GAP)))return false;
    if(densityPhaseClock<ArcadeDensityAttacks.START ||
       (!isFlying()&&!player.grounded) || !barrageRecovery())return false;
    const vertical=isCodebreakClimb(),flying=isFlying(),scale=isCodebreak()?CODE_CHARACTER_SCALE:1;
    const plan=ArcadeDensityAttacks.plan({
      stage,phase,tick:densityPhaseClock,enabled:true,lastCycle:densityLastCycle,cycle,
      flight:flying,vertical,standingHeight:110*scale,crouchHeight:72*scale,
      arena:{left:0,right:W,top:vertical?0:flying?51:140,bottom:vertical?H:flying?FLOOR-7:FLOOR,floor:player.y},
      player
    });
    if(!plan)return false;
    densityShots=plan.shots;
    densityLastCycle=plan.cycle;
    densityLastEnd=densityPhaseClock;
    // A completed move can leave spent projectiles in the arena.
    // The barrage owns the arena until its final missile leaves the screen.
    bullets=[];
    hazards=[];
    if(isCodebreak())codeShots=[];
    banner=0;
    ui.notice.hidden=true;
  }
  densityPausedTicks++;
  movePlayer(false);
  if(isCodebreak()&&!isCodebreakClimb())player.x=Math.min(player.x,boss.x-200*CODE_MECHA_SCALE);
  else if(!isChase()&&!isCodebreak())keepPlayerLeft(false);
  if((isChase()||isCodebreakClimb())&&player.y>H+60)barrageFall();
  const halfWidth=18*(isCodebreak()?CODE_CHARACTER_SCALE:1);
  const top=player.y-(isFlying()?31:playerHeight()),bottom=player.y+(isFlying()?31:0);
  for(const shot of densityShots){
    if(mode!=='play')break;
    if(shot.age>=shot.delay){
      shot.x+=shot.vx;
      shot.y+=shot.vy;
      const core=ArcadeDensityAttacks.damageRect(shot);
      if(player.x+halfWidth>core.x&&player.x-halfWidth<core.x+core.w&&bottom>core.y&&top<core.y+core.h){
        shot.dead=true;
        hurt();
      }
    }
    shot.age++;
  }
  densityShots=mode==='play'?densityShots.filter(s=>!s.dead&&s.age<s.delay+s.active):[];
  if(player.dash)player.dash--;
  sparks=sparks.filter(s=>--s.life>0);
  impacts=impacts.filter(impact=>++impact.age<impact.duration);
  if(shake)shake--;
  refreshHud();
  return true;
}

function update(){
  time++;
  if(!updateLegacyDensity())updateLegacyStage();
  updatePhasePowerups();
}
function updateLegacyStage() {
  if (isCodebreak()) return updateCodebreak();
  if (isChase()) {
    updateChase();
    return;
  }
  if (phaseShift) {
    advanceStageShift();
    refreshHud();
    return;
  }
  movePlayer();
  if (transition) {
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
  updateVaultBeam();
  if (player.dash) player.dash--;
  for (const s of sparks) {
    s.x+=s.vx;
    s.y+=s.vy;
    s.vy+=.13;
    s.life--;
  }
  sparks=sparks.filter(s=>s.life>0);
  impacts=impacts.filter(impact=>++impact.age<impact.duration);
  if (boss.phase===1 && !phaseShift) camera+=SCROLL_STEP;
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

function attackArt(name) {
  return picture(`art/attacks/${name}.png`);
}

function attackFrame(folder, index) {
  return attackArt(`${folder}/${String(index+1).padStart(2,'0')}`);
}

function drawColumn(h) {
  const height=Math.max(1,Math.ceil(floorHeight(h)));
  const x=Math.round(h.x-h.w/2);
  const themed=globalThis.ArcadeBossSheets?.drawProjectile(ctx,LEVELS[levelIndex].id,h,{x,y:FLOOR-height,w:h.w,h:height},{phaseIndex:boss.phase-1,tick:time});
  if(!themed)ctx.drawImage(bossAttackImage('ground-eruption'),x,FLOOR-height,h.w,height);
  if (!themed && h.age>=27) {
    const frame=attackFrame(`hazards/${h.w}px/retract`,Math.floor((h.age-27)/2));
    ctx.drawImage(frame,x,FLOOR-frame.height);
  }
}

function drawFlightFlame(color,x,y,height,angle=0) {
  const art=attackFrame('flight-flames/'+color,Math.floor(time/3)%2);
  const width=Math.round(height*art.width/art.height);
  ctx.save();
  ctx.translate(Math.round(x),Math.round(y));
  if (angle) ctx.rotate(angle);
  ctx.drawImage(art,-width,-Math.round(height/2),width,height);
  ctx.restore();
}

function drawMecha(b) {
  const launch=b.rocketFlash || (b.move==='airMechaMissiles' && b.age>=b.tell-8 && b.age<b.tell);
  const art=bossAttackImage('mecha/'+(launch?'fire':'hover'));
  const y=mechaY(b);
  ctx.save();
  if (!b.hp && b.phase===2) ctx.globalAlpha=clamp((transition-12)/25,0,1);
  ctx.translate(Math.round(b.x),Math.round(y));
  ctx.scale(-1,1);
  if (b.hp) drawFlightFlame('orange',-art.width/2+26,16,41,-.65);
  ctx.drawImage(art,-Math.round(art.width/2),-Math.round(art.height/2));
  ctx.restore();
}

function renderBoss() {
  const b=boss,m=b.move && moves[b.move];
  const telling=m && b.age<b.tell && b.hp;
  if (b.hp && !densityShots.length && isGroundColumn(b.move)) {
    const width=b.move==='rift'?84:65;
    const rate=bossAttackRate(b), tick=Math.floor(authoredTime()*rate);
    for (const [i,x] of b.lanes.entries()) {
      const ticksToLaunch=b.tell+i*groundLaneDelay(b.move)-b.age+1;
      if (ticksToLaunch<=0) continue;
      const remaining=Math.ceil((tick+ticksToLaunch)/rate)-authoredTime();
      if (remaining>GROUND_WARNING_FRAMES) continue;
      const progress=1-remaining/GROUND_WARNING_FRAMES;
      const frame=attackFrame(`hazards/${width}px/warning`,Math.floor(progress*3));
      const w=52, h=13;
      ctx.save();
      ctx.imageSmoothingEnabled=false;
      const left=Math.round(x-w/2);
      ctx.fillStyle='#180c23';
      ctx.fillRect(left,FLOOR-h,w,h);
      ctx.drawImage(frame,left,FLOOR-h,w,h);
      ctx.fillStyle='#ffdf91';
      ctx.fillRect(left+2,FLOOR-2,4,2);
      ctx.fillRect(left+w-6,FLOOR-2,4,2);
      ctx.restore();
    }
  }
  for (const h of hazards) {
    if (h.blast) {
      const frame=attackArt('player/higgsfield/explosion');
      const progress=h.age/13;
      const width=Math.round(h.w*Math.min(1,.48+progress*1.8));
      const height=Math.round(width*frame.height/frame.width);
      ctx.save();
      ctx.globalAlpha=Math.min(1,(1-progress)*2.5);
      ctx.drawImage(frame,Math.round(h.x-width/2),FLOOR-height,width,height);
      ctx.restore();
    } else {
      drawColumn(h);
    }
  }
  if (!b.hp && b.phase===2 && transition<12) return;
  // The teleport atlas supplies the mecha silhouette until it resolves into the live sprite.
  if (isFlying() && phaseShift>=STAGE_BLAST) return;
  const frames=ART.sprites[b.id]??ART.sprites[acts[mechanicsIndex(levelIndex)].id], art=frames.poses;
  const strike=m && b.age>=b.tell && b.age<b.tell+m.active;
  const exposed=m && b.age>=b.tell+m.active;
  let pose=art[time%48<24?0:1];
  if (!b.hp && b.phase===2) pose=frames.death[Math.min(frames.death.length-1,Math.floor((108-transition)/4))] ?? art[24];
  else if (!m) pose=frames.entrance[Math.min(frames.entrance.length-1,Math.floor(b.age/5))] ?? art[0];
  else if (telling && b.move!=='arenaHazard') pose=art[b.move==='drop'?7:29];
  else if (strike && b.move!=='arenaHazard') {
    if (b.move==='rush') pose=b.age-b.tell<6?art[6]:walk(b.id,b.distance);
    else if (b.move==='drop') pose=art[b.age-b.tell<16?8:b.age-b.tell<32?9:10];
    else if (phaseTwoMoves.includes(b.move)) pose=art[31];
    else if (frames.ranged.length) pose=frames.ranged[Math.min(frames.ranged.length-1,Math.floor((b.age-b.tell)/4))];
    else pose=art[30];
  } else if (b.flash) pose=art[24];
  else if (b.moving) pose=walk(b.id,b.distance);
  shadow(b.x,FLOOR,120);
  ctx.save();
  if (!b.hp && b.phase===2) ctx.globalAlpha=clamp((transition-12)/25,0,1);
  const sheetTop=hasMecha(b)?mechaY(b)-122:b.y-116*b.scale;
  const sheetBottom=hasMecha(b)?mechaY(b)+122:b.y-12;
  const sheetPose=(densityShots.length&&globalThis.ArcadeBossSheets?.barragePose(densityShots,time,true))||globalThis.ArcadeBossSheets?.legacyPose(b.move,b.age,b.tell,m?.active||0,time,globalThis.ArcadeBossSheets.legacyVariant(b))||{row:0,column:0};
  // The hit flash is a second additive pass over the same frame (sprite + 0.38 x sprite, the old
  // brightness(1.38) over opaque pixels; 0.34 for the fallback mecha). A canvas filter here ran on
  // close to half of all frames while the player's autofire was landing.
  const paintBoss=flash=>{
    if (flash) { ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=flash; }
    const sheetDrawn=globalThis.ArcadeBossSheets?.drawBoss(ctx,LEVELS[levelIndex].id,b.phase-1,sheetPose,{x:b.x-(hasMecha(b)?150:190),y:sheetTop,w:hasMecha(b)?300:380,h:sheetBottom-sheetTop});
    if (sheetDrawn) return;
    if (hasMecha(b)) { if (flash) ctx.globalAlpha=flash*.34/.38; drawMecha(b); }
    else sprite(b.id,pose,b.x,b.y,-1,b.scale);
  };
  paintBoss(0);
  if (b.flash && b.hp) paintBoss(.38);
  ctx.restore();
  if (exposed && b.hp && !densityShots.length) {
    ctx.strokeStyle='#ffe5a1';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.arc(b.x,bossWeakY(b),22+SimMath.sin(time*.18)*3,0,Math.PI*2);
    ctx.stroke();
  }
}

// [arrival x, arrival y, launch direction, lift, twist, burst radius, spark color]
const STAGE_EFFECTS = [
  [780,564,1,155,0,460,'#ffd084'],
  [650,270,0,110,1.3,540,'#f5a8ff'],
  [1015,315,0,160,3.2,455,'#7ef6ff'],
  [795,560,1,195,1.5,490,'#ffb568'],
  [625,350,-1,25,.1,640,'#f878ff'],
  [715,310,-1,92,2.1,530,'#8effbc'],
  [865,490,0,0,.2,570,'#ffab58'],
  [680,265,0,120,2.9,480,'#ffda8f'],
  [495,475,0,0,.7,500,'#c7ff82'],
  [638,335,0,0,-4.2,620,'#cc9fff']
];

function stageEffectFrame(index, frame) {
  return attackFrame('boss/higgsfield/stage-effects/'+(mechanicsIndex(index)+1),frame);
}

function drawStageShift() {

  const [targetX,targetY,travel,lift,twist,radius,color]=STAGE_EFFECTS[mechanicsIndex(levelIndex)];
  const cut=phaseShift>=STAGE_BLAST;
  const charge=clamp((phaseShift-1)/(STAGE_BLAST-1),0,1);
  const burst=clamp((phaseShift-STAGE_BLAST)/(STAGE_BLACKOUT-STAGE_BLAST),0,1);
  const mouthX=player.x+44, mouthY=player.y-(player.crouch?74:109);
  const fromX=travel===1?mouthX:travel===-1?W+65:targetX;
  const fromY=travel===1?mouthY:mechanicsIndex(levelIndex)===6||mechanicsIndex(levelIndex)===8?FLOOR+65:targetY;
  const point=t=>{
    const arc=SimMath.sin(t*Math.PI);
    return [
      fromX+(targetX-fromX)*t+SimMath.sin(t*twist*2)*arc*86,
      fromY+(targetY-fromY)*t-lift*arc
    ];
  };
  const [x,y]=cut?[targetX,targetY]:point(charge);
  const atlas=stageEffectFrame(levelIndex,cut?(burst<.29?2:3):(charge<.57?0:1));
  const sprite=mechanicsIndex(levelIndex)===0 && !cut?attackFrame('boss/higgsfield/transition',Math.floor(phaseShift/6)%2):atlas;
  const alpha=cut?1-burst*.95:1;
  const size=cut?radius*(1.10+burst*1.22):74+charge*(travel?117:260);

  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.fillStyle=color;
  ctx.globalAlpha=alpha*.13;
  ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=1;
  if (!cut && travel) {
    for (let i=4;i>0;i--) {
      const [trailX,trailY]=point(Math.max(0,charge-i*.036));
      const trailSize=size*(1-i*.16);
      ctx.globalAlpha=.20-i*.025;
      ctx.drawImage(atlas,trailX-trailSize/2,trailY-trailSize/2,trailSize,trailSize);
    }
  }
  ctx.globalAlpha=alpha;
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(cut?twist*burst*.23:twist*charge*.31);
  const height=size*sprite.height/sprite.width;
  ctx.drawImage(sprite,Math.round(-size/2),Math.round(-height/2),size,height);
  ctx.restore();
  for (let i=0;i<24;i++) {
    const angle=i*2.399+(cut?burst:charge)*twist;
    const reach=cut?(20+burst*(radius*.78+i%5*13)):(26+i%6*10)*(1+charge*.65);
    const px=x+SimMath.cos(angle)*reach;
    const py=y+SimMath.sin(angle)*reach*.66;
    ctx.globalAlpha=alpha*(.25+i%4*.12);
    ctx.fillRect(Math.round(px),Math.round(py),3+i%3*2,2+i%3);
  }
  ctx.restore();
}

function updateVerseGemLaser(t) {
  const [x,y]=VERSE_GEM;
  if (t===VERSE_GEM_CHARGE) {
    boss.gemAim=SimMath.atan2(player.y-playerHeight()/2-y,player.x-x);
    sound(320,730,.27,.04);
  }
  if (t===VERSE_GEM_FIRE) sound(890,185,.26,.09);
  if (t<VERSE_GEM_FIRE || t>=VERSE_GEM_END || boss.gemLaserHit || boss.gemAim===null) return;
  const dx=player.x-x,dy=player.y-playerHeight()/2-y;
  const ux=SimMath.cos(boss.gemAim),uy=SimMath.sin(boss.gemAim);
  const across=Math.abs(dx*uy-dy*ux);
  const clearance=Math.abs(uy)*18+Math.abs(ux)*playerHeight()/2+combatHitboxValue(10,'beams','verse-gem','halfWidth');
  if (dx*ux+dy*uy>0 && across<clearance && !player.shield && !player.inv && !player.dash) {
    boss.gemLaserHit=true;
    hurt();
  }
}

function drawVerseGemLaser() {
  if (mechanicsIndex(levelIndex)!==9 || !boss.hp || boss.move!=='arenaHazard' || boss.gemAim===null) return;
  const age=boss.age-boss.tell;
  if (age>=VERSE_GEM_END) return;
  const [x,y]=VERSE_GEM;
  ctx.save();
  ctx.translate(x,y);
  if (age<VERSE_GEM_FIRE) {
    const progress=clamp((age-VERSE_GEM_CHARGE)/(VERSE_GEM_FIRE-VERSE_GEM_CHARGE),0,1);
    const halo=verseMotionFrame('portal',Math.floor(time/4)%4);
    const size=76+progress*62;
    ctx.globalCompositeOperation='screen';
    ctx.globalAlpha=.45+progress*.43;
    ctx.drawImage(halo,-size*.36,-size/2,size*.72,size);
    ctx.rotate(boss.gemAim);
    ctx.fillStyle='#d7a3ff';
    ctx.globalAlpha=.22+progress*.32;
    for (let i=12;i<W;i+=27) ctx.fillRect(i,-1,13,2);
  } else {
    const ageOn=age-VERSE_GEM_FIRE;
    const height=22+6*SimMath.sin(ageOn*.55);
    const beam=attackArt('boss/higgsfield/vault-laser/beam');
    ctx.rotate(boss.gemAim);
    ctx.filter='hue-rotate(68deg) saturate(1.35)';
    if(!globalThis.ArcadeBossSheets?.drawProjectile(ctx,10,{laser:true,age,source:'verse-gem'},{x:0,y:-height/2,w:W,h:height},{phaseIndex:boss.phase-1,variant:globalThis.ArcadeBossSheets.legacyVariant(boss),tick:time}))ctx.drawImage(beam,0,-height/2,W,height);
  }
  ctx.restore();
}

function arenaHazardOrigin(edge,lane) {
  if (Array.isArray(lane)) return lane;
  if (edge==='floor' || edge==='ceiling') return [clamp(boss.aimX+lane,62,W-62),edge==='floor'?FLOOR:36];
  return [edge==='left'?24:W-24,lane<0?FLOOR+lane:lane];
}

function drawArenaHazardWarning() {
  const hazard=PHASE_TWO_HAZARDS[mechanicsIndex(levelIndex)];
  if (!hazard || !boss.hp || boss.move!=='arenaHazard') return;
  const age=boss.age-boss.tell;
  ctx.save();
  for (const [frame,edge,lane] of hazard.shots) {
    const remaining=frame-age;
    if (remaining<0 || (age>=0 && remaining>18)) continue;
    const [x,y]=arenaHazardOrigin(edge,lane);
    if (edge==='astrolabe') {
      if (remaining<=24) {
        const core=ctx.createRadialGradient(x,y,1,x,y,16);
        core.addColorStop(0,'#fff0ca');
        core.addColorStop(.32,'#ff2c2d');
        core.addColorStop(1,'#cf182000');
        ctx.fillStyle=core;
        ctx.globalAlpha=.65+.35*(.5+.5*SimMath.sin(time*.35));
        ctx.fillRect(x-16,y-16,32,32);
      }
      continue;
    }
    const size=16+Math.round(5*SimMath.sin(time*.4+frame));
    ctx.globalAlpha=.84;
    ctx.strokeStyle=hazard.color;
    ctx.lineWidth=3;
    if (edge==='chandelier' || edge==='lantern' || edge==='bioPod') {
      ctx.beginPath();
      ctx.arc(x,y,size+5,0,Math.PI*2);
      ctx.stroke();
      ctx.fillStyle=edge==='bioPod'?'#bdff5d66':edge==='chandelier'?'#ec99ff54':'#ff903d66';
      ctx.fillRect(x-10,y-10,20,20);
    } else {
      ctx.strokeRect(x-size,y-size,size*2,size*2);
    }
    ctx.fillStyle='#fff3d3';
    ctx.fillRect(x-3,y-size+5,6,11);
    ctx.fillRect(x-3,y-size+19,6,4);
  }
  ctx.restore();
}

function drawVaultCannon() {
  if (mechanicsIndex(levelIndex)!==0 || boss.phase!==2) return;
  const y=vaultBeam?.y ?? arenaLaserY();
  const firing=Boolean(vaultBeam);
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  if (vaultBeam) {
    const x=vaultBeamFront(vaultBeam);
    const beam=attackArt('boss/higgsfield/vault-laser/beam');
    const tip=attackArt('boss/higgsfield/vault-laser/tip');
    ctx.globalAlpha=clamp((VAULT_BEAM_LIFE-vaultBeam.age)/8,0,1);
    const themed=globalThis.ArcadeBossSheets?.drawProjectile(ctx,LEVELS[levelIndex].id,{original:vaultBeam,laser:true,age:vaultBeam.age},{x,y:y-16,w:Math.max(1,VAULT_MUZZLE-x),h:32},{phaseIndex:boss.phase-1,tick:time});
    if(!themed){for (let start=x+32;start<VAULT_MUZZLE;start+=beam.width) {
      const width=Math.min(beam.width,VAULT_MUZZLE-start);
      ctx.drawImage(beam,0,0,width,beam.height,start,y-14,width,beam.height);
    }
    ctx.drawImage(tip,x,y-16,Math.min(tip.width,VAULT_MUZZLE-x),32);}
    ctx.globalAlpha=1;
  }
  const cannon=attackArt('boss/higgsfield/vault-laser/'+(firing?'cannon-fire':'cannon'));
  ctx.drawImage(cannon,W-cannon.width,Math.round(y-cannon.height/2));
  if (boss.hp && !firing && boss.move==='arenaHazard' && boss.age<=boss.tell) {
    const progress=clamp(boss.age/boss.tell,0,1);
    const warning=attackFrame('boss/higgsfield/vault-laser/warning',Math.min(3,Math.floor(progress*4)));
    const w=Math.round(94+116*progress),h=Math.round(w*warning.height/warning.width);
    ctx.globalAlpha=.65+.35*progress;
    ctx.drawImage(warning,Math.round(VAULT_MUZZLE-w*.56),Math.round(y-h/2),w,h);
  }
  ctx.restore();
}

function drawCeilingSweep() {
  if (!ceilingSweepInProgress()) return;
  const elapsed=boss.age-boss.tell;
  // The band lowers through the whole tell (it used to appear for the last 36 frames only), so the
  // warning on screen is as long as the warning in the rules. Drawing only; the strike is unchanged.
  const edge=elapsed<0
    ?Math.round(22+SWEEP_EDGE*.36*clamp(1+elapsed/boss.tell,0,1))
    :SWEEP_EDGE;
  const pulse=.5+.5*SimMath.sin(elapsed*.42*SWEEP_SPEED);
  const art=attackArt('boss/higgsfield/ceiling-sweep/blast');

  ctx.save();
  ctx.beginPath();
  ctx.rect(0,0,W,edge);
  ctx.clip();
  const tint=ctx.createLinearGradient(0,0,0,edge);
  tint.addColorStop(0,'#3d083bcc');
  tint.addColorStop(1,'#c31958a8');
  ctx.fillStyle=tint;
  ctx.fillRect(0,0,W,edge);
  ctx.imageSmoothingEnabled=false;

  const travel=Math.round(boss.age*23*SWEEP_SPEED)%W;
  const fade=1-clamp(elapsed/moves.ceilingSweep.active,0,1)*.54;
  ctx.globalAlpha=.48*fade;
  const themed=globalThis.ArcadeBossSheets?.drawProjectile(ctx,LEVELS[levelIndex].id,{source:'ceilingSweep',age:boss.age},{x:0,y:edge-SWEEP_EDGE,w:W,h:SWEEP_EDGE},{phaseIndex:boss.phase-1,variant:globalThis.ArcadeBossSheets.legacyVariant(boss),tick:time});
  if(!themed){ctx.drawImage(art,travel-W,-66,W,edge+65);
  ctx.drawImage(art,travel,-66,W,edge+65);}
  ctx.globalAlpha=.92*fade;
  if(!themed)ctx.drawImage(art,0,edge-218+Math.round(pulse*20),W,218);
  ctx.restore();
}

function drawShieldPulse() {
  if (!boss.hp || boss.move!=='shieldPulse') return;
  const elapsed=boss.age-boss.tell;
  if (elapsed>=moves.shieldPulse.active) return;
  const charge=clamp(boss.age/boss.tell,0,1);
  const firing=elapsed>0;
  const frame=firing?(elapsed<9?2:3):(charge<.56?0:1);
  const art=attackFrame('boss/higgsfield/shield-pulse',frame);
  const width=Math.round(firing?710+elapsed*20:155+charge*225);
  const height=Math.round(width*art.height/art.width);
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.globalAlpha=firing?Math.max(0,(32-elapsed)/32)*.80:.55+.29*charge;
  if(!globalThis.ArcadeBossSheets?.drawProjectile(ctx,LEVELS[levelIndex].id,{source:'shieldPulse',age:boss.age},{x:Math.round((W-width)/2),y:Math.round(340-height/2),w:width,h:height},{phaseIndex:boss.phase-1,variant:globalThis.ArcadeBossSheets.legacyVariant(boss),tick:time}))ctx.drawImage(art,Math.round((W-width)/2),Math.round(340-height/2),width,height);
  if (firing && elapsed<7) {
    ctx.globalAlpha=.16*(1-elapsed/7);
    ctx.fillStyle='#ffd7f4';
    ctx.fillRect(0,0,W,H);
  }
  ctx.restore();
}

function drawSaucer() {
  const p=player;
  const rear=attackArt('player/higgsfield/saucer/cockpit-rear');
  const front=attackArt('player/higgsfield/saucer/cockpit-front');
  if (!p.inv || time%8<5) {
    if (p.flyingMotion && !phaseShift) {
      const vertical=p.dash?p.dashY:p.vy/10.4;
      drawFlightFlame('green',p.x-59,p.y+14,p.dash?43:30,vertical*.24);
    }
    const x=Math.round(p.x-rear.width/2), y=Math.round(p.y-rear.height/2);
    drawSaucerBallLauncher(p);
    ctx.drawImage(rear,x,y);

    const pilot=ART.sprites[p.id];
    const [path,anchorX,anchorY]=pilot.poses[Math.floor(time/23)%2];
    // Frame an existing pose from the shoulders up. Unusual silhouettes can supply their own crop.
    const [sx,sy,sw,sh]=pilot.cockpitCrop??[anchorX-36,anchorY-128,88,83];
    const scale=Math.min(53/sw,43/sh);
    const w=Math.round(sw*scale), h=Math.round(sh*scale);
    ctx.drawImage(picture(path),sx,sy,sw,sh,x+Math.round(100-w/2),y+55-h,w,h);
    ctx.drawImage(front,x,y);
  }
  drawSaucerRedArm(p);
  if (p.shot===1 || (phaseShift>0 && phaseShift<6)) {
    const flash=attackArt('player/higgsfield/saucer/muzzle');
    ctx.drawImage(flash,Math.round(p.x+SAUCER_MUZZLE_X-5),Math.round(p.y+SAUCER_MUZZLE_Y-flash.height/2));
  }
  if (p.shield) drawPlayerShield('saucer-shield',p.x,p.y,1.4);
}

function drawSaucerBallLauncher(p) {
  const age=BOMB_COOLDOWN-p.bombWait;
  if (phaseShift || (godMode && !godFire) || age>=BALL_HATCH_FRAMES) return;
  const open=Math.min(1,(age+1)/BALL_LAUNCH_FRAME,(BALL_HATCH_FRAMES-age)/7);
  const baseX=Math.round(p.x-65), baseY=Math.round(p.y+8);
  const muzzleX=Math.round(p.x+BALL_MUZZLE_X);
  const muzzleY=Math.round(baseY+(p.y+BALL_MUZZLE_Y-baseY)*open);
  const angle=SimMath.atan2(muzzleY-baseY,muzzleX-baseX);
  const length=SimMath.hypot(muzzleX-baseX,muzzleY-baseY);
  ctx.save();
  ctx.translate(baseX,baseY);
  ctx.rotate(angle);
  ctx.fillStyle='#182235';
  ctx.fillRect(-5,-9,length+5,18);
  ctx.fillStyle='#798fa4';
  ctx.fillRect(0,-6,length,12);
  ctx.fillStyle='#e1eaf4';
  ctx.fillRect(2,-6,Math.max(0,length-8),3);
  ctx.fillStyle=age>=BALL_LAUNCH_FRAME && age<BALL_LAUNCH_FRAME+3?'#fff0ad':'#cc9b54';
  ctx.fillRect(length-6,-9,6,18);
  ctx.restore();
}

function drawSaucerRedArm(p) {
  const armAge=MISSILE_COOLDOWN-p.missileWait;
  const beamAge=armAge-RED_ARM_DEPLOY;
  if (phaseShift || (godMode && !godFire) || beamAge>=RED_BEAM_FRAMES+RED_ARM_RETRACT) return;

  const extension=Math.min(1,(armAge+1)/RED_ARM_DEPLOY,(RED_BEAM_FRAMES+RED_ARM_RETRACT-beamAge)/RED_ARM_RETRACT);
  const mountX=28, mountY=36;
  const mount=Math.round(p.x+mountX);
  const baseY=Math.round(p.y+mountY);
  const tip=Math.round(p.x+mountX+(RED_ARM_TIP_X-mountX)*extension);
  const y=Math.round(p.y+mountY+(RED_ARM_TIP_Y-mountY)*extension);
  ctx.fillStyle='#151725';
  ctx.fillRect(mount-7,baseY,14,y-baseY+7);
  ctx.fillRect(mount,y-7,tip-mount,14);
  ctx.fillStyle='#8298a9';
  ctx.fillRect(mount-4,baseY+3,8,y-baseY+1);
  ctx.fillRect(mount,y-4,tip-mount,8);
  ctx.fillStyle='#d8e3e9';
  ctx.fillRect(mount+1,y-4,Math.max(0,tip-mount-7),2);
  ctx.fillStyle='#3d465b';
  ctx.fillRect(tip-14,y-9,14,18);
  ctx.fillStyle='#b85a76';
  ctx.fillRect(tip-11,y-6,8,12);
  ctx.fillStyle=beamAge>=0 && beamAge<RED_BEAM_FRAMES?'#fff3eb':'#fa7188';
  ctx.fillRect(tip-3,y-5,3,10);

  if (beamAge>=0 && beamAge<RED_BEAM_FRAMES && tip<SAUCER_BEAM_END) {
    const beam=attackArt(boxes.redLaser.art);
    const height=Math.round(4+beam.height*Math.min(1,(RED_BEAM_FRAMES-beamAge)/8));
    ctx.drawImage(beam,tip,Math.round(y-height/2),SAUCER_BEAM_END-tip,height);
  }
}

function drawGroundPlayer() {
  const p=player, art=ART.sprites[p.id];
  const platforming=isChase() || isCodebreakClimb();
  const scale=isCodebreak()?CODE_CHARACTER_SCALE:1;
  if (!platforming || p.grounded) shadow(p.x,platforming?p.y:FLOOR,36*scale);
  const casting=phaseShift>0 && phaseShift<=8 && !p.crouch;
  const walking=p.walking && p.grounded && !p.dash && !p.crouch && !casting;
  const pose=casting?(art.cast.at(-2)??art.cast[0]):
    p.dash?art.poses[6]:p.crouch?art.poses[10]:
    !p.grounded?art.poses[p.vy<0?8:9]:
    walking?walk(p.id,p.distance,PLAYER_WALK_CYCLE_DISTANCE/art.walk.length):
    p.id==='rivet' && p.shot<3?art.cast.at(p.shot<2?-2:-1):art.poses[time%46<23?0:1];
  if (!p.inv || time%8<5) sprite(p.id,pose,p.x,p.y,1,1.20*scale*(walking?(art.walkScale??1):1));
  if (p.shield) drawPlayerShield('shield',p.x,p.y-77*scale,scale);
}

function drawPlayerShield(folder,x,y,scale=1) {
  const age=shieldDuration()-player.shield;
  const frame=age<8?0:player.shield<=10?3:1+Math.floor(age/7)%2;
  const ring=attackFrame('player/higgsfield/'+folder,frame);
  const w=Math.round(ring.width*scale), h=Math.round(ring.height*scale);
  ctx.drawImage(ring,Math.round(x-w/2),Math.round(y-h/2),w,h);
}

const goldieArt=kind=>attackArt('boss/higgsfield/goldie-jetpack/'+kind);
const goldieHoverAngle=frame=>.032*SimMath.sin(frame*2*Math.PI/GOLDIE_HOVER_FRAMES);
let goldieHoverSheet;

function makeGoldieHoverSheet() {
  const sheet=document.createElement('canvas');
  const size=GOLDIE_FRAME_SIZE;
  sheet.width=6*size;
  sheet.height=4*size;
  const ink=sheet.getContext('2d');
  ink.imageSmoothingEnabled=false;
  const sprite=goldieArt('poses/03');
  for (let frame=0;frame<GOLDIE_HOVER_FRAMES;frame++) {
    ink.save();
    ink.translate((frame%6+.5)*size,(Math.floor(frame/6)+.5)*size);
    ink.rotate(goldieHoverAngle(frame));
    ink.drawImage(sprite,-155,-153,310,306);
    ink.restore();
  }
  return sheet;
}

function goldiePose() {
  const frame=Math.floor(time/3)%GOLDIE_HOVER_FRAMES;
  const age=boss.attackAge;
  const lean=authoredTime()>=100?Math.min(clamp((age-21)/24,0,1),clamp((88-age)/22,0,1)):0;
  const easedLean=lean*lean*(3-2*lean);
  let recoil=0;
  if (authoredTime()>=100) {
    for (const [shotAge] of CHASE_ATTACKS[boss.attackIndex].shots) {
      const progress=clamp((age-shotAge)/16,0,1);
      recoil+=SimMath.sin(Math.PI*progress)**2*(1-progress);
    }
  }
  return {frame,tilt:.055*easedLean-.11*recoil,shift:6*easedLean-16*recoil};
}

function goldieAttachment(x,y,pose) {
  const angle=goldieHoverAngle(pose.frame)+pose.tilt;
  const cos=SimMath.cos(angle), sin=SimMath.sin(angle);
  return [x*cos-y*sin+pose.shift,x*sin+y*cos];
}

function drawGoldieJetpack() {
  const sheetPose=(densityShots.length&&globalThis.ArcadeBossSheets?.barragePose(densityShots,time,true))||{row:1+(globalThis.ArcadeBossSheets?.legacyVariant(boss,'chase')||0),column:Math.floor((boss.attackAge||0)/6)%4};
  if(globalThis.ArcadeBossSheets?.drawBoss(ctx,11,0,sheetPose,{x:boss.x-100,y:boss.y-100,w:200,h:200,flip:true}))return;
  const pose=goldiePose();
  const size=GOLDIE_FRAME_SIZE;
  ctx.save();
  ctx.translate(boss.x,boss.y);
  ctx.scale(GOLDIE_SCALE,GOLDIE_SCALE);
  const exhaust=goldieArt('thrusters/02');
  for (const [i,[nozzleX,nozzleY]] of GOLDIE_EXHAUST.entries()) {
    const [x,y]=goldieAttachment(nozzleX,nozzleY,pose);
    const length=65+9*SimMath.sin(time*.27+i);
    ctx.drawImage(exhaust,x-15,y-3,30,length);
  }
  ctx.save();
  ctx.translate(pose.shift,0);
  ctx.rotate(pose.tilt);
  ctx.drawImage(goldieHoverSheet,pose.frame%6*size,Math.floor(pose.frame/6)*size,size,size,-size/2,-size/2,size,size);
  ctx.restore();
  const chargeAge=boss.attackAge-21;
  const charge=authoredTime()>=100 && chargeAge>0 && chargeAge<25?SimMath.sin(Math.PI*chargeAge/25):0;
  if (charge>0) {
    const glow=attackArt('player/higgsfield/saucer/muzzle');
    const [x,y]=goldieAttachment(...GOLDIE_MUZZLE,pose);
    const width=22+34*charge;
    ctx.globalAlpha=.72*charge;
    ctx.drawImage(glow,x-width/2,y-width/2,width,width);
  }
  ctx.restore();
}

function chaseBuildingImage(index) {
  return picture('art/rooftop-chase/buildings/'+(index+1)+'.webp');
}

function drawChase() {
  ctx.imageSmoothingEnabled=false;
  for (const block of chasePlatforms) {
    const x=Math.round(block.x-camera);
    if (x+block.width<0 || x>W) continue;
    const building=chaseBuildingImage(block.building);
    const roof=CHASE_BUILDING_ROOFS[block.building];
    const facadeHeight=H-block.y+16;
    const roofHeight=Math.min(62,facadeHeight*roof/(1-roof));
    const roofPixel=Math.round(roof*building.height);
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(building,0,0,building.width,roofPixel,x,block.y-roofHeight,block.width,roofHeight);
    ctx.drawImage(building,0,roofPixel,building.width,building.height-roofPixel,x,block.y,block.width,facadeHeight);
    ctx.imageSmoothingEnabled=false;

    // The top edge of the coping is also the landing surface.
    ctx.fillStyle='#251c31';
    ctx.fillRect(x,block.y,block.width,12);
    ctx.fillStyle='#d9be91';
    ctx.fillRect(x,block.y,block.width,3);
    ctx.fillStyle='#766783';
    ctx.fillRect(x+3,block.y+4,block.width-6,4);
  }
  const exit=Math.round(CHASE_FINISH-camera);
  if (exit>0 && exit<W) {
    const ground=chasePlatforms.at(-1).y;
    ctx.fillStyle='#1b2f39';
    ctx.fillRect(exit,ground-53,6,53);
    ctx.fillStyle='#85f1bb';
    ctx.fillRect(exit+6,ground-53,46,22);
    ctx.fillStyle='#12232a';
    ctx.font='bold 12px system-ui';
    ctx.fillText('EXIT',exit+14,ground-38);
  }
  drawGoldieJetpack();
  drawGroundPlayer();
  for (const shot of bullets) {
    const [name,w,h]=bossShotArt[shot.shape];
    ctx.save();
    ctx.translate(Math.round(shot.x),Math.round(shot.y));
    if(!globalThis.ArcadeBossSheets?.drawProjectile(ctx,11,shot,{x:-w/2,y:-h/2,w,h},{phaseIndex:0,tick:time,directionAngle:SimMath.atan2(shot.vy,shot.vx)})){
      if (shot.shape==='pumpkin') ctx.rotate(shot.age*.13);
      ctx.drawImage(bossAttackImage(name),-w/2,-h/2,w,h);
    }
    ctx.restore();
  }
}

function drawLegacyDensity(){
  if(!densityShots.length||!['play','paused'].includes(mode))return;
  for(const shot of densityShots){
    if(shot.age<=shot.delay)continue;
    ctx.save();
    ctx.translate(shot.x+shot.w/2,shot.y+shot.h/2);
    if(shot.vx<0)ctx.scale(-1,1);
    const drawn=globalThis.ArcadeBossSheets?.drawDensityMissile?.(ctx,shot,{x:-shot.w/2,y:-shot.h/2,w:shot.w,h:shot.h},time);
    ctx.restore();
    if(!drawn){
      const core=ArcadeDensityAttacks.damageRect(shot);
      ctx.fillStyle='#fff0a8';
      ctx.fillRect(core.x,core.y,core.w,core.h);
    }
  }
}
function render(){renderLegacyScene();drawLegacyDensity();drawLegacyPhasePowerups();drawFeedback();}
function renderLegacyScene() {
  if (isCodebreak()) return drawCodebreak();
  if (phaseShift>=STAGE_BLACKOUT) {
    ctx.fillStyle='#000';
    ctx.fillRect(0,0,W,H);
    return;
  }
  drawBackground();
  if (isChase()) {
    drawChase();
    return;
  }
  drawArenaMotion();
  drawShade();
  ctx.save();
  if (shake) ctx.translate(SimMath.sin(time*1.8)*shake*.28,SimMath.cos(time*2)*shake*.25);
  ctx.imageSmoothingEnabled=false;
  renderBoss();
  if (isFlying()) drawSaucer();
  else drawGroundPlayer();
  for (const shot of bullets) {
    ctx.save();
    ctx.translate(Math.round(shot.x),Math.round(shot.y));
    ctx.imageSmoothingEnabled=false;
    const legacyShotPose=()=>{
      if (shot.shape==='missile'||MECHA_ROCKETS.includes(shot.shape)) ctx.rotate(SimMath.atan2(shot.vy,shot.vx));
      else if ((shot.shape==='gear'||shot.shape==='saw'||shot.shape==='star')) ctx.rotate(shot.age*.17*Math.sign(shot.vx));
      else if (shot.vx<0 && (shot.shape==='boulder' || shot.shape==='prism' || shot.shape==='crescent'||shot.shape==='comet'||shot.shape==='hammer'||shot.shape==='torpedo'||shot.shape==='shard'||shot.shape==='trident'||shot.shape==='prismwedge')) ctx.scale(-1,1);
    };
    const enemyArt=bossShotArt[shot.laser?'laser':shot.shape]||(shot.shape==='bioBubble'?['',58,58]:['',52,92]);
    if (shot.own) {
      legacyShotPose();
      const {art,scale=1}=boxes[shot.shape];
      const sprite=shot.shape==='beachBall'
        ?attackFrame('player/higgsfield/saucer/ball-spin',Math.floor(shot.age/2)%16)
        :attackArt(art);
      const w=sprite.width*scale, h=sprite.height*scale;
      ctx.drawImage(sprite,-Math.floor(w/2),-Math.floor(h/2),w,h);
    } else if (globalThis.ArcadeBossSheets?.drawProjectile(ctx,LEVELS[levelIndex].id,shot,{x:-enemyArt[1]/2,y:-enemyArt[2]/2,w:enemyArt[1],h:enemyArt[2]},{phaseIndex:boss.phase-1,tick:time,directionAngle:SimMath.atan2(shot.vy,shot.vx)})) {
      // Themed enemy art uses the original visual size; collision remains in boxes.
    } else {
      legacyShotPose();
      if (shot.shape==='bioBubble') {
        const bubble=hatcheryFrame('bubble',Math.floor(shot.age/4)%4);
        ctx.drawImage(bubble,-29,-29,58,58);
      } else if (shot.shape==='barnFire') {
        const flame=attackFrame('boss/higgsfield/barn-fire',Math.floor(shot.age/3)%4);
        ctx.rotate(SimMath.atan2(-shot.vx,shot.vy)*.7);
        ctx.drawImage(flame,-26,-66,52,92);
      } else {
        const [name,w,h]=bossShotArt[shot.laser?'laser':shot.shape];
        if (MECHA_ROCKETS.includes(shot.shape)) drawFlightFlame('orange',-w/2+23,0,30);
        ctx.drawImage(bossAttackImage(name),-Math.floor(w/2),-Math.floor(h/2),w,h);
      }
    }
    ctx.restore();
  }
  ctx.save();
  for (const impact of impacts) {
    const sprite=attackArt(`player/higgsfield/${impact.art}`);
    const progress=impact.age/impact.duration;
    const scale=Math.min(1,.6+progress*1.4)*(impact.size??1);
    const w=Math.round(sprite.width*scale),h=Math.round(sprite.height*scale);
    ctx.globalAlpha=impact.opacity*Math.min(1,(1-progress)*2);
    ctx.drawImage(sprite,Math.round(impact.x-w/2),Math.round(impact.y-h/2),w,h);
  }
  ctx.restore();
  for (const s of sparks) {
    ctx.globalAlpha=s.life/18;
    ctx.fillStyle=s.color;
    ctx.fillRect(s.x,s.y,4,4);
  }
  ctx.restore();
  drawVaultCannon();
  drawArenaHazardWarning();
  drawVerseGemLaser();
  drawShieldPulse();
  drawCeilingSweep();
  if (phaseShift) drawStageShift();
}

function pause() {
  if (mode==='play') setOverlay('paused','Intermission','Paused','Take a breather.\n'+coachText(),'Resume');
  else if (mode==='paused') setOverlay('play','','','','');
}

function retryCurrentPhase(){
  const checkpoint=(!isChase()&&boss?.phase===2)?2:1;
  keys.clear();pressed.clear();
  whenReady(levelIndex,()=>begin(levelIndex,false,checkpoint));
}

window.addEventListener('keydown',e=>{
  if(e.code==='KeyR'&&mode==='lost'&&!e.repeat){e.preventDefault();retryCurrentPhase();return;}
  if (e.code==='Digit9' || e.code==='Numpad9') {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (mode==='play') e.preventDefault();
    if (e.timeStamp-lastNine<=750) {
      godMode=!godMode;
      if (godMode) godHits=0;
      if (godMode) godUsed=true;
      godFire=true;
      godDamageBoost=false;
      lastNine=-Infinity;
      if (player) refreshHud();
    } else lastNine=e.timeStamp;
    return;
  }
  if (!e.repeat) lastNine=-Infinity;
  if (e.code==='KeyI' && godMode) {
    if (!e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      godDamageBoost=!godDamageBoost;
      if (player) refreshHud();
    }
    return;
  }
  if (e.code==='KeyZ' && godMode) {
    if (!e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      godFire=!godFire;
      if (!godFire && bullets) bullets=bullets.filter(shot=>!shot.own);
      if (player) refreshHud();
    }
    return;
  }
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
  lastNine=-Infinity;
  if (mode==='play') pause();
});
// Pause screen: volume and mute for effects and music (story-audio.js keeps them in localStorage).
if (window.ArcadeAudio && document.getElementById('audio-controls')) {
  const level=document.getElementById('volume-level'),mute=document.getElementById('mute');
  document.getElementById('volume-down').addEventListener('click',()=>ArcadeAudio.setVolume(ArcadeAudio.volume-.1));
  document.getElementById('volume-up').addEventListener('click',()=>ArcadeAudio.setVolume(ArcadeAudio.volume+.1));
  mute.addEventListener('click',()=>ArcadeAudio.setMuted(!ArcadeAudio.muted));
  ArcadeAudio.onChange(({volume,muted})=>{
    level.textContent=muted?'Muted':Math.round(volume*100)+'%';
    mute.textContent=muted?'Unmute':'Mute';
    mute.setAttribute('aria-pressed',String(muted));
  });
}
ui.start.addEventListener('click',()=>{
  if (!audio && window.AudioContext) audio=new AudioContext();
  audio?.resume().catch(()=>{});
  if(typeof SPRITE_HITBOXES!=='undefined'&&SPRITE_HITBOXES.enabled&&
    (typeof globalThis.ArcadeBossSheets?.stageReady!=='function'||typeof globalThis.ArcadeBossSheets?.preloadStage!=='function')){location.reload();return;}
  if (mode==='loading') { loadInitialLevel();return; }
  if (mode==='paused') setOverlay('play','','','','');
  else if (mode==='clear') {const next=nextCampaignLevel(levelIndex);if(next>=0)whenReady(next,()=>begin(next,true));}
  else if (mode==='lost') retryCurrentPhase(); // Decoded retry stays synchronous.
  else {
    const index=Number(levelSelect.value);
    // First level of this browser: one screen of controls, shown once (COACH_KEY).
    if (mode!=='coach' && !coachSeen()) { setOverlay('coach','How to play','Before you start',coachText(),'Got it · Start');return; }
    coachDone();
    whenReady(index,()=>begin(index));
  }
});

let last=0,carry=0;
// Browser only. Each frame runs inside the crash guard (runtime/crash-guard.js) and the next frame is
// always scheduled: a throw ends the frame (no more fixed steps on a half-applied state) and drops the
// step backlog; a streak of failing frames halts the game behind a "Something broke" panel.
function loop(now) {
  try {
    if (globalThis.ArcadeCrash) globalThis.ArcadeCrash.runFrame(storyFrame,now,()=>{carry=0;});
    else storyFrame(now);
  } finally {
    requestAnimationFrame(loop);
  }
}
// One rendered frame. Returns false when play is running but no fixed step fell due (proves nothing).
function storyFrame(now) {
  const dt=Math.min(now-last,66);
  last=now;
  let steps=0;
  if (mode==='play') {
    carry+=dt;
    while (mode==='play' && carry>=1000/60) {
      inputFrame=readKeyboardFrame();
      replayRecorder?.push(inputFrame);
      update();
      pressed.clear();
      carry-=1000/60;
      steps++;
    }
  } else {
    carry=0;
    pressed.clear();
  }
  if (player) render();
  return steps>0 || mode!=='play';
}

function makePanoramaTile(image, floorRatio, width) {
  const tile=document.createElement('canvas');
  tile.width=width;
  tile.height=H;
  const art=tile.getContext('2d');
  const foot=Math.round(image.height*floorRatio);
  art.drawImage(image,0,0,image.width,foot,0,0,width,FLOOR);
  art.drawImage(image,0,foot,image.width,image.height-foot,0,FLOOR,width,H-FLOOR);
  return tile;
}

// Assets load in groups so Start waits only for what the chosen level and Sproto draw.
// picture() starts a download as soon as it is called, so a group's generator runs only when needed.
function spriteFrames(id) {
  const art=ART.sprites[id];
  return [...Object.values(art.poses),...art.walk,...(art.cast??[]),...(art.entrance??[]),...(art.death??[]),...(art.ranged??[])].map(frame=>picture(frame[0]));
}

function coreAssets() {
  const images=[];
  for (let i=0;i<4;i++) {
    if (i<2) images.push(attackFrame('boss/higgsfield/transition',i));
    for (const color of Object.keys(BUNKER_LIGHTS)) images.push(bunkerLightFrame(color,i));
    for (const kind of ['lava','candle','smoke']) images.push(forgeMotionFrame(kind,i));
    for (const kind of ['specimen','bubble']) images.push(hatcheryFrame(kind,i));
    for (const kind of ['crystal','portal']) images.push(verseMotionFrame(kind,i));
    images.push(marinaWaterFrame(i));
    for (let level=0;level<3;level++) images.push(backdropFrame(level,i));
    images.push(attackFrame('boss/higgsfield/shield-pulse',i));
  }
  for (const key of ['spark','greenLaser','redLaser','missile','bomb']) images.push(attackArt(boxes[key].art));
  for (let i=0;i<4;i++) images.push(attackFrame('boss/higgsfield/barn-fire',i));
  for (const [name] of Object.values(bossShotArt)) images.push(bossAttackImage(name));
  images.push(bossAttackImage('ground-eruption'));
  for (const part of ['hover','fire']) images.push(bossAttackImage('mecha/'+part));
  for (const piece of ['cannon','cannon-fire','beam','tip']) images.push(attackArt('boss/higgsfield/vault-laser/'+piece));
  for (let i=0;i<4;i++) images.push(attackFrame('boss/higgsfield/vault-laser/warning',i));
  images.push(attackArt('player/higgsfield/explosion'),picture('art/backdrop-motion/ranch-wheel.png'),picture('art/backdrop-motion/crown-astrolabe.png'),picture('art/backdrop-motion/verse/ship.png'),picture('art/backdrop-motion/marina/turbine.png'),picture('art/backdrop-motion/transit-train.png'));
  images.push(attackArt('boss/higgsfield/ceiling-sweep/blast'));
  for (let i=0;i<4;i++) {
    images.push(attackFrame('player/higgsfield/shield',i));
    images.push(attackFrame('player/higgsfield/saucer-shield',i));
  }
  for (let i=0;i<16;i++) images.push(attackFrame('player/higgsfield/saucer/ball-spin',i));
  for (const part of ['cockpit-rear','cockpit-front','muzzle']) images.push(attackArt('player/higgsfield/saucer/'+part));
  for (const color of ['green','orange']) {
    for (let i=0;i<2;i++) images.push(attackFrame('flight-flames/'+color,i));
  }
  for (const {art} of Object.values(playerImpacts)) images.push(attackArt(`player/higgsfield/${art}`));
  for (const width of [65,84]) {
    const folder=`hazards/${width}px`;
    for (let i=0; i<3; i++) images.push(attackFrame(`${folder}/warning`,i));
    for (let i=0; i<4; i++) images.push(attackFrame(`${folder}/retract`,i));
  }
  images.push(goldieArt('poses/03'),goldieArt('thrusters/02'));
  return images;
}

function levelAssets(index) {
  const level=LEVELS[index];
  const images=[loopPanels(index)[0],...(GENERATED_LOOPS[mechanicsIndex(index)]?.panels.slice(1,3)??[])].map(([file])=>picture('art/'+file));
  if (STATIC_ARENAS[mechanicsIndex(index)]) images.push(picture('art/'+STATIC_ARENAS[mechanicsIndex(index)][0]));
  if (acts[index]) {
    for (let i=0;i<4;i++) images.push(stageEffectFrame(mechanicsIndex(index),i));
    images.push(...spriteFrames(acts[index].id));
  }
  if (level.chase) for (let i=0;i<CHASE_BUILDING_ROOFS.length;i++) images.push(chaseBuildingImage(i));
  if (level.codebreak) images.push(...codebreakImages());
  return images;
}

const assetGroups=new Map(), readyGroups=new Set();
function loadGroup(key,make) {
  if (!assetGroups.has(key)) {
    const images=make();
    const loading=Promise.all(images.map(img=>img.decode())).then(()=>{readyGroups.add(key);});
    // A failed image stays broken in the picture() cache, so drop it and let a retry fetch it again.
    loading.catch(()=>{
      assetGroups.delete(key);
      for (const img of images) if (!img.complete || !img.naturalWidth) for (const [path,cached] of pictures) if (cached===img) pictures.delete(path);
    });
    assetGroups.set(key,loading);
  }
  return assetGroups.get(key);
}
const loadCore=()=>loadGroup('core',coreAssets);
const loadLevel=index=>loadGroup('level:'+index,()=>levelAssets(index));
const loadSproto=id=>loadGroup('sproto:'+id,()=>spriteFrames(id));
const bossArtReady=index=>{const art=globalThis.ArcadeBossSheets;return typeof art?.stageReady==='function'&&typeof art?.preloadStage==='function'?art.stageReady(LEVELS[index].id):!(typeof SPRITE_HITBOXES!=='undefined'&&SPRITE_HITBOXES.enabled);};
const loadBossArt=index=>{const art=globalThis.ArcadeBossSheets;if(typeof art?.stageReady==='function'&&typeof art?.preloadStage==='function')return art.preloadStage(LEVELS[index].id);return typeof SPRITE_HITBOXES!=='undefined'&&SPRITE_HITBOXES.enabled?Promise.reject(Error('Boss art renderer could not load. Reload the game.')):Promise.resolve();};
const isReady=(index,id=selectedSproto.id)=>readyGroups.has('core') && readyGroups.has('level:'+index) && readyGroups.has('sproto:'+id) && bossArtReady(index);
const loadFor=(index,id=selectedSproto.id)=>Promise.all([loadCore(),loadLevel(index),loadSproto(id),loadBossArt(index)]);
function prefetchLevel(index) {
  if (index<LEVELS.length) Promise.all([loadLevel(index),loadBossArt(index)]).catch(()=>{});
}

// Runs start once the level and Sproto groups are decoded; the button reads Loading… meanwhile.
let pendingStart=0;
function whenReady(index,start) {
  if (isReady(index)) return start();
  const ticket=++pendingStart, label=ui.start.textContent;
  ui.start.disabled=true;
  ui.start.textContent='Loading…';
  loadFor(index).then(()=>{
    if (ticket!==pendingStart) return;
    ui.start.disabled=false;
    ui.start.textContent=label;
    start();
  },()=>{
    if (ticket!==pendingStart) return;
    ui.start.disabled=false;
    ui.start.textContent=typeof SPRITE_HITBOXES!=='undefined'&&SPRITE_HITBOXES.enabled&&typeof globalThis.ArcadeBossSheets?.preloadStage!=='function'?'Reload game':'Retry loading';
  });
}

// Title-screen choices: load the chosen group, keep Start disabled until it is ready.
function refreshTitleReadiness() {
  if (mode!=='title' && mode!=='won') return;
  const index=Number(levelSelect.value), ticket=++pendingStart, label=mode==='won'?'Play again':'Start level';
  if (isReady(index)) {
    ui.start.disabled=false;
    ui.start.textContent=label;
    return;
  }
  ui.start.disabled=true;
  ui.start.textContent='Loading…';
  loadFor(index).then(()=>{
    if (ticket!==pendingStart) return;
    ui.start.disabled=false;
    ui.start.textContent=label;
    if (levelIndex===index && (mode==='title' || mode==='won')) drawBackground();
  },()=>{
    if (ticket!==pendingStart) return;
    ui.start.disabled=false;
    ui.start.textContent='Retry loading';
  });
}

if (new URLSearchParams(location.search).has('assetAudit')) {
  // QA only: qa/lazy-load-browser.mjs loads every group to compare with the old preload set.
  // Also every scrolling panel: drawBackground() requests panels past the first three only as the
  // camera reaches them, so tools/build-web.mjs needs them listed here to ship them.
  const allPanels=()=>LEVELS.flatMap((_,i)=>loopPanels(i)).map(([file])=>picture('art/'+file));
  window.__arcadeAssets={loadEverything:()=>Promise.all([loadCore(),...LEVELS.map((_,i)=>loadLevel(i)),...LEVELS.map((_,i)=>loadBossArt(i)),...playable.map(p=>loadSproto(p.id)),...allPanels().map(img=>img.decode())])};
}

let initialLoad=null;
function loadInitialLevel(){
 if(initialLoad)return initialLoad;
 ui.start.disabled=true;ui.start.textContent='Loading…';
 initialLoad=loadFor(firstLevel).then(()=>{
  goldieHoverSheet=makeGoldieHoverSheet();
  camera=0;
  levelIndex=firstLevel;
  showLevelControls();
  drawBackground();
  ui.title.textContent=LEVELS[firstLevel].title;
  mode='title';
  levelSelect.addEventListener('change',()=>{
    levelIndex=Number(levelSelect.value);
    showLevelControls();
    camera=0;
    ui.title.textContent=LEVELS[levelIndex].title;
    drawBackground();
    refreshTitleReadiness();
  });
  sprotoSelect.addEventListener('click',()=>refreshTitleReadiness());
  ui.start.disabled=false;
  ui.start.textContent='Start level';
  requestAnimationFrame(loop);
  if(nextCampaignLevel(firstLevel)>=0)prefetchLevel(nextCampaignLevel(firstLevel));
}).catch(()=>{
  initialLoad=null;ui.start.disabled=false;ui.start.textContent=typeof SPRITE_HITBOXES!=='undefined'&&SPRITE_HITBOXES.enabled&&typeof globalThis.ArcadeBossSheets?.preloadStage!=='function'?'Reload game':'Retry loading';
  ui.description.textContent='Some game art could not load. Reload or retry loading to start.';
});
 return initialLoad;
}
// Rank and best time beside each level, repainted whenever the save changes (hub sign-in, a clear).
if (window.ArcadeHub?.onChange) window.ArcadeHub.onChange(paintLevelSelect); else paintLevelSelect();
loadInitialLevel();
// Startup reached the loop (it starts once the first level's art is in): an earlier uncaught error is not a boot failure.
globalThis.ArcadeCrash?.markStarted();
