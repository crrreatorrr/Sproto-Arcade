# Gameplay improvement plan

## 1. Status

Implemented in part on 2026-11-11, on branch `claude/trusting-ramanujan-63h582`; section 11 lists what was done, what was skipped and what the bot measured afterwards. Sections 2 to 10 are the plan as written and describe the game before that work: their line numbers, figures and `ARCADE_SIM_VERSION` refer to commit `936f939`.

Written 2026-11-09 against commit `b40bcbf`; re-validated 2026-11-11 at commit `936f939`.

The one commit between them ("Report the Breakwater Coin on every first-boss win") changed hub reporting only. `game.js` kept its line count, so every `game.js` line number here still holds; `hub-link.js` numbers below are the new ones. `ARCADE_SIM_VERSION` is still `e992c779ac0f8b62`, so the golden replay figures stand. The browser runs in section 2 were made at `b40bcbf` and were not repeated; the retry behaviour seen there (no replay recorder on a phase-2 checkpoint run) is unchanged in the code. Section 4.4 lists what that commit resolved.

The repo holds two games that share art, the barrage planner (`density-attacks.js`) and the pickup planner (`phase-powerups.js`):

- **Story mode** (`legacy.html`, `game.js`, "The Long Way Home"). The hub ticket opens this page, and it is the only mode that reports to the hub. Thirteen levels: eleven two-phase bosses, a rooftop chase and a climb that ends in an arena boss.
- **Machine Trials** (`index.html`, `rework.js`, `runtime/core/world.js`, `stages/`). The default page when the game is opened without a ticket. An objective-based prototype with its own player physics, on placeholder gradient backdrops.

Unless an item says otherwise it applies to story mode. Items marked "both" touch shared files and change Machine Trials too.

Terms used here: a **tick** is one simulation step (60 per second). A **section** is a quarter of a boss's health in the current phase (`healthSection`, `game.js:800`). The **move clock** is the per-boss counter that times tells and attacks; it advances `bossAttackRate` ticks per frame (`game.js:1081`). A **re-pin** is the rebuild of `dist/arcade-sim.server.js`, its version, the goldens and the hub's vendored copy described in `docs/SERVER-SIM.md`.

## 2. How this was audited and how far to trust it

**Read:** `game.js`, `levels.js`, `arena-effects.js` (hazard tables), `codebreak.js`, `density-attacks.js`, `phase-powerups.js`, `boss-sheets.js`, `hub-link.js`, `story-progress.js`, parts of `runtime/core/world.js`, the build tool, and the docs named in section 5.

**Run in headless Chromium** (Playwright, 1320x900 viewport, device scale 1) against `python3 -m http.server 5305` in the repo root:

- Story levels 1 and 7 (`legacy.html?level=N`) with synthetic key presses, with and without god mode (double-tap `9`), up to the first barrage, a heart pickup and phase 2.
- Death and `R` retry in phase 1 and phase 2 of level 1.
- A short Machine Trials run of stage 1.
- No console errors or failed requests in any run.

Game state was read through `page.evaluate`, because `game.js` keeps it in top-level `let` bindings (`mode`, `time`, `player`, `boss`, `bullets`, `densityShots`, `phasePowerupsState`).

**Slow-motion measurement.** Ticks per second = change in `time` divided by change in `performance.now()` over 3-second windows on level 1, god mode on, player fire off (`Z`). The run was repeated with every canvas filter disabled by an init script that redefines `CanvasRenderingContext2D.prototype.filter` as a no-op accessor before the page's scripts load.

| Window | Filters as shipped | Filters disabled |
|---|---|---|
| Normal play, first 3 s | 22.1 | 56.0 |
| Normal play, next 3 s | 6.4 | 52.2 |
| Barrage, three windows | 11.7, 4.8, 2.6 | 53.5, 54.3, 50.3 |

One frame with 12 missiles on screen took about 490 ms to draw. **This was software rendering. It is unverified on a real GPU**, and the test switched off all filters at once, so the share caused by each filter is inferred, not measured.

**Golden replays.** The committed bot clears (`qa/golden/story-NN.json`) were replayed through the source simulation (`loadSourceSim({dev:true})` in `tools/build-server-sim.mjs`, after `npm ci`; `decodeInputs(log.inputs, log.ticks)`, then `_dev.reset(level-1, pilot, shieldWait, seed)`, `_dev.step(mask)`, `_dev.state()`), recording phase changes, barrage windows, pickup spawns and health changes. These are a lookahead bot's runs (`tools/story-bot.mjs`), not a person's.

**No human playtest exists** (`qa/PLAYTEST.md`, `docs/GATES.md`). Every statement here about what a player feels is a prediction from code and bot data. The scripts used are not committed.

## 3. What already works and should be kept

- Fixed 60 Hz step with a 66 ms frame cap, deterministic replay and server verification (`docs/SERVER-SIM.md`).
- Responsive on-foot controls: 7-tick jump buffer, variable jump height (gravity 0.94 held, 1.28 released, `game.js:728`), air jump, air dash, 71 ticks of invulnerability with a blink after a hit.
- The two mandatory mechanics keep a constant real-time warning however fast the boss gets: the ceiling sweep tell is 78 frames (`game.js:836`) and the shield pulse 84 frames on foot, 204 in flight (`game.js:834`).
- Shield pulses are fair by construction: a pulse is deferred while the shield is on cooldown (`game.js:828`), and phase-2 health cannot drop past the pulse floors (`game.js:1287`).
- Ground columns and arena hazards have minimum warnings (30 and 44 frames, `game.js:843-844`).
- Every boss has its own phase-2 arena, arena hazard and phase-shift sequence.
- Projectile keylines read well against every backdrop seen. Keep the look; change how it is drawn (A1).
- Phase-2 retry is instant and restores five hearts (observed).
- The chase and the climb already name each attack in the cue line (`CHASE_ATTACKS`, `CODE_SHOTS`). Boss fights should copy this.
- Machine Trials shows an objective line and "Last hit: <source>".

## 4. Findings

### 4.1 Campaign in play order

Phase-1 health is `PHASE_ONE_HEALTH=1065` for every boss (`game.js:166`); phase-2 health is `ceil(hp/2)` (`game.js:494`). Cadence and shot rate come from `BOSS_PROFILES` (`levels.js:91`), signatures from `BOSS_SIGNATURES` (`levels.js:131`), hazards from `PHASE_TWO_HAZARDS` (`arena-effects.js:509`).

