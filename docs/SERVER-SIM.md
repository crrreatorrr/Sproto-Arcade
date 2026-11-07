# Server-side story replay (`dist/arcade-sim.server.js`)

The hub should not trust a browser that says "I cleared level N" or "I beat `bront`". Story
mode (`legacy.html`, the mode that reports to the hub) now records every run's inputs. The
hub's goja server can replay that log with `dist/arcade-sim.server.js` and get the same result
the player's browser got.

Machine Trials (`index.html`, `runtime/core/world.js`) sends nothing to the hub, so it is not
covered.

## Bundle contract (locked with the hub team)

```js
var ARCADE_SIM_VERSION = '<sha256(body)[0:16]>';   // line 1 of the file
ArcadeSim.verifyClear(log) -> { ok, error?, simVersion, kind, stage?, bossId?, godMode, ticks, endHash }
```

- **One file, goja-safe ES5, top-level globals.** It is a plain script: load it the way
  `vendor/sproto-sim.js` is loaded, by concatenating it into the server runtime. It declares
  exactly two globals, `var ARCADE_SIM_VERSION` and `var ArcadeSim`. Everything else lives inside
  one function. The last line is a guarded `module.exports = ArcadeSim` for Node. The bundle uses
  no WASM, async code, Promise, Date, Math.random, import/require or DOM globals.
- **Version.** Line 1 is exactly `var ARCADE_SIM_VERSION = '<16 hex>';` followed by `\n`. The
  **body** is every byte after that first `\n`, to the end of the file (UTF-8). The 16 hex
  digits are the first 16 of `sha256(body)`. `ArcadeSim.ARCADE_SIM_VERSION` and every
  result's `simVersion` carry the same value. `runtime/story/sim-version.js` gives the browser
  the same value, so the browser stamps it on every log it records.
- **`verifyClear` never throws.** On bad input it returns
  `{ ok:false, error:'<text>', simVersion, godMode, ticks, endHash }`. It always includes
  `endHash`: the hash of whatever state was reached, or of the empty state (`ArcadeSim.EMPTY_HASH`)
  when nothing ran. A last-resort try/catch turns any internal error into `ok:false`.
- Fields:
  - `ok`: true only when the replay reproduces a clear that agrees with `log.claimed`.
  - `error`: why `ok` is false. Examples: `'god mode'`, `'sim version mismatch: …'`,
    `'player lost at tick N'`, `'no clear within N ticks'`, `'cleared at tick A but the log runs B ticks'`,
    `'claimed bossId disagrees with the replay'`, `'inputs truncated'`.
  - `simVersion`: the bundle's version.
  - `kind`: `'clear'` for a level clear (the `arcade_clear` Tickets report) or `'boss'` for a
    story-boss defeat (`arcade.boss_defeated`). It is taken from `log.claimed.kind` once the log
    validates.
  - `stage`: the level id, 1 to 12 (`LEVELS[i].id`).
  - `bossId`: the level's boss id (see the table below). It is present when `kind` is `'boss'`.
  - `godMode`: echoed from the log in every result.
  - `ticks`: the simulation ticks replayed (60 per second). On success this is the clear tick.
  - `endHash`: 16 hex digits.

Other helpers on `ArcadeSim`: `chunkLog`, `joinChunks`, `encodeInputs`, `decodeInputs`,
`maskOf`, `EMPTY_HASH`, `levels` (stage, bossId, title for each level).

## Log format (schema 1)

```js
{
  schema: 1,
  simVersion: '2b9bd41212be9bca',            // ARCADE_SIM_VERSION of the client build
  seed: 24301,                               // uint32, see "Seed" below
  rules: { mode: 'story', level: 1, shieldWait: 0 },
  loadout: { pilot: 'rivet' },               // the Sproto played
  ticks: 7215,                               // simulation ticks in the log
  inputs: 'AQG4OAAB…',                       // base64, see below
  claimed: { kind: 'boss', stage: 1, bossId: 'bront', ticks: 7215, endHash: '…' },
  godMode: false                             // true if god mode was on at any point in the level
}
```

