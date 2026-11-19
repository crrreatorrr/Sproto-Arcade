# Claude Code Implementation Handoff — `Sproto-Arcade`

**Branch:** `claude/coop-2p-and-load-optimization-handoff`  
**Scope:**
1. **Fix critical `dist/` build leaks & cold-start bottlenecks** (cut `dist/` from ~567 MB → ~180–250 MB and Level 1 cold start from **26.4 MB / 379 reqs → <2.5 MB / <25 reqs**).
2. **Implement up to 2-player Co-op** (Local 2P + Online Nakama Lockstep Relay `sproto_arcade_coop`) with **scaled boss HP (`1.80×` standard / `1.85×` Codebreak P2)** so 2-player runs match single-player clear duration.
3. **Close Hub integration gaps** (enable Levels 13 & 14 Ticket rewards, server-issued RNG seed, co-op reward settlement, and fix stale UI level counts).

---

## 0. Hard Invariants (`AGENTS.md`)

- Preserve authored **1-player** attack timing, trajectories, movement, damage, RNG, progression, armor/open-state rules, and reaction windows. All existing 1P golden replays (`qa/golden/story-01..13.json`) must continue passing bit-for-bit!
- Keep `SimMath` (`runtime/story/sim-math.js`) deterministic across V8 and Goja; `dist/arcade-sim.server.js` (`tools/build-server-sim.mjs`) must pass AST taint analysis with zero DOM/browser references.
- Preserve `Sprotel Bitcoin` (identity 14) Phase 1 & Phase 2 mechanics and pinned collision geometry (`a4d85ae`, `docs/SPROTEL-BITCOIN-PHASE-2.md`).
- Run `node qa/run-all.mjs .` plus browser QA checks before integrating.

---

## 1. P0 — Stop Build Leaks & Slash Cold Start (26.4 MB / 379 Reqs → <2.5 MB / <25 Reqs)

### 1.1 Fix `tools/build-web.mjs` Leaking 121.88 MB of `art/reference/` + 69.77 MB of Duplicate PNGs
- **Files:** `tools/build-web.mjs:79-106`, `sprotel-art.js`
- **Current Problem:**
  1. `tools/build-web.mjs:100-104` regex-scans all `<script>` files for literal `.png/.jpg/.webp/.svg` strings. Because `sprotel-art.js` (230 KB) embeds 49 authoring provenance strings (`"source": "art/reference/20261117-sprotel-bitcoin/..."`), the build **accidentally copies 121.88 MB of raw authoring PNGs** into `dist/`.
  2. `tools/build-web.mjs:88,95` copies **both** `ArcadeBossSheets.presentationPaths()` (`p*-presentation.webp`, 45.2 MB) **and** canonical `config.phases` (`p1/p2.png`, **69.77 MB**), even though runtime renders the `.webp` sheets.
- **Exact Changes:**
  1. Strip authoring provenance (`"source": "art/reference/..."`) from `sprotel-art.js` (move provenance metadata to `tools/provenance/sprotel-art-provenance.json`). This shrinks `sprotel-art.js` from **230 KB → ~35 KB**.
  2. Add an explicit denylist in `tools/build-web.mjs` rejecting any path matching `^art/reference/` or `^art/rework/` unless explicitly allowlisted for Machine Trials, failing the build if `art/reference/` ever enters `dist/`.
  3. In `tools/build-web.mjs:95`, skip copying canonical `p1.png`/`p2.png` whenever the corresponding `p1-presentation.webp`/`p2-presentation.webp` exists.
- **Savings:** **-191.65 MB** removed from `dist/` immediately.

