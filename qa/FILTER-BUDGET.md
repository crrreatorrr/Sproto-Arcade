# Story-mode frame cost (plan items A0 to A2)

Status: headless Chromium only. The real-device half of A0 (an integrated-graphics laptop, a
phone, Firefox, Safari, DevTools traces) has not been done; nothing here says how the game runs
on a GPU.

## What changed

- `boss-sheets.js` bakes each projectile and barrage-missile frame, with its keyline, into a small
  offscreen canvas once and blits that. The main canvas no longer runs five chained
  `drop-shadow` filters per enemy shot and two per missile on every frame. Scale, mirror and
  rotation are baked in (rotation snapped to 2 degrees), so the keyline stays one canvas pixel
  wide. The cache holds at most 256 entries and about 24 MB and is dropped when the stage changes.
  Without a canvas factory (Node tests), under an outer filter, or above 640 px a side, the old
  filtered draw still runs.
- The boss hit flash is a second additive draw (`lighter`, alpha 0.38; 0.34 for the fallback
  mecha) instead of `brightness(1.38)`.
- The ceiling sweep band is drawn at its final size and slid down, so it is baked four times
  (one per animation frame) and not refiltered at a new size every frame.

Not changed: the hue and tint filters in `game.js` (`drawVerseGemLaser`) and `arena-effects.js`.
The plan asks for those only where a real device shows a cost.

## Ticks per second, headless Chromium (software rendering)

1320x900 viewport, device scale 1, god mode on, player fire off, 3-second windows, same machine
and session. 60 is the target. "Filters off" redefines `CanvasRenderingContext2D.prototype.filter`
as a no-op before the page loads.

| Level | Window | Before (`936f939`) | Filters off | After |
|---|---|---|---|---|
| 1 Tidebreak Marina | Normal play, first 3 s | 29.8 | 60.0 | 60.1 |
| 1 | Normal play, next 3 s | 43.0 | 58.7 | 58.6 |
| 1 | Barrage, three windows | 21.2, 9.5, 10.1 | 60.0, 60.0, 60.1 | 59.9, 60.0, 59.1 |
| 10 Verse Gate | Normal play, two windows | 18.9, 6.0 | not run | 58.9, 56.9 |
| 10 | Barrage, three windows | 15.2, 7.3, 6.3 | not run | 55.7, 56.3, 60.1 |
| 3 Mudline Trenches (flight) | Normal play, two windows | not run | not run | 56.6, 57.8 |
| 3 | Barrage, three windows | not run | not run | 60.0, 60.1, 59.5 |

`node qa/filter-budget-browser.mjs . [level]` repeats the level-1 run and fails when the median
window is under 45 ticks per second, or when the cache is not doing the drawing. On a machine
busy with other work single windows dip (32 to 61 was seen with filters on and with filters
off alike), which is why it judges the median.

## Visual equivalence

Ninety canvas captures (levels 1, 13, 3, 6 and 10; seed 777; ticks 150 to 1000 in steps of 50; no
input) were taken before and after from the same simulation states and compared pixel by pixel.
Frames with no enemy projectile are identical. Frames with projectiles differ in at most 3.1% of
pixels, all on projectile edges: the baked sprite lands on whole canvas pixels, where the direct
draw resampled it at a fractional position. Side-by-side crops at 4x show the same pale keyline
and dark halo. The hit flash was compared the same way on 8 captures: mean difference of one
8-bit level, from rounding. These captures are not committed.

## Still to measure (A0)

Level 1 to its first barrage and level 10 or 11 to its phase-2 barrage, on real hardware, in
Chrome, Firefox and Safari: ticks per second and worst frame time. Target from the plan: 58 ticks
per second or better through a 79-missile barrage.
