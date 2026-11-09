# Test Lab plan: Sproto Arcade

Status: plan only, nothing built yet. Written 7 November 2026 from a read-only pass over `main` at `cd3e0a1`.
Implementer: Cursor, working on branch `cursor/test-lab`. Read the `AGENTS.md` priority block first: art rules, hitbox scope, server-sim and the Sproto Fighter PR #8 note.

## What the lab is for

A separate page, `lab.html`, that covers the following:
- all 13 bosses (stable IDs 1–13, campaign order 1, 13, 2–12) in both phases;
- every atlas row and frame, every projectile row, missile and pickup;
- collision boxes kept separate from aim/spawn anchors;
- forced attacks, barrages and pickups;
- the 14 playable Sprotos with their poses, plus the flight saucer;
- a live Machine Trials sandbox, and later a Story-mode observer.

It absorbs the old review pages, which are then retired.

## Owner decisions (7 November 2026, the same for every game repo)

These answers came from the owner's Q&A and apply to every game. Repo-specific sections below may add to them, but never relax them.

1. **A separate page.** The lab is its own HTML entry, `lab.html`, at the root of the built site, with its own JS bundle. The game's `index.html` must not import, link to or preload anything from the lab.
   - Measure the game's load before and after: JS bytes, request count and time to first frame. Put both sets of numbers in the PR. The game's numbers must not change.
2. **A hidden URL in production.** The lab ships in the production build at `lab.html`, relative to the game's base path.
   - Nothing in the game links to it.
   - It has `<meta name="robots" content="noindex,nofollow">`.
   - It must pass every existing production check, including banned-string scans. The repo section lists them.
3. **Desktop browser only:** keyboard and mouse. No touch layout.
4. **Automated QA.** Expose a small automation API on `window.testLab`. Never reuse an existing debug handle name. It needs at least:
   - `list()`, which returns every entity with its id, kind and animations/attacks;
   - `select(id)`;
   - `play(clipOrAttack)`;
   - `step(n)`;
   - `state()`, which returns position, velocity, state, clip, frame and HP;
   - `ready`, a promise that resolves when the current view has finished loading and drawing.

   Add a headless script (Playwright or CDP) that opens `lab.html`, visits every entity and every animation, and fails on console errors, failed requests or a blank canvas. Wire it into the repo's checks where browser checks already exist.
5. **Interaction:**
   - **Playback controls:** play, pause, step ±1 frame or tick, speed from 0.1× to 4×, scrub and loop.
   - **Live sandbox:** drive the character with the game's own controls. Show a live readout of position, velocity, facing, state, current animation and frame.
   - **Overlays:** see item 8.
   - **Spawn and fire:** spawn any enemy or boss; force any boss phase or attack; set HP; freeze AI; give any weapon, item or power-up; fire any attack on demand.
6. **Extras:**
   - **Load-time panel.** For each asset show bytes, fetch ms, decode ms and whether it came from cache; show a total per character. Load each character only when it is selected, never the whole roster up front. Use `PerformanceResourceTiming` plus timing around decode.
   - **Side-by-side compare.** Two entities, or two phases or variants of one entity, on one shared clock.
   - **Share links.** Keep all view state in the URL hash, for example `#tab=anim&id=x&clip=y&frame=12`, so a reload restores the exact view. Add a "Save PNG" button.
7. **No sim edits.** The lab is lab-only code. Do not change gameplay or sim files, or anything that changes a sim fingerprint, server bundle, replay golden or gameplay hash.
   - If the lab needs a private value, such as a collision function the game does not export, mirror it in lab code.
   - Add a unit test that fails when the mirror drifts from the source, for example by comparing outputs on sample inputs.
