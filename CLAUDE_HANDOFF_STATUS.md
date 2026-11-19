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
| §2.4.4 stale level-count copy | done 2c8a547, 797bc83 | Tagline `14 levels • 12 boss fights • 1 chase • 1 ascent`; title card "Fourteen encounters". |

## Phase 1: assets and cold boot

| Item | State | Notes |
|---|---|---|
| §1.2.1 transition atlas off the Start path | done 3d4eb0f | `loadFor()` no longer waits for it; `prefetchTransition()` fetches it right after the level is ready (also on a warm start, since the cache keeps only two). The transition clock already plays the same simulation ticks without the clip. |
| §1.2.2 skip fallback boss frames | done 3d4eb0f | Skipped only when `ArcadeBossSheets` can draw both phases of the stage; Start already waits for those sheets. |
| §1.2.3 portraits | done 3d4eb0f | 200px WebP copies (3.87 MB → 0.50 MB). PNGs kept as source. `loading="lazy"` not used: the portraits are on the first screen. |
| §1.2.4 split `coreAssets()` | done 3d4eb0f | Arena motion (by mechanics index, as `drawArenaMotion`/`drawPhaseTwoAtmosphere` choose it), saucer/flight flames/Mudline mecha (flying levels) and Goldie (chase) moved to `stageAssets(index)`. Move-driven attack art (vault laser, ceiling sweep, hazards, shield pulse, barn fire, hatchery bubble, saucer muzzle) stays shared, since several levels' moves draw it. |
| §1.2.5 pickups → WebP | done 68b514e | 1024px lossless WebP (642 KB) of the 2048px verified atlas (3.69 MB, kept as the verified source). |
| §1.2.5 transitions → WebP | skipped | Lossless WebP is larger than the PNG (3.24 vs 3.13 MB for Level 1); only lossy q92 halves it. Left as PNG: no longer on the cold path. |
| §1.2.5 projectile atlases → WebP | done 936282a | Lossless exact copies, pixel-identical (checked by `tools/make-projectile-presentations.py --check` in run-all): 45.9 → 32.9 MB. |
| §1.2.5 missiles, Sprotel pages → WebP | skipped | Missiles: lossless saves only 23% (955 → 732 KB for Level 1) and `tools/verify-density-assets.py` pins the PNG paths. Sprotel pages are the pinned a4d85ae artwork with per-page sha256 in `sprotel-art.js`; left untouched. |
| §1.2.6 per-Sproto fighter atlases | skipped | Needs a new atlas format in `assets.js` plus the fighter draw path; the gain is in the 2P lobby, not the Level 1 cold start. Candidate for a later pass. |
| §1.3.1 factor `sprite-hitboxes.js` | skipped | It is an input of `dist/arcade-sim.server.js`, whose `ARCADE_SIM_VERSION` is the sha256 of the bundle body. Any change to its source text changes the pinned sim version the hub verifies replays against. It is also the write target of several generator tools (`pack-boss-*`, `transfer-ranch-pilot.py`, `import-sprotel-assets.py`) that edit it by markers. Gzip already brings it to 51 KB on the wire. A build-time compaction for the web copy only is possible later. |
| §1.3.2 bundle the classic scripts | skipped | Concatenating 33 classic scripts is not behaviour-neutral: `const`/`let` read with `typeof` across files hit the TDZ, function declarations hoist across file boundaries, four scripts read `document.currentScript.dataset.profile`, and `runtime/crash-guard.js` relies on a failing script not stopping the others. Needs its own review. |
| §1.3.3 Git LFS for `art/reference/`, `art/rework/` | skipped | Owner decision (history rewrite / storage), listed below. |

## Phase 2: co-op

