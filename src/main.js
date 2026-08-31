(function (root) {
  const game = root.JQGame;
  let state = null;
  let runningLoop = false;
  let pending = { kind: null, runtimeId: null, targetPlayerId: null };

  function getCardInteraction(card) {
    if (!card) return 'none';
    if (card.type === 'location' || card.type === 'inspect') return 'immediate';
    if (card.type === 'travel') return 'boardTarget';
    if (card.type === 'tactic') return 'playerTarget';
    if (card.type === 'trump') return 'trumpExchange';
    return 'none';
  }

  function isResumableState(candidate) {
    return Boolean(
      candidate &&
      Array.isArray(candidate.players) && candidate.players.length === 3 &&
      Array.isArray(candidate.drawPile) &&
      Array.isArray(candidate.discardPile) &&
      candidate.treasureStock && candidate.openedLocations &&
      typeof candidate.currentPlayerIndex === 'number' &&
      typeof candidate.phase === 'string'
    );
  }

  function human() {
    return state?.players.find(p => p.id === 'human') || null;
  }

  function currentPlayer() {
    return state?.players[state.currentPlayerIndex] || null;
  }

  function resetPending() {
    pending = { kind: null, runtimeId: null, targetPlayerId: null };
    game.UI.setInteractionMode('idle');
  }

  function saveAndRender() {
    if (!state) return;
    game.saveGame(state);
    game.UI.render(state);
  }

  async function afterHumanAction(result) {
    if (!result?.ok) {
      game.UI.showToast(result?.message || '当前无法执行这个动作。');
      return false;
    }
    if (!state.winnerId) {
      const finished = game.completeSingleActionTurn(state);
      const mergedMessage = finished?.ok ? `${result.message} ${finished.message}` : result.message;
      resetPending();
      saveAndRender();
      game.UI.showToast(mergedMessage);
      await continueGameLoop();
      return true;
    }
    resetPending();
    saveAndRender();
    game.UI.showWinner(state);
    return true;
  }

  function cardById(runtimeId) {
    return human()?.hand.find(card => card.runtimeId === runtimeId) || null;
  }

  function legalActionForCard(runtimeId) {
    return game.getLegalActions(state, 'human').find(action => action.runtimeId === runtimeId) || null;
  }

  async function handleCardClick(runtimeId) {
    if (!state || state.winnerId || currentPlayer()?.id !== 'human' || state.phase !== 'action') return;
    const card = cardById(runtimeId);
    if (!card) return;

    if (pending.kind === 'pass') {
      const result = game.passTurnBySwappingCard(state, 'human', runtimeId);
      if (!result.ok) {
        game.UI.showToast(result.message);
        return;
      }
      resetPending();
      saveAndRender();
      game.UI.showToast(result.message);
      await continueGameLoop();
      return;
    }
    const legal = legalActionForCard(runtimeId);
    if (!legal) {
      game.UI.showToast('这张牌目前没有合法用法。');
      return;
    }

    const interaction = getCardInteraction(card);
    if (interaction === 'immediate') {
      if (card.type === 'location' && state.openedLocations[card.locationId]) {
        game.UI.showChoiceDialog({
          title: '重复地牌',
          message: `【${card.name}】已经永久留在地图。是否将这张重复地牌作为本回合唯一动作并弃置？`,
          choices: [{ label: '弃入弃牌堆', detail: '弃牌后自动补回1张并结束回合', onSelect: () => afterHumanAction(game.playLocationCard(state, 'human', runtimeId)) }],
          cancelText: '保留手牌'
        });
        return;
      }
      const result = card.type === 'location'
        ? game.playLocationCard(state, 'human', runtimeId)
        : game.playInspectCard(state, 'human', runtimeId);
      await afterHumanAction(result);
      return;
    }

    if (interaction === 'boardTarget') {
      pending = { kind: 'travel', runtimeId, targetPlayerId: null };
      game.UI.setInteractionMode('chooseMoveDestination', {
        selectedRuntimeId: runtimeId,
        legalBoardTargets: legal.destinations || [],
        hint: '请选择地图上发光的合法目的地。巡游1张只能移动1格，本回合只能做这1个动作。'
      });
      return;
    }

    if (interaction === 'playerTarget') {
      pending = { kind: 'tactic', runtimeId, targetPlayerId: null };
      game.UI.setInteractionMode('chooseTacticTarget', {
        selectedRuntimeId: runtimeId,
        legalPlayerTargets: legal.targets || [],
        hint: '请选择一名AI玩家。计策结算后会自动补牌并结束你的回合。'
      });
      return;
    }

    if (interaction === 'trumpExchange') {
      pending = { kind: 'trump', runtimeId, targetPlayerId: null };
      game.UI.setInteractionMode('chooseTrumpOpponent', {
        selectedRuntimeId: runtimeId,
        legalPlayerTargets: legal.targets || [],
        hint: '先选择要强制交换圣物的AI玩家。'
      });
    }
  }

  async function handleBoardTarget(destination) {
    if (pending.kind !== 'travel' || !pending.runtimeId) return;
    await afterHumanAction(game.playTravelCard(state, 'human', pending.runtimeId, destination));
  }

  function chooseTrumpOwnTreasure() {
    const actor = human();
    const choices = Object.values(game.TREASURES)
      .filter(t => actor.treasures[t.id] > 0)
      .map(t => ({
        label: `${t.shortName} ×${actor.treasures[t.id]}`,
        image: t.asset,
        detail: '作为交换筹码',
        onSelect: () => chooseTrumpTargetTreasure(t.id)
      }));
    game.UI.showChoiceDialog({
      title: '选择你的交换圣物',
      message: '选择1件你拥有的圣物，作为王牌交换筹码。',
      choices,
      onCancel: resetPending
    });
  }

  function chooseTrumpTargetTreasure(ownTreasureId) {
    const target = state.players.find(p => p.id === pending.targetPlayerId);
    const choices = Object.values(game.TREASURES)
      .filter(t => target && target.treasures[t.id] > 0)
      .map(t => ({
        label: `${t.shortName} ×${target.treasures[t.id]}`,
        image: t.asset,
        detail: `从${target.name}处换走`,
        onSelect: () => {
          const result = game.playTrumpCard(state, 'human', pending.runtimeId, pending.targetPlayerId, ownTreasureId, t.id);
          afterHumanAction(result);
        }
      }));
    game.UI.showChoiceDialog({
      title: '选择对手圣物',
      message: '选择要从对手处强制换走的1件圣物。',
      choices,
      onCancel: resetPending
    });
  }

  async function handlePlayerTarget(playerId) {
    if (pending.kind === 'tactic') {
      await afterHumanAction(game.playTacticCard(state, 'human', pending.runtimeId, playerId));
      return;
    }
    if (pending.kind === 'trump') {
      pending.targetPlayerId = playerId;
      game.UI.setInteractionMode('chooseTrumpOwnTreasure', {
        selectedRuntimeId: pending.runtimeId,
        hint: '已选择对手。接下来选择你要拿来交换的圣物。'
      });
      chooseTrumpOwnTreasure();
    }
  }

  async function handleEndAction() {
    if (!state || currentPlayer()?.id !== 'human' || state.phase !== 'action') return;
    pending = { kind: 'pass', runtimeId: null, targetPlayerId: null };
    game.UI.setInteractionMode('choosePassCard', {
      hint: '本回合不执行其他动作：请选择1张手牌换入弃牌堆。系统会自动补回1张，手牌仍保持3张，然后结束回合。'
    });
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function actionDelay(decision) {
    if (decision.type === 'trump' || decision.type === 'tactic') return 820;
    if (decision.type === 'inspect') return 720;
    return 600;
  }

  async function runAiCurrentTurn(playerId) {
    await game.runAiTurn(state, playerId, {
      afterAction: async (decision, liveState, result) => {
        saveAndRender();
        game.UI.showToast(result.message);
        await delay(actionDelay(decision));
      }
    });
    saveAndRender();
    if (state.winnerId) game.UI.showWinner(state);
  }

  async function continueGameLoop() {
    if (!state || runningLoop || state.winnerId) return;
    runningLoop = true;
    try {
      let guard = 0;
      while (state && !state.winnerId && guard < 30) {
        guard += 1;
        const player = currentPlayer();
        if (!player) break;

        if (state.phase === 'setup' || state.phase === 'turnStart') {
          const turn = game.beginTurn(state);
          saveAndRender();
          if (turn.skipped) {
            game.UI.showToast(turn.message);
            await delay(620);
            continue;
          }
        }

        if (state.winnerId) break;
        const active = currentPlayer();
        if (active.id === 'human') {
          game.UI.setInteractionMode('idle');
          break;
        }

        if (active.kind === 'ai' && state.phase === 'action') {
          await runAiCurrentTurn(active.id);
          if (state.winnerId) break;
          await delay(520);
          continue;
        }
        break;
      }
    } finally {
      runningLoop = false;
      if (state?.winnerId) game.UI.showWinner(state);
    }
  }

  function startNewGame() {
    game.clearSavedGame();
    state = game.createGameState();
    resetPending();
    saveAndRender();
    continueGameLoop();
  }

  function resumeGame() {
    const saved = game.loadGame();
    if (!isResumableState(saved)) {
      game.UI.showToast('存档无法读取，已开启新游戏。');
      startNewGame();
      return;
    }
    state = saved;
    resetPending();
    game.UI.render(state);
    if (state.winnerId) game.UI.showWinner(state);
    else continueGameLoop();
  }

  function manualSave() {
    const ok = state ? game.saveGame(state) : false;
    game.UI.showToast(ok ? '牌局已保存在本机浏览器。' : '当前环境无法写入本地存档。');
  }

  function bootstrap() {
    game.UI.mount(document.getElementById('app'), {
      onCardClick: handleCardClick,
      onBoardTarget: handleBoardTarget,
      onPlayerTarget: handlePlayerTarget,
      onEndAction: handleEndAction,
      onDiscard: null,
      onCancel: resetPending,
      onSave: manualSave,
      onNewGame: startNewGame,
      onResume: resumeGame
    });

    const saved = game.loadGame();
    if (isResumableState(saved)) {
      state = saved;
      game.UI.render(state);
      game.UI.showStartDialog(true);
    } else {
      startNewGame();
    }
  }

  game.APP = {
    getCardInteraction,
    isResumableState,
    startNewGame,
    resumeGame,
    continueGameLoop,
    getState: () => state
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  }
})(globalThis);
