(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.JQGame) root.JQGame.FeedbackLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function panelTargetForWidth(width) {
    return Number(width) > 768 ? 'right' : 'left';
  }

  return { panelTargetForWidth };
});
