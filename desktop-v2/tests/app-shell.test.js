import test from 'node:test';
import assert from 'node:assert/strict';
import { shellMarkup } from '../src/ui/app-shell.js';

test('V2 desktop shell exposes stage, hand, action guide and fullscreen control', () => {
  const html = shellMarkup();
  assert.match(html, /id="v2-stage"/);
  assert.match(html, /id="v2-stage-canvas-host"/);
  assert.match(html, /id="v2-hand"/);
  assert.match(html, /id="v2-action-guide"/);
  assert.match(html, /data-action="toggle-fullscreen"/);
  assert.match(html, /data-quality="standard"/);
  assert.match(html, /data-quality="low"/);
});
