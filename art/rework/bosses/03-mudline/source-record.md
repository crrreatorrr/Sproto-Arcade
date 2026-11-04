# Crapto / Sludge Dredger → Floodgate Pump

This pack currently contains an animation production inventory only. No silhouette, final clip, atlas or Higgsfield generation is supplied. Source timing is the implemented `stages/03-mudline/timing.md` at integrated snapshot `7c62524`. Timing and critical poses remain candidates pending human signoff.

## Distinct production animation inventory

User requirement: at least 30 distinct actual production animations per boss, with both phases reviewed. This pack plans 32 bespoke motions; **actual generated and verified production clips: 0**. A planned record is not an animation delivery. `clips` remains empty and `productionApproved` remains false. No generation or credit spending occurred.

Reference artwork and gameplay-scale pose boards have not yet been created for this pack. Its inventory does not imply visual, timing or pose approval.

Each final clip must perform a different mechanism, operator action or outcome. Frames, duplicated loops, held poses, mirrored exports, speed changes, crops and alternate encodes cannot increase the count. A windup must visibly load a mechanism; an active clip must perform its attack; recovery must follow a different mechanical path. Unique IDs alone do not prove semantic distinctness. Fixed machines use articulation rather than invented walking.

1. `03-mudline.dredger-saucer-arrival` — phase 1; Dredger floats into place with Crapto visible above its glass belly.
2. `03-mudline.glass-belly-idle` — phase 1; Glass belly slurry circulates while the floating hull rocks.
3. `03-mudline.intake-paddle-cycle` — phase 1; Intake paddles turn and draw sludge into the collector.
4. `03-mudline.crapto-nozzle-trim` — phase 1; Crapto adjusts the altitude lever while watching the nozzle.
5. `03-mudline.glass-fill-cue` — phase 1; Sludge rises visibly through the glass belly before the lock.
6. `03-mudline.nozzle-altitude-commit` — phase 1; Nozzle rotates once to the target altitude and clamps in place.
7. `03-mudline.sludge-belch-release` — phase 1; Committed nozzle expels its sludge projectile.
8. `03-mudline.belly-drain-recovery` — phase 1; Belly fluid level drops and the nozzle coughs back into its rest.
9. `03-mudline.glass-vent-open` — phase 1; Belly vent plates spread to reveal the punish window.
10. `03-mudline.glass-vent-close` — phase 1; Belly plates reseal as fresh slurry returns.
11. `03-mudline.glass-hit-pressure-ripple` — phase 1; Exposed belly hit sends a visible pressure ripple through the slurry.
12. `03-mudline.intake-armor-deflect` — phase 1; Intake rim absorbs a glancing shot with a brief mechanical kick.
13. `03-mudline.dredger-side-roll` — phase transition; Floating dredger rolls sideways toward the floodgate mount.
14. `03-mudline.intake-dock-couple` — phase transition; Retained intake connects into the stationary floodgate pipe.
15. `03-mudline.glass-belly-pump-seat` — phase transition; Glass belly slides into the gate pump retaining frame.
16. `03-mudline.shutter-linkage-deploy` — phase transition; Upper and lower shutter links unfold around the same cabin.
17. `03-mudline.pump-rotor-idle` — phase 2; Fixed pump rotor and glass fluid continue a slow circulation.
18. `03-mudline.shutter-drain-transfer` — phase 2; Drain indicators mechanically travel toward the selected shutter.
19. `03-mudline.upper-latch-cue` — phase 2; Upper latch lever raises with an unmistakable high-route silhouette.
20. `03-mudline.lower-shutter-load` — phase 2; Lower shutter drops toward the bounce lane while its spring loads.
21. `03-mudline.backflush-front-lock` — phase 2; Pressure manifold locks into the marked front configuration.
22. `03-mudline.backflush-release` — phase 2; Pump releases the full-height backflush curtain.
23. `03-mudline.backflush-rotor-recovery` — phase 2; Rotor decelerates and draws displaced liquid back through the intake.
24. `03-mudline.shutter-route-release` — phase 2; Broken upper latch or lower intake releases the paired shutter linkage.
25. `03-mudline.clean-cycle-primer` — phase 2; Clean introductory shutter release primes the pump without a front.
26. `03-mudline.pump-vent-expose` — phase 2; Pump belly vent petals open after the eligible release or dash counter.
27. `03-mudline.pump-core-hit-shudder` — phase 2; Exposed pump core rocks within the floodgate retaining frame.
28. `03-mudline.shutter-round-reset` — phase 2; Both shutters and latch mechanisms rearm after a missed or spent window.
29. `03-mudline.glass-pump-final-crack` — phase defeat; Final core hit fractures the glass vessel into a supported cracked shell.
30. `03-mudline.floodgate-safe-drain` — phase defeat; Floodgate drains remaining sludge away from the fighting lane.
31. `03-mudline.crapto-controls-slump` — phase defeat; Crapto slumps over the powerless pump console.
32. `03-mudline.pump-mount-shutdown` — phase defeat; Docked rotor settles with retained intake and glass belly still identifiable.

## Feasibility, batches and verification

Campaign backlog: 11 bosses × 32 plus Codebreak × 36 = **388 planned distinct clips**. At four motion briefs per review batch this is **97 scheduling batches**: eight for each other boss and nine for Codebreak. A scheduling batch is not a claim that one generation call yields four usable clips. Generation calls, retries, credit cost and export labor remain unknown until approved references and timing are tested.

Codebreak landing, anchor and scanner motion is the first priority. Dave, Big Swole and Goldie have the initial procedural reference studies; reference boards for the other nine remain pending. Review every boss in both phases. Keep the timing/critical-pose gate closed before any final animation generation, even when the user permits credits or free models.

Each actual clip needs approved start/end poses, a distinct moving-part brief, source/generation record, gameplay-scale contact sheet, offline atlas path and frame rectangle, pivot, duration, event markers and muzzle/weak-point anchors. Validate asset bytes and distinct motion identity before adding it to `clips` and raising `actualVerifiedClipCount`. Independent script `art/rework/bosses/12-codebreak/validate-inventory.cjs` checks inventory shape and counts; it cannot substitute for human semantic motion review.

## Required boss-specific terminal animation

Primary terminal clip: `03-mudline.glass-pump-final-crack` — **planned, not produced**. Outcome: machine-defeat. Glass pump vessel cracks within its supporting frame and sludge drains safely through the floodgate; Crapto remains inside the powerless cab.

The terminal sequence is bespoke to this machine and must not be fulfilled with a shared explosion, fade or generic pilot-death animation. Production acceptance requires an actual verified clip under the primary terminal ID, the appropriate operator outcome, and offline start/clear/retry verification. The other defeat/escape motions in this pack support that sequence; planned IDs do not satisfy the requirement. No operator death is implied.
