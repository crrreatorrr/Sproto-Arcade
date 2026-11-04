# Verse Gate prototype timing

Placeholder geometry only. Pilot/silhouette/attack timing require signoff before final art.

## Phase 1 — Sales Carrier / Live Demo

- Forward-scrolling flight: spawn (180,350), forward drift 2.5 px/tick plus standard directional flight. Camera follows horizontal route. Player y constrained to65–665. Reach x4500 after crossing all three authored rifts; elapsed time never clears the encounter.
- Debris at x650/1550/2750/3950, alternating high (y90–265) and low (y435–610), leaves a reachable lane in each segment. Debris is ordinary shield/dash counterable contact. The optional first-rift cache appears 140px above the crossing trajectory so pickup requires a deliberate route change.
- Mandatory rifts at x1050/2250/3450. Approaching within650 triggers a90tick broken-chevron warning and resets dash readiness. A visible front holds forward travel at its launch edge until an active dash crosses. Contact source `demo-rift-N`, rule `dash`; shield never satisfies progression. A missed contact rearms after90ticks. New front created per attempt; all three counter events required before exit.
- After tick600, aimed drone volleys have50tick windup, ordinary 24×24 contact, speed8, and explicit EchoDecoy-eligible aim. Mandatory rifts remain fixed and ignore decoys.
- Carrier placeholder atx4520 with BotSales pilot anchor(4700,300), central cabin carries into the fixed showdown.

## Phase 2 — Orbital Showroom / Limited-Time Offer

- Fixed orbit, spawn(220,350). Cabin at(565,245,150,200), pilot anchor(640,310). Four hinged modules around radius250×210 are presented left→top→right→bottom.
- 480tick cycle; each side120ticks. Windup0–34, exposed35–109, retract110–119. Target moves to the named module. It opens only when the player occupies the corresponding side (left x<570,top y<290,right x>710,bottom y>460).54baselineHP completes the encounter; no timer completion. Autofire tracks the current open module.
- Center lane opens ticks420–464 each cycle, giving a short route through the cabin. The cabin is solid outside that visible opening; moving around it always remains possible. No power is required to take either route.
- Familiar side volley returns aftertick600 (50tick telegraph). First Phase1-style dash front begins attick660,90tickwindup, speed9leftward, full height. Readiness resets before the mandatory warning; it does not overlap a required constrained crossing.
- PrismRail/EchoDecoy eligible; flight mines excluded because this orbital arena has no supported bounce surfaces. The Phase1 aimed volley is decoy-eligible; fixed orbital volleys and marked fronts retain authored directions.

## Actual simulation evidence

`node stages/10-verse/playthrough.cjs ../arcade-integration` loads real integrated runtime/weapons and drives normal inputs atseed41. Full start→phase transition→clear:1495ticks,zero hits,four dashfront counters (all3 route gates plus the returning orbital front),damage on allfour module sides,no pickup equipped or power used. Repeated inputs/seed produce identical results. A1000tick shield-only forward flight remains before rift1 with no counters and cannot advance. Phase2 practice starts with base kit and one-input restart returns to playing atphaseTick0.

No browser/human playtest, refresh-rate distribution, perceptual comprehension, critical-pose/art validation, or balance claim is made by these fixtures. Integration QA must cover offline rendering and both phase entry points.

### Offline browser visibility correction

Top orbital module moved to center(640,260), target y220–300, label y195, and phase flight bounds keep player feet at260 or lower. Top exposure still requires feet<290, leaving a visible 30px decision band. Top controller now aims atfeet280. The other three module sides remain unchanged. This addresses QA screenshot occlusion under HUD/cue; browser recapture is required after integration.
