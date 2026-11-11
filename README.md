# Sproto Arcade · Machine Trials prototype

Open **index.html** directly in a desktop browser. It runs offline with classic scripts and local images; no server, installation or network connection is required. Select an encounter, pilot, seed and full run or practice entry. The original campaign remains available through **legacy.html** and the link above the game.

The twelve encounters have 24 detailed boss phase sheets and 24 matching projectile sheets. Each phase keeps its canonical Sproto visibly inside the vehicle and has three distinct weapon-firing animations. Halloween2008 includes Lantern Harvester and Harvest Express. Open **boss-sheets-review.html** to inspect the complete set; **controlled-stage-review.html** provides paused visual diagnostics. The original encounter movement, attack schedules, trajectories, damage and counter rules are preserved; reviewed collision cores follow the new artwork. See **docs/BOSS-SHEETS.md** for asset and validation details.

## Hub, Relic, Tickets and saved progress (story mode)

The metaverse hub's Bar cabinet now offers **Sproto Arcade** or **Sproto Fighter**. Picking Sproto Arcade opens `/play/sproto-arcade/#t=<ticket>`. `index.html` forwards a ticket to story mode (`legacy.html`), where `hub-link.js` redeems it with the vendored SDK (`vendor/hub-sdk/hub-sdk.iife.js`, `@metaverse/hub-sdk` 0.6.4, see its VENDOR.md). That redemption is the login. Opened directly or from `file://`, the game stays offline and fully playable.

- **Breakwater Coin:** every win against the first story boss (Fat Head Dave, Tidebreak Marina) during a hub session reports `arcade.boss_defeated`. Repeat wins, Phase 2 retries and god-mode wins all count. The server grants one Coin per account. In the other games it repeats Cone's Tip's award, and in NOBU it unlocks Wizard Hat II. Its hub look is Cone's Tip's gem as a placeholder.
- **Tickets:** each full level clear made without god mode earns 20 Tickets (`arcade_clear`), within the hub's session and daily caps. The hub bar under the game shows the balance.
- **Progress and unlocked Sprotos:** `story-progress.js` keeps cleared levels and unlocked Sprotos in localStorage. During a hub session the same save syncs with the hub's cloud save, merging as a union, so neither copy loses progress. Progress is kept per hub account. Offline play before any sign-in goes to the first account that signs in on this browser, and offline play after that tops up the last signed-in account. Ten Sprotos are open from the start. Morelight, The Villain, Jessica and Goldie open by clearing Last Light Bar, Circuit Gate, The Hatchery and Rooftop Breakaway, or by owning a Relic from another hub game. `?unlockAll=1` opens every Sproto for reviews and QA. Levels all stay selectable.
- **Web build and deploy:** `node tools/build-web.mjs [dist]` copies only the files `index.html` and `legacy.html` use, including the approved boss sheets and scrolling level scenery. It then replays both pages against the copy and fails on any missing file. It writes `dist/hub-config.js` with the server key from `NAKAMA_SERVER_KEY`, so the dev key never ships. The committed `hub-config.js` is for local play. CI (`.github/workflows/web-build.yml`) uploads the result as the `web-build` artifact for the hub's `npm run fetch:sproto-arcade` and `deploy-game.sh sproto-arcade`. Add the hub's public client key as the repository variable (or secret) `NAKAMA_SERVER_KEY`. It is the same value as HPOS10I's `HPOS_NAKAMA_SERVER_KEY` variable. Without it, the build plays offline only.

- **Server-side replay:** story mode records each run's inputs and attaches the log to the `arcade.boss_defeated` report, so the hub can replay it with the committed goja bundle `dist/arcade-sim.server.js` (`ArcadeSim.verifyClear`). The log format, the hub's checks, sizes, performance and limitations are in `docs/SERVER-SIM.md`.

Checks: `runtime/fixtures/story-progress.test.js` and the replay goldens (`qa/server-sim-goldens.mjs`) run in `node qa/run-all.mjs .`. After `npm ci`, `node tools/check-server-bundle.mjs` checks the server bundle, and `tools/goja-verify` runs the goldens in goja. `qa/hub-e2e.cjs` is the real end-to-end run against a local hub stack (steps in its header). In the browser, run `node qa/hub-link-browser.mjs` (offline, a stubbed hub session, ticket forwarding), `node qa/lazy-load-browser.mjs` (per-level loading) and `node qa/replay-browser.mjs` (determinism). The plan, its critique and the co-op design are in `docs/HUB-COOP-PLAN.md` and `docs/COOP-DESIGN.md`.

