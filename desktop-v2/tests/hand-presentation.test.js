import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/ui/hud.css', import.meta.url), 'utf8');

test('V2 hand uses desktop-card depth, legal glow and selected lift cues', () => {
  assert.match(css, /perspective:\s*1000px/);
  assert.match(css, /rotateX\(/);
  assert.match(css, /\.v2-hand-card\.is-legal::after/);
  assert.match(css, /\.v2-hand-card\.is-selected/);
  assert.match(css, /translateY\(-2[0-9]px\)/);
});
