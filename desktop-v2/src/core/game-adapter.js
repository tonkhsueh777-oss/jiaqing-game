export function createGameAdapter(game) {
  if (!game?.createGameState) throw new Error('V43 core is not loaded');

  return Object.freeze({
    createState: options => game.createGameState(options),
    beginTurn: (state, rng) => game.beginTurn(state, rng),
    completeTurn: (state, rng) => game.completeSingleActionTurn(state, rng),
    finishDiscard: state => game.finishDiscardPhase(state),
    mustDiscard: (state, playerId) => game.mustDiscard(state, playerId),
    legalActions: (state, playerId) => game.getLegalActions(state, playerId),
    runAiTurn: (state, playerId, hooks) => game.runAiTurn(state, playerId, hooks),
    snapshot: state => structuredClone(state),
    play: Object.freeze({
      location: (...args) => game.playLocationCard(...args),
      travel: (...args) => game.playTravelCard(...args),
      inspect: (...args) => game.playInspectCard(...args),
      tactic: (...args) => game.playTacticCard(...args),
      trump: (...args) => game.playTrumpCard(...args),
      discard: (...args) => game.discardCard(...args),
      swapPass: (...args) => game.passTurnBySwappingCard(...args)
    })
  });
}
