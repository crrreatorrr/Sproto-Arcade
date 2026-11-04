/* Arcade fixed-step simulation. No browser or network dependencies. */
(function (A) {
  'use strict';
  const clamp=A.clamp, EPS=1e-8;
  const box=p=>({x:p.x-16,y:p.y-52,w:32,h:52});
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  // Relative swept AABB, including overlap at either endpoint and zero-width fronts.
  function swept(a0,a1,b0,b1) {
    if(overlap(a0,b0)||overlap(a1,b1)) return true;
    const vx=(a1.x-a0.x)-(b1.x-b0.x),vy=(a1.y-a0.y)-(b1.y-b0.y);
    let entry=-Infinity,exit=Infinity;
    for(const [axis,size,v] of [['x','w',vx],['y','h',vy]]) {
      const lo=b0[axis]-a0[axis]-a0[size],hi=b0[axis]+b0[size]-a0[axis];
      if(Math.abs(v)<EPS) { if(lo>0||hi<0)return false; }
      else { const t1=lo/v,t2=hi/v;entry=Math.max(entry,Math.min(t1,t2));exit=Math.min(exit,Math.max(t1,t2)); }
    }
    return entry<=exit&&exit>=0&&entry<=1;
  }
  function hash(text){let n=2166136261;for(const c of text){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
  class World {
    constructor(stage,options={}) {
      if(!stage||!Array.isArray(stage.phases)||stage.phases.length!==2)throw Error('World requires two phases');
      this.stage=stage;this.options={seed:1,phase:0,sector:0,practice:false,...options};
      this.seed=this.options.seed>>>0;this.practice=!!this.options.practice;this.sector=this.options.sector;
      this.weapons=A.Weapons?new A.Weapons({seed:this.seed^hash(stage.id)^0x10ad,eligible:stage.eligibleWeapons||[],mode:stage.phases[this.options.phase].mode,emit:e=>this.consumeEffect(e)}):null;
      this.restart();
    }
    restart(){
      this.tick=0;this.failure='';this.practice=!!this.options.practice;this.sector=this.options.sector;
      this.attackRandom=A.rng(this.seed^hash(this.stage.id)^0xa77ac);
      if(this.weapons)this.weapons.reset();
      this.enterPhase(clamp(this.options.phase|0,0,1),false);return this;
    }
    enterPhase(index,carry){
      const hp=carry?this.player.hp:5;
      this.phaseIndex=index;this.phase=this.stage.phases[index];this.phaseTick=0;this.state='playing';this.transitionTick=0;
      this.platforms=[];this.targets=[];this.hazards=[];this.shots=[];this.effects=[];this.pickups=[];this.events=[];this.data={};this.input={};
      this.objective=this.phase.objective||'';this.progress=0;this.cueText='';this.cueTicks=0;this.camera={x:0,y:0};this.shotClock=0;this.serial=0;
      const spawn=(this.practice&&this.phase.practiceSpawn)||this.phase.spawn||{x:120,y:600};
      this.player={...spawn,prevX:spawn.x,prevY:spawn.y,vx:0,vy:0,hp,grounded:false,airJump:true,airDash:true,dash:0,dashWait:0,shield:0,shieldWait:0,beamWait:0,bombWait:0,facing:1,inv:0,grace:0,jumpBuffer:0};
      if(carry&&this.weapons)this.weapons.phase(this.phase.mode);
      this.phase.enter?.(this);
      this.player.grounded=this.platforms.some(p=>Math.abs(this.player.y-p.y)<1&&this.player.x+16>p.x&&this.player.x-16<p.x+p.w);
      this.player.grace=this.player.grounded?6:0;this.updateCamera();
    }
    advancePhase(){if(this.state!=='playing')return;if(this.phaseIndex===1){this.clear();return;}this.state='transition';this.transitionTick=0;this.hazards=[];this.shots=[];this.effects=[];this.pickups=[];this.cueText='';this.input={};this.events.push({type:'phase',phase:1});}
    lose(source='unknown'){if(this.state!=='playing')return;this.failure=source;this.state='lost';this.input={};this.events.push({type:'loss',source});}
    clear(){if(this.state!=='playing')return;this.state='clear';this.hazards=[];this.shots=[];this.events.push({type:'clear',practice:this.practice,tick:this.tick});}
    cue(text,ticks=120){this.cueText=text;this.cueTicks=ticks;}
    platform(spec){return this.upsert(this.platforms,{h:20,...spec});}
    target(spec){return this.upsert(this.targets,{open:true,...spec,maxHp:spec.maxHp??spec.hp});}
    upsert(array,item){const i=array.findIndex(v=>v.id===item.id);if(i<0)array.push(item);else array[i]=item;return item;}
    hazard(spec){const existing=this.hazards.find(h=>h.id===spec.id);if(existing)return existing;const h={source:spec.id,rule:'ordinary',vx:0,vy:0,windup:0,active:1,recovery:0,age:0,resolved:false,...spec};this.hazards.push(h);if(h.cue)this.cue(h.cue,Math.max(h.windup,30));return h;}
    drop(id,x,y){if(!this.weapons)return null;const p=this.weapons.opportunity(id,{x,y,guaranteed:true});if(p)this.pickups.push(p);return p;}
    redirectVolley(volley){return this.weapons?this.weapons.redirect(volley):volley;}
    step(input={}) {
      this.input={...input};
      if(input.retry){this.restart();return;}
      if(this.state==='transition'){this.tick++;if(++this.transitionTick>=90)this.enterPhase(1,true);return;}
      if(this.state!=='playing')return;
      this.events=[];this.tick++;this.phaseTick++;
      if(this.cueTicks>0&&!--this.cueTicks)this.cueText='';
      this.movePlayer(input);
      if(this.state!=='playing')return;
      if(this.weapons?.tick)this.weapons.tick(this.tick);
      if(input.beam&&!this.player.beamWait){this.standardSpecial('beam');this.player.beamWait=90;}
      if(input.bomb&&!this.player.bombWait){this.standardSpecial('ball');this.player.bombWait=120;}
      if(input.power&&this.weapons)this.weapons.activate({player:this.player,targets:this.targets,platforms:this.platforms,mode:this.phase.mode,blocked:false,tick:this.tick});
      if(++this.shotClock>=12){this.shotClock=0;this.autoFire();}
      this.updateShots();this.updateHazards();this.updateEffects();this.collectPickups(input);
      if(this.state==='playing')this.phase.update?.(this);
      this.updateCamera();
      // Resolve contacts before consuming last active dash/shield/invulnerability tick.
      for(const k of ['dash','shield','inv'])if(this.player[k]>0)this.player[k]--;
      this.input={};
    }
    movePlayer(input){
      const p=this.player;p.prevX=p.x;p.prevY=p.y;
      for(const key of ['dashWait','shieldWait','beamWait','bombWait'])if(p[key]>0)p[key]--;
      if(input.shield&&!p.shieldWait){p.shield=45;p.shieldWait=150;}
      const dx=Number(!!input.right)-Number(!!input.left),dy=Number(!!input.down)-Number(!!input.up);
      if(dx)p.facing=dx;
      const flying=['flight','orbit'].includes(this.phase.mode);
      if(input.jump)p.jumpBuffer=6;else if(p.jumpBuffer>0)p.jumpBuffer--;
      if(p.grounded)p.grace=6;else if(p.grace>0)p.grace--;
      if(!flying&&p.jumpBuffer&&!p.dash&&(p.grounded||p.grace>0||p.airJump)){
        if(!(p.grounded||p.grace>0))p.airJump=false;
        p.vy=-13;p.grounded=false;p.grace=0;p.jumpBuffer=0;
      }
      if(input.dash&&!p.dashWait&&(flying||p.grounded||p.grace>0||p.airDash)){
        p.dash=11;p.dashWait=40;p.airDash=false;
        const length=Math.hypot(dx,dy)||1;p.dashX=flying?(dx||(!dy?p.facing:0))/length:(dx||p.facing);p.dashY=flying?dy/length:0;
      }
      p.vx=p.dash?p.dashX*22:dx*(flying?6:5);
      if(flying){p.vy=p.dash?p.dashY*22:dy*6;p.x+=p.vx;p.y+=p.vy;p.grounded=false;}
      else{
        p.x+=p.vx;if(!p.dash)p.vy+=.65;else p.vy=0;
        p.y+=p.vy;p.grounded=false;
        if(p.vy>=0)for(const plat of this.platforms){
          if(plat.removed||plat.active===false)continue;
          const py=plat.prevY??plat.y;
          if(p.x+16>plat.x&&p.x-16<plat.x+plat.w&&p.prevY<=py+1&&p.y>=plat.y){
            p.y=plat.y;p.vy=0;p.grounded=true;p.airJump=true;p.airDash=true;p.grace=6;
          }
        }
      }
      const scrolling=this.phase.camera||this.phase.mode;
      if(!['horizontal','vertical'].includes(scrolling)){
        p.x=clamp(p.x,20,1260);if(flying)p.y=clamp(p.y,60,690);
      } else if(scrolling==='horizontal')p.x=Math.max(20,p.x);else p.x=clamp(p.x,20,1260);
      if(p.y>this.camera.y+900)this.lose('fall');
    }
    autoFire(){
      const p=this.player;let dx=p.facing,dy=0;
      if(['flight','orbit'].includes(this.phase.mode)){
        const live=this.targets.filter(t=>!t.removed&&t.hp>0),open=live.filter(t=>t.open!==false);
        const target=(open.length?open:live).sort((a,b)=>Math.hypot(a.x+a.w/2-p.x,a.y+a.h/2-p.y+26)-Math.hypot(b.x+b.w/2-p.x,b.y+b.h/2-p.y+26))[0];
        if(target){dx=target.x+target.w/2-p.x;dy=target.y+target.h/2-(p.y-26);const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;}
      }
      this.shots.push({id:'auto-'+this.tick,x:p.x+dx*22,y:p.y-26+dy*22,w:10,h:6,vx:dx*16,vy:dy*16,damage:1,ttl:150,hit:new Set()});
    }
    standardSpecial(type){
      const p=this.player;let dx=p.facing,dy=0;
      if(type==='beam'&&['flight','orbit'].includes(this.phase.mode)){
        const ts=this.targets.filter(t=>!t.removed&&t.hp>0&&t.open!==false).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
        if(ts[0]){dx=ts[0].x+ts[0].w/2-p.x;dy=ts[0].y+ts[0].h/2-(p.y-26);const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;}
      }
      this.shots.push({id:type+'-'+this.tick,x:p.x+dx*24,y:p.y-26,w:16,h:12,vx:dx*(type==='beam'?28:8),vy:type==='beam'?dy*28:2,damage:type==='beam'?4:3,piercing:type==='beam',ttl:180,bounces:3,radius:65,hit:new Set(),type:type==='ball'?'mine':'beam'});
    }
    damageTarget(t,damage,source){
      if(t.hp<=0||t.open===false||t.removed)return false;
      t.hp=Math.max(0,t.hp-damage);this.events.push({type:'targetHit',target:t.id,source,damage});
      if(t.hp===0&&!t.defeated){t.defeated=true;this.events.push({type:'targetDefeat',target:t.id,source});t.onDefeat?.(this,t);}return true;
    }
    updateShots(){
      for(const s of [...this.shots]){
        if(s.removed)continue;const old={x:s.x,y:s.y,w:s.w||10,h:s.h||6};s.x+=s.vx||0;s.y+=s.vy||0;
        if(s.type==='mine'){
          s.vy+=.4;
          for(const p of this.platforms)if(!p.removed&&s.vy>=0&&old.y+(s.h||10)<=p.y&&s.y+(s.h||10)>=p.y&&s.x+(s.w||10)>p.x&&s.x<p.x+p.w){s.y=p.y-(s.h||10);s.vy=-Math.max(3,Math.abs(s.vy)*.65);s.bounces--;if(s.bounces<0)this.blast(s);break;}
        }
        s.hit??=new Set();
        for(const t of this.targets){if(s.removed||s.hit.has(t.id)||t.hp<=0||t.removed)continue;
          if(swept(old,{...old,x:s.x,y:s.y},t,t)){
            if(s.type==='mine'){this.blast(s);break;}
            if(this.damageTarget(t,s.damage,s.id)){s.hit.add(t.id);if(!s.piercing)s.removed=true;}
          }
        }
        if(--s.ttl<=0){if(s.type==='mine')this.blast(s);s.removed=true;}
      }
      this.shots=this.shots.filter(s=>!s.removed);
    }
    blast(s){if(s.removed)return;s.removed=true;const radius=s.radius||90;
      for(const t of this.targets){const x=clamp(s.x,t.x,t.x+t.w),y=clamp(s.y,t.y,t.y+t.h);if(Math.hypot(x-s.x,y-s.y)<=radius)this.damageTarget(t,s.damage,s.id);}
      for(const h of this.hazards)if(h.rule==='ordinary'&&Math.hypot(h.x-s.x,h.y-s.y)<=radius)h.removed=true;
      this.effects.push({type:'blast',x:s.x,y:s.y,radius,ttl:20});
    }
    hit(h){
      const p=this.player;const counter=h.rule==='dash'?p.dash>0:h.rule==='shield'?p.shield>0:h.rule==='ordinary'?(p.dash>0||p.shield>0):false;
      if(counter){this.events.push({type:'counter',source:h.source,rule:h.rule});return;}
      // Mandatory fronts cannot be bypassed by a preceding ordinary hit's grace.
      if(p.inv&&h.rule==='ordinary')return;
      p.hp=Math.max(0,p.hp-1);p.inv=60;this.failure=h.source;this.events.push({type:'hit',source:h.source,rule:h.rule});
      if(p.hp===0)this.lose(h.source);
    }
    updateHazards(){
      const p=this.player,p0=box({...p,x:p.prevX,y:p.prevY}),p1=box(p);
      for(const h of this.hazards){
        if(h.removed)continue;
        const old={x:h.x,y:h.y,w:h.w,h:h.h};const active=h.age>=h.windup&&h.age<h.windup+h.active;
        if(active){h.x+=h.vx;h.y+=h.vy;
          if(!h.resolved&&swept(p0,p1,old,h)){h.resolved=true;this.hit(h);}
        }
        h.age++;if(h.age>=h.windup+h.active+h.recovery)h.removed=true;
      }
      this.hazards=this.hazards.filter(h=>!h.removed);
    }
    consumeEffect(e){
      if(e.type==='prism')this.shots.push({id:'prism-'+this.tick+'-'+this.serial++,x:e.x,y:e.y,w:18,h:10,vx:e.dx*32,vy:e.dy*32,damage:e.damage,piercing:true,ttl:100,hit:new Set(),type:'prism'});
      else if(e.type==='mine')this.shots.push({id:'mine-'+this.tick+'-'+this.serial++,w:16,h:16,ttl:180,hit:new Set(),...e});
      else this.effects.push({...e,ttl:e.ttl||30});
    }
    updateEffects(){this.effects=this.effects.filter(e=>--e.ttl>0);}
    collectPickups(input){if(!this.weapons)return;const b=box(this.player);this.pickups=this.pickups.filter(p=>!overlap(b,{x:p.x-18,y:p.y-36,w:36,h:36})||!this.weapons.collect(p,!!input.replace));}
    updateCamera(){const camera=this.phase.camera||this.phase.mode;
      if(camera==='horizontal')this.camera.x=Math.max(0,this.player.x-360);
      else if(camera==='vertical')this.camera.y=Math.min(this.camera.y,0,this.player.y-510);
      else this.camera={x:0,y:0};
    }
  }
  A.World=World;A.sweptContact=swept;
})(globalThis.Arcade);
