'use strict';

const PHASE_TWO_NAMES = [
  'Engine Vault','Prism Vault','Floodgate Hangar','Threshing Barn','Night Transit',
  'Control Bunker','Smoky Forge','Broken Crown Sanctuary','Catalog Lab','Beyond the Dimensional Sea'
];
const PRISM_CHANDELIERS = [[336,119],[640,149],[935,119]];

// Fixed overlays only. Each sprite stays attached to a feature in the art.
const PRISM_CHANDELIER_LIGHTS = [
  [275,71,122,112,0,0,.045,.38],[545,67,192,150,0,0,.055,.48],[869,71,128,110,0,0,.044,.38]
];
const FLOODGATE_WATER = [
  [413,261,132,175,0,0,.07,.82],[574,260,152,179,0,0,.076,.90],[760,262,150,176,0,0,.068,.83]
];

const FLOODGATE_LAMPS = [
  [88,100],[188,160],[102,243],[273,305],[375,205],[560,183],
  [742,181],[931,196],[1068,306],[1207,242],[1064,51]
];

function backdropFrame(index, frame) {
  return picture('art/backdrop-motion/'+(index+1)+'/0'+(frame+1)+'.png');
}

function drawBackdropSprite(ctx,index,time,[x,y,w,h,dx,dy,rate,opacity],phase=0) {
  const t=time*rate+phase;
  const art=backdropFrame(index,Math.floor(time/7+phase)%4);
  if (!art.naturalWidth) return;
  ctx.globalAlpha=opacity*(.83+.17*Math.sin(t*2.3));
  ctx.drawImage(art,Math.round(x+Math.sin(t)*dx),Math.round(y+Math.cos(t*.83)*dy),w,h);
}

// Coordinates follow the actual lamps in the Circuit Gate bunker artwork.
const BUNKER_LIGHTS = {
  amber:[
    [176,138,66,10],[600,121,82,13],[1033,137,78,12],
    [609,143,64,21],[605,214,71,83],[606,313,68,66],
    [1144,217,21,94],[1190,201,42,116],[1254,215,24,96],
    [289,363,16,64],[344,361,18,67],[391,364,14,71],
    [843,330,13,95],[896,352,17,82],[947,358,13,84],[994,363,16,79]
  ],
  cyan:[
    [11,202,27,66],[64,202,29,66],
    [538,245,17,31],[538,283,17,28],[538,316,17,28],[538,351,17,27],
    [718,246,17,32],[718,283,17,28],[718,316,17,28],[718,351,17,27],
    [422,172,11,113],[998,178,10,96]
  ]
};

function bunkerLightFrame(color,frame) {
  return picture('art/backdrop-motion/bunker-lights/'+color+'/0'+(frame+1)+'.png');
}

function drawBunkerLights(ctx,time) {
  const levels=[.28,.67,.43,.94,.82,.55,.76,.60];
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  for (const [color,fixtures] of Object.entries(BUNKER_LIGHTS)) {
    for (const [i,[x,y,w,h]] of fixtures.entries()) {
      const tick=Math.floor((time+i*9)/(5+i%4));
      const strength=levels[(tick+i*5)%levels.length];
      const art=bunkerLightFrame(color,(tick+i)%4);
      ctx.globalCompositeOperation='source-over';
      ctx.globalAlpha=(1-strength)*.48;
      ctx.fillStyle=color==='amber'?'#291627':'#102537';
      ctx.fillRect(x+Math.floor(w*.18),y,Math.ceil(w*.64),h);
      ctx.globalCompositeOperation='screen';
      ctx.globalAlpha=.26+strength*.62;
      ctx.drawImage(art,x-3,y,w+6,h);
    }
  }
  ctx.restore();
}

