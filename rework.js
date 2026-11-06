/* Shared offline browser adapter. All gameplay modules run at fixed 60 Hz. */
(function(){
'use strict';
const $=id=>document.getElementById(id),canvas=$('arena'),ctx=canvas.getContext('2d'),held=new Set(),press=new Set();
const images=new Map(),stages=[...Arcade.stages.values()].sort((a,b)=>a.number-b.number);
let world=null,paused=false,remapping=false,dashKey='ShiftLeft',last=0,acc=0,visibleState='',pilot='rivet',soundTick=-1;
const nativeFillText=ctx.fillText.bind(ctx);ctx.fillText=(value,...args)=>nativeFillText(String(value).replace(/\bSHIFT\b/gi,dashKey.replace(/^Key/,'').replace(/^Shift(Left|Right)$/,'Shift')),...args);
let audio;function tone(hz=420){try{audio??=new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),v=audio.createGain();o.connect(v);v.connect(audio.destination);v.gain.setValueAtTime(.025,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.frequency.value=hz;o.start();o.stop(audio.currentTime+.12);}catch{}}
function img(path){if(!path)return null;if(!images.has(path)){const i=new Image();i.src=path;images.set(path,i);}const i=images.get(path);return i.complete&&i.naturalWidth?i:null;}
const pilots=[['rivet','Golden Sproto'],['sproto3106','Sproto Sheriff'],['sproto3152','Pissing Sproto'],['morelight','Morelight'],['sproto763','rog'],['sproto831','The Villain'],['sproto943','Artchick'],['sproto1477','Stalker'],['sproto1668','Goldie'],['sproto1815','Jessica'],['sproto2101','The Jay'],['sproto2177','Spronic'],['sproto2569','Clownie'],['sproto2884','Sprite']];
for(const s of stages)$('stage').add(new Option(String(s.number).padStart(2,'0')+' · '+s.title,s.id));
for(const [id,name] of pilots)$('pilot').add(new Option(name,id));
function readRecords(){try{return JSON.parse(localStorage.getItem('arcade-v1-records')||'{}');}catch{return {};}}
function recordKey(w){return w.stage.id+':'+(w.practice?`practice:phase${w.options.phase}:sector${w.options.sector}`:'full');}
function records(){const r=readRecords(),id=$('stage').value,o=$('entry').selectedOptions[0],phase=Number(o?.dataset.phase??o?.value)||0,sector=Number(o?.dataset.sector)||0;const f=r[id+':full'],p=r[id+`:practice:phase${phase}:sector${sector}`];$('records').textContent=`Best full run: ${f?(f/60).toFixed(1)+'s':'—'} · Best selected practice: ${p?(p/60).toFixed(1)+'s':'—'}`;}
function refreshEntries(){const s=Arcade.stages.get($('stage').value);$('entry').replaceChildren(new Option('Full run · Phase 1','0'),new Option('Practice · Phase 2','1'));for(const sec of s?.practiceSectors||[]){const o=new Option('Practice · '+sec.label,'sector-'+sec.id);o.dataset.phase=sec.phase??0;o.dataset.sector=sec.id;$('entry').add(o);}records();}
function start(){const s=Arcade.stages.get($('stage').value);if(!s)return;pilot=$('pilot').value;world=new Arcade.World(s,{seed:Number($('seed').value)||777,phase:Number($('entry').selectedOptions[0].dataset.phase??$('entry').value)||0,sector:Number($('entry').selectedOptions[0].dataset.sector)||0,practice:$('entry').value!=='0'});paused=false;held.clear();press.clear();acc=0;visibleState='';soundTick=-1;render.lastCue='';$('curtain').hidden=true;$('next').hidden=true;records();tone();}
$('next').onclick=()=>{const n=stages.findIndex(s=>s.id===world.stage.id)+1;if(stages[n]){$('stage').value=stages[n].id;refreshEntries();start();}};
function overlay(title,message,button){$('next').hidden=!(world?.state==='clear'&&!world.practice&&stages.findIndex(s=>s.id===world.stage.id)<stages.length-1);$('result').textContent=title;$('message').textContent=message;$('resume').textContent=button;$('curtain').hidden=false;}
$('entry').onchange=records;$('start').onclick=start;$('stage').onchange=refreshEntries;$('resume').onclick=()=>{if(paused){paused=false;held.clear();press.clear();$('curtain').hidden=true;}else start();};
$('dash-key').onclick=()=>{remapping=true;$('dash-key').textContent='Press a key for dash…';};
const actions={jump:['Space'],shield:['KeyX'],power:['KeyF'],replace:['KeyE'],retry:['KeyR'],beam:['KeyC'],bomb:['KeyV']};
window.addEventListener('keydown',e=>{if(/INPUT|SELECT/.test(e.target.tagName))return;if(remapping){if(['Space','KeyX','KeyF','KeyE','KeyR','KeyC','KeyV','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){$('dash-key').textContent='Reserved key · choose another';return;}dashKey=e.code;remapping=false;$('dash-key').textContent=e.key+' · Dash (remap)';e.preventDefault();return;}if(e.code==='Escape'&&!e.repeat&&['playing','transition'].includes(world?.state)){paused=!paused;held.clear();press.clear();if(paused)overlay('Paused','Take a breath. The simulation is stopped.','Resume');else $('curtain').hidden=true;e.preventDefault();return;}if(!held.has(e.code))press.add(e.code);held.add(e.code);if(['Space',...Object.keys(actions).flatMap(k=>actions[k]),'ArrowLeft','ArrowRight','ArrowUp','ArrowDown',dashKey,'ShiftRight'].includes(e.code))e.preventDefault();});
window.addEventListener('keyup',e=>held.delete(e.code));window.addEventListener('blur',()=>{held.clear();press.clear();if(['playing','transition'].includes(world?.state)&&!paused){paused=true;overlay('Paused','The game paused when this window lost focus.','Resume');}});
function input(){const i={left:held.has('ArrowLeft')||held.has('KeyA'),right:held.has('ArrowRight')||held.has('KeyD'),up:held.has('ArrowUp')||held.has('KeyW'),down:held.has('ArrowDown')||held.has('KeyS'),dash:press.has(dashKey)||(dashKey==='ShiftLeft'&&press.has('ShiftRight'))};for(const [a,codes]of Object.entries(actions))i[a]=codes.some(c=>press.has(c));press.clear();return i;}
function text(s,x,y,size=18,color='#fff1d0',align='left'){ctx.font=`700 ${size}px system-ui`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(String(s),x,y);}
function sheetHazardClip(name){const info=typeof SHEET_DATA==='undefined'?null:SHEET_DATA.shots?.[name];return info?SHEET_DATA.bosses[info.boss].clips[info.clip]:null;}
Arcade.drawSheetBoss=function(c,id,x,feet,height,clipName,u){
  const spec=SHEET_DATA?.bosses?.[id],clip=spec?.clips?.[clipName];if(!clip)return;
  const frame=Math.min(clip.frameCount-1,Math.max(0,Math.floor((u||0)*clip.frameCount)));
  const image=img(clip.frames[frame]);if(!image)return;
  const w=height*clip.frameSize[0]/clip.frameSize[1];
  c.save();c.imageSmoothingEnabled=false;c.drawImage(image,Math.round(x-w/2),Math.round(feet-height),Math.round(w),Math.round(height));c.restore();
};
function sprite(id,x,y,height=76,pose=0,facing=1){const a=ART.sprites[id],p=a?.poses?.[pose]||a?.poses?.[0],i=img(p?.[0]);if(i){const b=Arcade.spriteBounds?.[p[0]]||[0,0,i.naturalWidth,i.naturalHeight],w=height*b[2]/b[3];ctx.save();ctx.translate(x,y);ctx.imageSmoothingEnabled=false;ctx.scale(facing<0?-1:1,1);ctx.drawImage(i,b[0],b[1],b[2],b[3],-w/2,-height,w,height);ctx.restore();}else{ctx.fillStyle='#ffdb8a';ctx.fillRect(x-13,y-height,26,height);}}
function chevrons(x,y,h){ctx.strokeStyle='#f4efe1';ctx.lineWidth=4;for(let yy=y+12;yy<y+h;yy+=32){ctx.beginPath();ctx.moveTo(x-8,yy-8);ctx.lineTo(x+3,yy);ctx.lineTo(x-8,yy+8);ctx.stroke();}}
function render(){ctx.fillStyle='#122431';ctx.fillRect(0,0,1280,720);if(!world){text('MACHINE TRIALS',640,350,48,'#ffcf7b','center');return;}const w=world,p=w.player,ph=w.phase;
const gradient=ctx.createLinearGradient(0,0,0,720);gradient.addColorStop(0,'#172d3e');gradient.addColorStop(1,w.stage.color||'#293e47');ctx.fillStyle=gradient;ctx.fillRect(0,0,1280,720);
ctx.save();ctx.translate(-w.camera.x,-w.camera.y);ctx.textAlign='left';
for(const pl of w.platforms){if(pl.removed||pl.active===false)continue;ctx.fillStyle='#263c49';ctx.fillRect(pl.x,pl.y,pl.w,pl.h||20);ctx.fillStyle='#81b5ba';ctx.fillRect(pl.x,pl.y,pl.w,4);}
ph.draw?.(ctx,w);
for(const t of w.targets){if(t.removed||t.hp<=0)continue;ctx.strokeStyle=t.open===false?'#9ca5ad':'#ffdc8a';ctx.lineWidth=3;ctx.strokeRect(t.x,t.y,t.w,t.h);if(t.maxHp){ctx.fillStyle='#ffdc8a';ctx.fillRect(t.x,t.y-8,t.w*Math.max(0,t.hp/t.maxHp),4);}if(!ph.drawsTargetLabels)text(t.label||t.id,t.x+t.w/2,t.y-16,14,t.open===false?'#a4b0b6':'#ffdd87','center');}
for(const h of w.hazards){
 if(h.removed)continue;
 const warning=h.age<(h.windup||0),recovery=h.age>=(h.windup||0)+(h.active||1);
 if(recovery)continue;
 const moving=Math.hypot(h.vx||0,h.vy||0)>0;
 const sheet=sheetHazardClip(h.sprite);
 ctx.save();ctx.globalAlpha=warning ? (h.missile ? 0.65 : 0.35) : 0.95;
 if(sheet){
  const frame=img(sheet.frames[Math.floor((h.age||0)/6)%sheet.frameCount]);
  ctx.imageSmoothingEnabled=false;
  if(frame&&h.h>220){
    const tile=Math.max(36,Math.round(h.w*frame.naturalHeight/frame.naturalWidth));
    for(let y=h.y;y<h.y+h.h;y+=tile)ctx.drawImage(frame,h.x,y,h.w,Math.min(tile,h.y+h.h-y));
  }else if(frame)ctx.drawImage(frame,h.x,h.y,h.w,h.h);
  else{ctx.fillStyle='#ffb482';ctx.fillRect(h.x,h.y,h.w,h.h);}
 }else{
 const style=h.sprite||(h.rule==='ordinary'&&moving&&h.w<=128&&h.h<=128?'bolt':null);
 if(style&&h.rule==='ordinary'){
  const asset=Arcade.projectileAssets?.[style],picture=img(asset?.path||'art/gameplay/projectiles/'+style+'.svg');
  if(picture){if(asset?.pixelArt)ctx.imageSmoothingEnabled=false;ctx.translate(h.x+h.w/2,h.y+h.h/2);ctx.scale((h.vx||1)<0?-1:1,1);if(asset?.crop)ctx.drawImage(picture,...asset.crop,-h.w/2,-h.h/2,h.w,h.h);else ctx.drawImage(picture,-h.w/2,-h.h/2,h.w,h.h);}
  else{ctx.fillStyle=h.pressure?'#a3e8d6':'#ffb482';ctx.fillRect(h.x,h.y,h.w,h.h);}
 }else{ctx.fillStyle=h.rule==='dash'?'#d488fe':h.rule==='shield'?'#79e4e2':'#ff977a';ctx.fillRect(h.x,h.y,h.w,h.h);}
 }
 ctx.restore();ctx.strokeStyle=warning?'#f6ddb5':h.pressure?'#b9f3df':'#fff0d5';ctx.lineWidth=warning?2:1;ctx.setLineDash(warning?[7,7]:[]);ctx.strokeRect(h.x,h.y,h.w,h.h);ctx.setLineDash([]);
 if(warning&&moving&&h.rule==='ordinary'){
  const n=Math.hypot(h.vx,h.vy)||1,dx=h.vx/n,dy=h.vy/n,cx=h.x+h.w/2,cy=h.y+h.h/2;
  ctx.strokeStyle='#fff3c6';ctx.lineWidth=2;ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+dx*100,cy+dy*100);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(cx+dx*88-dy*7,cy+dy*88+dx*7);ctx.lineTo(cx+dx*100,cy+dy*100);ctx.lineTo(cx+dx*88+dy*7,cy+dy*88-dx*7);ctx.stroke();
 }
 if(warning&&h.missile)text('SLOW MISSILE',h.x+h.w/2,h.y-10,12,'#fff2bc','center');
 if(h.rule==='dash')chevrons(h.x+h.w/2,h.y,h.h);if(h.rule==='shield')text('◇ X',h.x+h.w/2,h.y+30,24,'#e1fffb','center');
}
for(const s of w.shots){if(s.removed)continue;ctx.fillStyle=s.type==='mine'?'#9af0ad':'#ffe9a3';ctx.fillRect(s.x,s.y,s.w||12,s.h||6);}
for(const pick of w.pickups){if(pick.removed)continue;ctx.fillStyle='#7ae7ce';ctx.beginPath();ctx.arc(pick.x,pick.y,17,0,Math.PI*2);ctx.fill();text('F',pick.x,pick.y+6,16,'#183e44','center');text(pick.weapon,pick.x,pick.y-24,14,'#b6fff2','center');}
for(const e of w.effects){if(e.type==='decoy'){ctx.globalAlpha=.5;sprite(pilot,e.x,e.y+26);ctx.globalAlpha=1;}else if(e.type==='blast'){ctx.strokeStyle='#bcffa3';ctx.beginPath();ctx.arc(e.x,e.y,e.radius||90,0,Math.PI*2);ctx.stroke();}}
if(!ph.drawsPilot){const pp=(typeof ph.pilot==='function'?ph.pilot(w):ph.pilot)||{x:w.camera.x+1120,y:w.camera.y+235};sprite(w.stage.operatorSprite||'rivet',pp.x,pp.y,pp.height||pp.scale||ph.pilotHeight||82);text(w.stage.operator,pp.x,pp.y-90,14,'#f6e2bb','center');}
if(ph.mode==='flight'||ph.mode==='orbit'){ctx.fillStyle='#91aeb5';ctx.beginPath();ctx.ellipse(p.x,p.y-15,48,17,0,0,Math.PI*2);ctx.fill();sprite(pilot,p.x,p.y-20,48);}else sprite(pilot,p.x,p.y,76,p.dash?6:!p.grounded?8:0,p.facing);
if(p.dash){ctx.strokeStyle='#eed9ff';ctx.lineWidth=4;ctx.strokeRect(p.x-22,p.y-57,44,62);}if(p.shield){ctx.strokeStyle='#83f9df';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y-28,47,0,Math.PI*2);ctx.stroke();}ctx.restore();
ctx.fillStyle='#09131ee8';ctx.fillRect(0,0,1280,115);text(w.stage.title,24,32,23);text(`${w.practice?'PRACTICE':'FULL RUN'} · ${ph.name} · ${ph.machine||''}`,24,57,14,'#9fbdc8');text(w.objective||ph.objective,24,85,18,'#ffe3a4');text('♥'.repeat(Math.max(0,p.hp)),1255,32,23,'#ffce7a','right');text(p.dashWait?'DASH '+(p.dashWait/60).toFixed(1)+'s':'DASH READY  »',1255,57,16,p.dashWait?'#aebcc6':'#d1b5ff','right');const slot=w.weapons?.snapshot();text(slot?`${slot.weapon} · ${slot.charges} charges · F`:'PICKUP SLOT EMPTY',1255,83,14,'#a1ead5','right');ctx.fillStyle='#49616a';ctx.fillRect(24,100,1232,4);ctx.fillStyle='#ffd98a';ctx.fillRect(24,100,1232*Arcade.clamp(w.progress||0,0,1),4);
if(w.cueText){ctx.fillStyle='#101b2be8';ctx.fillRect(180,125,920,45);text(w.cueText,640,155,18,'#fff3d5','center');if(soundTick!==w.tick&&w.cueText!==render.lastCue){tone(580);soundTick=w.tick;}render.lastCue=w.cueText;}
ctx.fillStyle='#0b1824db';ctx.fillRect(0,680,1280,40);text(`${ph.hudLabel||'PROGRESS'} · ${Math.round((w.progress||0)*100)}%`,24,706,14,'#d2e1df');text(`X SHIELD ${p.shieldWait?(p.shieldWait/60).toFixed(1)+'s':'READY'}   C ${p.beamWait?(p.beamWait/60).toFixed(1)+'s':'READY'}   V ${p.bombWait?(p.bombWait/60).toFixed(1)+'s':'READY'}`,1255,706,14,'#a4d9db','right');
if(w.state==='transition'){ctx.fillStyle='#09131ee0';ctx.fillRect(0,0,1280,720);text('MACHINE TRANSFORMATION',640,320,32,'#ffdf95','center');text(w.stage.phases[1].machine,640,365,24,'#d8ebea','center');text('New task: '+w.stage.phases[1].objective,640,410,18,'#d8ebea','center');}
}
function loop(now){const dt=Math.min(250,now-last||0);last=now;acc+=dt;if(world&&!paused){while(acc>=1000/60){const i=input();if(i.retry){world.restart();visibleState='';soundTick=-1;render.lastCue='';$('curtain').hidden=true;held.clear();}else world.step(i);acc-=1000/60;}if(world.state!==visibleState){visibleState=world.state;if(world.state==='lost')overlay('Try the next opening',`Cause: ${world.failure||'Unknown hazard'}. Press R or retry. Your attempt resets to the standard kit.`,'Retry');if(world.state==='clear'){const key=recordKey(world),r=readRecords();r[key]=Math.min(r[key]||Infinity,world.tick);try{localStorage.setItem('arcade-v1-records',JSON.stringify(r));}catch{}records();overlay('Encounter cleared',`${world.stage.operator}'s machine is down. ${world.practice?'Practice result':'Full-run result'} · ${(world.tick/60).toFixed(1)} seconds.`,'Play again');}}$('status').textContent=`${world.state.toUpperCase()} · Seed ${world.seed??$('seed').value} · Tick ${world.tick} · ${world.failure?'Last hit: '+world.failure:'Read the cue, then commit.'}`;}else{acc=0;press.clear();}render();requestAnimationFrame(loop);}
$('status').textContent=`${stages.length} encounters registered · Offline classic scripts`;const query=new URLSearchParams(location.search);if(Arcade.stages.has(query.get('stage')))$('stage').value=query.get('stage');refreshEntries();if(query.get('phase')==='1')$('entry').value='1';records();requestAnimationFrame(loop);
// Public read-only-in-spirit diagnostics for reproducible QA; no forced completion UI.
globalThis.ArcadeApp={get world(){return world;},start,render,get paused(){return paused;}};
})();
