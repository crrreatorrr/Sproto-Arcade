/* Browser-only observation. This file is deliberately outside the replay simulation SOURCES.
 * Original functions still receive the same this/arguments and return/throw unchanged.
 * Enemy shot objects are never edited; immutable presentation metadata lives in a WeakMap.
 */
(function(){
  'use strict';
  const art=globalThis.ArcadeBossSheets;
  if(!art)return;
  function binding(kind){
    return{phase:boss?.phase===2?1:0,variant:art.legacyVariant(boss||{},kind),bornTick:time};
  }
  function release(shot,meta,extra){
    art.recordProjectileLaunch(boss,time,{id:LEVELS[levelIndex].id,phase:meta.phase,
      variant:shot.weaponVariant??meta.variant,x:shot.x,y:shot.y,vx:shot.vx,vy:shot.vy,...extra});
  }
  function bossMount(shot){
    return shot.x>30&&shot.x<W-24&&shot.y>40&&shot.y<FLOOR+5&&Math.abs(shot.x-boss.x)<220;
  }
  const originalFire=fire;
  fire=function(){
    const first=bullets?.length||0,own=arguments[5];
    const meta=!own?binding(isChase()?'chase':isCodebreak()?'codebreak':'regular'):null;
    const result=originalFire.apply(this,arguments);
    if(meta)for(let i=first;i<(bullets?.length||0);i++){
      const shot=bullets[i];
      art.bindShot(shot,meta);
      release(shot,meta,{mounted:bossMount(shot),size:shot.shape?.startsWith('mecha')?1.15:.8});
    }
    return result;
  };
  const originalUpdateBoss=updateBoss;
  updateBoss=function(){
    const first=hazards?.length||0,previousBeam=vaultBeam,meta=binding('regular');
    const result=observeImpact(
      ()=>boss.move==='ceilingSweep'?{x:player.x,y:SWEEP_EDGE,vy:1}:
        boss.move==='shieldPulse'?{x:player.x,y:player.y-playerHeight()/2,vx:-1}:null,
      originalUpdateBoss,this,arguments);
    for(let i=first;i<(hazards?.length||0);i++){
      const shot=hazards[i];
      art.bindShot(shot,meta);
      if(!shot.blast)release(shot,meta,{y:FLOOR-4,vy:-1,mounted:false,size:1.07});
    }
    if(vaultBeam&&vaultBeam!==previousBeam){
      art.bindShot(vaultBeam,meta);
      release(vaultBeam,meta,{x:VAULT_MUZZLE,y:vaultBeam.y,vx:-1,mounted:false,size:1.4});
    }
    return result;
  };
  const originalCodeAttack=updateCodeAttack;
  updateCodeAttack=function(){
    const first=codeShots.length,meta=binding('codebreak'),attack=attackForCodebreak();
    const result=observeImpact(()=>beamContact(attack),originalCodeAttack,this,arguments);
    for(let i=first;i<codeShots.length;i++){
      const shot=codeShots[i];
      art.bindShot(shot,meta);
      release(shot,meta,{mounted:true,size:.9});
    }
    if(attack.beam&&boss.age===attack.frames[0]){
      const vertical=attack.beam==='vertical',reverse=!vertical&&(boss.phase===2||boss.section%2);
      for(const lane of codeBeamLanes(attack))if(lane.live)release(lane,meta,
        {x:vertical?lane.x+lane.width/2:reverse?W:0,y:vertical?0:lane.y+lane.height/2,
          vx:reverse?-1:vertical?0:1,vy:vertical?1:0,mounted:false,size:1.2});
    }
    return result;
  };
  const originalVerseLaser=updateVerseGemLaser;
  updateVerseGemLaser=function(t){
    const result=observeImpact(()=>({x:player.x,y:player.y-playerHeight()/2,
      vx:SimMath.cos(boss.gemAim),vy:SimMath.sin(boss.gemAim)}),originalVerseLaser,this,arguments);
    if(t===VERSE_GEM_FIRE)release({x:VERSE_GEM[0],y:VERSE_GEM[1]},binding('regular'),
      {vx:SimMath.cos(boss.gemAim),vy:SimMath.sin(boss.gemAim),mounted:false,size:1.25});
    return result;
  };
  let resolveImpact=null,contactShot=null;
  function observeImpact(resolve,fn,receiver,args){
    const previous=resolveImpact;
    resolveImpact=resolve;
    try{return fn.apply(receiver,args);}finally{resolveImpact=previous;}
  }
  function projectileContact(shot){
    if(!shot)return null;
    return {x:shot.x,y:shot.y,vx:shot.vx,vy:shot.vy,shot,size:shot.density||shot.missile?1.18:.95};
  }
  function beamContact(attack){
    if(!attack.beam)return null;
    const y=player.y-playerHeight()/2;
    const lane=codeBeamLanes(attack).find(l=>l.live&&player.x+12>l.x&&player.x-12<l.x+l.width&&player.y>l.y&&player.y-playerHeight()<l.y+l.height);
    if(!lane)return null;
    return attack.beam==='vertical'?{x:lane.x+lane.width/2,y,vy:1}:{x:player.x,y:lane.y+lane.height/2,vx:boss.phase===2||boss.section%2?-1:1};
  }
  const originalContact=enemyShotContact;
  enemyShotContact=function(shot){
    const contact=originalContact.apply(this,arguments);
    if(resolveImpact)contactShot=contact?shot:null;
    return contact;
  };
  const originalHurt=hurt,shieldedShots=new WeakSet();
  hurt=function(){
    const hp=player?.hp,inv=player?.inv,god=godHits;
    const result=originalHurt.apply(this,arguments);
    const changed=hp!==player?.hp||inv!==player?.inv||god!==godHits;
    if(!resolveImpact||!player||(!changed&&!player.shield))return result;
    const contact=resolveImpact();
    if(!contact||(!changed&&(!contact.shot||shieldedShots.has(contact.shot))))return result;
    if(!changed)shieldedShots.add(contact.shot);
    const flying=isFlying(),top=player.y-(flying?31:playerHeight()),bottom=player.y+(flying?31:0);
    art.addProjectileHit(player,time,{...contact,id:LEVELS[levelIndex].id,phase:boss.phase===2?1:0,
      x:clamp(contact.x,player.x-(flying?32:18),player.x+(flying?32:18)),
      y:clamp(contact.y,top,bottom),kind:hp===player.hp&&god===godHits?'guard':'hit'});
    return result;
  };
  const originalUpdateBullets=updateBullets;
  updateBullets=function(){
    contactShot=null;
    return observeImpact(()=>projectileContact(contactShot),originalUpdateBullets,this,arguments);
  };
  const originalUpdateChaseAttacks=updateChaseAttacks;
  updateChaseAttacks=function(){
    contactShot=null;
    return observeImpact(()=>projectileContact(contactShot),originalUpdateChaseAttacks,this,arguments);
  };
  const originalUpdateCodeShots=updateCodeShots;
  updateCodeShots=function(){
    return observeImpact(()=>{
      const y=player.y-playerHeight()/2;
      const nearest=codeShots.reduce((best,shot)=>{
        if(shot.spent)return best;
        const distance=(shot.x-player.x)**2+(shot.y-y)**2;
        return !best||distance<best.distance?{shot,distance}:best;
      },null);
      return projectileContact(nearest?.shot);
    },originalUpdateCodeShots,this,arguments);
  };
  const originalUpdateDensity=updateLegacyDensity;
  updateLegacyDensity=function(){
    return observeImpact(()=>{
      const shot=densityShots.findLast(s=>s.dead);
      return shot?projectileContact({...shot,x:shot.x+shot.w/2,y:shot.y+shot.h/2}):null;
    },originalUpdateDensity,this,arguments);
  };
  const originalUpdateVaultBeam=updateVaultBeam;
  updateVaultBeam=function(){
    return observeImpact(()=>vaultBeam?{x:player.x,y:vaultBeam.y,vx:-1,shot:vaultBeam,size:1.2}:null,
      originalUpdateVaultBeam,this,arguments);
  };
  const originalUpdateHazards=updateHazards;
  updateHazards=function(){
    return observeImpact(()=>{
      const shot=hazards.find(h=>!h.blast&&Math.abs(h.x-player.x)<h.w/2+18&&player.y>FLOOR-floorHeight(h));
      return shot?{x:player.x,y:Math.max(player.y-playerHeight()/2,FLOOR-floorHeight(shot)),vy:-1,shot}:null;
    },originalUpdateHazards,this,arguments);
  };
  const originalPuff=puff;
  puff=function(x,y){
    const result=originalPuff.apply(this,arguments);
    if(y!==FLOOR||arguments[3]!==5)return result;
    const shot=bullets.find(s=>!s.own&&!s.dead&&s.x===x&&s.y===FLOOR-13&&s.vy<0);
    if(shot)art.addProjectileHit(player,time,{x,y:y-3,id:LEVELS[levelIndex].id,phase:boss.phase===2?1:0,
      vx:shot.vx,vy:shot.vy,kind:isNaval()?'water':'bounce',size:1});
    return result;
  };
  const originalRender=render;
  render=function(){
    const result=originalRender.apply(this,arguments);
    if(player&&boss&&!phaseShift&&!boss.shift)art.drawProjectileHits(ctx,player,time,boss);
    return result;
  };
})();
