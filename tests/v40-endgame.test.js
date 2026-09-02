const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const logicPath = path.join(root, 'src', 'v40-endgame-logic.js');
const uiPath = path.join(root, 'src', 'v40-endgame-ui.js');
const cssPath = path.join(root, 'v40-endgame.css');
const indexPath = path.join(root, 'index.html');

test('V40 distinguishes human victory from AI defeat', () => {
  assert.equal(fs.existsSync(logicPath), true, 'V40 endgame logic module should exist');
  const logic = require(logicPath);
  assert.equal(logic.outcomeFor('human'), 'victory');
  assert.equal(logic.outcomeFor('ai1'), 'defeat');
  assert.equal(logic.outcomeFor('ai2'), 'defeat');
  assert.equal(logic.resultTitle('victory', '玩家（你）'), '御前大胜 · 你赢了！');
  assert.equal(logic.resultTitle('defeat', 'AI玩家甲'), '挑战失败');
  assert.match(logic.resultDetail('defeat', 'AI玩家甲'), /AI玩家甲/);
});

test('V40 loads endgame presentation and has separate victory/defeat hooks', () => {
  assert.equal(fs.existsSync(uiPath), true, 'V40 endgame UI should exist');
  assert.equal(fs.existsSync(cssPath), true, 'V40 endgame CSS should exist');
  const index = fs.readFileSync(indexPath, 'utf8');
  const uiSource = fs.readFileSync(uiPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');
  assert.match(index, /v40-endgame\.css\?v=40/);
  assert.match(index, /src\/v40-endgame-logic\.js\?v=40/);
  assert.match(index, /src\/v40-endgame-ui\.js\?v=40/);
  assert.match(uiSource, /playSound\(['"]victory['"]\)/);
  assert.match(uiSource, /playSound\(['"]defeat['"]\)/);
  assert.match(css, /v40-endgame--victory/);
  assert.match(css, /v40-endgame--defeat/);
});

test('V40 owns final-result audio after treasure effects finish', () => {
  const v23 = fs.readFileSync(path.join(root, 'src', 'v23-visual-effects.js'), 'utf8');
  assert.match(v23, /EndgamePresentation/);
  assert.match(v23, /whenIdle/);
  assert.match(v23, /kind === ['"]defeat['"]/);
});
