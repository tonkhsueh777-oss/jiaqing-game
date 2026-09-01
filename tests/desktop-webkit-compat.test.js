const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('desktop runtime source avoids Array.prototype.at for older WKWebView', () => {
  const browserFiles = [
    'src/ui.js',
    'src/desktop-ai-cinematic.js'
  ];

  for (const file of browserFiles) {
    const source = read(file);
    assert.equal(/\.at\s*\(|\.at\?\./.test(source), false, `${file} must not depend on Array.prototype.at`);
  }
});

test('desktop staging transpiles modern JavaScript syntax for WKWebView', () => {
  execFileSync(process.execPath, ['scripts/build-desktop-dist.mjs'], {
    cwd: root,
    stdio: 'pipe'
  });

  const stagedMain = read('desktop-dist/src/main.js');
  assert.equal(stagedMain.includes('?.'), false, 'staged main.js should not contain optional chaining');
  assert.equal(stagedMain.includes('??'), false, 'staged main.js should not contain nullish coalescing');
});
