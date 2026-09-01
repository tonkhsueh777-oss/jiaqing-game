(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root?.JQGame) root.JQGame.AnalyticsLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const REASONS = Object.freeze(['rules', 'controls', 'mobile', 'pace', 'visual_audio', 'other']);

  function asCount(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }

  function normalizeStats(value = {}) {
    return {
      todayVisits: asCount(value.today_visits),
      totalVisits: asCount(value.total_visits),
      likes: asCount(value.likes),
      dislikes: asCount(value.dislikes)
    };
  }

  function validReason(value) {
    return REASONS.includes(value);
  }

  function shouldRecordCompletion(previousWinnerId, nextWinnerId) {
    return !previousWinnerId && Boolean(nextWinnerId);
  }

  return { REASONS, normalizeStats, validReason, shouldRecordCompletion };
});
