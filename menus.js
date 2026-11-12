/* The options every menu screen shares, for both pages: Main menu, Hub, Controller settings and
 * Full screen. Classic script, loaded with data-profile="story" (legacy.html, after game.js and
 * hub-link.js) or "trials" (index.html, after rework.js), and before gamepad.js.
 *
 * The buttons themselves are in each page's menu markup (<nav class="menu-options">), so every
 * menu screen shows them; this file wires them up and builds the two panels they open over the
 * game screen: controller settings (bindings from controls.js) and a small leave-the-run confirm.
 * While a panel is open it owns the keyboard and gamepad.js asks it for focus, B and Start.
 * Presentation and input only: leaving a run goes through the pages' own functions
 * (game.js returnToTitle, rework.js ArcadeApp.mainMenu, hub-link.js ArcadeHub.exit). */
(function (root) {
  'use strict';
  const doc = root.document;
  if (!doc) return;
  const profile = doc.currentScript && doc.currentScript.dataset.profile;
  if (profile !== 'story' && profile !== 'trials') return;
  const $ = id => doc.getElementById(id);
  const attempt = (fn, fallback) => { try { const v = fn(); return v === undefined ? fallback : v; } catch { return fallback; } };
  const visible = el => el && !el.disabled && el.getClientRects().length > 0;

  /** The hub page this game knows: hub-config.js, else hub-link.js's rule, else /hub/. */
  function hubUrl() {
    const configured = attempt(() => root.SPROTO_ARCADE_HUB.hubUrl, '');
    if (configured) return configured;
    const linked = attempt(() => root.ArcadeHub.hubUrl, '');
    if (linked) return linked;
    const loc = root.location, host = (loc && loc.hostname) || '';
    if (/^play\./.test(host)) return `${loc.protocol}//${host.slice(5)}${loc.port ? `:${loc.port}` : ''}/hub/`;
    return '/hub/';
  }

  // game.js keeps its state in top-level script bindings; read them, and leave only through its functions.
  /* global mode, returnToTitle */
  const storyMode = () => attempt(() => mode, undefined);
  const app = () => root.ArcadeApp;
  const pages = {
    story: {
      menu: () => doc.querySelector('.overlay'),
      playing: () => storyMode() === 'play',
      // A run is lost by leaving the pause screen, or a knockout screen that holds a phase-2 retry.
      risky: () => /^(paused|lost)$/.test(String(storyMode())),
      mainMenu: () => returnToTitle(),
      async hub() {
        const hub = root.ArcadeHub;
        if (hub && typeof hub.connected === 'function' && hub.connected()) { hub.exit(); return; }
        api.navigate(hubUrl());
      }
    },
    trials: {
      menu: () => $('curtain'),
      playing: () => { const a = app(), c = $('curtain'); return Boolean(a && a.world && !a.paused && c && c.hidden); },
      risky: () => { const a = app(), w = a && a.world; return Boolean(w && ((a.paused && /^(playing|transition)$/.test(w.state)) || w.state === 'lost')); },
      mainMenu: () => app().mainMenu(),
      // Machine Trials only has a hub session the tab already holds (feedback-link.js picks it up).
      async hub() {
        const sdk = await attempt(() => root.ArcadeFeedback.sdk(), Promise.resolve(null)).catch(() => null);
        if (sdk && typeof sdk.getSession === 'function' && attempt(() => sdk.getSession(), null)) { sdk.exit('return'); return; }
        api.navigate(hubUrl());
      }
    }
  };
  const page = pages[profile];
  const screen = () => doc.querySelector('.screen');

  // ------------------------------------------------------------------ styles shared by both pages
  // Colours and fonts come from each page's --menu-* custom properties, so the panels keep its look.
  const style = doc.createElement('style');
  style.textContent = `
.menu-panel{position:absolute;inset:0;z-index:30;display:flex;padding:clamp(6px,1.2cqw,20px);background:var(--menu-scrim,#0009);overflow:auto;font-family:var(--menu-font,system-ui,sans-serif);color:var(--menu-text,#fff)}
.menu-panel[hidden]{display:none!important}
.menu-panel-card{margin:auto;width:min(980px,100%);background:var(--menu-panel,#211122);border:1px solid var(--menu-border,#b88a53);border-radius:var(--menu-radius,4px);padding:clamp(10px,1.5cqw,20px) clamp(10px,1.8cqw,22px);box-shadow:0 10px 40px #000a;text-align:left}
.menu-panel h2{margin:0 0 .25em;font:900 clamp(18px,2.6cqw,34px)/1.05 var(--menu-title-font,inherit);color:var(--menu-accent,#ffcc59)}
.menu-panel p{margin:.35em 0;font-size:clamp(11px,1.05cqw,14px);line-height:1.45;color:var(--menu-muted,#ded0b2);font-weight:500;max-width:none}
.menu-panel button{font:800 clamp(11px,1cqw,14px) var(--menu-font,system-ui,sans-serif);letter-spacing:.04em;text-transform:none;border:1px solid var(--menu-border,#79543f);background:var(--menu-slot,#25192c);color:var(--menu-text,#fff);padding:.3em .8em;border-radius:var(--menu-radius,3px);cursor:pointer;box-shadow:none;min-width:5.5em}
.menu-panel button:hover{filter:brightness(1.25)}
.menu-panel button:focus-visible,.menu-panel select:focus-visible{outline:3px solid var(--menu-focus,#fff);outline-offset:2px}
.menu-panel button.primary{background:var(--menu-accent,#ffcc59);color:var(--menu-accent-text,#21131d);border-color:var(--menu-accent,#ffcc59)}
.menu-panel button.waiting{background:var(--menu-accent,#ffcc59);color:var(--menu-accent-text,#21131d);animation:menu-blink 1s steps(2) infinite}
@keyframes menu-blink{50%{filter:brightness(.8)}}@media(prefers-reduced-motion:reduce){.menu-panel button.waiting{animation:none}}
.controls-table{width:100%;border-collapse:collapse;margin:.4em 0;font-size:clamp(11px,1.05cqw,14px)}
.controls-table th,.controls-table td{padding:.16em .35em;border-bottom:1px solid var(--menu-rule,#ffffff1a);text-align:left;vertical-align:middle}
.controls-table thead th{color:var(--menu-accent,#ffcc59);font-size:.85em;letter-spacing:.12em;text-transform:uppercase}
.controls-table tbody th{font-weight:700;color:var(--menu-text,#fff)}
.controls-table .fixed{color:var(--menu-muted,#ccc);font-weight:500}
.controls-fixed{display:flex;flex-wrap:wrap;gap:2px 18px;margin:.2em 0;padding:0;list-style:none;font-size:clamp(10px,.95cqw,13px);color:var(--menu-muted,#ccc)}.controls-fixed b{color:var(--menu-text,#fff)}
.controls-table button{width:100%}
.menu-panel-row{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:space-between;margin-top:.4em}
.menu-panel-row label{display:flex;gap:.6em;align-items:center;font-size:clamp(11px,1.05cqw,14px);font-weight:700;text-transform:none;letter-spacing:0;color:var(--menu-text,#fff)}
.menu-panel select{font:inherit;font-size:clamp(11px,1.05cqw,14px);padding:.3em .5em;background:var(--menu-slot,#25192c);color:var(--menu-text,#fff);border:1px solid var(--menu-border,#79543f);border-radius:var(--menu-radius,3px)}
.menu-panel-actions{display:flex;gap:10px;flex-wrap:wrap}
#controls-status{min-height:1.4em;margin:.2em 0;color:var(--menu-accent,#ffcc59);font-weight:700}
.menu-confirm .menu-panel-card{width:min(520px,100%);text-align:center}.menu-confirm .menu-panel-actions{justify-content:center;margin-top:1em}
#menu-toast{position:absolute;left:50%;bottom:12%;transform:translateX(-50%);z-index:40;max-width:80%;padding:.5em 1em;background:var(--menu-panel,#211122);color:var(--menu-text,#fff);border:1px solid var(--menu-border,#b88a53);border-radius:var(--menu-radius,4px);font:700 clamp(11px,1.1cqw,14px) var(--menu-font,system-ui,sans-serif);pointer-events:none}
#menu-toast[hidden]{display:none}`;
  doc.head.appendChild(style);

  // ------------------------------------------------------------------ panels
  let active = null;
  function setUnderlayInert(on) {
    const menu = page.menu();
    if (menu) menu.inert = on;
  }
  function focus(el) { if (!el) return; try { el.focus({ focusVisible: true }); } catch { el.focus(); } }
  function openPanel(el, spec) {
    if (active) closePanel(true);
    const previous = doc.activeElement;
    el.hidden = false;
    setUnderlayInert(true);
    active = { el, previous, ...spec };
    focus(spec.primary());
  }
  function closePanel(silent) {
    const a = active;
    if (!a) return;
    active = null;
    a.el.hidden = true;
    setUnderlayInert(false);
    if (a.onClose && !silent) a.onClose();
    if (!silent && a.previous && a.previous.isConnected && visible(a.previous)) focus(a.previous);
  }
  function makePanel(id, className, label) {
    const el = doc.createElement('div');
    el.id = id;
    el.className = 'menu-panel ' + className;
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', id + '-title');
    const card = doc.createElement('div');
    card.className = 'menu-panel-card';
    const h = doc.createElement('h2');
    h.id = id + '-title';
    h.textContent = label;
    card.appendChild(h);
    el.appendChild(card);
    (screen() || doc.body).appendChild(el);
    return { el, card };
  }
  const button = (text, attrs) => { const b = doc.createElement('button'); b.type = 'button'; b.textContent = text; for (const [k, v] of Object.entries(attrs || {})) b.setAttribute(k, v); return b; };
  const cell = (tag, text, attrs) => { const c = doc.createElement(tag); if (text !== undefined) c.textContent = text; for (const [k, v] of Object.entries(attrs || {})) c.setAttribute(k, v); return c; };

  // ---- Leave-the-run confirm.
  let confirmPanel = null;
  function confirmLeave(question, onYes) {
    if (!confirmPanel) {
      const { el, card } = makePanel('menu-confirm', 'menu-confirm', 'Leave this run?');
      const text = cell('p', '');
      const row = cell('div', undefined, { class: 'menu-panel-actions' });
      const yes = button('Leave run', { id: 'menu-confirm-yes' }), no = button('Stay', { id: 'menu-confirm-no', class: 'primary' });
      row.append(yes, no);
      card.append(text, row);
      confirmPanel = { el, text, yes, no, onYes: null };
      yes.addEventListener('click', () => { const go = confirmPanel.onYes; closePanel(true); if (go) go(); });
      no.addEventListener('click', () => closePanel());
    }
    confirmPanel.text.textContent = question;
    confirmPanel.onYes = onYes;
    openPanel(confirmPanel.el, {
      items: () => [confirmPanel.yes, confirmPanel.no],
      primary: () => confirmPanel.no,
      back: () => closePanel()
    });
  }

  // ---- Controller settings.
  let controlsPanel = null;
  const C = () => root.ArcadeControls || null;
  function buildControls() {
    const controls = C();
    const { el, card } = makePanel('controls-panel', 'controls-panel', 'Controller settings');
    card.appendChild(cell('p', 'Choose a slot, then press the new key or button. Esc cancels; B cancels a key slot, Start a button slot; Backspace clears a key slot. A key or button in use elsewhere is swapped. Saved on this device, applied at once.', { class: 'menu-panel-hint' }));
    const table = cell('table', undefined, { class: 'controls-table' });
    const head = cell('thead');
    const hr = cell('tr');
    hr.append(cell('th', 'Action', { scope: 'col' }), cell('th', 'Keyboard', { scope: 'col', colspan: '2' }), cell('th', 'Controller', { scope: 'col', colspan: '2' }));
    head.appendChild(hr);
    const body = cell('tbody');
    const slotButtons = [];
    for (const action of controls.actions) {
      const tr = cell('tr', undefined, { 'data-action': action.id });
      tr.appendChild(cell('th', action.label, { scope: 'row' }));
      for (let slot = 0; slot < controls.state.keys[action.id].length; slot++) {
        const td = cell('td');
        if (action.fixedFirstKey && slot === 0) { td.className = 'fixed'; td.textContent = controls.keyLabel(action.keys[0]) + ' (fixed)'; }
        else { const b = button('', { 'data-kind': 'key', 'data-slot': String(slot), 'data-action': action.id }); slotButtons.push(b); td.appendChild(b); }
        tr.appendChild(td);
      }
      if (action.pad) {
        for (let slot = 0; slot < 2; slot++) {
          const td = cell('td');
          const b = button('', { 'data-kind': 'pad', 'data-slot': String(slot), 'data-action': action.id });
          slotButtons.push(b);
          td.appendChild(b);
          tr.appendChild(td);
        }
      } else tr.appendChild(cell('td', action.padFixed + ' (fixed)', { colspan: '2', class: 'fixed' }));
      body.appendChild(tr);
    }
    table.append(head, body);
    card.appendChild(table);
    // Keys that are not player actions and never move: one compact list under the table.
    const fixedList = cell('ul', undefined, { class: 'controls-fixed', 'aria-label': 'Fixed keys' });
    for (const row of controls.fixed) {
      const li = cell('li');
      li.append(cell('b', row.label), cell('span', ' ' + row.keys + (row.pad && row.pad !== '—' ? ' · ' + row.pad : '')));
      fixedList.appendChild(li);
    }
    card.appendChild(fixedList);
    const settings = cell('div', undefined, { class: 'menu-panel-row' });
    const label = cell('label');
    label.append(cell('span', 'Left stick dead zone'));
    const dead = cell('select', undefined, { id: 'controls-deadzone' });
    const { min, max, step } = root.SprotoControls.DEADZONE;
    for (let v = min; v <= max + 1e-9; v += step) {
      const value = Math.round(v * 100) / 100;
      dead.appendChild(new Option(Math.round(value * 100) + '%' + (value === 0.2 ? ' (default)' : ''), String(value)));
    }
    label.appendChild(dead);
    settings.appendChild(label);
    settings.appendChild(cell('span', 'No vibration setting: this game has no rumble.', { class: 'fixed', style: 'font-size:.85em;opacity:.8' }));
    card.appendChild(settings);
    const status = cell('p', '', { id: 'controls-status', role: 'status', 'aria-live': 'polite' });
    card.appendChild(status);
    const actions = cell('div', undefined, { class: 'menu-panel-row' });
    const buttons = cell('div', undefined, { class: 'menu-panel-actions' });
    const reset = button('Reset to defaults', { id: 'controls-reset' }), back = button('Back', { id: 'controls-back', class: 'primary' });
    buttons.append(reset, back);
    actions.appendChild(buttons);
    card.appendChild(actions);

    function paint() {
      const c = C(), s = c.state, waiting = c.capturing;
      for (const b of slotButtons) {
        const kind = b.dataset.kind, slot = Number(b.dataset.slot), action = b.dataset.action;
        const isWaiting = waiting && waiting.action === action && waiting.slot === slot && (waiting.device === 'pad') === (kind === 'pad');
        const value = kind === 'pad' ? s.pad[action][slot] : s.keys[action][slot];
        b.classList.toggle('waiting', Boolean(isWaiting));
        b.textContent = isWaiting ? (kind === 'pad' ? 'Press a button…' : 'Press a key…') : (kind === 'pad' ? c.padLabel(value) : c.keyLabel(value));
        const actionLabel = c.actions.find(a => a.id === action).label;
        b.setAttribute('aria-label', `${actionLabel}, ${kind === 'pad' ? 'controller' : 'keyboard'} slot ${slot + 1}: ${value ? b.textContent : 'empty'}`);
      }
      dead.value = String(s.deadzone);
    }
    for (const b of slotButtons) {
      b.addEventListener('click', () => {
        const device = b.dataset.kind === 'pad' ? 'pad' : 'key';
        status.textContent = device === 'pad' ? 'Press a controller button for this slot. Start or Esc cancels.' : 'Press a key for this slot. Esc or B cancels, Backspace clears it.';
        C().beginCapture({
          action: b.dataset.action, slot: Number(b.dataset.slot), device,
          message: text => { status.textContent = text; },
          done: (result, text) => { status.textContent = text || ''; paint(); }
        });
        paint();
      });
    }
    dead.addEventListener('change', () => { C().setDeadzone(Number(dead.value)); status.textContent = 'Dead zone ' + Math.round(Number(dead.value) * 100) + '%. Saved.'; });
    reset.addEventListener('click', () => { C().reset(); status.textContent = 'Defaults restored.'; });
    back.addEventListener('click', () => closePanel());
    controls.onChange(() => paint());
    paint();
    return { el, status, items: () => [...el.querySelectorAll('button, select')].filter(visible), primary: () => slotButtons[0] || back, back: () => { if (C().capturing) C().cancelCapture(); else closePanel(); }, paint };
  }
  function openControls() {
    if (!C()) return;
    controlsPanel ||= buildControls();
    controlsPanel.status.textContent = '';
    controlsPanel.paint();
    openPanel(controlsPanel.el, { items: controlsPanel.items, primary: controlsPanel.primary, back: controlsPanel.back, onClose: () => { if (C().capturing) C().cancelCapture(); } });
  }

  // ------------------------------------------------------------------ full screen
  let toastTimer = 0;
  function toast(text) {
    let el = $('menu-toast');
    if (!el) { el = cell('div', '', { id: 'menu-toast', role: 'status', 'aria-live': 'polite' }); (screen() || doc.body).appendChild(el); }
    el.textContent = text;
    el.hidden = false;
    root.clearTimeout(toastTimer);
    toastTimer = root.setTimeout(() => { el.hidden = true; }, 3200);
  }
  const fullscreenButtons = () => [...doc.querySelectorAll('[data-menu="fullscreen"]')];
  function paintFullscreen() {
    const on = Boolean(doc.fullscreenElement), enabled = Boolean(doc.fullscreenEnabled);
    for (const b of fullscreenButtons()) {
      b.hidden = !enabled;
      b.textContent = 'Full screen: ' + (on ? 'On' : 'Off');
      b.setAttribute('aria-pressed', String(on));
    }
  }
  // Called straight from the click (mouse, Enter/Space, or the pad's A via gamepad.js), so the
  // browser sees the user gesture it requires. A refusal (no gesture, or a locked-down frame) is
  // caught and explained instead of becoming an unhandled rejection.
  function toggleFullscreen() {
    api.fullscreenRequests++;
    try {
      const pending = doc.fullscreenElement ? doc.exitFullscreen() : doc.documentElement.requestFullscreen({ navigationUI: 'hide' });
      if (pending && typeof pending.catch === 'function') pending.catch(() => toast('The browser refused full screen. Click the option again, or press F11.'));
    } catch { toast('The browser refused full screen. Press F11 instead.'); }
  }
  doc.addEventListener('fullscreenchange', paintFullscreen);

  // ------------------------------------------------------------------ menu options
  function leave(kind) {
    const go = kind === 'hub' ? () => { page.hub(); } : () => page.mainMenu();
    if (page.risky()) confirmLeave(kind === 'hub' ? 'Go to the hub? This run ends and its progress is lost.' : 'Go to the main menu? This run ends and its progress is lost.', go);
    else go();
  }
  doc.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('[data-menu]');
    if (!b || b.disabled) return;
    const what = b.dataset.menu;
    if (what === 'fullscreen') toggleFullscreen();
    else if (what === 'controls') openControls();
    else if (what === 'main') leave('main');
    else if (what === 'hub') leave('hub');
  });

  // Keys while a panel is open, and Esc in full screen. Runs before the games' own handlers.
  root.addEventListener('keydown', e => {
    if (!e.isTrusted) return;
    if (e.code === 'Escape' && doc.fullscreenElement && !page.playing() && !attempt(() => C().capturing, null)) {
      // The browser leaves full screen on this Esc. On a menu that is all it does: it does not
      // also resume the game or close the panel underneath (in play, Esc still pauses as well).
      e.stopImmediatePropagation();
      return;
    }
    if (!active) return;
    e.stopPropagation(); // the game underneath must not act (R retry, Esc resume, ...)
    if (e.code === 'Escape' && !e.repeat) { e.preventDefault(); active.back(); }
  }, true);

  // Story: the weapons bar sits along the bottom of the game screen; menus stop above it.
  const weapons = doc.querySelector('.screen .weapons');
  if (weapons && typeof root.ResizeObserver === 'function') {
    new root.ResizeObserver(() => { const s = screen(); if (s) s.style.setProperty('--hud-bottom', weapons.offsetHeight + 'px'); }).observe(weapons);
  }

  // Key names printed in the page ([data-bind="<action>"]): the original text while the player
  // keeps the default binding, else the bound keys; data-pad (the controller label) likewise.
  function paintLabels() {
    const c = C();
    if (!c) return;
    for (const el of doc.querySelectorAll('[data-bind]')) {
      const action = el.dataset.bind;
      if (el.dataset.keyDefault === undefined) el.dataset.keyDefault = el.textContent;
      if (el.hasAttribute('data-pad') && el.dataset.padDefault === undefined) el.dataset.padDefault = el.dataset.pad;
      el.textContent = c.prompt(action, el.dataset.keyDefault);
      if (el.dataset.padDefault !== undefined) el.dataset.pad = c.padPrompt(action, el.dataset.padDefault);
    }
  }
  if (C()) { C().onChange(paintLabels); paintLabels(); }

  const api = {
    profile,
    hubUrl,
    fullscreenRequests: 0,
    /** Overridable for tests: how the Hub option leaves the page when no hub session is live. */
    navigate: url => root.location.assign(url),
    activePanel: () => (active ? { items: () => active.items().filter(visible), primary: active.primary, back: active.back, start: null } : null),
    openControls,
    closePanel: () => closePanel(),
    toggleFullscreen
  };
  root.ArcadeMenus = api;
  paintFullscreen();
})(window);
