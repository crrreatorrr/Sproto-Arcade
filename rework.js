/* Shared offline browser adapter. All gameplay modules run at fixed 60 Hz. */
(function(){
'use strict';
const $=id=>document.getElementById(id),canvas=$('arena'),ctx=canvas.getContext('2d'),held=new Set(),press=new Set();
const images=new Map(),stages=[...Arcade.stages.values()].filter(s=>typeof s.enabled==='function'?s.enabled():s.enabled!==false).sort((a,b)=>(a.order??a.number)-(b.order??b.number));
const transitions=globalThis.ArcadeBossTransitions,trialTransition=transitions?.createClock();
let incomingWorld=null;
let world=null,paused=false,last=0,acc=0,visibleState='',pilot='rivet',soundTick=-1,pickupAttempt=0;
// Key prompts follow the last device used (gamepad.js sets data-input); the controller layout is README "Controls".
// Bindings come from controls.js (controller settings); with the defaults these are the labels below.
const PAD_LABEL={dash:'B',C:'Y',V:'RB',F:'LB'};const padPrompts=()=>document.documentElement.dataset.input==='gamepad';const controls=()=>globalThis.ArcadeControls;
const PROMPT_ACTION={dash:'dash',C:'beam',V:'bomb',F:'power',X:'shield'};const keyLabel=k=>{const c=controls(),a=PROMPT_ACTION[k];if(padPrompts())return (c&&a?c.padPrompt(a,PAD_LABEL[k]||k):PAD_LABEL[k])||k;return c&&a?c.prompt(a,k):k;};
const dashKeyCode=()=>controls()?.keysFor('dash')[0]||'ShiftLeft';
const nativeFillText=ctx.fillText.bind(ctx);ctx.fillText=(value,...args)=>nativeFillText(String(value).replace(/\bSHIFT\b/gi,padPrompts()?keyLabel('dash'):(controls()?.prompt('dash','Shift')??'Shift')),...args);
let audio;function tone(hz=420){try{audio??=new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),v=audio.createGain();o.connect(v);v.connect(audio.destination);v.gain.setValueAtTime(.025,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.frequency.value=hz;o.start();o.stop(audio.currentTime+.12);}catch{}}
function image(path){if(!images.has(path)){const i=new Image();i.src=path;images.set(path,i);}return images.get(path);}
function img(path){if(!path)return null;const i=image(path);return i.complete&&i.naturalWidth?i:null;}
const pilots=[['rivet','Golden Sproto'],['sproto3106','Sproto Sheriff'],['sproto3152','Pissing Sproto'],['morelight','Morelight'],['sproto763','rog'],['sproto831','The Villain'],['sproto943','Artchick'],['sproto1477','Stalker'],['sproto1668','Goldie'],['sproto1815','Jessica'],['sproto2101','The Jay'],['sproto2177','Spronic'],['sproto2569','Clownie'],['sproto2884','Sprite']];
for(const [order,s] of stages.entries())$('stage').add(new Option(String(order+1).padStart(2,'0')+' · '+s.title,s.id));
for(const [id,name] of pilots)$('pilot').add(new Option(name,id));
function readRecords(){try{return JSON.parse(localStorage.getItem('arcade-v1-records')||'{}');}catch{return {};}}
function recordKey(w){return w.stage.id+':'+(w.checkpointRetry?'checkpoint:phase1':w.practice?`practice:phase${w.options.phase}:sector${w.options.sector}`:'full');}
function records(){const r=readRecords(),id=$('stage').value,o=$('entry').selectedOptions[0],phase=Number(o?.dataset.phase??o?.value)||0,sector=Number(o?.dataset.sector)||0;const f=r[id+':full'],p=r[id+`:practice:phase${phase}:sector${sector}`];$('records').textContent=`Best full run: ${f?(f/60).toFixed(1)+'s':'—'} · Best selected practice: ${p?(p/60).toFixed(1)+'s':'—'}`;}
function refreshEntries(){const s=Arcade.stages.get($('stage').value);$('entry').replaceChildren(new Option('Full run · Phase 1','0'),new Option('Practice · Phase 2','1'));for(const sec of s?.practiceSectors||[]){const o=new Option('Practice · '+sec.label,'sector-'+sec.id);o.dataset.phase=sec.phase??0;o.dataset.sector=sec.id;$('entry').add(o);}records();}
function startNow(){trialTransition?.reset();incomingWorld=null;const s=Arcade.stages.get($('stage').value);if(!s)return;pilot=$('pilot').value;world=new Arcade.World(s,{pickupAttempt:pickupAttempt++,seed:Number($('seed').value)||777,phase:Number($('entry').selectedOptions[0].dataset.phase??$('entry').value)||0,sector:Number($('entry').selectedOptions[0].dataset.sector)||0,practice:$('entry').value!=='0'});paused=false;held.clear();press.clear();acc=0;visibleState='';soundTick=-1;render.lastCue='';$('curtain').hidden=true;$('next').hidden=true;records();tone();}
let startRequest=0;const startLabel=$('start').textContent;
function start(){
 const id=$('stage').value,selectedPilot=$('pilot').value,art=globalThis.ArcadeBossSheets,ticket=++startRequest;
 const stage=Arcade.stages.get(id);
 if(!stage)return;
 const adapterReady=typeof art?.stageReady==='function'&&typeof art?.preloadStage==='function';
 if(!adapterReady&&typeof SPRITE_HITBOXES!=='undefined'&&SPRITE_HITBOXES.enabled){paused=true;$('start').disabled=false;$('start').textContent='Reload game';$('start').onclick=()=>location.reload();$('status').textContent='Boss art could not load. Reload the game before starting.';return;}
 const hullAssets=stage.phases?.some(phase=>phase.naval)?ArcadeSpeedboat.assets:[];
 const vehicleAssets=hullAssets.length||stage.number===7?[...hullAssets,...[0,1].map(i=>ART.sprites[selectedPilot].poses[i][0])]:[];
 if((!adapterReady||art.stageReady(id))&&vehicleAssets.every(path=>img(path))&&transitions?.settled(id)!==false){ $('start').disabled=false;$('start').textContent=startLabel;return startNow(); }
 paused=true;$('start').disabled=true;$('start').textContent='Loading…';$('status').textContent='Loading boss art…';
 return Promise.all([adapterReady?art.preloadStage(id):null,transitions?.preload(id),...vehicleAssets.map(path=>image(path).decode().catch(error=>{images.delete(path);throw error;}))]).then(()=>{
  if(ticket!==startRequest)return;
  $('start').disabled=false;$('start').textContent=startLabel;
  if($('stage').value===id)return vehicleAssets.length&&$('pilot').value!==selectedPilot?start():startNow();
  $('status').textContent='Choose Start to load the selected encounter.';
 },()=>{if(ticket!==startRequest)return;if(vehicleAssets.length&&$('pilot').value!==selectedPilot)return start();$('start').disabled=false;$('start').textContent='Retry art loading';$('status').textContent='Boss art could not load. Retry to start the encounter.';});
}
$('next').onclick=()=>{const n=stages.findIndex(s=>s.id===world.stage.id)+1;if(stages[n]){$('stage').value=stages[n].id;refreshEntries();start();}};
function overlay(title,message,button){$('curtain').dataset.mode=title==='Paused'?'paused':world?.state==='lost'?'lost':world?.state==='clear'?'clear':'menu';$('next').hidden=!(world?.state==='clear'&&!world.practice&&stages.findIndex(s=>s.id===world.stage.id)<stages.length-1);$('result').textContent=title;$('message').textContent=message;$('resume').textContent=button;const fb=$('feedback-open');if(fb)fb.hidden=!(title==='Paused'&&globalThis.ArcadeFeedback?.allowed);$('curtain').hidden=false;}
$('entry').onchange=records;$('start').onclick=start;$('stage').onchange=()=>{startRequest++;$('start').disabled=false;$('start').textContent=startLabel;refreshEntries();};$('resume').onclick=()=>{if(paused){paused=false;held.clear();press.clear();$('curtain').hidden=true;}else if(world?.state==='lost'){world.restart();visibleState='';soundTick=-1;render.lastCue='';$('curtain').hidden=true;held.clear();press.clear();acc=0;}else start();};
// Quick dash remap: press-to-bind through controls.js, so it is saved and shown in controller settings. A key another action uses is refused.
let quickDash=null;const dashButtonLabel=()=>(quickDash&&quickDash.code===dashKeyCode()?quickDash.key:controls()?controls().keyLabel(dashKeyCode()):'Shift')+' · Dash (remap)';
$('dash-key').onclick=()=>{const c=controls();if(!c)return;$('dash-key').textContent='Press a key for dash…';c.beginCapture({action:'dash',slot:0,device:'key',strict:true,
 refused:()=>{$('dash-key').textContent='Reserved key · choose another';},
 done:(r)=>{if(r.code){quickDash={code:r.code,key:r.key};if(r.code==='ShiftLeft')c.bindKey('dash',1,'ShiftRight');else c.clearKey('dash',1);}$('dash-key').textContent=dashButtonLabel();}});};
controls()?.onChange(()=>{if(!controls().capturing)$('dash-key').textContent=dashButtonLabel();});$('dash-key').textContent=dashButtonLabel();
const actions={jump:['Space'],shield:['KeyX'],power:['KeyF'],replace:['KeyE'],retry:['KeyR'],beam:['KeyC'],bomb:['KeyV']};
window.addEventListener('keydown',e=>{if(/INPUT|SELECT/.test(e.target.tagName))return;if(e.code==='Escape'&&!e.repeat&&['playing','transition'].includes(world?.state)){paused=!paused;held.clear();press.clear();if(paused)overlay('Paused','Take a breath. The simulation is stopped.','Resume');else $('curtain').hidden=true;e.preventDefault();return;}if(!held.has(e.code))press.add(e.code);held.add(e.code);if(['Space',...Object.keys(actions).flatMap(k=>actions[k]),'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();});
window.addEventListener('keyup',e=>held.delete(e.code));window.addEventListener('blur',()=>{held.clear();press.clear();if(['playing','transition'].includes(world?.state)&&!paused){paused=true;overlay('Paused','The game paused when this window lost focus.','Resume');}});
function input(){const i={left:held.has('ArrowLeft')||held.has('KeyA'),right:held.has('ArrowRight')||held.has('KeyD'),up:held.has('ArrowUp')||held.has('KeyW'),down:held.has('ArrowDown')||held.has('KeyS'),dash:press.has('ShiftLeft')||press.has('ShiftRight')};for(const [a,codes]of Object.entries(actions))i[a]=codes.some(c=>press.has(c));press.clear();return i;}
function text(s,x,y,size=18,color='#fff1d0',align='left'){ctx.font=`700 ${size}px system-ui`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(String(s),x,y);}
function sprite(id,x,y,height=76,pose=0,facing=1){const a=ART.sprites[id],p=a?.poses?.[pose]||a?.poses?.[0],i=img(p?.[0]);if(i){const b=Arcade.spriteBounds?.[p[0]]||[0,0,i.naturalWidth,i.naturalHeight],w=height*b[2]/b[3];ctx.save();ctx.translate(x,y);ctx.imageSmoothingEnabled=false;ctx.scale(facing<0?-1:1,1);ctx.drawImage(i,b[0],b[1],b[2],b[3],-w/2,-height,w,height);ctx.restore();}else{ctx.fillStyle='#ffdb8a';ctx.fillRect(x-13,y-height,26,height);}}
function drawTrialsJet(w,p){
 const firing=w.state==='playing'&&!w.densityBarrage;
 const missileAge=firing&&p.beamWait?90-p.beamWait:Infinity;
 const heavyAge=firing&&p.bombWait?120-p.bombWait:Infinity;
 const missile=missileAge<16?w.shots.find(s=>s.id===`beam-${w.tick-missileAge}`):null;
 const heavy=heavyAge<16?w.shots.find(s=>s.id===`ball-${w.tick-heavyAge}`):null;
 // Match World.standardSpecial's spawn centers, including the missile's target lead.
 globalThis.ArcadeMoonkeepJet.draw(ctx,img,{...p,id:pilot,y:p.y-26},w.tick,{
  visible:!p.inv||w.tick%8<5,missileAge,heavyAge,
  missile:{launch:0,mount:[0,23],port:[(missile?missile.vx/28:p.facing)*24+8,6]},
  heavy:{launch:0,mount:[-21*p.facing,-5],port:[(heavy?heavy.vx/8:p.facing)*24+8,6]}
 });
}
function drawTrialDash(p,vehicle){
 if(!vehicle){ctx.strokeStyle='#eed9ff';ctx.lineWidth=4;ctx.strokeRect(p.x-22,p.y-57,44,62);return;}
 ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y-26));ctx.rotate(Math.atan2(p.dashY,p.dashX));
 for(const [length,y] of [[19,-8],[27,0],[13,8]]){
  const x=-102-length;
  ctx.fillStyle='#261a39';ctx.fillRect(x-2,y-3,length+4,7);
  ctx.fillStyle='#bd90ff';ctx.fillRect(x,y-2,length,4);
  ctx.fillStyle='#f4e6ff';ctx.fillRect(x+length-7,y-1,7,2);
 }
 ctx.restore();
}
function chevrons(x,y,h){ctx.strokeStyle='#f4efe1';ctx.lineWidth=4;for(let yy=y+12;yy<y+h;yy+=32){ctx.beginPath();ctx.moveTo(x-8,yy-8);ctx.lineTo(x+3,yy);ctx.lineTo(x-8,yy+8);ctx.stroke();}}
function drawTrialsBackdrop(phaseTwo){
 const gradient=ctx.createLinearGradient(0,0,0,720);
 gradient.addColorStop(0,'#172d3e');gradient.addColorStop(1,world.stage.color||'#293e47');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,1280,720);
 if(world.stage.phases[Number(phaseTwo)].naval)ArcadeSpeedboat.drawOcean(ctx,img,world.phaseElapsed*40,phaseTwo);
}
function render(){if(!world){ctx.fillStyle='#122431';ctx.fillRect(0,0,1280,720);text('MACHINE TRIALS',640,350,48,'#ffcf7b','center');return;}const w=world,p=w.player,ph=w.phase,jet=w.stage.number===7;
const cinema=w.state==='transition'?trialTransition?.position(w)??null:null;
if(cinema!==null)incomingWorld??=new Arcade.World(w.stage,{phase:1,seed:w.seed,practice:w.practice});
else incomingWorld=null;
transitions?.setTrial(w,cinema,incomingWorld);
const blend=w.state==='transition'&&ph.naval?(cinema===null?w.transitionTick/89:globalThis.ArcadeBossTransitions.progress(cinema)):null;
ArcadePhaseBackground.draw(ctx,w.phaseIndex===1,blend,drawTrialsBackdrop);
ctx.save();ctx.translate(-w.camera.x,-w.camera.y);ctx.textAlign='left';
if(!ph.naval)for(const pl of w.platforms){if(pl.removed||pl.active===false)continue;ctx.fillStyle='#263c49';ctx.fillRect(pl.x,pl.y,pl.w,pl.h||20);ctx.fillStyle='#81b5ba';ctx.fillRect(pl.x,pl.y,pl.w,4);}
if(ph.naval){
 const box=ArcadeBossSheets.machineBox(w);
 ArcadeSpeedboat.drawBossWake(ctx,img,w,w.tick,box.x+box.w*.65,box.y+box.h-ArcadeBossSheets.marinaWaterlineDepth(w.phaseIndex,box.w));
}
ph.draw?.(ctx,w);
const machineSheet=!!globalThis.ArcadeBossSheets?.phaseImage(w.stage.id,w.phaseIndex);
const redkevArtBox=w.stage.number===13?globalThis.ArcadeBossSheets?.machineBox(w):null,redkevArtBounds=w.stage.number===13?globalThis.ArcadeBossSheets?.entry(13)?.phases[w.phaseIndex]?.bounds:null;
for(const t of w.targets){if(t.removed||t.hp<=0)continue;const bounds=w.collisionBounds?.('targets',t.id,t)||t;ctx.strokeStyle=t.open===false?'#9ca5ad':'#ffdc8a';ctx.lineWidth=3;ctx.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h);if(t.maxHp){ctx.fillStyle='#ffdc8a';const healthY=redkevArtBox&&redkevArtBounds&&t.id==='marina-vent'?redkevArtBox.y+redkevArtBox.h-Math.round(redkevArtBounds[3]*Math.min(redkevArtBox.w/redkevArtBounds[2],redkevArtBox.h/redkevArtBounds[3]))-12:bounds.y-8;ctx.fillRect(bounds.x,healthY,bounds.w*Math.max(0,t.hp/t.maxHp),4);}if(!ph.drawsTargetLabels)text(t.label||t.id,t.x+t.w/2,t.y-16,14,t.open===false?'#a4b0b6':'#ffdd87','center');}
for(const h of w.hazards){
 if(h.removed||(w.densityBarrage&&!h.density))continue;
 const warning=h.age<(h.windup||0),recovery=h.age>=(h.windup||0)+(h.active||1);
 if(recovery)continue;
 const moving=Math.hypot(h.vx||0,h.vy||0)>0,bounds=w.collisionBounds?.('projectiles',[h.source,h.sprite],h)||h;
 const style=h.sprite||(h.rule==='ordinary'&&moving&&h.w<=128&&h.h<=128?'bolt':null);
 ctx.save();ctx.globalAlpha=warning ? (h.missile ? 0.65 : 0.35) : 0.95;
 let themed=false;
 if(!/^carrier-debris-/.test(h.source||'')){ctx.save();ctx.translate(h.x+h.w/2,h.y+h.h/2);ctx.scale((h.vx||1)<0?-1:1,1);themed=globalThis.ArcadeBossSheets?.drawProjectile(ctx,w.stage.id,h,{x:-h.w/2,y:-h.h/2,w:h.w,h:h.h},w);ctx.restore();}
 if(themed){/* The collision rectangle and warning overlay below remain authoritative. */}
 else if(style&&h.rule==='ordinary'){
  const asset=Arcade.projectileAssets?.[style],picture=img(asset?.path||'art/gameplay/projectiles/'+style+'.svg');
  if(picture){if(asset?.pixelArt)ctx.imageSmoothingEnabled=false;ctx.translate(h.x+h.w/2,h.y+h.h/2);ctx.scale((h.vx||1)<0?-1:1,1);if(asset?.crop)ctx.drawImage(picture,...asset.crop,-h.w/2,-h.h/2,h.w,h.h);else ctx.drawImage(picture,-h.w/2,-h.h/2,h.w,h.h);}
  else{ctx.fillStyle=h.pressure?'#a3e8d6':'#ffb482';ctx.fillRect(h.x,h.y,h.w,h.h);}
 }else{ctx.fillStyle=h.rule==='dash'?'#d488fe':h.rule==='shield'?'#79e4e2':'#ff977a';ctx.fillRect(h.x,h.y,h.w,h.h);}
 ctx.restore();ctx.strokeStyle=warning?'#f6ddb5':h.pressure?'#b9f3df':'#fff0d5';ctx.lineWidth=warning?2:1;ctx.setLineDash(warning?[7,7]:[]);ctx.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h);ctx.setLineDash([]);
 if(warning&&moving&&h.rule==='ordinary'){
  const n=Math.hypot(h.vx,h.vy)||1,dx=h.vx/n,dy=h.vy/n,cx=bounds.x+bounds.w/2,cy=bounds.y+bounds.h/2;
  ctx.strokeStyle='#fff3c6';ctx.lineWidth=2;ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+dx*100,cy+dy*100);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(cx+dx*88-dy*7,cy+dy*88+dx*7);ctx.lineTo(cx+dx*100,cy+dy*100);ctx.lineTo(cx+dx*88+dy*7,cy+dy*88-dx*7);ctx.stroke();
 }
 if(warning&&h.missile)text('SLOW MISSILE',h.x+h.w/2,h.y-10,12,'#fff2bc','center');
 if(h.rule==='dash')chevrons(h.x+h.w/2,h.y,h.h);if(h.rule==='shield')text('◇ X',h.x+h.w/2,h.y+30,24,'#e1fffb','center');
}
if(jet)drawTrialsJet(w,p);
for(const s of w.densityBarrage?[]:w.shots){if(s.removed)continue;
 const jetSpecial=jet&&(s.type==='beam'||s.type==='mine'&&s.id.startsWith('ball-'));
 const age=Math.max(0,w.tick-(s.born??(jetSpecial?Number(s.id.split('-')[1]):0)));
 const kind=jetSpecial?(s.type==='beam'?'jetMissile':'jetHeavy'):s.type??(ph.mode==='flight'&&!ph.naval?'greenLaser':'spark');
 const useBoatAtlas=kind==='boatTorpedo'||kind==='waterMine';
 ArcadePlayerProjectiles.drawShot(ctx,kind,s.x+(s.w||12)/2,s.y+(s.h||6)/2,s.vx||0,s.vy||0,age,
   useBoatAtlas?()=>ArcadeSpeedboat.drawShot(ctx,img,kind,age):null);
}
for(const pick of w.pickups){if(pick.removed)continue;ctx.fillStyle='#7ae7ce';ctx.beginPath();ctx.arc(pick.x,pick.y,17,0,Math.PI*2);ctx.fill();text(keyLabel('F'),pick.x,pick.y+6,16,'#183e44','center');text(pick.weapon,pick.x,pick.y-24,14,'#b6fff2','center');}
for(const e of w.effects){
 if(e.type==='decoy'){ctx.globalAlpha=.5;sprite(pilot,e.x,e.y+26);ctx.globalAlpha=1;}
 else if(e.type==='blast')ArcadePlayerProjectiles.drawBlast(ctx,e.x,e.y,e.radius||90,20-e.ttl,20,false,jet?'jetHeavy':null);
 else if(e.type==='navalSplash')ArcadePlayerProjectiles.drawSplash(ctx,e.x,e.y,16-e.ttl,16);
 else if(e.type==='projectileImpact')ArcadePlayerProjectiles.drawImpact(ctx,jet&&e.kind==='beam'?'jetMissile':e.kind,e.x,e.y,14-e.ttl,14);
}
if(!ph.drawsPilot&&!machineSheet){const pp=(typeof ph.pilot==='function'?ph.pilot(w):ph.pilot)||{x:w.camera.x+1120,y:w.camera.y+235};sprite(w.stage.operatorSprite||'rivet',pp.x,pp.y,pp.height||pp.scale||ph.pilotHeight||82);text(w.stage.operator,pp.x,pp.y-90,14,'#f6e2bb','center');}
if(ph.naval){
 const {light,heavy}=NAVAL_WEAPONS;
 if(!p.inv||w.tick%8<5)ArcadeSpeedboat.drawBoat(ctx,img,{...p,id:pilot,y:p.y-26},w.tick,
   p.beamWait&&!w.densityBarrage?light.cooldown-p.beamWait:Infinity,
   p.bombWait&&!w.densityBarrage?heavy.cooldown-p.bombWait:Infinity);
}else if(!jet){
 if(ph.mode==='flight'||ph.mode==='orbit'){ctx.fillStyle='#91aeb5';ctx.beginPath();ctx.ellipse(p.x,p.y-15,48,17,0,0,Math.PI*2);ctx.fill();sprite(pilot,p.x,p.y-20,48);}
 else sprite(pilot,p.x,p.y,76,p.dash?6:w.crouching?10:!p.grounded?8:0,p.facing);
}
const pickupShieldDiameter=w.stage.number===7||ph.naval?220:140;
globalThis.ArcadeBossSheets?.drawPhasePowerups(ctx,w.phasePowerups,w.phaseElapsed,{x:p.x-pickupShieldDiameter/2,y:p.y-28-pickupShieldDiameter/2,w:pickupShieldDiameter,h:pickupShieldDiameter});
if(p.dash)drawTrialDash(p,ph.naval||ph.mode==='flight'||ph.mode==='orbit');
if(p.shield){ctx.strokeStyle='#83f9df';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y-28,47,0,Math.PI*2);ctx.stroke();}
if(w.state!=='transition')globalThis.ArcadeBossSheets?.drawProjectileHits?.(ctx,w,w.tick);
ctx.restore();
ctx.fillStyle='#09131ee8';ctx.fillRect(0,0,1280,115);text(w.stage.title,24,32,23);text(`${w.checkpointRetry?'PHASE CHECKPOINT':w.practice?'PRACTICE':'FULL RUN'} · ${ph.name} · ${ph.machine||''}`,24,57,14,'#9fbdc8');text(w.objective||ph.objective,24,85,18,'#ffe3a4');text('♥'.repeat(Math.max(0,p.hp)),1255,32,23,'#ffce7a','right');text(p.dashWait?'DASH '+(p.dashWait/60).toFixed(1)+'s':'DASH READY  »',1255,57,16,p.dashWait?'#aebcc6':'#d1b5ff','right');const slot=w.weapons?.snapshot();text(slot?`${slot.weapon} · ${slot.charges} charges · ${keyLabel('F')}`:'PICKUP SLOT EMPTY',1255,83,14,'#a1ead5','right');ctx.fillStyle='#49616a';ctx.fillRect(24,100,1232,4);ctx.fillStyle='#ffd98a';ctx.fillRect(24,100,1232*Arcade.clamp(w.progress||0,0,1),4);
if(w.cueText&&!w.densityBarrage){ctx.fillStyle='#101b2be8';ctx.fillRect(180,125,920,45);text(w.cueText,640,155,18,'#fff3d5','center');if(soundTick!==w.tick&&w.cueText!==render.lastCue){tone(580);soundTick=w.tick;}render.lastCue=w.cueText;}
ctx.fillStyle='#0b1824db';ctx.fillRect(0,680,1280,40);text(`${ph.hudLabel||'PROGRESS'} · ${Math.round((w.progress||0)*100)}%`,24,706,14,'#d2e1df');text(`${keyLabel('X')} SHIELD ${p.shieldWait?(p.shieldWait/60).toFixed(1)+'s':'READY'}   ${keyLabel('C')}${jet?' MISSILE':''} ${p.beamWait?(p.beamWait/60).toFixed(1)+'s':'READY'}   ${keyLabel('V')}${jet?' HEAVY':''} ${p.bombWait?(p.bombWait/60).toFixed(1)+'s':'READY'}`,1255,706,14,'#a4d9db','right');
if(w.state==='transition'){
 const next=w.stage.phases[1];
 ctx.fillStyle='#09131ee8';ctx.fillRect(280,127,720,63);
 text(next.machine,640,151,20,'#ffdf95','center');
 text(next.objective,640,176,16,'#d8ebea','center');
}
}
// Each frame runs inside the crash guard (runtime/crash-guard.js) and the next frame is always scheduled: a throw ends the frame (no more fixed steps on a half-applied state) and drops the step backlog; a streak of failing frames halts behind a "Something broke" panel.
function loop(now){try{if(globalThis.ArcadeCrash)ArcadeCrash.runFrame(trialsFrame,now,()=>{acc=0;});else trialsFrame(now);}finally{requestAnimationFrame(loop);}}
// One rendered frame. Returns false when a run is active but no fixed step fell due (proves nothing).
function stepTrials(inputFrame){
 if(trialTransition?.step(world,world.stage.id,world.state==='transition'?90-world.transitionTick:0)===false)return;
 const tick=world.tick;
 world.step(inputFrame);
 if(world.tick!==tick)globalThis.ArcadeBossSheets?.projectileHitsTrial?.(world);
}
function trialsFrame(now){const dt=Math.min(250,now-last||0);last=now;acc+=dt;let steps=0;const running=!!(world&&!paused);if(running){while(acc>=1000/60){const i=input();if(i.retry){trialTransition?.reset();incomingWorld=null;world.restart();visibleState='';soundTick=-1;render.lastCue='';$('curtain').hidden=true;held.clear();}else stepTrials(i);acc-=1000/60;steps++;}if(world.state!==visibleState){visibleState=world.state;if(world.state==='lost')overlay('Try the next opening',`Cause: ${world.failure||'Unknown hazard'}. Press R or retry. Phase ${world.phaseIndex+1} restarts with the standard kit.`,'Retry');if(world.state==='clear'){const key=recordKey(world),r=readRecords();r[key]=Math.min(r[key]||Infinity,world.tick);try{localStorage.setItem('arcade-v1-records',JSON.stringify(r));}catch{}records();overlay('Encounter cleared',`${world.stage.operator}'s machine is down. ${world.checkpointRetry?'Phase checkpoint result':world.practice?'Practice result':'Full-run result'} · ${(world.tick/60).toFixed(1)} seconds.`,'Play again');}}$('status').textContent=`${world.state.toUpperCase()} · Seed ${world.seed??$('seed').value} · Tick ${world.tick} · ${world.failure?'Last hit: '+world.failure:'Read the cue, then commit.'}`;}else{acc=0;press.clear();}render();return !running||steps>0;}
$('status').textContent=`${stages.length} encounters registered · Offline classic scripts`;const query=new URLSearchParams(location.search);if(Arcade.stages.has(query.get('stage')))$('stage').value=query.get('stage');refreshEntries();if(query.get('phase')==='1')$('entry').value='1';records();requestAnimationFrame(loop);globalThis.ArcadeCrash?.markStarted();
// Public read-only-in-spirit diagnostics for reproducible QA; no forced completion UI.
// Main menu (menus.js): leave the run and show the first curtain with the setup again.
const menuCurtain={result:$('result').textContent,message:$('message').textContent,button:$('resume').textContent};
function mainMenu(){startRequest++;world=null;paused=false;held.clear();press.clear();acc=0;visibleState='';soundTick=-1;render.lastCue='';$('start').disabled=false;$('start').textContent=startLabel;$('next').hidden=true;const fb=$('feedback-open');if(fb)fb.hidden=true;
 $('result').textContent=menuCurtain.result;$('message').textContent=menuCurtain.message;$('resume').textContent=menuCurtain.button;$('curtain').dataset.mode='menu';$('curtain').hidden=false;$('status').textContent=`${stages.length} encounters registered · Offline classic scripts`;records();render();}
globalThis.ArcadeApp={get world(){return world;},start,render,mainMenu,get paused(){return paused;},get dashKey(){return dashKeyCode();},get remapping(){return Boolean(controls()?.capturing);},
 // In-game feedback window (feedback-link.js): stop the simulation without the Paused curtain. feedbackPause returns whether the run was already paused; feedbackResume(before) restarts it only if this pause stopped it.
 feedbackPause(){const before=paused;paused=true;held.clear();press.clear();return before;},
 feedbackResume(before){held.clear();press.clear();if(before===false)paused=false;}};
})();
