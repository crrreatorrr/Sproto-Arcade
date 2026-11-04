/* Reference only: no production clips. */
Arcade.registerAssets({
  "id": "weapons/prism-rail",
  "status": "reference-only",
  "productionApproved": false,
  "sourceKind": "procedural-svg",
  "generationIds": [],
  "reference": {
    "path": "art/rework/weapons/prism-rail/reference.svg",
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
    "y": "player.y - 26"
  },
  "simulation": {
    "damage": 8,
    "speed": 32,
    "ttl": 100,
    "piercing": true
  },
  "clips": [],
  "pending": [
    "critical pose and hit area signoff",
    "Higgsfield generation",
    "atlas frames and durations",
    "gameplay-scale readability review"
  ]
});
