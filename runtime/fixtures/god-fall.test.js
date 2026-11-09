/* ARC-DEC-02: god mode protects against falls during chase (Rooftop Breakaway) and climb
 * (Codebreak Ascent) barrages. Without god mode the fall still ends the run exactly as before.
 * Runs the real story simulation extracted from game.js (tools/build-server-sim.mjs, the same
 * source as dist/arcade-sim.server.js) and replays the committed golden inputs up to the first
 * barrage, then drops the player below the arena. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');

(async()=>{
  const {buildSimSource}=await import(path.join(root,'tools/build-server-sim.mjs'));
  const {source}=buildSimSource({dev:true});
  // Test-only hooks: god mode cannot be switched on in the server simulation (it rejects god logs).
  const tail=`api._test={god:function(on){godMode=on;},hits:function(){return godHits;},index:function(id){return LEVELS.findIndex(function(l){return l.id===id;});},H:H,
    onPlatform:function(){var p=player;return isCodebreakClimb()?Boolean(codebreakPlatformAt(p.x,p.y,p.y)):Boolean(chasePlatformAt(p.x,p.y,p.y));},
    overlay:function(){return mode;}};`;
  const header=/^var ARCADE_SIM_VERSION = '([0-9a-f]{16})';/.exec(fs.readFileSync(path.join(root,'dist/arcade-sim.server.js'),'utf8'));
  const load=()=>{const c=vm.createContext({structuredClone,ARCADE_SIM_VERSION:header[1]});vm.runInContext(`var ArcadeSim=(function(){'use strict';\n${source}\n${tail}\nreturn api;})();`,c);return c.ArcadeSim;};

  for(const [file,label] of [['story-11.json','chase'],['story-12.json','climb']]){
    const gold=JSON.parse(fs.readFileSync(path.join(root,'qa/golden',file),'utf8')).log;
    // Replay the golden's inputs to the first barrage tick, once per god setting.
    const atBarrage=sim=>{
      const {masks}=sim.decodeInputs(gold.inputs,gold.ticks),T=sim._test,D=sim._dev;
      D.reset(T.index(gold.rules.level),gold.loadout.pilot,gold.rules.shieldWait,gold.seed);
      for(const m of masks){D.step(m);const s=D.state();if(s.mode!=='play')break;if(s.densityShots&&s.densityShots.length)return m;}
      throw Error(label+': golden run reached no barrage');
    };
    const drop=sim=>{const snap=sim._dev.snapshot();Object.assign(snap.s.player,{y:sim._test.H+90,vy:6,grounded:false,dash:0});sim._dev.restore(snap);};

    // Without god mode: the fall ends the run on the same tick, as before.
    {
      const sim=load();atBarrage(sim);drop(sim);
      const before=sim._dev.state().time;
      sim._dev.step(0);
      const s=sim._dev.state();
      assert.equal(s.mode,'lost',label+': a barrage fall without god mode loses');
      assert.equal(s.player.hp,0,label+': hp is 0 after the fall');
      assert.equal(s.time,before+1);
    }
    // God mode: the fall counts as a god hit and the player stands on a platform again.
    {
      const sim=load();sim._test.god(true);atBarrage(sim);drop(sim);
      const hp=sim._dev.state().player.hp;
      sim._dev.step(0);
      let s=sim._dev.state();
      assert.equal(s.mode,'play',label+': god mode survives a barrage fall');
      assert.equal(sim._test.hits(),1,label+': the fall counts one god hit');
      assert.equal(s.player.hp,hp,label+': god mode keeps hp');
      assert.ok(s.player.y<=sim._test.H&&s.player.grounded,label+': player is back on screen and standing');
      assert.ok(sim._test.onPlatform(),label+': player stands on a platform');
      // And keeps playing: a few idle ticks later the run is still alive.
      for(let i=0;i<20&&s.mode==='play';i++){sim._dev.step(0);s=sim._dev.state();}
      assert.equal(s.mode,'play',label+': still playing after the rescue');
    }
  }
  console.log('PASS ARC-DEC-02 chase and climb barrage falls: lost without god mode (unchanged), god mode counts a hit and rescues onto a platform');
})().catch(e=>{console.error(e);process.exitCode=1;});
