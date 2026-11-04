# Hatchery / Packet F campaign prototype

Two task types: tiered pod-footing duel → moving floor firing lanes. Existing pressure cab, crane claw and gauge-shaped shell direction persist as placeholder geometry. Root uses48px operator anchor inside the cab, following the moving crawler in Phase2. No final art or signoff is claimed.

Phase1: permanent recovery tiers ensure breaking all pod footing cannot softlock the encounter. Three shell pods provide actual standable top surfaces atY530; shell targets2HP. First pods hatch in order at ticks300,360,420. A shell break disables its footing and opens the incubator for150 ticks; hatch removes its target/footing and opens for100 ticks. Hatching creates a named25-tick warning and90-tick crawling hazard. Every600ticks a new three-pod group arrives in the same order. Seam countdown is printed in the pod. Incubator14HP lies at the upper tier's shot height.

Phase2: floorY600, crawler hatch oscillates horizontally950±130; shell pods move left1.2px/tick and new pods arrive every240ticks. A living shell between player's muzzle and hatch closes the hatch's shooting lane. Breaking the actual shell opens it on the next update; hatching also removes it. This prevents baseline shots from bypassing the intended lane objective. Hatch18HP. Returning Phase1-style brood shot begins at tick660 with45-tick windup and180 active ticks, then repeats300ticks.

Verification: `node stages/09-hatchery/test.cjs <runtime/core/world.js>`. Actual runtime seed37 full start-to-clear1516ticks HP5 with no drops. Separate fixtures verify shell state, shell break, disabled footing, ordered hatch timing, moving shell position and closed→open firing-lane state. No timer-only clear exists; target HP defeat drives each transition/clear. This is a scripted runtime test, not human comprehension or balance evidence.

Animation poses after signoff: crane claw pod settle; seam countdown; shell break; hatch release; tracked cab lowering; conveyor drive; passing hatch open/close; shutdown. Final VFX must match the existing physical footing and target geometry.


## Gameplay pacing — current direction (2026-11-04)

Animation production is stopped. Earlier production-clip references are archived planning, not current deliverables or a gameplay approval blocker.

Near-player hatch hazard warning25→75ticks; shell footing still disappears at its original300tick hatch deadline. The visible hatch box now waits75ticks before moving at the unchanged3px/tick. Conveyor brood-shot warning45→75ticks; speed remains6px/tick, including Phase2. Shell, hatch, break and moving-footing geometry are unchanged.

Phase2 pressure: roller/seed,2.2px/tick,90tick warning,150tick cadence, max2, no earlier than660. Pressure clears near a shell within60ticks of hatching, on pod footing and above the low floor band, preserving shell landing choices and the shot lane lesson.

Verified seed37 base-kit clear1516ticks,HP5, plus independent shell/break/hatch footing lifecycle, moving shell and actual firing-lane gate checks. Extended3000tick floor sample emitted6pressure shots, both styles reached active travel, peak2live/2active, first660. Health/targets were retained only in that technical density sample.

Run the stage clear fixture and `node stages/12-codebreak/pacing.cjs` after integrating the shared runtime pacing helper. Automated controllers cover technical base-kit routes; human feel/difficulty playtesting remains outstanding.
