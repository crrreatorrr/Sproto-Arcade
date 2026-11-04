# Current Sproto Arcade task: gameplay pacing

Animation production and Higgsfield jobs are stopped. The previous30+boss-animation requirement is superseded; its inventories and images remain archived references rather than a current delivery gate. No new generation job or credit spend is part of this gameplay pass.

The current work starts from local main7dfb12a, preserving the newer Special Sproto add/revert history. It corrects fast enemy attacks, keeps Phase2 base speed equal to Phase1, and adds slow, visually distinct pressure with protected counter and route windows. The existing twelve encounters, standard kit, retries/practice and offline entry remain in scope.

Current implementation: ordinary campaign shots capped at6px/tick, marked dash/shield fronts8, preserving direction/travel; new Phase2 pressure2–3px/tick with long warning, real population limits, distinct static projectile sprites and no combat/loot RNG coupling. Specific measurements and standard-kit coverage are recorded in qa/PACING.md and stage timing notes. Final balance and human reaction comfort require playtesting.

Completed verified work is integrated into local main and then pushed to the verified GitHub main without force, preserving concurrent work. Do not pull Sproto Fighter or dependent shared updates until PR #8 finishes; verify its state before any later pull. Current gameplay work uses checked-in assets and does not require that dependency.

Play index.html or review-start.html directly offline, or use the current local preview. Historical animation approvals are not required to continue this gameplay work.
