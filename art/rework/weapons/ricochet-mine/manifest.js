/* Reference only: no production clips. */
Arcade.registerAssets({
  "id": "weapons/ricochet-mine",
  "status": "reference-only",
  "productionApproved": false,
  "sourceKind": "procedural-svg",
  "generationIds": [],
  "reference": {
    "path": "art/rework/weapons/ricochet-mine/reference.svg",
    "width": 1280,
    "height": 720,
    "pivot": [
      0,
      0
    ]
  },
  "charges": 2,
  "timingSource": "runtime/weapons/weapons.js; runtime/core/world.js",
  "effectAnchor": {
    "space": "world",
    "x": "player.x",
    "y": "player.y - 14"
  },
  "simulation": {
    "damage": 6,
    "radius": 90,
    "bounces": 2,
    "ttl": 180,
    "gravity": 0.4
  },
  "clips": [],
  "pending": [
    "critical pose and hit area signoff",
    "Higgsfield generation",
    "atlas frames and durations",
    "gameplay-scale readability review"
  ]
});
