# Halloween 2008 / Lantern Harvester → Harvest Express

This pack currently contains an animation production inventory only. No silhouette, final clip, atlas or Higgsfield generation is supplied. Source timing is the implemented `stages/04-ranch/timing.md` at integrated snapshot `7c62524`. Timing and critical poses remain candidates pending human signoff.

## Distinct production animation inventory

User requirement: at least 30 distinct actual production animations per boss, with both phases reviewed. This pack plans 32 bespoke motions; **actual generated and verified production clips: 0**. A planned record is not an animation delivery. `clips` remains empty and `productionApproved` remains false. No generation or credit spending occurred.

Reference artwork and gameplay-scale pose boards have not yet been created for this pack. Its inventory does not imply visual, timing or pose approval.

Each final clip must perform a different mechanism, operator action or outcome. Frames, duplicated loops, held poses, mirrored exports, speed changes, crops and alternate encodes cannot increase the count. A windup must visibly load a mechanism; an active clip must perform its attack; recovery must follow a different mechanical path. Unique IDs alone do not prove semantic distinctness. Fixed machines use articulation rather than invented walking.

1. `04-ranch.harvester-approach` — phase 1; Harvester rolls into the field with the lantern cab leading.
2. `04-ranch.lantern-cab-idle` — phase 1; Cab lantern swings gently while the chassis advances.
3. `04-ranch.cutter-comb-cycle` — phase 1; Harvester cutter comb opens and closes over harvested ground.
4. `04-ranch.pilot-lantern-lift` — phase 1; Halloween lifts the lantern from the cab to call the attack.
5. `04-ranch.harvest-roll-cue` — phase 1; Lantern swing broadens and the cutter teeth rattle in silhouette.
6. `04-ranch.roller-feed-load` — phase 1; Feeder drum draws a roller into the launch trough.
7. `04-ranch.harvest-roll-release` — phase 1; Cutter trough ejects a rolling ground hazard.
8. `04-ranch.cutter-recoil-clear` — phase 1; Cutter withdraws and feeder clears the empty trough.
9. `04-ranch.harvester-vent-breathe` — phase 1; Forward vent grille opens during the moving approach.
10. `04-ranch.vent-protection-reseat` — phase 1; Vent guard settles back onto its rotating guides.
11. `04-ranch.harvester-drive-hit` — phase 1; A vent hit jolts the advancing harvester drive.
12. `04-ranch.cutter-armor-contact` — phase 1; A glancing hit snaps a cutter guard back against its stop.
13. `04-ranch.harvester-train-approach` — phase transition; Harvester chassis aligns with the moving train coupling.
14. `04-ranch.lantern-cab-transfer` — phase transition; Retained lantern cab slides forward toward the engine frame.
15. `04-ranch.coupling-jaw-engage` — phase transition; Train coupling jaws close around the harvester chassis.
16. `04-ranch.express-drive-takeup` — phase transition; Engine wheels take up the train load and settle into forward travel.
17. `04-ranch.express-wheel-cycle` — phase 2; Moving engine wheels and rods loop with the train motion.
18. `04-ranch.lantern-engine-sway` — phase 2; Retained lantern cab sways over the running engine.
19. `04-ranch.uncouple-chain-cue` — phase 2; Halloween raises the chain handle to announce separation.
20. `04-ranch.coupling-latch-load` — phase 2; Car coupling spring compresses before the latch releases.
21. `04-ranch.car-separation-commit` — phase 2; Coupling pin pulls free and the rear car visibly separates.
22. `04-ranch.uncouple-dash-front` — phase 2; Mechanical coupling field deploys its marked dash-only barrier.
23. `04-ranch.chain-release-recovery` — phase 2; Chain falls slack while the train settles after uncoupling.
24. `04-ranch.coupling-counter-feedback` — phase 2; Successful dash crossing breaks the barrier contacts at the coupling.
25. `04-ranch.linkage-guard-unlock` — phase 2; Engine linkage guard releases after the crossing objective.
26. `04-ranch.engine-linkage-expose` — phase 2; Running linkage swings clear to become the firing target.
27. `04-ranch.engine-linkage-hit` — phase 2; Exposed linkage takes a hit and knocks its connecting rod sideways.
28. `04-ranch.harvest-roll-reprise` — phase 2; Engine-mounted feeder restarts the familiar roller launch after introduction.
29. `04-ranch.engine-linkage-fail` — phase defeat; Final linkage hit breaks the rod from its drive pin.
30. `04-ranch.express-wheel-coast` — phase defeat; Train wheels coast down without the powered linkage.
31. `04-ranch.lantern-pilot-surrender` — phase defeat; Halloween lowers the lantern and releases the chain.
32. `04-ranch.harvester-engine-rest` — phase defeat; Engine settles onto its running gear with the lantern still visible.

## Feasibility, batches and verification

Campaign backlog: 11 bosses × 32 plus Codebreak × 36 = **388 planned distinct clips**. At four motion briefs per review batch this is **97 scheduling batches**: eight for each other boss and nine for Codebreak. A scheduling batch is not a claim that one generation call yields four usable clips. Generation calls, retries, credit cost and export labor remain unknown until approved references and timing are tested.

Codebreak landing, anchor and scanner motion is the first priority. Dave, Big Swole and Goldie have the initial procedural reference studies; reference boards for the other nine remain pending. Review every boss in both phases. Keep the timing/critical-pose gate closed before any final animation generation, even when the user permits credits or free models.

Each actual clip needs approved start/end poses, a distinct moving-part brief, source/generation record, gameplay-scale contact sheet, offline atlas path and frame rectangle, pivot, duration, event markers and muzzle/weak-point anchors. Validate asset bytes and distinct motion identity before adding it to `clips` and raising `actualVerifiedClipCount`. Independent script `art/rework/bosses/12-codebreak/validate-inventory.cjs` checks inventory shape and counts; it cannot substitute for human semantic motion review.

## Required boss-specific terminal animation

Primary terminal clip: `04-ranch.engine-linkage-fail` — **planned, not produced**. Outcome: machine-defeat. Engine linkage shears and drive wheels coast to a halt with the lantern cab intact; Halloween lowers the lantern and releases the chain.

The terminal sequence is bespoke to this machine and must not be fulfilled with a shared explosion, fade or generic pilot-death animation. Production acceptance requires an actual verified clip under the primary terminal ID, the appropriate operator outcome, and offline start/clear/retry verification. The other defeat/escape motions in this pack support that sequence; planned IDs do not satisfy the requirement. No operator death is implied.
