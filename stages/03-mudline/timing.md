# Mudline prototype timing and handback

These timings are prototype simulation values at 60Hz. Placeholder canvas geometry only; production animation is blocked on timing/pose signoff.

## Phase 1: Sludge Dredger / Sludge Belch

- Spawn (220,360), free-flight fixed camera. Crapto's pilot anchor (1050,270), above the glass belly. Intake at (835,340); both carry into Phase 2.
- 360-tick authored cycle: glass fill 0–89; nozzle altitude locks at 90 with dashed line and text; release at 145; vent opens 155–299; reseals 300–359.
- Belch is an ordinary 70×50 projectile at speed 9 leftward. Initial nozzle aims to the locked player altitude, then never homes. Ordinary shield is valid; reposition preserves the punish.
- Twenty baseline damage completes the phase. First actual vent damage authors one deduplicated introductory drop opportunity. No pickup required.

## Phase 2: Floodgate Pump / Backflush

- Spawn (220,345), fixed camera. Upper latch (890,150,105,85) and lower intake (890,515,105,85), 4 HP each. Upper is targetable from player feet above 350; lower from below 430. Baseline autofire is a fallback for either route; C beam and V bounce are standard-kit stronger options supplied by the shared adapter.
- Destroying either route releases both shutters. The first clean (no hit this round) release opens the pump without a front, isolating the rule. A damaged teaching cycle repeats instead of gating progress permanently.
- After a clean release, every subsequent release telegraphs the full-height broken-chevron front for 90 ticks. Front moves left at 10 px/tick from x1190, 28×570. Dash cooldown explicitly reset at this mandatory commitment. Only a `backflush-front` counter opens the pump; tanking or shielding does not unlock it.
- Core open 180 ticks, capped to 8 damage per cycle, then shutter resets at 200 ticks. Missed front recovers into a fresh shutter at 280 ticks. Core total 24 HP. No hidden health stall: closed core has an explicit shutter/pressure objective in HUD.
- Familiar aimed belch returns only after tick600; fixed 360-tick schedule thereafter. Latch, intake, pump targets stay visible and distinct.
- Ricochet Mine excluded from loot: the flight route has no general-purpose supported mine surfaces. Prism Rail and Echo Decoy eligible. The authored low shelf supports the standard saucer bounce weapon.

## Verification required

Run `node stages/03-mudline/fixture.cjs` for authored lifecycle assertions. This mocks collision; it does not prove player clearability. Integration must verify actual C/V flight behavior, nearest-open autofire, last-frame dash, both shutter routes, missed-front recovery, base-kit full clear, restart and Phase2 practice in browser. No human comprehension or balance claim is made.
