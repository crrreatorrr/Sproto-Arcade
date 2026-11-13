/* Story mode progress: cleared levels, unlocked Sprotos and best results. Classic script, no DOM
 * or network. The rules live here; hub-link.js keeps the save in the hub SDK's progress store
 * (MODEL below), which owns the localStorage keys and the cloud save. Copies merge as a union and
 * keep the better record, so a stale copy never removes progress. */
(function (root) {
  'use strict';
  const STORAGE_KEY = 'sproto-arcade-story-v1';
  const LEVEL_COUNT = 13;

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
    // Optional: best full-run result per level index. Saves written before ranks existed have no
    // `best`, and a save with no valid entry is written without the key.
    if (raw.best && typeof raw.best === 'object' && !Array.isArray(raw.best)) {
      const best = {};
      for (let level = 0; level < LEVEL_COUNT; level++) {
        const entry = cleanBest(raw.best[level]);
        if (entry) best[level] = entry;
      }
      if (Object.keys(best).length) out.best = best;
    }
    return out;
  }

  // Ranks a full run can earn, best first. Rank C (a clear after a phase-2 checkpoint retry) is
  // shown on the clear screen but never stored.
  const RANKS = ['S', 'A', 'B'];
  const MAX_TICKS = 108000;

  function cleanBest(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const { ticks, hits, rank } = entry;
    if (!Number.isInteger(ticks) || ticks < 1 || ticks > MAX_TICKS) return null;
    if (!Number.isInteger(hits) || hits < 0 || hits > 999) return null;
    if (!RANKS.includes(rank)) return null;
    return { ticks, hits, rank };
  }

  /** True when `a` beats `b`: the better rank, then the lower time, then fewer hits. */
  function betterBest(a, b) {
    if (!b) return Boolean(a);
    if (!a) return false;
    const ra = RANKS.indexOf(a.rank), rb = RANKS.indexOf(b.rank);
    if (ra !== rb) return ra < rb;
    if (a.ticks !== b.ticks) return a.ticks < b.ticks;
    return a.hits < b.hits;
  }

  /**
   * Rank of a clear. S: no hits and at or under par. A: at most two hits and at or under
   * 1.15 x par. B: any other full run. C: a clear after a phase-2 checkpoint retry.
   * `par` is in ticks (story-par.js); without one, time does not limit the rank.
   */
  function rankFor({ ticks, hits, par = Infinity, checkpoint = false }) {
    if (checkpoint) return 'C';
    const limit = Number.isFinite(par) && par > 0 ? par : Infinity;
    if (hits === 0 && ticks <= limit) return 'S';
    if (hits <= 2 && ticks * 100 <= limit * 115) return 'A';
    return 'B';
  }

  /** Records a full-run result if it beats the stored one. Returns the save, the stored best and whether it changed. */
  function recordBest(save, level, result, now = 0) {
    const next = normalize(save), entry = cleanBest(result);
    if (!entry || !Number.isInteger(level) || level < 0 || level >= LEVEL_COUNT) return { save: next, best: next.best?.[level] ?? null, improved: false };
    const current = next.best?.[level] ?? null;
    if (!betterBest(entry, current)) return { save: next, best: current, improved: false };
    next.best = { ...(next.best || {}), [level]: entry };
    next.updatedAt = Math.max(next.updatedAt, now);
    return { save: normalize(next), best: entry, improved: true };
  }

  function merge(a, b) {
    const x = normalize(a), y = normalize(b);
    // Per level, keep the better result: rank first, then time.
    const best = {};
    for (let level = 0; level < LEVEL_COUNT; level++) {
      const p = x.best?.[level], q = y.best?.[level];
      if (p || q) best[level] = betterBest(q, p) ? q : p;
    }
    return normalize({
      v: 1,
      cleared: [...x.cleared, ...y.cleared],
      unlocked: [...x.unlocked, ...y.unlocked],
      updatedAt: Math.max(x.updatedAt, y.updatedAt),
      best,
    });
  }

  function same(a, b) {
    const x = normalize(a), y = normalize(b);
    return x.cleared.join() === y.cleared.join() && x.unlocked.join() === y.unlocked.join() &&
      JSON.stringify(x.best || {}) === JSON.stringify(y.best || {});
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

  /** Reads a save kept under `key` (default: the device save). The progress store owns these keys;
   * hub-link.js only reads them to migrate older per-player saves. */
  function load(storage, key = STORAGE_KEY) {
    try {
      return normalize(JSON.parse(storage?.getItem(key) ?? 'null'));
    } catch {
      return empty();
    }
  }

  function store(storage, save, key = STORAGE_KEY) {
    try {
      storage?.setItem(key, JSON.stringify(normalize(save)));
    } catch {
      // Private windows and file:// can refuse storage. Progress then lasts for this visit.
    }
  }

  /** Where builds before the hub progress store kept each player's copy. Migrated into that
   * player's account on their next hub visit (hub-link.js), then removed. */
  const legacyPlayerKey = (playerId) => `${STORAGE_KEY}:${playerId}`;

  /**
   * The save as a hub SDK ProgressModel. `merge` unions clears and unlocks, keeps the better
   * result per level (a total order: rank, then time, then hits) and the later updatedAt, so it is
   * commutative, associative and idempotent. The cloud form is the save itself, the same shape the
   * cloud save has always had, so existing accounts load unchanged.
   */
  const MODEL = { empty, normalize, merge };

  root.ArcadeProgress = { STORAGE_KEY, legacyPlayerKey, MODEL, LEVEL_COUNT, UNLOCKS, empty, normalize, merge, same, recordClear, recordBest, rankFor, betterBest, RANKS, isUnlocked, lockReason, load, store };
})(typeof window !== 'undefined' ? window : globalThis);
