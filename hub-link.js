/* Sproto Arcade ↔ metaverse hub. Classic script; needs vendor/hub-sdk/hub-sdk.iife.js and
 * story-progress.js first. Opened from the Bar cabinet the page carries a one-time `#t=` ticket:
 * the SDK redeems it (the login) and every call below talks to the hub. Opened directly or from
 * file://, init finds no session and the game plays offline with local progress only.
 *
 *  - First story boss (level 1, Fat Head Dave, boss id `bront`): every clear reports
 *    `arcade.boss_defeated`, including god mode and phase-2 retries. The server grants the Breakwater Coin once.
 *  - Every full boss/level clear without god mode: 20 Tickets (`arcade_clear`).
 *  - Progress (cleared levels, unlocked Sprotos, best results) lives in the hub SDK's progress
 *    store. It belongs to whoever earned it: the hub account during a hub visit (kept in this
 *    browser under the player's own key and synced to their cloud save, so it loads on any
 *    device), or this browser for play outside the hub. Browser progress never moves into an
 *    account, and one account's progress never shows for another. */
(function (root) {
  'use strict';
  const GAME_ID = 'sproto-arcade';
  const RELIC = 'breakwater_coin';
  const BOSS_EVENT = 'arcade.boss_defeated';
  const FIRST_BOSS = { level: 0, boss: 'bront' };
  const CLEAR_REASON = 'arcade_clear';
  const TICKETS_PER_CLEAR = 20;
  // A replay log larger than this is not attached (docs/SERVER-SIM.md).
  const MAX_REPLAY_BYTES = 32768;
  // Per-player outbox, so a shared browser never sends one account's queued writes as another.
  // Relics come from the hub's init during a hub visit; play outside the hub uses none. (Builds
  // before the progress store also cached them under sproto-arcade-hub-relics:<player>.)
  const PENDING_PREFIX = 'sproto-arcade-hub-pending-v1:';
  // Builds before the progress store showed the last signed-in player's copy outside the hub.
  // Play outside the hub is device progress now, so the key is no longer read; it is removed.
  const LAST_PLAYER_KEY = 'sproto-arcade-hub-last-player';
  // hub-config.js sets window.SPROTO_ARCADE_HUB = { serverUrl, serverKey, hubUrl } before this
  // script (dev key locally, the production key in dist/). serverUrl '' is same-origin /v2, as on
  // play.<domain> and the hub dev proxy. An empty hubUrl is derived from this page's host.
  const config = { serverUrl: '', serverKey: '', hubUrl: '', ...(root.SPROTO_ARCADE_HUB || {}) };
  if (!config.hubUrl) config.hubUrl = hubUrlFor(root.location);

  /** play.<domain> serves the games and <domain>/hub/ the plaza; anywhere else (dev) the hub is same-origin. */
  function hubUrlFor(loc) {
    const host = loc?.hostname ?? '';
    if (/^play\./.test(host)) return `${loc.protocol}//${host.slice(5)}${loc.port ? `:${loc.port}` : ''}/hub/`;
    return '/hub/';
  }

  const P = root.ArcadeProgress;
  const storage = (() => {
    try {
      return root.localStorage;
    } catch {
      return null;
    }
  })();
  const sessionStore = (() => {
    try {
      return root.sessionStorage ?? undefined;
    } catch {
      return undefined;
    }
  })();
  const listeners = new Set();
  /** The hub account of this visit, set only while init gives a live session. */
  let player = null;
  try {
    storage?.removeItem(LAST_PLAYER_KEY);
  } catch {
    /* storage refused */
  }
  const H = root.HubSDK;
  const progress = H?.createProgressStore
    ? H.createProgressStore({
        key: P.STORAGE_KEY,
        model: P.MODEL,
        storage,
        onError: (e) => console.warn('cloud save failed', e),
      })
    : deviceOnlyStore(P.STORAGE_KEY, P.MODEL, storage);
  // A portal ticket or a live session from earlier in this tab: until init says whose visit this
  // is, progress is held in memory, so it never lands in this browser's device copy by mistake.
  if (H?.hubVisitStarting?.(GAME_ID, root.location?.hash ?? '', sessionStore)) progress.hold();
  progress.subscribe(() => emit());
  root.addEventListener?.('storage', (e) => {
    if (progress.watches(e.key)) progress.refresh();
  });
  const state = {
    status: 'offline', // offline | connecting | online | error
    relics: [],
    tickets: null,
    /** The current progress (read-only): the account's during a hub visit, this browser's otherwise. */
    get save() {
      return progress.get();
    },
    message: '',
    lastReplay: null,
    unlockAll: /(?:^|[?&])unlockAll=1(?:&|$)/.test(root.location?.search ?? ''),
  };
  let sdk = null;
  // The last SDK created, kept even when there is no session: feedback-link.js builds the feedback
  // transport on it, and without a session that transport answers with a one-line message.
  let lastSdk = null;
  // Every flush and cloud write runs on this chain, one at a time.
  let syncing = Promise.resolve();
  const queue = (job) => (syncing = syncing.then(job).catch((e) => console.warn('hub sync failed', e)));

  /** Stand-in for when the SDK script did not load: this browser's progress only, never synced. */
  function deviceOnlyStore(key, model, kv) {
    const read = () => {
      try {
        return model.normalize(JSON.parse(kv?.getItem(key) ?? 'null'));
      } catch {
        return model.empty();
      }
    };
    let value = read();
    let saved = Boolean(kv);
    const subs = new Set();
    const notify = () => subs.forEach((fn) => fn());
    return {
      get: () => value,
      owner: () => ({ kind: 'device' }),
      sync: () => 'local',
      persistent: () => saved,
      update(advance) {
        value = model.merge(model.merge(value, read()), model.normalize(advance(value)));
        try {
          kv.setItem(key, JSON.stringify(value));
          saved = true;
        } catch {
          saved = false;
        }
        notify();
        return value;
      },
      refresh() {
        value = model.merge(value, read());
        notify();
      },
      watches: (changed) => changed === null || changed === key,
      subscribe(fn) {
        subs.add(fn);
        return () => subs.delete(fn);
      },
      hold() {},
      release() {},
      attach: async () => {},
      flush: async () => {},
    };
  }

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(storage?.getItem(key) ?? 'null');
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }
  function writeJson(key, value) {
    try {
      storage?.setItem(key, JSON.stringify(value));
    } catch {
      /* storage refused */
    }
  }
  function emit() {
    for (const fn of listeners) {
      try {
        fn(state);
      } catch (e) {
        console.error(e);
      }
    }
  }
  function uuid() {
    return root.crypto?.randomUUID ? root.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
  const connected = () => state.status === 'online' && Boolean(player) && Boolean(sdk?.getSession?.());

  /** Writes that must reach the server survive reloads until acked (the SDK's own outbox covers a live session). */
  function pending() {
    if (!player) return [];
    const rows = readJson(PENDING_PREFIX + player, []);
    return Array.isArray(rows) ? rows.filter((r) => r && typeof r.key === 'string') : [];
  }
  function addPending(rows) {
    if (player && rows.length) writeJson(PENDING_PREFIX + player, [...pending(), ...rows].slice(-32));
  }
  /** Removes only the given keys, re-reading storage so rows added meanwhile survive. */
  function dropPending(keys) {
    if (!player || !keys.size) return;
    writeJson(PENDING_PREFIX + player, pending().filter((r) => !keys.has(r.key)));
  }

  async function send(row) {
    if (row.type === 'relic') {
      // The replay log rides in the event data (docs/SERVER-SIM.md); the SDK passes data through.
      const data = row.replay ? { boss: row.boss, replay: row.replay } : { boss: row.boss };
      const result = await sdk.reportEvent(BOSS_EVENT, data, row.key);
      if (result?.granted === RELIC && !state.relics.includes(RELIC)) {
        state.relics = [...state.relics, RELIC];
        state.message = 'Breakwater Coin earned! It now shows in the hub and unlocks gear in the other games.';
      }
    } else if (row.type === 'tickets') {
      const result = await sdk.earnTickets(row.amount, CLEAR_REASON, row.key);
      if (typeof result?.balance === 'number') state.tickets = result.balance;
      if (result?.capped) state.message = 'Ticket cap reached for today.';
    }
  }

  async function flush() {
    if (!connected()) return;
    const done = new Set();
    for (const row of pending()) {
      try {
        await send(row);
        done.add(row.key);
      } catch (e) {
        const code = e?.code ?? '';
        // Caps and rule refusals are final; anything else (network) stays queued.
        if (/cap|unknown_reason|amount_over_rule|bad_|duplicate|idem/.test(String(code))) done.add(row.key);
      }
    }
    dropPending(done);
    emit();
  }

  /**
   * Builds before the progress store kept each player's copy under P.legacyPlayerKey(player),
   * including clears made outside the hub while that player was the last to sign in here. That
   * progress was earned as this player, so it moves into their account, and the old key goes.
   */
  function migrateLegacyPlayerSave(playerId) {
    const key = P.legacyPlayerKey(playerId);
    let raw = null;
    try {
      raw = storage?.getItem(key) ?? null;
    } catch {
      return;
    }
    if (raw === null) return;
    const old = P.load(storage, key);
    progress.update((save) => P.merge(save, old));
    if (progress.persistent()) {
      try {
        storage.removeItem(key);
      } catch {
        /* kept; merging it again changes nothing */
      }
    }
  }

  async function connect() {
    if (!H?.createHubSdk) {
      progress.release();
      return;
    }
    state.status = 'connecting';
    emit();
    try {
      sdk = root.HubSDK.createHubSdk({ serverUrl: config.serverUrl, serverKey: config.serverKey, hubUrl: config.hubUrl });
      lastSdk = sdk;
      const init = await sdk.init(GAME_ID);
      const session = sdk.getSession?.();
      if (!session || !init?.playerId) {
        // Standalone: anything held while init ran is this browser's progress.
        state.status = 'offline';
        sdk = null;
        progress.release();
        emit();
        return;
      }
      player = String(init.playerId);
      state.status = 'online';
      state.relics = Array.isArray(init.relics) ? [...init.relics] : [];
      // The account's own copy plus its cloud save, and anything won while init ran. The device
      // copy is not touched: progress made outside the hub stays with this browser.
      const attached = progress.attach(sdk, player);
      migrateLegacyPlayerSave(player);
      await attached;
      try {
        state.tickets = (await sdk.getTicketBalance()).balance;
      } catch {
        state.tickets = null;
      }
      emit();
      await queue(flush);
    } catch (e) {
      console.warn('hub connect failed', e);
      state.status = 'error';
      sdk = null;
      // A failed sign-in plays on as this browser; an attached account keeps its progress.
      if (progress.owner().kind !== 'account') progress.release();
      emit();
    }
  }

  /** The run's replay log with its claim set to `kind`, or null when there is none or it is too big. */
  function claimed(replay, kind) {
    if (!replay || typeof replay !== 'object') return null;
    const log = { ...replay, claimed: { ...(replay.claimed || {}), kind } };
    try {
      if (JSON.stringify(log).length > MAX_REPLAY_BYTES) return null;
    } catch {
      return null;
    }
    return log;
  }

  /**
   * Progress half of a clear, called by game.js for every clear (full runs and phase-2 checkpoint
   * runs alike). Records the cleared level and any Sprotos it opens for whoever owns the progress
   * now: the hub account (its cloud save follows shortly) or this browser. Sends no hub events.
   * `level` is the 0-based LEVELS index. Returns the Sproto ids this clear unlocked.
   */
  function recordLocalClear(level) {
    let opened = [];
    progress.update((save) => {
      const next = P.recordClear(save, level, Date.now());
      opened = next.opened;
      return next.save;
    });
    return opened;
  }

  /**
   * Stores a full run's result ({ticks, hits, rank}) as the level's best if it beats the saved
   * one, through the progress store like every other change. Checkpoint and god-mode clears never
   * reach here. Returns { best, improved }.
   */
  function recordBest(level, result) {
    const first = P.recordBest(progress.get(), level, result, Date.now());
    if (!first.improved) return { best: first.best, improved: false };
    let out = first;
    progress.update((save) => {
      out = P.recordBest(save, level, result, Date.now());
      return out.save;
    });
    return { best: out.best, improved: out.improved };
  }

  /**
   * Reports every first-boss win, including phase-2 retries, while connected to the hub.
   * Only full runs can earn Tickets. Progress reaches the cloud save through the progress store. `god` is true when god mode was on
   * at any point in the level, and `replay` is the full run's input log (runtime/story/replay.js).
   */
  function reportHubClear(level, god, replay, { checkpoint = false } = {}) {
    const firstBoss = level === FIRST_BOSS.level;
    if (checkpoint && !firstBoss) return;
    state.lastReplay = claimed(replay, 'clear');
    // Only clears made during a hub session are sent. Offline clears still count for local progress.
    if (connected()) {
      // ID13 is locally playable; the external hub still accepts the original12.
      if (level >= 12) {
        emit();
        return;
      }
      const rows = [];
      if (firstBoss) {
        const log = claimed(replay, 'boss');
        rows.push({ type: 'relic', boss: FIRST_BOSS.boss, key: `${BOSS_EVENT}:${FIRST_BOSS.boss}:${uuid()}`, ...(log ? { replay: log } : {}) });
      }
      // earnTickets(amount, reason, key) has no data field, so the clear's log cannot ride along.
      // It stays in state.lastReplay (not on the stored row, to keep the outbox small).
      if (!checkpoint && !god) rows.push({ type: 'tickets', amount: TICKETS_PER_CLEAR, level, key: `arcade:clear:${level}:${uuid()}` });
      addPending(rows);
      queue(flush);
    }
    emit();
  }

  root.ArcadeHub = {
    GAME_ID,
    RELIC,
    TICKETS_PER_CLEAR,
    get state() {
      return state;
    },
    connected,
    get sdk() {
      return lastSdk;
    },
    /** The progress store (hub SDK createProgressStore): owner(), sync(), flush() for checks. */
    progress,
    recordLocalClear,
    recordBest,
    reportHubClear,
    isUnlocked: (id) => P.isUnlocked(id, state.save, state.relics, state.unlockAll),
    // levels.js declares LEVELS with const, so it is a global binding but not a window property.
    lockReason: (id) => P.lockReason(id, typeof LEVELS !== 'undefined' ? LEVELS : undefined),
    onChange(fn) {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
    exit() {
      if (sdk && connected()) sdk.exit('return');
    },
    hubUrl: config.hubUrl,
    hubUrlFor,
    ready: connect(),
  };
})(window);
