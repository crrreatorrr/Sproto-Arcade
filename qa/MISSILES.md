# Very slow missile verification

Verified clean gameplay candidate `05b08ea2ce2306bf37e8131e7910e7c772c72fd4`.

- `missile-regression.json`:30/30 deterministic commands pass, including10 independent missile runtime fixtures and both six-stage diagnostic suites.
- `missile-campaign.json`:12/12 existing standard-kit controller suites pass unchanged. Every encounter has a clear route with a missile emission;11/12 have active missile samples during a clear. Moonkeep clears at230ticks after its184tick emission, before its90tick warning ends. Mudline upper route clears without emission; its lower route provides emission and active samples. Do not count auxiliary fixture worlds as earned clears.
- The six ground diagnostics and six flight/route diagnostics in the regression artifact exercise actual stage helper emissions, active travel and protected cleanup in all12second phases. They use controlled setup and are explicitly not earned clears. Ground rows' `emitted` field is emission tick, not emission count.
- `missile-browser.json`:actual file and HTTP Chrome rendering passes, using the static SVG placeholder mapped by the runtime asset table.44×18 destination drawing, collision outline, dashed trajectory, image loading and zero console errors/exceptions verified. `missile-render-file.png` and `missile-render-http.png` were visually inspected: warning label/trajectory and placeholder remain inside play area and below HUD. This is a synthetic paused arrangement, not a played encounter.
- `missile-ui.json`:24/24 actual offline phase entry/input/retry smoke checks pass. Forced lifecycle probes are labeled in the artifact.

Reproduce from the QA directory with `node run-all.mjs <repo>`, `node missile-campaign.mjs <repo>`, `node ui-browser.mjs <repo>`, and `QA_CAPTURE=<capture-prefix> node missile-browser.mjs <repo> http://127.0.0.1:5202/index.html`. Browser checks require local Chrome. The observer preload changes no HP, collision, input, stage data or target damage; it adds observation fields and wraps calls only.

Limits: no human playtests; automated routes do not establish comfort or comprehension. The isolated grounded escape uses a forward jump across the committed line; stationary jump or walking alone is not claimed as universally safe. The original evidence above used the placeholder; the supplied-art verification below supersedes its asset limitation. Boss animation production remains stopped. No pull, push, generation credits or production code changes were performed by QA.


## Supplied static missile art

The runtime now uses the provided Higgsfield PNG, Library `libfile_459770306434819188170ed598504973`. The source SHA, verified crop and export dimensions are recorded in `art/gameplay/projectiles/missile-asset.json`. `tools/prepare-missile-art.py <source.png>` reproduces the keyed master and nearest-neighbor runtime export with Pillow. Only exterior-connected magenta is removed, so interior painted details remain intact. The 1549×423 tight master becomes a 44×12 body with transparent padding inside the existing44×18 hitbox. Projectile speed, warning duration and encounter rules are unchanged.

- `missile-art-browser.json` and `missile-art-render-*.png`: actual Chrome file/HTTP rendering of left/right facings, warning and active states. Both use the176×72 RGBA PNG at44×18 with smoothing disabled, exact collision outlines and dashed warnings; zero console errors/exceptions. Screenshots were visually inspected. These are synthetic paused arrangements, not earned clears.
- `node qa/missile-art.mjs .`: validates PNG dimensions, RGBA/binary transparency, transparent padding, no hidden background RGB, nearest-neighbor pixel blocks and runtime/provenance mapping. Registered in the31-command regression runner, all passing.
- The supplied static asset required no additional generation or credits in this integration. Boss animation production remains stopped. Human readability playtesting remains outstanding.
