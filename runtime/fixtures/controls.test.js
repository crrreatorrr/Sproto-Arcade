// Controller settings (controls.js): the binding model, what is saved, and the live key layer that
// turns a remapped key into the code the game reads. Node only; qa/menus-browser.mjs drives the
// real pages.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'controls.js'),'utf8');
const K=require(path.join(root,'controls.js'));
const J=v=>JSON.parse(JSON.stringify(v));
let checks=0;const check=(name,fn)=>{fn();checks++;};

check('defaults mirror the games\' fixed keys and the controller layout',()=>{
 const s=K.defaults('story');
 assert.deepEqual(s.keys.left,['ArrowLeft','KeyA']);assert.deepEqual(s.keys.dash,['ShiftLeft','ShiftRight']);assert.deepEqual(s.keys.pause,['Escape',null]);
 assert.deepEqual(s.pad.dash,['B','RT']);assert.equal(s.pad.left,undefined,'movement stays on the stick and D-pad');assert.equal(s.deadzone,0.2);
 const t=K.defaults('trials');assert.deepEqual(t.keys.retry,['KeyR',null]);assert.deepEqual(t.pad.retry,[null,null],'instant retry starts off the pad');
 assert.ok(K.allDefault(s,'story')&&K.allDefault(t,'trials'));
});
check('every action has a unique canonical code and no default is used twice',()=>{
 for(const p of Object.values(K.PROFILES)){
  const canon=p.actions.map(a=>a.canonical);assert.equal(new Set(canon).size,canon.length,p.name);
  const keys=p.actions.flatMap(a=>a.keys);assert.equal(new Set(keys).size,keys.length,p.name);
  const pads=p.actions.flatMap(a=>a.pad||[]);assert.equal(new Set(pads).size,pads.length,p.name);
  for(const a of p.actions)assert.ok(a.keys.includes(a.canonical),a.id+' reads its own default key');
 }
});
check('binding swaps a key another action holds, strict mode refuses it',()=>{
 const s=K.defaults('story');
 const r=K.bindKey(s,'story','jump',0,'KeyX');
 assert.ok(r.ok);assert.deepEqual(J(r.state.keys.jump),['KeyX',null]);assert.deepEqual(J(r.state.keys.shield),['Space',null]);assert.deepEqual(J(r.swapped),{action:'shield',slot:0,code:'Space'});
 assert.deepEqual(s.keys.jump,['Space',null],'the old state is not mutated');
 const strict=K.bindKey(s,'trials','dash',0,'KeyX',true);assert.equal(strict.ok,false);assert.match(strict.reason,/Shield/);
 const free=K.bindKey(K.defaults('trials'),'trials','dash',0,'KeyQ',true);assert.ok(free.ok);assert.deepEqual(J(free.state.keys.dash),['KeyQ','ShiftRight']);
 const within=K.bindKey(K.defaults('story'),'story','dash',0,'ShiftRight');assert.deepEqual(J(within.state.keys.dash),['ShiftRight','ShiftLeft'],'a key moves within its own action');
 const empty=K.bindKey(K.defaults('story'),'story','jump',1,'KeyX');assert.deepEqual(J(empty.state.keys.shield),[null,null]);assert.equal(empty.swapped.code,null,'a swap into an empty slot leaves the other action without that key');
});
check('reserved and fixed keys cannot be bound',()=>{
 const s=K.defaults('story');
 for(const code of ['Escape','KeyN','F11','Tab','Backspace'])assert.equal(K.bindKey(s,'story','jump',0,code).ok,false,code);
 assert.equal(K.bindKey(s,'story','pause',0,'KeyP').ok,false,'Esc always pauses');
 const p=K.bindKey(s,'story','pause',1,'KeyP');assert.ok(p.ok);assert.equal(K.translate(p.state,'story','KeyP'),'Escape','a second pause key sends Esc');
 assert.equal(K.bindPad(s,'story','jump',0,'MENU').ok,false,'Start always pauses');
 assert.equal(K.bindPad(s,'story','jump',0,'UP').ok,false,'the D-pad always moves');
 assert.equal(K.bindPad(s,'story','jump',0,'HOME').ok,false);
 assert.equal(K.bindKey(s,'story','left',0,'bad code!').ok,false);
});
check('translate: remapped keys become canonical codes, moved defaults are swallowed, other keys are left alone',()=>{
 let s=K.bindKey(K.defaults('story'),'story','dash',0,'KeyQ').state;s=K.clearSlot(s,'story','keys','dash',1).state;
 assert.equal(K.translate(s,'story','KeyQ'),'ShiftLeft');
 assert.equal(K.translate(s,'story','ShiftLeft'),'','old dash key no longer dashes');
 assert.equal(K.translate(s,'story','ShiftRight'),'');
 assert.equal(K.translate(s,'story','KeyA'),'ArrowLeft');assert.equal(K.translate(s,'story','KeyW'),'ArrowUp','W stays up, which also jumps on foot');
 assert.equal(K.translate(s,'story','KeyN'),null);assert.equal(K.translate(s,'story','Digit9'),null);
});
check('pad layout follows the bindings and matches gamepad.js by default',()=>{
 const G=require(path.join(root,'gamepad.js'));
 assert.deepEqual(J(K.padButtons(K.defaults('story'),'story')),J(G.PROFILES.story.buttons));
 const t=J(G.PROFILES.trials.buttons);for(const k of Object.keys(t))t[k]=t[k].map(c=>c==='$dash'?'ShiftLeft':c);
 assert.deepEqual(J(K.padButtons(K.defaults('trials'),'trials')),t);
 const r=K.bindPad(K.defaults('story'),'story','shield',1,'LB');assert.deepEqual(J(K.padButtons(r.state,'story').LB),['KeyX']);assert.equal(K.padButtons(r.state,'story').LT,undefined);
});
check('normalize: garbage, reserved codes, duplicates and fixed slots are repaired',()=>{
 for(const raw of [null,'x',42,[],{keys:'no'},{keys:{jump:'Space'}}])assert.deepEqual(J(K.normalize(raw,'story')),J(K.defaults('story')));
 const n=K.normalize({keys:{jump:['KeyQ','KeyN'],dash:['KeyQ','ShiftLeft'],pause:['KeyP','KeyO'],nope:['KeyZ']},pad:{jump:['Y','HOME'],missile:['Y',null]},deadzone:9},'story');
 assert.deepEqual(n.keys.jump,['KeyQ',null],'N is reserved');assert.deepEqual(n.keys.dash,[null,'ShiftLeft'],'Q stays with its first action');
 assert.deepEqual(n.keys.pause,['Escape','KeyO'],'Esc stays first');assert.equal(n.keys.nope,undefined);
 assert.deepEqual(n.pad.jump,['Y',null]);assert.deepEqual(n.pad.missile,[null,null],'Y stays with jump');assert.equal(n.deadzone,0.5);
 assert.equal(K.normalize({deadzone:'x'},'story').deadzone,0.2);assert.equal(K.normalize({deadzone:0},'story').deadzone,0.05);
 const round=K.normalize(JSON.parse(JSON.stringify(K.serialize(n))),'story');assert.deepEqual(J(round),J(n),'serialize/normalize round trip');
});
check('labels',()=>{
 assert.equal(K.keyLabel('KeyQ'),'Q');assert.equal(K.keyLabel('ShiftLeft'),'Shift');assert.equal(K.keyLabel('ArrowDown'),'↓');assert.equal(K.keyLabel('Digit4'),'4');assert.equal(K.keyLabel(null),'—');
 assert.equal(K.padLabel('VIEW'),'View');assert.equal(K.padLabel('MENU'),'Start');
});

