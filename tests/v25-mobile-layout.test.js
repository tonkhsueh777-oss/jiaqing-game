const test = require('node:test');
const assert = require('node:assert/strict');
const layout = require('../src/v25-mobile-layout.js');

test('mobile board preserves desktop cross topology around the center', () => {
  const p = layout.MOBILE_BOARD_SLOTS;

  assert.equal(p.center.x, 50);
  assert.equal(p.center.y, 50);

  assert.equal(p.tainan.x, p.center.x);
  assert.ok(p.tainan.y < p.center.y);

  assert.equal(p.madou.x, p.center.x);
  assert.ok(p.madou.y > p.center.y);

  assert.equal(p.zhuluo.y, p.center.y);
  assert.ok(p.zhuluo.x < p.center.x);

  assert.equal(p.mengxia.y, p.center.y);
  assert.ok(p.mengxia.x > p.center.x);
});

test('mobile ordering keeps play area and hand ahead of information rails', () => {
  assert.deepEqual(layout.MOBILE_SECTION_ORDER, ['main', 'hand', 'right', 'left']);
});
