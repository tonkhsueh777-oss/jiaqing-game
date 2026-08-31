(function (root) {
  const game = root.JQGame;
  game.SAVE_KEY = 'jiaqing-webgame-v5';
  game.SAVE_VERSION = 5;

  function resolveStorage(storage) {
    if (storage) return storage;
    try {
      return root.localStorage || null;
    } catch (error) {
      return null;
    }
  }

  function validState(state) {
    return Boolean(
      state &&
      Array.isArray(state.players) && state.players.length === 3 &&
      Array.isArray(state.drawPile) &&
      Array.isArray(state.discardPile) &&
      state.treasureStock && typeof state.treasureStock === 'object' &&
      state.openedLocations && typeof state.openedLocations === 'object' &&
      typeof state.currentPlayerIndex === 'number' &&
      ['setup', 'turnStart', 'action'].includes(state.phase) &&
      state.players.every(player => Array.isArray(player.hand) && player.hand.length <= 3)
    );
  }

  game.saveGame = function saveGame(state, storage) {
    const target = resolveStorage(storage);
    if (!target) return false;
    try {
      target.setItem(game.SAVE_KEY, JSON.stringify({ version: game.SAVE_VERSION, savedAt: Date.now(), state }));
      return true;
    } catch (error) {
      return false;
    }
  };

  game.loadGame = function loadGame(storage) {
    const target = resolveStorage(storage);
    if (!target) return null;
    try {
      const raw = target.getItem(game.SAVE_KEY);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      if (!payload || payload.version !== game.SAVE_VERSION || !validState(payload.state)) return null;
      return payload.state;
    } catch (error) {
      return null;
    }
  };

  game.clearSavedGame = function clearSavedGame(storage) {
    const target = resolveStorage(storage);
    if (!target) return false;
    try {
      target.removeItem(game.SAVE_KEY);
      return true;
    } catch (error) {
      return false;
    }
  };
})(globalThis);
