/* Presentation only. No simulation state, collision bounds or random streams are changed here. */
(function(root){
  'use strict';
  const folders=['01-marina-bront','02-last-light-vela','03-mudline-crapto','04-ranch-zephyr','05-neon-sproto102','06-circuit-rune','07-moonkeep-bigswole','08-crown-alpha777','09-hatchery-highsproto','10-verse-sprotosales','11-rooftop-sproto1668','12-codebreak-sproto3106','13-redkev-guest09'];
  // Enable each file only after generation, transparent-background cleanup and visual QA.
  // A planned file is never requested by the game or presented as delivered production art.
  const manifest=Object.fromEntries(folders.map((folder,index)=>[index+1,{
    folder,columns:4,rows:4,framesPerSecond:10,
    phases:[{path:`art/generated/bosses/${folder}/p1.png`,ready:false},{path:`art/generated/bosses/${folder}/p2.png`,ready:false}],
    projectiles:[{path:`art/generated/bosses/${folder}/p1-projectiles.png`,ready:false},{path:`art/generated/bosses/${folder}/p2-projectiles.png`,ready:false}],
    // A sheet contains its own pilot. Do not composite a second character over its cockpit.
    includesPilot:true,projectileFacing:'left',projectileRows:{attackA:0,attackB:1,attackC:2,heavy:3}
  }]));
  const attackSources={
    1:[['marina.breakwater-slam.wake'],['marina.pressure-lock.front'],['marina-dock-spray','marina-slow-missile']],
    2:[['light.iris-shot.beam','light.house-of-mirrors.beam'],['light.iris-shot.reprise'],['light-prism-motes','light-slow-missile']],
    3:[['sludge-belch','pump-sludge-belch'],['backflush-front'],['mudline-silt','mudline-slow-missile']],
    4:[['ranch.harvest-roll'],['ranch.uncouple.dash'],['ranch.engine-pressure','ranch-slow-missile']],
    5:[['neon.magnet-snatch'],['neon.billboard-shuffle'],['neon.street-pressure','neon-slow-missile']],
    6:[['circuit.relay-arc.discharge'],['circuit.firewall-transfer.front'],['circuit-slow-missile']],
    7:[['07-moonkeep/iron-fang'],['rampart'],['moonkeep-rampart','moonkeep-slow-missile']],
    8:[['crown.jackpot-pulse.shield'],['crown.royal-joust.front'],['crown-reel-spill','crown-slow-missile']],
    9:[['09-hatchery/hatch-timer'],['09-hatchery/brood-conveyor'],['hatchery-spores','hatchery-slow-missile']],
    10:[['demo-drone-volley','showroom-side-volley'],['demo-rift','showroom-demo-rift'],['verse-exhibits','verse-slow-missile']],
    11:[['goldie.afterburner.aimed-shot','goldie.cutoff.aimed-shot'],['goldie.afterburner.dash-crossing','goldie.cutoff.final-crossing'],['goldie.afterburner.returning-burst','goldie.extraction']],
    12:[['12-codebreak/warrant-drop'],['12-codebreak/summit-scanner','12-codebreak/upper-crossing'],['codebreak-warrants','codebreak-slow-missile']]
  };
  attackSources[13]=attackSources[1];
  for(const [id,config]of Object.entries(manifest))config.attackSources=attackSources[id];
  Object.assign(manifest[13].phases[0],{"ready":true,"bounds":[3,221,505,288],"legacyOffset":[-5,-1],"legacyScale":[1.05,1],"modernBox":[943,290,327,310]});
  Object.assign(manifest[13].phases[1],{"ready":true,"bounds":[3,167,506,342],"legacyOffset":[0,-8],"legacyScale":[1,1],"modernBox":[930,290,340,310]});
  Object.assign(manifest[13].projectiles[0],{"bounds":[12,98,488,402],"rowBounds":[[118,193,277,212],[12,261,487,77],[55,98,403,402],[13,203,487,202]],"facing":"right","ready":true});
  Object.assign(manifest[13].projectiles[1],{"bounds":[12,133,488,367],"rowBounds":[[142,239,225,155],[13,238,485,154],[71,133,367,367],[12,191,488,248]],"facing":"left","ready":true});
  Object.assign(manifest[1].phases[0],{ready:true,bounds:[12,179,488,321]});
  Object.assign(manifest[1].phases[1],{ready:true,bounds:[12,95,488,405]});
  Object.assign(manifest[1].projectiles[0],{ready:true,bounds:[12,116,488,384],rowBounds:[[143,245,216,130],[12,239,474,138],[30,116,437,384],[26,194,474,261]],facing:'left'});
  Object.assign(manifest[1].projectiles[1],{ready:true,bounds:[12,63,488,437],rowBounds:[[12,192,488,179],[81,105,357,345],[18,63,477,437],[23,104,471,338]],facing:'left'});
  Object.assign(manifest[2].phases[0],{ready:true,bounds:[19,12,473,488]});
  Object.assign(manifest[2].phases[1],{ready:true,bounds:[38,12,436,488]});
  Object.assign(manifest[2].projectiles[0],{ready:true,bounds:[12,46,488,454],rowBounds:[[50,162,424,220],[121,120,282,305],[12,46,488,454],[18,59,473,427]],facing:'left'});
  Object.assign(manifest[2].projectiles[1],{ready:true,bounds:[12,30,488,470],rowBounds:[[13,167,464,208],[78,108,347,308],[25,30,468,470],[12,34,488,457]],facing:'left'});
  Object.assign(manifest[3].phases[0],{ready:true,bounds:[12,189,488,311]});
  Object.assign(manifest[3].phases[1],{ready:true,bounds:[26,12,460,488],legacyOffset:[-12,0]});
  Object.assign(manifest[3].projectiles[0],{ready:true,bounds:[20,12,472,488],rowBounds:[[20,129,471,249],[110,112,290,289],[23,92,469,335],[26,12,461,488]],facing:'left'});
  Object.assign(manifest[3].projectiles[1],{ready:true,bounds:[12,147,488,353],rowBounds:[[13,223,487,191],[122,251,266,144],[12,147,487,353],[13,220,485,206]],facing:'left'});
  Object.assign(manifest[4].phases[0],{ready:true,bounds:[12,155,488,345],legacyOffset:[-73,0]});
  Object.assign(manifest[4].phases[1],{ready:true,bounds:[12,182,488,318],legacyOffset:[-73,0]});
  Object.assign(manifest[4].projectiles[1],{ready:true,bounds:[12,72,488,428],rowBounds:[[12,207,488,184],[134,139,239,284],[46,139,395,305],[43,72,412,428]],facing:'left'});
  Object.assign(manifest[4].projectiles[0],{ready:true,bounds:[12,97,488,403],rowBounds:[[12,197,488,192],[148,155,214,232],[19,161,469,276],[51,97,405,403]],facing:'left'});
  Object.assign(manifest[5].phases[0],{ready:true,bounds:[12,239,488,261],legacyScale:[1.2,1],legacyOffset:[-20,0]});
  Object.assign(manifest[5].phases[1],{ready:true,bounds:[12,56,488,444]});
  Object.assign(manifest[5].projectiles[0],{ready:true,bounds:[12,101,488,399],rowBounds:[[12,234,488,158],[176,235,135,137],[36,101,401,399],[76,136,319,324]],facing:'left'});
  Object.assign(manifest[5].projectiles[1],{ready:true,bounds:[12,146,488,354],rowBounds:[[12,270,488,107],[136,245,257,157],[52,146,404,354],[77,235,354,180]],facing:'left'});
  Object.assign(manifest[6].phases[0],{ready:true,bounds:[44,12,423,488]});
  Object.assign(manifest[6].phases[1],{ready:true,bounds:[20,12,471,488]});
  Object.assign(manifest[7].phases[0],{ready:true,bounds:[12,119,488,381]});
  Object.assign(manifest[7].phases[1],{ready:true,bounds:[12,118,488,382]});
  Object.assign(manifest[7].projectiles[0],{ready:true,bounds:[12,146,488,354],rowBounds:[[77,182,354,282],[12,267,480,113],[41,146,435,354],[13,149,487,349]],facing:'left'});
  Object.assign(manifest[7].projectiles[1],{ready:true,bounds:[14,46,486,454],rowBounds:[[14,164,486,211],[14,165,486,212],[26,46,454,454],[22,60,474,418]],facing:'left'});
  Object.assign(manifest[8].phases[0],{ready:true,bounds:[12,154,488,346]});
  Object.assign(manifest[8].phases[1],{ready:true,bounds:[12,43,488,456]});
  Object.assign(manifest[8].projectiles[0],{ready:true,bounds:[16,12,480,488],rowBounds:[[109,105,313,310],[18,111,460,300],[20,37,470,456],[16,12,480,488]],facing:'left'});
  Object.assign(manifest[8].projectiles[1],{ready:true,bounds:[12,96,488,404],rowBounds:[[12,162,488,260],[102,96,347,354],[34,99,464,371],[13,101,456,399]],facing:'left'});
  Object.assign(manifest[9].phases[0],{ready:true,bounds:[12,39,488,461]});
  Object.assign(manifest[9].phases[1],{ready:true,bounds:[12,92,488,408]});
  Object.assign(manifest[9].projectiles[0],{ready:true,bounds:[12,36,488,464],rowBounds:[[50,124,394,295],[12,136,481,275],[17,36,483,461],[15,43,453,457]],facing:'left'});
  Object.assign(manifest[10].phases[0],{ready:true,bounds:[12,217,488,283],legacyScale:[1.3,1],legacyOffset:[-40,0]});
  Object.assign(manifest[10].phases[1],{ready:true,bounds:[12,46,488,454]});
  Object.assign(manifest[11].phases[0],{ready:true,bounds:[12,211,488,289]});
  Object.assign(manifest[11].phases[1],{ready:true,bounds:[12,183,488,317]});
  Object.assign(manifest[12].phases[0],{ready:true,bounds:[12,74,488,426]});
  Object.assign(manifest[12].phases[1],{ready:true,bounds:[28,12,456,488]});
  Object.assign(manifest[6].projectiles[0],{ready:true,bounds:[12,83,488,417],rowBounds:[[12,215,488,155],[153,216,260,152],[63,83,383,417],[71,108,367,365]],facing:'left'});
  Object.assign(manifest[6].projectiles[1],{ready:true,bounds:[12,144,488,356],rowBounds:[[12,262,488,175],[119,215,262,233],[132,144,269,356],[33,196,444,277]],facing:'left'});
  Object.assign(manifest[9].projectiles[1],{ready:true,bounds:[12,59,488,441],rowBounds:[[41,76,404,406],[12,134,488,284],[17,71,466,419],[25,59,473,441]],facing:'left'});
  Object.assign(manifest[10].projectiles[0],{ready:true,bounds:[18,81,482,419],rowBounds:[[18,156,475,216],[172,181,169,167],[18,81,482,419],[22,119,478,309]],facing:'left'});
  Object.assign(manifest[10].projectiles[1],{"ready":true,"bounds":[12,13,488,487],"rowBounds":[[29,201,454,110],[39,75,435,363],[52,125,404,262],[12,13,488,487]],"facing":"left"});
  Object.assign(manifest[12].projectiles[1],{"ready":true,"bounds":[12,76,488,424],"rowBounds":[[41,187,455,215],[55,76,414,419],[12,230,460,142],[25,101,475,399]],"facing":"left"});
  Object.assign(manifest[12].projectiles[0],{"ready":true,"bounds":[12,25,488,475],"rowBounds":[[88,154,288,214],[12,131,488,267],[25,25,437,475],[99,180,364,166]],"facing":"left"});
  Object.assign(manifest[11].projectiles[1],{"ready":true,"bounds":[12,166,488,334],"rowBounds":[[155,218,192,234],[21,243,469,182],[12,246,457,175],[53,166,447,334]],"facing":"left"});
  Object.assign(manifest[11].projectiles[0],{ready:true,bounds:[12,141,488,359],rowBounds:[[125,216,363,217],[33,213,452,218],[25,141,459,359],[12,216,488,213]],facing:'left'});
  // BEGIN APPROVED RANCH P1 TRANSFER
  Object.assign(manifest[4].phases[0],{"ready":true,"bounds":[12,239,488,261],"rowBounds":[[175,239,283,257],[12,270,435,226],[62,270,385,226],[54,272,446,228]],"legacyOffset":[-53,0],"legacyScale":[1.37,1]});
  Object.assign(manifest[4].projectiles[0],{"ready":true,"bounds":[12,101,488,399],"rowBounds":[[12,234,488,158],[176,235,135,137],[36,101,401,399],[76,136,319,324]],"facing":"left"});
  // END APPROVED RANCH P1 TRANSFER
  // BEGIN APPROVED COLLECTOR P1 REPLACEMENT
  Object.assign(manifest[5].phases[0],{"ready":true,"bounds":[3,40,506,469],"rowBounds":[[16,64,489,442],[3,46,504,453],[6,41,503,466],[7,40,501,469]],"legacyOffset":[-73,0],"legacyScale":[1.2,1],"modernBox":[4595,260,400,340]});
  Object.assign(manifest[5].projectiles[0],{"ready":true,"bounds":[12,146,488,354],"rowBounds":[[12,270,488,107],[136,245,257,157],[52,146,404,354],[77,235,354,180]],"facing":"left"});
  // END APPROVED COLLECTOR P1 REPLACEMENT
  const images=new Map(),shotBindings=new WeakMap();
  const mod3=n=>((Math.floor(Number(n)||0)%3)+3)%3;
  function entry(id){return manifest[Number.parseInt(id,10)];}
  function assetUrl(asset){
    // A replacement keeps its canonical filename; pin the request to its
    // reviewed pixels so a returning browser cannot reuse the old vehicle.
    const match=/\/bosses\/(\d+)-[^/]+\/p([12])(-projectiles)?\.png$/.exec(asset.path);
    const profile=match&&typeof SPRITE_HITBOXES!=='undefined'?SPRITE_HITBOXES.stages?.[Number(match[1])]?.[Number(match[2])-1]:null;
    const hash=profile?.provenance?.[match?.[3]?'projectilesSha256':'bossSha256'];
    return asset.path+(/^[a-f0-9]{64}$/.test(hash||'')?'?v='+hash.slice(0,16):'');
  }
  function image(asset){
    if(!asset?.ready||!asset.path)return null;
    if(!images.has(asset.path)){
      const img=new Image();
      images.set(asset.path,img);img.src=assetUrl(asset);
    }
    const img=images.get(asset.path);
    return img.complete&&img.naturalWidth>0?img:null;
  }
  function phaseImage(id,phase){
    const config=entry(id),img=image(config?.phases[phase]);
    return img&&img.naturalWidth%(config.columns||4)===0&&img.naturalHeight%(config.rows||4)===0?img:null;
  }
  // Keylines are baked once per sprite frame and size. A canvas filter on every projectile
  // draw is the frame's dominant cost (see docs/GAMEPLAY-IMPROVEMENT-PLAN.md, F1), so the main
  // canvas only ever blits the finished sprite-plus-outline. Mirroring and rotation stay on the
  // caller's transform. Collision never reads any of this.
  // Up to 256 entries and about 24 MB; typical projectiles are under 140px a side (78 KB). The
  // side limit admits the one large steady sprite, the ceiling sweep band.
  const OUTLINE_PAD=4,OUTLINE_MAX_SIDE=640,OUTLINE_MAX_ENTRIES=256,OUTLINE_MAX_BYTES=24*1024*1024,outlineCache=new Map();
  let outlineStage=null,outlineBytes=0;
  function outlineEvict(){const [key,old]=outlineCache.entries().next().value;outlineCache.delete(key);outlineBytes-=old.width*old.height*4;}
  const outlineStats={builds:0,blits:0,direct:0};
  function outlineSurface(width,height){
    if(typeof document!=='undefined'&&typeof document.createElement==='function'){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;}
    return typeof OffscreenCanvas==='undefined'?null:new OffscreenCanvas(width,height);
  }
  // Draws img's crop at the destination rectangle with filterText baked in. Returns false when the
  // caller must use the direct filtered draw: no canvas factory (Node tests), an outer filter
  // already active, a skewed transform, or a sprite too large to cache (rising columns, beams,
  // long rays). The caller's scale, mirror and rotation are baked into the cached canvas, so the
  // keyline stays one canvas pixel wide and axis-aligned exactly as the filter drew it. Rotation
  // is snapped to OUTLINE_ANGLE_STEPS per turn (under 1px at a projectile's edge) so a shot that
  // turns in flight reuses neighbouring entries.
  const OUTLINE_ANGLE_STEPS=180;
  function drawOutlined(ctx,img,sx,sy,sw,sh,dx,dy,dw,dh,filterText,stage){
    if(typeof ctx.getTransform!=='function'||typeof ctx.setTransform!=='function'||ctx.filter&&ctx.filter!=='none')return false;
    const m=ctx.getTransform(),kx=Math.hypot(m.a,m.b),ky=Math.hypot(m.c,m.d);
    if(!(kx>0&&ky>0)||!(dw>0&&dh>0))return false;
    const pw=dw*kx,ph=dh*ky,skew=(m.a*m.c+m.b*m.d)/(kx*ky);
    if(pw<1||ph<1||pw>OUTLINE_MAX_SIDE||ph>OUTLINE_MAX_SIDE||Math.abs(skew)>1e-6)return false;
    if(stage!==outlineStage){outlineCache.clear();outlineBytes=0;outlineStage=stage;}
    const mirror=m.a*m.d-m.b*m.c<0?-1:1;
    const step=((Math.round(Math.atan2(m.b,m.a)/(2*Math.PI)*OUTLINE_ANGLE_STEPS)%OUTLINE_ANGLE_STEPS)+OUTLINE_ANGLE_STEPS)%OUTLINE_ANGLE_STEPS;
    const key=(img.currentSrc||img.src||'')+'|'+sx+'|'+sy+'|'+sw+'|'+sh+'|'+Math.round(pw*2)/2+'|'+Math.round(ph*2)/2+'|'+step+'|'+mirror+'|'+filterText;
    let baked=outlineCache.get(key);
    if(baked)outlineCache.delete(key);
    else{
      // Quarter turns use exact 0 and 1 so an unrotated sprite is copied without resampling drift.
      const quarter=OUTLINE_ANGLE_STEPS/4,angle=step/OUTLINE_ANGLE_STEPS*2*Math.PI;
      const cos=step%quarter?Math.cos(angle):[1,0,-1,0][step/quarter],sin=step%quarter?Math.sin(angle):[0,1,0,-1][step/quarter];
      const width=Math.ceil(Math.abs(pw*cos)+Math.abs(ph*sin))+2*OUTLINE_PAD,height=Math.ceil(Math.abs(pw*sin)+Math.abs(ph*cos))+2*OUTLINE_PAD;
      const surface=outlineSurface(width,height),pen=surface?.getContext?.('2d');
      if(!pen)return false;
      pen.imageSmoothingEnabled=false;pen.filter=filterText;
      pen.setTransform(cos,sin,-sin*mirror,cos*mirror,width/2,height/2);
      pen.drawImage(img,sx,sy,sw,sh,-pw/2,-ph/2,pw,ph);
      baked=surface;outlineStats.builds++;
      outlineBytes+=width*height*4;
      while(outlineCache.size&&(outlineCache.size>=OUTLINE_MAX_ENTRIES||outlineBytes>OUTLINE_MAX_BYTES))outlineEvict();
    }
    outlineCache.set(key,baked);
    const cx=dx+dw/2,cy=dy+dh/2,x=m.a*cx+m.c*cy+m.e,y=m.b*cx+m.d*cy+m.f;
    ctx.save();ctx.setTransform(1,0,0,1,Math.round(x-baked.width/2),Math.round(y-baked.height/2));
    ctx.drawImage(baked,0,0);ctx.restore();outlineStats.blits++;
    return true;
  }
  function frame(ctx,img,row,column,box,config,crop,scaleBounds,outline){
    const columns=config.columns||4,rows=config.rows||4;
    const cellWidth=img.naturalWidth/columns,cellHeight=img.naturalHeight/rows;
    if(cellWidth<1||cellHeight<1||img.naturalWidth%columns||img.naturalHeight%rows)return false;
    const [cx,cy,width,height]=crop||[0,0,cellWidth,cellHeight];
    if(![cx,cy,width,height].every(Number.isFinite)||cx<0||cy<0||width<=0||height<=0||cx+width>cellWidth||cy+height>cellHeight)return false;
    const [rx,ry,rw,rh]=scaleBounds||[cx,cy,width,height];
    if(![rx,ry,rw,rh].every(Number.isFinite)||rx<0||ry<0||rw<=0||rh<=0||rx+rw>cellWidth||ry+rh>cellHeight)return false;
    // A uniform scale preserves pixel proportions; extracted bosses share a bottom baseline.
    const destination=spriteAtlasDestinationRect([rx,ry,rw,rh],[cx,cy,width,height],box,box.anchor==='center');
    if(!destination)return false;
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.translate(box.x+box.w/2,box.y+box.h/2);if(box.flip)ctx.scale(-1,1);
    const sx=(column%columns)*cellWidth+cx,sy=(row%rows)*cellHeight+cy;
    if(!outline||!drawOutlined(ctx,img,sx,sy,width,height,destination.x,destination.y,destination.w,destination.h,outline.filter,outline.stage)){
      if(outline){ctx.filter=ctx.filter&&ctx.filter!=='none'?ctx.filter+' '+outline.filter:outline.filter;outlineStats.direct++;}
      ctx.drawImage(img,sx,sy,width,height,destination.x,destination.y,destination.w,destination.h);
    }
    ctx.restore();return true;
  }
  function attackRow(id,hazard){
    if(hazard.pressure||hazard.missile)return 3;
    const source=String(hazard.source||hazard.id||'');
    const index=(entry(id)?.attackSources||[]).findIndex(prefixes=>prefixes.some(prefix=>source.startsWith(prefix)));
    return index<0?0:index+1;
  }
  // Shared numeric selectors are also used by collision profiles. No image readiness,
  // display clock or browser-only state may choose a different attack row in combat.
  function eventCycle(w,h){
    return spriteWeaponCycle(w.stage.id,w.phaseIndex||0,String(h.source||h.id||''),h.id,Math.max(0,w.phaseTick-(h.age||0)));
  }
  function weaponVariant(w,h){
    if(Number.isInteger(h.weaponVariant))return mod3(h.weaponVariant);
    if(Number.isInteger(h.artVariant))return mod3(h.artVariant);
    return spriteModernWeaponVariant(w.stage.id,w.phaseIndex||0,String(h.source||h.id||''),h.id,Math.max(0,w.phaseTick-(h.age||0)),!!h.missile);
  }
  function sequence(variant,tick,start,lock,release,end){
    if(tick<start||tick>=end)return null;
    const column=tick<lock?0:tick<release?1:tick<release+12?2:3;
    return{row:1+mod3(variant),column,variant:mod3(variant)};
  }
  function authoredPose(w){
    const id=Number.parseInt(w.stage.id,10),phase=w.phaseIndex||0,t=w.phaseTick;
    const variantAt=(source,born,eventId='')=>spriteModernWeaponVariant(w.stage.id,phase,source,eventId,born,false);
    // Visual tell/release windows mirror each authored attack, while the shared numeric
    // selector samples its exact future spawn event to match the collision/projectile row.
    if(id===1||id===13){const c=t%420,base=t-c;return phase?(sequence(variantAt('marina.pressure-lock.front',base+30),c,30,75,120,165)||(t>=600?sequence(variantAt('marina.breakwater-slam.wake',base+270),c,255,263,270,300):null)):sequence(variantAt('marina.breakwater-slam.wake',base+120),c,60,90,120,180);}
    if(id===2){const c=t%420;return sequence(variantAt(phase?'light.house-of-mirrors.beam':'light.iris-shot.beam',t-c+120),c,60,90,120,150);}
    if(id===3&&(!phase||t>=600)){const c=t%360;return sequence(variantAt(phase?'pump-sludge-belch':'sludge-belch',t-c+145),c,70,108,145,175);}
    if(id===8){const c=t%(phase?600:420),source=w.data.rule==='dash'?'crown.royal-joust.front':'crown.jackpot-pulse.shield';return sequence(variantAt(source,t-c+90),c,30,90,150,180);}
    return null;
  }
  function barragePose(shots,tick,scheduled=false){
    let latest=null,age=24;
    for(const shot of shots){
      const sinceLaunch=shot.age-(scheduled?shot.delay:0);
      if(sinceLaunch>=0&&sinceLaunch<age){latest=shot;age=sinceLaunch;}
    }
    return latest?{row:1+latest.weaponVariant,column:age<12?2:3}:{row:0,column:Math.floor(tick/6)%4};
  }
  function attackPose(w){
    if(w.densityBarrage)return barragePose(w.hazards.filter(h=>h.density&&!h.removed),w.tick);
    const authored=authoredPose(w);if(authored)return authored;
    const live=(w.hazards||[]).filter(h=>!h.removed&&h.age<(h.windup||0)+(h.active||1)&&attackRow(w.stage.id,h));
    const main=live.filter(h=>!h.pressure&&!h.missile),pool=main.length?main:live;
    const hazard=pool.reduce((latest,h)=>!latest||h.age<latest.age?h:latest,null);
    if(!hazard)return{row:0,column:Math.floor(w.phaseTick/6)%4};
    const variant=weaponVariant(w,hazard),windup=hazard.windup||0;
    const column=hazard.age<windup?Math.min(1,Math.floor(hazard.age/Math.max(1,windup/2))):hazard.age<windup+12?2:3;
    return{row:1+variant,column,variant};
  }
  function legacyVariant(b,kind='regular'){
    return spriteLegacyWeaponVariant(b.step,b.attackIndex,kind);
  }
  function legacyPose(move,age,tell,active,tick,variant=0){
    if(!move)return{row:0,column:Math.floor(tick/6)%4};
    const column=age<tell?Math.min(1,Math.floor(age/Math.max(1,tell/2))):age<tell+Math.min(12,active)?2:3;
    return{row:1+mod3(variant),column,variant:mod3(variant)};
  }
  function bindShot(shot,binding){
    if(shot&&typeof shot==='object')shotBindings.set(shot,Object.freeze({phase:binding.phase===1?1:0,variant:mod3(binding.variant),bornTick:Number(binding.bornTick)||0}));
  }
  function shotBinding(shot){return shotBindings.get(shot.original||shot);}
  function projectileSelection(id,shot,context){
    const origin=shot.original||shot,binding=shotBinding(shot);
    const phase=Number.isInteger(origin.weaponPhase)?origin.weaponPhase:binding?.phase??context?.phaseIndex??0;
    const variant=Number.isInteger(origin.weaponVariant)?mod3(origin.weaponVariant):binding?.variant??(Number.isInteger(context?.variant)?mod3(context.variant):context?.stage?weaponVariant(context,shot):0);
    const age=Number.isFinite(shot.age)?shot.age:Number.isFinite(origin.age)?origin.age:Math.max(0,(context?.tick||0)-(binding?.bornTick||0));
    return{phase,row:spriteWeaponRow(variant,{...origin,...shot}),variant,column:Math.floor(age/5)%4};
  }
  function machineBox(w){
    const phase=w.phaseIndex||0,id=Number.parseInt(w.stage.id,10),offset=w.data.offset||0;
    switch(id){
      case 1:{
        const motion=marinaTrialMotion(w.phaseTick);
        return marinaBossDrawBox({x:930+motion.x,y:290+motion.y,w:340,h:310},1270+motion.x);
      }
      case 13:{const b=entry(13)?.phases[phase]?.modernBox;return Array.isArray(b)&&b.length===4&&b.every(Number.isFinite)&&b[2]>0&&b[3]>0?{x:b[0],y:b[1],w:b[2],h:b[3]}:{x:930,y:290,w:340,h:310};}
      case 2:return phase?{x:911,y:380,w:300,h:220}:{x:950,y:300,w:300,h:300};
      case 3:return{x:795,y:160,w:415,h:410};
      case 4:return phase?{x:3896+offset,y:290,w:390,h:310}:{x:3758+offset,y:400,w:390,h:220};
      case 5:{if(phase)return{x:920,y:160,w:340,h:440};const b=entry(5)?.phases[0]?.modernBox;return Array.isArray(b)&&b.length===4&&b.every(Number.isFinite)&&b[2]>0&&b[3]>0?{x:b[0],y:b[1],w:b[2],h:b[3]}:{x:4650,y:260,w:400,h:340};}
      case 6:return{x:1010,y:280,w:260,h:320};
      case 7:return phase?{x:952,y:222,w:328,h:280}:{x:930,y:185,w:330,h:280};
      case 8:return phase?{x:760,y:140,w:510,h:460}:{x:920,y:300,w:320,h:300};
      case 9:{const core=w.targets.find(t=>t.id===(phase?'crawler-hatch':'incubator-core'));return{x:(core?.x??1050)-80,y:phase?340:190,w:300,h:phase?275:310};}
      case 10:return phase?{x:535,y:235,w:210,h:225}:{x:4500,y:180,w:370,h:360};
      case 11:{const pp=w.phase.pilot(w);return{x:pp.x-185,y:pp.y-85,w:370,h:190,flip:phase===0};}
      case 12:{const pp=w.phase.pilot(w);return{x:pp.x-(phase?134:160),y:pp.y-130,w:320,h:phase?280:240};}
      default:return null;
    }
  }
  // Called by each phase's vehicle-only drawing section. Route geometry and rule cues
  // keep their original drawing calls, including reels, cover, relays and pressure pipes.
  function drawMachine(ctx,w){
    const config=entry(w.stage.id),img=phaseImage(w.stage.id,w.phaseIndex),box=machineBox(w);
    if(!img||!box)return false;
    const pose=attackPose(w);
    return frame(ctx,img,pose.row,pose.column,box,config,config.phases[w.phaseIndex].bounds);
  }
  function legacyBox(id,phase,box){
    const config=entry(id),asset=config?.phases[phase],offset=asset?.legacyOffset,scale=asset?.legacyScale;
    if(Array.isArray(scale)&&scale.length===2&&scale.every(n=>Number.isFinite(n)&&n>0))box={...box,x:box.x+box.w*(1-scale[0])/2,y:box.y+box.h*(1-scale[1]),w:box.w*scale[0],h:box.h*scale[1]};
    if(Array.isArray(offset)&&offset.length===2&&offset.every(Number.isFinite))box={...box,x:box.x+offset[0],y:box.y+offset[1]};
    return config===manifest[1]?marinaBossDrawBox(box,1280):box;
  }
  function drawBoss(ctx,id,phase,pose,box){
    const config=entry(id),img=phaseImage(id,phase);
    return !!img&&frame(ctx,img,pose.row||0,pose.column||0,legacyBox(id,phase,box),config,config.phases[phase].bounds);
  }
  function projectileKind(id,shot,box){
    return spriteProjectileKind(shot,box,entry(id)?.projectileKinds?.[shot.source||shot.shape]);
  }
  function projectilePresentation(id,phase,row,box){
    const config=entry(id),asset=config?.projectiles[phase],crop=asset?.rowBounds?.[row],bounds=asset?.bounds;
    const geometry=typeof SPRITE_HITBOXES==='undefined'?null:SPRITE_HITBOXES.stages[Number.parseInt(id,10)]?.[phase];
    // The first Morelight phase predates the provenance summary; its reviewed
    // orb profiles contain the same per-row source-pixel core registration.
    const core=geometry?.provenance?.projectileCorePixels?.[row]||geometry?.projectiles?.[`orb@${row}`]?.core;
    const valid=r=>Array.isArray(r)&&r.length===4&&r.every(Number.isFinite)&&r[2]>0&&r[3]>0;
    if(!valid(crop)||!valid(bounds)||!valid(core)||core[0]<crop[0]||core[1]<crop[1]||core[0]+core[2]>crop[0]+crop[2]||core[1]+core[3]>crop[1]+crop[3])return null;
    const d=spriteAtlasDestinationRect(bounds,crop,box,true);if(!d)return null;
    const long=Math.max(d.w,d.h),short=Math.min(d.w,d.h);
    // Keep large attacks at authored size. Small silhouettes get a capped,
    // uniform readability boost without changing their aspect ratio.
    const scale=long>=48?1:Math.min(2.5,60/long,Math.max(1,24/long,12/short));
    const flip=(asset.facing||config.projectileFacing)==='left';
    const coreX=d.x+(core[0]+core[2]/2-crop[0])*d.w/crop[2];
    const coreY=d.y+(core[1]+core[3]/2-crop[1])*d.h/crop[3];
    return{scale,x:box.x+box.w/2+(flip?-coreX:coreX),y:box.y+box.h/2+coreY,
      visibleWidth:d.w*scale,visibleHeight:d.h*scale,coreWidth:core[2]*d.w/crop[2],coreHeight:core[3]*d.h/crop[3]};
  }
  function projectileFrame(ctx,img,id,phase,row,column,box,config,crop,bounds,enlarge){
    const presentation=enlarge?projectilePresentation(id,phase,row,box):null;
    ctx.save();
    // A pale inner keyline and dark outer halo separate every source palette
    // from both bright scenery and dark machinery without repainting the art.
    // frame() blits it from the baked-outline cache, or applies it as a filter where it cannot.
    const contrast='drop-shadow(1px 0px 0px #f4fcff) drop-shadow(-1px 0px 0px #f4fcff) drop-shadow(0px 1px 0px #f4fcff) drop-shadow(0px -1px 0px #f4fcff) drop-shadow(0px 0px 2px #06111f)';
    if(presentation?.scale>1){
      // Scaling about the existing opaque core keeps the original collider
      // centered inside the enlarged solid sprite, including mirrored shots.
      ctx.translate(presentation.x,presentation.y);ctx.scale(presentation.scale,presentation.scale);ctx.translate(-presentation.x,-presentation.y);
    }
    const shown=frame(ctx,img,row,column,box,config,crop,bounds,{filter:contrast,stage:Number.parseInt(id,10)});
    ctx.restore();return shown;
  }
  // Coordinates and dimensions come from the caller's existing projectile transform/bounds.
  // Visual substitutions never resize, replace or mutate the actual collision rectangle.
  const missileAssets=Object.fromEntries(folders.map((_,i)=>[i+1,{path:`art/generated/missiles/${String(i+1).padStart(2,'0')}/missile.png`,ready:false,columns:4,rows:1}]));
  for(const id of [1,2,3,4,5,6,7,8,9,10,11,12,13])missileAssets[id].ready=true;
  const pickupAsset={path:'art/generated/pickups/items.png',ready:true,columns:4,rows:4,rowBounds:[[51,51,411,410],[51,51,411,410],[10,20,492,472],[10,10,492,492]]};
  function drawPhasePowerups(ctx,state,tick,playerBox){
    const img=image(pickupAsset);if(!img||!state||!pickupAsset.rowBounds)return false;
    const col=Math.floor(tick/7)%4;
    function cell(row,box){const [sx,sy,sw,sh]=pickupAsset.rowBounds[row],scale=Math.min(box.w/sw,box.h/sh),w=sw*scale,h=sh*scale;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(img,col*512+sx,row*512+sy,sw,sh,box.x+(box.w-w)/2,box.y+(box.h-h)/2,w,h);ctx.restore();}
    for(const p of state.pickups||[]){if(p.expiresAt-tick<=60&&Math.floor(tick/6)%2)continue;cell(p.kind==='life'?0:1,p);}
    if(state.shieldUntil>tick&&playerBox){cell(2,playerBox);ctx.save();ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#d3fffa';ctx.shadowColor='#071620';ctx.shadowBlur=3;ctx.fillText('SHIELD '+Math.ceil((state.shieldUntil-tick)/60)+'s',playerBox.x+playerBox.w/2,playerBox.y-5);ctx.restore();}
    if(state.absorbedAt!=null&&tick-state.absorbedAt<28&&playerBox)cell(3,playerBox);
    return true;
  }
  function drawDensityMissile(ctx,shot,box,tick=0){
    const id=Number.parseInt(shot.stage||String(shot.source||'').replace('boss-density-',''),10),asset=missileAssets[id],img=image(asset);
    const numeric=typeof ArcadeDensityAttacks==='undefined'?null:ArcadeDensityAttacks.missileGeometry?.[id];
    const geometry={...numeric,...asset,bounds:asset?.bounds||numeric?.bounds},bounds=geometry.bounds;
    if(!img||!bounds)return false;
    const transform=typeof ArcadeDensityAttacks==='undefined'?{scale:Math.min(box.w/bounds[2],box.h/bounds[3]),rotation:0,offsetX:0,offsetY:0}:ArcadeDensityAttacks.missileTransform(geometry,box);
    if(!transform)return false;
    const column=Math.floor(tick/7)%4,[sx,sy,sw,sh]=bounds,size=transform.scale,w=sw*size,h=sh*size;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(box.x+box.w/2,box.y+box.h/2);
    // Correct native source angle to LEFT, then retain the caller's +X frame.
    if(shot.vertical)ctx.rotate(-Math.PI/2);
    else ctx.scale(-1,1);
    const glow='drop-shadow(0px 0px 1px #ffffff) drop-shadow(0px 0px 2px #111522)';
    if(transform.rotation){ctx.translate(-transform.offsetX*size,-transform.offsetY*size);ctx.rotate(transform.rotation);}
    if(!drawOutlined(ctx,img,column*(img.naturalWidth/4)+sx,sy,sw,sh,-w/2,-h/2,w,h,glow,id)){
      ctx.filter=glow;outlineStats.direct++;
      ctx.drawImage(img,column*(img.naturalWidth/4)+sx,sy,sw,sh,-w/2,-h/2,w,h);
    }
    ctx.restore();return true;
  }
  function drawProjectile(ctx,id,shot,box,context){
    if(shot.density)return drawDensityMissile(ctx,{...shot,stage:id},box,shot.age||context?.phaseTick||0);
    const selection=projectileSelection(id,shot,context),config=entry(id),asset=config?.projectiles[selection.phase],img=image(asset);
    if(!img)return false;
    // Explicit local +X direction is used by legacy callers; modern callers
    // retain their existing velocity mirror. Never combine both conventions.
    if(Number.isFinite(context?.directionAngle)&&!context.directionApplied){
      const x=box.x+box.w/2,y=box.y+box.h/2;
      ctx.save();ctx.translate(x,y);ctx.rotate(context.directionAngle);ctx.translate(-x,-y);
      const shown=drawProjectile(ctx,id,shot,box,{...context,directionApplied:true});
      ctx.restore();return shown;
    }
    const kind=projectileKind(id,shot,box),{row,column}=selection;
    const crop=asset.rowBounds?.[row],flip=(asset.facing||config.projectileFacing)==='left';
    // All weapon rows share one scale and registration. Row crops mask neighboring
    // cells; fitting each crop independently would erase the artist's size variation.
    const bounds=asset.bounds||unionBounds(asset.rowBounds)||[0,0,img.naturalWidth/(config.columns||4),img.naturalHeight/(config.rows||4)];
    const enlarge=shot.rule!=='dash'&&shot.rule!=='shield'&&!shot.requiresDash&&!shot.requiresShield;
    if(kind!=='ray')return projectileFrame(ctx,img,id,selection.phase,row,column,{...box,anchor:'center',flip},config,crop,bounds,enlarge);
    // A vertical hazard uses the same authored ray turned along its long axis.
    // Long beams tile at uniform scale so their full dangerous span remains visible.
    const vertical=box.h>box.w,wide=vertical?box.h:box.w,high=vertical?box.w:box.h;
    ctx.save();ctx.translate(box.x+box.w/2,box.y+box.h/2);
    if(vertical&&!context?.directionApplied)ctx.rotate((shot.vy||1)<0?-Math.PI/2:Math.PI/2);
    let shown=false;
    if(wide>high*6&&crop){
      const scale=high/bounds[3],referenceWidth=bounds[2]*scale,tile=Math.max(1,crop[2]*scale);
      const offset=(crop[0]+crop[2]/2-bounds[0]-bounds[2]/2)*scale*(flip?-1:1);
      ctx.beginPath();ctx.rect(-wide/2,-high/2,wide,high);ctx.clip();
      for(let x=-wide/2;x<wide/2;x+=tile)shown=frame(ctx,img,row,column,{x:x+tile/2-offset-referenceWidth/2,y:-high/2,w:referenceWidth,h:high,anchor:'center',flip},config,crop,bounds)||shown;
    }else{
      // Short rays fit the common reference's long axis. A square heavy row
      // must not shrink every narrow ray to a few unreadable pixels.
      const referenceHeight=wide*bounds[3]/bounds[2];
      shown=projectileFrame(ctx,img,id,selection.phase,row,column,{x:-wide/2,y:-referenceHeight/2,w:wide,h:referenceHeight,anchor:'center',flip},config,crop,bounds,enlarge);
    }
    ctx.restore();return shown;
  }
  function unionBounds(rows){
    if(!rows?.length)return null;
    const valid=rows.filter(b=>b&&b.length===4&&b.every(Number.isFinite)&&b[2]>0&&b[3]>0);
    if(!valid.length)return null;
    const x=Math.min(...valid.map(b=>b[0])),y=Math.min(...valid.map(b=>b[1]));
    return[x,y,Math.max(...valid.map(b=>b[0]+b[2]))-x,Math.max(...valid.map(b=>b[1]+b[3]))-y];
  }
  const stageLoads=new Map();
  function stageAssets(id){const config=entry(id);return config?[...config.phases,...config.projectiles,missileAssets[Number.parseInt(id,10)],pickupAsset].filter(asset=>asset?.ready):[];}
  function decoded(img,asset){return !!img&&img.complete&&img.naturalWidth===2048&&img.naturalHeight===(asset?.rows===1?512:2048);}
  function stageReady(id){return stageAssets(id).every(asset=>decoded(images.get(asset.path),asset));}
  function preloadStage(id){
    const assets=stageAssets(id),key=Number.parseInt(id,10)+':'+assets.map(asset=>asset.path).join('|');
    if(stageReady(id))return Promise.resolve();
    if(stageLoads.has(key))return stageLoads.get(key);
    const pending=Promise.all(assets.map(asset=>{
      image(asset);const img=images.get(asset.path);
      const ready=decoded(img,asset)?Promise.resolve():typeof img.decode==='function'?img.decode():new Promise((resolve,reject)=>{
        img.addEventListener('load',resolve,{once:true});img.addEventListener('error',()=>reject(Error('Boss art could not load')),{once:true});
      });
      return ready.then(()=>{if(!decoded(img,asset))throw Error('Game art must be a complete 2048px sprite sheet');});
    }));
    const loading=pending.then(()=>{stageLoads.delete(key);},error=>{stageLoads.delete(key);for(const asset of assets)if(!decoded(images.get(asset.path),asset))images.delete(asset.path);throw error;});
    stageLoads.set(key,loading);return loading;
  }
  function loadEverything(){return Promise.all(Object.keys(manifest).map(preloadStage));}
  root.ArcadeBossSheets={manifest,missileAssets,pickupAsset,entry,phaseImage,attackPose,barragePose,weaponVariant,eventCycle,legacyVariant,legacyPose,bindShot,shotBinding,projectileSelection,machineBox,drawMachine,legacyBox,drawBoss,projectileKind,projectilePresentation,drawProjectile,drawDensityMissile,drawPhasePowerups,outlineStats,outlineCacheSize:()=>outlineCache.size,outlineCacheBytes:()=>outlineBytes,stageReady,preloadStage,loadEverything};
})(globalThis);