8. **Overlays show the game's truth plus the art's bounds.** Draw exactly what gameplay uses (hit, hurt and collision shapes; anchors; muzzle and spawn points) in one colour, and the sprite or model bounds in another, so mismatches are obvious. Also draw a grid with world coordinates.
9. **Accepted art only.** The roster lists only art the game currently uses. Pending or archived art may appear only in a tab labelled "Archive (not in game)", never in the sandbox.
10. **Isolation.** The lab never writes the player's real save, never takes tab or writer locks, never initialises the hub and never sends scores or tickets. Use an in-memory save with everything unlocked.
11. **Free-form per repo.** Fit the layout to the game. There is no shared kit across repos.
12. **Branch and PR.** Work on `cursor/test-lab`. It was created from the latest `main` with this plan committed. Commit after each phase below, and open a PR into `main` when done. Never push to `main`. Run every repo check and report any you could not run. A different agent reviews the PR.

## Arcade-specific rules

- **Art.** Never enable or present pending, rejected or archived art as delivered. The roster lists only accepted sheets: 26 boss sheets and 26 projectile sheets, the missiles and the pickups. Archived references (`art/rework/**`, the `art-review.html` content) go only in the "Archive (not in game)" tab.
- **Server sim.** Do not edit any `tools/build-server-sim.mjs` SOURCES file: `density-attacks.js`, `phase-powerups.js`, `sprite-hitboxes.js`, `levels.js`, `arena-effects.js`, `codebreak.js`, `game.js`. Editing any of them changes `ARCADE_SIM_VERSION` and the goldens.
- **Mirroring private collision code.** These are private, so mirror them in lab code with a drift test:
  - the Machine Trials `hitbox()` closure (`runtime/core/world.js:9-23`);
  - Story mode's `combatHitbox` / `enemyShotContact` (`game.js:623-656`).
- **Deployment.** `tools/build-web.mjs:22` ships only `PAGES=['index.html','legacy.html']`. Add `'lab.html'` there so the lab ships at its hidden URL. Make sure no game page gains a new script tag.
- **Shared repos.** Before pulling shared repos, re-check the Sproto Fighter PR #8 rule in `AGENTS.md`.

## Facts this plan relies on

- **Two games share the art and `sprite-hitboxes.js`.**
  - Machine Trials: `index.html`, driven by `rework.js`, `runtime/core/world.js` and `stages/NN-*/stage.js`. It is modular, and `ArcadeApp.world` is exposed.
  - Story campaign: `legacy.html`, a single 2493-line `game.js`. It grabs DOM ids and auto-runs `loadInitialLevel()`, so it cannot be embedded cleanly.
- **Tooling.** No bundler. Classic `<script>` tags with hand-maintained `?v=` cache-busters.
- **Boss atlases.** Defined in `boss-sheets.js`.
  - Each is a 2048² 4×4 grid of 512 px cells at 10 fps. Row 0 is idle; rows 1–3 are attacks A/B/C (anticipation → lock → fire → recoil).
  - Projectile sheets have the rows attackA, attackB, attackC, heavy.
  - Each phase has `bounds`, `rowBounds`, `legacyOffset/Scale` and `modernBox`.
  - API: `attackPose`, `barragePose`, `legacyPose`, `projectileSelection` and `preloadStage(id)`.
  - Each sheet decodes to about 16.7 MB, so **load per boss on demand, never all 52 at once.**
- **Other art.**
  - Missiles: `art/generated/missiles/NN/missile.png` (4×1).
  - Pickups: `art/generated/pickups/items.png` (heart, shield pickup, shield aura, absorb flash).
  - Players: 14 playable Sprotos (`game.js:62-77`) with poses in `fighters/poses/<id>/` (guard, walk, dash, airRise/airFall, crouch, cast, hit 24, power 29–31).
  - Flight saucer: green and red lasers plus a beach ball (`game.js:1886-1970`).
- **Hitboxes.** `sprite-hitboxes.js` holds `stages[1..13][0|1]` with targets, `boss.damage`/`contact`, `projectiles['key@row']` (crop/core/visualBox) and beams. Profiles never alter anchors.
- **Attacks.**
  - Machine Trials hazards: `w.hazard({source,rule,windup,active,…})`.
  - Barrages: `density-attacks.js` `plan()`, from tick 420.
  - Pickups: `phase-powerups.js` (TTL 240 ticks, shield 600 ticks or one hit, mandatory dash/shield gates kept).
  - Story moves: `game.js:95-132`. `levels.js` holds `SIGNATURE_PATTERNS`, `FLIGHT_PATTERNS` and `BOSS_SECTION_ATTACKS`.
