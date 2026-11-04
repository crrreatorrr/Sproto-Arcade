# Bitcoin Sheriff / Warrant Rig → Summit Lockdown

This pack currently contains an animation production inventory only. No silhouette, final clip, atlas or Higgsfield generation is supplied. Source timing is the implemented `stages/12-codebreak/timing.md` at integrated snapshot `7c62524`. Timing and critical poses remain candidates pending human signoff.

## Distinct production animation inventory

User requirement: at least 30 distinct actual production animations per boss, with both phases reviewed. This pack plans 36 bespoke motions; **actual generated and verified production clips: 0**. A planned record is not an animation delivery. `clips` remains empty and `productionApproved` remains false. No generation or credit spending occurred.

Captured gameplay reference candidates are now supplied; final concept/look development and critical-pose artwork remain unapproved. This inventory and its guides do not imply visual, timing or pose approval.

Each final clip must perform a different mechanism, operator action or outcome. Frames, duplicated loops, held poses, mirrored exports, speed changes, crops and alternate encodes cannot increase the count. A windup must visibly load a mechanism; an active clip must perform its attack; recovery must follow a different mechanical path. Unique IDs alone do not prove semantic distinctness. Fixed machines use articulation rather than invented walking.

1. `12-codebreak.warrant-rig-pursuit-idle` — phase 1; Warrant rig pursuit idle.
2. `12-codebreak.operator-pursuit-throttle-pull` — phase 1; Operator pursuit throttle pull.
3. `12-codebreak.left-rocket-lift-acceleration` — phase 1; Left rocket lift acceleration.
4. `12-codebreak.right-rocket-banking-correction` — phase 1; Right rocket banking correction.
5. `12-codebreak.vertical-pursuit-brake` — phase 1; Vertical pursuit brake.
6. `12-codebreak.reticle-arm-unfold` — phase 1; Reticle arm unfold.
7. `12-codebreak.reticle-aim-left-lock` — phase 1; Reticle aim-left lock.
8. `12-codebreak.reticle-aim-right-lock` — phase 1; Reticle aim-right lock.
9. `12-codebreak.warrant-stamp-windup` — phase 1; Warrant stamp windup.
10. `12-codebreak.warrant-drop-release` — phase 1; Warrant drop release.
11. `12-codebreak.drop-arm-recoil` — phase 1; Drop arm recoil.
12. `12-codebreak.reticle-arm-retract` — phase 1; Reticle arm retract.
13. `12-codebreak.upper-warrant-front-deploy` — phase 1; Upper warrant-front deploy.
14. `12-codebreak.upper-front-charge-hold` — phase 1; Upper-front charge hold.
15. `12-codebreak.upper-front-release` — phase 1; Upper-front release.
16. `12-codebreak.upper-front-cooldown` — phase 1; Upper-front cooldown.
17. `12-codebreak.pursuit-hit-flinch` — phase 1; Pursuit hit flinch.
18. `12-codebreak.summit-approach-deceleration` — phase transition; Summit approach deceleration.
19. `12-codebreak.landing-compression` — phase transition; Landing compression.
20. `12-codebreak.anchoring-feet-deployment` — phase transition; Anchoring feet deployment.
21. `12-codebreak.anchored-cabin-settle` — phase transition; Anchored cabin settle.
22. `12-codebreak.summit-operator-ready-idle` — phase 2; Summit operator ready idle.
23. `12-codebreak.scanner-shoulder-unfold` — phase 2; Scanner shoulder unfold.
24. `12-codebreak.scanner-emitter-hinge-opening` — phase 2; Scanner emitter hinge opening.
25. `12-codebreak.scanner-lock-on-windup` — phase 2; Scanner lock-on windup.
26. `12-codebreak.scanner-front-release-recoil` — phase 2; Scanner front release recoil.
27. `12-codebreak.scanner-sustained-sweep` — phase 2; Scanner sustained sweep.
28. `12-codebreak.scanner-emitter-retract` — phase 2; Scanner emitter retract.
29. `12-codebreak.scanner-arm-fold-recovery` — phase 2; Scanner arm fold recovery.
30. `12-codebreak.counter-overload-stagger` — phase 2; Counter overload stagger.
31. `12-codebreak.vent-shutter-unlock-open` — phase 2; Vent shutter unlock/open.
32. `12-codebreak.exposed-core-breathing-hold` — phase 2; Exposed-core breathing hold.
33. `12-codebreak.core-shot-reaction` — phase 2; Core shot reaction.
34. `12-codebreak.vent-shutter-relock` — phase 2; Vent shutter relock.
35. `12-codebreak.rig-defeat-shutdown` — phase defeat; Rig defeat shutdown.
36. `12-codebreak.operator-defeat-escape` — phase defeat; Operator defeat/escape.

