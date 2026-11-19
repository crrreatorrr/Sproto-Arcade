/* Real 2x2 PNG pages through the production renderer; no canvas or image substitutions for layout. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),acorn=require('acorn');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const plain=v=>JSON.parse(JSON.stringify(v));
// Shared presentation copies (the pickup atlas) are WebP; their size comes from the RIFF header.
function webpSize(b,file){
 const kind=b.subarray(12,16).toString('latin1');
 if(kind==='VP8L')return[1+(b.readUInt32LE(21)&0x3fff),1+((b.readUInt32LE(21)>>>14)&0x3fff)];
 if(kind==='VP8X')return[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
 if(kind==='VP8 ')return[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];
 throw Error(file+' is not a recognised WebP');
}
function pngSize(file){
 const full=path.join(root,file.split('?')[0]);
 if(/\.webp$/.test(full)){const fd=fs.openSync(full,'r'),b=Buffer.alloc(30);try{fs.readSync(fd,b,0,30,0);}finally{fs.closeSync(fd);}assert.equal(b.subarray(0,4).toString('latin1'),'RIFF',file+' is a WebP');return webpSize(b,file);}
 const fd=fs.openSync(full,'r'),b=Buffer.alloc(26);
 try{assert.equal(fs.readSync(fd,b,0,b.length,0),b.length);}finally{fs.closeSync(fd);}
 assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file+' is a PNG');
 assert.equal(b[24],8);assert.equal(b[25],6,file+' has real RGBA pixels');
 return[b.readUInt32BE(16),b.readUInt32BE(20)];
}
function harness(){
 const requested=[];
 class Image{
  constructor(){this.complete=false;this.naturalWidth=this.naturalHeight=0;this.pending=new Promise((resolve,reject)=>{this.fulfill=resolve;this.fail=reject;});requested.push(this);}
  set src(value){this.url=value;this.path=value.split('?')[0];this.size=pngSize(this.path);}
  get src(){return this.url;}
  decode(){return this.pending;}
  resolve(width=this.size[0],height=this.size[1]){this.complete=true;this.naturalWidth=width;this.naturalHeight=height;this.fulfill();}
 }
 const scope=vm.createContext({Image});
 for(const f of ['levels.js','sprite-hitboxes.js','sprotel-art.js','boss-sheets.js'])vm.runInContext(read(f),scope,{filename:f});
 return{scope,art:scope.ArcadeBossSheets,requested};
}
function canvas(){
 const stack=[],calls=[];
 const c={m:[1,0,0,1,0,0],globalAlpha:1,filter:'none',calls,
  save(){stack.push({m:this.m.slice(),globalAlpha:this.globalAlpha,filter:this.filter});},
  restore(){const s=stack.pop();assert(s,'balanced canvas restore');Object.assign(this,s);},
  translate(x,y){const[a,b,d,e,f,g]=this.m;this.m=[a,b,d,e,f+a*x+d*y,g+b*x+e*y];},
  scale(x,y){const[a,b,d,e,f,g]=this.m;this.m=[a*x,b*x,d*y,e*y,f,g];},
  rotate(t){const[a,b,d,e,f,g]=this.m,co=Math.cos(t),si=Math.sin(t);this.m=[a*co+d*si,b*co+e*si,-a*si+d*co,-b*si+e*co,f,g];},
  drawImage(img,...args){assert(args.every(Number.isFinite),'finite source/destination values');calls.push({path:img.path||img.src?.split('?')[0],args,m:this.m.slice()});}
 };
 return new Proxy(c,{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
}
function sourceCell(call){const[sx,sy]=call.args;return call.path+':'+Math.floor(sx/512)+','+Math.floor(sy/512);}
function coreFromDraw(call,core){
 const[sx,sy,sw,sh,dx,dy,dw,dh]=call.args,ox=Math.floor(sx/512)*512,oy=Math.floor(sy/512)*512;
 const points=[[core[0],core[1]],[core[0]+core[2],core[1]],[core[0],core[1]+core[3]],[core[0]+core[2],core[1]+core[3]]].map(([x,y])=>{
  const px=dx+(ox+x-sx)*dw/sw,py=dy+(oy+y-sy)*dh/sh,[a,b,c,d,e,f]=call.m;
  return[a*px+c*py+e,b*px+d*py+f];
 });
 const x=Math.min(...points.map(p=>p[0])),y=Math.min(...points.map(p=>p[1]));
 return{x,y,w:Math.max(...points.map(p=>p[0]))-x,h:Math.max(...points.map(p=>p[1]))-y};
}
function closeRect(actual,expected,label){for(const k of ['x','y','w','h'])assert(Math.abs(actual[k]-expected[k])<1e-7,label+' '+k+': '+actual[k]+' != '+expected[k]);}
function checkFrame(call,animation,index){
 const columns=animation.columns,rows=animation.rows,perPage=columns*rows,page=animation.pages[Math.floor(index/perPage)],cell=index%perPage;
 const crop=animation.preservedFromMain?animation.bounds:page.bounds;
 assert.equal(call.path,page.path);
 assert.deepEqual(call.args.slice(0,4),[(cell%columns)*512+crop[0],Math.floor(cell/columns)*512+crop[1],crop[2],crop[3]]);
}
(async()=>{
 const h=harness(),{art,scope,requested}=h,config=art.entry(14);
 assert.equal(config.phaseCount,2);assert.equal(config.columns,2);assert.equal(config.rows,2);
 assert.deepEqual(Object.keys(config.animations).sort(),['beerThrow','cocktailThrow','diskLaser','idle','marlin','walk']);
 assert.deepEqual(Object.keys(config.projectileAnimations).sort(),['beer','blueMarlin','cocktail','diskLaser','heavyMarlin','nacho','popcorn','pretzel','speakerMissile']);
 let pageCount=0;
 for(const animation of [...config.phaseAnimations.flatMap(phase=>Object.values(phase)),...Object.values(config.projectileAnimations)]){
  assert.equal(animation.frameCount,16);assert.equal(animation.pages.length,16/(animation.columns*animation.rows));
  const sourceHashes=animation.frames.map(f=>f.nativeFrameSha256);
  for(const page of animation.pages){
   const size=animation.columns*512;
   assert.deepEqual(pngSize(page.path),[size,size]);assert.equal(page.width,size);assert.equal(page.height,size);assert.equal(page.columns,animation.columns);assert.equal(page.rows,animation.rows);
   if(animation.preservedFromMain){const metadata=JSON.parse(read(page.path.replace(/\.png$/,'.json')));assert.equal(metadata.frames.length,4);assert.equal(new Set(metadata.frames.map(f=>f.sourceFrameSha256)).size,4);}
   pageCount++;
  }
  assert.equal(new Set(sourceHashes).size,16,'all native source frame hashes are distinct within an animation');
 }
 assert.equal(pageCount,76);
 assert.equal(art.stageReady(14),false);
 const loading=art.preloadStage(14);assert.equal(art.preloadStage(14),loading,'concurrent requests share decoding');
 assert.equal(requested.length,77,'76 own pages plus the shared pickup atlas, without duplicate canonical pages');
 assert(requested.some(img=>img.path.includes('/p2/')),'both real phases are preloaded');
 requested.slice(0,-1).forEach(img=>img.resolve());await Promise.resolve();assert.equal(art.stageReady(14),false,'every page must finish before gameplay');
 requested.at(-1).resolve();await loading;assert.equal(art.stageReady(14),true);assert(art.phaseImage(14,1),'the second phase has approved idle art');
 const ctx=canvas(),bodyBox={x:900,y:180,w:360,h:420};
 for(const phase of [0,1])for(const[name,animation]of Object.entries(config.phaseAnimations[phase])){
  const selected=new Set();
  for(let index=0;index<16;index++){
   const pose={animation:name,frame:index},before=JSON.stringify(pose);ctx.calls.length=0;
   assert.equal(art.drawBoss(ctx,14,phase,pose,bodyBox),true);assert.equal(ctx.calls.length,1);
   checkFrame(ctx.calls[0],animation,index);selected.add(sourceCell(ctx.calls[0]));assert.equal(JSON.stringify(pose),before);
   const attachments=vm.runInContext('SPRITE_HITBOXES.stages[14]['+phase+'].provenance.projectileAttachments',scope)?.[name];
   if(attachments&&index>=8&&index<=11)for(const [shape,port] of Object.entries(attachments.ports)){
    const pixels=port.frames[index],expected=scope.sprotelProjectilePoint(phase,name,shape,index,art.legacyBox(14,phase,bodyBox));
    assert.equal(ctx.calls[0].path,attachments.page.path,'attachment pins the actual release atlas');
    closeRect(coreFromDraw(ctx.calls[0],[...pixels,0,0]),{...expected,w:0,h:0},'P'+(phase+1)+' '+name+' '+shape+' frame'+index+' attachment matches actual drawn pixels');
   }

  }
  assert.equal(selected.size,16,name+' samples all sixteen body cells across four real pages');
 }
 const variants={beer:0,cocktail:1,blueMarlin:2,heavyMarlin:2,diskLaser:0,pretzel:0,nacho:0,popcorn:0,speakerMissile:2};
 const sizes={beer:[42,54],cocktail:[38,48],blueMarlin:[100,38],heavyMarlin:[124,50],diskLaser:[120,40],pretzel:[54,40],nacho:[42,38],popcorn:[40,40],speakerMissile:[96,56]};
 for(const phase of [0,1])for(const[name,animation]of Object.entries(config.projectileAnimations)){
  if(!phase&&!animation.preservedFromMain)continue;
  const selected=new Set(),[w,h]=sizes[name],box={x:-w/2,y:-h/2,w,h};
  const active=scope.spriteHitboxProfile(14,phase,'projectiles',name,variants[name]);
  // Heavy fish is retained artwork rather than an enabled attack; its measured
  // core can still be projected through exactly the same renderer contract.
  const profile=active||{reference:animation.bounds,crop:animation.bounds,core:animation.core,visualBox:[w,h],kind:'contain',facing:'left'};
  assert.deepEqual(Array.from(profile.reference),Array.from(animation.bounds));assert.deepEqual(Array.from(profile.core),Array.from(animation.core));
  for(let index=0;index<16;index++){
   const shot={shape:name,age:index*4,vx:-6,vy:0,weaponPhase:phase,weaponVariant:variants[name]},before=JSON.stringify(shot);
   ctx.calls.length=0;assert.equal(art.drawProjectile(ctx,14,shot,box,{phaseIndex:phase,directionAngle:0}),true);
   assert.equal(ctx.calls.length,1);checkFrame(ctx.calls[0],animation,index);selected.add(sourceCell(ctx.calls[0]));assert.equal(JSON.stringify(shot),before);
   for(const angle of [-Math.PI,-.3,0,.65]){
    const c=canvas(),center={x:340,y:275};c.translate(center.x,center.y);
    assert.equal(art.drawProjectile(c,14,shot,box,{phaseIndex:phase,directionAngle:angle}),true);
    const projected=scope.spriteProjectileCoreRect(profile,center,angle,[w,h]);
    closeRect(coreFromDraw(c.calls[0],profile.core),projected,name+' story angle '+angle);
   }
   for(const direction of [-1,1]){
    const c=canvas(),center={x:340,y:275};c.translate(center.x,center.y);c.scale(direction,1);
    assert.equal(art.drawProjectile(c,14,shot,box,{phaseIndex:phase}),true);
    closeRect(coreFromDraw(c.calls[0],profile.core),scope.spriteProjectileCoreRect(profile,center,0,[w,h],{mirrorX:direction<0}),name+' modern facing '+direction);
   }
  }
  assert.equal(selected.size,16,name+' samples all sixteen projectile cells across four real pages');
 }
 // Exercise actual modern pose selection over a complete cycle, proving each
 // attack reaches every native frame without changing world/simulation fields.
 for(const f of ['density-attacks.js','phase-powerups.js','runtime/contract.js','runtime/core/world.js','stages/14-sprotel-bitcoin/stage.js'])vm.runInContext(read(f),scope,{filename:f});
 const stage=scope.Arcade.stages.get('14-sprotel-bitcoin');
 for(const phase of [0,1]){
  const world=new scope.Arcade.World(stage,{phase,practice:true,seed:37}),samples=new Map();
  for(let tick=0;tick<(phase?2160:1440);tick++){
   world.phaseTick=world.tick=tick;world.phase.update(world);
   const before=JSON.stringify(world.data),pose=art.attackPose(world);ctx.calls.length=0;
   assert(art.drawMachine(ctx,world));assert.equal(JSON.stringify(world.data),before,'drawing does not mutate simulation state');
   if(!samples.has(pose.animation))samples.set(pose.animation,new Set());samples.get(pose.animation).add(pose.frame);
   if(phase===1&&tick===124){
    assert.equal(pose.animation,'beerStick');assert.equal(pose.frame,11);
    const core=vm.runInContext('SPRITE_HITBOXES.stages[14][1].provenance.beerStickCorePixels',scope);
    closeRect(coreFromDraw(ctx.calls[0],core),scope.sprotelBeerStickRect(1,art.machineBox(world)),'melee impact uses the drawn beer head');
   }
  }
  const names=Object.keys(config.phaseAnimations[phase]).filter(name=>name!=='walk');
  for(const name of names)assert.equal(samples.get(name)?.size,16,'P'+(phase+1)+' '+name+' timeline exposes sixteen native frames');
 }
 // Run real legacy walk/pose/renderBoss functions without ART.sprites.sprotel.
 // Both a ready atlas and the ordinary fallback path must avoid the former crash.
 vm.runInContext(read('assets.js'),scope);
 const source=read('game.js'),ast=acorn.parse(source,{ecmaVersion:'latest'});
 const acts=ast.body.find(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='acts'));vm.runInContext(source.slice(acts.start,acts.end),scope);
 Object.assign(scope,{ctx,levelIndex:13,time:80,phaseShift:0,transition:50,FLOOR:604,densityShots:[],hazards:[],phaseTwoMoves:[],moves:{rush:{active:29},sprotelBeer:{active:40}},isGroundColumn:()=>false,isFlying:()=>false,isNaval:()=>false,hasMecha:()=>false,shadow(){},clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),bossWeakY:b=>b.y-222,SimMath:Math,picture(file){const[w,h]=pngSize(file);return{path:file,naturalWidth:w,naturalHeight:h};}});
 for(const node of ast.body)if(node.type==='FunctionDeclaration'&&['walk','sprite','bossSheetBox','renderBoss'].includes(node.id.name))vm.runInContext(source.slice(node.start,node.end),scope);
 vm.runInContext('if(ART.sprites.sprotel)throw Error("fixture requires missing standalone Sprotel fighter art");',scope);
 for(const phase of [1,2])for(const ready of [true,false])for(const scene of [{move:'sprotelBeer',age:145,tell:60,distance:108,moving:true},{move:'rush',age:50,tell:37,distance:-108,moving:true}]){
  config.phases[phase-1].ready=ready;scope.boss={id:'sprotel',x:1010,y:604,scale:4.4,hp:100,phase,flash:0,lanes:[],...scene};const before=JSON.stringify(scope.boss);ctx.calls.length=0;
  vm.runInContext('renderBoss()',scope);assert.equal(JSON.stringify(scope.boss),before);
  assert.equal(ctx.calls.length,1);assert.equal(ctx.calls[0].path.startsWith('art/generated/bosses/14-sprotel-bitcoin/'),ready,'real generated/fallback render path');
 }
 config.phases.forEach(p=>p.ready=true);
 // A generic mounted-release flash has only a legacy row/column. It must
 // never replace Sprotel's authored paged animation and silently show idle.
 const originalRelease=art.releasePose,originalDraw=art.drawBoss,received=[];
 art.releasePose=()=>({row:2,column:3});
 art.drawBoss=function(context,id,phase,pose,...rest){received.push(plain(pose));return originalDraw(context,id,phase,pose,...rest);};
 for(const[move,animation]of [['sprotelBeer','beerThrow'],['sprotelDrinks','cocktailThrow'],['sprotelMarlin','marlin'],['sprotelDiskLaser','diskLaser']]){
  scope.moves[move]={active:40};scope.boss={id:'sprotel',x:1010,y:604,scale:4.4,hp:100,phase:1,flash:0,lanes:[],move,age:66,tell:60,distance:0,moving:false};
  vm.runInContext('renderBoss()',scope);const selected=received.at(-1);
  assert.equal(selected.animation,animation);assert.equal(selected.frame,8,'release retains authored native frame');
 }
 art.releasePose=originalRelease;art.drawBoss=originalDraw;
 // Decode a wrong-size page once, then prove a retry reloads only that page.
 const bad=harness(),failure=bad.art.preloadStage(14);bad.requested[0].resolve(2048,2048);bad.requested.slice(1).forEach(img=>img.resolve());
 await assert.rejects(failure,/1024px/);assert.equal(bad.art.stageReady(14),false);
 const count=bad.requested.length,retry=bad.art.preloadStage(14);assert.equal(bad.requested.length,count+1);bad.requested.at(-1).resolve();await retry;assert.equal(bad.art.stageReady(14),true);
 console.log(JSON.stringify({status:'passed',kind:'sprotel-paged-animation-rendering',pages:76,nativeFrames:352,layout:'2x2 mecha; preserved 2x2 and new 4x4 projectiles',bodyAnimations:13,projectileAnimations:9,fullPoseTimelines:true,projectileCoreProjection:'story rotation and both modern facings',legacyFallbackWalk:true,measuredAttachmentsMatchDrawnFrames:true,decodeGateAndRetry:true,limitations:['Mock canvas checks real PNG dimensions, source-cell sampling and transforms; visual quality and human playtesting are separate.']},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