// [start x, start y, end x, end y, stream width] in the normalized arena.
const FORGE_LAVA = [
  [76,227,79,371,52],[303,286,301,380,15],[300,376,361,419,16],
  [360,418,363,472,17],[145,378,164,389,26],[164,389,168,480,29],
  [231,510,240,587,21],[931,353,927,422,12],[926,423,926,471,10],
  [1185,366,1113,430,29],[1113,430,1015,503,32],[1200,252,1202,373,51]
];
const FORGE_CANDLES = [
  [16,61],[34,64],[44,64],[62,70],[80,77],
  [421,207],[442,195],[455,176],[469,202],[480,215],
  [507,278],[520,276],[532,284],[565,282],[607,281],[659,283],[699,276],[733,279],[756,281],
  [809,208],[824,195],[832,177],[845,201],[864,211],
  [418,458],[436,463],[480,462],[798,460],[842,464],[854,460],
  [417,528],[455,537],[805,533],[833,527],[1173,77],[1190,69],[1211,65],[1233,66],[1253,62]
];

function forgeMotionFrame(kind,frame) {
  return picture('art/backdrop-motion/forge/'+kind+'/0'+(frame+1)+'.png');
}

const FORGE_CHIMNEYS = [
  [118,64,56,79],[224,157,66,88],[238,279,86,107],
  [974,91,94,102],[1062,151,63,89]
];

function drawForgeMotion(ctx,time) {
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.globalCompositeOperation='screen';
  for (const [i,[x,y,endX,endY,w]] of FORGE_LAVA.entries()) {
    const tick=Math.floor((time+i*3)/4);
    const sprite=forgeMotionFrame('lava',tick%4);
    const length=Math.hypot(endX-x,endY-y);
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(Math.atan2(endY-y,endX-x)-Math.PI/2);
    ctx.globalAlpha=.54+.15*Math.sin(time*.21+i);
    ctx.beginPath();ctx.rect(-w/2,0,w,length);ctx.clip();
    const offset=(time*(1.7+i%3*.35))%length;
    ctx.drawImage(sprite,-w/2,offset-length,w,length);
    ctx.drawImage(sprite,-w/2,offset,w,length);
    ctx.restore();
  }
  drawCandleFlicker(ctx,time,FORGE_CANDLES);
  ctx.globalCompositeOperation='source-over';
  for (const [i,[x,y,w,h]] of FORGE_CHIMNEYS.entries()) {
    const tick=Math.floor((time+i*9)/9);
    const smoke=forgeMotionFrame('smoke',tick%4);
    const sway=Math.sin(time*.038+i)*.075;
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(sway);
    ctx.globalAlpha=.52;
    ctx.drawImage(smoke,-w*.69,-h,w,h);
    ctx.restore();
  }
  ctx.restore();
}

function drawCandleFlicker(ctx,time,candles) {
  for (const [i,[x,y]] of candles.entries()) {
    const tick=Math.floor((time+i*7)/(5+i%3));
    ctx.globalAlpha=.50+.33*Math.sin(tick*2.1+i)**2;
    ctx.drawImage(forgeMotionFrame('candle',tick%4),x-4,y-12,8,14);
  }
}

const CROWN_RING_CORES = [[102,96],[181,211],[89,454],[1245,192]];
const CROWN_CANDLES = [
  [421,458],[430,451],[443,444],[455,453],[467,456],
  [533,471],[547,469],[559,455],[573,464],
  [706,472],[719,456],[733,463],[748,457],
  [823,458],[835,454],[849,445],[864,457],
  [1119,486],[1133,480],[1147,472],[1160,482],[1174,480]
];

function drawCrownMotion(ctx,time) {
  const ring=picture('art/backdrop-motion/crown-astrolabe.png');
  const radii=[134,48,91,116];
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  for (const [i,[x,y]] of CROWN_RING_CORES.entries()) {
    const radius=radii[i];
    ctx.save();
    ctx.translate(x,y);
    const shade=ctx.createRadialGradient(0,0,radius*.25,0,0,radius);
    shade.addColorStop(0,'#15112c61');
    shade.addColorStop(1,'#15112c00');
    ctx.fillStyle=shade;
    ctx.fillRect(-radius,-radius,radius*2,radius*2);
    ctx.rotate(time*(i%2?-.0028:.0038)+i*.51);
    ctx.globalAlpha=.85;
    ctx.drawImage(ring,-radius,-radius,radius*2,radius*2);
    ctx.restore();
  }
  ctx.globalCompositeOperation='screen';
  drawCandleFlicker(ctx,time,CROWN_CANDLES);
  ctx.restore();
}

