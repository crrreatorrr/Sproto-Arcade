/* Fixed-screen Sproto bouts. All enemy attacks use their collision boxes as art. */
(function (A) {
  'use strict';
  const floor = 600;
  const attacks = {
    'special-morelight': [
      ['Prism wave · jump', (w, box, fast) => box(1000, 560, 48, 40, -9-fast)],
      ['Split light · weave between rays', (w, box, fast) => {
        for (const vy of [-3, 0, 3]) box(1000, 474, 24, 24, -9-fast, vy);
      }]
    ],
    'special-artchick': [
      ['Paint rain · leave the marked columns', (w, box, fast) => {
        const x = A.clamp(w.player.x-22, 40, 870);
        for (const offset of [-140, 0, 140]) box(x+offset, 176, 44, 64, 0, 7+fast);
      }],
      ['Brushstroke · jump the broad sweep', (w, box, fast) => box(1000, 571, 125, 29, -8-fast)]
    ],
    'special-nick': [
      ['Trick shot · dodge the aimed box', (w, box, fast) => {
        const dx = w.player.x-1000, dy = w.player.y-26-486;
        const speed = (10+fast)/Math.hypot(dx,dy);
        box(1000, 486, 34, 34, dx*speed, dy*speed);
      }],
      ['Double rush · jump, then jump again', (w, box, fast) => {
        box(1000, 530, 54, 70, -10-fast);
        box(1100, 490, 54, 110, -10-fast);
      }]
    ],
    'special-vmu': [
      ['Screen laser · double jump over the low beam', (w, box) => box(20, 508, 980, 92, 0, 0, 22)],
      ['Pixel gates · jump the low box or stay under the high box', (w, box, fast) => {
        box(1000, 554, 52, 46, -9-fast);
        box(1230, 365, 52, 147, -9-fast);
      }]
    ]
  };

  function phase(boss, round) {
    const hp = round === 1 ? 48 : 62;
    const interval = round === 1 ? 126 : 94;
    return {
      name: 'Round '+round,
      mode: 'fixed',
      camera: 'fixed',
      spawn: {x:230,y:floor},
      objective: 'Evade the boxes. Your Sproto shoots automatically.',
      hudLabel: 'BOSS DAMAGE',
      drawsTargetLabels: true,
      drawsPilot: true,
      enter(w) {
        w.platform({id:'floor',x:0,y:floor,w:1280,h:80});
        w.data.boss = w.target({
          id:boss.id,x:1000,y:338,w:180,h:262,hp,
          onDefeat(world) { world.progress=1; world.advancePhase(); }
        });
      },
      update(w) {
        w.progress = 1-w.data.boss.hp/hp;
        if (w.phaseTick%interval !== 40) return;
        const turn = Math.floor(w.phaseTick/interval);
        const [cue,fire] = attacks[boss.id][(turn+round-1)%2];
        w.cue(cue,interval-5);
        let shot = 0;
        fire(w, (x,y,width,height,vx,vy=0,active=180) => {
          w.hazard({
            id:`${boss.id}-${turn}-${shot++}`,source:cue,x,y,w:width,h:height,vx,vy,
            windup:round===1?42:32,active,color:boss.color
          });
        }, round-1);
      }
    };
  }

  for (const [index,boss] of SPECIAL_BOSSES.entries()) {
    A.registerStage({
      id:boss.id,number:13+index,title:boss.name,operator:boss.name,operatorSprite:boss.sprite,
      color:boss.color,specialBoss:true,phases:[phase(boss,1),phase(boss,2)]
    });
  }
})(Arcade);
