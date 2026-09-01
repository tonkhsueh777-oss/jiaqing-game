const test = require('node:test');
const assert = require('node:assert/strict');
const layout = require('../src/v25-mobile-layout.js');

test('mobile location cards occupy a 2x2 top grid and center sits below', () => {
  const p = layout.MOBILE_BOARD_SLOTS;
  assert.ok(p.tainan.y < p.zhuluo.y);
  assert.ok(p.mengxia.y < p.madou.y);
  assert.ok(p.tainan.x < p.mengxia.x);
  assert.ok(p.zhuluo.x < p.madou.x);
  assert.ok(p.center.y > p.zhuluo.y && p.center.y > p.madou.y);
});

test('mobile ordering keeps play area and hand ahead of information rails', () => {
  assert.deepEqual(layout.MOBILE_SECTION_ORDER, ['main', 'hand', 'right', 'left']);
});
