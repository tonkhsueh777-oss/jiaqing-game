(function (root) {
  const game = root.JQGame;

  const ADJACENCY = {
    center: ['tainan', 'mengxia', 'zhuluo', 'madou'],
    tainan: ['center'],
    mengxia: ['center'],
    zhuluo: ['center'],
    madou: ['center']
  };

  function findPlayer(state, playerId) {
    return state.players.find(player => player.id === playerId) || null;
  }

  function findCard(player, runtimeId) {
    return player ? player.hand.find(card => card.runtimeId === runtimeId) || null : null;
  }

  function takeCard(player, runtimeId) {
    const index = player.hand.findIndex(card => card.runtimeId === runtimeId);
    if (index < 0) return null;
    return player.hand.splice(index, 1)[0];
  }

  function canAct(state, playerId) {
    if (state.winnerId) return false;
    const current = state.players[state.currentPlayerIndex];
    return state.phase === 'action' && current && current.id === playerId;
  }

  game._findPlayer = findPlayer;
  game.ADJACENCY = ADJACENCY;

  game.countTreasureKinds = function countTreasureKinds(player) {
    return Object.values(player.treasures).filter(value => value > 0).length;
  };

  game.checkWinner = function checkWinner(state) {
    const winner = state.players.find(player => game.countTreasureKinds(player) >= 4) || null;
    state.winnerId = winner ? winner.id : null;
    return state.winnerId;
  };

  game.mustDiscard = function mustDiscard(state, playerId) {
    const player = findPlayer(state, playerId);
    return Boolean(player && player.hand.length > 3);
  };

  game.discardCard = function discardCard(state, playerId, runtimeId) {
    const player = findPlayer(state, playerId);
    const card = findCard(player, runtimeId);
    if (!player || !card) return { ok: false, message: '找不到这张牌。' };

    const duplicateLocation = card.type === 'location' && Boolean(state.openedLocations[card.locationId]);
    const legalByPhase = state.phase === 'discard' || (state.phase === 'action' && duplicateLocation);
    if (!legalByPhase) return { ok: false, message: '当前不能弃置这张牌。' };

    const removed = takeCard(player, runtimeId);
    state.discardPile.push(removed);
    const message = duplicateLocation ? `重复地牌【${removed.name}】作为废牌弃置。` : `【${removed.name}】进入弃牌堆。`;
    state.log.push(`${player.name}：${message}`);
    player.lastAction = message;
    return { ok: true, message };
  };

  game.playLocationCard = function playLocationCard(state, playerId, runtimeId) {
    if (!canAct(state, playerId)) return { ok: false, message: '当前不是你的行动阶段。' };
    const player = findPlayer(state, playerId);
    const card = findCard(player, runtimeId);
    if (!card || card.type !== 'location') return { ok: false, message: '这不是地牌。' };

    if (state.openedLocations[card.locationId]) {
      return game.discardCard(state, playerId, runtimeId);
    }

    const removed = takeCard(player, runtimeId);
    state.openedLocations[removed.locationId] = true;
    state.locationCards[removed.locationId] = removed;
    const message = `开放地点【${removed.name}】，该地牌永久留在地图。`;
    state.log.push(`${player.name}：${message}`);
    player.lastAction = message;
    return { ok: true, message, locationId: removed.locationId };
  };

  game.playTravelCard = function playTravelCard(state, playerId, runtimeId, destination) {
    if (!canAct(state, playerId)) return { ok: false, message: '当前不是你的行动阶段。' };
    const player = findPlayer(state, playerId);
    const card = findCard(player, runtimeId);
    if (!card || card.type !== 'travel') return { ok: false, message: '这不是巡游牌。' };
    if (!ADJACENCY[player.position] || !ADJACENCY[player.position].includes(destination)) {
      return { ok: false, message: '巡游每次只能沿连线移动1格。' };
    }
    if (destination !== 'center' && !state.openedLocations[destination]) {
      return { ok: false, message: '目标地点尚未出现地牌，不能进入。' };
    }

    const removed = takeCard(player, runtimeId);
    state.discardPile.push(removed);
    player.position = destination;
    const destinationName = destination === 'center' ? '中央起点' : game.LOCATIONS[destination].name;
    const message = `打出【巡游】，移动至${destinationName}。`;
    state.log.push(`${player.name}：${message}`);
    player.lastAction = message;
    return { ok: true, message, destination };
  };

  game.playInspectCard = function playInspectCard(state, playerId, runtimeId) {
    if (!canAct(state, playerId)) return { ok: false, message: '当前不是你的行动阶段。' };
    const player = findPlayer(state, playerId);
    const card = findCard(player, runtimeId);
    if (!card || card.type !== 'inspect') return { ok: false, message: '这不是明察牌。' };
    if (player.position === 'center') return { ok: false, message: '中央起点不能明察。' };
    if (!state.openedLocations[player.position]) return { ok: false, message: '当前位置没有有效地牌，不能明察。' };

    const location = game.LOCATIONS[player.position];
    const treasureId = location.treasure;
    const removed = takeCard(player, runtimeId);
    state.discardPile.push(removed);

    if (state.treasureStock[treasureId] <= 0) {
      const message = '该地点对应圣物已被取完。';
      state.log.push(`${player.name}：${message}`);
      player.lastAction = message;
      return { ok: true, message, treasureId, gained: false };
    }

    state.treasureStock[treasureId] -= 1;
    player.treasures[treasureId] += 1;
    const message = `明察成功，取得【${game.TREASURES[treasureId].name}】。`;
    state.log.push(`${player.name}：${message}`);
    player.lastAction = message;
    game.checkWinner(state);
    return { ok: true, message, treasureId, gained: true };
  };

  game.playTacticCard = function playTacticCard(state, playerId, runtimeId, targetPlayerId, rng = Math.random) {
    if (!canAct(state, playerId)) return { ok: false, message: '当前不是你的行动阶段。' };
    if (playerId === targetPlayerId) return { ok: false, message: '计策牌不能指定自己。' };
    const player = findPlayer(state, playerId);
    const target = findPlayer(state, targetPlayerId);
    const card = findCard(player, runtimeId);
    if (!target) return { ok: false, message: '找不到目标玩家。' };
    if (!card || card.type !== 'tactic') return { ok: false, message: '这不是计策牌。' };
    if (card.key === 'fire' && target.hand.length <= 0) return { ok: false, message: '目标玩家目前没有手牌可以烧掉。' };

    const removed = takeCard(player, runtimeId);
    state.discardPile.push(removed);

    if (removed.key === 'fire') {
      const index = Math.min(target.hand.length - 1, Math.max(0, Math.floor(rng() * target.hand.length)));
      const burnedCard = target.hand.splice(index, 1)[0];
      state.discardPile.push(burnedCard);
      const message = `发动【${removed.name}】，随机烧掉${target.name}的1张手牌【${burnedCard.name}】。`;
      state.log.push(`${player.name}：${message}`);
      player.lastAction = message;
      target.lastAction = `被${player.name}发动【${removed.name}】，失去1张手牌；下回合再正常补牌。`;
      return { ok: true, message, targetPlayerId, effect: 'burnHand', burnedCard };
    }

    if (removed.key === 'flower') {
      const playerPosition = player.position;
      player.position = target.position;
      target.position = playerPosition;
      const message = `发动【${removed.name}】，与${target.name}交换当前位置。`;
      state.log.push(`${player.name}：${message}`);
      player.lastAction = message;
      target.lastAction = `被${player.name}发动【${removed.name}】，双方位置已交换。`;
      return { ok: true, message, targetPlayerId, effect: 'swapPosition', playerPosition: player.position, targetPosition: target.position };
    }

    target.skipTurns = (target.skipTurns || 0) + 1;
    target.skipSource = removed.name;
    const message = `发动【${removed.name}】，${target.name}下一个完整回合将被跳过。`;
    state.log.push(`${player.name}：${message}`);
    player.lastAction = message;
    target.lastAction = `被${player.name}发动【${removed.name}】，待跳过${target.skipTurns}回合。`;
    return { ok: true, message, targetPlayerId, effect: 'skipTurn' };
  };

  game.playTrumpCard = function playTrumpCard(state, playerId, runtimeId, targetPlayerId, ownTreasureId, targetTreasureId) {
    if (!canAct(state, playerId)) return { ok: false, message: '当前不是你的行动阶段。' };
    if (playerId === targetPlayerId) return { ok: false, message: '王牌不能指定自己。' };

    const player = findPlayer(state, playerId);
    const target = findPlayer(state, targetPlayerId);
    const card = findCard(player, runtimeId);
    if (!player || !target) return { ok: false, message: '找不到交换目标。' };
    if (!card || card.type !== 'trump') return { ok: false, message: '这不是王牌。' };
    if (!game.TREASURES[ownTreasureId] || !game.TREASURES[targetTreasureId]) return { ok: false, message: '无效的圣物类型。' };
    if ((player.treasures[ownTreasureId] || 0) <= 0) return { ok: false, message: '你没有可作为交换筹码的圣物。' };
    if ((target.treasures[targetTreasureId] || 0) <= 0) return { ok: false, message: '目标玩家没有该圣物。' };

    const removed = takeCard(player, runtimeId);
    state.discardPile.push(removed);
    player.treasures[ownTreasureId] -= 1;
    target.treasures[ownTreasureId] += 1;
    target.treasures[targetTreasureId] -= 1;
    player.treasures[targetTreasureId] += 1;

    const message = `发动【${removed.name}】，以【${game.TREASURES[ownTreasureId].name}】强制交换${target.name}的【${game.TREASURES[targetTreasureId].name}】。`;
    state.log.push(`${player.name}：${message}`);
    player.lastAction = message;
    target.lastAction = `被${player.name}发动王牌交换圣物。`;
    game.checkWinner(state);
    return { ok: true, message, targetPlayerId, ownTreasureId, targetTreasureId };
  };

  game.advancePlayer = function advancePlayer(state) {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    state.turnNumber += 1;
    state.phase = 'turnStart';
  };

  game.beginTurn = function beginTurn(state, rng = Math.random) {
    if (state.winnerId) return { ok: false, skipped: false, message: '游戏已经结束。' };
    const player = state.players[state.currentPlayerIndex];
    if (!player) return { ok: false, skipped: false, message: '当前玩家不存在。' };

    if (player.skipTurns > 0) {
      player.skipTurns -= 1;
      const source = player.skipSource ? `【${player.skipSource}】` : '计策';
      const message = `${player.name}受${source}影响，本回合无法行动。`;
      if (player.skipTurns <= 0) player.skipSource = '';
      state.log.push(message);
      player.lastAction = message;
      game.advancePlayer(state);
      return { ok: true, skipped: true, message };
    }

    state.phase = 'action';
    const { cards } = game.refillHandToLimit(state, player.id, 3, rng);
    const message = cards.length > 0
      ? `${player.name}补牌${cards.length}张，手牌恢复至${player.hand.length}张，进入行动阶段。`
      : `${player.name}进入行动阶段。`;
    state.log.push(message);
    player.lastAction = message;
    return { ok: true, skipped: false, cards, message };
  };

  game.completeSingleActionTurn = function completeSingleActionTurn(state, rng = Math.random) {
    if (state.winnerId) return { ok: false, message: '游戏已经结束。' };
    const player = state.players[state.currentPlayerIndex];
    if (!player || state.phase !== 'action') return { ok: false, message: '当前不在行动阶段。' };

    const { cards } = game.refillHandToLimit(state, player.id, 3, rng);
    const message = cards.length > 0
      ? `${player.name}补牌${cards.length}张，手牌保持${player.hand.length}张，回合结束。`
      : `${player.name}回合结束。`;
    state.log.push(message);
    player.lastAction = `${player.lastAction} ${message}`.trim();
    game.advancePlayer(state);
    return { ok: true, cards, message };
  };

  game.passTurnBySwappingCard = function passTurnBySwappingCard(state, playerId, runtimeId, rng = Math.random) {
    if (!canAct(state, playerId)) return { ok: false, message: '当前不是你的行动阶段。' };
    const player = findPlayer(state, playerId);
    const card = findCard(player, runtimeId);
    if (!player || !card) return { ok: false, message: '请选择1张手牌进行换牌。' };

    const removed = takeCard(player, runtimeId);
    state.discardPile.push(removed);
    const { cards } = game.refillHandToLimit(state, playerId, 3, rng);
    const drawMessage = cards.length ? `并补入${cards.length}张新牌` : '，但牌堆暂时无法补牌';
    const message = `${player.name}将【${removed.name}】换入弃牌堆${drawMessage}，结束回合。`;
    state.log.push(message);
    player.lastAction = message;
    game.advancePlayer(state);
    return { ok: true, message, discarded: removed, cards };
  };

  game.endActionPhase = function endActionPhase(state) {
    if (state.winnerId) return { ok: false, needsDiscard: false, message: '游戏已经结束。' };
    const player = state.players[state.currentPlayerIndex];
    if (!player || state.phase !== 'action') return { ok: false, needsDiscard: false, message: '当前不在行动阶段。' };

    const message = `${player.name}本回合未出牌，直接结束回合。`;
    state.log.push(message);
    player.lastAction = message;
    game.advancePlayer(state);
    return { ok: true, needsDiscard: false, message };
  };

  game.finishDiscardPhase = function finishDiscardPhase(state) {
    const player = state.players[state.currentPlayerIndex];
    if (!player || state.phase !== 'discard') return { ok: false, message: '当前不在弃牌阶段。' };
    if (player.hand.length > 3) return { ok: false, message: '手牌仍超过3张，请继续弃牌。' };

    const message = `${player.name}完成弃牌，结束回合。`;
    state.log.push(message);
    game.advancePlayer(state);
    return { ok: true, message };
  };

  game.getCardUnavailableReason = function getCardUnavailableReason(state, playerId, card) {
    const player = findPlayer(state, playerId);
    if (!player || !card) return '找不到这张牌。';
    if (!canAct(state, playerId)) return '当前还不是你的行动阶段。';
    if (card.type === 'trump') {
      if (!Object.values(player.treasures).some(v => v > 0)) return `${card.name}现在不能发动：你目前没有可以拿来交换的宝物。`;
      const targetHasTreasure = state.players.some(p => p.id !== playerId && Object.values(p.treasures).some(v => v > 0));
      if (!targetHasTreasure) return `${card.name}现在不能发动：其他玩家目前都没有可以交换的宝物。`;
    }
    if (card.type === 'tactic' && card.key === 'fire') {
      const hasTargetHand = state.players.some(p => p.id !== playerId && p.hand.length > 0);
      if (!hasTargetHand) return `${card.name}现在不能发动：其他玩家目前都没有手牌可以烧掉。`;
    }
    return '这张牌目前没有可执行的目标或条件。';
  };

  game.getLegalActions = function getLegalActions(state, playerId) {
    const player = findPlayer(state, playerId);
    if (!player || state.winnerId) return [];

    if (state.phase === 'discard') {
      return player.hand.map(card => ({ type: 'discard', runtimeId: card.runtimeId }));
    }
    if (!canAct(state, playerId)) return [];

    const actions = [];
    for (const card of player.hand) {
      if (card.type === 'location') {
        actions.push({ type: 'location', runtimeId: card.runtimeId, duplicate: Boolean(state.openedLocations[card.locationId]), locationId: card.locationId });
      } else if (card.type === 'travel') {
        const destinations = (ADJACENCY[player.position] || []).filter(destination => destination === 'center' || state.openedLocations[destination]);
        if (destinations.length) actions.push({ type: 'travel', runtimeId: card.runtimeId, destinations });
      } else if (card.type === 'inspect') {
        if (player.position !== 'center' && state.openedLocations[player.position]) {
          actions.push({ type: 'inspect', runtimeId: card.runtimeId, locationId: player.position });
        }
      } else if (card.type === 'tactic') {
        const targets = state.players
          .filter(p => p.id !== playerId && (card.key !== 'fire' || p.hand.length > 0))
          .map(p => p.id);
        if (targets.length) actions.push({ type: 'tactic', runtimeId: card.runtimeId, targets, tacticKey: card.key });
      } else if (card.type === 'trump') {
        const targets = state.players.filter(p => p.id !== playerId && Object.values(p.treasures).some(v => v > 0)).map(p => p.id);
        if (Object.values(player.treasures).some(v => v > 0) && targets.length) {
          actions.push({ type: 'trump', runtimeId: card.runtimeId, targets });
        }
      }
    }
    actions.push({ type: 'end' });
    return actions;
  };
})(globalThis);
