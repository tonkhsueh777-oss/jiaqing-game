const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const logicPath = path.join(root, 'src', 'v36-turn-pacing-logic.js');
const uiPath = path.join(root, 'src', 'v36-turn-pacing-ui.js');
const indexPath = path.join(root, 'index.html');

test('V36 turn pacing logic defines readable AI and human handoff timing', () => {
  assert.equal(fs.existsSync(logicPath), true, 'V36 pacing logic module should exist');
  const logic = require(logicPath);
  assert.deepEqual(logic.TIMINGS, {
    aiThinkingMs: 1100,
    aiActionLeadMs: 360,
    humanHandoffMs: 650
  });
  assert.equal(logic.statusText({ name: 'AI玩家甲' }, 'thinking'), 'AI玩家甲 · 思考中…');
  assert.equal(logic.statusText({ name: 'AI玩家甲' }, 'acting'), 'AI玩家甲 · 正在行动');
  assert.equal(logic.statusText({ name: 'AI玩家甲' }, 'transition'), 'AI玩家甲 · 回合结束，准备下一位…');
  assert.equal(logic.statusText({ name: '玩家（你）' }, 'human'), '轮到你行动');
});

test('V36 pacing runtime is loaded before main and exposes explicit turn-state UI', () => {
  assert.equal(fs.existsSync(uiPath), true, 'V36 pacing UI module should exist');
  const index = fs.readFileSync(indexPath, 'utf8');
  const logicIndex = index.indexOf('src/v36-turn-pacing-logic.js?v=36');
  const uiIndex = index.indexOf('src/v36-turn-pacing-ui.js?v=36');
  const mainIndex = index.indexOf('src/main.js?v=');
  assert.ok(logicIndex >= 0, 'V36 pacing logic should be loaded');
  assert.ok(uiIndex > logicIndex, 'V36 pacing UI should load after its logic');
  assert.ok(mainIndex > uiIndex, 'V36 pacing runtime should load before main');

  const uiSource = fs.readFileSync(uiPath, 'utf8');
  assert.match(uiSource, /aiThinkingMs/);
  assert.match(uiSource, /aiActionLeadMs/);
  assert.match(uiSource, /humanHandoffMs/);
  assert.match(uiSource, /turn-pacing-lock/);
  assert.match(uiSource, /runAiTurnV36/);
});
