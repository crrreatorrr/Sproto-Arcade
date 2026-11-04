# Implementation gates

This branch implements the 2026-11-04 Library handoff. Sproto Arcade is separate from Sproto Fighter. No push or publication is authorized.

## Baseline / interface

- Baseline: clean `main` a25acb1. Existing other worktree detached at f60fd6d; preserved.
- Interface commit: d36f7a4. Contract in INTERFACE.md; classic scripts; original entry retained as legacy.html.
- No repository .agents/skills or ancestor AGENTS.md found on the specified path.
- Actual Library handoff downloaded and readable locally (27,245 bytes), identity libfile_0ea0c635bd408191b856ce60e0152059.
- Baseline source map and browser evidence: qa packet, pending integration.

## Shared mechanics

- Runtime integrated at 180ac5c; 22 deterministic fixtures pass, including swept moving fronts, final dash tick, shield-only failure, ledge grace, retry and phase lifecycle.
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
| Mudline | bffc03d,37ea6b6,aae7254 | Updated upper1592 / bounced lower1866; no hits |
| Ranch | 2a69744 | Phase1 685 + phase2 743; HP5;935 non-dash gap samples fail |
| Neon | a75658e | Phase1 994 + phase2 499; HP5; vertical alignment required |
| Circuit | 2a946a3 | Full2366 / practice1914; HP5; relay transfer requires dash |
| Moonkeep | 08ed7ce | Full763; HP4;100 non-dash upper-gap timings fail;15 dash timings pass |
| Crown | 2a946a3 | Full4042 / practice3338; HP5; separate shield/dash cores |
| Hatchery | 08ed7ce | Full1516; HP5; actual shell footing and firing-lane gate |
| Verse | aae7254 | Updated full1507; no hits;4 rift counters and4 exposed module sides |
| Rooftop | 42c00cd,4086850,953242a | Phase1 1937 + phase2 1597; HP5;990 non-dash gap samples fail |
| Codebreak | 4349ebf,08ed7ce | Updated full1250; HP4; upper and summit dash gates |

The full campaign browser matrix, clean-worktree regression and display-refresh check are the remaining technical release-candidate checks. Earlier routing-only checks must not be read as earned victory evidence. Standard-kit controllers exercise legal input state; fixtures may inspect geometry for deterministic timing.

## Production and human validation still open

Reference packs integrated at26f95cc for Dave, Big Swole, Goldie and three powers; manifests explicitly set productionApproved:false and contain no clips/generation IDs. Review entry: art-review.html. Remaining boss reference batches and all final animations follow signoff, rather than preceding encounter testing.

No eight-person formative playtest occurred. First-dash comprehension by attempt3, Phase2 task comprehension, restart perception, player balance and production-art readability are unvalidated. Do not call this a finished release or claim the production-art/acceptance gates passed.

## Clean campaign technical gate

Candidate `7c62524`, checked from clean detached `arcade-release-check`:
- All24 actual offline full-start/Phase2-practice entries,12 explicitly forced transitions, named loss/R retry and pause/resume passed with no browser errors.
- Six adapter checks passed, including remapping, reserved-key handling, phase/sector record isolation, transition pause/blur and next-encounter routing.
- Nineteen deterministic regression commands passed, including every stage's standard-kit fixtures.
- Controlled actual browser RAF schedules at30/60/120/144Hz produced the same144ticks and player X950 after2400.001ms.
- Six initial reference packs and all9 SVG review images loaded offline; all production approval flags false, delivered clips0.
- Evidence integrated at `e04d5f6`: qa/CAMPAIGN.md and campaign-*.json.

Later Codebreak motion polish integrated at `9e8b3d1` and label cleanup `d667240`:1200-tick continuity fixture passes, maximum articulated point step3.489px, six scanner states, planted feet, locked pilot/cab and fixed true vent bounds; same full standard-kit clear1250ticks HP4. This verifies placeholder motion continuity, not production sprite coverage or human perception.

## Additional animation requirement

Every boss now requires at least30 genuinely distinct production animations. Minimum campaign scope is360 boss clips. Planned inventory and delivered clips are separate manifest fields. Frames, duplicated holds and duplicate footage do not count as extra animations. See ANIMATION-PRODUCTION.md. Production remains gated on human timing/critical-pose/hit-area approval; no final Higgsfield clips are claimed.

Animation inventory integrated at `8cb2ef1`: all12 bosses, both phases,388 distinct motion requests (32 each;36 for Codebreak),12 bespoke terminal plans including Goldie's escape. Validator passes IDs, distinct request keys/briefs, per-phase coverage and terminal links. Actual verified production clips0; verified terminal clips0. All twelve bosses now have both-phase reference guides: three procedural silhouette studies and nine gameplay-capture guides. Nine bespoke concept/look-development passes still need approval; no guide is final production art. Quantity and semantic distinctness of future rendered motion require review, not only metadata validation.

Supported Higgsfield route verified read-only: AutoSprite custom image-output animation with one approved reference,2–64frames per clip,32–512px frame size. Credits are authorized, but no generation job was submitted and spend is0. docs/HIGGSFIELD-HANDOFF.md contains exact supported parameters, reference paths and production workflow. Free coverage for AutoSprite has not been established; no total campaign cost is invented.


## Final code verification and all-boss review

Clean code candidate `e1c9dbc` passes20regressioncommands,24offline start/practice entries,12forced transition/retry routes,6adapter checks and4refresh schedules. Final affected browser checks exercise Codebreak six-state motion and an earned summit-only standard-kit clear402ticks HP5, plus correct absence of inactive platform solids. Review assets15packs and9initialSVGimages load offline. Evidence: qa/RELEASE.md and release-*.json, integrated from QA f542a51. These are technical checks, not human comprehension or final-art approval.

All12bosses /24phases also have actual offline visual sampling:96exact-tick renders plus24camera-only diagnostic boss frames, zero browser errors,24tracked representative keyframes. Refreshed against clean `e1c9dbc`; contact sheet24/24images load offline. art/rework/review/REVIEW.md separates observed placeholder motion from recommended critical poses and terminal sequences. Animated bespoke transforms0/12 and production terminal animations0/12 remain open.


All-boss guide prep completed after the production checkpoint: `39374e0` adds18self-containedSVGguides for the remaining9bosses, using unchanged clean-e1game captures with pilot/target overlays. Existing3style studies are retained. All12reference packs remain candidates, with human timing/critical-pose/hit-area review pending. This is permitted pre-production work, not final clip delivery.
