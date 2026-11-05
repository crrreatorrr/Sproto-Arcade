/* Story-mode replay logs: input recording, the compact input encoding, the end-state hash and
 * 4096-byte chunking. Shared by the browser (legacy.html records a log for each run and attaches
 * it to hub reports) and the hub's server bundle (dist/arcade-sim.server.js replays it).
 * Classic ES5 script with no browser APIs; see docs/SERVER-SIM.md for the formats.
 *
 * Input bits, one 10-bit mask per simulation tick (game.js reads exactly these fields):
 *   0 left  1 right  2 up  3 down  4 jump  5 jumpHeld  6 dash  7 shield  8 missile  9 bomb
 * `inputs` (base64 of bytes): [format=1][seats=1][varint ticks] then, per seat, (varint mask,
 * varint run) pairs whose runs add up to exactly `ticks`. Varints are unsigned LEB128. */
var ArcadeReplay = (function () {
  'use strict';
  var INPUT_KEYS = ['left', 'right', 'up', 'down', 'jump', 'jumpHeld', 'dash', 'shield', 'missile', 'bomb'];
  var INPUT_FORMAT = 1, MAX_MASK = 1 << INPUT_KEYS.length;
  var MAX_TICKS = 60 * 60 * 30; // 30 minutes of simulation
  var MAX_LOG_BYTES = 32768, CHUNK_BYTES = 4096, CHUNK_TAG = 'ARC1';
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  function maskOf(frame) {
    var mask = 0;
    for (var i = 0; i < INPUT_KEYS.length; i++) if (frame && frame[INPUT_KEYS[i]]) mask |= 1 << i;
    return mask;
  }
  function frameOf(mask) {
    var frame = {};
    for (var i = 0; i < INPUT_KEYS.length; i++) frame[INPUT_KEYS[i]] = (mask & (1 << i)) !== 0;
    return frame;
  }

  function base64(bytes) {
    var out = '', i = 0, n = bytes.length, a, b, c;
    for (; i + 2 < n; i += 3) {
      a = bytes[i]; b = bytes[i + 1]; c = bytes[i + 2];
      out += B64.charAt(a >> 2) + B64.charAt(((a & 3) << 4) | (b >> 4)) + B64.charAt(((b & 15) << 2) | (c >> 6)) + B64.charAt(c & 63);
    }
    if (i < n) {
      a = bytes[i]; b = i + 1 < n ? bytes[i + 1] : 0;
      out += B64.charAt(a >> 2) + B64.charAt(((a & 3) << 4) | (b >> 4));
      out += i + 1 < n ? B64.charAt((b & 15) << 2) : '=';
      out += '=';
    }
    return out;
  }
  /** Strict decoder: returns a byte array, or null for anything that is not canonical base64. */
  function unbase64(text) {
    if (typeof text !== 'string' || text.length % 4 !== 0) return null;
    var bytes = [], i, j, v, quad = [0, 0, 0, 0], pad;
    for (i = 0; i < text.length; i += 4) {
      pad = 0;
      for (j = 0; j < 4; j++) {
        var ch = text.charAt(i + j);
        if (ch === '=' && i + 4 === text.length && j >= 2) { pad++; quad[j] = 0; continue; }
        if (pad) return null;
        v = B64.indexOf(ch);
        if (v < 0) return null;
        quad[j] = v;
      }
      bytes.push((quad[0] << 2) | (quad[1] >> 4));
      if (pad < 2) bytes.push(((quad[1] & 15) << 4) | (quad[2] >> 2));
      if (pad < 1) bytes.push(((quad[2] & 3) << 6) | quad[3]);
    }
    return bytes;
  }

  function pushVarint(bytes, value) {
    while (value >= 128) { bytes.push((value & 127) | 128); value = Math.floor(value / 128); }
    bytes.push(value);
  }

  /** One seat's per-tick masks -> base64 `inputs`. */
  function encodeInputs(masks) {
    var bytes = [INPUT_FORMAT, 1];
    pushVarint(bytes, masks.length);
    for (var i = 0; i < masks.length;) {
      var mask = masks[i], run = 1;
      while (i + run < masks.length && masks[i + run] === mask) run++;
      pushVarint(bytes, mask);
      pushVarint(bytes, run);
      i += run;
    }
    return base64(bytes);
  }

  /** base64 `inputs` -> {masks} for the single seat, or {error}. Never throws. */
  function decodeInputs(text, ticks) {
    if (typeof text !== 'string') return { error: 'inputs must be a string' };
    if (text.length > MAX_LOG_BYTES) return { error: 'inputs too large' };
    var bytes = unbase64(text);
    if (!bytes) return { error: 'inputs are not valid base64' };
    var pos = 0;
    function varint() {
      var value = 0, scale = 1;
      for (var k = 0; k < 4; k++) {
        if (pos >= bytes.length) return -1;
        var b = bytes[pos++];
        value += (b & 127) * scale;
        if (b < 128) return value;
        scale *= 128;
      }
      return -1;
    }
    if (bytes[pos++] !== INPUT_FORMAT) return { error: 'unknown inputs format' };
    if (bytes[pos++] !== 1) return { error: 'expected one seat' };
    var count = varint();
    if (count < 0) return { error: 'inputs truncated' };
    if (count !== ticks) return { error: 'inputs cover ' + count + ' ticks, log says ' + ticks };
    var masks = [];
    while (masks.length < count) {
      var mask = varint(), run = varint();
      if (mask < 0 || run < 0) return { error: 'inputs truncated' };
      if (mask >= MAX_MASK) return { error: 'unknown input bits' };
      if (run < 1 || masks.length + run > count) return { error: 'bad input run' };
      for (var r = 0; r < run; r++) masks.push(mask);
    }
    if (pos !== bytes.length) return { error: 'trailing bytes after inputs' };
    return { masks: masks };
  }

  // ---- End-state hash: canonical serialization fed to two 32-bit lanes (FNV-1a and a
  // Murmur-style multiply), printed as 16 hex digits. Numbers hash by their IEEE 754 bits
  // (NaN normalized), object keys sorted, Sets in insertion order.
  var view = new DataView(new ArrayBuffer(8));
  function Hasher() { this.a = 2166136261; this.b = 0x9747b28c; }
  Hasher.prototype.byte = function (v) {
    this.a = Math.imul(this.a ^ v, 16777619) >>> 0;
    var b = Math.imul(this.b ^ v, 0x5bd1e995);
    this.b = (b ^ (b >>> 15)) >>> 0;
  };
  Hasher.prototype.word = function (v) {
    this.byte(v & 255); this.byte((v >>> 8) & 255); this.byte((v >>> 16) & 255); this.byte((v >>> 24) & 255);
  };
  Hasher.prototype.text = function (s) {
    this.word(s.length);
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); this.byte(c & 255); this.byte(c >>> 8); }
  };
  Hasher.prototype.value = function (v) {
    var i, keys;
    if (v === null) { this.byte(1); return; }
    switch (typeof v) {
      case 'undefined': this.byte(2); return;
      case 'boolean': this.byte(v ? 4 : 3); return;
      case 'number':
        if (v !== v) { this.byte(6); return; }
        this.byte(5);
        view.setFloat64(0, v, true);
        for (i = 0; i < 8; i++) this.byte(view.getUint8(i));
        return;
      case 'string': this.byte(7); this.text(v); return;
      case 'function': this.byte(8); return;
    }
    if (Array.isArray(v)) {
      this.byte(9); this.word(v.length);
      for (i = 0; i < v.length; i++) this.value(v[i]);
      return;
    }
    if (typeof Set !== 'undefined' && v instanceof Set) {
      var hasher = this;
      this.byte(10); this.word(v.size);
      v.forEach(function (item) { hasher.value(item); });
      return;
    }
    keys = Object.keys(v).sort();
    this.byte(11); this.word(keys.length);
    for (i = 0; i < keys.length; i++) { this.text(keys[i]); this.value(v[keys[i]]); }
  };
  function hex8(n) { var s = (n >>> 0).toString(16); while (s.length < 8) s = '0' + s; return s; }
  Hasher.prototype.digest = function () {
    var a = this.a, b = this.b;
    b = Math.imul(b ^ (b >>> 13), 0xc2b2ae35); b ^= b >>> 16;
    a = Math.imul(a ^ (a >>> 16), 0x85ebca6b); a ^= a >>> 13;
    return hex8(a) + hex8(b);
  };
  function hashState(state) {
    var h = new Hasher();
    h.value(state);
    return h.digest();
  }
  function hashText(text) {
    var h = new Hasher();
    h.text(text);
    return h.digest();
  }
  var EMPTY_HASH = hashState(null);

  // ---- Chunks: the log's JSON (ASCII-escaped) split into pieces of at most 4096 bytes,
  // each "ARC1:<index>/<count>:<hash of the whole JSON>:<slice>".
  function asciiJson(log) {
    return JSON.stringify(log).replace(/[\u007f-￿]/g, function (c) {
      return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
    });
  }
  function chunkLog(log, maxBytes) {
    var json = typeof log === 'string' ? log : asciiJson(log);
    var limit = maxBytes || CHUNK_BYTES, digest = hashText(json), chunks = [], count = 1, i;
    // Header length depends on the count's digits; grow the count until every piece fits.
    for (;;) {
      var header = (CHUNK_TAG + ':' + count + '/' + count + ':' + digest + ':').length;
      var room = limit - header;
      if (room < 1) return [];
      var needed = Math.max(1, Math.ceil(json.length / room));
      if (needed <= count) { count = needed; break; }
      count = needed;
    }
    var size = Math.ceil(json.length / count) || 1;
    for (i = 0; i < count; i++) chunks.push(CHUNK_TAG + ':' + i + '/' + count + ':' + digest + ':' + json.slice(i * size, (i + 1) * size));
    return chunks;
  }
  /** Chunks in any order -> {log} or {error}. Never throws. */
  function joinChunks(chunks) {
    try {
      if (!Array.isArray(chunks) || !chunks.length) return { error: 'no chunks' };
      var parts = [], count = -1, digest = null, i;
      for (i = 0; i < chunks.length; i++) {
        var m = typeof chunks[i] === 'string' && /^ARC1:(\d+)\/(\d+):([0-9a-f]{16}):/.exec(chunks[i]);
        if (!m) return { error: 'bad chunk header' };
        var index = +m[1], n = +m[2];
        if (count < 0) { count = n; digest = m[3]; }
        if (n !== count || m[3] !== digest || index >= n || parts[index] !== undefined) return { error: 'inconsistent chunks' };
        parts[index] = chunks[i].slice(m[0].length);
      }
      for (i = 0; i < count; i++) if (parts[i] === undefined) return { error: 'missing chunk ' + i };
      var json = parts.join('');
      if (hashText(json) !== digest) return { error: 'chunk checksum mismatch' };
      return { log: JSON.parse(json) };
    } catch (e) {
      return { error: 'chunks do not hold a log' };
    }
  }

  /** Browser recorder: game.js starts one per run, pushes each tick's input frame before
   * update(), and finishes it when the level is cleared. */
  function recorder(start) {
    var masks = [];
    return {
      push: function (frame) { if (masks.length < MAX_TICKS) masks.push(maskOf(frame)); },
      ticks: function () { return masks.length; },
      /** -> the log (see docs/SERVER-SIM.md), claim = {kind, stage, bossId, ticks, endHash}. */
      finish: function (end) {
        return {
          schema: 1,
          simVersion: start.simVersion || '',
          seed: start.seed >>> 0,
          rules: { mode: 'story', level: start.level, shieldWait: start.shieldWait },
          loadout: { pilot: start.pilot },
          ticks: masks.length,
          inputs: encodeInputs(masks),
          claimed: end.claimed,
          godMode: !!end.godMode
        };
      }
    };
  }

  return {
    INPUT_KEYS: INPUT_KEYS, MAX_TICKS: MAX_TICKS, MAX_LOG_BYTES: MAX_LOG_BYTES, CHUNK_BYTES: CHUNK_BYTES,
    EMPTY_HASH: EMPTY_HASH,
    maskOf: maskOf, frameOf: frameOf, base64: base64, unbase64: unbase64,
    encodeInputs: encodeInputs, decodeInputs: decodeInputs,
    hashState: hashState, hashText: hashText, asciiJson: asciiJson,
    chunkLog: chunkLog, joinChunks: joinChunks, recorder: recorder
  };
})();
