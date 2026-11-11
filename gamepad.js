/* Controller support, plus keyboard navigation of the menu screens, for both pages (story mode in
 * legacy.html, Machine Trials in index.html). Classic script, no dependencies. It is only another
 * input source: during play it turns the standard-mapping Gamepad into the same key events the
 * keyboard sends (synthetic keydown/keyup on window), so the games' own input code, timing,
 * physics, damage and replays are unchanged. On menus and overlays it moves the focus and clicks
 * buttons, for the pad and for arrows/WASD + Enter. The mapping logic is pure and exported for
 * runtime/fixtures/gamepad.test.js and qa/gamepad-mapping.test.cjs; the browser driver at the
 * bottom runs only when the page includes this file with data-profile="story" or "trials".
 * Layout and reasons: README "Controls". */
(function (root) {
  'use strict';

  // W3C standard mapping indices (Xbox names).
  const BUTTON = Object.freeze({ A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, MENU: 9,
    L3: 10, R3: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15, HOME: 16 });
  const BUTTON_COUNT = 17;

  const TUNING = Object.freeze({
    leftDeadzone: 0.2,        // radial, rescaled so motion starts smoothly from 0
    rightDeadzone: 0.15,      // unused by these 2D games; kept for the shared convention
    triggerThreshold: 0.5,    // LT/RT count as pressed above this value
    moveThreshold: 0.25,      // rescaled stick magnitude that becomes a digital direction
    horizontalCone: 0.38,     // |x|/magnitude above this is left/right (8-way sectors)
    verticalCone: 0.38,       // same for up/down when flying
    groundVerticalCone: 0.8,  // on foot, down (crouch) needs a near-vertical stick
    menuThreshold: 0.5,       // stick deflection that moves menu focus
    repeatDelay: 350,         // ms before a held menu direction repeats
    repeatInterval: 120       // ms between repeats after that
  });

  // Gameplay layouts. Each button lists the key codes it holds. '$dash' resolves to the page's
  // current dash key (Machine Trials lets the player remap dash). D-pad and left stick always
  // hold the arrow keys; story mode ignores stick-up on foot because Up also jumps there.
  const PROFILES = Object.freeze({
    story: Object.freeze({
      name: 'story',
      buttons: Object.freeze({ A: ['Space'], B: ['ShiftLeft'], RT: ['ShiftLeft'], X: ['KeyX'], LT: ['KeyX'],
        Y: ['KeyC'], RB: ['KeyV'] }),
      pause: 'Escape',
      stickUpOnGround: false
    }),
    trials: Object.freeze({
      name: 'trials',
      buttons: Object.freeze({ A: ['Space'], B: ['$dash'], RT: ['$dash'], X: ['KeyX'], LT: ['KeyX'],
        Y: ['KeyC'], RB: ['KeyV'], LB: ['KeyF'], VIEW: ['KeyE'] }),
      pause: 'Escape',
      stickUpOnGround: true
    })
  });

  const KEY_NAMES = { Space: ' ', ShiftLeft: 'Shift', ShiftRight: 'Shift', Escape: 'Escape',
    ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown' };
  function keyName(code) {
    if (KEY_NAMES[code]) return KEY_NAMES[code];
    const letter = /^Key([A-Z])$/.exec(code);
    return letter ? letter[1].toLowerCase() : code;
  }

  function radialDeadzone(x, y, deadzone) {
    x = Number(x) || 0; y = Number(y) || 0;
    const magnitude = Math.hypot(x, y);
    if (magnitude <= deadzone) return { x: 0, y: 0, magnitude: 0 };
    const scaled = Math.min(1, (magnitude - deadzone) / (1 - deadzone));
    return { x: x / magnitude * scaled, y: y / magnitude * scaled, magnitude: scaled };
  }

  function readButtons(pad) {
    const out = new Array(BUTTON_COUNT).fill(false);
    const list = (pad && pad.buttons) || [];
    for (let i = 0; i < BUTTON_COUNT && i < list.length; i++) {
      const b = list[i];
      if (b == null) continue;
      const value = typeof b === 'number' ? b : Number(b.value) || 0;
      out[i] = (i === BUTTON.LT || i === BUTTON.RT)
        ? value > TUNING.triggerThreshold
        : Boolean(typeof b === 'object' && b.pressed) || value > TUNING.triggerThreshold;
    }
    return out;
  }

  function choosePad(pads) {
    const live = Array.from(pads || []).filter(p => p && p.connected !== false);
    return live.find(p => p.mapping === 'standard') || live[0] || null;
  }

  // Tracks player 1's pad across frames: hot-plug, latch on connect, and re-latch on demand.
  // A latched button (or stick) is ignored until it is released, so the press that confirmed a
  // portal in the hub, or that started a run here, never leaks into the next screen.
  function createTracker() {
    let key = null, latched = new Array(BUTTON_COUNT).fill(false), stickLatched = false;
    let rawButtons = new Array(BUTTON_COUNT).fill(false), rawStick = { x: 0, y: 0, magnitude: 0 };
    const tracker = {
      update(pads) {
        const pad = choosePad(pads);
        if (!pad) {
          key = null;
          rawButtons = new Array(BUTTON_COUNT).fill(false);
          rawStick = { x: 0, y: 0, magnitude: 0 };
          return { connected: false, justConnected: false, buttons: rawButtons.slice(), stick: rawStick };
        }
        const nextKey = pad.index + '|' + pad.id;
        const justConnected = nextKey !== key;
        key = nextKey;
        const axes = pad.axes || [];
        rawButtons = readButtons(pad);
        rawStick = radialDeadzone(axes[0], axes[1], TUNING.leftDeadzone);
        if (justConnected) tracker.latchAll();
        for (let i = 0; i < BUTTON_COUNT; i++) if (!rawButtons[i]) latched[i] = false;
        if (rawStick.magnitude === 0) stickLatched = false;
        return {
          connected: true, justConnected, index: pad.index, id: pad.id,
          buttons: rawButtons.map((down, i) => down && !latched[i]),
          stick: stickLatched ? { x: 0, y: 0, magnitude: 0 } : rawStick
        };
      },
      latchAll() {
        latched = rawButtons.slice();
        stickLatched = rawStick.magnitude > 0;
      }
    };
    return tracker;
  }

  function stickDirections(stick, flying, stickUpOnGround) {
    const out = { left: false, right: false, up: false, down: false };
    if (!stick || stick.magnitude < TUNING.moveThreshold) return out;
    const nx = stick.x / stick.magnitude, ny = stick.y / stick.magnitude;
    const vCone = flying ? TUNING.verticalCone : TUNING.groundVerticalCone;
    out.left = nx < -TUNING.horizontalCone;
    out.right = nx > TUNING.horizontalCone;
    out.down = ny > vCone;
    out.up = ny < -vCone && (flying || stickUpOnGround);
    return out;
  }

  // The set of key codes the pad holds this frame during play.
  function gameplayCodes(snapshot, profile, context) {
    const codes = new Set();
    if (!snapshot || !snapshot.connected) return codes;
    const ctx = context || {};
    const b = snapshot.buttons;
    const dirs = stickDirections(snapshot.stick, Boolean(ctx.flying), profile.stickUpOnGround);
    if (b[BUTTON.LEFT] || dirs.left) codes.add('ArrowLeft');
    if (b[BUTTON.RIGHT] || dirs.right) codes.add('ArrowRight');
    if (b[BUTTON.UP] || dirs.up) codes.add('ArrowUp');
    if (b[BUTTON.DOWN] || dirs.down) codes.add('ArrowDown');
    for (const [name, list] of Object.entries(profile.buttons)) {
      if (!b[BUTTON[name]]) continue;
      for (const code of list) codes.add(code === '$dash' ? (ctx.dashCode || 'ShiftLeft') : code);
    }
    return codes;
  }

  function diffCodes(previous, next) {
    const down = [], up = [];
    for (const code of next) if (!previous.has(code)) down.push(code);
    for (const code of previous) if (!next.has(code)) up.push(code);
    return { down, up };
  }

  function pressedEdges(previous, next) {
    const edges = [];
    for (let i = 0; i < BUTTON_COUNT; i++) if (next[i] && !(previous && previous[i])) edges.push(i);
    return edges;
  }

  // D-pad wins over the stick; the stick uses its dominant axis past the menu threshold.
  // Uses the deadzoned stick, whose magnitude is rescaled, so compare the raw-equivalent.
  function menuDirection(snapshot) {
    if (!snapshot || !snapshot.connected) return null;
    const b = snapshot.buttons;
    if (b[BUTTON.UP]) return 'up';
    if (b[BUTTON.DOWN]) return 'down';
    if (b[BUTTON.LEFT]) return 'left';
    if (b[BUTTON.RIGHT]) return 'right';
    const s = snapshot.stick;
    if (!s || !s.magnitude) return null;
    const raw = TUNING.leftDeadzone + s.magnitude * (1 - TUNING.leftDeadzone);
    if (raw < TUNING.menuThreshold) return null;
    const nx = s.x / s.magnitude, ny = s.y / s.magnitude;
    if (Math.abs(nx) >= Math.abs(ny)) return nx < 0 ? 'left' : 'right';
    return ny < 0 ? 'up' : 'down';
  }

  // Key-repeat style: fire on a new direction, again after repeatDelay, then every repeatInterval.
  function createRepeater() {
    let current = null, nextAt = 0;
    return {
      update(direction, now) {
        if (direction !== current) {
          current = direction;
          nextAt = now + TUNING.repeatDelay;
          return direction;
        }
        if (direction && now >= nextAt) {
          nextAt = now + TUNING.repeatInterval;
          return direction;
        }
        return null;
      },
      reset() { current = null; nextAt = 0; }
    };
  }

  // Spatial focus move: nearest candidate whose centre lies in the direction, weighting
  // sideways offset twice as heavily as distance along the direction. Returns an index or -1.
  function pickSpatial(from, rects, direction) {
    const cx = from.x + from.w / 2, cy = from.y + from.h / 2;
    let best = -1, bestScore = Infinity;
    rects.forEach((r, i) => {
      if (!r) return;
      const x = r.x + r.w / 2, y = r.y + r.h / 2;
      let along, side;
      if (direction === 'up') { along = cy - y; side = Math.abs(x - cx); }
      else if (direction === 'down') { along = y - cy; side = Math.abs(x - cx); }
      else if (direction === 'left') { along = cx - x; side = Math.abs(y - cy); }
      else { along = x - cx; side = Math.abs(y - cy); }
      if (along <= 1) return;
      const score = along + side * 2;
      if (score < bestScore) { bestScore = score; best = i; }
    });
    return best;
  }

  // Keyboard on menu screens (title, setup, pause, game over): arrows or WASD move the focus like
  // the D-pad, Enter confirms. focus is 'none' (nothing focused), 'item' (a menu button or link),
  // 'select', 'text' (a typed field such as the seed) or 'other' (anything else, such as the dash
  // remap button, which waits for its own key). Returns null to leave the key to the browser, so
  // Enter still presses a focused button natively and typed fields keep their arrow keys. Space is
  // handled here ('press'), because Machine Trials reserves Space for jumping and blocks its native
  // button press; doing it here on both pages also keeps the confirming Space from becoming a jump.
  const MENU_KEYS = Object.freeze({ ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' });
  function menuKeyAction(event, focus) {
    if (!event || event.ctrlKey || event.metaKey || event.altKey || focus === 'other') return null;
    const code = event.code;
    if (code === 'Enter' || code === 'NumpadEnter') {
      if (focus === 'none') return { type: 'confirm' };
      if (focus === 'select' || focus === 'text') return { type: 'done' };
      return null;
    }
    if (code === 'Space') return focus === 'item' || focus === 'none' ? { type: 'press' } : null;
    const direction = MENU_KEYS[code];
    if (!direction || focus === 'text') return null;
    if (focus === 'select' && (direction === 'left' || direction === 'right')) return { type: 'adjust', direction };
    return { type: 'move', direction };
  }

  const api = { BUTTON, TUNING, PROFILES, MENU_KEYS, keyName, radialDeadzone, readButtons, choosePad, createTracker,
    stickDirections, gameplayCodes, diffCodes, pressedEdges, menuDirection, createRepeater, pickSpatial, menuKeyAction };
  root.SprotoGamepad = api;
  if (typeof module === 'object' && module.exports) module.exports = api;

  // ---------------------------------------------------------------- browser driver
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return;
  const script = document.currentScript;
  const profileName = script && script.dataset && script.dataset.profile;
  const profile = PROFILES[profileName];
  if (!profile) return;
  // Without the Gamepad API (old or locked-down browsers) the keyboard menu keys still work.
  const hasGamepadApi = typeof navigator.getGamepads === 'function';

  const $ = id => document.getElementById(id);
  const visible = el => el && !el.disabled && el.getClientRects().length > 0;
  // game.js keeps its state in top-level script bindings; read them without touching them.
  /* global mode, isFlying */
  const storyMode = () => { try { return mode; } catch { return undefined; } };
  const storyFlying = () => { try { return typeof isFlying === 'function' && Boolean(isFlying()); } catch { return false; } };

  // Page adapters: when the pad drives play, what counts as flying, which elements are menu
  // items, and what Menu/Start and B do on menus. Everything else is shared.
  const adapters = {
    story: {
      playing: () => { const o = document.querySelector('.overlay'); return Boolean(o && o.hidden); },
      flying: storyFlying,
      dashCode: () => 'ShiftLeft',
      candidates: () => [...document.querySelectorAll('.overlay button, .overlay select, #hub-return')],
      primary: () => $('start'),
      start: () => { const b = $('start'); if (visible(b)) b.click(); },
      back: () => { if (storyMode() === 'paused') $('start').click(); }
    },
    trials: {
      playing: () => { const c = $('curtain'); return Boolean(c && c.hidden); },
      flying: () => { const m = root.ArcadeApp && root.ArcadeApp.world && root.ArcadeApp.world.phase && root.ArcadeApp.world.phase.mode; return m === 'flight' || m === 'orbit'; },
      dashCode: () => (root.ArcadeApp && root.ArcadeApp.dashKey) || 'ShiftLeft',
      // The dash remap button waits for a keyboard key, so it is left to the keyboard.
      candidates: () => [...document.querySelectorAll('header a[href], #setup select, #setup input, #setup button, #curtain button')],
      primary: () => (visible($('resume')) ? $('resume') : $('start')),
      start: () => { const b = adapters.trials.primary(); if (visible(b)) b.click(); },
      back: () => { const app = root.ArcadeApp; if (app && app.paused && visible($('resume'))) $('resume').click(); }
    }
  };
  const page = adapters[profileName];
  const tracker = createTracker(), repeater = createRepeater();
  let held = new Set(), previousButtons = null, wasPlaying = null;
  // The feedback window (feedback-link.js) takes the keyboard while it is open; the pad must not
  // drive the menu or the game underneath it.
  const feedbackOpen = () => { const f = root.ArcadeFeedback; return Boolean(f && typeof f.isOpen === 'function' && f.isOpen()); };

  function send(type, code) {
    window.dispatchEvent(new KeyboardEvent(type, { code, key: keyName(code), bubbles: true, cancelable: true }));
  }
  function releaseAll() {
    for (const code of held) send('keyup', code);
    held = new Set();
  }
  function setDevice(device) {
    if (document.documentElement.dataset.input !== device) document.documentElement.dataset.input = device;
  }
  for (const type of ['keydown', 'mousedown', 'pointerdown', 'touchstart']) {
    window.addEventListener(type, e => { if (e.isTrusted) setDevice('keyboard'); }, { capture: true, passive: true });
  }

  function menuItems() { return page.candidates().filter(visible); }
  function focusItem(el) {
    if (!el) return;
    try { el.focus({ focusVisible: true }); } catch { el.focus(); }
  }
  function adjust(el, direction) {
    if (el.tagName === 'SELECT') {
      const next = Math.max(0, Math.min(el.options.length - 1, el.selectedIndex + (direction === 'left' ? -1 : 1)));
      if (next === el.selectedIndex) return;
      el.selectedIndex = next;
    } else if (el.tagName === 'INPUT' && el.type === 'number') {
      if (direction === 'left') el.stepDown(); else el.stepUp();
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else return;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function moveFocus(direction) {
    const items = menuItems();
    if (!items.length) return;
    const current = document.activeElement;
    if (!items.includes(current)) { focusItem(visible(page.primary()) ? page.primary() : items[0]); return; }
    const adjustable = current.tagName === 'SELECT' || (current.tagName === 'INPUT' && current.type === 'number');
    if (adjustable && (direction === 'left' || direction === 'right')) { adjust(current, direction); return; }
    const rect = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
    const others = items.filter(el => el !== current);
    const pick = pickSpatial(rect(current), others.map(rect), direction);
    if (pick >= 0) focusItem(others[pick]);
  }
  function pressPrimary() {
    const primary = page.primary();
    if (visible(primary)) { focusItem(primary); primary.click(); }
  }
  function confirm() {
    const items = menuItems(), current = document.activeElement;
    if (!items.includes(current)) { pressPrimary(); return; }
    // A select or number field has no click action on a pad: confirm the choice, go to Start.
    if (current.tagName === 'SELECT' || current.tagName === 'INPUT') { focusItem(page.primary()); return; }
    current.click();
  }
  function focusKind() {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) return 'none';
    if (!menuItems().includes(el)) return 'other';
    if (el.tagName === 'SELECT') return 'select';
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return 'text';
    return 'item';
  }
  // Keyboard menu navigation. It runs before the games' own handlers (capture) and only on menu
  // screens; during play every key goes to the game untouched.
  window.addEventListener('keydown', e => {
    if (!e.isTrusted || feedbackOpen() || page.playing() || !menuItems().length) return;
    const action = menuKeyAction(e, focusKind());
    if (!action) return;
    e.preventDefault();
    // A confirming key is the menu's alone: the game must not also read it as a jump.
    if (action.type === 'press' || action.type === 'confirm') e.stopPropagation();
    if (action.type === 'move') moveFocus(action.direction);
    else if (action.type === 'adjust') adjust(document.activeElement, action.direction);
    else if (action.type === 'done') focusItem(page.primary());
    else if (action.type === 'confirm' && !e.repeat) pressPrimary();
    else if (action.type === 'press' && !e.repeat) {
      if (focusKind() === 'item') document.activeElement.click(); else pressPrimary();
    }
  }, true);

  function frame(now) {
    let snapshot;
    try { snapshot = tracker.update(navigator.getGamepads()); }
    catch { snapshot = { connected: false, buttons: [], stick: null }; }
    if (feedbackOpen()) {
      // Let go of every synthetic key and ignore what is held, as on a screen change.
      if (held.size) releaseAll();
      tracker.latchAll();
      repeater.reset();
      previousButtons = null;
      requestAnimationFrame(frame);
      return;
    }
    const playing = page.playing();
    if (wasPlaying !== null && playing !== wasPlaying) {
      // Screen change: let go of every synthetic key and ignore buttons still held, so the A
      // that started a run does not jump and a held direction does not leak into a menu.
      releaseAll();
      tracker.latchAll();
      repeater.reset();
      try { snapshot = tracker.update(navigator.getGamepads()); } catch { /* keep the snapshot */ }
    }
    wasPlaying = playing;
    if (!snapshot.connected) {
      if (held.size) releaseAll();
      previousButtons = null;
      requestAnimationFrame(frame);
      return;
    }
    const edges = pressedEdges(previousButtons, snapshot.buttons);
    previousButtons = snapshot.buttons;
    // A pad only appears after a press on it, so its arrival also counts as using it.
    if (snapshot.justConnected || edges.length || snapshot.stick.magnitude > 0) setDevice('gamepad');
    if (playing) {
      const next = gameplayCodes(snapshot, profile, { flying: page.flying(), dashCode: page.dashCode() });
      const change = diffCodes(held, next);
      for (const code of change.up) send('keyup', code);
      for (const code of change.down) send('keydown', code);
      held = next;
      // Menu/Start pauses with a tap of the pause key, exactly like pressing Escape.
      if (edges.includes(BUTTON.MENU)) { send('keydown', profile.pause); send('keyup', profile.pause); }
    } else {
      const direction = repeater.update(menuDirection(snapshot), now);
      if (direction) moveFocus(direction);
      if (edges.includes(BUTTON.A)) confirm();
      else if (edges.includes(BUTTON.B)) page.back();
      else if (edges.includes(BUTTON.MENU)) page.start();
    }
    requestAnimationFrame(frame);
  }
  if (hasGamepadApi) {
    window.addEventListener('blur', () => releaseAll());
    requestAnimationFrame(frame);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