### 1.2 Unblock Start Button & Eliminate Unused Preloads (`game.js`, `boss-transitions.js`)
- **Files:** `game.js:97, 2984-3056, 3112`, `boss-transitions.js:35-57`, `boss-sheets.js:916, 1024-1054`
- **Current Problem:** Level 1 cold start blocks `Start` on **379 HTTP requests / 26.4 MB**:
  - `loadTransition(0)` (`game.js:3056`) blocks boot on a **3.13–4.98 MB PNG** (`4000×2880` = **46 MB decoded RGBA**) that isn't rendered until Phase 2 (~50–80 s into the fight!).
  - `levelAssets(0)` (`game.js:3028`) loads **47 unused fallback `bront` fighter PNGs (747 KB)** even though `ArcadeBossSheets` renders `bront` from `p1/p2-presentation.webp`.
  - `game.js:97` eagerly inserts all 14 `art/portraits/*.png` (**3.87 MB**; `sproto3152.png` 1.42 MB, `sproto3106.png` 1.14 MB, `rivet.png` 530 KB are 1000×1000 PNGs displayed at ≤70×70 px!).
  - `coreAssets()` (`game.js:2984-3022`) loads **124 PNGs (2.50 MB)** including stage-specific assets (Goldie jetpack, mecha, vault-laser, arena backdrop-motions, 20 legacy fallback projectiles, 16 saucer ball-spin frames).
  - `art/generated/pickups/items.png` (`boss-sheets.js:916`) is a **3.69 MB** 2048×2048 PNG drawn for 32×32 px pickups.
- **Exact Changes:**
  1. Remove `loadTransition(index)` from blocking `Promise.all` inside `loadFor()` (`game.js:3056`). Trigger background prefetch of `phase-transition` once gameplay starts (tick 1) so it's ready long before Phase 2.
  2. In `levelAssets(index)` (`game.js:3028`), skip fallback boss `spriteFrames()` whenever `ArcadeBossSheets` has valid presentation atlases for that boss (**-47 reqs / -0.75–1.10 MB/stage**).
  3. Resize all 14 `art/portraits/*.png` to `200×200` WebP (or pack into 1 portrait strip WebP) → **3.87 MB → ~150 KB** (and add `loading="lazy"` / `decoding="async"`).
  4. Split `coreAssets()` (`game.js:2984-3022`) so Goldie jetpack, mecha, vault-laser, backdrop-motions, saucer ball-spin, and legacy fallbacks live inside their specific `levelAssets(index)` buckets (**124 reqs / 2.50 MB → ~25 reqs / ~0.4 MB**).
  5. Downscale & WebP-encode:
     - `art/generated/pickups/items.png` → `512×512` WebP (**3.69 MB → ~80 KB**; update UV scale in `boss-sheets.js` if pixel coordinates are hardcoded).
     - All 13 `phase-transition.png` → WebP (**49.9 MB → ~8–12 MB**).
     - `p*-projectiles.png` (46.9 MB), `missiles/*.png` (12.6 MB), and `14-sprotel-bitcoin/` 76 paged PNGs (61.6 MB) → lossless or q=92 WebP (**~121 MB → ~22–25 MB**; Stage 14 drops from 62.1 MB → ~12 MB).
  6. Pack each of the 14 playable Sprotos' 15–26 loose `fighters/` PNGs into **1 WebP atlas per Sproto** (2P lobby load drops from ~52 PNG requests → **2 requests / ~150 KB**).

### 1.3 Factor `sprite-hitboxes.js` (847 KB → ~40 KB) & Bundle Classic Scripts
- **Files:** `sprite-hitboxes.js`, `legacy.html:70-74`, `tools/build-web.mjs`, `tools/build-server-sim.mjs`
- **Current Problem:** `sprite-hitboxes.js` is **847 KB** because it repeats identical `[reference, crop, core]` row geometry ~37× per phase; `legacy.html` loads **33 unminified `<script>` tags (1.84 MB)**.
- **Exact Changes:**
  1. Refactor `sprite-hitboxes.js` to store per-stage/phase row bounds once (`rows: [r0, r1, r2, r3]`) and map projectile keys → `{ row, visualBox, kind }` (preserving the exact same exported `SPRITE_HITBOXES` lookup API at runtime). Shrinks `sprite-hitboxes.js` from **847 KB → ~40 KB** and `dist/arcade-sim.server.js` from **1.1 MB → ~250 KB**.
  2. Add an esbuild concatenation + minification step in `tools/build-web.mjs` for `legacy.html`'s 33 classic scripts → 1–2 minified bundles (~180 KB gzip), keeping source dev mode unbundled.
  3. Move `art/reference/` (168 MB) and raw `art/rework/` authoring sheets (137 MB) to Git LFS or archive storage so future clones aren't 1.54 GB.

---

## 2. P1 — 2-Player Co-op Architecture & Boss HP Scaling Blueprint

