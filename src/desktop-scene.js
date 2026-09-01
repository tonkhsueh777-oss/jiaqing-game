(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.JQGame = root.JQGame || {};
    root.JQGame.DesktopScene = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  let mounted = null;
  let pointerHandler = null;
  let leaveHandler = null;
  let rafId = 0;
  let pendingPoint = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function parallaxFromPointer(clientX, clientY, width, height) {
    if (!width || !height) return { x: 0, y: 0 };
    return {
      x: Number(clamp((clientX / width - 0.5) * 2, -1, 1).toFixed(4)),
      y: Number(clamp((clientY / height - 0.5) * 2, -1, 1).toFixed(4))
    };
  }

  function applyPoint(rootElement, point) {
    if (!rootElement?.style) return;
    rootElement.style.setProperty('--desktop-parallax-x', String(point.x));
    rootElement.style.setProperty('--desktop-parallax-y', String(point.y));
  }

  function init(options = {}) {
    destroy();
    const doc = options.document || globalThis.document;
    const win = options.window || globalThis;
    const rootElement = options.root || doc?.documentElement;
    const reducedMotion = Boolean(options.reducedMotion);
    if (!doc?.body?.classList?.contains('desktop-mode') || !rootElement || !win?.addEventListener) return false;

    mounted = { doc, win, rootElement };
    applyPoint(rootElement, { x: 0, y: 0 });
    if (reducedMotion) return true;

    pointerHandler = event => {
      pendingPoint = parallaxFromPointer(event.clientX, event.clientY, win.innerWidth || 1, win.innerHeight || 1);
      if (rafId) return;
      rafId = win.requestAnimationFrame?.(() => {
        rafId = 0;
        if (pendingPoint) applyPoint(rootElement, pendingPoint);
      }) || 0;
      if (!win.requestAnimationFrame) {
        applyPoint(rootElement, pendingPoint);
        pendingPoint = null;
      }
    };

    leaveHandler = () => {
      pendingPoint = { x: 0, y: 0 };
      applyPoint(rootElement, pendingPoint);
    };

    win.addEventListener('pointermove', pointerHandler, { passive: true });
    doc.addEventListener?.('mouseleave', leaveHandler);
    return true;
  }

  function destroy() {
    if (!mounted) return;
    if (pointerHandler) mounted.win.removeEventListener?.('pointermove', pointerHandler);
    if (leaveHandler) mounted.doc.removeEventListener?.('mouseleave', leaveHandler);
    if (rafId) mounted.win.cancelAnimationFrame?.(rafId);
    applyPoint(mounted.rootElement, { x: 0, y: 0 });
    mounted = null;
    pointerHandler = null;
    leaveHandler = null;
    rafId = 0;
    pendingPoint = null;
  }

  return { parallaxFromPointer, init, destroy };
});
