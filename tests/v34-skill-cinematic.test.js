const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../src/v34-skill-cinematic-logic.js');

test('only the five trump and tactic keys have skill cinematics', () => {
  assert.equal(logic.hasCinematic({ type: 'trump', key: 'jiaqingOrder' }), true);
  assert.equal(logic.hasCinematic({ type: 'trump', key: 'wangOrder' }), true);
  assert.equal(logic.hasCinematic({ type: 'tactic', key: 'bully' }), true);
  assert.equal(logic.hasCinematic({ type: 'tactic', key: 'fire' }), true);
  assert.equal(logic.hasCinematic({ type: 'tactic', key: 'flower' }), true);
  assert.equal(logic.hasCinematic({ type: 'travel', key: 'travel' }), false);
  assert.equal(logic.hasCinematic({ type: 'inspect', key: 'inspect' }), false);
});

test('cinematic definitions point to six-second MP4 assets and correct activation titles', () => {
  assert.deepEqual(logic.getCinematic('jiaqingOrder'), {
    key: 'jiaqingOrder',
    src: 'assets/video/jiaqing-order.mp4',
    title: '嘉庆令发动',
    durationMs: 6000,
    range: [0, 24422]
  });
  assert.equal(logic.getCinematic('wangOrder').title, '王德禄令发动');
  assert.equal(logic.getCinematic('bully').title, '恶霸王豹发动');
  assert.equal(logic.getCinematic('fire').title, '火烧百顺楼发动');
  assert.equal(logic.getCinematic('flower').title, '假绿菊花发动');
  assert.equal(logic.getCinematic('unknown'), null);
});

test('base64 transport path keeps the MP4 identity while using a text asset', () => {
  assert.equal(logic.encodedAssetPath('assets/video/jiaqing-order.mp4'), 'assets/video/jiaqing-order.mp4.b64');
});

test('cinematic bundle ranges identify each embedded MP4', () => {
  assert.equal(logic.BUNDLE_PARTS.length, 10);
  assert.equal(logic.BUNDLE_PARTS[0], 'assets/video/v34-cinematics.part-00.b64');
  assert.equal(logic.BUNDLE_PARTS[9], 'assets/video/v34-cinematics.part-09.b64');
  assert.deepEqual(logic.getCinematic('jiaqingOrder').range, [0, 24422]);
  assert.deepEqual(logic.getCinematic('flower').range, [101047, 25597]);
});
