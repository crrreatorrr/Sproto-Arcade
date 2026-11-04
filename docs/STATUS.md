# Sproto Arcade execution checkpoint

Integration branch: **arcade/integration**. Gameplay code is verified at **e1c9dbc** and unchanged in later documentation/reference commits. The starting local-main baseline was a25acb1; the older detached f60fd6d worktree is preserved. The user now requires completed, verified work to be integrated into local main as it is finished; see AGENTS.md. This means local integration, with no remote push or publication. No final animation generation has occurred.

| Milestone | Exact status | Evidence |
|---|---|---|
|1 Baseline/interface|Complete. All12original entries routed offline; shared interface pinned d36f7a4.|qa/BASELINE.md; docs/INTERFACE.md|
|2 Shared mechanics|Implemented and technically verified: typed swept dash/shield rules, ledge grace, explicit phase/retry/practice state, failure sources, seeded drops and3powers.|22runtime fixtures,10weapon checks,9runtime-effect checks and independent shared QA; release-regression.json|
|3 Four-stage slice|Marina/Mudline/Rooftop/Codebreak both phases are playable and clear with standard kit; combined technical gate156ee3d passed. Human cue/task comprehension is unmeasured.|qa/SLICE.md; stage fixtures|
|4 Campaign expansion|All12encounters /24phases implemented with actual standard-kit input controllers and full start-to-clear simulation paths. Actual offline browser starts/practice/retries/routes pass.|qa/RELEASE.md;20regressioncommands;24entries;12forced transition routes|
|5 Production animation|Pre-production only: every boss reviewed in both phases,12reference packs,388distinct clip requests,12bespoke terminal plans. Delivered production clips0; bespoke animated transforms0/12; production terminal clips0/12.|art-review.html; art/rework/review/index.html; docs/ASSET-COVERAGE.json|
|6 Balance/QA/delivery|Technical QA passed, including6adapter checks and30/60/120/144Hz equivalent snapshots. Offline package prepared. Human participants0; formative comprehension and final balance remain incomplete.|qa/RELEASE.md; qa/playtest.html; qa/PLAYTEST.md|

## Precise remaining decision

The attached plan says: “Get signoff on timing, critical poses, and hit area before generating final assets.” That signoff has not been received. Approval may be incremental by named encounter and phase. The four-stage gameplay slice is Marina/Dave, Mudline/Crapto, Rooftop/Goldie and Codebreak/Bitcoin Sheriff; the separate Big Swole look-development study does not force Moonkeep into that scope. All12 may also be approved. See review-start.html and LOCAL-REVIEW.md for direct review links and a precise approval reply. Credit use is already authorized; this is a timing/pose/hit-area approval, not another budget request.

Higgsfield access is available. Read-only discovery verified AutoSprite custom animation and its required approved image reference. No job was submitted and this task spent0credits. Exact route, references, constraints and source record requirements are in HIGGSFIELD-HANDOFF.md. Future generation costs are unquoted; the current inventory does not establish sufficient credits or finished art.

## Important limits

Scripted controllers can read geometry and are not human players. Browser transition checks explicitly force lifecycle routes; they are separate from earned scripted clears. The all-boss visual review samples neutral states and source-verifies conditional behavior; it does not approve final motion. Planned IDs, PNG frames and procedural articulation do not satisfy the30+distinct production-animation requirement. Every unique defeat/escape sequence must still be rendered, integrated and verified through normal progression. Final clip integration also requires a terminal presentation lifecycle before the clear overlay.
