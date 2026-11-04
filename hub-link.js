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
  const PENDING_KEY = 'sproto-arcade-hub-pending-v1';
  const RELIC_CACHE_KEY = 'sproto-arcade-hub-relics';
  // hub-config.js sets window.SPROTO_ARCADE_HUB = { serverUrl, serverKey, hubUrl } before this
  // script (dev key locally, the production key in dist/). serverUrl '' is same-origin /v2, as on
  // play.<domain> and the hub dev proxy.
  const config = { serverUrl: '', serverKey: '', hubUrl: '/hub/', ...(root.SPROTO_ARCADE_HUB || {}) };

  const P = root.ArcadeProgress;
  const storage = (() => {
    try {
      return root.localStorage;
    } catch {
      return null;
    }
  })();
  const listeners = new Set();
  const state = {
    status: 'offline', // offline | connecting | online | error
    relics: readJson(RELIC_CACHE_KEY, []).filter((r) => typeof r === 'string'),
    tickets: null,
    save: P.load(storage),
    message: '',
    unlockAll: /(?:^|[?&])unlockAll=1(?:&|$)/.test(root.location?.search ?? ''),
  };
  let sdk = null;
  let syncing = Promise.resolve();

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
  const connected = () => state.status === 'online' && Boolean(sdk?.getSession?.());

  /** Writes that must reach the server survive reloads until acked (the SDK's own outbox covers a live session). */
  function pending() {
    const rows = readJson(PENDING_KEY, []);
    return Array.isArray(rows) ? rows.filter((r) => r && typeof r.key === 'string') : [];
  }
  function setPending(rows) {
    writeJson(PENDING_KEY, rows.slice(-32));
  }

  async function send(row) {
    if (row.type === 'relic') {
      const result = await sdk.reportEvent(BOSS_EVENT, { boss: row.boss }, row.key);
      if (result?.granted === RELIC && !state.relics.includes(RELIC)) {
        state.relics = [...state.relics, RELIC];
        writeJson(RELIC_CACHE_KEY, state.relics);
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
    const rows = pending();
    const left = [];
    for (const row of rows) {
      try {
        await send(row);
      } catch (e) {
        const code = e?.code ?? '';
        // Caps and rule refusals are final; anything else (network) stays queued.
        if (!/cap|unknown_reason|amount_over_rule|bad_|duplicate|idem/.test(String(code))) left.push(row);
      }
    }
    setPending(left);
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
      if (!sdk.getSession?.()) {
        state.status = 'offline';
        sdk = null;
        emit();
        return;
      }
      state.status = 'online';
      state.relics = Array.isArray(init?.relics) ? [...init.relics] : [];
      writeJson(RELIC_CACHE_KEY, state.relics);
      try {
        const cloud = sdk.loadSave ? await sdk.loadSave() : null;
        const merged = P.merge(state.save, cloud?.data);
        const changed = !P.same(merged, cloud?.data);
        state.save = merged;
        P.store(storage, merged);
        if (changed) await pushSave();
      } catch (e) {
        console.warn('cloud save unavailable', e);
      }
      try {
        state.tickets = (await sdk.getTicketBalance()).balance;
      } catch {
        state.tickets = null;
      }
      emit();
      await flush();
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
    P.store(storage, save);
    const rows = pending();
    if (level === FIRST_BOSS.level && !state.relics.includes(RELIC)) {
      rows.push({ type: 'relic', boss: FIRST_BOSS.boss, key: `${BOSS_EVENT}:${FIRST_BOSS.boss}:${uuid()}` });
    }
    if (!god) rows.push({ type: 'tickets', amount: TICKETS_PER_CLEAR, level, key: `arcade:clear:${level}:${uuid()}` });
    // Only clears made during a hub session are sent. Offline clears still count for local progress.
    if (connected()) {
      setPending(rows);
      syncing = syncing.then(flush).then(pushSave);
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
    ready: connect(),
  };
})(window);