### 2.1 Simulation Refactor: Decouple Presentation & Generalize `player` → `players[]`
- **Files:** `game.js` (~168 `player` refs, 18 `inputFrame` refs), `codebreak.js` (~20 `player` refs), `density-attacks.js` (8 refs), `phase-powerups.js` (5 refs), `runtime/story/replay.js`, `tools/build-server-sim.mjs`
- **Exact Changes:**
  1. **Event Queue Decoupling:** Replace direct presentation calls inside `update()` (`sound()`, `announce()`, `refreshHud()`, `setOverlay()`, `clearLevel()`, `gameScreen.classList`) with `simEvents.push({ type, ... })`, drained each frame by the browser loop (and ignored by headless/server sim).
  2. **Multi-Player State (`players[]`):**
     - Replace singleton `player` with `players: [p1]` (1P) or `[p1, p2]` (2P), keeping `simState()` canonical for hashing & snapshots.
     - Add per-player fields: `slot` (`0 | 1`), `pilotId`, `downed: false`, `reviveProgress: 0`, `tetherTimer: 0`, `sweepHit: false`, `shieldUntil: 0`, `absorbedAt: 0`, `connected: true`, `activeInputTicks: 0`.
     - **Spawns:**
       - Ground / Codebreak: P1 `x = 260`, P2 `x = 190`
       - Chase (L11): P1 `x = 220`, P2 `x = 170`
       - Flight / Naval (L01, L03, L07): P1 `(260, 290)`, P2 `(210, 390)`
     - **Visuals & HUD:** Render P2 with a subtle 2 px cyan/magenta rim outline + overhead `P1`/`P2` badge; add mirrored right-side P2 HUD (`#hearts-p2`, `#missile-status-p2`, `#bomb-status-p2`, `#shield-status-p2`) in `legacy.html`.
     - **Camera:** Keep existing fixed `camera += SCROLL_STEP` (`game.js:2061`), `CHASE_SCROLL = 5.4`, and `CODE_SCROLL = 2.86`; clamp both players independently with `keepPlayerLeft(p)`.
  3. **Downed, Revive, Fall Tether & Wipe Rules:**
     - When `p.hp === 0` in 2P: set `p.downed = true` (cannot fire, no enemy/hazard collision, render revive ring at `p.x, p.y`). Game enters `lost` **only when `players.every(p => p.downed)`**.
     - **Proximity Revive:** If the surviving partner is alive and within `56 px` Euclidean distance (using `SimMath.hypot`), increment `p.reviveProgress`; reset to `0` if partner moves away. At `90 ticks` (1.5 s), revive at `hp = 2`, `downed = false`, `inv = 90` ticks.
     - **Phase 1 → Phase 2 Auto-Revive:** Entering Phase 2 automatically revives any downed player at `hp = 2` + `90t` i-frames.
     - **Chase (L11) & Codebreak Climb (L12 P1) Falls (`game.js:1886`, `codebreak.js:276`):** In 2P, instead of instant team wipe, a falling/caught player loses `2 HP` (or enters `downed` if `hp <= 2`) and starts `p.tetherTimer = 120` (2.0 s), after which they respawn/tether cleanly onto the surviving partner's `(x, y)` with `90t` i-frames. Team wipe only if both players are down/fallen simultaneously.
  4. **Boss Targeting & Co-op Fairness Mechanics:**
     - Add `boss.targetCounter = 0` to boss state. Replace **every** `player.x` / `player.y` boss aim lookup (`startMove()`, `attackBoss()`, `SIGNATURE_PATTERNS`, `fan`, `lanternShower`, `minefall`, `needleFall`, `eyeShot`, `mechaHoming`, `updateVerseGemLaser()`, `updateChaseAttacks()`, `updateCodeAttack()`) with deterministic round-robin selection:
       ```js
       function pickBossTarget(boss, players) {
         const alive = players.filter((p) => !p.downed && p.tetherTimer === 0);
         if (!alive.length) return players[0];
         return alive[(boss.targetCounter++) % alive.length];
       }
       ```
       *(Never use distance-based tie-breaking that could vary with floating-point drift.)*
     - **`ceilingSweep`:** Move `b.sweepHit` onto per-player `p.sweepHit`.
     - **`shieldPulse` (`game.js:1230`):** Gate trigger on `alivePlayers.every((p) => p.shieldWait <= shieldPulseWindup() - 30)` so neither player faces an unavoidable pulse; evaluate `hurt(p, true, true)` independently per alive player.
     - **`density-attacks.js`:** Compute flight/vertical safe opening from `alivePlayers[cycle % alivePlayers.length]` (ground horizontal lanes already support 2 players).
     - **`phase-powerups.js`:** Move `shieldUntil`/`absorbedAt` per player so P1 picking up a shield does not grant P2 a free shield; in 2P mode, spawn **1 heart + 2 shields** per phase attempt.

