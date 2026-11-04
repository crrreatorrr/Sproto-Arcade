const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const scope=vm.createContext({});
for(const file of ['runtime/contract.js','runtime/weapons/weapons.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),scope,{filename:file});
const A=scope.Arcade;
const eligible=['prism-rail','ricochet-mine','echo-decoy'];
const plain=x=>JSON.parse(JSON.stringify(x));
let checks=0;
function test(name,run){run();checks++;console.log('PASS',name);}
const pilot={x:100,y:500,hp:5,facing:1};
const equip=(w,id)=>assert.equal(w.collect({weapon:id,charges:A.weaponDefinitions[id].charges}),true);
test('seeded bag has no repeats before refill and duplicate opportunities consume nothing',()=>{
 const a=new A.Weapons({seed:73,eligible}),b=new A.Weapons({seed:73,eligible});
 const first=[];
 for(let i=0;i<12;i++){
  const p=a.opportunity('drop'+i,{x:10,y:20,guaranteed:i===0});
  assert.equal(a.opportunity('drop'+i),null);
  assert.deepEqual(plain(p),plain(b.opportunity('drop'+i,{x:10,y:20})));
  first.push(p.weapon);
 }
 for(let i=0;i<12;i+=3)assert.equal(new Set(first.slice(i,i+3)).size,3);
});
test('stage compatibility filters IDs and guarantees eligible teaching reward',()=>{
 const a=new A.Weapons({eligible:['bad','prism-rail','prism-rail']});
 assert.equal(a.opportunity('teaching',{guaranteed:true}).weapon,'prism-rail');
 assert.equal(new A.Weapons({eligible:[]}).opportunity('empty',{guaranteed:true}),null);
});
test('occupied slot replacement is deliberate and snapshots cannot mutate state',()=>{
 const w=new A.Weapons({eligible});equip(w,'prism-rail');
 assert.equal(w.collect({weapon:'echo-decoy',charges:1}),false);
 assert.equal(w.collect({weapon:'echo-decoy',charges:1},true),true);
 const snapshot=w.snapshot();snapshot.charges=99;
 assert.equal(w.snapshot().charges,1);
 assert.equal(w.collect({weapon:'ricochet-mine',charges:99},true),false);
});
test('prism committed horizontal shots pierce and consume exactly two charges',()=>{
 const effects=[],w=new A.Weapons({eligible,emit:e=>effects.push(e)});equip(w,'prism-rail');
 assert.equal(w.activate({player:pilot,blocked:true}),false);assert.equal(w.snapshot().charges,2);
 assert.equal(w.activate({player:{...pilot,facing:-1}}),true);
 assert.deepEqual(plain(effects[0]),{type:'prism',x:100,y:474,dx:-1,dy:0,damage:8,piercing:true});
 assert.equal(w.activate({player:pilot}),true);assert.equal(w.snapshot(),null);assert.equal(w.activate({player:pilot}),false);
});
test('flight prism aims at nearest open target or explicit normalized aim',()=>{
 const effects=[],w=new A.Weapons({eligible,emit:e=>effects.push(e)});equip(w,'prism-rail');
 w.activate({player:pilot,mode:'flight',targets:[{x:100,y:574,w:0,h:0,hp:2},{x:110,y:474,hp:3,open:false}]});
 assert.equal(effects[0].dx,0);assert.equal(effects[0].dy,1);
 w.activate({player:{...pilot,aim:{x:3,y:4}},mode:'orbit'});
 assert.equal(effects[1].dx,.6);assert.equal(effects[1].dy,.8);
});
test('mine launch requires supported flight bounce geometry, leaves charges on failure',()=>{
 const effects=[],w=new A.Weapons({eligible,emit:e=>effects.push(e)});equip(w,'ricochet-mine');
 assert.equal(w.activate({player:pilot,mode:'flight'}),false);assert.equal(w.snapshot().charges,2);
 assert.equal(w.activate({player:pilot,mode:'flight',platforms:[{x:0,y:600,w:300}]}),true);
 assert.deepEqual(plain(effects[0]),{type:'mine',x:100,y:486,vx:9,vy:-4,damage:6,radius:90,bounces:2});
});
test('decoy ignores fixed, shield and dash volleys and redirects only one eligible volley',()=>{
 const w=new A.Weapons({eligible});equip(w,'echo-decoy');assert.equal(w.activate({player:pilot}),true);
 for(const v of [{eligibleAim:false},{eligibleAim:true,rule:'dash'},{eligibleAim:true,rule:'shield'}])assert.equal(w.redirect(v),v);
 const volley={eligibleAim:true,rule:'ordinary',x:100,y:0,vx:10,vy:0};
 const out=w.redirect(volley);assert.notEqual(out,volley);assert.equal(out.targetX,100);assert.equal(out.targetY,474);assert.equal(out.vx,0);assert.equal(out.vy,10);
 assert.equal(volley.vx,10);assert.equal(w.redirect(volley),volley);
});
test('decoy expires on exact ttl and phase clears temporary redirect but preserves charges',()=>{
 const w=new A.Weapons({eligible});equip(w,'echo-decoy');w.activate({player:pilot,tick:20});w.tick(260);
 const v={eligibleAim:true};assert.equal(w.redirect(v),v);
 equip(w,'prism-rail');w.activate({player:pilot});w.phase('flight');assert.deepEqual(plain(w.snapshot()),{weapon:'prism-rail',charges:1});
});
test('reset clears slot, dedup and seed state; attack stream stays independent',()=>{
 const w=new A.Weapons({eligible,seed:5}),attack=A.rng(5),reference=A.rng(5);
 const first=w.opportunity('first');equip(w,'prism-rail');
 for(let i=0;i<20;i++){w.opportunity('more'+i);assert.equal(attack(),reference());}
 w.reset();assert.equal(w.snapshot(),null);assert.deepEqual(plain(w.opportunity('first')),plain(first));
});
test('rejected emission, malformed state and dead player consume no charge',()=>{
 const w=new A.Weapons({eligible,emit:()=>false});equip(w,'prism-rail');
 assert.equal(w.activate({player:pilot}),false);assert.equal(w.activate({player:{...pilot,hp:0}}),false);
 assert.equal(w.activate({player:{x:NaN,y:0}}),false);assert.equal(w.snapshot().charges,2);
});
console.log(`${checks} weapon checks passed`);
