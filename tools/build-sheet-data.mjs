#!/usr/bin/env node
// Builds art/bosses/sheet-data.js from art/bosses/catalog.json (the slicer's measurements).
// Patterns are the gameplay clock. Frame files, pivots and event markers come from the catalog,
// which measured them off the sliced sheets.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'art/bosses/catalog.json'),'utf8'));

const patterns={
  bront:{
    level:0, drawH:280, feet:true,
    intro:'p1-wheelhouse-entry', defeat:'p1-slam-recoil-steam', hurtClip:'p1-slam-recoil-steam',
    hurt:{half:118, top:230, bottom:0}, weak:109, anchor:null,
    // yOff is pixels above the floor for the projectile center. aim uses the altitude locked earlier.
    phases:{
      1:[
        {clip:'p1-wheelhouse-entry', tell:20, active:10, rest:18},
        {clip:'p1-piston-hang-cue', tell:54, active:8, rest:6, cue:'PISTON HANG — JUMP THE WAKE'},
        {clip:'p1-breakwater-slam-release', tell:14, active:18, rest:12, shot:{shape:'slamWake', yOff:20, vx:-6.6}, cue:'LOW WAKE'},
        {clip:'p1-slam-recoil-steam', tell:8, active:12, rest:64, exposed:true, cue:'VENT OPEN — FIRE'}
      ],
      2:[
        {clip:'p2-pipe-charge-traverse', tell:46, active:8, rest:6, cue:'PIPES CHARGING'},
        {clip:'p2-front-nozzle-lock', tell:40, active:8, rest:6, cue:'NOZZLE LOCK'},
        {clip:'p2-pressure-nozzle-fire', tell:12, active:16, rest:8, shot:{shape:'pressureCurtain', yOff:96, vx:-5.1}, cue:'PRESSURE CURTAIN'},
        {clip:'p2-pressure-lock-release', tell:8, active:12, rest:10},
        {clip:'p2-valve-release-turn', tell:8, active:10, rest:52, exposed:true, cue:'VALVE OPEN — FIRE'},
        {clip:'p1-breakwater-slam-release', tell:12, active:14, rest:10, shot:{shape:'slamWake', yOff:20, vx:-6.2}, cue:'LOW WAKE'}
      ]
    }
  },
  crapto:{
    level:2, drawH:270, feet:false,
    intro:'p1-dredger-saucer-arrival', defeat:'p2-pump-vent-expose', hurtClip:'p1-intake-armor-deflect',
    hurt:{half:120, top:150, bottom:130}, weak:16,
    anchor:{x:1040, y:390, bob:8},
    phases:{
      1:[
        {clip:'p1-dredger-saucer-arrival', tell:24, active:10, rest:14},
        {clip:'p1-crapto-nozzle-trim', tell:52, active:8, rest:6, lockAim:true, cue:'NOZZLE LOCK — CHANGE ALTITUDE'},
        {clip:'p1-sludge-nozzle-fire', tell:10, active:14, rest:8, shot:{shape:'sludgeBlob', aim:true, vx:-5.4}, cue:'SLUDGE'},
        {clip:'p1-sludge-belch-release', tell:8, active:12, rest:10},
        {clip:'p1-intake-armor-deflect', tell:8, active:10, rest:50, exposed:true, cue:'GLASS OPEN — FIRE'}
      ],
      2:[
        {clip:'p2-lower-shutter-load', tell:40, active:8, rest:6, cue:'SHUTTER LOAD'},
        {clip:'p2-shutter-route-release', tell:36, active:8, rest:6, lockAim:true, cue:'BACKFLUSH — MOVE'},
        {clip:'p2-backflush-pump-fire', tell:10, active:16, rest:8, shot:{shape:'backflushSurge', aim:true, vx:-5.0}, cue:'BACKFLUSH'},
        {clip:'p2-backflush-release', tell:8, active:10, rest:8},
        {clip:'p2-pump-vent-expose', tell:8, active:10, rest:48, exposed:true, cue:'PUMP VENT — FIRE'},
        {clip:'p1-crapto-nozzle-trim', tell:28, active:6, rest:4, lockAim:true, cue:'NOZZLE LOCK'},
        {clip:'p1-sludge-belch-release', tell:8, active:14, rest:12, shot:{shape:'sludgeBlob', aim:true, vx:-5.2}}
      ]
    }
  },
  zephyr:{
    level:3, drawH:300, feet:true,
    intro:'p1-pilot-lantern-lift', defeat:'p2-engine-linkage-expose', hurtClip:null,
    hurt:{half:110, top:268, bottom:0}, weak:120, anchor:null,
    phases:{
      1:[
        {clip:'p1-pilot-lantern-lift', tell:42, active:8, rest:8, cue:'LANTERN LIFTS'},
        {clip:'p1-roller-feed-load', tell:30, active:8, rest:6},
        {clip:'p1-harvest-roll-cue', tell:36, active:6, rest:4, cue:'JUMP THE ROLLER'},
        {clip:'p1-harvest-roll-launcher-fire', tell:10, active:16, rest:8, shot:{shape:'harvestRoll', yOff:28, vx:-5.8}, cue:'ROLLER'},
        {clip:'p1-harvest-roll-release', tell:8, active:10, rest:52, exposed:true, cue:'VENT OPEN — FIRE'}
      ],
      2:[
        {clip:'p2-coupling-latch-load', tell:40, active:8, rest:6, cue:'COUPLING LATCH'},
        {clip:'p2-linkage-guard-unlock', tell:34, active:8, rest:6, cue:'LINKAGE UNLOCK'},
        {clip:'p2-engine-linkage-expose', tell:8, active:12, rest:46, exposed:true, cue:'ENGINE OPEN — FIRE'},
        {clip:'p2-harvest-roll-reprise', tell:18, active:16, rest:12, shot:{shape:'harvestRoll', yOff:28, vx:-5.5}, cue:'ROLLER'}
      ]
    }
  }
};

