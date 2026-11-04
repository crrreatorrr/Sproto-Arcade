# Mac gameplay preview

Use http://127.0.0.1:5201/index.html to play and http://127.0.0.1:5201/review-start.html for all encounter/practice links and current projectile shapes. Delivery refreshes the loopback-only preview to the verified local-main checkout; it is not a public deployment. Opening index.html directly still works offline.

Animation production is stopped. The old30+clip request and animation approval question are superseded. Continue gameplay work and collect reaction/density feedback without waiting for art approval.

The current pacing pass keeps ordinary enemy speed at most6px/tick and marked front speed at most8 in both phases. Phase2 adds slow2–3px/tick pressure with distinct shapes, warnings, bounded population and protected commitments. qa/PACING.md records actual observations and limitations.

The user authorizes completed verified work to local main, then GitHub main without force after repository/remote/CI verification. Fighter PR #8 was verified MERGED as04573bc9b1b4cc20308d4149f9e9fae0ef8d6454 (2026-11-04T05:50:10Z) before the first Arcade pull; Arcade origin/main was already up to date and local work was preserved. No updated Fighter asset format was imported into the checked-in offline sprite set.

If the local preview is stopped, restart from Terminal:

```sh
/usr/bin/python3 -m http.server 5201 --bind 127.0.0.1 --directory /Users/kenhiraoka/Documents/Codex/2026-11-02/use-assets-of-sproto-fighter-to-2/work/sproto-arcade-repo
```

See qa/playtest.html and qa/PLAYTEST.md for real human observations; actual participants remain0/8. Historical art review files are archived snapshots, not current timing approval material.
