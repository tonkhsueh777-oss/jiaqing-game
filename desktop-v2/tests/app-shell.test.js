import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

test('desktop-v2 has an isolated desktop entry and does not reuse root index', () => {
  const htmlPath = path.join(root, 'index.html');
  assert.equal(fs.existsSync(htmlPath), true, 'desktop-v2/index.html should exist');
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.match(html, /id=["']app["']/);
  assert.match(html, /\/src\/main\.js/);
});
