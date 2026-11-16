# Moonkeep / Packet F — UFO flight

Level 7 is a UFO encounter in both phases with four-direction flight controls. Big Swole's two dragons flap their wings while their cockpits and moving targets follow the patrol. In Machine Trials, Phase 1 has a 72 px patrol amplitude over about 299 ticks. Phase 2 has an 85 px amplitude over about 262 ticks. The player's bounds are X80–820 and Y240–620.

In Phase 1, Iron Fang locks the player's position at cycle tick60, winds up60, bites18, and recovers30. The dragon breathes down at tick120 and up at tick177 from its current position. The neck joint is open at ticks138–234 of each240-tick cycle, with12HP. Changing altitude evades the locked bite. The first actual joint hit emits the introductory reward.

In Phase 2, a full-height, marked sky current replaces the grounded rampart crossing. It first appears at tick120, warns for90ticks, then travels left at6px/tick for210ticks. Until countered it repeats every360ticks. The player must dash through it; shields and ordinary flight cannot unlock the10HP neck joint. A successful dash counter grants the crossing reward, opens the moving joint, and starts a 252-tick breath cycle. Breath releases at ticks28 and82 in opposite directions. Iron Fang returns at tick660 and repeats every300ticks. The slow missile requires a completed counter plus60ticks of settling. Ordinary seed/orb pressure requires180ticks, starts no earlier than660, warns90ticks, moves2.3px/tick, has150tick cadence and a maximum of2live shots.

In Story, both dragon forms climb or dive during their attack windups. Breath, wing guns, and body cannon volleys launch from their firing-frame mounts and travel across different altitudes. The player uses the UFO's free-flight controller and weapons in both phases.

`node stages/07-moonkeep/test.cjs` checks UFO controls, moving targets, breath origins and travel directions, the dash gate, and a full base-kit clear. Seed37 clears both phases in975ticks with4HP. `node stages/12-codebreak/pacing.cjs` checks the five-stage pressure population and cleanup. Moonkeep emits both seed and orb styles, peaks at two live and two active pressure shots, and first emits at tick660.
