const test = require('node:test');
const assert = require('node:assert/strict');
const runtime = require('../src/desktop-runtime.js');

test('desktop mode requires the Tauri global', () => {
  assert.equal(runtime.isDesktop({ __TAURI__: {} }), true);
  assert.equal(runtime.isDesktop({}), false);
  assert.equal(runtime.isDesktop(null), false);
});

test('reduced motion follows matchMedia', () => {
  const reduced = { matchMedia: query => ({ matches: query.includes('reduce') }) };
  const normal = { matchMedia: () => ({ matches: false }) };
  assert.equal(runtime.prefersReducedMotion(reduced), true);
  assert.equal(runtime.prefersReducedMotion(normal), false);
});

test('applyDesktopMode only marks Tauri documents and applies reduced-motion inside desktop mode', () => {
  const makeDoc = () => {
    const classes = new Set();
    return {
      body: {
        classList: {
          toggle(name, enabled) {
            if (enabled) classes.add(name);
            else classes.delete(name);
          },
          contains(name) { return classes.has(name); }
        }
      },
      classes
    };
  };

  const desktopDoc = makeDoc();
  assert.equal(runtime.applyDesktopMode(desktopDoc, {
    __TAURI__: {},
    matchMedia: () => ({ matches: true })
  }), true);
  assert.equal(desktopDoc.body.classList.contains('desktop-mode'), true);
  assert.equal(desktopDoc.body.classList.contains('reduced-motion'), true);

  const webDoc = makeDoc();
  assert.equal(runtime.applyDesktopMode(webDoc, {
    matchMedia: () => ({ matches: true })
  }), false);
  assert.equal(webDoc.body.classList.contains('desktop-mode'), false);
  assert.equal(webDoc.body.classList.contains('reduced-motion'), false);
});
