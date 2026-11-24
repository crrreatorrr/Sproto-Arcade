# Art tasks

Found during the gameplay QA pass of 2026-11-24 on `origin/main` at `2b88b93`. Nothing here was
changed in the game: each item needs artwork redrawn or regenerated, which that pass did not do.
All are cosmetic. None blocks play.

## 1. Hard scene cuts inside the scrolling phase-1 backdrops (story mode)

**Assets:** `art/later-routes/9/01.webp` to `18.webp` (The Hatchery) and
`art/later-routes/7/01.webp` to `18.webp` (Moonkeep Castle). The same pattern measures the same
way in `art/later-routes/5`, `6`, `8` and `10` (Neon Tomorrow, Circuit Gate, Crown Relay Chamber,
Verse Gate), but only the Hatchery and Moonkeep were looked at on screen.

**What is wrong:** each set is one long strip made of scenes about 2148 source pixels wide, and
neighbouring scenes meet in a straight vertical line with no transition: the palette, the lighting
and the height and style of the floor all change at that line. In the Hatchery a purple egg cave
meets a gold pod hall; in Moonkeep a sunlit hall meets a dark wall. The cut scrolls across the
screen behind the fight about every 12 seconds.

The panel files do join each other correctly (the 208-pixel overlaps match), so this is not a
loading or drawing fault. The cut is painted into the files. In each set it sits at source
x = 75 and 2223 in panels 1, 4, 7, 10, 13 and 16, at x = 1507 in panels 2, 5, 8, 11, 14 and 17,
and at x = 791 and 2939 in panels 3, 6, 9, 12, 15 and 18 (within a few pixels).

**How to see it:** open `legacy.html?level=9` (The Hatchery) or `legacy.html?level=7` (Moonkeep
Castle), start the level and watch the background during phase 1. Double-tap `9` for god mode to
watch without fighting. A cut is on screen about 45 seconds in (tick 2700) on both levels.

**Expected:** scenes either blend into each other or meet behind a deliberate divider, as Last
Light Bar does with its doorway frames (`art/hpos10i-remake/doorway-*.webp`) and as some Moonkeep
and Circuit Gate joins already do with a pillar. The floor line should stay at one height across
the join. Keep each file's size (3072x720), the 208-pixel overlap between neighbouring panels and
the floor height the game uses, so no code changes.
