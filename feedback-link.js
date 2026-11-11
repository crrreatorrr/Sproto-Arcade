/* In-game feedback for both pages. Classic script, loaded last with data-profile="story"
 * (legacy.html, after hub-link.js and game.js) or "trials" (index.html, after rework.js).
 *
 * N twice pauses the game and opens the hub SDK's feedback window (metaverse-hub docs/feedback.md);
 * closing it puts the game back exactly as it was. The window, the screenshot and the sending all
 * live in the SDK (vendor/hub-sdk/hub-sdk.iife.js, HubSDK.installFeedback). This file only tells it
 * how to pause each page, what "right now" looks like, and which game events to remember.
 *
 * Feedback is for signed-in hub players. Without a hub session the window is replaced by a
 * one-line message, and without the SDK (a page opened with no vendor/ folder) nothing is
 * installed and N does nothing. Nothing here runs per frame: the game-event watcher looks at the
 * game four times a second and never writes to it. */
(function (root) {
  'use strict';
  const doc = root.document;
  const profile = doc && doc.currentScript && doc.currentScript.dataset.profile;
  if (profile !== 'story' && profile !== 'trials') return;
  const GAME_ID = 'sproto-arcade';
  const $ = (id) => doc.getElementById(id);
  const attempt = (fn, fallback) => {
    try {
      const value = fn();
      return value === undefined ? fallback : value;
    } catch {
      return fallback;
    }
  };
  const round = (n) => (typeof n === 'number' && Number.isFinite(n) ? Math.round(n * 10) / 10 : null);
  const seconds = (ticks) => (typeof ticks === 'number' && Number.isFinite(ticks) ? Math.round((ticks / 60) * 100) / 100 : null);
  const two = (n) => String(n).padStart(2, '0');
  /** The ?v= cache hash of one of the page's scripts: the only build id a static page has. */
  const scriptHash = (name) => attempt(() => (doc.querySelector(`script[src^="${name}?v="]`).getAttribute('src').split('?v=')[1] || ''), '');
  const pickupShield = (items, tick) => attempt(() => Boolean(items && root.ArcadePhasePowerups.activeShield(items, tick)), false);
  /** Pickups collected since the last look: a plan is done while its pickup had not yet expired. */
  function pickupWatcher() {
    let key = null, pending = new Map();
    return (items, tick, report) => {
      if (!items) { key = null; pending = new Map(); return; }
      if (items !== key) { key = items; pending = new Map(); }
      for (const plan of items.plans || []) {
        if (plan.done && pending.has(plan.id) && tick < pending.get(plan.id)) report(plan.kind);
        if (plan.done) pending.delete(plan.id);
      }
      for (const p of items.pickups || []) pending.set(p.id, p.expiresAt);
    };
  }
  let deaths = 0;

  // ------------------------------------------------------------------ story mode (legacy.html)
  // game.js keeps its state in top-level script bindings; they are read here and never written.
  // Pausing goes through game.js's own feedbackPause/feedbackResume.
  /* global mode, player, boss, time, camera, levelIndex, LEVELS, STORY_BOSS_IDS, phasePowerupsState,
     phaseCheckpointRun, selectedSproto, godMode, godUsed, campaignLevelNumber, campaignLevelIndices,
     isFlying, isChase, isCodebreak, feedbackPause, feedbackResume, MAX_HP, ARCADE_SIM_VERSION */
  const story = {
    title: 'Sproto Arcade',
    version: () => ['story', 'sim ' + attempt(() => ARCADE_SIM_VERSION, '?'), 'game.js ' + scriptHash('game.js')].join(' · '),
    canvas: () => doc.querySelector('.screen canvas'),
    theme: { font: 'system-ui, sans-serif', titleFont: 'Georgia, serif', background: 'rgba(22, 12, 27, 0.78)', panel: '#211122',
      text: '#fff0c9', muted: '#ded0b2', accent: '#ffcc59', accentText: '#21131d', border: '#b88a53', radius: '3px' },
    enabled: () => true,
    pause: () => ({ before: feedbackPause() }),
    resume: (token) => feedbackResume(token && token.before),
    sdk: async () => {
      const hub = root.ArcadeHub;
      if (!hub) return null;
      await hub.ready;
      return hub.sdk;
    },
    onHub: (fn) => attempt(() => root.ArcadeHub.onChange(fn), null),
    context() {
      const index = attempt(() => levelIndex, undefined), level = attempt(() => LEVELS[index], null);
      const p = attempt(() => player, null), b = attempt(() => boss, null), power = attempt(() => phasePowerupsState, null);
      const out = { mode: 'story', extra: { state: attempt(() => mode, ''), simVersion: attempt(() => ARCADE_SIM_VERSION, ''), difficulty: 'standard' } };
      if (!level) return out;
      out.level = two(level.id) + ' ' + level.title;
      Object.assign(out.extra, {
        levelId: level.id, levelName: level.title,
        campaignOrder: attempt(() => campaignLevelNumber(index), null), campaignLength: attempt(() => campaignLevelIndices().length, null),
        kind: attempt(() => (isChase() ? 'chase' : isCodebreak() ? 'codebreak' : isFlying() ? 'flight' : 'ground'), ''),
        pilot: attempt(() => selectedSproto.id, ''), checkpointRun: attempt(() => phaseCheckpointRun, false),
        godMode: attempt(() => godMode, false), godUsed: attempt(() => godUsed, false),
      });
      if (b) Object.assign(out.extra, { boss: attempt(() => STORY_BOSS_IDS[index], b.id), bossName: b.name, bossPhase: b.phase, bossHp: round(b.hp), bossMaxHp: round(b.max) });
      if (power) Object.assign(out.extra, { seed: power.seed, phaseTime: seconds(power.tick) });
      if (!p) return out;
      out.position = { x: round(p.x), y: round(p.y) };
      out.extra.camera = round(attempt(() => camera, null));
      out.gameTime = attempt(() => time / 60, undefined);
      out.player = { hearts: p.hp, maxHearts: attempt(() => MAX_HP, null), shield: p.shield > 0, shieldReady: !p.shieldWait,
        pickupShield: pickupShield(power && power.items, power && power.tick), dashReady: !p.dashWait, retries: deaths };
      return out;
    },
    watcher(crumb) {
      const pickups = pickupWatcher();
      let last = { mode: '', index: -1, time: 0, phase: 0 };
      return () => {
        const now = { mode: mode, index: levelIndex, time: time || 0, phase: boss && !isChase() ? boss.phase : 0 };
        const level = LEVELS[now.index];
        if (!level) return;
        const where = { level: level.id, phase: now.phase || undefined, t: seconds(now.time) };
        if (now.mode === 'play' && (now.index !== last.index || now.time < last.time || !last.mode || /^(title|won|clear|lost|loading)$/.test(last.mode))) {
          crumb(last.mode === 'lost' && now.index === last.index ? 'retry' : 'level_start', { level: level.id, name: level.title, phase: now.phase || undefined });
        } else if (now.phase && last.phase && now.phase !== last.phase && now.index === last.index) crumb('phase_change', where);
        if (now.mode !== last.mode) {
          if (now.mode === 'lost') { deaths++; crumb('player_death', where); }
          else if (now.mode === 'clear' || now.mode === 'won') crumb('boss_defeated', where);
        }
        if (phasePowerupsState) pickups(phasePowerupsState.items, phasePowerupsState.tick, (kind) => crumb('pickup_collected', { kind, ...where }));
        last = now;
      };
    },
  };

  // ------------------------------------------------------------------ Machine Trials (index.html)
  const app = () => root.ArcadeApp;
  let trialsSdk;
  const trials = {
    title: 'Sproto Arcade · Machine Trials',
    version: () => ['trials', 'rework.js ' + scriptHash('rework.js')].join(' · '),
    canvas: () => $('arena'),
    theme: { font: 'system-ui, sans-serif', titleFont: 'inherit', background: 'rgba(9, 19, 30, 0.86)', panel: '#20303d',
      text: '#f6ebd0', muted: '#acb9c0', accent: '#ffce7a', accentText: '#17212b', border: '#53636d', radius: '4px' },
    // While the dash key is being remapped, N goes to the game, which refuses it as reserved.
    enabled: () => !attempt(() => app().remapping, false),
    pause: () => ({ before: app().feedbackPause() }),
    resume: (token) => app().feedbackResume(token && token.before),
    // Story mode holds the hub link (hub-link.js). This page only picks up the session the same tab
    // already has; with none, init() makes no request and the page stays offline as before.
    sdk: () => (trialsSdk ??= (async () => {
      if (!root.HubSDK || !root.HubSDK.createHubSdk) return null;
      const config = { serverUrl: '', serverKey: '', hubUrl: '/hub/', ...(root.SPROTO_ARCADE_HUB || {}) };
      const sdk = root.HubSDK.createHubSdk({ serverUrl: config.serverUrl, serverKey: config.serverKey, hubUrl: config.hubUrl || '/hub/' });
      try {
        await sdk.init(GAME_ID);
      } catch (e) {
        console.warn('hub session unavailable', e);
      }
      return sdk;
    })()),
    onHub: () => null,
    context() {
      const w = attempt(() => app().world, null);
      const out = { mode: 'machine-trials', extra: { state: w ? w.state : 'setup', paused: attempt(() => app().paused, false), difficulty: 'standard' } };
      if (!w) return out;
      const stage = w.stage || {}, phase = w.phase || {}, p = w.player || {};
      // Trials stages have their own coordinates: keep their notes apart from story mode's levels.
      out.level = 'Trials ' + two(stage.number) + ' ' + stage.title;
      out.position = { x: round(p.x), y: round(p.y) };
      out.gameTime = attempt(() => w.tick / 60, undefined);
      out.player = { hearts: p.hp, shield: Boolean(p.shield), shieldReady: !p.shieldWait, pickupShield: pickupShield(w.phasePowerups, attempt(() => w.phaseElapsed, 0)),
        dashReady: !p.dashWait, retries: attempt(() => w.attempt, null) ?? deaths, weapon: attempt(() => w.weapons.snapshot()?.weapon, null) ?? null };
      Object.assign(out.extra, {
        levelId: stage.number, stageId: stage.id, levelName: stage.title,
        campaignOrder: attempt(() => [...$('stage').options].findIndex((o) => o.value === stage.id) + 1, null),
        boss: stage.operator, bossPhase: w.phaseIndex + 1, phaseName: phase.name, machine: phase.machine, phaseKind: phase.mode,
        phaseTime: seconds(attempt(() => w.phaseElapsed, null)), progress: round(w.progress), seed: w.seed,
        entry: w.checkpointRetry ? 'checkpoint' : w.practice ? 'practice' : 'full', failure: w.failure || undefined,
        pilot: attempt(() => $('pilot').value, ''), camera: attempt(() => ({ x: round(w.camera.x), y: round(w.camera.y) }), null),
        dashKey: attempt(() => app().dashKey, ''),
      });
      return out;
    },
    watcher(crumb) {
      const pickups = pickupWatcher();
      let last = { world: null, tick: 0, phase: 0, state: '' };
      return () => {
        const w = app() && app().world;
        if (!w) return;
        const now = { world: w, tick: w.tick, phase: w.phaseIndex + 1, state: w.state };
        const where = { level: w.stage.number, stage: w.stage.id, phase: now.phase, t: seconds(now.tick) };
        if (now.world !== last.world) crumb('level_start', { ...where, entry: w.practice ? 'practice' : 'full', seed: w.seed });
        else if (now.tick < last.tick) crumb('retry', where);
        else if (now.phase !== last.phase) crumb('phase_change', where);
        if (now.state !== last.state || now.world !== last.world) {
          if (now.state === 'lost') { deaths++; crumb('player_death', { ...where, cause: w.failure || undefined }); }
          else if (now.state === 'clear') crumb('boss_defeated', where);
        }
        pickups(w.phasePowerups, w.phaseElapsed, (kind) => crumb('pickup_collected', { kind, ...where }));
        last = now;
      };
    },
  };

  const page = profile === 'story' ? story : trials;
  const button = $('feedback-open');
  let handle = null, allowed = false, transport = null;
  const api = {
    profile,
    get handle() { return handle; },
    /** True once the hub says this player may send feedback; the pause screen's button follows it. */
    get allowed() { return allowed; },
    isOpen: () => Boolean(handle && handle.isOpen()),
    open: () => { if (handle) handle.open(); },
    context: () => attempt(() => page.context(), {}),
    ready: null,
  };
  root.ArcadeFeedback = api;

  function showButton() {
    if (!button) return;
    // Story mode: the stylesheet shows the button only on the Paused screen. Machine Trials:
    // rework.js sets it each time a curtain opens; this covers a curtain that is already up.
    if (profile === 'story') button.hidden = !allowed;
    else if (!allowed) button.hidden = true;
    else if (attempt(() => app().paused && !$('curtain').hidden && /^(playing|transition)$/.test(app().world.state), false)) button.hidden = false;
  }
  async function refreshAccess() {
    if (!transport) return;
    const access = await transport.access().catch(() => null);
    allowed = Boolean(access && access.ok);
    showButton();
  }

  async function install() {
    const sdk = await page.sdk();
    const lib = root.HubSDK;
    if (!sdk || !lib || !lib.installFeedback || !lib.feedbackTransportFromSdk) return null;
    transport = lib.feedbackTransportFromSdk(sdk);
    handle = lib.installFeedback({
      title: page.title,
      version: page.version(),
      transport,
      pause: () => page.pause(),
      resume: (token) => page.resume(token),
      context: () => attempt(() => page.context(), { mode: profile }),
      canvases: () => [page.canvas()].filter(Boolean),
      // The crash guard keeps one "message + stack" signature per distinct error it has seen.
      errors: () => attempt(() => [...root.ArcadeCrash.guard.logged].slice(-10).map((text) => ({ message: String(text).split('\n')[0], stack: String(text) })), []),
      enabled: () => attempt(() => page.enabled(), true),
      theme: page.theme,
    });
    const tick = page.watcher((type, data) => handle.breadcrumb(type, data));
    root.setInterval(() => attempt(tick), 250);
    if (button) button.addEventListener('click', () => handle.open());
    // A hub sign-in or sign-out changes who may send.
    let status = null;
    page.onHub((state) => { if (state.status !== status) { status = state.status; void refreshAccess(); } });
    await refreshAccess();
    return handle;
  }
  api.ready = install().catch((e) => { console.warn('feedback unavailable', e); return null; });
})(window);
