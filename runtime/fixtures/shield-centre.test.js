/* ARCADE-0003: the X-button shield and the pickup shield ring the pilot the player sees.
 * Ground pilots are drawn from a feet anchor that is often not under the middle of the art
 * (sproto3152's idle art is centred 33px right of it, and a crouch, dash or walk frame moves it
 * again), so both shields take their centre from the art being drawn: PILOT_ART_CENTRES in
 * game.js. This decodes every drawn frame's PNG and checks, for all pilots and all poses, that the
 * real groundPose / groundArtCentre / pickupShieldBox from game.js land on the middle of the art.
 * A ring that followed every frame shook by up to 16px a step as arms and staffs swung, so the
 * idle pair and the walk cycle each hold one centre: the midpoint of the range their frames cover.
 * Both halves are checked: the ring does not move inside an animation, and it stays close to
 * every frame of it. */
const fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const game=read('game.js');

// Opaque-pixel bounds [left,top,width,height] of an 8-bit RGBA, non-interlaced PNG.
function alphaBounds(file){
  const png=fs.readFileSync(path.join(root,file));let at=8,width,height;const data=[];
  while(at<png.length){
    const size=png.readUInt32BE(at),type=png.toString('latin1',at+4,at+8),body=png.subarray(at+8,at+8+size);at+=12+size;
    if(type==='IHDR'){width=body.readUInt32BE(0);height=body.readUInt32BE(4);assert.deepEqual([body[8],body[9],body[12]],[8,6,0],file+' is 8-bit RGBA, not interlaced');}
    else if(type==='IDAT')data.push(body);
  }
  const raw=zlib.inflateSync(Buffer.concat(data)),stride=width*4,rows=Buffer.alloc(stride*height);
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)],from=y*(stride+1)+1,to=y*stride;
    for(let x=0;x<stride;x++){
      const a=x>=4?rows[to+x-4]:0,b=y?rows[to+x-stride]:0,c=x>=4&&y?rows[to+x-stride-4]:0,p=a+b-c;
      const predict=filter===0?0:filter===1?a:filter===2?b:filter===3?(a+b)>>1:Math.abs(p-a)<=Math.abs(p-b)&&Math.abs(p-a)<=Math.abs(p-c)?a:Math.abs(p-b)<=Math.abs(p-c)?b:c;
      rows[to+x]=(raw[from+x]+predict)&255;
    }
  }
  let left=width,top=height,right=-1,bottom=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(rows[(y*width+x)*4+3]){if(x<left)left=x;if(x>right)right=x;if(y<top)top=y;if(y>bottom)bottom=y;}
  return[left,top,right-left+1,bottom-top+1];
}

