# Morelight / Prism Projector → Mirror Gantry

This pack currently contains an animation production inventory only. No silhouette, final clip, atlas or Higgsfield generation is supplied. Source timing is the implemented `stages/02-last-light/timing.md` at integrated snapshot `7c62524`. Timing and critical poses remain candidates pending human signoff.

## Distinct production animation inventory

User requirement: at least 30 distinct actual production animations per boss, with both phases reviewed. This pack plans 32 bespoke motions; **actual generated and verified production clips: 0**. A planned record is not an animation delivery. `clips` remains empty and `productionApproved` remains false. No generation or credit spending occurred.

Captured gameplay reference candidates are now supplied; final concept/look development and critical-pose artwork remain unapproved. This inventory and its guides do not imply visual, timing or pose approval.

Each final clip must perform a different mechanism, operator action or outcome. Frames, duplicated loops, held poses, mirrored exports, speed changes, crops and alternate encodes cannot increase the count. A windup must visibly load a mechanism; an active clip must perform its attack; recovery must follow a different mechanical path. Unique IDs alone do not prove semantic distinctness. Fixed machines use articulation rather than invented walking.

1. `02-last-light.projector-console-entry` — phase 1; Morelight takes the projector seat and aligns the control yoke.
2. `02-last-light.lens-gimbal-idle` — phase 1; Projector lens gently traverses its fixed gimbal.
3. `02-last-light.iris-aperture-test` — phase 1; Iris blades cycle through a diagnostic open-close sweep.
4. `02-last-light.booth-sightline-survey` — phase 1; Morelight rotates the sighting handle across the booth lane.
5. `02-last-light.iris-narrow-cue` — phase 1; Lens narrows to announce the committed target lane.
6. `02-last-light.prism-capacitor-charge` — phase 1; Internal prism plates separate as the shot charges.
7. `02-last-light.iris-shot-release` — phase 1; Projector emits its committed booth-lane beam.
8. `02-last-light.lens-kick-recovery` — phase 1; Lens carriage recoils and returns along its short guide.
9. `02-last-light.iris-return-open` — phase 1; A returned booth beam unseals the iris target.
10. `02-last-light.iris-cover-reseal` — phase 1; Iris protective blades close after the punish window.
11. `02-last-light.iris-damage-flinch` — phase 1; Exposed iris frame twists under a direct hit.
12. `02-last-light.lens-armor-spark` — phase 1; Sealed lens housing deflects a shot without exposing the iris.
13. `02-last-light.projector-rail-unlock` — phase transition; Floor mount releases the projector from its pedestal.
14. `02-last-light.gantry-hoist-rise` — phase transition; Overhead hoist raises the same projector and pilot seat.
15. `02-last-light.booth-fold-away` — phase transition; Booth panels hinge flat to reveal the mirror fixture.
16. `02-last-light.mirror-gantry-latch` — phase transition; Gantry locks and its mirror settles into the low return angle.
17. `02-last-light.rail-carriage-idle` — phase 2; Fixed gantry carriage rocks against its overhead stops.
18. `02-last-light.mirror-angle-adjust` — phase 2; Mirror frame rotates on its hinge to present the return surface.
19. `02-last-light.rear-housing-warning` — phase 2; Rear housing fins lift as Morelight sights the low mirror lane.
20. `02-last-light.gantry-prism-charge` — phase 2; Raised projector loads a beam through the suspended prism.
21. `02-last-light.mirror-lane-lock` — phase 2; A sight arm snaps onto the committed low return line.
22. `02-last-light.house-of-mirrors-release` — phase 2; Raised projector releases the locked reflection beam.
23. `02-last-light.gantry-shot-recoil` — phase 2; Overhead carriage swings backward on the shot spring.
24. `02-last-light.mirror-return-flare` — phase 2; Mirror surface flashes and bends the successful return toward the rear.
25. `02-last-light.rear-latch-release` — phase 2; Rear armor catches pop free after the reflected hit.
26. `02-last-light.rear-housing-expose` — phase 2; Rear housing fans open to expose the new target.
27. `02-last-light.gantry-core-hit-sway` — phase 2; Exposed housing hit swings the suspended projector asymmetrically.
28. `02-last-light.mirror-return-reset` — phase 2; Mirror detent and rear catches rearm for the next positioning cycle.
29. `02-last-light.prism-final-fracture` — phase defeat; Final housing hit fractures the internal prism assembly.
30. `02-last-light.lens-power-collapse` — phase defeat; Projection light gutters as iris blades lose drive.
31. `02-last-light.morelight-chair-release` — phase defeat; Morelight releases the yoke and turns away from the broken lens.
32. `02-last-light.gantry-safety-lower` — phase defeat; Hoist lowers the failed projector into a supported resting position.

