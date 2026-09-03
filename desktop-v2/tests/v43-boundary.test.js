import test from 'node:test';
import assert from 'node:assert/strict';
import { findProtectedChanges, protectedV43Paths } from '../scripts/verify-v43-boundary.mjs';

test('V43 boundary flags protected online files but ignores desktop-v2 files', () => {
  assert.equal(protectedV43Paths.has('src/rules.js'), true);
  assert.deepEqual(
    findProtectedChanges(['desktop-v2/src/main.js', 'src/rules.js', 'index.html']),
    ['src/rules.js', 'index.html']
  );
});
