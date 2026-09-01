(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.JQGame) root.JQGame.HandSwapLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function shouldUseHandSideSwap(width) {
    return Number(width) > 1180;
  }

  return { shouldUseHandSideSwap };
});
