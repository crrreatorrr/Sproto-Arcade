# Two-seat co-op (story mode)

Status: implemented from `CLAUDE_HANDOFF_OPTIMIZATION.md` §2. Automated checks only: balance, readability and the
online feel need human playtests. The hub's `sproto_arcade_coop` match is live on metaverse-hub `main` (`a3d94f9e`,
`server/modules/src/games/arcade_coop.ts`, registered in `main.ts`); its RPC names, opcodes and payloads were
checked against the tables below. No live two-browser match against a running hub has been played from this repo.

## Modes

- **Solo**: unchanged. `players` is `null`, so the simulation, its state hash and every `qa/golden` replay are
  exactly as before.
- **Local 2P**: one keyboard (and up to two controllers). Choose *Players → Local 2P* and a P2 Sproto on the title card.
  - Seat 1: WASD to move, Space or W to jump, Left Shift to dash, X shield, C and V specials.
  - Seat 2: arrows, ↑ or Numpad 0 to jump, Right Shift or Numpad 1 to dash, M or Numpad 2 shield, `,` and `.`
    (or Numpad 4 and 5) specials.
  - Controllers are read directly: one pad plays seat 2, two pads play seats 1 and 2. The pad keys that
    `gamepad.js` synthesizes for solo play are ignored for seat input.
  - Clears save local progress and the co-op best (`coopBest`). They earn no Tickets: there is no solo replay
    log for the hub to verify.
- **Online 2P**: *Players → Online 2P* opens the lobby (create a room code, join one, or quick match). Needs a hub
  session; offline the panel says so.

Co-op covers the boss levels (1-10, 13, 14). The rooftop chase (11) and the Codebreak climb (12) stay solo; picking
them with Local 2P plays them solo. The handoff's tether rules and the 1.85x Codebreak phase-2 health are not
implemented (`COOP_CODEBREAK_HP_MULT` is defined for when the climb joins).

## Rules (simulation, `game.js`)

- Seats: seat 1 spawns where the solo player does; seat 2 spawns 70 px behind on the ground, or 50 px behind and
  100 px lower in the air and on water.
- Targeting: when a boss move starts, `boss.targetSlot` is the next standing seat round-robin
  (`boss.targetCounter`). Every aim inside that move reads that seat. No distance tie-breaks.
- Per seat: movement, firing, contact with shots, hazards, beams and barrage missiles, damage, the shield, dash and
  pickups. A shot hits the first standing seat it touches.
- Shield pulse waits until every standing seat's shield can answer it and hits each seat. The ceiling sweep keeps a
  `sweepHit` per seat. Barrage openings follow one standing seat, alternating by cycle.
- Downed: a seat at 0 hearts is downed (no movement, fire or contact). The run is lost only when no seat stands.
  A standing partner within 56 px for 90 ticks revives it at 2 hearts with 90 ticks of invulnerability. Entering
  phase 2 stands every downed (connected) seat up the same way.
- Boss health with two connected seats: 1.80x per phase (`Math.round(2 * hp * 1.8)` then `Math.round(hp * 1.8)`).
  `boss.baseMax` keeps the solo health, and `powerupSpan()` uses it, so the pickups appear at the solo times.
- Pickups with two seats: one heart and two shields per phase attempt. The second shield's plan is derived from the
  first two (between them in time, mirrored in place), so no extra random numbers are drawn. Each seat has its own
  pickup shield (`shieldUntil`).
- Seat drop (online, after the 15 s grace): at the agreed tick `dropSeat(slot)` marks the seat disconnected and
  `rescaleBossForSeats(boss, 1)` returns the boss to solo health, keeping its health fraction and the phase-2 shield
  floor. A downed seat never rescales anything.

## Online protocol v1

The shared contract with metaverse-hub (Nakama match `sproto_arcade_coop`, game `sproto-arcade`, 2 seats, `v: 1`,
JSON payloads). `coop-net.js` is the client; `qa/coop-mock-relay.cjs` is a test stand-in for the server.

| RPC | Request | Response |
|---|---|---|
| `arcade.coop_create` | `{level, pilot}` | `{match_id, code}` (5 of `ABCDEFGHJKMNPQRSTUVWXYZ23456789`) |
| `arcade.coop_join` | `{code}` | `{match_id}` or `{error: "not_found" \| "full"}` |
| `arcade.coop_quick` | `{level, pilot}` | `{match_id}` |

