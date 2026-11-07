const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),scope=vm.createContext({});
const runtime=path.resolve(process.argv[2]||path.join(root,'runtime/core/world.js'));
for(const file of [path.join(root,'density-attacks.js'),path.join(root,'phase-powerups.js'),path.join(root,'runtime/contract.js'),runtime,path.join(__dirname,'stage.js')])vm.runInContext(fs.readFileSync(file,'utf8'),scope);
const A=scope.Arcade,stage=A.stages.get('07-moonkeep');
for(const phase of [0,1]){
 assert.equal(stage.phases[phase].mode,'flight');
 const w=new A.World(stage,{phase,practice:true});const start=w.player.y;w.step({up:true});assert.ok(w.player.y<start);w.step({down:true});assert.equal(w.player.y,start);assert.equal(w.player.grounded,false);
 const positions=new Set();for(let i=0;i<240;i++){w.step({shield:true});positions.add(Math.round(w.targets[0].y));assert.equal(w.targets[0].y,330+w.data.dragonY);assert.ok(w.targets[0].y>=265&&w.targets[0].y<=395);}
 assert.ok(positions.size>60,'both dragon forms patrol vertically');
 for(let i=0;i<100;i++)w.step({up:true});assert.equal(w.player.y,240,'UFO stays below HUD');
}
const locked=new A.World(stage,{phase:1,practice:true});for(let i=0;i<430&&locked.state==='playing';i++)locked.step({shield:true});assert.equal(locked.data.crossed,false);assert.equal(locked.targets[0].open,false,'shield cannot unlock a dash current');
const w=new A.World(stage,{seed:37});
for(let t=0;t<5000&&w.state!=='clear'&&w.state!=='lost';t++){
 if(w.state==='transition'){w.step({});continue;}
 const front=w.hazards.find(h=>h.source==='moonkeep-air-front'&&!h.resolved&&h.age>=h.windup),bite=w.hazards.find(h=>h.source==='07-moonkeep/iron-fang'&&h.age<h.windup);
 const dash=!!front&&Math.abs(front.x+front.w/2-w.player.x)<125&&w.player.dashWait===0;
 const up=!!bite&&w.player.y>260,down=!bite&&w.player.y<390;
 w.step({up,down,dash,right:dash,shield:!front&&w.player.shieldWait===0,beam:true,bomb:true});
}
assert.equal(w.state,'clear','standard UFO kit completes both phases');assert.ok(w.player.hp>0);assert.equal(w.weapons,null);
console.log('PASS Moonkeep UFO flight both phases, altitude bounds, vertical dragon/target patrol, mandatory dash front, full base-kit clear',w.tick,'ticks, HP',w.player.hp);