| # | Id | Level / boss | Type | P1 HP | P2 HP | Cadence / shot rate | Signatures (P1, P2) | P2 arena hazard |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | Tidebreak Marina / Fat Head Dave | On foot | 1065 | 132 | 1.00 / 1.00 | anchorRun, bellSweep | Yacht cannon beam |
| 2 | 13 | Redkev's Marina / Redkev | On foot | 1065 | 132 | 1.00 / 1.00 | anchorRun, bellSweep | Yacht cannon beam |
| 3 | 2 | Last Light Bar / Morelight | On foot | 1065 | 139 | 1.02 / 1.02 | cabinetRush, casinoBounce | Vault crystals and chandeliers |
| 4 | 3 | Mudline Trenches / Crapto | Flight | 1065 | 143 | 1.06 / 1.04 | none (flight pool) | Floodgate pressure jets |
| 5 | 4 | Sproto Ranch / Halloween 2008 | On foot | 1065 | 151 | 1.09 / 1.07 | solarVolley, hourglassDrop | Threshing wheels and lantern fire |
| 6 | 5 | Neon Tomorrow / Collector | On foot | 1065 | 156 | 1.12 / 1.09 | diamondStep, crystalFlank | Transit signal volley |
| 7 | 6 | Circuit Gate / Bongraker | On foot | 1065 | 160 | 1.16 / 1.12 | prismRicochet, tridentArc | Bunker ceiling turrets |
| 8 | 7 | Moonkeep Castle / Big Swole | Flight | 1065 | 167 | 1.19 / 1.15 | none (flight pool) | Forge slag spill |
| 9 | 8 | Crown Relay Chamber / Alpha 777 | On foot | 1065 | 172 | 1.23 / 1.18 | casinoBounce, solarVolley | Astrolabe star volley |
| 10 | 9 | The Hatchery / High Sproto | On foot | 1065 | 178 | 1.27 / 1.21 | frostRotor, meteorFall | Hatchery bio-pod volley |
| 11 | 10 | Verse Gate / Bot Sales | On foot | 1065 | 183 | 1.30 / 1.24 | prismRicochet, hourglassDrop | Dimensional rift crossfire |
| 12 | 11 | Rooftop Breakaway / Goldie | Chase | n/a | n/a | n/a | n/a | n/a |
| 13 | 12 | Codebreak Ascent / Bitcoin Sheriff | Climb, then arena | climb | 360 | n/a | n/a | n/a |

Barrage shape (`density-attacks.js:65-68`; tier = `floor(rank/3)`, plus 1 in phase 2 from rank 3) and golden bot timings. On foot the rows are "middle" (crouch under), "floor" (jump) and "high-floor" (short hop); in flight each wave is a wall with one gap.

| # | Level | Tier P1/P2 | Waves P1/P2 | Missile px/tick P1/P2 | Clear ticks (s) | Phase 1 ticks (s) | Phase 2 ticks (s) | P1 barrage ticks (length) | P2 barrage length | Bot hits (in barrage) | Dash presses |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Tidebreak Marina | 0/0 | 5/5 | 5.20/5.58 | 9407 (157) | 7704 (128) | 1608 (27) | 528-1117 (589) | 571 | 0 (0) | 137 |
| 2 | Redkev's Marina | 0/0 | 5/5 | 5.32/5.70 | 8976 (150) | 6914 (115) | 1967 (33) | 881-1390 (509) | 562 | 2 (0) | 108 |
| 3 | Last Light Bar | 0/0 | 5/5 | 5.44/5.82 | 8994 (150) | 6616 (110) | 2283 (38) | 438-1013 (575) | 559 | 2 (1) | 105 |
| 4 | Mudline Trenches | 1/2 | 6/7 | 5.82/6.82 | 8989 (150) | 6564 (109) | 2330 (39) | 491-1078 (587) | 599 | 0 (0) | 103 |
| 5 | Sproto Ranch | 1/2 | 6/7 | 5.94/6.94 | 9510 (159) | 7425 (124) | 1990 (33) | 528-1136 (608) | 627 | 0 (0) | 125 |
| 6 | Neon Tomorrow | 1/2 | 6/7 | 6.06/7.06 | 8659 (144) | 6594 (110) | 1970 (33) | 515-1121 (606) | 554 | 2 (0) | 105 |
| 7 | Circuit Gate | 2/3 | 7/8 | 6.44/7.44 | 8861 (148) | 6427 (107) | 2339 (39) | 616-1262 (646) | 652 | 2 (0) | 123 |
| 8 | Moonkeep Castle | 2/3 | 7/8 | 6.56/7.56 | 9315 (155) | 6983 (116) | 2237 (37) | 438-1045 (607) | 617 | 1 (0) | 61 |
| 9 | Crown Relay Chamber | 2/3 | 7/8 | 6.68/7.68 | 8752 (146) | 6572 (110) | 2085 (35) | 660-1296 (636) | 649 | 2 (1) | 119 |
| 10 | The Hatchery | 3/4 | 8/9 | 7.06/8.06 | 8931 (149) | 6664 (111) | 2172 (36) | 470-1131 (661) | 678 | 2 (1) | 124 |
| 11 | Verse Gate | 3/4 | 8/9 | 7.18/8.18 | 10107 (168) | 7943 (132) | 2069 (34) | 564-1224 (660) | 672 | 3 (2) | 166 |
| 12 | Rooftop Breakaway | 3 | 8 | 7.30 | 7720 (129) | n/a | n/a | 429-1087 (658) | n/a | 3 (3) | 72 |
| 13 | Codebreak Ascent | 4/4 | 9/9 | 7.68/8.06 | 8880 (148) | 5686 (95) climb | 3194 (53) | 434-1005 (571) | 678 | 1 (1) | 75 |

### 4.2 Tell lengths and shot speeds

Move clock rate = `0.9 x cadence x (1 + 0.08 x section)`, the same in both phases. A tell of N ticks lasts `ceil(N / rate)` frames; ordinary tells are 26 to 43 ticks (`moves`, `game.js:128`). Shot speed = authored speed x `0.9 x shotRate x (1.12 in phase 2) x (1 + 0.07 x section)` (`game.js:662`); authored speeds run from about 8 to 16 px. The exposed window (weak spot open) is `max(9, rest - 13 in phase 2 - 2 x section)` ticks (`game.js:1116`). Sections 2 and 3 fall between the columns shown.

| # | Boss | Clock rate S1 / S4 | 28-tick tell, frames S1 / S4 | 34-tick tell, frames S1 / S4 | A 15 px shot, px per frame: P1 S1 / P1 S4 / P2 S1 / P2 S4 | Exposed frames (rest 31): P1 S1 / P1 S4 / P2 S1 / P2 S4 |
|---|---|---|---|---|---|---|
| 1, 2 | Fat Head Dave, Redkev | 0.90 / 1.12 | 32 / 26 | 38 / 31 | 13.5 / 16.3 / 15.1 / 18.3 | 35 / 23 / 20 / 11 |
| 3 | Morelight | 0.92 / 1.14 | 31 / 25 | 38 / 30 | 13.8 / 16.7 / 15.4 / 18.7 | 34 / 22 / 20 / 11 |
| 4 | Crapto | 0.95 / 1.18 | 30 / 24 | 36 / 29 | 14.0 / 17.0 / 15.7 / 19.0 | 33 / 22 / 19 / 11 |
| 5 | Halloween 2008 | 0.98 / 1.22 | 29 / 24 | 35 / 28 | 14.4 / 17.5 / 16.2 / 19.6 | 32 / 21 / 19 / 10 |
| 6 | Collector | 1.01 / 1.25 | 28 / 23 | 34 / 28 | 14.7 / 17.8 / 16.5 / 19.9 | 31 / 21 / 18 / 10 |
| 7 | Bongraker | 1.04 / 1.29 | 27 / 22 | 33 / 27 | 15.1 / 18.3 / 16.9 / 20.5 | 30 / 20 / 18 / 10 |
| 8 | Big Swole | 1.07 / 1.33 | 27 / 22 | 32 / 26 | 15.5 / 18.8 / 17.4 / 21.0 | 29 / 19 / 17 / 10 |
| 9 | Alpha 777 | 1.11 / 1.37 | 26 / 21 | 31 / 25 | 15.9 / 19.3 / 17.8 / 21.6 | 29 / 19 / 17 / 9 |
| 10 | High Sproto | 1.14 / 1.42 | 25 / 20 | 30 / 24 | 16.3 / 19.8 / 18.3 / 22.1 | 28 / 18 / 16 / 9 |
| 11 | Bot Sales | 1.17 / 1.45 | 24 / 20 | 30 / 24 | 16.7 / 20.3 / 18.7 / 22.7 | 27 / 18 / 16 / 9 |

