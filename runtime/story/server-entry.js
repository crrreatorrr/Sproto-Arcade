/* Server entry for dist/arcade-sim.server.js. NOT a standalone script: tools/build-server-sim.mjs
 * places it after runtime/story/sim-math.js, runtime/story/replay.js and the story simulation it
 * extracts from levels.js, arena-effects.js, codebreak.js and game.js, all inside one function
 * scope. It supplies no-op versions of the browser-only helpers the simulation calls (sound, HUD,
 * overlay, hub report) and the API the hub calls. Contract: docs/SERVER-SIM.md. */

// ---- Browser-only helpers, replaced by their simulation effect only.
function sound() {}
function refreshHud() {}
function showLevelControls() {}
function announce(message, frames) { banner = frames === undefined ? 110 : frames; }
function setOverlay(next) { mode = next; }
var ui = { notice: { hidden: true } };
var gameScreen = { classList: { add: function () {}, remove: function () {} } };
// game.js reports the clear to the hub here; the replay records the tick and end state instead.
var clearedAt = -1, clearedHash = '';
function clearLevel() {
  clearedAt = time;
  clearedHash = ArcadeReplay.hashState(simState());
  mode = levelIndex + 1 === LEVELS.length ? 'won' : 'clear';
}

// ---- API
var SIM_VERSION = typeof ARCADE_SIM_VERSION === 'string' ? ARCADE_SIM_VERSION : 'dev';
var PILOTS = playable.map(function (p) { return p.id; });
var SHIELD_WAIT_MAX = SHIELD_COOLDOWN;

function isInt(v, min, max) { return typeof v === 'number' && v === Math.floor(v) && v >= min && v <= max; }
function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function levelInfo(level) {
  var index = -1;
  for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === level) index = i;
  return index < 0 ? null : { index: index, stage: LEVELS[index].id, bossId: STORY_BOSS_IDS[index] };
}

/** Replays a story-mode log. Never throws; see docs/SERVER-SIM.md for every field. */
function verifyClear(log) {
  var result = { ok: false, simVersion: SIM_VERSION, godMode: false, ticks: 0, endHash: ArcadeReplay.EMPTY_HASH };
  function fail(error) { result.ok = false; result.error = error; return result; }
  try {
    if (!isObject(log)) return fail('log must be an object');
    if (typeof log.godMode === 'boolean') result.godMode = log.godMode;
    if (log.schema !== 1) return fail('unknown log schema');
    if (log.simVersion !== SIM_VERSION) return fail('sim version mismatch: log ' + String(log.simVersion).slice(0, 32) + ', server ' + SIM_VERSION);
    if (typeof log.godMode !== 'boolean') return fail('godMode must be a boolean');
    if (!isInt(log.seed, 0, 4294967295)) return fail('seed must be a uint32');
    var rules = log.rules, loadout = log.loadout, claimed = log.claimed;
    if (!isObject(rules) || rules.mode !== 'story') return fail('unknown rules');
    var info = levelInfo(rules.level);
    if (!info) return fail('unknown level');
    if (!isInt(rules.shieldWait, 0, SHIELD_WAIT_MAX)) return fail('bad shieldWait');
    if (!isObject(loadout) || PILOTS.indexOf(loadout.pilot) < 0) return fail('unknown pilot');
    if (!isInt(log.ticks, 1, ArcadeReplay.MAX_TICKS)) return fail('bad ticks');
    if (!isObject(claimed) || (claimed.kind !== 'clear' && claimed.kind !== 'boss')) return fail('claimed.kind must be clear or boss');
    result.kind = claimed.kind;
    result.stage = info.stage;
    if (claimed.kind === 'boss') result.bossId = info.bossId;
    if (log.godMode) return fail('god mode');
    var decoded = ArcadeReplay.decodeInputs(log.inputs, log.ticks);
    if (decoded.error) return fail(decoded.error);
    var masks = decoded.masks, frames = [];
    for (var f = 0; f < 1024; f++) frames.push(null);

    // Fresh run: everything the simulation carries is reset by resetRun except Codebreak's
    // own projectile list, which only exists while that level runs.
    codeShots = [];
    clearedAt = -1;
    clearedHash = '';
    resetRun(info.index, loadout.pilot, rules.shieldWait, log.seed);
    var tick = 0;
    while (tick < masks.length && mode === 'play') {
      var mask = masks[tick++];
      inputFrame = frames[mask] || (frames[mask] = ArcadeReplay.frameOf(mask));
      update();
    }
    result.ticks = time;
    result.endHash = clearedAt >= 0 ? clearedHash : ArcadeReplay.hashState(simState());
    if (clearedAt < 0) return fail(mode === 'lost' ? 'player lost at tick ' + time : 'no clear within ' + time + ' ticks');
    if (clearedAt !== log.ticks) return fail('cleared at tick ' + clearedAt + ' but the log runs ' + log.ticks + ' ticks');
    if (claimed.stage !== info.stage) return fail('claimed stage disagrees with the replay');
    if (claimed.kind === 'boss' && claimed.bossId !== info.bossId) return fail('claimed bossId disagrees with the replay');
    if (claimed.ticks !== clearedAt) return fail('claimed ticks disagree with the replay');
    if (claimed.endHash !== undefined && claimed.endHash !== result.endHash) return fail('claimed endHash disagrees with the replay');
    result.ok = true;
    return result;
  } catch (e) {
    return fail('internal error: ' + String(e && e.message || e).slice(0, 120));
  }
}

var api = {
  ARCADE_SIM_VERSION: SIM_VERSION,
  verifyClear: verifyClear,
  chunkLog: ArcadeReplay.chunkLog,
  joinChunks: ArcadeReplay.joinChunks,
  encodeInputs: ArcadeReplay.encodeInputs,
  decodeInputs: ArcadeReplay.decodeInputs,
  maskOf: ArcadeReplay.maskOf,
  EMPTY_HASH: ArcadeReplay.EMPTY_HASH,
  levels: LEVELS.map(function (level, i) { return { stage: level.id, bossId: STORY_BOSS_IDS[i], title: level.title }; })
};
