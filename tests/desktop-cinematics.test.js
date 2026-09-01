const test = require('node:test');
const assert = require('node:assert/strict');
const cardMotion = require('../src/desktop-card-motion.js');
const scene = require('../src/desktop-scene.js');
const draw = require('../src/desktop-draw-cinematic.js');
const treasure = require('../src/desktop-treasure-cinematic.js');
const audio = require('../src/desktop-audio.js');
const ai = require('../src/desktop-ai-cinematic.js');

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

test('draw cinematic lock prevents duplicate starts and rejects stale finishes', () => {
  const controller = draw.createController();
  const token = controller.begin();
  assert.equal(Boolean(token), true);
  assert.equal(controller.isLocked(), true);
  assert.equal(controller.begin(), false);
  assert.equal(controller.finish(token + 1), false);
  assert.equal(controller.isLocked(), true);
  assert.equal(controller.finish(token), true);
  assert.equal(controller.isLocked(), false);
  assert.equal(Boolean(controller.begin()), true);
});

test('treasure cinematic queue accepts only human gains and preserves order', () => {
  const queue = treasure.createQueue();
  assert.equal(queue.enqueue({ playerId: 'human', treasureId: 'goldSeal', amount: 1 }), true);
  assert.equal(queue.enqueue({ playerId: 'human', treasureId: 'sword', amount: 1 }), true);
  assert.equal(queue.enqueue({ playerId: 'ai1', treasureId: 'gun', amount: 1 }), false);
  assert.equal(queue.size(), 2);
  assert.equal(queue.shift().treasureId, 'goldSeal');
  assert.equal(queue.shift().treasureId, 'sword');
  assert.equal(queue.shift(), null);
});

test('desktop audio clamps all volume values to the safe range', () => {
  assert.equal(audio.clampVolume(1.4), 1);
  assert.equal(audio.clampVolume(-0.2), 0);
  assert.equal(audio.clampVolume(0.4), 0.4);
  assert.equal(audio.clampVolume('bad'), 0);
  assert.deepEqual(audio.normalizeVolumes({ master: 2, music: -1, effects: 0.5 }), {
    master: 1,
    music: 0,
    effects: 0.5
  });
});

test('desktop AI identifies only AI current players and classifies new logs', () => {
  const state = {
    currentPlayerIndex: 1,
    players: [
      { id: 'human', kind: 'human' },
      { id: 'ai1', kind: 'ai' },
      { id: 'ai2', kind: 'ai' }
    ],
    log: ['old', 'move', 'turn']
  };
  const logic = { classifyLog: line => ({ move: 'move', turn: 'turn' }[line] || null) };
  assert.equal(ai.activeAiId(state), 'ai1');
  assert.deepEqual(ai.classifyNewLogs(state, 1, logic), ['move', 'turn']);
  state.currentPlayerIndex = 0;
  assert.equal(ai.activeAiId(state), null);
});
