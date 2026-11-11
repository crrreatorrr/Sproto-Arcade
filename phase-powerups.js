/* Independent, replayable random pickups. No attack RNG or wall-clock access. */
const ArcadePhasePowerups=(()=>{'use strict';
// Enabled only after the custom Higgsfield pickup/shield assets are accepted.
const assetsReady=true;
const PICKUP_TTL=240,SHIELD_TTL=600;
function random(seed){let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
// `span` is the phase's expected length in ticks. With it the two items are spread over the
// phase (18-40% and 58-82% of the span); without it they keep the original early windows
// (ticks 180-540 and 150-450 later), which Machine Trials still uses. Both forms draw the same
// random numbers in the same order.
function create({seed=1,attempt=0,phase=0,span=0}={}){
 const rng=random((seed^Math.imul(attempt+1,0x9e3779b1)^Math.imul(phase+1,0x85ebca6b)^0x17eaf00d)>>>0);
 const a=rng(),b=rng(),spread=Number.isFinite(span)&&span>0;
 const first=spread?Math.floor(span*(.18+a*.22)):180+Math.floor(a*361),second=spread?Math.floor(span*(.58+b*.24)):first+150+Math.floor(b*301),shieldFirst=rng()<.5;
 return{seed:seed>>>0,attempt,phase,shieldUntil:0,plans:['life','shield'].map(kind=>({id:kind,kind,at:(kind==='shield')===shieldFirst?first:second,u:.12+rng()*.76,v:.15+rng()*.7,spawned:false,done:false})),pickups:[]};
}
function activeShield(state,tick){return state.shieldUntil>tick;}
function absorb(state,tick,{mandatory=false}={}){
 if(!activeShield(state,tick))return false;
 state.shieldUntil=0;state.absorbedAt=tick;
 // A required front still damages unless its own dash/X counter succeeds,
 // but an actual hit always breaks the pickup shield.
 return !mandatory;
}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
// `ready:false` holds every due item back (a barrage is live, or the player was just hit).
// `hold:{life:true}` holds one kind back: a heart waits until the player is hurt, and never
// appears if that never happens. A held item spawns on the first tick it is allowed.
function step(state,{tick,ready=false,hold=null,player=null,bounds={x:80,y:240,w:700,h:350},surfaces=null}={}){
 const events=[];
 if(ready)for(const plan of state.plans)if(!plan.spawned&&tick>=plan.at&&!hold?.[plan.kind]&&(!surfaces||surfaces.length)){
  plan.spawned=true;
  const size=32,surface=surfaces?.[Math.min(surfaces.length-1,Math.floor(plan.v*surfaces.length))];
  const x=surface?surface.x+plan.u*Math.max(0,surface.w-size):bounds.x+plan.u*Math.max(0,bounds.w-size),y=surface?surface.y-size:bounds.y+plan.v*Math.max(0,bounds.h-size);
  state.pickups.push({id:plan.id,kind:plan.kind,x,y,w:size,h:size,spawnedAt:tick,expiresAt:tick+PICKUP_TTL});
  events.push({type:'spawn',kind:plan.kind});
 }
 state.pickups=state.pickups.filter(p=>{
  if(tick>=p.expiresAt){state.plans.find(q=>q.id===p.id).done=true;events.push({type:'expire',kind:p.kind});return false;}
  if(player&&overlap(player,p)){
   state.plans.find(q=>q.id===p.id).done=true;
   if(p.kind==='shield')state.shieldUntil=tick+SHIELD_TTL;
   events.push({type:'collect',kind:p.kind});return false;
  }
  return true;
 });
 return events;
}
function visible(pickup,tick){return pickup.expiresAt-tick>60||Math.floor(tick/6)%2===0;}
return{create,step,absorb,activeShield,visible,PICKUP_TTL,SHIELD_TTL,assetsReady};
})();
if(typeof globalThis!=='undefined')globalThis.ArcadePhasePowerups=ArcadePhasePowerups;
if(typeof module!=='undefined'&&module.exports)module.exports=ArcadePhasePowerups;
