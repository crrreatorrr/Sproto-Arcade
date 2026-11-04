# Implementation gates

This branch implements the 2026-11-04 Library handoff. Sproto Arcade is separate from Sproto Fighter. No push or publication is authorized.

## Baseline / interface

- Baseline: clean `main` a25acb1. Existing other worktree detached at f60fd6d; preserved.
- Interface commit: d36f7a4. Contract in INTERFACE.md; classic scripts; original entry retained as legacy.html.
- No repository .agents/skills or ancestor AGENTS.md found on the specified path.
- Actual Library handoff downloaded and readable locally (27,245 bytes), identity libfile_0ea0c635bd408191b856ce60e0152059.
- Baseline source map and browser evidence: qa packet, pending integration.

## Shared mechanics

- Runtime integrated at 180ac5c; 19 deterministic fixtures pass, including swept moving fronts, final dash tick, shield-only failure, ledge grace, retry and phase lifecycle.
- Weapons integrated at 8e07095; 10 deterministic fixtures plus9 actual runtime-effect fixtures pass, including drop bags, mode compatibility, charges, replacement, decoy eligibility, TTL and independent RNG.
- These are simulation fixtures, not human comprehension or balance validation.

## Four-stage slice

Technical prototype slice pinned at `156ee3d`:
- Marina: full-run1900 ticks, HP5; phase2 practice1198, HP5.
- Mudline: upper C-beam1594 ticks and lower V-bounced-ball1867; both no damage, no pickup powers.
- Rooftop: phase1 1937 ticks, phase2 1597 ticks, HP5; 990 strongest sampled non-dash attempts cannot land across480px marked gap; broad dash launch range succeeds.
- Codebreak: full1086 ticks, HP5; summit dash-counter gating, sector retry and no timer-only ascent checked.
- Actual `file://index.html` Chrome: all8 start/practice entries, real Shift/X inputs, forced named loss followed by real R retry, pause/resume pass with no exceptions or browser error logs. Forced routing is distinct from earned gameplay completion.
- Independent shared QA14 checks pass. Human comprehension and balance remain untested.

Remaining eight encounter implementation released after this combined technical gate. Production-art gate remains closed.

## Art approval

Production Higgsfield clips have not been commissioned. Placeholder machine drawings and existing pilot sprites are intentional. Encounter timing, critical poses, and hit-area approval remain required before final animation batches.

## Campaign implementation candidates

All twelve new modules have two authored tasks and executable base-kit fixtures. These numbers are scripted-controller observations, not player balance targets.

| Encounter | Integrated implementation | Standard-kit evidence |
|---|---|---|
| Marina | cadb837, b6e72ca | Full1900 / phase2practice1198 ticks; HP5 |
| Last Light | 2a946a3, e607ca5 | Full1307 / practice622; geometric mirror-return events, HP5 |
| Mudline | bffc03d,37ea6b6,aae7254 | Upper1594 / bounced lower1867; no hits |
| Ranch | 2a69744 | Phase1 685 + phase2 743; HP5;935 non-dash gap samples fail |
| Neon | a75658e | Phase1 994 + phase2 499; HP5; vertical alignment required |
| Circuit | 2a946a3 | Full2366 / practice1914; HP5; relay transfer requires dash |
| Moonkeep | 08ed7ce | Full763; HP4;100 non-dash upper-gap timings fail;15 dash timings pass |
| Crown | 2a946a3 | Full4042 / practice3338; HP5; separate shield/dash cores |
| Hatchery | 08ed7ce | Full1516; HP5; actual shell footing and firing-lane gate |
| Verse | aae7254 | Full1495; no hits;4 rift counters and4 exposed module sides |
| Rooftop | 42c00cd,4086850,953242a | Phase1 1937 + phase2 1597; HP5;990 non-dash gap samples fail |
| Codebreak | 4349ebf,08ed7ce | Updated full1250; HP4; upper and summit dash gates |

The full campaign browser matrix, clean-worktree regression and display-refresh check are the remaining technical release-candidate checks. Earlier routing-only checks must not be read as earned victory evidence. Standard-kit controllers exercise legal input state; fixtures may inspect geometry for deterministic timing.

## Production and human validation still open

Reference packs integrated at26f95cc for Dave, Big Swole, Goldie and three powers; manifests explicitly set productionApproved:false and contain no clips/generation IDs. Review entry: art-review.html. Remaining boss reference batches and all final animations follow signoff, rather than preceding encounter testing.

No eight-person formative playtest occurred. First-dash comprehension by attempt3, Phase2 task comprehension, restart perception, player balance and production-art readability are unvalidated. Do not call this a finished release or claim the production-art/acceptance gates passed.
