# Sproto Arcade project workflow

## Current priority

Boss animation production and Higgsfield boss-animation generation are STOPPED at the user’s direction. Authorized static gameplay projectile art may be supplied and integrated without restarting boss animation production. The earlier30+boss-animation requirement is superseded. Work on core gameplay, readable attacks and reaction windows. Phase2 retains corrected base projectile speed and increases density/variety through slow, visually distinct projectiles. No animation approval is needed to continue gameplay implementation or QA. Preserve historical art/reference records as archived material.


- Integrate completed, verified project work into local `main` as it is finished. The user now also authorizes pushing completed verified tasks to GitHub main after local integration. Verify the repository destination, current remote state and CI, preserve concurrent work, and never force push.
- Do not pull Sproto Fighter updates or dependent shared repositories until Sproto Fighter PR #8 has finished. Check that PR before any later pull. Current Arcade tuning uses checked-in assets. PR #8 was verified merged as04573bc9b1b4cc20308d4149f9e9fae0ef8d6454 before the subsequent safe Arcade pull; preserve that verification and recheck before later shared updates.
- Before integration, check the actual `main` checkout, its status and active worktrees. Preserve unrelated changes and other worktrees; use a fast-forward where the history permits it.
- Keep unfinished work and unapproved production assets separate. Completed reference guides and inventories may be integrated as review material, clearly labeled pre-production; planned clips must never count as delivered animation.
- Respect the existing encounter timing, critical-pose and hit-area approval gate before final animation generation. Honor approval already granted for a named scope without repeatedly asking for it.
- Run checks appropriate to the change and report the integrated commit, results and limitations. Distinguish automated technical checks from human playtesting and final animation approval.

## Art generation

Follow `docs/higgsfield-workflow-guide.md`. This repo uses the **sprite sheet** workflow. If the owner says to skip approvals, follow that section of the guide. The stop on boss animation production above still applies.
