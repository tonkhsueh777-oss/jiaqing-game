import test from 'node:test';
import assert from 'node:assert/strict';
import { loadV43Core } from '../src/core/v43-bootstrap.js';

test('V43 desktop bootstrap loads stable game core', async () => {
  const game = await loadV43Core();
  assert.equal(typeof game.createGameState, 'function');
  assert.equal(typeof game.beginTurn, 'function');
  assert.equal(typeof game.playTacticCard, 'function');
  assert.equal(typeof game.playTrumpCard, 'function');
  assert.equal(typeof game.runAiTurn, 'function');
});