// [center x, top, bottom, inner glass width, clear liquid sample x]
const HATCHERY_TANKS = [
  [111,253,416,59,139],[204,275,410,54,223],[640,113,388,130,700],
  [1073,276,411,53,1092],[1166,254,416,56,1187],
  [344,108,156,29,355],[409,38,96,30,421],[869,103,147,25,876],[934,56,111,29,944]
];
const HATCHERY_PODS = [[344,135],[409,72],[934,85],[44,151]];
let hatcheryFluid;

function hatcheryFrame(kind,index) {
  return picture('art/backdrop-motion/hatchery/'+kind+'/0'+(index+1)+'.png');
}

function drawHatcheryMotion(ctx,time) {
  const backdrop=picture('art/'+STATIC_ARENAS[8][0]);
  if (!hatcheryFluid && backdrop.naturalWidth) {
    hatcheryFluid=HATCHERY_TANKS.map(([,top,bottom,width,sample])=>{
      const tile=document.createElement('canvas');
      tile.width=width;
      tile.height=bottom-top;
      const fluid=tile.getContext('2d');
      fluid.drawImage(backdrop,sample,top,3,tile.height,0,0,width,tile.height);
      fluid.globalCompositeOperation='destination-in';
      const edges=fluid.createLinearGradient(0,0,width,0);
      edges.addColorStop(0,'transparent');
      edges.addColorStop(.10,'#000');
      edges.addColorStop(.90,'#000');
      edges.addColorStop(1,'transparent');
      fluid.fillStyle=edges;
      fluid.fillRect(0,0,width,tile.height);
      return tile;
    });
  }
  if (!hatcheryFluid) return;
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  for (const [i,[x,top,bottom,width]] of HATCHERY_TANKS.entries()) {
    const height=bottom-top;
    ctx.drawImage(hatcheryFluid[i],Math.round(x-width/2),top);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x-width/2,top,width,height);
    ctx.clip();
    const phase=time*.037+i*1.7;
    const sprite=hatcheryFrame('specimen',i%4);
    const size=Math.min(height*.78/sprite.height,width*.77/sprite.width);
    const w=sprite.width*size,h=sprite.height*size;
    ctx.translate(x+Math.sin(phase*.73)*width*.07,(top+bottom)/2+Math.sin(phase)*height*.075);
    ctx.rotate(Math.sin(phase*.66)*.085);
    ctx.globalAlpha=.90;
    ctx.drawImage(sprite,-w/2,-h/2,w,h);
    ctx.restore();
  }
  ctx.restore();
}

const VERSE_PORTALS = [[56,247],[1223,245]];
const VERSE_GEM = [640,230];

function verseMotionFrame(kind,frame) {
  return picture('art/backdrop-motion/verse/'+kind+'/0'+(frame+1)+'.png');
}

