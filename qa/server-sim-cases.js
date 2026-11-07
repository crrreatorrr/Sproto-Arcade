/* Golden, negative, chunking and fuzz cases for the story replay verifier. ES5 with no host
 * APIs, so the same file runs in Node (qa/server-sim-goldens.mjs, against the ES2020 source
 * simulation and against dist/arcade-sim.server.js) and in goja (tools/goja-verify).
 *   runServerSimCases(ArcadeSim, goldens, fuzzExpect, now) -> {passed, failed, results}
 * goldens: the parsed qa/golden/story-*.json files; fuzzExpect: qa/golden/fuzz.json (or null to
 * only check self-consistency); now(): milliseconds, for timing. */
function runServerSimCases(A, goldens, fuzzExpect, now, options) {
  'use strict';
  var excludedStages = options && options.excludedStages || [];
  function excluded(level) { return excludedStages.indexOf(level) !== -1; }
  var results = [], FUZZ_SEED = 20261105, FUZZ_RUNS = 24, GARBAGE_RUNS = 300;
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function record(name, pass, detail, ms) {
    var r = { name: name, pass: !!pass };
    if (detail !== undefined) r.detail = detail;
    if (ms !== undefined) r.ms = Math.round(ms * 10) / 10;
    results.push(r);
  }
  function shapeOk(r) {
    return r && typeof r === 'object' && typeof r.ok === 'boolean' && typeof r.simVersion === 'string' &&
      typeof r.godMode === 'boolean' && typeof r.ticks === 'number' && typeof r.endHash === 'string' &&
      /^[0-9a-f]{16}$/.test(r.endHash) && (r.ok || typeof r.error === 'string');
  }
  function verify(log) {
    try { return A.verifyClear(log); } catch (e) { return { threw: String(e) }; }
  }
  function current(log) { var l = clone(log); l.simVersion = A.ARCADE_SIM_VERSION; return l; }
  function withMasks(log, masks) {
    var l = clone(log); l.ticks = masks.length; l.inputs = A.encodeInputs(masks); l.claimed.ticks = masks.length; return l;
  }
  var rng = (function (seed) {
    var s = seed >>> 0;
    return function () { s = (s + 0x6d2b79f5) >>> 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  })(FUZZ_SEED);

  // ---- Goldens: every level's recorded clear reproduces exactly, as both report kinds.
  var largest = 0;
  for (var g = 0; g < goldens.length; g++) {
    if (excluded(goldens[g].level)) continue;
    var gold = goldens[g], e = gold.expect, log = current(gold.log), t0 = now(), r = verify(log), ms = now() - t0;
    var match = shapeOk(r) && r.ok === e.ok && r.kind === e.kind && r.stage === e.stage && r.bossId === e.bossId &&
      r.godMode === false && r.ticks === e.ticks && r.endHash === e.endHash;
    record('golden ' + gold.level + ' ' + gold.bossId, match, match ? { ticks: r.ticks, endHash: r.endHash } : r, ms);
    var asClear = clone(log); asClear.claimed = { kind: 'clear', stage: e.stage, ticks: e.ticks };
    var c = verify(asClear);
    record('golden ' + gold.level + ' as clear report', shapeOk(c) && c.ok && c.kind === 'clear' && c.bossId === undefined && c.endHash === e.endHash, c.error);
    var withHash = clone(log); withHash.claimed.endHash = e.endHash;
    record('golden ' + gold.level + ' with claimed endHash', verify(withHash).ok === true);
    var badHash = clone(log); badHash.claimed.endHash = '0000000000000000';
    record('golden ' + gold.level + ' wrong claimed endHash rejected', verify(badHash).ok === false);
    var badBoss = clone(log); badBoss.claimed.bossId = gold.bossId === 'bront' ? 'vela' : 'bront';
    record('golden ' + gold.level + ' wrong claimed boss rejected', verify(badBoss).ok === false);
    // Chunks: the whole log must be <= 32 KB and travel as <= 4096-byte chunks.
    var json = JSON.stringify(gold.log), chunks = A.chunkLog(gold.log), fits = json.length <= 32768;
    for (var k = 0; k < chunks.length; k++) if (chunks[k].length > 4096 || /[^\x00-\x7f]/.test(chunks[k])) fits = false;
    var shuffled = chunks.slice().reverse(), joined = A.joinChunks(shuffled);
    record('golden ' + gold.level + ' chunks round-trip', fits && joined.log && JSON.stringify(joined.log) === json,
      { logBytes: json.length, inputsBytes: gold.log.inputs.length, chunks: chunks.length });
    largest = Math.max(largest, json.length);
  }
  if (goldens.length) {
    var first = current(goldens[0].log), firstExpect = goldens[0].expect;
    var masks = A.decodeInputs(first.inputs, first.ticks).masks;
    // ---- Runs that must not count.
    var cut = withMasks(first, masks.slice(0, masks.length - 60));
    var rc = verify(cut);
    record('truncated log (timeout) is not a clear', shapeOk(rc) && rc.ok === false && /no clear/.test(rc.error), rc.error);
    var longer = withMasks(first, masks.concat(masks.slice(0, 30).map(function () { return 0; })));
    var rl = verify(longer);
    record('inputs after the clear are rejected', shapeOk(rl) && rl.ok === false, rl.error);
    var tampered = masks.slice();
    for (var i = 2000; i < 2030 && i < tampered.length; i++) tampered[i] ^= 3;
    var rt = verify(withMasks(first, tampered));
    record('tampered inputs fail or change the hash', shapeOk(rt) && (rt.ok === false || rt.endHash !== firstExpect.endHash), { ok: rt.ok, error: rt.error });
    var idle = [];
    for (i = 0; i < 4000; i++) idle.push(0);
    var rd = verify(withMasks(first, idle));
    record('standing still dies', shapeOk(rd) && rd.ok === false && /lost/.test(rd.error), rd.error);
    var god = clone(first); god.godMode = true;
    var rg = verify(god);
    record('god mode never counts', shapeOk(rg) && rg.ok === false && rg.error === 'god mode' && rg.godMode === true, rg);
    var old = clone(first); old.simVersion = 'ffffffffffffffff';
    var ro = verify(old);
    record('other sim version rejected', shapeOk(ro) && ro.ok === false && /version/.test(ro.error), ro.error);
    var wrongStage = clone(first); wrongStage.claimed.stage = 2;
    record('claimed stage must match', verify(wrongStage).ok === false);
    var wrongTicks = clone(first); wrongTicks.claimed.ticks = first.ticks - 1;
    record('claimed ticks must match', verify(wrongTicks).ok === false);
    // ---- Malformed logs: ok:false with an error, never a throw.
    var bad = [null, undefined, 0, 42, 'log', [], {}, { schema: 2 }, { schema: 1 }, function () {}];
    var mutate = [
      function (l) { l.inputs = l.inputs.slice(0, Math.floor(l.inputs.length / 2)); },
      function (l) { l.inputs = l.inputs.slice(0, -4); },
      function (l) { l.inputs = '!!!!' + l.inputs.slice(4); },
      function (l) { l.inputs = 12345; },
      function (l) { l.inputs = A.encodeInputs([1023 + 1]); l.ticks = 1; },
      function (l) { l.ticks = 'many'; },
      function (l) { l.ticks = 1e9; },
      function (l) { l.ticks = -5; },
      function (l) { l.seed = -1; },
      function (l) { l.seed = 1.5; },
      function (l) { l.rules = null; },
      function (l) { l.rules.level = 99; },
      function (l) { l.rules.mode = 'trials'; },
      function (l) { l.rules.shieldWait = 601; },
      function (l) { l.loadout = { pilot: 'nobody' }; },
      function (l) { l.loadout = 'rivet'; },
      function (l) { l.claimed = null; },
      function (l) { l.claimed.kind = 'score'; },
      function (l) { l.godMode = 'no'; },
      function (l) { delete l.godMode; },
      function (l) { l.schema = '1'; },
      function (l) { l.simVersion = null; }
    ];
    for (i = 0; i < mutate.length; i++) { var m = clone(first); mutate[i](m); bad.push(m); }
    var allSafe = true, unsafe = [];
    for (i = 0; i < bad.length; i++) {
      var rb = verify(bad[i]);
      if (!shapeOk(rb) || rb.ok !== false) { allSafe = false; unsafe.push({ index: i, result: rb }); }
    }
    record('malformed logs return ok:false with error and endHash', allSafe, unsafe.length ? unsafe : bad.length + ' cases');
    // Random garbage: structurally random values in every field.
    function junk(depth) {
      var x = rng();
      if (depth > 2 || x < 0.25) return [null, true, false, -1, 0, 1, 1e308, NaN, '', 'AAAA', 'story', 'bront', 'rivet'][Math.floor(rng() * 13)];
      if (x < 0.5) return Math.floor(rng() * 70000) - 100;
      if (x < 0.7) { var a = []; for (var q = 0; q < 3; q++) a.push(junk(depth + 1)); return a; }
      var o = {}, keys = ['schema', 'simVersion', 'seed', 'rules', 'loadout', 'ticks', 'inputs', 'claimed', 'godMode', 'mode', 'level', 'pilot', 'kind', 'stage'];
      for (q = 0; q < 6; q++) o[keys[Math.floor(rng() * keys.length)]] = junk(depth + 1);
      return o;
    }
    var garbageSafe = true;
    for (i = 0; i < GARBAGE_RUNS; i++) {
      var j = rng() < 0.5 ? junk(0) : clone(first);
      if (j && typeof j === 'object' && !Array.isArray(j) && j.inputs === first.inputs) {
        var keysList = ['schema', 'simVersion', 'seed', 'rules', 'loadout', 'ticks', 'inputs', 'claimed', 'godMode'];
        j[keysList[Math.floor(rng() * keysList.length)]] = junk(1);
        if (rng() < 0.5) j.inputs = j.inputs && typeof j.inputs === 'string' ? j.inputs.slice(0, Math.floor(rng() * j.inputs.length)) : j.inputs;
      }
      var rj = verify(j);
      if (!shapeOk(rj)) { garbageSafe = false; record('garbage case ' + i, false, rj); break; }
    }
    record('random garbage never throws', garbageSafe, GARBAGE_RUNS + ' logs');
    var cj = A.chunkLog(first);
    var brokenChunk = cj.slice(); brokenChunk[0] = brokenChunk[0].slice(0, -1) + (brokenChunk[0].slice(-1) === 'A' ? 'B' : 'A');
    record('corrupted chunk rejected', !!A.joinChunks(brokenChunk).error && !!A.joinChunks(cj.slice(1)).error && !!A.joinChunks('x').error);
    record('largest golden log fits 32 KB in 4096-byte chunks', largest > 0 && largest <= 32768, { largestLogBytes: largest });

    // ---- Determinism fuzz: random valid input logs replay to the same hash twice, and to the
    // stored hashes (recorded under Node), so goja must agree bit for bit.
    var hashes = [], stable = true;
    for (i = 0; i < FUZZ_RUNS; i++) {
      var level = goldens[i % goldens.length], fm = [], n = 300 + Math.floor(rng() * 900), mask = 0;
      while (fm.length < n) {
        mask = Math.floor(rng() * 1024) & (rng() < 0.5 ? 0x3cf : 0x3ff);
        var run = 1 + Math.floor(rng() * 25);
        for (var z = 0; z < run && fm.length < n; z++) fm.push(z === 0 ? mask : mask & ~(16 | 64 | 128 | 256 | 512));
      }
      var fl = withMasks(current(level.log), fm), a1 = verify(fl), a2 = verify(fl);
      if (!shapeOk(a1) || a1.endHash !== a2.endHash || a1.ticks !== a2.ticks) stable = false;
      hashes.push(a1.endHash + ':' + a1.ticks);
    }
    record('fuzz: random logs replay identically twice', stable, FUZZ_RUNS + ' logs');
    if (fuzzExpect) {
      var same = fuzzExpect.hashes && fuzzExpect.hashes.length === hashes.length;
      // Keep the original fixture order and RNG stream: only the intentionally changed
      // stage's historical hashes are excluded; all other stored hashes remain exact.
      for (i = 0; same && i < hashes.length; i++) if (!excluded(goldens[i % goldens.length].level) && fuzzExpect.hashes[i] !== hashes[i]) same = false;
      record('fuzz: hashes match the stored Node results', same, same ? undefined : { expected: fuzzExpect.hashes, got: hashes });
    }
    results.fuzzHashes = hashes;
  }
  var failed = 0;
  for (var f = 0; f < results.length; f++) if (!results[f].pass) failed++;
  return { passed: results.length - failed, failed: failed, results: results, fuzzHashes: results.fuzzHashes || [] };
}
if (typeof module !== 'undefined' && module.exports) module.exports = runServerSimCases;
