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

## Current focus: core gameplay

Animation production and Higgsfield jobs are stopped. The previous30+animation-per-boss goal is superseded; archived reference material is retained as history. No animation signoff is required to continue gameplay work.

Fast ordinary enemy shots are capped at6pixels per simulation tick; marked dash/shield fronts at8. Phase2 uses the same limits and adds slow, distinct projectiles after the isolated rule lesson. Slow pressure has a long warning, a bounded population, committed trajectories and protected counter/route intervals. Player movement and required gap geometry are preserved.

Open **review-start.html** for direct full-run and Phase2 practice links, projectile shapes and useful feedback. Current evidence is in **qa/PACING.md** and stage timing notes; prior reports in qa/RELEASE.md and docs/GATES.md are historical. Run `node qa/run-all.mjs .` in the git checkout for gameplay fixtures. Actual browser checks distinguish diagnostic arrangements and forced routing from legal-input clears.

Human reaction comfort and final balance remain unvalidated until people play the game. **qa/playtest.html** starts blank; follow **qa/PLAYTEST.md** for reaction, density and route observations. No human results are fabricated.

Developer interface: docs/INTERFACE.md and docs/GAMEPLAY-TUNING-CONTRACT.md. Completed verified work goes to local main and then the verified GitHub main without force. No shared Fighter/dependent repository pull is allowed before Fighter PR #8 finishes. This Arcade pass uses checked-in assets and proceeds without pulling.
