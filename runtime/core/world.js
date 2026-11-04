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
      this.objective=this.phase.objective||'';this.progress=0;this.cueText='';this.cueTicks=0;this.camera={x:0,y:0};this.shotClock=0;this.serial=0;this.pressureTicks=new Map();this.missileNextTick=180;
      const spawn=(this.practice&&this.phase.practiceSpawn)||this.phase.spawn||{x:120,y:600};
      this.player={...spawn,prevX:spawn.x,prevY:spawn.y,vx:0,vy:0,hp,grounded:false,airJump:true,airDash:true,dash:0,dashX:1,dashY:0,dashWait:0,shield:0,shieldWait:0,beamWait:0,bombWait:0,facing:1,inv:0,grace:0,jumpBuffer:0};
      if(carry&&this.weapons)this.weapons.phase(this.phase.mode);
      this.phase.enter?.(this);
      if(['flight','orbit'].includes(this.phase.mode)){this.clampFlightPosition();this.player.prevX=this.player.x;this.player.prevY=this.player.y;}
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
    hazard(spec){
      const existing=this.hazards.find(h=>h.id===spec.id);if(existing)return existing;
      const h={source:spec.id,rule:'ordinary',vx:0,vy:0,windup:0,active:1,recovery:0,age:0,resolved:false,...spec};
      // Campaign pacing is phase-independent; unnumbered mechanics fixtures keep authored physics.
      if(Number.isInteger(this.stage.number)&&this.stage.number>=1&&this.stage.number<=12){
        const speed=Math.hypot(h.vx,h.vy),cap=['dash','shield'].includes(h.rule)?8:6;
        h.authoredSpeed=speed;h.authoredActive=h.active;h.speedCap=cap;
        if(speed>cap&&h.active>0){
          h.active=Math.ceil(h.active*speed/cap);
          const scale=h.authoredActive/h.active;h.vx*=scale;h.vy*=scale;
        }
      }
      if(['dash','shield'].includes(h.rule)&&!h.resolved)this.hazards=this.hazards.filter(v=>!v.pressure);
      this.hazards.push(h);if(h.cue)this.cue(h.cue,Math.max(h.windup,30));return h;
    }
    pressure(spec={}){
      const clear=()=>{this.hazards=this.hazards.filter(h=>!h.pressure);return null;};
      if(this.hazards.some(h=>!h.removed&&!h.resolved&&['dash','shield'].includes(h.rule)))return clear();
      if(spec.enabled===false){this.hazards=this.hazards.filter(h=>!h.pressure||h.missile);return null;}
      if(this.state!=='playing'||this.phaseIndex!==1||!spec.id)return null;
      const start=Math.max(600,Math.ceil(spec.start??660)),period=Math.max(1,Math.ceil(spec.period??180));
      const elapsed=this.phaseTick-start-Math.max(0,Math.floor(spec.offset??0));
      if(elapsed<0||elapsed%period!==0||this.pressureTicks.get(spec.id)===this.phaseTick)return null;
      this.pressureTicks.set(spec.id,this.phaseTick);
      const maxAlive=Math.max(0,Math.min(2,Math.floor(spec.maxAlive??2)));
      if(this.hazards.filter(h=>h.pressure&&!h.removed).length>=maxAlive)return null;
      const cycle=Math.floor(elapsed/period),allowed=['bolt','orb','seed','diamond','roller'];
      const styles=(spec.styles||['orb','seed']).filter(s=>allowed.includes(s));
      const sprite=styles[cycle%styles.length]||'orb';
      const sizes={bolt:[30,14],orb:[28,28],seed:[28,18],diamond:[26,26],roller:[34,26]},[w,h]=sizes[sprite];
      const p=this.player,c=this.camera,side=spec.side||'far';
      const right=side==='right'||(side==='alternate'?cycle%2===0:side==='left'?false:p.x<c.x+640);
      const x=c.x+(right?1260-w:20);
      // Defer unsafe near-edge requests instead of creating a point-blank projectile.
      if(Math.abs(x+w/2-p.x)<360)return null;
      const lane=spec.lane||'low';
      const y=clamp(p.y-(lane==='high'?140:lane==='aimed'?26:24),c.y+240,c.y+680-h);
      const speed=clamp(Number(spec.speed)||2.5,.1,3);
      const dx=p.x-(x+w/2),dy=lane==='aimed'?p.y-26-(y+h/2):0,length=Math.hypot(dx,dy)||1;
      const vx=dx/length*speed,vy=dy/length*speed;
      return this.hazard({id:spec.id+':'+this.phaseTick,source:spec.id,rule:'ordinary',pressure:true,sprite,lane,
        x,y,w,h,vx,vy,windup:Math.max(75,Math.ceil(spec.windup??75)),active:Math.min(900,Math.ceil(1500/speed)),recovery:0});
    }
    slowMissile(spec={}){
      const blocked=this.hazards.some(h=>!h.removed&&!h.resolved&&['dash','shield'].includes(h.rule));
      if(blocked){this.hazards=this.hazards.filter(h=>!h.pressure);return null;}
      if(spec.enabled===false){this.hazards=this.hazards.filter(h=>!h.missile);return null;}
      if(this.state!=='playing'||this.phaseIndex!==1||!spec.id)return null;
      if(this.phaseTick<Math.max(180,Math.ceil(spec.start??180),this.missileNextTick))return null;
      const pressure=this.hazards.filter(h=>h.pressure&&!h.removed);
      if(pressure.some(h=>h.missile))return null;
      const p=this.player,c=this.camera,w=44,h=18,right=p.x<c.x+640;
      const x=c.x+(right?1260-w:20),y=clamp(p.y-26-h/2,c.y+240,c.y+680-h);
      if(Math.abs(x+w/2-p.x)<360)return null;
      // Aim once at emission. The warning and active projectile share this committed line.
      const dx=p.x-(x+w/2),dy=p.y-26-(y+h/2),length=Math.hypot(dx,dy)||1;
      const speed=clamp(Number(spec.speed)||1.1,.5,1.2);
      if(pressure.length>=2){
        const oldest=pressure.filter(v=>!v.missile).sort((a,b)=>b.age-a.age)[0];
        if(!oldest||pressure.length>2)return null;
        this.hazards=this.hazards.filter(v=>v!==oldest);
      }
      const missile=this.hazard({id:spec.id+':'+this.phaseTick,source:spec.id,rule:'ordinary',pressure:true,missile:true,sprite:'missile',
        x,y,w,h,vx:dx/length*speed,vy:dy/length*speed,windup:Math.max(90,Math.ceil(spec.windup??90)),active:Math.ceil(1600/speed),recovery:0});
      // Only actual emissions consume cooldown; protected intervals retry immediately when safe.
      this.missileNextTick=this.phaseTick+Math.max(480,Math.ceil(spec.period??480));
      return missile;
    }
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
      if(p.grounded&&p.support){const support=this.platforms.find(t=>t.id===p.support&&!t.removed&&t.active!==false);if(support){p.x+=support.x-(support._lastX??support.x);p.y+=support.y-(support._lastY??support.y);}}
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
          const py=plat.prevY??plat._lastY??plat.y;
          if(p.x+16>plat.x&&p.x-16<plat.x+plat.w&&p.prevY<=py+1&&p.y>=plat.y){
            p.y=plat.y;p.vy=0;p.grounded=true;p.support=plat.id;p.airJump=true;p.airDash=true;p.grace=6;
          }
        }
      }
      const scrolling=this.phase.camera||this.phase.mode;
      if(flying)this.clampFlightPosition();
      else if(!['horizontal','vertical'].includes(scrolling))p.x=clamp(p.x,20,1260);
      else if(scrolling==='horizontal')p.x=Math.max(20,p.x);else p.x=clamp(p.x,20,1260);
      if(!p.grounded)p.support=null;
      for(const plat of this.platforms){plat._lastX=plat.x;plat._lastY=plat.y;}
      if(p.y>this.camera.y+900)this.lose('fall');
    }
    clampFlightPosition(){
      const p=this.player,b={left:20,right:1260,top:240,bottom:690,...this.phase.flightBounds};
      p.x=(this.phase.camera||this.phase.mode)==='horizontal'?Math.max(b.left,p.x):clamp(p.x,b.left,b.right);
      p.y=clamp(p.y,b.top,b.bottom);
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
          if(h.missile&&(h.x+h.w<this.camera.x-160||h.x>this.camera.x+1440||h.y+h.h<this.camera.y-160||h.y>this.camera.y+880)){h.removed=true;continue;}
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
