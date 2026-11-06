# Sproto Arcade project workflow

## Current priority

Boss art covers all twelve bosses in both phases, with 24 accepted boss sheets and 24 accepted phase projectile sheets. For further art changes, create concepts before animation sheets. Keep each level's canonical checked-in Sproto identity exact and clearly visible inside the vehicle; supplied vehicle concepts are inspiration. Preserve the liked enemy ship designs. Each phase needs distinct weapon-firing animations and attack-specific, source-themed projectiles with varied sizes. Use Higgsfield website Unlimited only for this production scope. The user has waived repeated design approvals and authorized a PR followed by merge to GitHub main after the complete change passes review and checks.

Gameplay changes are limited to boss and projectile collision hitboxes needed to fit the new artwork. Preserve authored attack timing, trajectories, movement, damage, RNG, progression, armor/open-state rules, and reaction windows. Keep collision geometry separate from the anchors used for aiming and spawning. The earlier30+boss-animation requirement remains superseded. Preserve historical art/reference records as archived material; rejected or pending artwork must never be enabled or reported as complete.


- Integrate completed, verified project work into local `main` as it is finished. The user now also authorizes pushing completed verified tasks to GitHub main after local integration. Verify the repository destination, current remote state and CI, preserve concurrent work, and never force push.
- Do not pull Sproto Fighter updates or dependent shared repositories until Sproto Fighter PR #8 has finished. Check that PR before any later pull. Current Arcade tuning uses checked-in assets. PR #8 was verified merged as04573bc9b1b4cc20308d4149f9e9fae0ef8d6454 before the subsequent safe Arcade pull; preserve that verification and recheck before later shared updates.
- Before integration, check the actual `main` checkout, its status and active worktrees. Preserve unrelated changes and other worktrees; use a fast-forward where the history permits it.
- Keep unfinished work and unapproved production assets separate. Completed reference guides and inventories may be integrated as review material, clearly labeled pre-production; planned clips must never count as delivered animation.
- Respect the existing encounter timing, critical-pose and hit-area approval gate before final animation generation. Honor approval already granted for a named scope without repeatedly asking for it.
- Run checks appropriate to the change and report the integrated commit, results and limitations. Distinguish automated technical checks from human playtesting and final animation approval.

## Art generation

Follow `docs/higgsfield-workflow-guide.md`. This repo uses the **sprite sheet** workflow. For the current authorized production scope, follow its skip-approvals workflow, keep the spending limit at zero credits, and verify actual Unlimited eligibility in the website. A missing allowance does not authorize paid generation. Inspect pilot identity and frame quality before enabling any asset.

## Checks

```bash
node qa/run-all.mjs .
```

Browser checks are separate. See `qa/`.

## Working with other agents

Claude Code, Codex and Cursor all work on this repo.

- Start each task on its own branch from the latest `main`, named `<agent>/<slug>`.
- On the owner's machine, `agent-task new Sproto-Arcade <slug> --agent <name>` creates that branch in
  its own worktree.
- Integrate finished work using the rules at the top of this file. Unlike the other game repos,
  completed and verified work here may go straight to GitHub `main`, never with a force push.
- Don't edit files that another active task is changing.
- Run the checks before integrating, and report any you could not run.
- A different agent reviews the work: `agent-task review <path>`, or `/codex:adversarial-review` in
  Claude Code.
