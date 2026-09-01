const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const uiSource = fs.readFileSync(path.join(__dirname, '../src/ui.js'), 'utf8');
const cssSource = fs.readFileSync(path.join(__dirname, '../v27-mobile-board-lock.css'), 'utf8');

test('board nodes expose stable location ids for CSS mobile positioning', () => {
  assert.match(uiSource, /board-node board-node--center[^>]*data-location-id=["']center["']/);
  assert.match(uiSource, /board-node board-node--location[^>]*data-location-id=["']\$\{locationId\}["']/);
});

test('player tokens expose their rendered board position', () => {
  assert.match(uiSource, /player-token player-token--\$\{player\.id\}[^>]*data-position=["']\$\{position\}["']/);
});

test('mobile CSS hard-locks the 2x2 board positions and center independently of JS', () => {
  for (const id of ['tainan', 'mengxia', 'zhuluo', 'madou', 'center']) {
    assert.match(cssSource, new RegExp(`data-location-id=["']${id}["']`));
  }
  assert.match(cssSource, /data-position=["']center["']/);
});