function drawVerseMotion(ctx,time) {
  const ship=picture('art/backdrop-motion/verse/ship.png');
  const turn=time*.041;
  const facing=Math.cos(turn);
  const crystal=verseMotionFrame('crystal',Math.floor(turn*4/Math.PI)%4);
  ctx.save();
  ctx.imageSmoothingEnabled=false;

  // Darken the painted crystal locally before compositing its rotating facets.
  const glow=ctx.createRadialGradient(640,228,11,640,228,86);
  glow.addColorStop(0,'#28125b9e');glow.addColorStop(1,'#28125b00');
  ctx.fillStyle=glow;
  ctx.fillRect(553,139,174,178);
  const [gemX,gemY]=VERSE_GEM;
  const crystalWidth=17+54*Math.abs(facing);
  ctx.save();
  ctx.translate(gemX,gemY);
  ctx.scale(facing<0?-1:1,1);
  ctx.filter='brightness('+(.78+.33*Math.abs(facing))+')';
  ctx.drawImage(crystal,Math.round(-crystalWidth/2),-77,crystalWidth,155);
  ctx.restore();

  for (let i=0;i<3;i++) {
    const travel=((time+i*107)%321)/321;
    const leftToRight=i!==1;
    const progress=leftToRight?travel:1-travel;
    const x=VERSE_PORTALS[0][0]+(VERSE_PORTALS[1][0]-VERSE_PORTALS[0][0])*progress;
    const y=246-Math.sin(progress*Math.PI)*(48+i*36);
    const emergence=Math.min(1,travel*16,(1-travel)*16);
    const w=(72+i*11)*(.45+.55*emergence);
    const h=w*ship.height/ship.width;
    ctx.save();
    ctx.globalAlpha=emergence;
    ctx.translate(Math.round(x),Math.round(y));
    if (!leftToRight) ctx.scale(-1,1);
    ctx.drawImage(ship,-w/2,-h/2,w,h);
    ctx.restore();
  }

  ctx.globalCompositeOperation='screen';
  for (const [i,[x,y]] of VERSE_PORTALS.entries()) {
    const portal=verseMotionFrame('portal',(Math.floor(time/6)+i*2)%4);
    const pulse=Math.sin(time*.079+i*2.7);
    const w=102+Math.round(9*pulse),h=305+Math.round(14*pulse);
    ctx.globalAlpha=.49+.17*pulse;
    ctx.drawImage(portal,Math.round(x-w/2),Math.round(y-h/2),w,h);
  }
  ctx.restore();
}

const MARINA_TURBINES = [
  [-3,283,123,153,.039],
  [284,294,105,129,-.028]
];
const MARINA_TANKS = [[499,594],[635,730],[771,867]];

function marinaWaterFrame(frame) {
  return picture('art/backdrop-motion/marina/water/0'+(frame+1)+'.png');
}

function drawMarinaEngineMotion(ctx,time) {
  const rotor=picture('art/backdrop-motion/marina/turbine.png');
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  for (const [i,[x,y,rx,ry,rate]] of MARINA_TURBINES.entries()) {
    ctx.save();
    // Follow the circular face instead of slicing the spinning blades at a
    // rectangular bottom/left edge. The native foreground remains visible.
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.clip();
    if (i===1) {
      // The rear wheel passes behind the curved housing of the front engine.
      ctx.beginPath();ctx.rect(0,0,1280,720);
      ctx.ellipse(40,283,225,175,0,0,Math.PI*2);ctx.clip('evenodd');
    }
    // Keep the two lamp stands and the lower pipe ledge in front of the rotors.
    // Separate clips prevent overlapping foreground masks cancelling out.
    for (const points of [
      [[42,434],[43,408],[50,398],[58,396],[54,383],[60,379],[71,396],[85,399],[96,410],[98,434]],
      [[208,434],[210,409],[218,399],[226,396],[222,384],[229,380],[240,397],[252,400],[263,411],[265,434]]
    ]) {
      ctx.beginPath();ctx.rect(0,0,1280,720);
      ctx.moveTo(...points[0]);for (const point of points.slice(1)) ctx.lineTo(...point);
      ctx.closePath();ctx.clip('evenodd');
    }
    ctx.beginPath();ctx.rect(0,0,1280,434);ctx.clip();
    ctx.translate(x,y);
    ctx.scale(1,ry/rx);
    ctx.rotate(time*rate);
    ctx.drawImage(rotor,-rx,-rx,rx*2,rx*2);
    ctx.restore();
  }

  ctx.globalCompositeOperation='screen';
  for (const [i,[left,right]] of MARINA_TANKS.entries()) {
    ctx.save();
    ctx.beginPath();ctx.rect(left,124,right-left,286);ctx.clip();
    for (let j=0;j<2;j++) {
      const t=time+i*29+j*67;
      const water=marinaWaterFrame(Math.floor(t/5)%4);
      const width=(right-left)*(j===0?.87:.62);
      const x=left+(right-left-width)/2+Math.sin(t*.038)*4;
      const y=392-(t*(1+j*.12))%168;
      ctx.globalAlpha=j===0?.57:.33;
      ctx.drawImage(water,Math.round(x),Math.round(y)-143,Math.round(width),150);
    }
    ctx.restore();
  }
  ctx.restore();
}