const shots={
  slamWake:{w:116, h:34, color:'#8fd4ff', boss:'bront', clip:'p1-slam-wake-projectile'},
  pressureCurtain:{w:78, h:150, color:'#9ee7ff', boss:'bront', clip:'p2-pressure-curtain-projectile'},
  sludgeBlob:{w:74, h:50, color:'#b6e15a', boss:'crapto', clip:'p1-sludge-blob-projectile'},
  backflushSurge:{w:86, h:78, color:'#8fd18a', boss:'crapto', clip:'p2-backflush-surge-projectile'},
  harvestRoll:{w:58, h:50, color:'#f0c36a', boss:'zephyr', clip:'p1-harvest-roll-projectile'}
};

function clipRecord(boss, name, raw){
  const {frames, frameCount, frameSize, pivot, muzzle, weakPoint, events, eventDeltas, generationId, kind}=raw;
  return {kind, frames, frameCount, frameSize, pivot, muzzle, weakPoint, events, eventDeltas, generationId};
}

const bosses={};
for (const [id, meta] of Object.entries(patterns)) {
  const measured=catalog.bosses[id].clips;
  const clips={};
  for (const [name, raw] of Object.entries(measured)) clips[name]=clipRecord(id, name, raw);
  for (const phase of Object.values(meta.phases)) {
    for (const step of phase) if (!clips[step.clip]) throw new Error('missing clip '+id+' '+step.clip);
  }
  bosses[id]={...meta, clips};
}
for (const shot of Object.values(shots)) {
  if (!bosses[shot.boss].clips[shot.clip]) throw new Error('missing shot clip '+shot.clip);
}

const data={byLevel:{0:'bront', 2:'crapto', 3:'zephyr'}, bosses, shots};
const out=path.join(root,'art/bosses/sheet-data.js');
fs.writeFileSync(out, '/* Runtime frames sliced from the approved sheets. Event markers are the measured frame-to-frame change. */\nconst SHEET_DATA = '+JSON.stringify(data)+';\n');
const bytes=fs.statSync(out).size;
let frames=0, art=0;
for (const boss of Object.values(bosses)) for (const clip of Object.values(boss.clips)) {
  frames+=clip.frameCount;
  for (const file of clip.frames) art+=fs.statSync(path.join(root, file)).size;
}
console.log(JSON.stringify({sheetDataBytes:bytes, frames, artBytes:art}, null, 2));
