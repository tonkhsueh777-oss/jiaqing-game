import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPresentationSequence } from '../src/presentation/presentation-events.js';

test('human turn-start draw reveals only the cards drawn by the human', () => {
  const card = { runtimeId: 'n1', type: 'inspect', key: 'mingcha', name: '明察' };
  const sequence = buildPresentationSequence({
    type: 'turn-start', playerId: 'human', result: { ok: true, cards: [card] }, state: { players: [] }
  });
  assert.deepEqual(sequence, [{ kind: 'draw-card', playerId: 'human', cardName: '明察', cardKey: 'mingcha', cardType: 'inspect', locationId: '' }]);
});

test('AI turn-start draw keeps card identities hidden', () => {
  const sequence = buildPresentationSequence({
    type: 'turn-start', playerId: 'ai1',
    result: { ok: true, cards: [{ runtimeId: 'a', type: 'tactic', key: 'fire', name: '火烧百顺楼' }] },
    state: { players: [] }
  });
  assert.deepEqual(sequence, [{ kind: 'draw-hidden', playerId: 'ai1', count: 1 }]);
});

test('human refill after a completed action can animate multiple cards', () => {
  const sequence = buildPresentationSequence({
    type: 'human-refill', playerId: 'human',
    result: { ok: true, cards: [
      { type: 'travel', key: 'xunyou', name: '巡游' },
      { type: 'location', key: 'tainan', locationId: 'tainan', name: '台南府城' }
    ] },
    state: { players: [] }
  });
  assert.equal(sequence.length, 2);
  assert.equal(sequence[0].kind, 'draw-card');
  assert.equal(sequence[1].locationId, 'tainan');
});
