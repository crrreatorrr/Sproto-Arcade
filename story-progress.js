/* Story mode progress: cleared levels and unlocked Sprotos. Classic script, no DOM or network.
 * Saved in localStorage and, when the hub is connected, in the hub's cloud save (save.get/put).
 * Local and cloud copies merge as a union, so a stale copy never removes progress. */
(function (root) {
  'use strict';
  const STORAGE_KEY = 'sproto-arcade-story-v1';
  const LEVEL_COUNT = 12;

  // Every Sproto not listed here is open from the start, as before this change.
  // Each locked Sproto opens by clearing one level or by owning one Relic from another hub game.
  const UNLOCKS = {
    morelight: { level: 1, relics: ['tinubu_crown', 'tidebreaker_belt'] },
    sproto831: { level: 5, relics: ['genesis_shard'] },
    sproto1815: { level: 8, relics: ['hpos10i_core'] },
    sproto1668: { level: 10, relics: ['cones_tip'] },
  };
  const RELIC_GAMES = {
    hpos10i_core: 'HPOS10I',
    genesis_shard: "The People's Bitcoin",
    cones_tip: 'NOBU',
    tinubu_crown: 'Sproto Duel',
    tidebreaker_belt: 'Sproto Fighter',
  };
  const RELIC_NAMES = {
    hpos10i_core: 'HPOS10I Core',
    genesis_shard: 'Genesis Block Shard',
    cones_tip: "Cone's Tip",
    tinubu_crown: "Tinubu's Crown",
    tidebreaker_belt: 'Tidebreaker Belt',
  };

  function empty() {
    return { v: 1, cleared: [], unlocked: [], updatedAt: 0 };
  }

  /** Accepts anything (old saves, cloud data, junk) and returns a clean save. */
  function normalize(raw) {
    const out = empty();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    if (Array.isArray(raw.cleared)) {
      out.cleared = [...new Set(raw.cleared.filter((n) => Number.isInteger(n) && n >= 0 && n < LEVEL_COUNT))].sort((a, b) => a - b);
    }
    if (Array.isArray(raw.unlocked)) {
      out.unlocked = [...new Set(raw.unlocked.filter((id) => typeof id === 'string' && Object.hasOwn(UNLOCKS, id)))].sort();
    }
    out.updatedAt = Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0;
    return out;
  }

  function merge(a, b) {
    const x = normalize(a), y = normalize(b);
    return normalize({
      v: 1,
      cleared: [...x.cleared, ...y.cleared],
      unlocked: [...x.unlocked, ...y.unlocked],
      updatedAt: Math.max(x.updatedAt, y.updatedAt),
    });
  }

  function same(a, b) {
    const x = normalize(a), y = normalize(b);
    return x.cleared.join() === y.cleared.join() && x.unlocked.join() === y.unlocked.join();
  }

  /** Records a clear and any Sproto it opens. Returns the new save and the ids newly unlocked. */
  function recordClear(save, level, now = 0) {
    const next = normalize(save);
    const opened = [];
    if (!Number.isInteger(level) || level < 0 || level >= LEVEL_COUNT) return { save: next, opened };
    if (!next.cleared.includes(level)) next.cleared.push(level);
    for (const [id, rule] of Object.entries(UNLOCKS)) {
      if (rule.level === level && !next.unlocked.includes(id)) {
        next.unlocked.push(id);
        opened.push(id);
      }
    }
    next.updatedAt = Math.max(next.updatedAt, now);
    return { save: normalize(next), opened };
  }

  /** Sproto ids open for this save and Relic list. `all` opens everything (review links). */
  function isUnlocked(id, save, relics = [], all = false) {
    const rule = UNLOCKS[id];
    if (!rule || all) return true;
    if (normalize(save).unlocked.includes(id)) return true;
    return rule.relics.some((relic) => relics.includes(relic));
  }

  function lockReason(id, levels) {
    const rule = UNLOCKS[id];
    if (!rule) return '';
    const level = levels?.[rule.level]?.title ?? `level ${rule.level + 1}`;
    const relics = rule.relics.map((r) => `${RELIC_NAMES[r]} (${RELIC_GAMES[r]})`).join(' or ');
    return `Clear ${level}, or own the ${relics} in the hub`;
  }

  function load(storage) {
    try {
      return normalize(JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null'));
    } catch {
      return empty();
    }
  }

  function store(storage, save) {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(normalize(save)));
    } catch {
      // Private windows and file:// can refuse storage. Progress then lasts for this visit.
    }
  }

  root.ArcadeProgress = { STORAGE_KEY, LEVEL_COUNT, UNLOCKS, empty, normalize, merge, same, recordClear, isUnlocked, lockReason, load, store };
})(typeof window !== 'undefined' ? window : globalThis);
