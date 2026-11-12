/* Player bindings for both pages: which keyboard keys and controller buttons do each action, saved
 * per page in localStorage. Classic script, no dependencies. It is an input layer only.
 *
 * The games read fixed key codes (game.js readKeyboardFrame, rework.js input()), and gamepad.js
 * sends those same codes. Each action therefore has one canonical code, the one the game reads.
 * During play a real key bound to an action is turned into that action's canonical code before the
 * game sees it (a stopped trusted event and a synthetic keydown/keyup on window), and a default key
 * that the player moved elsewhere is swallowed. gamepad.js asks padButtons() which canonical codes
 * each controller button holds. With the default bindings nothing is translated at all, so the
 * simulation, timing and replays see exactly what they saw before. Menus are never translated.
 *
 * The pure model is exported for runtime/fixtures/controls.test.js; the browser driver at the
 * bottom runs only when the page includes this file with data-profile="story" or "trials". The
 * controller-settings screen that edits these bindings is menus.js. */
(function (root) {
  'use strict';

  const STORAGE_PREFIX = 'sproto-arcade-controls-v1:';
  const DEADZONE = Object.freeze({ min: 0.05, max: 0.5, step: 0.05, fallback: 0.2 });
  // Buttons a player may give an action. Menu/Start always pauses and confirms menus, Home belongs
  // to the system, and the D-pad and left stick always move.
  const PAD_BINDABLE = Object.freeze(['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'VIEW', 'L3', 'R3']);
  const PAD_NAMES = Object.freeze({ A: 'A', B: 'B', X: 'X', Y: 'Y', LB: 'LB', RB: 'RB', LT: 'LT', RT: 'RT', VIEW: 'View',
    MENU: 'Start', L3: 'L3', R3: 'R3', UP: 'D-pad ↑', DOWN: 'D-pad ↓', LEFT: 'D-pad ←', RIGHT: 'D-pad →', HOME: 'Home' });
  // Keys no action may take: they cancel, open feedback, belong to the browser or move menu focus.
  const RESERVED = Object.freeze({
    Escape: 'Esc pauses and cancels', KeyN: 'N twice sends feedback', F11: 'F11 is the browser’s full screen',
    Tab: 'Tab moves between menu items', F5: 'F5 reloads the page', F12: 'F12 opens developer tools',
    MetaLeft: 'the system key is not a game key', MetaRight: 'the system key is not a game key', ContextMenu: 'the menu key is not a game key',
    Backspace: 'Backspace and Delete clear a key slot', Delete: 'Backspace and Delete clear a key slot'
  });

  const move = (id, label, canonical, keys, pad) => ({ id, label, canonical, keys, pad: null, padFixed: pad });
  // Each action: canonical code the game reads, default keyboard keys, default controller buttons
  // (null = fixed to the D-pad and stick), and whether its first keyboard slot is fixed.
  const PROFILES = Object.freeze({
    story: Object.freeze({
      name: 'story',
      actions: Object.freeze([
        move('left', 'Move left', 'ArrowLeft', ['ArrowLeft', 'KeyA'], 'Stick / D-pad ←'),
        move('right', 'Move right', 'ArrowRight', ['ArrowRight', 'KeyD'], 'Stick / D-pad →'),
        move('up', 'Up · fly up (also jumps on foot)', 'ArrowUp', ['ArrowUp', 'KeyW'], 'D-pad ↑ · stick ↑ in flight'),
        move('down', 'Crouch · fly down', 'ArrowDown', ['ArrowDown', 'KeyS'], 'Stick / D-pad ↓'),
        { id: 'jump', label: 'Jump (twice in the air)', canonical: 'Space', keys: ['Space'], pad: ['A'] },
        { id: 'dash', label: 'Dash', canonical: 'ShiftLeft', keys: ['ShiftLeft', 'ShiftRight'], pad: ['B', 'RT'] },
        { id: 'shield', label: 'Shield', canonical: 'KeyX', keys: ['KeyX'], pad: ['X', 'LT'] },
        { id: 'missile', label: 'C special (missile · laser · torpedoes)', canonical: 'KeyC', keys: ['KeyC'], pad: ['Y'] },
        { id: 'bomb', label: 'V special (bomb · beach ball · mine)', canonical: 'KeyV', keys: ['KeyV'], pad: ['RB'] },
        { id: 'pause', label: 'Pause · resume', canonical: 'Escape', keys: ['Escape'], fixedFirstKey: true, pad: null, padFixed: 'Start' }
      ]),
      fixed: Object.freeze([
        { label: 'Retry after a knockout', keys: 'R', pad: 'A on Retry' },
        { label: 'Menus', keys: '↑ ↓ ← → / WASD · Enter · Space', pad: 'D-pad / stick · A select · B back' },
        { label: 'Send feedback (signed in)', keys: 'N N', pad: '—' },
        { label: 'Full screen', keys: 'F11, or the Full screen option', pad: '—' }
      ])
    }),
    trials: Object.freeze({
      name: 'trials',
      actions: Object.freeze([
        move('left', 'Move left', 'ArrowLeft', ['ArrowLeft', 'KeyA'], 'Stick / D-pad ←'),
        move('right', 'Move right', 'ArrowRight', ['ArrowRight', 'KeyD'], 'Stick / D-pad →'),
        move('up', 'Move up · fly up', 'ArrowUp', ['ArrowUp', 'KeyW'], 'Stick / D-pad ↑'),
        move('down', 'Crouch · fly down', 'ArrowDown', ['ArrowDown', 'KeyS'], 'Stick / D-pad ↓'),
        { id: 'jump', label: 'Double jump', canonical: 'Space', keys: ['Space'], pad: ['A'] },
        { id: 'dash', label: 'Dash', canonical: 'ShiftLeft', keys: ['ShiftLeft', 'ShiftRight'], pad: ['B', 'RT'] },
        { id: 'shield', label: 'Shield', canonical: 'KeyX', keys: ['KeyX'], pad: ['X', 'LT'] },
        { id: 'beam', label: 'C special', canonical: 'KeyC', keys: ['KeyC'], pad: ['Y'] },
        { id: 'bomb', label: 'V special', canonical: 'KeyV', keys: ['KeyV'], pad: ['RB'] },
        { id: 'power', label: 'Pickup power', canonical: 'KeyF', keys: ['KeyF'], pad: ['LB'] },
        { id: 'replace', label: 'Replace pickup', canonical: 'KeyE', keys: ['KeyE'], pad: ['VIEW'] },
        { id: 'retry', label: 'Instant retry', canonical: 'KeyR', keys: ['KeyR'], pad: [] },
        { id: 'pause', label: 'Pause · resume', canonical: 'Escape', keys: ['Escape'], fixedFirstKey: true, pad: null, padFixed: 'Start' }
      ]),
      fixed: Object.freeze([
        { label: 'Menus', keys: '↑ ↓ ← → / WASD · Enter · Space', pad: 'D-pad / stick · A select · B back · ◀ ▶ change' },
        { label: 'Send feedback (signed in)', keys: 'N N', pad: '—' },
        { label: 'Full screen', keys: 'F11, or the Full screen option', pad: '—' }
      ])
    })
  });
  const SLOTS = 2;

  const profileOf = name => PROFILES[name] || PROFILES.story;
  const actionOf = (profile, id) => profileOf(profile).actions.find(a => a.id === id) || null;
  const slots = list => { const out = (list || []).slice(0, SLOTS); while (out.length < SLOTS) out.push(null); return out; };
  const validKey = code => typeof code === 'string' && /^[A-Za-z][A-Za-z0-9]{0,24}$/.test(code);
  const clampDeadzone = v => {
    const n = Number(v);
    if (!Number.isFinite(n)) return DEADZONE.fallback;
    return Math.round(Math.min(DEADZONE.max, Math.max(DEADZONE.min, n)) * 100) / 100;
  };

  function defaults(profile) {
    const p = profileOf(profile), keys = {}, pad = {};
    for (const a of p.actions) {
      keys[a.id] = slots(a.keys);
      if (a.pad) pad[a.id] = slots(a.pad);
    }
    return { keys, pad, deadzone: DEADZONE.fallback };
  }

  // Anything read from storage goes through here: unknown actions and malformed or reserved codes
  // are dropped, a code used twice keeps its first action, and fixed slots keep their default.
  function normalize(raw, profile) {
    const p = profileOf(profile), out = defaults(profile);
    if (!raw || typeof raw !== 'object') return out;
    const seenKeys = new Set(), seenPad = new Set();
    for (const a of p.actions) {
      if (a.fixedFirstKey) seenKeys.add(a.keys[0]);
    }
    for (const a of p.actions) {
      const savedKeys = raw.keys && Array.isArray(raw.keys[a.id]) ? slots(raw.keys[a.id]) : null;
      if (savedKeys) {
        out.keys[a.id] = savedKeys.map((code, i) => {
          if (a.fixedFirstKey && i === 0) return a.keys[0];
          if (!validKey(code) || RESERVED[code] || seenKeys.has(code)) return null;
          seenKeys.add(code);
          return code;
        });
      } else for (const code of out.keys[a.id]) if (code) seenKeys.add(code);
      if (!a.pad) continue;
      const savedPad = raw.pad && Array.isArray(raw.pad[a.id]) ? slots(raw.pad[a.id]) : null;
      if (savedPad) {
        out.pad[a.id] = savedPad.map(name => {
          if (!PAD_BINDABLE.includes(name) || seenPad.has(name)) return null;
          seenPad.add(name);
          return name;
        });
      } else for (const name of out.pad[a.id]) if (name) seenPad.add(name);
    }
    // A default that collides with a saved binding loses (the saved choice was the player's).
    dedupe(out.keys, p, 'keys');
    dedupe(out.pad, p, 'pad');
    if (raw.deadzone !== undefined) out.deadzone = clampDeadzone(raw.deadzone);
    return out;
  }
  function dedupe(table, p, kind) {
    const owner = new Map();
    for (const a of p.actions) {
      const list = table[a.id];
      if (!list) continue;
      list.forEach((code, i) => {
        if (!code) return;
        if (owner.has(code)) list[i] = null; else owner.set(code, a.id);
      });
    }
    return kind;
  }

  const clone = state => ({ keys: Object.fromEntries(Object.entries(state.keys).map(([k, v]) => [k, v.slice()])),
    pad: Object.fromEntries(Object.entries(state.pad).map(([k, v]) => [k, v.slice()])), deadzone: state.deadzone });
  const serialize = state => ({ v: 1, keys: clone(state).keys, pad: clone(state).pad, deadzone: state.deadzone });

  function find(table, code) {
    for (const [action, list] of Object.entries(table)) {
      const slot = list.indexOf(code);
      if (slot >= 0) return { action, slot };
    }
    return null;
  }
  const findKey = (state, code) => find(state.keys, code);
  const findPad = (state, name) => find(state.pad, name);

  function reservedReason(code) {
    return RESERVED[code] || '';
  }

  // Bind one slot. A code another action already uses is swapped (that action takes this slot's
  // old code) unless strict, which refuses it as the quick dash remap always has.
  function bind(state, profile, kind, actionId, slot, code, strict) {
    const a = actionOf(profile, actionId);
    const next = clone(state);
    const table = kind === 'pad' ? next.pad : next.keys;
    if (!a || !table[actionId] || slot < 0 || slot >= SLOTS) return { ok: false, state, reason: 'unknown' };
    if (kind === 'keys' && a.fixedFirstKey && slot === 0) return { ok: false, state, reason: 'fixed' };
    if (kind === 'pad' && !PAD_BINDABLE.includes(code)) return { ok: false, state, reason: code === 'MENU' ? 'Start always pauses' : 'the D-pad and stick always move' };
    if (kind === 'keys') {
      if (!validKey(code)) return { ok: false, state, reason: 'unknown' };
      const why = reservedReason(code);
      if (why) return { ok: false, state, reason: why };
    }
    const old = table[actionId][slot];
    if (old === code) return { ok: true, state: next, swapped: null };
    const other = find(table, code);
    let swapped = null;
    if (other) {
      const otherAction = actionOf(profile, other.action);
      if (other.action === actionId) {
        table[actionId][other.slot] = old;
      } else {
        if (strict) return { ok: false, state, reason: 'used by ' + otherAction.label, conflict: other };
        if (kind === 'keys' && otherAction.fixedFirstKey && other.slot === 0) return { ok: false, state, reason: 'fixed' };
        table[other.action][other.slot] = old;
        swapped = { action: other.action, slot: other.slot, code: old };
      }
    }
    table[actionId][slot] = code;
    return { ok: true, state: next, swapped };
  }
  const bindKey = (state, profile, action, slot, code, strict) => bind(state, profile, 'keys', action, slot, code, strict);
  const bindPad = (state, profile, action, slot, name, strict) => bind(state, profile, 'pad', action, slot, name, strict);
  function clearSlot(state, profile, kind, actionId, slot) {
    const a = actionOf(profile, actionId), next = clone(state), table = kind === 'pad' ? next.pad : next.keys;
    if (!a || !table[actionId]) return { ok: false, state };
    if (kind === 'keys' && a.fixedFirstKey && slot === 0) return { ok: false, state, reason: 'fixed' };
    table[actionId][slot] = null;
    return { ok: true, state: next };
  }

  function sameList(a, b) { return slots(a).join('|') === slots(b).join('|'); }
  function isDefault(state, profile, actionId, kind) {
    const a = actionOf(profile, actionId);
    if (!a) return true;
    if (kind === 'pad') return !a.pad || sameList(state.pad[actionId], a.pad);
    return sameList(state.keys[actionId], a.keys);
  }
  function allDefault(state, profile) {
    return profileOf(profile).actions.every(a => isDefault(state, profile, a.id, 'keys') && isDefault(state, profile, a.id, 'pad'));
  }

  // During play: the canonical code a real key stands for, '' to swallow it (a default key the player
  // moved away), or null to leave it alone (not a game key).
  function translate(state, profile, code) {
    const hit = findKey(state, code);
    if (hit) return actionOf(profile, hit.action).canonical;
    for (const a of profileOf(profile).actions) if (a.keys.includes(code)) return '';
    return null;
  }
  // What each controller button holds during play, in gamepad.js's layout format.
  function padButtons(state, profile) {
    const out = {};
    for (const a of profileOf(profile).actions) {
      for (const name of state.pad[a.id] || []) if (name) (out[name] ||= []).push(a.canonical);
    }
    return out;
  }

  const KEY_LABELS = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'Space', ShiftLeft: 'Shift', ShiftRight: 'Right Shift',
    ControlLeft: 'Ctrl', ControlRight: 'Right Ctrl', AltLeft: 'Alt', AltRight: 'Right Alt', Escape: 'Esc', Enter: 'Enter', NumpadEnter: 'Num Enter',
    Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',',
    Period: '.', Slash: '/', CapsLock: 'Caps Lock', PageUp: 'Page Up', PageDown: 'Page Down' };
  function keyLabel(code) {
    if (!code) return '—';
    if (KEY_LABELS[code]) return KEY_LABELS[code];
    let m = /^Key([A-Z])$/.exec(code);
    if (m) return m[1];
    m = /^Digit(\d)$/.exec(code);
    if (m) return m[1];
    m = /^Numpad(.+)$/.exec(code);
    if (m) return 'Num ' + m[1];
    return code;
  }
  const padLabel = name => (name ? PAD_NAMES[name] || name : '—');
  function actionKeys(state, actionId) { return (state.keys[actionId] || []).filter(Boolean); }
  function actionPad(state, actionId) { return (state.pad[actionId] || []).filter(Boolean); }

  const api = { STORAGE_PREFIX, DEADZONE, PAD_BINDABLE, PAD_NAMES, RESERVED, PROFILES, SLOTS, defaults, normalize, serialize, findKey, findPad,
    bindKey, bindPad, clearSlot, isDefault, allDefault, translate, padButtons, keyLabel, padLabel, actionKeys, actionPad, clampDeadzone,
    actionOf, reservedReason };
  root.SprotoControls = api;
  if (typeof module === 'object' && module.exports) module.exports = api;

  // ---------------------------------------------------------------- browser driver
  if (typeof document === 'undefined') return;
  const script = document.currentScript;
  const profileName = script && script.dataset && script.dataset.profile;
  if (!PROFILES[profileName]) return;
  const storageKey = STORAGE_PREFIX + profileName;

  function load() {
    try {
      const text = root.localStorage.getItem(storageKey);
      return normalize(text ? JSON.parse(text) : null, profileName);
    } catch {
      return defaults(profileName);
    }
  }
  function save(state) {
    try { root.localStorage.setItem(storageKey, JSON.stringify(serialize(state))); } catch { /* private window: live only */ }
  }

  let state = load(), capture = null;
  const listeners = new Set();
  const notify = () => { for (const fn of listeners) { try { fn(controls); } catch (e) { console.warn(e); } } };
  function commit(next) { state = next; save(state); notify(); }

  // game.js keeps its state in top-level script bindings; read them without touching them.
  /* global mode */
  const storyMode = () => { try { return mode; } catch { return undefined; } };
  const trialsApp = () => root.ArcadeApp;
  const page = {
    story: {
      playing: () => storyMode() === 'play',
      pauseLive: () => storyMode() === 'play' || storyMode() === 'paused'
    },
    trials: {
      playing: () => { const a = trialsApp(), c = document.getElementById('curtain'); return Boolean(a && a.world && !a.paused && c && c.hidden); },
      pauseLive: () => { const a = trialsApp(); return Boolean(a && a.world && /^(playing|transition)$/.test(a.world.state)); }
    }
  }[profileName];
  const panelOpen = () => { const m = root.ArcadeMenus; return Boolean(m && typeof m.activePanel === 'function' && m.activePanel()); };
  const feedbackOpen = () => { const f = root.ArcadeFeedback; return Boolean(f && typeof f.isOpen === 'function' && f.isOpen()); };

  // ---- Press-to-bind. The keyboard half lives here; gamepad.js feeds controller presses in.
  function finishCapture(result, message) {
    const c = capture;
    capture = null;
    if (c && typeof c.done === 'function') c.done(result, message);
    notify();
  }
  function setMessage(message) { if (capture && typeof capture.message === 'function') capture.message(message); }
  function onCaptureKey(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.repeat) return;
    const c = capture;
    if (e.code === 'Escape') { finishCapture({ cancelled: true }, 'Cancelled.'); return; }
    if (c.device === 'pad') { setMessage('Press a controller button, or Esc to cancel.'); return; }
    if ((e.code === 'Backspace' || e.code === 'Delete') && !c.strict) {
      const r = clearSlot(state, profileName, 'keys', c.action, c.slot);
      if (r.ok) commit(r.state);
      finishCapture({ cleared: r.ok }, r.ok ? 'Slot cleared.' : 'That slot is fixed.');
      return;
    }
    const r = bindKey(state, profileName, c.action, c.slot, e.code, c.strict);
    if (!r.ok) { setMessage('Not ' + keyLabel(e.code) + ': ' + (r.reason === 'unknown' ? 'that key cannot be bound' : r.reason) + '. Try another, or Esc to cancel.'); if (c.refused) c.refused(r, e); return; }
    swallowUp.add(e.code);
    commit(r.state);
    finishCapture({ code: e.code, key: e.key, swapped: r.swapped }, swapText(r.swapped, 'keys'));
  }
  function swapText(swapped, kind) {
    if (!swapped) return 'Saved.';
    const a = actionOf(profileName, swapped.action);
    const label = kind === 'pad' ? padLabel(swapped.code) : keyLabel(swapped.code);
    return swapped.code ? 'Swapped: ' + a.label + ' now uses ' + label + '.' : 'Moved: ' + a.label + ' lost that ' + (kind === 'pad' ? 'button' : 'key') + '.';
  }
  function capturePad(name) {
    const c = capture;
    if (!c) return false;
    if (name === 'MENU') { finishCapture({ cancelled: true }, 'Cancelled.'); return true; }
    if (c.device !== 'pad') { if (name === 'B') finishCapture({ cancelled: true }, 'Cancelled.'); return true; }
    if (name === 'HOME') return true;
    const r = bindPad(state, profileName, c.action, c.slot, name, c.strict);
    if (!r.ok) { setMessage('Not ' + padLabel(name) + ': ' + (r.reason === 'unknown' ? 'that button cannot be bound' : r.reason) + '. Try another, or Start to cancel.'); return true; }
    commit(r.state);
    finishCapture({ pad: name, swapped: r.swapped }, swapText(r.swapped, 'pad'));
    return true;
  }

  // ---- Translation during play.
  const holders = new Map(); // canonical code -> Set of real codes holding it
  const downAs = new Map();  // real code -> canonical code it went down as ('' = swallowed)
  const swallowUp = new Set();
  const editable = t => t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName || '') || (t && t.isContentEditable);
  function send(type, code, repeat) {
    const k = root.SprotoGamepad ? root.SprotoGamepad.keyName(code) : code;
    root.dispatchEvent(new KeyboardEvent(type, { code, key: k, repeat: Boolean(repeat), bubbles: true, cancelable: true }));
  }
  function onKeyDown(e) {
    if (!e.isTrusted) return;
    if (capture) { onCaptureKey(e); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || editable(e.target) || feedbackOpen() || panelOpen()) return;
    if (allDefault(state, profileName)) return;
    const canonical = translate(state, profileName, e.code);
    if (canonical === null) return;
    const live = page.playing() || (canonical === 'Escape' && page.pauseLive());
    if (!live) return;
    if (canonical === '') { e.preventDefault(); e.stopPropagation(); downAs.set(e.code, ''); return; }
    if (!holders.has(canonical)) holders.set(canonical, new Set());
    holders.get(canonical).add(e.code);
    downAs.set(e.code, canonical);
    if (canonical === e.code) return; // the game reads this key itself
    e.preventDefault();
    e.stopPropagation();
    send('keydown', canonical, e.repeat);
  }
  function onKeyUp(e) {
    if (!e.isTrusted) return;
    if (swallowUp.delete(e.code)) { e.stopImmediatePropagation(); return; }
    if (!downAs.has(e.code)) return;
    const canonical = downAs.get(e.code);
    downAs.delete(e.code);
    if (canonical === '') { e.stopPropagation(); return; }
    const set = holders.get(canonical);
    if (set) set.delete(e.code);
    const stillHeld = set && set.size > 0;
    if (!stillHeld) holders.delete(canonical);
    if (canonical === e.code && !stillHeld) return;
    e.stopPropagation();
    if (!stillHeld) send('keyup', canonical, false);
  }
  root.addEventListener('keydown', onKeyDown, true);
  root.addEventListener('keyup', onKeyUp, true);
  root.addEventListener('blur', () => { holders.clear(); downAs.clear(); swallowUp.clear(); });

  // Prompts in game text: the fallback while the player kept the default, else the bound keys.
  function prompt(actionId, fallback, kind) {
    if (kind === 'pad') return isDefault(state, profileName, actionId, 'pad') ? fallback : (actionPad(state, actionId).map(padLabel).join(' / ') || 'unbound');
    return isDefault(state, profileName, actionId, 'keys') ? fallback : (actionKeys(state, actionId).map(keyLabel).join(' / ') || 'unbound');
  }

  const controls = {
    profile: profileName,
    storageKey,
    get state() { return clone(state); },
    get actions() { return PROFILES[profileName].actions; },
    get fixed() { return PROFILES[profileName].fixed; },
    get capturing() { return capture ? { device: capture.device, action: capture.action, slot: capture.slot } : null; },
    get deadzone() { return state.deadzone; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    bindKey(action, slot, code, strict) { const r = bindKey(state, profileName, action, slot, code, strict); if (r.ok) commit(r.state); return r; },
    bindPad(action, slot, name, strict) { const r = bindPad(state, profileName, action, slot, name, strict); if (r.ok) commit(r.state); return r; },
    clearKey(action, slot) { const r = clearSlot(state, profileName, 'keys', action, slot); if (r.ok) commit(r.state); return r; },
    clearPad(action, slot) { const r = clearSlot(state, profileName, 'pad', action, slot); if (r.ok) commit(r.state); return r; },
    setDeadzone(v) { commit({ ...clone(state), deadzone: clampDeadzone(v) }); },
    reset() { const keep = capture; capture = null; if (keep && keep.done) keep.done({ cancelled: true }); commit(defaults(profileName)); },
    // options: { action, slot, device: 'key' | 'pad', strict, message(text), refused(result, event), done(result, text) }
    beginCapture(options) {
      if (capture) finishCapture({ cancelled: true }, 'Cancelled.');
      capture = { device: 'key', slot: 0, ...options };
      notify();
    },
    cancelCapture() { if (capture) finishCapture({ cancelled: true }, 'Cancelled.'); },
    capturePad,
    padButtons: () => padButtons(state, profileName),
    allDefault: () => allDefault(state, profileName),
    keysFor: action => actionKeys(state, action),
    padFor: action => actionPad(state, action),
    keyLabelFor: action => actionKeys(state, action).map(keyLabel).join(' / ') || 'unbound',
    padLabelFor: action => actionPad(state, action).map(padLabel).join(' / ') || 'unbound',
    prompt: (action, fallback) => prompt(action, fallback, 'keys'),
    padPrompt: (action, fallback) => prompt(action, fallback, 'pad'),
    keyLabel,
    padLabel
  };
  root.ArcadeControls = controls;
})(typeof globalThis !== 'undefined' ? globalThis : this);
