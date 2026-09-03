import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/ui/app-shell.css', import.meta.url), 'utf8');

test('standard V2 stage has subtle four-location ambient breathing', () => {
  assert.match(css, /\.v2-stage::before/);
  assert.match(css, /@keyframes\s+v2StageBreath/);
  assert.match(css, /radial-gradient\(circle at 50% 17%/);
  assert.match(css, /radial-gradient\(circle at 22% 50%/);
  assert.match(css, /radial-gradient\(circle at 78% 50%/);
  assert.match(css, /radial-gradient\(circle at 50% 82%/);
});

test('old Mac quality disables continuous stage breathing', () => {
  assert.match(css, /\[data-quality="low"\]\s+\.v2-stage::before[\s\S]*animation:\s*none/);
});
