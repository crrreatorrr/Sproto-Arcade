/* Planned requests stay planned. clips[] holds the sheets that were sliced, timed and measured. */
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
  "clips": [
    {
      "id": "01-marina.breakwater-slam-release",
      "phase": 1,
      "role": "attack",
      "distinctActionKey": "breakwater-slam-release",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "53688e04-3ab9-463c-86ec-ea9fbfc41956"
      ],
      "assetPath": "art/bosses/bront/p1-breakwater-slam-release/00.webp",
      "frames": [
        "art/bosses/bront/p1-breakwater-slam-release/00.webp",
        "art/bosses/bront/p1-breakwater-slam-release/01.webp",
        "art/bosses/bront/p1-breakwater-slam-release/02.webp",
        "art/bosses/bront/p1-breakwater-slam-release/03.webp",
        "art/bosses/bront/p1-breakwater-slam-release/04.webp",
        "art/bosses/bront/p1-breakwater-slam-release/05.webp",
        "art/bosses/bront/p1-breakwater-slam-release/06.webp",
        "art/bosses/bront/p1-breakwater-slam-release/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        201,
        300
      ],
      "frameTicks": [
        6,
        6,
        6,
        6,
        6,
        6,
        4,
        4
      ],
      "durationTicks": 44,
      "pivot": [
        100,
        300
      ],
      "muzzle": [
        10,
        154
      ],
      "weakPoint": [
        105,
        72
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "eventDeltas": [
        53.1,
        51.2,
        34.9,
        177,
        100.5,
        152,
        119.4
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 14,
        "active": 18,
        "rest": 12
      },
      "verifiedDistinct": true
    },
    {
      "id": "01-marina.piston-hang-cue",
      "phase": 1,
      "role": "attack",
      "distinctActionKey": "piston-hang-cue",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "efe7cb15-b7ca-4585-9612-63f6e7835948"
      ],
      "assetPath": "art/bosses/bront/p1-piston-hang-cue/00.webp",
      "frames": [
        "art/bosses/bront/p1-piston-hang-cue/00.webp",
        "art/bosses/bront/p1-piston-hang-cue/01.webp",
        "art/bosses/bront/p1-piston-hang-cue/02.webp",
        "art/bosses/bront/p1-piston-hang-cue/03.webp",
        "art/bosses/bront/p1-piston-hang-cue/04.webp",
        "art/bosses/bront/p1-piston-hang-cue/05.webp",
        "art/bosses/bront/p1-piston-hang-cue/06.webp",
        "art/bosses/bront/p1-piston-hang-cue/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        278,
        300
      ],
      "frameTicks": [
        15,
        15,
        15,
        15,
        3,
        2,
        2,
        1
      ],
      "durationTicks": 68,
      "pivot": [
        139,
        300
      ],
      "muzzle": [
        2,
        120
      ],
      "weakPoint": [
        139,
        1
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 7
      },
      "eventDeltas": [
        20.3,
        26.8,
        52.3,
        303.2,
        43.1,
        40.9,
        45
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 54,
        "active": 8,
        "rest": 6
      },
      "verifiedDistinct": true
    },
    {
      "id": "01-marina.slam-recoil-steam",
      "phase": 1,
      "role": "recovery",
      "distinctActionKey": "slam-recoil-steam",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "2e583f8a-de98-4289-80ee-5cbaecb68109"
      ],
      "assetPath": "art/bosses/bront/p1-slam-recoil-steam/00.webp",
      "frames": [
        "art/bosses/bront/p1-slam-recoil-steam/00.webp",
        "art/bosses/bront/p1-slam-recoil-steam/01.webp",
        "art/bosses/bront/p1-slam-recoil-steam/02.webp",
        "art/bosses/bront/p1-slam-recoil-steam/03.webp",
        "art/bosses/bront/p1-slam-recoil-steam/04.webp",
        "art/bosses/bront/p1-slam-recoil-steam/05.webp",
        "art/bosses/bront/p1-slam-recoil-steam/06.webp",
        "art/bosses/bront/p1-slam-recoil-steam/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        231,
        300
      ],
      "frameTicks": [
        3,
        3,
        3,
        3,
        5,
        23,
        22,
        22
      ],
      "durationTicks": 84,
      "pivot": [
        116,
        300
      ],
      "muzzle": [
        14,
        137
      ],
      "weakPoint": [
        122,
        0
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 5
      },
      "eventDeltas": [
        97.1,
        88.4,
        147.3,
        236.7,
        144.6,
        92.3,
        77.3
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 8,
        "active": 12,
        "rest": 64
      },
      "verifiedDistinct": true
    },
    {
      "id": "01-marina.wheelhouse-entry-ext",
      "phase": 1,
      "role": "attack",
      "distinctActionKey": "wheelhouse-entry-ext",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "b835b07c-d662-4421-bbb5-027b2c057beb"
      ],
      "assetPath": "art/bosses/bront/p1-wheelhouse-entry-ext/00.webp",
      "frames": [
        "art/bosses/bront/p1-wheelhouse-entry-ext/00.webp",
        "art/bosses/bront/p1-wheelhouse-entry-ext/01.webp",
        "art/bosses/bront/p1-wheelhouse-entry-ext/02.webp",
        "art/bosses/bront/p1-wheelhouse-entry-ext/03.webp",
        "art/bosses/bront/p1-wheelhouse-entry-ext/04.webp",
        "art/bosses/bront/p1-wheelhouse-entry-ext/05.webp",
        "art/bosses/bront/p1-wheelhouse-entry-ext/06.webp",
        "art/bosses/bront/p1-wheelhouse-entry-ext/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        201,
        300
      ],
      "frameTicks": [
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8
      ],
      "durationTicks": 64,
      "pivot": [
        100,
        300
      ],
      "muzzle": [
        0,
        150
      ],
      "weakPoint": [
        100,
        0
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "eventDeltas": [
        24.5,
        22.3,
        23.2,
        44.8,
        20.3,
        33.8,
        21.8
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": null,
      "verifiedDistinct": true
    },
    {
      "id": "01-marina.wheelhouse-entry",
      "phase": 1,
      "role": "attack",
      "distinctActionKey": "wheelhouse-entry",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "92897b30-a0a2-435e-b081-cca7b4bb695e"
      ],
      "assetPath": "art/bosses/bront/p1-wheelhouse-entry/00.webp",
      "frames": [
        "art/bosses/bront/p1-wheelhouse-entry/00.webp",
        "art/bosses/bront/p1-wheelhouse-entry/01.webp",
        "art/bosses/bront/p1-wheelhouse-entry/02.webp",
        "art/bosses/bront/p1-wheelhouse-entry/03.webp",
        "art/bosses/bront/p1-wheelhouse-entry/04.webp",
        "art/bosses/bront/p1-wheelhouse-entry/05.webp",
        "art/bosses/bront/p1-wheelhouse-entry/06.webp",
        "art/bosses/bront/p1-wheelhouse-entry/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        201,
        300
      ],
      "frameTicks": [
        8,
        8,
        8,
        8,
        4,
        3,
        3,
        6
      ],
      "durationTicks": 48,
      "pivot": [
        100,
        300
      ],
      "muzzle": [
        0,
        150
      ],
      "weakPoint": [
        100,
        0
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 7
      },
      "eventDeltas": [
        20.8,
        16.7,
        21.7,
        24.9,
        11.3,
        7.5,
        17.7
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 20,
        "active": 10,
        "rest": 18
      },
      "verifiedDistinct": true
    },
    {
      "id": "01-marina.front-nozzle-lock",
      "phase": 2,
      "role": "attack",
      "distinctActionKey": "front-nozzle-lock",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "d6763adb-bedc-456f-a196-c469177fd8d5"
      ],
      "assetPath": "art/bosses/bront/p2-front-nozzle-lock/00.webp",
      "frames": [
        "art/bosses/bront/p2-front-nozzle-lock/00.webp",
        "art/bosses/bront/p2-front-nozzle-lock/01.webp",
        "art/bosses/bront/p2-front-nozzle-lock/02.webp",
        "art/bosses/bront/p2-front-nozzle-lock/03.webp",
        "art/bosses/bront/p2-front-nozzle-lock/04.webp",
        "art/bosses/bront/p2-front-nozzle-lock/05.webp",
        "art/bosses/bront/p2-front-nozzle-lock/06.webp",
        "art/bosses/bront/p2-front-nozzle-lock/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        292,
        300
      ],
      "frameTicks": [
        12,
        12,
        12,
        12,
        3,
        1,
        1,
        1
      ],
      "durationTicks": 54,
      "pivot": [
        146,
        300
      ],
      "muzzle": [
        15,
        149
      ],
      "weakPoint": [
        150,
        1
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 5
      },
      "eventDeltas": [
        40.4,
        45.1,
        35.8,
        85.3,
        31.2,
        23.6,
        20.3
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 40,
        "active": 8,
        "rest": 6
      },
      "verifiedDistinct": true
    },
    {
      "id": "01-marina.pipe-charge-traverse",
      "phase": 2,
      "role": "attack",
      "distinctActionKey": "pipe-charge-traverse",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "559f41de-a91e-44aa-a78f-70ab6c439b7d"
      ],
      "assetPath": "art/bosses/bront/p2-pipe-charge-traverse/00.webp",
      "frames": [
        "art/bosses/bront/p2-pipe-charge-traverse/00.webp",
        "art/bosses/bront/p2-pipe-charge-traverse/01.webp",
        "art/bosses/bront/p2-pipe-charge-traverse/02.webp",
        "art/bosses/bront/p2-pipe-charge-traverse/03.webp",
        "art/bosses/bront/p2-pipe-charge-traverse/04.webp",
        "art/bosses/bront/p2-pipe-charge-traverse/05.webp",
        "art/bosses/bront/p2-pipe-charge-traverse/06.webp",
        "art/bosses/bront/p2-pipe-charge-traverse/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        293,
        300
      ],
      "frameTicks": [
        14,
        14,
        13,
        13,
        2,
        2,
        1,
        1
      ],
      "durationTicks": 60,
      "pivot": [
        146,
        300
      ],
      "muzzle": [
        0,
        150
      ],
      "weakPoint": [
        146,
        1
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "eventDeltas": [
        24.9,
        18.7,
        19.9,
        81,
        44.8,
        47.2,
        24.4
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 46,
        "active": 8,
        "rest": 6
      },
      "verifiedDistinct": true
    },
    {
      "id": "01-marina.pressure-lock-release",
      "phase": 2,
      "role": "attack",
      "distinctActionKey": "pressure-lock-release",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "694f63d6-2b7e-4cba-ac35-585a1a73d53b"
      ],
      "assetPath": "art/bosses/bront/p2-pressure-lock-release/00.webp",
      "frames": [
        "art/bosses/bront/p2-pressure-lock-release/00.webp",
        "art/bosses/bront/p2-pressure-lock-release/01.webp",
        "art/bosses/bront/p2-pressure-lock-release/02.webp",
        "art/bosses/bront/p2-pressure-lock-release/03.webp",
        "art/bosses/bront/p2-pressure-lock-release/04.webp",
        "art/bosses/bront/p2-pressure-lock-release/05.webp",
        "art/bosses/bront/p2-pressure-lock-release/06.webp",
        "art/bosses/bront/p2-pressure-lock-release/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        201,
        300
      ],
      "frameTicks": [
        4,
        4,
        3,
        3,
        4,
        4,
        4,
        4
      ],
      "durationTicks": 30,
      "pivot": [
        100,
        300
      ],
      "muzzle": [
        0,
        150
      ],
      "weakPoint": [
        97,
        0
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 5
      },
      "eventDeltas": [
        23.6,
        25.7,
        34.6,
        205.5,
        137.2,
        77.9,
        101.7
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 8,
        "active": 12,
        "rest": 10
      },
      "verifiedDistinct": true
    },
    {
      "id": "01-marina.pressure-nozzle-fire",
      "phase": 2,
      "role": "attack",
      "distinctActionKey": "pressure-nozzle-fire",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "1201002c-6bc5-4f14-b497-ccb5cb06a9e5"
      ],
      "assetPath": "art/bosses/bront/p2-pressure-nozzle-fire/00.webp",
      "frames": [
        "art/bosses/bront/p2-pressure-nozzle-fire/00.webp",
        "art/bosses/bront/p2-pressure-nozzle-fire/01.webp",
        "art/bosses/bront/p2-pressure-nozzle-fire/02.webp",
        "art/bosses/bront/p2-pressure-nozzle-fire/03.webp",
        "art/bosses/bront/p2-pressure-nozzle-fire/04.webp",
        "art/bosses/bront/p2-pressure-nozzle-fire/05.webp",
        "art/bosses/bront/p2-pressure-nozzle-fire/06.webp",
        "art/bosses/bront/p2-pressure-nozzle-fire/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        200,
        300
      ],
      "frameTicks": [
        5,
        5,
        5,
        5,
        7,
        3,
        3,
        3
      ],
      "durationTicks": 36,
      "pivot": [
        100,
        300
      ],
      "muzzle": [
        0,
        150
      ],
      "weakPoint": [
        99,
        0
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 5
      },
      "eventDeltas": [
        12.9,
        14.5,
        20.2,
        251.9,
        156.4,
        109.5,
        88.7
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 12,
        "active": 16,
        "rest": 8
      },
      "verifiedDistinct": true
    },
    {
      "id": "01-marina.valve-release-turn",
      "phase": 2,
      "role": "recovery",
      "distinctActionKey": "valve-release-turn",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "38cf5559-d49d-44f6-bcde-bf12e20f706c"
      ],
      "assetPath": "art/bosses/bront/p2-valve-release-turn/00.webp",
      "frames": [
        "art/bosses/bront/p2-valve-release-turn/00.webp",
        "art/bosses/bront/p2-valve-release-turn/01.webp",
        "art/bosses/bront/p2-valve-release-turn/02.webp",
        "art/bosses/bront/p2-valve-release-turn/03.webp",
        "art/bosses/bront/p2-valve-release-turn/04.webp",
        "art/bosses/bront/p2-valve-release-turn/05.webp",
        "art/bosses/bront/p2-valve-release-turn/06.webp",
        "art/bosses/bront/p2-valve-release-turn/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        248,
        300
      ],
      "frameTicks": [
        3,
        3,
        3,
        3,
        4,
        18,
        18,
        18
      ],
      "durationTicks": 70,
      "pivot": [
        124,
        300
      ],
      "muzzle": [
        1,
        150
      ],
      "weakPoint": [
        124,
        1
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 5
      },
      "eventDeltas": [
        17.6,
        18.3,
        16.7,
        108.6,
        64.1,
        24.6,
        41.4
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 8,
        "active": 10,
        "rest": 52
      },
      "verifiedDistinct": true
    },
    {
      "id": "01-marina.slam-wake-projectile",
      "phase": 1,
      "role": "projectile",
      "distinctActionKey": "slam-wake-projectile",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "d7aa7e60-2282-4182-b449-97b7ab955a85"
      ],
      "assetPath": "art/bosses/bront/projectiles/p1-slam-wake-projectile/00.webp",
      "frames": [
        "art/bosses/bront/projectiles/p1-slam-wake-projectile/00.webp",
        "art/bosses/bront/projectiles/p1-slam-wake-projectile/01.webp",
        "art/bosses/bront/projectiles/p1-slam-wake-projectile/02.webp",
        "art/bosses/bront/projectiles/p1-slam-wake-projectile/03.webp",
        "art/bosses/bront/projectiles/p1-slam-wake-projectile/04.webp",
        "art/bosses/bront/projectiles/p1-slam-wake-projectile/05.webp",
        "art/bosses/bront/projectiles/p1-slam-wake-projectile/06.webp",
        "art/bosses/bront/projectiles/p1-slam-wake-projectile/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        129,
        96
      ],
      "frameTicks": [
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8
      ],
      "durationTicks": 64,
      "pivot": [
        64,
        48
      ],
      "muzzle": [
        3,
        48
      ],
      "weakPoint": [
        64,
        1
      ],
      "events": {
        "telegraph": 0,
        "release": 6,
        "recovery": 7
      },
      "eventDeltas": [
        173.5,
        223.2,
        195.9,
        163.1,
        113,
        311,
        298.2
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": null,
      "verifiedDistinct": true
    },
    {
      "id": "01-marina.pressure-curtain-projectile",
      "phase": 2,
      "role": "projectile",
      "distinctActionKey": "pressure-curtain-projectile",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "1207b88e-83f5-46f8-a4d1-1cea444fe9c5"
      ],
      "assetPath": "art/bosses/bront/projectiles/p2-pressure-curtain-projectile/00.webp",
      "frames": [
        "art/bosses/bront/projectiles/p2-pressure-curtain-projectile/00.webp",
        "art/bosses/bront/projectiles/p2-pressure-curtain-projectile/01.webp",
        "art/bosses/bront/projectiles/p2-pressure-curtain-projectile/02.webp",
        "art/bosses/bront/projectiles/p2-pressure-curtain-projectile/03.webp",
        "art/bosses/bront/projectiles/p2-pressure-curtain-projectile/04.webp",
        "art/bosses/bront/projectiles/p2-pressure-curtain-projectile/05.webp",
        "art/bosses/bront/projectiles/p2-pressure-curtain-projectile/06.webp",
        "art/bosses/bront/projectiles/p2-pressure-curtain-projectile/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        62,
        96
      ],
      "frameTicks": [
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8
      ],
      "durationTicks": 64,
      "pivot": [
        31,
        48
      ],
      "muzzle": [
        1,
        48
      ],
      "weakPoint": [
        31,
        8
      ],
      "events": {
        "telegraph": 0,
        "release": 7,
        "recovery": 7
      },
      "eventDeltas": [
        217.5,
        93.3,
        126.3,
        232.4,
        101.1,
        160.3,
        270.1
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": null,
      "verifiedDistinct": true
    }
  ],
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
  },
  "operator": "Fat Head Dave",
  "machines": [
    "Breakwater Tug",
    "Dry Dock Press"
  ],
  "minimumDistinctClips": 30,
  "plannedClipCount": 32,
  "actualVerifiedClipCount": 12,
  "inventoryBasisCommit": "7c62524",
  "plannedClips": [
    {
      "id": "01-marina.wheelhouse-entry",
      "phase": 1,
      "machine": "Breakwater Tug",
      "role": "entry",
      "motionBrief": "Dave steps into the wheelhouse and takes the throttle",
      "distinctActionKey": "wheelhouse-entry",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 1
    },
    {
      "id": "01-marina.docked-engine-idle",
      "phase": 1,
      "machine": "Breakwater Tug",
      "role": "idle",
      "motionBrief": "Tug pistons and exhaust cycle while the hull stays fixed",
      "distinctActionKey": "docked-engine-idle",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 1
    },
    {
      "id": "01-marina.bow-linkage-test",
      "phase": 1,
      "machine": "Breakwater Tug",
      "role": "articulation",
      "motionBrief": "Bow linkage extends and draws the piston back into its guide",
      "distinctActionKey": "bow-linkage-test",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 1
    },
    {
      "id": "01-marina.throttle-pull",
      "phase": 1,
      "machine": "Breakwater Tug",
      "role": "operator",
      "motionBrief": "Dave pulls the throttle lever with a visible shoulder motion",
      "distinctActionKey": "throttle-pull",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 1
    },
    {
      "id": "01-marina.piston-hang-cue",
      "phase": 1,
      "machine": "Breakwater Tug",
      "role": "cue",
      "motionBrief": "Bow piston rises and hangs above the dock before the slam",
      "distinctActionKey": "piston-hang-cue",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 2
    },
    {
      "id": "01-marina.bow-pressure-load",
      "phase": 1,
      "machine": "Breakwater Tug",
      "role": "windup",
      "motionBrief": "Piston housing compresses against the loaded spring",
      "distinctActionKey": "bow-pressure-load",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 2
    },
    {
      "id": "01-marina.breakwater-slam-release",
      "phase": 1,
      "machine": "Breakwater Tug",
      "role": "active",
      "motionBrief": "Bow piston strikes and launches the low wake",
      "distinctActionKey": "breakwater-slam-release",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 2
    },
    {
      "id": "01-marina.slam-recoil-steam",
      "phase": 1,
      "machine": "Breakwater Tug",
      "role": "recovery",
      "motionBrief": "Piston recoils as steam vents upward after impact",
      "distinctActionKey": "slam-recoil-steam",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 2
    },
    {
      "id": "01-marina.steam-vent-unseal",
      "phase": 1,
      "machine": "Breakwater Tug",
      "role": "weakpoint-open",
      "motionBrief": "Vent shutters peel open to expose the firing target",
      "distinctActionKey": "steam-vent-unseal",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 3
    },
    {
      "id": "01-marina.steam-vent-reseal",
      "phase": 1,
      "machine": "Breakwater Tug",
      "role": "weakpoint-close",
      "motionBrief": "Vent shutters close and the steam stream cuts off",
      "distinctActionKey": "steam-vent-reseal",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 3
    },
    {
      "id": "01-marina.vent-hit-buckle",
      "phase": 1,
      "machine": "Breakwater Tug",
      "role": "hit-reaction",
      "motionBrief": "A hit on the exposed vent kicks the grille and engine mounts",
      "distinctActionKey": "vent-hit-buckle",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 3
    },
    {
      "id": "01-marina.bow-armor-deflect",
      "phase": 1,
      "machine": "Breakwater Tug",
      "role": "armor-reaction",
      "motionBrief": "Armored bow takes a glancing impact with a localized plate shudder",
      "distinctActionKey": "bow-armor-deflect",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 3
    },
    {
      "id": "01-marina.service-cradle-approach",
      "phase": "transition",
      "machine": "Breakwater Tug \u2192 Dry Dock Press",
      "role": "transform-unlock",
      "motionBrief": "Tug winch draws the hull into the service cradle",
      "distinctActionKey": "service-cradle-approach",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 4
    },
    {
      "id": "01-marina.wheelhouse-cradle-lock",
      "phase": "transition",
      "machine": "Breakwater Tug \u2192 Dry Dock Press",
      "role": "transform-reconfigure",
      "motionBrief": "Cradle clamps close around the retained wheelhouse base",
      "distinctActionKey": "wheelhouse-cradle-lock",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 4
    },
    {
      "id": "01-marina.pipe-coupler-deploy",
      "phase": "transition",
      "machine": "Breakwater Tug \u2192 Dry Dock Press",
      "role": "transform-deploy",
      "motionBrief": "Flexible pressure pipes extend and connect to the tug",
      "distinctActionKey": "pipe-coupler-deploy",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 4
    },
    {
      "id": "01-marina.press-piston-seat",
      "phase": "transition",
      "machine": "Breakwater Tug \u2192 Dry Dock Press",
      "role": "transform-settle",
      "motionBrief": "Retained bow piston seats vertically in the dry dock press",
      "distinctActionKey": "press-piston-seat",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 4
    },
    {
      "id": "01-marina.press-regulator-idle",
      "phase": 2,
      "machine": "Dry Dock Press",
      "role": "phase2-idle",
      "motionBrief": "Fixed press regulator rocks under normal engine pressure",
      "distinctActionKey": "press-regulator-idle",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 5
    },
    {
      "id": "01-marina.pipe-charge-traverse",
      "phase": 2,
      "machine": "Dry Dock Press",
      "role": "phase2-articulation",
      "motionBrief": "A mechanical charge indicator travels along the numbered pipes",
      "distinctActionKey": "pipe-charge-traverse",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 5
    },
    {
      "id": "01-marina.numbered-pipe-cue",
      "phase": 2,
      "machine": "Dry Dock Press",
      "role": "phase2-cue",
      "motionBrief": "Three pipe flags lift in order to announce the pressure front",
      "distinctActionKey": "numbered-pipe-cue",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 5
    },
    {
      "id": "01-marina.accumulator-load",
      "phase": 2,
      "machine": "Dry Dock Press",
      "role": "phase2-windup",
      "motionBrief": "Accumulator bladder expands while Dave braces the throttle",
      "distinctActionKey": "accumulator-load",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 5
    },
    {
      "id": "01-marina.front-nozzle-lock",
      "phase": 2,
      "machine": "Dry Dock Press",
      "role": "phase2-lock",
      "motionBrief": "Discharge nozzle snaps into the full-height chevron firing slot",
      "distinctActionKey": "front-nozzle-lock",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 6
    },
    {
      "id": "01-marina.pressure-lock-release",
      "phase": 2,
      "machine": "Dry Dock Press",
      "role": "phase2-active",
      "motionBrief": "Pressure curtain leaves the nozzle across the room",
      "distinctActionKey": "pressure-lock-release",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 6
    },
    {
      "id": "01-marina.backpressure-piston-return",
      "phase": 2,
      "machine": "Dry Dock Press",
      "role": "phase2-recovery",
      "motionBrief": "Press piston retracts against the exhausted accumulator",
      "distinctActionKey": "backpressure-piston-return",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 6
    },
    {
      "id": "01-marina.dash-counter-gauge-kick",
      "phase": 2,
      "machine": "Dry Dock Press",
      "role": "phase2-counter-feedback",
      "motionBrief": "A successful counter makes the pressure gauge needle kick to release",
      "distinctActionKey": "dash-counter-gauge-kick",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 6
    },
    {
      "id": "01-marina.valve-release-turn",
      "phase": 2,
      "machine": "Dry Dock Press",
      "role": "phase2-objective",
      "motionBrief": "Valve wheel unlocks and spins when the release target is broken",
      "distinctActionKey": "valve-release-turn",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 7
    },
    {
      "id": "01-marina.press-vent-steam-open",
      "phase": 2,
      "machine": "Dry Dock Press",
      "role": "phase2-weakpoint",
      "motionBrief": "Engine vent hinges outward under released pressure",
      "distinctActionKey": "press-vent-steam-open",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 7
    },
    {
      "id": "01-marina.press-core-hit-recoil",
      "phase": 2,
      "machine": "Dry Dock Press",
      "role": "phase2-hit-reaction",
      "motionBrief": "Exposed engine core jolts the piston guides on damage",
      "distinctActionKey": "press-core-hit-recoil",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 7
    },
    {
      "id": "01-marina.valve-rearm-seat",
      "phase": 2,
      "machine": "Dry Dock Press",
      "role": "phase2-reset",
      "motionBrief": "Valve seats again and pipe check valves reset for a new cycle",
      "distinctActionKey": "valve-rearm-seat",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 7
    },
    {
      "id": "01-marina.engine-final-seize",
      "phase": "defeat",
      "machine": "Dry Dock Press",
      "role": "defeat-impact",
      "motionBrief": "Final vent hit seizes the engine crank and bends its mounts",
      "distinctActionKey": "engine-final-seize",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 8,
      "terminalOutcome": "machine-defeat",
      "terminalMotionBrief": "Tug crank seizes after the final vent hit, pressure purges into service pipes, and the hull settles in its cradle; Dave remains sheltered in the wheelhouse."
    },
    {
      "id": "01-marina.pressure-safe-purge",
      "phase": "defeat",
      "machine": "Dry Dock Press",
      "role": "defeat-shutdown",
      "motionBrief": "Remaining pressure vents through the service pipes safely",
      "distinctActionKey": "pressure-safe-purge",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 8
    },
    {
      "id": "01-marina.dave-abandon-controls",
      "phase": "defeat",
      "machine": "Dry Dock Press",
      "role": "defeat-operator",
      "motionBrief": "Dave lets go of the throttle and ducks inside the wheelhouse",
      "distinctActionKey": "dave-abandon-controls",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 8
    },
    {
      "id": "01-marina.cradle-shutdown-settle",
      "phase": "defeat",
      "machine": "Dry Dock Press",
      "role": "defeat-settle",
      "motionBrief": "Cradle settles around the stopped tug with the piston slack",
      "distinctActionKey": "cradle-shutdown-settle",
      "timingReference": "stages/01-marina/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 8
    }
  ],
  "countPolicy": "Count verified distinct production motion clips only. Never count frames, mirrored exports, speed variants, holds, alternate encodes or repeated crops as extra animations.",
  "referenceStatus": "procedural-study-awaiting-human-review",
  "phaseCoverage": {
    "1": {
      "planned": 12,
      "actualVerified": 6,
      "timingReview": "pending",
      "criticalPoseReview": "pending",
      "bothRequiredBeforeGeneration": true
    },
    "2": {
      "planned": 12,
      "actualVerified": 6,
      "timingReview": "pending",
      "criticalPoseReview": "pending",
      "bothRequiredBeforeGeneration": true
    }
  },
  "coveragePolicy": "Review both phases of every boss. Planning metadata and procedural prototypes do not fulfill the production animation requirement.",
  "semanticDistinctnessReview": "pending-human-review; unique IDs and briefs are necessary but insufficient",
  "terminalOutcome": "machine-defeat",
  "terminalOutcomeDescription": "Tug crank seizes after the final vent hit, pressure purges into service pipes, and the hull settles in its cradle; Dave remains sheltered in the wheelhouse.",
  "terminalClipId": "01-marina.engine-final-seize",
  "terminalClipStatus": "planned-not-produced",
  "terminalSequenceClipIds": [
    "01-marina.engine-final-seize",
    "01-marina.pressure-safe-purge",
    "01-marina.dave-abandon-controls",
    "01-marina.cradle-shutdown-settle"
  ],
  "terminalAcceptance": {
    "required": true,
    "mustBeBossSpecific": true,
    "verifiedProductionClipRequired": true,
    "actualTerminalClipVerified": false,
    "operatorDeathImplied": false,
    "retryResetMustRemainValid": true,
    "status": "pending-production-and-integration"
  }
});
