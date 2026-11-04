# Bongraker / Relay Walker → Gate Spider

This pack currently contains an animation production inventory only. No silhouette, final clip, atlas or Higgsfield generation is supplied. Source timing is the implemented `stages/06-circuit/timing.md` at integrated snapshot `7c62524`. Timing and critical poses remain candidates pending human signoff.

## Distinct production animation inventory

User requirement: at least 30 distinct actual production animations per boss, with both phases reviewed. This pack plans 32 bespoke motions; **actual generated and verified production clips: 0**. A planned record is not an animation delivery. `clips` remains empty and `productionApproved` remains false. No generation or credit spending occurred.

Reference artwork and gameplay-scale pose boards have not yet been created for this pack. Its inventory does not imply visual, timing or pose approval.

Each final clip must perform a different mechanism, operator action or outcome. Frames, duplicated loops, held poses, mirrored exports, speed changes, crops and alternate encodes cannot increase the count. A windup must visibly load a mechanism; an active clip must perform its attack; recovery must follow a different mechanical path. Unique IDs alone do not prove semantic distinctness. Fixed machines use articulation rather than invented walking.

1. `06-circuit.relay-walker-mount` — phase 1; Bongraker settles into the relay walker cockpit.
2. `06-circuit.cable-loop-idle` — phase 1; Fixed walker cable loops shift with a low current pulse.
3. `06-circuit.relay-contact-test` — phase 1; Relay contact arms tap their stops during a power check.
4. `06-circuit.bongraker-routing-lever` — phase 1; Bongraker pulls the routing lever toward a visible cable.
5. `06-circuit.relay-arc-cue` — phase 1; Cable indicator starts a visible trip from cockpit toward relay.
6. `06-circuit.cable-charge-travel` — phase 1; Charge bulge travels along the chosen physical cable.
7. `06-circuit.relay-arc-discharge` — phase 1; Relay contact opens and releases the low electrical arc.
8. `06-circuit.arc-coil-recovery` — phase 1; Relay coil unwinds and its contact returns to rest.
9. `06-circuit.dual-relay-core-unlock` — phase 1; Both broken relay catches release the walker core casing.
10. `06-circuit.core-casing-open` — phase 1; Walker core armor swings aside to expose the damage target.
11. `06-circuit.walker-core-hit` — phase 1; Exposed core impact shudders the cockpit frame and cable roots.
12. `06-circuit.relay-break-kick` — phase 1; Destroyed relay contact snaps and its cable goes slack.
13. `06-circuit.walker-leg-fold` — phase transition; Walker support legs fold upward toward the gate frame.
14. `06-circuit.cockpit-gate-seat` — phase transition; Same cockpit slides into the gate retaining socket.
15. `06-circuit.spider-cable-spread` — phase transition; Retained cables spread across the gate as articulated spider limbs.
16. `06-circuit.node-transfer-bus-engage` — phase transition; Gate bus contacts close and route power to the first live node.
17. `06-circuit.gate-cable-tension-idle` — phase 2; Fixed gate spider adjusts tension on its spread cable limbs.
18. `06-circuit.live-node-selector` — phase 2; Node selector bridge physically travels toward the next relay.
19. `06-circuit.firewall-chevron-cue` — phase 2; Gate emitters split open into the marked firewall silhouette.
20. `06-circuit.firewall-capacitor-load` — phase 2; Gate capacitors swell as the live cable bus charges.
21. `06-circuit.firewall-node-commit` — phase 2; Selector clamps onto the active node before front release.
22. `06-circuit.firewall-transfer-release` — phase 2; Gate emits the full-height dash-only firewall front.
23. `06-circuit.firewall-coil-recovery` — phase 2; Gate coils contract after the travelling firewall.
24. `06-circuit.dash-counter-contact-trip` — phase 2; Successful dash counter trips the live relay contact open.
25. `06-circuit.live-relay-break` — phase 2; Breaking the active relay ejects its transfer fuse.
26. `06-circuit.gate-core-expose` — phase 2; Completing both live nodes opens the gate core shielding.
27. `06-circuit.gate-core-hit` — phase 2; Exposed gate core hit pulls its spread cables inward.
28. `06-circuit.missed-transfer-reset` — phase 2; Missed relay window transfers the selector and reseats the relay contacts.
29. `06-circuit.gate-core-final-short` — phase defeat; Final core hit shorts the central transfer bus.
30. `06-circuit.spider-cable-collapse` — phase defeat; Powerless spider cables sag inward without releasing the cockpit.
31. `06-circuit.bongraker-lever-stop` — phase defeat; Bongraker yanks the dead lever once and releases it.
32. `06-circuit.gate-safe-shutdown` — phase defeat; Gate power fades and the retained cockpit settles in its socket.

## Feasibility, batches and verification

Campaign backlog: 11 bosses × 32 plus Codebreak × 36 = **388 planned distinct clips**. At four motion briefs per review batch this is **97 scheduling batches**: eight for each other boss and nine for Codebreak. A scheduling batch is not a claim that one generation call yields four usable clips. Generation calls, retries, credit cost and export labor remain unknown until approved references and timing are tested.

Codebreak landing, anchor and scanner motion is the first priority. Dave, Big Swole and Goldie have the initial procedural reference studies; reference boards for the other nine remain pending. Review every boss in both phases. Keep the timing/critical-pose gate closed before any final animation generation, even when the user permits credits or free models.

Each actual clip needs approved start/end poses, a distinct moving-part brief, source/generation record, gameplay-scale contact sheet, offline atlas path and frame rectangle, pivot, duration, event markers and muzzle/weak-point anchors. Validate asset bytes and distinct motion identity before adding it to `clips` and raising `actualVerifiedClipCount`. Independent script `art/rework/bosses/12-codebreak/validate-inventory.cjs` checks inventory shape and counts; it cannot substitute for human semantic motion review.

## Required boss-specific terminal animation

Primary terminal clip: `06-circuit.gate-core-final-short` — **planned, not produced**. Outcome: machine-defeat. Gate transfer bus shorts and spider cables sag inward as power fades; Bongraker releases the dead lever in the retained cockpit.

The terminal sequence is bespoke to this machine and must not be fulfilled with a shared explosion, fade or generic pilot-death animation. Production acceptance requires an actual verified clip under the primary terminal ID, the appropriate operator outcome, and offline start/clear/retry verification. The other defeat/escape motions in this pack support that sequence; planned IDs do not satisfy the requirement. No operator death is implied.
