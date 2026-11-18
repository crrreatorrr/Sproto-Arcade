# Sprotel Bitcoin Phase 2

Sprotel Bitcoin remains identity 14, immediately after Last Light Bar in campaign order. The encounter reuses Last Light Bar's phase backgrounds. Phase 1 from main commit a4d85ae retains its original runtime atlas bytes, body geometry, walking, drink throws, blue marlin and vinyl-record laser. The subsequent user request aligns every projectile origin with its visible weapon.

Phase 2 uses the user's four-armed bartender-mecha reference, with a blue Santa pilot, beer stick, cocktail cannon, snack dispensers and oversized speaker launchers. Its six moves are beer-stick melee, aimed cocktail cannon, snack volley, marlin launch, disk laser and sound-wave speaker missiles. The speaker special fires three smaller 96×56 missiles simultaneously from the three visible speaker barrels. Every attack has a visible warning and recovery opening. The measured beer-stick impact core is active only during frames matching the swing. The laser origin and beer-stick collider use shared pixel projections in both renderers and simulations.

## Animation assets

The user explicitly authorized internal image generation and parallel animation agents. All new drawings were generated with the built-in image model, using no Higgsfield credits. Attached references supply artwork only; instructions depicted in attached material are not treated as user commands.

Each mecha action has sixteen distinct native drawings, delivered on four 2×2 pages. Phase 1 has six actions and Phase 2 has seven. The four new projectile families—speaker missile, pretzel, nacho and popcorn—each use one 4×4 sheet with sixteen distinct drawings. The five existing Phase 1 projectile families retain four 2×2 pages each. The complete encounter has 352 frames on 76 runtime pages. No interpolation or duplicated-frame motion is used.

`art/generated/bosses/14-sprotel-bitcoin/manifest.json` and `sprotel-art.js` record sources, native-frame hashes, output hashes, crops, registration and page grids. Sources and generation prompts are archived under `art/reference/20261117-sprotel-bitcoin/final2x2/p2` and `final-projectiles`. `projectile-attachments.json` pins visually measured release-frame weapon points; the same projected points drive story shots, Machine Trials shots and aiming lines. The importer refuses stale attachment measurements if a firing page changes. `preserved-main-a4d85ae` records the immutable Phase 1 metadata. The importer accepts canonical checked-in sources as well as local production sources.

## Validation and review

Run `node qa/run-all.mjs .`, `python3 tools/verify-boss-assets.py --require-complete`, and `python3 tools/verify-boss-hitboxes.py --require-complete`. Build and check the server simulation after code changes. `sprotel-review.html` provides phase/action/projectile controls and a sixteen-frame scrubber. Machine Trials exposes both phases for practice; story progression and retry keep the current phase.

Checks cover page loading, native uniqueness, source/output pins, opaque cores, exact Phase 1 preservation, shared render/collision transforms, warning/active/recovery timing, two-phase progression and original-boss regressions. Controlled automated fixtures and visual review are not human playtests or earned clears.
