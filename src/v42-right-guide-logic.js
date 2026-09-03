(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.JQGame = root.JQGame || {};
    root.JQGame.V42RightGuideLogic = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function guideFor({ humanTurn = false, mode = 'idle', playableNames = [], special = null, hint = '' } = {}) {
    if (!humanTurn) return null;

    if (mode === 'choosePassCard') {
      return {
        kind: 'choice',
        title: '正在选择弃牌',
        detail: '请选择1张你不想保留的手牌。',
        next: '弃掉后，系统会自动补1张新牌并结束本回合。'
      };
    }

    if (mode === 'specialUnavailable' && special) {
      return {
        kind: 'special',
        title: `${special.name}｜${special.typeLabel}`,
        detail: hint || `${special.name}现在暂时不能使用。`,
        next: '你可以选择其他可用手牌，或换1张并结束本回合。'
      };
    }

    if (['chooseTacticTarget', 'chooseTrumpOpponent', 'chooseTrumpOwnTreasure', 'chooseTrumpTargetTreasure'].includes(mode) && special) {
      return {
        kind: 'special',
        title: `${special.name}｜${special.typeLabel}`,
        detail: special.detail,
        next: hint || special.targetPrompt
      };
    }

    const names = Array.isArray(playableNames) ? playableNames.filter(Boolean) : [];
    if (names.length) {
      return {
        kind: 'playable',
        title: '本回合可以行动',
        detail: `可用手牌：${names.join('、')}`,
        next: '下一步：先点击其中1张手牌；选中后，右侧会继续显示这张牌可以执行的动作。'
      };
    }

    return {
      kind: 'discard',
      title: '现在没有可以出的牌',
      detail: '这不是卡住了，本回合需要弃1张换1张。',
      next: '下一步：点击手牌区右侧的「弃牌堆」，再选择1张不需要的手牌。'
    };
  }

  return { guideFor };
});
