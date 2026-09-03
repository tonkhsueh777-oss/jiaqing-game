import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStageGuidance } from '../src/stage/stage-guidance.js';

function hud(action, activePlayerId = 'human') {
  return {
    turn: { activePlayerId },
    selectedAction: action,
    selected: action ? { name: '测试牌' } : null
  };
}

test('travel guidance highlights every legal destination on the stage', () => {
  const guidance = buildStageGuidance(hud({ type: 'travel', destinations: ['tainan', 'madou'] }));
  assert.equal(guidance.mode, 'travel');
  assert.deepEqual(guidance.locationIds, ['tainan', 'madou']);
  assert.deepEqual(guidance.playerIds, []);
});

test('inspect and location cards highlight their related location', () => {
  assert.deepEqual(buildStageGuidance(hud({ type: 'inspect', locationId: 'mengxia' })).locationIds, ['mengxia']);
  assert.deepEqual(buildStageGuidance(hud({ type: 'location', locationId: 'zhuluo' })).locationIds, ['zhuluo']);
});

test('tactic guidance highlights legal opponents then narrows to chosen target', () => {
  const action = { type: 'tactic', targets: ['ai1', 'ai2'] };
  assert.deepEqual(buildStageGuidance(hud(action)).playerIds, ['ai1', 'ai2']);
  assert.deepEqual(buildStageGuidance(hud(action), { tacticTargetId: 'ai2' }).playerIds, ['ai2']);
});

test('trump guidance highlights legal opponents then keeps the selected opponent', () => {
  const action = { type: 'trump', targets: ['ai1', 'ai2'] };
  assert.deepEqual(buildStageGuidance(hud(action)).playerIds, ['ai1', 'ai2']);
  assert.deepEqual(buildStageGuidance(hud(action), { trump: { targetPlayerId: 'ai1' } }).playerIds, ['ai1']);
});

test('stage guidance is hidden outside the human turn', () => {
  const guidance = buildStageGuidance(hud({ type: 'travel', destinations: ['tainan'] }, 'ai1'));
  assert.deepEqual(guidance, { mode: 'idle', locationIds: [], playerIds: [] });
});
