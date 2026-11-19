/* Online two-seat co-op for story mode: Arcade co-op protocol v1 (docs/COOP.md), the client side of
 * the hub's `sproto_arcade_coop` Nakama match. Classic script for legacy.html; also loads in Node
 * (module.exports) so qa/coop-net.test.cjs can run two clients against qa/coop-mock-relay.cjs.
 *
 * Lockstep: both peers run the same simulation from the server-issued seed. Each tick needs both
 * seats' 10-bit input frames (runtime/story/replay.js masks). A peer's own frame for tick T is
 * sampled at T-4 (4-tick input delay) and sent in batches every 2 ticks; the server relays it to
 * the other seat, stamping the sender's seat. Every 60 ticks each peer sends its state hash; on a
 * mismatch the server sends OP_DESYNC, seat 0 sends a snapshot and seat 1 restores it.
 * Rewards are never granted here: the server settles a match once and sends OP_OUTCOME. */
(function (root) {
  'use strict';
  const V = 1;
  const MATCH = 'sproto_arcade_coop';
  const GAME_ID = 'sproto-arcade';
  const OP = Object.freeze({ HELLO: 1, LOBBY: 2, START: 3, READY: 4, GO: 5, INPUT: 10, HASH: 11, DESYNC: 12, SNAPSHOT: 13,
    RESULT: 14, OUTCOME: 15, PEER: 16, SEAT_DROP: 17, PING: 18, CANCEL: 19 });
  const RPC = Object.freeze({ CREATE: 'arcade.coop_create', JOIN: 'arcade.coop_join', QUICK: 'arcade.coop_quick' });
  const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const INPUT_DELAY = 4, SEND_EVERY = 2, HASH_EVERY = 60;
  // Remote frames are kept this many ticks ahead of the local tick (the jitter buffer); the story
  // loop runs extra fixed steps to catch up when the buffer is fuller than this.
  const JITTER_TICKS = 6;
  // Frames stay this long after use, so a snapshot from a peer a few ticks behind can replay them.
  const HISTORY_TICKS = 240;
  const RTT_WARN_MS = 160, RTT_BLOCK_QUICK_MS = 250;

  const cleanCode = (text) => String(text ?? '').toUpperCase().split('').filter((c) => CODE_ALPHABET.includes(c)).join('').slice(0, 5);

  /**
   * The lockstep engine for one match, independent of the page and the network.
   * opts: {seat, send(op, payload), maskOf(frame), frameOf(mask), snapshot(), restore(state),
   *        onEvent(type, detail)}
   */
  function createLockstep(opts) {
    const { seat, send, maskOf, frameOf } = opts;
    const other = 1 - seat;
    const masks = [new Map(), new Map()];
    for (let t = 1; t <= INPUT_DELAY; t++) { masks[0].set(t, 0); masks[1].set(t, 0); }
    let nextLocal = INPUT_DELAY + 1, sentThrough = INPUT_DELAY, lastResult = null;
    let drop = null; // {seat, tick} once the server has dropped a seat for good
    let highestRemote = INPUT_DELAY, desyncs = 0, closed = false;
    const frameCache = [];
    const frame = (mask) => frameCache[mask] || (frameCache[mask] = frameOf(mask));
    const emit = (type, detail) => opts.onEvent?.(type, detail);

    function flush(force = false) {
      const pending = nextLocal - 1 - sentThrough;
      if (pending <= 0 || (!force && pending < SEND_EVERY)) return;
      const from = sentThrough + 1, out = [];
      for (let t = from; t < nextLocal; t++) out.push(masks[seat].get(t));
      send(OP.INPUT, { seat, from, frames: out });
      sentThrough = nextLocal - 1;
    }
    return {
      seat,
      /** Records this peer's input for tick `tick + INPUT_DELAY` (once per tick) and sends batches. */
      sample(tick, input) {
        if (closed) return;
        const mask = maskOf(input), before = nextLocal;
        while (nextLocal <= tick + INPUT_DELAY) {
          masks[seat].set(nextLocal, mask);
          nextLocal++;
        }
        // Batches of SEND_EVERY ticks; while waiting on the partner, send whatever is pending.
        flush(nextLocal === before);
      },
      /** OP_INPUT from the server: the other seat's frames (the server stamps `seat`). */
      receive(payload) {
        const s = payload?.seat;
        if (s !== other || !Number.isInteger(payload.from) || !Array.isArray(payload.frames)) return;
        payload.frames.forEach((mask, i) => {
          if (Number.isInteger(mask) && mask >= 0 && mask < 1024) masks[s].set(payload.from + i, mask);
        });
        highestRemote = Math.max(highestRemote, payload.from + payload.frames.length - 1);
      },
      maskFor(s, tick) {
        if (masks[s].has(tick)) return masks[s].get(tick);
        // A dropped seat plays no input from the agreed drop tick on (and nothing it never sent).
        if (drop && s === drop.seat) return 0;
        return undefined;
      },
      ready(tick) { return this.maskFor(0, tick) !== undefined && this.maskFor(1, tick) !== undefined; },
      /** Both seats' frames for `tick`; `dropSeat` is set on the agreed drop tick. */
      take(tick) {
        const out = [frame(this.maskFor(0, tick)), frame(this.maskFor(1, tick))];
        if (drop && drop.tick === tick) out.dropSeat = drop.seat;
        for (const m of masks) for (const t of m.keys()) if (t < tick - HISTORY_TICKS) m.delete(t);
        return out;
      },
      /** How many ticks ahead of `tick` both seats' frames are available (for catch-up). */
      buffered(tick) { let n = 0; while (this.ready(tick + n + 1)) n++; return n; },
      afterTick(tick, hash, mode) {
        if (closed) return;
        if (tick % HASH_EVERY === 0) send(OP.HASH, { tick, hash: hash() });
        if ((mode === 'lost') && lastResult !== 'wipe') { lastResult = 'wipe'; this.sendResult({ status: 'wipe', level: opts.level, tick, god: false }); }
      },
      sendResult(result) { if (!closed) send(OP.RESULT, result); },
      /** OP_DESYNC: seat 0 answers with its state; the server ends the match after the third. */
      desync(payload, tick) {
        desyncs = payload?.count ?? desyncs + 1;
        emit('desync', { tick: payload?.tick, count: desyncs });
        if (seat === 0 && opts.snapshot) send(OP.SNAPSHOT, { tick, state: opts.snapshot() });
      },
      /** OP_SNAPSHOT relayed to seat 1: restore seat 0's state. */
      snapshot(payload) {
        if (seat !== 1 || typeof payload?.state !== 'string') return;
        opts.restore?.(payload.state);
        emit('restored', { tick: payload.tick });
      },
      seatDrop(payload) {
        if (!Number.isInteger(payload?.seat) || !Number.isInteger(payload?.tick)) return;
        drop = { seat: payload.seat, tick: payload.tick };
        emit('seat-drop', drop);
      },
      get desyncs() { return desyncs; },
      get highestRemote() { return highestRemote; },
      close() { closed = true; },
      JITTER_TICKS,
    };
  }

  /**
   * Hub transport: the hub SDK's realtime socket (HubSDK.realtimeFromSdk) on the page's hub session.
   * Returns null without a session (offline play).
   */
  function hubTransport() {
    const H = root.HubSDK, sdk = root.ArcadeHub?.sdk;
    if (!H?.realtimeFromSdk || !sdk) return null;
    const rt = H.realtimeFromSdk(sdk, { game: GAME_ID });
    if (!rt) return null;
    return {
      async rpc(id, body) { await rt.connect(); return rt.rpc(id, body); },
      async join(matchId) {
        await rt.connect();
        const match = await rt.joinMatch({ matchId });
        return {
          send: (op, payload) => match.send(op, JSON.stringify(payload)),
          onMessage: (cb) => match.onMessage((msg) => { let data = null; try { data = msg.json(); } catch { data = null; } cb(Number(msg.opCode), data); }),
          leave: () => match.leave(),
        };
      },
    };
  }

  /**
   * One online session from lobby to outcome. `hooks` connect it to the story page:
   *  start({levelIndex, pilots, seed, seat, names, net}) -> Promise<{go()}>, the sim API (hash,
   *  snapshot, restore), and ui(text) for the lobby panel.
   */
  function createSession({ transport, hooks, now = () => Date.now(), timers = root }) {
    let match = null, lockstep = null, seat = null, start = null, started = false, rtt = null, pingTimer = null;
    const listeners = new Set();
    const state = { phase: 'idle', code: '', seats: [], message: '', outcome: null, peer: null };
    const update = (patch) => { Object.assign(state, patch); for (const cb of listeners) cb(state); };

    function send(op, payload) { match?.send(op, payload); }
    function onMessage(op, data) {
      switch (op) {
        case OP.LOBBY:
          update({ phase: 'lobby', code: data?.code ?? state.code, seats: Array.isArray(data?.seats) ? data.seats : [] });
          break;
        case OP.START: {
          if (started) return;
          started = true;
          seat = data.seat;
          start = data;
          update({ phase: 'loading' });
          const net = api;
          lockstep = createLockstep({
            seat, level: LEVEL_IDS[data.levelIndex], send,
            maskOf: hooks.maskOf, frameOf: hooks.frameOf,
            snapshot: hooks.snapshot, restore: hooks.restore,
            onEvent: (type, detail) => update({ message: type === 'desync' ? 'Resyncing with your partner…' : type === 'seat-drop' ? 'Your partner left. Boss health returns to solo.' : state.message, lastEvent: { type, ...detail } }),
          });
          Promise.resolve(hooks.start({ levelIndex: data.levelIndex, pilots: data.pilots, seed: data.seed >>> 0, seat, names: data.names, net }))
            .then((run) => { api.run = run; send(OP.READY, {}); update({ phase: 'ready' }); })
            .catch(() => { update({ phase: 'error', message: 'Could not load the level.' }); api.close(); });
          break;
        }
        case OP.GO:
          if (api.run) { update({ phase: 'play' }); api.run.go(); }
          break;
        case OP.INPUT: lockstep?.receive(data); break;
        case OP.DESYNC: lockstep?.desync(data, hooks.tick?.() ?? 0); break;
        case OP.SNAPSHOT: lockstep?.snapshot(data); break;
        case OP.SEAT_DROP: lockstep?.seatDrop(data); break;
        case OP.PEER: update({ peer: data, message: data?.present ? '' : 'Partner disconnected · waiting ' + (data?.graceS ?? 15) + ' s' }); break;
        case OP.PING:
          if (data && Number.isFinite(data.c)) { rtt = Math.max(0, now() - data.c); update({ rtt }); }
          break;
        case OP.OUTCOME: update({ phase: 'done', outcome: data }); hooks.outcome?.(data); break;
        case OP.CANCEL: update({ phase: 'cancelled', message: 'Match cancelled: ' + (data?.reason ?? 'unknown') }); hooks.cancel?.(data); break;
      }
    }
    async function enter(matchId, extra = {}) {
      match = await transport.join(matchId);
      match.onMessage(onMessage);
      send(OP.HELLO, { v: V, pilot: hooks.pilot(), level: hooks.level() });
      update({ phase: 'lobby', ...extra });
      pingTimer = timers.setInterval?.(() => send(OP.PING, { c: now() }), 2000) ?? null;
      send(OP.PING, { c: now() });
    }
    const api = {
      state,
      onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
      async create() {
        if (hooks.level() == null) throw Object.assign(Error('Online co-op covers the boss levels: pick one in Start at.'), { code: 'bad_level' });
        const placed = await transport.rpc(RPC.CREATE, { level: hooks.level(), pilot: hooks.pilot() });
        await enter(placed.match_id ?? placed.matchId, { code: placed.code ?? '' });
      },
      async join(code) {
        const clean = cleanCode(code);
        if (clean.length !== 5) throw Object.assign(Error('A room code is 5 characters.'), { code: 'bad_code' });
        let placed;
        try { placed = await transport.rpc(RPC.JOIN, { code: clean }); } catch (e) {
          // The hub may answer not_found/full as an RPC error instead of in the body.
          const answer = [e?.code, e?.message].find((v) => v === 'not_found' || v === 'full');
          if (answer) placed = { error: answer }; else throw e;
        }
        if (placed?.error) throw Object.assign(Error(placed.error === 'full' ? 'That room is full.' : 'No room with that code.'), { code: placed.error });
        await enter(placed.match_id ?? placed.matchId, { code: clean });
      },
      async quick() {
        if (hooks.level() == null) throw Object.assign(Error('Online co-op covers the boss levels: pick one in Start at.'), { code: 'bad_level' });
        const placed = await transport.rpc(RPC.QUICK, { level: hooks.level(), pilot: hooks.pilot() });
        await enter(placed.match_id ?? placed.matchId);
      },
      // The story loop's side of the lockstep (game.js storyFrame).
      sample(tick, input) { lockstep?.sample(tick, input); },
      ready(tick) { return Boolean(lockstep?.ready(tick)); },
      take(tick) { return lockstep.take(tick); },
      buffered(tick) { return lockstep ? lockstep.buffered(tick) : 0; },
      afterTick(tick, hash, mode) { lockstep?.afterTick(tick, hash, mode); },
      sendResult(result) { lockstep?.sendResult(result); },
      get rtt() { return rtt; },
      get seat() { return seat; },
      get lockstep() { return lockstep; },
      close() {
        if (pingTimer !== null) timers.clearInterval?.(pingTimer);
        pingTimer = null;
        lockstep?.close();
        const m = match;
        match = null;
        try { m?.leave(); } catch { /* already gone */ }
      },
    };
    return api;
  }

  // Stage ids by level index, for OP_RESULT.level (filled by the page from LEVELS when it loads).
  const LEVEL_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  // ---- Lobby panel on the title card (browser only).
  function openLobby(panel, page) {
    if (!panel || panel.dataset.ready) return;
    panel.dataset.ready = '1';
    const transport = root.ArcadeCoopNet.transport?.() ?? hubTransport();
    const el = (tag, attrs = {}, text = '') => { const n = root.document.createElement(tag); Object.assign(n, attrs); if (text) n.textContent = text; return n; };
    if (!transport) {
      panel.append(el('p', {}, 'Online co-op unavailable: it needs a hub session. Open Sproto Arcade from the hub to play online; Local 2P works here.'));
      return;
    }
    const status = el('p', { role: 'status' }), seats = el('p'), code = el('input', { maxLength: 5, placeholder: 'CODE', ariaLabel: 'Room code', size: 6 });
    const buttons = [el('button', { type: 'button' }, 'Create room'), el('button', { type: 'button' }, 'Join'), el('button', { type: 'button' }, 'Quick match'), el('button', { type: 'button' }, 'Leave')];
    panel.append(el('div', {}, ''), status, seats);
    panel.firstChild.append(buttons[0], code, buttons[1], buttons[2], buttons[3]);
    let session = null;
    const hooks = {
      level: page.level, pilot: page.pilot,
      maskOf: (f) => root.ArcadeReplay.maskOf(f), frameOf: (m) => root.ArcadeReplay.frameOf(m),
      start: (info) => page.start(info),
      tick: () => root.ArcadeStoryCoop?.state()?.tick ?? 0,
      snapshot: () => root.ArcadeStoryCoop?.snapshot?.(),
      restore: (s) => root.ArcadeStoryCoop?.restore?.(s),
      outcome: (o) => root.ArcadeStoryCoop?.showOutcome?.(describeOutcome(o)),
      cancel: (c) => root.ArcadeStoryCoop?.cancel?.(c?.reason),
    };
    function paint(s) {
      const badge = s.rtt == null ? '' : ' · RTT ' + Math.round(s.rtt) + ' ms' + (s.rtt > RTT_WARN_MS ? ' (laggy)' : '');
      status.textContent = (s.code ? 'Room ' + s.code + ' · ' : '') + ({ idle: 'Not connected', lobby: 'Waiting for a partner', loading: 'Loading the level…', ready: 'Ready', play: 'Playing', done: 'Match over', cancelled: '', error: '' }[s.phase] ?? s.phase) + badge + (s.message ? ' · ' + s.message : '');
      seats.textContent = s.seats.map((x) => 'P' + (x.seat + 1) + ': ' + (x.name || '…') + (x.pilot ? ' (' + x.pilot + ')' : '') + (x.present === false ? ' · away' : '')).join('   ');
    }
    function fresh() {
      session?.close();
      session = createSession({ transport, hooks });
      session.onChange((s) => {
        paint(s);
        // Quick match is refused above 250 ms; a room the player made or joined only warns.
        if (s.phase === 'lobby' && s.quick && s.rtt > RTT_BLOCK_QUICK_MS) { session.close(); status.textContent = 'Quick match needs under ' + RTT_BLOCK_QUICK_MS + ' ms to the server. Try a room code with a friend.'; }
      });
      return session;
    }
    // Room-code and level errors are the player's to fix; anything else (the hub has no co-op match
    // or RPC yet, or cannot be reached) means online co-op is not available right now.
    const run = (fn) => fn().catch((e) => { session?.close(); status.textContent = unavailableMessage(e); });
    buttons[0].onclick = () => run(() => fresh().create());
    buttons[1].onclick = () => run(() => fresh().join(code.value));
    buttons[2].onclick = () => run(async () => { const s = fresh(); await s.quick(); s.state.quick = true; });
    buttons[3].onclick = () => { session?.close(); session = null; paint({ phase: 'idle', code: '', seats: [], message: '' }); };
  }
  const PLAYER_ERRORS = new Set(['bad_code', 'not_found', 'full', 'bad_level']);
  function unavailableMessage(e) {
    if (PLAYER_ERRORS.has(e?.code)) return e.message;
    return 'Online co-op unavailable: the hub does not offer co-op matches yet. Local 2P works on this device.';
  }
  function describeOutcome(o) {
    if (!o) return '';
    const r = o.rewards || {}, parts = [];
    if (r.tickets) parts.push('+' + r.tickets + ' Tickets');
    for (const relic of r.relics || []) parts.push('Relic: ' + relic);
    return o.status === 'clear' && parts.length ? 'Hub rewards: ' + parts.join(' · ') : 'No rewards for this match' + (o.reason ? ' (' + o.reason + ')' : '') + '.';
  }

  const ArcadeCoopNet = { V, MATCH, GAME_ID, OP, RPC, CODE_ALPHABET, INPUT_DELAY, SEND_EVERY, HASH_EVERY, JITTER_TICKS, RTT_WARN_MS, RTT_BLOCK_QUICK_MS,
    cleanCode, createLockstep, createSession, hubTransport, openLobby, describeOutcome, unavailableMessage, transport: null };
  root.ArcadeCoopNet = ArcadeCoopNet;
  if (typeof module !== 'undefined' && module.exports) module.exports = ArcadeCoopNet;
})(typeof globalThis !== 'undefined' ? globalThis : this);