- `rules.level` is the level id (1 to 12). `rules.shieldWait` (0 to 600) is the shield
  cooldown that "Next level" carries over from the previous level. It is 0 for a level started
  from the menu or after a retry.
- `loadout.pilot` must be one of the 14 playable Sproto ids. Whether the account has unlocked
  that Sproto is not checked here (see Limitations).
- `inputs` is a base64 string of these bytes: `[format=1][seats=1][varint ticks]`, then for the
  one seat a list of `(varint mask, varint run)` pairs whose runs add up to exactly `ticks`.
  Varints are unsigned LEB128. The decoder is strict: it rejects invalid base64, a wrong format or
  seat count, a tick-count mismatch, mask bits above 9, zero-length runs, overruns and trailing
  bytes.
- Mask bits, one 10-bit mask per tick. These are exactly the fields `game.js` reads:
  `0 left, 1 right, 2 up, 3 down, 4 jump, 5 jumpHeld, 6 dash, 7 shield, 8 missile, 9 bomb`.
- `claimed` holds what the client says happened. The hub ignores it except to compare it with
  the replay, and `verifyClear` makes that comparison itself. It returns `ok:true` only when all
  of these hold:
  - the run clears on exactly the log's last tick;
  - `claimed.stage` equals the level;
  - `claimed.bossId` matches when `kind` is `'boss'`;
  - `claimed.ticks` equals the clear tick;
  - `claimed.endHash`, if present, equals the replay's hash.
- `godMode: true` never counts. The result is `ok:false, error:'god mode'`, echoes `godMode:true`
  and carries the empty-state `endHash`. Such a run is not replayed, because god mode's toggles
  are not in the log.

## How the hub should call it

1. Load the bundle once per runtime. Reject any log whose `simVersion` is not a bundle you have
   loaded; `verifyClear` already rejects other versions. To accept old clients during a rollout,
   keep the previous bundles and pick one by `log.simVersion`. Each bundle is self-contained, and
   the names inside one do not leak into another.
2. Get the log from the report (see the next section), or reassemble it with
   `ArcadeSim.joinChunks(chunks)` → `{log}` or `{error}`.
3. Call `var r = ArcadeSim.verifyClear(log)`. Count the report only if every check passes:
   - `r.ok === true` (this already covers version, god mode, a real clear and claim agreement);
   - `r.kind` matches the report type: `'boss'` for `arcade.boss_defeated`, `'clear'` for `arcade_clear`;
   - `r.bossId` equals the event's `data.boss` (for example `'bront'`) for boss reports;
   - `r.ticks` is plausible: the golden bot clears take 7,000 to 8,000 ticks, about 2 minutes,
     and a log can be at most 108,000 ticks (30 minutes). A floor per level, set from real
     clears, would catch impossibly fast runs;
   - if the client sent its own end hash, it equals `r.endHash`;
   - the log has not been used before. Key it on the report's idempotency key, or on `r.endHash`
     together with the player.
4. Treat `ok:false` as "not verified" and keep `r.error` for diagnostics.

## How logs reach the hub today

- **`arcade.boss_defeated`** (level 1, `bront`, sent while the Breakwater Coin is not owned):
  `sdk.reportEvent('arcade.boss_defeated', { boss: 'bront', replay: <log> }, key)`. The SDK
  passes `data` through as-is, so `vendor/hub-sdk` is unchanged. The live hub's `session.event`
  RPC must accept the extra `replay` key. The run is the same for both reports, so this log has
  `claimed.kind = 'boss'`.
- **`arcade_clear`** (20 Tickets per non-god clear): **not attached.** `sdk.earnTickets(amount,
  reason, key)` has no data or metadata parameter, and the SDK must not change in this task, so
  the log has nowhere to go. The client still builds it, with `claimed.kind = 'clear'`, and
  keeps it in `ArcadeHub.state.lastReplay`. To verify Tickets, the hub needs one of:
  - an optional `meta` argument on `earnTickets`;
  - a companion event such as `arcade.clear_replay` that the server accepts;
  - a server-side rule that grants clear Tickets from a verified event instead of from
    `tickets.earn`.
