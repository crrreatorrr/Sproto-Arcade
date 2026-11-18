# Sprotel Bitcoin Phase 1

Sprotel is stable identity 14, appended at save index 13 and placed after Last Light Bar in campaign order. It reuses the bar's existing scenery and mechanics family. Existing identities and unlock indices stay unchanged. This change is Phase 1 only; the separate Phase 2 work in the original shared checkout is preserved.

The single-phase encounter uses beer arcs, cocktail arcs, blue marlin lanes and a committed chest-disk laser stream. The laser marks its locked aim for at least 90 frames before firing. Machine Trials demonstrates the complete kit before its first damage window at tick 665, then exposes the drive between attacks. Defeat clears this encounter; retry returns to Phase 1. The external hub does not yet award Tickets for identity 14.

## Native sprite pages

The final user instruction specifies **2×2 pages**. All 44 runtime PNGs are 1024×1024 RGBA, containing four 512×512 cells. Each animation has 16 distinct generated drawings across four consecutive pages. Frames run left-to-right, top-to-bottom, then continue on the next page.

- Six boss animations: idle, walk, beer throw, cocktail launch, marlin launch and disk laser (96 frames).
- Four active projectile animations: beer, cocktail, blue marlin and disk laser (64 frames).
- One additional heavy-marlin asset variant (16 frames).

The total is 176 native frames. No frames are duplicated, interpolated or invented by code. Importing removes the known magenta field, preserves transparent gaps, aligns the page baseline, and applies a shared transform per action. A common body reference preserves scale between actions. Runtime pages use transparent padding and content-hash cache pins.

The user explicitly authorized built-in image generation instead of the repository's earlier Higgsfield-only workflow, and requested parallel animation agents. Higgsfield's occupied Unlimited slot caused no submission or credit spend for this task. Generation prompts, source cells, hashes and registration are retained under `art/reference/20261117-sprotel-bitcoin`. Earlier working layouts are authoring evidence; only the 2×2 runtime pages are enabled.

`art/generated/bosses/14-sprotel-bitcoin/animation-manifest.json` describes every page and source frame. `tools/import-sprotel-assets.py --require-complete` reproduces the PNG pages from the checked-in transparent native frames/source pages. `boss-sheets.js` holds the runtime manifest. Source-hashed collision profiles are in `sprite-hitboxes.js`; projectile cores are opaque across all sixteen frames of their family. The disk muzzle is measured at atlas coordinate `[255,286]`.

## Verification

Run `node qa/run-all.mjs .`, `node tools/check-server-bundle.mjs`, and `python3 tools/verify-boss-assets.py --require-complete`. Sprotel's fixtures cover both engines, stable campaign placement, warnings, the single-phase clear/retry path, and real 2×2 page loading/sampling. Existing thirteen-boss replay goldens remain unchanged.

Browser checks are separate. Controlled fixtures and visual checks do not replace human balance testing.