const PRISM_WALL_CRYSTALS = [
  [13,249,38,114],[51,265,39,105],[88,281,37,96],[119,295,35,87],[150,310,31,77]
];

function drawPrismWallCrystals(ctx,time) {
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  for (const side of [0,1]) {
    for (const [i,[offset,y,w,h]] of PRISM_WALL_CRYSTALS.entries()) {
      const x=side?1280-offset:offset;
      const tick=time+(i*12+side*17);
      const frame=verseMotionFrame('crystal',Math.floor(tick/8)%4);
      const width=w*(.57+.43*Math.abs(Math.cos(tick*.042)));
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x,y-h/2);ctx.lineTo(x+w*.55,y);ctx.lineTo(x,y+h/2);
      ctx.lineTo(x-w*.55,y);ctx.closePath();
      ctx.clip();
      ctx.fillStyle='#321044b0';
      ctx.fillRect(x-w,y-h,w*2,h*2);
      ctx.filter='hue-rotate(24deg) saturate(1.45) brightness(1.18)';
      ctx.drawImage(frame,Math.round(x-width/2),Math.round(y-h/2),width,h);
      ctx.restore();
    }
  }
  ctx.restore();
}

const SIDE_FALLS = [
  [[98,362],[124,362],[136,384],[148,414],[158,430],[122,430],[113,412],[106,385]],
  [[1169,360],[1196,362],[1188,385],[1175,410],[1165,430],[1128,429],[1142,405],[1155,380]]
];

function drawFloodgateSideFalls(ctx,time) {
  for (const [i,mask] of SIDE_FALLS.entries()) {
    ctx.save();
    ctx.beginPath();
    for (const [j,[x,y]] of mask.entries()) {
      if (j) ctx.lineTo(x,y);
      else ctx.moveTo(x,y);
    }
    ctx.closePath();
    ctx.clip();
    ctx.translate(i?1176:105,361);
    ctx.transform(1,0,i?-.47:.47,1,0,0);
    const sprite=backdropFrame(2,Math.floor((time+i*12)/6)%4);
    ctx.globalAlpha=.44+.10*Math.sin(time*.14+i);
    ctx.drawImage(sprite,-11,-5,35,77);
    ctx.restore();
  }
}

const TRANSIT_LIGHTS = [
  [438,325,31,31,'cyan'],[438,367,31,31,'pink'],
  [839,325,31,31,'cyan'],[839,367,31,31,'pink'],
  [78,352,62,8,'cyan'],[218,367,58,9,'cyan'],
  [43,438,45,8,'pink'],[202,438,56,8,'cyan'],
  [640,366,40,8,'pink'],[639,414,27,7,'pink'],[640,438,19,6,'pink'],
  [1066,366,58,9,'cyan'],[1208,352,62,8,'cyan'],
  [1063,438,56,8,'pink'],[1238,438,45,8,'pink']
];

