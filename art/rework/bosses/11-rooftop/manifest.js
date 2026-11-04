/* Reference only: no production clips. */
Arcade.registerAssets({
  "id": "bosses/11-rooftop",
  "stage": "11-rooftop",
  "status": "reference-only",
  "productionApproved": false,
  "timingProvisional": false,
  "sourceKind": "procedural-svg",
  "generationIds": [],
  "reference": {
    "path": "art/rework/bosses/11-rooftop/reference.svg",
    "width": 1280,
    "height": 800,
    "pivot": [
      0,
      0
    ]
  },
  "anchors": {
    "phase1": {
      "pilotRelativeToPlayer": [
        -260,
        -65
      ],
      "pivotRelativeToMachine": [
        0,
        0
      ]
    },
    "phase2": {
      "pilotRelativeToPlayer": [
        440,
        -65
      ],
      "pivotRelativeToMachine": [
        0,
        0
      ]
    }
  },
  "criticalPoses": {
    "phase1": [
      "48t windup",
      "130t active",
      "10t recovery"
    ],
    "phase2": [
      "600t isolated rule",
      "bank at x5500",
      "front at x6920"
    ]
  },
  "timingSource": "stages/11-rooftop/timing.md",
  "clips": [],
  "pending": [
    "human encounter timing signoff",
    "critical pose and hit area signoff",
    "Higgsfield generation",
    "raster atlas and event anchors",
    "gameplay-scale readability verification"
  ],
  "gameplayReview": {
    "path": "art/rework/bosses/11-rooftop/gameplay-scale.svg",
    "width": 1280,
    "height": 1440,
    "viewport": [
      1280,
      720
    ]
  }
});
