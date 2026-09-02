const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('V42 loads a readability override after V39/V41', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const v42 = index.indexOf('v42-discard-readability.css?v=42');
  assert.ok(v42 >= 0, 'V42 readability stylesheet should be loaded');
  assert.ok(v42 > index.indexOf('v39-discard-pile.css?v=39'));
  assert.ok(v42 > index.indexOf('v41-new-game-placement.css?v=41'));
});

test('V42 keeps a simple stacked-card silhouette without floral card-back artwork', () => {
  const cssPath = path.join(root, 'v42-discard-readability.css');
  assert.equal(fs.existsSync(cssPath), true, 'V42 readability CSS should exist');
  const css = fs.readFileSync(cssPath, 'utf8');
  assert.doesNotMatch(css, /card-back\.jpg/);
  assert.match(css, /v39-discard-pile::before/);
  assert.match(css, /v39-discard-pile::after/);
  assert.match(css, /linear-gradient/);
});

test('V42 gives discard copy its own high-contrast reading surfaces', () => {
  const css = fs.readFileSync(path.join(root, 'v42-discard-readability.css'), 'utf8');
  assert.match(css, /v39-discard-title/);
  assert.match(css, /v39-discard-kicker/);
  assert.match(css, /v39-discard-flow/);
  assert.match(css, /hand-side-note__tip/);
  assert.match(css, /background:\s*rgba\(/);
});
