# Packet C / Marina prototype timing

Base contract: d36f7a4, 60 simulation ticks per second. Placeholder machines carry the wheelhouse/cockpit and right-hand bow piston between phases. Root renderer places existing Dave sprite at phase.pilot. No production art has been commissioned; pose and timing signoff remains pending gameplay review.

## Phase 1 — Breakwater Tug / Breakwater Slam

Fixed dock, floor y600, spawn (230,600), vent x1040 y490 width110 height110. Vent HP18. Cycle420 ticks. Tick60: throttle/piston cue. Tick120: low wake released at x1020 y568, width76 height32, speed9 left, active126 ticks, recovery12. Ground jump clears the wake; shield/dash may also block this ordinary attack. Tick180..389: steam vent visibly open, baseline shots can damage it. No hidden HP thresholds. First actual vent damage emits `marina-first-vent-punish` exactly once. Vent defeat requests phase advance.

Art poses: pilot reaches throttle by tick60, piston held downstage60..119, impact120, recoil/steam180..389. Piston contact animation must match low32px wake, never imply a full-height attack.

## Phase 2 — Dry Dock Press / Pressure Lock

Fixed engine room, spawn (260,600); fresh floor and targets. Tick30 each420-tick cycle: valve closes and rearms HP3, pipe cue starts; pipes light in sequence. Front windup90 ticks at x1210, then speed12 left, width30, full viewport height720, active110, recovery10. Broken-chevron cue explicitly requires dash. Only a runtime `counter` event from `marina.pressure-lock.front` unlocks the valve. A hit or shield-only attempt leaves it armored. Valve x838 y500 width68 height100. Shoot it after the dash; defeating it opens vent for210 ticks. Vent HP20 persists across cycles. Vent defeat clears stage. Missed counters retry on next authored cycle; no softlock.

The first new-rule cycle is isolated. At phaseTick690 (then every420 ticks), the low wake returns at cycle tick270. Pipe/front timing is unchanged. The ordinary wake and marked front are spatially/timing separated. Base kit can complete both phases; no drop action is needed. Specials cannot unlock the dash objective.

Art poses: same wheelhouse sits in a service cradle with pipes; retained piston at right. Three numbered pipe lights show order without color dependence. Pressure front has paired broken-chevron contour. Pilot opens valve mechanism only after a successful counter. Steam/open target is shared with phase1.

## Local checks

`node stages/01-marina/fixture.cjs` passes authoring fixtures for low-wake scheduling, vent opening, one reward event, phase advance, front rule/height, hit-vs-counter gating, valve-to-vent objective, window close, phase1 reprise after introduction, clear, and fresh practice state.

These are mocked contract checks. Actual runtime base-kit completion, shield-only front rejection, launch-window measurements and offline browser readability require integrated build verification. No human playtest or final balance claim.

## Actual runtime simulation check

`node stages/01-marina/basekit.cjs [optional/path/to/runtime/core/world.js]` uses only held movement and pressed jump/dash inputs, leaves HP/targets/phases untouched, and never uses powers or C/V specials. Against Packet A commit a891cc0 (integration180ac5c), full run clears at1900 ticks, HP5, three pressure counters, zero hits. Phase2 practice clears at1198 ticks, HP5, three pressure counters, zero hits. Repeated seed17 yields identical summary. This is a scripted simulation and does not validate human cue comprehension, art readability, or production balance. Re-run against pinned integrated runtime before accepting the slice gate.
