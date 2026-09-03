import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPresentationSequence } from '../src/presentation/presentation-events.js';

function stateWithCard(playerId, card, positions = {}) {
  return {
    players: [
      { id: 'human', name: '玩家（你）', position: positions.human || 'center', hand: playerId === 'human' ? [card] : [] },
      { id: 'ai1', name: 'AI玩家一', position: positions.ai1 || 'tainan', hand: playerId === 'ai1' ? [card] : [] },
      { id: 'ai2', name: 'AI玩家二', position: positions.ai2 || 'madou', hand: playerId === 'ai2' ? [card] : [] }
    ]
  };
}

test('human travel becomes a move presentation using the pre-action position', () => {
  const card = { runtimeId: 'c1', type: 'travel', key: 'xunyou', name: '巡游' };
  const sequence = buildPresentationSequence({
    type: 'human-action',
    playerId: 'human',
    action: { type: 'travel', runtimeId: 'c1', destination: 'tainan' },
    result: { ok: true, destination: 'tainan' },
    beforeState: stateWithCard('human', card, { human: 'center' }),
    state: stateWithCard('human', card, { human: 'tainan' })
  });
  assert.equal(sequence.length, 1);
  assert.deepEqual(sequence[0], {
    kind: 'move', playerId: 'human', from: 'center', to: 'tainan', cardName: '巡游'
  });
});

test('AI action reveals its card before movement', () => {
  const card = { runtimeId: 'a1', type: 'travel', key: 'xunyou', name: '巡游' };
  const sequence = buildPresentationSequence({
    type: 'ai-action',
    playerId: 'ai1',
    decision: { type: 'travel', runtimeId: 'a1', destination: 'center' },
    result: { ok: true, destination: 'center' },
    beforeState: stateWithCard('ai1', card, { ai1: 'tainan' }),
    state: stateWithCard('ai1', card, { ai1: 'center' })
  });
  assert.equal(sequence[0].kind, 'card-reveal');
  assert.equal(sequence[0].cardName, '巡游');
  assert.equal(sequence[1].kind, 'move');
  assert.equal(sequence[1].from, 'tainan');
  assert.equal(sequence[1].to, 'center');
});

test('fake green chrysanthemum becomes a visible swap presentation', () => {
  const card = { runtimeId: 'f1', type: 'tactic', key: 'flower', name: '假绿菊花' };
  const sequence = buildPresentationSequence({
    type: 'ai-action',
    playerId: 'ai1',
    decision: { type: 'tactic', runtimeId: 'f1', targetPlayerId: 'human' },
    result: { ok: true, effect: 'swapPosition', targetPlayerId: 'human' },
    beforeState: stateWithCard('ai1', card, { ai1: 'tainan', human: 'madou' }),
    state: stateWithCard('ai1', card, { ai1: 'madou', human: 'tainan' })
  });
  const swap = sequence.find(item => item.kind === 'swap');
  assert.deepEqual(swap, {
    kind: 'swap', playerId: 'ai1', targetPlayerId: 'human',
    from: 'tainan', to: 'madou', targetFrom: 'madou', targetTo: 'tainan', cardName: '假绿菊花'
  });
});

test('fire, bully and inspect produce distinct presentation effects', () => {
  const fire = { runtimeId: 'f2', type: 'tactic', key: 'fire', name: '火烧百顺楼' };
  const burned = { runtimeId: 'b1', type: 'inspect', name: '明察' };
  const fireSequence = buildPresentationSequence({
    type: 'human-action', playerId: 'human',
    action: { type: 'tactic', runtimeId: 'f2', targetPlayerId: 'ai1' },
    result: { ok: true, effect: 'burnHand', targetPlayerId: 'ai1', burnedCard: burned },
    beforeState: stateWithCard('human', fire), state: stateWithCard('human', fire)
  });
  assert.equal(fireSequence[0].kind, 'burn');
  assert.equal(fireSequence[0].burnedCardName, '明察');

  const bully = { runtimeId: 'f3', type: 'tactic', key: 'bully', name: '恶霸王豹' };
  const bullySequence = buildPresentationSequence({
    type: 'human-action', playerId: 'human',
    action: { type: 'tactic', runtimeId: 'f3', targetPlayerId: 'ai2' },
    result: { ok: true, effect: 'skipTurn', targetPlayerId: 'ai2' },
    beforeState: stateWithCard('human', bully), state: stateWithCard('human', bully)
  });
  assert.equal(bullySequence[0].kind, 'lock');
  assert.equal(bullySequence[0].targetPlayerId, 'ai2');

  const inspect = { runtimeId: 'i1', type: 'inspect', key: 'mingcha', name: '明察' };
  const inspectSequence = buildPresentationSequence({
    type: 'human-action', playerId: 'human',
    action: { type: 'inspect', runtimeId: 'i1' },
    result: { ok: true, gained: true, treasureId: 'goldSeal' },
    beforeState: stateWithCard('human', inspect, { human: 'tainan' }),
    state: stateWithCard('human', inspect, { human: 'tainan' })
  });
  assert.deepEqual(inspectSequence[0], {
    kind: 'treasure', playerId: 'human', treasureId: 'goldSeal', locationId: 'tainan', cardName: '明察'
  });
});
