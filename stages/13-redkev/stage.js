/* Redkev inherits Marina's exact phase mechanics; identity and art remain ID13. */
(function(A){'use strict';
 const source=A.stages.get('01-marina');
 if(!source)throw Error('Redkev requires Marina mechanics to load first');
 A.registerStage({...source,id:'13-redkev',number:13,order:1.5,mechanics:1,
  enabled:()=>typeof REDKEV_READY!=='undefined'&&REDKEV_READY,
  title:"Redkev's Marina",operator:'Redkev',operatorSprite:'redkev',
  phases:source.phases.map((p,index)=>({...p,machine:index?'Red Siege Cruiser':'Red Interceptor',enter(w){p.enter(w);w.cueText=w.cueText.replace(/Dave/g,'Redkev');}}))
 });
})(Arcade);
