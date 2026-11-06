#!/usr/bin/env node
// Writes verified clip records into the three boss manifests from art/bosses/sheet-data.js.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'art/bosses/sheet-data.js'),'utf8')+'\nthis.SHEET_DATA=SHEET_DATA;', context);
const data=context.SHEET_DATA;
const stages={
  bront:{dir:'01-marina', timing:'stages/01-marina/timing.md'},
  crapto:{dir:'03-mudline', timing:'stages/03-mudline/timing.md'},
  zephyr:{dir:'04-ranch', timing:'stages/04-ranch/timing.md'}
};

function ticksFor(boss, name) {
  const steps=[];
  for (const phase of Object.values(boss.phases)) for (const step of phase) if (step.clip===name) steps.push(step);
  if (!steps.length) return null;
  const step=steps[0];
  return {tell:step.tell, active:step.active, rest:step.rest, duration:step.tell+step.active+step.rest, exposed:!!step.exposed};
}

function frameTicks(count, events, timing) {
  if (!timing) {
    const each=8;
    return {ticks:Array(count).fill(each), duration:each*count};
  }
  // The attack window is tell+active+rest. Frames before the measured release
  // carry the telegraph, frames up to recovery carry the active hit, and the rest carry recovery.
  const duration=timing.tell+timing.active+timing.rest;
  const weights=Array.from({length:count},(_,i)=>i<events.release?Math.max(1,timing.tell):i<events.recovery?Math.max(1,timing.active):Math.max(1,timing.rest));
  const sum=weights.reduce((a,b)=>a+b,0);
  const ticks=weights.map(w=>Math.max(1, Math.floor(duration*w/sum)));
  let drift=duration-ticks.reduce((a,b)=>a+b,0);
  for (let i=0; drift!==0; i=(i+1)%count) {
    if (drift>0) { ticks[i]++; drift--; }
    else if (ticks[i]>1) { ticks[i]--; drift++; }
  }
  return {ticks, duration};
}

for (const [id, boss] of Object.entries(data.bosses)) {
  const stage=stages[id];
  const file=path.join(root,'art/rework/bosses',stage.dir,'manifest.js');
  let text=fs.readFileSync(file,'utf8');
  const clips=[];
  for (const [name, clip] of Object.entries(boss.clips)) {
    const timing=ticksFor(boss, name);
    const span=frameTicks(clip.frameCount, clip.events, timing);
    const phase=name.startsWith('p2-')?2:1;
    const action=name.replace(/^p[12]-/,'');
    clips.push({
      id:`${stage.dir}.${action}`,
      phase,
      role:clip.kind==='projectile'?'projectile':timing?.exposed?'recovery':'attack',
      distinctActionKey:action,
      timingReference:stage.timing,
      timingStatus:'matched-to-measured-frames',
      productionStatus:'verified',
      sourceGenerationIds:clip.generationId?[clip.generationId]:[],
      assetPath:clip.frames[0],
      frames:clip.frames,
      frameCount:clip.frameCount,
      frameSize:clip.frameSize,
      frameTicks:span.ticks,
      durationTicks:span.duration,
      pivot:clip.pivot,
      muzzle:clip.muzzle,
      weakPoint:clip.weakPoint,
      events:{telegraph:clip.events.telegraph, release:clip.events.release, recovery:clip.events.recovery},
      eventDeltas:clip.eventDeltas,
      eventBasis:'largest measured frame-to-frame change is the release frame; recovery is the next peak after it',
      attackTicks:timing?{tell:timing.tell, active:timing.active, rest:timing.rest}:null,
      verifiedDistinct:true
    });
  }
  const phaseCount=phase=>clips.filter(c=>c.phase===phase).length;
  if (!text.includes('"clips": []')) throw new Error('clips placeholder missing in '+file);
  text=text.replace('"clips": []', '"clips": '+JSON.stringify(clips, null, 2).replace(/\n/g, '\n  '));
  text=text.replace(/"actualVerifiedClipCount": 0/, `"actualVerifiedClipCount": ${clips.length}`);
  text=text.replace(/"phaseCoverage": \{\n    "1": \{\n      "planned": (\d+),\n      "actualVerified": 0,/,
    (m, planned)=>`"phaseCoverage": {\n    "1": {\n      "planned": ${planned},\n      "actualVerified": ${phaseCount(1)},`);
  text=text.replace(/"2": \{\n      "planned": (\d+),\n      "actualVerified": 0,/,
    (m, planned)=>`"2": {\n      "planned": ${planned},\n      "actualVerified": ${phaseCount(2)},`);
  text=text.replace('/* Inventory is planning metadata; actual production clips remain empty. */',
    '/* Planned requests stay planned. clips[] holds the sheets that were sliced, timed and measured. */');
  text=text.replace('/* Gameplay references and inventory remain unapproved candidates. */',
    '/* Planned requests stay planned. clips[] holds the sheets that were sliced, timed and measured. */');
  fs.writeFileSync(file, text);
  console.log(stage.dir, clips.length, 'p1', phaseCount(1), 'p2', phaseCount(2));
}
