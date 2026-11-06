/* Standalone visual authoring fixture. Loaded only by controlled-stage-review.html.
 * No normal-game query mode, simulation hooks or completion/record writes.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id),query=new URLSearchParams(location.search);
function entries(){const phase=$('entry').value==='1'?'1':'0';$('entry').replaceChildren(new Option('Phase 1','0'),new Option('Phase 2','1'));$('entry').value=phase;}
const normalChange=$('stage').onchange;$('stage').onchange=()=>{normalChange();entries();};entries();
if(Arcade.stages.has(query.get('reviewStage')))$('stage').value=query.get('reviewStage');
if(query.get('reviewPhase')==='1')$('entry').value='1';
if(Number.isFinite(Number(query.get('reviewTick')))&&query.has('reviewTick'))$('review-tick').value=query.get('reviewTick');
// A reviewer cannot accidentally resume normal play with Escape in this page.
window.addEventListener('keydown',e=>{if(e.isTrusted&&e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();}},true);
async function load(){
 const count=Math.min(4800,Math.max(0,Math.floor(Number($('review-tick').value)||0)));$('review-tick').value=String(count);
 const previousWorld=ArcadeApp.world;await ArcadeApp.start();
 if(!ArcadeApp.world||ArcadeApp.world===previousWorld||ArcadeApp.world.stage.id!==$('stage').value){$('review-status').textContent='Boss art could not load. Retry the controlled frame.';return;}
 if(!ArcadeApp.paused){window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape'}));window.dispatchEvent(new KeyboardEvent('keyup',{code:'Escape'}));}
 if(!ArcadeApp.paused)throw Error('Controlled review must remain paused');
 const w=ArcadeApp.world,stage=w.stage,phase=w.phaseIndex;
 const canonicalPlayerHp=w.player.hp;w.practice=true;w.player.hp=100000;
 for(let tick=1;tick<=count;tick++){
  w.phaseTick=w.tick=tick;w.events=[];
  // Same controlled eligibility used by qa/boss-weapon-variants.cjs.
  if(stage.number===3&&phase){w.data.introduced=true;Object.assign(w.player,{x:220,y:360});}
  if(stage.number===4&&phase){w.data.crossed=true;Object.assign(w.player,{x:4000+(w.data.offset||0),y:600,grounded:true});}
  if(stage.number===10){w.player.x=220;w.player.y=350;}
  if(stage.number===11)Object.assign(w.player,{x:2000,y:600,grounded:true});
  w.updateHazards();w.phase.update(w);
 }
 const box=ArcadeBossSheets.machineBox(w);
 if(w.phase.camera==='horizontal')w.camera.x=Math.max(0,box.x+box.w/2-1040);
 if(w.phase.camera==='vertical')w.camera.y=box.y+box.h/2-340;
 // Place only the review player in frame after the actual authored updates.
 if(w.phase.camera==='horizontal')w.player.x=w.camera.x+250;
 w.player.hp=canonicalPlayerHp;
 w.objective='CONTROLLED VISUAL REVIEW · '+(w.phase.objective||'');
 const asset=ArcadeBossSheets.manifest[stage.number],boss=asset.phases[phase],projectiles=asset.projectiles[phase];
 $('review-status').textContent=`NOT AN EARNED CLEAR · ${stage.id} P${phase+1} · authored tick ${count} · normal renderer paused · camera ${Math.round(w.camera.x)},${Math.round(w.camera.y)} · boss ${boss.ready?' READY':' PENDING'} · projectiles ${projectiles.ready?' READY':' PENDING'}`;
 $('curtain').hidden=true;ArcadeApp.render();
}
$('start').onclick=load;
for(const [id,delta]of [['review-back',-60],['review-forward',60]])$(id).onclick=()=>{$('review-tick').value=String(Math.max(0,Number($('review-tick').value)+delta));load();};
$('entry').onchange=()=>{};
globalThis.ControlledStageReview=Object.freeze({load,get world(){return ArcadeApp.world;}});
})();
