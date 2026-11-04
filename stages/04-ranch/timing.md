# Ranch prototype — packet E, contract d36f7a4

## Harvest approach

Halloween 2008 is seated above the harvester body with its lantern cab; root overlays the existing `zephyr` sprite. The player advances along a continuous field and jumps rolling cutters. Rollers are fixed lanes, not decoy-eligible aimed fire. Each authored roll: lantern/cutter cue55 ticks, active140 ticks at7px/tick, recovery20 ticks; introductory opportunities every240 ticks, suppressed near the machine. Shooting disables the16HP vent, but phase completion additionally requires reaching x3500 on the field. HUD distinguishes approach and vent objective. First vent hit gives an authored compatible pickup.

## Harvest Express / Uncouple

The same lantern cab couples to an engine. Both cars and the engine move0.6px/tick in world space, using runtime support carry. The rear car ends at x2800+offset; engine car starts x3280+offset, leaving a480px coupling gap. Paired chevrons mark launch and landing. Ready dash is restored on the grounded approach. Front at x3070+offset drifts with the train and requires an actual swept dash counter. A failed front hit returns the player to the rear launch roof; falling loses. The linkage is explicitly closed until the required counter, then open with16HP. No drop bypasses the crossing. After600 ticks, the original rolling attack can return on the engine car with270-tick cadence. First coupling success yields a teaching pickup. Within-stage charge carry is runtime-owned.

## Verification

Run `node stages/04-ranch/verify.cjs [runtime/core/world.js]` against integrated runtime.

- Full Phase1 base-kit controller: transition after685 ticks, HP5; advancement requires approach plus target defeat.
- Phase2 base-kit controller: clear after743 ticks, HP5, actual required counter.
- Moving-car gap sweep: no non-dash landing across935 sampled launch/second-jump combinations;23 sampled dash activation ages succeed. Sampled regression is not mathematical exhaustive proof.
- Practice Phase2 and retry reset to safe rear car x2300, base kit and uncrossed state.

Prism Rail and Ricochet Mine are eligible; both can punish an exposed target and mines can clear rollers. Echo Decoy is excluded because rollers are fixed lanes. No final production animation, browser verification, or human balance/comprehension result is claimed by this packet. Timing and critical poses remain prototype values pending signoff.

## Gameplay tuning — 2026-11-04

Production animations/Higgsfield work is stopped. The current gameplay pass gives rollers75 warning ticks (was55); shared runtime d3e3b95 normalizes their7px/tick to5.9756px/tick with164 active ticks (was140), preserving980px total travel in both phases. Train carry0.6 and the480px gap are unchanged.

Phase2 adds roller/seed pressure at2.5px/tick,90tick warning, at most2 alive; opportunity cadence60ticks after660. It is enabled only after the dash counter, grounded, and180px beyond the landing edge. Every update calls the helper so leaving that safe state immediately removes pressure; unresolved required fronts also suppress it. This protects launch, airborne commitment and landing without narrowing dash timing. The low lane leaves a jump escape and does not accelerate existing rollers.

Against core d3e3b95: full legal-input base-kit Phase1 transition698ticksHP5 (previous685); Phase2 clear743ticksHP5 (unchanged). Phase2 emits two extra projectiles, roller at660 and seed at720, compared with zero background pressure previously. A controlled prolonged-combat scheduling probe verifies both styles, cap2, >=360px spawn separation, visible Y below240, and nonscheduled protected-zone removal. The probe manipulates authoring state; it is separate from legal-input completion evidence. Moving gap sweep remains0/935 no-dash landings and23 successful dash ages; practice/retry passes. Human balance and browser readability checks remain integration tasks.
