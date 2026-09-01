(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.JQGame = root.JQGame || {};
    root.JQGame.DesktopTreasureCinematic = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function isHumanTreasureGain(gain) {
    return Boolean(gain && gain.playerId === 'human' && Number(gain.amount || 0) > 0);
  }

  function createQueue() {
    const items = [];
    return {
      enqueue(gain) {
        if (!isHumanTreasureGain(gain)) return false;
        items.push({ ...gain });
        return true;
      },
      shift() {
        return items.shift() || null;
      },
      peek() {
        return items[0] || null;
      },
      size() {
        return items.length;
      },
      clear() {
        items.length = 0;
      }
    };
  }

  return { isHumanTreasureGain, createQueue };
});
