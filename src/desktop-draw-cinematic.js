(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.JQGame = root.JQGame || {};
    root.JQGame.DesktopDrawCinematic = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createController() {
    let locked = false;
    let token = 0;

    return {
      begin() {
        if (locked) return false;
        locked = true;
        token += 1;
        return token;
      },
      finish(expectedToken) {
        if (!locked) return false;
        if (expectedToken != null && expectedToken !== token) return false;
        locked = false;
        return true;
      },
      isLocked() {
        return locked;
      },
      token() {
        return token;
      }
    };
  }

  const sharedController = createController();
  let installed = false;

  function install(ui, doc = globalThis.document) {
    if (installed || !ui || typeof ui.showDrawRitual !== 'function' || !doc?.body?.classList?.contains('desktop-mode')) return false;
    const baseShowDrawRitual = ui.showDrawRitual.bind(ui);
    ui.showDrawRitual = async function desktopShowDrawRitual(cards, options = {}) {
      const token = sharedController.begin();
      if (!token) return false;
      doc.body.classList.add('desktop-draw-cinematic-active');
      try {
        await baseShowDrawRitual(cards, options);
        return true;
      } finally {
        doc.body.classList.remove('desktop-draw-cinematic-active');
        sharedController.finish(token);
      }
    };
    installed = true;
    return true;
  }

  return { createController, sharedController, install };
});