### 4.3 Findings list

**F1. Canvas filters put the game in slow motion. High. Measured in headless software rendering; unverified on a GPU.** Every themed enemy shot is drawn through five chained `drop-shadow` filters (`boss-sheets.js:265`) and every barrage missile through two (`boss-sheets.js:300`). The boss is drawn through `brightness(1.38)` for 4 ticks after each hit (`game.js:1657`, mecha `:1588`), which with autofire landing every 9 ticks is close to half of all frames. Further colour filters: `game.js:1789`, `arena-effects.js:257, 369, 442, 500`. See the table in section 2. Because the loop caps a frame at 66 ms, a slow machine gets slow motion, not dropped frames. Barrages put 25 to 126 missiles in a plan, so they are the worst case. Shared by both modes.

**F2. Phase 1 is long and the same length for every boss. High. Read and replayed.** The bot needs 6,427 to 7,943 ticks (107 to 132 s) for phase 1 and 1,608 to 2,339 ticks (27 to 39 s) for phase 2, of which 9 to 11 s is the barrage. Base damage is about 7 per second from autofire (one shot per 9 ticks, `game.js:692`) plus the two specials (2 per 120 ticks, 4 per 180, `game.js:169`, `:1274`). A death late in phase 1 costs up to two minutes (retry observed). Whole-fight time is flat across the campaign: 144 to 168 s from level 1 to level 11.

**F3. The November additions all land in the first quarter-minute of a phase. High. Read, replayed, partly observed.** One barrage per phase attempt (`game.js:1451`; Machine Trials `world.js:191`), starting 429 to 881 ticks into phase 1. Both pickups are planned inside ticks 180 to 990 (`phase-powerups.js:9`); the 47 spawns in the goldens fell at ticks 223 to 888. After roughly tick 1,400 a phase-1 fight has no barrage and no pickup for a further 85 to 110 s.

**F4. Pickups collide with barrages and hearts arrive at full health. Medium. Replayed and observed.** 21 of the 47 golden spawns appeared during a barrage, with the 240-tick expiry running. On level 1 the heart appeared at pickup tick 437 inside a barrage that began at 420 (observed). A heart collected at five hearts does nothing (`updatePhasePowerups`, `game.js:576`), and hearts are planned for the opening seconds, when the player has full health.

**F5. Bosses differ mainly by art and ordering. Medium. Read.** All nine on-foot bosses use the same eight section attacks in a different order (`BOSS_SECTION_ATTACKS`, `levels.js:118`), the same ceiling sweep as the second move of every section (`game.js:826`) and the same shield pulse. What differs: five of twelve base moves, two signatures, the phase-2 hazard, cadence. Mudline and Moonkeep share one flight pool (`FLIGHT_POOLS`, `levels.js:159`) and have no signatures; Moonkeep's own content is the vertical patrol (amplitude 54 px, then 70; `game.js:1087`) and the absence of the mecha. Redkev is Fat Head Dave's kit, profile and hazard (`levels.js:66`, `acts` in `game.js`).

**F6. Mandatory mechanics are not taught. Medium. Observed and read.** The ceiling sweep cannot be dashed or out-waited; it needs a crouch or the shield for all 40 active ticks (`game.js:903`). It has no cue text, and although its tell is 78 frames the descending ceiling is drawn only for the last 36 (`drawCeilingSweep`, `game.js:1873`). The synthetic input lost a heart to it on level 1. During a barrage the cue line is blanked (`game.js:554`) while fire is cut and the boss freezes without explanation; the first barrage on level 1 opens with a crouch row. In flight levels the cue reads "EXPOSED · Jump to hit the weak spot" (`game.js:560`, seen on Moonkeep). Boss attacks are never named, unlike the chase and the climb.

**F7. Late tells are short. Medium. Read.** By the last section of level 11 a 28-tick tell lasts 20 frames (0.33 s) and a fast shot covers 22.7 px per frame, crossing the 600 px from boss to player in under half a second. The exposed window falls to 9 frames, so hitting the weak spot for triple damage becomes impractical exactly when fights are longest.

**F8. Dash answers almost everything. Medium. Read; bot behaviour.** A dash gives 11 invulnerable ticks and can be repeated 24 ticks after the press (`game.js:743-745`), so 46% of the time is immune to every shot, column, beam and barrage missile (`hurt`, `game.js:598`). Only the sweep, the pulse and body contact ignore it. The bot presses dash 61 to 166 times per level. Whether people play this way is unknown.

**F9. Barrages are fair but passive, and nearly free in flight. Medium. Read and observed.** Missiles travel 5.2 to 8.2 px per tick and need 2 to 3 s to arrive. The player cannot fire and the boss takes no damage (`movePlayer(false)`, `game.js:1472`), so each barrage is 8.5 to 11 s with no progress. In flight the gap is 240 minus 18 per tier (204 px, then 186 on Moonkeep), opens where the saucer already is, and shifts at most 20 px per tier between walls (`density-attacks.js:89-93`): 40 to 60 px on Moonkeep, about 6 ticks of travel with 62 to 66 ticks to do it. On level 1 the ground rows read clearly (observed).

**F10. Little reason to replay, and one reward rule is hidden. Medium. Read and observed.** Story mode has no score, timer, rank or best time. Every level is selectable from the start. Rewards are 20 Tickets per clear and four unlockable pilots, which play identically. A clear after a phase-2 retry saves locally and earns no Tickets and no immediate cloud save (`game.js:517` passes `checkpoint`; `hub-link.js:238`, `:251`). The player is never told. Redkev pays no Tickets even on a full run (`hub-link.js:243`). The Breakwater Coin part of this finding is resolved; see 4.4.

**F11. Saucer hitbox is inconsistent. Low. Read.** Ordinary shots test a saucer 116 px wide (`game.js:1250`); barrage missiles test 36 px (`game.js:1476`).

**F12. Thin audio and impact. Low. Read and observed.** No audio files and no music. Every sound is one triangle-wave sweep (`sound`, `game.js:393`, 30 call sites). A hit on the boss is a 4-tick brightness flash; a hit on the player is a 12-tick shake and a puff.

**F13. Generic fail screen. Low. Observed.** "Down for the count! Fat Head Dave wins this round." with no cause, no progress and no hint (`game.js:609`). The chase and climb already say why ("You fell between the rooftops").

**F14. Flight shots do not come from the boss. Low. Read; unverified on screen.** In flight patterns a "boss" shot spawns at the height the player had when the move began, not at the dragon or machine (`attackBoss`, `game.js:877-884`), so on Moonkeep shots can appear well away from the patrolling dragon.

**F15. Chase and climb restart from the beginning. Low confidence; read only.** The chase is about 7,230 ticks (2 minutes) of scrolling and the climb about 5,035 ticks (84 s); a fall ends the attempt and retry restarts the level (`game.js:1376`, `codebreak.js:281`). The bot took all three of its chase hits inside the barrage.

**F16. Documentation drift. Low. Read.** `docs/SERVER-SIM.md` says golden clears take 7,000 to 8,000 ticks (now 7,720 to 10,107), that levels run 1 to 12 (there are 13), and that the seed is `0x5eed + levelIndex` with no gameplay randomness (the browser now draws a random seed, `game.js:446`, and pickups depend on it).

### 4.4 Resolved since the first audit

