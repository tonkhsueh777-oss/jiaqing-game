const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('esbuild');

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

test('desktop JavaScript can be transpiled for WKWebView without modern syntax', () => {
  const source = read('src/main.js');
  const result = transformSync(source, {
    loader: 'js',
    target: 'safari12',
    charset: 'utf8',
    legalComments: 'none'
  });

  assert.equal(result.code.includes('?.'), false, 'transpiled main.js should not contain optional chaining');
  assert.equal(result.code.includes('??'), false, 'transpiled main.js should not contain nullish coalescing');

  const buildScript = read('scripts/build-desktop-dist.mjs');
  assert.match(buildScript, /transformSync/);
  assert.match(buildScript, /target:\s*['"]safari12['"]/);
});

test('desktop compatibility layer is loaded before the game scripts', () => {
  const html = read('index.html');
  const compatIndex = html.indexOf('src/desktop-compat.js');
  const runtimeIndex = html.indexOf('src/desktop-runtime.js');
  assert.notEqual(compatIndex, -1, 'desktop-compat.js must be referenced by index.html');
  assert.ok(compatIndex < runtimeIndex, 'desktop-compat.js must load before desktop-runtime.js');
});
