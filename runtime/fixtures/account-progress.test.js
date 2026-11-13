/* Story progress belongs to whoever earned it (hub-link.js + story-progress.js on the vendored hub
 * SDK's createProgressStore). Runs the real scripts and the real SDK bundle in a vm "browser"; only
 * createHubSdk is replaced by a fake whose cloud saves live on a shared fake server, so two
 * browsers can play as the same account. Node only. */
'use strict';
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const SDK_SOURCE = fs.readFileSync(path.join(root, 'vendor/hub-sdk/hub-sdk.iife.js'), 'utf8');
const SCRIPTS = ['story-progress.js', 'hub-link.js'].map((f) => [f, fs.readFileSync(path.join(root, f), 'utf8')]);
const KEY = 'sproto-arcade-story-v1';
const plain = (v) => JSON.parse(JSON.stringify(v));
const settle = async (n = 5) => { for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 0)); };

function memoryStorage(seed = {}) {
  const items = new Map(Object.entries(seed));
  return {
    items,
    getItem: (k) => (items.has(k) ? items.get(k) : null),
    setItem: (k, v) => { items.set(k, String(v)); },
    removeItem: (k) => { items.delete(k); },
  };
}

/** The hub server's per-player cloud saves, shared by every browser in a test. */
function server(seed = {}) {
  const saves = new Map(Object.entries(seed).map(([p, data]) => [p, { data, updatedAt: 1 }]));
  return { saves, writes: [] };
}

/**
 * One browser page. `visit`: null plays outside the hub (no ticket, init finds no session);
 * a player id comes in from the hub with a ticket. `gate` delays init until it resolves.
 */
function page({ storage = memoryStorage(), hub = server(), visit = null, hash, gate } = {}) {
  const listeners = {};
  const ctx = vm.createContext({
    console, setTimeout, clearTimeout, TextEncoder, TextDecoder, URL, URLSearchParams, Date, JSON, Promise,
    localStorage: storage,
    sessionStorage: memoryStorage(),
    location: { hostname: 'localhost', protocol: 'http:', port: '', search: '', hash: hash ?? (visit ? '#t=ticket' : '') },
    crypto: { randomUUID: () => Math.random().toString(36).slice(2) },
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
  });
  ctx.window = ctx;
  vm.runInContext(`${SDK_SOURCE};window.HubSDK=HubSDK;`, ctx, { filename: 'hub-sdk.iife.js' });
  const real = ctx.HubSDK;
  ctx.HubSDK = Object.assign({}, real, {
    createHubSdk: () => ({
      async init() {
        if (gate) await gate;
        return { playerId: visit ?? 'anon', relics: [] };
      },
      getSession: () => (visit ? { token: 't', playerId: visit } : null),
      async loadSave() { return hub.saves.get(visit) ?? { data: null, updatedAt: 0 }; },
      async writeSave(data) {
        const copy = plain(data);
        hub.writes.push([visit, copy]);
        hub.saves.set(visit, { data: copy, updatedAt: Date.now() });
        return hub.saves.get(visit);
      },
      async getTicketBalance() { return { balance: 0 }; },
      async earnTickets(amount) { return { balance: amount }; },
      async reportEvent() { return {}; },
      exit() {},
    }),
  });
  for (const [f, src] of SCRIPTS) vm.runInContext(src, ctx, { filename: f });
  const fire = (type, event) => (listeners[type] || []).forEach((fn) => fn(event));
  return { hub: ctx.ArcadeHub, P: ctx.ArcadeProgress, SDK: real, storage, server: hub, fire };
}
const stored = (storage, key) => JSON.parse(storage.getItem(key) ?? 'null');

