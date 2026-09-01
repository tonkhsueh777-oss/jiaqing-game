const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modulePath = path.join(__dirname, '../src/v30-beginner-assist-logic.js');

test('beginner assist logic module exists', () => {
  assert.equal(fs.existsSync(modulePath), true, 'v30 beginner assist logic module should exist');
});

const logic = require(modulePath);

test('beginner mode defaults to on when nothing was saved', () => {
  assert.equal(logic.readSavedMode(null), true);
  assert.equal(logic.readSavedMode(undefined), true);
});

test('saved off/on values are restored', () => {
  assert.equal(logic.readSavedMode('0'), false);
  assert.equal(logic.readSavedMode('false'), false);
  assert.equal(logic.readSavedMode('1'), true);
  assert.equal(logic.readSavedMode('true'), true);
});

test('turn helper prefers the live interaction hint', () => {
  assert.equal(
    logic.buildHelpText({ hint: '请选择地图上发光的合法目的地。', selectedRule: '巡游规则' }),
    '请选择地图上发光的合法目的地。'
  );
});

test('turn helper falls back to the selected card rule then default guidance', () => {
  assert.equal(logic.buildHelpText({ hint: '', selectedRule: '停留在已开放地点时打出明察。' }), '停留在已开放地点时打出明察。');
  assert.match(logic.buildHelpText({ hint: '', selectedRule: '' }), /先选择一张手牌/);
});
