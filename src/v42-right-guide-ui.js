(function (root) {
  const game = root.JQGame;
  const logic = game?.V42RightGuideLogic;
  if (!game?.UI || !logic || typeof document === 'undefined') return;

  const baseRender = game.UI.render.bind(game.UI);
  const baseSetInteractionMode = game.UI.setInteractionMode.bind(game.UI);
  let lastState = null;
  let lastMode = 'idle';

  const escapeHtml = value => String(value ?? '').replace(/[&<>'\"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[ch]));

  function beginnerEnabled() {
    return !document.documentElement.classList.contains('beginner-assist-off');
  }

  function isHumanTurn(state) {
    const current = state?.players?.[state.currentPlayerIndex];
    return Boolean(current?.id === 'human' && state?.phase === 'action' && !state?.winnerId);
  }

  function playableNames(state) {
    const human = state?.players?.find?.(player => player.id === 'human');
    if (!human || typeof game.getLegalActions !== 'function') return [];

    const runtimeIds = new Set(
      game.getLegalActions(state, 'human')
        .filter(action => action?.type !== 'end' && action?.runtimeId)
        .map(action => action.runtimeId)
    );

    const names = [];
    const seen = new Set();
    human.hand.forEach(card => {
      if (!runtimeIds.has(card.runtimeId) || seen.has(card.name)) return;
      seen.add(card.name);
      names.push(card.name);
    });
    return names;
  }

  function clearGuide(target) {
    target?.querySelector('.v42-right-guide')?.remove();
  }

  function renderGuide(state) {
    const target = document.getElementById('action-guide');
    if (!target) return;
    clearGuide(target);

    if (!beginnerEnabled() || !isHumanTurn(state)) return;

    // Replace the older generic helper only inside the right-side Action Guide.
    target.querySelector('.beginner-extra-help')?.remove();

    const guide = logic.guideFor({
      humanTurn: true,
      mode: lastMode,
      playableNames: playableNames(state)
    });
    if (!guide) return;

    const node = document.createElement('div');
    node.className = `v42-right-guide v42-right-guide--${guide.kind}`;
    node.innerHTML = `
      <strong class="v42-right-guide__title">${escapeHtml(guide.title)}</strong>
      <span class="v42-right-guide__detail">${escapeHtml(guide.detail)}</span>
      <span class="v42-right-guide__next">${escapeHtml(guide.next)}</span>`;
    target.prepend(node);
  }

  game.UI.render = function renderV42RightGuide(state) {
    const result = baseRender(state);
    lastState = state;
    renderGuide(state);
    return result;
  };

  game.UI.setInteractionMode = function setInteractionModeV42RightGuide(mode, payload) {
    lastMode = mode || 'idle';
    const result = baseSetInteractionMode(mode, payload);
    renderGuide(lastState);
    return result;
  };
})(globalThis);
