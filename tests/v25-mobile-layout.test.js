const test = require('node:test');
const assert = require('node:assert/strict');
const layout = require('../src/v25-mobile-layout.js');

test('mobile board preserves the exact desktop cross coordinates', () => {
  assert.deepEqual(layout.MOBILE_BOARD_SLOTS, {
    center: { x: 50, y: 50 },
    tainan: { x: 50, y: 20 },
    mengxia: { x: 79, y: 50 },
    zhuluo: { x: 21, y: 50 },
    madou: { x: 50, y: 80 }
  });
});

test('mobile ordering keeps play area and hand ahead of information rails', () => {
  assert.deepEqual(layout.MOBILE_SECTION_ORDER, ['main', 'hand', 'right', 'left']);
});