### 2.2 Boss HP Scaling Formula (Solo Duration Parity) & Critical Bug Traps
- **Files:** `game.js:778-805, 1798-1802`, `codebreak.js`, `levels.js`
- **Exact Scaling Constants (do NOT use `docs/COOP-DESIGN.md`'s old `1.5×`, which clears ~22% too fast):**
  - **Standard Bosses (Levels 1–10, 13, 14):** **`COOP_BOSS_HP_MULT = 1.80`**
    - Phase 1 HP = `Math.round(2 * kit.hp * 1.80)`
    - Phase 2 HP = `Math.round(kit.hp * 1.80)`
    - Examples: L01 Fat Head Dave `526/263` → **`947/473`** (1,420 total); L10 Bot Sales `730/365` → **`1,314/657`** (1,971 total).
    - *(Why `1.80×`: Auto-fire `6.67 DPS` + homing/hitscan specials `2.33–4.33 DPS` give ~96% combined 2P uptime minus ~6% revive downtime → $2 \times 0.94 \times 0.96 \approx 1.80$, matching 1P combat duration while fixed ~25–33 s barrage/transition overhead stays identical.)*
  - **Level 12 Codebreak Phase 2 (`Bitcoin Sheriff`):** **`COOP_CODEBREAK_HP_MULT = 1.85`** (`360` → **`666 HP`** — `CODE_PLAYER_WEAPONS` are 100% homing with ~98% 2P uptime). Phase 1 climb (`CODE_LOOP = 14,400`) stays unscaled (`1.0×`).
  - **Level 11 Rooftop Breakaway (`goldie`):** Fixed distance (`39,040 px`) stays unscaled (`1.0×`).
- **CRITICAL BUG TRAP #1 — `powerupSpan(phase)` (`game.js:778-782`):**
  - Currently computes `Math.round(boss.max * 6.2)`. If `boss.max` is multiplied by `1.80`, Phase-1 pickup timing stretches from ~54 s to ~97 s, **preventing the second pickup from ever spawning**!
  - **Required Fix:** Always store `boss.baseMax` (the unscaled 1P max HP for the current phase) alongside `boss.max`, and pass **`boss.baseMax`** into `powerupSpan(phase)`.
- **CRITICAL EDGE CASE #2 — Mid-Fight Disconnect Rescaling (No Downed-State Cheese):**
  - Track `connectedSeats` (`1` or `2` — active connected peers, *never* alive count).
  - Never rescale down when a partner is temporarily downed.
  - Only if a peer disconnects and reconnect grace (15 s) expires, deterministically rescale on that exact simulation tick:
    ```js
    function rescaleBossForSeats(boss, levelIndex, seats) {
      const prevMax = boss.max;
      const mult = seats <= 1 ? 1.0 : (levelIndex === 11 ? 1.85 : 1.80);
      boss.max = Math.round(boss.baseMax * mult);
      const minFloor = boss.phase === 2 ? currentShieldPulseFloor(boss) : 1;
      boss.hp = Math.max(minFloor, Math.min(boss.max, Math.ceil((boss.hp * boss.max) / prevMax)));
    }
    ```
  - Note: Phase 2 Shield Pulse HP gates (`Math.floor(boss.max / 4) + 1`, `game.js:1798-1802`) automatically scale proportionally with `boss.max`.

### 2.3 Local 2P + Online Nakama Lockstep Relay (`sproto_arcade_coop`)
- **New Client Module:** `coop-net.js` (loaded by `legacy.html`) + Lobby UI in `legacy.html` / `menus.js`
- **Server Counterpart (coordinated with `metaverse-hub`):** `sproto_arcade_coop` match + room-code / quick-match RPCs in `metaverse-hub/server/modules/src/games/sproto_arcade.ts` & `sproto_arcade_coop.ts`.
- **Modes to Support:**
  1. **Solo** (unchanged 1P path, 100% golden parity).
  2. **Local 2P** (P1 Keyboard/Gamepad 0 + P2 Keyboard WASD/Arrows or Gamepad 1 — zero networking needed; great for immediate playtesting of 2P mechanics & boss HP parity!).
  3. **Online 2P Co-op (Nakama Lockstep Relay via `HubSDK.realtimeFromSdk`):**
     - **Lobby UI:** Create 5-char Room Code, Join Code, Quick Match; select level & pilot; display both pilots + RTT badge (warn >160 ms, block quick-match >250 ms).
     - **Synchronized Start:** Server broadcasts `OP_START { levelIndex, pilots: [p1, p2], seed }` (server-issued RNG seed!). Both peers run `loadFor(levelIndex, pilots)` and send `OP_READY`; simulation begins at Tick 0 only after server confirms both `OP_READY`.
     - **Input Transport:** Batch 10-bit `InputFrame` (`runtime/story/replay.js`) every 2 ticks (30 Hz) → ~300–500 B/s per player. Use **4-tick local input delay (67 ms)** + **6-tick jitter buffer**.
     - **Desync Detection & Recovery:** Every 60 ticks both peers send `OP_HASH { tick, hash: ArcadeReplay.hashState(simState()) }`. On mismatch, Seat 0 sends `OP_SNAPSHOT { tick, state: serializeSimState() }` (~3–6 KB), server relays to Seat 1, both call `restoreSimState()`. Abort unrewarded after 3 desyncs.
     - **Reconnect Grace:** 15 s grace window where partner pauses or continues; on timeout, server emits `OP_SEAT_DROP` on a deterministic tick triggering `rescaleBossForSeats(..., 1)`.

### 2.4 Hub Integration Fixes (`hub-link.js`, `story-progress.js`, `legacy.html`, `story-par.js`)
- **Files:** `hub-link.js:369`, `story-progress.js`, `legacy.html:60`, `story-par.js`
- **Exact Changes:**
  1. Fix `hub-link.js:369` dropping rewards when `level >= 12` so **Level 13 (`Redkev's Marina`) and Level 14 (`Sprotel Bitcoin`)** earn `arcade_clear` Tickets like Levels 1–12.
  2. Add `coopBest` map in `story-progress.js` (merged in `ArcadeProgress.MODEL`) so 2P co-op clear times/ranks stay separate from solo S-rank records.
  3. In Online 2P Co-op, let Nakama `sproto_arcade_coop` settle rewards authoritatively for both non-god participants who pass an AFK check (`activeInputTicks >= 0.5 * totalCombatTicks` before first down/clear): grants `breakwater_coin` (L01) + 20 Tickets (`arcade_clear`) per account.
  4. Update `legacy.html:60` stale copy (`"13 levels • 12 boss fights • 1 chase"` → `"14 levels • 12 boss fights • 1 chase • 1 ascent"`) and add Level 14 (`Sprotel Bitcoin`) golden replay (`qa/golden/story-14.json`) + `story-par.js` entry.

---

## 3. Verification Checklist

Run before integrating (from `AGENTS.md`):
```bash
node qa/run-all.mjs .
node tools/build-server-sim.mjs
node tools/build-web.mjs
```
Add new automated tests in `qa/`:
1. **1P Golden Preservation:** All existing `qa/golden/story-01..13.json` pass bit-for-bit with zero drift.
2. **2P Duration Parity Test:** Headless 2-bot simulation across L01–L14 confirming 2P clear time with `1.80×` (`1.85×` L12 P2) lands within **±10%** of 1P golden clear time, and verifying Phase-1 second pickup still spawns (`powerupSpan` uses `boss.baseMax`).
3. **2P Edge-Case Tests:** Proximity revive (90t), Phase 1→2 auto-revive, Chase/Codebreak fall tether (no instant wipe), mid-fight disconnect rescaling (and verifying downed-only does *not* rescale HP), deterministic 2-peer lockstep hash parity across 10,000 ticks.
4. **Build Budget Gate:** Verify `dist/` has **zero** `art/reference/` files, **zero** duplicate canonical `p1/p2.png` where `.webp` exists, and Level 1 cold start is **<2.5 MB / <25 requests**.