## Story mode: cues, results and sound

- **Cue line.** The line under the boss bar names each attack during its tell and says what the two mandatory mechanics need: crouch or shield for the ceiling sweep, shield for a shield pulse. During a missile barrage it says that guns are offline and what the next row asks for (crouch, jump, short hop, or the gap). A one-screen controls card is shown before the first level in a browser, and again on the pause screen.
- **Knockout screen.** It says what ended the run, the phase, section and boss health, one tip for that cause, and what Retry restarts. After a phase-2 knockout it states the checkpoint rule: the clear saves progress but earns no Tickets.
- **Results and ranks.** A clear shows time, hits taken, hearts left and a rank. S: no hits, at or under par. A: at most two hits, within 1.15 x par. B: any other full run. C: a clear after a phase-2 checkpoint retry. Par is the golden bot's clear time x 1.25 (`story-par.js`, written by `node tools/build-story-par.mjs` whenever the goldens change). The best full run per level (rank, then time) is kept in the story save and shown in the level select with the number of levels cleared. Checkpoint and god-mode clears never set a best.
- **Sound.** `story-audio.js` synthesises every effect and four music tracks, each with a phase-two form; there are no audio files. Nothing plays before the first click. The pause screen has volume and mute, saved in localStorage.
- **Frame cost.** Projectile and missile outlines are baked once per sprite frame and blitted (`boss-sheets.js`); `qa/FILTER-BUDGET.md` has the before and after figures, measured in headless Chromium only.

