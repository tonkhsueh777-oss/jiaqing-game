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
  return { createController, sharedController };
});
