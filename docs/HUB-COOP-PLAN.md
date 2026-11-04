# Sproto Arcade: hub, relic, saves and co-op plan

Status: plan for branch `claude/kind-bardeen-h2fhj8` (Sproto-Arcade and metaverse-hub, plus small relic
hooks in the other game repos). Written 2026-11-04.

"Story mode" below is the original campaign (`legacy.html`, `game.js`, `codebreak.js`): 12 levels, the
Sproto picker and god mode (tap 9 twice). Machine Trials (`index.html`) is the separate prototype and is
not changed by this plan.

## What was measured first

| Fact | Where |
| --- | --- |
| Story mode preloads every level before Start enables: 941 requests, 38.1 MB, about 8 s on localhost | `game.js` tail, `initial` list |
| About 10 MB of that is the poses, walk cycles and identity frames of all 14 playable Sprotos, though one is played | `game.js:2039` |
| The simulation is fixed 60 Hz with an accumulator and has one `Math.random()` (a cosmetic puff) | `game.js:480`, `loop()` |
| Keyboard state is read directly in 11 places, all inside `movePlayer`/`moveGround`/`moveSaucer`/`updateShield`/`updateChase` | `game.js` |
| Level completion has one hook, `clearLevel()`. Level 1 (Tidebreak Marina, boss Fat Head Dave `bront`) is the first Sproto boss | `game.js:429` |
| The hub has five game ids. `sproto-arcade` is in none of them: SDK, server `GAMES`, DB checks, Bar cabinet, Vite play routes | metaverse-hub |
| The server decides relics: `game.event_rule` maps `(game, event, match)` to a relic. A client cannot claim one | `server/modules/src/schema.ts` |
| Every vendored SDK filters relic ids it does not know (`isRelicId`), so other games only see a new relic after a re-vendor | `packages/hub-sdk/src/live.ts:65` |
| There is no cloud save. Games keep progress in localStorage | SDK, server |
| "Tokens" are hub Tickets (per game) that exchange into Verse. Playing costs nothing | `tickets.earn`, `portal.enter` |

## Plan

### 1. Efficiencies and a co-op design

- Load per level instead of all at once (see step 2).
- Write `docs/COOP-DESIGN.md`. Local co-op is two players on one machine: P1 on WASD and Space/Shift, P2 on the arrow keys plus a gamepad, a shared boss, and separate HP. A downed player revives at the next phase. Online co-op is two to four players on the hub's Nakama, running deterministic lockstep with input delay. The host is authoritative for desync checks.
- Refactor so the simulation reads a per-tick `InputFrame` per player rather than global key sets.

### 2. Faster loading and ready for online co-op

- Split the preload into a core group (HUD, shared effects, the selected Sproto) and per-level groups. Start enables when core plus the chosen level are decoded. The next level prefetches during play.
- Load the frames of the selected Sproto only, and load another Sproto's frames when it is picked.
- Make the simulation deterministic: replace the cosmetic `Math.random()` with a seeded stream, keep `update()` free of DOM reads, and expose `step(inputFrames)`.

### 3. Relic for beating the first Sproto boss

- On `clearLevel()` for level index 0, report `arcade.boss_defeated {boss:'bront'}`.
- Server rule: `('sproto-arcade','arcade.boss_defeated','breakwater_coin', match {"boss":"bront"})`.
- God-mode clears report too, the same way Tinubu's Crown does.

### 4. Placeholder relic and awards in the other games

- New relic `breakwater_coin` ("Breakwater Coin"). It uses the existing placeholder relic gem in the hub (the octahedron orbit gem and the monument socket style) and creates no art.
- It repeats the NOBU relic's awards. Each other game unlocks what Cone's Tip unlocks there:

| Game | Cone's Tip gives | Breakwater Coin gives |
| --- | --- | --- |
| Sproto Duel | `duel_staff_nobu` | same staff |
| HPOS10I | `hpos_skin_nobu` | same skin |
| People's Bitcoin | `pb_summon_nobu` | same summon |
| Sproto Fighter | Pissing Sproto (`sproto3152`) | same fighter |
| NOBU | (own game) | Wizard Hat II: the Wizard Hat's mesh and Spell Bark, new item id `nobu_wizard_hat_2` |

### 5. Bar arcade cabinet chooses the game

- Press E at the cabinet to open a two-choice picker, Sproto Arcade or Sproto Fighter, with 1/2 or the arrows plus Enter, and Esc to cancel.
- Add a `sproto-arcade` entry to `GAME_URLS`, `VITE_GAME_URL_SPROTO_ARCADE`, and the Vite `/play/sproto-arcade/` route.
- `#from=sproto-arcade` returns the player to the cabinet. The marquee lists both games.

### 6. Tokens, login and saved progress

