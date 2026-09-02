const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../src/v37-turn-indicator-logic.js');

const ai1 = { id: 'ai1', name: 'AI 玩家一', kind: 'ai' };
const ai2 = { id: 'ai2', name: 'AI 玩家二', kind: 'ai' };
const human = { id: 'human', name: '玩家', kind: 'human' };

test('builds unmistakable AI thinking handoff copy', () => {
  assert.deepEqual(logic.presentation(ai1, 'thinking'), {
    actorId: 'ai1',
    actorToken: '甲',
    stage: 'thinking',
    eyebrow: '当前回合',
    title: '现在轮到 AI 玩家一',
    detail: '思考中……'
  });
});

test('builds transition copy naming the next player', () => {
  assert.deepEqual(logic.presentation(ai1, 'transition', ai2), {
    actorId: 'ai1',
    actorToken: '甲',
    stage: 'transition',
    eyebrow: '回合切换',
    title: 'AI 玩家一 回合结束',
    detail: '下一位：AI 玩家二'
  });
});

test('builds direct human handoff copy', () => {
  assert.deepEqual(logic.presentation(human, 'human'), {
    actorId: 'human',
    actorToken: '我',
    stage: 'human',
    eyebrow: '你的回合',
    title: '轮到你了！',
    detail: '请选择手牌行动'
  });
});
