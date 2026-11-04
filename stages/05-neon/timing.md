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

## Gameplay tuning — 2026-11-04

Production animations/Higgsfield work is stopped. Claw lock warning is75ticks (was65); runtime d3e3b95 reduces8px/tick to6px/tick with200 active ticks (was150), preserving1200px travel in both phases. Auto-scroll, sign motion, drive alignment and target-open windows are unchanged.

Phase2 adds orb/seed pressure only after660ticks,120tick opportunity cadence,2.5px/tick,90tick warning, cap2. It is enabled only on the grounded street floor with x<500; each update calls the helper even when disabled. Jumping onto the sign route immediately clears it, preserving climb/landing and elevated drive alignment/punish windows. Low lane is jumpable; returning claw remains the original mechanic.

Against core d3e3b95: full street transition994ticksHP5 and legal three-jump billboard clear499ticksHP5, unchanged. The successful fast climb finishes before pressure unlocks (zero added shots). The separate floor-only wait emits orb660/seed780, then repeated bounded pairs, with targetHP20: slow background density does not bypass alignment. Controlled authoring probes verify two styles, cap2,2.5 speed,90warning, >=360px separation and immediate removal when airborne on nonscheduled ticks. Standard-jump upper cache and retry checks pass. These scheduling probes are distinct from the legal-input clears; human balance and browser readability remain integration checks.
