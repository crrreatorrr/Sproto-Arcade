# Sproto Arcade · Machine Trials prototype

Open **index.html** directly in a desktop browser. It runs offline with classic scripts and local images; no server, installation or network connection is required. Select an encounter, pilot, seed and full run or practice entry. The original campaign remains available through **legacy.html** and the link above the game.

The twelve encounters have 24 detailed boss phase sheets and 24 matching projectile sheets. Each phase keeps its canonical Sproto visibly inside the vehicle and has three distinct weapon-firing animations. Halloween2008 includes Lantern Harvester and Harvest Express. Open **boss-sheets-review.html** to inspect the complete set; **controlled-stage-review.html** provides paused visual diagnostics. The original encounter movement, attack schedules, trajectories, damage and counter rules are preserved; reviewed collision cores follow the new artwork. See **docs/BOSS-SHEETS.md** for asset and validation details.

## Hub, Relic, Tickets and saved progress (story mode)

The metaverse hub's Bar cabinet now offers **Sproto Arcade** or **Sproto Fighter**. Picking Sproto Arcade opens `/play/sproto-arcade/#t=<ticket>`. `index.html` forwards a ticket to story mode (`legacy.html`), where `hub-link.js` redeems it with the vendored SDK (`vendor/hub-sdk/hub-sdk.iife.js`, `@metaverse/hub-sdk` 0.6.3, see its VENDOR.md). That redemption is the login. Opened directly or from `file://`, the game stays offline and fully playable.

- **Breakwater Coin:** beating the first story boss (Fat Head Dave, Tidebreak Marina) reports `arcade.boss_defeated`, and the server grants the Coin once. God-mode wins count. In the other games it repeats Cone's Tip's award, and in NOBU it unlocks Wizard Hat II. Its hub look is Cone's Tip's gem as a placeholder.
- **Tickets:** each level clear made without god mode earns 20 Tickets (`arcade_clear`), within the hub's session and daily caps. The hub bar under the game shows the balance.
- **Progress and unlocked Sprotos:** `story-progress.js` keeps cleared levels and unlocked Sprotos in localStorage. During a hub session the same save syncs with the hub's cloud save, merging as a union, so neither copy loses progress. Progress is kept per hub account. Offline play before any sign-in goes to the first account that signs in on this browser, and offline play after that tops up the last signed-in account. Ten Sprotos are open from the start. Morelight, The Villain, Jessica and Goldie open by clearing Last Light Bar, Circuit Gate, The Hatchery and Rooftop Breakaway, or by owning a Relic from another hub game. `?unlockAll=1` opens every Sproto for reviews and QA. Levels all stay selectable.
- **Web build and deploy:** `node tools/build-web.mjs [dist]` copies only the files `index.html` and `legacy.html` use, including the approved boss sheets and scrolling level scenery. It then replays both pages against the copy and fails on any missing file. It writes `dist/hub-config.js` with the server key from `NAKAMA_SERVER_KEY`, so the dev key never ships. The committed `hub-config.js` is for local play. CI (`.github/workflows/web-build.yml`) uploads the result as the `web-build` artifact for the hub's `npm run fetch:sproto-arcade` and `deploy-game.sh sproto-arcade`. Add the hub's public client key as the repository variable (or secret) `NAKAMA_SERVER_KEY`. It is the same value as HPOS10I's `HPOS_NAKAMA_SERVER_KEY` variable. Without it, the build plays offline only.

- **Server-side replay:** story mode records each run's inputs and attaches the log to the `arcade.boss_defeated` report, so the hub can replay it with the committed goja bundle `dist/arcade-sim.server.js` (`ArcadeSim.verifyClear`). The log format, the hub's checks, sizes, performance and limitations are in `docs/SERVER-SIM.md`.

Checks: `runtime/fixtures/story-progress.test.js` and the replay goldens (`qa/server-sim-goldens.mjs`) run in `node qa/run-all.mjs .`. After `npm ci`, `node tools/check-server-bundle.mjs` checks the server bundle, and `tools/goja-verify` runs the goldens in goja. `qa/hub-e2e.cjs` is the real end-to-end run against a local hub stack (steps in its header). In the browser, run `node qa/hub-link-browser.mjs` (offline, a stubbed hub session, ticket forwarding), `node qa/lazy-load-browser.mjs` (per-level loading) and `node qa/replay-browser.mjs` (determinism). The plan, its critique and the co-op design are in `docs/HUB-COOP-PLAN.md` and `docs/COOP-DESIGN.md`.

## Controls

- Arrow keys / WASD: move; all four directions in flight.
- Space: jump, then air jump. Six simulation ticks of ledge grace preserve the air jump.
- Shift: dash (11 simulation ticks). Use the remap button to choose another unreserved key.
- X: shield. Shield-symbol pulses require shield; broken-chevron fronts require an active dash.
- C: standard piercing beam; V: standard bouncing ball. Both recharge and remain part of the base kit.
- F: activate equipped pickup power; E: deliberately replace an occupied slot while touching a pickup.
- R: retry immediately. Escape: pause/resume. Losing window focus pauses the game, including during a transformation.

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
