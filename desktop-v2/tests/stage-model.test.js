import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGE_LAYOUT, buildStageModel } from '../src/stage/stage-model.js';

test('V2 stage keeps four locations around a central platform', () => {
  assert.deepEqual(Object.keys(STAGE_LAYOUT.locations).sort(), ['madou', 'mengxia', 'tainan', 'zhuluo']);
  assert.equal(STAGE_LAYOUT.center.id, 'center');
  assert.equal(STAGE_LAYOUT.locations.tainan.slot, 'north');
  assert.equal(STAGE_LAYOUT.locations.madou.slot, 'west');
  assert.equal(STAGE_LAYOUT.locations.mengxia.slot, 'east');
  assert.equal(STAGE_LAYOUT.locations.zhuluo.slot, 'south');
});

test('stage model maps V43 player positions without mutating state', () => {
  const state = {
    currentPlayerIndex: 1,
    openedLocations: { tainan: true },
    players: [
      { id: 'human', name: '玩家', position: 'tainan', treasures: {} },
      { id: 'ai1', name: 'AI 玩家一', position: 'center', treasures: {} },
      { id: 'ai2', name: 'AI 玩家二', position: 'mengxia', treasures: {} }
    ]
  };
  const before = JSON.stringify(state);
  const model = buildStageModel(state);
  assert.equal(model.players.find(p => p.id === 'human').slot, 'north');
  assert.equal(model.players.find(p => p.id === 'ai1').slot, 'center');
  assert.equal(model.players.find(p => p.id === 'ai2').slot, 'east');
  assert.equal(model.activePlayerId, 'ai1');
  assert.equal(JSON.stringify(state), before);
});

test('stage model exposes unopened locations until their V43地牌 is played', () => {
  const state = { currentPlayerIndex: 0, openedLocations: { tainan: true, madou: false }, players: [] };
  const model = buildStageModel(state);
  assert.equal(model.locations.find(item => item.id === 'tainan').opened, true);
  assert.equal(model.locations.find(item => item.id === 'madou').opened, false);
  assert.equal(model.locations.find(item => item.id === 'mengxia').opened, false);
  assert.equal(model.locations.find(item => item.id === 'zhuluo').opened, false);
});

test('stage model exposes standard and low performance profiles', () => {
  const state = { currentPlayerIndex: 0, openedLocations: {}, players: [] };
  assert.equal(buildStageModel(state, { quality: 'standard' }).quality.particles, true);
  assert.equal(buildStageModel(state, { quality: 'low' }).quality.particles, false);
  assert.equal(buildStageModel(state, { quality: 'low' }).quality.motionScale < 1, true);
});
