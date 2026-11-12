const LEVELS = [
  {
    "title": "Tidebreak Marina",
    "id": 1,
    "naval": true,
    "art": "art/level-01.jpg",
    "foot": 0.913
  },
  {
    "title": "Last Light Bar",
    "id": 2,
    "art": "art/level-02.jpg",
    "foot": 0.801
  },
  {
    "title": "Mudline Trenches",
    "id": 3,
    "flight": true,
    "art": "art/level-03.jpg",
    "foot": 0.871
  },
  {
    "title": "Sproto Ranch",
    "id": 4,
    "art": "art/level-04.jpg",
    "foot": 0.793
  },
  {
    "title": "Neon Tomorrow",
    "id": 5,
    "art": "art/level-05.jpg",
    "foot": 0.797
  },
  {
    "title": "Circuit Gate",
    "id": 6,
    "art": "art/level-06.jpg",
    "foot": 0.908
  },
  {
    "title": "Moonkeep Castle",
    "id": 7,
    "flight": true,
    "art": "art/level-07.jpg",
    "foot": 0.88
  },
  {
    "title": "Crown Relay Chamber",
    "id": 8,
    "art": "art/level-08.jpg",
    "foot": 0.902
  },
  {
    "title": "The Hatchery",
    "id": 9,
    "art": "art/level-09.jpg",
    "foot": 0.883
  },
  {
    "title": "Verse Gate",
    "id": 10,
    "art": "art/level-10.jpg",
    "foot": 0.875
  },
  {title:"Rooftop Breakaway",id:11,chase:true},
  {title:"Codebreak Ascent",id:12,codebreak:true,art:"art/codebreak/shaft.webp",foot:.84},
  {title:"Redkev's Marina",id:13,mechanics:1,art:"art/level-01.jpg",foot:.913}
];
const NAVAL_WEAPONS = {
  light:{cooldown:120,launch:5,frames:18,x:64,lanes:[-22,-9,4],speed:22},
  heavy:{cooldown:180,launch:7,frames:18,x:-47,y:-28,vx:16,vy:-9.8,gravity:.31,bounces:2}
};
// Stable IDs/indexes preserve saved progress; campaign placement is independent.
const REDKEV_READY=true;
const mechanicsIndex=index=>LEVELS[index]?.mechanics?LEVELS.findIndex(l=>l.id===LEVELS[index].mechanics):index;
const campaignLevelIndices=()=>REDKEV_READY?[0,12,1,2,3,4,5,6,7,8,9,10,11]:[0,1,2,3,4,5,6,7,8,9,10,11];
const nextCampaignLevel=index=>{const order=campaignLevelIndices();return order[order.indexOf(index)+1]??-1;};
const campaignLevelNumber=index=>campaignLevelIndices().indexOf(index)+1;

// Generated panoramas share the same pixels on each side of a baked join.
const GENERATED_LOOPS = [
  {folder:'marina-remake',overlap:144},
  {folder:'hpos10i-remake',overlap:208,prefix:'doorway-'},
  {folder:'mudline-remake',overlap:208},
  {folder:'ranch-remake',overlap:208},
  ...Array.from({length:6},(_,i)=>({folder:'later-routes/'+(i+5),overlap:208})),
  {folder:'rooftop-chase',overlap:480,count:15}
].map(({folder,overlap,prefix='',count=18},level)=>({
  overlap,
  panels:Array.from({length:count},(_,i)=>[
    folder+'/'+prefix+String(i+1).padStart(2,'0')+'.webp'+(level<3?'?v=floor-joins':''),604/720
  ])
}));

// Boss archetype, pattern cadence multiplier, projectile speed multiplier.
const BOSS_PROFILES = [
  [0,1,1], [1,1.02,1.02], [0,1.06,1.04], [1,1.09,1.07], [2,1.12,1.09],
  [1,1.16,1.12], [2,1.19,1.15], [0,1.23,1.18], [2,1.27,1.21], [3,1.30,1.24]
];

