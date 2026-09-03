function playerById(state, playerId) {
  return state?.players?.find(player => player.id === playerId) || null;
}

function cardBefore(event, action) {
  const player = playerById(event.beforeState, event.playerId);
  return player?.hand?.find(card => card.runtimeId === action?.runtimeId) || null;
}

function revealForAi(event, action, card) {
  if (event.type !== 'ai-action' || !card) return null;
  return {
    kind: 'card-reveal',
    playerId: event.playerId,
    cardName: card.name,
    cardKey: card.key || '',
    cardType: card.type || '',
    locationId: card.locationId || ''
  };
}

function drawCardEffect(playerId, card) {
  return {
    kind: 'draw-card',
    playerId,
    cardName: card?.name || '新手牌',
    cardKey: card?.key || '',
    cardType: card?.type || '',
    locationId: card?.locationId || ''
  };
}

function drawSequence(event) {
  const cards = event?.result?.cards || [];
  if (!cards.length) return [];
  if (event.playerId !== 'human') {
    return [{ kind: 'draw-hidden', playerId: event.playerId, count: cards.length }];
  }
  return cards.map(card => drawCardEffect(event.playerId, card));
}

export function buildPresentationSequence(event) {
  if (!event) return [];

  if (event.type === 'winner') {
    const winnerId = event.winnerId || event.state?.winnerId;
    const winner = playerById(event.state, winnerId);
    if (!winnerId) return [];
    return [{
      kind: winnerId === 'human' ? 'victory' : 'defeat',
      winnerId,
      winnerName: winner?.name || (winnerId === 'human' ? '玩家（你）' : 'AI玩家')
    }];
  }

  if (event.type === 'turn-start' || event.type === 'human-refill' || event.type === 'ai-refill') {
    return drawSequence(event);
  }

  if (!event.result?.ok) return [];
  if (event.type !== 'human-action' && event.type !== 'ai-action') return [];

  const action = event.action || event.decision || {};
  const card = cardBefore(event, action);
  const cardName = card?.name || event.result?.discarded?.name || '手牌';
  const sequence = [];
  const reveal = revealForAi(event, action, card);
  if (reveal) sequence.push(reveal);

  if (action.type === 'travel') {
    const beforePlayer = playerById(event.beforeState, event.playerId);
    const afterPlayer = playerById(event.state, event.playerId);
    sequence.push({
      kind: 'move',
      playerId: event.playerId,
      from: beforePlayer?.position || 'center',
      to: event.result.destination || action.destination || afterPlayer?.position || 'center',
      cardName
    });
    return sequence;
  }

  if (action.type === 'location') {
    sequence.push({
      kind: 'location-open',
      playerId: event.playerId,
      locationId: event.result.locationId || card?.locationId || '',
      cardName
    });
    return sequence;
  }

  if (action.type === 'inspect' && event.result.gained) {
    const beforePlayer = playerById(event.beforeState, event.playerId);
    sequence.push({
      kind: 'treasure',
      playerId: event.playerId,
      treasureId: event.result.treasureId,
      locationId: beforePlayer?.position || 'center',
      cardName
    });
    return sequence;
  }

  if (action.type === 'tactic') {
    const targetPlayerId = event.result.targetPlayerId || action.targetPlayerId || action.target;
    if (event.result.effect === 'swapPosition') {
      const beforePlayer = playerById(event.beforeState, event.playerId);
      const beforeTarget = playerById(event.beforeState, targetPlayerId);
      const afterPlayer = playerById(event.state, event.playerId);
      const afterTarget = playerById(event.state, targetPlayerId);
      sequence.push({
        kind: 'swap',
        playerId: event.playerId,
        targetPlayerId,
        from: beforePlayer?.position || 'center',
        to: afterPlayer?.position || beforeTarget?.position || 'center',
        targetFrom: beforeTarget?.position || 'center',
        targetTo: afterTarget?.position || beforePlayer?.position || 'center',
        cardName
      });
    } else if (event.result.effect === 'burnHand') {
      const burned = event.result.burnedCard || {};
      sequence.push({
        kind: 'burn',
        playerId: event.playerId,
        targetPlayerId,
        burnedCardName: burned.name || '未知手牌',
        burnedCardKey: burned.key || '',
        burnedCardType: burned.type || '',
        burnedLocationId: burned.locationId || '',
        cardName
      });
    } else if (event.result.effect === 'skipTurn') {
      sequence.push({
        kind: 'lock',
        playerId: event.playerId,
        targetPlayerId,
        cardName
      });
    }
    return sequence;
  }

  if (action.type === 'trump') {
    sequence.push({
      kind: 'treasure-swap',
      playerId: event.playerId,
      targetPlayerId: event.result.targetPlayerId || action.targetPlayerId || action.target,
      ownTreasureId: event.result.ownTreasureId || action.ownTreasureId,
      targetTreasureId: event.result.targetTreasureId || action.targetTreasureId,
      cardName
    });
    return sequence;
  }

  if (action.type === 'discard' || action.type === 'pass' || action.type === 'swapPass') {
    const discarded = card || event.result?.discarded || {};
    sequence.push({
      kind: 'discard',
      playerId: event.playerId,
      cardName,
      cardKey: discarded.key || '',
      cardType: discarded.type || '',
      locationId: discarded.locationId || ''
    });
    if (event.playerId === 'human' && event.result?.cards?.length) {
      sequence.push(...event.result.cards.map(nextCard => drawCardEffect('human', nextCard)));
    }
  }

  return sequence;
}
