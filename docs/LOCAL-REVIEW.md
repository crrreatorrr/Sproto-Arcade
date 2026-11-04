# Mac local review

The prototype is served only on this Mac's loopback interface at http://127.0.0.1:5201/ from the extracted arcade-offline-build folder. It is not published.

- Guided review and four-stage links: http://127.0.0.1:5201/review-start.html
- Play: http://127.0.0.1:5201/index.html
- Boss timing / pose / hit-area guides: http://127.0.0.1:5201/art-review.html
- All24phase contact sheet: http://127.0.0.1:5201/art/rework/review/index.html
- Revised summit practice: http://127.0.0.1:5201/index.html?stage=12-codebreak&phase=1

Choose Start run after opening an encounter URL. R retries; Shift dashes; X shields; C/V are the standard specials. The server does not change the offline entry: opening index.html or review-start.html directly from the folder still works.

## Incremental approval

Signoff may cover one named encounter and its two phases, the four-stage slice (Marina/Dave, Mudline/Crapto, Rooftop/Goldie, Codebreak/Bitcoin Sheriff), or all12. Unapproved encounters remain pending. Phase-only approval does not cover the other phase or a transformation whose endpoints have not been reviewed. The Dave/Big Swole/Goldie style-study group is a separate look-development grouping; Moonkeep need not be approved to unlock the four-stage gameplay slice.

Confirm warning/commitment/release/recovery timing, required counters, critical machine/operator poses, exposed target and collision bounds, transformation carryover, and intended unique defeat/escape. Goldie escapes. A precise reply can be:

“I approve the current timing, critical poses and hit areas for both phases of Marina, Mudline, Rooftop and Codebreak for initial animation production. Preserve Goldie's escape outcome. Keep the other eight pending.”

Credit permission is already recorded. This approval unlocks the named production scope; it does not count planned clips as delivered or validate human comprehension/balance. Current production clips0 and task spend0.

## Local service and verification

The current detached Python server was started as PID60117, bound127.0.0.1:5201. Logs: /tmp/sproto-arcade-5201.log. If it is no longer running, restart in Terminal:

```sh
/usr/bin/python3 -m http.server 5201 --bind 127.0.0.1 --directory /Users/kenhiraoka/Documents/Codex/2026-11-03/task/arcade-offline-build
```

qa/local-server-check.json records actual HTTP200 checks, correct direct Phase2 selection/start, all27guide images,12slice links and zero browser errors. Reproduce with `node qa/local-server-browser.mjs http://127.0.0.1:5201` from the git checkout. The local delivery check found a missing default favicon; favicon.ico now resolves successfully. No gameplay source was changed.
