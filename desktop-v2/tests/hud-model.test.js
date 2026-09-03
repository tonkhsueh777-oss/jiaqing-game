import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHudModel } from '../src/ui/hud-model.js';

const game = {
  LOCATIONS: {
    tainan: { name: '台南府城' },
    madou: { name: '麻豆古镇' }
  },
  TREASURES: {
    goldSeal: { shortName: '金印' },
    sword: { shortName: '宝剑' },
    gun: { shortName: '火枪' },
    pomelo: { shortName: '柚子' }
  },
  getLegalActions() {
    return [{ type: 'travel', runtimeId: 'c1', destinations: ['tainan'] }, { type: 'end' }];
  },
  getCardUnavailableReason() { return '这张牌目前不能使用。'; },
  SpecialCardGuideLogic: {
    detailFor(card) { return card.type === 'tactic' ? '特殊计策说明' : ''; },
    targetPromptFor() { return '请选择目标。'; },
    typeLabelFor(card) { return card.type === 'tactic' ? '计策牌' : ''; }
  }
};

const state = {
  currentPlayerIndex: 0,
  phase: 'action',
  turnNumber: 3,
  drawPile: Array(20).fill({}),
  discardPile: Array(5).fill({}),
  log: ['开始', '玩家进入行动阶段。'],
  players: [
    { id: 'human', name: '玩家', position: 'center', hand: [
      { runtimeId: 'c1', type: 'travel', name: '巡游', asset: 'x' },
      { runtimeId: 'c2', type: 'tactic', key: 'fire', name: '火烧百顺楼', asset: 'y' }
    ], treasures: { goldSeal: 1, sword: 0, gun: 1, pomelo: 0 } },
    { id: 'ai1', name: 'AI 玩家一', position: 'tainan', hand: [{ runtimeId: 'a' }], treasures: { goldSeal: 0, sword: 1, gun: 0, pomelo: 0 } },
    { id: 'ai2', name: 'AI 玩家二', position: 'madou', hand: [], treasures: { goldSeal: 0, sword: 0, gun: 0, pomelo: 1 } }
  ]
};

test('HUD model exposes real players, treasures, deck counts and hand cards', () => {
  const model = buildHudModel(state, game);
  assert.equal(model.turn.label, '你的回合');
  assert.equal(model.players[1].positionName, '台南府城');
  assert.equal(model.treasures.find(item => item.id === 'goldSeal').count, 1);
  assert.equal(model.deck.drawCount, 20);
  assert.equal(model.deck.discardCount, 5);
  assert.equal(model.hand.length, 2);
  assert.equal(model.hand[0].legal, true);
  assert.equal(model.hand[1].legal, false);
});

test('HUD model selects a card and explains the next action without mutating state', () => {
  const before = JSON.stringify(state);
  const model = buildHudModel(state, game, 'c1');
  assert.equal(model.selected.runtimeId, 'c1');
  assert.match(model.guide, /台南府城/);
  assert.equal(JSON.stringify(state), before);
});

test('HUD model uses special-card explanation when a tactic is selected', () => {
  const model = buildHudModel(state, game, 'c2');
  assert.equal(model.selected.typeLabel, '计策牌');
  assert.equal(model.selected.detail, '特殊计策说明');
  assert.match(model.guide, /不能使用/);
});
