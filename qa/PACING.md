# Gameplay pacing evidence

Current scope follows `docs/GAMEPLAY-TUNING-CONTRACT.md`: animation production is stopped. Archived animation inventories and release files remain historical and no longer gate this gameplay pass.

## Before tuning

`pacing-baseline.json` is pinned to 010f785 (gameplay matches local main 7dfb12a). Run `node qa/pacing-audit.mjs <repo>` to repeat. It observes all 24 phase starts for 2,400 ticks with neutral inputs. Damage, falls and target damage are disabled for **diagnostic observation only**; this is not a clear controller or proof of fairness. Deduplicated emissions report actual authored velocity magnitude, runtime magnitude, windup and player-relative spawn distance. Raw velocity literals are separately attributed by source line and can include entity movement rather than attacks.

The fastest observed fronts are Crown's 14 px/tick in both phases; Marina and Circuit Phase 2 reach 12 px/tick. Ordinary attacks reach 9 in Marina, Mudline, Verse Phase 2 and Codebreak; 8 in Neon, Circuit and Verse Phase 1. Last Light Phase 2 and Ranch approach reach 7. At 60 ticks/second, 14 px/tick crosses 360 pixels in about 26 ticks, versus 45 ticks at the new 8-pixel mandatory-front cap. These are motion-only calculations; authored warning time is additional and actual contact depends on player movement and collision dimensions.

Predictable risk is greatest where a fast moving shot arrives during a required reflection, gap launch/landing or brief counter opening. Slow additional pressure must defer through those commitments. Neutral observation does not reach every traversal-gated attack: Rooftop Phase 2 emits none on this route, for example. Stage-specific legal base-kit controllers and actual browser checks must complement it.

## Acceptance and limitations

The regression runner includes the existing legal-input campaign controllers plus independent pacing fixtures. Velocity normalization must retain direction/travel and leave fixture mechanics intact. Phase 2 pressure must wait at least 600 ticks, stay slow and capped, cycle distinct styles without consuming combat RNG, clear during protected or mandatory-front intervals, and reset on retry/phase entry. Browser checks must cover actual offline and HTTP entries and rendered warnings/projectile images. Automated checks do not establish human reaction comfort, eight-person playtesting or final balance.

## Tuned candidate 758b6bc

`pacing-regression.json` records **26/26 passing commands**, including the existing twelve-stage standard-kit controllers, new stage pressure checks, runtime fixtures and 11 independent pacing fixtures. `pacing-ui.json` records the actual offline browser's **24/24 menu entries**, keyboard dash/shield, retry, phase transition routing and pause/resume. Lifecycle transitions in that smoke test are explicitly invoked; earned completions come from the separate legal-input controllers.

`pacing-campaign.json` repeats the diagnostic neutral observation on this clean candidate. All observed ordinary attacks are at most6 px/tick and mandatory moving fronts at most8. Every Phase1 observation has zero background pressure. Observed Phase2 pressure starts between660 and960 ticks, has peak live count2 and cycles two styles. Neutral inputs miss traversal-gated pressure in Mudline, Ranch, Moonkeep and Rooftop; their stage-specific tests provide separate controlled scheduling and route evidence. Do not read an absent neutral emission as missing content or an invulnerable observation as a clear.

Some skilled scripted routes finish before added pressure is eligible, including Neon's 499-tick climb; keeping the initial600-tick lesson protected is intentional. Last Light pressure defers during the legal reflection setup. Ranch's legal Phase2 route encounters roller/seed at660/720; Rooftop encounters orb/diamond at840/930. These traces document specific seed/controller routes, not universal difficulty or a claim that every player sees every shape.

Human pacing sessions remain **0/8**. No claim is made about human reaction comfort, onboarding comprehension or final campaign balance. Production animations and Higgsfield generation remain stopped.

`pacing-browser.json` verifies actual `file://` and local HTTP entry rendering: all five static projectile images load, all five draw with their authored collision dimensions, warning boxes use dashed outlines and trajectory arrows render. Both schemes report zero browser exceptions/resource errors. Screenshots `pacing-projectiles-file.png` and `pacing-projectiles-http.png` show the synthetic five-shape warning arrangement with the pause curtain hidden for inspection; the simulation stays paused. Visual inspection confirms silhouettes, outlines and arrows are visible below the HUD. This deliberately overpopulated arrangement tests rendering only; campaign pressure remains capped at2. It is not a claim about natural encounter density or human shape recognition.
