/* Story progress rules (story-progress.js): normalise, merge, clears, unlocks, storage. Node only. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'story-progress.js'), 'utf8'), ctx);
const P = ctx.ArcadeProgress;
const plain = (v) => JSON.parse(JSON.stringify(v));

assert.deepEqual(plain(P.normalize(null)), { v: 1, cleared: [], unlocked: [], updatedAt: 0 });
assert.deepEqual(plain(P.normalize({ cleared: [3, 3, -1, 14, 1.5, 'x', 0], unlocked: ['morelight', 'rivet', 'nope', 'morelight'], updatedAt: 5 })),
  { v: 1, cleared: [0, 3], unlocked: ['morelight'], updatedAt: 5 });

// The first clear records level 0 and opens nothing; level 2 (index 1) opens Morelight.
let r = P.recordClear(P.empty(), 0, 10);
assert.deepEqual(plain(r.save.cleared), [0]);
assert.deepEqual(plain(r.opened), []);
r = P.recordClear(r.save, 1, 20);
assert.deepEqual(plain(r.opened), ['morelight']);
assert.deepEqual(plain(P.recordClear(r.save, 1, 30).opened), [], 'a second clear opens nothing new');
assert.equal(r.save.updatedAt, 20);

// Locks: open Sprotos stay open; locked ones open by clear, by another game's Relic, or by unlockAll.
assert.equal(P.isUnlocked('rivet', P.empty()), true);
assert.equal(P.isUnlocked('sproto3152', P.empty()), true);
assert.equal(P.isUnlocked('morelight', P.empty()), false);
assert.equal(P.isUnlocked('morelight', r.save), true);
assert.equal(P.isUnlocked('sproto1668', P.empty(), ['cones_tip']), true);
assert.equal(P.isUnlocked('sproto1668', P.empty(), ['breakwater_coin']), false, "the Arcade's own Relic unlocks nothing here");
assert.equal(P.isUnlocked('sproto831', P.empty(), [], true), true);
assert.match(P.lockReason('sproto1668', [{ title: 'a' }, , , , , , , , , , { title: 'Rooftop Breakaway' }]), /Clear Rooftop Breakaway, or own the Cone's Tip \(NOBU\)/);
assert.equal(P.lockReason('rivet'), '');
assert.equal(Object.keys(P.UNLOCKS).length, 4, 'ten of fourteen Sprotos stay open from the start');

// Merge is a union and never loses progress.
const a = { cleared: [0, 1], unlocked: ['morelight'], updatedAt: 5 };
const b = { cleared: [4], unlocked: ['sproto831'], updatedAt: 9 };
assert.deepEqual(plain(P.merge(a, b)), { v: 1, cleared: [0, 1, 4], unlocked: ['morelight', 'sproto831'], updatedAt: 9 });
assert.deepEqual(plain(P.merge(a, null)), plain(P.normalize(a)));
assert.equal(P.same(a, { cleared: [1, 0], unlocked: ['morelight'] }), true);
assert.equal(P.same(a, b), false);
assert.ok(JSON.stringify(P.merge(a, b)).length < 4096, 'fits the hub save cap');

// Storage round trip, and refusing storage does not throw.
const mem = new Map();
const storage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v) };
P.store(storage, a);
assert.deepEqual(plain(P.load(storage)), plain(P.normalize(a)));
mem.set(P.STORAGE_KEY, '{bad');
assert.deepEqual(plain(P.load(storage)), plain(P.empty()));
P.store({ setItem() { throw new Error('quota'); } }, a);
assert.deepEqual(plain(P.load(null)), plain(P.empty()));
console.log(JSON.stringify({ status: 'passed', kind: 'story-progress' }));

assert.deepEqual(plain(P.recordClear(P.empty(),12,10).save.cleared),[12], 'new ID13 saves at appended index12 without renumbering prior clears');

// Co-op records live in coopBest, apart from solo bests, and merge the same way.
{
  const solo = P.recordBest(P.empty(), 0, { ticks: 6000, hits: 0, rank: 'S' }, 5).save;
  const coop = P.recordCoopBest(solo, 0, { ticks: 7000, hits: 3, rank: 'B' }, 6);
  assert.equal(coop.improved, true);
  assert.deepEqual(plain(coop.save.best[0]), { ticks: 6000, hits: 0, rank: 'S' }, 'a co-op clear never touches the solo best');
  assert.deepEqual(plain(coop.save.coopBest[0]), { ticks: 7000, hits: 3, rank: 'B' });
  assert.equal(P.recordCoopBest(coop.save, 0, { ticks: 9000, hits: 3, rank: 'B' }).improved, false);
  const other = P.recordCoopBest(P.empty(), 0, { ticks: 6500, hits: 1, rank: 'A' }).save;
  assert.deepEqual(plain(P.merge(coop.save, other).coopBest[0]), { ticks: 6500, hits: 1, rank: 'A' }, 'merge keeps the better co-op record');
  assert.equal(P.same(coop.save, solo), false);
  assert.equal(P.normalize({ coopBest: { 0: { ticks: -1, hits: 0, rank: 'S' } } }).coopBest, undefined, 'junk co-op entries are dropped');
  console.log(JSON.stringify({ status: 'passed', kind: 'story-progress-coop-best' }));
}
