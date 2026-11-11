/* story-par.js (clear-screen par times) must be regenerated with the goldens, and the rank and
 * best-time rules in story-progress.js must hold. Node only. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
(async()=>{
  const {storyParSource,PAR_FACTOR}=await import(path.join(root,'tools/build-story-par.mjs'));
  assert.equal(fs.readFileSync(path.join(root,'story-par.js'),'utf8'),storyParSource(),'story-par.js is stale: run node tools/build-story-par.mjs');
  const scope=vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root,'story-par.js'),'utf8')+';globalThis.PAR=STORY_PAR_TICKS;',scope);
  vm.runInContext(fs.readFileSync(path.join(root,'story-progress.js'),'utf8'),scope);
  const P=scope.ArcadeProgress,par=scope.PAR,plain=v=>JSON.parse(JSON.stringify(v));
  assert.equal(Object.keys(par).length,13,'a par for every story level');
  for(let level=1;level<=13;level++){
    const gold=JSON.parse(fs.readFileSync(path.join(root,'qa/golden',`story-${String(LEVEL_FILE(level)).padStart(2,'0')}.json`),'utf8'));
    assert.equal(par[gold.level],Math.round(gold.expect.ticks*PAR_FACTOR));
    assert.equal(P.rankFor({ticks:gold.expect.ticks,hits:0,par:par[gold.level]}),'S','a hitless run at the bot\'s pace is an S');
  }
  function LEVEL_FILE(n){return n;}

  // Ranks.
  assert.equal(P.rankFor({ticks:100,hits:0,par:100}),'S');
  assert.equal(P.rankFor({ticks:101,hits:0,par:100}),'A','over par is not an S');
  assert.equal(P.rankFor({ticks:115,hits:2,par:100}),'A');
  assert.equal(P.rankFor({ticks:116,hits:2,par:100}),'B');
  assert.equal(P.rankFor({ticks:50,hits:3,par:100}),'B','three hits is a B however fast');
  assert.equal(P.rankFor({ticks:50,hits:0,par:100,checkpoint:true}),'C','a checkpoint clear is always a C');
  assert.equal(P.rankFor({ticks:99999,hits:0}),'S','without a par, time does not limit the rank');

  // Bests: an old save loads, a full clear writes one, a worse run leaves it, merge keeps the better.
  const old={v:1,cleared:[0,3],unlocked:['morelight'],updatedAt:5};
  assert.deepEqual(plain(P.normalize(old)),old,'a save without bests is unchanged and gains no key');
  let r=P.recordBest(old,0,{ticks:9000,hits:1,rank:'A'},10);
  assert.equal(r.improved,true);assert.deepEqual(plain(r.save.best),{0:{ticks:9000,hits:1,rank:'A'}});assert.equal(r.save.updatedAt,10);
  assert.deepEqual(plain(r.save.cleared),[0,3],'recording a best changes nothing else');
  let worse=P.recordBest(r.save,0,{ticks:8000,hits:4,rank:'B'},20);
  assert.equal(worse.improved,false,'a faster run with a worse rank does not replace the best');
  assert.deepEqual(plain(worse.best),{ticks:9000,hits:1,rank:'A'});assert.equal(worse.save.updatedAt,10);
  let faster=P.recordBest(r.save,0,{ticks:8500,hits:2,rank:'A'},30);
  assert.equal(faster.improved,true,'the same rank in less time replaces it');
  assert.equal(P.recordBest(r.save,0,{ticks:9000,hits:0,rank:'C'},40).improved,false,'rank C is never stored');
  assert.equal(P.recordBest(r.save,13,{ticks:9000,hits:0,rank:'S'},40).improved,false);
  assert.equal(P.recordBest(r.save,1,{ticks:0,hits:0,rank:'S'},40).improved,false);
  const cloud=P.recordBest(P.recordBest(P.empty(),0,{ticks:9500,hits:0,rank:'S'},1).save,2,{ticks:7000,hits:3,rank:'B'},2).save;
  const merged=P.merge(faster.save,cloud);
  assert.deepEqual(plain(merged.best),{0:{ticks:9500,hits:0,rank:'S'},2:{ticks:7000,hits:3,rank:'B'}},'merge keeps the better rank, then the lower time');
  assert.deepEqual(plain(P.merge(cloud,faster.save).best),plain(merged.best),'merge is symmetric');
  assert.deepEqual(plain(merged.cleared),[0,3]);
  assert.equal(P.same(merged,P.merge(merged,old)),true);
  assert.equal(P.same(merged,old),false,'a new best makes the saves differ, so it reaches the cloud save');
  assert.deepEqual(plain(P.normalize({best:{0:{ticks:1.5,hits:0,rank:'S'},1:{ticks:5,hits:0,rank:'Z'},2:'x',99:{ticks:5,hits:0,rank:'S'}}})),{v:1,cleared:[],unlocked:[],updatedAt:0},'junk bests are dropped');
  const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
  P.store(storage,merged);assert.deepEqual(plain(P.load(storage)),plain(merged),'bests survive a storage round trip');
  console.log('PASS story-par.js matches the 13 goldens; S/A/B/C rank rules; best-time record, merge, old-save and junk handling');
})().catch(error=>{console.error(error);process.exit(1);});
