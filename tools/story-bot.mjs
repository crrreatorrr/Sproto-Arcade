#!/usr/bin/env node
// Scripted story-mode player that finds legal, god-mode-free input logs that clear each level, for
// the golden replay tests (qa/golden/). It is a deterministic lookahead search over the real
// simulation (the ES2020 source loaded by tools/build-server-sim.mjs), not a human playtest:
// every few ticks it tries a set of short actions, plays each forward with a few follow-ups and
// keeps the one that loses the least health and makes the most progress.
//   node tools/story-bot.mjs [levelNumber ...]   write qa/golden/story-<NN>.json (default: all 13)
import fs from 'node:fs';
import path from 'node:path';
import {loadSourceSim,root} from './build-server-sim.mjs';

const L=1,R=2,U=4,D=8,JUMP=16,HOLD=32,DASH=64,SHIELD=128,MISSILE=256,BOMB=512;
const SEG=6, LOOK=36;
const sim=loadSourceSim({dev:true});
const dev=sim._dev;
const replay=sim; // verifyClear lives on the same object

// An action is the held mask plus what is tapped on its first tick.
const act=(held,tap=0)=>({held,tap});
function actions(kind) {
  const fire=MISSILE|BOMB;
  if (kind==='flight') {
    const dirs=[0,L,R,U,D,U|L,U|R,D|L,D|R];
    return [...dirs.map(d=>act(d,fire)),act(U,DASH|fire),act(D,DASH|fire),act(L,DASH|fire),act(0,SHIELD|fire)];
  }
  if (kind==='chase') return [act(0),act(R),act(L),act(HOLD,JUMP),act(R|HOLD,JUMP),act(L|HOLD,JUMP),act(R,DASH),act(D),act(0,SHIELD)];
  if (kind==='climb') return [act(0,fire),act(L,fire),act(R,fire),act(HOLD,JUMP|fire),act(L|HOLD,JUMP|fire),act(R|HOLD,JUMP|fire),act(L|HOLD,DASH),act(R|HOLD,DASH),act(0,SHIELD)];
  return [act(0,fire),act(L,fire),act(R,fire),act(HOLD,JUMP|fire),act(L|HOLD,JUMP|fire),act(R|HOLD,JUMP|fire),act(D,fire),
    act(L,DASH|fire),act(R,DASH|fire),act(0,SHIELD|fire)];
}
const masksOf=(a,n)=>Array.from({length:n},(_,i)=>a.held|(i===0?a.tap:0));

function kindOf(level,state) {
  if (level===2 || level===6) return 'flight';
  if (level===10) return 'chase';
  if (level===11) return state.boss.phase===1?'climb':'boss';
  return 'boss';
}
// Higher is better. Health dominates; then progress toward the clear.
function score(level,s,start) {
  if (dev.cleared()>=0) return 1e9-s.time;
  if (s.mode==='lost') return -1e9;
  let v=s.player.hp*1e6;
  if (level===10) v+=(s.camera+s.player.x)-Math.abs(s.player.x-640)*.5+(s.player.grounded?50:0);
  else if (level===11 && s.boss.phase===1) v+=s.camera*2-Math.abs(s.player.y-330)*.8+(s.player.grounded?100:0);
  else {
    const bossProgress=s.phaseShift||s.boss.phase===2?2000+(s.boss.max-s.boss.hp):(s.boss.max-s.boss.hp);
    v+=bossProgress*40-Math.abs(s.player.x-(level===11?320:420))*.2;
    if (s.player.shieldWait>0 && start.player.shieldWait===0) v-=400; // keep the shield for pulses
  }
  return v;
}

