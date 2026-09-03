import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPresentationSequence } from '../src/presentation/presentation-events.js';
import { cueForPresentation, cueForTurnEvent } from '../src/audio/audio-cues.js';

test('winner event becomes victory for human and defeat for AI', () => {
  const victory = buildPresentationSequence({
    type: 'winner', winnerId: 'human', state: { winnerId: 'human', players: [{ id: 'human', name: '玩家（你）' }] }
  });
  assert.deepEqual(victory, [{ kind: 'victory', winnerId: 'human', winnerName: '玩家（你）' }]);

  const defeat = buildPresentationSequence({
    type: 'winner', winnerId: 'ai1', state: { winnerId: 'ai1', players: [{ id: 'ai1', name: 'AI玩家一' }] }
  });
  assert.deepEqual(defeat, [{ kind: 'defeat', winnerId: 'ai1', winnerName: 'AI玩家一' }]);
});

test('presentation effects map to distinct sound cues', () => {
  assert.equal(cueForPresentation({ kind: 'move' }), 'move');
  assert.equal(cueForPresentation({ kind: 'burn' }), 'fire');
  assert.equal(cueForPresentation({ kind: 'lock' }), 'tactic');
  assert.equal(cueForPresentation({ kind: 'treasure' }), 'treasure');
  assert.equal(cueForPresentation({ kind: 'victory' }), 'victory');
  assert.equal(cueForPresentation({ kind: 'defeat' }), 'defeat');
});

test('turn events provide clear ready and AI thinking sound cues', () => {
  assert.equal(cueForTurnEvent({ type: 'human-ready' }), 'your-turn');
  assert.equal(cueForTurnEvent({ type: 'ai-thinking' }), 'ai-turn');
  assert.equal(cueForTurnEvent({ type: 'turn-start', result: { skipped: true } }), 'skip');
  assert.equal(cueForTurnEvent({ type: 'human-error' }), 'error');
});
