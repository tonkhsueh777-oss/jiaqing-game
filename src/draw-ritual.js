(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.JQGame = root.JQGame || {};
    root.JQGame.DrawRitual = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const COMMIT_THRESHOLD = 0.62;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function dragProgress(distance, requiredDistance = 160) {
    if (!Number.isFinite(distance) || !Number.isFinite(requiredDistance) || requiredDistance <= 0) return 0;
    return clamp(distance / requiredDistance, 0, 1);
  }

  function releaseOutcome(progress) {
    return Number(progress) >= COMMIT_THRESHOLD ? 'reveal' : 'snapback';
  }

  function dragTilt(deltaX) {
    if (!Number.isFinite(deltaX)) return 0;
    return clamp(deltaX / 18, -7, 7);
  }

  function dragPrompt(progress) {
    if (Number(progress) >= COMMIT_THRESHOLD) return '松手揭牌';
    if (Number(progress) >= 0.12) return '继续搓…';
    return '按住牌背，向上慢慢搓出';
  }

  return {
    COMMIT_THRESHOLD,
    dragProgress,
    releaseOutcome,
    dragTilt,
    dragPrompt
  };
});
