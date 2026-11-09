# Story mode co-op design

Scope: the story campaign (`legacy.html`, `game.js`, `codebreak.js`, `arena-effects.js`). Machine Trials
(`index.html`, `runtime/core/world.js`) is a separate prototype and is not covered. Nothing here ships a
two-player mode yet. This document says what one needs and which groundwork is already in place.

## Groundwork already in place

| Piece | Where | Why co-op needs it |
| --- | --- | --- |
| Per-tick input frames | `readKeyboardFrame()`, `inputFrame`, `NO_INPUT` in `game.js` | The simulation reads one frame object per tick instead of the global key sets, so a second player or a network peer supplies frames the same way. |
| Fixed 60 Hz step | `loop()` accumulator calls `update()` per tick | Lockstep advances by ticks, not wall time. |
| No unseeded randomness in the simulation | `cosmeticRandom` (seeded by `begin()`) replaced the only `Math.random()` in `puff()` | Peers must compute identical state from identical inputs. |
| Determinism check | `qa/replay-browser.mjs` | Feeds a scripted input-frame sequence into `update()` twice per level and requires identical state checksums. |
| Per-level asset groups | `coreAssets()`, `levelAssets()`, `spriteFrames()` and `loadFor()` in `game.js` | A second player's Sproto loads its own group (`loadSproto(id)`), and the online lobby can wait for every peer's `loadFor()` before tick 0. |

## Local co-op (two players, one machine)

**Controls**

| Action | P1 | P2 |
| --- | --- | --- |
| Move | WASD | arrow keys |
| Jump | Space | Right Ctrl or Numpad 0 |
| Dash | Left Shift | Right Shift |
| Shield / C / V specials | X / C / V | Numpad 1 / 2 / 3 |

A connected gamepad takes P2 through the Gamepad API. Single-player keeps today's mapping, where arrows
and WASD both move P1. `readKeyboardFrame()` becomes `readKeyboardFrame(map)`, called once per player per
tick.

**Rules**
- **Shared boss and separate HP:** one boss with the same HP pool, scaled ×1.5 for two players. Each
  player has `MAX_HP` hearts.
- **Downed and revive:** a player at 0 HP is downed and does not cause a loss. They revive with 2 HP at
  the next phase change, or when the partner stands next to them for 90 ticks. The round is lost only
  when both are down.
- **Camera:** boss levels keep the fixed scroll (`camera+=SCROLL_STEP`). Both players are clamped to the
  screen, as `keepPlayerLeft()` already does for one. In the chase and Codebreak, a player who falls
  behind the screen edge is downed rather than lost.
- **HUD:** hearts and cooldowns are drawn per player, left (P1) and right (P2), by `refreshHud()`. The
  `#hearts`, `#missile-status` and `#bomb-status` elements gain P2 twins.

**What must become per player.** Each item below is a single-`player` assumption today.
- **State:** `player` becomes `players[]`. `begin()` builds one object per player with its own
  `selectedSproto` id.
- **Movement:** `movePlayer()`, `moveGround()`, `moveSaucer()`, `updateShield()` and `updateChase()` take
  `(p, frame)` rather than reading globals. Codebreak's movement in `codebreak.js` does the same.
- **Bullets:** `fire(...)` records an `owner` index next to `own`. Missiles and bombs (`steer()`) home on
  the boss, so they are unchanged.
- **Boss targeting:** every boss attack that aims at `player.x`/`player.y` (the sky-relative rows in
  `SIGNATURE_PATTERNS`, `attackBoss()`, `updateChaseAttacks()`, the Verse gem laser) picks a target with
  a seeded choice per volley, alternating by volley index. Never "nearest", which is unstable at
  equal distances.
- **Damage:** `hurt()` takes the player hit. Contact and hazard checks in `updateBullets()` and
  `updateHazards()` loop over `players`. God mode applies to all players.
- **Rendering:** `drawGroundPlayer()`, `drawSaucer()` and `drawPlayerShield()` loop. P2 gets a 2 px
  outline tint so identical Sprotos stay readable.

## Online co-op (two to four players over the hub)

**Transport.** Use a Nakama authoritative match on the hub server, the same way Sproto Fighter's
`sproto_duel` and Sproto Duel's `sproto_arena` work. A new `sproto_arcade_coop` match is registered from
`server/modules/src/games/` and joined with the hub session that the portal ticket already gives the
game (`HubSDK.realtimeFromSdk`). The session carries identity: user id, display name and ranked flag.
There is no separate login.

**Model: deterministic lockstep with input delay**
- Each client sends `{tick, frame}` for its own player only. A frame packs into 10 bits.
- The match relays the frames and stamps the authoritative tick. It does not simulate.
- A client advances tick `t` only when it holds every player's frame for `t`. The local input delay is
  4 ticks (67 ms), so ordinary latency is hidden.
- On a stall, the client waits with the screen held, showing "waiting for partner". There is no
  rollback in v1, because `update()` also renders HUD side effects and would need splitting first.

**Latency budget:** 4-tick delay plus a 6-tick jitter buffer. That covers about 160 ms round trip without
stalls. Above that, the lobby warns, and above 250 ms it refuses.

**Desync detection and recovery**
- Every 60 ticks each client sends a checksum: the same FNV hash over player, boss, bullets and hazards
  that `qa/replay-browser.mjs` computes.
- The host is the first player to join. If a checksum differs, the host sends a state snapshot, which
  needs a `serialize()`/`restore()` pair over the globals listed in `begin()`. Clients restore it and
  resume at the next tick.
- Three desyncs in one level end the match with a visible error. The run is not scored.

**Start:** every client calls `loadFor(level, sprotoId)` for each player's Sproto, then sends `ready`. The
match starts tick 0 when all are ready, with a shared seed for `cosmeticRandom`.

**Rewards:** each player reports their own relic event and Tickets through the hub SDK, as in single
player. Server rules already make relic grants idempotent per user.

## Staged rollout

1. **Done:** input frames, seeded cosmetic RNG, the replay checksum check, and per-level asset groups.
2. **Split simulation from presentation:** move the `refreshHud()`, `announce()` and `sound()` calls out
   of `update()` behind an event list, so a tick can run headless or be replayed.
3. **Local co-op behind `?players=2`:** `players[]`, per-player input maps, targeting and downed state.
   Human playtest the boss fairness at ×1.5 HP.
4. **`serialize()`/`restore()`** plus a desync test that restores mid-level and compares checksums.
5. **Online:** the `sproto_arcade_coop` match on the hub server, a lobby UI, and two players first.
   Four players only after the playtest from step 3 shows the screen stays readable.
