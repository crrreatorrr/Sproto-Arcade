# Codebreak timing / Packet F

Placeholder encounter; no production animation commissioned. Stable stage ID `12-codebreak`. Existing `codebreak.js` is untouched.

## Warrant climb

Eighteen authored ledges rise 90 px per step across three sectors. Each ledge is 400 px wide; four broad recovery ledges sit 130 px below authored sector footholds. The camera can reveal negative world Y. The player must physically land on the summit to transition; elapsed time and damage cannot clear this phase. Sector 2 and 3 practice entries use safe ledges and base kit snapshots. A first reward is emitted once after reaching Y <150.

Warrant Drop: first at phase tick150, repeat every180. Reticle locks X at emission, 65 tick windup, then 9px/tick descent for45 ticks, 10 recovery. Named source `12-codebreak/warrant-drop`. Move laterally or climb to the next ledge. Rig tracks the climb in placeholder draw; the same hat, arm, cabin and gold trim persist at summit. Paired chevrons mark suggested air-dash footholds. These climb gaps are deliberately forgiving; they are **not claimed to enforce dash**. Required dash is mechanically enforced at summit.

## Summit siege

Scanner introduction starts tick90, repeats every360. 75 tick marked warning, 140 active ticks at -9px/tick, 20 recovery. Source `12-codebreak/summit-scanner`, rule `dash`, full usable arena height. Countering opens the side vent for210 ticks; shield or ordinary damage grace cannot unlock it. Core has12 HP, baseline autofire damage1. A successful first counter emits the authored punish reward once. First reintroduced Warrant Drop at tick690, repeats every360 so the scanner lesson runs alone first. Core defeat clears the stage.

Critical animation poses requested after gameplay approval: climb arm locks reticle; drop release; rocket lift recovery; summit anchors deploy; scanner chevrons before release; side vent retraction/opening; rig shutdown. Pivot at rig center, pilot above vent, reticle target separate from hitbox. No signoff or final art is implied.

## Verification

`node stages/12-codebreak/test.cjs` checks authored geometry, target/route progression, named drop attack, scanner-only counter gate, vent deadline, isolated introduction, return attack and defeat using a mock world.

`node stages/12-codebreak/test.cjs <path-to-runtime/core/world.js>` additionally drives the actual fixed-step runtime with legal movement inputs, double jumps, one scanner dash and autofire. Seed37 clears both phases at tick1086 with HP5 and no weapon/drop module. It verifies sector3 practice reset and shield-only failure to expose the vent. The controller reads geometry and scanner positions; it is a reproducible integration fixture, **not a human playtest**. Display refresh and browser checks belong to integration QA. Launch-window sweeps, strongest non-dash comparisons for future required climb gaps, and eight-person comprehension testing remain open.

## Campaign follow-up: required upper crossing

The upper climb now emits a `12-codebreak/upper-crossing` dash-rule warrant front after entering the final390px below summit.75tick warning,140 active at -9px/tick,20recovery; retries every270ticks until countered. The summit route objective explicitly requires this counter before landing can advance. Dash readiness is restored on safe upper footholds until secured. Shield, ordinary hit grace and strongest non-dash double-jump routes cannot satisfy the source-gated counter. Recovery ledges feed back to the authored climb. This is a marked front commitment, not a claim that all climb gaps are geometrically dash-only.

The updated actual runtime base-kit controller clears both phases seed37 at tick1250 HP4. It waits at summit to counter the upper front, then uses the separate summit scanner/vent task. Dynamic45px operator feet anchors now follow the pursuing cockpit and sit inside the summit cockpit; the placeholder duplicate face was removed. Original tick1086 HP5 result above records the earlier ungated climb build and is superseded by this follow-up.
