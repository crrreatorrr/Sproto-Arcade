/* ARCADE-0003: the X-button shield and the pickup shield ring the pilot the player sees.
 * Ground pilots are drawn from a feet anchor that is not always under the middle of the art
 * (sproto3152's idle art is centred 33px right of it), so both shields take their centre from
 * PILOT_ART_CENTRE_X in game.js. This checks that table against the art data and both draw sites. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const game=read('game.js');

const Arcade={};vm.runInNewContext(read('runtime/sprite-bounds.js'),{Arcade});
const ART=vm.runInNewContext(read('assets.js')+';ART');
const playable=[...game.match(/const playable = \[([\s\S]*?)\n\];/)[1].matchAll(/\{id:'([^']+)'/g)].map(m=>m[1]);
assert.ok(playable.length>=14&&playable.includes('sproto3152'),'reads the playable pilots from game.js');

// The real declarations from game.js, run with stand-in mode switches.
const take=pattern=>{const m=game.match(pattern);assert.ok(m,'game.js still has '+pattern);return m[0];};
const source=[
  take(/^const PILOT_ART_CENTRE_X=\{[^\n]*\};$/m),
  take(/^const GROUND_SPRITE_SCALE=[^\n]*;$/m),
  take(/^const groundArtCentre=[^\n]*;$/m),
  take(/^function pickupShieldBox\(p\)\{[\s\S]*?\n\}$/m),
  take(/^const playerHeight=[^\n]*;$/m)
].join('\n');
const world={flying:false,codebreak:false,player:null};
const api=vm.runInNewContext(source+'\n({PILOT_ART_CENTRE_X,GROUND_SPRITE_SCALE,groundArtCentre,pickupShieldBox})',
  {isFlying:()=>world.flying,isCodebreak:()=>world.codebreak,CODE_CHARACTER_SCALE:.56,get player(){return world.player;}});

assert.deepEqual(Object.keys(api.PILOT_ART_CENTRE_X).sort(),[...playable].sort(),'one entry per playable pilot');
for(const id of playable){
  const [file,anchorX,anchorY]=ART.sprites[id].poses[0],[left,top,width,height]=Arcade.spriteBounds[file];
  assert.equal(api.PILOT_ART_CENTRE_X[id],left+width/2-anchorX,id+': table matches the idle art');
  // The pilot as drawn at x 517.2, y 604 (the report's position): sprite() puts the anchor there.
  const p={id,x:517.2,y:604,crouch:false},k=api.GROUND_SPRITE_SCALE;world.player=p;
  const art={left:p.x+(left-anchorX)*k,right:p.x+(left+width-anchorX)*k,top:p.y+(top-anchorY)*k,bottom:p.y+(top+height-anchorY)*k};
  const centre=api.groundArtCentre(p),box=api.pickupShieldBox(p);
  assert.ok(Math.abs(centre.x-(art.left+art.right)/2)<1e-9,id+': shield is centred sideways on the drawn pilot');
  assert.ok(Math.abs(centre.y-(art.top+art.bottom)/2)<=1,id+': shield is centred vertically on the drawn pilot');
  assert.ok(Math.abs(box.x+box.w/2-centre.x)<1e-9&&Math.abs(box.y+box.h/2-centre.y)<1e-9,id+': pickup shield shares that centre');
  assert.equal(box.w,142);assert.equal(box.h,142);
}
// The reported pilot: both rings used to sit on x 517.2, 33px left of the art.
world.player={id:'sproto3152',x:517.2,y:604,crouch:false};
assert.ok(Math.abs(api.groundArtCentre(world.player).x-550.2)<1e-9);

// Flight is unchanged: the saucer, speedboat and jet shields stay on the craft.
world.flying=true;
assert.deepEqual({...api.pickupShieldBox(world.player)},{x:517.2-115,y:604-115,w:230,h:230});
world.flying=false;
// Crouching keeps the ring's old height around the crouch box and only moves sideways.
world.player={id:'sproto3152',x:517.2,y:604,crouch:true};
assert.deepEqual({...api.pickupShieldBox(world.player)},{x:550.2-52,y:604-88,w:104,h:104});
// Codebreak draws the pilot at .56, so the offset shrinks with it.
world.codebreak=true;world.player={id:'sproto3152',x:100,y:300,crouch:false};
assert.ok(Math.abs(api.groundArtCentre(world.player,.56).x-(100+27.5*1.2*.56))<1e-9);
world.codebreak=false;

// Both draw sites use the shared centre, and the flying shields still use the craft position.
assert.match(game,/if \(p\.shield\) \{ const centre=groundArtCentre\(p,scale\); drawPlayerShield\('shield',centre\.x,centre\.y,scale\); \}/);
assert.equal(game.match(/pickupShieldBox\((?:p|player)\)\)/g)?.length,2,'solo and co-op pickup shields');
assert.equal(game.match(/drawPlayerShield\('saucer-shield',(?:p|player)\.x,(?:p|player)\.y,1\.4\)/g)?.length,3);
console.log('shield centre: '+playable.length+' pilots');