- Logs larger than 32,768 bytes of JSON are not attached (see Sizes).
- In the browser, `game.js` starts a recorder in `begin()`. It records the input frame before
  each `update()` in the game loop. `clearLevel()` stamps the claim with the end-state hash and
  hands the log to `ArcadeHub.levelCleared(level, god, replay)`.

## Chunks

`ArcadeSim.chunkLog(log [, maxBytes=4096])` returns strings of the form
`ARC1:<index>/<count>:<16-hex hash of the whole JSON>:<slice>`. Each string is at most 4096
bytes and pure ASCII, because non-ASCII characters are `\u`-escaped. `joinChunks` accepts the
chunks in any order. It checks the header, the count, duplicates, missing pieces and the
whole-JSON hash, and returns `{error}` instead of throwing. The browser exposes the same
functions as `ArcadeReplay.chunkLog` / `joinChunks` (`runtime/story/replay.js`). The SDK sends
over HTTP RPC, where one body holds the whole log, so the client does not chunk today. The
helpers are for a socket transport.

## Seed

Story mode has no gameplay randomness. The only random stream, `cosmeticRandom`, moves sparks
(dust and impact particles) that cannot touch the player or the bosses. The client seeds it as
before, with `0x5eed + levelIndex`, and puts that seed in the log. `verifyClear` replays with
whatever `log.seed` says. Sparks are part of the hashed state, so the seed changes `endHash` but
never whether a run clears. The SDK provides no session seed today. When the hub issues one,
`begin()` can pass it to `resetRun()` instead of `0x5eed + index`, and the hub should then check
that `log.seed` is the one it issued. Because the game has no gameplay randomness, a server seed
cannot stop a precomputed or bot-played run (see Limitations).

## Boss ids (please confirm)

| Level | Title | `bossId` used | Confidence |
|---|---|---|---|
| 1 | Tidebreak Marina | `bront` | Confirmed: the hub's Breakwater Coin rule (`relicForEvent`) |
| 2 | Last Light Bar | `vela` | Unconfirmed |
| 3 | Mudline Trenches | `crapto` | Unconfirmed |
| 4 | Sproto Ranch | `zephyr` | Unconfirmed |
| 5 | Neon Tomorrow | `sproto102` | Unconfirmed |
| 6 | Circuit Gate | `rune` | Unconfirmed |
| 7 | Moonkeep Castle | `bigswole` | Unconfirmed |
| 8 | Crown Relay Chamber | `alpha777` | Unconfirmed |
| 9 | The Hatchery | `highsproto` | Unconfirmed |
| 10 | Verse Gate | `sprotosales` | Unconfirmed |
| 11 | Rooftop Breakaway (Goldie chase) | `goldie` | Unconfirmed |
| 12 | Codebreak Ascent (Bitcoin Sheriff) | `bitcoin_sheriff` | Unconfirmed |

Levels 1 to 10 use the `acts` ids in `game.js`, the same convention that gave `bront`. Levels 11
and 12 had no id in the code before, so these two were invented. The list is `STORY_BOSS_IDS` in
`game.js`.

## Versioning

`ARCADE_SIM_VERSION` changes whenever the bundle body changes. That includes:

- any change to the simulation code the build extracts from `game.js`, `codebreak.js`,
  `levels.js` or `arena-effects.js`;
- any change to `runtime/story/sim-math.js`, `replay.js` or `server-entry.js`;
- a toolchain change that alters the output.

Rendering-only edits to those files do not change it, because they are not extracted. The
browser and the server must ship from the same commit:

- `tools/build-web.mjs` copies `runtime/story/sim-version.js` into the web build;
- the hub vendors `dist/arcade-sim.server.js` from the same commit.

Old logs are rejected with `sim version mismatch` unless the hub keeps their bundle (see
"How the hub should call it"). Within one version, log `schema` 1 is fixed. A future format
would use `schema: 2`.

## Building and checks

