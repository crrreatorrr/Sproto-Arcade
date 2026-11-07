/* Shared deterministic boss barrages. No browser, artwork-readiness or RNG dependencies. */
const ArcadeDensityAttacks=(()=>{'use strict';
 const START=420;
 // Stable boss IDs are not campaign order: Redkev is the second encounter.
 const progression=[1,13,2,3,4,5,6,7,8,9,10,11,12];
 const patterns=[
  ['middle','floor','middle','floor','middle'],
  ['middle','floor','floor','middle','floor','middle'],
  ['floor','middle','high-floor','middle','floor','high-middle','floor'],
  ['middle','high-floor','floor','high-middle','high-floor','middle','floor','high-middle'],
  ['high-floor','middle','floor','high-middle','floor','high-floor','middle','high-floor','floor']
 ];
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
 function horizontalCore(shot){
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
 function damageRect(shot){
  if(!shot.vertical)return horizontalCore(shot);
  // The atlas faces left. The renderer turns it a quarter turn toward the floor.
  const core=horizontalCore({...shot,vx:-1});
  const x=shot.x+shot.w/2,y=shot.y+shot.h/2;
  return{x:x+core.y-y,y:y-(core.x-x)-core.w,w:core.h,h:core.w};
 }

 function plan(options={}){
  const {stage,phase,tick,arena,player,flight,vertical}=options;
  const id=Number.parseInt(stage,10),path=missilePath(id),rank=progression.indexOf(id);
  if(!path||(phase!==0&&phase!==1)||!Number.isInteger(tick)||tick<START||
     options.enabled!==true||options.blocked||options.liveCount>0||(options.lastCycle??-1)>=0)return null;
  if(!arena||!player||![arena.left,arena.top,arena.right,arena.bottom,player.x,player.y].every(Number.isFinite))return null;
  const width=arena.right-arena.left,height=arena.bottom-arena.top;
  if(width<760||height<260)return null;
  const tier=Math.min(patterns.length-1,Math.floor(rank/3)+(phase&&rank>=3?1:0));
  const pattern=patterns[tier];
  const speed=5.2+tier*.62+phase*.38+(rank%3)*.12;
  const spacing=74-tier*4, floor=arena.floor??arena.bottom;
  const standing=options.standingHeight??110,crouching=options.crouchHeight??72;
  const shots=[];
  const fromRight=arena.right-player.x>=player.x-arena.left;
  function add(wave,lane,size,delay,position){
   const active=Math.ceil(((vertical?height:width)+size*2)/speed)+2;
   shots.push({id:`density-${id}-${phase}-${tick}-${wave}-${lane}`,source:`boss-density-${id}`,
    rule:'ordinary',density:true,missile:true,sprite:'missile',artPath:path,weaponPhase:phase,weaponVariant:wave%3,
    stage:id,x:vertical?position-size/2:fromRight?arena.right:arena.left-size,
    y:vertical?arena.top-size:position-size/2,w:size,h:size,
    vx:vertical?0:fromRight?-speed:speed,vy:vertical?speed:0,vertical:Boolean(vertical),
    coreScale:.65,windup:0,delay,active,recovery:0,age:0});
  }

  for(let wave=0;wave<pattern.length;wave++){
   const delay=wave*spacing;
   if(flight||vertical){
    // Each formation leaves a traversable opening. Later formations shift it
    // between waves, with enough time to move before the next line arrives.
    const start=vertical?arena.left:arena.top,end=vertical?arena.right:arena.bottom;
    const center=vertical?player.x:player.y;
    const gap=vertical?240-tier*10:240-tier*18;
    const offsets=[0,1,0,-1,1,-1,0,1,-1];
    const shift=offsets[wave]*(vertical?tier*12:tier*20);
    const home=clamp(center,start+gap/2,end-gap/2);
    const opening=clamp((flight?home:center)+shift,start+gap/2,end-gap/2);
    const count=vertical?17:10+tier;
    for(let lane=0;lane<count;lane++){
     const size=[34,40,46][(lane+wave+rank)%3];
     const position=start+22+(end-start-44)*lane/(count-1);
     if(Math.abs(position-opening)>gap/2+size/2)add(wave,lane,size,delay,position);
    }
    continue;
   }

   const row=pattern[wave];
   const middle=row.endsWith('middle');
   const centerY=floor-(middle?(standing+crouching)/2:Math.min(24,standing*.38));
   const count=5+Math.floor(tier/2);
   for(let i=0;i<count;i++){
    let size=[34,40,46][(i+wave+rank)%3];
    const velocity=fromRight?-speed:speed;
    let core=horizontalCore({stage:id,x:0,y:0,w:size,h:size,vx:velocity});
    if(middle&&core.h>standing-crouching-4){
     size*= (standing-crouching-4)/core.h;
     core=horizontalCore({stage:id,x:0,y:0,w:size,h:size,vx:velocity});
    }
    const offset=core.y+core.h/2-size/2;
    add(wave,i,size,delay+i*7,centerY-offset);
    if(row.startsWith('high')&&i%2===0)add(wave,count+i,size,delay+i*7,floor-standing-145-offset);
   }
  }
  return{cycle:0,shots};
 }
 return Object.freeze({enabled:true,plan,missilePath,missileGeometry,missileTransform,damageRect,START});
})();
if(typeof globalThis!=='undefined')globalThis.ArcadeDensityAttacks=ArcadeDensityAttacks;