(async () => {
  // Merge is commutative, associative and idempotent over random saves (the store relies on it).
  {
    const { P } = page();
    let seed = 7;
    const rnd = (n) => ((seed = (seed * 1103515245 + 12345) % 2147483648) % n);
    const ranks = ['S', 'A', 'B'], ids = Object.keys(P.UNLOCKS);
    const random = () => {
      const best = {};
      for (let l = 0; l < P.LEVEL_COUNT; l++) if (rnd(3) === 0) best[l] = { ticks: 1 + rnd(5), hits: rnd(3), rank: ranks[rnd(3)] };
      return P.normalize({ cleared: [rnd(13), rnd(13)], unlocked: [ids[rnd(4)]], updatedAt: rnd(9), best });
    };
    const m = P.MODEL.merge;
    for (let i = 0; i < 300; i++) {
      const a = random(), b = random(), c = random();
      assert.deepEqual(plain(m(a, b)), plain(m(b, a)), 'commutative');
      assert.deepEqual(plain(m(m(a, b), c)), plain(m(a, m(b, c))), 'associative');
      assert.deepEqual(plain(m(a, a)), plain(a), 'idempotent');
    }
  }

  // The largest possible save fits the cloud cap with plenty of room.
  {
    const { P, SDK } = page();
    const best = {};
    for (let l = 0; l < P.LEVEL_COUNT; l++) best[l] = { ticks: 108000, hits: 999, rank: 'B' };
    const max = P.normalize({ cleared: [...Array(P.LEVEL_COUNT).keys()], unlocked: Object.keys(P.UNLOCKS), updatedAt: 8.64e15, best });
    assert.equal(Object.keys(max.best).length, P.LEVEL_COUNT);
    const bytes = new TextEncoder().encode(SDK.encodeSave(max)).length;
    assert.equal(SDK.SAVE_MAX_BYTES, 16384);
    assert.ok(bytes * 8 < SDK.SAVE_MAX_BYTES, `largest save is ${bytes} bytes, well under ${SDK.SAVE_MAX_BYTES}`);
  }

  // Account isolation: a new account on a used browser starts empty.
  {
    const storage = memoryStorage(), hub = server();
    const a = page({ storage, hub, visit: 'p1' });
    await a.hub.ready;
    assert.equal(a.hub.progress.owner().kind, 'account');
    a.hub.recordLocalClear(1);
    a.hub.recordBest(1, { ticks: 900, hits: 0, rank: 'S' });
    await a.hub.progress.flush();
    assert.deepEqual(plain(stored(storage, `${KEY}@p1`).cleared), [1]);
    assert.deepEqual(plain(hub.saves.get('p1').data.cleared), [1], "p1's clear reached p1's cloud save");
    const b = page({ storage, hub, visit: 'p2' });
    await b.hub.ready;
    assert.deepEqual(plain(b.hub.state.save), plain(b.P.empty()), 'p2 starts from its own (empty) save');
    assert.equal(b.hub.isUnlocked('morelight'), false, "p1's unlock is not p2's");
    assert.ok(!hub.writes.some(([who]) => who === 'p2'), 'nothing written to p2 without progress');
    assert.equal(storage.getItem(KEY), null, 'account play leaves the device copy alone');
  }

  // Device progress never reaches an account, and account progress never shows outside the hub.
  {
    const storage = memoryStorage(), hub = server();
    const offline = page({ storage, hub });
    await offline.hub.ready;
    assert.equal(offline.hub.progress.owner().kind, 'device');
    assert.deepEqual(plain(offline.hub.recordLocalClear(1)), ['morelight']);
    assert.deepEqual(plain(stored(storage, KEY).cleared), [1]);
    const online = page({ storage, hub, visit: 'p1' });
    await online.hub.ready;
    assert.deepEqual(plain(online.hub.state.save.cleared), [], 'the first account on this browser does not take the device progress');
    online.hub.recordLocalClear(4);
    await online.hub.progress.flush();
    assert.deepEqual(plain(hub.saves.get('p1').data.cleared), [4]);
    assert.ok(hub.writes.every(([, data]) => !data.cleared.includes(1)), 'device clears never go to the cloud');
    assert.deepEqual(plain(stored(storage, KEY).cleared), [1], 'device copy unchanged');
    const later = page({ storage, hub });
    await later.hub.ready;
    assert.deepEqual(plain(later.hub.state.save.cleared), [1], 'outside the hub the browser shows its own progress only');
    assert.deepEqual(plain(later.hub.state.relics), [], 'and no account Relics');
  }

  // A second device loads the account's cloud save; its wins merge back without losing the first's.
  {
    const hub = server();
    const deviceA = page({ hub, visit: 'p1' });
    await deviceA.hub.ready;
    deviceA.hub.recordLocalClear(5);
    deviceA.hub.recordBest(5, { ticks: 4000, hits: 1, rank: 'A' });
    await deviceA.hub.progress.flush();
    const deviceB = page({ hub, visit: 'p1' });
    await deviceB.hub.ready;
    assert.deepEqual(plain(deviceB.hub.state.save.cleared), [5], 'cloud progress loads on a fresh browser');
    assert.deepEqual(plain(deviceB.hub.state.save.best[5]), { ticks: 4000, hits: 1, rank: 'A' });
    assert.equal(deviceB.hub.isUnlocked('sproto831'), true);
    assert.equal(deviceB.hub.progress.sync(), 'synced');
    deviceB.hub.recordLocalClear(8);
    deviceB.hub.recordBest(5, { ticks: 3000, hits: 0, rank: 'S' });
    await deviceB.hub.progress.flush();
    deviceA.hub.recordLocalClear(0);
    await deviceA.hub.progress.flush();
    const cloud = hub.saves.get('p1').data;
    assert.deepEqual(plain(cloud.cleared), [0, 5, 8], 'both devices\' clears survive');
    assert.deepEqual(plain(cloud.best[5]), { ticks: 3000, hits: 0, rank: 'S' }, 'the better record wins');
  }

  // Wins made while init is still running (pending) go to the account, not the device.
  {
    const storage = memoryStorage(), hub = server();
    let open;
    const gate = new Promise((r) => { open = r; });
    const p = page({ storage, hub, visit: 'p1', gate });
    assert.equal(p.hub.progress.owner().kind, 'pending', 'a portal ticket holds progress');
    assert.deepEqual(plain(p.hub.recordLocalClear(1)), ['morelight']);
    assert.equal(storage.getItem(KEY), null, 'nothing written to the device while pending');
    open();
    await p.hub.ready;
    assert.equal(p.hub.progress.owner().kind, 'account');
    assert.deepEqual(plain(p.hub.state.save.cleared), [1]);
    assert.deepEqual(plain(stored(storage, `${KEY}@p1`).cleared), [1]);
    assert.deepEqual(plain(hub.saves.get('p1').data.cleared), [1], 'the pending win reached the cloud');
    assert.equal(storage.getItem(KEY), null);
  }

  // A ticket that turns out not to start a session: the held win stays with this browser.
  {
    const storage = memoryStorage();
    let open;
    const gate = new Promise((r) => { open = r; });
    const p = page({ storage, visit: null, hash: '#t=stale', gate });
    assert.equal(p.hub.progress.owner().kind, 'pending');
    p.hub.recordLocalClear(2);
    open();
    await p.hub.ready;
    assert.equal(p.hub.progress.owner().kind, 'device');
    assert.deepEqual(plain(stored(storage, KEY).cleared), [2]);
  }

  // Older keys: the guest save stays device progress; a player's old copy moves to that account only.
  {
    const old = (cleared) => JSON.stringify({ v: 1, cleared, unlocked: [], updatedAt: 1 });
    const storage = memoryStorage({
      [KEY]: old([3]),
      [`${KEY}:p1`]: old([6]),
      [`${KEY}:p2`]: old([7]),
      'sproto-arcade-hub-last-player': JSON.stringify('p1'),
    });
    const hub = server({ p1: { v: 1, cleared: [9], unlocked: ['sproto1815'], updatedAt: 1, best: { 9: { ticks: 5000, hits: 2, rank: 'A' } } } });
    const offline = page({ storage, hub });
    await offline.hub.ready;
    assert.deepEqual(plain(offline.hub.state.save.cleared), [3], 'outside the hub: the guest save only, not the last player\'s copy');
    assert.equal(storage.getItem('sproto-arcade-hub-last-player'), null, 'the last-player pointer is gone');
    const p1 = page({ storage, hub, visit: 'p1' });
    await p1.hub.ready;
    await p1.hub.progress.flush();
    assert.deepEqual(plain(p1.hub.state.save.cleared), [6, 9], "p1's old local copy plus p1's existing cloud save");
    assert.deepEqual(plain(p1.hub.state.save.best[9]), { ticks: 5000, hits: 2, rank: 'A' }, 'existing cloud shape reads unchanged');
    assert.deepEqual(plain(hub.saves.get('p1').data.cleared), [6, 9]);
    assert.equal(storage.getItem(`${KEY}:p1`), null, 'migrated key removed');
    assert.notEqual(storage.getItem(`${KEY}:p2`), null, "p2's old copy waits for p2");
    assert.deepEqual(plain(stored(storage, KEY).cleared), [3], 'guest save untouched');
    const p2 = page({ storage, hub, visit: 'p2' });
    await p2.hub.ready;
    assert.deepEqual(plain(p2.hub.state.save.cleared), [7]);
  }

  // Another tab's save arrives through the storage event.
  {
    const storage = memoryStorage(), hub = server();
    const tab1 = page({ storage, hub, visit: 'p1' });
    const tab2 = page({ storage, hub, visit: 'p1' });
    await tab1.hub.ready; await tab2.hub.ready;
    tab1.hub.recordLocalClear(10);
    assert.equal(tab2.hub.progress.watches(`${KEY}@p1`), true);
    tab2.fire('storage', { key: `${KEY}@p1` });
    assert.deepEqual(plain(tab2.hub.state.save.cleared), [10]);
    assert.equal(tab2.hub.isUnlocked('sproto1668'), true);
    await tab1.hub.progress.flush();
  }

  await settle();
  console.log(JSON.stringify({ status: 'passed', kind: 'account-progress' }));
})().catch((e) => { console.error(e); process.exitCode = 1; });
