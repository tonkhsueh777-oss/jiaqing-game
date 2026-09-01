(function (root) {
  const game = root.JQGame;
  if (!game?.UI) return;

  const baseRender = game.UI.render.bind(game.UI);
  const baseSetInteractionMode = game.UI.setInteractionMode.bind(game.UI);
  let lastState = null;

  const TREASURE_SYMBOLS = {
    goldSeal: '印',
    sword: '剑',
    gun: '枪',
    pomelo: '柚'
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>'\"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[ch]));

  function locationName(id) {
    if (id === 'center') return '中央起点';
    return game.LOCATIONS[id]?.name || id;
  }

  function treasureRows(player) {
    return `<div class="overview-player__treasures">${Object.values(game.TREASURES).map(t => {
      const count = player.treasures[t.id] || 0;
      const symbol = TREASURE_SYMBOLS[t.id] || '宝';
      return `<div class="overview-player__treasure overview-player__treasure--${escapeHtml(t.id)} ${count > 0 ? 'has-treasure' : 'no-treasure'}" title="${escapeHtml(t.name)} ×${count}">
        <span class="treasure-status-icon" aria-hidden="true">${symbol}</span>
        <span class="treasure-status-name">${escapeHtml(t.shortName || t.name)}</span>
        <strong>×${count}</strong>
      </div>`;
    }).join('')}</div>`;
  }

  function hiddenHand(player) {
    const backs = player.hand.map(() => `<img src="${escapeHtml(game.CATALOG.cardBack)}" alt="牌背">`).join('');
    return `<div class="overview-player__hand-row">
      <span>手牌：<strong>${player.hand.length}</strong> 张</span>
      <span class="overview-hand-backs" aria-label="手牌 ${player.hand.length} 张">${backs}</span>
    </div>`;
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
    if (!target || !state?.players) return;
    const currentId = state.players[state.currentPlayerIndex]?.id;

    target.innerHTML = state.players.map(player => {
      const label = player.id === 'human' ? '我' : player.id === 'ai1' ? '甲' : '乙';
      const role = player.id === 'human' ? '玩家（你）' : player.name;
      return `<div class="overview-player ${player.id === currentId ? 'is-current' : ''}" data-overview-player="${player.id}">
        <div class="overview-player__identity">
          <span class="overview-token overview-token--${player.id}">${label}</span>
          <div class="overview-player__body">
            <div class="overview-player__meta">
              <strong>${escapeHtml(role)}</strong>
              <small>位置：${escapeHtml(locationName(player.position))}</small>
            </div>
            ${hiddenHand(player)}
          </div>
        </div>
        ${treasureRows(player)}
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
        <span>${escapeHtml(t.name)}</span>
        <strong>×${state.treasureStock[t.id]}</strong>
      </div>`).join('');
  }

  function enhanceLeftRail(state) {
    if (!state) return;
    lastState = state;
    renderPlayerOverview(state);
    renderTreasureOverview(state);
  }

  game.UI.render = function renderV18LeftRail(state) {
    baseRender(state);
    enhanceLeftRail(state);
  };

  game.UI.setInteractionMode = function setInteractionModeV18LeftRail(mode, payload) {
    baseSetInteractionMode(mode, payload);
    enhanceLeftRail(lastState);
  };
})(globalThis);
