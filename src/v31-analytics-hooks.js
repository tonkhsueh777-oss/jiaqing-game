(function (root) {
  const game = root.JQGame;
  const logic = game?.AnalyticsLogic;
  if (!game?.Analytics || !game?.UI || !logic) return;

  let previousWinnerId = null;
  const seenStates = new WeakSet();
  const baseRender = game.UI.render.bind(game.UI);

  function completionKey(state) {
    return String(state?.analyticsGameId || `legacy-${state?.winnerId || 'none'}-${state?.turnNumber || 0}`);
  }

  function wasRecorded(key) {
    try { return root.localStorage?.getItem('jqgame.analytics.lastCompletedGame') === key; }
    catch (_) { return false; }
  }

  function markRecorded(key) {
    try { root.localStorage?.setItem('jqgame.analytics.lastCompletedGame', key); }
    catch (_) {}
  }

  game.UI.render = function renderV31Analytics(state) {
    baseRender(state);

    if (state && typeof state === 'object' && !seenStates.has(state)) {
      seenStates.add(state);
      if (state.phase === 'setup' && Number(state.turnNumber) === 1 && !state.winnerId) {
        game.Analytics.recordEvent('game_start');
      }
    }

    const nextWinnerId = state?.winnerId || null;
    if (logic.shouldRecordCompletion(previousWinnerId, nextWinnerId)) {
      const key = completionKey(state);
      if (!wasRecorded(key)) {
        markRecorded(key);
        game.Analytics.recordEvent('game_complete').then(() => game.AnalyticsUI?.refresh?.());
      }
    }
    previousWinnerId = nextWinnerId;
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
      await game.Analytics.recordEvent('visit');
      await game.AnalyticsUI?.refresh?.();
    });
  }
})(globalThis);
