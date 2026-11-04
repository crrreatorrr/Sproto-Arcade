# Big Swole reference pack

Updated against implemented stage `08ed7ce` (integrated snapshot `2963a56`). These are procedural SVG layout studies, not Higgsfield output. No generation prompt was submitted and no generation ID exists. Both machines retain the neck joint and pilot cab; the pilot is a placement proxy, not approved character art.

Timing status: implementation timing candidate, human signoff pending. Actual values come from `stages/07-moonkeep/stage.js` and `timing.md`. Phase1 locks the jaw at cycle60; windup60, active18, recovery30; joint opens138–234 of240. Lift Y460±35 uses `sin(t/70)`. Phase2 has upper launch edge460 and landing1000 at Y420, giving a540px gap; recovery Y650 returns via the Y550 step. Crumbling span610..750 is inactive. Tick60 cues cracking. Only upper-launch departure, an air dash and far upper landing unlock the joint. Iron Fang returns at660 and every300 ticks. Manifest records exact cockpit, weakpoint and platform bounds. The neck pivot is explicitly an art-reference candidate.

Reported simulation evidence in the timing sheet: seed37 full clear763ticks with4HP and no powers;100 sampled legal non-dash second-jump timings cannot reach the far landing;15 dash timings14–28 pass. Lift carry, recovery→step→launch and lower-route rejection pass. These are deterministic fixture results reported by Packet F; they are not human playtest results or production art approval.

Production gate remains closed. Review cockpit visibility, cue poses, pivot and weakpoint alignment using `reference.svg` and the exact1280×720 panels in `gameplay-scale.svg`. Human timing, critical-pose and hit-area signoff must precede locked-camera separable-background generation. Final delivery still needs prompts, generation IDs, raster atlas frames/durations, event markers, and actual art anchors. Manifest has no production clips and productionApproved remains false.

## Distinct production animation inventory

User requirement: at least 30 distinct actual production animations per boss, with both phases reviewed. This pack plans 32 bespoke motions; **actual generated and verified production clips: 0**. A planned record is not an animation delivery. `clips` remains empty and `productionApproved` remains false. No generation or credit spending occurred.

The existing procedural SVG studies still require timing and critical-pose review. They count as zero production animations.

Each final clip must perform a different mechanism, operator action or outcome. Frames, duplicated loops, held poses, mirrored exports, speed changes, crops and alternate encodes cannot increase the count. A windup must visibly load a mechanism; an active clip must perform its attack; recovery must follow a different mechanical path. Unique IDs alone do not prove semantic distinctness. Fixed machines use articulation rather than invented walking.

