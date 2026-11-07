/* Shared offline browser adapter. All gameplay modules run at fixed 60 Hz. */
(function(){
'use strict';
const $=id=>document.getElementById(id),canvas=$('arena'),ctx=canvas.getContext('2d'),held=new Set(),press=new Set();
const images=new Map(),stages=[...Arcade.stages.values()].filter(s=>typeof s.enabled==='function'?s.enabled():s.enabled!==false).sort((a,b)=>(a.order??a.number)-(b.order??b.number));
let world=null,paused=false,remapping=false,dashKey='ShiftLeft',last=0,acc=0,visibleState='',pilot='rivet',soundTick=-1,pickupAttempt=0;
const nativeFillText=ctx.fillText.bind(ctx);ctx.fillText=(value,...args)=>nativeFillText(String(value).replace(/\bSHIFT\b/gi,dashKey.replace(/^Key/,'').replace(/^Shift(Left|Right)$/,'Shift')),...args);
let audio;function tone(hz=420){try{audio??=new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),v=audio.createGain();o.connect(v);v.connect(audio.destination);v.gain.setValueAtTime(.025,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.frequency.value=hz;o.start();o.stop(audio.currentTime+.12);}catch{}}
function img(path){if(!path)return null;if(!images.has(path)){const i=new Image();i.src=path;images.set(path,i);}const i=images.get(path);return i.complete&&i.naturalWidth?i:null;}
const pilots=[['rivet','Golden Sproto'],['sproto3106','Sproto Sheriff'],['sproto3152','Pissing Sproto'],['morelight','Morelight'],['sproto763','rog'],['sproto831','The Villain'],['sproto943','Artchick'],['sproto1477','Stalker'],['sproto1668','Goldie'],['sproto1815','Jessica'],['sproto2101','The Jay'],['sproto2177','Spronic'],['sproto2569','Clownie'],['sproto2884','Sprite']];
for(const [order,s] of stages.entries())$('stage').add(new Option(String(order+1).padStart(2,'0')+' · '+s.title,s.id));
for(const [id,name] of pilots)$('pilot').add(new Option(name,id));
function readRecords(){try{return JSON.parse(localStorage.getItem('arcade-v1-records')||'{}');}catch{return {};}}
function recordKey(w){return w.stage.id+':'+(w.checkpointRetry?'checkpoint:phase1':w.practice?`practice:phase${w.options.phase}:sector${w.options.sector}`:'full');}
function records(){const r=readRecords(),id=$('stage').value,o=$('entry').selectedOptions[0],phase=Number(o?.dataset.phase??o?.value)||0,sector=Number(o?.dataset.sector)||0;const f=r[id+':full'],p=r[id+`:practice:phase${phase}:sector${sector}`];$('records').textContent=`Best full run: ${f?(f/60).toFixed(1)+'s':'—'} · Best selected practice: ${p?(p/60).toFixed(1)+'s':'—'}`;}
function refreshEntries(){const s=Arcade.stages.get($('stage').value);$('entry').replaceChildren(new Option('Full run · Phase 1','0'),new Option('Practice · Phase 2','1'));for(const sec of s?.practiceSectors||[]){const o=new Option('Practice · '+sec.label,'sector-'+sec.id);o.dataset.phase=sec.phase??0;o.dataset.sector=sec.id;$('entry').add(o);}records();}
function startNow(){const s=Arcade.stages.get($('stage').value);if(!s)return;pilot=$('pilot').value;world=new Arcade.World(s,{pickupAttempt:pickupAttempt++,seed:Number($('seed').value)||777,phase:Number($('entry').selectedOptions[0].dataset.phase??$('entry').value)||0,sector:Number($('entry').selectedOptions[0].dataset.sector)||0,practice:$('entry').value!=='0'});paused=false;held.clear();press.clear();acc=0;visibleState='';soundTick=-1;render.lastCue='';$('curtain').hidden=true;$('next').hidden=true;records();tone();}
let startRequest=0;const startLabel=$('start').textContent;
function start(){
 const id=$('stage').value,art=globalThis.ArcadeBossSheets,ticket=++startRequest;
 if(!Arcade.stages.has(id))return;
 const adapterReady=typeof art?.stageReady==='function'&&typeof art?.preloadStage==='function';
 if(!adapterReady&&typeof SPRITE_HITBOXES!=='undefined'&&SPRITE_HITBOXES.enabled){paused=true;$('start').disabled=false;$('start').textContent='Reload game';$('start').onclick=()=>location.reload();$('status').textContent='Boss art could not load. Reload the game before starting.';return;}
 if(!adapterReady||art.stageReady(id)){ $('start').disabled=false;$('start').textContent=startLabel;return startNow(); }
 paused=true;$('start').disabled=true;$('start').textContent='Loading…';$('status').textContent='Loading boss art…';
 return art.preloadStage(id).then(()=>{
  if(ticket!==startRequest)return;
  $('start').disabled=false;$('start').textContent=startLabel;
  if($('stage').value===id)return startNow();
  $('status').textContent='Choose Start to load the selected encounter.';
 },()=>{if(ticket!==startRequest)return;$('start').disabled=false;$('start').textContent='Retry art loading';$('status').textContent='Boss art could not load. Retry to start the encounter.';});
}
$('next').onclick=()=>{const n=stages.findIndex(s=>s.id===world.stage.id)+1;if(stages[n]){$('stage').value=stages[n].id;refreshEntries();start();}};
function overlay(title,message,button){$('next').hidden=!(world?.state==='clear'&&!world.practice&&stages.findIndex(s=>s.id===world.stage.id)<stages.length-1);$('result').textContent=title;$('message').textContent=message;$('resume').textContent=button;$('curtain').hidden=false;}
$('entry').onchange=records;$('start').onclick=start;$('stage').onchange=()=>{startRequest++;$('start').disabled=false;$('start').textContent=startLabel;refreshEntries();};$('resume').onclick=()=>{if(paused){paused=false;held.clear();press.clear();$('curtain').hidden=true;}else if(world?.state==='lost'){world.restart();visibleState='';soundTick=-1;render.lastCue='';$('curtain').hidden=true;held.clear();press.clear();acc=0;}else start();};
$('dash-key').onclick=()=>{remapping=true;$('dash-key').textContent='Press a key for dash…';};
const actions={jump:['Space'],shield:['KeyX'],power:['KeyF'],replace:['KeyE'],retry:['KeyR'],beam:['KeyC'],bomb:['KeyV']};
window.addEventListener('keydown',e=>{if(/INPUT|SELECT/.test(e.target.tagName))return;if(remapping){if(['Space','KeyX','KeyF','KeyE','KeyR','KeyC','KeyV','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){$('dash-key').textContent='Reserved key · choose another';return;}dashKey=e.code;remapping=false;$('dash-key').textContent=e.key+' · Dash (remap)';e.preventDefault();return;}if(e.code==='Escape'&&!e.repeat&&['playing','transition'].includes(world?.state)){paused=!paused;held.clear();press.clear();if(paused)overlay('Paused','Take a breath. The simulation is stopped.','Resume');else $('curtain').hidden=true;e.preventDefault();return;}if(!held.has(e.code))press.add(e.code);held.add(e.code);if(['Space',...Object.keys(actions).flatMap(k=>actions[k]),'ArrowLeft','ArrowRight','ArrowUp','ArrowDown',dashKey,'ShiftRight'].includes(e.code))e.preventDefault();});
window.addEventListener('keyup',e=>held.delete(e.code));window.addEventListener('blur',()=>{held.clear();press.clear();if(['playing','transition'].includes(world?.state)&&!paused){paused=true;overlay('Paused','The game paused when this window lost focus.','Resume');}});
function input(){const i={left:held.has('ArrowLeft')||held.has('KeyA'),right:held.has('ArrowRight')||held.has('KeyD'),up:held.has('ArrowUp')||held.has('KeyW'),down:held.has('ArrowDown')||held.has('KeyS'),dash:press.has(dashKey)||(dashKey==='ShiftLeft'&&press.has('ShiftRight'))};for(const [a,codes]of Object.entries(actions))i[a]=codes.some(c=>press.has(c));press.clear();return i;}
function text(s,x,y,size=18,color='#fff1d0',align='left'){ctx.font=`700 ${size}px system-ui`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(String(s),x,y);}
function sprite(id,x,y,height=76,pose=0,facing=1){const a=ART.sprites[id],p=a?.poses?.[pose]||a?.poses?.[0],i=img(p?.[0]);if(i){const b=Arcade.spriteBounds?.[p[0]]||[0,0,i.naturalWidth,i.naturalHeight],w=height*b[2]/b[3];ctx.save();ctx.translate(x,y);ctx.imageSmoothingEnabled=false;ctx.scale(facing<0?-1:1,1);ctx.drawImage(i,b[0],b[1],b[2],b[3],-w/2,-height,w,height);ctx.restore();}else{ctx.fillStyle='#ffdb8a';ctx.fillRect(x-13,y-height,26,height);}}
function moonkeepSaucer(p,tick){
 const rear=img('art/attacks/player/higgsfield/saucer/cockpit-rear.png'),front=img('art/attacks/player/higgsfield/saucer/cockpit-front.png');
 if(!rear||!front)return false;
 const x=Math.round(p.x-rear.naturalWidth/2),y=Math.round(p.y-28-rear.naturalHeight/2),a=ART.sprites[pilot],pose=a?.poses?.[Math.floor(tick/23)%2]||a?.poses?.[0],portrait=img(pose?.[0]);
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(rear,x,y);
 if(portrait){const [,ax,ay]=pose,[sx,sy,sw,sh]=a.cockpitCrop||[ax-36,ay-128,88,83],scale=Math.min(53/sw,43/sh),w=Math.round(sw*scale),h=Math.round(sh*scale);ctx.drawImage(portrait,sx,sy,sw,sh,x+Math.round(100-w/2),y+55-h,w,h);}
 ctx.drawImage(front,x,y);ctx.restore();return true;
}
function chevrons(x,y,h){ctx.strokeStyle='#f4efe1';ctx.lineWidth=4;for(let yy=y+12;yy<y+h;yy+=32){ctx.beginPath();ctx.moveTo(x-8,yy-8);ctx.lineTo(x+3,yy);ctx.lineTo(x-8,yy+8);ctx.stroke();}}
function render(){ctx.fillStyle='#122431';ctx.fillRect(0,0,1280,720);if(!world){text('MACHINE TRIALS',640,350,48,'#ffcf7b','center');return;}const w=world,p=w.player,ph=w.phase;
const gradient=ctx.createLinearGradient(0,0,0,720);gradient.addColorStop(0,'#172d3e');gradient.addColorStop(1,w.stage.color||'#293e47');ctx.fillStyle=gradient;ctx.fillRect(0,0,1280,720);
ctx.save();ctx.translate(-w.camera.x,-w.camera.y);ctx.textAlign='left';
for(const pl of w.platforms){if(pl.removed||pl.active===false)continue;ctx.fillStyle='#263c49';ctx.fillRect(pl.x,pl.y,pl.w,pl.h||20);ctx.fillStyle='#81b5ba';ctx.fillRect(pl.x,pl.y,pl.w,4);}
ph.draw?.(ctx,w);
if(w.data.densityLane){const lane=w.data.densityLane;ctx.save();ctx.fillStyle='#72ffb00d';ctx.fillRect(lane.x,lane.top,lane.width,lane.bottom-lane.top);ctx.strokeStyle='#9bffc4';ctx.lineWidth=2;ctx.setLineDash([10,12]);ctx.strokeRect(lane.x,lane.top,lane.width,lane.bottom-lane.top);ctx.restore();text('SAFE LANE',lane.x+18,lane.top+24,14,'#baffd7');}
const machineSheet=!!globalThis.ArcadeBossSheets?.phaseImage(w.stage.id,w.phaseIndex);
const redkevArtBox=w.stage.number===13?globalThis.ArcadeBossSheets?.machineBox(w):null,redkevArtBounds=w.stage.number===13?globalThis.ArcadeBossSheets?.entry(13)?.phases[w.phaseIndex]?.bounds:null;
for(const t of w.targets){if(t.removed||t.hp<=0)continue;const bounds=w.collisionBounds?.('targets',t.id,t)||t;ctx.strokeStyle=t.open===false?'#9ca5ad':'#ffdc8a';ctx.lineWidth=3;ctx.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h);if(t.maxHp){ctx.fillStyle='#ffdc8a';const healthY=redkevArtBox&&redkevArtBounds&&t.id==='marina-vent'?redkevArtBox.y+redkevArtBox.h-Math.round(redkevArtBounds[3]*Math.min(redkevArtBox.w/redkevArtBounds[2],redkevArtBox.h/redkevArtBounds[3]))-12:bounds.y-8;ctx.fillRect(bounds.x,healthY,bounds.w*Math.max(0,t.hp/t.maxHp),4);}if(!ph.drawsTargetLabels)text(t.label||t.id,t.x+t.w/2,t.y-16,14,t.open===false?'#a4b0b6':'#ffdd87','center');}
for(const h of w.hazards){
 if(h.removed)continue;
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
for(const s of w.shots){if(s.removed)continue;ctx.fillStyle=s.type==='mine'?'#9af0ad':'#ffe9a3';ctx.fillRect(s.x,s.y,s.w||12,s.h||6);}
for(const pick of w.pickups){if(pick.removed)continue;ctx.fillStyle='#7ae7ce';ctx.beginPath();ctx.arc(pick.x,pick.y,17,0,Math.PI*2);ctx.fill();text('F',pick.x,pick.y+6,16,'#183e44','center');text(pick.weapon,pick.x,pick.y-24,14,'#b6fff2','center');}
for(const e of w.effects){if(e.type==='decoy'){ctx.globalAlpha=.5;sprite(pilot,e.x,e.y+26);ctx.globalAlpha=1;}else if(e.type==='blast'){ctx.strokeStyle='#bcffa3';ctx.beginPath();ctx.arc(e.x,e.y,e.radius||90,0,Math.PI*2);ctx.stroke();}}
if(!ph.drawsPilot&&!machineSheet){const pp=(typeof ph.pilot==='function'?ph.pilot(w):ph.pilot)||{x:w.camera.x+1120,y:w.camera.y+235};sprite(w.stage.operatorSprite||'rivet',pp.x,pp.y,pp.height||pp.scale||ph.pilotHeight||82);text(w.stage.operator,pp.x,pp.y-90,14,'#f6e2bb','center');}
if(ph.mode==='flight'||ph.mode==='orbit'){if(w.stage.number!==7||!moonkeepSaucer(p,w.tick)){ctx.fillStyle='#91aeb5';ctx.beginPath();ctx.ellipse(p.x,p.y-15,48,17,0,0,Math.PI*2);ctx.fill();sprite(pilot,p.x,p.y-20,48);}}else sprite(pilot,p.x,p.y,76,p.dash?6:!p.grounded?8:0,p.facing);
const pickupShieldDiameter=w.stage.number===7?220:140;
globalThis.ArcadeBossSheets?.drawPhasePowerups(ctx,w.phasePowerups,w.phaseTick,{x:p.x-pickupShieldDiameter/2,y:p.y-28-pickupShieldDiameter/2,w:pickupShieldDiameter,h:pickupShieldDiameter});
if(p.dash){ctx.strokeStyle='#eed9ff';ctx.lineWidth=4;ctx.strokeRect(p.x-22,p.y-57,44,62);}if(p.shield){ctx.strokeStyle='#83f9df';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y-28,47,0,Math.PI*2);ctx.stroke();}ctx.restore();
ctx.fillStyle='#09131ee8';ctx.fillRect(0,0,1280,115);text(w.stage.title,24,32,23);text(`${w.checkpointRetry?'PHASE CHECKPOINT':w.practice?'PRACTICE':'FULL RUN'} · ${ph.name} · ${ph.machine||''}`,24,57,14,'#9fbdc8');text(w.objective||ph.objective,24,85,18,'#ffe3a4');text('♥'.repeat(Math.max(0,p.hp)),1255,32,23,'#ffce7a','right');text(p.dashWait?'DASH '+(p.dashWait/60).toFixed(1)+'s':'DASH READY  »',1255,57,16,p.dashWait?'#aebcc6':'#d1b5ff','right');const slot=w.weapons?.snapshot();text(slot?`${slot.weapon} · ${slot.charges} charges · F`:'PICKUP SLOT EMPTY',1255,83,14,'#a1ead5','right');ctx.fillStyle='#49616a';ctx.fillRect(24,100,1232,4);ctx.fillStyle='#ffd98a';ctx.fillRect(24,100,1232*Arcade.clamp(w.progress||0,0,1),4);
if(w.cueText){ctx.fillStyle='#101b2be8';ctx.fillRect(180,125,920,45);text(w.cueText,640,155,18,'#fff3d5','center');if(soundTick!==w.tick&&w.cueText!==render.lastCue){tone(580);soundTick=w.tick;}render.lastCue=w.cueText;}
ctx.fillStyle='#0b1824db';ctx.fillRect(0,680,1280,40);text(`${ph.hudLabel||'PROGRESS'} · ${Math.round((w.progress||0)*100)}%`,24,706,14,'#d2e1df');text(`X SHIELD ${p.shieldWait?(p.shieldWait/60).toFixed(1)+'s':'READY'}   C ${p.beamWait?(p.beamWait/60).toFixed(1)+'s':'READY'}   V ${p.bombWait?(p.bombWait/60).toFixed(1)+'s':'READY'}`,1255,706,14,'#a4d9db','right');
if(w.state==='transition'){ctx.fillStyle='#09131ee0';ctx.fillRect(0,0,1280,720);text('MACHINE TRANSFORMATION',640,320,32,'#ffdf95','center');text(w.stage.phases[1].machine,640,365,24,'#d8ebea','center');text('New task: '+w.stage.phases[1].objective,640,410,18,'#d8ebea','center');}
}
function loop(now){const dt=Math.min(250,now-last||0);last=now;acc+=dt;if(world&&!paused){while(acc>=1000/60){const i=input();if(i.retry){world.restart();visibleState='';soundTick=-1;render.lastCue='';$('curtain').hidden=true;held.clear();}else world.step(i);acc-=1000/60;}if(world.state!==visibleState){visibleState=world.state;if(world.state==='lost')overlay('Try the next opening',`Cause: ${world.failure||'Unknown hazard'}. Press R or retry. Phase ${world.phaseIndex+1} restarts with the standard kit.`,'Retry');if(world.state==='clear'){const key=recordKey(world),r=readRecords();r[key]=Math.min(r[key]||Infinity,world.tick);try{localStorage.setItem('arcade-v1-records',JSON.stringify(r));}catch{}records();overlay('Encounter cleared',`${world.stage.operator}'s machine is down. ${world.checkpointRetry?'Phase checkpoint result':world.practice?'Practice result':'Full-run result'} · ${(world.tick/60).toFixed(1)} seconds.`,'Play again');}}$('status').textContent=`${world.state.toUpperCase()} · Seed ${world.seed??$('seed').value} · Tick ${world.tick} · ${world.failure?'Last hit: '+world.failure:'Read the cue, then commit.'}`;}else{acc=0;press.clear();}render();requestAnimationFrame(loop);}
$('status').textContent=`${stages.length} encounters registered · Offline classic scripts`;const query=new URLSearchParams(location.search);if(Arcade.stages.has(query.get('stage')))$('stage').value=query.get('stage');refreshEntries();if(query.get('phase')==='1')$('entry').value='1';records();requestAnimationFrame(loop);
// Public read-only-in-spirit diagnostics for reproducible QA; no forced completion UI.
globalThis.ArcadeApp={get world(){return world;},start,render,get paused(){return paused;}};
})();