```bash
npm ci                                   # dev tools only: acorn, acorn-walk, typescript
node tools/build-server-sim.mjs          # writes dist/arcade-sim.server.js and runtime/story/sim-version.js
node tools/check-server-bundle.mjs       # header = sha256(body)[0:16], equals a fresh build, ES5 (acorn ecmaVersion 5),
                                         # only the two globals, no forbidden APIs, garbage -> ok:false
node qa/server-sim-goldens.mjs .         # goldens on the ES2020 source sim and on the bundle (also run by qa/run-all.mjs)
(cd tools/goja-verify && go run . ../..) # the same cases in goja (github.com/dop251/goja, June 2025 commit)
node qa/replay-golden-browser.mjs .      # Chromium: legacy.html records the same log and endHash as the bundle
node tools/story-bot.mjs [level…]        # regenerate goldens (about 1 minute per level)
```

How the build works (`tools/build-server-sim.mjs`):

- It parses the game's own classic scripts and starts from what `runtime/story/server-entry.js`
  uses.
- It takes every top-level declaration needed, transitively, plus the statements that fill those
  tables. It fails on any name that reaches the browser or cannot be resolved.
- It lists the UI statements it skipped.
- TypeScript transpiles the result to ES5. For-of loops and spreads compile as index loops,
  which are much faster in goja. The build refuses for-of or spread over anything not known to be
  an array.

`dist/` is git-ignored except this one file. `tools/build-web.mjs` keeps the file when it
rebuilds `dist/`.

CI (`.github/workflows/gameplay.yml`) runs two jobs:

- **server-sim**: `npm ci`, the bundle check (this fails if the bundle changed without its
  version header, or if it differs from a fresh build) and the Node goldens.
- **server-sim-goja**: `actions/setup-go` and `tools/goja-verify`.

`web-build.yml` also runs the Chromium client-equals-server check.

If a gameplay change is intended, the golden end hashes change too. Run `node
tools/story-bot.mjs` to record new clears, then `node qa/server-sim-goldens.mjs . --write-fuzz`
to refresh `qa/golden/fuzz.json`.

Moonkeep (level 7) now uses user-authorized UFO flight and vertical dragon patrols.
Its production clear is earned again with the flight controller. Historical
`qa/golden-disabled` files remain unchanged: `--collision-disabled` explicitly disables sprite hitboxes,
density barrages, and phase powerups before replaying those historical rules. It
excludes level 7's old grounded clear and its two stored fuzz hashes, while
retaining exact checks for the other eleven levels. The original fixture order
and RNG stream are preserved. All 24 fuzz runs still check determinism and
source/bundle agreement; production mode requires all thirteen current clears
and all stored fuzz hashes.

## Tests

Current production goldens cover 13 levels, one legal-input bot clear each, with no god mode or damage-free requirement. The historical forced-disabled lane checks 11 original clears: the original Moonkeep7 grounded clear remains archived and is deliberately excluded after its authorized flight replacement. Redkev13 belongs to the current production lane. Each production golden is checked:

- as a `boss` report and as a `clear` report;
- with a correct claimed hash and with a wrong one;
- with a wrong claimed boss;
- for its chunk round trip.

Shared cases:

- a truncated log (no clear) and inputs after the clear;
- tampered inputs (rejected, or a different hash);
- standing still (death);
- god mode;
- another version;
- a wrong claimed stage or ticks;
- 32 malformed logs;
- 300 random garbage logs;
- corrupted chunks;
- a determinism fuzz of 24 random input logs, each replayed twice. Their hashes must match the
  Node-recorded `qa/golden/fuzz.json`, so goja is held to the same bits.

The original 12-level checkpoint recorded 86 checks passing on the source sim and bundle in Node and goja, with all 12 Chromium replays matching their logs and `endHash`. That is historical evidence. Current candidate reports and CI must separately establish all 13 production clears and the deliberate 11-clear historical forced-disabled lane.

## Historical sizes (original 12-level checkpoint)

These recorded logs come from the golden bot, which changes input up to every 6 ticks. That is much busier
than a human player.

