# Fat Head Dave reference pack

Base integration 174bc99; read the approved implementation brief. These SVG silhouettes are procedural layout studies created locally, not Higgsfield output. No generation prompt was submitted and no generation ID exists. Both phases retain the designated machine component and a visible pilot placement proxy. Pilot shape is not approved character art.

Timing labels transcribed from `stages/01-marina/timing.md`; inspect that file and the simulation before approving final clips.

Production gate remains closed. Review cockpit visibility, pivot, cue pose, weak point and collision bounds at 1280×720 gameplay size. Obtain encounter timing and critical pose signoff before generating locked-camera separable-background clips. Future delivery needs actual prompts, generation IDs, atlas frames/durations, release/recovery event markers, and exact muzzle/weak-point anchors. The manifest deliberately has no production clips.

## Distinct production animation inventory

User requirement: at least 30 distinct actual production animations per boss, with both phases reviewed. This pack plans 32 bespoke motions; **actual generated and verified production clips: 0**. A planned record is not an animation delivery. `clips` remains empty and `productionApproved` remains false. No generation or credit spending occurred.

The existing procedural SVG studies still require timing and critical-pose review. They count as zero production animations.

Each final clip must perform a different mechanism, operator action or outcome. Frames, duplicated loops, held poses, mirrored exports, speed changes, crops and alternate encodes cannot increase the count. A windup must visibly load a mechanism; an active clip must perform its attack; recovery must follow a different mechanical path. Unique IDs alone do not prove semantic distinctness. Fixed machines use articulation rather than invented walking.

1. `01-marina.wheelhouse-entry` — phase 1; Dave steps into the wheelhouse and takes the throttle.
2. `01-marina.docked-engine-idle` — phase 1; Tug pistons and exhaust cycle while the hull stays fixed.
3. `01-marina.bow-linkage-test` — phase 1; Bow linkage extends and draws the piston back into its guide.
4. `01-marina.throttle-pull` — phase 1; Dave pulls the throttle lever with a visible shoulder motion.
5. `01-marina.piston-hang-cue` — phase 1; Bow piston rises and hangs above the dock before the slam.
6. `01-marina.bow-pressure-load` — phase 1; Piston housing compresses against the loaded spring.
7. `01-marina.breakwater-slam-release` — phase 1; Bow piston strikes and launches the low wake.
8. `01-marina.slam-recoil-steam` — phase 1; Piston recoils as steam vents upward after impact.
9. `01-marina.steam-vent-unseal` — phase 1; Vent shutters peel open to expose the firing target.
10. `01-marina.steam-vent-reseal` — phase 1; Vent shutters close and the steam stream cuts off.
11. `01-marina.vent-hit-buckle` — phase 1; A hit on the exposed vent kicks the grille and engine mounts.
12. `01-marina.bow-armor-deflect` — phase 1; Armored bow takes a glancing impact with a localized plate shudder.
13. `01-marina.service-cradle-approach` — phase transition; Tug winch draws the hull into the service cradle.
14. `01-marina.wheelhouse-cradle-lock` — phase transition; Cradle clamps close around the retained wheelhouse base.
15. `01-marina.pipe-coupler-deploy` — phase transition; Flexible pressure pipes extend and connect to the tug.
16. `01-marina.press-piston-seat` — phase transition; Retained bow piston seats vertically in the dry dock press.
17. `01-marina.press-regulator-idle` — phase 2; Fixed press regulator rocks under normal engine pressure.
18. `01-marina.pipe-charge-traverse` — phase 2; A mechanical charge indicator travels along the numbered pipes.
19. `01-marina.numbered-pipe-cue` — phase 2; Three pipe flags lift in order to announce the pressure front.
20. `01-marina.accumulator-load` — phase 2; Accumulator bladder expands while Dave braces the throttle.
21. `01-marina.front-nozzle-lock` — phase 2; Discharge nozzle snaps into the full-height chevron firing slot.
22. `01-marina.pressure-lock-release` — phase 2; Pressure curtain leaves the nozzle across the room.
23. `01-marina.backpressure-piston-return` — phase 2; Press piston retracts against the exhausted accumulator.
24. `01-marina.dash-counter-gauge-kick` — phase 2; A successful counter makes the pressure gauge needle kick to release.
25. `01-marina.valve-release-turn` — phase 2; Valve wheel unlocks and spins when the release target is broken.
26. `01-marina.press-vent-steam-open` — phase 2; Engine vent hinges outward under released pressure.
27. `01-marina.press-core-hit-recoil` — phase 2; Exposed engine core jolts the piston guides on damage.
28. `01-marina.valve-rearm-seat` — phase 2; Valve seats again and pipe check valves reset for a new cycle.
29. `01-marina.engine-final-seize` — phase defeat; Final vent hit seizes the engine crank and bends its mounts.
30. `01-marina.pressure-safe-purge` — phase defeat; Remaining pressure vents through the service pipes safely.
31. `01-marina.dave-abandon-controls` — phase defeat; Dave lets go of the throttle and ducks inside the wheelhouse.
32. `01-marina.cradle-shutdown-settle` — phase defeat; Cradle settles around the stopped tug with the piston slack.

## Feasibility, batches and verification

Campaign backlog: 11 bosses × 32 plus Codebreak × 36 = **388 planned distinct clips**. At four motion briefs per review batch this is **97 scheduling batches**: eight for each other boss and nine for Codebreak. A scheduling batch is not a claim that one generation call yields four usable clips. Generation calls, retries, credit cost and export labor remain unknown until approved references and timing are tested.

Codebreak landing, anchor and scanner motion is the first priority. Dave, Big Swole and Goldie have the initial procedural reference studies; reference boards for the other nine remain pending. Review every boss in both phases. Keep the timing/critical-pose gate closed before any final animation generation, even when the user permits credits or free models.

Each actual clip needs approved start/end poses, a distinct moving-part brief, source/generation record, gameplay-scale contact sheet, offline atlas path and frame rectangle, pivot, duration, event markers and muzzle/weak-point anchors. Validate asset bytes and distinct motion identity before adding it to `clips` and raising `actualVerifiedClipCount`. Independent script `art/rework/bosses/12-codebreak/validate-inventory.cjs` checks inventory shape and counts; it cannot substitute for human semantic motion review.

## Required boss-specific terminal animation

Primary terminal clip: `01-marina.engine-final-seize` — **planned, not produced**. Outcome: machine-defeat. Tug crank seizes after the final vent hit, pressure purges into service pipes, and the hull settles in its cradle; Dave remains sheltered in the wheelhouse.

The terminal sequence is bespoke to this machine and must not be fulfilled with a shared explosion, fade or generic pilot-death animation. Production acceptance requires an actual verified clip under the primary terminal ID, the appropriate operator outcome, and offline start/clear/retry verification. The other defeat/escape motions in this pack support that sequence; planned IDs do not satisfy the requirement. No operator death is implied.
