(function (root) {
  const game = root.JQGame;
  if (!game?.UI || typeof document === 'undefined') return;

  let lastState = null;
  let resizeTimer = null;
  const baseRender = game.UI.render.bind(game.UI);
  const baseSetInteractionMode = game.UI.setInteractionMode.bind(game.UI);

  function isWideLayout() {
    return Number(root.innerWidth || document.documentElement.clientWidth || 1400) > 1180;
  }

  function replaceCopy() {
    const source = document.querySelector('.human-actions [data-action="end"]');
    if (source) source.textContent = '弃1张手牌并结束回合';

    const proxy = document.querySelector('[data-v13-action="end"]');
    if (proxy) proxy.textContent = '弃1张手牌并结束回合';

    document.querySelectorAll('.action-hint, .action-guide').forEach(node => {
      node.innerHTML = node.innerHTML
        .replaceAll('换1张并结束', '弃1张手牌并结束回合')
        .replaceAll('换入弃牌堆', '弃入弃牌堆')
        .replaceAll('选择1张手牌换牌后结束', '选择1张手牌弃入弃牌堆，补1张新牌后结束回合');
    });
  }

  function renderDiscardPile(state) {
    const target = document.querySelector('.hand-side-note');
    if (!target) return;

    const wide = isWideLayout();
    target.classList.toggle('v39-discard-pile', wide);
    target.setAttribute('aria-label', wide ? '弃牌堆快捷操作' : '手牌说明');
    if (!wide) return;

    const source = document.querySelector('.human-actions [data-action="end"]');
    const disabled = source?.disabled ? 'disabled' : '';
    const discardCount = Array.isArray(state?.discardPile) ? state.discardPile.length : 0;

    target.innerHTML = `
      <span class="v39-discard-title">弃牌堆 <small>${discardCount}张</small></span>
      <span class="v39-discard-kicker">没有合适的牌可出？</span>
      <button type="button" class="action-button action-button--primary hand-side-swap v39-discard-action" data-hand-swap ${disabled}>
        <strong>弃1张手牌</strong>
        <small>补1张新牌 · 结束回合</small>
      </button>
      <div class="v39-discard-flow" aria-hidden="true"><span>弃1张</span><b>→</b><span>补1张</span><b>→</b><span>结束</span></div>
      <p class="hand-side-note__tip">选择1张手牌弃置到弃牌堆，补回1张新牌后结束本回合。</p>`;

    target.querySelector('[data-hand-swap]')?.addEventListener('click', () => source?.click());
  }

  function enhance(state) {
    if (!state) return;
    lastState = state;
    replaceCopy();
    renderDiscardPile(state);
  }

  game.UI.render = function renderV39(state) {
    const result = baseRender(state);
    enhance(state);
    return result;
  };

  game.UI.setInteractionMode = function setInteractionModeV39(mode, payload) {
    const result = baseSetInteractionMode(mode, payload);
    enhance(lastState);
    return result;
  };

  root.addEventListener?.('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => enhance(lastState), 100);
  });
})(globalThis);
