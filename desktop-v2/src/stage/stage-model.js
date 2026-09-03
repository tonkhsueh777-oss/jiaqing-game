export const STAGE_LAYOUT = Object.freeze({
  center: Object.freeze({ id: 'center', slot: 'center', x: 0.5, y: 0.50 }),
  locations: Object.freeze({
    tainan: Object.freeze({ id: 'tainan', name: '台南府城', slot: 'north', x: 0.5, y: 0.17, treasure: '金印' }),
    madou: Object.freeze({ id: 'madou', name: '麻豆古镇', slot: 'west', x: 0.22, y: 0.50, treasure: '柚子' }),
    mengxia: Object.freeze({ id: 'mengxia', name: '艋舺', slot: 'east', x: 0.78, y: 0.50, treasure: '火枪' }),
    zhuluo: Object.freeze({ id: 'zhuluo', name: '诸罗大营', slot: 'south', x: 0.5, y: 0.82, treasure: '宝剑' })
  }),
  deck: Object.freeze({
    draw: Object.freeze({ id: 'draw', x: 0.12, y: 0.77 }),
    discard: Object.freeze({ id: 'discard', x: 0.88, y: 0.77 })
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

  const locations = Object.values(STAGE_LAYOUT.locations).map(location => ({
    ...location,
    opened: Boolean(state?.openedLocations?.[location.id])
  }));

  return {
    center: STAGE_LAYOUT.center,
    locations,
    players,
    deck: {
      draw: STAGE_LAYOUT.deck.draw,
      discard: STAGE_LAYOUT.deck.discard,
      drawCount: state?.drawPile?.length || 0,
      discardCount: state?.discardPile?.length || 0,
      topDiscard: state?.discardPile?.length ? { ...state.discardPile[state.discardPile.length - 1] } : null
    },
    activePlayerId: state?.players?.[state.currentPlayerIndex]?.id || null,
    quality
  };
}
