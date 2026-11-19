/* Presentation only. No simulation state, collision bounds or random streams are changed here. */
(function(root){
  'use strict';
  const folders=['01-marina-bront','02-last-light-vela','03-mudline-crapto','04-ranch-zephyr','05-neon-sproto102','06-circuit-rune','07-moonkeep-bigswole','08-crown-alpha777','09-hatchery-highsproto','10-verse-sprotosales','11-rooftop-sproto1668','12-codebreak-sproto3106','13-redkev-guest09','14-sprotel-bitcoin'];
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
  attackSources[14]=[['sprotel.beer','sprotel.cocktail','sprotel.snacks'],['sprotel.marlin'],['sprotel.disk-laser','sprotel.sound-wave']];
  for(const [id,config]of Object.entries(manifest))config.attackSources=attackSources[id];
  // BEGIN SPROTEL ANIMATION MANIFEST
  const sprotel=root.ArcadeSprotelArt||{};
  Object.assign(manifest[14],{phaseCount:2,columns:2,rows:2,paged:true,artComplete:sprotel.complete===true,
    animations:sprotel.phaseAnimations?.[0]||{},phaseAnimations:sprotel.phaseAnimations||[{},{}],projectileAnimations:sprotel.projectileAnimations||{}});
  manifest[14].phases=[0,1].map(phase=>{
    const idle=manifest[14].phaseAnimations[phase]?.idle,first=idle?.pages?.[0];
    return first?{...first,bounds:idle.referenceBounds||idle.bounds}:{path:`art/generated/bosses/14-sprotel-bitcoin/p${phase+1}/idle/page-0.png`,ready:false,width:1024,height:1024};
  });
  manifest[14].projectiles=[{ready:false},{ready:false}];
  // END SPROTEL ANIMATION MANIFEST
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
  const visualPhases=Object.fromEntries(Object.entries(root.ArcadeBossSpriteVersions||{}).map(([id,versions])=>[
    id,versions.map((version,phase)=>{
      const canonical=manifest[id].phases[phase];
      return {path:canonical.path.replace(/\.png$/,'-presentation.webp'),version,ready:true,canonical};
    })
  ]));
  const unavailableVisuals=new Set();
  function presentationPaths(){return Object.values(visualPhases).flatMap(phases=>phases.map(asset=>asset.path));}
  function presentationPhase(id,phase){
    const key=Number.parseInt(id,10),canonical=manifest[key]?.phases[phase],visual=visualPhases[key]?.[phase];
    return canonical?.ready&&visual&&!unavailableVisuals.has(visual.path)?visual:canonical;
  }
  const mod3=n=>((Math.floor(Number(n)||0)%3)+3)%3;
  function entry(id){return manifest[Number.parseInt(id,10)];}
  function assetUrl(asset){
    if(asset.version)return asset.path+'?v='+asset.version;
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
    const config=entry(id),asset=presentationPhase(id,phase),img=image(asset);
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
  function drawWaterline(ctx,box,depth,tick,paint,drawSurface=true){
    const {x,y,w,h}=box,line=y+h-depth;
    const wave=px=>line+Math.sin(px*.068-tick*.15)*2+Math.sin(px*.027+tick*.08);
    function clipHull(submerged){
      ctx.beginPath();
      ctx.moveTo(x-3,wave(x-3));
      for(let px=x+1;px<x+w+3;px+=4)ctx.lineTo(px,wave(px));
      ctx.lineTo(x+w+3,wave(x+w+3));
      const edge=submerged?y+h+2:y-2;
      ctx.lineTo(x+w+3,edge);ctx.lineTo(x-3,edge);ctx.closePath();
      ctx.clip();
    }
    ctx.save();
    clipHull(false);paint(0,0);
    ctx.restore();
    ctx.save();
    clipHull(true);
    ctx.globalAlpha*=.36;
    paint(Math.round(Math.sin(tick*.18)*2),2);
    ctx.restore();
    if(!drawSurface)return;

    const start=x+w*.09,end=x+w*.97;
    const foam=ctx.createLinearGradient(start,0,end,0);
    foam.addColorStop(0,'#b8f3ff00');
    foam.addColorStop(.2,'#b8f3ff99');
    foam.addColorStop(.72,'#72dcf04d');
    foam.addColorStop(1,'#b8f3ff00');
    ctx.save();
    ctx.strokeStyle=foam;ctx.lineWidth=Math.min(2,w/180);
    ctx.beginPath();ctx.moveTo(start,wave(start));
    for(let px=start+4;px<=end;px+=4)ctx.lineTo(px,wave(px));
    ctx.stroke();
    ctx.restore();
  }
  function marinaWaterlineDepth(phase,width){
    // The approved preview used a 408 px hull and submerged 55% of the orange band.
    return .55*(phase===1?75:63)*width/408;
  }
  // Hinges and masks are registered in the accepted 512px atlas cells.
  // The three cannon poses reach higher than the idle wing's leading edge.
  const siegeWing=[[298,162],[309,118],[512,118],[512,283],[385,308],[370,308],[361,297],[350,290],
    [335,280],[322,282],[309,289],[293,287],[300,269],[309,250],[313,207]];
  // Use the extended membranes for the full beat and keep the metal supports behind the cockpit.
  const rampartWing=[[281,224],[312,193],[389,154],[505,139],[505,382],[376,382],[366,347],
    [316,330],[272,334],[241,349],[248,314],[256,279],[267,240]];
  const rampartRearWing=[[177,215],[206,174],[248,145],[292,121],[330,110],[383,110],[383,124],
    [347,132],[328,154],[319,177],[317,222],[301,221],[302,173],[252,166],[222,183],[206,208],[199,237],[177,237]];
  const rampartNearSupport=[[180,347],[218,318],[244,296],[260,270],[270,243],[275,225],[289,222],
    [292,233],[284,245],[274,275],[256,316],[228,335],[197,357],[182,361]];
  const rampartFarSupport=[[169,208],[188,205],[204,201],[209,210],[208,225],[195,237],[176,241],[167,220]];
  const rampartBodyEdge=[[512,425],[323,425],[319,394],[308,377],[293,365],[279,356],[253,351],
    [232,352],[207,358],[205,346],[232,329],[244,311],[252,287],[252,258],[242,241],
    [222,228],[201,222],[181,220],[164,223],[143,234]];
  const rampartFoldedCut=[[143,199],[512,199],...rampartBodyEdge];
  const rampartDeployedCut=[[143,110],[512,110],...rampartBodyEdge];
  const rampartCannons=[[81,162],[204,157],[207,177],[229,180],[246,179],[272,179],
    [278,177],[285,177],[287,182],[295,183],[300,186],[306,188],[311,198],
    [302,214],[286,224],[266,227],[250,220],[227,208],[205,209],[185,224],[171,220],[160,205],[80,212]];
  const dragonRigs=[
    {wing:{mask:siegeWing,anchor:[310,255],row:0,column:0},legs:[[108,149,184],[184,219,267],[278,320,374]],legY:[378,410,430],pitchX:.47},
    {wing:{mask:rampartWing,anchor:[282,225],row:2,column:1,scale:.80},
      rear:{mask:rampartRearWing,anchor:[194,211],row:2,column:1,scale:.40,restAngle:.46},
      mounts:{masks:[rampartNearSupport,rampartFarSupport],row:2,column:1},
      legs:[[37,80,114],[114,157,204],[211,253,286]],legY:[420,474,500],pitchX:.39}
  ];
  const dragonMotion=new WeakMap();
  function dragonFlight(owner,phase,tick,altitude){
    const previous=owner&&dragonMotion.get(owner);
    if(previous?.phase===phase&&previous.tick===tick)return previous;
    const elapsed=previous?.phase===phase?tick-previous.tick:0;
    const speed=elapsed>0&&elapsed<=12?(altitude-previous.altitude)/elapsed:0;
    const velocity=Math.abs(speed)<8&&elapsed>0&&elapsed<=12?
      previous.velocity+(speed-previous.velocity)*(1-Math.pow(.68,elapsed)):0;
    const trailing=elapsed>0&&elapsed<=12?
      previous.trailing+(velocity-previous.trailing)*(1-Math.pow(.92,elapsed)):0;
    const pitch=-.23*Math.max(-1,Math.min(1,velocity/1.9));
    const flight={phase,tick,altitude,velocity,trailing,pitch};
    if(owner)dragonMotion.set(owner,flight);
    return flight;
  }
  function dragonPivot(destination,phase){
    return [destination.x+destination.w*dragonRigs[phase].pitchX,destination.y+destination.h*.59];
  }
  function smoothStep(t){
    const fraction=Math.max(0,Math.min(1,t));
    return fraction*fraction*(3-2*fraction);
  }
  const dragonLayers=new WeakMap();
  function dragonMask(pen,...regions){
    pen.beginPath();
    for(const points of regions){
      pen.moveTo(...points[0]);
      for(const point of points.slice(1))pen.lineTo(...point);
      pen.closePath();
    }
  }
  function dragonCell(img,row,column){
    const size=img.naturalWidth/4;
    const canvas=outlineSurface(size,size),pen=canvas?.getContext('2d');
    if(!pen)return null;
    return {canvas,pen,paint:()=>pen.drawImage(img,column*size,row*size,size,size,0,0,size,size)};
  }
  function dragonLayer(img,{row,column,mask,masks=[mask]}){
    const cell=dragonCell(img,row,column);
    if(!cell)return null;
    dragonMask(cell.pen,...masks);
    cell.pen.clip();
    cell.paint();
    return cell.canvas;
  }
  function dragonParts(img,rig,phase,row,column){
    let layers=dragonLayers.get(img);
    if(!layers){
      const wing=dragonLayer(img,rig.wing);
      if(!wing)return null;
      layers={wing,rear:rig.rear&&dragonLayer(img,rig.rear),
        mounts:rig.mounts&&dragonLayer(img,rig.mounts),bodies:new Map()};
      dragonLayers.set(img,layers);
    }
    const key=row*4+column;
    if(!layers.bodies.has(key)){
      const cell=dragonCell(img,row,column);
      if(!cell)return null;
      cell.paint();
      const deployed=phase===1&&row===2&&(column===1||column===2);
      dragonMask(cell.pen,phase===0?siegeWing:deployed?rampartDeployedCut:rampartFoldedCut);
      cell.pen.globalCompositeOperation='destination-out';
      cell.pen.fill();
      cell.pen.globalCompositeOperation='source-over';
      if(deployed){
        dragonMask(cell.pen,rampartCannons);
        cell.pen.clip();
        cell.paint();
      }
      layers.bodies.set(key,cell.canvas);
    }
    return {wing:layers.wing,rear:layers.rear,mounts:layers.mounts,body:layers.bodies.get(key)};
  }
  function drawDragonWing(target,layer,part,flight,scale,pin,origin,pivot,viewRight){
    const beat=flight.tick*2*Math.PI/42;
    const stroke=Math.sin(beat)+.12*Math.sin(2*beat-.5);
    // Both forms use Siege's wingbeat. Layer size and rest angle fit the blue dragon's hinges.
    const angle=.05+.265*stroke+(part.restAngle??0);
    const extension=.98*(1-.085*Math.sin(beat)**2);
    const lift=.96+.055*Math.cos(beat);
    const wingScale=scale*(part.scale??1);
    const [hx,hy]=part.anchor,[px,py]=pivot;
    const sin=Math.sin(angle),cos=Math.cos(angle),bodySin=Math.sin(flight.pitch),bodyCos=Math.cos(flight.pitch);
    const rootRight=px+(origin[0]-px)*bodyCos-(origin[1]-py)*bodySin;
    let reach=extension;
    // Fold the span as a whole when the dragon flies against the right edge.
    for(const [wx,wy] of part.mask){
      const u=wx-hx,v=wy-hy,dx=(u*cos-v*sin)*wingScale*bodyCos;
      const dy=(u*sin+v*cos)*lift*wingScale;
      if(dx>0)reach=Math.min(reach,(viewRight-3-rootRight+dy*bodySin)/dx);
    }
    reach=Math.max(.22,reach);
    target.save();
    target.translate(...pin);
    target.transform(wingScale*reach*cos,wingScale*lift*sin,-wingScale*reach*sin,wingScale*lift*cos,0,0);
    target.drawImage(layer,-hx,-hy);
    target.restore();
  }
  function drawDragonTail(paint,y,scale,flight,startX,endX,top,bottom){
    const shortTail=flight.phase===1;
    const left=shortTail?startX:132;
    const right=shortTail?352:430;
    const bend=shortTail?450:456;
    const exit=shortTail?477:bottom;
    const lag=Math.max(-1,Math.min(1,-flight.trailing/1.65));
    const strength=shortTail?29:32;
    paint(startX,top,left,bottom);
    for(let l=left;l<right;l+=6){
      const r=Math.min(right,l+6),center=(l+r)/2;
      // The curled tail ends on the left. The shorter tail sticks out
      // past the back leg, so its sway increases toward the right.
      const distance=smoothStep(shortTail?(center-left)/34:(right-center)/230);
      const wave=Math.sin(flight.tick*.087-distance*2.3);
      const shift=Math.round((lag*strength+wave*6)*distance*scale);
      const bendY=y(bend)+Math.round(shift*.42);
      const exitY=y(exit)+Math.round(shift*(shortTail?.25:1));
      paint(l,top,r,bend,y(top),bendY);
      paint(l,bend,r,exit,bendY,exitY);
      paint(l,exit,r,bottom,exitY);
    }
    paint(right,top,endX,bottom);
  }
  let dragonBuffer=null;
  function drawDragonFlight(ctx,img,crop,d,flight,row,column,viewRight) {
    const [cx,cy,width,height]=crop,rig=dragonRigs[flight.phase];
    const [legTop,knee,legEnd]=rig.legY;
    const endX=cx+width,endY=cy+height;
    if(endY<legEnd)return false;
    const parts=dragonParts(img,rig,flight.phase,row%4,column%4);
    if(!parts)return false;
    const scale=d.w/width;
    // Assemble the layers before pitching the complete silhouette.
    const pad=Math.ceil(95*scale),side=Math.ceil(40*scale),needW=d.w+side*2,needH=d.h+pad*2;
    dragonBuffer??=outlineSurface(needW,needH);
    const buffer=dragonBuffer?.getContext('2d'),target=buffer||ctx;
    const left=buffer?side:d.x,top=buffer?pad:d.y;
    if(buffer){
      if(dragonBuffer.width!==needW)dragonBuffer.width=needW;
      if(dragonBuffer.height!==needH)dragonBuffer.height=needH;
      buffer.clearRect(0,0,needW,needH);
      buffer.imageSmoothingEnabled=false;
    }
    const x=value=>left+Math.round((value-cx)*scale);
    const y=value=>top+Math.round((value-cy)*d.h/height);
    const paint=(l,t,r,b,dyTop=y(t),dyBottom=y(b))=>{
      if(r>l&&b>t&&x(r)>x(l)&&dyBottom>dyTop){
        target.drawImage(parts.body,l,t,r-l,b-t,x(l),dyTop,x(r)-x(l),dyBottom-dyTop);
      }
    };
    const [px,py]=dragonPivot(d,flight.phase);
    ctx.translate(px,py);ctx.rotate(flight.pitch);ctx.translate(-px,-py);
    for(const [layer,part] of [[parts.rear,rig.rear],[parts.wing,rig.wing]]){
      if(!layer)continue;
      const [hx,hy]=part.anchor;
      const origin=[d.x+(hx-cx)*scale,d.y+(hy-cy)*scale];
      drawDragonWing(target,layer,part,flight,scale,[x(hx),y(hy)],origin,[px,py],viewRight);
    }
    if(parts.mounts)target.drawImage(parts.mounts,x(0),y(0),x(parts.mounts.width)-x(0),y(parts.mounts.height)-y(0));
    paint(cx,cy,endX,legTop);
    let edge=cx;
    const motion=Math.max(-1,Math.min(1,flight.trailing/1.9));
    for(const [index,[start,joint,end]] of rig.legs.entries()){
      paint(edge,legTop,start,legEnd);
      const reach=index===2?8:5;
      const stride=(Math.sin(flight.tick*.097+index*.9)*.62+motion*.64)*reach;
      for(let l=start;l<end;l+=6){
        const r=Math.min(end,l+6),center=(l+r)/2;
        const fraction=center<joint?(center-start)/(joint-start):(end-center)/(end-joint);
        const shift=Math.round(stride*smoothStep(1.5*fraction)*scale);
        paint(l,legTop,r,knee,y(legTop),y(knee)+shift);
        paint(l,knee,r,legEnd,y(knee)+shift,y(legEnd)+(flight.phase?Math.round(shift*.85):0));
      }
      edge=end;
    }
    if(flight.phase)drawDragonTail(paint,y,scale,flight,edge,endX,legTop,legEnd);
    else{
      paint(edge,legTop,endX,legEnd);
      drawDragonTail(paint,y,scale,flight,cx,endX,legEnd,endY);
    }
    if(buffer)ctx.drawImage(dragonBuffer,d.x-side,d.y-pad);
    return true;
  }
  function frame(ctx,img,row,column,box,config,crop,scaleBounds,outline,waterline,flight){
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
    if(waterline){
      const depth=marinaWaterlineDepth(waterline.phase,destination.w);
      drawWaterline(ctx,destination,depth,waterline.tick,(dx,dy)=>{
        ctx.drawImage(img,sx,sy,width,height,destination.x+dx,destination.y+dy,destination.w,destination.h);
      },waterline.drawSurface);
    }else if(!flight||!crop||!drawDragonFlight(ctx,img,crop,destination,flight,row,column,1280-box.x-box.w/2)){
      if(!outline||!drawOutlined(ctx,img,sx,sy,width,height,destination.x,destination.y,destination.w,destination.h,outline.filter,outline.stage)){
        if(outline){ctx.filter=ctx.filter&&ctx.filter!=='none'?ctx.filter+' '+outline.filter:outline.filter;outlineStats.direct++;}
        ctx.drawImage(img,sx,sy,width,height,destination.x,destination.y,destination.w,destination.h);
      }
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
    if(Number.parseInt(w.stage.id,10)===14){
      const action=w.data.action||'idle';
      if(action==='idle')return{row:0,column:0,animation:'idle',frame:Math.floor(w.phaseTick/6)%16};
      return sprotelPose(action,w.data.actionAge||0,w.data.actionTell||60,w.data.actionActive||32,w.data.actionRest||48);
    }
    if(w.densityBarrage)return barragePose(w.hazards.filter(h=>h.density&&!h.removed),w.tick);
    const released=releasePose(w.player,w.phaseIndex,w.tick);
    if(released)return released;
    if(w.stage.number===7&&w.data.dragonTell>0)return {row:1,column:w.data.dragonTell>12?0:1};
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
  function sprotelPose(animation,age,tell,active,rest=55){
    const sample=age<tell?Math.min(7,Math.floor(age/Math.max(1,tell)*8)):
      age<tell+active?8+Math.min(3,Math.floor((age-tell)/Math.max(1,active)*4)):
      12+Math.min(3,Math.floor((age-tell-active)/Math.max(1,rest)*4));
    return{row:1,column:sample%2,animation,frame:sample};
  }
  function legacyPose(move,age,tell,active,tick,variant=0){
    const action={sprotelBeer:'beerThrow',sprotelDrinks:'cocktailThrow',sprotelMarlin:'marlin',sprotelDiskLaser:'diskLaser',
      sprotelBeerStick:'beerStick',sprotelCocktailCannon:'cocktailCannon',sprotelSnacks:'snacks',sprotelSoundWave:'soundWave'}[move];
    if(action){if(age>=tell+active+32)return{animation:'walk',frame:Math.floor(tick/4)%16,row:0,column:0};return sprotelPose(action,age,tell,active,32);}
    if(!move||age>=tell+active+10)return{row:0,column:Math.floor(tick/6)%4,animation:'idle',frame:Math.floor(tick/6)%16};
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
    return{phase,row:spriteWeaponRow(variant,{...origin,...shot}),variant,column:Math.floor(age/5)%4,age};
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
      case 14:return sprotelModernBox(phase,w.data.mechX??900);
      case 3:return{x:795,y:160,w:415,h:410};
      case 4:return phase?{x:3896+offset,y:290,w:390,h:310}:{x:3758+offset,y:400,w:390,h:220};
      case 5:{if(phase)return{x:920,y:160,w:340,h:440};const b=entry(5)?.phases[0]?.modernBox;return Array.isArray(b)&&b.length===4&&b.every(Number.isFinite)&&b[2]>0&&b[3]>0?{x:b[0],y:b[1],w:b[2],h:b[3]}:{x:4650,y:260,w:400,h:340};}
      case 6:return{x:1010,y:280,w:260,h:320};
      case 7:return phase?{x:952,y:222+(w.data.dragonY||0),w:328,h:280}:{x:930,y:185+(w.data.dragonY||0),w:330,h:280};
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
    if(root.ArcadeBossTransitions?.drawTrial(ctx,w,box))return true;
    const pose=attackPose(w);
    if(Number.parseInt(w.stage.id,10)===14)return drawSprotelAnimation(ctx,config,w.phaseIndex,pose,box);
    const waterline=config===manifest[1]&&w.phase?.naval?{phase:w.phaseIndex,tick:w.tick}:null;
    const flight=config===manifest[7]?dragonFlight(w.player,w.phaseIndex,w.tick,box.y):null;
    const shown=frame(ctx,img,pose.row,pose.column,box,config,config.phases[w.phaseIndex].bounds,null,null,waterline,flight);
    if(shown)drawMountedRelease(ctx,img,pose,box,config.phases[w.phaseIndex].bounds,flight,w.player);
    return shown;
  }
  function legacyBox(id,phase,box){
    if(Number.parseInt(id,10)===14)return sprotelLegacyBox(phase,box);
    const config=entry(id),asset=config?.phases[phase],offset=asset?.legacyOffset,scale=asset?.legacyScale;
    if(Array.isArray(scale)&&scale.length===2&&scale.every(n=>Number.isFinite(n)&&n>0))box={...box,x:box.x+box.w*(1-scale[0])/2,y:box.y+box.h*(1-scale[1]),w:box.w*scale[0],h:box.h*scale[1]};
    if(Array.isArray(offset)&&offset.length===2&&offset.every(Number.isFinite))box={...box,x:box.x+offset[0],y:box.y+offset[1]};
    return config===manifest[1]?marinaBossDrawBox(box,1280):box;
  }
  function drawBoss(ctx,id,phase,pose,box,waterline){
    const config=entry(id),img=phaseImage(id,phase);
    if(!img)return false;
    const registered=legacyBox(id,phase,box);
    if(Number.parseInt(id,10)===14)return drawSprotelAnimation(ctx,config,phase,pose,registered);
    const flight=config===manifest[7]&&Number.isFinite(pose.flightTick)?dragonFlight(pose.flightOwner,phase,pose.flightTick,registered.y):null;
    const shown=frame(ctx,img,pose.row||0,pose.column||0,registered,config,config.phases[phase].bounds,null,null,
      config===manifest[1]&&waterline?{...waterline,phase}:null,flight);
    if(shown&&ctx.globalCompositeOperation!=='lighter')drawMountedRelease(ctx,img,pose,registered,config.phases[phase].bounds,flight,pose.flightOwner);
    return shown;
  }
  function drawSprotelAnimation(ctx,config,phase,pose,box){
    const animation=config.phaseAnimations?.[phase]?.[pose.animation||'idle']||config.phaseAnimations?.[phase]?.idle;
    const sample=Math.max(0,Math.min(15,Math.floor(pose.frame??0)));
    const asset=animation?.pages?.[Math.floor(sample/4)],img=image(asset);
    if(!img)return false;
    return frame(ctx,img,Math.floor((sample%4)/2),sample%2,box,{columns:2,rows:2},animation.preservedFromMain?animation.bounds:asset.bounds,animation.referenceBounds||animation.bounds);
  }
  function projectileKind(id,shot,box){
    return spriteProjectileKind(shot,box,entry(id)?.projectileKinds?.[shot.source||shot.shape]);
  }
  const projectileColors=[
    null,['#49dcff','#78ffef'],['#ff72fa','#86edff'],['#d1f658','#ffe293'],['#ffad49','#ffde65'],
    ['#68fff2','#70dcff'],['#ffc64a','#c9ff72'],['#ffc86a','#88dfff'],['#ffe276','#ff9646'],
    ['#ffc765','#b7f37c'],['#ff689f','#ff6e86'],['#ffab6a','#85bcff'],['#ffd368','#ffbc56'],['#ff624e','#ff5682']
  ];
  const projectileInk='#101323',projectileLight='#fff4dd';
  const vivid='saturate(1.30) contrast(1.08) brightness(1.05)';
  function projectileColor(id,phase){
    return projectileColors[Number.parseInt(id,10)]?.[phase===1?1:0]||'#ffb677';
  }
  function pixel(ctx,x,y,w,h,color){
    ctx.fillStyle=color;
    ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));
  }
  function flightTrail(ctx,x,y,width,height,angle,speed,age,kind,color){
    if(!ctx.fillRect||speed<=0||age<1)return;
    const missile=kind==='missile',heavy=kind==='large',unit=Math.max(1,Math.min(3,Math.round(height/13)));
    const shoulder=Math.round(Math.min(31,width*.33));
    const tail=Math.min(age*speed,Math.max(unit*4,Math.min(missile?48:34,7+speed*1.15+width*.34)));
    if(tail<2)return;
    ctx.save();ctx.translate(x,y);if(angle)ctx.rotate(angle);
    const crest=Math.round(Math.sin(age*.8)*unit);
    ctx.globalAlpha*=.82;
    if(!heavy){
      const root=-shoulder,hot=Math.min(tail*.7,tail*(.41+(age%5)*.05));
      pixel(ctx,root-tail,-unit*.5-1,tail+1,unit+2,projectileInk);
      pixel(ctx,root-hot,-unit-1,hot+1,2*unit+2,projectileInk);
      pixel(ctx,root-tail*.82,-unit*.5,tail*.75,unit,color);
      pixel(ctx,root-hot,-unit,hot+1,2*unit,color);
      pixel(ctx,root-hot*.62,0,hot*.7,unit,projectileLight);
    }
    for(let i=0;i<(missile||heavy?4:3);i++){
      const p=((age*(missile?3:2)+i*6)%19)/19,puff=Math.max(1,Math.round((1-p)*unit));
      const px=-shoulder-tail*p,py=(i%2?1:-1)*(unit*(2+i%3)+p*3)+crest;
      pixel(ctx,px-1,py-1,puff+3,puff+2,projectileInk);
      pixel(ctx,px,py,puff+1,puff,i===0?projectileLight:color);
    }
    ctx.restore();
  }
  function beamFlow(ctx,width,height,age,direction,color){
    if(!ctx.fillRect||height<8)return;
    ctx.save();
    ctx.beginPath();ctx.rect(-width/2,-height/2,width,height);ctx.clip();
    const unit=Math.max(1,Math.min(3,Math.round(height/12))),step=Math.max(36,Math.min(110,Math.round(width/13)));
    const period=step*2,scroll=((Math.floor(age*6)*direction%period)+period)%period;
    ctx.globalAlpha*=.8;
    for(let x=-width/2-period+scroll,i=0;x<width/2;x+=step,i++){
      const y=(i%2?1:-1)*Math.min(height*.25,unit*2);
      pixel(ctx,x-1,y-1,step*.46+2,unit+2,projectileInk);
      pixel(ctx,x,y,step*.46,unit,color);
      pixel(ctx,x+step*.13,y,step*.17,unit,projectileLight);
      pixel(ctx,x+step*.67,-y,unit*2,unit,color);
    }
    ctx.restore();
  }
  function columnFoot(ctx,box,age,color){
    if(!ctx.fillRect||box.h<8)return;
    ctx.save();
    const x=box.x+box.w/2,bottom=box.y+box.h,spread=Math.min(box.w*.45,8+age*1.6);
    ctx.globalAlpha*=Math.min(1,(35-age)/7);
    pixel(ctx,x-spread,bottom-5,spread*2,5,projectileInk);
    pixel(ctx,x-spread*.75,bottom-3,spread*1.5,2,color);
    for(let i=0;i<6;i++){
      const step=(age*2+i*7)%16,px=x+(i%2?-1:1)*spread*(.38+step*.03);
      const py=bottom-Math.min(box.h-1,step+3+i%3*3);
      pixel(ctx,px,py,2+i%2,2,i%3===0?projectileLight:color);
    }
    ctx.restore();
  }
  const strikes=new WeakMap(),launches=new WeakMap(),releaseMasks=new WeakMap(),trialReleased=new WeakSet();
  const impactDuration=23,launchDuration=11;
  function effectQueue(store,owner,tick,duration){
    const previous=store.get(owner);
    const queue=(previous||[]).filter(effect=>tick>=effect.tick&&tick-effect.tick<duration);
    store.set(owner,queue);
    return queue;
  }
  function addProjectileHit(owner,tick,spec){
    if(!owner||!Number.isFinite(spec.x)||!Number.isFinite(spec.y))return;
    const queue=effectQueue(strikes,owner,tick,impactDuration);
    if(queue.length>=12)return;
    queue.push({...spec,tick});
  }
  function recordProjectileLaunch(owner,tick,spec){
    if(!owner||!Number.isFinite(spec.x)||!Number.isFinite(spec.y))return;
    const queue=effectQueue(launches,owner,tick,launchDuration);
    if(queue.length>=24)return;
    const angle=Math.atan2(spec.vy||0,spec.vx||0);
    queue.push({...spec,tick,angle});
  }
  function releasePose(owner,phase,tick,fallback){
    if(owner?.id==='sprotel')return undefined;
    const queue=launches.get(owner)||[];
    const latest=queue.findLast(event=>event.phase===phase&&event.pose!==false&&tick>=event.tick&&tick-event.tick<6);
    if(!latest)return fallback;
    // On a multi-shot frame the closest origin to the actor takes priority over remote launchers.
    const release=queue.find(event=>event.tick===latest.tick&&event.phase===phase&&event.mounted&&event.pose!==false)||latest;
    const variant=mod3(release.variant);
    return{row:1+variant,column:2,variant,release,releaseAge:tick-release.tick};
  }
  function drawImpact(ctx,e,age){
    const t=age/impactDuration,wet=e.kind==='water',bounce=e.kind==='bounce'||wet,guard=e.kind==='guard';
    const color=guard?'#69ffe4':wet?'#7febff':projectileColor(e.id,e.phase);
    const size=e.size||1,wide=(7+38*t)*size,high=wide*(bounce?.36:.76);
    const angle=Math.atan2(e.vy||0,e.vx||0),dx=Math.cos(angle),dy=Math.sin(angle);
    ctx.save();ctx.globalAlpha*=Math.min(1,2.25*(1-t));
    if(age<9){
      const core=(1-age/9)*size,flare=age<4?12:8;
      pixel(ctx,e.x-flare*core,e.y-5*core,2*flare*core,10*core,projectileInk);
      pixel(ctx,e.x-5*core,e.y-9*core,10*core,18*core,projectileInk);
      pixel(ctx,e.x-(flare-2)*core,e.y-3*core,2*(flare-2)*core,6*core,color);
      pixel(ctx,e.x-3*core,e.y-7*core,6*core,14*core,color);
      pixel(ctx,e.x-4*core,e.y-2*core,8*core,4*core,projectileLight);
    }
    for(let i=0;i<8;i++){
      const radians=i*Math.PI/4,ox=Math.cos(radians),oy=Math.sin(radians);
      const x=e.x+ox*wide+dx*t*8,y=e.y+oy*high+(bounce?-high:dy*t*8);
      const length=Math.max(1,Math.round((1-t)*(i%2?5:7)*size));
      const px=x+(ox>.1?0:-length),py=y+(oy>.1?0:-length*.7);
      const horizontal=Math.abs(ox)>=.7;
      pixel(ctx,px-1,py-1,(horizontal?length:2)+2,(horizontal?2:length)+2,projectileInk);
      pixel(ctx,px,py,horizontal?length:2,horizontal?2:length,i%2||t>.48?color:projectileLight);
      if(i%2===0&&t>.2){
        pixel(ctx,x+ox*6-1,y+oy*4-1,4,4,projectileInk);
        pixel(ctx,x+ox*6,y+oy*4,2,2,color);
      }
      if(age<13&&i%2===1){
        pixel(ctx,e.x+ox*wide*.54-1,e.y+oy*high*.54-(bounce?high:0),4,3,projectileInk);
        pixel(ctx,e.x+ox*wide*.54,e.y+oy*high*.54-(bounce?high:0)+1,2,1,color);
      }
    }
    if(bounce){
      pixel(ctx,e.x-wide*1.05,e.y-2,wide*2.1,4,projectileInk);
      pixel(ctx,e.x-wide*.8,e.y-2,wide*1.6,2,color);
      pixel(ctx,e.x-wide*.42,e.y-2,wide*.55,2,projectileLight);
    }
    ctx.restore();
  }
  function drawLaunch(ctx,e,age){
    const color=projectileColor(e.id,e.phase),u=(e.size||1)*Math.max(.28,1-age/launchDuration);
    ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);
    ctx.globalAlpha*=Math.min(1,1.8*(1-age/launchDuration));
    pixel(ctx,-8*u,-5*u,26*u,10*u,projectileInk);
    pixel(ctx,-7*u,-3*u,23*u,6*u,color);
    pixel(ctx,-3*u,-2*u,14*u,4*u,projectileLight);
    if(age<4){
      pixel(ctx,0,-10*u,3*u,20*u,color);
      pixel(ctx,5*u,-7*u,3*u,14*u,projectileLight);
    }
    for(const direction of [-1,1]){
      const x=11+age*2,y=direction*(6+age);
      pixel(ctx,x,y,5*u,2*u,color);
      pixel(ctx,x+8,y+direction*2,2*u,2*u,projectileLight);
    }
    ctx.restore();
  }
  function releaseMask(img,row,crop){
    let masks=releaseMasks.get(img);
    if(!masks){masks=new Map();releaseMasks.set(img,masks);}
    if(masks.has(row))return masks.get(row);
    const canvas=outlineSurface(40,40),ctx=canvas?.getContext?.('2d',{willReadFrequently:true});
    if(!ctx?.getImageData)return null;
    const [x,y,w,h]=crop,cw=img.naturalWidth/4,ch=img.naturalHeight/4;
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(img,2*cw+x,row*ch+y,w,h,0,0,40,40);
    const alpha=ctx.getImageData(0,0,40,40).data;
    masks.set(row,alpha);
    return alpha;
  }
  function drawDragonRelease(ctx,pose,box,destination,flight,owner){
    const [px,py]=dragonPivot(destination,flight.phase);
    const cos=Math.cos(flight.pitch),sin=Math.sin(flight.pitch);
    const cx=box.x+box.w/2,cy=box.y+box.h/2;
    for(const shot of launches.get(owner)||[]){
      if(!shot.dragonMount||shot.tick!==pose.release.tick||shot.phase!==flight.phase)continue;
      const [mx,my]=shot.dragonMount;
      const x=cx+px+(mx-px)*cos-(my-py)*sin;
      const y=cy+py+(mx-px)*sin+(my-py)*cos;
      const length=Math.hypot(shot.x-x,shot.y-y);
      if(length<3||length>80)continue;
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(shot.y-y,shot.x-x));
      ctx.globalAlpha*=.82*(1-pose.releaseAge/6);
      pixel(ctx,0,-3,length+1,6,projectileInk);
      pixel(ctx,0,-2,length,4,projectileColor(shot.id,shot.phase));
      pixel(ctx,length*.12,-1,length*.76,2,projectileLight);
      ctx.restore();
    }
  }
  function drawMountedRelease(ctx,img,pose,box,crop,flight,owner){
    const {release:e,releaseAge:age}=pose;
    if(!e?.mounted||!ctx.fillRect||!crop)return;
    const d=spriteAtlasDestinationRect(crop,crop,box,false);
    if(!d)return;
    if(flight&&e.dragonMount){
      drawDragonRelease(ctx,pose,box,d,flight,owner);
      return;
    }
    const cx=box.x+box.w/2,cy=box.y+box.h/2,minX=cx+(box.flip?-d.x-d.w:d.x),minY=cy+d.y;
    const dx=Math.cos(e.angle),dy=Math.sin(e.angle);
    const reach=84;
    if(e.x<minX-reach||e.x>minX+d.w+reach||e.y<minY-reach||e.y>minY+d.h+reach)return;
    const alpha=releaseMask(img,pose.row,crop);
    if(!alpha)return;
    // Trace back from the exact release position along its velocity. Only join a nearby
    // opaque muzzle. The line is brief and cosmetic, so remote launchers keep their own cue.
    for(let length=0;length<=reach;length+=3){
      const x=e.x-dx*length,y=e.y-dy*length;
      const mx=Math.floor((x-minX)/d.w*40),my=Math.floor((y-minY)/d.h*40);
      if(mx<0||mx>=40||my<0||my>=40||alpha[(my*40+(box.flip?39-mx:mx))*4+3]<160)continue;
      if(length<5)return;
      ctx.save();ctx.translate(x,y);ctx.rotate(e.angle);
      ctx.globalAlpha*=.72*(1-age/6);
      pixel(ctx,0,-3,length+1,6,projectileInk);
      pixel(ctx,0,-2,length,4,projectileColor(e.id,e.phase));
      pixel(ctx,length*.17,-1,length*.73,2,projectileLight);
      ctx.restore();
      return;
    }
  }
  function drawProjectileHits(ctx,owner,tick,boss=owner.player||owner){
    if(!ctx.fillRect)return;
    for(const e of strikes.get(owner.player||owner)||[]){
      const age=tick-e.tick;
      if(age>=0&&age<impactDuration)drawImpact(ctx,e,age);
    }
    for(const e of launches.get(boss)||[]){
      const age=tick-e.tick;
      if(age>=0&&age<launchDuration)drawLaunch(ctx,e,age);
    }
  }
  function trialBeamFromRight(shot){
    return shot.w>=shot.h&&!shot.vx&&!shot.vy;
  }
  function projectileHitsTrial(w){
    const {player,tick,phaseIndex:phase}=w,id=w.stage.id;
    if(!player||w.state==='transition')return;
    for(const e of w.events){
      if(!['hit','counter','pickupShield'].includes(e.type))continue;
      const contact=w.hazards.find(h=>h.source===e.source&&h.resolved&&Math.abs(h.x+h.w/2-player.x)<h.w/2+42);
      const y=player.y-(w.phase.naval?28:w.crouching?18:26);
      addProjectileHit(player,tick,{x:player.x,y,id,phase,vx:contact?.vx,vy:contact?.vy,
        kind:e.type==='hit'?'hit':'guard',size:contact?.missile?1.12:1});
    }
    if(w.state!=='playing')return;
    for(const h of w.hazards){
      if(trialReleased.has(h)||h.age<h.windup||h.age>h.windup+1||h.density||h.source?.startsWith('carrier-debris-'))continue;
      const moving=Boolean(h.vx||h.vy);
      const beam=Math.max(h.w,h.h)>=184&&projectileKind(id,h,h)==='ray';
      if(!moving&&!beam)continue;
      trialReleased.add(h);
      const fromRight=trialBeamFromRight(h);
      const vx=moving?h.vx:fromRight?-1:0,vy=moving?h.vy:fromRight?0:1;
      const moved=h.age>h.windup?1:0;
      const x=h.x+h.w/2-h.vx*moved+(beam?-Math.sign(vx)*h.w/2:0),y=h.y+h.h/2-h.vy*moved+(beam?-Math.sign(vy)*h.h/2:0);
      const box=h.source==='07-moonkeep/dragon-breath'?machineBox(w):null;
      const dragonMount=box?[x-box.x-box.w/2,y-box.y-box.h/2]:null;
      recordProjectileLaunch(player,tick,{x,y,vx,vy,id,phase,variant:weaponVariant(w,h),mounted:!h.pressure,pose:!h.pressure,dragonMount});
    }
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
    const contrast=vivid+' drop-shadow(1px 0px 0px #f4fcff) drop-shadow(-1px 0px 0px #f4fcff) drop-shadow(0px 1px 0px #f4fcff) drop-shadow(0px -1px 0px #f4fcff) drop-shadow(0px 0px 2px #06111f)';
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
  const missileAssets=Object.fromEntries(folders.slice(0,13).map((_,i)=>[i+1,{path:`art/generated/missiles/${String(i+1).padStart(2,'0')}/missile.png`,ready:false,columns:4,rows:1}]));
  for(const id of [1,2,3,4,5,6,7,8,9,10,11,12,13])missileAssets[id].ready=true;
  const pickupAsset={path:'art/generated/pickups/items.png',ready:true,columns:4,rows:4,rowBounds:[[51,51,411,410],[51,51,411,410],[10,20,492,472],[10,10,492,492]]};
  // The game draws a half-size lossless WebP of the verified 2048px atlas (pickups are drawn at
  // under 160px). rowBounds stay in the 2048px atlas's pixels; `scale` maps them onto this copy.
  const pickupPresentation={path:'art/generated/pickups/items-presentation.webp',version:'17239951020f1c43',width:1024,height:1024,scale:.5,get ready(){return pickupAsset.ready;}};
  function drawPhasePowerups(ctx,state,tick,playerBox){
    const img=image(pickupPresentation);if(!img||!state||!pickupAsset.rowBounds)return false;
    const col=Math.floor(tick/7)%4,k=pickupPresentation.scale;
    function cell(row,box){const [sx,sy,sw,sh]=pickupAsset.rowBounds[row],scale=Math.min(box.w/sw,box.h/sh),w=sw*scale,h=sh*scale;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(img,(col*512+sx)*k,(row*512+sy)*k,sw*k,sh*k,box.x+(box.w-w)/2,box.y+(box.h-h)/2,w,h);ctx.restore();}
    for(const p of state.pickups||[]){if(p.expiresAt-tick<=60&&Math.floor(tick/6)%2)continue;cell(p.kind==='life'?0:1,p);}
    if(state.shieldUntil>tick&&playerBox){cell(2,playerBox);ctx.save();ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#d3fffa';ctx.shadowColor='#071620';ctx.shadowBlur=3;ctx.fillText('SHIELD '+Math.ceil((state.shieldUntil-tick)/60)+'s',playerBox.x+playerBox.w/2,playerBox.y-5);ctx.restore();}
    if(state.absorbedAt!=null&&tick-state.absorbedAt<28&&playerBox)cell(3,playerBox);
    return true;
  }
  function drawDensityMissile(ctx,shot,box,tick=0){
    const id=Number.parseInt(shot.stage||String(shot.source||'').replace('boss-density-',''),10),asset=missileAssets[id],img=image(asset);
    const numeric=typeof ArcadeDensityAttacks==='undefined'?null:ArcadeDensityAttacks.missileGeometry?.[id];
    const geometry={...numeric,...asset,bounds:asset?.bounds||numeric?.bounds},bounds=geometry.bounds;
    if(!bounds)return false;
    const transform=typeof ArcadeDensityAttacks==='undefined'?{scale:Math.min(box.w/bounds[2],box.h/bounds[3]),rotation:0,offsetX:0,offsetY:0}:ArcadeDensityAttacks.missileTransform(geometry,box);
    if(!transform)return false;
    const age=Number.isFinite(shot.age)?Math.max(0,shot.age-(shot.delay||0)):tick;
    const column=Math.floor(age/5)%4,[sx,sy,sw,sh]=bounds,size=transform.scale,w=sw*size,h=sh*size;
    flightTrail(ctx,box.x+box.w/2,box.y+box.h/2,w,h,shot.vertical?Math.PI/2:0,Math.hypot(shot.vx||0,shot.vy||0),age,'missile',projectileColor(id,shot.weaponPhase));
    if(!img)return false;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(box.x+box.w/2,box.y+box.h/2);
    // Correct native source angle to LEFT, then retain the caller's +X frame.
    if(shot.vertical)ctx.rotate(-Math.PI/2);
    else ctx.scale(-1,1);
    const glow=vivid+' drop-shadow(0px 0px 1px #ffffff) drop-shadow(0px 0px 2px #111522)';
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
    // Explicit local +X direction is used by legacy callers; modern callers
    // retain their existing velocity mirror. Never combine both conventions.
    if(Number.isFinite(context?.directionAngle)&&!context.directionApplied){
      const x=box.x+box.w/2,y=box.y+box.h/2;
      ctx.save();ctx.translate(x,y);ctx.rotate(context.directionAngle);ctx.translate(-x,-y);
      const shown=drawProjectile(ctx,id,shot,box,{...context,directionApplied:true});
      ctx.restore();return shown;
    }
    if(Number.parseInt(id,10)===14){
      const origin=shot.original||shot,name=origin.shape||origin.sprite||shot.sprite;
      const animation=config?.projectileAnimations?.[name];
      const sample=Math.floor(selection.age/4)%16,columns=animation?.columns||2,rows=animation?.rows||2,perPage=columns*rows,cell=sample%perPage,asset=animation?.pages?.[Math.floor(sample/perPage)],picture=image(asset);
      if(!picture)return false;
      return frame(ctx,picture,Math.floor(cell/columns),cell%columns,{...box,anchor:'center',flip:animation.facing==='left'},
        {columns,rows},animation.preservedFromMain?animation.bounds:asset.bounds,animation.referenceBounds||animation.bounds);
    }
    const origin=shot.original||shot,{phase,row,column,age}=selection;
    const kind=projectileKind(id,shot,box),color=projectileColor(id,phase);
    const crop=asset?.rowBounds?.[row],flip=(asset?.facing||config?.projectileFacing)==='left';
    const columnSource=Number.isFinite(origin.height)&&!origin.blast;
    const live=!shot.warning&&(!origin.windup||age>=origin.windup),span=Math.max(box.w,box.h);
    if(live&&span<=184&&(origin.vx||origin.vy)){
      const velocity=Math.hypot(origin.vx||0,origin.vy||0);
      const anchor=img&&kind!=='ray'?projectilePresentation(id,phase,row,box):null;
      const angle=context?.directionApplied?0:Math.atan2(origin.vy||0,Math.abs(origin.vx||0));
      flightTrail(ctx,anchor?.x??box.x+box.w/2,anchor?.y??box.y+box.h/2,
        anchor?.visibleWidth??box.w,anchor?.visibleHeight??box.h,angle,velocity,age-(origin.windup||0),kind,color);
    }
    if(!img){if(columnSource)columnFoot(ctx,box,age,color);return false;}
    // All weapon rows share one scale and registration. Row crops mask neighboring
    // cells; fitting each crop independently would erase the artist's size variation.
    const bounds=asset.bounds||unionBounds(asset.rowBounds)||[0,0,img.naturalWidth/(config.columns||4),img.naturalHeight/(config.rows||4)];
    const enlarge=shot.rule!=='dash'&&shot.rule!=='shield'&&!shot.requiresDash&&!shot.requiresShield;
    if(kind!=='ray'){
      const shown=projectileFrame(ctx,img,id,phase,row,column,{...box,anchor:'center',flip},config,crop,bounds,enlarge);
      if(columnSource)columnFoot(ctx,box,age,color);
      return shown;
    }
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
      shown=projectileFrame(ctx,img,id,phase,row,column,{x:-wide/2,y:-referenceHeight/2,w:wide,h:referenceHeight,anchor:'center',flip},config,crop,bounds,enlarge);
    }
    if(live&&wide>high*6){
      const reverse=columnSource||(context?.stage&&trialBeamFromRight(origin))||
        (shot.laser&&!shot.source&&[1,13].includes(Number.parseInt(id,10)));
      beamFlow(ctx,wide,high,age,reverse?-1:1,color);
    }
    ctx.restore();
    if(columnSource)columnFoot(ctx,box,age,color);
    return shown;
  }
  function unionBounds(rows){
    if(!rows?.length)return null;
    const valid=rows.filter(b=>b&&b.length===4&&b.every(Number.isFinite)&&b[2]>0&&b[3]>0);
    if(!valid.length)return null;
    const x=Math.min(...valid.map(b=>b[0])),y=Math.min(...valid.map(b=>b[1]));
    return[x,y,Math.max(...valid.map(b=>b[0]+b[2]))-x,Math.max(...valid.map(b=>b[1]+b[3]))-y];
  }
  const stageLoads=new Map();
  function stageAssets(id){
    const config=entry(id);if(!config)return[];
    const animated=[...(config.phaseAnimations||[]).flatMap(phase=>Object.values(phase)),...Object.values(config.projectileAnimations||{})].flatMap(a=>a.pages||[]);
    const assets=[presentationPhase(id,0),presentationPhase(id,1),...config.projectiles,...animated,missileAssets[Number.parseInt(id,10)],pickupPresentation].filter(asset=>asset?.ready);
    return [...new Map(assets.map(asset=>[asset.path,asset])).values()];
  }
  function decoded(img,asset){return !!img&&img.complete&&img.naturalWidth===(asset?.width||2048)&&img.naturalHeight===(asset?.height||(asset?.rows===1?512:2048));}
  function stageReady(id){if(Number.parseInt(id,10)===14&&!entry(id)?.artComplete)return false;return stageAssets(id).every(asset=>decoded(images.get(asset.path),asset));}
  function decodeStageAsset(asset){
    image(asset);
    const img=images.get(asset.path);
    if(decoded(img,asset))return Promise.resolve();
    const ready=typeof img.decode==='function'?img.decode():new Promise((resolve,reject)=>{
      img.addEventListener('load',resolve,{once:true});img.addEventListener('error',()=>reject(Error('Boss art could not load')),{once:true});
    });
    return ready.then(()=>{if(!decoded(img,asset))throw Error('Game art must be a complete '+(asset?.width||2048)+'px sprite sheet');});
  }
  function preloadStage(id){
    const assets=stageAssets(id),key=Number.parseInt(id,10);
    if(key===14&&!entry(id)?.artComplete)return Promise.reject(Error('Sprotel animation pages are not complete'));
    if(stageReady(id))return Promise.resolve();
    if(stageLoads.has(key))return stageLoads.get(key);
    const pending=Promise.all(assets.map(asset=>decodeStageAsset(asset).catch(error=>{
      if(!asset.canonical)throw error;
      unavailableVisuals.add(asset.path);
      images.delete(asset.path);
      return decodeStageAsset(asset.canonical);
    })));
    const loading=pending.then(()=>{stageLoads.delete(key);},error=>{stageLoads.delete(key);for(const asset of stageAssets(id))if(!decoded(images.get(asset.path),asset))images.delete(asset.path);throw error;});
    stageLoads.set(key,loading);return loading;
  }
  function loadEverything(){return Promise.all(Object.keys(manifest).map(preloadStage));}
  root.ArcadeBossSheets={manifest,presentationPaths,missileAssets,pickupAsset,pickupPresentation,entry,phaseImage,attackPose,barragePose,weaponVariant,eventCycle,legacyVariant,legacyPose,releasePose,bindShot,shotBinding,projectileSelection,machineBox,drawMachine,legacyBox,drawBoss,drawWaterline,marinaWaterlineDepth,projectileKind,projectilePresentation,drawProjectile,drawDensityMissile,drawPhasePowerups,addProjectileHit,recordProjectileLaunch,projectileHitsTrial,drawProjectileHits,outlineStats,outlineCacheSize:()=>outlineCache.size,outlineCacheBytes:()=>outlineBytes,stageReady,preloadStage,loadEverything};
})(globalThis);