- **Non-boss entities.** Moonkeep dragons, Verse drones, story flight mechas, Goldie chase attacks, and stage targets (vents, valves, neck joints).
- **Existing review pages to absorb.**
  - `boss-sheets-review.html`: grid of boss × phase × row. Its titles list has only 12 names, so Redkev shows as "undefined".
  - `controlled-stage-review.html` + `.js`: pauses the real renderer and seeks `phase.update` in ±60-tick steps.
  - `review-start.html`: stage links. Redkev is missing.
  - `art-review.html`: archived SVG guides.
  - `art/rework/review/index.html`: archived keyframes.
- **Story observation precedent.** `boss-presentation-hooks.js` wraps `fire`/`updateBoss` from outside the sim.
- **Debug hooks.** `index.html?stage=&phase=`, `legacy.html?level=`, `?unlockAll=1`, `?assetAudit`, and story god mode (double-tap 9, then Z / I).

## Owner decisions applied here

- **Both modes, Machine Trials first.** Phase A is the sprite, hitbox and attack lab plus a live Machine Trials sandbox. Phase B is the Story observer: `legacy.html?level=N` in a same-origin iframe, observed with the presentation-hooks pattern. It reads boss state, projectiles and the player box, draws overlays on a canvas over the iframe, and offers pause/step through the page's existing god-mode and pause paths. It never edits `game.js`.
- **Absorb and retire the old pages.** Move their features into lab tabs, fix the stale 12-boss lists (Redkev becomes 13), then delete:
  - `boss-sheets-review.html`
  - `controlled-stage-review.html` and `.js`
  - `review-start.html`
  - `art-review.html`

  Archived art viewing moves to the Archive tab. **Before deleting**, grep `qa/`, `tools/`, `docs/` and `README.md` for references and update them. `qa/static-checks.mjs` and the browser checks may reference these pages. Keep `qa/playtest.html` (the observer form; it is not a viewer).
- **Overlays.**
  - Game truth: the boss `damage` and `contact` boxes, projectile `core` rects, beams, dash and shield fronts, barrage `damageRect`, the player box (32×52 standing, 30 crouching), and the swept AABB trail.
  - Art bounds: `visualBox`/crop/`bounds`.
  - **Aim and spawn anchors** are drawn as separate markers, because `AGENTS.md` requires collision to stay separate from anchors.
- **Boss control.** Pick a boss and phase, seek to any authored tick, force attack A/B/C (hazard source), trigger the density barrage now, spawn the heart or shield pickup, set HP, freeze, and use invulnerable practice.

## Tabs

1. **Bosses**: boss × phase grid, ordered by campaign order with the stable ID shown. Click to open a single view with the row picker, frame stepping at 10 fps, pose selector previews (`attackPose`, `barragePose`, `legacyPose`) and overlays.
2. **Projectiles**: per boss and phase, each projectile row, missile and beam, showing its crop/core/visualBox, facing and kind.
3. **Pickups**: heart, shield, aura and absorb flash, with the TTL and shield-duration timers simulated.
4. **Players**: the 14 Sprotos with every pose and walk cycle, plus the flight saucer and its weapons.
5. **Machine Trials sandbox**: absorbs controlled-stage-review. It loads the real stage, then offers pause, step ±1/±60 ticks, seek, force attack, barrage now, pickups, invulnerability, a teleport player, a live readout and overlays.
6. **Story observer** (phase B): iframe plus overlays and the signal log.
7. **Stage list**: absorbs review-start. All 13 stages, linking into the sandbox and into the game pages.
8. **Compare**: P1 vs P2 of the same boss, or Redkev vs Marina, side by side.
9. **Loading**: the load-time panel, per boss sheet, projectile sheet and missile.
10. **Archive (not in game)**: absorbs art-review and the art/rework review. Each item is clearly labelled.

## Files