Browser checks for these (Playwright's Chromium, not part of `qa/run-all.mjs`): `node qa/story-hud-browser.mjs .`, `node qa/story-results-browser.mjs .` and `node qa/filter-budget-browser.mjs .`.

## Controls

Both pages share one layout. Keyboard, mouse and a controller all work at the same time; the on-screen prompts (the help line under the game, story mode's weapon bar and Machine Trials' HUD and cues) follow whichever was used last.

| Action | Keyboard | Controller |
| --- | --- | --- |
| Move; fly in all directions in flight levels | Arrow keys or WASD | Left stick or D-pad |
| Jump, then air jump | Space (story mode: also ↑ / W) | A (story mode: also D-pad up) |
| Crouch (story mode, on foot) | ↓ / S | D-pad down, or the stick held straight down |
| Dash (11 simulation ticks) | Shift (Machine Trials: or the key chosen with the remap button) | B or RT |
| Shield | X | X or LT |
| C special: tracking missile / red laser (story), piercing beam (Trials) | C | Y |
| V special: tracking bomb / beach ball (story), bouncing ball (Trials) | V | RB |
| Pickup power (Machine Trials) | F | LB |
| Replace the held pickup while touching one (Machine Trials) | E | View |
| Retry | R: Machine Trials retries at once; story mode after a knockout | A on the game-over Retry button |
| Pause / resume | Escape | Start (B also resumes) |
| Menus and overlays | Arrows or W/S move; A/D or ←/→ change a selector; Enter or Space confirms; Escape closes pause; Tab still works | D-pad or left stick moves; A confirms; B closes pause; Start presses the main button |
| Return to hub (story mode in a hub session) | Click Return to hub, or Tab to it | Start, D-pad down, A |

Mechanics: six simulation ticks of ledge grace preserve the air jump. Shield-symbol pulses require shield; broken-chevron fronts require an active dash. C and V recharge and remain part of the base kit. Losing window focus pauses the game, including during a transformation.

### Controller

Plug in any standard-mapping controller (Xbox, PlayStation, Switch Pro and most USB pads, by button position) and press a button; there is no setup. `gamepad.js` turns it into the same key presses the keyboard sends, so movement, timing, damage, replays and the dash/shield rules are identical.

Why this layout: the right thumb lives on A for jumping, so the two reactive counters are also on the triggers (RT dash, LT shield) and can be pressed while jumping. Shield is X on both devices, so Machine Trials' "◇ X" shield cue is right for either. B as dash suits players who roll the thumb from A. Specials recharge and are fired when ready, so they go on Y and RB; the rarer pickup actions sit on LB and View. On foot in story mode the stick ignores up (A jumps) and crouch needs a near-vertical push, so running diagonally never jumps or crouches by accident; flight is full 8-way. Instant retry (R) stays off the controller during play because one stray press would restart the run; the game-over screen's Retry button is one A press.

Following the hub's controller convention: the pad is read every frame, it may be plugged in or out at any time, and buttons already held when it appears (such as the A that chose this game in the hub) or held across a screen change are ignored until released. Stick deadzone is 0.2, radial and rescaled; menu repeat is 350 ms then 120 ms. Home is never bound.

### Keyboard

The keyboard layout matches the hub and the other Sproto games: WASD and arrows both move, Space jumps, Shift dashes, Escape pauses and closes the pause screen. Menus also take arrows/WASD and Enter (added with the controller work, through the same focus code), so no screen needs Tab or the mouse. In a typed field (the seed) the arrows keep their usual meaning. Story mode's prompts now list WASD, R (retry after a knockout) and the menu keys.

Tests: `runtime/fixtures/gamepad.test.js` (mapping logic with fake pads, keyboard menu keys) and `qa/gamepad-mapping.test.cjs` (every button pushed through game.js's and rework.js's own key readers, prompts and cache hashes), both in `node qa/run-all.mjs .`; the browser smoke is `node qa/gamepad-browser.mjs` (stubbed `navigator.getGamepads`). Not yet tried with a real controller in hand.

Autofire provides baseline pressure. Prism Rail has two piercing shots, Ricochet Mine two bouncing blasts, and Echo Decoy redirects one explicitly eligible aimed volley. Fixed attacks, shield pulses and mandatory dash fronts ignore decoys. Retry and practice reset the pickup slot; phase transitions retain remaining charges.

Practice and full-run records are separate; practice records are also separated by phase and authored sector. Completing a full encounter offers the next registered encounter. Seeds make simulation and drop order reproducible, with independent attack and loot random streams.

## Current focus: boss art and gameplay preservation

Boss art covers all twelve encounters in both phases. Each sheet preserves the checked-in level pilot inside the vehicle and provides idle plus three weapon-firing loops with phase-specific projectile art. See **docs/BOSS-SHEETS.md** for atlas registration, review and readiness requirements. The previous30+animation-per-boss goal is superseded. Attack timing, movement, damage, trajectories and counter rules remain unchanged; reviewed boss and projectile hitboxes may follow the new silhouettes.

Fast ordinary enemy shots are capped at6pixels per simulation tick; marked dash/shield fronts at8. Phase2 uses the same limits and adds slow, distinct projectiles after the isolated rule lesson. Slow pressure has a long warning, a bounded population, committed trajectories and protected counter/route intervals. Player movement and required gap geometry are preserved.

Open **review-start.html** for direct full-run and Phase2 practice links, projectile shapes and useful feedback. Current evidence is in **qa/PACING.md** and stage timing notes; prior reports in qa/RELEASE.md and docs/GATES.md are historical. Run `node qa/run-all.mjs .` in the git checkout for gameplay fixtures. Actual browser checks distinguish diagnostic arrangements and forced routing from legal-input clears.

Human reaction comfort and final balance remain unvalidated until people play the game. **qa/playtest.html** starts blank; follow **qa/PLAYTEST.md** for reaction, density and route observations. No human results are fabricated.

Developer interface: docs/INTERFACE.md and docs/GAMEPLAY-TUNING-CONTRACT.md. Completed verified work goes to local main and then the verified GitHub main without force. No shared Fighter/dependent repository pull is allowed before Fighter PR #8 finishes. This Arcade pass uses checked-in assets and proceeds without pulling.

## Very slow Phase2 missiles

Every boss's Phase2 now requests a guarded missile. It moves at1.1pixels/tick (66px/second at the fixed60Hz simulation), locks its original path and shows at least90ticks of warning. There is at most one live missile and at most two total background-pressure shots, with an eight-second minimum emission cooldown. Required dash/shield fronts and authored route/setup guards clear or defer missiles. A normal movement/jump or flight route can avoid an isolated missile without spending a dash.

The missile's first eligible introduction is after180ticks, separate from the ordinary background-pressure lesson at600ticks. Efficient clears may finish while a missile is warning; this is reported rather than forcing longer boss HP. Phase-specific projectile atlases can replace the static fallback through the shared boss presentation adapter without changing missile timing or trajectories.
