/* Native-page rendering and decode gates for the 16-frame Sprotel animations. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const bossNames=[['idle','walk','beerThrow','cocktailThrow','marlin','diskLaser'],['idle','beerStick','cocktailCannon','snacks','marlin','diskLaser','soundWave']];
const projectileNames=['beer','cocktail','blueMarlin','heavyMarlin','diskLaser','speakerMissile','pretzel','nacho','popcorn'];
function animation(prefix,projectile=false){const grid=projectile&&!['beer','cocktail','blueMarlin','heavyMarlin','diskLaser'].some(n=>prefix.endsWith('/'+n))?4:2;return{frameCount:16,columns:grid,rows:grid,facing:projectile?'left':undefined,bounds:[24,24,464,464],referenceBounds:[12,12,488,488],
 pages:Array.from({length:grid===4?1:4},(_,page)=>({path:prefix+'/'+page+'.png',width:grid===4?2048:1024,height:grid===4?2048:1024,columns:grid,rows:grid,bounds:[24,24,464,464],ready:true,version:'a'.repeat(16)}))};}
function setup(complete){const created=[];class Image{constructor(){this.complete=false;this.naturalWidth=this.naturalHeight=0;this.promise=new Promise((res,rej)=>{this.resolve=(size)=>{this.complete=true;this.naturalWidth=this.naturalHeight=size??(/projectiles\/(speakerMissile|pretzel|nacho|popcorn)\//.test(this.src)?2048:1024);res();};this.reject=()=>{this.complete=true;rej(Error('network'));};});created.push(this);}decode(){return this.promise;}}
 const data={complete,phaseAnimations:bossNames.map((names,p)=>Object.fromEntries(names.map(n=>[n,animation('boss/p'+p+'/'+n)]))),projectileAnimations:Object.fromEntries(projectileNames.map(n=>[n,animation('boss/projectiles/'+n,true)]))};
 const c=vm.createContext({Image,ArcadeSprotelArt:data});for(const name of ['sprite-hitboxes.js','boss-sheets.js'])vm.runInContext(fs.readFileSync(name,'utf8'),c,{filename:name});c.ArcadeBossSheets.pickupAsset.ready=false;return{created,c,art:c.ArcadeBossSheets,data};}
(async()=>{
 const pending=setup(false);assert.equal(pending.art.stageReady(14),false);await assert.rejects(pending.art.preloadStage(14),/not complete/);assert.equal(pending.created.length,0,'pending art is never requested');
 const {created,c,art}=setup(true);assert.equal(art.stageReady(14),false);
 const first=art.preloadStage(14);assert.equal(art.preloadStage(14),first);assert.equal(created.length,76,'all52 mecha pages and24 projectile pages load exactly once');
 const failed=created.find(i=>i.src.includes('p1/beerStick/2.png'));assert(failed);
 for(const img of created)if(img!==failed)img.resolve();failed.reject();await assert.rejects(first,/network/);assert.equal(art.stageReady(14),false);
 const before=created.length,retry=art.preloadStage(14);assert.equal(created.length-before,1,'only the failed page is retried');created.at(-1).resolve();await retry;assert.equal(art.stageReady(14),true);
 await art.preloadStage(14);assert.equal(created.length,before+1,'warm phase retry reuses decoded pages');
 const calls=[],ctx={save(){},restore(){},translate(){},scale(...v){calls.push({scale:v});},rotate(...v){calls.push({rotate:v});},drawImage(img,...args){calls.push({path:img.src,args});}};
 for(const phase of [0,1])for(const frame of [0,3,4,7,8,11,12,15]){
  calls.length=0;assert.equal(art.drawBoss(ctx,14,phase,{animation:'idle',frame},{x:900,y:180,w:360,h:420}),true);
  const draw=calls.find(x=>x.path);assert(draw.path.includes('/p'+phase+'/idle/'+Math.floor(frame/4)+'.png'));
  assert.equal(draw.args[0],frame%2*512+24);assert.equal(draw.args[1],Math.floor(frame%4/2)*512+24);
 }
 const world={stage:{id:'14-sprotel-bitcoin'},phaseIndex:1,phaseTick:600,tick:600,data:{mechX:620,action:'beerStick',actionAge:90,actionTell:90,actionActive:32,actionRest:48}};
 const snapshot=JSON.stringify(world);assert.equal(art.attackPose(world).frame,8);assert.equal(art.machineBox(world).x,550);
 calls.length=0;assert.equal(art.drawMachine(ctx,world),true);assert(calls.find(x=>x.path).path.includes('/p1/beerStick/2.png'));assert.equal(JSON.stringify(world),snapshot);
 assert.equal(art.releasePose({id:'sprotel'},1,600),undefined,'generic four-frame release never replaces a 16-frame authored pose');
 for(let frame=0;frame<16;frame++){
  calls.length=0;assert.equal(art.drawProjectile(ctx,14,{shape:'speakerMissile',age:frame*4,vx:-3.6,vy:0},{x:-48,y:-28,w:96,h:56},{phaseIndex:1,directionAngle:Math.PI}),true);
  const draw=calls.find(x=>x.path);assert(draw.path.includes('/projectiles/speakerMissile/0.png'));assert.equal(draw.args[0],frame%4*512+24);assert.equal(draw.args[1],Math.floor(frame/4)*512+24);
  assert.equal(calls.filter(x=>x.scale).length,1);assert.deepEqual(calls.find(x=>x.rotate).rotate,[Math.PI]);
 }
 // Released Phase 1 projectiles retain four native 2x2 pages, alongside Phase 2's 4x4 sheets.
 for(let frame=0;frame<16;frame++){
  calls.length=0;assert(art.drawProjectile(ctx,14,{shape:'beer',age:frame*4,vx:-5,vy:0},{x:0,y:0,w:42,h:54},{phaseIndex:0}));
  const draw=calls.find(x=>x.path);assert(draw.path.includes('/projectiles/beer/'+Math.floor(frame/4)+'.png'));assert.equal(draw.args[0],frame%2*512+24);assert.equal(draw.args[1],Math.floor(frame%4/2)*512+24);
 }
 const accepted=JSON.parse(fs.readFileSync('art/generated/bosses/14-sprotel-bitcoin/animation-manifest.json','utf8')),combined=JSON.parse(fs.readFileSync('art/generated/bosses/14-sprotel-bitcoin/manifest.json','utf8'));
 for(const [name,animation] of Object.entries(accepted.animations)){const key=({beer:'beerThrow',cocktail:'cocktailThrow','disk-laser':'diskLaser'})[name]||name;assert.deepEqual(combined.phaseAnimations[0][key].pages.map(p=>[p.path,p.version,p.sha256]),animation.pages.map(p=>[p.path,p.version,p.atlasSha256]));}
 const preserved=JSON.parse(fs.readFileSync('art/reference/20261117-sprotel-bitcoin/preserved-main-a4d85ae/geometry.json','utf8')),current=JSON.parse(JSON.stringify(vm.runInContext('SPRITE_HITBOXES.stages[14][0]',c)));
 assert(current.provenance.projectileAttachments,'the new spawn attachments are additive provenance');delete current.provenance.projectileAttachments;
 assert.deepEqual(current,preserved,'released phase one collision geometry remains exact');
 const broken=setup(true),load=broken.art.preloadStage(14);broken.created[0].resolve(2048);broken.created.slice(1).forEach(i=>i.resolve());await assert.rejects(load,/1024px/);assert.equal(broken.art.stageReady(14),false,'wrong-size pages cannot start gameplay');
 console.log('PASS16-frame2x2 mecha paging,4x4 projectiles,all-page decode/retry,gated incomplete art and immutable authored poses');
})().catch(e=>{console.error(e);process.exitCode=1;});