- **Add:**
  - `lab.html`
  - `lab/*.js` (classic scripts)
  - `qa/lab.test.cjs`: all 13×2 stages covered; every accepted sheet referenced; hitbox mirror matches the source on sample inputs; hash round-trip
  - `qa/lab-browser.mjs`: CDP smoke, same style as the other `qa/*-browser.mjs`
- **Edit:**
  - `tools/build-web.mjs` (PAGES)
  - `qa/run-all.mjs` (add `lab.test.cjs`)
  - `qa/static-checks.mjs` (check the lab's script refs)
  - `README.md`, `docs/LOCAL-REVIEW.md` (point to the lab)
- **Delete:** the four retired review pages listed above, and `controlled-stage-review.js`.
- **Do not touch:** the server-sim SOURCES files, `stages/**`, `runtime/core/**`, `rework.js`, `index.html`, `legacy.html`, `dist/`.

## Phases

1. Skeleton: `lab.html`, the shared loader with per-boss lazy loading, the hash state and the load panel. Record game-page numbers before and after.
2. The Bosses, Projectiles, Pickups and Players tabs, with the hitbox mirror and drift test.
3. The Machine Trials sandbox, migrating the controlled-stage features.
4. The Stage list, Compare and Archive tabs. Retire the old pages and update references.
5. The Story observer.
6. `window.testLab`, the browser smoke test, docs, and the PR.

## Acceptance

- `node qa/run-all.mjs .` passes.
- The goldens and `ARCADE_SIM_VERSION` are unchanged.
- The lab browser smoke visits all 13 bosses × 2 phases × 4 rows and every projectile row with no errors.
- Redkev appears everywhere as boss 13.
- The lab is deployed by `build-web.mjs`, and the game pages are byte-identical.
- No retired page is still referenced anywhere.

## Cursor prompt

The owner pastes this into Cursor:

```text
You are working in the Sproto Arcade repo (crrreatorrr/Sproto-Arcade). Check out the existing branch `cursor/test-lab`. It was created from the latest `main` and already contains `docs/test-lab-plan.md`.

1. Read `AGENTS.md` (the whole priority block), `README.md` and `docs/SERVER-SIM.md`, then read `docs/test-lab-plan.md` in full. That plan is the spec. It records the owner's answers, so follow it exactly and don't re-ask anything it already settles.
2. Build the Test Lab phase by phase as the plan lays out, and commit after each phase. The lab is a separate, unlinked `lab.html` page with `noindex` and its own bundle. It loads each character only when that character is selected. It ships hidden in the production build.
3. Repo-specific hard rules:
   - Do not edit any server-sim SOURCES file (`density-attacks.js`, `phase-powerups.js`, `sprite-hitboxes.js`, `levels.js`, `arena-effects.js`, `codebreak.js`, `game.js`). Mirror the private `hitbox()` / `combatHitbox` code in lab code, with a drift test.
   - Show only accepted art. Archived or pending art may appear only in the "Archive (not in game)" tab. Redkev is boss 13 everywhere, and campaign order is 1, 13, 2–12.
   - Draw collision boxes separately from aim and spawn anchors. Load one boss sheet set at a time, never all 52.
   - Build Machine Trials first and the Story observer (iframe) second. Absorb the old review pages, then delete them only after every reference in `qa/`, `tools/`, `docs/` and `README.md` is updated. Add `lab.html` to `tools/build-web.mjs` PAGES. Re-check the Sproto Fighter PR #8 rule before pulling any shared repo.
4. Never write the real save, never take tab or writer locks, and never initialise the hub. Use `window.testLab` as the automation handle.
5. When done, run: `node qa/run-all.mjs .` and the new `qa/lab-browser.mjs` (confirm the goldens and `ARCADE_SIM_VERSION` are unchanged). Then open a PR from `cursor/test-lab` into `main` titled "Add Test Lab (lab.html)". In the PR, report:
   - the game page's load numbers (JS bytes, request count, time to first frame) before and after;
   - the result of every check, and any check you could not run, with the reason;
   - every place you mirrored private code, and the drift test that guards it.
6. If part of the plan can only be done by breaking one of these rules, stop and ask me rather than editing a protected file.
```
