# Goldie reference pack

Base integration 174bc99; read the approved implementation brief. These SVG silhouettes are procedural layout studies created locally, not Higgsfield output. No generation prompt was submitted and no generation ID exists. Both phases retain the designated machine component and a visible pilot placement proxy. Pilot shape is not approved character art.

Timing labels transcribed from `stages/11-rooftop/timing.md`; inspect that file and the simulation before approving final clips.

Production gate remains closed. Review cockpit visibility, pivot, cue pose, weak point and collision bounds at 1280×720 gameplay size. Obtain encounter timing and critical pose signoff before generating locked-camera separable-background clips. Future delivery needs actual prompts, generation IDs, atlas frames/durations, release/recovery event markers, and exact muzzle/weak-point anchors. The manifest deliberately has no production clips.

## Distinct production animation inventory

User requirement: at least 30 distinct actual production animations per boss, with both phases reviewed. This pack plans 32 bespoke motions; **actual generated and verified production clips: 0**. A planned record is not an animation delivery. `clips` remains empty and `productionApproved` remains false. No generation or credit spending occurred.

The existing procedural SVG studies still require timing and critical-pose review. They count as zero production animations.

Each final clip must perform a different mechanism, operator action or outcome. Frames, duplicated loops, held poses, mirrored exports, speed changes, crops and alternate encodes cannot increase the count. A windup must visibly load a mechanism; an active clip must perform its attack; recovery must follow a different mechanical path. Unique IDs alone do not prove semantic distinctness. Fixed machines use articulation rather than invented walking.

1. `11-rooftop.jetpack-pursuit-entry` — phase 1; Goldie rises behind the player on the twin-nozzle jetpack.
2. `11-rooftop.jetpack-hover-balance` — phase 1; Jetpack nozzles alternate thrust to stabilize Goldie in pursuit.
3. `11-rooftop.pursuit-bank-adjust` — phase 1; Goldie banks the jetpack laterally to follow the rooftop route.
4. `11-rooftop.aiming-arm-track` — phase 1; Goldie moves his arm muzzle to track the eligible aimed target.
5. `11-rooftop.afterburner-nozzle-tilt` — phase 1; Jetpack nozzle visibly tilts toward the announced burst direction.
6. `11-rooftop.arm-volley-windup` — phase 1; Goldie braces his arm and loads the committed aimed volley.
7. `11-rooftop.afterburner-burst-release` — phase 1; Arm muzzle fires the pursuit volley from behind.
8. `11-rooftop.arm-kick-recovery` — phase 1; Goldie absorbs the shot recoil and lowers his arm.
9. `11-rooftop.jump-gap-overwatch` — phase 1; Goldie climbs above the first teaching jump to keep the route visible.
10. `11-rooftop.route-fork-survey` — phase 1; Goldie leans toward the selected street or upper-roof route.
11. `11-rooftop.upper-cache-observe` — phase 1; Goldie looks up at a player taking the optional upper cache.
12. `11-rooftop.marked-gap-callout` — phase 1; Jetpack banks aside as the paired dash chevrons appear.
13. `11-rooftop.jetpack-wing-latch-release` — phase transition; Jetpack outer latches release the folded glider wings.
14. `11-rooftop.glider-wing-unfold` — phase transition; Wings unfold from the same retained jetpack housing.
15. `11-rooftop.glider-thruster-pivot` — phase transition; Twin nozzles pivot from hover trim to forward glider drive.
16. `11-rooftop.glider-overtake` — phase transition; Goldie accelerates ahead to take the extraction intercept position.
17. `11-rooftop.glider-cruise-idle` — phase 2; Deployed wings flex while Goldie holds a steady lead.
18. `11-rooftop.bank-ahead-to-behind` — phase 2; Glider turns across the route to change the volley approach side.
19. `11-rooftop.cutoff-bank-cue` — phase 2; Goldie gives a wide bank to telegraph the final intercept.
20. `11-rooftop.intercept-arm-load` — phase 2; Arm muzzle loads while the glider holds the final crossing line.
21. `11-rooftop.cutoff-line-commit` — phase 2; Glider wing and nozzle trim lock onto the fixed intercept corridor.
22. `11-rooftop.cutoff-pass-release` — phase 2; Goldie sweeps the marked intercept across the final dash crossing.
23. `11-rooftop.glider-bank-recovery` — phase 2; Wings roll out of the intercept bank after the pass.
24. `11-rooftop.final-dash-miss` — phase 2; Goldie twists to look at the player who dashed past the intercept.
25. `11-rooftop.extraction-exit-approach` — phase 2; Glider chases alongside the final exit roof without blocking its landing.
26. `11-rooftop.afterburner-return-from-rear` — phase 2; Retained jetpack performs the familiar rear burst during extraction.
27. `11-rooftop.route-loss-reaction` — phase 2; Goldie loses altitude briefly when the player extends the route lead.
28. `11-rooftop.intercept-reposition` — phase 2; Glider climbs clear and repositions after a failed intercept attempt.
29. `11-rooftop.exit-player-escape` — phase defeat; Goldie brakes as the player reaches the extraction exit.
30. `11-rooftop.jetpack-power-down` — phase defeat; Jetpack exhaust lowers from chase thrust to a safe hover.
31. `11-rooftop.goldie-concede-gesture` — phase defeat; Goldie lowers his aiming arm and gives up the pursuit.
32. `11-rooftop.glider-departure` — phase defeat; Goldie banks away with unfolded wings and retained jetpack visible.

## Feasibility, batches and verification

Campaign backlog: 11 bosses × 32 plus Codebreak × 36 = **388 planned distinct clips**. At four motion briefs per review batch this is **97 scheduling batches**: eight for each other boss and nine for Codebreak. A scheduling batch is not a claim that one generation call yields four usable clips. Generation calls, retries, credit cost and export labor remain unknown until approved references and timing are tested.

Codebreak landing, anchor and scanner motion is the first priority. Dave, Big Swole and Goldie have the initial procedural reference studies; reference boards for the other nine remain pending. Review every boss in both phases. Keep the timing/critical-pose gate closed before any final animation generation, even when the user permits credits or free models.

Each actual clip needs approved start/end poses, a distinct moving-part brief, source/generation record, gameplay-scale contact sheet, offline atlas path and frame rectangle, pivot, duration, event markers and muzzle/weak-point anchors. Validate asset bytes and distinct motion identity before adding it to `clips` and raising `actualVerifiedClipCount`. Independent script `art/rework/bosses/12-codebreak/validate-inventory.cjs` checks inventory shape and counts; it cannot substitute for human semantic motion review.

## Required boss-specific terminal animation

Primary terminal clip: `11-rooftop.glider-departure` — **planned, not produced**. Outcome: escape. Goldie loses the final intercept as the player reaches extraction, lowers his arm and banks away with wings and jetpack intact; this is escape, not death.

The terminal sequence is bespoke to this machine and must not be fulfilled with a shared explosion, fade or generic pilot-death animation. Production acceptance requires an actual verified clip under the primary terminal ID, the appropriate operator outcome, and offline start/clear/retry verification. The other defeat/escape motions in this pack support that sequence; planned IDs do not satisfy the requirement. No operator death is implied.
