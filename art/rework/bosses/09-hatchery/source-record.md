# High Sproto / Incubator Crane → Brood Crawler

This pack currently contains an animation production inventory only. No silhouette, final clip, atlas or Higgsfield generation is supplied. Source timing is the implemented `stages/09-hatchery/timing.md` at integrated snapshot `7c62524`. Timing and critical poses remain candidates pending human signoff.

## Distinct production animation inventory

User requirement: at least 30 distinct actual production animations per boss, with both phases reviewed. This pack plans 32 bespoke motions; **actual generated and verified production clips: 0**. A planned record is not an animation delivery. `clips` remains empty and `productionApproved` remains false. No generation or credit spending occurred.

Captured gameplay reference candidates are now supplied; final concept/look development and critical-pose artwork remain unapproved. This inventory and its guides do not imply visual, timing or pose approval.

Each final clip must perform a different mechanism, operator action or outcome. Frames, duplicated loops, held poses, mirrored exports, speed changes, crops and alternate encodes cannot increase the count. A windup must visibly load a mechanism; an active clip must perform its attack; recovery must follow a different mechanical path. Unique IDs alone do not prove semantic distinctness. Fixed machines use articulation rather than invented walking.

1. `09-hatchery.crane-cab-entry` — phase 1; High Sproto takes the incubator crane controls.
2. `09-hatchery.pressure-gauge-idle` — phase 1; Cab pressure gauge rocks while the crane holds its pods.
3. `09-hatchery.crane-claw-traverse` — phase 1; Crane claw moves laterally with a new sealed pod.
4. `09-hatchery.pod-place-control` — phase 1; High Sproto lowers the crane lever to place footing.
5. `09-hatchery.pod-seam-countdown` — phase 1; Shell seams flex in numbered order as hatch ticks approach.
6. `09-hatchery.pod-internal-pressure` — phase 1; Pod shell bulges and the top footing trembles before hatch.
7. `09-hatchery.pod-hatch-release` — phase 1; Shell splits and releases a crawling brood hazard.
8. `09-hatchery.claw-hatch-retract` — phase 1; Crane claw lifts clear of the spent shell.
9. `09-hatchery.incubator-break-opening` — phase 1; Breaking a shell trips the incubator guard open.
10. `09-hatchery.incubator-guard-close` — phase 1; Guard closes after the shell-break or hatch opening expires.
11. `09-hatchery.incubator-core-hit` — phase 1; Exposed incubator core hit shakes the suspended gauge and cab.
12. `09-hatchery.shell-break-footing-loss` — phase 1; Destroyed shell caves inward and its physical footing disappears.
13. `09-hatchery.crane-mast-lower` — phase transition; Crane mast lowers its retained cab toward the tracked chassis.
14. `09-hatchery.cab-track-dock` — phase transition; Cab locks onto the brood crawler running gear.
15. `09-hatchery.claw-conveyor-transfer` — phase transition; Retained crane claw folds over the new conveyor.
16. `09-hatchery.crawler-pressure-prime` — phase transition; Crawler gauge and conveyor rollers prime together.
17. `09-hatchery.crawler-track-motion` — phase 2; Tracked incubator crawls horizontally along the floor lane.
18. `09-hatchery.conveyor-pod-transport` — phase 2; Conveyor carries sealed shell pods through the lower firing lane.
19. `09-hatchery.conveyor-hatch-order-cue` — phase 2; Pressure gauge ticks and successive pods display their hatch order.
20. `09-hatchery.moving-pod-pressure-load` — phase 2; Transported pod swells while remaining a solid lane blocker.
21. `09-hatchery.crawler-hatch-align` — phase 2; Crawler hatch rotates toward the player as its body passes.
22. `09-hatchery.conveyor-brood-release` — phase 2; A moving pod splits and drops a crawling brood hazard.
23. `09-hatchery.crawler-vent-recovery` — phase 2; Crawler exhausts pressure after the conveyor hatch release.
24. `09-hatchery.broken-shell-lane-clear` — phase 2; A destroyed moving shell falls away to reveal a clear shot lane.
25. `09-hatchery.conveyor-lane-guard-close` — phase 2; A live shell entering the shot lane visibly occludes the hatch.
26. `09-hatchery.crawler-hatch-expose` — phase 2; Clear-lane hatch cover opens on the passing crawler.
27. `09-hatchery.crawler-hatch-hit` — phase 2; Hatch damage jolts the moving cab against the track frame.
28. `09-hatchery.brood-shot-return` — phase 2; Crane-style brood launcher fires its familiar returning floor threat.
29. `09-hatchery.crawler-core-final-rupture` — phase defeat; Final hatch hit ruptures the pressure core.
30. `09-hatchery.conveyor-safety-stop` — phase defeat; Conveyor stops and remaining intact pods settle on supported rollers.
31. `09-hatchery.high-sproto-valve-release` — phase defeat; High Sproto releases the pressure lever and ducks into the cab.
32. `09-hatchery.crawler-track-settle` — phase defeat; Tracked incubator settles with claw and pressure gauge retained.

