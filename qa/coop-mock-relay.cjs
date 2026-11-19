/* A small in-process stand-in for the hub's `sproto_arcade_coop` match (Arcade co-op protocol v1,
 * docs/COOP.md), for qa/coop-net.test.cjs only. It implements the contract the hub builds:
 * room codes, HELLO -> LOBBY -> START (server seed) -> READY -> GO, input relay with the seat
 * stamped from the sender, AFK counting, hash comparison with DESYNC and snapshot relay, PING,
 * reconnect grace with PEER and SEAT_DROP, RESULT agreement and a single OUTCOME.
 * Not production code: the real match runs in Nakama (metaverse-hub). Messages are delivered
 * after `latency` clock steps; the test advances the clock with relay.step(). */
const OP={HELLO:1,LOBBY:2,START:3,READY:4,GO:5,INPUT:10,HASH:11,DESYNC:12,SNAPSHOT:13,RESULT:14,OUTCOME:15,PEER:16,SEAT_DROP:17,PING:18,CANCEL:19};
const ALPHABET='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function createRelay({latency=2,graceSteps=900,seed=0x2545f491,ledger=[]}={}){
  let clock=0,nextId=1,rng=seed>>>0;
  const rand=()=>{rng=(rng*1664525+1013904223)>>>0;return rng;};
  const matches=new Map(),codes=new Map(),queue=[];
  function deliver(conn,op,data){queue.push({at:clock+latency,conn,op,data:JSON.parse(JSON.stringify(data))});}
  function broadcast(m,op,data){for(const s of m.seats)if(s&&s.present)deliver(s.conn,op,data);}
  function lobby(m){broadcast(m,OP.LOBBY,{code:m.code,level:m.level,seats:m.seats.map((s,i)=>({seat:i,name:s?s.name:'',pilot:s?s.pilot:'',present:Boolean(s&&s.present)}))});}
  function newMatch(level){
    let code;do{code='';for(let i=0;i<5;i++)code+=ALPHABET[rand()%ALPHABET.length];}while(codes.has(code));
    const m={id:'m'+nextId++,code,level,seats:[null,null],started:false,go:false,ready:new Set(),hashes:new Map(),agreedThrough:0,desyncs:0,
      combatTicks:[0,0],activeFrames:[0,0],results:[null,null],settled:false,ended:false,lastRelayed:[0,0]};
    matches.set(m.id,m);codes.set(code,m);return m;
  }
  function seatOf(m,conn){return m.seats.findIndex(s=>s&&s.conn===conn);}
  function settle(m,reason){
    if(m.settled)return;m.settled=true;m.ended=true;
    const present=m.seats.map((s,i)=>s&&s.present?i:-1).filter(i=>i>=0);
    const results=present.map(i=>m.results[i]);
    const agreed=results.length>0&&results.every(r=>r&&r.status==='clear'&&r.level===m.level&&r.god===false);
    const hashesOk=m.desyncs<3&&!m.pendingMismatch;
    for(const i of present){
      const s=m.seats[i],afk=m.activeFrames[i]<0.5*m.combatTicks[i];
      const pays=!reason&&agreed&&hashesOk&&!afk;
      const rewards={tickets:pays?20:0,relics:pays&&m.level===1?['breakwater_coin']:[]};
      if(pays){
        // Same ledger rows and idempotency keys as the solo arcade path, scoped per match and account.
        ledger.push({account:s.name,type:'tickets',amount:20,reason:'arcade_clear',key:'arcade:coop:'+m.id+':'+s.name});
        if(m.level===1)ledger.push({account:s.name,type:'relic',relic:'breakwater_coin',key:'arcade:coop:'+m.id+':'+s.name+':relic'});
      }
      deliver(s.conn,OP.OUTCOME,{status:pays?'clear':results[0]?.status||'abort',...(pays?{}:{reason:reason||(afk?'afk':!hashesOk?'desync':!agreed?'disagree':'')}),rewards});
    }
  }
  function onMessage(m,conn,op,data){
    const seat=seatOf(m,conn);if(seat<0||m.ended)return;
    switch(op){
      case OP.HELLO:
        if(data?.v!==1){deliver(conn,OP.CANCEL,{reason:'version'});return;}
        m.seats[seat].pilot=data.pilot;m.seats[seat].hello=true;lobby(m);
        if(!m.started&&m.seats.every(s=>s&&s.hello)){
          m.started=true;const shared=rand();
          m.seats.forEach((s,i)=>deliver(s.conn,OP.START,{levelIndex:m.level-1,pilots:m.seats.map(x=>x.pilot),seed:shared,seat:i,names:m.seats.map(x=>x.name)}));
        }
        break;
      case OP.READY:
        m.ready.add(seat);if(m.ready.size===2&&!m.go){m.go=true;broadcast(m,OP.GO,{});}
        break;
      case OP.INPUT:{
        if(!m.go||!Array.isArray(data?.frames))return;
        const other=m.seats[1-seat];
        m.combatTicks[seat]+=data.frames.length;m.activeFrames[seat]+=data.frames.filter(f=>f!==0).length;
        m.lastRelayed[seat]=Math.max(m.lastRelayed[seat],data.from+data.frames.length-1);
        // The seat comes from the sender's presence, never from the payload.
        if(other&&other.present)deliver(other.conn,OP.INPUT,{seat,from:data.from,frames:data.frames});
        break;
      }
      case OP.HASH:{
        const row=m.hashes.get(data.tick)||[null,null];row[seat]=data.hash;m.hashes.set(data.tick,row);
        const live=m.seats.filter(s=>s&&s.present).length;
        if(row[0]&&row[1]){
          if(row[0]===row[1])m.agreedThrough=Math.max(m.agreedThrough,data.tick);
          else{m.desyncs++;broadcast(m,OP.DESYNC,{tick:data.tick,count:m.desyncs});if(m.desyncs>=3)settle(m,'desync');}
          m.hashes.delete(data.tick);
        }else if(live<2)m.hashes.delete(data.tick);
        break;
      }
      case OP.SNAPSHOT:
        if(seat===0&&m.seats[1]?.present)deliver(m.seats[1].conn,OP.SNAPSHOT,data);
        break;
      case OP.RESULT:
        m.results[seat]=data;
        if(m.seats.every((s,i)=>!s||!s.present||m.results[i]))settle(m,null);
        break;
      case OP.PING:deliver(conn,OP.PING,{c:data.c,s:clock});break;
    }
  }
  function transport(name){
    const conn={name,handlers:[]};
    return {
      conn,
      async rpc(id,body){
        if(id==='arcade.coop_create'){const m=newMatch(body.level);return {match_id:m.id,code:m.code};}
        if(id==='arcade.coop_join'){const m=codes.get(body.code);if(!m)return {error:'not_found'};if(m.seats.every(Boolean))return {error:'full'};return {match_id:m.id};}
        if(id==='arcade.coop_quick'){let m=[...matches.values()].find(x=>!x.started&&x.level===body.level&&x.seats.filter(Boolean).length===1);if(!m)m=newMatch(body.level);return {match_id:m.id};}
        throw Error('unknown rpc '+id);
      },
      async join(matchId){
        const m=matches.get(matchId);const free=m.seats.findIndex(s=>!s);
        m.seats[free]={conn,name,pilot:'',present:true};
        return {
          send:(op,payload)=>queue.push({at:clock+latency,toServer:true,m,conn,op,data:JSON.parse(JSON.stringify(payload))}),
          onMessage:cb=>conn.handlers.push(cb),
          leave:()=>{const i=seatOf(m,conn);if(i<0)return;m.seats[i].present=false;m.seats[i].leftAt=clock;broadcast(m,OP.PEER,{seat:i,present:false,graceS:15});},
        };
      },
    };
  }
  function step(){
    clock++;
    for(const m of matches.values()){
      m.seats.forEach((s,i)=>{
        if(s&&!s.present&&!s.dropped&&clock-s.leftAt>=graceSteps&&m.go){
          s.dropped=true;
          // Deterministic drop tick, at least 10 ticks after the latest input relayed from either seat.
          const tick=Math.max(...m.lastRelayed)+10;
          broadcast(m,OP.SEAT_DROP,{seat:i,tick});
        }
      });
    }
    const due=queue.filter(q=>q.at<=clock);
    for(const q of due)queue.splice(queue.indexOf(q),1);
    for(const q of due){
      if(q.toServer)onMessage(q.m,q.conn,q.op,q.data);
      else for(const cb of q.conn.handlers)cb(q.op,q.data);
    }
  }
  return {transport,step,get clock(){return clock;},matches,ledger,OP};
}
module.exports={createRelay,OP};
