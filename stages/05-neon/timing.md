# Neon prototype — packet E, contract d36f7a4

## Salvage routes / Magnet Snatch

A forward auto-scroll boundary advances1.8px/tick, pushing a lagging player forward. The continuous street route is safe footing. Upper signs at y495,390,495 provide an optional authored cache; standard jumps suffice. The claw locks the player's street or upper-sign lane with65-tick cue,150 active ticks at8px/tick,30 recovery; opportunities every330 ticks. Lane-lock volleys explicitly accept a decoy redirect at commitment; they then retain their committed path. All other movement and the route objective remain unaffected.

Collector sits in the crane gantry. Target is the16HP claw drive, reachable from the street with autofire. Breaking it must be followed by reaching x5100 grounded to advance to the tower. Cache opportunity and attack schedules are independent of loot RNG.

## Billboard Shuffle

The crane anchors to a fixed tower. Three signs at x260/535/810 are staggered near y510/425/340 and move vertically ±20px with visible winch motion. The player must pick footing at a height aligned with the exposed drive x1070,y295..390; ground-level horizontal autofire cannot hit it. The winch drive opens on ticks80..260 of each300-tick cycle. Standard shots chip its20HP; Prism Rail rewards aligned shots and mines can punish from a nearby sign. First aligned hit gives an authored pickup. The new rule appears alone for600 ticks; afterward Magnet Snatch returns every420 ticks. Collector and the magnetic claw carry across the transformation.

## Verification

Run `node stages/05-neon/verify.cjs [runtime/core/world.js]`.

- Street route base-kit controller reaches transition after994 ticks, HP5, no power use.
- Billboard controller uses three ordinary jumps and autofire: clear499 ticks, HP5.
- Floor-only autofire leaves elevated target HP20, verifying that vertical alignment matters.
- Optional upper cache is reachable using ordinary jumps.
- Practice/retry clears target damage and restores safe spawn with base kit.

No production animation, browser validation, human comprehension, or final balance claim. Prototype window, moving-sign speed, and operator silhouette require review at gameplay scale before final art generation.
