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


## Gameplay pacing revision — animation production stopped

This section supersedes earlier prototype timing and animation production notes. Verified against the shared gameplay-tuning World runtime. All timings are60Hz.

Shared runtime keeps both phases at the same corrected speed: wake9→6px/tick (active126→189, unchanged travel), dash front12→8 (110→165). The piston still hangs60ticks before its wake; pipe/front warning remains90ticks. No phase2 acceleration. The base-kit controller now jumps within110px rather than175: its old jump was early against the slower wake. Inputs remain legal movement/jump/dash only.

Phase2 dock spray uses seed and roller,2.5px/tick,90tick warning, population cap2, first possible660. Mandatory front always clears pressure. Valve aiming stays protected; the first60ticks of the210tick vent opening stay protected, then a far-side warning may coexist. This gives the initial punish a clean second while retaining later density. Authored low wake remains a separate reprise. Every phase2 update calls the guard, including disabled ticks.

Real-runtime seed17 full1913/practice1222ticks, HP5/nohits,3dash counters each;1actual spray each (roller). Legal idle loses at1234 (intentional negative play), but emits4sprays across seed+roller with155ticks containing active pressure, max2alive,539protected ticks. Authoring lifecycle/counter fixture also passes.

Run `node stages/01-marina/pressure.cjs [runtime-root]` for prolonged legal-idle coverage; `basekit.cjs` verifies full/practice clears and meaningful negative checks. Marina basekit accepts a world.js file path; the other basekit scripts accept a runtime repository root. Pressure audits observe hazards and wrap recording methods without mutating HP, targets or phase state. These deterministic checks establish technical clearability, not human readability, controller accessibility or final balance. No production animations/assets or Higgsfield jobs were generated.
