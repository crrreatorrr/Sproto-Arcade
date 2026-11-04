/* Offline classic-script contract v1. Integration owner only. */
(function (g) {
  'use strict';
  const A = g.Arcade = {version:1, stages:new Map(), assets:new Map()};
  A.registerStage = stage => {
    if (!stage.id || stage.phases.length!==2 || A.stages.has(stage.id)) throw Error('Invalid/duplicate stage');
    A.stages.set(stage.id,stage);
  };
  A.registerAssets = pack => A.assets.set(pack.id,pack);
  A.clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  A.rng=seed=>{let n=seed>>>0;return ()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};};
})(globalThis);