function playLevel(level) {
  dev.reset(level,'rivet',0,0x5eed+level);
  const masks=[];
  while (dev.state().mode==='play' && masks.length<60*60*12) {
    const base=dev.snapshot(), start=dev.state();
    const kind=kindOf(level,start), options=actions(kind);
    // Follow-ups: stand, step either way, jump, crouch (ground bosses: the ceiling sweep) or shield.
    const follow=[options[0],options[1],options[2],options[3],...(kind==='boss'||kind==='chase'?[options[6]]:[]),options[options.length-1]]
      .map(f=>Array.from({length:LOOK},(_,i)=>i%SEG===0?f.held|f.tap:f.held));
    // Climbing: jumps with the air jump near the top of the arc, drifting either way or not.
    if (kind==='climb') for (const side of [0,L,R]) for (const second of [10,16,22]) {
      follow.push(Array.from({length:LOOK},(_,i)=>side|HOLD|(i===0||i===second?JUMP:0)));
    }
    let best=null;
    for (const a of options) {
      let value=-Infinity;
      for (const f of follow) {
        dev.restore(base);
        for (const m of masksOf(a,SEG)) { if (dev.state().mode!=='play') break; dev.step(m); }
        for (let i=0;i<f.length && dev.state().mode==='play';i++) dev.step(f[i]);
        value=Math.max(value,score(level,dev.state(),start));
      }
      if (!best || value>best.value) best={a,value};
    }
    dev.restore(base);
    for (const m of masksOf(best.a,SEG)) { if (dev.state().mode!=='play') break; dev.step(m); masks.push(m); }
    if (masks.length%1200<SEG) process.stderr.write(`  level ${level+1}: tick ${masks.length} hp ${dev.state().player.hp} boss ${dev.state().boss.hp}\n`);
  }
  return {masks,cleared:dev.cleared(),mode:dev.state().mode};
}

/** The log the browser would send for a run with these masks (see runtime/story/replay.js). */
export function logFor(level,masks,{kind='clear',godMode=false}={}) {
  const info=sim.levels[level];
  return {schema:1,simVersion:sim.ARCADE_SIM_VERSION,seed:0x5eed+level,rules:{mode:'story',level:info.stage,shieldWait:0},
    loadout:{pilot:'rivet'},ticks:masks.length,inputs:encode(masks),
    claimed:{kind,stage:info.stage,...(kind==='boss'?{bossId:info.bossId}:{}),ticks:masks.length},godMode};
}
function encode(masks) {
  // Same encoding as ArcadeReplay.encodeInputs, reached through a vm-free copy of the bytes.
  const bytes=[1,1];const v=n=>{while(n>=128){bytes.push((n&127)|128);n=Math.floor(n/128);}bytes.push(n);};
  v(masks.length);
  for (let i=0;i<masks.length;) { let r=1; while (i+r<masks.length && masks[i+r]===masks[i]) r++; v(masks[i]); v(r); i+=r; }
  return Buffer.from(bytes).toString('base64');
}

if (process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)) {
  const wanted=process.argv.slice(2).map(Number).filter(Boolean);
  const levels=(wanted.length?wanted:Array.from({length:sim.levels.length},(_,i)=>i+1)).map(n=>n-1);
  fs.mkdirSync(path.join(root,'qa/golden'),{recursive:true});
  for (const level of levels) {
    const t0=Date.now();
    const run=playLevel(level);
    const info=sim.levels[level];
    if (run.cleared<0) { console.error(`level ${level+1} (${info.title}): not cleared (${run.mode} after ${run.masks.length} ticks)`); process.exitCode=1; continue; }
    const log=logFor(level,run.masks,{kind:'boss'});
    const result=replay.verifyClear(log);
    if (!result.ok) { console.error(`level ${level+1}: fresh replay failed: ${result.error}`); process.exitCode=1; continue; }
    const file=path.join(root,'qa/golden',`story-${String(level+1).padStart(2,'0')}.json`);
    fs.writeFileSync(file,JSON.stringify({level:info.stage,title:info.title,bossId:info.bossId,source:'tools/story-bot.mjs',
      expect:{ok:true,kind:'boss',stage:info.stage,bossId:info.bossId,godMode:false,ticks:result.ticks,endHash:result.endHash},log},null,1)+'\n');
    console.log(`level ${level+1} ${info.title}: cleared in ${result.ticks} ticks, hp left ${dev.state().player.hp}, ${((Date.now()-t0)/1000).toFixed(0)} s -> ${path.relative(root,file)}`);
  }
}