## Feasibility, batches and verification

Campaign backlog: 11 bosses × 32 plus Codebreak × 36 = **388 planned distinct clips**. At four motion briefs per review batch this is **97 scheduling batches**: eight for each other boss and nine for Codebreak. A scheduling batch is not a claim that one generation call yields four usable clips. Generation calls, retries, credit cost and export labor remain unknown until approved references and timing are tested.

Codebreak landing, anchor and scanner motion is the first priority. Dave, Big Swole and Goldie have the initial procedural reference studies; the other nine now have captured gameplay reference guides; final look-development and critical-pose approval remain pending. Review every boss in both phases. Keep the timing/critical-pose gate closed before any final animation generation, even when the user permits credits or free models.

Each actual clip needs approved start/end poses, a distinct moving-part brief, source/generation record, gameplay-scale contact sheet, offline atlas path and frame rectangle, pivot, duration, event markers and muzzle/weak-point anchors. Validate asset bytes and distinct motion identity before adding it to `clips` and raising `actualVerifiedClipCount`. Independent script `art/rework/bosses/12-codebreak/validate-inventory.cjs` checks inventory shape and counts; it cannot substitute for human semantic motion review.

## Required boss-specific terminal animation

Primary terminal clip: `09-hatchery.crawler-core-final-rupture` — **planned, not produced**. Outcome: machine-defeat. Crawler pressure core ruptures into its vent route, conveyor safety stops and supported pods settle; High Sproto ducks safely into the cab.

The terminal sequence is bespoke to this machine and must not be fulfilled with a shared explosion, fade or generic pilot-death animation. Production acceptance requires an actual verified clip under the primary terminal ID, the appropriate operator outcome, and offline start/clear/retry verification. The other defeat/escape motions in this pack support that sequence; planned IDs do not satisfy the requirement. No operator death is implied.

## Captured gameplay reference guide

`reference.svg` provides both phases as a contact sheet; `gameplay-scale.svg` provides two full 1280 × 720 viewport panels. Both display **GAMEPLAY REFERENCE CANDIDATE — LOOK DEVELOPMENT / HUMAN SIGNOFF PENDING**. They package the original reviewed PNG bytes as self-contained SVG image resources without raster editing or generation. They are gameplay guides, not final concept art, identity redesigns or approved motion poses.

Source report: `art/rework/review/report.json`, clean build `2c203985a7d9a58f1c9bdb8b27bf98c6aff38874`. Original source images: `../../review/09-hatchery-p1.png`, `../../review/09-hatchery-p2.png`. Each PNG is paired only with its own atomic `trackedKeyframe` snapshot, including the exact camera, pilot, target rectangles and PNG hash. The helper rejects missing snapshots or mismatched PNG hashes. Overlay pilot feet/top and target bounds use world coordinates minus the tracked capture camera. Canvas captures are normalized to a 1280 × 720 viewport; original PNG dimensions and hashes are recorded in the manifest.

The frames do not demonstrate an earned clear or all conditional openings, transformations or terminal outcomes. Critical-pose labels come from the report's source-reviewed recommendations and still require human review against stage timing. Both phases need look development, operator articulation, bespoke transformation and terminal poses. All production counts and approvals remain unchanged at zero/false.

Refresh only from a clean capture report using `python3 art/rework/bosses/12-codebreak/refresh-reference-guides.py --expected-build <capture-build-prefix>`. The helper reads existing reviewed PNGs, embeds them unchanged and updates only the nine candidate guide packs. It does not call image models or spend credits.
