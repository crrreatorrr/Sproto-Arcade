# Crown Relay — Packet C timing and verification

Prototype; no final animation production. Same cockpit and three reels transfer to the visible rail sled in Phase2. Reels use readable X or broken-chevron symbols, not color alone. All timings60Hz. Actual runtime integration26f95cc: full4042 ticks and Phase2 practice3338 ticks, HP5, no hits. Practice recorded three dash and three shield counters. `node stages/08-crown/basekit.cjs [runtime-root]`.

Phase1 Jackpot Knight / Jackpot Pulse:420-tick cycle. Reels stop at30,55,80; pulse created90 with30-tick windup. Full-height shield-rule pulse startsx1200 width32, speed14 left, active100 ticks, recovery15. Matching X symbols and text call for shield. Only shield contact opens the core210 ticks. CoreHP20. First successful counter emits `crown-first-counter`.

Phase2 Crown Joust Rig / Royal Joust:600-tick cycle. First cycle isolates dash-only lance front with the same schedule. At cycle1 (phase690 creation, phase720 release), matching-reel shield pulse returns. Alternates dash/shield thereafter. Two explicit separate targets replace a hidden health lock: near lance corex880 HP18 opens only from dash counter; far reel corex1100 HP18 opens only from shield counter. Both must be destroyed. Each counter grants210 ticks and visibly different firing distance. Taking dash damage while repeatedly shielding cannot complete the near core. Dash cannot counter the shield pulse. Both hit sources are named independently.

Eligible Prism Rail exploits a counter opening without bypassing either typed counter. Mine/decoy excluded from this fixed-front encounter because no authored mine target or eligible aimed volley exists.

Fixture covers full/practice clears with baseline autofire, repeated-seed equality, both counter types observed, shield-only failure to damage near core, and dash-only failure to damage the Phase1 core. No human comprehension, audio chime read, production animation, or display-refresh/browser timing claim is made by this simulation check.
