/* Reference only: no production clips. */
Arcade.registerAssets({
  "id": "bosses/07-moonkeep",
  "stage": "07-moonkeep",
  "status": "reference-only",
  "productionApproved": false,
  "timingProvisional": false,
  "sourceKind": "procedural-svg",
  "generationIds": [],
  "reference": {
    "path": "art/rework/bosses/07-moonkeep/reference.svg",
    "width": 1280,
    "height": 800,
    "pivot": [
      0,
      0
    ]
  },
  "anchors": {
    "phase1": {
      "space": "world",
      "pilot": [
        1092,
        278
      ],
      "pilotHeight": 48,
      "cockpit": [
        1055,
        220,
        75,
        65
      ],
      "weakPoint": [
        1050,
        330,
        110,
        100
      ],
      "neckPivot": {
        "position": [
          1090,
          300
        ],
        "status": "art-reference-candidate"
      },
      "launch": [
        20,
        620,
        330,
        20
      ],
      "step": [
        300,
        540,
        220,
        20
      ],
      "lift": {
        "x": 520,
        "y": "460 + sin(phaseTick / 70) * 35",
        "w": 220,
        "h": 20
      },
      "jointLedge": [
        800,
        420,
        450,
        20
      ]
    },
    "phase2": {
      "space": "world",
      "pilot": [
        1092,
        278
      ],
      "pilotHeight": 48,
      "cockpit": [
        1055,
        220,
        75,
        65
      ],
      "weakPoint": [
        1110,
        330,
        100,
        100
      ],
      "neckPivot": {
        "position": [
          1090,
          300
        ],
        "status": "art-reference-candidate"
      },
      "upperLaunch": [
        40,
        420,
        420,
        20
      ],
      "upperLanding": [
        1000,
        420,
        260,
        20
      ],
      "mandatoryGap": 540,
      "recovery": [
        20,
        650,
        1240,
        20
      ],
      "returnStep": [
        80,
        550,
        200,
        20
      ],
      "crumbling": [
        610,
        420,
        140,
        20
      ],
      "crumblingActive": false
    }
  },
  "criticalPoses": {
    "phase1": [
      "cycle 60: player position lock / jaw ratchet",
      "60 tick windup; bite active18; recovery30",
      "cycle 138\u2013234: joint open; cycle240 restarts"
    ],
    "phase2": [
      "tick60: crack cue; inactive crumbled span",
      "depart upper launch \u2192 air dash \u2192 far upper landing",
      "Iron Fang returns at tick660 then every300 ticks"
    ]
  },
  "timingSource": "stages/07-moonkeep/timing.md",
  "clips": [],
  "pending": [
    "human encounter timing signoff",
    "critical pose and hit area signoff",
    "Higgsfield generation",
    "raster atlas and event anchors",
    "gameplay-scale readability verification"
  ],
  "gameplayReview": {
    "path": "art/rework/bosses/07-moonkeep/gameplay-scale.svg",
    "width": 1280,
    "height": 1440,
    "viewport": [
      1280,
      720
    ]
  },
  "timingStatus": "implementation-candidate-human-signoff-pending",
  "implementationCommit": "08ed7ce",
  "simulationEvidence": {
    "source": "stages/07-moonkeep/timing.md",
    "kind": "reported deterministic runtime fixtures",
    "seed": 37,
    "fullRunTicks": 763,
    "remainingHp": 4,
    "powersUsed": false,
    "humanPlaytest": false,
    "geometry": "540px gap; 100 sampled non-dash second-jump timings fail; dash timings14\u201328 pass; recovery route and lift carry checked"
  }
});
