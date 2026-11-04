# Sproto Arcade · Machine Trials prototype

Open **index.html** directly in a desktop browser. It runs offline with classic scripts and local images; no server, installation or network connection is required. Select an encounter, pilot, seed and full run or practice entry. The original campaign remains available through **legacy.html** and the link above the game.

This is the implementation branch for the Bot-ero handoff, starting from main `a25acb1`. It is separate from Sproto Fighter. Existing art and original encounters have been retained. The new encounter machines and effects currently use placeholder canvas art with the existing Sproto sprites.

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

## Verification and art gate

`docs/GATES.md` records integration commits, observed evidence and limitations. `qa/SLICE.md` documents the first four-stage slice. Run `node qa/run-all.mjs .` for dependency-free simulation fixtures; `node qa/ui-browser.mjs .` exercises the actual offline entry using local Chrome. Browser checks intentionally distinguish forced lifecycle routing from earned victories. The original offline entry has its own twelve-stage routing matrix.

Open **art-review.html** for the initial Dave, Big Swole, Goldie and weapon reference boards. These are procedural guides with source records and classic-script manifests. The user requires30 or more distinct animations per boss; planned clip inventories and delivered clip counts remain separate. Frames and duplicate motion do not increase distinct animation coverage. No production Higgsfield animations have been generated. See `docs/ANIMATION-PRODUCTION.md`. Encounter timing, critical poses and hit-area approval are required before generation. Human comprehension tests, final balance, production-art readability and final atlas verification are not implied by simulation passes.

Developer interface: `docs/INTERFACE.md`. Each specialist worked in a separate branch/worktree with exclusive paths; integration was serial. Nothing has been pushed or published from this implementation branch.
