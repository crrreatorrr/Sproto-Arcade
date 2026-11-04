# Gameplay pacing evidence

Current scope follows `docs/GAMEPLAY-TUNING-CONTRACT.md`: animation production is stopped. Archived animation inventories and release files remain historical and no longer gate this gameplay pass.

## Before tuning

`pacing-baseline.json` is pinned to 010f785 (gameplay matches local main 7dfb12a). Run `node qa/pacing-audit.mjs <repo>` to repeat. It observes all 24 phase starts for 2,400 ticks with neutral inputs. Damage, falls and target damage are disabled for **diagnostic observation only**; this is not a clear controller or proof of fairness. Deduplicated emissions report actual authored velocity magnitude, runtime magnitude, windup and player-relative spawn distance. Raw velocity literals are separately attributed by source line and can include entity movement rather than attacks.

The fastest observed fronts are Crown's 14 px/tick in both phases; Marina and Circuit Phase 2 reach 12 px/tick. Ordinary attacks reach 9 in Marina, Mudline, Verse Phase 2 and Codebreak; 8 in Neon, Circuit and Verse Phase 1. Last Light Phase 2 and Ranch approach reach 7. At 60 ticks/second, 14 px/tick crosses 360 pixels in about 26 ticks, versus 45 ticks at the new 8-pixel mandatory-front cap. These are motion-only calculations; authored warning time is additional and actual contact depends on player movement and collision dimensions.

Predictable risk is greatest where a fast moving shot arrives during a required reflection, gap launch/landing or brief counter opening. Slow additional pressure must defer through those commitments. Neutral observation does not reach every traversal-gated attack: Rooftop Phase 2 emits none on this route, for example. Stage-specific legal base-kit controllers and actual browser checks must complement it.

## Acceptance and limitations

The regression runner includes the existing legal-input campaign controllers plus independent pacing fixtures. Velocity normalization must retain direction/travel and leave fixture mechanics intact. Phase 2 pressure must wait at least 600 ticks, stay slow and capped, cycle distinct styles without consuming combat RNG, clear during protected or mandatory-front intervals, and reset on retry/phase entry. Browser checks must cover actual offline and HTTP entries and rendered warnings/projectile images. Automated checks do not establish human reaction comfort, eight-person playtesting or final balance.
