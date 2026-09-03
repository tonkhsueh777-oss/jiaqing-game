import test from 'node:test';
import assert from 'node:assert/strict';
import { loadV43Core } from '../src/core/v43-bootstrap.js';
import { createGameAdapter } from '../src/core/game-adapter.js';

test('desktop game adapter creates a V43 state and serializable snapshot', async () => {
  const game = await loadV43Core();
  const adapter = createGameAdapter(game);
  const state = adapter.createState({ rng: () => 0.5 });
  const view = adapter.snapshot(state);

  assert.equal(view.players.length, 3);
  assert.equal(view.players[0].hand.length, 3);
  assert.equal(view.winnerId, null);
  assert.notEqual(view, state);
});
