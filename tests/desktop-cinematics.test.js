const test = require('node:test');
const assert = require('node:assert/strict');
const cardMotion = require('../src/desktop-card-motion.js');
const scene = require('../src/desktop-scene.js');

test('card tilt is neutral at center and clamped at edges', () => {
  assert.deepEqual(cardMotion.tiltFromPointer(50, 50, 100, 100), { x: 0, y: 0 });
  assert.deepEqual(cardMotion.tiltFromPointer(100, 50, 100, 100), { x: 0, y: 5 });
  assert.deepEqual(cardMotion.tiltFromPointer(0, 0, 100, 100), { x: 5, y: -5 });
  assert.deepEqual(cardMotion.tiltFromPointer(200, -100, 100, 100), { x: 5, y: 5 });
});

test('card tilt safely returns neutral values for invalid geometry', () => {
  assert.deepEqual(cardMotion.tiltFromPointer(10, 10, 0, 100), { x: 0, y: 0 });
  assert.deepEqual(cardMotion.tiltFromPointer(Number.NaN, 10, 100, 100), { x: 0, y: 0 });
});

test('scene parallax maps viewport coordinates to normalized range', () => {
  assert.deepEqual(scene.parallaxFromPointer(500, 400, 1000, 800), { x: 0, y: 0 });
  assert.deepEqual(scene.parallaxFromPointer(1000, 800, 1000, 800), { x: 1, y: 1 });
  assert.deepEqual(scene.parallaxFromPointer(-100, 900, 1000, 800), { x: -1, y: 1 });
});
