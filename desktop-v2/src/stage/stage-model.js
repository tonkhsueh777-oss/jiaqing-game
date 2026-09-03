export const STAGE_LAYOUT = Object.freeze({
  center: Object.freeze({ id: 'center', slot: 'center', x: 0.5, y: 0.50 }),
  locations: Object.freeze({
    tainan: Object.freeze({ id: 'tainan', name: '台南府城', slot: 'north', x: 0.5, y: 0.17, treasure: '金印' }),
    madou: Object.freeze({ id: 'madou', name: '麻豆古镇', slot: 'west', x: 0.22, y: 0.50, treasure: '柚子' }),
    mengxia: Object.freeze({ id: 'mengxia', name: '艋舺', slot: 'east', x: 0.78, y: 0.50, treasure: '火枪' }),
    zhuluo: Object.freeze({ id: 'zhuluo', name: '诸罗大营', slot: 'south', x: 0.5, y: 0.82, treasure: '宝剑' })
  })
});

const QUALITY = Object.freeze({
  standard: Object.freeze({ id: 'standard', particles: true, shadows: true, motionScale: 1, glow: 1 }),
  low: Object.freeze({ id: 'low', particles: false, shadows: false, motionScale: 0.55, glow: 0.55 })
});

function resolveSlot(position) {
  if (!position || position === 'center') return STAGE_LAYOUT.center;
  return STAGE_LAYOUT.locations[position] || STAGE_LAYOUT.center;
}

export function buildStageModel(state, options = {}) {
  const quality = QUALITY[options.quality] || QUALITY.standard;
  const players = (state?.players || []).map((player, index) => {
    const slot = resolveSlot(player.position);
    return {
      id: player.id,
      name: player.name,
      position: player.position || 'center',
      slot: slot.slot,
      x: slot.x,
      y: slot.y,
      active: index === state.currentPlayerIndex,
      kind: player.kind || (player.id === 'human' ? 'human' : 'ai')
    };
  });

  return {
    center: STAGE_LAYOUT.center,
    locations: Object.values(STAGE_LAYOUT.locations),
    players,
    activePlayerId: state?.players?.[state.currentPlayerIndex]?.id || null,
    quality
  };
}
