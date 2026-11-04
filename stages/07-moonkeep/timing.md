# Moonkeep / Packet F campaign prototype

Two task types: lift-and-bite damage duel → upper rampart crossing and joint punish. Existing cockpit, neck joint and rear anchor form persist in placeholder geometry. Operator anchor is inside the cab; root draws the existing sprite at48px height. No final art has been generated or approved.

Phase1: static launch620, step540, sinusoidal lift460±35 (70 tick angular denominator), joint ledge420. Iron Fang locks the player's position at cycle tick60, winds up60, bites18, recovers30. Joint is open at cycle ticks138–234 of240. Joint12HP. A first actual joint hit emits the introductory reward. Player can reposition onto the upper ledge to punish.

Phase2: upper launch edge460, landing begins1000, both Y420. Lower recovery spans arena Y650; a step at550 returns to the upper launch. Marked crumbled span is inactive. Tick60 shows the cracked rampart cue. The player must depart the upper launch, air dash in the break, and land on the far upper platform; falling below520 resets departure/dash state. Lower-side approaches cannot unlock the joint. Landing grants a reward and opens10HP joint. Phase1 bite returns only after tick660.

Verification: `node stages/07-moonkeep/test.cjs <runtime/core/world.js>`. Actual runtime seed37 full start-to-clear763ticks, HP4, no drops. 100 possible second-jump timings at maximum non-dash speed, launched from the furthest legal edge center475, reach at most X860 above the landing height, below first far landing contact984. Shield does not change this geometry or gate. Fifteen tested dash input timings14–28 with second jump35 from center450 all cross successfully. Actual lift rider carry and legal recovery→step→launch input path pass. Lower approach cannot unlock the joint. These are deterministic fixtures, not human playtest results.

Animation pose requests after signoff: jaw ratchet/lock; neck coil/bite/withdrawn joint; rear-leg anchoring; stone crack; tail return; joint shutdown. Collision, reference silhouettes and readability require browser/human approval before production animation.
