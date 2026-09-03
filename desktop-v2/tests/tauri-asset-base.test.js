import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const viteConfig = readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');

test('V2 production assets use a relative Vite base for Tauri custom protocol', () => {
  assert.match(viteConfig, /base:\s*['"]\.\/['"]/);
});