1. `07-moonkeep.dragon-cab-seat` — phase 1; Big Swole settles into the visible siege dragon seat.
2. `07-moonkeep.dragon-neck-idle` — phase 1; Fixed dragon neck breathes through its articulated joints.
3. `07-moonkeep.lift-jaw-survey` — phase 1; Dragon jaw follows the moving lift along a shallow neck arc.
4. `07-moonkeep.swole-jaw-lever` — phase 1; Big Swole pulls the jaw ratchet lever.
5. `07-moonkeep.iron-fang-ratchet` — phase 1; Jaw ratchets open to signal the locked bite position.
6. `07-moonkeep.neck-coil-load` — phase 1; Neck compresses toward the targeted lift while the jaw holds.
7. `07-moonkeep.iron-fang-bite` — phase 1; Jaw lunges and closes at its committed target.
8. `07-moonkeep.fang-withdraw-recovery` — phase 1; Neck withdraws from the bite with the joint visibly unshielded.
9. `07-moonkeep.neck-joint-open` — phase 1; Joint guard separates to reveal the timed firing target.
10. `07-moonkeep.neck-joint-guard-close` — phase 1; Joint guard slides back under the returned jaw.
11. `07-moonkeep.neck-hit-buck` — phase 1; Exposed joint hit buckles the neck linkage and pilot seat.
12. `07-moonkeep.jaw-armor-clang` — phase 1; Armored jaw impact rocks the teeth without opening the joint.
13. `07-moonkeep.rear-leg-brace` — phase transition; Rear legs brace against the castle rampart.
14. `07-moonkeep.rampart-clamp-lock` — phase transition; Rear feet lock into stone anchor clamps.
15. `07-moonkeep.neck-pivot-relocation` — phase transition; Retained neck pivot lowers into the rampart-mounted support.
16. `07-moonkeep.tail-rampart-wrap` — phase transition; Tail winds around the rampart as the anchored body settles.
17. `07-moonkeep.anchored-neck-idle` — phase 2; Anchored neck and pilot seat make a constrained breathing loop.
18. `07-moonkeep.stone-stress-build` — phase 2; Rampart stones flex as the anchored tail loads them.
19. `07-moonkeep.rampart-crack-cue` — phase 2; Stone crack branches visibly across the upper break.
20. `07-moonkeep.tail-breaker-windup` — phase 2; Tail coils away from the marked crumbling span.
21. `07-moonkeep.upper-span-failure` — phase 2; Upper span visibly gives way while the lower recovery stays intact.
22. `07-moonkeep.rampart-breaker-strike` — phase 2; Tail strikes through the broken span without entering the recovery lane.
23. `07-moonkeep.anchored-tail-recovery` — phase 2; Tail retracts to the rampart clamps after its strike.
24. `07-moonkeep.upper-crossing-recognition` — phase 2; Big Swole turns the neck toward the successful far-upper landing.
25. `07-moonkeep.rampart-joint-unlock` — phase 2; Upper landing completion releases the neck target guard.
26. `07-moonkeep.rampart-joint-expose` — phase 2; Anchored joint becomes visibly exposed above the far landing.
27. `07-moonkeep.rampart-joint-hit` — phase 2; Joint damage jerks the anchored neck against its rear clamps.
28. `07-moonkeep.iron-fang-return` — phase 2; Anchored neck performs the returning bite after the isolated gap lesson.
29. `07-moonkeep.neck-final-separation` — phase defeat; Final joint hit disconnects the neck drive linkage.
30. `07-moonkeep.dragon-jaw-shutdown` — phase defeat; Jaw loses power and rests open against its supports.
31. `07-moonkeep.swole-seat-slump` — phase defeat; Big Swole slumps in the retained pilot seat.
32. `07-moonkeep.rampart-clamp-rest` — phase defeat; Anchored body settles without disturbing the recovery platform.

## Feasibility, batches and verification

Campaign backlog: 11 bosses × 32 plus Codebreak × 36 = **388 planned distinct clips**. At four motion briefs per review batch this is **97 scheduling batches**: eight for each other boss and nine for Codebreak. A scheduling batch is not a claim that one generation call yields four usable clips. Generation calls, retries, credit cost and export labor remain unknown until approved references and timing are tested.

Codebreak landing, anchor and scanner motion is the first priority. Dave, Big Swole and Goldie have the initial procedural reference studies; reference boards for the other nine remain pending. Review every boss in both phases. Keep the timing/critical-pose gate closed before any final animation generation, even when the user permits credits or free models.

Each actual clip needs approved start/end poses, a distinct moving-part brief, source/generation record, gameplay-scale contact sheet, offline atlas path and frame rectangle, pivot, duration, event markers and muzzle/weak-point anchors. Validate asset bytes and distinct motion identity before adding it to `clips` and raising `actualVerifiedClipCount`. Independent script `art/rework/bosses/12-codebreak/validate-inventory.cjs` checks inventory shape and counts; it cannot substitute for human semantic motion review.

## Required boss-specific terminal animation

Primary terminal clip: `07-moonkeep.neck-final-separation` — **planned, not produced**. Outcome: machine-defeat. Dragon neck drive disconnects and jaw rests on its supports while the rear clamps hold; Big Swole stays in the protected seat.

The terminal sequence is bespoke to this machine and must not be fulfilled with a shared explosion, fade or generic pilot-death animation. Production acceptance requires an actual verified clip under the primary terminal ID, the appropriate operator outcome, and offline start/clear/retry verification. The other defeat/escape motions in this pack support that sequence; planned IDs do not satisfy the requirement. No operator death is implied.
