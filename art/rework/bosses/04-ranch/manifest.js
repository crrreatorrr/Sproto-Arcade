/* Planned requests stay planned. clips[] holds the sheets that were sliced, timed and measured. */
Arcade.registerAssets({
  "id": "bosses/04-ranch",
  "stage": "04-ranch",
  "status": "inventory-only",
  "productionApproved": false,
  "timingProvisional": false,
  "sourceKind": "planned-motion-inventory-with-embedded-gameplay-reference",
  "generationIds": [],
  "timingSource": "stages/04-ranch/timing.md",
  "clips": [
    {
      "id": "04-ranch.harvest-roll-projectile",
      "phase": 1,
      "role": "projectile",
      "distinctActionKey": "harvest-roll-projectile",
      "timingReference": "stages/04-ranch/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "4cc02349-afe1-451b-8dd0-708cc8b794e2"
      ],
      "assetPath": "art/bosses/zephyr/projectiles/p1-harvest-roll-projectile/00.webp",
      "frames": [
        "art/bosses/zephyr/projectiles/p1-harvest-roll-projectile/00.webp",
        "art/bosses/zephyr/projectiles/p1-harvest-roll-projectile/01.webp",
        "art/bosses/zephyr/projectiles/p1-harvest-roll-projectile/02.webp",
        "art/bosses/zephyr/projectiles/p1-harvest-roll-projectile/03.webp",
        "art/bosses/zephyr/projectiles/p1-harvest-roll-projectile/04.webp",
        "art/bosses/zephyr/projectiles/p1-harvest-roll-projectile/05.webp",
        "art/bosses/zephyr/projectiles/p1-harvest-roll-projectile/06.webp",
        "art/bosses/zephyr/projectiles/p1-harvest-roll-projectile/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        138,
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
        69,
        48
      ],
      "muzzle": [
        11,
        48
      ],
      "weakPoint": [
        69,
        1
      ],
      "events": {
        "telegraph": 0,
        "release": 7,
        "recovery": 7
      },
      "eventDeltas": [
        220.6,
        124.5,
        100.2,
        66.8,
        45,
        225.5,
        276.7
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": null,
      "verifiedDistinct": true
    },
    {
      "id": "04-ranch.harvest-roll-cue",
      "phase": 1,
      "role": "attack",
      "distinctActionKey": "harvest-roll-cue",
      "timingReference": "stages/04-ranch/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "66295e7b-8a8c-4fd1-9e3c-c42e138308fb"
      ],
      "assetPath": "art/bosses/zephyr/p1-harvest-roll-cue/00.webp",
      "frames": [
        "art/bosses/zephyr/p1-harvest-roll-cue/00.webp",
        "art/bosses/zephyr/p1-harvest-roll-cue/01.webp",
        "art/bosses/zephyr/p1-harvest-roll-cue/02.webp",
        "art/bosses/zephyr/p1-harvest-roll-cue/03.webp",
        "art/bosses/zephyr/p1-harvest-roll-cue/04.webp",
        "art/bosses/zephyr/p1-harvest-roll-cue/05.webp",
        "art/bosses/zephyr/p1-harvest-roll-cue/06.webp",
        "art/bosses/zephyr/p1-harvest-roll-cue/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        228,
        300
      ],
      "frameTicks": [
        24,
        4,
        4,
        4,
        4,
        2,
        2,
        2
      ],
      "durationTicks": 46,
      "pivot": [
        114,
        300
      ],
      "muzzle": [
        8,
        152
      ],
      "weakPoint": [
        118,
        5
      ],
      "events": {
        "telegraph": 0,
        "release": 1,
        "recovery": 5
      },
      "eventDeltas": [
        148.2,
        114.9,
        115.1,
        109.8,
        141.3,
        70,
        50.8
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 36,
        "active": 6,
        "rest": 4
      },
      "verifiedDistinct": true
    },
    {
      "id": "04-ranch.harvest-roll-launcher-fire",
      "phase": 1,
      "role": "attack",
      "distinctActionKey": "harvest-roll-launcher-fire",
      "timingReference": "stages/04-ranch/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "67c54a7d-40e7-404f-a6ed-da4c031036cf"
      ],
      "assetPath": "art/bosses/zephyr/p1-harvest-roll-launcher-fire/00.webp",
      "frames": [
        "art/bosses/zephyr/p1-harvest-roll-launcher-fire/00.webp",
        "art/bosses/zephyr/p1-harvest-roll-launcher-fire/01.webp",
        "art/bosses/zephyr/p1-harvest-roll-launcher-fire/02.webp",
        "art/bosses/zephyr/p1-harvest-roll-launcher-fire/03.webp",
        "art/bosses/zephyr/p1-harvest-roll-launcher-fire/04.webp",
        "art/bosses/zephyr/p1-harvest-roll-launcher-fire/05.webp",
        "art/bosses/zephyr/p1-harvest-roll-launcher-fire/06.webp",
        "art/bosses/zephyr/p1-harvest-roll-launcher-fire/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        228,
        300
      ],
      "frameTicks": [
        5,
        5,
        4,
        4,
        4,
        6,
        3,
        3
      ],
      "durationTicks": 34,
      "pivot": [
        114,
        300
      ],
      "muzzle": [
        0,
        149
      ],
      "weakPoint": [
        113,
        0
      ],
      "events": {
        "telegraph": 0,
        "release": 5,
        "recovery": 6
      },
      "eventDeltas": [
        22.5,
        30.1,
        121.3,
        174.3,
        177,
        130.4,
        38
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 10,
        "active": 16,
        "rest": 8
      },
      "verifiedDistinct": true
    },
    {
      "id": "04-ranch.harvest-roll-release",
      "phase": 1,
      "role": "recovery",
      "distinctActionKey": "harvest-roll-release",
      "timingReference": "stages/04-ranch/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "1d27d511-219a-470c-a45c-1d00bfd0423d"
      ],
      "assetPath": "art/bosses/zephyr/p1-harvest-roll-release/00.webp",
      "frames": [
        "art/bosses/zephyr/p1-harvest-roll-release/00.webp",
        "art/bosses/zephyr/p1-harvest-roll-release/01.webp",
        "art/bosses/zephyr/p1-harvest-roll-release/02.webp",
        "art/bosses/zephyr/p1-harvest-roll-release/03.webp",
        "art/bosses/zephyr/p1-harvest-roll-release/04.webp",
        "art/bosses/zephyr/p1-harvest-roll-release/05.webp",
        "art/bosses/zephyr/p1-harvest-roll-release/06.webp",
        "art/bosses/zephyr/p1-harvest-roll-release/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        228,
        300
      ],
      "frameTicks": [
        4,
        4,
        4,
        4,
        4,
        4,
        23,
        23
      ],
      "durationTicks": 70,
      "pivot": [
        114,
        300
      ],
      "muzzle": [
        0,
        149
      ],
      "weakPoint": [
        113,
        0
      ],
      "events": {
        "telegraph": 0,
        "release": 5,
        "recovery": 6
      },
      "eventDeltas": [
        24.5,
        35.3,
        127.7,
        166.2,
        175.6,
        128.3,
        35.6
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
      "id": "04-ranch.pilot-lantern-lift",
      "phase": 1,
      "role": "attack",
      "distinctActionKey": "pilot-lantern-lift",
      "timingReference": "stages/04-ranch/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "2e3fc9d3-5ea5-41f5-9bf3-133483d4bf6b"
      ],
      "assetPath": "art/bosses/zephyr/p1-pilot-lantern-lift/00.webp",
      "frames": [
        "art/bosses/zephyr/p1-pilot-lantern-lift/00.webp",
        "art/bosses/zephyr/p1-pilot-lantern-lift/01.webp",
        "art/bosses/zephyr/p1-pilot-lantern-lift/02.webp",
        "art/bosses/zephyr/p1-pilot-lantern-lift/03.webp",
        "art/bosses/zephyr/p1-pilot-lantern-lift/04.webp",
        "art/bosses/zephyr/p1-pilot-lantern-lift/05.webp",
        "art/bosses/zephyr/p1-pilot-lantern-lift/06.webp",
        "art/bosses/zephyr/p1-pilot-lantern-lift/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        176,
        300
      ],
      "frameTicks": [
        13,
        13,
        12,
        12,
        2,
        2,
        2,
        2
      ],
      "durationTicks": 58,
      "pivot": [
        88,
        300
      ],
      "muzzle": [
        0,
        150
      ],
      "weakPoint": [
        87,
        0
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 5
      },
      "eventDeltas": [
        28.3,
        35,
        42.8,
        51.4,
        32.5,
        24.3,
        28.6
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 42,
        "active": 8,
        "rest": 8
      },
      "verifiedDistinct": true
    },
    {
      "id": "04-ranch.roller-feed-load",
      "phase": 1,
      "role": "attack",
      "distinctActionKey": "roller-feed-load",
      "timingReference": "stages/04-ranch/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "4540e07a-c267-43ba-99ec-94a355045414"
      ],
      "assetPath": "art/bosses/zephyr/p1-roller-feed-load/00.webp",
      "frames": [
        "art/bosses/zephyr/p1-roller-feed-load/00.webp",
        "art/bosses/zephyr/p1-roller-feed-load/01.webp",
        "art/bosses/zephyr/p1-roller-feed-load/02.webp",
        "art/bosses/zephyr/p1-roller-feed-load/03.webp",
        "art/bosses/zephyr/p1-roller-feed-load/04.webp",
        "art/bosses/zephyr/p1-roller-feed-load/05.webp",
        "art/bosses/zephyr/p1-roller-feed-load/06.webp",
        "art/bosses/zephyr/p1-roller-feed-load/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        227,
        300
      ],
      "frameTicks": [
        18,
        5,
        5,
        4,
        3,
        3,
        3,
        3
      ],
      "durationTicks": 44,
      "pivot": [
        114,
        300
      ],
      "muzzle": [
        8,
        152
      ],
      "weakPoint": [
        117,
        4
      ],
      "events": {
        "telegraph": 0,
        "release": 1,
        "recovery": 3
      },
      "eventDeltas": [
        134.5,
        91,
        98.9,
        96.5,
        41.7,
        32.5,
        42.8
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 30,
        "active": 8,
        "rest": 6
      },
      "verifiedDistinct": true
    },
    {
      "id": "04-ranch.coupling-latch-load",
      "phase": 2,
      "role": "attack",
      "distinctActionKey": "coupling-latch-load",
      "timingReference": "stages/04-ranch/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "79b1cb6e-6d0d-44f1-bf07-6b8c680770ce"
      ],
      "assetPath": "art/bosses/zephyr/p2-coupling-latch-load/00.webp",
      "frames": [
        "art/bosses/zephyr/p2-coupling-latch-load/00.webp",
        "art/bosses/zephyr/p2-coupling-latch-load/01.webp",
        "art/bosses/zephyr/p2-coupling-latch-load/02.webp",
        "art/bosses/zephyr/p2-coupling-latch-load/03.webp",
        "art/bosses/zephyr/p2-coupling-latch-load/04.webp",
        "art/bosses/zephyr/p2-coupling-latch-load/05.webp",
        "art/bosses/zephyr/p2-coupling-latch-load/06.webp",
        "art/bosses/zephyr/p2-coupling-latch-load/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        298,
        300
      ],
      "frameTicks": [
        12,
        12,
        12,
        12,
        2,
        2,
        1,
        1
      ],
      "durationTicks": 54,
      "pivot": [
        149,
        300
      ],
      "muzzle": [
        7,
        146
      ],
      "weakPoint": [
        150,
        48
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "eventDeltas": [
        53.3,
        32.7,
        45.4,
        237.6,
        43.3,
        74,
        50.1
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
      "id": "04-ranch.engine-linkage-expose",
      "phase": 2,
      "role": "recovery",
      "distinctActionKey": "engine-linkage-expose",
      "timingReference": "stages/04-ranch/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "fb8aaebe-b2cc-4f1b-834e-f38ffaa24788"
      ],
      "assetPath": "art/bosses/zephyr/p2-engine-linkage-expose/00.webp",
      "frames": [
        "art/bosses/zephyr/p2-engine-linkage-expose/00.webp",
        "art/bosses/zephyr/p2-engine-linkage-expose/01.webp",
        "art/bosses/zephyr/p2-engine-linkage-expose/02.webp",
        "art/bosses/zephyr/p2-engine-linkage-expose/03.webp",
        "art/bosses/zephyr/p2-engine-linkage-expose/04.webp",
        "art/bosses/zephyr/p2-engine-linkage-expose/05.webp",
        "art/bosses/zephyr/p2-engine-linkage-expose/06.webp",
        "art/bosses/zephyr/p2-engine-linkage-expose/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        276,
        300
      ],
      "frameTicks": [
        4,
        4,
        4,
        4,
        5,
        5,
        20,
        20
      ],
      "durationTicks": 66,
      "pivot": [
        138,
        300
      ],
      "muzzle": [
        6,
        151
      ],
      "weakPoint": [
        140,
        57
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "eventDeltas": [
        36.9,
        33.7,
        36.6,
        250.3,
        27.8,
        59.5,
        53.1
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 8,
        "active": 12,
        "rest": 46
      },
      "verifiedDistinct": true
    },
    {
      "id": "04-ranch.harvest-roll-reprise",
      "phase": 2,
      "role": "attack",
      "distinctActionKey": "harvest-roll-reprise",
      "timingReference": "stages/04-ranch/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "5572b4a9-c219-4ea4-a92c-8121e6962aa8"
      ],
      "assetPath": "art/bosses/zephyr/p2-harvest-roll-reprise/00.webp",
      "frames": [
        "art/bosses/zephyr/p2-harvest-roll-reprise/00.webp",
        "art/bosses/zephyr/p2-harvest-roll-reprise/01.webp",
        "art/bosses/zephyr/p2-harvest-roll-reprise/02.webp",
        "art/bosses/zephyr/p2-harvest-roll-reprise/03.webp",
        "art/bosses/zephyr/p2-harvest-roll-reprise/04.webp",
        "art/bosses/zephyr/p2-harvest-roll-reprise/05.webp",
        "art/bosses/zephyr/p2-harvest-roll-reprise/06.webp",
        "art/bosses/zephyr/p2-harvest-roll-reprise/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        289,
        300
      ],
      "frameTicks": [
        7,
        7,
        7,
        7,
        6,
        4,
        4,
        4
      ],
      "durationTicks": 46,
      "pivot": [
        144,
        300
      ],
      "muzzle": [
        2,
        141
      ],
      "weakPoint": [
        145,
        42
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 5
      },
      "eventDeltas": [
        36.2,
        27.6,
        37.4,
        267.3,
        86.1,
        84.3,
        63
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 18,
        "active": 16,
        "rest": 12
      },
      "verifiedDistinct": true
    },
    {
      "id": "04-ranch.linkage-guard-unlock",
      "phase": 2,
      "role": "attack",
      "distinctActionKey": "linkage-guard-unlock",
      "timingReference": "stages/04-ranch/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "35ee7193-2b4d-4e58-87e9-d678f0545dbf"
      ],
      "assetPath": "art/bosses/zephyr/p2-linkage-guard-unlock/00.webp",
      "frames": [
        "art/bosses/zephyr/p2-linkage-guard-unlock/00.webp",
        "art/bosses/zephyr/p2-linkage-guard-unlock/01.webp",
        "art/bosses/zephyr/p2-linkage-guard-unlock/02.webp",
        "art/bosses/zephyr/p2-linkage-guard-unlock/03.webp",
        "art/bosses/zephyr/p2-linkage-guard-unlock/04.webp",
        "art/bosses/zephyr/p2-linkage-guard-unlock/05.webp",
        "art/bosses/zephyr/p2-linkage-guard-unlock/06.webp",
        "art/bosses/zephyr/p2-linkage-guard-unlock/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        277,
        300
      ],
      "frameTicks": [
        10,
        10,
        10,
        10,
        3,
        2,
        2,
        1
      ],
      "durationTicks": 48,
      "pivot": [
        138,
        300
      ],
      "muzzle": [
        5,
        152
      ],
      "weakPoint": [
        140,
        57
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 7
      },
      "eventDeltas": [
        33.6,
        28.7,
        38.1,
        235.9,
        28.8,
        57.3,
        58.1
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 34,
        "active": 8,
        "rest": 6
      },
      "verifiedDistinct": true
    }
  ],
  "pending": [
    "human encounter timing signoff",
    "critical pose and hit area signoff",
    "generation of distinct production motions",
    "per-clip atlas and event anchor verification",
    "offline gameplay integration"
  ],
  "operator": "Halloween 2008",
  "machines": [
    "Lantern Harvester",
    "Harvest Express"
  ],
  "minimumDistinctClips": 30,
  "plannedClipCount": 32,
  "actualVerifiedClipCount": 10,
  "inventoryBasisCommit": "7c62524",
  "plannedClips": [
    {
      "id": "04-ranch.harvester-approach",
      "phase": 1,
      "machine": "Lantern Harvester",
      "role": "entry",
      "motionBrief": "Harvester rolls into the field with the lantern cab leading",
      "distinctActionKey": "harvester-approach",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.lantern-cab-idle",
      "phase": 1,
      "machine": "Lantern Harvester",
      "role": "idle",
      "motionBrief": "Cab lantern swings gently while the chassis advances",
      "distinctActionKey": "lantern-cab-idle",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.cutter-comb-cycle",
      "phase": 1,
      "machine": "Lantern Harvester",
      "role": "articulation",
      "motionBrief": "Harvester cutter comb opens and closes over harvested ground",
      "distinctActionKey": "cutter-comb-cycle",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.pilot-lantern-lift",
      "phase": 1,
      "machine": "Lantern Harvester",
      "role": "operator",
      "motionBrief": "Halloween lifts the lantern from the cab to call the attack",
      "distinctActionKey": "pilot-lantern-lift",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.harvest-roll-cue",
      "phase": 1,
      "machine": "Lantern Harvester",
      "role": "cue",
      "motionBrief": "Lantern swing broadens and the cutter teeth rattle in silhouette",
      "distinctActionKey": "harvest-roll-cue",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.roller-feed-load",
      "phase": 1,
      "machine": "Lantern Harvester",
      "role": "windup",
      "motionBrief": "Feeder drum draws a roller into the launch trough",
      "distinctActionKey": "roller-feed-load",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.harvest-roll-release",
      "phase": 1,
      "machine": "Lantern Harvester",
      "role": "active",
      "motionBrief": "Cutter trough ejects a rolling ground hazard",
      "distinctActionKey": "harvest-roll-release",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.cutter-recoil-clear",
      "phase": 1,
      "machine": "Lantern Harvester",
      "role": "recovery",
      "motionBrief": "Cutter withdraws and feeder clears the empty trough",
      "distinctActionKey": "cutter-recoil-clear",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.harvester-vent-breathe",
      "phase": 1,
      "machine": "Lantern Harvester",
      "role": "weakpoint-open",
      "motionBrief": "Forward vent grille opens during the moving approach",
      "distinctActionKey": "harvester-vent-breathe",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.vent-protection-reseat",
      "phase": 1,
      "machine": "Lantern Harvester",
      "role": "weakpoint-close",
      "motionBrief": "Vent guard settles back onto its rotating guides",
      "distinctActionKey": "vent-protection-reseat",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.harvester-drive-hit",
      "phase": 1,
      "machine": "Lantern Harvester",
      "role": "hit-reaction",
      "motionBrief": "A vent hit jolts the advancing harvester drive",
      "distinctActionKey": "harvester-drive-hit",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.cutter-armor-contact",
      "phase": 1,
      "machine": "Lantern Harvester",
      "role": "armor-reaction",
      "motionBrief": "A glancing hit snaps a cutter guard back against its stop",
      "distinctActionKey": "cutter-armor-contact",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.harvester-train-approach",
      "phase": "transition",
      "machine": "Lantern Harvester \u2192 Harvest Express",
      "role": "transform-unlock",
      "motionBrief": "Harvester chassis aligns with the moving train coupling",
      "distinctActionKey": "harvester-train-approach",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.lantern-cab-transfer",
      "phase": "transition",
      "machine": "Lantern Harvester \u2192 Harvest Express",
      "role": "transform-reconfigure",
      "motionBrief": "Retained lantern cab slides forward toward the engine frame",
      "distinctActionKey": "lantern-cab-transfer",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.coupling-jaw-engage",
      "phase": "transition",
      "machine": "Lantern Harvester \u2192 Harvest Express",
      "role": "transform-deploy",
      "motionBrief": "Train coupling jaws close around the harvester chassis",
      "distinctActionKey": "coupling-jaw-engage",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.express-drive-takeup",
      "phase": "transition",
      "machine": "Lantern Harvester \u2192 Harvest Express",
      "role": "transform-settle",
      "motionBrief": "Engine wheels take up the train load and settle into forward travel",
      "distinctActionKey": "express-drive-takeup",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.express-wheel-cycle",
      "phase": 2,
      "machine": "Harvest Express",
      "role": "phase2-idle",
      "motionBrief": "Moving engine wheels and rods loop with the train motion",
      "distinctActionKey": "express-wheel-cycle",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.lantern-engine-sway",
      "phase": 2,
      "machine": "Harvest Express",
      "role": "phase2-articulation",
      "motionBrief": "Retained lantern cab sways over the running engine",
      "distinctActionKey": "lantern-engine-sway",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.uncouple-chain-cue",
      "phase": 2,
      "machine": "Harvest Express",
      "role": "phase2-cue",
      "motionBrief": "Halloween raises the chain handle to announce separation",
      "distinctActionKey": "uncouple-chain-cue",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.coupling-latch-load",
      "phase": 2,
      "machine": "Harvest Express",
      "role": "phase2-windup",
      "motionBrief": "Car coupling spring compresses before the latch releases",
      "distinctActionKey": "coupling-latch-load",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.car-separation-commit",
      "phase": 2,
      "machine": "Harvest Express",
      "role": "phase2-lock",
      "motionBrief": "Coupling pin pulls free and the rear car visibly separates",
      "distinctActionKey": "car-separation-commit",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.uncouple-dash-front",
      "phase": 2,
      "machine": "Harvest Express",
      "role": "phase2-active",
      "motionBrief": "Mechanical coupling field deploys its marked dash-only barrier",
      "distinctActionKey": "uncouple-dash-front",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.chain-release-recovery",
      "phase": 2,
      "machine": "Harvest Express",
      "role": "phase2-recovery",
      "motionBrief": "Chain falls slack while the train settles after uncoupling",
      "distinctActionKey": "chain-release-recovery",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.coupling-counter-feedback",
      "phase": 2,
      "machine": "Harvest Express",
      "role": "phase2-counter-feedback",
      "motionBrief": "Successful dash crossing breaks the barrier contacts at the coupling",
      "distinctActionKey": "coupling-counter-feedback",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.linkage-guard-unlock",
      "phase": 2,
      "machine": "Harvest Express",
      "role": "phase2-objective",
      "motionBrief": "Engine linkage guard releases after the crossing objective",
      "distinctActionKey": "linkage-guard-unlock",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.engine-linkage-expose",
      "phase": 2,
      "machine": "Harvest Express",
      "role": "phase2-weakpoint",
      "motionBrief": "Running linkage swings clear to become the firing target",
      "distinctActionKey": "engine-linkage-expose",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.engine-linkage-hit",
      "phase": 2,
      "machine": "Harvest Express",
      "role": "phase2-hit-reaction",
      "motionBrief": "Exposed linkage takes a hit and knocks its connecting rod sideways",
      "distinctActionKey": "engine-linkage-hit",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.harvest-roll-reprise",
      "phase": 2,
      "machine": "Harvest Express",
      "role": "phase2-reset",
      "motionBrief": "Engine-mounted feeder restarts the familiar roller launch after introduction",
      "distinctActionKey": "harvest-roll-reprise",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.engine-linkage-fail",
      "phase": "defeat",
      "machine": "Harvest Express",
      "role": "defeat-impact",
      "motionBrief": "Final linkage hit breaks the rod from its drive pin",
      "distinctActionKey": "engine-linkage-fail",
      "timingReference": "stages/04-ranch/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 8,
      "terminalOutcome": "machine-defeat",
      "terminalMotionBrief": "Engine linkage shears and drive wheels coast to a halt with the lantern cab intact; Halloween lowers the lantern and releases the chain."
    },
    {
      "id": "04-ranch.express-wheel-coast",
      "phase": "defeat",
      "machine": "Harvest Express",
      "role": "defeat-shutdown",
      "motionBrief": "Train wheels coast down without the powered linkage",
      "distinctActionKey": "express-wheel-coast",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.lantern-pilot-surrender",
      "phase": "defeat",
      "machine": "Harvest Express",
      "role": "defeat-operator",
      "motionBrief": "Halloween lowers the lantern and releases the chain",
      "distinctActionKey": "lantern-pilot-surrender",
      "timingReference": "stages/04-ranch/timing.md",
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
      "id": "04-ranch.harvester-engine-rest",
      "phase": "defeat",
      "machine": "Harvest Express",
      "role": "defeat-settle",
      "motionBrief": "Engine settles onto its running gear with the lantern still visible",
      "distinctActionKey": "harvester-engine-rest",
      "timingReference": "stages/04-ranch/timing.md",
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
  "referenceStatus": "gameplay-reference-candidate-lookdev-pending",
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
      "actualVerified": 4,
      "timingReview": "pending",
      "criticalPoseReview": "pending",
      "bothRequiredBeforeGeneration": true
    }
  },
  "coveragePolicy": "Review both phases of every boss. Planning metadata and procedural prototypes do not fulfill the production animation requirement.",
  "semanticDistinctnessReview": "pending-human-review; unique IDs and briefs are necessary but insufficient",
  "terminalOutcome": "machine-defeat",
  "terminalOutcomeDescription": "Engine linkage shears and drive wheels coast to a halt with the lantern cab intact; Halloween lowers the lantern and releases the chain.",
  "terminalClipId": "04-ranch.engine-linkage-fail",
  "terminalClipStatus": "planned-not-produced",
  "terminalSequenceClipIds": [
    "04-ranch.engine-linkage-fail",
    "04-ranch.express-wheel-coast",
    "04-ranch.lantern-pilot-surrender",
    "04-ranch.harvester-engine-rest"
  ],
  "terminalAcceptance": {
    "required": true,
    "mustBeBossSpecific": true,
    "verifiedProductionClipRequired": true,
    "actualTerminalClipVerified": false,
    "operatorDeathImplied": false,
    "retryResetMustRemainValid": true,
    "status": "pending-production-and-integration"
  },
  "reference": {
    "path": "art/rework/bosses/04-ranch/reference.svg",
    "width": 1280,
    "height": 1420,
    "pivot": [
      0,
      0
    ]
  },
  "gameplayReview": {
    "path": "art/rework/bosses/04-ranch/gameplay-scale.svg",
    "width": 1280,
    "height": 2320,
    "viewport": [
      1280,
      720
    ]
  },
  "captureEvidence": {
    "report": "art/rework/review/report.json",
    "build": "2c203985a7d9a58f1c9bdb8b27bf98c6aff38874",
    "sourceWorkingTreeClean": true,
    "sampling": "Actual file:// Chrome rendering; RAF frozen; neutral diagnostic simulation at phase ticks0,60,120,240; extra camera-only boss framing. No earned clear or human gameplay claim.",
    "rasterOperation": "original PNG bytes embedded unchanged; no image editing or generation",
    "phases": [
      {
        "phase": 1,
        "tick": 240,
        "machine": "Lantern Harvester",
        "signature": "Harvest approach",
        "pilot": {
          "x": 4110,
          "y": 390,
          "scale": 80
        },
        "pilotHeight": 80,
        "targets": [
          {
            "id": "ranch.linkage",
            "x": 3980,
            "y": 548,
            "w": 85,
            "h": 50,
            "open": true
          }
        ],
        "camera": {
          "x": 3210,
          "y": 0
        },
        "anchorMetadataSource": "trackedKeyframe",
        "atomicCaptureMethod": "synchronous canvas.toDataURL and ALL metadata inside same Runtime.evaluate",
        "cue": "",
        "source": "../../review/04-ranch-p1.png",
        "sourcePixels": [
          1280,
          720
        ],
        "sha256": "d08639fb8728a0c9c4bba5e1bdb0fa10e927cf3ed503ec7098c8d819ba5301b1"
      },
      {
        "phase": 2,
        "tick": 240,
        "machine": "Harvest Express",
        "signature": "Uncouple",
        "pilot": {
          "x": 4373.999999999999,
          "y": 390,
          "scale": 80
        },
        "pilotHeight": 80,
        "targets": [
          {
            "id": "ranch.linkage",
            "x": 4244.000000000087,
            "y": 548,
            "w": 85,
            "h": 50,
            "open": false
          }
        ],
        "camera": {
          "x": 3473.999999999999,
          "y": 0
        },
        "anchorMetadataSource": "trackedKeyframe",
        "atomicCaptureMethod": "synchronous canvas.toDataURL and ALL metadata inside same Runtime.evaluate",
        "cue": "",
        "source": "../../review/04-ranch-p2.png",
        "sourcePixels": [
          1280,
          720
        ],
        "sha256": "4abcac52a9f2ac283ab74a1191f48812173a19a18b0296fb8e11624c744292d0"
      }
    ],
    "humanSignoff": false
  },
  "referenceAnchors": {
    "1": {
      "space": "world",
      "pilot": {
        "x": 4110,
        "y": 390,
        "scale": 80
      },
      "pilotHeight": 80,
      "targets": [
        {
          "id": "ranch.linkage",
          "x": 3980,
          "y": 548,
          "w": 85,
          "h": 50,
          "open": true
        }
      ],
      "projectionCamera": {
        "x": 3210,
        "y": 0
      },
      "sampleTick": 240,
      "diagnosticOnly": true
    },
    "2": {
      "space": "world",
      "pilot": {
        "x": 4373.999999999999,
        "y": 390,
        "scale": 80
      },
      "pilotHeight": 80,
      "targets": [
        {
          "id": "ranch.linkage",
          "x": 4244.000000000087,
          "y": 548,
          "w": 85,
          "h": 50,
          "open": false
        }
      ],
      "projectionCamera": {
        "x": 3473.999999999999,
        "y": 0
      },
      "sampleTick": 240,
      "diagnosticOnly": true
    }
  }
});
