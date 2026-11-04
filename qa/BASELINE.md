# Baseline gate evidence

Pinned gameplay baseline: `a25acb1`; inspected from contract worktree `d36f7a4`.
No production code was changed by QA. The current build is preserved in `legacy.html`.

Executed on local macOS Chrome headless, actual `file://.../legacy.html` entry, Node 22.22.3 with no browser package dependency. `node qa/baseline-browser.mjs` loaded all preloaded images, started each of twelve entries, stepped and rendered each entry, invoked existing Phase 2 routing for the eleven entries supporting it, forced damage loss, clicked the real restart button, and invoked the clear routing. Every retry returned 5 HP and empty bullets/hazards. No uncaught browser exceptions. Detailed observations: `baseline-routing.json`.

This is routing verification, not earned victory or a base-kit completion claim. Phase transitions and clears were deliberately invoked by the harness. No eight-person playtest or comprehension measurement occurred.

| Stage | Entry mode | Phase 2 route | Loss/retry route | Clear route |
|---|---|---|---|---|
| 01 Marina | Generic scrolling boss | 96-tick shift to fixed arena | `hurt` → lost → start button → `begin(index)` | clear → next |
| 02 Last Light | Generic scrolling boss | Same generic shift | Same | clear → next |
| 03 Mudline | Flight boss | Same shift, flight remains | Same | clear → next |
| 04 Ranch | Generic scrolling boss | Same generic shift | Same | clear → next |
| 05 Neon | Generic scrolling boss | Same generic shift | Same | clear → next |
| 06 Circuit | Generic scrolling boss | Same generic shift | Same | clear → next |
| 07 Moonkeep | Generic scrolling boss | Same generic shift | Same | clear → next |
| 08 Crown | Generic scrolling boss | Same generic shift | Same | clear → next |
| 09 Hatchery | Generic scrolling boss | Same generic shift | Same | clear → next |
| 10 Verse | Ground boss | Same generic shift | Same | clear → next |
| 11 Rooftop | Auto-running chase | Absent | Chase loss or `hurt` → lost → `begin(index)` | route end → next |
| 12 Codebreak | Auto-scrolling vertical climb | 80-tick summit shift → siege | fall or damage → lost → `begin(index)` | won |

## Integration points

- `levels.js`: 12 stage definitions; selector built from `LEVELS` in `game.js`.
- `game.js`: `begin` initializes player and clears stage variables; dispatches `startBoss`, `startChase`, `startCodebreak`. `update` routes Codebreak/chase separately before generic boss updates. `hitBoss` drives HP transition and defeat. `refreshHud` routes special HUDs. `ui.start` click handles start, retry, pause and next-stage continuation.
- `codebreak.js`: authored repeating ledges, auto-scroll climb, nine gun/beam types, summit siege. Phase 1 progression is camera-time driven; no base-kit climb completion was tested.
- Asset preloading in `game.js`: a single `Promise.all(img.decode())` gate disables start until ready. A missing required image blocks all entries. `assets.js` contains existing fighter sprite definitions. `arena-effects.js` and `original-art.js` provide canvas effects. Offline images loaded successfully in the observed baseline browser run.

## Baseline gaps against redesign

README/header still advertise eleven stages; actual selector has twelve. Rooftop lacks extraction Phase 2. Verse is not flight. Generic phases mostly change attack sets and scenery rather than authored objectives. There is no proposed weapon-slot system, remapping UI, Phase 2 practice selector, seeded attack/loot separation, or named defeat feedback for all generic hits. Current dash grants broad invulnerability; no typed dash-front rule exists. Existing startup and 60Hz fixed-step loop are reusable; scripted restart paths clear hazards and bullets.

## Other executed checks

`node qa/static-checks.mjs`: passed, twelve unique stage IDs, twelve local script references across the preserved entries, 662 existing fighter-frame references. This is reference existence, not visual frame validation.

## Reproduction and pending gates

Run `node qa/baseline-browser.mjs [root]` for preserved baseline. Chrome needs permission to launch a local private browser and use loopback CDP. No server or internet is required. `CHROME_BIN` can override the local Chrome executable. `qa/browser-cdp.mjs` exports the browser helper for the new UI regression.

Run `node qa/shared-rules.mjs [root]` only after runtime and weapon packets are integrated. Its independently authored contract fixtures cover early/active/late/final-tick dash, shield-only separation, swept fronts, reset, phase clearing, practice spawn, and RNG independence. These fixtures are pending, not yet reported passed.

Pending: normal-input base-kit clears, strongest non-dash gap attempts, successful dash launch windows, varied display refresh rendering checks, all power/mode combinations, human cue comprehension, production art readability and offline manifest QA.

## Shared-mechanics interim check

On integrated `5b31a6c` (root UI still uncommitted), eleven independent shared-rule fixtures passed. The final-dash-tick fixture now drives an actual dash through ten steps, rather than relying on a private direction field. This verifies active final tick, not an artificially initialized player. Actual `file://index.html` menu and keyboard smoke passed both phases of Marina and Mudline, R restart, Escape pause and resume with no uncaught exceptions. This is a partial two-stage integration observation, not the four-stage gate. `integration-smoke-partial.json` records the working-tree state and limitations. Use `node qa/ui-browser.mjs [root]` against the final pinned slice again.
