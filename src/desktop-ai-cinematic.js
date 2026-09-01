(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.JQGame = root.JQGame || {};
    root.JQGame.DesktopAiCinematic = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  let installed = false;
  let previousLogLength = 0;
  let clearTimer = 0;

  function activeAiId(state) {
    const player = state?.players?.[state.currentPlayerIndex];
    return player?.kind === 'ai' ? player.id : null;
  }

  function classifyNewLogs(state, previousLength, logic) {
    const logs = Array.isArray(state?.log) ? state.log : [];
    if (logs.length < previousLength) return [];
    return logs.slice(previousLength)
      .map(line => logic?.classifyLog?.(line))
      .filter(Boolean);
  }

  function clearAiClasses(doc) {
    doc?.querySelectorAll?.('[data-player-id]')?.forEach?.(node => {
      node.classList.remove('desktop-ai-active');
      Array.from(node.classList)
        .filter(name => name.startsWith('desktop-ai-event--'))
        .forEach(name => node.classList.remove(name));
    });
  }

  function applyAiState(doc, state, kinds, root = globalThis) {
    clearAiClasses(doc);
    const aiId = activeAiId(state);
    if (!aiId) return;
    const nodes = doc?.querySelectorAll?.(`[data-player-id="${aiId}"]`) || [];
    const lastKind = kinds.at?.(-1) || kinds[kinds.length - 1] || null;
    nodes.forEach?.(node => {
      node.classList.add('desktop-ai-active');
      if (lastKind) node.classList.add(`desktop-ai-event--${lastKind}`);
    });
    if (clearTimer) root.clearTimeout?.(clearTimer);
    if (lastKind) {
      clearTimer = root.setTimeout?.(() => {
        nodes.forEach?.(node => node.classList.remove(`desktop-ai-event--${lastKind}`));
      }, 520) || 0;
    }
  }

  function install(ui, logic, doc = globalThis.document, root = globalThis) {
    if (installed || !ui || typeof ui.render !== 'function' || !doc?.body?.classList?.contains('desktop-mode')) return false;
    const baseRender = ui.render.bind(ui);
    ui.render = function renderWithDesktopAi(state) {
      const kinds = classifyNewLogs(state, previousLogLength, logic);
      baseRender(state);
      applyAiState(doc, state, kinds, root);
      previousLogLength = Array.isArray(state?.log) ? state.log.length : 0;
    };
    installed = true;
    return true;
  }

  return { activeAiId, classifyNewLogs, applyAiState, install };
});
