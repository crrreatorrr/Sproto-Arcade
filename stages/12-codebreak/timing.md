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

## Summit motion refinement

Phase2 now uses a pure fixed-tick articulated pose rather than the floating sine-arm placeholder. The cabin arrives with a critically damped75tick settle; anchored feet stay atY600 throughout. The first scanner still cues at90 and activates after75warning ticks, so the landing settles before the first active commitment. The scanner unfolds over55ticks, locks for20, releases for140, retracts over55, then recovers. Upper/lower arm joints, hinged emitter, release recoil and actual target-hit reactions move independently. The operator feet follow the cab exactly. The side vent remains fixed to the actual target rectangle1050,490,105,100, with shutters opening over18ticks after a successful counter; visual articulation never moves the hit area.

All attack, opening, HP, phase and collision timings are unchanged. Automated continuity sampling over1200ticks shows maximum articulated coordinate step below5px/tick with planted feet; six scanner states, intro settle, recoil response, pilot lock and finite draw geometry pass. Existing actual-runtime full start-to-clear remains tick1250 HP4, seed37, base kit. These checks do not replace browser observation or human movement approval.

### Production clip request: 36 distinct clips

The user's30+animation requirement means separately authored clips with distinct actions, not30frames or copied timing labels. The following production backlog is **unproduced**, pending encounter timing and critical-pose signoff:

1. Warrant rig pursuit idle.
2. Operator pursuit throttle pull.
3. Left rocket lift acceleration.
4. Right rocket banking correction.
5. Vertical pursuit brake.
6. Reticle arm unfold.
7. Reticle aim-left lock.
8. Reticle aim-right lock.
9. Warrant stamp windup.
10. Warrant drop release.
11. Drop arm recoil.
12. Reticle arm retract.
13. Upper warrant-front deploy.
14. Upper-front charge hold.
15. Upper-front release.
16. Upper-front cooldown.
17. Pursuit hit flinch.
18. Summit approach deceleration.
19. Landing compression.
20. Anchoring feet deployment.
21. Anchored cabin settle.
22. Summit operator ready idle.
23. Scanner shoulder unfold.
24. Scanner emitter hinge opening.
25. Scanner lock-on windup.
26. Scanner front release recoil.
27. Scanner sustained sweep.
28. Scanner emitter retract.
29. Scanner arm fold recovery.
30. Counter overload stagger.
31. Vent shutter unlock/open.
32. Exposed-core breathing hold.
33. Core shot reaction.
34. Vent shutter relock.
35. Rig defeat shutdown.
36. Operator defeat/escape.

Each future clip needs an individual stable ID, authored start/end poses, event markers, anchors and generation/source record. Procedural motion states here are prototype feedback, not fulfillment of that production asset count. No final Higgsfield animation was generated or integrated by this packet.


## Gameplay pacing — current direction (2026-11-04)

Animation production is stopped. Earlier production-clip references are archived planning, not current deliverables or a gameplay approval blocker.

Warrant warning65→75ticks. Shared campaign pacing changes ordinary drop9→5.956px/tick (active45→68) and both upper/summit dash fronts9→7.975 (active140→158), preserving travel with identical caps in both phases. Eighteen ledges, recovery platforms, dash requirement and fixed vent hit rectangle are unchanged.

The existing procedural scanner pose now reads the normalized hazard.active duration. Its release lasts through actual active tick232 and retract begins233ticks after the scanner cue, replacing the old215deadline. Feet remain planted and the pilot follows the cab. This is synchronization of existing prototype geometry; production animation/Higgsfield work is stopped.

Phase2 pressure: roller/diamond,2.4px/tick,90tick warning,120tick cadence, max2, no earlier than780. Unresolved scanners clear it automatically; an open vent explicitly clears it every update, protecting the counter/punish sequence.

Verified actual seed37 base-kit climb/summit clear1614ticks,HP4, upper and summit dash counters, checkpoint restart and shield-only rejection. Procedural sampling over1200ticks has max3.489px tick movement, six scanner states, fixed feet/pilot/vent and draw smoke. The five-stage pacing.cjs additionally checks the actual158tick scanner deadline, both pressure styles surviving warning, live cap2 and protected-state removal. Codebreak's extended3000tick closed-vent sample emitted13shots, peak2live/1active, first780; retained health/target sample is a density fixture, not a human playtest.

Run the stage clear fixture and `node stages/12-codebreak/pacing.cjs` after integrating the shared runtime pacing helper. Automated controllers cover technical base-kit routes; human feel/difficulty playtesting remains outstanding.
