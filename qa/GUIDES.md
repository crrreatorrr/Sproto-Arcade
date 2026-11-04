# Offline guide review

Latest verified guide candidate: **`4887031`, clean `arcade-final-check`**. Loading passed; sampled visual overlay alignment passed. Gameplay source files are unchanged from the tested `e1c9dbc` candidate (git diff across entries, runtime and stages is empty).

## Current executed evidence

`guides-corrected-load.json`: actual offline browser loaded all27 manifest-linked SVGs—15 references and12 gameplay-scale guides. The game registers15 packs. The review page's9 inline images also load, and its links expose the additional boards. No browser errors occurred. Actual production clips and approvals remain zero.

`guides-corrected-samples.json`: opened both phase panels of Crown, Verse and Codebreak gameplay-scale SVGs. Each contains two embedded viewport images. Six private screenshots were inspected at native guide scale:

- Crown's pilot marker aligns with Alpha's feet, and both Phase2 target rectangles align with the near/far cores.
- Verse's pilot marker aligns with Bot Sales; its Phase2 target overlay aligns with the right module shown in the same captured tick.
- Codebreak's climb and summit markers align with the Sheriff in the cab; the summit target overlay matches the side vent.

The mint target borders and pilot guides do not obscure the sampled signature cues or operator silhouettes. Captions and critical-pose notes remain readable. These are diagnostic camera-framed views, not normal-route or earned-clear screenshots.

The corrected producer captures native canvas pixels synchronously with the tracked pose/camera/target snapshot. The sampled mismatch described below is resolved. This is a technical guide-alignment verdict, **not human timing, critical-pose, collision fairness or production-art approval**. Only the six named panels received this independent visual sample; all27 assets received browser loading checks.

Screenshots remain private in ignored `qa/artifacts/` and were not saved to Library.

## Previous defect and resolution

At historical candidate `2c20398`, all27 assets loaded, but sampled overlays were displaced from their screenshots. Crown's P marker was approximatelyx900 versus actual pilotx1070; Verse Phase2x900 versus640; Codebreak climbx900 versus1120; summitx900 versus1090. Target boxes were displaced as well. Loading-only evidence remains in `guides-load.json` and `guides-samples.json` for that historical pin.

The integration and asset owners replaced asynchronous screenshot pairing with an atomic canvas/frame snapshot and regenerated the affected guides. Fresh browser inspection at4887031 confirms the sampled anchors and pixels now match. No coordinates were guessed or shifted merely to conceal the mismatch.

No human execution occurred. The separate blank eight-person worksheet is in `playtest.html`; its form-only check records **zero actual participants**. Production animation remains gated, with388planned requests and0actual clips.