// ---- The browser layer with a stand-in window: storage, capture and live translation.
function page(profile,{stored,throwing=false,playing=true}={}){
 const listeners={},sent=[],store=new Map(stored?[['sproto-arcade-controls-v1:'+profile,stored]]:[]);
 class KeyboardEvent{constructor(type,init){Object.assign(this,init,{type,isTrusted:false});}}
 const win={KeyboardEvent,console,
  localStorage:{getItem:k=>{if(throwing)throw Error('blocked');return store.has(k)?store.get(k):null;},setItem:(k,v)=>{if(throwing)throw Error('blocked');store.set(k,v);}},
  addEventListener:(t,f)=>(listeners[t]??=[]).push(f),dispatchEvent:e=>{sent.push(e.type+':'+e.code+(e.repeat?':repeat':''));return true;}};
 const doc={currentScript:{dataset:{profile}},getElementById:()=>({hidden:true})};
 const ctx=vm.createContext({...win,document:doc,mode:playing?'play':'title'});
 Object.assign(ctx,{addEventListener:win.addEventListener,dispatchEvent:win.dispatchEvent});
 if(profile==='trials')ctx.ArcadeApp={world:{state:'playing'},paused:!playing};
 vm.runInContext(source,ctx);
 const key=(type,code,extra={})=>{const e={type,code,key:code,isTrusted:true,repeat:false,target:{tagName:'BODY'},stopped:false,immediate:false,prevented:false,
  stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.immediate=true;this.stopped=true;},preventDefault(){this.prevented=true;},...extra};
  for(const f of listeners[type]||[])f(e);return e;};
 return {C:ctx.ArcadeControls,ctx,sent,store,key};
}
check('defaults: no translation at all, so the game sees exactly the real keys',()=>{
 const {key,sent}=page('story');
 for(const code of ['KeyA','ShiftRight','KeyW','Space']){const e=key('keydown',code);assert.equal(e.stopped,false,code);key('keyup',code);}
 assert.deepEqual(sent,[]);
});
check('a remap saves under the page key, applies live and survives a reload',()=>{
 const p=page('story');
 p.C.bindKey('dash',0,'KeyQ');p.C.clearKey('dash',1);
 const saved=JSON.parse(p.store.get('sproto-arcade-controls-v1:story'));assert.deepEqual(saved.keys.dash,['KeyQ',null]);
 let e=p.key('keydown','KeyQ');assert.ok(e.stopped&&e.prevented);assert.deepEqual(p.sent,['keydown:ShiftLeft']);
 e=p.key('keyup','KeyQ');assert.ok(e.stopped);assert.deepEqual(p.sent,['keydown:ShiftLeft','keyup:ShiftLeft']);
 e=p.key('keydown','ShiftLeft');assert.ok(e.stopped,'Shift is swallowed');p.key('keyup','ShiftLeft');assert.equal(p.sent.length,2);
 const again=page('story',{stored:p.store.get('sproto-arcade-controls-v1:story')});assert.deepEqual(J(again.C.state).keys.dash,['KeyQ',null]);
 const trials=page('trials');assert.equal(trials.C.storageKey,'sproto-arcade-controls-v1:trials','Machine Trials keeps its own bindings');assert.deepEqual(J(trials.C.state).keys.dash,['ShiftLeft','ShiftRight']);
});
check('two keys on one action: the game sees one release, after the last key goes up',()=>{
 const p=page('story');p.C.bindKey('left',1,'KeyJ');
 p.key('keydown','ArrowLeft');p.key('keydown','KeyJ');assert.deepEqual(p.sent,['keydown:ArrowLeft']);
 const up=p.key('keyup','ArrowLeft');assert.ok(up.stopped,'ArrowLeft up is held back while J holds left');
 p.key('keyup','KeyJ');assert.deepEqual(p.sent,['keydown:ArrowLeft','keyup:ArrowLeft']);
});
check('menus, typed fields and modifiers are never translated',()=>{
 const p=page('story',{playing:false});p.C.bindKey('jump',0,'KeyJ');
 assert.equal(p.key('keydown','KeyJ').stopped,false);
 const q=page('story');q.C.bindKey('jump',0,'KeyJ');
 assert.equal(q.key('keydown','KeyJ',{target:{tagName:'INPUT'}}).stopped,false);assert.equal(q.key('keydown','KeyJ',{ctrlKey:true}).stopped,false);
 const pausedTrials=page('trials',{playing:false});pausedTrials.C.bindKey('pause',1,'KeyP');pausedTrials.key('keydown','KeyP');assert.deepEqual(pausedTrials.sent,['keydown:Escape'],'the extra pause key also resumes');
});
check('press-to-bind: Esc cancels, reserved keys are refused, the key is consumed, pad B cancels a key',()=>{
 const p=page('trials'),log=[];let done=null;
 p.C.beginCapture({action:'jump',slot:0,device:'key',message:t=>log.push(t),done:(r,t)=>{done={r,t};}});
 assert.ok(p.C.capturing);
 let e=p.key('keydown','KeyN');assert.ok(e.immediate,'the feedback key never reaches the page');assert.match(log.at(-1),/N twice sends feedback/);assert.ok(p.C.capturing);
 e=p.key('keydown','KeyJ',{repeat:true});assert.ok(p.C.capturing,'a repeat does not bind');
 e=p.key('keydown','KeyJ');assert.equal(p.C.capturing,null);assert.deepEqual(J(p.C.state).keys.jump,['KeyJ',null]);assert.equal(done.r.code,'KeyJ');
 assert.ok(p.key('keyup','KeyJ').immediate,'its keyup is consumed too');assert.deepEqual(p.sent,[]);
 p.C.beginCapture({action:'jump',slot:0,device:'key',done:(r)=>{done={r};}});p.key('keydown','Escape');assert.equal(done.r.cancelled,true);assert.deepEqual(J(p.C.state).keys.jump,['KeyJ',null]);
 p.C.beginCapture({action:'jump',slot:0,device:'key',done:(r)=>{done={r};}});p.C.capturePad('B');assert.equal(done.r.cancelled,true,'B cancels a key slot');
 p.C.beginCapture({action:'jump',slot:0,device:'pad',done:(r)=>{done={r};}});p.C.capturePad('UP');assert.ok(p.C.capturing,'D-pad refused');p.C.capturePad('B');
 assert.deepEqual(J(p.C.state).pad.jump,['B',null]);assert.deepEqual(J(p.C.state).pad.dash,['A','RT'],'B was dash: dash takes A');
 p.C.beginCapture({action:'jump',slot:0,device:'pad',done:(r)=>{done={r};}});p.C.capturePad('MENU');assert.equal(done.r.cancelled,true,'Start cancels a button slot');
 p.C.beginCapture({action:'jump',slot:0,device:'key'});p.key('keydown','Backspace');assert.deepEqual(J(p.C.state).keys.jump,[null,null],'Backspace clears');
 p.C.reset();assert.ok(p.C.allDefault());
 p.C.setDeadzone(0.35);assert.equal(p.C.deadzone,0.35);p.C.setDeadzone(3);assert.equal(p.C.deadzone,0.5);
});
check('prompts keep the game\'s own wording until the player changes a binding',()=>{
 const p=page('story');assert.equal(p.C.prompt('shield','X'),'X');assert.equal(p.C.padPrompt('shield','X / LT'),'X / LT');
 p.C.bindKey('shield',0,'KeyK');assert.equal(p.C.prompt('shield','X'),'K');p.C.bindPad('shield',1,'RB');assert.equal(p.C.padPrompt('shield','X / LT'),'X / RB');
 p.C.clearKey('shield',0);assert.equal(p.C.prompt('shield','X'),'unbound');
});
check('blocked storage: defaults load and changes still apply for the session',()=>{
 const p=page('story',{throwing:true});assert.ok(p.C.allDefault());p.C.bindKey('jump',0,'KeyJ');assert.deepEqual(J(p.C.state).keys.jump,['KeyJ',null]);
 p.key('keydown','KeyJ');assert.deepEqual(p.sent,['keydown:Space']);
});
console.log(JSON.stringify({status:'passed',kind:'controls',checks}));
