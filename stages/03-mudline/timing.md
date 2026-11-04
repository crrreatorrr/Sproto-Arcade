# Mudline prototype timing and handback

These timings are prototype simulation values at 60Hz. Placeholder canvas geometry only; production animation is blocked on timing/pose signoff.

## Phase 1: Sludge Dredger / Sludge Belch

- Spawn (220,360), free-flight fixed camera. Crapto's pilot anchor (1050,270), above the glass belly. Intake at (835,340); both carry into Phase 2.
- 360-tick authored cycle: glass fill 0–89; nozzle altitude locks at 90 with dashed line and text; release at 145; vent opens 155–299; reseals 300–359.
- Belch is an ordinary 70×50 projectile at speed 9 leftward. Initial nozzle aims to the locked player altitude, then never homes. Ordinary shield is valid; reposition preserves the punish.
- Twenty baseline damage completes the phase. First actual vent damage authors one deduplicated introductory drop opportunity. No pickup required.

## Phase 2: Floodgate Pump / Backflush

- Spawn (220,345), fixed camera. Upper latch (890,190,105,85) and lower intake (890,550,105,75), 4 HP each. Upper is targetable from player feet above 350; lower from below 430. Baseline autofire is a fallback for either route; C beam and V bounce are standard-kit stronger options supplied by the shared adapter.
- Destroying either route releases both shutters. The first clean (no hit this round) release opens the pump without a front, isolating the rule. A damaged teaching cycle repeats instead of gating progress permanently.
- After a clean release, every subsequent release telegraphs the full-height broken-chevron front for 90 ticks. Front moves left at 10 px/tick from x1190, 28×570. Dash cooldown explicitly reset at this mandatory commitment. Only a `backflush-front` counter opens the pump; tanking or shielding does not unlock it.
- Core open 180 ticks, capped to 8 damage per cycle, then shutter resets at 200 ticks. Missed front recovers into a fresh shutter at 280 ticks. Core total 24 HP. No hidden health stall: closed core has an explicit shutter/pressure objective in HUD.
- Familiar aimed belch returns only after tick600; fixed 360-tick schedule thereafter. Latch, intake, pump targets stay visible and distinct.
- Ricochet Mine excluded from loot: the flight route has no general-purpose supported mine surfaces. Prism Rail and Echo Decoy eligible. The authored low shelf supports the standard saucer bounce weapon.

## Verification required

Run `node stages/03-mudline/fixture.cjs` for authored lifecycle assertions. This mocks collision; it does not prove player clearability. Integration must verify actual C/V flight behavior, nearest-open autofire, last-frame dash, both shutter routes, missed-front recovery, base-kit full clear, restart and Phase2 practice in browser. No human comprehension or balance claim is made.

## Integrated deterministic evidence

Against integration runtime pinned 180ac5c, `node stages/03-mudline/playthrough.cjs ../arcade-integration` drives actual World input and collision at seed23 without collecting/firing any power. Upper C route: 1594 total ticks, 3 latch kills with 3 beam hits, 2 front counters, zero hits. Lower V route: 1867 ticks, 3 intake kills with 3 bounced-ball hits, 2 front counters, zero hits. Both logs repeat identically. Phase2 practice and immediate retry reset are asserted. Geometry correction: low intake extends to y625 and its bounce shelf starts x0; otherwise the ball fell below the route before arrival. These are scripted simulation clears, not browser/manual or human comprehension tests.

QA label adjustment: both phases own target labels; upper latch moved down to y190 so the integration cue banner at y125–170 does not cover it. Custom latch/intake labels sit left of their hit rectangles.


## Gameplay pacing — current direction (2026-11-04)

Animation production is stopped. Earlier production-clip references are archived planning, not current deliverables or a gameplay approval blocker.

Nozzle altitude locks at cycle tick70 rather than90; release remains145, giving75 warning ticks instead of55. Glass fill now reaches its mark when the lock begins. Shared campaign pacing changes belch9→6px/tick (active110→165), backflush10→7.975px/tick (active130→163), equally in both phases. Total authored travel is preserved.

Phase2 silt pressure: orb/diamond,2.4px/tick,90tick warning,150tick cadence, max2. It starts no earlier than660 and only after the clean introduction, between shutter attempts while the player is in the central altitude band350–430 and left of600. Both high-C and low-V setups, the dash front and vent punish immediately clear pressure. No geometry or C/V route changes.

Verified against shared runtime: seed23 upper route1627ticks,3beam latch hits,2dash counters,0damage; lower1902ticks,3actually bounced-ball intake kills,2dash counters,0damage. Practice/retry and deterministic checks pass. Extended3000tick density sample emitted7pressure shots, both styles actually moved, peak2live/2active, first660. Extended samples deliberately preserve player/target health to measure density; they are not clearability runs.

Run the stage clear fixture and `node stages/12-codebreak/pacing.cjs` after integrating the shared runtime pacing helper. Automated controllers cover technical base-kit routes; human feel/difficulty playtesting remains outstanding.
