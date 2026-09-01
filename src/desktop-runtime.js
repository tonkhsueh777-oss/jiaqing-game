(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.JQGame = root.JQGame || {};
    root.JQGame.DesktopRuntime = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function isDesktop(env = globalThis) {
    return Boolean(env && env.__TAURI__);
  }

  function prefersReducedMotion(env = globalThis) {
    return Boolean(env?.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  }

  function applyDesktopMode(doc = globalThis.document, env = globalThis) {
    if (!doc?.body) return false;
    const enabled = isDesktop(env);
    doc.body.classList.toggle('desktop-mode', enabled);
    doc.body.classList.toggle('reduced-motion', enabled && prefersReducedMotion(env));
    return enabled;
  }

  return { isDesktop, prefersReducedMotion, applyDesktopMode };
});