- **Checkpoint wins on level 1 now report the Breakwater Coin.** At `b40bcbf` a clear after a phase-2 retry sent no hub report at all, so a player who died once in phase 2 of Fat Head Dave could not earn the Coin on that attempt. `936f939` calls `reportHubClear` for every clear with a `checkpoint` flag (`game.js:517`) and sends the Coin event for every level-1 win (`hub-link.js:236-257`). Covered by `runtime/fixtures/hub-clear.test.js`, `runtime/fixtures/checkpoint.test.js` and `qa/hub-link-browser.mjs`. Read, not run.
- **The Coin event is no longer skipped once the Coin is owned.** The `!state.relics.includes(RELIC)` guard is gone; the server deduplicates.

Still open after that commit: checkpoint clears earn no Tickets and the player is not told (F10, A4); Redkev pays no Tickets (F10, H3).

## 5. The plan

Each item ends with an AUTHORIZATION line. "Inside scope" means the scope already authorized in `AGENTS.md`: hitboxes, the added barrages, pickups, retry, Moonkeep, Redkev, and non-combat HUD, onboarding, audio and feedback. "Sign-off" means the item changes preserved gameplay (authored attack timing, trajectories, movement, damage, RNG, progression, armor/open-state rules or reaction windows) and needs the owner's explicit sign-off.

