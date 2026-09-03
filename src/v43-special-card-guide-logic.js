(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.JQGame = root.JQGame || {};
    root.JQGame.SpecialCardGuideLogic = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFINITIONS = Object.freeze({
    bully: Object.freeze({
      typeLabel: '计策牌',
      summary: '让对手跳过下回合',
      detail: '指定1名对手，使其下一个完整回合无法行动。',
      targetPrompt: '下一步：请选择一名对手。'
    }),
    fire: Object.freeze({
      typeLabel: '计策牌',
      summary: '随机烧掉对手1张手牌',
      detail: '指定1名有手牌的对手，随机烧掉其1张手牌；被烧掉的牌进入弃牌堆，对方下回合再正常补牌。',
      targetPrompt: '下一步：请选择一名有手牌的对手。'
    }),
    flower: Object.freeze({
      typeLabel: '计策牌',
      summary: '与对手交换当前位置',
      detail: '指定1名对手，你与他的当前位置立即交换。',
      targetPrompt: '下一步：请选择要交换位置的对手。'
    }),
    jiaqingOrder: Object.freeze({
      typeLabel: '王牌',
      summary: '强制交换双方1件宝物',
      detail: '选择1名对手，再选择你要交出的1件宝物和要从对手处换走的1件宝物。',
      targetPrompt: '下一步：先选择一名对手。'
    }),
    wangOrder: Object.freeze({
      typeLabel: '王牌',
      summary: '强制交换双方1件宝物',
      detail: '选择1名对手，再选择你要交出的1件宝物和要从对手处换走的1件宝物。',
      targetPrompt: '下一步：先选择一名对手。'
    })
  });

  function definitionFor(card) {
    return card && DEFINITIONS[card.key] ? { ...DEFINITIONS[card.key] } : null;
  }

  function summaryFor(card) {
    return definitionFor(card)?.summary || '';
  }

  function detailFor(card) {
    return definitionFor(card)?.detail || '';
  }

  function targetPromptFor(card) {
    return definitionFor(card)?.targetPrompt || '';
  }

  function typeLabelFor(card) {
    return definitionFor(card)?.typeLabel || (card?.type === 'trump' ? '王牌' : card?.type === 'tactic' ? '计策牌' : '');
  }

  function tutorialFor(type) {
    if (type === 'tactic') return {
      title: '你获得了一张计策牌',
      message: '计策牌可以直接干扰其他玩家。牌面下方会显示一句功能摘要；点击计策牌后，右侧「行动说明」会告诉你效果和下一步，真正发动前还会再次确认。'
    };
    if (type === 'trump') return {
      title: '你获得了一张王牌',
      message: '王牌可以强制改变双方宝物，是非常珍贵的牌。点击王牌后，右侧「行动说明」会依次提示：选择对手、选择你交出的宝物、选择你要换走的宝物；最后确认后才会发动。'
    };
    return null;
  }

  return { DEFINITIONS, definitionFor, summaryFor, detailFor, targetPromptFor, typeLabelFor, tutorialFor };
});
