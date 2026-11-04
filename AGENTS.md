# Sproto Arcade project workflow

- Integrate completed, verified project work into local `main` as it is finished. The user's phrase “push on local main” means a local merge or fast-forward. Remote pushes and publication require separate explicit authorization.
- Before integration, check the actual `main` checkout, its status and active worktrees. Preserve unrelated changes and other worktrees; use a fast-forward where the history permits it.
- Keep unfinished work and unapproved production assets separate. Completed reference guides and inventories may be integrated as review material, clearly labeled pre-production; planned clips must never count as delivered animation.
- Respect the existing encounter timing, critical-pose and hit-area approval gate before final animation generation. Honor approval already granted for a named scope without repeatedly asking for it.
- Run checks appropriate to the change and report the integrated commit, results and limitations. Distinguish automated technical checks from human playtesting and final animation approval.
