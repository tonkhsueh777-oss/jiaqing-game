const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../src/v31-analytics-logic.js');

test('normalizeStats supplies numeric zero defaults', () => {
  assert.deepEqual(logic.normalizeStats({ today_visits: '3', likes: 2 }), {
    todayVisits: 3,
    totalVisits: 0,
    likes: 2,
    dislikes: 0
  });
});

test('validReason accepts only the six public improvement reasons', () => {
  for (const reason of ['rules', 'controls', 'mobile', 'pace', 'visual_audio', 'other']) {
    assert.equal(logic.validReason(reason), true);
  }
  assert.equal(logic.validReason('anything_else'), false);
});

test('completion is recorded only on a no-winner to winner transition', () => {
  assert.equal(logic.shouldRecordCompletion(null, 'human'), true);
  assert.equal(logic.shouldRecordCompletion(null, 'ai1'), true);
  assert.equal(logic.shouldRecordCompletion('human', 'human'), false);
  assert.equal(logic.shouldRecordCompletion(null, null), false);
});
