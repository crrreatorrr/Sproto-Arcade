# Bot Sales / Sales Carrier → Orbital Showroom

This pack currently contains an animation production inventory only. No silhouette, final clip, atlas or Higgsfield generation is supplied. Source timing is the implemented `stages/10-verse/timing.md` at integrated snapshot `7c62524`. Timing and critical poses remain candidates pending human signoff.

## Distinct production animation inventory

User requirement: at least 30 distinct actual production animations per boss, with both phases reviewed. This pack plans 32 bespoke motions; **actual generated and verified production clips: 0**. A planned record is not an animation delivery. `clips` remains empty and `productionApproved` remains false. No generation or credit spending occurred.

Captured gameplay reference candidates are now supplied; final concept/look development and critical-pose artwork remain unapproved. This inventory and its guides do not imply visual, timing or pose approval.

Each final clip must perform a different mechanism, operator action or outcome. Frames, duplicated loops, held poses, mirrored exports, speed changes, crops and alternate encodes cannot increase the count. A windup must visibly load a mechanism; an active clip must perform its attack; recovery must follow a different mechanical path. Unique IDs alone do not prove semantic distinctness. Fixed machines use articulation rather than invented walking.

1. `10-verse.carrier-route-arrival` — phase 1; Sales carrier cruises into the forward debris route.
2. `10-verse.carrier-thruster-cruise` — phase 1; Carrier thrusters cycle while the central cabin remains visible.
3. `10-verse.demo-drone-unfold` — phase 1; Demonstration drone wings unfold from a carrier bay.
4. `10-verse.sales-demo-present` — phase 1; Bot Sales points toward the next drone demonstration.
5. `10-verse.rift-demo-chevron-cue` — phase 1; Drone projector opens into the marked rift contour.
6. `10-verse.rift-capacitor-charge` — phase 1; Drone capacitor fins draw apart before the route front.
7. `10-verse.live-demo-rift-release` — phase 1; Drone projects the fixed dash-only rift across the route.
8. `10-verse.drone-projection-recovery` — phase 1; Projector fins retract and the drone clears the route.
9. `10-verse.route-counter-receipt` — phase 1; Successful rift crossing flips the carrier demonstration counter.
10. `10-verse.carrier-cache-hatch` — phase 1; Optional carrier cache port opens above the first crossing route.
11. `10-verse.aimed-drone-acquire` — phase 1; Drone sight gimbal acquires the explicitly eligible aimed volley.
12. `10-verse.drone-volley-launch` — phase 1; Drone launches its aimed ordinary volley after the isolated route lesson.
13. `10-verse.carrier-hull-split` — phase transition; Outer carrier hull separates around the central obstruction.
14. `10-verse.central-cabin-anchor` — phase transition; Retained Bot Sales cabin anchors in the orbital arena.
15. `10-verse.showroom-module-spread` — phase transition; Four hinged showroom modules extend around the cabin.
16. `10-verse.orbital-ring-settle` — phase transition; Module ring settles into the four-side presentation order.
17. `10-verse.cabin-core-idle` — phase 2; Fixed cabin core spins within the deployed module ring.
18. `10-verse.module-hinge-travel` — phase 2; Selected module hinge moves toward its next cardinal presentation.
19. `10-verse.offer-side-cue` — phase 2; Presenting module lifts a side flag before exposure.
20. `10-verse.module-cover-windup` — phase 2; Module cover pulls back its latches before the opening window.
21. `10-verse.offer-side-commit` — phase 2; Module hinge seats on the exposed side detent.
22. `10-verse.limited-offer-expose` — phase 2; Committed module cover opens to show the damage target.
23. `10-verse.module-cover-retract` — phase 2; Module cover retracts and reseats after its exposure window.
24. `10-verse.center-lane-open` — phase 2; Central cabin obstruction folds aside for the brief center route.
25. `10-verse.center-lane-close` — phase 2; Central obstruction closes when the brief route expires.
26. `10-verse.side-matched-contact` — phase 2; Correct-side shot contact kicks only the exposed module linkage.
27. `10-verse.orbital-core-hit` — phase 2; Cabin core damage sends a mechanical shudder through the ring.
28. `10-verse.demo-front-return` — phase 2; A retained projector unfolds to emit the returning dash front.
29. `10-verse.showroom-core-final-fail` — phase defeat; Final core hit breaks the central module drive.
30. `10-verse.module-safety-fold` — phase defeat; Four showroom modules fold inward on their safety hinges.
31. `10-verse.sales-cabin-retreat` — phase defeat; Bot Sales retreats from the dead presentation controls.
32. `10-verse.carrier-cabin-shutdown` — phase defeat; Central cabin settles with the split carrier hull framing it.

