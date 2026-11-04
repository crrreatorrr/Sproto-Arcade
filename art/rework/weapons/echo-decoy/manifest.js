/* Reference only: no production clips. */
Arcade.registerAssets({
  "id": "weapons/echo-decoy",
  "status": "reference-only",
  "productionApproved": false,
  "sourceKind": "procedural-svg",
  "generationIds": [],
  "reference": {
    "path": "art/rework/weapons/echo-decoy/reference.svg",
    "width": 1280,
    "height": 720,
    "pivot": [
      0,
      0
    ]
  },
  "charges": 1,
  "timingSource": "runtime/weapons/weapons.js; runtime/core/world.js",
  "effectAnchor": {
    "space": "world",
    "x": "player.x",
    "y": "player.y - 26"
  },
  "simulation": {
    "ttl": 240,
    "eligibleAimOnly": true
  },
  "clips": [],
  "pending": [
    "critical pose and hit area signoff",
    "Higgsfield generation",
    "atlas frames and durations",
    "gameplay-scale readability review"
  ]
});