// Moving loops use the original zone panorama followed by related variants.
const LEVEL_EXTENSIONS = [
  [],
  [],
  [],
  [],
  ['0-06-neon-backstreet','1-06-midnight-market-alley','catalog-skyrail','0-07-skybridge','1-07-antenna-rooftop-at-dawn','0-08-satellite-observatory'],
  ['1-03-circuit-checkpoint-lockdown','catalog-ionplaza','0-04-circuit-maglev-concourse','1-04-circuit-daylight-maglev-terminal','catalog-datavault','catalog-stormarcade'],
  ['0-17-castle-battlements','1-17-castle-snow-swept-battlements','catalog-frostbastion','0-15-castle-great-hall','1-15-castle-stained-glass-great-hall','0-16-castle-armory'],
  ['catalog-royallibrary','catalog-lunarchapel','0-13-throne-power-gallery','1-13-throne-power-conduit-gallery','catalog-chainforge','1-12-throne-furnace-relay-vault'],
  ['catalog-ambernursery','catalog-sporegrove','catalog-moltinghall','catalog-pearlchamber','catalog-rootreservoir','catalog-hatchery'],
  ['catalog-auroragate','catalog-starbridge','catalog-observatory','1-18-verse-red-sun-asteroid-causeway','catalog-gravityarchive','1-19-verse-cosmic-crystal-cavern'],
  [], []
];

const STATIC_ARENAS = [
  ['marina-remake/engine-room.jpg',.84], ['phase-two/prism-vault.webp',.758],
  ['mudline-remake/floodgate.jpg',604/720], ['ranch-remake/threshing-barn.jpg',604/720],
  ...Array.from({length:6},(_,i)=>['phase-two/level-'+(i+5)+'-arena.webp',604/720])
];

// New attacks unlocked at each health quarter, from full health to the last quarter.
const BOSS_SECTION_ATTACKS = [
  [['comet','floorSaw','ripple','hammer'],['minefall','starCross','needleFall','eyeShot']],
  [['ripple','starCross','comet','eyeShot'],['hammer','needleFall','minefall','floorSaw']],
  [['floorSaw','minefall','hammer','comet'],['ripple','eyeShot','starCross','needleFall']],
  [['minefall','ripple','floorSaw','starCross'],['needleFall','comet','eyeShot','hammer']],
  [['hammer','comet','eyeShot','floorSaw'],['starCross','ripple','needleFall','minefall']],
  [['eyeShot','starCross','ripple','needleFall'],['comet','minefall','floorSaw','hammer']],
  [['floorSaw','hammer','minefall','needleFall'],['eyeShot','comet','ripple','starCross']],
  [['starCross','eyeShot','hammer','ripple'],['floorSaw','needleFall','comet','minefall']],
  [['ripple','needleFall','comet','floorSaw'],['eyeShot','hammer','minefall','starCross']],
  [['eyeShot','comet','starCross','hammer'],['needleFall','ripple','floorSaw','minefall']]
];

const BOSS_SIGNATURES = [
  ['anchorRun','bellSweep'], ['cabinetRush','casinoBounce'],
  ['scarabSkitter','portalRing'], ['solarVolley','hourglassDrop'],
  ['diamondStep','crystalFlank'], ['prismRicochet','tridentArc'],
  ['forgePress','frostRotor'], ['casinoBounce','solarVolley'],
  ['frostRotor','meteorFall'], ['prismRicochet','hourglassDrop']
];

// Redkev (level id 13, played second) keeps Tidebreak Marina's arena, backgrounds, health,
// shot speed and yacht cannon, but not Fat Head Dave's kit (plan item D5, owner sign-off
// 2026-11-11): his own attack order per health section, two signatures no other ground boss
// uses, and a slightly faster move clock. All of it is existing moves and existing art.
const REDKEV_KIT = {
  cadence:1.01,
  sectionAttacks:[['hammer','ripple','comet','floorSaw'],['eyeShot','minefall','needleFall','starCross']],
  signatures:['forgePress','portalRing']
};
const bossKitOverride=index=>LEVELS[index]?.id===13?REDKEV_KIT:null;

