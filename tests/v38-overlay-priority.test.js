const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const cssPath = path.join(root, 'v38-overlay-priority.css');
const indexPath = path.join(root, 'index.html');

test('V38 keeps treasure reveal above V37 turn indicator', () => {
  assert.equal(fs.existsSync(cssPath), true, 'V38 overlay priority stylesheet should exist');
  const css = fs.readFileSync(cssPath, 'utf8');
  assert.match(css, /#v23-treasure-fx-root\s*\{[^}]*z-index:\s*12000/s);
  assert.match(css, /\.v23-treasure-fly-ghost\s*\{[^}]*z-index:\s*12100/s);
});

test('V38 overlay priority stylesheet loads after V37 indicator styles', () => {
  const index = fs.readFileSync(indexPath, 'utf8');
  const v37 = index.indexOf('v37-turn-indicator.css?v=37');
  const v38 = index.indexOf('v38-overlay-priority.css?v=38');
  assert.ok(v37 >= 0, 'V37 turn indicator stylesheet should still load');
  assert.ok(v38 > v37, 'V38 overlay priority stylesheet should load after V37');
});