| Op | Name | Direction | Payload |
|---|---|---|---|
| 1 | HELLO | client → server | `{v, pilot, level}` |
| 2 | LOBBY | server → clients | `{code, level, seats:[{seat, name, pilot, present}]}` |
| 3 | START | server → clients | `{levelIndex, pilots:[p0, p1], seed, seat, names}` |
| 4 | READY | client → server | `{}` after the level has loaded |
| 5 | GO | server → clients | `{}`; the run starts at tick 0 |
| 10 | INPUT | client → server → peer | `{seat, from, frames:[mask…]}`; the server sets `seat` from the sender |
| 11 | HASH | client → server | `{tick, hash}` every 60 ticks |
| 12 | DESYNC | server → clients | `{tick, count}`; seat 0 then sends SNAPSHOT |
| 13 | SNAPSHOT | seat 0 → server → seat 1 | `{tick, state}` (`serializeSimState()`, a few KB) |
| 14 | RESULT | client → server | `{status: "clear" \| "wipe" \| "abort", level, tick, god}` |
| 15 | OUTCOME | server → clients | `{status, reason?, rewards:{tickets, relics}}` |
| 16 | PEER | server → clients | `{seat, present, graceS}` |
| 17 | SEAT_DROP | server → clients | `{seat, tick}`, tick at least 10 after the latest relayed input |
| 18 | PING | client → server → same client | `{c}` → `{c, s}` |
| 19 | CANCEL | server → clients | `{reason}` |

Client details:

- Input frames are the 10-bit replay masks (`runtime/story/replay.js`). A peer's frame for tick T is sampled at
  T − 4 (4-tick input delay) and sent in batches every 2 ticks. Ticks 1-4 are empty for both seats.
- A tick runs only when both seats' frames for it are present; otherwise the page waits (no pause, no rollback).
  Frames are kept 240 ticks after use so a snapshot from a peer a few ticks behind can be replayed.
  `JITTER_TICKS = 6` is exported for the catch-up policy; the story loop's fixed-step accumulator runs the backlog.
- Rewards are settled only by the server, once per match. The page shows OP_OUTCOME and never calls a reward API for
  co-op (checked by `qa/coop-net.test.cjs`).
- RTT: PING every 2 s; the badge warns above 160 ms; a quick match above 250 ms is left.

Contract deviations: none. Additions that stay backward compatible: `coop_join` may also answer `{error}` in the
body instead of an RPC error (the client accepts both), and `OP_READY` carries `{}`.

Hub rules the client follows (from `arcade_coop.ts`):

- RPC failures come back in the body as `{error, message}`; the SDK's `rpc` throws them as `HubSdkError` with that
  code. `not_found`, `full` and `bad_level` are the player's to fix; `rate_limited` and `busy` show the hub's text.
- `level` is the 1-based stage id (1-14) everywhere, and START's `levelIndex` is `level - 1`.
- OP_HELLO with a `level` other than the room's is cancelled (`level_mismatch`), and one with another `v` is
  cancelled (`version_mismatch`). A player joining by code therefore leaves `level` out and takes the room's level
  from START; create and quick match send it.
- OP_RESULT without `god: false` counts as god mode and pays no one. The page always sends the flag.
- The realtime socket uses `HubSDK.realtimeFromSdk` with the SDK's `serverUrl` (`ArcadeHub.serverUrl`, '' is
  same-origin `/ws`).

## Simulation API for tests and the hub

`dist/arcade-sim.server.js` exports `ArcadeSim.coop`: `start(level, pilots, seed)`, `step(mask0, mask1)`,
`dropSeat(slot)`, `hash()`, `snapshot()`, `restore(text)` and `state()`. The hub does not need to replay co-op runs
under this contract; the API exists for the lockstep tests and for a future server-side check.

## Checks

- `qa/coop-sim.test.cjs`: 10,000-tick two-peer hash parity, snapshot restore, 1.80x health and solo pickup span,
  revive, phase-2 auto-revive, downed-only vs dropped rescaling, and a duration comparison (two unkillable seats
  at 1.80x against one seat at solo health, same inputs: 0.85-1.08x on 11 levels).
- `qa/coop-net.test.cjs`: two clients and two sim peers through the mock relay with latency: codes, lockstep,
  desync recovery, grace and seat drop, settlement (AFK, god mode), no client-side rewards.
- `qa/coop-browser.mjs` (browser, separate): Local 2P in Chromium.
