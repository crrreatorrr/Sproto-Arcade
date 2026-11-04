# Circuit Gate — Packet C timing and verification

Prototype; final art blocked on timing/pose review. Fixed camera floor y600. Same cockpit and cables become the folded Gate Spider. Cable glow traverses a visible wire during charge. Tests against integration26f95cc runtime: full2366 ticks and Phase2 practice1914 ticks, HP5, no hits, four dash counters. Run `node stages/06-circuit/basekit.cjs [runtime-root]`.

Phase1 Relay Walker / Relay Arc: low relayx630 y500 HP5, upper relayx990 y385 HP5. Maintenance platformx720..1020 y500 permits an ordinary jump to line up the upper relay. Both must be broken before corex1130 y490 HP14 opens. Every480 ticks, cycle60 begins a60-tick cable windup; low34px discharge moves left at8 for150 ticks. Elevation or shield avoids it. First low-relay defeat emits `circuit-first-relay`. Standing autofire cannot damage the upper relay, preventing passive completion.

Phase2 Gate Spider / Firewall Transfer: every480 ticks, cycle30 spawns full-height dash frontx1210 width28 with90-tick windup, speed12,110 active ticks. Active relay has HP4 atx740 for first node, x1010 for second. Only a successful `circuit.firewall-transfer.front` counter opens it for190 ticks. Missed window resets HP on next transfer; broken-node count persists. Two completed nodes open core HP18. A missed dash has a complete next-cycle recovery and cannot be bypassed by shield or prior invulnerability. At phaseTick810 (cycle330 after600 ticks), compatible Phase1 cable arcs return. HUD names live node count, transfer window, and exposed core.

Two independent core/relay stages retain clear weak-point geometry; no hidden HP stall. Prism Rail pierces aligned targets and mines have a floor/platform bounce surface. Echo Decoy excluded because charge routes are fixed rather than eligible aimed volleys.

Fixture uses actual movement/jump/dash/shield inputs only, no HP/target/phase edits. It verifies full and practice clears, seed reproduction, inaccessible upper relay under stationary autofire, and shield-only firewall rejection with zero completed nodes. Browser readability, formative playtests and full weapon-mode matrix remain unverified.


## Gameplay pacing revision — animation production stopped

This section supersedes earlier prototype timing and animation production notes. Verified against the shared gameplay-tuning World runtime. All timings are60Hz.

Both phases share corrected discharge8→6px/tick (active150→200) and firewall12→8 (110→165), preserving travel. Discharge60tick and firewall90tick warnings remain. No phase2 acceleration. The standard-kit controller additionally shields actual ordinary hazards approaching its collision lane within25ticks; this corrects the timing of the slower discharge during upper-relay traversal and uses legal shield inputs.

Phase2 capacitors use bolt and orb,2.5px/tick,90tick warning, cap2, first possible660. The mandatory firewall clears pressure; the first60ticks of the190tick live-node opening stay clean. Later transfer recovery permits warnings. Once both transfer nodes break, sustained core combat admits pressure without an artificial timed lock. Every phase2 update calls the guard.

Real-runtime seed17 full2378/practice1926ticks, HP5/nohits,4dash+3ordinary counters each;6actualcapacitors each across orb+bolt. Legal idle loses1503, emits4capacitors across both styles,300ticks active pressure, max2alive,602protected ticks. Upper-relay idle rejection and shield-only failure to open dash-gated nodes remain passing.

Run `node stages/06-circuit/pressure.cjs [runtime-root]` for prolonged legal-idle coverage; `basekit.cjs` verifies full/practice clears and meaningful negative checks. Marina basekit accepts a world.js file path; the other basekit scripts accept a runtime repository root. Pressure audits observe hazards and wrap recording methods without mutating HP, targets or phase state. These deterministic checks establish technical clearability, not human readability, controller accessibility or final balance. No production animations/assets or Higgsfield jobs were generated.
