# Circuit Gate — Packet C timing and verification

Prototype; final art blocked on timing/pose review. Fixed camera floor y600. Same cockpit and cables become the folded Gate Spider. Cable glow traverses a visible wire during charge. Tests against integration26f95cc runtime: full2366 ticks and Phase2 practice1914 ticks, HP5, no hits, four dash counters. Run `node stages/06-circuit/basekit.cjs [runtime-root]`.

Phase1 Relay Walker / Relay Arc: low relayx630 y500 HP5, upper relayx990 y385 HP5. Maintenance platformx720..1020 y500 permits an ordinary jump to line up the upper relay. Both must be broken before corex1130 y490 HP14 opens. Every480 ticks, cycle60 begins a60-tick cable windup; low34px discharge moves left at8 for150 ticks. Elevation or shield avoids it. First low-relay defeat emits `circuit-first-relay`. Standing autofire cannot damage the upper relay, preventing passive completion.

Phase2 Gate Spider / Firewall Transfer: every480 ticks, cycle30 spawns full-height dash frontx1210 width28 with90-tick windup, speed12,110 active ticks. Active relay has HP4 atx740 for first node, x1010 for second. Only a successful `circuit.firewall-transfer.front` counter opens it for190 ticks. Missed window resets HP on next transfer; broken-node count persists. Two completed nodes open core HP18. A missed dash has a complete next-cycle recovery and cannot be bypassed by shield or prior invulnerability. At phaseTick810 (cycle330 after600 ticks), compatible Phase1 cable arcs return. HUD names live node count, transfer window, and exposed core.

Two independent core/relay stages retain clear weak-point geometry; no hidden HP stall. Prism Rail pierces aligned targets and mines have a floor/platform bounce surface. Echo Decoy excluded because charge routes are fixed rather than eligible aimed volleys.

Fixture uses actual movement/jump/dash/shield inputs only, no HP/target/phase edits. It verifies full and practice clears, seed reproduction, inaccessible upper relay under stationary autofire, and shield-only firewall rejection with zero completed nodes. Browser readability, formative playtests and full weapon-mode matrix remain unverified.
