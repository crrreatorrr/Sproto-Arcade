/* Sproto Arcade ↔ metaverse hub. Classic script; needs vendor/hub-sdk/hub-sdk.iife.js and
 * story-progress.js first. Opened from the Bar cabinet the page carries a one-time `#t=` ticket:
 * the SDK redeems it (the login) and every call below talks to the hub. Opened directly or from
 * file://, init finds no session and the game plays offline with local progress only.
 *
 *  - First story boss (level 1, Fat Head Dave, boss id `bront`): reports `arcade.boss_defeated`,
 *    god mode included. The server grants the Breakwater Coin once.
 *  - Every boss/level clear without god mode: 20 Tickets (`arcade_clear`).
 *  - Progress (cleared levels, unlocked Sprotos): local save merged with the cloud save. */
(function (root) {
  'use strict';
  const GAME_ID = 'sproto-arcade';
  const RELIC = 'breakwater_coin';
  const BOSS_EVENT = 'arcade.boss_defeated';
  const FIRST_BOSS = { level: 0, boss: 'bront' };
  const CLEAR_REASON = 'arcade_clear';
  const TICKETS_PER_CLEAR = 20;
  // Per-player keys, so a shared browser never carries one account's progress, queued writes or
  // Relics into another's. The device (guest) save holds progress made before any hub sign-in; the
  // first account to sign in on this browser takes it over. Offline, the last signed-in player's
  // copy is shown and topped up, and it syncs when that player signs in again.
  const PENDING_PREFIX = 'sproto-arcade-hub-pending-v1:';
  const RELIC_PREFIX = 'sproto-arcade-hub-relics:';
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
  const listeners = new Set();
  let player = readJson(LAST_PLAYER_KEY, null);
  if (typeof player !== 'string' || !player) player = null;
  const saveKey = () => (player ? P.playerKey(player) : P.STORAGE_KEY);
  const state = {
    status: 'offline', // offline | connecting | online | error
    relics: player ? readJson(RELIC_PREFIX + player, []).filter((r) => typeof r === 'string') : [],
    tickets: null,
    save: P.load(storage, saveKey()),
    message: '',
    unlockAll: /(?:^|[?&])unlockAll=1(?:&|$)/.test(root.location?.search ?? ''),
  };
  let sdk = null;
  // Every flush and cloud write runs on this chain, one at a time.
  let syncing = Promise.resolve();
  const queue = (job) => (syncing = syncing.then(job).catch((e) => console.warn('hub sync failed', e)));

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
      const result = await sdk.reportEvent(BOSS_EVENT, { boss: row.boss }, row.key);
      if (result?.granted === RELIC && !state.relics.includes(RELIC)) {
        state.relics = [...state.relics, RELIC];
        writeJson(RELIC_PREFIX + player, state.relics);
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

  async function pushSave() {
    if (!connected() || !sdk.writeSave) return;
    try {
      await sdk.writeSave(P.normalize(state.save));
    } catch (e) {
      console.warn('cloud save failed', e);
    }
  }

  async function connect() {
    if (!root.HubSdk?.createHubSdk) return;
    state.status = 'connecting';
    emit();
    try {
      sdk = root.HubSdk.createHubSdk({ serverUrl: config.serverUrl, serverKey: config.serverKey, hubUrl: config.hubUrl });
      const init = await sdk.init(GAME_ID);
      const session = sdk.getSession?.();
      if (!session || !init?.playerId) {
        state.status = 'offline';
        sdk = null;
        emit();
        return;
      }
      const previous = readJson(LAST_PLAYER_KEY, null);
      player = String(init.playerId);
      let local = P.load(storage, P.playerKey(player));
      if (!previous) {
        // First sign-in on this browser: this account takes over the guest progress.
        local = P.merge(local, P.load(storage));
        P.store(storage, P.empty());
      }
      writeJson(LAST_PLAYER_KEY, player);
      state.save = local;
      state.status = 'online';
      state.relics = Array.isArray(init.relics) ? [...init.relics] : [];
      writeJson(RELIC_PREFIX + player, state.relics);
      try {
        const cloud = sdk.loadSave ? await sdk.loadSave() : null;
        const merged = P.merge(state.save, cloud?.data);
        state.save = merged;
        P.store(storage, merged, saveKey());
        if (!P.same(merged, cloud?.data)) await queue(pushSave);
      } catch (e) {
        P.store(storage, state.save, saveKey());
        console.warn('cloud save unavailable', e);
      }
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
      emit();
    }
  }

  /**
   * Called by game.js when a level is cleared. `god` is true when god mode was on at any point in
   * that level. Returns the Sproto ids this clear unlocked.
   */
  function levelCleared(level, god) {
    const { save, opened } = P.recordClear(state.save, level, Date.now());
    state.save = save;
    P.store(storage, save, saveKey());
    // Only clears made during a hub session are sent. Offline clears still count for local progress.
    if (connected()) {
      const rows = [];
      if (level === FIRST_BOSS.level && !state.relics.includes(RELIC)) {
        rows.push({ type: 'relic', boss: FIRST_BOSS.boss, key: `${BOSS_EVENT}:${FIRST_BOSS.boss}:${uuid()}` });
      }
      if (!god) rows.push({ type: 'tickets', amount: TICKETS_PER_CLEAR, level, key: `arcade:clear:${level}:${uuid()}` });
      addPending(rows);
      queue(flush);
      queue(pushSave);
    }
    emit();
    return opened;
  }

  root.ArcadeHub = {
    GAME_ID,
    RELIC,
    TICKETS_PER_CLEAR,
    get state() {
      return state;
    },
    connected,
    levelCleared,
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
