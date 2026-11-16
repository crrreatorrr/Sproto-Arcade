const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class Image {
  decode() {
    const header=fs.readFileSync(this.src.split('?')[0]);
    this.naturalWidth=header.readUInt32BE(16);
    this.naturalHeight=header.readUInt32BE(20);
    return Promise.resolve();
  }
}
const scope=vm.createContext({Image});
for (const file of ['sprite-hitboxes.js','boss-sheets.js','boss-transitions.js']) {
  vm.runInContext(fs.readFileSync(file,'utf8'),scope,{filename:file});
}
const clips=scope.ArcadeBossTransitions;
assert.equal(clips.assetPaths().length,13);
const args=[];
const ctx={save(){},restore(){},translate(){},scale(){},drawImage(...call){args.push(call);}};
const box={x:800,y:250,w:400,h:350};

(async()=>{
  for (let id=1;id<=13;id++){
    await clips.preload(id);
    assert.equal(clips.settled(id),true);
    assert.equal(clips.draw(ctx,id,0,box,box),true);
    assert.equal(clips.draw(ctx,id,299,box,box),true);
    const [start,last]=args.splice(0);
    assert.deepEqual(start.slice(1,3),[0,0]);
    assert.deepEqual(last.slice(1,3),[start[3]*9,start[4]*9]);
  }
  for (const count of [79,90,95]) {
    const owner={}, clock=clips.createClock();
    let simulation=0;
    for (let tick=1;tick<=300;tick++){
      if(clock.step(owner,13,count-simulation))simulation++;
      assert.equal(simulation,Math.floor(tick*count/300));
    }
    assert.equal(clock.position(owner),299);
    assert.equal(clips.progress(clock.position(owner)),1);
    assert.equal(clock.step(owner,13,0),true);
    assert.equal(clock.position(owner),null);
  }
  assert.equal(clips.draw(ctx,1,0,box,box),false,'previous encounter atlas is evicted');
  assert.equal(clips.createClock().step({},1,90),true,'missing atlas never blocks simulation');
  console.log('PASS all 13 transition atlases, first and last cells, five-second pacing, and safe fallback');
})().catch(error=>{console.error(error);process.exitCode=1;});
