/* Reference only: no production clips. */
Arcade.registerAssets({
  "id": "bosses/01-marina",
  "stage": "01-marina",
  "status": "reference-only",
  "productionApproved": false,
  "timingProvisional": false,
  "sourceKind": "procedural-svg",
  "generationIds": [],
  "reference": {
    "path": "art/rework/bosses/01-marina/reference.svg",
    "width": 1280,
    "height": 800,
    "pivot": [
      0,
      0
    ]
  },
  "anchors": {
    "phase1": {
      "pilot": [
        1048,
        440
      ],
      "weakPoint": [
        1040,
        490,
        110,
        110
      ],
      "pistonPivot": [
        1164,
        460
      ]
    },
    "phase2": {
      "pilot": [
        1048,
        440
      ],
      "weakPoint": [
        1040,
        490,
        110,
        110
      ],
      "valve": [
        838,
        500,
        68,
        100
      ]
    }
  },
  "criticalPoses": {
    "phase1": [
      "60 throttle cue",
      "120 wake release",
      "180\u2013389 vent recovery"
    ],
    "phase2": [
      "30 pipes cue",
      "120 front active",
      "counter \u2192 valve \u2192 210t vent"
    ]
  },
  "timingSource": "stages/01-marina/timing.md",
  "clips": [],
  "pending": [
    "human encounter timing signoff",
    "critical pose and hit area signoff",
    "Higgsfield generation",
    "raster atlas and event anchors",
    "gameplay-scale readability verification"
  ],
  "gameplayReview": {
    "path": "art/rework/bosses/01-marina/gameplay-scale.svg",
    "width": 1280,
    "height": 1440,
    "viewport": [
      1280,
      720
    ]
  }
});
