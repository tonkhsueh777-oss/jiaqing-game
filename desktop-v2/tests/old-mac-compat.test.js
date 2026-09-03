import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const stageView = readFileSync(new URL('../src/stage/stage-view.js', import.meta.url), 'utf8');

test('V2 stage mounting avoids replaceChildren for older macOS WebKit', () => {
  assert.doesNotMatch(stageView, /\.replaceChildren\s*\(/);
  assert.match(stageView, /\.appendChild\s*\(/);
});
