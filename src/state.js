(function (root) {
  const game = root.JQGame;

  function makePlayer(id, name, kind) {
    return {
      id,
      name,
      kind,
      hand: [],
      position: 'center',
      treasures: { goldSeal: 0, sword: 0, gun: 0, pomelo: 0 },
      skipTurns: 0,
      lastAction: ''
    };
  }

  game.shuffle = function shuffle(array, rng = Math.random) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  game.recycleDiscardIntoDeck = function recycleDiscardIntoDeck(state, rng = Math.random) {
    if (!state.discardPile.length) return;
    state.drawPile = game.shuffle(state.discardPile, rng);
    state.discardPile = [];
    state.log.push('弃牌堆重新洗牌，成为新的公共抽牌堆。');
  };

  game.drawCard = function drawCard(state, playerId, rng = Math.random) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return { card: null, state };

    if (state.drawPile.length === 0) {
      game.recycleDiscardIntoDeck(state, rng);
    }

    if (state.drawPile.length === 0) {
      state.log.push('牌堆与弃牌堆均为空，本回合无法摸牌。');
      return { card: null, state };
    }

    const card = state.drawPile.pop();
    player.hand.push(card);
    return { card, state };
  };

  game.refillHandToLimit = function refillHandToLimit(state, playerId, limit = 3, rng = Math.random) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return { cards: [], state };

    const cards = [];
    while (player.hand.length < limit) {
      const { card } = game.drawCard(state, playerId, rng);
      if (!card) break;
      cards.push(card);
    }
    return { cards, state };
  };

  game.createGameState = function createGameState(options = {}) {
    const rng = options.rng || Math.random;
    const deck = game.buildDeckDefinition().map((card, index) => ({
      ...card,
      runtimeId: `card-${String(index + 1).padStart(4, '0')}`
    }));

    const state = {
      players: [
        makePlayer('human', '玩家', 'human'),
        makePlayer('ai1', 'AI 玩家一', 'ai'),
        makePlayer('ai2', 'AI 玩家二', 'ai')
      ],
      drawPile: game.shuffle(deck, rng),
      discardPile: [],
      treasureStock: { goldSeal: 3, sword: 3, gun: 3, pomelo: 3 },
      openedLocations: {},
      locationCards: {},
      currentPlayerIndex: 0,
      phase: 'setup',
      winnerId: null,
      turnNumber: 1,
      log: ['御前争霸开始。三名玩家均从中央起点出发。']
    };

    for (const player of state.players) {
      game.refillHandToLimit(state, player.id, 3, rng);
    }
    return state;
  };
})(globalThis);