| Item | State | Notes |
|---|---|---|
| §2.1.1 sim event queue for presentation calls | skipped | Not needed for co-op: the server build already stubs `sound`/`announce`/`refreshHud`/`setOverlay`/`clearLevel` (server-entry.js), and lockstep peers run the same browser code. A refactor of every presentation call would only add golden risk. |
| §2.1.2 `player` → `players[]` with 1P bit-for-bit | done c2a00e2 | `players` is null in solo; with two seats `player` is the current seat (swapped per seat). All `qa/golden` story replays, the disabled-collision archive and the fuzz hashes pass unchanged. Per-player `slot`, `reviveProgress`, `sweepHit`, `shieldUntil`, `absorbedAt`, `connected`. Spawns: ground seat 2 at x−70; flight/naval at x−50, y+100 (seat 1 keeps the solo spawn, so the handoff's (260,290) was not applied). `tetherTimer`, `activeInputTicks` not added (chase/climb stay solo; AFK is the server's count). |
| §2.1.2 visuals and HUD | done a8e9b3d | P1/P2 badges, faded downed seat with a revive ring, P2 hearts strip. The 2 px rim outline was not added (per-frame outline cost); missile/bomb/shield status for P2 not mirrored. |
| §2.1.3 downed, revive, phase-2 auto-revive | done c2a00e2 | 56 px / 90 ticks / 2 hearts / 90 ticks invulnerable, `SimMath.hypot`. |
| §2.1.3 chase and climb fall tether | skipped | Co-op covers the boss levels only; chase (11) and climb (12) play solo even with Local 2P chosen. |
| §2.1.4 round-robin targeting | done c2a00e2 | Chosen once per move start (`boss.targetCounter`, `boss.targetSlot`), so one move's aims all read one seat; no distance tie-breaks. Chase/climb aims untouched (solo). |
| §2.1.4 ceilingSweep, shieldPulse, density, powerups | done c2a00e2 | Per-seat `sweepHit`; pulse gated on every standing seat and hits each; barrage opening alternates seats by cycle; one heart + two shields, per-seat shield. |
| §2.2 boss HP 1.80x and `powerupSpan` `baseMax` fix | done c2a00e2 | Levels 1-10, 13, 14. Codebreak 1.85x: constant defined, not applied (climb is solo). |
| §2.2 `rescaleBossForSeats` / downed never rescales | done c2a00e2 | Only `dropSeat` (online SEAT_DROP) rescales; tested. |
| §2.3 Local 2P | done a8e9b3d | Keyboard split plus direct controller read (see docs/COOP.md). |
| §2.3 online client `coop-net.js` + lobby | done a8e9b3d | To the shared protocol v1; tested against `qa/coop-mock-relay.cjs`. Not tested against the real hub match (metaverse-hub side). |
| §2.4.2 `coopBest` | done 6fa021d | |
| §2.4.3 server-side settlement | done (client side) a8e9b3d | Client sends OP_RESULT, shows OP_OUTCOME, never grants. Settlement is the hub's job; the mock relay models it for tests only. |
| §2.4.4 story-14 golden and `story-par.js` | done 02ee5e1 | Bot clear in 4726 ticks, par 5908. `fuzz.json` re-recorded (first 13 hashes unchanged); goja passes. |
| §3.2 duration parity bots | partial | `qa/coop-sim.test.cjs` compares two unkillable seats at 1.80x with one seat at solo health on the same solo-golden inputs: 0.85-1.08x on 11 levels (10 of 11 within ±10%; Level 8 0.845). Closed-loop two-seat bots were not built: open-loop replays of the solo goldens lose once targeting alternates. Human playtests should confirm 1.80x. |
| §3.3 edge cases and 10,000-tick two-peer parity | done c2a00e2 | `qa/coop-sim.test.cjs`, `qa/coop-net.test.cjs`. |

## Phase 3 and review

| Item | State | Notes |
|---|---|---|
| Review of the full diff (`/code-review`, medium) | done 8afb138 | Fixed: co-op hit count for rank/best, downed seat falling, per-seat shield drawing, arena 1 crystal frames, WebP retry when the PNG fallback is not shipped, Start with Online 2P chosen, non-co-op levels in the lobby, feedback form pausing online, unlock handling on Local 2P clears. Kept: levels 13/14 send Tickets (the brief asks for it; server acceptance is a follow-up). |
| Online co-op safety | done 938b7e3 | God mode toggle ignored online (would desync); input sent in real 2-tick batches. |
| Asset audit coverage | done ef1e005 | `?assetAudit` still loads fallback boss frames; lazy-load check counts WebP copies. |
| Remaining skipped items | skipped | §1.2.6 fighter atlases, §1.3.1/§1.3.2 (reasons above), §2.1.1, chase/climb co-op. |

## Measurements

