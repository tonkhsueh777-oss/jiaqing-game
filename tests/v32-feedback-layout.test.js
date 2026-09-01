const test = require('node:test');
const assert = require('node:assert/strict');
const layout = require('../src/v32-feedback-layout.js');

test('desktop and tablet place feedback in the right rail', () => {
  assert.equal(layout.panelTargetForWidth(769), 'right');
  assert.equal(layout.panelTargetForWidth(1181), 'right');
  assert.equal(layout.panelTargetForWidth(1920), 'right');
});

test('mobile placement remains unchanged in the left information flow', () => {
  assert.equal(layout.panelTargetForWidth(768), 'left');
  assert.equal(layout.panelTargetForWidth(390), 'left');
});
