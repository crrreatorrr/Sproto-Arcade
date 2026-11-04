# Crown Relay — Packet C timing and verification

Prototype; no final animation production. Same cockpit and three reels transfer to the visible rail sled in Phase2. Reels use readable X or broken-chevron symbols, not color alone. All timings60Hz. Actual runtime integration26f95cc: full4042 ticks and Phase2 practice3338 ticks, HP5, no hits. Practice recorded three dash and three shield counters. `node stages/08-crown/basekit.cjs [runtime-root]`.

Phase1 Jackpot Knight / Jackpot Pulse:420-tick cycle. Reels stop at30,55,80; pulse created90 with30-tick windup. Full-height shield-rule pulse startsx1200 width32, speed14 left, active100 ticks, recovery15. Matching X symbols and text call for shield. Only shield contact opens the core210 ticks. CoreHP20. First successful counter emits `crown-first-counter`.

Phase2 Crown Joust Rig / Royal Joust:600-tick cycle. First cycle isolates dash-only lance front with the same schedule. At cycle1 (phase690 creation, phase720 release), matching-reel shield pulse returns. Alternates dash/shield thereafter. Two explicit separate targets replace a hidden health lock: near lance corex880 HP18 opens only from dash counter; far reel corex1100 HP18 opens only from shield counter. Both must be destroyed. Each counter grants210 ticks and visibly different firing distance. Taking dash damage while repeatedly shielding cannot complete the near core. Dash cannot counter the shield pulse. Both hit sources are named independently.

Eligible Prism Rail exploits a counter opening without bypassing either typed counter. Mine/decoy excluded from this fixed-front encounter because no authored mine target or eligible aimed volley exists.

Fixture covers full/practice clears with baseline autofire, repeated-seed equality, both counter types observed, shield-only failure to damage near core, and dash-only failure to damage the Phase1 core. No human comprehension, audio chime read, production animation, or display-refresh/browser timing claim is made by this simulation check.


## Gameplay pacing revision — animation production stopped

This section supersedes earlier prototype timing and animation production notes. Verified against the shared gameplay-tuning World runtime. All timings are60Hz.

Both phases share corrected mandatory front14→8px/tick (active100→175, unchanged travel). Visible front warning30→60ticks in both phases; the sequential reel/sled cue at30 and hazard creation90 remain causal, with release now150. Phase2 retains600tick alternation and the distinct near dash/far shield cores. No phase2 speed multiplier.

Phase2 reel spill uses diamond and roller,2.5px/tick,90tick warning, cap2, first possible660 (actual first idle emission900 because the mandatory shield front defers it). The reel/lance setup and first60ticks of each210tick counter opening are protected. Later punish/recovery permits slow far-side warnings, and the next warning/front clears them. Guard called every phase2 update.

Real-runtime seed17 full3608/practice2820ticks, HP5/nohits. Full4shield+3dash, practice2shield+3dash counters;7actualpressure each across roller+diamond. Legal idle loses2666, emits6spills across both styles,630ticks active pressure, max2alive,899protected ticks. Shield-only cannot break the dash core; dash-only cannot break the phase1 shield core.

Run `node stages/08-crown/pressure.cjs [runtime-root]` for prolonged legal-idle coverage; `basekit.cjs` verifies full/practice clears and meaningful negative checks. Marina basekit accepts a world.js file path; the other basekit scripts accept a runtime repository root. Pressure audits observe hazards and wrap recording methods without mutating HP, targets or phase state. These deterministic checks establish technical clearability, not human readability, controller accessibility or final balance. No production animations/assets or Higgsfield jobs were generated.
