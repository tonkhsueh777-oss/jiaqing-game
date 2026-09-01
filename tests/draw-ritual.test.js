const test = require('node:test');
const assert = require('node:assert/strict');
const ritual = require('../src/draw-ritual.js');

test('drag progress is clamped between 0 and 1', () => {
  assert.equal(ritual.dragProgress(-20, 160), 0);
  assert.equal(ritual.dragProgress(80, 160), 0.5);
  assert.equal(ritual.dragProgress(320, 160), 1);
});

test('release only reveals after the 62% commitment threshold', () => {
  assert.equal(ritual.releaseOutcome(0.619), 'snapback');
  assert.equal(ritual.releaseOutcome(0.62), 'reveal');
  assert.equal(ritual.releaseOutcome(1), 'reveal');
});

test('drag tilt is restrained to a subtle physical-card angle', () => {
  assert.equal(ritual.dragTilt(-200), -7);
  assert.equal(ritual.dragTilt(0), 0);
  assert.equal(ritual.dragTilt(200), 7);
});

test('prompt changes once the card crosses the commitment threshold', () => {
  assert.equal(ritual.dragPrompt(0), '按住牌背，向上慢慢搓出');
  assert.equal(ritual.dragPrompt(0.4), '继续搓…');
  assert.equal(ritual.dragPrompt(0.62), '松手揭牌');
});
