# Collector / Salvage Strider → Billboard Rig

This pack currently contains an animation production inventory only. No silhouette, final clip, atlas or Higgsfield generation is supplied. Source timing is the implemented `stages/05-neon/timing.md` at integrated snapshot `7c62524`. Timing and critical poses remain candidates pending human signoff.

## Distinct production animation inventory

User requirement: at least 30 distinct actual production animations per boss, with both phases reviewed. This pack plans 32 bespoke motions; **actual generated and verified production clips: 0**. A planned record is not an animation delivery. `clips` remains empty and `productionApproved` remains false. No generation or credit spending occurred.

Captured gameplay reference candidates are now supplied; final concept/look development and critical-pose artwork remain unapproved. This inventory and its guides do not imply visual, timing or pose approval.

Each final clip must perform a different mechanism, operator action or outcome. Frames, duplicated loops, held poses, mirrored exports, speed changes, crops and alternate encodes cannot increase the count. A windup must visibly load a mechanism; an active clip must perform its attack; recovery must follow a different mechanical path. Unique IDs alone do not prove semantic distinctness. Fixed machines use articulation rather than invented walking.

1. `05-neon.strider-route-entry` — phase 1; Strider enters along the street salvage line.
2. `05-neon.crane-gantry-idle` — phase 1; Crane winch turns and the visible pilot gantry sways.
3. `05-neon.magnetic-claw-flex` — phase 1; Magnet fingers articulate around a scrap bundle.
4. `05-neon.collector-lane-scan` — phase 1; Collector swings the sight handle between street and signs.
5. `05-neon.magnet-snatch-cue` — phase 1; Claw points firmly toward the chosen street or upper-sign lane.
6. `05-neon.magnetic-load-build` — phase 1; Scrap fragments lift toward the charging magnet.
7. `05-neon.snatch-route-drag` — phase 1; Magnet pulls committed scrap across the selected route.
8. `05-neon.claw-drag-recovery` — phase 1; Winch reels the claw back after the lane drag.
9. `05-neon.claw-drive-cover-open` — phase 1; Claw drive casing vents and exposes its moving gear.
10. `05-neon.claw-cover-reseat` — phase 1; Drive casing settles back around the winch gear.
11. `05-neon.strider-drive-hit` — phase 1; A claw drive hit jerks the cable drum and gantry.
12. `05-neon.claw-armor-deflect` — phase 1; Closed magnet finger deflects a shot with a springy finger snap.
13. `05-neon.tower-anchor-brace` — phase transition; Strider feet brace against the billboard tower foundation.
14. `05-neon.crane-anchor-lock` — phase transition; Crane anchor bolts clamp into the fixed tower.
15. `05-neon.claw-gantry-hoist` — phase transition; Retained claw and pilot gantry rise above the billboard signs.
16. `05-neon.billboard-cable-tension` — phase transition; Three sign cables take tension around the new overhead rig.
17. `05-neon.fixed-winch-idle` — phase 2; Fixed tower winch makes short tension-correction strokes.
18. `05-neon.sign-elevation-shuffle` — phase 2; Three sign supports rise and fall through different elevations.
19. `05-neon.collector-winch-cue` — phase 2; Collector turns the elevation handle to announce the next alignment.
20. `05-neon.drive-dog-load` — phase 2; Winch drive dogs pull back before opening the firing line.
21. `05-neon.sign-route-lock` — phase 2; Sign brakes catch at the current moving-platform alignment.
22. `05-neon.billboard-shuffle-drive` — phase 2; Winch drives the signs through their readable vertical movement.
23. `05-neon.winch-drive-recovery` — phase 2; Winch slows its sign pull and returns its handle.
24. `05-neon.aligned-shot-contact` — phase 2; A correctly aligned hit visibly spins the exposed drive backwards.
25. `05-neon.billboard-drive-guard-open` — phase 2; Drive guard folds aside for the timed shot opening.
26. `05-neon.elevated-drive-target` — phase 2; Exposed elevated gear rotates clearly at the reachable firing height.
27. `05-neon.billboard-core-hit` — phase 2; Gear damage kicks the overhead rig and hanging signs.
28. `05-neon.magnet-snatch-return` — phase 2; Retained claw swings out for the returning lane-snatch attack.
29. `05-neon.winch-final-break` — phase defeat; Final gear hit shears the winch drive dog.
30. `05-neon.sign-safety-catches` — phase defeat; Safety catches arrest the falling sign cables.
31. `05-neon.collector-controls-drop` — phase defeat; Collector drops the winch handle and retreats inside the gantry.
32. `05-neon.tower-rig-settle` — phase defeat; Crane and retained claw settle against the anchored tower.

