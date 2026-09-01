(function (root) {
  const game = root.JQGame;
  const logic = game?.AnalyticsLogic;
  if (!game || !logic) return;

  const PROJECT_URL = 'https://dyttbfkrhgsaealsyfbl.supabase.co';
  const API_KEY = 'sb_publishable_TggTpUCgheh1SPgetL0TQg_yFTGhazS';

  async function rpc(name, payload = {}) {
    try {
      const response = await fetch(`${PROJECT_URL}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: {
          apikey: API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`analytics rpc failed: ${response.status}`);
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.warn('[analytics]', error?.message || error);
      return null;
    }
  }

  async function recordEvent(type) {
    if (!['visit', 'game_start', 'game_complete'].includes(type)) return false;
    await rpc('record_game_event', { p_event_type: type });
    return true;
  }

  async function submitFeedback({ rating, reason = null, comment = null } = {}) {
    if (!['like', 'dislike'].includes(rating)) return false;
    if (rating === 'dislike' && !logic.validReason(reason)) return false;
    await rpc('submit_game_feedback', {
      p_rating: rating,
      p_reason: rating === 'like' ? null : reason,
      p_comment: comment || null
    });
    return true;
  }

  async function fetchStats() {
    const value = await rpc('get_public_game_stats');
    return logic.normalizeStats(value || {});
  }

  game.Analytics = { recordEvent, submitFeedback, fetchStats };
})(globalThis);
