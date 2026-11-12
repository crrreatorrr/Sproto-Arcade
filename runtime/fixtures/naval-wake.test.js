'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const scope = vm.createContext({
  ART: { sprites: { rivet: { poses: [['pilot.png', 128, 128]] } } },
  ArcadeBossSheets: {
    drawWaterline(ctx, box, depth) { ctx.surface = box.y + box.h - depth; }
  }
});
for (const name of ['levels.js', 'speedboat.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, name), 'utf8'), scope, { filename: name });
}
const { drawBoat, drawBossWake } = vm.runInContext('ArcadeSpeedboat', scope);
const picture = name => ({ name, naturalWidth: 1 });
const x = 500, y = 320, tick = 35;

function canvas() {
  const draws = [], transforms = [], saved = [];
  return {
    draws,
    globalAlpha: 1,
    save() { saved.push([transforms.length, this.globalAlpha]); },
    restore() { [transforms.length, this.globalAlpha] = saved.pop(); },
    translate(x, y) { transforms.push(['translate', x, y]); },
    scale(x, y) { transforms.push(['scale', x, y]); },
    rotate(angle) { transforms.push(['rotate', angle]); },
    drawImage(image, sx, sy, sw, sh, dx, dy, width, height) {
      if (image.name === 'art/ocean/naval-effects.png') {
        draws.push({ sx, sy, dx, dy, width, height, transforms: transforms.slice() });
      }
    }
  };
}

function playerWake(vx, vy, dash = false) {
  const ctx = canvas();
  drawBoat(ctx, picture, { x, y, id: 'rivet', vx, vy, dash, dashX: 0, dashY: -1 }, tick, -1, -1);
  return { draws: ctx.draws, surface: ctx.surface };
}

function bossWake(vx, vy) {
  const ctx = canvas(), boss = {};
  drawBossWake(ctx, picture, boss, tick - 1, x - vx, y - vy);
  ctx.draws.length = 0;
  drawBossWake(ctx, picture, boss, tick, x, y);
  return { draws: ctx.draws, surface: y };
}

for (const wake of [playerWake, bossWake]) {
  const up = wake(0, -7), down = wake(0, 7);
  assert.deepEqual(up, down, 'ascending and descending use the same effects');
  const wakeY = up.draws[0].transforms[0][2];
  assert.ok(wakeY > up.surface, 'the wake sits below the waterline');
  for (const [vx, vy] of [[0,-7], [7,0], [-7,0], [7,-7], [7,7], [-7,-7], [-7,7]]) {
    const { draws } = wake(vx, vy);
    assert.deepEqual(draws.map(draw => draw.sy), [288, 192], 'draw the wake and splash');
    for (const { transforms } of draws) {
      const [translation, ...orientation] = transforms;
      assert.equal(translation[0], 'translate');
      assert.equal(translation[2], wakeY, 'the wake has the same height for every heading');
      assert.equal(Math.sign(x - translation[1]), Math.sign(vx), 'the wake trails horizontal movement');
      assert.deepEqual(orientation, vx < 0 ? [['scale', -1, 1]] : [], 'mirror only on the horizontal axis');
    }
  }
  const offset = vx => wake(vx, 7).draws[0].transforms[0][1] - x;
  assert.ok(offset(.13) < offset(.11) && offset(.11) < 0, 'slowing down brings the wake closer to center');
  assert.ok(Math.abs(offset(.13) - offset(.11)) <= 2, 'slow lateral drift does not make the wake jump');
  assert.equal(offset(-.11), -offset(.11), 'slow motion shifts the wake equally in either direction');
}
assert.deepEqual(playerWake(7, 0, true).draws[0].transforms[0].slice(0, 2), ['translate', x],
  'a vertical dash centers the wake even when ordinary velocity points sideways');
console.log('PASS speedboat and boss wake orientation, placement, and vertical dash');
