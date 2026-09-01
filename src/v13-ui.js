(function (root) {
  const game = root.JQGame;
  const handSwapLayout = game?.HandSwapLayout;
  if (!game?.UI || !handSwapLayout) return;

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

  function playerTreasureGrid(player) {
    return `<div class="overview-player__treasures">${Object.values(game.TREASURES).map(t => {
      const count = player.treasures[t.id] || 0;
      return `<div class="overview-player__treasure ${count > 0 ? 'has-treasure' : 'no-treasure'}" title="${escapeHtml(t.name)} ×${count}">
        <img src="${escapeHtml(t.asset)}" alt="">
        <span>${escapeHtml(t.shortName || t.name)}</span>
        <strong>×${count}</strong>
      </div>`;
    }).join('')}</div>`;
  }

  function wireOverviewTarget(target, playerId) {
    const overview = target.querySelector(`[data-overview-player="${playerId}"]`);
    const sourceId = playerId === 'ai1' ? 'ai-left' : playerId === 'ai2' ? 'ai-right' : null;
    const source = sourceId ? document.querySelector(`#${sourceId} .player-card`) : null;
    if (!overview || !source?.classList.contains('is-legal-target')) return;

    overview.classList.add('is-legal-target');
    overview.setAttribute('role', 'button');
    overview.setAttribute('tabindex', '0');
    overview.setAttribute('aria-label', `选择${playerId === 'ai1' ? 'AI玩家一' : 'AI玩家二'}为目标`);

    const activate = () => source.click();
    overview.addEventListener('click', activate);
    overview.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  }

  function renderPlayerOverview(state) {
    const target = document.getElementById('player-overview');
    if (!target) return;
    const currentId = state.players[state.currentPlayerIndex]?.id;
    target.innerHTML = state.players.map(player => {
      const label = player.id === 'human' ? '我' : player.id === 'ai1' ? '甲' : '乙';
      const role = player.id === 'human' ? '玩家（你）' : player.name;
      return `<div class="overview-player ${player.id === currentId ? 'is-current' : ''}" data-overview-player="${player.id}">
        <span class="overview-token overview-token--${player.id}">${label}</span>
        <span class="overview-player__body">
          <span class="overview-player__meta"><strong>${escapeHtml(role)}</strong><small>${escapeHtml(locationName(player.position))}</small></span>
          ${playerTreasureGrid(player)}
        </span>
        <span class="overview-hand">${player.hand.length}<small>张</small></span>
      </div>`;
    }).join('');

    wireOverviewTarget(target, 'ai1');
    wireOverviewTarget(target, 'ai2');
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
    const showHandSwap = handSwapLayout.shouldUseHandSideSwap(window.innerWidth || document.documentElement.clientWidth || 1400);
    target.innerHTML = [
      proxyButton('取消选择', 'action-button--cancel', 'cancel', '.human-actions [data-action="cancel"]'),
      proxyButton('保存牌局', 'action-button--save', 'save', '.human-actions [data-action="save"]'),
      ...(!showHandSwap ? [proxyButton('换1张并结束', 'action-button--primary', 'end', '.human-actions [data-action="end"]')] : []),
      '<button type="button" class="action-button action-button--rules" data-v13-action="rules">规则说明</button>'
    ].join('');

    target.querySelector('[data-v13-action="cancel"]')?.addEventListener('click', () => document.querySelector('.human-actions [data-action="cancel"]')?.click());
    target.querySelector('[data-v13-action="save"]')?.addEventListener('click', () => document.querySelector('.human-actions [data-action="save"]')?.click());
    target.querySelector('[data-v13-action="end"]')?.addEventListener('click', () => document.querySelector('.human-actions [data-action="end"]')?.click());
    target.querySelector('[data-v13-action="rules"]')?.addEventListener('click', () => document.getElementById('btn-rules')?.click());
  }

  function renderHandSwapShortcut() {
    const target = document.querySelector('.hand-side-note');
    if (!target) return;
    const source = document.querySelector('.human-actions [data-action="end"]');
    const showHandSwap = handSwapLayout.shouldUseHandSideSwap(window.innerWidth || document.documentElement.clientWidth || 1400);
    if (!showHandSwap) {
      target.innerHTML = '<span class="hand-side-note__mark">御</span><p>手牌上限：3 张<br>出牌后自动补至 3 张</p>';
      return;
    }
    const disabled = source?.disabled ? 'disabled' : '';
    target.innerHTML = `
      <span class="hand-side-note__eyebrow">没有牌可打？</span>
      <button type="button" class="action-button action-button--primary hand-side-swap" data-hand-swap ${disabled}>换1张并结束</button>
      <p class="hand-side-note__tip">选择它后，再点 1 张手牌换掉；补回新牌后结束本回合。</p>`;
    target.querySelector('[data-hand-swap]')?.addEventListener('click', () => source?.click());
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
    renderHandSwapShortcut();
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

  if (typeof window !== 'undefined') {
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (lastState) enhance(lastState); }, 100);
    });
  }
})(globalThis);
