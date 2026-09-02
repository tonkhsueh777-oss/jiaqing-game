const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const cssPath = path.join(root, 'v41-new-game-placement.css');

test('V41 moves the new-game control from the left footer to the right action area', () => {
  const leftStart = index.indexOf('<div class="left-actions">');
  const leftEnd = index.indexOf('</div>', leftStart);
  const leftBlock = index.slice(leftStart, leftEnd + 6);
  assert.doesNotMatch(leftBlock, /id="btn-new-game"/);

  const controlsStart = index.indexOf('<section class="dashboard-panel controls-panel">');
  const rightEnd = index.indexOf('</aside>', controlsStart);
  const rightBlock = index.slice(controlsStart, rightEnd);
  assert.match(rightBlock, /id="btn-new-game"/);
  assert.match(rightBlock, /right-new-game/);
});

test('V41 loads dedicated styling that makes new game prominent below the right controls', () => {
  assert.equal(fs.existsSync(cssPath), true, 'V41 placement stylesheet should exist');
  assert.match(index, /v41-new-game-placement\.css\?v=41/);
  const css = fs.readFileSync(cssPath, 'utf8');
  assert.match(css, /\.right-new-game/);
  assert.match(css, /#btn-new-game/);
});