function drawTransitMotion(ctx,time) {
  const train=picture('art/backdrop-motion/transit-train.png');
  const trip=Math.floor(time/316);
  const elapsed=time%316;
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  if (elapsed<154 && train.naturalWidth) {
    const progress=elapsed/154;
    const reverse=trip%2===1;
    const x=336+(reverse?1-progress:progress)*624;
    const y=64+(x-420)*.25;
    ctx.save();
    ctx.beginPath();ctx.rect(416,20,453,166);ctx.clip();
    ctx.translate(Math.round(x),Math.round(y));
    ctx.rotate(.245);
    if (reverse) ctx.scale(-1,1);
    ctx.drawImage(train,-78,-8,156,16);
    ctx.restore();
  }
  for (const [i,[x,y,w,h,color]] of TRANSIT_LIGHTS.entries()) {
    const tick=Math.floor((time+i*11)/(5+i%6));
    const strength=[.28,.84,.63,.92,.44,.77][(tick+i)%6];
    const lamp=bunkerLightFrame(color==='cyan'?'cyan':'amber',tick%4);
    ctx.save();
    ctx.globalAlpha=(1-strength)*.66;
    ctx.fillStyle='#140d27';
    ctx.beginPath();ctx.ellipse(x,y,w/2,h/2,0,0,Math.PI*2);ctx.fill();
    ctx.translate(x,y);
    ctx.rotate(w>h?Math.PI/2:0);
    ctx.globalCompositeOperation='screen';
    ctx.globalAlpha=.19+strength*.60;
    if (color==='pink') ctx.filter='hue-rotate(275deg) saturate(1.45)';
    ctx.drawImage(lamp,-h/2,-w/2,h,w);
    ctx.restore();
  }
  ctx.restore();
}

function drawPhaseTwoAtmosphere(ctx,index,time) {
  if (index===0) drawMarinaEngineMotion(ctx,time);
  if (index===1) drawPrismWallCrystals(ctx,time);
  if (index===3) drawBarnWaterWheel(ctx,time);
  if (index===4) drawTransitMotion(ctx,time);
  if (index===5) drawBunkerLights(ctx,time);
  if (index===6) drawForgeMotion(ctx,time);
  if (index===7) drawCrownMotion(ctx,time);
  if (index===8) drawHatcheryMotion(ctx,time);
  if (index===9) drawVerseMotion(ctx,time);
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.globalCompositeOperation='screen';
  if (index===2) drawFloodgateSideFalls(ctx,time);
  const layers=index===1?PRISM_CHANDELIER_LIGHTS:index===2?FLOODGATE_WATER:[];
  for (const [i,layer] of layers.entries()) drawBackdropSprite(ctx,index,time,layer,i*1.8);
  if (index===2 || index===3) {
    const fixtures=index===2?FLOODGATE_LAMPS:BARN_LANTERNS;
    for (const [i,[x,y]] of fixtures.entries()) {
      const frame=attackFrame('boss/higgsfield/barn-fire',Math.floor(time/6+i)%4);
      ctx.globalAlpha=.34+.32*(.5+.5*Math.sin(time*.21+i*2));
      ctx.drawImage(frame,x-6,y-13,12,19);
    }
  }
  ctx.restore();
}

function drawBarnWaterWheel(ctx,time) {
  const wheel=picture('art/backdrop-motion/ranch-wheel.png');
  if (!wheel.naturalWidth) return;
  const x=421,y=304,rx=150,ry=187;
  ctx.save();
  ctx.beginPath();
  // Preserve the painted rail, hub, posts and hay in front of the wheel.
  ctx.moveTo(263,110);ctx.lineTo(581,110);ctx.lineTo(581,295);
  ctx.lineTo(464,309);ctx.lineTo(452,327);ctx.lineTo(399,329);
  ctx.lineTo(373,410);ctx.lineTo(337,446);ctx.lineTo(285,408);
  ctx.lineTo(278,366);ctx.lineTo(258,349);ctx.closePath();
  ctx.moveTo(x+30,y);ctx.ellipse(x,y,30,31,0,0,Math.PI*2);
  ctx.clip('evenodd');
  ctx.translate(x,y);
  ctx.scale(1,ry/rx);
  ctx.beginPath();ctx.arc(0,0,rx,0,Math.PI*2);ctx.clip();
  const barn=picture('art/'+STATIC_ARENAS[3][0]);
  ctx.fillStyle='#1b1718';
  ctx.fillRect(-rx,-rx,rx*2,rx*2);
  ctx.globalAlpha=.48;
  ctx.drawImage(barn,180,8,154,79,-rx,-rx,rx*2,rx*2);
  ctx.globalAlpha=1;
  ctx.rotate(time*.0038);
  ctx.imageSmoothingEnabled=false;
  ctx.filter='brightness(.70) saturate(.73) sepia(.17)';
  ctx.drawImage(wheel,-rx,-rx,rx*2,rx*2);
  ctx.restore();
}

