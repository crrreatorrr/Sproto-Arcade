# Current Sproto Arcade task: gameplay pacing

Animation production and Higgsfield jobs are stopped. The previous30+boss-animation requirement is superseded; its inventories and images remain archived references rather than a current delivery gate. No new generation job or credit spend is part of this gameplay pass.

The current work starts from local main7dfb12a, preserving the newer Special Sproto add/revert history. It corrects fast enemy attacks, keeps Phase2 base speed equal to Phase1, and adds slow, visually distinct pressure with protected counter and route windows. The existing twelve encounters, standard kit, retries/practice and offline entry remain in scope.

Current implementation: ordinary campaign shots capped at6px/tick, marked dash/shield fronts8, preserving direction/travel; new Phase2 pressure2–3px/tick with long warning, real population limits, distinct static projectile sprites and no combat/loot RNG coupling. Specific measurements and standard-kit coverage are recorded in qa/PACING.md and stage timing notes. Final balance and human reaction comfort require playtesting.

Completed verified work is integrated into local main and then pushed to the verified GitHub main without force, preserving concurrent work. Do not pull Sproto Fighter or dependent shared updates until PR #8 finishes; verify its state before any later pull. Current gameplay work uses checked-in assets and does not require that dependency.

Play index.html or review-start.html directly offline, or use the current local preview. Historical animation approvals are not required to continue this gameplay work.

Final pacing evidence:26regressioncommands and24offline phase-entry/input/retry checks passed on clean758b6bc. File/HTTP rendering passed on its CI-only successor876eb0d, including5distinct SVGprojectiles, exact warning outlines and trajectory hints. Every stage has a legal-input standard-kit clear; prolonged pressure tests establish both styles and cap2. Expert clears can finish before delayed pressure, and diagnostic invulnerable observations are not human clears. qa/PACING.md retains those distinctions.

Fighter PR #8 was independently verified merged at04573bc9b1b4cc20308d4149f9e9fae0ef8d6454 before pulling Arcade origin/main; that pull was already up to date. The new pacing branch preserves main7dfb12a, including the prior add/revert history. No automatic Fighter atlas migration is part of this independent pacing pass.
