(function (root) {
  const game = root.JQGame;
  game.CARD_SPRITE = game.CARD_SPRITE || 'assets/cards-sprite.jpg';
  game.ART_KEYS = game.ART_KEYS || {
    mingcha: 0, xunyou: 1, tainan: 2, mengxia: 3, zhuluo: 4, madou: 5,
    goldSeal: 6, sword: 7, gun: 8, pomelo: 9, jiaqingOrder: 10, wangOrder: 11,
    bully: 12, fire: 13, flower: 14, cardBack: 15
  };

  const BOARD_SLOTS = {
    center: { x: 50, y: 50 },
    tainan: { x: 50, y: 20 },
    mengxia: { x: 79, y: 50 },
    zhuluo: { x: 21, y: 50 },
    madou: { x: 50, y: 80 }
  };

  const refs = {};
  const handlers = {};
  const interaction = {
    mode: 'idle',
    selectedRuntimeId: null,
    legalBoardTargets: [],
    legalPlayerTargets: [],
    hint: ''
  };
  let currentState = null;
  let toastTimer = null;

  function byId(id) { return typeof document !== 'undefined' ? document.getElementById(id) : null; }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  function resolveArtKey(value) {
    if (!value) return null;
    if (game.ART_KEYS && Object.prototype.hasOwnProperty.call(game.ART_KEYS, value)) return value;
    const file = String(value).split('/').pop();
    const map = {
      '01-mingcha.jpg': 'mingcha', '02-xunyou.jpg': 'xunyou', '03-tainan.jpg': 'tainan',
      '04-mengxia.jpg': 'mengxia', '05-zhuluo.jpg': 'zhuluo', '06-madou.jpg': 'madou',
      '07-gold-seal.jpg': 'goldSeal', '08-sword.jpg': 'sword', '09-gun.jpg': 'gun', '10-pomelo.jpg': 'pomelo',
      '11-jiaqing-order.jpg': 'jiaqingOrder', '12-wang-order.jpg': 'wangOrder', '13-bully.jpg': 'bully',
      '14-fire.jpg': 'fire', '15-flower.jpg': 'flower', 'card-back.jpg': 'cardBack'
    };
    return map[file] || null;
  }

  function artStyle(value) {
    const artKey = resolveArtKey(value);
    const index = game.ART_KEYS?.[artKey];
    if (typeof index !== 'number') return '';
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = (col / 3) * 100;
    const y = (row / 3) * 100;
    return `background-image:url("${game.CARD_SPRITE}");background-size:400% 400%;background-position:${x}% ${y}%;`;
  }

  function artHtml(artKey, className = 'card-art', label = '') {
    return `<span class="${className}" style="${artStyle(artKey)}" role="img" aria-label="${escapeHtml(label)}"></span>`;
  }

  function locationName(id) {
    if (id === 'center') return '中央起点';
    return game.LOCATIONS[id]?.name || id;
  }

  function locationSubtitle(id) {
    if (id === 'center') return '巡游中转枢纽';
    const location = game.LOCATIONS[id];
    const treasure = location ? game.TREASURES[location.treasure] : null;
    return treasure ? `对应圣物：${treasure.shortName}` : '待开放地牌';
  }

  function cardRuleText(card) {
    if (!card) return '';
    if (card.type === 'travel') return '线上规则：打出1张巡游，沿地图连线移动1格；未开放地点不能进入；本回合只能执行这1个动作。';
    if (card.type === 'inspect') return '线上规则：停留在已开放地点时打出，立即取得该地点对应圣物1件；库存为0时仍会消耗此牌。';
    if (card.type === 'tactic') return '线上规则：指定1名对手，使其下一个完整回合直接跳过；效果可累计。';
    if (card.type === 'trump') return '线上规则：用自己1件圣物，强制交换任意对手的1件圣物。';
    if (card.type === 'location') {
      const name = game.LOCATIONS[card.locationId]?.name || card.name || '地点';
      return `线上规则：首次打出【${name}】后永久留在中央棋盘并开放地点；重复地牌可直接弃置，本回合随即结束。`;
    }
    return '';
  }

  function treasureListHtml(treasures, compact = false) {
    return Object.values(game.TREASURES).map(t => {
      const count = treasures[t.id] || 0;
      if (compact) {
        return `<div class="treasure-mini">${artHtml(t.artKey || t.asset, 'treasure-mini__art', t.name)}<span>${escapeHtml(t.shortName || t.name)}</span><strong>×${count}</strong></div>`;
      }
      return `<div class="human-treasure"><span>${escapeHtml(t.shortName || t.name)}</span><strong>×${count}</strong></div>`;
    }).join('');
  }

  function renderPlayerPanel(player, targetElement) {
    if (!targetElement) return;
    const isCurrent = currentState?.players[currentState.currentPlayerIndex]?.id === player.id;
    const isTarget = interaction.legalPlayerTargets.includes(player.id);
    targetElement.innerHTML = `
      <div class="player-card ${isCurrent ? 'is-current' : ''} ${isTarget ? 'is-legal-target' : ''}" data-player-id="${player.id}">
        <div class="player-name-row">
          <div>
            <div class="player-name">${escapeHtml(player.name)}</div>
            <div class="player-status">AI玩家 · 手牌 ${player.hand.length}</div>
          </div>
          ${player.skipTurns > 0 ? `<span class="skip-badge">待跳过 ×${player.skipTurns}</span>` : ''}
        </div>
        <div class="player-position">当前位置：${escapeHtml(locationName(player.position))}</div>
        <div class="ai-hand" aria-label="隐藏手牌">${player.hand.map(() => artHtml(game.CATALOG.cardBackArtKey || game.CATALOG.cardBack, 'ai-hand-card', '牌背')).join('')}</div>
        <div class="treasure-mini-list">${treasureListHtml(player.treasures, true)}</div>
        <div class="last-action">${escapeHtml(player.lastAction || '等待行动')}</div>
      </div>`;
    if (isTarget) targetElement.querySelector('.player-card')?.addEventListener('click', () => handlers.onPlayerTarget?.(player.id));
  }

  function renderTreasureBar(state) {
    if (!refs.treasureBar) return;
    refs.treasureBar.innerHTML = Object.values(game.TREASURES).map(t => `
      <div class="treasure-stock ${state.treasureStock[t.id] === 0 ? 'is-empty' : ''}">
        ${artHtml(t.artKey || t.asset, 'treasure-stock__art', t.name)}
        <div class="treasure-stock__name">${escapeHtml(t.name)}</div>
        <div class="treasure-stock__count">×${state.treasureStock[t.id]}</div>
      </div>`).join('');
  }

  function boardStyle(point) { return `left:${point.x}%;top:${point.y}%;`; }
  function tokenOffset(index, total) {
    if (total <= 1) return { x: 0, y: 0 };
    const offsets = [{ x: -20, y: -14 }, { x: 20, y: -14 }, { x: 0, y: 20 }];
    return offsets[index] || { x: 0, y: 0 };
  }

  function renderBoardNode(locationId, point, state) {
    const isCenter = locationId === 'center';
    const opened = !isCenter && state.openedLocations[locationId];
    const pointStyle = boardStyle(point);
    if (isCenter) return `<div class="board-node board-node--center" style="${pointStyle}"><div class="board-node__title">中央起点</div><div class="board-node__subtitle">巡游中转枢纽</div></div>`;
    if (opened) {
      const card = state.locationCards[locationId] || { name: game.LOCATIONS[locationId].name };
      return `<div class="board-node board-node--location is-opened" style="${pointStyle}">
        <div class="board-node__card-wrap">${artHtml(card.artKey || card.asset || game.LOCATIONS[locationId].artKey || game.LOCATIONS[locationId].asset, 'location-card-on-board', card.name || game.LOCATIONS[locationId].name)}</div>
        <div class="board-node__title">${escapeHtml(locationName(locationId))}</div><div class="board-node__subtitle">${escapeHtml(locationSubtitle(locationId))}</div></div>`;
    }
    return `<div class="board-node board-node--location" style="${pointStyle}"><div class="board-slot-empty">待开放地牌</div><div class="board-node__title">${escapeHtml(locationName(locationId))}</div><div class="board-node__subtitle">${escapeHtml(locationSubtitle(locationId))}</div></div>`;
  }

  function renderBoard(state) {
    if (!refs.boardOverlay) return;
    let html = '<div class="board-cross board-cross--vertical"></div><div class="board-cross board-cross--horizontal"></div>';
    for (const [locationId, point] of Object.entries(BOARD_SLOTS)) {
      html += renderBoardNode(locationId, point, state);
      if (interaction.legalBoardTargets.includes(locationId)) html += `<button type="button" class="board-target ${locationId === 'center' ? 'board-target--center' : ''}" style="${boardStyle(point)}" data-board-target="${locationId}" aria-label="移动至${escapeHtml(locationName(locationId))}"></button>`;
    }
    const groups = new Map();
    for (const player of state.players) { const list = groups.get(player.position) || []; list.push(player); groups.set(player.position, list); }
    for (const [position, players] of groups.entries()) {
      const point = BOARD_SLOTS[position]; if (!point) continue;
      players.forEach((player, index) => { const offset = tokenOffset(index, players.length); const label = player.id === 'human' ? '我' : player.id === 'ai1' ? '甲' : '乙'; html += `<div class="player-token player-token--${player.id}" style="left:calc(${point.x}% + ${offset.x}px);top:calc(${point.y}% + ${offset.y}px);" title="${escapeHtml(player.name)}">${label}</div>`; });
    }
    refs.boardOverlay.innerHTML = html;
    refs.boardOverlay.querySelectorAll('[data-board-target]').forEach(button => button.addEventListener('click', () => handlers.onBoardTarget?.(button.dataset.boardTarget)));
  }

  function renderPiles(state) {
    if (refs.drawPile) refs.drawPile.innerHTML = `${artHtml(game.CATALOG.cardBackArtKey || game.CATALOG.cardBack, 'pile-card__art', '公共抽牌堆')}<div>抽牌堆</div><strong>${state.drawPile.length}</strong>`;
    if (refs.discardPile) { const top = state.discardPile.at(-1); refs.discardPile.innerHTML = `${top ? artHtml(top.artKey || top.asset || game.CATALOG.cardBackArtKey || game.CATALOG.cardBack, 'pile-card__art', top.name || '弃牌堆顶牌') : `<div style="height:88px"></div>`}<div>弃牌堆</div><strong>${state.discardPile.length}</strong>`; }
  }

  function renderLog(state) {
    if (!refs.gameLog) return;
    const lines = state.log.slice(-6);
    refs.gameLog.innerHTML = `<h3>行动记录</h3><div class="log-lines">${lines.map(line => `<div class="log-line">${escapeHtml(line)}</div>`).join('')}</div>`;
  }

  function renderHuman(state) {
    if (!refs.humanPanel) return;
    const human = state.players.find(p => p.id === 'human');
    const current = state.players[state.currentPlayerIndex];
    const isHumanTurn = current?.id === 'human' && !state.winnerId;
    const cardButtons = human.hand.map((card, index) => {
      const selected = interaction.selectedRuntimeId === card.runtimeId;
      const disabled = !isHumanTurn || state.phase !== 'action';
      return `<button class="hand-card-button ${selected ? 'is-selected' : ''} ${index === human.hand.length - 1 ? 'card-enter-hand' : ''}" type="button" data-card-id="${card.runtimeId}" ${disabled ? 'disabled' : ''} aria-label="${escapeHtml(card.name)}">${artHtml(card.artKey || card.asset, 'hand-card-art', card.name)}<span class="card-tooltip">${escapeHtml(cardRuleText(card))}</span></button>`;
    }).join('');
    let hint = interaction.hint;
    if (!hint) { if (!isHumanTurn) hint = '等待AI行动。'; else if (state.phase === 'action') hint = '点击1张手牌执行本回合唯一动作；出牌后会自动补回至3张并结束回合。'; else hint = '准备进入你的行动阶段。'; }
    refs.humanPanel.innerHTML = `<div class="human-summary"><h2>御前玩家</h2><p>当前位置：${escapeHtml(locationName(human.position))} · 手牌 ${human.hand.length}/3</p><div class="human-treasures">${treasureListHtml(human.treasures, false)}</div></div><div class="hand-zone" aria-label="你的手牌">${cardButtons || '<span class="player-status">当前没有手牌</span>'}</div><div class="human-actions"><div class="action-hint">${escapeHtml(hint)}</div><div class="action-buttons"><button type="button" class="action-button" data-action="cancel" ${interaction.mode === 'idle' ? 'disabled' : ''}>取消选择</button><button type="button" class="action-button" data-action="save">保存牌局</button><button type="button" class="action-button action-button--primary" data-action="end" ${!isHumanTurn || state.phase !== 'action' ? 'disabled' : ''}>换1张并结束</button></div></div>`;
    refs.humanPanel.querySelectorAll('[data-card-id]').forEach(button => button.addEventListener('click', () => handlers.onCardClick?.(button.dataset.cardId)));
    refs.humanPanel.querySelector('[data-action="end"]')?.addEventListener('click', () => handlers.onEndAction?.());
    refs.humanPanel.querySelector('[data-action="cancel"]')?.addEventListener('click', () => handlers.onCancel?.());
    refs.humanPanel.querySelector('[data-action="save"]')?.addEventListener('click', () => handlers.onSave?.());
  }

  function renderTurnBanner(state) { if (!refs.turnBanner) return; const player = state.players[state.currentPlayerIndex]; const phaseName = { setup: '准备', turnStart: '回合开始', action: '单动作回合', discard: '弃牌' }[state.phase] || state.phase; refs.turnBanner.textContent = state.winnerId ? '牌局结束' : `${player?.name || ''} · ${phaseName}`; }
  function render(state) { currentState = state; renderTreasureBar(state); renderPlayerPanel(state.players.find(p => p.id === 'ai1'), refs.aiLeft); renderPlayerPanel(state.players.find(p => p.id === 'ai2'), refs.aiRight); renderBoard(state); renderPiles(state); renderLog(state); renderHuman(state); renderTurnBanner(state); }
  function setInteractionMode(mode, payload = {}) { interaction.mode = mode || 'idle'; interaction.selectedRuntimeId = payload.selectedRuntimeId || null; interaction.legalBoardTargets = payload.legalBoardTargets ? payload.legalBoardTargets.slice() : []; interaction.legalPlayerTargets = payload.legalPlayerTargets ? payload.legalPlayerTargets.slice() : []; interaction.hint = payload.hint || ''; if (currentState) render(currentState); }
  function showToast(message) { if (!refs.toast) return; refs.toast.textContent = message; refs.toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => refs.toast?.classList.remove('is-visible'), 2400); }
  function appendLog(message) { if (!currentState || !message) return; currentState.log.push(message); renderLog(currentState); }
  function closeModal() { if (!refs.modalRoot) return; refs.modalRoot.className = 'modal-root'; refs.modalRoot.innerHTML = ''; }

  function showChoiceDialog({ title, message = '', choices = [], cancelText = '取消', onCancel }) {
    if (!refs.modalRoot) return;
    refs.modalRoot.className = 'modal-root is-open';
    refs.modalRoot.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><h2>${escapeHtml(title)}</h2>${message ? `<p>${escapeHtml(message)}</p>` : ''}<div class="choice-grid">${choices.map((choice, i) => `<button class="choice-button" type="button" data-choice="${i}">${(choice.artKey || choice.image) ? artHtml(choice.artKey || choice.image, 'choice-art', choice.label) : ''}<strong>${escapeHtml(choice.label)}</strong>${choice.detail ? `<div class="player-status">${escapeHtml(choice.detail)}</div>` : ''}</button>`).join('')}</div><div class="modal-actions"><button class="ghost-button" type="button" data-modal-cancel>${escapeHtml(cancelText)}</button></div></div>`;
    refs.modalRoot.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => { const choice = choices[Number(button.dataset.choice)]; closeModal(); choice.onSelect?.(); }));
    refs.modalRoot.querySelector('[data-modal-cancel]')?.addEventListener('click', () => { closeModal(); onCancel?.(); });
  }

  function showStartDialog(hasSave) {
    if (!refs.modalRoot) return;
    refs.modalRoot.className = 'modal-root is-open';
    refs.modalRoot.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2>御前争霸</h2><p>${hasSave ? '检测到上一局存档。你可以继续游戏，或重新开局。' : '三名玩家从中央起点出发。每回合只能执行1个动作；手牌会自动补回并尽量维持3张。先开放地牌，再巡游、明察，集齐四种不同圣物即可获胜。'}</p><div class="modal-actions">${hasSave ? '<button class="action-button action-button--primary" data-start="resume">继续游戏</button>' : ''}<button class="action-button ${hasSave ? '' : 'action-button--primary'}" data-start="new">新游戏</button></div></div>`;
    refs.modalRoot.querySelector('[data-start="resume"]')?.addEventListener('click', () => { closeModal(); handlers.onResume?.(); });
    refs.modalRoot.querySelector('[data-start="new"]')?.addEventListener('click', () => { closeModal(); handlers.onNewGame?.(); });
  }

  function showWinner(state) {
    const winner = state.players.find(p => p.id === state.winnerId);
    if (!winner || !refs.modalRoot) return;
    refs.modalRoot.className = 'modal-root is-open';
    refs.modalRoot.innerHTML = `<div class="modal winner-overlay" role="dialog" aria-modal="true"><h2>${escapeHtml(winner.name)}获胜</h2><p>已经集齐四种御前圣物。</p><div class="winner-four">${Object.values(game.TREASURES).map(t => `<div>${artHtml(t.artKey || t.asset, 'treasure-stock__art', t.name)}<strong>${escapeHtml(t.shortName)} ×${winner.treasures[t.id]}</strong></div>`).join('')}</div><div class="modal-actions" style="justify-content:center"><button class="action-button action-button--primary" data-win="restart">重新开始</button><button class="ghost-button" data-win="close">关闭查看牌局</button></div></div>`;
    refs.modalRoot.querySelector('[data-win="restart"]')?.addEventListener('click', () => { closeModal(); handlers.onNewGame?.(); });
    refs.modalRoot.querySelector('[data-win="close"]')?.addEventListener('click', closeModal);
  }

  function showRules() { showChoiceDialog({ title: '线上版核心规则', message: '每名玩家手牌维持3张。每回合只能执行1个动作：打出地牌开放地点、打出巡游沿连线移动1格、打出明察取得当前地点圣物、使用计策让对手跳过回合，或使用王牌交换圣物。动作结算后会自动补牌并结束回合；若本回合没有合适动作，可选择1张手牌换牌后结束。率先集齐金印、宝剑、火枪、柚子四种不同圣物者获胜。', choices: [], cancelText: '知道了' }); }

  function mount(rootElement, incomingHandlers = {}) {
    Object.assign(handlers, incomingHandlers);
    refs.aiLeft = byId('ai-left'); refs.aiRight = byId('ai-right'); refs.treasureBar = byId('treasure-bar'); refs.boardOverlay = byId('board-overlay'); refs.drawPile = byId('draw-pile'); refs.discardPile = byId('discard-pile'); refs.gameLog = byId('game-log'); refs.humanPanel = byId('human-panel'); refs.turnBanner = byId('turn-banner'); refs.toast = byId('toast'); refs.modalRoot = byId('modal-root');
    byId('btn-new-game')?.addEventListener('click', () => handlers.onNewGame?.()); byId('btn-rules')?.addEventListener('click', showRules); return rootElement || byId('app');
  }

  game.UI = { BOARD_SLOTS, cardRuleText, mount, render, setInteractionMode, showToast, appendLog, showChoiceDialog, showStartDialog, showWinner, closeModal, showRules };
})(globalThis);
