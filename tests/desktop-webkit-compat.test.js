const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('desktop compatibility layer polyfills Array.prototype.at', () => {
  const source = read('src/desktop-compat.js');
  const context = vm.createContext({ console });
  vm.runInContext('Array.prototype.at = undefined;', context);
  vm.runInContext(source, context);
  const value = vm.runInContext('[10, 20, 30].at(-1)', context);
  assert.equal(value, 30);
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

test('desktop compatibility layer is loaded before the game scripts', () => {
  const html = read('index.html');
  const compatIndex = html.indexOf('src/desktop-compat.js');
  const runtimeIndex = html.indexOf('src/desktop-runtime.js');
  assert.notEqual(compatIndex, -1, 'desktop-compat.js must be referenced by index.html');
  assert.ok(compatIndex < runtimeIndex, 'desktop-compat.js must load before desktop-runtime.js');
});
