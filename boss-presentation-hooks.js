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
  const originalFire=fire;
  fire=function(){
    const first=bullets?.length||0,own=arguments[5];
    const meta=!own?binding(isChase()?'chase':isCodebreak()?'codebreak':'regular'):null;
    const result=originalFire.apply(this,arguments);
    if(meta)for(let i=first;i<(bullets?.length||0);i++)art.bindShot(bullets[i],meta);
    return result;
  };
  const originalUpdateBoss=updateBoss;
  updateBoss=function(){
    const first=hazards?.length||0,previousBeam=vaultBeam,meta=binding('regular');
    const result=originalUpdateBoss.apply(this,arguments);
    for(let i=first;i<(hazards?.length||0);i++)art.bindShot(hazards[i],meta);
    if(vaultBeam&&vaultBeam!==previousBeam)art.bindShot(vaultBeam,meta);
    return result;
  };
  const originalCodeAttack=updateCodeAttack;
  updateCodeAttack=function(){
    const first=codeShots.length,meta=binding('codebreak');
    const result=originalCodeAttack.apply(this,arguments);
    for(let i=first;i<codeShots.length;i++)art.bindShot(codeShots[i],meta);
    return result;
  };
})();
