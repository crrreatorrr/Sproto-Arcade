# Alpha 777 / Jackpot Knight → Crown Joust Rig

This pack currently contains an animation production inventory only. No silhouette, final clip, atlas or Higgsfield generation is supplied. Source timing is the implemented `stages/08-crown/timing.md` at integrated snapshot `7c62524`. Timing and critical poses remain candidates pending human signoff.

## Distinct production animation inventory

User requirement: at least 30 distinct actual production animations per boss, with both phases reviewed. This pack plans 32 bespoke motions; **actual generated and verified production clips: 0**. A planned record is not an animation delivery. `clips` remains empty and `productionApproved` remains false. No generation or credit spending occurred.

Captured gameplay reference candidates are now supplied; final concept/look development and critical-pose artwork remain unapproved. This inventory and its guides do not imply visual, timing or pose approval.

Each final clip must perform a different mechanism, operator action or outcome. Frames, duplicated loops, held poses, mirrored exports, speed changes, crops and alternate encodes cannot increase the count. A windup must visibly load a mechanism; an active clip must perform its attack; recovery must follow a different mechanical path. Unique IDs alone do not prove semantic distinctness. Fixed machines use articulation rather than invented walking.

1. `08-crown.knight-throne-entry` — phase 1; Alpha 777 settles into the jackpot knight cockpit.
2. `08-crown.reel-drum-idle` — phase 1; Three reels turn independently while the fixed chassis remains planted.
3. `08-crown.pulse-coil-breathe` — phase 1; Pulse coils expand and contract around the reel housing.
4. `08-crown.alpha-reel-handle` — phase 1; Alpha pulls the reel stop handle with a clear arm arc.
5. `08-crown.reel-stop-sequence` — phase 1; Three reels stop one at a time on readable shield symbols.
6. `08-crown.jackpot-pulse-charge` — phase 1; Capacitor plates spread behind the matching symbols.
7. `08-crown.jackpot-pulse-release` — phase 1; Knight emits the shield-rule pulse from its opened coil.
8. `08-crown.pulse-coil-recoil` — phase 1; Pulse coils snap back as the emission exhausts.
9. `08-crown.shield-counter-core-open` — phase 1; Successful shield return releases the core armor.
10. `08-crown.jackpot-core-reseal` — phase 1; Core plates close after the counter punish window.
11. `08-crown.knight-core-hit` — phase 1; Exposed core hit jolts the stopped reels and cockpit.
12. `08-crown.knight-armor-rebuff` — phase 1; Sealed chest armor rebounds a shot while the reels keep their state.
13. `08-crown.cockpit-eject-rise` — phase transition; Cockpit ejects upward out of the knight chest.
14. `08-crown.rail-sled-catch` — phase transition; Rail sled catches the retained cockpit and reels.
15. `08-crown.lance-mount-deploy` — phase transition; Lance arm unfolds along the new rail sled.
16. `08-crown.joust-carriage-seat` — phase transition; Sled suspension seats onto the rail with reels facing the player.
17. `08-crown.rail-sled-idle` — phase 2; Rail sled suspension rocks against its fixed launch catch.
18. `08-crown.lance-tip-trim` — phase 2; Lance arm makes a short mechanical alignment stroke.
19. `08-crown.dash-reel-cue` — phase 2; Reels stop on broken chevrons to distinguish the lance counter.
20. `08-crown.joust-spring-load` — phase 2; Rail carriage recoils backward and compresses its launch spring.
21. `08-crown.lance-drop-lock` — phase 2; Lance drops into its committed forward firing line.
22. `08-crown.royal-joust-release` — phase 2; Carriage launches the marked dash-only lance front.
23. `08-crown.joust-carriage-recover` — phase 2; Sled recoils along the rail after the lance pass.
24. `08-crown.dash-return-near-core` — phase 2; Successful dash counter opens the near lance core position.
25. `08-crown.shield-return-far-core` — phase 2; Returning reel shield counter releases the far reel core position.
26. `08-crown.dual-core-armor-actuate` — phase 2; Near and far core covers visibly open according to their own counters.
27. `08-crown.joust-core-hit` — phase 2; A damaged exposed core kicks its associated lance or reel assembly.
28. `08-crown.shield-pulse-reprise` — phase 2; Retained reels emit the returning shield pulse on alternating cycles.
29. `08-crown.dual-core-final-break` — phase defeat; Last surviving core breaks its drive attachment.
30. `08-crown.lance-safety-drop` — phase defeat; Powerless lance folds into the safe rail rest.
31. `08-crown.alpha-reels-release` — phase defeat; Alpha lets the reel handle go as all drums stop.
32. `08-crown.joust-sled-shutdown` — phase defeat; Rail sled settles at its stop with the original reels still readable.

