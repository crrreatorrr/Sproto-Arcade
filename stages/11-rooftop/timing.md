# Rooftop prototype handback

Packet E; contract d36f7a4. Two authored routes use the standard 5px/tick ground movement. Machine and operator visuals are canvas placeholders. No Higgsfield generation is commissioned.

## Phase 1 — Pursuit Jetpack / Afterburner Burst

- Spawn (130,600), route completion at x=10000 while grounded on the exit roof after the marked crossing. Practice spawn (3300,600) is the authored dash-teaching sector.
- First roof ends x=1100; landing x=1260. Jump from near the roof edge. This first 160px gap needs no dash.
- Dash launch roof ends x=3800, landing begins x=4280, 480px separation; paired broken chevrons and text mark both edges. The full-height front at x=4070 accepts only runtime rule `dash`. Before commitment, grounded approach restores dash readiness. A failed front counter returns the player to the launch roof with a named hit; successful crossing cannot be replaced by tanking or shield. Falling still loses the attempt.
- Goldie aims from behind the player, using 48 windup / 130 active / 10 recovery ticks and 8px/tick projectile speed. Eligible aimed volleys use the explicit decoy adapter; fixed front is not redirectable. Attack opportunities every 360 ticks occur only when grounded and at least 850px away from the mandatory gap edges.
- Route fork at x=5260: lower roof stays safe; upper roofs (y=510,415,510) lead to an optional authored cache. Standard jumps reach the cache, verified in simulation.
- Transform: jetpack remains identifiable, wings unfold in Phase 2; integration handles 90-tick transition, hazard clearing and pickup charge carry.

## Phase 2 — Intercept Glider / Cutoff Pass

- Spawn (130,600), exit x=8300 with grounded landing and required counter.
- First 600 ticks show only the new extraction route rule; then aimed glider shots arrive alternately from ahead and behind on a 360-tick authored cycle. Original rear Afterburner Burst returns every 540 ticks in the safe middle segment after tick600.
- Final gap x=6650..7130, front x=6920, same readable launch and landing geometry as the first phase. The first-use bank prompt appears at x=5500. Intercept cannot be redirected or shielded. No aimed shots are authored near either required gap edge.
- Goldie is visibly in the jetpack/glider placeholder drawn by the phase; `drawsPilot:true` prevents a second root-renderer pilot.

## Verification

`node stages/11-rooftop/verify.cjs path/to/runtime/core/world.js`

Passed with Packet A development runtime on 2026-11-04:

- Phase1 route scripted inputs: transition after1937 ticks, HP5, no pickup power used.
- Phase2 route scripted inputs: clear after1597 ticks, HP5, no pickup power used. With90 transition ticks, total60.4 seconds using practiced inputs; this is a prototype target, not measured novice timing.
- Mandatory480px geometry: zero no-dash landings across990 sampled legal launch/double-jump combinations. This is a sampled regression, not a mathematical exhaustive proof. Dash timing sweep found at least25 successful launch timings.
- Extraction hazards include positive and negative x velocities, verifying both approach directions.
- A stationary player does not clear; retry resets the mandatory crossing state.
- Upper-cache geometry is reachable with standard jumps.

Remaining: actual offline browser/visual checks by integration QA; formative human playtest; final camera, animation and audio cue review. No player-comprehension or final-art acceptance is claimed. Collision uses runtime's full-height front and swept resolution; the stage does not implement separate contact logic.

## Authored practice sectors

Root entry may enumerate `stage.practiceSectors`: first jump, required dash gap, route fork (explicitly labelled prior dash passed), and final intercept. Only a practice World honors sector snapshots; normal run ignores sector IDs. Snapshots start on a safe roof with base-kit HP, no projectiles or powers, ready dash. The route-fork practice snapshot marks the earlier dash complete; retry preserves that labelled checkpoint, while a full run cannot skip it. Sector fixture assertions passed.
