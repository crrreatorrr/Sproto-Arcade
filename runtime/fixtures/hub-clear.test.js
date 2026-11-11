/* ARC-DEC-01: hub-link.js splits a clear into recordLocalClear (local save and unlocks, every clear,
 * offline too) and reportHubClear (first-boss Relic, plus Tickets and cloud save for full runs). Runs the real
 * story-progress.js and hub-link.js against a fake HubSDK (the 0.6.4 IIFE global) that logs every call it receives. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const settle=()=>new Promise(r=>setTimeout(r,0));

function page({online}){
  const items=new Map(),calls=[];
  const localStorage={getItem:k=>items.has(k)?items.get(k):null,setItem:(k,v)=>{items.set(k,String(v));},removeItem:k=>items.delete(k)};
  const sdk={
    async init(game){calls.push(['init',game]);return{playerId:'p1',relics:[]};},
    getSession:()=>({token:'t'}),
    async loadSave(){calls.push(['loadSave']);return null;},
    async writeSave(data){calls.push(['writeSave',data]);},
    async getTicketBalance(){calls.push(['getTicketBalance']);return{balance:0};},
    async earnTickets(amount,reason,key){calls.push(['earnTickets',amount,reason,key]);return{balance:amount};},
    async reportEvent(name,data,key){calls.push(['reportEvent',name,data,key]);return{};},
    exit(){calls.push(['exit']);},
  };
  const window={localStorage,location:{hostname:'localhost',protocol:'http:',port:'',search:''},console,setTimeout,
    crypto:{randomUUID:()=>'u'+calls.length},...(online?{HubSDK:{createHubSdk:()=>sdk}}:{})};
  const ctx=vm.createContext({window,console,setTimeout,Date,JSON,Promise});
  for(const f of ['story-progress.js','hub-link.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
  return {hub:window.ArcadeHub,P:window.ArcadeProgress,items,calls};
}
// Level index 1 opens a Sproto (morelight); read it from the real unlock table.
const plain=v=>JSON.parse(JSON.stringify(v));

(async()=>{
  // Online, phase-2 checkpoint clear: local save and unlocks, nothing sent to the hub.
  {
    const {hub,P,items,calls}=page({online:true});
    await hub.ready;await settle();
    assert.equal(hub.state.status,'online');
    const expected=Object.entries(P.UNLOCKS).filter(([,r])=>r.level===1).map(([id])=>id);
    assert.ok(expected.length,'level index 1 opens at least one Sproto');
    assert.equal(typeof hub.levelCleared,'undefined','the combined levelCleared is gone');
    const before=calls.length;
    const opened=hub.recordLocalClear(1);
    hub.reportHubClear(1,false,null,{checkpoint:true});
    await settle();await settle();
    assert.deepEqual(plain(opened),expected,'checkpoint clear returns the Sprotos it opened');
    assert.deepEqual(plain(hub.state.save.cleared),[1]);
    const stored=JSON.parse(items.get(P.playerKey('p1')));
    assert.deepEqual(stored.cleared,[1],'checkpoint clear is stored in the player\'s local save');
    for(const id of expected)assert.ok(stored.unlocked.includes(id)&&hub.isUnlocked(id),'unlock '+id+' saved locally');
    assert.deepEqual(calls.slice(before),[],'a later boss checkpoint sends nothing to the hub');
    assert.equal(hub.state.lastReplay,null,'checkpoint clear claims no replay');
    // A second checkpoint clear of the same level opens nothing new.
    assert.deepEqual(plain(hub.recordLocalClear(1)),[]);
  }
  // A phase-2 retry of the first boss still reports the Coin, even after a previous clear.
  {
    const {hub,calls}=page({online:true});
    await hub.ready;
    hub.recordLocalClear(0);
    const before=calls.length;
    hub.recordLocalClear(0);
    hub.reportHubClear(0,false,null,{checkpoint:true});
    await settle();
    const sent=calls.slice(before);
    assert.deepEqual(sent.map(c=>c[0]),['reportEvent']);
    assert.equal(sent[0][1],'arcade.boss_defeated');
    assert.deepEqual(plain(sent[0][2]),{boss:'bront'});
  }
  // Online, full clear of level 0 without god mode: local save plus Relic report, Tickets and cloud save.
  {
    const {hub,items,P,calls}=page({online:true});
    await hub.ready;await settle();
    const before=calls.length,replay={schema:1,inputs:'x',claimed:{stage:1}};
    const opened=hub.recordLocalClear(0);hub.reportHubClear(0,false,replay);
    for(let i=0;i<5;i++)await settle();
    assert.deepEqual(plain(opened),[],'level 0 opens no Sproto');
    assert.deepEqual(JSON.parse(items.get(P.playerKey('p1'))).cleared,[0]);
    const sent=calls.slice(before).map(c=>c[0]);
    assert.deepEqual(sent,['reportEvent','earnTickets','writeSave'],'full clear sends the Relic report, the Tickets and the cloud save');
    assert.equal(calls.find(c=>c[0]==='earnTickets')[1],hub.TICKETS_PER_CLEAR);
    assert.equal(calls.find(c=>c[0]==='reportEvent')[2].replay.claimed.kind,'boss');
    assert.equal(hub.state.lastReplay.claimed.kind,'clear');
    assert.deepEqual(plain(calls.find(c=>c[0]==='writeSave')[1].cleared),[0]);
  }
  // God-mode full clear of level index 1: no Tickets, cloud save only. Redkev (index 12): save only.
  {
    const {hub,calls}=page({online:true});
    await hub.ready;await settle();
    let before=calls.length;
    hub.recordLocalClear(1);hub.reportHubClear(1,true,null);
    for(let i=0;i<5;i++)await settle();
    assert.deepEqual(calls.slice(before).map(c=>c[0]),['writeSave'],'god clear earns no Tickets');
    before=calls.length;
    hub.recordLocalClear(12);hub.reportHubClear(12,false,{schema:1});
    for(let i=0;i<5;i++)await settle();
    assert.deepEqual(calls.slice(before).map(c=>c[0]),['writeSave'],'Redkev (index 12) is save-only on the hub');
    assert.ok(hub.state.save.cleared.includes(12),'Redkev clear saved locally at index 12');
  }
  // Offline (file://, no SDK): both halves are safe; the local clear still records.
  {
    const {hub,items,P,calls}=page({online:false});
    await hub.ready;
    assert.equal(hub.state.status,'offline');
    const opened=hub.recordLocalClear(1);hub.reportHubClear(1,false,{schema:1});
    await settle();
    assert.deepEqual(plain(opened),['morelight'],'offline clear opens Sprotos');
    assert.deepEqual(JSON.parse(items.get(P.STORAGE_KEY)).cleared,[1],'offline clear stored in the device save');
    assert.deepEqual(calls,[],'offline sends nothing');
  }
  console.log('PASS local saves on every clear, Relic on first-boss checkpoint wins, Tickets on eligible full runs, Redkev save-only');
})().catch(e=>{console.error(e);process.exitCode=1;});
