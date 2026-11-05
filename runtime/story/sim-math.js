/* Deterministic transcendental math for the story-mode simulation (legacy.html / game.js).
 * Browsers and the hub's goja server each ship a different libm, so Math.sin, Math.cos,
 * Math.atan2 and Math.hypot can differ in the last bit between engines, and a replay could then
 * drift. These versions use only + - * / and Math.sqrt, which IEEE 754 makes exact everywhere,
 * so every engine computes the same bits. They stay close to what Chrome (V8) returns:
 *  - sin/cos: fdlibm's Cody-Waite reduction and musl's polynomial kernels (< 1 ulp). V8's
 *    glibc-derived sin/cos differ from these in the last bit for about 1% of arguments (V8
 *    itself is not correctly rounded, so exact agreement would mean porting glibc's tables);
 *  - atan/atan2: ports of the fdlibm/musl kernels V8 uses;
 *  - hypot: V8's own algorithm (scale by the largest magnitude, Kahan-summed squares).
 * Classic ES5 script: it is also concatenated into dist/arcade-sim.server.js. */
var SimMath = (function () {
  'use strict';
  var INVPIO2 = 6.36619772367581382433e-01, PIO2_1 = 1.57079632673412561417e+00, PIO2_1T = 6.07710050650619224932e-11,
    PIO2_2 = 6.07710050630396597660e-11, PIO2_2T = 2.02226624879595063154e-21,
    PIO2_3 = 2.02226624871116645580e-21, PIO2_3T = 8.47842766036889956997e-32;
  var TOINT = 6755399441055744, PIO4 = 0.78539816339744830962, TINY = 7.450580596923828e-9;
  var PI = 3.1415926535897931160e+00, PI_LO = 1.2246467991473531772e-16;
  var ATANHI = [4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00];
  var ATANLO = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17];
  var AT = [3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01, -1.11111104054623557880e-01,
    9.09088713343650656196e-02, -7.69187620504482999495e-02, 6.66107313738753120669e-02, -5.83357013379057348645e-02,
    4.97687799461593236017e-02, -3.65315727442169155270e-02, 1.62858201153657823623e-02];
  var reduced = [0, 0, 0];

  // x - n*pi/2 as y0 + y1 (fdlibm medium path, always with the second round), n mod 4 in
  // reduced[0]. Accurate for |x| below about 1.6e6;
  // beyond that still deterministic, only less accurate (the game never gets there).
  function reduce(x) {
    var fn = (x * INVPIO2 + TOINT) - TOINT;
    var r = x - fn * PIO2_1, t = r, w = fn * PIO2_2, y0, ax = x < 0 ? -x : x;
    r = t - w; w = fn * PIO2_2T - ((t - r) - w);
    y0 = r - w;
    // fdlibm's third round, only after heavy cancellation (y0 about 2^-49 of x or smaller).
    if ((y0 < 0 ? -y0 : y0) * 562949953421312 < ax) {
      t = r; w = fn * PIO2_3; r = t - w; w = fn * PIO2_3T - ((t - r) - w);
      y0 = r - w;
    }
    reduced[0] = ((fn % 4) + 4) % 4;
    reduced[1] = y0;
    reduced[2] = (r - y0) - w;
  }
  // musl's __sin/__cos kernels for |x| <= pi/4, with x = y0 + y1 from the reduction.
  var S1 = -1.66666666666666324348e-01, S2 = 8.33333333332248946124e-03, S3 = -1.98412698298579493134e-04,
    S4 = 2.75573137070700676789e-06, S5 = -2.50507602534068634195e-08, S6 = 1.58969099521155010221e-10;
  var C1 = 4.16666666666666019037e-02, C2 = -1.38888888888741095749e-03, C3 = 2.48015872894767294178e-05,
    C4 = -2.75573143513906633035e-07, C5 = 2.08757232129817482790e-09, C6 = -1.13596475577881948265e-11;
  function kSin(x, y, iy) {
    var z = x * x, w = z * z, r = S2 + z * (S3 + z * S4) + z * w * (S5 + z * S6), v = z * x;
    if (iy === 0) return x + v * (S1 + z * r);
    return x - ((z * (0.5 * y - v * r) - y) - v * S1);
  }
  function kCos(x, y) {
    var z = x * x, w = z * z, r = z * (C1 + z * (C2 + z * C3)) + w * w * (C4 + z * (C5 + z * C6));
    var hz = 0.5 * z;
    w = 1.0 - hz;
    return w + (((1.0 - w) - hz) + (z * r - x * y));
  }
  function sin(x) {
    x = +x;
    if (x !== x || x === Infinity || x === -Infinity) return NaN;
    var ax = x < 0 ? -x : x;
    if (ax <= PIO4) return ax < TINY ? x : kSin(x, 0, 0);
    reduce(x);
    switch (reduced[0]) {
      case 0: return kSin(reduced[1], reduced[2], 1);
      case 1: return kCos(reduced[1], reduced[2]);
      case 2: return -kSin(reduced[1], reduced[2], 1);
      default: return -kCos(reduced[1], reduced[2]);
    }
  }
  function cos(x) {
    x = +x;
    if (x !== x || x === Infinity || x === -Infinity) return NaN;
    var ax = x < 0 ? -x : x;
    if (ax <= PIO4) return ax < TINY ? 1 : kCos(x, 0);
    reduce(x);
    switch (reduced[0]) {
      case 0: return kCos(reduced[1], reduced[2]);
      case 1: return -kSin(reduced[1], reduced[2], 1);
      case 2: return -kCos(reduced[1], reduced[2]);
      default: return kSin(reduced[1], reduced[2], 1);
    }
  }
  function atan(x) {
    x = +x;
    if (x !== x) return x;
    var negative = x < 0, ax = negative ? -x : x, id, z;
    if (ax >= 7.378697629483821e19) { z = ATANHI[3]; return negative ? -z : z; }
    if (ax < 0.4375) {
      if (ax < TINY) return x;
      id = -1;
    } else {
      x = ax;
      if (ax < 1.1875) {
        if (ax < 0.6875) { id = 0; x = (2.0 * x - 1.0) / (2.0 + x); }
        else { id = 1; x = (x - 1.0) / (x + 1.0); }
      } else if (ax < 2.4375) { id = 2; x = (x - 1.5) / (1.0 + 1.5 * x); }
      else { id = 3; x = -1.0 / x; }
    }
    z = x * x;
    var w = z * z;
    var s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))));
    var s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))));
    if (id < 0) return x - x * (s1 + s2);
    z = ATANHI[id] - ((x * (s1 + s2) - ATANLO[id]) - x);
    return negative ? -z : z;
  }
  function negativeSign(v) { return v < 0 || (v === 0 && 1 / v < 0); }
  function atan2(y, x) {
    y = +y; x = +x;
    if (x !== x || y !== y) return x + y;
    if (x === 1) return atan(y);
    var m = (negativeSign(y) ? 1 : 0) | (negativeSign(x) ? 2 : 0), z;
    if (y === 0) return m === 0 || m === 1 ? y : m === 2 ? PI : -PI;
    if (x === 0) return m & 1 ? -PI / 2 : PI / 2;
    var yInf = y === Infinity || y === -Infinity;
    if (x === Infinity || x === -Infinity) {
      if (yInf) return m === 0 ? PI / 4 : m === 1 ? -PI / 4 : m === 2 ? 3 * PI / 4 : -3 * PI / 4;
      return m === 0 ? 0 : m === 1 ? -0 : m === 2 ? PI : -PI;
    }
    var ratio = y / x;
    if (ratio < 0) ratio = -ratio;
    if (yInf || ratio > 1.8446744073709552e19) return m & 1 ? -PI / 2 : PI / 2;
    if ((m & 2) && ratio < 5.421010862427522e-20) z = 0;
    else z = atan(ratio);
    switch (m) {
      case 0: return z;
      case 1: return -z;
      case 2: return PI - (z - PI_LO);
      default: return (z - PI_LO) - PI;
    }
  }
  // V8's Math.hypot (src/builtins/math.tq) for two finite arguments: divide by the largest
  // magnitude, Kahan-sum the squares, then sqrt(sum) * max.
  function hypot(x, y) {
    x = +x; y = +y;
    var ax = x < 0 ? -x : x, ay = y < 0 ? -y : y;
    if (ax === Infinity || ay === Infinity) return Infinity;
    if (ax !== ax || ay !== ay) return NaN;
    var max = ax > ay ? ax : ay;
    if (max === 0) return 0;
    var sum = 0, compensation = 0, n, summand, preliminary;
    n = ax / max; summand = n * n - compensation; preliminary = sum + summand;
    compensation = (preliminary - sum) - summand; sum = preliminary;
    n = ay / max; summand = n * n - compensation; preliminary = sum + summand;
    compensation = (preliminary - sum) - summand; sum = preliminary;
    return Math.sqrt(sum) * max;
  }
  return { sin: sin, cos: cos, atan: atan, atan2: atan2, hypot: hypot };
})();
