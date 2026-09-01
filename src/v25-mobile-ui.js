(function (root) {
  const game = root.JQGame;
  const layout = game?.MobileLayout;
  if (!game?.UI || !layout || typeof document === 'undefined') return;

  const baseRender = game.UI.render.bind(game.UI);
  const baseSetInteractionMode = game.UI.setInteractionMode.bind(game.UI);
  const media = root.matchMedia?.('(max-width: 768px)') || null;
  let lastState = null;
  let resizeFrame = 0;

  function isMobile() {
    return media ? media.matches : root.innerWidth <= 768;
  }

  function tokenOffset(index, total) {
    if (total <= 1) return { x: 0, y: 0 };
    if (total === 2) return [{ x: -11, y: -7 }, { x: 11, y: -7 }][index] || { x: 0, y: 0 };
    return [{ x: -12, y: -8 }, { x: 12, y: -8 }, { x: 0, y: 11 }][index] || { x: 0, y: 0 };
  }

  function applyMobileBoard(state) {
    if (!isMobile()) return;
    const overlay = document.getElementById('board-overlay');
    if (!overlay) return;

    for (const [locationId, point] of Object.entries(layout.MOBILE_BOARD_SLOTS)) {
      const node = overlay.querySelector(`.board-node[data-location-id="${locationId}"]`);
      const target = overlay.querySelector(`.board-target[data-location-id="${locationId}"]`);
      if (node) {
        node.style.left = `${point.x}%`;
        node.style.top = `${point.y}%`;
      }
      if (target) {
        target.style.left = `${point.x}%`;
        target.style.top = `${point.y}%`;
      }
    }

    const grouped = new Map();
    for (const player of state?.players || []) {
      const list = grouped.get(player.position) || [];
      list.push(player);
      grouped.set(player.position, list);
    }

    for (const [position, players] of grouped.entries()) {
      const point = layout.MOBILE_BOARD_SLOTS[position];
      if (!point) continue;
      players.forEach((player, index) => {
        const token = overlay.querySelector(`.player-token--${player.id}`);
        if (!token) return;
        const offset = tokenOffset(index, players.length);
        token.style.left = `calc(${point.x}% + ${offset.x}px)`;
        token.style.top = `calc(${point.y}% + ${offset.y}px)`;
      });
    }
  }

  function afterRender(state) {
    lastState = state;
    applyMobileBoard(state);
    document.documentElement.classList.toggle('is-v25-mobile', isMobile());
  }

  game.UI.render = function renderV25Mobile(state) {
    baseRender(state);
    afterRender(state);
  };

  game.UI.setInteractionMode = function setInteractionModeV25Mobile(mode, payload) {
    baseSetInteractionMode(mode, payload);
    applyMobileBoard(lastState);
  };

  function rerenderForViewport() {
    if (!lastState || resizeFrame) return;
    resizeFrame = root.requestAnimationFrame(() => {
      resizeFrame = 0;
      game.UI.render(lastState);
    });
  }

  if (media?.addEventListener) media.addEventListener('change', rerenderForViewport);
  else if (media?.addListener) media.addListener(rerenderForViewport);
  root.addEventListener('orientationchange', rerenderForViewport, { passive: true });
})(globalThis);
