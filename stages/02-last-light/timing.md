# Last Light — Packet C timing and verification

Prototype; no final animation generation. Fixed camera and floor y600. Morelight remains in the projector cockpit; Phase2 adds the overhead gantry and angled mirror. All timing is 60Hz. Full/practice seed17 checks against integration26f95cc runtime: full1307 ticks, Phase2 practice622 ticks, HP5, no hits. Repeated seed reproduces. Run `node stages/02-last-light/basekit.cjs [runtime-root]`.

Phase1 Prism Projector / Iris Shot: spawnx760 deliberately exposed; boothx480..580 y480..600. Every420 ticks, lens locks player lane at60 and fires at120. Moving left of the booth before lock returns the beam; iris opens210 ticks, HP22. A stationary exposed player cannot open it. Hazard lane terminates at booth edge when the ray intersects its height. First return emits `light-first-return`. Baseline fire reaches the iris from cover. Critical poses: narrowing iris60, committed lane120, opened iris/recoil120..329.

Phase2 Mirror Gantry / House of Mirrors: spawnx850; low mirrorx650..700 y500..600. Bait from left ofx650 with a locked shot height500..600. Wrong side or high jump at lock does not reflect. A successful mirror return emits a named `reflection` event and draws a24-tick reflected ray into the housing, then opens the rear housing210 ticks, HP26. Existing projector and cockpit remain visible under a new overhead rail. At phaseTick760 (cycle tick340 after600-tick isolated introduction), the ordinary low projector shot returns, windup30 speed7, countered by jump/shield/dash. New task is positioning the aimed ray through the mirror, not a renamed health bar.

`redirectVolley` explicitly labels the lens lock an eligible ordinary aimed volley. Echo Decoy may redirect that one lock to its stationary position; fixed reprise shots remain fixed. Prism Rail supports the exposed iris. No mine is offered without authored bounce geometry.

Fixture includes full/practice base-kit clears, seed reproducibility, exposed stationary failures for both phases, and a high-lock sightline rejection. It does not validate every drop combination, human comprehension, visual cue signoff, or production balance.


## Gameplay pacing revision — animation production stopped

This section supersedes earlier prototype timing and animation production notes. Verified against the shared gameplay-tuning World runtime. All timings are60Hz.

The locked beam remains stationary geometry; its60tick committed lock→release interval and mirror sightline requirements are unchanged. Low reprise7→6px/tick (active180→210, unchanged travel); its visible warning30→75ticks. No phase2 acceleration.

Phase2 prism motes use orb and diamond,2.25px/tick,90tick warning, cap2, first possible660. The bait, locked beam and first60ticks of the210tick reflection opening are clean (cycle0..179); later punish/recovery permits far-side low shots. The guard runs every phase2 update and removes old pressure at next setup. Wrong-side and high-lock reflections still fail.

Real-runtime seed17 full1307/practice622ticks, HP5/nohits,2reflections each. These efficient clears finish phase2 before660 and encounter0pressure, deliberately not padded with HP. Legal idle loses1308, emits4motes across orb+diamond,240ticks active pressure, max2alive,587protected ticks. Both exposed stationary negative checks and high-lock rejection pass.

Run `node stages/02-last-light/pressure.cjs [runtime-root]` for prolonged legal-idle coverage; `basekit.cjs` verifies full/practice clears and meaningful negative checks. Marina basekit accepts a world.js file path; the other basekit scripts accept a runtime repository root. Pressure audits observe hazards and wrap recording methods without mutating HP, targets or phase state. These deterministic checks establish technical clearability, not human readability, controller accessibility or final balance. No production animations/assets or Higgsfield jobs were generated.
