/* Controller mapping rules (gamepad.js): deadzone, triggers, latch on connect, hot-plug, layouts,
 * edge detection, menu direction and auto-repeat, spatial focus, keyboard menu keys. Fake Gamepad objects. Node only. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'gamepad.js'), 'utf8'), ctx, { filename: 'gamepad.js' });
const G = ctx.SprotoGamepad;
const { BUTTON, PROFILES, TUNING } = G;
const check = (name, fn) => { fn(); console.log('PASS ' + name); };
const sorted = (set) => [...set].sort();
const plain = (v) => JSON.parse(JSON.stringify(v)); // vm-realm arrays to this realm

// A fake standard-mapping pad: pressed button names, analog values and axes.
function pad({ index = 0, id = 'Fake pad (STANDARD GAMEPAD)', down = [], values = {}, axes = [0, 0, 0, 0], mapping = 'standard', connected = true } = {}) {
  const buttons = Array.from({ length: 17 }, (_, i) => ({ pressed: false, value: 0 }));
  for (const name of down) buttons[BUTTON[name]] = { pressed: true, value: 1 };
  for (const [name, value] of Object.entries(values)) buttons[BUTTON[name]] = { pressed: value > 0, value };
  return { index, id, mapping, connected, buttons, axes };
}
const snap = (over = {}) => ({ connected: true, buttons: new Array(17).fill(false), stick: { x: 0, y: 0, magnitude: 0 }, ...over });
const withButtons = (...names) => { const b = new Array(17).fill(false); for (const n of names) b[BUTTON[n]] = true; return snap({ buttons: b }); };

check('radial deadzone ignores drift and rescales from zero', () => {
  assert.equal(G.radialDeadzone(0.15, 0.1, 0.2).magnitude, 0);
  const just = G.radialDeadzone(0.21, 0, 0.2);
  assert.ok(just.magnitude > 0 && just.magnitude < 0.02, 'motion starts smoothly just past the deadzone');
  assert.equal(G.radialDeadzone(1, 0, 0.2).x, 1);
  const diag = G.radialDeadzone(0.6, 0.6, 0.2);
  assert.ok(Math.abs(diag.x - diag.y) < 1e-12, 'radial: direction preserved');
  assert.equal(G.radialDeadzone(2, 0, 0.2).magnitude, 1, 'clamped');
  assert.equal(G.radialDeadzone(undefined, NaN, 0.2).magnitude, 0);
});

check('triggers count as pressed only past 0.5', () => {
  assert.equal(G.readButtons(pad({ values: { RT: 0.4 } }))[BUTTON.RT], false);
  assert.equal(G.readButtons(pad({ values: { RT: 0.6 } }))[BUTTON.RT], true);
  // Some browsers report pressed:true for a trigger at any value; the threshold still applies.
  const light = pad(); light.buttons[BUTTON.LT] = { pressed: true, value: 0.1 };
  assert.equal(G.readButtons(light)[BUTTON.LT], false);
  assert.equal(G.readButtons(pad({ down: ['A'] }))[BUTTON.A], true);
  assert.equal(G.readButtons({ buttons: [1, 0] })[BUTTON.A], true, 'numeric button values');
});

check('player 1 is the first standard pad; empty slots and disconnected pads are skipped', () => {
  assert.equal(G.choosePad([null, pad({ index: 1 }), pad({ index: 2 })]).index, 1);
  assert.equal(G.choosePad([pad({ index: 0, mapping: '' }), pad({ index: 1 })]).index, 1);
  assert.equal(G.choosePad([pad({ index: 0, mapping: '' })]).index, 0, 'non-standard pad still works alone');
  assert.equal(G.choosePad([pad({ connected: false })]), null);
  assert.equal(G.choosePad(null), null);
});

check('buttons held when the pad appears are latched until released', () => {
  const t = G.createTracker();
  let s = t.update([pad({ down: ['A'], axes: [0.9, 0] })]);
  assert.equal(s.justConnected, true);
  assert.equal(s.buttons[BUTTON.A], false, 'the hub portal press does not reach the game');
  assert.equal(s.stick.magnitude, 0, 'a held stick is latched too');
  s = t.update([pad({ down: ['A', 'B'], axes: [0.9, 0] })]);
  assert.equal(s.justConnected, false);
  assert.equal(s.buttons[BUTTON.A], false, 'still held, still latched');
  assert.equal(s.buttons[BUTTON.B], true, 'a new press counts');
  s = t.update([pad({ axes: [0, 0] })]);
  s = t.update([pad({ down: ['A'], axes: [0.9, 0] })]);
  assert.equal(s.buttons[BUTTON.A], true, 'released then pressed again counts');
  assert.ok(s.stick.magnitude > 0.8);
});

check('hot-plug: unplug clears state, a reconnect or a different pad latches again', () => {
  const t = G.createTracker();
  t.update([pad()]);
  assert.equal(t.update([pad({ down: ['X'] })]).buttons[BUTTON.X], true);
  assert.equal(t.update([]).connected, false);
  let s = t.update([pad({ down: ['X'] })]);
  assert.equal(s.justConnected, true);
  assert.equal(s.buttons[BUTTON.X], false, 'reconnect latches');
  s = t.update([pad({ id: 'Other pad', down: ['Y'] })]);
  assert.equal(s.justConnected, true, 'a different device is a new connection');
  assert.equal(s.buttons[BUTTON.Y], false);
});

check('latchAll ignores everything held at a screen change', () => {
  const t = G.createTracker();
  t.update([pad()]);
  assert.equal(t.update([pad({ down: ['A'] })]).buttons[BUTTON.A], true);
  t.latchAll();
  assert.equal(t.update([pad({ down: ['A'] })]).buttons[BUTTON.A], false, 'the A that started a run does not jump');
  t.update([pad()]);
  assert.equal(t.update([pad({ down: ['A'] })]).buttons[BUTTON.A], true);
});

check('story layout produces exactly the keyboard codes game.js reads', () => {
  const story = PROFILES.story;
  const codes = (s, c) => sorted(G.gameplayCodes(s, story, c || {}));
  assert.deepEqual(codes(withButtons('A')), ['Space']);
  assert.deepEqual(codes(withButtons('B')), ['ShiftLeft']);
  assert.deepEqual(codes(withButtons('RT')), ['ShiftLeft']);
  assert.deepEqual(codes(withButtons('X')), ['KeyX']);
  assert.deepEqual(codes(withButtons('LT')), ['KeyX']);
  assert.deepEqual(codes(withButtons('Y')), ['KeyC']);
  assert.deepEqual(codes(withButtons('RB')), ['KeyV']);
  assert.deepEqual(codes(withButtons('LB', 'VIEW', 'L3', 'R3', 'HOME')), [], 'unbound in story mode; Home is never bound');
  assert.deepEqual(codes(withButtons('MENU')), [], 'Menu is handled as a pause tap, not a held key');
  assert.deepEqual(codes(withButtons('UP', 'LEFT')), ['ArrowLeft', 'ArrowUp'], 'D-pad matches the arrow keys');
  // Every code is one game.js already accepts.
  const accepted = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyX', 'KeyC', 'KeyV', 'ShiftLeft', 'Escape']);
  for (const list of Object.values(story.buttons)) for (const code of list) assert.ok(accepted.has(code), code);
  assert.ok(accepted.has(story.pause));
});

check('trials layout uses the remappable dash key and adds pickup actions', () => {
  const trials = PROFILES.trials;
  const codes = (s, c) => sorted(G.gameplayCodes(s, trials, c || {}));
  assert.deepEqual(codes(withButtons('B')), ['ShiftLeft'], 'default dash key');
  assert.deepEqual(codes(withButtons('RT'), { dashCode: 'KeyQ' }), ['KeyQ'], 'follows a remapped dash');
  assert.deepEqual(codes(withButtons('LB')), ['KeyF']);
  assert.deepEqual(codes(withButtons('VIEW')), ['KeyE']);
  assert.deepEqual(codes(withButtons('A', 'X', 'Y', 'RB')), ['KeyC', 'KeyV', 'KeyX', 'Space']);
  assert.ok(!Object.values(trials.buttons).flat().includes('KeyR'), 'instant retry stays off the pad');
});

check('stick to digital movement: 8-way when flying, no accidental crouch or jump on foot', () => {
  const stick = (x, y) => G.radialDeadzone(x, y, TUNING.leftDeadzone);
  const story = PROFILES.story, trials = PROFILES.trials;
  const codes = (x, y, profile, flying) => sorted(G.gameplayCodes(snap({ stick: stick(x, y) }), profile, { flying }));
  assert.deepEqual(codes(0.25, 0, story, false), [], 'small push below the move threshold');
  assert.deepEqual(codes(1, 0, story, false), ['ArrowRight']);
  assert.deepEqual(codes(-0.7, 0.5, story, false), ['ArrowLeft'], 'diagonal-down on foot does not crouch');
  assert.deepEqual(codes(0.1, 1, story, false), ['ArrowDown'], 'straight down crouches');
  assert.deepEqual(codes(0, -1, story, false), [], 'stick up does not jump on foot in story mode (A jumps)');
  assert.deepEqual(codes(0, -1, story, true), ['ArrowUp'], 'stick up flies up');
  assert.deepEqual(codes(0.7, -0.7, story, true), ['ArrowRight', 'ArrowUp'], 'diagonal flight');
  assert.deepEqual(codes(0, -1, trials, false), ['ArrowUp'], 'trials uses up for directional dash, never for jump');
});

check('codes diff into keydown/keyup and button edges', () => {
  assert.deepEqual(plain(G.diffCodes(new Set(['Space', 'ArrowLeft']), new Set(['ArrowLeft', 'KeyX']))), { down: ['KeyX'], up: ['Space'] });
  const before = new Array(17).fill(false), after = before.slice();
  after[BUTTON.A] = after[BUTTON.MENU] = true;
  assert.deepEqual(plain(G.pressedEdges(before, after)), [BUTTON.A, BUTTON.MENU]);
  assert.deepEqual(plain(G.pressedEdges(after, after)), [], 'held is not a new press');
  assert.deepEqual(plain(G.pressedEdges(null, after)), [BUTTON.A, BUTTON.MENU]);
  assert.equal(G.gameplayCodes(snap({ connected: false }), PROFILES.story, {}).size, 0);
});

check('menu direction: D-pad first, stick past 0.5 on its dominant axis', () => {
  const stick = (x, y) => G.radialDeadzone(x, y, TUNING.leftDeadzone);
  assert.equal(G.menuDirection(withButtons('DOWN')), 'down');
  assert.equal(G.menuDirection(snap({ stick: stick(0.45, 0) })), null, 'below the menu threshold');
  assert.equal(G.menuDirection(snap({ stick: stick(0.55, 0) })), 'right');
  assert.equal(G.menuDirection(snap({ stick: stick(-0.3, -0.8) })), 'up');
  assert.equal(G.menuDirection(snap()), null);
  assert.equal(G.menuDirection(null), null);
});

check('menu auto-repeat: immediate, then 350 ms, then every 120 ms', () => {
  const r = G.createRepeater();
  assert.equal(r.update('down', 1000), 'down');
  assert.equal(r.update('down', 1349), null);
  assert.equal(r.update('down', 1350), 'down');
  assert.equal(r.update('down', 1469), null);
  assert.equal(r.update('down', 1470), 'down');
  assert.equal(r.update(null, 1500), null);
  assert.equal(r.update('down', 1510), 'down', 'released and pressed again fires at once');
  assert.equal(r.update('left', 1520), 'left', 'a new direction fires at once');
  r.reset();
  assert.equal(r.update('left', 1530), 'left');
});

check('spatial focus picks the nearest item in the pressed direction', () => {
  const rect = (x, y, w = 40, h = 20) => ({ x, y, w, h });
  // A 3-wide portrait row, a select below it and the start button below that.
  const from = rect(100, 0);
  const items = [rect(0, 0), rect(200, 0), rect(0, 60, 300), rect(100, 120)];
  assert.equal(G.pickSpatial(from, items, 'left'), 0);
  assert.equal(G.pickSpatial(from, items, 'right'), 1);
  assert.equal(G.pickSpatial(from, items, 'down'), 2);
  assert.equal(G.pickSpatial(from, items, 'up'), -1, 'nothing above: focus stays');
  assert.equal(G.pickSpatial(rect(0, 60, 300), items, 'down'), 3);
});

check('keyboard on menus: arrows or WASD move focus, Enter confirms, typed fields keep their keys', () => {
  const act = (code, focus, mods = {}) => plain(G.menuKeyAction({ code, ...mods }, focus));
  for (const [code, direction] of [['ArrowUp', 'up'], ['KeyW', 'up'], ['ArrowDown', 'down'], ['KeyS', 'down'],
    ['ArrowLeft', 'left'], ['KeyA', 'left'], ['ArrowRight', 'right'], ['KeyD', 'right']]) {
    assert.deepEqual(act(code, 'item'), { type: 'move', direction }, code);
    assert.deepEqual(act(code, 'none'), { type: 'move', direction }, code + ' with nothing focused lands on a menu item');
  }
  assert.deepEqual(act('ArrowLeft', 'select'), { type: 'adjust', direction: 'left' }, 'left/right change a select');
  assert.deepEqual(act('KeyD', 'select'), { type: 'adjust', direction: 'right' });
  assert.deepEqual(act('KeyS', 'select'), { type: 'move', direction: 'down' }, 'up/down leave a select');
  assert.equal(act('ArrowUp', 'text'), null, 'the seed field keeps its own arrow keys');
  assert.equal(act('KeyW', 'text'), null);
  assert.deepEqual(act('Enter', 'text'), { type: 'done' }, 'Enter in a field goes on to Start');
  assert.deepEqual(act('Enter', 'select'), { type: 'done' });
  assert.deepEqual(act('Enter', 'none'), { type: 'confirm' }, 'Enter with nothing focused presses the main button');
  assert.deepEqual(act('NumpadEnter', 'none'), { type: 'confirm' });
  assert.equal(act('Enter', 'item'), null, 'Enter on a focused button stays native');
  assert.deepEqual(act('Space', 'item'), { type: 'press' }, 'Space presses the focused button');
  assert.deepEqual(act('Space', 'none'), { type: 'press' });
  assert.equal(act('Space', 'select'), null, 'Space opens a select natively');
  assert.equal(act('Space', 'text'), null);
  assert.equal(act('ArrowDown', 'other'), null, 'the dash remap button keeps every key');
  assert.equal(act('ArrowDown', 'item', { ctrlKey: true }), null, 'browser shortcuts are left alone');
  assert.equal(act('KeyX', 'item'), null);
  assert.equal(G.menuKeyAction(null, 'item'), null);
});

check('key events carry the key names the keyboard sends', () => {
  assert.equal(G.keyName('Space'), ' ');
  assert.equal(G.keyName('KeyX'), 'x');
  assert.equal(G.keyName('ShiftLeft'), 'Shift');
  assert.equal(G.keyName('ArrowUp'), 'ArrowUp');
});

check('the browser driver stays off outside a page profile', () => {
  // vm context has no document: only the pure API was installed.
  assert.equal(typeof ctx.SprotoGamepad.createTracker, 'function');
  assert.equal(ctx.requestAnimationFrame, undefined);
});
