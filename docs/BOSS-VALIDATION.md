# Boss sprite release validation

The reviewed production inventory contains **13 canonical boss identities, 26 boss phase atlases and 26 phase projectile atlases**: 52 phase atlas files. It also includes 13 custom four-frame barrage missile strips and one four-row heart/shield pickup atlas. Both games use the source-hashed numeric geometry table `sprite-hitboxes-v1-20261106-reviewed`. Required art decoding completes before an encounter starts; missing required rendering code fails closed when fitted geometry is enabled.

## Final identity and phase inventory

Original stage IDs remain stable. Redkev is identity13, placed between original stages01 and02 in campaign order. Its two red spaceships use the canonical Fighter `guest09` pilot and red ammunition. All 16 frames of each accepted phase retain the visible canonical pilot and genuine generated weapon-firing effects.

Original stage04 Ranch P1 receives the former Neon P1 orange crane vehicle and salvage ammunition. Only the documented cockpit region receives canonical Halloween2008 artwork; the original genuine weapon frames are retained. Ranch P2 remains Harvest Express. Original stage05 Neon P1 receives the new teal/cyan Collector hover-rig, with genuine cannon, capacitor and hologram firing rows. Its ammunition reuses the accepted same-boss Neon P2 data motifs. Neon P2 remains unchanged. Source archives, cockpit masks, frame selections and final hashes are recorded beside the installed files and in the replacement archive under `art/reference/`.

The additional barrage strips use each boss's source theme, including Halloween pumpkins and Redkev red rockets. Original stages11/12 retain their native diagonal source pixels and use reviewed numeric rotation metadata to align flight; their oriented bounds and cores are verified after that transform. The pickup atlas contains four native frames each for the heart, shield pickup, active hollow shield and shield-hit effect.

## Gameplay scope

The earlier geometry-only release preserved modern `enter`/`update` bodies against `ad1e864`. That historical byte-identity result is not a current gameplay-invariance claim. The November6 follow-up explicitly adds UFO flight and vertical dragon movement to original Moonkeep7, slow dense avoidable themed missile barrages, current-phase death retries, and phase heart/shield pickups. Redkev clones original Marina mechanics/backgrounds. Existing authored attacks and required dash/shield gates remain preserved outside these authorized additions.

Boss body and weak-point rectangles fit the actual packed artwork and its rounded contain transform. Collision geometry remains separate from aiming and spawning anchors. Ordinary projectile profiles use stable reviewed solid-core rectangles per weapon row; common atlas bounds preserve differing weapon sizes. Direction, source rotation and long-beam tiling use the renderer's numeric fit helpers. Defensive fronts retain their authored span, and environment carrier debris retains its original collision shape.

## Release checks and evidence

Run the complete checks against the final installed candidate:

```bash
python3 tools/verify-boss-assets.py --require-complete
python3 tools/verify-boss-hitboxes.py --require-complete
python3 tools/verify-density-assets.py --require-complete
node qa/boss-sheets.test.cjs
node qa/boss-weapon-variants.cjs
node qa/run-all.mjs .
```

The phase verifiers must cover all 52 source-hashed slots; the density verifier must cover all 13 missile strips and the pickup atlas. Checks include image layout, nonempty padded cells, alpha bounds, source hashes, provenance, measured cores and runtime configuration. Packing must preserve complete source components, native weapon motion and the canonical pilot; rejected or clipped attempts remain archived and disabled.

Source/bundle replay parity, snapshot restoration, legal-input production clears, preload failure/retry behavior, enabled/disabled geometry fixtures and browser checks remain separate release requirements. Historical forced-disabled replay fixtures are retained under `qa/golden-disabled/`; final active-geometry fixtures live under `qa/golden/`. Controlled diagnostic renders and scripted clears must be labeled accurately. They do not establish human playtesting or reaction comfort.

This document defines the final inventory and validation requirements. Actual command outcomes belong to their recorded reports and CI run for the candidate being released; historical counts or earlier passing runs do not certify a later candidate.
