/* Gameplay references and inventory remain unapproved candidates. */
Arcade.registerAssets({
  "id": "bosses/05-neon",
  "stage": "05-neon",
  "status": "partial-verified-sheets",
  "productionApproved": false,
  "timingProvisional": false,
  "sourceKind": "planned-motion-inventory-with-embedded-gameplay-reference",
  "generationIds": [],
  "timingSource": "stages/05-neon/timing.md",
  "clips": [
    {
      "id": "05-neon.magnetic-claw-flex",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "melee",
      "distinctActionKey": "magnetic-claw-flex",
      "motionBrief": "Claw grabs and the smash peaks",
      "timingReference": "stages/05-neon/timing.md",
      "timingStatus": "gameplay-authored-contact-from-pose-order",
      "productionStatus": "verified",
      "sourceGenerationIds": [],
      "assetPath": "art/rework/bosses/05-neon/sproto102/magnetic-claw-flex/atlas-256.webp",
      "poseAtlas": "art/rework/bosses/05-neon/sproto102/magnetic-claw-flex/pose-atlas.json",
      "frameCount": 8,
      "frameSize": [
        256,
        256
      ],
      "frames": [
        "art/rework/bosses/05-neon/sproto102/magnetic-claw-flex/atlas-256.webp#0",
        "art/rework/bosses/05-neon/sproto102/magnetic-claw-flex/atlas-256.webp#1",
        "art/rework/bosses/05-neon/sproto102/magnetic-claw-flex/atlas-256.webp#2",
        "art/rework/bosses/05-neon/sproto102/magnetic-claw-flex/atlas-256.webp#3",
        "art/rework/bosses/05-neon/sproto102/magnetic-claw-flex/atlas-256.webp#4",
        "art/rework/bosses/05-neon/sproto102/magnetic-claw-flex/atlas-256.webp#5",
        "art/rework/bosses/05-neon/sproto102/magnetic-claw-flex/atlas-256.webp#6",
        "art/rework/bosses/05-neon/sproto102/magnetic-claw-flex/atlas-256.webp#7"
      ],
      "atlas": "art/rework/bosses/05-neon/sproto102/magnetic-claw-flex/atlas-256.webp",
      "atlasLayout": "8x1 cells of 256",
      "frameTicks": [
        9,
        9,
        9,
        8,
        8,
        8,
        8,
        8
      ],
      "durationTicks": 67,
      "pivot": [
        128,
        240
      ],
      "scale": 1.55,
      "packScale": 0.2982005141388175,
      "facing": -1,
      "events": {
        "telegraph": 0,
        "release": 3,
        "recovery": 5
      },
      "hitFrames": [
        3,
        4
      ],
      "eventDeltas": [
        16.1,
        22.7,
        24.8,
        20.9,
        23.0,
        26.0,
        19.8
      ],
      "eventBasis": "measured mean channel delta between atlas frames; release is the approved contact frame from the pose order and has not been human-playtested",
      "attackTicks": {
        "tell": 27,
        "active": 16,
        "rest": 24
      },
      "verifiedDistinct": true
    },
    {
      "id": "05-neon.magnet-snatch-cue",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "cue",
      "distinctActionKey": "magnet-snatch-cue",
      "motionBrief": "Claw aims and locks the lane",
      "timingReference": "stages/05-neon/timing.md",
      "timingStatus": "gameplay-authored-contact-from-pose-order",
      "productionStatus": "verified",
      "sourceGenerationIds": [],
      "assetPath": "art/rework/bosses/05-neon/sproto102/magnet-snatch-cue/atlas-256.webp",
      "poseAtlas": "art/rework/bosses/05-neon/sproto102/magnet-snatch-cue/pose-atlas.json",
      "frameCount": 8,
      "frameSize": [
        256,
        256
      ],
      "frames": [
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-cue/atlas-256.webp#0",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-cue/atlas-256.webp#1",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-cue/atlas-256.webp#2",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-cue/atlas-256.webp#3",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-cue/atlas-256.webp#4",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-cue/atlas-256.webp#5",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-cue/atlas-256.webp#6",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-cue/atlas-256.webp#7"
      ],
      "atlas": "art/rework/bosses/05-neon/sproto102/magnet-snatch-cue/atlas-256.webp",
      "atlasLayout": "8x1 cells of 256",
      "frameTicks": [
        12,
        12,
        12,
        8,
        8,
        8,
        8,
        8
      ],
      "durationTicks": 76,
      "pivot": [
        128,
        240
      ],
      "scale": 1.55,
      "packScale": 0.2982005141388175,
      "facing": -1,
      "events": {
        "telegraph": 0,
        "release": 3,
        "recovery": 5
      },
      "hitFrames": [
        3,
        4
      ],
      "eventDeltas": [
        18.3,
        16.1,
        18.3,
        19.4,
        16.1,
        12.1,
        18.0
      ],
      "eventBasis": "measured mean channel delta between atlas frames; release is the approved contact frame from the pose order and has not been human-playtested",
      "attackTicks": {
        "tell": 36,
        "active": 16,
        "rest": 24
      },
      "verifiedDistinct": true
    },
    {
      "id": "05-neon.claw-armor-deflect",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "deflect",
      "distinctActionKey": "claw-armor-deflect",
      "motionBrief": "Armor snaps and the incoming shot ricochets",
      "timingReference": "stages/05-neon/timing.md",
      "timingStatus": "gameplay-authored-contact-from-pose-order",
      "productionStatus": "verified",
      "sourceGenerationIds": [],
      "assetPath": "art/rework/bosses/05-neon/sproto102/claw-armor-deflect/atlas-256.webp",
      "poseAtlas": "art/rework/bosses/05-neon/sproto102/claw-armor-deflect/pose-atlas.json",
      "frameCount": 8,
      "frameSize": [
        256,
        256
      ],
      "frames": [
        "art/rework/bosses/05-neon/sproto102/claw-armor-deflect/atlas-256.webp#0",
        "art/rework/bosses/05-neon/sproto102/claw-armor-deflect/atlas-256.webp#1",
        "art/rework/bosses/05-neon/sproto102/claw-armor-deflect/atlas-256.webp#2",
        "art/rework/bosses/05-neon/sproto102/claw-armor-deflect/atlas-256.webp#3",
        "art/rework/bosses/05-neon/sproto102/claw-armor-deflect/atlas-256.webp#4",
        "art/rework/bosses/05-neon/sproto102/claw-armor-deflect/atlas-256.webp#5",
        "art/rework/bosses/05-neon/sproto102/claw-armor-deflect/atlas-256.webp#6",
        "art/rework/bosses/05-neon/sproto102/claw-armor-deflect/atlas-256.webp#7"
      ],
      "atlas": "art/rework/bosses/05-neon/sproto102/claw-armor-deflect/atlas-256.webp",
      "atlasLayout": "8x1 cells of 256",
      "frameTicks": [
        8,
        8,
        8,
        8,
        10,
        8,
        8,
        8
      ],
      "durationTicks": 66,
      "pivot": [
        128,
        240
      ],
      "scale": 1.55,
      "packScale": 0.2982005141388175,
      "facing": -1,
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 5
      },
      "hitFrames": [
        4
      ],
      "eventDeltas": [
        16.9,
        25.1,
        21.0,
        21.5,
        15.9,
        22.0,
        10.2
      ],
      "eventBasis": "measured mean channel delta between atlas frames; release is the approved contact frame from the pose order and has not been human-playtested",
      "attackTicks": {
        "tell": 32,
        "active": 10,
        "rest": 24
      },
      "verifiedDistinct": true
    },
    {
      "id": "05-neon.collector-lane-scan",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "telegraph",
      "distinctActionKey": "collector-lane-scan",
      "motionBrief": "Collector scans the lane; the sweep does not hit",
      "timingReference": "stages/05-neon/timing.md",
      "timingStatus": "gameplay-authored-contact-from-pose-order",
      "productionStatus": "verified",
      "sourceGenerationIds": [],
      "assetPath": "art/rework/bosses/05-neon/sproto102/collector-lane-scan/atlas-256.webp",
      "poseAtlas": "art/rework/bosses/05-neon/sproto102/collector-lane-scan/pose-atlas.json",
      "frameCount": 8,
      "frameSize": [
        256,
        256
      ],
      "frames": [
        "art/rework/bosses/05-neon/sproto102/collector-lane-scan/atlas-256.webp#0",
        "art/rework/bosses/05-neon/sproto102/collector-lane-scan/atlas-256.webp#1",
        "art/rework/bosses/05-neon/sproto102/collector-lane-scan/atlas-256.webp#2",
        "art/rework/bosses/05-neon/sproto102/collector-lane-scan/atlas-256.webp#3",
        "art/rework/bosses/05-neon/sproto102/collector-lane-scan/atlas-256.webp#4",
        "art/rework/bosses/05-neon/sproto102/collector-lane-scan/atlas-256.webp#5",
        "art/rework/bosses/05-neon/sproto102/collector-lane-scan/atlas-256.webp#6",
        "art/rework/bosses/05-neon/sproto102/collector-lane-scan/atlas-256.webp#7"
      ],
      "atlas": "art/rework/bosses/05-neon/sproto102/collector-lane-scan/atlas-256.webp",
      "atlasLayout": "8x1 cells of 256",
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
        128,
        240
      ],
      "scale": 1.55,
      "packScale": 0.2982005141388175,
      "facing": -1,
      "events": {
        "telegraph": 0,
        "release": 3,
        "recovery": 6
      },
      "hitFrames": [],
      "eventDeltas": [
        11.9,
        19.4,
        27.1,
        17.4,
        19.4,
        12.9,
        22.3
      ],
      "eventBasis": "measured mean channel delta between atlas frames; release is the approved contact frame from the pose order and has not been human-playtested",
      "attackTicks": {
        "tell": 24,
        "active": 24,
        "rest": 16
      },
      "verifiedDistinct": true
    },
    {
      "id": "05-neon.magnet-claw-fire",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "fire",
      "distinctActionKey": "magnet-claw-fire",
      "motionBrief": "Magnet fires; the pulse leaves on the extended frames",
      "timingReference": "stages/05-neon/timing.md",
      "timingStatus": "gameplay-authored-contact-from-pose-order",
      "productionStatus": "verified",
      "sourceGenerationIds": [],
      "assetPath": "art/rework/bosses/05-neon/sproto102/magnet-claw-fire/atlas-256.webp",
      "poseAtlas": "art/rework/bosses/05-neon/sproto102/magnet-claw-fire/pose-atlas.json",
      "frameCount": 8,
      "frameSize": [
        256,
        256
      ],
      "frames": [
        "art/rework/bosses/05-neon/sproto102/magnet-claw-fire/atlas-256.webp#0",
        "art/rework/bosses/05-neon/sproto102/magnet-claw-fire/atlas-256.webp#1",
        "art/rework/bosses/05-neon/sproto102/magnet-claw-fire/atlas-256.webp#2",
        "art/rework/bosses/05-neon/sproto102/magnet-claw-fire/atlas-256.webp#3",
        "art/rework/bosses/05-neon/sproto102/magnet-claw-fire/atlas-256.webp#4",
        "art/rework/bosses/05-neon/sproto102/magnet-claw-fire/atlas-256.webp#5",
        "art/rework/bosses/05-neon/sproto102/magnet-claw-fire/atlas-256.webp#6",
        "art/rework/bosses/05-neon/sproto102/magnet-claw-fire/atlas-256.webp#7"
      ],
      "atlas": "art/rework/bosses/05-neon/sproto102/magnet-claw-fire/atlas-256.webp",
      "atlasLayout": "8x1 cells of 256",
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
        128,
        240
      ],
      "scale": 1.55,
      "packScale": 0.2982005141388175,
      "facing": -1,
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "hitFrames": [
        4,
        5
      ],
      "eventDeltas": [
        13.9,
        15.0,
        18.4,
        18.2,
        10.2,
        15.2,
        19.4
      ],
      "eventBasis": "measured mean channel delta between atlas frames; release is the approved contact frame from the pose order and has not been human-playtested",
      "attackTicks": {
        "tell": 32,
        "active": 16,
        "rest": 16
      },
      "verifiedDistinct": true
    },
    {
      "id": "05-neon.magnet-pulse-projectile",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "projectile",
      "distinctActionKey": "magnet-pulse-projectile",
      "motionBrief": "Pulse loops, strikes on the left tip, then dissipates",
      "timingReference": "stages/05-neon/timing.md",
      "timingStatus": "gameplay-authored-contact-from-pose-order",
      "productionStatus": "verified",
      "sourceGenerationIds": [],
      "assetPath": "art/rework/bosses/05-neon/sproto102/magnet-pulse-projectile/atlas-256.webp",
      "poseAtlas": "art/rework/bosses/05-neon/sproto102/magnet-pulse-projectile/pose-atlas.json",
      "frameCount": 8,
      "frameSize": [
        256,
        256
      ],
      "frames": [
        "art/rework/bosses/05-neon/sproto102/magnet-pulse-projectile/atlas-256.webp#0",
        "art/rework/bosses/05-neon/sproto102/magnet-pulse-projectile/atlas-256.webp#1",
        "art/rework/bosses/05-neon/sproto102/magnet-pulse-projectile/atlas-256.webp#2",
        "art/rework/bosses/05-neon/sproto102/magnet-pulse-projectile/atlas-256.webp#3",
        "art/rework/bosses/05-neon/sproto102/magnet-pulse-projectile/atlas-256.webp#4",
        "art/rework/bosses/05-neon/sproto102/magnet-pulse-projectile/atlas-256.webp#5",
        "art/rework/bosses/05-neon/sproto102/magnet-pulse-projectile/atlas-256.webp#6",
        "art/rework/bosses/05-neon/sproto102/magnet-pulse-projectile/atlas-256.webp#7"
      ],
      "atlas": "art/rework/bosses/05-neon/sproto102/magnet-pulse-projectile/atlas-256.webp",
      "atlasLayout": "8x1 cells of 256",
      "frameTicks": [
        4,
        4,
        4,
        4,
        4,
        4,
        8,
        8
      ],
      "durationTicks": 40,
      "pivot": [
        128,
        128
      ],
      "scale": 0.5357142857142857,
      "packScale": 0.5357142857142857,
      "facing": -1,
      "events": {
        "telegraph": 0,
        "release": 6,
        "recovery": 7
      },
      "hitFrames": [
        6
      ],
      "eventDeltas": [
        38.3,
        31.3,
        19.0,
        18.1,
        20.6,
        48.5,
        51.0
      ],
      "eventBasis": "measured mean channel delta between atlas frames; release is the approved contact frame from the pose order and has not been human-playtested",
      "attackTicks": {
        "tell": 24,
        "active": 8,
        "rest": 8
      },
      "verifiedDistinct": true
    },
    {
      "id": "05-neon.magnet-snatch-return",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "return",
      "distinctActionKey": "magnet-snatch-return",
      "motionBrief": "The snatch comes back across the lane",
      "timingReference": "stages/05-neon/timing.md",
      "timingStatus": "gameplay-authored-contact-from-pose-order",
      "productionStatus": "verified",
      "sourceGenerationIds": [],
      "assetPath": "art/rework/bosses/05-neon/sproto102/magnet-snatch-return/atlas-256.webp",
      "poseAtlas": "art/rework/bosses/05-neon/sproto102/magnet-snatch-return/pose-atlas.json",
      "frameCount": 8,
      "frameSize": [
        256,
        256
      ],
      "frames": [
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-return/atlas-256.webp#0",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-return/atlas-256.webp#1",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-return/atlas-256.webp#2",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-return/atlas-256.webp#3",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-return/atlas-256.webp#4",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-return/atlas-256.webp#5",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-return/atlas-256.webp#6",
        "art/rework/bosses/05-neon/sproto102/magnet-snatch-return/atlas-256.webp#7"
      ],
      "atlas": "art/rework/bosses/05-neon/sproto102/magnet-snatch-return/atlas-256.webp",
      "atlasLayout": "8x1 cells of 256",
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
        128,
        240
      ],
      "scale": 1.55,
      "packScale": 0.2982005141388175,
      "facing": -1,
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "hitFrames": [
        4,
        5
      ],
      "eventDeltas": [
        32.7,
        23.6,
        41.5,
        29.7,
        21.2,
        24.8,
        18.8
      ],
      "eventBasis": "measured mean channel delta between atlas frames; release is the approved contact frame from the pose order and has not been human-playtested",
      "attackTicks": {
        "tell": 32,
        "active": 16,
        "rest": 16
      },
      "verifiedDistinct": true
    },
    {
      "id": "05-neon.aligned-shot-contact",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "strike",
      "distinctActionKey": "aligned-shot-contact",
      "motionBrief": "A horizontal magnet strike at drive height",
      "timingReference": "stages/05-neon/timing.md",
      "timingStatus": "gameplay-authored-contact-from-pose-order",
      "productionStatus": "verified",
      "sourceGenerationIds": [],
      "assetPath": "art/rework/bosses/05-neon/sproto102/aligned-shot-contact/atlas-256.webp",
      "poseAtlas": "art/rework/bosses/05-neon/sproto102/aligned-shot-contact/pose-atlas.json",
      "frameCount": 8,
      "frameSize": [
        256,
        256
      ],
      "frames": [
        "art/rework/bosses/05-neon/sproto102/aligned-shot-contact/atlas-256.webp#0",
        "art/rework/bosses/05-neon/sproto102/aligned-shot-contact/atlas-256.webp#1",
        "art/rework/bosses/05-neon/sproto102/aligned-shot-contact/atlas-256.webp#2",
        "art/rework/bosses/05-neon/sproto102/aligned-shot-contact/atlas-256.webp#3",
        "art/rework/bosses/05-neon/sproto102/aligned-shot-contact/atlas-256.webp#4",
        "art/rework/bosses/05-neon/sproto102/aligned-shot-contact/atlas-256.webp#5",
        "art/rework/bosses/05-neon/sproto102/aligned-shot-contact/atlas-256.webp#6",
        "art/rework/bosses/05-neon/sproto102/aligned-shot-contact/atlas-256.webp#7"
      ],
      "atlas": "art/rework/bosses/05-neon/sproto102/aligned-shot-contact/atlas-256.webp",
      "atlasLayout": "8x1 cells of 256",
      "frameTicks": [
        8,
        8,
        8,
        8,
        10,
        8,
        8,
        8
      ],
      "durationTicks": 66,
      "pivot": [
        128,
        240
      ],
      "scale": 1.55,
      "packScale": 0.2982005141388175,
      "facing": -1,
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 5
      },
      "hitFrames": [
        4
      ],
      "eventDeltas": [
        35.7,
        37.6,
        42.4,
        24.9,
        27.6,
        29.6,
        20.7
      ],
      "eventBasis": "measured mean channel delta between atlas frames; release is the approved contact frame from the pose order and has not been human-playtested",
      "attackTicks": {
        "tell": 32,
        "active": 10,
        "rest": 24
      },
      "verifiedDistinct": true
    },
    {
      "id": "05-neon.billboard-drive-guard-open",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "weak",
      "distinctActionKey": "billboard-drive-guard-open",
      "motionBrief": "The billboard drive is exposed",
      "timingReference": "stages/05-neon/timing.md",
      "timingStatus": "gameplay-authored-contact-from-pose-order",
      "productionStatus": "verified",
      "sourceGenerationIds": [],
      "assetPath": "art/rework/bosses/05-neon/sproto102/billboard-drive-guard-open/atlas-256.webp",
      "poseAtlas": "art/rework/bosses/05-neon/sproto102/billboard-drive-guard-open/pose-atlas.json",
      "frameCount": 8,
      "frameSize": [
        256,
        256
      ],
      "frames": [
        "art/rework/bosses/05-neon/sproto102/billboard-drive-guard-open/atlas-256.webp#0",
        "art/rework/bosses/05-neon/sproto102/billboard-drive-guard-open/atlas-256.webp#1",
        "art/rework/bosses/05-neon/sproto102/billboard-drive-guard-open/atlas-256.webp#2",
        "art/rework/bosses/05-neon/sproto102/billboard-drive-guard-open/atlas-256.webp#3",
        "art/rework/bosses/05-neon/sproto102/billboard-drive-guard-open/atlas-256.webp#4",
        "art/rework/bosses/05-neon/sproto102/billboard-drive-guard-open/atlas-256.webp#5",
        "art/rework/bosses/05-neon/sproto102/billboard-drive-guard-open/atlas-256.webp#6",
        "art/rework/bosses/05-neon/sproto102/billboard-drive-guard-open/atlas-256.webp#7"
      ],
      "atlas": "art/rework/bosses/05-neon/sproto102/billboard-drive-guard-open/atlas-256.webp",
      "atlasLayout": "8x1 cells of 256",
      "frameTicks": [
        8,
        8,
        8,
        8,
        28,
        28,
        10,
        10
      ],
      "durationTicks": 108,
      "pivot": [
        128,
        240
      ],
      "scale": 1.55,
      "packScale": 0.2982005141388175,
      "facing": -1,
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "hitFrames": [
        4,
        5
      ],
      "eventDeltas": [
        7.6,
        9.5,
        19.0,
        20.7,
        19.0,
        18.5,
        11.9
      ],
      "eventBasis": "measured mean channel delta between atlas frames; release is the approved contact frame from the pose order and has not been human-playtested",
      "attackTicks": {
        "tell": 32,
        "active": 56,
        "rest": 20
      },
      "verifiedDistinct": true
    },
    {
      "id": "05-neon.sign-elevation-shuffle",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "shuffle",
      "distinctActionKey": "sign-elevation-shuffle",
      "motionBrief": "Signs stagger and pulses leave at two heights",
      "timingReference": "stages/05-neon/timing.md",
      "timingStatus": "gameplay-authored-contact-from-pose-order",
      "productionStatus": "verified",
      "sourceGenerationIds": [],
      "assetPath": "art/rework/bosses/05-neon/sproto102/sign-elevation-shuffle/atlas-256.webp",
      "poseAtlas": "art/rework/bosses/05-neon/sproto102/sign-elevation-shuffle/pose-atlas.json",
      "frameCount": 8,
      "frameSize": [
        256,
        256
      ],
      "frames": [
        "art/rework/bosses/05-neon/sproto102/sign-elevation-shuffle/atlas-256.webp#0",
        "art/rework/bosses/05-neon/sproto102/sign-elevation-shuffle/atlas-256.webp#1",
        "art/rework/bosses/05-neon/sproto102/sign-elevation-shuffle/atlas-256.webp#2",
        "art/rework/bosses/05-neon/sproto102/sign-elevation-shuffle/atlas-256.webp#3",
        "art/rework/bosses/05-neon/sproto102/sign-elevation-shuffle/atlas-256.webp#4",
        "art/rework/bosses/05-neon/sproto102/sign-elevation-shuffle/atlas-256.webp#5",
        "art/rework/bosses/05-neon/sproto102/sign-elevation-shuffle/atlas-256.webp#6",
        "art/rework/bosses/05-neon/sproto102/sign-elevation-shuffle/atlas-256.webp#7"
      ],
      "atlas": "art/rework/bosses/05-neon/sproto102/sign-elevation-shuffle/atlas-256.webp",
      "atlasLayout": "8x1 cells of 256",
      "frameTicks": [
        8,
        8,
        8,
        8,
        10,
        10,
        8,
        8
      ],
      "durationTicks": 68,
      "pivot": [
        128,
        240
      ],
      "scale": 1.55,
      "packScale": 0.2982005141388175,
      "facing": -1,
      "events": {
        "telegraph": 0,
        "release": 4,
        "recovery": 6
      },
      "hitFrames": [
        4,
        5
      ],
      "eventDeltas": [
        20.8,
        14.4,
        23.5,
        28.8,
        24.1,
        32.5,
        24.9
      ],
      "eventBasis": "measured mean channel delta between atlas frames; release is the approved contact frame from the pose order and has not been human-playtested",
      "attackTicks": {
        "tell": 32,
        "active": 20,
        "rest": 16
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
  "operator": "Collector",
  "machines": [
    "Salvage Strider",
    "Billboard Rig"
  ],
  "minimumDistinctClips": 30,
  "plannedClipCount": 32,
  "actualVerifiedClipCount": 10,
  "inventoryBasisCommit": "7c62524",
  "plannedClips": [
    {
      "id": "05-neon.strider-route-entry",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "entry",
      "motionBrief": "Strider enters along the street salvage line",
      "distinctActionKey": "strider-route-entry",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.crane-gantry-idle",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "idle",
      "motionBrief": "Crane winch turns and the visible pilot gantry sways",
      "distinctActionKey": "crane-gantry-idle",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.magnetic-claw-flex",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "articulation",
      "motionBrief": "Magnet fingers articulate around a scrap bundle",
      "distinctActionKey": "magnetic-claw-flex",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.collector-lane-scan",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "operator",
      "motionBrief": "Collector swings the sight handle between street and signs",
      "distinctActionKey": "collector-lane-scan",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.magnet-snatch-cue",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "cue",
      "motionBrief": "Claw points firmly toward the chosen street or upper-sign lane",
      "distinctActionKey": "magnet-snatch-cue",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.magnetic-load-build",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "windup",
      "motionBrief": "Scrap fragments lift toward the charging magnet",
      "distinctActionKey": "magnetic-load-build",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.snatch-route-drag",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "active",
      "motionBrief": "Magnet pulls committed scrap across the selected route",
      "distinctActionKey": "snatch-route-drag",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.claw-drag-recovery",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "recovery",
      "motionBrief": "Winch reels the claw back after the lane drag",
      "distinctActionKey": "claw-drag-recovery",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.claw-drive-cover-open",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "weakpoint-open",
      "motionBrief": "Claw drive casing vents and exposes its moving gear",
      "distinctActionKey": "claw-drive-cover-open",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.claw-cover-reseat",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "weakpoint-close",
      "motionBrief": "Drive casing settles back around the winch gear",
      "distinctActionKey": "claw-cover-reseat",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.strider-drive-hit",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "hit-reaction",
      "motionBrief": "A claw drive hit jerks the cable drum and gantry",
      "distinctActionKey": "strider-drive-hit",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.claw-armor-deflect",
      "phase": 1,
      "machine": "Salvage Strider",
      "role": "armor-reaction",
      "motionBrief": "Closed magnet finger deflects a shot with a springy finger snap",
      "distinctActionKey": "claw-armor-deflect",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.tower-anchor-brace",
      "phase": "transition",
      "machine": "Salvage Strider \u2192 Billboard Rig",
      "role": "transform-unlock",
      "motionBrief": "Strider feet brace against the billboard tower foundation",
      "distinctActionKey": "tower-anchor-brace",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.crane-anchor-lock",
      "phase": "transition",
      "machine": "Salvage Strider \u2192 Billboard Rig",
      "role": "transform-reconfigure",
      "motionBrief": "Crane anchor bolts clamp into the fixed tower",
      "distinctActionKey": "crane-anchor-lock",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.claw-gantry-hoist",
      "phase": "transition",
      "machine": "Salvage Strider \u2192 Billboard Rig",
      "role": "transform-deploy",
      "motionBrief": "Retained claw and pilot gantry rise above the billboard signs",
      "distinctActionKey": "claw-gantry-hoist",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.billboard-cable-tension",
      "phase": "transition",
      "machine": "Salvage Strider \u2192 Billboard Rig",
      "role": "transform-settle",
      "motionBrief": "Three sign cables take tension around the new overhead rig",
      "distinctActionKey": "billboard-cable-tension",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.fixed-winch-idle",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "phase2-idle",
      "motionBrief": "Fixed tower winch makes short tension-correction strokes",
      "distinctActionKey": "fixed-winch-idle",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.sign-elevation-shuffle",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "phase2-articulation",
      "motionBrief": "Three sign supports rise and fall through different elevations",
      "distinctActionKey": "sign-elevation-shuffle",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.collector-winch-cue",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "phase2-cue",
      "motionBrief": "Collector turns the elevation handle to announce the next alignment",
      "distinctActionKey": "collector-winch-cue",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.drive-dog-load",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "phase2-windup",
      "motionBrief": "Winch drive dogs pull back before opening the firing line",
      "distinctActionKey": "drive-dog-load",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.sign-route-lock",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "phase2-lock",
      "motionBrief": "Sign brakes catch at the current moving-platform alignment",
      "distinctActionKey": "sign-route-lock",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.billboard-shuffle-drive",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "phase2-active",
      "motionBrief": "Winch drives the signs through their readable vertical movement",
      "distinctActionKey": "billboard-shuffle-drive",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.winch-drive-recovery",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "phase2-recovery",
      "motionBrief": "Winch slows its sign pull and returns its handle",
      "distinctActionKey": "winch-drive-recovery",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.aligned-shot-contact",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "phase2-counter-feedback",
      "motionBrief": "A correctly aligned hit visibly spins the exposed drive backwards",
      "distinctActionKey": "aligned-shot-contact",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.billboard-drive-guard-open",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "phase2-objective",
      "motionBrief": "Drive guard folds aside for the timed shot opening",
      "distinctActionKey": "billboard-drive-guard-open",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.elevated-drive-target",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "phase2-weakpoint",
      "motionBrief": "Exposed elevated gear rotates clearly at the reachable firing height",
      "distinctActionKey": "elevated-drive-target",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.billboard-core-hit",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "phase2-hit-reaction",
      "motionBrief": "Gear damage kicks the overhead rig and hanging signs",
      "distinctActionKey": "billboard-core-hit",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.magnet-snatch-return",
      "phase": 2,
      "machine": "Billboard Rig",
      "role": "phase2-reset",
      "motionBrief": "Retained claw swings out for the returning lane-snatch attack",
      "distinctActionKey": "magnet-snatch-return",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.winch-final-break",
      "phase": "defeat",
      "machine": "Billboard Rig",
      "role": "defeat-impact",
      "motionBrief": "Final gear hit shears the winch drive dog",
      "distinctActionKey": "winch-final-break",
      "timingReference": "stages/05-neon/timing.md",
      "timingStatus": "candidate-human-signoff-pending",
      "productionStatus": "planned",
      "sourceGenerationIds": [],
      "assetPath": null,
      "frameCount": null,
      "durationTicks": null,
      "verifiedDistinct": false,
      "batch": 8,
      "terminalOutcome": "machine-defeat",
      "terminalMotionBrief": "Billboard winch drive shears and sign safety catches arrest the cables; Collector retreats into the gantry beside the retained claw."
    },
    {
      "id": "05-neon.sign-safety-catches",
      "phase": "defeat",
      "machine": "Billboard Rig",
      "role": "defeat-shutdown",
      "motionBrief": "Safety catches arrest the falling sign cables",
      "distinctActionKey": "sign-safety-catches",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.collector-controls-drop",
      "phase": "defeat",
      "machine": "Billboard Rig",
      "role": "defeat-operator",
      "motionBrief": "Collector drops the winch handle and retreats inside the gantry",
      "distinctActionKey": "collector-controls-drop",
      "timingReference": "stages/05-neon/timing.md",
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
      "id": "05-neon.tower-rig-settle",
      "phase": "defeat",
      "machine": "Billboard Rig",
      "role": "defeat-settle",
      "motionBrief": "Crane and retained claw settle against the anchored tower",
      "distinctActionKey": "tower-rig-settle",
      "timingReference": "stages/05-neon/timing.md",
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
  "terminalOutcomeDescription": "Billboard winch drive shears and sign safety catches arrest the cables; Collector retreats into the gantry beside the retained claw.",
  "terminalClipId": "05-neon.winch-final-break",
  "terminalClipStatus": "planned-not-produced",
  "terminalSequenceClipIds": [
    "05-neon.winch-final-break",
    "05-neon.sign-safety-catches",
    "05-neon.collector-controls-drop",
    "05-neon.tower-rig-settle"
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
    "path": "art/rework/bosses/05-neon/reference.svg",
    "width": 1280,
    "height": 1420,
    "pivot": [
      0,
      0
    ]
  },
  "gameplayReview": {
    "path": "art/rework/bosses/05-neon/gameplay-scale.svg",
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
        "machine": "Salvage Strider",
        "signature": "Salvage routes",
        "pilot": {
          "x": 4880,
          "y": 390,
          "scale": 80
        },
        "pilotHeight": 80,
        "targets": [
          {
            "id": "neon.claw-drive",
            "x": 4800,
            "y": 548,
            "w": 100,
            "h": 52,
            "open": true
          }
        ],
        "camera": {
          "x": 3980,
          "y": 0
        },
        "anchorMetadataSource": "trackedKeyframe",
        "atomicCaptureMethod": "synchronous canvas.toDataURL and ALL metadata inside same Runtime.evaluate",
        "cue": "Claw locks street \u2014 leave the marked route",
        "source": "../../review/05-neon-p1.png",
        "sourcePixels": [
          1280,
          720
        ],
        "sha256": "715ca6016cf6921e72cd573a12e5cc5b639dc8c75a11e186047183cde8e5bf70"
      },
      {
        "phase": 2,
        "tick": 240,
        "machine": "Billboard Rig",
        "signature": "Billboard Shuffle",
        "pilot": {
          "x": 1130,
          "y": 285,
          "scale": 80
        },
        "pilotHeight": 80,
        "targets": [
          {
            "id": "neon.billboard-drive",
            "x": 1070,
            "y": 295,
            "w": 100,
            "h": 95,
            "open": true
          }
        ],
        "camera": {
          "x": 230,
          "y": 0
        },
        "anchorMetadataSource": "trackedKeyframe",
        "atomicCaptureMethod": "synchronous canvas.toDataURL and ALL metadata inside same Runtime.evaluate",
        "cue": "",
        "source": "../../review/05-neon-p2.png",
        "sourcePixels": [
          1280,
          720
        ],
        "sha256": "12dd7dd44d10dfe05750b1b9ae682dac38c02b0baac4fe4550e34493e76c3543"
      }
    ],
    "humanSignoff": false
  },
  "referenceAnchors": {
    "1": {
      "space": "world",
      "pilot": {
        "x": 4880,
        "y": 390,
        "scale": 80
      },
      "pilotHeight": 80,
      "targets": [
        {
          "id": "neon.claw-drive",
          "x": 4800,
          "y": 548,
          "w": 100,
          "h": 52,
          "open": true
        }
      ],
      "projectionCamera": {
        "x": 3980,
        "y": 0
      },
      "sampleTick": 240,
      "diagnosticOnly": true
    },
    "2": {
      "space": "world",
      "pilot": {
        "x": 1130,
        "y": 285,
        "scale": 80
      },
      "pilotHeight": 80,
      "targets": [
        {
          "id": "neon.billboard-drive",
          "x": 1070,
          "y": 295,
          "w": 100,
          "h": 95,
          "open": true
        }
      ],
      "projectionCamera": {
        "x": 230,
        "y": 0
      },
      "sampleTick": 240,
      "diagnosticOnly": true
    }
  }
});