| What | Before | After | How |
|---|---|---|---|
| `dist/` | 1446 files, 551.8 MB (117 MB `art/reference/`, 68.5 MB duplicate PNGs) | Phase 0: 1371 files, 361.4 MB. Phase 1: 1371 files, 342.1 MB. Final: 1372 files, 342.2 MB | `node tools/build-web.mjs <dir>` summary |
| Level 1 cold start (until Start reads "Start level") | 312 requests, 25.87 MB (274 PNG / 22.6 MB, 33 JS / 1.88 MB) | End of Phase 1: 219 requests, 13.26 MB. Final (with coop-net.js): 220 requests, 13.30 MB. Phase 1 detail: 219 requests, 13.26 MB (160 PNG / 4.19 MB, 25 WebP / 7.17 MB, 33 JS / 1.88 MB). The transition atlas and next-level prefetch (10 requests, 11.1 MB) now load after Start is enabled. | `node qa/cold-start-browser.mjs <dist>`; fresh Chromium profile, loopback server. A request counts if it was issued before Start was enabled. |
| Handoff target <2.5 MB / <25 requests | not met | The rest is the Level 1 boss: both phase sheets and projectile atlases (Start waits for both phases, `stageReady`), plus 33 scripts. Deferring phase 2 art needs a phase-2 readiness gate, since the fallback sprites no longer load. | |

## Checks

| Command | Result |
|---|---|
| `node qa/run-all.mjs .` (baseline, before changes) | passed, 71 commands |
| `node qa/run-all.mjs .` (Phase 0) | passed after the script cache keys were refreshed (crash-guard fixture) |
| `node qa/run-all.mjs .` (Phase 1) | passed, 73 commands |
| `node tools/build-web.mjs <dir>` | passed (verify replay against the built dir, no missing files, no page errors) |
| `node qa/run-all.mjs .` (final) | passed, 75 commands (adds coop-sim, coop-net, projectile presentations, build budget) |
| `node tools/build-server-sim.mjs --check`, `node tools/check-server-bundle.mjs` | passed; taint check clean; sim version cb695a19130dc99a |
| `cd tools/goja-verify && go run . ../..` | passed: 14 goldens and fuzz hashes in goja |
| `node qa/build-budget.mjs . <dist>` | passed on the final build; fails on the pre-fix build |
| `node qa/coop-browser.mjs` | passed: Local 2P in Chromium, two seats, P2 HUD, no page errors |
| Browser QA in `qa/` | passed: story, story-hud, replay-golden, replay, menus, hub-link, feedback. Failing identically on `main` (aa0f6ba), so pre-existing: story-results ("2 of 13 cleared" expectation), ui (`ArcadeStory…state` null), gamepad ("stick up does not jump"), lazy-load (40 stage-effects paths from its baseline; 40 on main and on this branch after ef1e005). Not run: adapter, affected, art, baseline, filter-budget, guide, local-server, missile, pacing, playtest, refresh (Machine Trials / art evidence, unaffected by this work). |
| Online against the real hub | not run: needs metaverse-hub's `sproto_arcade_coop`. Human playtests of co-op balance not done. |
| Browser spot check | Level 1 title and gameplay screenshots from the built dist: portraits, boat, boss, missiles render; no page errors |

## Contract deviations

None. Backward-compatible additions: `arcade.coop_join` may answer `{error}` in the body or as an RPC error (the client handles both); `OP_READY` carries `{}`.

## Cross-repo follow-ups

- metaverse-hub: the server must accept `arcade_clear` Tickets for levels 13 and 14 (indexes 12 and 13). If it refuses with a rule code (`bad_*`, `amount_over_rule`, …) the client drops the row, as before. This session cannot read metaverse-hub (not in this session's GitHub scope), so the server side is unverified.
- metaverse-hub: build `sproto_arcade_coop` and the three RPCs to protocol v1 (docs/COOP.md). Settlement uses the server's own AFK count and the same `arcade_clear` / `breakwater_coin` ledger rows and idempotency keys as the solo path, scoped per match and account.
- metaverse-hub: re-pin `dist/arcade-sim.server.js`. Its sim version changed from 3bc257947b2e427e to the version in `runtime/story/sim-version.js` (co-op sim and the `ArcadeSim.coop` API). Solo replays verify the same way; logs stamped with the old version need the new bundle on the server.
- hub-sdk: `coop-net.js` uses `HubSDK.realtimeFromSdk(sdk).connect/rpc/joinMatch` and `match.send/onMessage/leave` from the vendored SDK as it is; no re-vendor was needed.

## Proposed repo-hygiene deletions (owner decides)

- §1.3.3: move `art/reference/` (168 MB) and raw `art/rework/` authoring sheets to Git LFS or archive storage. Owner decision; nothing was deleted.
- `art/portraits/*.png`, `art/generated/pickups/items.png` and the `p*-projectiles.png` atlases are no longer requested by the game. They are kept as the verified sources the QA tools hash.
