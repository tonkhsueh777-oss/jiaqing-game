import { STAGE_LAYOUT } from './stage-model.js';

const EMPTY = Object.freeze({ mode: 'idle', locationIds: [], playerIds: [] });

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function buildStageGuidance(hud, interaction = {}) {
  if (!hud || hud.turn?.activePlayerId !== 'human') return { ...EMPTY, locationIds: [], playerIds: [] };
  const action = hud.selectedAction;
  if (!action) return { ...EMPTY, locationIds: [], playerIds: [] };

  if (action.type === 'travel') {
    return { mode: 'travel', locationIds: unique(action.destinations), playerIds: [] };
  }
  if (action.type === 'inspect' || action.type === 'location') {
    return { mode: action.type, locationIds: unique([action.locationId]), playerIds: [] };
  }
  if (action.type === 'tactic') {
    const chosen = interaction.tacticTargetId;
    return { mode: 'tactic', locationIds: [], playerIds: unique(chosen ? [chosen] : action.targets) };
  }
  if (action.type === 'trump') {
    const chosen = interaction.trump?.targetPlayerId;
    return { mode: 'trump', locationIds: [], playerIds: unique(chosen ? [chosen] : action.targets) };
  }
  return { ...EMPTY, locationIds: [], playerIds: [] };
}

function pointForPosition(position) {
  if (!position || position === 'center') return STAGE_LAYOUT.center;
  return STAGE_LAYOUT.locations[position] || STAGE_LAYOUT.center;
}

function marker(label, x, y, kind, selected = false) {
  return `<span class="v2-stage-marker v2-stage-marker--${kind}${selected ? ' is-selected' : ''}" style="left:${(x * 100).toFixed(2)}%;top:${(y * 100).toFixed(2)}%"><i></i><b>${label}</b></span>`;
}

export function renderStageGuidance(root, guidance, state) {
  const host = root?.querySelector?.('#v2-stage-guidance');
  if (!host) return;
  const parts = [];

  for (const id of guidance?.locationIds || []) {
    const point = STAGE_LAYOUT.locations[id];
    if (!point) continue;
    const label = guidance.mode === 'travel' ? '可前往' : guidance.mode === 'inspect' ? '可明察' : '可使用';
    parts.push(marker(label, point.x, point.y, 'location'));
  }

  const selectedTarget = guidance?.playerIds?.length === 1;
  for (const id of guidance?.playerIds || []) {
    const player = state?.players?.find(item => item.id === id);
    if (!player) continue;
    const point = pointForPosition(player.position);
    parts.push(marker('选择目标', point.x, point.y - 0.015, 'player', selectedTarget));
  }

  host.innerHTML = parts.join('');
  host.dataset.mode = guidance?.mode || 'idle';
}
