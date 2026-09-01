const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'desktop-dist');

test('desktop staging contains runtime files but excludes repository internals', () => {
  fs.rmSync(dist, { recursive: true, force: true });
  const run = spawnSync(process.execPath, ['scripts/build-desktop-dist.mjs'], {
    cwd: root,
    encoding: 'utf8'
  });

  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.equal(fs.existsSync(path.join(dist, 'index.html')), true);
  assert.equal(fs.existsSync(path.join(dist, 'src', 'main.js')), true);
  assert.equal(fs.existsSync(path.join(dist, 'assets')), true);
  assert.equal(fs.existsSync(path.join(dist, 'src-tauri')), false);
  assert.equal(fs.existsSync(path.join(dist, 'docs')), false);
  assert.equal(fs.existsSync(path.join(dist, '.git')), false);
});
