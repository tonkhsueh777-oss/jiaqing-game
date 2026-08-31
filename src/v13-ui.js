(function (root) {
  const game = root.JQGame;
  if (!game?.UI) return;

  let lastState = null;
  const baseRender = game.UI.render.bind(game.UI);
  const baseSetInteractionMode = game.UI.setInteractionMode.bind(game.UI);

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[ch]));

  function locationName(id) {
    if (id === 'center') return '中央起点';
    return game.LOCATIONS[id]?.name || id;
  }

  function treasureKinds(treasures) {
    return Object.values(treasures || {}).filter(count => count > 0).length;
  }

  function renderPlayerOverview(state) {
    const target = document.getElementById('player-overview');
    if (!target) return;
    const currentId = state.players[state.currentPlayerIndex]?.id;
    target.innerHTML = state.players.map(player => {
      const label = player.id === 'human' ? '我' : player.id === 'ai1' ? '甲' : '乙';
      const role = player.id === 'human' ? '玩家（你）' : player.name;
      return `<div class="overview-player ${player.id === currentId ? 'is-current' : ''}">
        <span class="overview-token overview-token--${player.id}">${label}</span>
        <span class="overview-player__body"><strong>${escapeHtml(role)}</strong><small>${escapeHtml(locationName(player.position))} · 圣物 ${treasureKinds(player.treasures)}/4</small></span>
        <span class="overview-hand">${player.hand.length}<small>张</small></span>
      </div>`;
    }).join('');
  }

  function renderTreasureOverview(state) {
    const target = document.getElementById('treasure-overview');
    if (!target) return;
    target.innerHTML = Object.values(game.TREASURES).map(t => `
      <div class="overview-treasure ${state.treasureStock[t.id] === 0 ? 'is-empty' : ''}">
        <img class="overview-treasure__art" src="${escapeHtml(t.asset)}" alt="${escapeHtml(t.name)}">
        <span>${escapeHtml(t.shortName)}</span>
        <strong>×${state.treasureStock[t.id]}</strong>
      </div>`).join('');
  }

  function selectedCard(state) {
    const selectedButton = document.querySelector('.hand-card-button.is-selected');
    const runtimeId = selectedButton?.dataset.cardId;
    if (!runtimeId) return null;
    return state.players.find(p => p.id === 'human')?.hand.find(card => card.runtimeId === runtimeId) || null;
  }

  function renderPreview(state) {
    const target = document.getElementById('selected-card-preview');
    if (!target) return;
    const card = selectedCard(state);
    if (!card) {
      target.innerHTML = `<div class="preview-empty"><span class="preview-empty__mark">御</span><strong>请选择一张手牌</strong><p>牌面会在这里放大预览。游戏继续使用你原来的高清牌图。</p></div>`;
      return;
    }
    target.innerHTML = `<div class="preview-card-wrap"><img class="preview-card-art" src="${escapeHtml(card.asset)}" alt="${escapeHtml(card.name)}"></div><strong>${escapeHtml(card.name)}</strong><p>${escapeHtml(game.UI.cardRuleText(card))}</p>`;
  }

  function renderActionGuide() {
    const target = document.getElementById('action-guide');
    if (!target) return;
    const hint = document.querySelector('.human-actions .action-hint')?.textContent?.trim() || '点击底部1张手牌执行本回合唯一动作。';
    target.innerHTML = `<p>${escapeHtml(hint)}</p><ul><li>每回合只执行1个动作</li><li>成功出牌后自动补回至3张</li><li>无合适动作时可换1张并结束</li></ul>`;
  }

  function proxyButton(label, className, action, sourceSelector) {
    const source = document.querySelector(sourceSelector);
    return `<button type="button" class="action-button ${className}" data-v13-action="${action}" ${source?.disabled ? 'disabled' : ''}>${label}</button>`;
  }

  function renderControls() {
    const target = document.getElementById('action-controls');
    if (!target) return;
    target.innerHTML = [
      proxyButton('取消选择', 'action-button--cancel', 'cancel', '.human-actions [data-action="cancel"]'),
      proxyButton('保存牌局', 'action-button--save', 'save', '.human-actions [data-action="save"]'),
      proxyButton('换1张并结束', 'action-button--primary', 'end', '.human-actions [data-action="end"]'),
      '<button type="button" class="action-button action-button--rules" data-v13-action="rules">规则说明</button>'
    ].join('');

    target.querySelector('[data-v13-action="cancel"]')?.addEventListener('click', () => document.querySelector('.human-actions [data-action="cancel"]')?.click());
    target.querySelector('[data-v13-action="save"]')?.addEventListener('click', () => document.querySelector('.human-actions [data-action="save"]')?.click());
    target.querySelector('[data-v13-action="end"]')?.addEventListener('click', () => document.querySelector('.human-actions [data-action="end"]')?.click());
    target.querySelector('[data-v13-action="rules"]')?.addEventListener('click', () => document.getElementById('btn-rules')?.click());
  }

  function renderHandTitle(state) {
    const target = document.getElementById('hand-title');
    const human = state.players.find(p => p.id === 'human');
    if (target && human) target.textContent = `玩家（你）手牌（${human.hand.length}/3）`;
  }

  function enhance(state) {
    if (!state) return;
    lastState = state;
    renderPlayerOverview(state);
    renderTreasureOverview(state);
    renderPreview(state);
    renderActionGuide();
    renderControls();
    renderHandTitle(state);
  }

  game.UI.render = function renderV13(state) {
    baseRender(state);
    enhance(state);
  };

  game.UI.setInteractionMode = function setInteractionModeV13(mode, payload) {
    baseSetInteractionMode(mode, payload);
    enhance(lastState);
  };
})(globalThis);
