# Four-stage prototype gate

Pinned gameplay build: `156ee3dedd9950160b3cba2b94686ab836578bc5`.

**Verdict:** the placeholder slice passes its automated integration and offline entry checks. This supports starting the remaining campaign packets. Human comprehension, final balance and production animation approval remain open gates.

## Executed evidence

- `slice-browser.json`: actual offline `index.html` in local Chrome, all eight normal-menu entries (four full starts and four Phase 2 practice starts), real Shift/X key dispatch with observed activation, explicit Phase 1→2 routing with stale-hazard clearing, explicit named loss then real R retry to 5 HP/base kit/correct phase, Escape pause with frozen ticks and Resume. Four stages registered, zero uncaught exceptions and zero browser error logs. The gameplay tree was clean for this run. Forced phase/loss routing is explicitly separate from earned victory.
- `slice-regression.json`: eleven commands, zero failures. This includes nineteen runtime fixtures, ten weapon fixtures, nine weapon/runtime fixtures, fourteen independent shared-rule fixtures, stage authoring and scripted base-kit controllers, and offline reference checks. Only `docs/GATES.md` changed during this run; gameplay matched the pin.
- Baseline compatibility retained: `baseline-routing.json` records all twelve legacy entries via actual `file://legacy.html` at the preserved baseline.

| Stage | Scripted base-kit result | Other coverage |
|---|---|---|
| Marina | Full run 1900 ticks; Phase 2 practice 1198 ticks; HP5, three required dash counters, no damage | Wake/vent and pressure/valve objectives; same inputs reproducible |
| Mudline | Upper route 1594 ticks, lower route 1867 ticks, no damage, two marked-front counters each | Both C beam and V bounce paths, three bounced lower-intake hits |
| Rooftop | Phase 1 transition 1937 ticks; extraction clear 1597 ticks, HP5 each | Mandatory gap: zero no-dash landings across 990 sampled launch/double-jump combinations; broad sampled dash windows; both projectile directions; optional cache and sector snapshots |
| Codebreak | Scripted normal start-to-clear at seed37, HP5, mandatory summit dash | Eighteen climb ledges/four recovery ledges, scanner gate, shield-only rejection, sector restart |

Rooftop phases were tested independently by its controller. A continuous human full run was not observed. Gap sampling is meaningful finite coverage, not an exhaustive proof of all conceivable inputs. Stage controllers use standard inputs and no pickup powers for their clear checks; authoring fixtures separately invoke callbacks and are not completion evidence.

## Visual inspection

Five private screenshots captured and inspected at 1440×1150: Marina pressure, Mudline shutters, Rooftop extraction, Codebreak climb and summit. HUD, player, chevrons and silhouettes fit the viewport. Screenshots remain in ignored `qa/artifacts/` and were not saved to Library.

Presentation defects reported to the integration owner: Codebreak's separate Sheriff sprite is not anchored in the cockpit; Rooftop still uses a yellow face placeholder pending its sprite patch; Marina valve and Mudline latch labels duplicate custom stage labels; the cue strip partly overlaps the upper-latch label. These are prototype issues to resolve before production art pose/timing signoff, and are not concealed by the automated verdict.

## Reproduction

- `node qa/run-all.mjs [repo-root]` discovers runtime/stage `.cjs` and test JavaScript, routes fixture root/runtime arguments explicitly, and runs shared/static QA. It prints a structured build-pinned report and exits nonzero on failure. Unrecognized positional arguments fail safely for review.
- `node qa/ui-browser.mjs [repo-root]` runs actual new offline entry and keyboard routing; `QA_CAPTURE=/absolute/private/path.png` optionally captures the final view.
- `node qa/baseline-browser.mjs [repo-root]` tests the original entry.
- `node qa/capture-slice.mjs [repo-root] [private-output-directory]` captures the five slice views for internal inspection.

All browser tools use an isolated local Chrome profile, no internet, no web server and no external package. Local Chrome launch and loopback CDP may require executor permission. Browser profiles are removed after each run.

## Remaining validation

Eight remaining encounters, full campaign ordering, all selectable pilots, every eligible power/mode pairing, refresh-rate equivalence, normal-input browser clears, remapped control persistence, human dash/Phase 2 comprehension and production asset manifests are not validated by this gate. The eight-person formative target and 60–90 second Rooftop target remain prototype goals; no such playtest occurred.
