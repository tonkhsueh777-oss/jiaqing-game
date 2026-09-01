const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../src/v23-visual-effects-logic.js');

test('detectTreasureGains returns only positive treasure deltas', () => {
  const prev = {
    players: {
      human: { goldSeal: 0, sword: 1, gun: 0, pomelo: 0 },
      ai1: { goldSeal: 0, sword: 0, gun: 0, pomelo: 0 }
    }
  };
  const next = {
    players: {
      human: { goldSeal: 1, sword: 1, gun: 0, pomelo: 0 },
      ai1: { goldSeal: 0, sword: 0, gun: 2, pomelo: 0 }
    }
  };

  assert.deepEqual(logic.detectTreasureGains(prev, next), [
    { playerId: 'human', treasureId: 'goldSeal', amount: 1 },
    { playerId: 'ai1', treasureId: 'gun', amount: 2 }
  ]);
});

test('only the human player is eligible for the treasure reveal effect', () => {
  assert.equal(logic.shouldShowTreasureGain({ playerId: 'human', treasureId: 'goldSeal', amount: 1 }), true);
  assert.equal(logic.shouldShowTreasureGain({ playerId: 'ai1', treasureId: 'gun', amount: 1 }), false);
  assert.equal(logic.shouldShowTreasureGain({ playerId: 'ai2', treasureId: 'pomelo', amount: 1 }), false);
  assert.equal(logic.shouldShowTreasureGain(null), false);
});

test('classifyLog maps visual sound events only', () => {
  assert.equal(logic.classifyLog('玩家（你）：打出【巡游】，移动至中央起点。'), 'move');
  assert.equal(logic.classifyLog('AI玩家一：开放地点【台南府城】，该地牌永久留在地图。'), 'location');
  assert.equal(logic.classifyLog('玩家（你）：发动【嘉庆令】，强制交换圣物。'), 'command');
  assert.equal(logic.classifyLog('玩家（你）进入行动阶段。'), 'turn');
  assert.equal(logic.classifyLog('无关文字'), null);
});