// Each row schedules one projectile. Sky shots use a player-relative x offset.
const SIGNATURE_PATTERNS = {
  anchorRun:[[0,'sky',-100,1,8,'anchor',.15],[30,'right',-31,-14,0,'torpedo']],
  bellSweep:[[0,'sky',90,-2,7,'bell',.18],[32,'boss',-162,-10,-3,'urchin',.17]],
  cabinetRush:[[0,'boss',-100,-12,0,'joystick'],[31,'left',-30,13,0,'token']],
  casinoBounce:[[0,'sky',-85,0,9,'dice',.18],[29,'boss',-148,-10,-5,'pinball',.28,2]],
  forgePress:[[0,'boss',-24,-13,0,'ironball'],[31,'sky',115,0,10,'anvil',.22]],
  frostRotor:[[0,'right',-26,-14,0,'buzzblade'],[31,'left',-105,12,0,'buzzblade']],
  crystalFlank:[[0,'right',-177,-12,3.6,'shard'],[29,'left',-190,12,4,'shard']],
  scarabSkitter:[[0,'left',-25,12,0,'scarab'],[28,'right',-160,-11,4.8,'scarab']],
  diamondStep:[[0,'boss',-106,-14,0,'diamond'],[30,'sky',-110,2,9,'diamond',.18]],
  solarVolley:[[0,'boss',-155,-10,-4,'solar',.16],[32,'left',-180,12,2.8,'solar']],
  tridentArc:[[0,'boss',-183,-12,-5,'trident',.17],[32,'left',-65,11,-4,'trident',.19]],
  prismRicochet:[[0,'right',-160,-12,0,'prismwedge',.18,1],[29,'left',-102,13,0,'prismwedge']],
  portalRing:[[0,'left',-108,11,0,'portal'],[29,'sky',130,-3,8,'portal',.14]],
  meteorFall:[[0,'sky',-130,3.5,10,'meteor',.20],[27,'sky',145,-3.8,10,'meteor',.20]],
  hourglassDrop:[[0,'sky',90,-1.8,6.2,'hourglass',.16],[31,'boss',-105,-13,0,'hourglass']]
};

// Mudline's flight moves target air lanes rather than the floor.
const FLIGHT_POOLS = [
  {base:['airLanes','airBarrage'],unlocks:['airDive','airFork','airLift','airSpiral']},
  {base:['airMechaMissiles','airPincer','airCrossfire'],unlocks:['airRain','airRockets','airWings','airMines']}
];

// Rows schedule [frame, source, offset from the initial player position, vx, vy, sprite].
const FLIGHT_PATTERNS = {
  airLanes:[[0,'boss',-112,-12,0,'prism'],[20,'boss',112,-12,0,'prism'],[40,'boss',0,-13,0,'comet']],
  airBarrage:[[0,'boss',-55,-10,-4,'pearl'],[24,'boss',55,-11,4,'pearl']],
  airDive:[[0,'top',-120,3.2,10,'shard'],[26,'top',135,-4,10.5,'shard']],
  airFork:[[0,'boss',0,-12,-4.5,'trident'],[20,'boss',0,-12,4.5,'trident']],
  airLift:[[0,'bottom',-135,3.4,-11,'diamond'],[28,'bottom',135,-3,-11,'diamond']],
  airSpiral:[[0,'boss',-90,-11,3.8,'star'],[22,'left',95,10,-3.4,'star'],[43,'boss',0,-13,0,'star']],
  airPincer:[[0,'left',-70,12,1.6,'prismwedge'],[20,'right',70,-12,-1.6,'prismwedge']],
  airCrossfire:[[0,'left',-125,13,0,'slab'],[20,'right',0,-13,0,'slab'],[40,'left',125,13,0,'slab']],
  airRain:[[0,'top',-130,1.8,13,'needle'],[20,'top',125,-1.8,13,'needle'],[40,'top',0,0,14,'needle']],
  airRockets:[[0,'right',-95,-15,2.2,'torpedo'],[26,'left',95,14,-2.2,'torpedo']],
  airWings:[[0,'bottom',-145,4.6,-11.5,'crescent'],[20,'top',145,-4.6,11.5,'crescent']],
  airMines:[[0,'bottom',-95,2,-8.6,'mine'],[25,'top',105,-2,8.6,'mine'],[48,'right',0,-11.5,0,'mine']]
};
