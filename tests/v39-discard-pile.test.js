const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const runtimePath = 'src/v39-discard-pile-ui.js';
const cssPath = 'v39-discard-pile.css';
const index = fs.readFileSync('index.html','utf8');

test('V39 makes the fallback action unmistakably read as a discard pile', () => {
  assert.equal(fs.existsSync(runtimePath), true);
  const source = fs.readFileSync(runtimePath,'utf8');
  assert.match(source, /弃牌堆/);
  assert.match(source, /弃1张手牌/);
  assert.match(source, /补1张新牌/);
  assert.match(source, /结束回合/);
});

test('V39 renders a stacked card pile using the real card back', () => {
  assert.equal(fs.existsSync(cssPath), true);
  const css = fs.readFileSync(cssPath,'utf8');
  assert.match(css, /card-back\.jpg/);
  assert.match(css, /v39-discard-pile/);
  assert.match(css, /::before/);
  assert.match(css, /::after/);
});

test('V39 assets load after prior UI layers and before main', () => {
  const v38Css = index.indexOf('v38-overlay-priority.css?v=38');
  const v39Css = index.indexOf('v39-discard-pile.css?v=39');
  const v37Ui = index.indexOf('src/v37-turn-indicator-ui.js?v=37');
  const v39Ui = index.indexOf('src/v39-discard-pile-ui.js?v=39');
  const main = index.indexOf('src/main.js?v=37');
  assert.ok(v39Css > v38Css);
  assert.ok(v39Ui > v37Ui);
  assert.ok(main > v39Ui);
});