const BARN_LANTERNS = [[106,184],[598,156],[1194,181]];

// Launches are [tick, edge, lane, vx, vy, projectile, gravity, bounces].
// Vertical lanes are offsets from the position captured at the start of the warning.
const PHASE_TWO_HAZARDS = [
  null, // Marina retains the dedicated yacht laser.
  {name:'Vault crystals and chandeliers',color:'#e39bff',shots:[
    [0,'left',[72,272],12,9,'prism'],
    [12,'chandelier',PRISM_CHANDELIERS[0],-2,10,'prismwedge',.12],
    [27,'right',[1208,272],-14,4.4,'prism'],
    [42,'chandelier',PRISM_CHANDELIERS[1],-8.4,8,'prismwedge',.12]]},
  {name:'Floodgate pressure jets',color:'#75eaf5',shots:[
    [0,'floor',-105,2.3,-11,'pearl'],[18,'floor',128,-1.8,-12,'pearl']]},
  {name:'Threshing wheels and lantern fire',color:'#ffbf71',shots:[
    [0,'right',-27,-12,0,'gear'],
    [12,'lantern',BARN_LANTERNS[0],3.2,8.6,'barnFire',.15],
    [25,'left',-27,11,0,'gear'],
    [36,'lantern',BARN_LANTERNS[1],-7.4,8.4,'barnFire',.16],
    [55,'lantern',BARN_LANTERNS[2],-13.8,8.2,'barnFire',.18]]},
  {name:'Transit signal volley',color:'#ff80db',shots:[
    [0,'left',-155,16,0,'comet'],[20,'right',-65,-16,0,'comet']]},
  {name:'Bunker ceiling turrets',color:'#8dffad',shots:[
    [0,'ceiling',-134,2.6,10,'needle'],[14,'ceiling',110,-2.4,11,'needle'],[33,'ceiling',0,0,13,'needle']]},
  {name:'Forge slag spill',color:'#ff975c',shots:[
    [0,'right',-150,-12,-3,'pumpkin',.25,1],[24,'left',-112,10,-4,'pumpkin',.27,1]]},
  {name:'Astrolabe star volley',color:'#ffd482',shots:[
    [0,'astrolabe',CROWN_RING_CORES[0],4.1,9,'star'],
    [18,'astrolabe',CROWN_RING_CORES[1],2.1,10,'star'],
    [34,'astrolabe',CROWN_RING_CORES[2],12,2.5,'star'],
    [51,'astrolabe',CROWN_RING_CORES[3],-17,4.8,'star']]},
  {name:'Hatchery bio-pod volley',color:'#c0fa87',shots:[
    [0,'bioPod',HATCHERY_PODS[0],-2.5,8,'bioBubble',.12],
    [16,'bioPod',HATCHERY_PODS[1],2.8,8.8,'bioBubble',.13],
    [32,'bioPod',HATCHERY_PODS[2],-12,7.8,'bioBubble',.15],
    [51,'bioPod',HATCHERY_PODS[3],6.8,7.7,'bioBubble',.12]]},
  {name:'Dimensional rift crossfire',color:'#ef9fff',shots:[
    [0,'right',-210,-14,2,'crescent'],[16,'left',-129,13,-2,'crescent'],[34,'right',-37,-15,0,'crescent']]}
];
