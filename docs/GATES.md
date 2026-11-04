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