## Feasibility, batches and verification

Campaign backlog: 11 bosses × 32 plus Codebreak × 36 = **388 planned distinct clips**. At four motion briefs per review batch this is **97 scheduling batches**: eight for each other boss and nine for Codebreak. A scheduling batch is not a claim that one generation call yields four usable clips. Generation calls, retries, credit cost and export labor remain unknown until approved references and timing are tested.

Codebreak landing, anchor and scanner motion is the first priority. Dave, Big Swole and Goldie have the initial procedural reference studies; the other nine now have captured gameplay reference guides; final look-development and critical-pose approval remain pending. Review every boss in both phases. Keep the timing/critical-pose gate closed before any final animation generation, even when the user permits credits or free models.

Each actual clip needs approved start/end poses, a distinct moving-part brief, source/generation record, gameplay-scale contact sheet, offline atlas path and frame rectangle, pivot, duration, event markers and muzzle/weak-point anchors. Validate asset bytes and distinct motion identity before adding it to `clips` and raising `actualVerifiedClipCount`. Independent script `art/rework/bosses/12-codebreak/validate-inventory.cjs` checks inventory shape and counts; it cannot substitute for human semantic motion review.

## Required boss-specific terminal animation

Primary terminal clip: `10-verse.showroom-core-final-fail` — **planned, not produced**. Outcome: machine-defeat. Orbital module drive fails and safety hinges fold the showroom around the central cabin; Bot Sales retreats from the powerless controls.

The terminal sequence is bespoke to this machine and must not be fulfilled with a shared explosion, fade or generic pilot-death animation. Production acceptance requires an actual verified clip under the primary terminal ID, the appropriate operator outcome, and offline start/clear/retry verification. The other defeat/escape motions in this pack support that sequence; planned IDs do not satisfy the requirement. No operator death is implied.

## Captured gameplay reference guide

`reference.svg` provides both phases as a contact sheet; `gameplay-scale.svg` provides two full 1280 × 720 viewport panels. Both display **GAMEPLAY REFERENCE CANDIDATE — LOOK DEVELOPMENT / HUMAN SIGNOFF PENDING**. They package the original reviewed PNG bytes as self-contained SVG image resources without raster editing or generation. They are gameplay guides, not final concept art, identity redesigns or approved motion poses.

Source report: `art/rework/review/report.json`, clean build `e1c9dbce3b3571ae0c24d2249b4d96468fbafbe3`. Original source images: `../../review/10-verse-p1.png`, `../../review/10-verse-p2.png`. The last neutral sample is paired with the report's diagnostic boss-framing camera. Overlay pilot feet/top and target bounds use world coordinates minus that diagnostic camera. Canvas captures are normalized to a 1280 × 720 viewport; original PNG dimensions and hashes are recorded in the manifest.

The frames do not demonstrate an earned clear or all conditional openings, transformations or terminal outcomes. Critical-pose labels come from the report's source-reviewed recommendations and still require human review against stage timing. Both phases need look development, operator articulation, bespoke transformation and terminal poses. All production counts and approvals remain unchanged at zero/false.

Refresh only from a clean capture report using `python3 art/rework/bosses/12-codebreak/refresh-reference-guides.py --expected-build <capture-build-prefix>`. The helper reads existing reviewed PNGs, embeds them unchanged and updates only the nine candidate guide packs. It does not call image models or spend credits.