const Arcade={};vm.runInNewContext(read('runtime/sprite-bounds.js'),{Arcade});
const ART=vm.runInNewContext(read('assets.js')+';ART');
const playable=[...game.match(/const playable = \[([\s\S]*?)\n\];/)[1].matchAll(/\{id:'([^']+)'/g)].map(m=>m[1]);
assert.ok(playable.length>=14&&playable.includes('sproto3152'),'reads the playable pilots from game.js');
// The decoder agrees with the committed bounds wherever both exist.
for(const file of ['fighters/poses/sproto3152/00.png','fighters/poses/rivet/10-crouchLanding.png'])assert.equal(String(alphaBounds(file)),String(Arcade.spriteBounds[file]));

// The real declarations from game.js, run with stand-in mode switches.
const take=pattern=>{const m=game.match(pattern);assert.ok(m,'game.js still has '+pattern);return m[0];};
const source=[
  take(/^const PILOT_ART_CENTRES=\{[\s\S]*?\n\};$/m),
  take(/^const GROUND_SPRITE_SCALE=[^\n]*;$/m),
  take(/^function groundPose\(p\)\{[\s\S]*?\n\}$/m),
  take(/^function groundArtCentre\(p,pose=groundPose\(p\)\)\{[\s\S]*?\n\}$/m),
  take(/^function pickupShieldBox\(p\)\{[\s\S]*?\n\}$/m),
  take(/^function walk\(id, distance, frameDistance=12\) \{[\s\S]*?\n\}$/m),
  take(/^const playerHeight=[^\n]*;$/m),
  take(/^const PLAYER_WALK_CYCLE_DISTANCE = \d+;$/m)
].join('\n');
const world={flying:false,codebreak:false,player:null,time:0};
const api=vm.runInNewContext(source+'\n({PILOT_ART_CENTRES,groundPose,groundArtCentre,pickupShieldBox,cycle:PLAYER_WALK_CYCLE_DISTANCE})',
  {ART,isFlying:()=>world.flying,isCodebreak:()=>world.codebreak,CODE_CHARACTER_SCALE:.56,get player(){return world.player;},get time(){return world.time;}});
assert.equal(String(Object.keys(api.PILOT_ART_CENTRES).sort()),String([...playable].sort()),'one entry per playable pilot');

const stand={x:517.2,y:604,vy:0,grounded:true,crouch:false,dash:0,walking:false,distance:0,shot:9};
const near=(a,b)=>Math.abs(a-b)<1e-9;
let frames=0,worstBefore=0,worstDrift=0,worstShake=0;
// How far a held centre may sit from the middle of any one frame of its animation, in screen px.
const DRIFT_LIMIT=10;
for(const id of playable){
  const art=ART.sprites[id];
  // Every state drawGroundPlayer can draw: [label, player fields, time, the frame origin/main drew,
  // the animation it belongs to when that animation holds one centre].
  const states=[
    ['idle',{},0,art.poses[0],'idle'],['breathe',{},30,art.poses[1],'idle'],
    ['dash',{dash:5},0,art.poses[6]],['dash while crouched',{dash:5,crouch:true},0,art.poses[6]],
    ['crouch',{crouch:true},0,art.poses[10]],['crouch while walking',{crouch:true,walking:true},0,art.poses[10]],
    ['rise',{grounded:false,vy:-4},0,art.poses[8]],['fall',{grounded:false,vy:3},0,art.poses[9]],
    ...art.walk.flatMap((frame,i)=>[
      ['walk '+i,{walking:true,distance:(i+.5)*api.cycle/art.walk.length},0,frame,'walk'],
      ['walk back '+i,{walking:true,distance:(i+.5-art.walk.length)*api.cycle/art.walk.length},0,frame,'walk']])
  ];
  if(id==='rivet')states.push(['cast',{shot:1},0,art.cast.at(-2)],['cast end',{shot:2},0,art.cast.at(-1)]);
  for(const codebreak of [false,true]){const held={};for(const [label,fields,time,frame,animation] of states){
    const p={...stand,id,...fields},name=id+' '+label+(codebreak?' (codebreak)':'');
    Object.assign(world,{player:p,time,codebreak});
    const pose=api.groundPose(p),walking=p.walking&&!p.crouch&&!p.dash&&p.grounded,k=codebreak?.56:1;
    assert.equal(pose.frame,frame,name+': draws the same frame as before');
    assert.ok(near(pose.size,1.2*k*(walking?art.walkScale??1:1)),name+': draws at the same size as before');
    assert.equal(pose.scale,k);
    // sprite() puts the frame's anchor on (p.x,p.y) and scales about it.
    const [file,anchorX,anchorY]=frame,[left,top,width,height]=alphaBounds(file);
    const artX=p.x+(left+width/2-anchorX)*pose.size,artY=p.y+(top+height/2-anchorY)*pose.size;
    const centre=api.groundArtCentre(p,pose),box=api.pickupShieldBox(p);
    assert.ok(near(box.x+box.w/2,centre.x)&&near(box.y+box.h/2,centre.y),name+': pickup shield shares the X shield centre');
    if(animation){
      // One centre for the whole animation, so the ring cannot shake from frame to frame...
      const group=held[animation]??={centre,pair:pose.centre,size:pose.size,arts:[]};
      assert.equal(pose.centre,group.pair,name+': '+animation+' frames share one table pair');
      assert.ok(near(centre.x,group.centre.x)&&near(centre.y,group.centre.y),name+': ring does not move within the '+animation+' animation');
      // ...and it stays near the middle of each frame.
      const drift=Math.max(Math.abs(centre.x-artX),Math.abs(centre.y-artY));
      assert.ok(drift<=DRIFT_LIMIT,name+': ring is '+drift.toFixed(1)+'px from the drawn frame');
      worstDrift=Math.max(worstDrift,drift);group.arts.push([artX,artY]);
    }else assert.ok(near(centre.x,artX)&&near(centre.y,artY),name+': shield is centred on the drawn frame');
    const diameter=(p.crouch?72:110)*k+32;
    assert.ok(near(box.w,diameter)&&near(box.h,diameter),name+': pickup ring keeps its size');
    frames++;worstBefore=Math.max(worstBefore,Math.abs(artX-p.x));
  }
  // The held pair is the midpoint of the range its frames cover (to the table's whole numbers),
  // and following each frame instead would have moved the ring this much between frames.
  for(const [animation,group] of Object.entries(held))for(const axis of [0,1]){
    const values=group.arts.map(a=>a[axis]),middle=(Math.min(...values)+Math.max(...values))/2;
    assert.ok(Math.abs([group.centre.x,group.centre.y][axis]-middle)<=group.size/4+1e-9,id+' '+animation+': held centre is the midpoint of its frames');
    worstShake=Math.max(worstShake,Math.max(...values)-Math.min(...values));
  }}
}
assert.ok(worstShake>15,'following every frame shook the ring by more than 15px');
assert.ok(worstBefore>30,'the old centre (player.x) was more than 30px off for some frame');
// The reported pilot standing at the reported position: the rings used to sit on x 517.2.
Object.assign(world,{player:{...stand,id:'sproto3152'},time:0,codebreak:false});
assert.ok(near(api.groundArtCentre(world.player).x,550.2));
// A pilot without a table entry keeps the old centre.
world.player={...stand,id:'sproto3152'};
const saved=api.PILOT_ART_CENTRES.sproto3152;delete api.PILOT_ART_CENTRES.sproto3152;
assert.deepEqual({...api.groundArtCentre(world.player)},{x:517.2,y:604-64*1.2});
api.PILOT_ART_CENTRES.sproto3152=saved;

// Flight is unchanged: the saucer, speedboat and jet shields stay on the craft.
world.flying=true;
assert.deepEqual({...api.pickupShieldBox(world.player)},{x:517.2-115,y:604-115,w:230,h:230});
world.flying=false;
assert.match(game,/if \(p\.shield\) \{ const centre=groundArtCentre\(p,pose\); drawPlayerShield\('shield',centre\.x,centre\.y,scale\); \}/);
assert.match(game,/sprite\(p\.id,pose\.frame,p\.x,p\.y,1,pose\.size\)/);
assert.equal(game.match(/pickupShieldBox\((?:p|player)\)\)/g)?.length,2,'solo and co-op pickup shields');
assert.equal(game.match(/drawPlayerShield\('saucer-shield',(?:p|player)\.x,(?:p|player)\.y,1\.4\)/g)?.length,3);
console.log('shield centre: '+playable.length+' pilots, '+frames+' drawn states, held centres within '+worstDrift.toFixed(1)+'px of every frame');