## Feasibility, batches and verification

Campaign backlog: 11 bosses × 32 plus Codebreak × 36 = **388 planned distinct clips**. At four motion briefs per review batch this is **97 scheduling batches**: eight for each other boss and nine for Codebreak. A scheduling batch is not a claim that one generation call yields four usable clips. Generation calls, retries, credit cost and export labor remain unknown until approved references and timing are tested.

Codebreak landing, anchor and scanner motion is the first priority. Dave, Big Swole and Goldie have the initial procedural reference studies; the other nine now have captured gameplay reference guides; final look-development and critical-pose approval remain pending. Review every boss in both phases. Keep the timing/critical-pose gate closed before any final animation generation, even when the user permits credits or free models.

Each actual clip needs approved start/end poses, a distinct moving-part brief, source/generation record, gameplay-scale contact sheet, offline atlas path and frame rectangle, pivot, duration, event markers and muzzle/weak-point anchors. Validate asset bytes and distinct motion identity before adding it to `clips` and raising `actualVerifiedClipCount`. Independent script `art/rework/bosses/12-codebreak/validate-inventory.cjs` checks inventory shape and counts; it cannot substitute for human semantic motion review.

### Exact Codebreak requests and special distinctness checks

All 36 titles follow Packet F timing request at `9e8b3d1`. The left and right reticle locks require different asymmetric joint paths; mirrored exports are one motion. Left lift acceleration and right bank correction have different thrust-vane actions. Charge and breathing holds must animate their own accumulator/bellows mechanisms; static padded frames cannot count. Landing remains continuous within the touchdown clip, with brake hover, anchor deployment and suspension settle as separate physical actions. Smooth procedural placeholder motion is still not a production clip.

## Required boss-specific terminal animation

Primary terminal clip: `12-codebreak.rig-defeat-shutdown` — **planned, not produced**. Outcome: machine-defeat. Anchored Sheriff rig loses core power, scanner folds onto its mechanical rest and thruster afterglow fades; the Sheriff releases the console and can withdraw safely.

The terminal sequence is bespoke to this machine and must not be fulfilled with a shared explosion, fade or generic pilot-death animation. Production acceptance requires an actual verified clip under the primary terminal ID, the appropriate operator outcome, and offline start/clear/retry verification. The other defeat/escape motions in this pack support that sequence; planned IDs do not satisfy the requirement. No operator death is implied.

## Captured gameplay reference guide

`reference.svg` provides both phases as a contact sheet; `gameplay-scale.svg` provides two full 1280 × 720 viewport panels. Both display **GAMEPLAY REFERENCE CANDIDATE — LOOK DEVELOPMENT / HUMAN SIGNOFF PENDING**. They package the original reviewed PNG bytes as self-contained SVG image resources without raster editing or generation. They are gameplay guides, not final concept art, identity redesigns or approved motion poses.

Source report: `art/rework/review/report.json`, clean build `e1c9dbce3b3571ae0c24d2249b4d96468fbafbe3`. Original source images: `../../review/12-codebreak-p1.png`, `../../review/12-codebreak-p2.png`. The last neutral sample is paired with the report's diagnostic boss-framing camera. Overlay pilot feet/top and target bounds use world coordinates minus that diagnostic camera. Canvas captures are normalized to a 1280 × 720 viewport; original PNG dimensions and hashes are recorded in the manifest.

The frames do not demonstrate an earned clear or all conditional openings, transformations or terminal outcomes. Critical-pose labels come from the report's source-reviewed recommendations and still require human review against stage timing. Both phases need look development, operator articulation, bespoke transformation and terminal poses. All production counts and approvals remain unchanged at zero/false.

Refresh only from a clean capture report using `python3 art/rework/bosses/12-codebreak/refresh-reference-guides.py --expected-build <capture-build-prefix>`. The helper reads existing reviewed PNGs, embeds them unchanged and updates only the nine candidate guide packs. It does not call image models or spend credits.