## Feasibility, batches and verification

Campaign backlog: 11 bosses × 32 plus Codebreak × 36 = **388 planned distinct clips**. At four motion briefs per review batch this is **97 scheduling batches**: eight for each other boss and nine for Codebreak. A scheduling batch is not a claim that one generation call yields four usable clips. Generation calls, retries, credit cost and export labor remain unknown until approved references and timing are tested.

Codebreak landing, anchor and scanner motion is the first priority. Dave, Big Swole and Goldie have the initial procedural reference studies; the other nine now have captured gameplay reference guides; final look-development and critical-pose approval remain pending. Review every boss in both phases. Keep the timing/critical-pose gate closed before any final animation generation, even when the user permits credits or free models.

Each actual clip needs approved start/end poses, a distinct moving-part brief, source/generation record, gameplay-scale contact sheet, offline atlas path and frame rectangle, pivot, duration, event markers and muzzle/weak-point anchors. Validate asset bytes and distinct motion identity before adding it to `clips` and raising `actualVerifiedClipCount`. Independent script `art/rework/bosses/12-codebreak/validate-inventory.cjs` checks inventory shape and counts; it cannot substitute for human semantic motion review.

## Required boss-specific terminal animation

Primary terminal clip: `02-last-light.prism-final-fracture` — **planned, not produced**. Outcome: machine-defeat. Internal prism fractures, lens loses projection power and safety hoist lowers the broken projector; Morelight withdraws from the controls.

The terminal sequence is bespoke to this machine and must not be fulfilled with a shared explosion, fade or generic pilot-death animation. Production acceptance requires an actual verified clip under the primary terminal ID, the appropriate operator outcome, and offline start/clear/retry verification. The other defeat/escape motions in this pack support that sequence; planned IDs do not satisfy the requirement. No operator death is implied.

## Captured gameplay reference guide

`reference.svg` provides both phases as a contact sheet; `gameplay-scale.svg` provides two full 1280 × 720 viewport panels. Both display **GAMEPLAY REFERENCE CANDIDATE — LOOK DEVELOPMENT / HUMAN SIGNOFF PENDING**. They package the original reviewed PNG bytes as self-contained SVG image resources without raster editing or generation. They are gameplay guides, not final concept art, identity redesigns or approved motion poses.

Source report: `art/rework/review/report.json`, clean build `2c203985a7d9a58f1c9bdb8b27bf98c6aff38874`. Original source images: `../../review/02-last-light-p1.png`, `../../review/02-last-light-p2.png`. Each PNG is paired only with its own atomic `trackedKeyframe` snapshot, including the exact camera, pilot, target rectangles and PNG hash. The helper rejects missing snapshots or mismatched PNG hashes. Overlay pilot feet/top and target bounds use world coordinates minus the tracked capture camera. Canvas captures are normalized to a 1280 × 720 viewport; original PNG dimensions and hashes are recorded in the manifest.

The frames do not demonstrate an earned clear or all conditional openings, transformations or terminal outcomes. Critical-pose labels come from the report's source-reviewed recommendations and still require human review against stage timing. Both phases need look development, operator articulation, bespoke transformation and terminal poses. All production counts and approvals remain unchanged at zero/false.

Refresh only from a clean capture report using `python3 art/rework/bosses/12-codebreak/refresh-reference-guides.py --expected-build <capture-build-prefix>`. The helper reads existing reviewed PNGs, embeds them unchanged and updates only the nine candidate guide packs. It does not call image models or spend credits.
