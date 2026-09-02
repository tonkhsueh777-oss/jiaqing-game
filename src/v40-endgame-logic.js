(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.JQGame = root.JQGame || {};
    root.JQGame.EndgamePresentation = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function outcomeFor(winnerId) {
    return winnerId === 'human' ? 'victory' : 'defeat';
  }

  function resultTitle(outcome) {
    return outcome === 'victory' ? '御前大胜 · 你赢了！' : '挑战失败';
  }

  function resultDetail(outcome, winnerName) {
    if (outcome === 'victory') return '你率先集齐四种御前圣物，赢得本局御前争霸。';
    return `${winnerName || 'AI玩家'}率先集齐四种御前圣物，本局由对手获胜。`;
  }

  return { outcomeFor, resultTitle, resultDetail };
});