## Feasibility, batches and verification

Campaign backlog: 11 bosses × 32 plus Codebreak × 36 = **388 planned distinct clips**. At four motion briefs per review batch this is **97 scheduling batches**: eight for each other boss and nine for Codebreak. A scheduling batch is not a claim that one generation call yields four usable clips. Generation calls, retries, credit cost and export labor remain unknown until approved references and timing are tested.

Codebreak landing, anchor and scanner motion is the first priority. Dave, Big Swole and Goldie have the initial procedural reference studies; the other nine now have captured gameplay reference guides; final look-development and critical-pose approval remain pending. Review every boss in both phases. Keep the timing/critical-pose gate closed before any final animation generation, even when the user permits credits or free models.

Each actual clip needs approved start/end poses, a distinct moving-part brief, source/generation record, gameplay-scale contact sheet, offline atlas path and frame rectangle, pivot, duration, event markers and muzzle/weak-point anchors. Validate asset bytes and distinct motion identity before adding it to `clips` and raising `actualVerifiedClipCount`. Independent script `art/rework/bosses/12-codebreak/validate-inventory.cjs` checks inventory shape and counts; it cannot substitute for human semantic motion review.

## Required boss-specific terminal animation

Primary terminal clip: `08-crown.dual-core-final-break` — **planned, not produced**. Outcome: machine-defeat. Last joust core breaks, lance folds into its safe rail rest and reels stop; Alpha lets go of the handle in the seated cockpit.

The terminal sequence is bespoke to this machine and must not be fulfilled with a shared explosion, fade or generic pilot-death animation. Production acceptance requires an actual verified clip under the primary terminal ID, the appropriate operator outcome, and offline start/clear/retry verification. The other defeat/escape motions in this pack support that sequence; planned IDs do not satisfy the requirement. No operator death is implied.

## Captured gameplay reference guide

`reference.svg` provides both phases as a contact sheet; `gameplay-scale.svg` provides two full 1280 × 720 viewport panels. Both display **GAMEPLAY REFERENCE CANDIDATE — LOOK DEVELOPMENT / HUMAN SIGNOFF PENDING**. They package the original reviewed PNG bytes as self-contained SVG image resources without raster editing or generation. They are gameplay guides, not final concept art, identity redesigns or approved motion poses.

Source report: `art/rework/review/report.json`, clean build `e1c9dbce3b3571ae0c24d2249b4d96468fbafbe3`. Original source images: `../../review/08-crown-p1.png`, `../../review/08-crown-p2.png`. The last neutral sample is paired with the report's diagnostic boss-framing camera. Overlay pilot feet/top and target bounds use world coordinates minus that diagnostic camera. Canvas captures are normalized to a 1280 × 720 viewport; original PNG dimensions and hashes are recorded in the manifest.

The frames do not demonstrate an earned clear or all conditional openings, transformations or terminal outcomes. Critical-pose labels come from the report's source-reviewed recommendations and still require human review against stage timing. Both phases need look development, operator articulation, bespoke transformation and terminal poses. All production counts and approvals remain unchanged at zero/false.

Refresh only from a clean capture report using `python3 art/rework/bosses/12-codebreak/refresh-reference-guides.py --expected-build <capture-build-prefix>`. The helper reads existing reviewed PNGs, embeds them unchanged and updates only the nine candidate guide packs. It does not call image models or spend credits.
