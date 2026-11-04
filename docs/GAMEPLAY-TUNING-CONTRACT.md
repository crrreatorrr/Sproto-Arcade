# Gameplay tuning contract — current user direction

Base local main7dfb12a, including the user's newer Special Sproto add/revert history. Animation production and Higgsfield submissions are stopped. The old30+clip goal is superseded. Keep archived reference material as history; it is not an approval blocker for gameplay work.

Runtime owns campaign velocity normalization in World.hazard: ordinary moving hazards max6px/tick, dash/shield fronts max8px/tick, same limits in both phases. Never boost a slower hazard. Preserve direction and total travel by extending active ticks when speed is reduced. Stationary geometry, mandatory gap widths, player movement, dash and shield counters retain their meaning. Test fixture stages without campaign number should retain exact authored mechanics.

Add World.pressure(spec) for explicitly authored Phase2 pressure. It is called each stage update, returns new hazard or null. Signature:
`{id,start=660,period=180,offset=0,styles:['orb','seed'],speed=2.5,windup=75,maxAlive=2,lane:'low'|'high'|'aimed',side:'far'|'left'|'right'|'alternate',enabled:true}`.

Only Phase2, after isolated rule introduction (at least600ticks). No cue replacement. Use stable id/tick dedup; separate style cycling from attack/loot RNG. Choose a visible far-side spawn with >=360px separation and>=75tick warning; clamp visible Y below HUD. Keep bounded lifetime and pressure population. Ordinary, slow, committed shots only; no homing. Low/high lanes should leave an identifiable standing/jumping route. Styles: bolt,orb,seed,diamond,roller. Use `sprite` field on hazard. `pressure:true` identifies background pressure.

If enabled:false, or an unresolved dash/shield mandatory hazard exists, remove background pressure and emit none. Call pressure every update even in protected intervals so existing pressure is cleared. Stage owners must protect required launch/landing zones, reflection setups and critical counter/punish sequences using enabled. maxAlive is a real cap. Stage-specific pressure may defer through difficult commitments; density should rise in safe combat intervals rather than invalidate the rule lesson.

Root owns rework.js renderer and art/gameplay/projectiles/** static SVG sprites. This is gameplay readability work, not boss animation production. Keep exact collision boxes recognizable, warning dashes/trajectory cues distinct, and mandatory fronts on their existing chevron/shield visual language.

Ownership: A runtime/core/** +runtime/fixtures/**. B stages01,02,06,08. C stages03,07,09,10,12. D stages04,05,11. H qa/**. Integration owner root entries/docs/renderer/static projectile sprites/server refresh. All workers use separate worktrees and commits; no remote pushes. Test both standard-kit phases and protected routes against shared runtime. Report before/after speeds, warning windows, pressure counts/styles, actual failures and human limitations.
