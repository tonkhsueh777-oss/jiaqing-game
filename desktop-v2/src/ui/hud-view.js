import { buildHudModel } from './hud-model.js';
import { resolveCardAsset } from './card-assets.js';

const LOCATION_NAMES = Object.freeze({
  center: '中央起点',
  tainan: '台南府城',
  mengxia: '艋舺',
  zhuluo: '诸罗大营',
  madou: '麻豆古镇'
});

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

function cardMarkup(card, index, handLength) {
  const src = resolveCardAsset(card.card);
  const center = (handLength - 1) / 2;
  const fan = (index - center) * 5;
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

function playerName(model, id) {
  return model.players.find(player => player.id === id)?.name || id;
}

function actionMarkup(model, interaction = {}) {
  if (model.turn.activePlayerId && model.turn.activePlayerId !== 'human') {
    return '<button class="v2-action-button" type="button" disabled>AI 正在行动</button>';
  }
  if (!model.selected) return '<button class="v2-action-button" type="button" disabled>请先选择手牌</button>';
  if (!model.selectedAction) {
    if (model.canSwapPass) return '<button class="v2-action-button v2-action-button--gold" type="button" data-pending-action="swap-pass">弃掉这张牌 · 补1张 · 结束回合</button>';
    return '<button class="v2-action-button" type="button" disabled>当前不可使用</button>';
  }

  const action = model.selectedAction;
  if (action.type === 'travel') {
    return (action.destinations || []).map(id => `<button class="v2-action-button" type="button" data-pending-action="travel" data-target="${esc(id)}">移动到 ${esc(LOCATION_NAMES[id] || id)}</button>`).join('');
  }

  if (action.type === 'tactic') {
    const targetId = interaction.tacticTargetId || null;
    if (!targetId) {
      return (action.targets || []).map(id => `<button class="v2-action-button" type="button" data-pending-action="tactic-target" data-target="${esc(id)}">选择 ${esc(playerName(model, id))}</button>`).join('');
    }
    return `<div class="v2-action-step">计策目标：<strong>${esc(playerName(model, targetId))}</strong></div>
      <button class="v2-action-button v2-action-button--gold" type="button" data-pending-action="tactic-confirm">确认发动计策</button>
      <button class="v2-action-button" type="button" data-pending-action="special-reset">重新选择</button>`;
  }

  if (action.type === 'trump') {
    const flow = interaction.trump || {};
    if (!flow.targetPlayerId) {
      return (action.targets || []).map(id => `<button class="v2-action-button" type="button" data-pending-action="trump-target" data-target="${esc(id)}">选择 ${esc(playerName(model, id))}</button>`).join('');
    }

    if (!flow.ownTreasureId) {
      const ownOptions = model.treasures.filter(item => item.count > 0);
      return `<div class="v2-action-step">目标：<strong>${esc(playerName(model, flow.targetPlayerId))}</strong><br>选择你要交出的宝物</div>${ownOptions.map(item => `<button class="v2-action-button" type="button" data-pending-action="trump-own" data-treasure-id="${esc(item.id)}">交出 ${esc(item.name)}</button>`).join('')}<button class="v2-action-button" type="button" data-pending-action="special-reset">重新选择</button>`;
    }

    const targetPlayer = model.players.find(player => player.id === flow.targetPlayerId);
    if (!flow.targetTreasureId) {
      const targetOptions = Object.entries(targetPlayer?.treasures || {}).filter(([, count]) => Number(count) > 0);
      return `<div class="v2-action-step">你将交出：<strong>${esc(model.treasureNames[flow.ownTreasureId])}</strong><br>选择要从对手处换走的宝物</div>${targetOptions.map(([id]) => `<button class="v2-action-button" type="button" data-pending-action="trump-target-treasure" data-treasure-id="${esc(id)}">换取 ${esc(model.treasureNames[id])}</button>`).join('')}<button class="v2-action-button" type="button" data-pending-action="special-reset">重新选择</button>`;
    }

    return `<div class="v2-action-step">${esc(playerName(model, flow.targetPlayerId))}<br>你交出 <strong>${esc(model.treasureNames[flow.ownTreasureId])}</strong>，换取 <strong>${esc(model.treasureNames[flow.targetTreasureId])}</strong></div>
      <button class="v2-action-button v2-action-button--gold" type="button" data-pending-action="trump-confirm">确认发动王牌</button>
      <button class="v2-action-button" type="button" data-pending-action="special-reset">重新选择</button>`;
  }

  if (action.type === 'discard') return '<button class="v2-action-button" type="button" data-pending-action="discard">弃掉这张牌</button>';
  return `<button class="v2-action-button v2-action-button--gold" type="button" data-pending-action="${esc(action.type)}">使用这张牌</button>`;
}

function interactionGuide(model, interaction = {}) {
  if (interaction.tacticTargetId) return `已经选择${playerName(model, interaction.tacticTargetId)}。确认后才会真正发动【${model.selected?.name || '计策牌'}】。`;
  const flow = interaction.trump;
  if (!flow?.targetPlayerId) return model.guide;
  if (!flow.ownTreasureId) return `已经选择${playerName(model, flow.targetPlayerId)}。下一步请选择你要交出的1件宝物。`;
  if (!flow.targetTreasureId) return `你准备交出【${model.treasureNames[flow.ownTreasureId]}】。下一步请选择要从${playerName(model, flow.targetPlayerId)}处换走的宝物。`;
  return `交换内容已经确定。确认后将交出【${model.treasureNames[flow.ownTreasureId]}】，换取【${model.treasureNames[flow.targetTreasureId]}】。`;
}

export function renderHud(root, game, session, selectedRuntimeId = null, interaction = {}) {
  const model = buildHudModel(session.state, game, selectedRuntimeId);
  root.querySelector('#v2-turn-status').textContent = `回合 ${model.turn.number} · ${model.turn.label}`;
  root.querySelector('#v2-stage-turn').textContent = model.turn.label;
  root.querySelector('#v2-player-list').innerHTML = model.players.map(playerMarkup).join('');
  root.querySelector('#v2-treasure-list').innerHTML = model.treasures.map(treasureMarkup).join('');
  root.querySelector('#v2-deck-status').innerHTML = `<div class="v2-deck-grid"><div><span>抽牌堆</span><strong>${model.deck.drawCount}</strong></div><div><span>弃牌堆</span><strong>${model.deck.discardCount}</strong></div></div>`;
  root.querySelector('#v2-action-log').innerHTML = model.log.map(line => `<div>• ${esc(line)}</div>`).join('');
  root.querySelector('#v2-hand-cards').innerHTML = model.hand.map((card, index) => cardMarkup(card, index, model.hand.length)).join('');
  root.querySelector('#v2-card-preview').innerHTML = previewMarkup(model.selected);
  root.querySelector('#v2-action-guide').textContent = interactionGuide(model, interaction);
  root.querySelector('#v2-actions').innerHTML = actionMarkup(model, interaction);
  return model;
}
