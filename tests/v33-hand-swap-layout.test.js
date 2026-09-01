const test = require('node:test');
const assert = require('node:assert/strict');
const layout = require('../src/v33-hand-swap-layout.js');

test('desktop wide layout moves swap action beside the hand', () => {
  assert.equal(layout.shouldUseHandSideSwap(1181), true);
  assert.equal(layout.shouldUseHandSideSwap(1600), true);
});

test('narrow and mobile layouts keep the existing controls fallback', () => {
  assert.equal(layout.shouldUseHandSideSwap(1180), false);
  assert.equal(layout.shouldUseHandSideSwap(768), false);
  assert.equal(layout.shouldUseHandSideSwap(390), false);
});
