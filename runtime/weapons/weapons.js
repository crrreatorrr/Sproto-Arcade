/* Arcade weapons v1. Offline classic script, no world or attack RNG mutation. */
(function (g) {
  'use strict';
  const A = g.Arcade;
  const DEFINITIONS = Object.freeze({
    'prism-rail': Object.freeze({charges:2, effect:'prism'}),
    'ricochet-mine': Object.freeze({charges:2, effect:'mine'}),
    'echo-decoy': Object.freeze({charges:1, effect:'decoy'})
  });
  const finite = Number.isFinite;
  const flight = mode => mode === 'flight' || mode === 'orbit';
  const center = target => ({x:target.x + (target.w || 0)/2,y:target.y + (target.h || 0)/2});
  function direction(player, targets, mode) {
    let x = player.facing < 0 ? -1 : 1, y = 0;
    if (flight(mode)) {
      const aim = player.aim;
      if (aim && finite(aim.x) && finite(aim.y) && (aim.x || aim.y)) {
        x = aim.x; y = aim.y;
      } else if (finite(player.aimX) && finite(player.aimY) && (player.aimX || player.aimY)) {
        x = player.aimX; y = player.aimY;
      } else {
        const live = (targets || []).filter(t => t.hp > 0 && t.open !== false && finite(t.x) && finite(t.y));
        live.sort((a,b) => {
          const u=center(a),v=center(b);
          return Math.hypot(u.x-player.x,u.y-(player.y-26))-Math.hypot(v.x-player.x,v.y-(player.y-26));
        });
        if (live.length) { const p=center(live[0]); x=p.x-player.x; y=p.y-(player.y-26); }
      }
    }
    const length = Math.hypot(x,y) || 1;
    return {x:x/length,y:y/length};
  }
  class Weapons {
    constructor({seed=1,eligible=[],mode='fixed',emit=()=>{}}={}) {
      this.seed = seed >>> 0;
      this.eligible = [...new Set(eligible)].filter(id => Object.hasOwn(DEFINITIONS,id));
      this.mode = mode;
      this.emit = emit;
      this.reset();
    }
    reset() {
      // A private salted stream never advances the runtime's attack stream.
      this.random = A.rng((this.seed ^ 0xB16B00B5) >>> 0);
      this.seen = new Set();
      this.collected = new Set();
      this.bag = [];
      this.slot = null;
      this.decoy = null;
      this.clock = 0;
    }
    tick(tick) {
      if (!finite(tick)) return;
      this.clock = Math.max(this.clock,tick);
      if (this.decoy && this.clock >= this.decoy.until) this.decoy = null;
    }
    opportunity(id,{x=0,y=0,guaranteed=false}={}) {
      if (typeof id !== 'string' || !id || this.seen.has(id) || !this.eligible.length || !finite(x) || !finite(y)) return null;
      this.seen.add(id);
      if (!this.bag.length) {
        this.bag = this.eligible.slice();
        for (let i=this.bag.length-1;i>0;i--) {
          const j=Math.floor(this.random()*(i+1));
          [this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];
        }
      }
      const weapon=this.bag.pop();
      // Authored opportunities always produce a reward, including teaching drops.
      return {id,weapon,charges:DEFINITIONS[weapon].charges,x,y};
    }
    collect(pickup,replace=false) {
      if (!pickup || !Object.hasOwn(DEFINITIONS,pickup.weapon) || !this.eligible.includes(pickup.weapon)) return false;
      if (pickup.id && this.collected.has(pickup.id)) return false;
      if (!Number.isInteger(pickup.charges) || pickup.charges <= 0 || pickup.charges > DEFINITIONS[pickup.weapon].charges) return false;
      if (this.slot && this.slot.charges > 0 && !replace) return false;
      this.slot={weapon:pickup.weapon,charges:pickup.charges};
      if (pickup.id) this.collected.add(pickup.id);
      return true;
    }
    activate({player,targets=[],platforms=[],mode=this.mode,blocked=false,tick}={}) {
      if (finite(tick)) this.tick(tick);
      if (blocked || !this.slot || this.slot.charges <= 0 || !player || !finite(player.x) || !finite(player.y) || player.hp === 0) return false;
      const weapon=this.slot.weapon, aim=direction(player,targets,mode);
      let effect;
      if (weapon === 'prism-rail') {
        effect={type:'prism',x:player.x,y:player.y-26,dx:aim.x,dy:aim.y,damage:8,piercing:true};
      } else if (weapon === 'ricochet-mine') {
        // Flight offerings require authored bounce geometry beneath the launch point.
        if (flight(mode) && !platforms.some(p=>finite(p.x)&&finite(p.y)&&finite(p.w)&&p.y>=player.y-10&&p.y<=player.y+300&&p.x<=player.x+160&&p.x+p.w>=player.x-160)) return false;
        effect={type:'mine',x:player.x,y:player.y-14,vx:(player.facing<0?-1:1)*9,vy:-4,damage:6,radius:90,bounces:2};
      } else if (weapon === 'echo-decoy') {
        if (this.decoy) return false;
        effect={type:'decoy',x:player.x,y:player.y-26,ttl:240};
      } else return false;
      // Failed receivers must not spend charges or arm an invisible decoy.
      if (this.emit(effect) === false) return false;
      if (weapon === 'echo-decoy') this.decoy={x:effect.x,y:effect.y,until:this.clock+effect.ttl};
      this.slot.charges--;
      if (!this.slot.charges) this.slot=null;
      return true;
    }
    redirect(volley) {
      if (!volley || !this.decoy || volley.eligibleAim !== true || (volley.rule && volley.rule !== 'ordinary')) return volley;
      if (finite(volley.tick)) this.tick(volley.tick);
      if (!this.decoy) return volley;
      const target={x:this.decoy.x,y:this.decoy.y};
      const redirected={...volley,target,targetX:target.x,targetY:target.y,redirected:true};
      if (finite(volley.x) && finite(volley.y) && finite(volley.vx) && finite(volley.vy)) {
        const dx=target.x-volley.x,dy=target.y-volley.y,distance=Math.hypot(dx,dy),speed=Math.hypot(volley.vx,volley.vy);
        if (distance) { redirected.vx=dx/distance*speed; redirected.vy=dy/distance*speed; }
      }
      this.decoy=null;
      return redirected;
    }
    phase(mode) {
      this.mode=mode;
      this.decoy=null;
      // Bag, opportunity IDs and equipped charges persist within the stage.
    }
    snapshot() { return this.slot ? {...this.slot} : null; }
  }
  A.Weapons=Weapons;
  A.weaponDefinitions=DEFINITIONS;
})(globalThis);
