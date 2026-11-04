# Very slow Phase2 missiles

Base local main75df20c. Add missiles in every boss's Phase2; boss animation production stays stopped. Use a static placeholder until the separately generated missile sprite arrives.

Runtime adds `World.slowMissile(spec)` called every Phase2 stage update. Spec `{id,start:180,period:480,enabled:true,speed:1.1,windup:90}`. Phase1 cannot spawn it. It is ordinary counterable damage, committed at spawn (never homing), `sprite:'missile'`, `missile:true`, `pressure:true`,44×18 collision box, speed at most1.2px/tick and at least90warning ticks. First eligible emission may begin after180ticks; stages protect their initial task/firstcounter and first30–60punish ticks. This slow missile introduction is distinct from existing faster background pressure's600tick minimum.

At most1live missile and at most2total background-pressure projectiles. Prefer the missile when its cooldown is due: safely retire at most one older non-missile background-pressure shot if that pool is full. No base boss attack is removed. Cooldown advances only on actual emission; stable ID/tick dedup and retry/phase reset. Spawn visibly on far side with at least360px horizontal separation, below HUD; locked line at the player's original height with a visible trajectory warning. Bounded life, retire active missiles that leave the current camera by a safe margin.

`enabled:false` clears live missiles (not unrelated base hazards) immediately. Unresolved dash/shield mandatory fronts clear all background pressure, including missiles, and prevent new ones. Every stage calls the helper even during protected intervals so missiles cannot linger into a required gap, reflection bait or first counter commitment. Existing phase2 pressure remains separately authored; its cap must include missiles.

Ownership: runtime worker runtime/core/**,runtime/fixtures/**. StageG stages01,02,04,05,06,08. StageF stages03,07,09,10,11,12. QA qa/**. Root sharedrenderer/static missile placeholder/asset mapping/docs/server/local+GitHub integration. Separate worktrees and serial integration; workers do not pull or push.

Tests must cover all12second phases, legal standard-kit clears and protected commitments, actual missile emissions/active travel, cap/cooldown, committed aim/escape routes, lifecycle cleanup, offline rendering and eventual real asset scale. Diagnostic prolonged observations are not earned clears. Efficient clears may finish during missile warning; report this honestly rather than padding boss HP.