## Feasibility, batches and verification

Campaign backlog: 11 bosses × 32 plus Codebreak × 36 = **388 planned distinct clips**. At four motion briefs per review batch this is **97 scheduling batches**: eight for each other boss and nine for Codebreak. A scheduling batch is not a claim that one generation call yields four usable clips. Generation calls, retries, credit cost and export labor remain unknown until approved references and timing are tested.

Codebreak landing, anchor and scanner motion is the first priority. Dave, Big Swole and Goldie have the initial procedural reference studies; the other nine now have captured gameplay reference guides; final look-development and critical-pose approval remain pending. Review every boss in both phases. Keep the timing/critical-pose gate closed before any final animation generation, even when the user permits credits or free models.

Each actual clip needs approved start/end poses, a distinct moving-part brief, source/generation record, gameplay-scale contact sheet, offline atlas path and frame rectangle, pivot, duration, event markers and muzzle/weak-point anchors. Validate asset bytes and distinct motion identity before adding it to `clips` and raising `actualVerifiedClipCount`. Independent script `art/rework/bosses/12-codebreak/validate-inventory.cjs` checks inventory shape and counts; it cannot substitute for human semantic motion review.

## Required boss-specific terminal animation

Primary terminal clip: `05-neon.winch-final-break` — **planned, not produced**. Outcome: machine-defeat. Billboard winch drive shears and sign safety catches arrest the cables; Collector retreats into the gantry beside the retained claw.

The terminal sequence is bespoke to this machine and must not be fulfilled with a shared explosion, fade or generic pilot-death animation. Production acceptance requires an actual verified clip under the primary terminal ID, the appropriate operator outcome, and offline start/clear/retry verification. The other defeat/escape motions in this pack support that sequence; planned IDs do not satisfy the requirement. No operator death is implied.

## Captured gameplay reference guide

`reference.svg` provides both phases as a contact sheet; `gameplay-scale.svg` provides two full 1280 × 720 viewport panels. Both display **GAMEPLAY REFERENCE CANDIDATE — LOOK DEVELOPMENT / HUMAN SIGNOFF PENDING**. They package the original reviewed PNG bytes as self-contained SVG image resources without raster editing or generation. They are gameplay guides, not final concept art, identity redesigns or approved motion poses.

Source report: `art/rework/review/report.json`, clean build `2c203985a7d9a58f1c9bdb8b27bf98c6aff38874`. Original source images: `../../review/05-neon-p1.png`, `../../review/05-neon-p2.png`. Each PNG is paired only with its own atomic `trackedKeyframe` snapshot, including the exact camera, pilot, target rectangles and PNG hash. The helper rejects missing snapshots or mismatched PNG hashes. Overlay pilot feet/top and target bounds use world coordinates minus the tracked capture camera. Canvas captures are normalized to a 1280 × 720 viewport; original PNG dimensions and hashes are recorded in the manifest.

The frames do not demonstrate an earned clear or all conditional openings, transformations or terminal outcomes. Critical-pose labels come from the report's source-reviewed recommendations and still require human review against stage timing. Both phases need look development, operator articulation, bespoke transformation and terminal poses. All production counts and approvals remain unchanged at zero/false.

Refresh only from a clean capture report using `python3 art/rework/bosses/12-codebreak/refresh-reference-guides.py --expected-build <capture-build-prefix>`. The helper reads existing reviewed PNGs, embeds them unchanged and updates only the nine candidate guide packs. It does not call image models or spend credits.
