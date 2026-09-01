(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.JQGame) root.JQGame.VisualEffectsLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalizePlayers(input) {
    if (!input) return {};
    if (Array.isArray(input)) {
      return Object.fromEntries(input.map(player => [player.id, { ...(player.treasures || {}) }]));
    }
    return Object.fromEntries(Object.entries(input).map(([id, treasures]) => [id, { ...(treasures || {}) }]));
  }

  function snapshotState(state) {
    return {
      players: normalizePlayers(state?.players),
      logLength: Array.isArray(state?.log) ? state.log.length : 0,
      winnerId: state?.winnerId || null
    };
  }

  function detectTreasureGains(previous, next) {
    if (!previous?.players || !next?.players) return [];
    const gains = [];
    for (const [playerId, nextTreasures] of Object.entries(next.players)) {
      const previousTreasures = previous.players[playerId] || {};
      for (const [treasureId, nextCountRaw] of Object.entries(nextTreasures || {})) {
        const nextCount = Number(nextCountRaw || 0);
        const previousCount = Number(previousTreasures[treasureId] || 0);
        const amount = nextCount - previousCount;
        if (amount > 0) gains.push({ playerId, treasureId, amount });
      }
    }
    return gains;
  }

  function shouldShowTreasureGain(gain) {
    return Boolean(gain && gain.playerId === 'human' && Number(gain.amount || 0) > 0);
  }

  function classifyLog(line) {
    const text = String(line || '');
    if (!text) return null;
    if (text.includes('明察成功') || text.includes('取得【')) return 'treasure';
    if (text.includes('打出【巡游】') || text.includes('移动至')) return 'move';
    if (text.includes('开放地点')) return 'location';
    if (text.includes('发动【') || text.includes('强制交换')) return 'command';
    if (text.includes('进入行动阶段') || text.includes('回合开始')) return 'turn';
    if (text.includes('跳过')) return 'skip';
    if (text.includes('弃牌') || text.includes('进入弃牌堆') || text.includes('换入弃牌堆')) return 'discard';
    if (text.includes('回合结束')) return 'end';
    return null;
  }

  return { snapshotState, detectTreasureGains, shouldShowTreasureGain, classifyLog };
});
