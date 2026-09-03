const TREASURE_ORDER = ['goldSeal', 'sword', 'gun', 'pomelo'];

function positionName(game, position) {
  if (!position || position === 'center') return '中央起点';
  return game.LOCATIONS?.[position]?.name || position;
}

function treasureCount(player) {
  return Object.values(player?.treasures || {}).reduce((sum, value) => sum + Number(value || 0), 0);
}

function turnLabel(state, active) {
  if (state?.winnerId) return '牌局结束';
  if (!active) return '等待牌局';
  if (active.id === 'human') return '你的回合';
  return `${active.name}行动中`;
}

function selectedGuide(action, selected, game, state, active, canSwapPass) {
  if (state?.winnerId) {
    const winner = state.players?.find(player => player.id === state.winnerId);
    return winner?.id === 'human' ? '你已经集齐四种宝物，牌局胜利。' : `${winner?.name || '对手'}已经集齐四种宝物，牌局结束。`;
  }
  if (active?.id && active.id !== 'human') return `${active.name}正在行动，请观察中央战局与棋子变化。`;
  if (!selected) {
    return canSwapPass
      ? '当前没有可以正常使用的手牌。请选择1张手牌，将它换入弃牌堆并补1张新牌，结束本回合。'
      : '请选择一张手牌。右侧会显示这张牌能做什么，以及下一步要选择的目标。';
  }
  if (!action) {
    if (canSwapPass) return `【${selected.name}】当前不能正常使用，可以将它换入弃牌堆并补1张新牌，结束本回合。`;
    return game.getCardUnavailableReason?.(state, 'human', selected.card) || '这张牌目前不能使用。';
  }
  if (action.type === 'travel') {
    const names = (action.destinations || []).map(id => positionName(game, id));
    return names.length ? `这张牌可以移动。下一步请选择：${names.join('、')}。` : '这张牌目前没有可移动地点。';
  }
  if (action.type === 'location') return action.duplicate ? '这个地点已经开放，使用后按原规则结算重复地牌。' : `使用后开放${positionName(game, action.locationId)}。`;
  if (action.type === 'inspect') return `你当前位于${positionName(game, action.locationId)}，可以使用【${selected.name}】执行明察。`;
  if (action.type === 'tactic') return `${game.SpecialCardGuideLogic?.targetPromptFor?.(selected.card) || '下一步请选择一名对手。'}`;
  if (action.type === 'trump') return '下一步选择一名拥有宝物的对手，再选择你要交出的宝物和要换回来的宝物。';
  if (action.type === 'discard') return '当前需要弃牌。选择这张牌后将其放入弃牌堆。';
  return '这张牌可以使用。';
}

export function buildHudModel(state, game, selectedRuntimeId = null) {
  const players = (state?.players || []).map((player, index) => ({
    id: player.id,
    name: player.id === 'human' ? '我（你）' : player.name,
    handCount: player.hand?.length || 0,
    positionName: positionName(game, player.position),
    treasureCount: treasureCount(player),
    treasures: { ...(player.treasures || {}) },
    active: index === state.currentPlayerIndex,
    skipTurns: player.skipTurns || 0
  }));
  const active = state?.players?.[state.currentPlayerIndex] || null;
  const human = state?.players?.find(player => player.id === 'human') || null;
  const legalActions = game.getLegalActions?.(state, 'human') || [];
  const legalByCard = new Map(legalActions.filter(action => action.runtimeId).map(action => [action.runtimeId, action]));
  const hand = (human?.hand || []).map(card => ({
    runtimeId: card.runtimeId,
    name: card.name,
    type: card.type,
    key: card.key,
    asset: card.asset,
    legal: legalByCard.has(card.runtimeId),
    selected: card.runtimeId === selectedRuntimeId,
    card
  }));
  const selectedHand = hand.find(card => card.runtimeId === selectedRuntimeId) || null;
  const selectedAction = selectedHand ? legalByCard.get(selectedHand.runtimeId) || null : null;
  const selected = selectedHand ? {
    ...selectedHand,
    typeLabel: game.SpecialCardGuideLogic?.typeLabelFor?.(selectedHand.card) || ({ travel: '行动牌', inspect: '行动牌', location: '地牌', tactic: '计策牌', trump: '王牌' }[selectedHand.type] || '手牌'),
    detail: game.SpecialCardGuideLogic?.detailFor?.(selectedHand.card) || ''
  } : null;
  const playableCardActions = legalActions.filter(action => action.runtimeId && action.type !== 'discard');
  const canSwapPass = Boolean(active?.id === 'human' && state?.phase === 'action' && hand.length > 0 && playableCardActions.length === 0);

  return {
    turn: {
      number: state?.turnNumber || 1,
      phase: state?.phase || 'setup',
      label: turnLabel(state, active),
      activePlayerId: active?.id || null
    },
    players,
    treasures: TREASURE_ORDER.map(id => ({ id, name: game.TREASURES?.[id]?.shortName || id, count: Number(human?.treasures?.[id] || 0) })),
    deck: { drawCount: state?.drawPile?.length || 0, discardCount: state?.discardPile?.length || 0 },
    log: (state?.log || []).slice(-7),
    hand,
    selected,
    selectedAction,
    canSwapPass,
    guide: selectedGuide(selectedAction, selected, game, state, active, canSwapPass)
  };
}
