/* Runnable stage contract fixture; excluded from campaign selector. */
Arcade.sampleStage={id:'fixture',phases:[0,1].map(n=>({name:'Fixture '+n,mode:'fixed',spawn:{x:120,y:600},objective:'Break the target',enter(w){w.platform({id:'floor',x:0,y:600,w:1280});w.target({id:'target',x:1000,y:490,w:100,h:110,hp:3,onDefeat:()=>n?w.clear():w.advancePhase()});},update(){}}))};