The server build replaces `sound`, `refreshHud`, `showLevelControls`, `announce`, `setOverlay` and `clearLevel` with stubs (`runtime/story/server-entry.js:8-17`) and extracts no drawing code. Edits confined to those functions and to rendering therefore do not change `ARCADE_SIM_VERSION`. Confirm each time with `node tools/check-server-bundle.mjs`. Any edited script also needs its `?v=` key in the HTML recomputed (first 12 hex digits of the file's sha256; `qa/gamepad-mapping.test.cjs:70` shows the rule).

### Phase A: fix what is broken, and quick wins

**A0. Real-GPU performance check (do first).**
- Goal: learn whether F1 affects real players, and which filter costs most.
- Method: on at least one integrated-graphics laptop and one phone-class device, play level 1 to the first barrage and level 10 or 11 to its phase-2 barrage (79 missiles). Record a Chrome DevTools Performance trace and log ticks per second as in section 2. Repeat in Firefox and Safari. Repeat with the outline filters commented out locally.
- Acceptance: a table of ticks per second and worst frame time per device and browser, filters on and off, added to `qa/`.
- Effort S. Sim change: no. Risk: none.
- AUTHORIZATION: inside scope (measurement only).

**A1. Bake projectile and missile outlines once (both modes).**
- Goal: keep the keyline look, remove the per-draw filter.
- Change: `projectileFrame` (`boss-sheets.js:259`) and `drawDensityMissile` (`boss-sheets.js:288`) stop setting `ctx.filter` on the main canvas. They draw from a cache of small offscreen canvases that already contain sprite plus outline.
- Implementation:
  1. Add `outlined(img, sx, sy, sw, sh, dw, dh, filterText)` returning a canvas of `ceil(dw)+8` by `ceil(dh)+8` pixels (4 px padding for the 2 px halo). Build it once: set the offscreen context's `filter` to the existing string, disable smoothing, draw the source crop at destination size.
  2. Cache key: `asset.path|row|column|round(dw)|round(dh)|scale to two decimals`. Missiles: `path|column|size`. Mirroring and rotation stay on the main context's transform, so they are not part of the key.
  3. Blit with one `drawImage` at the same destination rectangle, offset by the padding.
  4. Only cache when both destination sides are 256 px or less. Sprites whose size changes every tick (floor columns while they rise, the vault beam, long rays) keep today's direct path; tiled rays already draw unfiltered.
  5. LRU cap of 256 entries, cleared when the stage id changes. Typical entries are under 140x140 px (about 78 KB each), so a few megabytes in practice; the cap bounds it near 20 MB.
  6. Where `document` or `OffscreenCanvas` is missing (Node tests), fall back to today's direct filtered draw.
- Tests: update `qa/projectile-visibility.test.cjs` (it asserts that the draw call carries `#f4fcff` and `#06111f`) to accept either the fallback or a cache build using that filter string. Add `qa/filter-budget-browser.mjs`: headless Chromium, level 1 barrage, fail under 45 ticks per second. Re-run `qa/boss-sheets.test.cjs`, `qa/missile-art.mjs`, `qa/redkev-render.test.cjs`.
- Acceptance: headless ticks per second during a level-1 barrage within 10% of the filters-disabled baseline (50 to 56); screenshots of the same tick before and after show the same outline; on A0's devices, 58 ticks per second or better through a 79-missile barrage.
- Effort M. Dependencies: A0. Risk: a slightly different outline when a sprite is rotated, since the outline now rotates with it; check Redkev's corrected-angle missile. Sim change: no.
- AUTHORIZATION: inside scope (presentation only).

**A2. Boss hit flash and tint filters without `ctx.filter`.**
- Change: at `game.js:1657` and `:1588`, replace `ctx.filter='brightness(1.38)'` with a second draw of the same frame using `globalCompositeOperation='lighter'` and `globalAlpha=0.38` (0.34 for the mecha). Over opaque sprite pixels this is the same result. For the hue and tint filters at `game.js:1789` and `arena-effects.js:257, 369, 442, 500`, pre-tint each sprite once into a cached canvas, but only where A0 shows a cost.
- Tests: screenshot comparison in `qa/art-browser.mjs` style. Acceptance: no `ctx.filter` assignment runs during a normal level-1 phase-1 frame; flash looks the same.
- Effort S. Dependencies: A0. Risk: faint brightening of anti-aliased edges. Sim change: no.
- AUTHORIZATION: inside scope.

**A3. Cue line teaches the mandatory mechanics.**
- Change, all inside `refreshHud` (`game.js:528`) and CSS in `legacy.html`:
  1. Ceiling sweep: while `boss.move==='ceilingSweep'` and `boss.age < boss.tell + moves.ceilingSweep.active`, show "CEILING SWEEP · CROUCH (↓) OR SHIELD (X)". Start drawing the descending band at the start of the tell, not the last 36 frames (`drawCeilingSweep`, `game.js:1876`); this is drawing only.
  2. Barrage: replace the blanking at `game.js:554` with "MISSILE BARRAGE · GUNS OFFLINE" plus a hint for the nearest live wave. Take the lowest-`delay` shot still alive; if `vertical` or flight, "FLY THROUGH THE GAP"; else if its centre is more than 60 px above the floor, "CROUCH"; else if a shot from the same wave sits above standing height, "SHORT HOP"; else "JUMP". Show "BARRAGE OVER" for 45 frames afterwards.
  3. Flight: "EXPOSED · Line up with the ring" in place of the jump text.
  4. Attack names: add a `MOVE_LABELS` table for the keys of `moves` and show the name during the tell, as the chase and climb do.
  5. Raise `#cue` from `clamp(8px,1.25vw,14px)` to `clamp(10px,1.7vw,20px)` (`legacy.html:23`).
- Tests: extend `qa/ui-browser.mjs` to assert the cue text for a forced sweep, a barrage and a flight exposed window. `runtime/fixtures/gamepad.test.js` and `qa/gamepad-mapping.test.cjs` cover prompt text; add controller wording (`html[data-input="gamepad"]`).
- Acceptance: each of the three situations shows its cue within 2 frames; bundle check passes with an unchanged version.
- Effort S. Risk: cue overload; show one line at a time, mandatory mechanics first. Sim change: no.
- AUTHORIZATION: inside scope (HUD and onboarding).

**A4. Fail screen says what happened and what retry costs.**
- Change: in `setOverlay` (`game.js:412`), when `next==='lost'`, build the description from current state instead of the caller's text. Cause: barrage if `densityShots.length`, else the label of `boss.move`, else the chase or climb reason already passed in. Add "Phase P · section S of 4 · boss at N%", one tip keyed by cause (sweep: crouch; pulse: press X when the cue says; barrage: the lane rule), and for a phase-2 death: "Retry restarts phase 2. A clear after a checkpoint retry saves progress but earns no Tickets." On level 1 add that the Breakwater Coin still counts.
- Leave `hurt` untouched: it is inside the simulation, and changing its strings would change the bundle.
- Tests: `qa/ui-browser.mjs`; `runtime/fixtures/checkpoint.test.js` must still pass unchanged.
- Acceptance: phase, section, percentage and cause are correct for a forced death by sweep, pulse, barrage and an ordinary shot.
- Effort S. Sim change: no. Risk: wording must match the reward rules in `hub-link.js:229-257`.
- AUTHORIZATION: inside scope.

**A5. First-run card.** Before the first level of a browser session, show a one-screen overlay: move, jump twice, crouch, dash through shots, X for pulses, jump into the ring when "EXPOSED". Reuse the overlay element; remember dismissal in `localStorage` (`sproto-arcade-coach-v1`). Add the same list to the pause overlay. Effort S. Sim change: no.
- AUTHORIZATION: inside scope.

### Phase B: retime the authorized additions (one re-pin for the whole phase)

**B1. Pickups spread over the phase, never during a barrage, hearts only when hurt (both modes).**
- Current: `first = 180 + floor(rng x 361)`, `second = first + 150 + floor(rng x 301)` (`phase-powerups.js:9`); spawns as soon as due; a heart at full health is wasted.
- Proposed:
  1. `create({seed, attempt, phase, span})`. Without `span` keep today's formula exactly, so Machine Trials and its fixtures are unchanged until a stage opts in. With `span`: `first = floor(span x (0.18 + rng x 0.22))`, `second = floor(span x (0.58 + rng x 0.24))`. Same number of random draws in the same order.
  2. Story passes `span = round(boss.max x 6.2)` in phase 1 (6,603 for 1065 health; the bot spends 6.0 to 7.5 ticks per point), 1,400 in phase 2, 7,200 for the chase, 5,000 for the climb and 1,800 for the Codebreak arena. Phase 1 then spawns at ticks 1,188 to 2,640 and 3,828 to 5,412 (20 to 44 s and 64 to 90 s); phase 2 at 252 to 560 and 812 to 1,148.
  3. In `updatePhasePowerups` (`game.js:576`) pass `ready: !densityShots.length && !player.inv` instead of `true`; a due plan spawns on the first ready tick. Same in `world.js:317`.
  4. Add `hold` to `step` (`phase-powerups.js:21`): story passes `hold: {life: player.hp >= MAX_HP}`. A held plan waits; if the player is never hurt the heart never appears.
- Unchanged: at most one heart and one shield per phase attempt, different random times and places, 240-tick expiry, 600-tick shield (`docs/PHASE-POWERUPS.md`). Update that doc's wording on timing.
- Tests: `runtime/fixtures/phase-powerups.test.js` (windows, hold, ready, determinism), `runtime/fixtures/checkpoint.test.js`, new golden recordings.
- Acceptance: across the 13 new goldens no spawn falls inside a barrage and no heart spawns at five hearts; every phase-1 golden has a spawn after tick 1,000.
- Effort S plus the re-pin. Dependencies: D1 changes `boss.max`, which the formula follows automatically. Risk: the shield pickup can now meet a shield pulse more often; its rule is already defined (it breaks and damage applies). Sim change: yes.
- AUTHORIZATION: inside scope (pickups).

**B2. A second, shorter barrage in phase 1.**
- Current: one per phase (`densityLastCycle>=0`, `game.js:1451`; `plan` refuses when `lastCycle>=0`, `density-attacks.js`).
- Proposed: in phase 1 of a boss fight, cycle 0 as today and cycle 1 once `healthSection(boss) >= 2`, at the first `barrageRecovery()` at least 900 phase-clock ticks after cycle 0 ended. `plan` takes `cycle`, refuses when `lastCycle >= cycle`, starts the row pattern at `pattern[(wave + 2 x cycle) % length]` and for cycle 1 emits only the first `ceil(length / 2) + 1` waves. Phase 2, chase, climb and Machine Trials keep one barrage.
- Implementation: add `densityLastEnd` to the state in `simState` (`game.js:484`), `resetRun`, and the dev snapshot in `tools/build-server-sim.mjs`.
- Tests: `qa/density-attacks.test.cjs`, `qa/density-rotation.test.cjs`, `qa/density-modern.test.cjs` (Trials unchanged), a new fixture for the cycle-1 trigger.
- Acceptance: every boss golden shows exactly two phase-1 barrages, the second 250 to 420 ticks long; avoidability checks in the density tests pass for cycle 1.
- Effort M. Dependencies: A3 (cue). Risk: adds about 5 to 7 s to phase 1 because the boss takes no damage during a barrage; do not ship without D1 or D6 unless the owner accepts the longer phase. Sim change: yes.
- AUTHORIZATION: inside scope (added barrages), with the length cost flagged for the owner.

**B3. Flight barrages ask the pilot to move (Moonkeep and Mudline).**
- Current: `shift = offsets[wave] x tier x 20` (`density-attacks.js:91`), gap `240 - tier x 18`.
- Proposed for horizontal flight only: `shift = offsets[wave] x (50 + tier x 35)`, giving 85 and 120 px on Mudline and 120 and 155 px on Moonkeep; gap unchanged. Wave 0 still opens on the saucer. At 10.4 px per tick the largest move takes 15 ticks, against 58 to 70 between walls, and each wall is visible for about 2 s before it arrives.
- Tests: `qa/density-attacks.test.cjs` (opening inside arena, reachable between consecutive walls at saucer speed with at least 20 ticks spare), `runtime/fixtures/redkev.test.js` unaffected.
- Acceptance: the Moonkeep and Mudline goldens clear; a controller that never moves vertically is hit at least once in a Moonkeep barrage.
- Effort S. Risk: clamping near the arena edge shrinks the move; acceptable. Sim change: yes.
- AUTHORIZATION: inside scope (barrages and Moonkeep).

### Phase C: score, rank and audio (no sim change)

**C1. Results on the clear screen and saved bests.**
- Change: in the browser's `clearLevel` (`game.js:509`) show time (`time / 60`), hits taken, hearts left and a rank. Count hits in `refreshHud` by watching `player.hp` and pickup-shield breaks. Rank: S = no hits and time at or under par; A = at most two hits and time at or under 1.15 x par; B = full-run clear; C = clear after a checkpoint retry. Par per level = the golden's clear ticks x 1.25, regenerated with the goldens.
- Storage: add an optional `best: {levelId: {ticks, hits, rank}}` to the save in `story-progress.js`; `normalize` must accept saves without it; merging keeps the better rank, then the lower ticks. Checkpoint clears never overwrite a full-run best, as `docs/PHASE-POWERUPS.md` requires. God-mode clears are not ranked.
- Tests: `runtime/fixtures/story-progress.test.js` (old saves, merge), `runtime/fixtures/hub-clear.test.js`, `qa/hub-link-browser.mjs` (cloud save round trip).
- Acceptance: a full clear writes a best; a checkpoint clear shows rank C and leaves the best alone; an old save loads.
- Effort M. Risk: save size in the hub's cloud save; 13 small records.
- AUTHORIZATION: inside scope (non-combat feedback).

**C2. Level select shows rank and best time** beside each level, and the title shows how many are cleared. Effort S. Dependencies: C1.
- AUTHORIZATION: inside scope.

**C3. Music and real sound effects.**
- Change: keep every `sound(freq, end, length, volume)` call site, because they sit inside simulation functions. Replace only the body of `sound` (`game.js:393`): look up `freq:end` in a table of decoded samples and fall back to the oscillator. Start a per-level music loop in `begin`, switch track at phase 2, duck on pause. Add volume and mute to the pause overlay, stored in `localStorage`.
- Needs: about a dozen effects and at least four loops. These are audio assets, not art; the owner decides the source. `tools/build-web.mjs` copies only files the pages request, so list the audio files where it can see them.
- Acceptance: no sound before the first click (browser autoplay rules); mute persists; web build check passes.
- Effort M once assets exist. Risk: download size.
- AUTHORIZATION: inside scope (audio).

**C4. Impact, drawn from existing state only.** A 3-frame white flash and heart shake when `player.inv === 71`; a larger spark and a damage number on weak-spot hits; a low-health vignette at one heart; a warning sweep across the screen when a barrage starts. No hit-stop, because that would alter timing. Effort S to M.
- AUTHORIZATION: inside scope (feedback).

### Phase D: changes that need the owner's sign-off

**D1. Rebalance the phase split.**
- Current: phase 1 = 1065 for everyone; phase 2 = `ceil(hp/2)` = 132 to 183.
- Proposed: phase 1 = `2 x kit.hp` (526 to 730), phase 2 = `kit.hp` (263 to 365), in `startBoss` (`game.js:491`). The pulse floors scale with `boss.max`. Estimate from the bot's 6.0 to 7.5 ticks per point: phase 1 about 55 to 90 s, phase 2 about 45 to 60 s, whole fight about 100 to 150 s and rising through the campaign. These are extrapolations, unverified.
- Tests: regenerate all goldens (`node tools/story-bot.mjs`), `--write-fuzz`, goja check. Acceptance: bot phase 1 under 95 s on every boss; level 11's fight at least 25% longer than level 1's.
- Effort S to change, M with the re-pin and a playtest. Risk: Ticket income per minute rises about 20%. Sim change: yes.
- AUTHORIZATION: changes preserved gameplay (progression): needs the owner's explicit sign-off.

**D2. Section checkpoint in phase 1** (alternative to D1). A death at section 3 or 4 restarts phase 1 at half health. Extends the authorized retry rule and, like the phase-2 checkpoint, could not send a hub report. Effort M. Sim change: yes (new start state).
- AUTHORIZATION: needs sign-off (progression).

**D3. Floor on tell length.** In `startMove`, after `b.tell=moves[b.move].tell` (`game.js:833`), apply `b.tell = Math.max(b.tell, Math.ceil(24 * rate))` for ordinary moves, the pattern already used for ground columns at `game.js:844`. No tell is then shorter than 24 frames; levels 1 to 5 are unchanged. Effort S. Sim change: yes.
- AUTHORIZATION: needs sign-off (attack timing and reaction windows).

**D4. Dash cooldown 24 to 36 ticks** (`game.js:745`, `:786`), cutting immune time from 46% to 31%. Do this only if playtests show dash-spam winning fights. Effort S. Sim change: yes.
- AUTHORIZATION: needs sign-off (movement).

**D5. Own attacks for Moonkeep and Redkev.** Moonkeep: a third `FLIGHT_POOLS` entry of dragon patterns that fire from the dragon's current height (which also fixes F14 for that level). Redkev: a different `BOSS_SECTION_ATTACKS` order, different signatures and cadence about 1.01, so level 2 is not level 1 again. May need projectile art. Effort M to L. Sim change: yes.
- AUTHORIZATION: needs sign-off. `AGENTS.md` authorizes the Moonkeep flight encounter and a Redkev that clones level 1; new attacks go beyond both.

**D6. Guns stay on during barrages.** Pass `true` to `movePlayer` at `game.js:1472`. The boss then loses health while its attack clock is paused, which removes the dead time in F9 but changes how fast sections advance. Effort S. Sim change: yes.
- AUTHORIZATION: needs sign-off (damage and progression pacing).

**D7. One saucer hitbox.** Use one half-width for ordinary shots and barrage missiles (`game.js:1250`, `:1476`); 44 px is a middle value. Effort S. Sim change: yes.
- AUTHORIZATION: needs sign-off. `AGENTS.md` authorizes boss and projectile hitboxes, not the player's.

**D8. Halfway checkpoints in the chase and the climb.** Not played in this audit; decide after a playtest. Effort M. Sim change: yes.
- AUTHORIZATION: needs sign-off (progression).

## 6. Suggested order and batching

1. **Batch 1, no sim change:** A0, then A1 and A2, then A3, A4, A5. Each can ship alone. Run `node qa/run-all.mjs .`, `node tools/check-server-bundle.mjs` (the version must not change) and the browser checks touched.
2. **Batch 2, one re-pin:** B1 and B3 together. Add B2 only with the owner's view on phase length. Follow section 7's re-pin steps and tell the hub before merging.
3. **Batch 3, no sim change:** C1, C2, C4; C3 when audio exists.
4. **Batch 4, sign-off items:** each D item on its own branch and its own commit, started only after written sign-off, never mixed into batches 1 to 3. If D1 and D3 are both approved, land them in one re-pin and regenerate C1's par times.

Unlike the other game repos, `AGENTS.md` here lets completed and verified work go to GitHub `main` after local integration, without a force push. The rest of that file still applies: a branch per task named `<agent>/<slug>`, review by a different agent, checks run and reported, and no pull of Sproto Fighter or dependent shared repositories without checking the PR it names.

## 7. Hub integration

Verified in this repo:

- 20 Tickets per non-god clear (`TICKETS_PER_CLEAR`, `hub-link.js:17`), reason `arcade_clear`, with a fresh key per full clear (`hub-link.js:251`), so replaying a level pays again.
- Every level-1 win in a hub session reports `arcade.boss_defeated` with boss `bront`: repeat wins, god-mode wins and phase-2 checkpoint wins included (`hub-link.js:245`); the server grants one Coin per account. A full run attaches its replay log to that event; a checkpoint win sends the boss id alone, because no log is recorded. Ticket grants carry no log, because `earnTickets` has no data field (`docs/SERVER-SIM.md`, "How logs reach the hub today").
- A clear after a phase-2 checkpoint retry sends only that level-1 Coin event. On every other level it sends nothing (`hub-link.js:238`), and on no level does it earn Tickets or push the cloud save (`hub-link.js:251`, `:254`).
- Redkev (index 12) only pushes the save (`hub-link.js:243`); the comment says the hub still accepts the original twelve.
- God-mode and checkpoint wins count for the Coin by design, while `verifyClear` rejects god-mode logs and a checkpoint win carries no log. The Coin therefore cannot be made replay-verified without withdrawing those two cases; that is a hub decision.
- `docs/PHASE-POWERUPS.md` still says a checkpoint clear "earns no Tickets or Relic and sends nothing to the hub". After `936f939` that is wrong for the level-1 Coin; `README.md` and `docs/SERVER-SIM.md` were updated, this file was not.

Reported by the hub audit, not verifiable from this repo: Ticket grants are client-reported with no server verification; there is no leaderboard and no interface to exchange Tickets for Verse; caps are 200 Tickets per session and 1,000 per game per day; 10 Tickets convert to 1 Verse, capped at 50 Verse per game per day; Verse currently buys nothing.

Consequences and items:

- **H1.** A full campaign pays 240 Tickets (twelve paying levels), so one session reaches the 200 cap at the tenth clear. The bot's fastest clear is 129 s, so the cap, not skill, limits income.
- **H2. Tell the player the checkpoint rule** (A4). No hub change.
- **H3. Redkev Tickets.** The hub must accept stage 13 with boss id `redkev`; then delete the early return at `hub-link.js:243`. Update the level table in `docs/SERVER-SIM.md`.
- **H4. Verify Ticket clears.** Pick one of the three routes in `docs/SERVER-SIM.md`. A `meta` argument on `earnTickets` changes the hub SDK, so every game that vendors it would need a re-sync; a companion event does not.
- **H5. Leaderboard.** Once C1 exists, the verified `ticks` from `verifyClear` is a trustworthy time per level. Needs a hub leaderboard.
- **H6. Re-pin steps for batches 2 and 4:** `node tools/build-server-sim.mjs`; `node tools/check-server-bundle.mjs`; `node tools/story-bot.mjs` (about a minute per level); `node qa/server-sim-goldens.mjs . --write-fuzz`; the goja run in `tools/goja-verify`; `node qa/replay-golden-browser.mjs .`; then the hub vendors the new bundle from the same commit. Old logs fail with `sim version mismatch` unless the hub keeps the previous bundle during rollout.
- **H7. Fix the doc drift in F16 and the stale checkpoint sentence in `docs/PHASE-POWERUPS.md`**, and set the hub's plausibility floor per level from the current goldens.

## 8. Decisions for the owner

1. **Which mode is the product?** (a) Story only: retire or hide Machine Trials and make `index.html` open story mode; least work, and it matches the hub. (b) Both: every shared change is tested twice and Trials still needs backdrops, and it has no hub link. (c) Trials replaces story: largest cost; hub rewards and replay verification would have to be rebuilt for it. Recommendation: (a) for now, keeping Trials reachable as a labeled prototype.
2. **Is the phase split open to change?** Keep (free; phase 1 stays about two minutes) or D1 (a re-pin, new goldens, a playtest). Recommendation: D1. It is the largest single improvement to pacing, and the only one that makes later bosses longer than earlier ones.
3. **May Moonkeep and Redkev get their own attacks (D5)?** No: free; the two levels stay near-copies of Mudline and Marina. Yes: M to L effort, possibly new projectile art, a re-pin. Recommendation: yes for Redkev first, since a repeat at level 2 is the campaign's weakest moment, using existing moves in a new order so no art is needed.
4. **Should checkpoint clears and Redkev pay Tickets?** Redkev: yes; it is a hub-side acceptance change (H3). Checkpoint clears: keep the current rule of no Tickets (they cannot be replay-verified as a whole fight) and tell the player (A4). Since `936f939` they do count for the Breakwater Coin, so only Tickets remain in question. A reduced payout would need a second verifiable log format.
5. **Barrages: longer phase, or guns on?** B2 adds dodge time; D6 removes the dead time. Recommendation: decide after A3 ships and people have played a barrage with the cue.

## 9. How to verify the changes improved play

**Bot measurements** (replay the regenerated goldens as in section 2):

| Measure | Now | Target |
|---|---|---|
| Phase 1, bot seconds | 107 to 132 | under 95 after D1; unchanged otherwise |
| Whole fight, level 11 against level 1 | 168 s against 157 s | at least 25% longer after D1 |
| Pickup spawns inside a barrage | 21 of 47 | 0 (B1) |
| Hearts spawned at five hearts | possible | 0 (B1) |
| Latest pickup spawn in phase 1 | tick 888 | after tick 3,800 (B1) |
| Bot hits inside barrages | 9 of 20 | not higher after B2 and B3 |
| `ARCADE_SIM_VERSION` after batches 1 and 3 | `e992c779ac0f8b62` | unchanged |

**Performance:** repeat A0 after A1 and A2 on the same devices. Target 58 ticks per second or better through a 79-missile barrage; the headless check in `qa/filter-budget-browser.mjs` stays above 45.

**Human playtest**, using `qa/playtest.html` and `qa/PLAYTEST.md`. For each level record:

- Attempts to first clear, and what caused each death (from A4's screen).
- Whether the player crouched under the first ceiling sweep, and by which attempt.
- Whether the player pressed X on the first shield pulse.
- Hits taken in each barrage and whether the player understood why fire stopped.
- Whether each pickup was seen, reached and useful.
- Dash presses per minute (is dash-spam the dominant plan?).
- Whether any projectile was hard to see against the backdrop, with a screenshot.
- Phase-1 time, and the point at which the player said it felt long.
- For flight levels: whether shots seemed to come from the boss (F14).
- For the chase and the climb: deaths by falling, and the distance reached.

Five to eight people who have not seen the game are enough to find the large problems. Record nothing that was not observed.

## 10. Not audited, out of scope

- Levels 2 to 6 and 8 to 13 were not played; their numbers come from code and bot replays. The chase and the climb were read only, including how barrages behave on narrow rooftops and on the climb's platforms (126 missiles in the climb plan). These are the least certain parts of this plan.
- Machine Trials beyond one short run of stage 1. Its slow missile (`docs/SLOW-MISSILE-CONTRACT.md`) and background pressure (`docs/GAMEPLAY-TUNING-CONTRACT.md`) are not changed by any item here.
- Controllers, touch input, Firefox, Safari and any real GPU.
- The hub side of rewards beyond what `hub-link.js` shows.
- Art quality and per-sprite hitbox fit (`sprite-hitboxes.js`); the checks in `docs/BOSS-VALIDATION.md` were taken as given.
- Co-op (`docs/COOP-DESIGN.md`).

## 11. Implementation status (2026-11-11)

The owner read this plan and said "implement everything". Items inside the scope `AGENTS.md` already authorized were done first. Sign-off items were done only where this plan gives a concrete change, each in its own commit so it can be reverted alone; a revert needs a re-pin.

No person has played any of this. Every figure below is from the lookahead bot or from headless Chromium.

### Items

| Item | Status | Notes |
|---|---|---|
| A0 real-GPU check | Partly | Headless Chromium only (`qa/FILTER-BUDGET.md`). No laptop, phone, Firefox or Safari was measured. |
| A1 baked outlines | Done | Level-1 barrage: 9.5 to 21 ticks per second before, 59 to 60 after, headless. Rotation, mirror and scale are baked into the cache (rotation snapped to 2 degrees), which keeps the keyline axis-aligned as the filter drew it. Captures before and after differ only by sub-pixel placement of projectile edges. |
| A2 hit flash | Done | Additive second draw. The hue and tint filters in `drawVerseGemLaser` and `arena-effects.js` are unchanged: this plan asks for them only where a real device shows a cost. |
| A3 cue line | Done | Also shows "BARRAGE OVER · GUNS ONLINE" ahead of the exposed cue for its 45 frames. `qa/story-hud-browser.mjs`. |
| A4 fail screen | Done | The Ticket sentence appears only in a hub session. |
| A5 first-run card | Done | Shown once per browser, and on the pause screen. |
| B1 pickups | Done | As specified. |
| B2 second barrage | Done, with one deviation | Half the waves (`floor(length / 2)`), not `ceil(length / 2) + 1`: the written formula gives 480 to 516 ticks, while this plan's acceptance line (250 to 420) and stated cost (5 to 7 s) need half. Measured 343 to 417 ticks. |
| B3 flight openings | Done | On Mudline's phase 1 (85 px) a saucer that never steers can still survive; on Moonkeep it is hit. |
| C1 results and bests | Done | `story-par.js` is regenerated with the goldens (`tools/build-story-par.mjs`). |
| C2 level select | Done | |
| C3 audio | Done, synthesised | `story-audio.js`: a voice per `sound()` call site and four tracks with a phase-two form. No audio files. Nobody has listened to it critically. |
| C4 impact | Done | Flash and heart shake on a hit, ring and "3" on weak-spot hits, one-heart vignette, hazard band when a barrage starts. |
| D1 phase split | Done (sign-off) | Commit "D1 [CHANGES PRESERVED GAMEPLAY: progression]". Misses both of its own targets narrowly; see below. |
| D2 phase-1 checkpoint | Skipped | It is the alternative to D1, and D1 was done. |
| D3 tell floor | Done (sign-off) | Commit "D3 [CHANGES PRESERVED GAMEPLAY: attack timing, reaction windows]". The claim in D3 that levels 1 to 5 are unchanged is not quite right: the 26-tick ricochet tell grows by one tick in Marina's last section, and 28-tick tells grow in the late sections from Sproto Ranch on. |
| D4 dash cooldown | Skipped | This plan says to do it only if playtests show dash-spam winning. There has been no playtest. |
| D5 own attacks | Partly (sign-off) | Redkev done: commit "D5 (Redkev half) [CHANGES PRESERVED GAMEPLAY: attack order]". Base order rush, slabs, quake, drop, bankShot; section attacks in a new order; signatures forgePress and portalRing, which no other ground boss uses; cadence 1.01. The exact order and signatures were left open here and were chosen during implementation. Moonkeep not done: it needs new patterns designed and possibly art. `AGENTS.md` still describes Redkev as a clone of level 1. |
| D6 guns on in barrages | Skipped | Section 8 says to decide after people have played a barrage with the new cue. |
| D7 saucer hitbox | Done (sign-off) | Commit "D7 [CHANGES PRESERVED GAMEPLAY: player hitbox]". 44 px half-width for ordinary shots and barrage missiles. |
| D8 chase and climb checkpoints | Skipped | This plan says to decide after a playtest. |
| H2, H7 | Done | Fail screen states the checkpoint rule; `docs/SERVER-SIM.md` and `docs/PHASE-POWERUPS.md` corrected. |
| H1, H3 to H6 | Not started | Hub-side work. H3 (Redkev Tickets) still needs the hub to accept stage 13. |

The archived replay lane (`qa/server-sim-goldens.mjs --collision-disabled`) still passes: the old rules behind D1, D3 and D7 stay in `game.js` under `HISTORICAL_*` constants that only that lane switches on.

### Simulation versions

| Stage | `ARCADE_SIM_VERSION` |
|---|---|
| Before (this plan's baseline), and after batches 1 and 3 | `e992c779ac0f8b62` |
| After B1 to B3 | `a288552328745110` |
| After D1, D3, D7 and D5 (Redkev), the branch head | `d3360290cc771a31` |

The hub has to vendor `dist/arcade-sim.server.js` from the commit it deploys with.

### Bot figures at the branch head

Golden clears replayed by `node runtime/fixtures/barrage-pickup-goldens.test.js --table`. Barrages are start tick + length within the phase; items are kind @ phase tick (s shield, l heart).

| Level (id) | Clear ticks (s) | Phase 1 (s) | Phase 2 (s) | Phase-1 barrages | Phase-2 barrage | Phase-1 items | Phase-2 items | Bot hits (in barrage) |
|---|---|---|---|---|---|---|---|---|
| 1 Tidebreak Marina | 7462 (124) | 4571 (76) | 2891 (48) | 528+589, 2623+367 | 645+571 | s@1117 | s@459 | 0 (0) |
| 13 Redkev's Marina | 6665 (111) | 4288 (71) | 2377 (40) | 424+579, 2495+357 | 758+562 | s@2852 | s@1321 | 0 (0) |
| 2 Last Light Bar | 6766 (113) | 4165 (69) | 2601 (43) | 438+575, 2420+353 | 837+559 | s@2773 | s@1397 | 0 (0) |
| 3 Mudline Trenches | 7007 (117) | 4330 (72) | 2677 (45) | 491+587, 2189+377 | 463+599 | s@2710 | s@448 | 0 (0) |
| 4 Sproto Ranch | 8129 (135) | 4894 (82) | 3235 (54) | 528+608, 2765+398 | 780+627 | s@2695 | s@1408 | 0 (0) |
| 5 Neon Tomorrow | 7254 (121) | 4619 (77) | 2635 (44) | 502+606, 2389+396 | 559+625 | s@2996 | s@1185 | 0 (0) |
| 6 Circuit Gate | 8313 (139) | 4644 (77) | 3669 (61) | 610+646, 2476+380 | 537+652 | s@1385 | s@1190 | 0 (0) |
| 7 Moonkeep Castle | 8146 (136) | 5118 (85) | 3028 (50) | 438+607, 2677+343 | 420+617 | s@1444 | s@1038 | 0 (0) |
| 8 Crown Relay Chamber | 9379 (156) | 4975 (83) | 4404 (73) | 660+636, 2808+370 | 510+649 | s@2679 | l@4283 | 1 (0) |
| 9 The Hatchery | 8252 (138) | 5139 (86) | 3113 (52) | 470+661, 2880+417 | 879+678 | s@3297 | s@1558 | 0 (0) |
| 10 Verse Gate | 9168 (153) | 6199 (103) | 2969 (49) | 647+651, 3461+410 | 785+672 | s@2727 | s@1458 | 1 (0) |
| 11 Rooftop Breakaway | 7720 (129) | n/a | n/a | 429+658 | n/a | s@2563 l@4779 | n/a | 3 (3) |
| 12 Codebreak Ascent | 8880 (148) | 5686 (95) climb | 3194 (53) | 434+571 | 515+678 | l@1807 s@3934 | s@507 l@1334 | 1 (0) |

Levels 11 and 12 are their earlier inputs, which still clear, restamped; the rest are new bot runs.

Against section 9's targets:

| Measure | Before | Target | Now |
|---|---|---|---|
| Phase 1, bot seconds | 107 to 132 | under 95 after D1 | 69 to 103. Verse Gate (103 s) misses; the second barrage accounts for about 7 s of it. |
| Whole fight, Verse Gate against Marina | 168 s against 157 s | at least 25% longer | 153 s against 124 s, 23% longer. Misses narrowly. |
| Pickup spawns inside a barrage | 21 of 47 | 0 | 0 of 28 |
| Hearts spawned at five hearts | possible | 0 | 0 (4 hearts spawned, all to a hurt player) |
| Latest pickup spawn in phase 1 | tick 888 | after tick 3,800 | 3,297 for a boss fight. The 3,800 target assumed the 1065-health phase 1; with D1 the second item is planned at 58 to 82% of 3,261 to 4,526 ticks. After B alone, before D1, it was tick 5,298. |
| Bot hits inside barrages | 9 of 20 | not higher | 3 of 6 |
| `ARCADE_SIM_VERSION` after batches 1 and 3 | `e992c779ac0f8b62` | unchanged | unchanged, confirmed by `tools/check-server-bundle.mjs` at each commit |

### What a QA pass should look at first

1. A real GPU: whether the baked outlines hold 58 ticks per second or better through a late barrage, and whether the remaining hue filters matter (A0).
2. D1 pacing by hand. Phase 2 is now 40 to 73 s for the bot, and the phase-2 pickup span is still 1,400 ticks, so both items arrive in its first half.
3. The second phase-1 barrage: whether it reads as welcome variety or as more dead time (D6 is still open).
4. Redkev: whether the new order and the forgePress and portalRing signatures feel right at level 2.
5. D7 in Moonkeep and Mudline barrages: the saucer is now 88 px wide against missiles, where it was 36.
6. The cue line under load: one line at a time, mandatory mechanics first. Check that attack names do not hide the exposed cue for too long.
7. The synthesised audio at normal volume, on speakers and headphones.
