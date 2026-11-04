# Offline guide review

Pinned guide candidate: `2c20398`, clean `arcade-final-check`; gameplay source remains the tested `e1c9dbc` code.

## Loading result: passed

`guides-load.json` records actual offline browser loading of all27 manifest-linked SVGs:15 references and12 gameplay-scale guides. The game registers15 packs. The art-review page's9 inline images also load; its links expose the other guides. No browser errors occurred. Actual production clips and approvals remain zero.

`guides-samples.json` records opening both phase panels of Crown, Verse and Codebreak gameplay-scale SVGs in the actual browser. These have two embedded viewport images each. Captures remain private in ignored `qa/artifacts/`.

## Sample visual alignment result: failed — correction requested

Text, machine silhouettes, pilots and cues render legibly. However, coordinate overlays are displaced from the embedded captures in sampled boards:

- Crown: pilot P marker approximatelyx900 while the actual pilot is approximatelyx1070.
- Verse Phase2: P marker approximatelyx900 while the actual pilot is approximatelyx640.
- Codebreak climb: P marker approximatelyx900 while the actual pilot is approximatelyx1120.
- Codebreak summit: P marker approximatelyx900 while the actual pilot is approximatelyx1090.

Target rectangles are displaced as well. The annotated camera subtraction does not match the visible screenshot frame. A diagnostic-camera/render/screenshot synchronization issue is suspected; this cause is an inference, not a confirmed implementation diagnosis.

The integration and asset owners were notified to synchronize the captured frame, camera, pilot and target snapshot, then regenerate affected guides. These boards can illustrate placeholder appearance, but must not support pivot/hit-area signoff until overlays match the pixels. `guide-browser.mjs` only reports load/DOM success; it intentionally does not call that visual alignment passed.

No gameplay code defect or completed human review is claimed. Production animation remains gated.
