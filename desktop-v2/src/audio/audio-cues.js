export function cueForPresentation(effect) {
  switch (effect?.kind) {
    case 'card-reveal': return 'reveal';
    case 'draw-card':
    case 'draw-hidden': return 'draw';
    case 'move': return 'move';
    case 'swap': return 'swap';
    case 'burn': return 'fire';
    case 'lock': return 'tactic';
    case 'treasure': return 'treasure';
    case 'location-open': return 'location';
    case 'treasure-swap': return 'trump';
    case 'discard': return 'discard';
    case 'victory': return 'victory';
    case 'defeat': return 'defeat';
    default: return null;
  }
}

export function cueForTurnEvent(event) {
  if (!event) return null;
  if (event.type === 'human-ready') return 'your-turn';
  if (event.type === 'ai-thinking') return 'ai-turn';
  if (event.type === 'human-error') return 'error';
  if (event.type === 'turn-start' && event.result?.skipped) return 'skip';
  return null;
}
