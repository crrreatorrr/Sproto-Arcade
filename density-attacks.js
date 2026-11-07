/* Shared deterministic boss barrages. No browser, artwork-readiness or RNG dependencies. */
const ArcadeDensityAttacks=(()=>{'use strict';
 const START=240,PERIOD=1320,WINDUP=100,WAVES=3,WAVE_DELAY=26,MAX_SHOTS=36;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 // Filled from measured opaque pixels across all four accepted atlas frames.
 const missileGeometry={"1":{"bounds":[13,157,490,216],"core":[88,189,243,151],"sourceSha256":"dad752dbb95f6c2fbfb896ec02f52723add7f8a2dc6df7b7290fd903b497a3ea"},"2":{"bounds":[9,149,501,215],"core":[105,193,229,127],"sourceSha256":"a5b8be1e154d527bbadce957944c682d6b6f1da21c31d2ffcbe5fa2e3519bcea"},"3":{"bounds":[9,120,497,278],"core":[64,163,268,186],"sourceSha256":"9d1c601f5f58e7d5e658a4c4686ef1bfd4f289f4723a922c30d4174057b7f4fe"},"4":{"bounds":[13,105,491,294],"core":[53,179,269,175],"sourceSha256":"be6e1aae92ba635fd445e21cbd5b2b992b2d5a926d727103ccc2f58e54bc94f1"},"5":{"bounds":[17,169,478,176],"core":[82,195,245,123],"sourceSha256":"9627ff28df2e04e5fa62fb6e992d967d5ee5e262b7473c252153fc8bc7c27040"},"6":{"bounds":[17,155,484,196],"core":[85,195,246,117],"sourceSha256":"8676e1129501dad4bd6f9fdaf700aa781b5e30c21b4ca130db78f94ea0410f4a"},"7":{"bounds":[15,160,486,178],"core":[102,198,228,110],"sourceSha256":"f5f1154a234423ccdac1d9dac77d993293c5ae5eba824c6e58125104fb38f2fb"},"8":{"bounds":[17,148,479,213],"core":[102,204,226,102],"sourceSha256":"58635444ea1535cc398b59cdaeb42d51203559fe6b0d73533dfa1b5b2606b0d1"},"9":{"bounds":[29,90,473,329],"core":[141,152,195,204],"sourceSha256":"843dcd1213ad2af376f58e5e3957fff40b24102dd6dadb335c6a1558c04a458e"},"10":{"bounds":[62,104,433,303],"core":[122,155,208,205],"sourceSha256":"bede9cf547b46b2500500e27c81d2df8ca68d53835b8cf98a21d3163f587a74e"},"11":{"bounds":[40,37,432,428],"core":[175,176,185,105],"sourceSha256":"c7f240aa888c0f7756b56a9e05778745f4d2ce7a46a3fa17a45ece163ac95c2d","rotation":-2.356194490192345,"rotationMatrix":[-0.7071067811865476,-0.7071067811865476],"orientedBounds":[-297.6919548795365,-163.34166645409252,579.1204537917824,322.4406922210658]},"12":{"bounds":[39,40,440,433],"core":[193,195,133,132],"sourceSha256":"1f5cfab3136497d0f4c02823f001b6cf6dba5fd4f509a5664f1b19c0bb922202","rotation":-2.356194490192345,"rotationMatrix":[-0.7071067811865476,-0.7071067811865476],"orientedBounds":[-291.6815472394509,-136.82516215959697,597.5052301026327,266.57925650732847]},"13":{"bounds":[15,131,485,248],"core":[110,180,220,152],"sourceSha256":"4b9dca0482a344396f5a43e1149b1388604b6dbacd94ac436b353f0f717e84d7"}};
 function missileTransform(geometry,box){
  const b=geometry?.bounds,rotation=Number.isFinite(geometry?.rotation)?geometry.rotation:0;
  const valid=r=>Array.isArray(r)&&r.length===4&&r.every(Number.isFinite)&&r[2]>0&&r[3]>0;
  if(!valid(b)||rotation&&!valid(geometry.orientedBounds))return null;
  const o=rotation?geometry.orientedBounds:[-b[2]/2,-b[3]/2,b[2],b[3]],scale=Math.min(box.w/o[2],box.h/o[3]);
  // The accepted135degree correction uses exact IEEE sqrt constants in every
  // runtime; other angles use the game's deterministic transcendental math.
  const trig=typeof SimMath==='undefined'?Math:SimMath,diagonal=Math.abs(rotation+3*Math.PI/4)<1e-12;
  const matrix=rotation&&Array.isArray(geometry.rotationMatrix)&&geometry.rotationMatrix.length===2&&geometry.rotationMatrix.every(Number.isFinite)?geometry.rotationMatrix:null;
  return{scale,rotation,cos:rotation?(matrix?matrix[0]:diagonal?-Math.SQRT1_2:trig.cos(rotation)):1,sin:rotation?(matrix?matrix[1]:diagonal?-Math.SQRT1_2:trig.sin(rotation)):0,offsetX:o[0]+o[2]/2,offsetY:o[1]+o[3]/2};
 }
 function damageRect(shot){
  const id=Number.parseInt(shot.stage||String(shot.source||'').replace('boss-density-',''),10),geometry=missileGeometry[id];
  const b=geometry?.bounds,c=geometry?.core,valid=r=>Array.isArray(r)&&r.length===4&&r.every(Number.isFinite)&&r[2]>0&&r[3]>0;
  if(valid(b)&&valid(c)&&c[0]>=b[0]&&c[1]>=b[1]&&c[0]+c[2]<=b[0]+b[2]&&c[1]+c[3]<=b[1]+b[3]){
   const transform=missileTransform(geometry,shot);if(transform){
   const {scale,rotation,cos,sin,offsetX,offsetY}=transform;
   const x=c[0]+c[2]/2-b[0]-b[2]/2,y=c[1]+c[3]/2-b[1]-b[3]/2;
   // Rotation corrects native source orientation before the existing caller mirror.
   const cx=shot.x+shot.w/2+(x*cos-y*sin-offsetX)*scale*((shot.vx||1)<0?1:-1);
   const cy=shot.y+shot.h/2+(x*sin+y*cos-offsetY)*scale;
   // A square inscribed in the core's inscribed circle stays within the opaque
   // rectangle after every orientation; never use its unsafe rotated AABB.
   const w=(rotation?Math.min(c[2],c[3])/Math.SQRT2:c[2])*scale;
   const h=(rotation?Math.min(c[2],c[3])/Math.SQRT2:c[3])*scale;
   return{x:cx-w/2,y:cy-h/2,w,h};}
  }
  // Production remains disabled until every source-hashed core is populated.
  const fraction=shot.coreScale||.65;
  return{x:shot.x+shot.w*(1-fraction)/2,y:shot.y+shot.h*(1-fraction)/2,w:shot.w*fraction,h:shot.h*fraction};
 }

 function missilePath(stage){const id=Number.parseInt(stage,10);return Number.isInteger(id)&&id>=1&&id<=13?`art/generated/missiles/${String(id).padStart(2,'0')}/missile.png`:null;}
 function plan(options={}){
  const {stage,phase,tick,arena,player}=options,id=Number.parseInt(stage,10),path=missilePath(id);
  if(!path||(phase!==0&&phase!==1)||!Number.isInteger(tick)||tick<0)return null;
  // Integrators enable this constant only after all configured real atlases ship.
  // Never derive simulation activation from Image.complete/network readiness.
  if(options.enabled!==true||options.blocked)return{clear:true,shots:[]};
  if(tick<START||options.liveCount>0)return null;
  const cycle=Math.floor((tick-START)/PERIOD);
  if(cycle<=(options.lastCycle??-1))return null;
  if(!arena||!player||![arena.left,arena.top,arena.right,arena.bottom,player.x,player.y].every(Number.isFinite))return null;
  const width=arena.right-arena.left,height=arena.bottom-arena.top;
  if(width<760||height<280)return null;
  const right=arena.right-20-player.x>=player.x-(arena.left+20),origin=right?arena.right-20:arena.left+20;
  // Never emit near the player, even in scrolling arenas or against an edge.
  if(Math.abs(origin-player.x)<360)return null;
  const laneHeight=Math.min(200,height-48),half=laneHeight/2;
  const center=clamp(player.y,arena.top+half,arena.bottom-half);
  const lane={axis:'y',top:center-half,bottom:center+half,x:arena.left,width,starts:tick};
  const rows=[];
  for(let row=0;row<18;row++){
   const y=arena.top+20+(height-40)*row/17,size=[32,38,44][(row+id+phase+cycle)%3];
   // Reserve the WHOLE visual silhouette, not just the smaller damage core.
   if(y+size/2<=lane.top||y-size/2>=lane.bottom)rows.push({row,y,size});
  }
  // Keep at most twelve missiles per wave, sampled over both sides of the gap.
  const selected=rows.length<=12?rows:Array.from({length:12},(_,i)=>rows[Math.floor(i*rows.length/12)]);
  const speed=1.25+phase*.15+(id%3)*.1,shots=[];
  for(let wave=0;wave<WAVES;wave++)for(const {row,y,size}of selected){
   const windup=WINDUP+wave*WAVE_DELAY,active=Math.ceil((width+size)/speed)+8;
   shots.push({id:`density-${id}-${phase}-${tick}-${wave}-${row}`,source:`boss-density-${id}`,rule:'ordinary',
    density:true,missile:true,sprite:'missile',artPath:path,weaponPhase:phase,weaponVariant:wave,
    x:origin-size/2,y:y-size/2,w:size,h:size,vx:right?-speed:speed,vy:0,
    coreScale:.65,windup,active,recovery:0,age:0});
  }
  if(!shots.length)return null;
  lane.until=tick+Math.max(...shots.map(s=>s.windup+s.active));
  return{clear:false,cycle,shots,lane,cue:'SLOW BARRAGE · Green lane stays clear · steer into the gap',cueDuration:WINDUP};
 }
 return Object.freeze({enabled:true,plan,missilePath,missileGeometry,missileTransform,damageRect,START,PERIOD,WINDUP,WAVES,WAVE_DELAY,MAX_SHOTS});
})();
if(typeof globalThis!=='undefined')globalThis.ArcadeDensityAttacks=ArcadeDensityAttacks;