- Login is the hub ticket (`#t=`): the vendored SDK redeems it and the session lives in sessionStorage. Opened directly, the game stays offline and fully playable.
- Tokens: each boss clear earns 20 Tickets (`arcade_clear`, `max_amount` 20). A Tickets readout appears on the title card when connected.
- Saved progress: new SDK calls `loadSave()`/`writeSave(data)` backed by RPCs `save.get`/`save.put` in Nakama storage. Each player gets one object per game, and only the server writes it. The save holds the cleared levels and the unlocked Sprotos.
- Unlocked characters: four starter Sprotos, then each cleared level unlocks one more. Relics from other games unlock specific Sprotos, following Fighter's pattern. The level select offers only levels you have reached.

## 7. Critique of the plan above

1. **Step 1 and 2 overreach on co-op.** Real local 2P touches every boss attack's targeting (`player` is used 77 times), the HUD, collisions and the camera. It needs playtesting this pass cannot provide, and a half-working 2P mode would be worse than none. *Fix:* deliver the design document and the groundwork that makes co-op a contained follow-up: per-tick input frames, deterministic stepping and a replay checksum test proving lockstep viability. No 2P mode ships yet.
2. **Locking levels and Sprotos punishes existing players.** Today every level and Sproto is open, offline too. Locking content behind a save that offline players cannot sync takes things away. *Fix:* levels stay selectable. "Unlocked characters" become real but the starter roster stays generous: the 10 original Sprotos are open, and the 4 "boss-derived" picks (Morelight, The Villain, Goldie, Jessica) unlock by clearing their levels or via relics. `?unlockAll=1` keeps QA and review links working.
3. **Ticket farming.** God mode pays Tickets in the first draft. *Fix:* god-mode clears grant the relic, which is explicitly requested, but no Tickets. Tickets are paid once per level per run, with the idempotency key `arcade:clear:<runId>:<level>`, and capped by the existing session and day caps.
4. **Cloud save trust and size.** A client-written blob could hold anything. *Fix:* the server validates the shape (`v`, `cleared` int array 0..11, `unlocked` string ids, `updatedAt`) and the size (at most 4 KB). It stores with `permissionWrite 0`, and progress never grants relics or Tickets. The client merges local and cloud data as a union, so a stale cloud copy never deletes local progress.
5. **The SDK does not run on `file://` as is.** The dist is extensionless ESM, and the Arcade is classic scripts with no bundler. *Fix:* vendor an IIFE build (`vendor/hub-sdk/hub-sdk.iife.js`, global `HubSdk`) made with the hub's esbuild, with the process recorded in `vendor/hub-sdk/VENDOR.md`. Offline or standalone runs no-op.
6. **Migration ordering.** The runner refuses an unapplied id below the highest applied one, and 0020 already exists. *Fix:* use `0025_sproto_arcade` and reserve 0025–0029 for sproto-arcade in the range comment.
7. **Lazy loading can show blank sprites.** Draw code tolerates unloaded images, so missing preloads would show as pop-in rather than errors. *Fix:* the level groups are built from the same generators as before. A browser check proves the union of core and all level groups equals the old preload set, and records the new time to Start.
8. **The ripple into five game repos is real.** Each needs a re-vendored SDK, or it never sees `breakwater_coin`. *Fix:* keep each game's change to one map entry plus its tests, and re-vendor with the repo's own documented process. Note the HPOS10I originality allowlist line pins.
9. **Production and deploy are out of scope.** Caddy and deploy slugs for `sproto-arcade` are documented as an owner follow-up, not edited, per the hub rules.

## Revised plan (implemented)

- **A. Arcade performance:** per-level asset groups, selected-Sproto-only frames, next-level prefetch, a browser check that the union equals the old preload set, and before/after numbers.
- **B. Co-op groundwork:** an `InputFrame` abstraction (keyboard → frame per tick), a seeded cosmetic RNG, `docs/COOP-DESIGN.md`, and a deterministic replay fixture.
- **C. Hub SDK 0.6.0:** `sproto-arcade` game id, `breakwater_coin` relic, `ArcadeBossDefeated` event and `relicForEvent`, plus `loadSave`/`writeSave` (no-op standalone, mock and live).
- **D. Server:** migration `0025_sproto_arcade` (checks, relic, event rules `arcade.boss_defeated` and `arcade_clear` with max 20), the `GAMES` maps, `RELIC_GAME`, and `save.get`/`save.put` RPCs with validation, all with tests.
- **E. Hub app:** the cabinet picker, the `sproto-arcade` URL entry and route, the return to the cabinet, `SOCKETS` and `RELIC_INFO` for the coin (existing gem placeholder), and the menu text.
- **F. Arcade hub link:** vendored IIFE SDK, `hub-link.js` (connect, report the first boss, earn Tickets on non-god clears, load and merge saves, unlocks), a Return-to-hub button, and a status line.
- **G. Other games:** Breakwater Coin repeats Cone's Tip's award in Duel, HPOS10I, People's Bitcoin and Fighter, and adds Wizard Hat II in NOBU, each with a re-vendored SDK.
