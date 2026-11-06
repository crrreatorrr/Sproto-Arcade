/* Planned requests stay planned. clips[] holds the sheets that were sliced, timed and measured. */
Arcade.registerAssets({
  "id": "bosses/03-mudline",
  "stage": "03-mudline",
  "status": "inventory-only",
  "productionApproved": false,
  "timingProvisional": false,
  "sourceKind": "planned-motion-inventory-with-embedded-gameplay-reference",
  "generationIds": [],
  "timingSource": "stages/03-mudline/timing.md",
  "clips": [
    {
      "id": "03-mudline.crapto-nozzle-trim",
      "phase": 1,
      "role": "attack",
      "distinctActionKey": "crapto-nozzle-trim",
      "timingReference": "stages/03-mudline/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "348e4212-7ff7-4d76-971c-408c534b16c8"
      ],
      "assetPath": "art/bosses/crapto/p1-crapto-nozzle-trim/00.webp",
      "frames": [
        "art/bosses/crapto/p1-crapto-nozzle-trim/00.webp",
        "art/bosses/crapto/p1-crapto-nozzle-trim/01.webp",
        "art/bosses/crapto/p1-crapto-nozzle-trim/02.webp",
        "art/bosses/crapto/p1-crapto-nozzle-trim/03.webp",
        "art/bosses/crapto/p1-crapto-nozzle-trim/04.webp",
        "art/bosses/crapto/p1-crapto-nozzle-trim/05.webp",
        "art/bosses/crapto/p1-crapto-nozzle-trim/06.webp",
        "art/bosses/crapto/p1-crapto-nozzle-trim/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        262,
        300
      ],
      "frameTicks": [
        15,
        15,
        15,
        15,
        3,
        1,
        1,
        1
      ],
      "durationTicks": 66,
      "pivot": [
        131,
        300
      ],
      "muzzle": [
        10,
        136
      ],
      "weakPoint": [
        134,
        1
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 5
      },
      "eventDeltas": [
        55.1,
        57.7,
        53.6,
        155.2,
        56,
        48.5,
        50.6
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 52,
        "active": 8,
        "rest": 6
      },
      "verifiedDistinct": true
    },
    {
      "id": "03-mudline.dredger-saucer-arrival",
      "phase": 1,
      "role": "attack",
      "distinctActionKey": "dredger-saucer-arrival",
      "timingReference": "stages/03-mudline/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "6013ea70-f5ce-4b3e-824b-8f84fc635c10"
      ],
      "assetPath": "art/bosses/crapto/p1-dredger-saucer-arrival/00.webp",
      "frames": [
        "art/bosses/crapto/p1-dredger-saucer-arrival/00.webp",
        "art/bosses/crapto/p1-dredger-saucer-arrival/01.webp",
        "art/bosses/crapto/p1-dredger-saucer-arrival/02.webp",
        "art/bosses/crapto/p1-dredger-saucer-arrival/03.webp",
        "art/bosses/crapto/p1-dredger-saucer-arrival/04.webp",
        "art/bosses/crapto/p1-dredger-saucer-arrival/05.webp",
        "art/bosses/crapto/p1-dredger-saucer-arrival/06.webp",
        "art/bosses/crapto/p1-dredger-saucer-arrival/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        239,
        300
      ],
      "frameTicks": [
        9,
        9,
        8,
        8,
        3,
        3,
        4,
        4
      ],
      "durationTicks": 48,
      "pivot": [
        120,
        300
      ],
      "muzzle": [
        9,
        132
      ],
      "weakPoint": [
        117,
        14
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "eventDeltas": [
        126.9,
        161.3,
        127.3,
        225.4,
        52.6,
        86.1,
        39.5
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 24,
        "active": 10,
        "rest": 14
      },
      "verifiedDistinct": true
    },
    {
      "id": "03-mudline.intake-armor-deflect",
      "phase": 1,
      "role": "recovery",
      "distinctActionKey": "intake-armor-deflect",
      "timingReference": "stages/03-mudline/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "f6bd1340-9113-4340-97b6-f13e1054b543"
      ],
      "assetPath": "art/bosses/crapto/p1-intake-armor-deflect/00.webp",
      "frames": [
        "art/bosses/crapto/p1-intake-armor-deflect/00.webp",
        "art/bosses/crapto/p1-intake-armor-deflect/01.webp",
        "art/bosses/crapto/p1-intake-armor-deflect/02.webp",
        "art/bosses/crapto/p1-intake-armor-deflect/03.webp",
        "art/bosses/crapto/p1-intake-armor-deflect/04.webp",
        "art/bosses/crapto/p1-intake-armor-deflect/05.webp",
        "art/bosses/crapto/p1-intake-armor-deflect/06.webp",
        "art/bosses/crapto/p1-intake-armor-deflect/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        252,
        300
      ],
      "frameTicks": [
        4,
        4,
        4,
        4,
        4,
        4,
        22,
        22
      ],
      "durationTicks": 68,
      "pivot": [
        126,
        300
      ],
      "muzzle": [
        0,
        168
      ],
      "weakPoint": [
        125,
        47
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "eventDeltas": [
        71.7,
        91.3,
        82.7,
        147.6,
        99.5,
        106.9,
        56
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 8,
        "active": 10,
        "rest": 50
      },
      "verifiedDistinct": true
    },
    {
      "id": "03-mudline.sludge-belch-release",
      "phase": 1,
      "role": "attack",
      "distinctActionKey": "sludge-belch-release",
      "timingReference": "stages/03-mudline/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "efd19efc-f530-4946-9886-e6f982e63df7"
      ],
      "assetPath": "art/bosses/crapto/p1-sludge-belch-release/00.webp",
      "frames": [
        "art/bosses/crapto/p1-sludge-belch-release/00.webp",
        "art/bosses/crapto/p1-sludge-belch-release/01.webp",
        "art/bosses/crapto/p1-sludge-belch-release/02.webp",
        "art/bosses/crapto/p1-sludge-belch-release/03.webp",
        "art/bosses/crapto/p1-sludge-belch-release/04.webp",
        "art/bosses/crapto/p1-sludge-belch-release/05.webp",
        "art/bosses/crapto/p1-sludge-belch-release/06.webp",
        "art/bosses/crapto/p1-sludge-belch-release/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        235,
        300
      ],
      "frameTicks": [
        4,
        4,
        4,
        3,
        4,
        4,
        4,
        3
      ],
      "durationTicks": 30,
      "pivot": [
        118,
        300
      ],
      "muzzle": [
        6,
        123
      ],
      "weakPoint": [
        120,
        1
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 7
      },
      "eventDeltas": [
        48.7,
        95.6,
        77,
        256,
        83.6,
        101.4,
        144.9
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
      "id": "03-mudline.sludge-nozzle-fire",
      "phase": 1,
      "role": "attack",
      "distinctActionKey": "sludge-nozzle-fire",
      "timingReference": "stages/03-mudline/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "fbeade77-3517-4d43-a167-095dfbfb8afe"
      ],
      "assetPath": "art/bosses/crapto/p1-sludge-nozzle-fire/00.webp",
      "frames": [
        "art/bosses/crapto/p1-sludge-nozzle-fire/00.webp",
        "art/bosses/crapto/p1-sludge-nozzle-fire/01.webp",
        "art/bosses/crapto/p1-sludge-nozzle-fire/02.webp",
        "art/bosses/crapto/p1-sludge-nozzle-fire/03.webp",
        "art/bosses/crapto/p1-sludge-nozzle-fire/04.webp",
        "art/bosses/crapto/p1-sludge-nozzle-fire/05.webp",
        "art/bosses/crapto/p1-sludge-nozzle-fire/06.webp",
        "art/bosses/crapto/p1-sludge-nozzle-fire/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        235,
        300
      ],
      "frameTicks": [
        4,
        4,
        4,
        4,
        5,
        5,
        4,
        2
      ],
      "durationTicks": 32,
      "pivot": [
        118,
        300
      ],
      "muzzle": [
        0,
        125
      ],
      "weakPoint": [
        117,
        1
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 7
      },
      "eventDeltas": [
        62,
        75.3,
        48.3,
        260.8,
        107.3,
        127.2,
        144.8
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 10,
        "active": 14,
        "rest": 8
      },
      "verifiedDistinct": true
    },
    {
      "id": "03-mudline.backflush-pump-fire",
      "phase": 2,
      "role": "attack",
      "distinctActionKey": "backflush-pump-fire",
      "timingReference": "stages/03-mudline/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "98925993-fcd7-4f46-bbc0-2399c717cb30"
      ],
      "assetPath": "art/bosses/crapto/p2-backflush-pump-fire/00.webp",
      "frames": [
        "art/bosses/crapto/p2-backflush-pump-fire/00.webp",
        "art/bosses/crapto/p2-backflush-pump-fire/01.webp",
        "art/bosses/crapto/p2-backflush-pump-fire/02.webp",
        "art/bosses/crapto/p2-backflush-pump-fire/03.webp",
        "art/bosses/crapto/p2-backflush-pump-fire/04.webp",
        "art/bosses/crapto/p2-backflush-pump-fire/05.webp",
        "art/bosses/crapto/p2-backflush-pump-fire/06.webp",
        "art/bosses/crapto/p2-backflush-pump-fire/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        213,
        300
      ],
      "frameTicks": [
        4,
        4,
        4,
        4,
        6,
        6,
        3,
        3
      ],
      "durationTicks": 34,
      "pivot": [
        106,
        300
      ],
      "muzzle": [
        0,
        154
      ],
      "weakPoint": [
        106,
        17
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "eventDeltas": [
        25.6,
        16.3,
        15.8,
        166.2,
        89,
        89.8,
        48.1
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
      "id": "03-mudline.backflush-release",
      "phase": 2,
      "role": "attack",
      "distinctActionKey": "backflush-release",
      "timingReference": "stages/03-mudline/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "3aa88df2-92ff-4f87-9cb8-c16a118a8565"
      ],
      "assetPath": "art/bosses/crapto/p2-backflush-release/00.webp",
      "frames": [
        "art/bosses/crapto/p2-backflush-release/00.webp",
        "art/bosses/crapto/p2-backflush-release/01.webp",
        "art/bosses/crapto/p2-backflush-release/02.webp",
        "art/bosses/crapto/p2-backflush-release/03.webp",
        "art/bosses/crapto/p2-backflush-release/04.webp",
        "art/bosses/crapto/p2-backflush-release/05.webp",
        "art/bosses/crapto/p2-backflush-release/06.webp",
        "art/bosses/crapto/p2-backflush-release/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        225,
        300
      ],
      "frameTicks": [
        4,
        4,
        3,
        3,
        3,
        3,
        3,
        3
      ],
      "durationTicks": 26,
      "pivot": [
        112,
        300
      ],
      "muzzle": [
        0,
        150
      ],
      "weakPoint": [
        112,
        11
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "eventDeltas": [
        24.1,
        22.5,
        105.8,
        129.3,
        79,
        97.1,
        56.2
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 8,
        "active": 10,
        "rest": 8
      },
      "verifiedDistinct": true
    },
    {
      "id": "03-mudline.lower-shutter-load",
      "phase": 2,
      "role": "attack",
      "distinctActionKey": "lower-shutter-load",
      "timingReference": "stages/03-mudline/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "f83e2cb4-8cc8-4ee0-86cd-420a121bd0cb"
      ],
      "assetPath": "art/bosses/crapto/p2-lower-shutter-load/00.webp",
      "frames": [
        "art/bosses/crapto/p2-lower-shutter-load/00.webp",
        "art/bosses/crapto/p2-lower-shutter-load/01.webp",
        "art/bosses/crapto/p2-lower-shutter-load/02.webp",
        "art/bosses/crapto/p2-lower-shutter-load/03.webp",
        "art/bosses/crapto/p2-lower-shutter-load/04.webp",
        "art/bosses/crapto/p2-lower-shutter-load/05.webp",
        "art/bosses/crapto/p2-lower-shutter-load/06.webp",
        "art/bosses/crapto/p2-lower-shutter-load/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        224,
        300
      ],
      "frameTicks": [
        8,
        8,
        8,
        8,
        7,
        7,
        7,
        1
      ],
      "durationTicks": 54,
      "pivot": [
        112,
        300
      ],
      "muzzle": [
        1,
        151
      ],
      "weakPoint": [
        112,
        2
      ],
      "events": {
        "telegraph": 0,
        "release": 7,
        "recovery": 7
      },
      "eventDeltas": [
        19.4,
        24.4,
        17.8,
        22.1,
        15.1,
        24.7,
        45
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
      "id": "03-mudline.pump-vent-expose",
      "phase": 2,
      "role": "recovery",
      "distinctActionKey": "pump-vent-expose",
      "timingReference": "stages/03-mudline/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "620d32ca-1227-4697-a72f-04a94ab3a832"
      ],
      "assetPath": "art/bosses/crapto/p2-pump-vent-expose/00.webp",
      "frames": [
        "art/bosses/crapto/p2-pump-vent-expose/00.webp",
        "art/bosses/crapto/p2-pump-vent-expose/01.webp",
        "art/bosses/crapto/p2-pump-vent-expose/02.webp",
        "art/bosses/crapto/p2-pump-vent-expose/03.webp",
        "art/bosses/crapto/p2-pump-vent-expose/04.webp",
        "art/bosses/crapto/p2-pump-vent-expose/05.webp",
        "art/bosses/crapto/p2-pump-vent-expose/06.webp",
        "art/bosses/crapto/p2-pump-vent-expose/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        211,
        300
      ],
      "frameTicks": [
        4,
        4,
        4,
        4,
        4,
        4,
        21,
        21
      ],
      "durationTicks": 66,
      "pivot": [
        106,
        300
      ],
      "muzzle": [
        0,
        149
      ],
      "weakPoint": [
        105,
        0
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "eventDeltas": [
        11.7,
        22.6,
        46.2,
        155.1,
        55.2,
        106.7,
        30.7
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 8,
        "active": 10,
        "rest": 48
      },
      "verifiedDistinct": true
    },
    {
      "id": "03-mudline.shutter-route-release",
      "phase": 2,
      "role": "attack",
      "distinctActionKey": "shutter-route-release",
      "timingReference": "stages/03-mudline/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "5339806b-7562-4ec2-aa43-6326372d7234"
      ],
      "assetPath": "art/bosses/crapto/p2-shutter-route-release/00.webp",
      "frames": [
        "art/bosses/crapto/p2-shutter-route-release/00.webp",
        "art/bosses/crapto/p2-shutter-route-release/01.webp",
        "art/bosses/crapto/p2-shutter-route-release/02.webp",
        "art/bosses/crapto/p2-shutter-route-release/03.webp",
        "art/bosses/crapto/p2-shutter-route-release/04.webp",
        "art/bosses/crapto/p2-shutter-route-release/05.webp",
        "art/bosses/crapto/p2-shutter-route-release/06.webp",
        "art/bosses/crapto/p2-shutter-route-release/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        222,
        300
      ],
      "frameTicks": [
        11,
        11,
        11,
        10,
        2,
        2,
        2,
        1
      ],
      "durationTicks": 50,
      "pivot": [
        111,
        300
      ],
      "muzzle": [
        5,
        150
      ],
      "weakPoint": [
        113,
        1
      ],
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 7
      },
      "eventDeltas": [
        25.1,
        22,
        37.5,
        94,
        19.7,
        53.7,
        73.7
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": {
        "tell": 36,
        "active": 8,
        "rest": 6
      },
      "verifiedDistinct": true
    },
    {
      "id": "03-mudline.sludge-blob-projectile",
      "phase": 1,
      "role": "projectile",
      "distinctActionKey": "sludge-blob-projectile",
      "timingReference": "stages/03-mudline/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "4a973bd5-57c1-4cb3-b688-d7e22911b4ef"
      ],
      "assetPath": "art/bosses/crapto/projectiles/p1-sludge-blob-projectile/00.webp",
      "frames": [
        "art/bosses/crapto/projectiles/p1-sludge-blob-projectile/00.webp",
        "art/bosses/crapto/projectiles/p1-sludge-blob-projectile/01.webp",
        "art/bosses/crapto/projectiles/p1-sludge-blob-projectile/02.webp",
        "art/bosses/crapto/projectiles/p1-sludge-blob-projectile/03.webp",
        "art/bosses/crapto/projectiles/p1-sludge-blob-projectile/04.webp",
        "art/bosses/crapto/projectiles/p1-sludge-blob-projectile/05.webp",
        "art/bosses/crapto/projectiles/p1-sludge-blob-projectile/06.webp",
        "art/bosses/crapto/projectiles/p1-sludge-blob-projectile/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        106,
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
        53,
        48
      ],
      "muzzle": [
        4,
        48
      ],
      "weakPoint": [
        53,
        9
      ],
      "events": {
        "telegraph": 0,
        "release": 7,
        "recovery": 7
      },
      "eventDeltas": [
        152.9,
        73.9,
        77.2,
        32.4,
        83.1,
        168.8,
        222.3
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": null,
      "verifiedDistinct": true
    },
    {
      "id": "03-mudline.backflush-surge-projectile",
      "phase": 2,
      "role": "projectile",
      "distinctActionKey": "backflush-surge-projectile",
      "timingReference": "stages/03-mudline/timing.md",
      "timingStatus": "matched-to-measured-frames",
      "productionStatus": "verified",
      "sourceGenerationIds": [
        "51d74da0-7556-4f2b-8236-30e079320079"
      ],
      "assetPath": "art/bosses/crapto/projectiles/p2-backflush-surge-projectile/00.webp",
      "frames": [
        "art/bosses/crapto/projectiles/p2-backflush-surge-projectile/00.webp",
        "art/bosses/crapto/projectiles/p2-backflush-surge-projectile/01.webp",
        "art/bosses/crapto/projectiles/p2-backflush-surge-projectile/02.webp",
        "art/bosses/crapto/projectiles/p2-backflush-surge-projectile/03.webp",
        "art/bosses/crapto/projectiles/p2-backflush-surge-projectile/04.webp",
        "art/bosses/crapto/projectiles/p2-backflush-surge-projectile/05.webp",
        "art/bosses/crapto/projectiles/p2-backflush-surge-projectile/06.webp",
        "art/bosses/crapto/projectiles/p2-backflush-surge-projectile/07.webp"
      ],
      "frameCount": 8,
      "frameSize": [
        97,
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
        48,
        48
      ],
      "muzzle": [
        1,
        48
      ],
      "weakPoint": [
        48,
        10
      ],
      "events": {
        "telegraph": 0,
        "release": 7,
        "recovery": 7
      },
      "eventDeltas": [
        195.9,
        179.8,
        75.8,
        115.3,
        50.2,
        207.4,
        230.8
      ],
      "eventBasis": "largest measured frame-to-frame change is the release frame; recovery is the next peak after it",
      "attackTicks": null,
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
  "operator": "Crapto",
  "machines": [
    "Sludge Dredger",
    "Floodgate Pump"
  ],
  "minimumDistinctClips": 30,
  "plannedClipCount": 32,
  "actualVerifiedClipCount": 12,
  "inventoryBasisCommit": "7c62524",
  "plannedClips": [
    {
      "id": "03-mudline.dredger-saucer-arrival",
      "phase": 1,
      "machine": "Sludge Dredger",
      "role": "entry",
      "motionBrief": "Dredger floats into place with Crapto visible above its glass belly",
      "distinctActionKey": "dredger-saucer-arrival",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.glass-belly-idle",
      "phase": 1,
      "machine": "Sludge Dredger",
      "role": "idle",
      "motionBrief": "Glass belly slurry circulates while the floating hull rocks",
      "distinctActionKey": "glass-belly-idle",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.intake-paddle-cycle",
      "phase": 1,
      "machine": "Sludge Dredger",
      "role": "articulation",
      "motionBrief": "Intake paddles turn and draw sludge into the collector",
      "distinctActionKey": "intake-paddle-cycle",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.crapto-nozzle-trim",
      "phase": 1,
      "machine": "Sludge Dredger",
      "role": "operator",
      "motionBrief": "Crapto adjusts the altitude lever while watching the nozzle",
      "distinctActionKey": "crapto-nozzle-trim",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.glass-fill-cue",
      "phase": 1,
      "machine": "Sludge Dredger",
      "role": "cue",
      "motionBrief": "Sludge rises visibly through the glass belly before the lock",
      "distinctActionKey": "glass-fill-cue",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.nozzle-altitude-commit",
      "phase": 1,
      "machine": "Sludge Dredger",
      "role": "windup",
      "motionBrief": "Nozzle rotates once to the target altitude and clamps in place",
      "distinctActionKey": "nozzle-altitude-commit",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.sludge-belch-release",
      "phase": 1,
      "machine": "Sludge Dredger",
      "role": "active",
      "motionBrief": "Committed nozzle expels its sludge projectile",
      "distinctActionKey": "sludge-belch-release",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.belly-drain-recovery",
      "phase": 1,
      "machine": "Sludge Dredger",
      "role": "recovery",
      "motionBrief": "Belly fluid level drops and the nozzle coughs back into its rest",
      "distinctActionKey": "belly-drain-recovery",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.glass-vent-open",
      "phase": 1,
      "machine": "Sludge Dredger",
      "role": "weakpoint-open",
      "motionBrief": "Belly vent plates spread to reveal the punish window",
      "distinctActionKey": "glass-vent-open",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.glass-vent-close",
      "phase": 1,
      "machine": "Sludge Dredger",
      "role": "weakpoint-close",
      "motionBrief": "Belly plates reseal as fresh slurry returns",
      "distinctActionKey": "glass-vent-close",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.glass-hit-pressure-ripple",
      "phase": 1,
      "machine": "Sludge Dredger",
      "role": "hit-reaction",
      "motionBrief": "Exposed belly hit sends a visible pressure ripple through the slurry",
      "distinctActionKey": "glass-hit-pressure-ripple",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.intake-armor-deflect",
      "phase": 1,
      "machine": "Sludge Dredger",
      "role": "armor-reaction",
      "motionBrief": "Intake rim absorbs a glancing shot with a brief mechanical kick",
      "distinctActionKey": "intake-armor-deflect",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.dredger-side-roll",
      "phase": "transition",
      "machine": "Sludge Dredger \u2192 Floodgate Pump",
      "role": "transform-unlock",
      "motionBrief": "Floating dredger rolls sideways toward the floodgate mount",
      "distinctActionKey": "dredger-side-roll",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.intake-dock-couple",
      "phase": "transition",
      "machine": "Sludge Dredger \u2192 Floodgate Pump",
      "role": "transform-reconfigure",
      "motionBrief": "Retained intake connects into the stationary floodgate pipe",
      "distinctActionKey": "intake-dock-couple",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.glass-belly-pump-seat",
      "phase": "transition",
      "machine": "Sludge Dredger \u2192 Floodgate Pump",
      "role": "transform-deploy",
      "motionBrief": "Glass belly slides into the gate pump retaining frame",
      "distinctActionKey": "glass-belly-pump-seat",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.shutter-linkage-deploy",
      "phase": "transition",
      "machine": "Sludge Dredger \u2192 Floodgate Pump",
      "role": "transform-settle",
      "motionBrief": "Upper and lower shutter links unfold around the same cabin",
      "distinctActionKey": "shutter-linkage-deploy",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.pump-rotor-idle",
      "phase": 2,
      "machine": "Floodgate Pump",
      "role": "phase2-idle",
      "motionBrief": "Fixed pump rotor and glass fluid continue a slow circulation",
      "distinctActionKey": "pump-rotor-idle",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.shutter-drain-transfer",
      "phase": 2,
      "machine": "Floodgate Pump",
      "role": "phase2-articulation",
      "motionBrief": "Drain indicators mechanically travel toward the selected shutter",
      "distinctActionKey": "shutter-drain-transfer",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.upper-latch-cue",
      "phase": 2,
      "machine": "Floodgate Pump",
      "role": "phase2-cue",
      "motionBrief": "Upper latch lever raises with an unmistakable high-route silhouette",
      "distinctActionKey": "upper-latch-cue",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.lower-shutter-load",
      "phase": 2,
      "machine": "Floodgate Pump",
      "role": "phase2-windup",
      "motionBrief": "Lower shutter drops toward the bounce lane while its spring loads",
      "distinctActionKey": "lower-shutter-load",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.backflush-front-lock",
      "phase": 2,
      "machine": "Floodgate Pump",
      "role": "phase2-lock",
      "motionBrief": "Pressure manifold locks into the marked front configuration",
      "distinctActionKey": "backflush-front-lock",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.backflush-release",
      "phase": 2,
      "machine": "Floodgate Pump",
      "role": "phase2-active",
      "motionBrief": "Pump releases the full-height backflush curtain",
      "distinctActionKey": "backflush-release",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.backflush-rotor-recovery",
      "phase": 2,
      "machine": "Floodgate Pump",
      "role": "phase2-recovery",
      "motionBrief": "Rotor decelerates and draws displaced liquid back through the intake",
      "distinctActionKey": "backflush-rotor-recovery",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.shutter-route-release",
      "phase": 2,
      "machine": "Floodgate Pump",
      "role": "phase2-counter-feedback",
      "motionBrief": "Broken upper latch or lower intake releases the paired shutter linkage",
      "distinctActionKey": "shutter-route-release",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.clean-cycle-primer",
      "phase": 2,
      "machine": "Floodgate Pump",
      "role": "phase2-objective",
      "motionBrief": "Clean introductory shutter release primes the pump without a front",
      "distinctActionKey": "clean-cycle-primer",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.pump-vent-expose",
      "phase": 2,
      "machine": "Floodgate Pump",
      "role": "phase2-weakpoint",
      "motionBrief": "Pump belly vent petals open after the eligible release or dash counter",
      "distinctActionKey": "pump-vent-expose",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.pump-core-hit-shudder",
      "phase": 2,
      "machine": "Floodgate Pump",
      "role": "phase2-hit-reaction",
      "motionBrief": "Exposed pump core rocks within the floodgate retaining frame",
      "distinctActionKey": "pump-core-hit-shudder",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.shutter-round-reset",
      "phase": 2,
      "machine": "Floodgate Pump",
      "role": "phase2-reset",
      "motionBrief": "Both shutters and latch mechanisms rearm after a missed or spent window",
      "distinctActionKey": "shutter-round-reset",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.glass-pump-final-crack",
      "phase": "defeat",
      "machine": "Floodgate Pump",
      "role": "defeat-impact",
      "motionBrief": "Final core hit fractures the glass vessel into a supported cracked shell",
      "distinctActionKey": "glass-pump-final-crack",
      "timingReference": "stages/03-mudline/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 8,
      "terminalOutcome": "machine-defeat",
      "terminalMotionBrief": "Glass pump vessel cracks within its supporting frame and sludge drains safely through the floodgate; Crapto remains inside the powerless cab."
    },
    {
      "id": "03-mudline.floodgate-safe-drain",
      "phase": "defeat",
      "machine": "Floodgate Pump",
      "role": "defeat-shutdown",
      "motionBrief": "Floodgate drains remaining sludge away from the fighting lane",
      "distinctActionKey": "floodgate-safe-drain",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.crapto-controls-slump",
      "phase": "defeat",
      "machine": "Floodgate Pump",
      "role": "defeat-operator",
      "motionBrief": "Crapto slumps over the powerless pump console",
      "distinctActionKey": "crapto-controls-slump",
      "timingReference": "stages/03-mudline/timing.md",
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
      "id": "03-mudline.pump-mount-shutdown",
      "phase": "defeat",
      "machine": "Floodgate Pump",
      "role": "defeat-settle",
      "motionBrief": "Docked rotor settles with retained intake and glass belly still identifiable",
      "distinctActionKey": "pump-mount-shutdown",
      "timingReference": "stages/03-mudline/timing.md",
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
      "actualVerified": 6,
      "timingReview": "pending",
      "criticalPoseReview": "pending",
      "bothRequiredBeforeGeneration": true
    }
  },
  "coveragePolicy": "Review both phases of every boss. Planning metadata and procedural prototypes do not fulfill the production animation requirement.",
  "semanticDistinctnessReview": "pending-human-review; unique IDs and briefs are necessary but insufficient",
  "terminalOutcome": "machine-defeat",
  "terminalOutcomeDescription": "Glass pump vessel cracks within its supporting frame and sludge drains safely through the floodgate; Crapto remains inside the powerless cab.",
  "terminalClipId": "03-mudline.glass-pump-final-crack",
  "terminalClipStatus": "planned-not-produced",
  "terminalSequenceClipIds": [
    "03-mudline.glass-pump-final-crack",
    "03-mudline.floodgate-safe-drain",
    "03-mudline.crapto-controls-slump",
    "03-mudline.pump-mount-shutdown"
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
    "path": "art/rework/bosses/03-mudline/reference.svg",
    "width": 1280,
    "height": 1420,
    "pivot": [
      0,
      0
    ]
  },
  "gameplayReview": {
    "path": "art/rework/bosses/03-mudline/gameplay-scale.svg",
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
        "machine": "Sludge Dredger",
        "signature": "Sludge Belch",
        "pilot": {
          "x": 1050,
          "y": 270
        },
        "pilotHeight": 82,
        "targets": [
          {
            "id": "glass-vent",
            "x": 925,
            "y": 340,
            "w": 170,
            "h": 100,
            "open": true
          }
        ],
        "camera": {
          "x": 150,
          "y": 0
        },
        "anchorMetadataSource": "trackedKeyframe",
        "atomicCaptureMethod": "synchronous canvas.toDataURL and ALL metadata inside same Runtime.evaluate",
        "cue": "STEAM ESCAPING: glass vent exposed",
        "source": "../../review/03-mudline-p1.png",
        "sourcePixels": [
          1280,
          720
        ],
        "sha256": "4b29374b75add6b124a89f3407b6ebab6dfcf69278de4ad43cab60dd130e465a"
      },
      {
        "phase": 2,
        "tick": 240,
        "machine": "Floodgate Pump",
        "signature": "Backflush",
        "pilot": {
          "x": 1050,
          "y": 270
        },
        "pilotHeight": 82,
        "targets": [
          {
            "id": "pump-vent",
            "x": 985,
            "y": 330,
            "w": 120,
            "h": 140,
            "open": false
          },
          {
            "id": "latch-1",
            "x": 890,
            "y": 190,
            "w": 105,
            "h": 85,
            "open": false
          },
          {
            "id": "intake-1",
            "x": 890,
            "y": 550,
            "w": 105,
            "h": 75,
            "open": false
          }
        ],
        "camera": {
          "x": 150,
          "y": 0
        },
        "anchorMetadataSource": "trackedKeyframe",
        "atomicCaptureMethod": "synchronous canvas.toDataURL and ALL metadata inside same Runtime.evaluate",
        "cue": "CLEAN SHUTTER CYCLE: pump vent exposed. Marked front comes next.",
        "source": "../../review/03-mudline-p2.png",
        "sourcePixels": [
          1280,
          720
        ],
        "sha256": "b7ec25d0439509df51e3c92ae9c9b24558518245134d8a001f6d00f75b53abac"
      }
    ],
    "humanSignoff": false
  },
  "referenceAnchors": {
    "1": {
      "space": "world",
      "pilot": {
        "x": 1050,
        "y": 270
      },
      "pilotHeight": 82,
      "targets": [
        {
          "id": "glass-vent",
          "x": 925,
          "y": 340,
          "w": 170,
          "h": 100,
          "open": true
        }
      ],
      "projectionCamera": {
        "x": 150,
        "y": 0
      },
      "sampleTick": 240,
      "diagnosticOnly": true
    },
    "2": {
      "space": "world",
      "pilot": {
        "x": 1050,
        "y": 270
      },
      "pilotHeight": 82,
      "targets": [
        {
          "id": "pump-vent",
          "x": 985,
          "y": 330,
          "w": 120,
          "h": 140,
          "open": false
        },
        {
          "id": "latch-1",
          "x": 890,
          "y": 190,
          "w": 105,
          "h": 85,
          "open": false
        },
        {
          "id": "intake-1",
          "x": 890,
          "y": 550,
          "w": 105,
          "h": 75,
          "open": false
        }
      ],
      "projectionCamera": {
        "x": 150,
        "y": 0
      },
      "sampleTick": 240,
      "diagnosticOnly": true
    }
  }
});
