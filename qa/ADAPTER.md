# Offline adapter checks

`node qa/adapter-browser.mjs [repo-root]` drives actual menus and keyboard events to verify dash remapping, reserved-key rejection, Escape repeat handling, transformation pause, dispatched blur and held-input clearing, distinct full/phase/sector record keys, and Next encounter routing. Transitions and clears are invoked explicitly; this is adapter validation, not earned victory. The browser uses a private profile so test records never touch the user's normal browsing data.

`adapter-interim.json` passed on `aae7254` with root index/docs changes in progress. Rerun at the release candidate pin before reporting final adapter coverage.

`node qa/refresh-browser.mjs [repo-root]` installs a controllable RAF queue before the actual entry scripts load. At 30/60/120/144 nominal display Hz, it starts Marina with seed777, dispatches legal held-right input and advances identical 2400.001ms intervals. It compares the actual adapter's resulting144 simulation ticks and complete selected state snapshots without mutating the world. This tests fixed-step behavior under controlled timestamps; it does not benchmark physical displays, frame loss or GPU load.

No QA browser command needs a web server or internet. Chrome launch/loopback CDP may require executor permission. The controls/refresh scripts are separate from `run-all.mjs` because local browser permission is environment-specific.
