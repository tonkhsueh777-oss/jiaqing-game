import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const compat = readFileSync(new URL('../src/compat/old-webkit.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('V2 installs replaceChildren compatibility before booting on older macOS WebKit', () => {
  assert.match(compat, /Element\.prototype\.replaceChildren/);
  assert.match(compat, /removeChild\(/);
  assert.match(compat, /appendChild\(/);
  assert.match(main, /^import '\.\/compat\/old-webkit\.js';/m);
});
