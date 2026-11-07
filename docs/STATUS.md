# Boss phase production

The reviewed production set contains 13 canonical boss identities in both phases: 26 boss atlases and 26 phase projectile atlases. Each boss phase has idle plus three genuine weapon-firing loops, with source-themed A/B/C/heavy projectile motifs. Redkev adds two red-ship phases between original levels1 and2. Original stage04 Ranch P1 receives the orange salvage crane and salvage ammunition with canonical Halloween2008; its Harvest Express P2 is unchanged. Original stage05 Neon P1 receives the new Collector hover-rig and source-consistent cyan data ammunition; its billboard-walker P2 is unchanged. Original IDs remain stable.

Both Machine Trials and the story campaign share the atlas adapter. Canonical pilots stay visible inside their vehicles. Stage-scoped decoding loads both phases and projectile sets before a cold start; warm retries remain synchronous. Collision cores are versioned numeric data, independent of artwork loading and aiming/spawn anchors. The November6 follow-up also authorizes original Moonkeep7 UFO flight with vertical dragon movement, 13 source-themed slow dense missile barrages, current-phase death retries, and phase heart/shield pickups. Existing authored attacks and required dash/shield gates remain preserved outside those additions.

Review the sheets in `boss-sheets-review.html`, and use `controlled-stage-review.html` for paused diagnostic scenes. Conversion provenance lives beside the assets under `art/generated/bosses/`. `docs/BOSS-SHEETS.md` describes the complete-asset, collision, presentation and replay release checks. Historical pacing evidence is retained below.

# Historical gameplay-pacing checkpoint

During the earlier pacing pass, animation production and Higgsfield jobs were stopped. The previous30+boss-animation requirement is superseded; its inventories and images remain archived references rather than a current delivery gate. No new generation job or credit spend is part of this gameplay pass.

The current work starts from local main7dfb12a, preserving the newer Special Sproto add/revert history. It corrects fast enemy attacks, keeps Phase2 base speed equal to Phase1, and adds slow, visually distinct pressure with protected counter and route windows. The existing twelve encounters, standard kit, retries/practice and offline entry remain in scope.

Current implementation: ordinary campaign shots capped at6px/tick, marked dash/shield fronts8, preserving direction/travel; new Phase2 pressure2–3px/tick with long warning, real population limits, distinct static projectile sprites and no combat/loot RNG coupling. Specific measurements and standard-kit coverage are recorded in qa/PACING.md and stage timing notes. Final balance and human reaction comfort require playtesting.

Completed verified work is integrated into local main and then pushed to the verified GitHub main without force, preserving concurrent work. Do not pull Sproto Fighter or dependent shared updates until PR #8 finishes; verify its state before any later pull. Current gameplay work uses checked-in assets and does not require that dependency.

Play index.html or review-start.html directly offline, or use the current local preview. Historical animation approvals are not required to continue this gameplay work.

Final pacing evidence:26regressioncommands and24offline phase-entry/input/retry checks passed on clean758b6bc. File/HTTP rendering passed on its CI-only successor876eb0d, including5distinct SVGprojectiles, exact warning outlines and trajectory hints. Every stage has a legal-input standard-kit clear; prolonged pressure tests establish both styles and cap2. Expert clears can finish before delayed pressure, and diagnostic invulnerable observations are not human clears. qa/PACING.md retains those distinctions.

Fighter PR #8 was independently verified merged at04573bc9b1b4cc20308d4149f9e9fae0ef8d6454 before pulling Arcade origin/main; that pull was already up to date. The new pacing branch preserves main7dfb12a, including the prior add/revert history. No automatic Fighter atlas migration is part of this independent pacing pass.

Current addition: very slow committed missiles in all12second phases,1.1px/tick,90tick warning,480tick minimum cooldown, one missile/two total background-pressure cap. Independent guards protect counters, launch/landing, reflection bait and first punish decisions. Stage suites exercise all12emissions/active travel and legal standard-kit clears; synthetic diagnostics are labeled separately. Static missile art is replaceable through an asset map. That pacing checkpoint did not restart boss animation production.

Missile QA on clean05b08ea:30/30regressioncommands,12/12unmodified standard-kit controller suites and24/24offlinephase-entry checks pass. All12second phases show active missiles in prolonged controlled observations; legal clear routes show active exposure in11/12, while Moonkeep finishes during warning. Mudline upper route remains protected; lower-route clear includes active missiles. These distinctions, guard/escape checks and file/HTTP44×18rendering are retained in qa/MISSILES.md. The separately supplied static missile PNG can replace the current mapped placeholder without changing gameplay.
