const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function activePlayer(state) {
  return state?.players?.[state.currentPlayerIndex] || null;
}

export function createTurnController({
  adapter,
  session,
  onChange = () => {},
  delay = sleep,
  aiDelayMs = 520
}) {
  if (!adapter || !session) throw new Error('turn controller requires adapter and session');

  let busy = false;

  function snapshot() {
    return adapter.snapshot ? adapter.snapshot(session.state) : structuredClone(session.state);
  }

  async function emit(type, detail = {}) {
    await Promise.resolve(onChange({ type, ...detail, state: snapshot() }));
  }

  async function persist() {
    if (typeof session.save === 'function') await session.save();
  }

  async function settleToHuman() {
    let guard = 0;
    while (!session.state.winnerId && guard < 12) {
      guard += 1;
      let current = activePlayer(session.state);
      if (!current) break;

      if (session.state.phase !== 'action' && session.state.phase !== 'discard') {
        const result = adapter.beginTurn(session.state);
        await emit('turn-start', { playerId: current.id, result });
        if (result?.skipped) {
          await delay(Math.min(220, aiDelayMs));
          continue;
        }
      }

      current = activePlayer(session.state);
      if (!current) break;
      if (current.id === 'human') {
        busy = false;
        await emit('human-ready', { playerId: current.id });
        await persist();
        return;
      }

      if (current.kind !== 'ai') {
        busy = false;
        await emit('turn-ready', { playerId: current.id });
        return;
      }

      busy = true;
      await emit('ai-thinking', { playerId: current.id });
      await delay(aiDelayMs);
      const beforeAiState = snapshot();
      await adapter.runAiTurn(session.state, current.id, {
        afterAction: async (decision, state, result) => {
          await emit('ai-action', {
            playerId: current.id,
            decision,
            result,
            beforeState: beforeAiState
          });
          await delay(Math.max(120, Math.round(aiDelayMs * 0.55)));
        }
      });
      await emit('ai-finished', { playerId: current.id });
      await persist();
    }

    busy = false;
    if (session.state.winnerId) {
      await emit('winner', { winnerId: session.state.winnerId });
      await persist();
      return;
    }
    if (guard >= 12) throw new Error('回合推进超过安全上限');
  }

  function playHuman(input) {
    const args = [session.state, 'human', input.runtimeId];
    switch (input.type) {
      case 'location': return adapter.play.location(...args);
      case 'travel': return adapter.play.travel(...args, input.destination ?? input.target);
      case 'inspect': return adapter.play.inspect(...args);
      case 'tactic': return adapter.play.tactic(...args, input.targetPlayerId ?? input.target);
      case 'trump': return adapter.play.trump(
        ...args,
        input.targetPlayerId ?? input.target,
        input.ownTreasureId,
        input.targetTreasureId
      );
      case 'discard': return adapter.play.discard?.(...args) || { ok: false, message: '当前不能弃牌。' };
      case 'swapPass': return adapter.play.swapPass(...args);
      default: return { ok: false, message: '暂不支持这个动作。' };
    }
  }

  async function start() {
    if (busy) return;
    busy = true;
    await settleToHuman();
  }

  async function executeHuman(input) {
    if (busy) return { ok: false, message: '正在结算其他玩家的行动。' };
    const current = activePlayer(session.state);
    if (!current || current.id !== 'human' || session.state.phase !== 'action') {
      return { ok: false, message: '当前还不是你的行动阶段。' };
    }

    busy = true;
    const beforeState = snapshot();
    const result = playHuman(input);
    if (!result?.ok) {
      busy = false;
      await emit('human-error', { result });
      return result;
    }

    await emit('human-action', { action: input, result, beforeState });
    if (!session.state.winnerId) {
      if (input.type === 'swapPass') {
        // V43 swap-pass already advances the turn.
      } else if (input.type === 'discard' && session.state.phase === 'discard') {
        if (adapter.finishDiscard && !adapter.mustDiscard?.(session.state, 'human')) adapter.finishDiscard(session.state);
      } else {
        adapter.completeTurn(session.state);
      }
    }

    await persist();
    if (session.state.winnerId) {
      busy = false;
      await emit('winner', { winnerId: session.state.winnerId });
      return result;
    }

    await settleToHuman();
    return result;
  }

  return Object.freeze({
    start,
    executeHuman,
    get busy() { return busy; }
  });
}
