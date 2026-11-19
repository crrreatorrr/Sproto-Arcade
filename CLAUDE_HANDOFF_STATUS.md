# Handoff status: `CLAUDE_HANDOFF_OPTIMIZATION.md` (Sproto-Arcade)

Branch `claude/happy-pasteur-0dhfzp`. Each item is marked done (commit), partial, skipped or blocked.
Updated at the end of every phase.

## Phase 0: build leak, Tickets, copy

| Item | State | Notes |
|---|---|---|
| §1.1.1 strip `art/reference` provenance from `sprotel-art.js` | skipped | Provenance is archived record material (AGENTS.md) and pinned Sprotel data (a4d85ae). The leak is fixed in the build instead (next row); the 235 KB file is left for §1.3 minification. |
| §1.1.2 build denylist for `art/reference/` | done 2db74e5 | `tools/build-web.mjs` ignores `art/reference/` literals and fails if the game ever requests one. `art/rework/` is **not** denied: `index.html` (Machine Trials) loads `art/rework/weapons/*/manifest.js` and its frames at runtime (7 MB in dist). |
| §1.1.3 skip canonical `p1/p2.png` when the presentation WebP exists | done 2db74e5 | 26 PNGs, 68.5 MB. The canonical PNG was only the fallback after a failed WebP load. |
| Build-budget QA check | done 2db74e5 | `qa/build-budget.mjs` (run by build-web on every build and by `qa/run-all.mjs` when a web build exists, otherwise it reports a skip). It fails on the pre-fix build. |
| §2.4.1 levels 13 and 14 earn `arcade_clear` Tickets | done aec1643 | Indexes 0-13 queue the Tickets row. Server acceptance of levels 13/14 is the hub's side: see follow-ups. |
| §2.4.4 stale level-count copy | done 2c8a547 | `14 levels • 12 boss fights • 1 chase • 1 ascent`. |

## Measurements

| What | Before | After | How |
|---|---|---|---|
| `dist/` | 1446 files, 551.8 MB (117 MB `art/reference/`, 68.5 MB duplicate PNGs) | Phase 0: 1371 files, 361.4 MB | `node tools/build-web.mjs <dir>` summary |
| Level 1 cold start (until Start reads "Start level") | 312 requests, 25.87 MB | (Phase 1) | `node qa/cold-start-browser.mjs <dist>`; fresh Chromium profile, loopback server |

## Checks

| Command | Result |
|---|---|
| `node qa/run-all.mjs .` (baseline, before changes) | passed, 71 commands |
| `node qa/run-all.mjs .` (Phase 0) | passed after the script cache keys were refreshed (crash-guard fixture) |
| `node tools/build-web.mjs <dir>` | passed (verify replay against the built dir, no missing files, no page errors) |

## Cross-repo follow-ups

- metaverse-hub: the server must accept `arcade_clear` Tickets for levels 13 and 14 (indexes 12 and 13). If it refuses with a rule code (`bad_*`, `amount_over_rule`, …) the client drops the row, as before. This session cannot read metaverse-hub (not in this session's GitHub scope), so the server side is unverified.

## Proposed repo-hygiene deletions (owner decides)

- None yet. (§1.3.3 Git LFS for `art/reference/` and `art/rework/` is an owner decision.)