| Level | Ticks | `inputs` (bytes) | Log JSON (bytes) | 4096-byte chunks |
|---|---|---|---|---|
| 1 to 10, 12 | 7,061 to 7,962 | 8,028 to 8,852 | 8,257 to 9,082 | 3 |
| 11 (chase) | 7,061 | 2,412 | 2,657 | 1 |

The largest is level 4 at 9,082 bytes, which splits into chunks of 3054, 3054 and 3052 bytes.

Each input change costs about 2.7 encoded bytes (a 1 to 2 byte mask and a 1 to 2 byte run,
plus a third for base64). The 32 KB cap therefore holds roughly 11,000 changes. That is about 9
minutes at the bot's pace, and 30 to 90 minutes at a human's 2 to 6 changes per second. A typical
2-minute human clear should take 1 to 3 KB. A pathological log that changes input every tick
reaches 32 KB after about 7,000 ticks. Such logs are not attached, and the hub sees a report with
no `replay`.

## Performance

These are full clears of the 12 goldens, 7,000 to 8,000 ticks each.

| Engine | Per full clear | Notes |
|---|---|---|
| Node 22, bundle | ~10 ms warm, 10 to 42 ms cold (mean 19 ms) | |
| goja (dop251/goja, June 2025) | **500 to 830 ms, mean 640 ms** (about 85 µs per tick) | Loading the bundle takes 13 to 22 ms |

**Blocker: the 100 ms target is not met in goja; it is missed by 5 to 8 times.** Profiling shows
the cost spread across the simulation's ordinary per-tick work:

- player and boss movement, bullets, hazards;
- goja boxes every float and looks up properties through Go maps.

There is no single hot spot. Things already ruled out or measured:

- iterator helpers (removed, no change);
- strict mode (no change);
- a correctly rounded double-double sin, 75 µs a call in goja (replaced by the musl kernels);
- skipping cosmetic sparks on the server, about 20% faster (not done, because it would split the
  client and server hash).

Options for the hub:

- verify off the request path, in a queue or deferred job, since there is one replay per clear;
- run the same bundle in a Node or V8 sidecar, where it takes about 10 ms;
- treat the replay as a later audit rather than a gate;
- a follow-up that optimises the hot paths in `game.js` itself. Behaviour-preserving
  refactors such as caching `isFlying()`/`hasMecha()` per tick might gain 1.5 to 2 times, not 7.

## Determinism

- The simulation is a fixed 60 Hz step that reads only the input frame.
- Engines' libm differ, so `game.js` and `codebreak.js` call `SimMath`
  (`runtime/story/sim-math.js`) instead of `Math.sin/cos/atan2/hypot`. `SimMath` uses only
  `+ - * /` and `sqrt`, which IEEE 754 makes exact on every engine.
- `atan2` and `hypot` match V8 bit for bit. `sin` and `cos` (fdlibm reduction, musl kernels)
  differ from Chrome's last bit for about 1% of arguments. That is a 1e-14 px change no player can
  see, and it is the only change to gameplay arithmetic in this work.
- `x ** 2` (Goldie's recoil) is exact in both V8 and Go.
- Numbers hash by their IEEE bits.

## Limitations

- **Performance in goja** (see above).
- **Tickets clears carry no log** (SDK API; see "How logs reach the hub today").
- **A replay proves that the inputs legally clear the level, not that a human typed them.** A
  bot such as `tools/story-bot.mjs` makes valid logs. A server seed does not help, because story
  mode has no gameplay randomness. Duplicate detection and time floors limit the abuse.
- `loadout.pilot` unlocks and the carried `shieldWait` are only range-checked, and the pilot
  does not affect the simulation. The hub can check unlocks against the player's save or Relics.
- God-mode clears never verify. Today the hub grants the Breakwater Coin for god-mode wins too. If
  the hub starts requiring a verified replay, god-mode Coin claims will stop working, as the
  contract intends.
- Only Chromium was run in the browser. With `SimMath` there is no known source of divergence
  in Firefox or Safari, but those browsers were not tested.
- The goldens are bot runs, not human playtests.
