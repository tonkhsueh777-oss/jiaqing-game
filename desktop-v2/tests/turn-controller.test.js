import test from 'node:test';
import assert from 'node:assert/strict';
import { createTurnController } from '../src/gameplay/turn-controller.js';

function makeState() {
  return {
    players: [
      { id: 'human', kind: 'human', position: 'center' },
      { id: 'ai1', kind: 'ai', position: 'center' },
      { id: 'ai2', kind: 'ai', position: 'center' }
    ],
    currentPlayerIndex: 0,
    phase: 'setup',
    winnerId: null,
    turnNumber: 1,
    log: []
  };
}

function advance(state) {
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.phase = 'turnStart';
  state.turnNumber += 1;
}

test('turn controller runs human action, both AI turns, then returns to an actionable human turn', async () => {
  const state = makeState();
  const aiRuns = [];
  const events = [];
  let saves = 0;

  const adapter = {
    beginTurn(current) {
      current.phase = 'action';
      return { ok: true, skipped: false, message: '开始回合' };
    },
    completeTurn(current) {
      advance(current);
      return { ok: true };
    },
    async runAiTurn(current, playerId, hooks = {}) {
      aiRuns.push(playerId);
      current.players[current.currentPlayerIndex].position = playerId === 'ai1' ? 'tainan' : 'madou';
      await hooks.afterAction?.({ type: 'travel' }, current, { ok: true, message: `${playerId}行动` });
      advance(current);
    },
    play: {
      travel(current, playerId, runtimeId, destination) {
        assert.equal(playerId, 'human');
        assert.equal(runtimeId, 'card-1');
        current.players[0].position = destination;
        return { ok: true, message: '玩家移动完成' };
      }
    }
  };

  const session = {
    state,
    async save() { saves += 1; }
  };

  const controller = createTurnController({
    adapter,
    session,
    delay: async () => {},
    onChange(event) { events.push(event.type); }
  });

  await controller.start();
  assert.equal(state.phase, 'action');
  assert.equal(state.players[state.currentPlayerIndex].id, 'human');

  const result = await controller.executeHuman({
    type: 'travel',
    runtimeId: 'card-1',
    destination: 'tainan'
  });

  assert.equal(result.ok, true);
  assert.equal(state.players[0].position, 'tainan');
  assert.deepEqual(aiRuns, ['ai1', 'ai2']);
  assert.equal(state.players[state.currentPlayerIndex].id, 'human');
  assert.equal(state.phase, 'action');
  assert.ok(saves >= 1);
  assert.ok(events.includes('human-action'));
  assert.ok(events.includes('ai-thinking'));
  assert.ok(events.includes('ai-action'));
  assert.ok(events.includes('human-ready'));
});
