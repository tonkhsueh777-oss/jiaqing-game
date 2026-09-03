(function (root) {
  const game = root.JQGame;

  const SCORE = {
    immediateWin: 10000,
    trumpForWin: 9200,
    inspectMissing: 4200,
    tacticLeader: 3400,
    trumpForMissing: 3300,
    openUsefulLocation: 3100,
    travelTowardMissing: 2800,
    inspectDuplicate: 2600,
    travelForResource: 2400,
    openResourceLocation: 2200,
    duplicateLocationDiscard: 1000,
    end: 0
  };

  function findPlayer(state, id) {
    return state.players.find(p => p.id === id) || null;
  }

  function missingTreasureIds(player) {
    return Object.keys(game.TREASURES).filter(id => (player.treasures[id] || 0) <= 0);
  }

  function visibleProjection(state, playerId) {
    const self = findPlayer(state, playerId);
    return {
      playerId,
      ownHand: self ? self.hand.map(card => ({ ...card })) : [],
      players: state.players.map(player => ({
        id: player.id,
        position: player.position,
        treasures: { ...player.treasures },
        skipTurns: player.skipTurns,
        handCount: player.hand.length
      })),
      openedLocations: { ...state.openedLocations },
      treasureStock: { ...state.treasureStock },
      phase: state.phase,
      currentPlayerIndex: state.currentPlayerIndex,
      winnerId: state.winnerId
    };
  }

  game.projectVisibleStateForAi = visibleProjection;

  function personalityOffset(playerId, type) {
    if (playerId === 'ai1' && type === 'travel') return 20;
    if (playerId === 'ai2' && type === 'tactic') return 20;
    return 0;
  }

  function candidate(score, decision, playerId) {
    return { score: score + personalityOffset(playerId, decision.type), decision };
  }

  function compareCandidates(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    const aKey = JSON.stringify(a.decision);
    const bKey = JSON.stringify(b.decision);
    return aKey.localeCompare(bKey, 'zh-CN');
  }

  function bestTrumpTrade(view, self, trumpCard, requireWin) {
    const missing = missingTreasureIds(self);
    const ownSacrifices = Object.keys(self.treasures).filter(id => self.treasures[id] >= 2);
    if (!ownSacrifices.length || !missing.length) return null;

    const opponents = view.players.filter(p => p.id !== self.id);
    for (const targetTreasureId of missing) {
      for (const target of opponents) {
        if ((target.treasures[targetTreasureId] || 0) <= 0) continue;
        for (const ownTreasureId of ownSacrifices) {
          const after = { ...self.treasures };
          after[ownTreasureId] -= 1;
          after[targetTreasureId] += 1;
          const kinds = Object.values(after).filter(v => v > 0).length;
          if (requireWin && kinds < 4) continue;
          return {
            type: 'trump',
            runtimeId: trumpCard.runtimeId,
            targetPlayerId: target.id,
            ownTreasureId,
            targetTreasureId
          };
        }
      }
    }
    return null;
  }

  function chooseTravelTarget(view, self) {
    const missing = new Set(missingTreasureIds(self));
    const desiredLocations = Object.values(game.LOCATIONS).filter(loc =>
      view.openedLocations[loc.id] && view.treasureStock[loc.treasure] > 0 && missing.has(loc.treasure)
    );

    if (self.position === 'center') {
      return desiredLocations[0]?.id || null;
    }

    if (desiredLocations.some(loc => loc.id === self.position)) return null;
    if (desiredLocations.length) return 'center';
    return null;
  }

  game.chooseAiAction = function chooseAiAction(state, playerId) {
    const selfState = findPlayer(state, playerId);
    if (!selfState || selfState.kind !== 'ai' || state.phase !== 'action') return { type: 'end' };
    const current = state.players[state.currentPlayerIndex];
    if (!current || current.id !== playerId) return { type: 'end' };

    const view = visibleProjection(state, playerId);
    const self = view.players.find(p => p.id === playerId);
    const ownHand = view.ownHand;
    const missing = new Set(missingTreasureIds(self));
    const candidates = [candidate(SCORE.end, { type: 'end' }, playerId)];

    const inspectCards = ownHand.filter(card => card.type === 'inspect');
    if (self.position !== 'center' && view.openedLocations[self.position]) {
      const loc = game.LOCATIONS[self.position];
      const stock = view.treasureStock[loc.treasure] || 0;
      if (stock > 0 && inspectCards.length) {
        const wouldWin = missing.has(loc.treasure) && game.countTreasureKinds(self) === 3;
        const score = wouldWin ? SCORE.immediateWin : (missing.has(loc.treasure) ? SCORE.inspectMissing : SCORE.inspectDuplicate);
        candidates.push(candidate(score, { type: 'inspect', runtimeId: inspectCards[0].runtimeId }, playerId));
      }
    }

    const trumpCards = ownHand.filter(card => card.type === 'trump');
    for (const trumpCard of trumpCards) {
      const winningTrade = bestTrumpTrade(view, self, trumpCard, true);
      if (winningTrade) candidates.push(candidate(SCORE.trumpForWin, winningTrade, playerId));
    }

    const travelCards = ownHand.filter(card => card.type === 'travel');
    if (travelCards.length) {
      const destination = chooseTravelTarget(view, self);
      if (destination) {
        candidates.push(candidate(SCORE.travelTowardMissing, {
          type: 'travel', runtimeId: travelCards[0].runtimeId, destination
        }, playerId));
      } else {
        const legalDestinations = (game.ADJACENCY[self.position] || []).filter(dest => dest === 'center' || view.openedLocations[dest]);
        const resourceDest = legalDestinations.find(dest => dest !== 'center' && view.treasureStock[game.LOCATIONS[dest].treasure] > 0);
        if (resourceDest) candidates.push(candidate(SCORE.travelForResource, { type: 'travel', runtimeId: travelCards[0].runtimeId, destination: resourceDest }, playerId));
      }
    }

    for (const card of ownHand.filter(card => card.type === 'location')) {
      if (view.openedLocations[card.locationId]) {
        candidates.push(candidate(SCORE.duplicateLocationDiscard, { type: 'discard', runtimeId: card.runtimeId }, playerId));
      } else {
        const loc = game.LOCATIONS[card.locationId];
        const useful = missing.has(loc.treasure) && view.treasureStock[loc.treasure] > 0;
        candidates.push(candidate(useful ? SCORE.openUsefulLocation : SCORE.openResourceLocation, {
          type: 'location', runtimeId: card.runtimeId
        }, playerId));
      }
    }

    const opponentsByThreat = view.players
      .filter(p => p.id !== playerId)
      .map(p => ({ ...p, kinds: game.countTreasureKinds(p) }))
      .sort((a, b) => b.kinds - a.kinds || b.handCount - a.handCount || a.id.localeCompare(b.id));
    const leaders = opponentsByThreat.filter(p => p.kinds >= 3);
    const tacticCards = ownHand.filter(card => card.type === 'tactic');
    for (const tacticCard of tacticCards) {
      if (tacticCard.key === 'bully' && leaders.length) {
        candidates.push(candidate(SCORE.tacticLeader, {
          type: 'tactic', runtimeId: tacticCard.runtimeId, targetPlayerId: leaders[0].id
        }, playerId));
      } else if (tacticCard.key === 'fire') {
        const target = opponentsByThreat.find(p => p.handCount > 0);
        if (target) candidates.push(candidate(SCORE.tacticLeader - 80, {
          type: 'tactic', runtimeId: tacticCard.runtimeId, targetPlayerId: target.id
        }, playerId));
      } else if (tacticCard.key === 'flower') {
        const target = opponentsByThreat.find(p => {
          if (p.position === 'center' || p.position === self.position) return false;
          const loc = game.LOCATIONS[p.position];
          return loc && missing.has(loc.treasure) && view.treasureStock[loc.treasure] > 0;
        });
        if (target) candidates.push(candidate(SCORE.tacticLeader - 30, {
          type: 'tactic', runtimeId: tacticCard.runtimeId, targetPlayerId: target.id
        }, playerId));
      }
    }

    for (const trumpCard of trumpCards) {
      const valueTrade = bestTrumpTrade(view, self, trumpCard, false);
      if (valueTrade) candidates.push(candidate(SCORE.trumpForMissing, valueTrade, playerId));
    }

    candidates.sort(compareCandidates);
    return candidates[0].decision;
  };

  function executeDecision(state, playerId, decision) {
    switch (decision.type) {
      case 'inspect': return game.playInspectCard(state, playerId, decision.runtimeId);
      case 'travel': return game.playTravelCard(state, playerId, decision.runtimeId, decision.destination);
      case 'location': return game.playLocationCard(state, playerId, decision.runtimeId);
      case 'tactic': return game.playTacticCard(state, playerId, decision.runtimeId, decision.targetPlayerId);
      case 'trump': return game.playTrumpCard(state, playerId, decision.runtimeId, decision.targetPlayerId, decision.ownTreasureId, decision.targetTreasureId);
      case 'discard': return game.discardCard(state, playerId, decision.runtimeId);
      default: return { ok: false, message: '结束行动。' };
    }
  }

  function discardValue(card, state, player) {
    if (card.type === 'trump') return 100;
    if (card.type === 'tactic') return 85;
    if (card.type === 'inspect') {
      if (player.position !== 'center') {
        const loc = game.LOCATIONS[player.position];
        if (loc && state.openedLocations[player.position] && state.treasureStock[loc.treasure] > 0) return 80;
      }
      return 35;
    }
    if (card.type === 'travel') return 55;
    if (card.type === 'location') return state.openedLocations[card.locationId] ? 5 : 65;
    return 20;
  }

  function choosePassCard(state, player) {
    return player.hand.slice().sort((a, b) => discardValue(a, state, player) - discardValue(b, state, player))[0] || null;
  }

  game.runAiTurn = async function runAiTurn(state, playerId, hooks = {}) {
    const player = findPlayer(state, playerId);
    if (!player || player.kind !== 'ai') return;

    if (state.phase !== 'action' || state.players[state.currentPlayerIndex]?.id !== playerId) return;

    const decision = game.chooseAiAction(state, playerId);
    if (!decision || decision.type === 'end') {
      const passCard = choosePassCard(state, player);
      if (passCard) {
        const result = game.passTurnBySwappingCard(state, playerId, passCard.runtimeId);
        if (hooks.afterAction) await hooks.afterAction({ type: 'pass', runtimeId: passCard.runtimeId }, state, result);
      } else {
        game.endActionPhase(state);
      }
      return;
    }

    const result = executeDecision(state, playerId, decision);
    if (hooks.afterAction) await hooks.afterAction(decision, state, result);
    if (!result.ok || state.winnerId) return;

    game.completeSingleActionTurn(state);
  };
})(globalThis);
