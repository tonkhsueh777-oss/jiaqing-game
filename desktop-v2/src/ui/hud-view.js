import { buildHudModel } from './hud-model.js';
import { resolveCardAsset } from './card-assets.js';

function esc(value) {
  return String(value ?? '').replace(/[&<>"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[char]));
}

function playerMarkup(player) {
  return `<div class="v2-player-row${player.active ? ' is-active' : ''}" data-player-id="${esc(player.id)}">
    <span class="v2-player-dot">${player.id === 'human' ? '我' : player.id === 'ai1' ? '甲' : '乙'}</span>
    <div><strong>${esc(player.name)}</strong><small>${esc(player.positionName)} · 手牌 ${player.handCount} · 宝物 ${player.treasureCount}</small></div>
  </div>`;
}

function treasureMarkup(item) {
  return `<div class="v2-treasure"><span>${esc(item.name)}</span><strong>×${item.count}</strong></div>`;
}

function cardMarkup(card, index) {
  const src = resolveCardAsset(card.card);
  const fan = (index - 1) * 4;
  return `<button class="v2-hand-card${card.selected ? ' is-selected' : ''}${card.legal ? ' is-legal' : ' is-disabled'}" type="button" data-card-id="${esc(card.runtimeId)}" style="--fan:${fan}deg">
    <img src="${esc(src)}" alt="${esc(card.name)}">
    <span>${esc(card.name)}</span>
  </button>`;
}

function previewMarkup(selected) {
  if (!selected) return '<div class="v2-preview-empty">请选择一张手牌</div>';
  const src = resolveCardAsset(selected.card);
  return `<div class="v2-preview-card">
    <img src="${esc(src)}" alt="${esc(selected.name)}">
    <strong>${esc(selected.name)}</strong>
    <small>${esc(selected.typeLabel)}</small>
    ${selected.detail ? `<p>${esc(selected.detail)}</p>` : ''}
  </div>`;
}

function actionMarkup(model) {
  if (!model.selected) return '<button class="v2-action-button" type="button" disabled>请先选择手牌</button>';
  if (!model.selectedAction) return '<button class="v2-action-button" type="button" disabled>当前不可使用</button>';
  const action = model.selectedAction;
  if (action.type === 'travel') {
    return (action.destinations || []).map(id => `<button class="v2-action-button" type="button" data-pending-action="travel" data-target="${esc(id)}">移动到目标地点</button>`).join('');
  }
  if (action.type === 'tactic' || action.type === 'trump') {
    return (action.targets || []).map(id => `<button class="v2-action-button" type="button" data-pending-action="${esc(action.type)}" data-target="${esc(id)}">选择 ${esc(id === 'ai1' ? 'AI玩家一' : 'AI玩家二')}</button>`).join('');
  }
  if (action.type === 'discard') return '<button class="v2-action-button" type="button" data-pending-action="discard">弃掉这张牌</button>';
  return `<button class="v2-action-button" type="button" data-pending-action="${esc(action.type)}">使用这张牌</button>`;
}

export function renderHud(root, game, session, selectedRuntimeId = null) {
  const model = buildHudModel(session.state, game, selectedRuntimeId);
  root.querySelector('#v2-turn-status').textContent = `回合 ${model.turn.number} · ${model.turn.label}`;
  root.querySelector('#v2-stage-turn').textContent = model.turn.label;
  root.querySelector('#v2-player-list').innerHTML = model.players.map(playerMarkup).join('');
  root.querySelector('#v2-treasure-list').innerHTML = model.treasures.map(treasureMarkup).join('');
  root.querySelector('#v2-deck-status').innerHTML = `<div class="v2-deck-grid"><div><span>抽牌堆</span><strong>${model.deck.drawCount}</strong></div><div><span>弃牌堆</span><strong>${model.deck.discardCount}</strong></div></div>`;
  root.querySelector('#v2-action-log').innerHTML = model.log.map(line => `<div>• ${esc(line)}</div>`).join('');
  root.querySelector('#v2-hand-cards').innerHTML = model.hand.map(cardMarkup).join('');
  root.querySelector('#v2-card-preview').innerHTML = previewMarkup(model.selected);
  root.querySelector('#v2-action-guide').textContent = model.guide;
  root.querySelector('#v2-actions').innerHTML = actionMarkup(model);
  return model;
}
