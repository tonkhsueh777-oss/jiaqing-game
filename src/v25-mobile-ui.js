(function (root) {
  const game = root.JQGame;
  const layout = game?.MobileLayout;
  if (!game?.UI || !layout || typeof document === 'undefined') return;

  const baseRender = game.UI.render.bind(game.UI);
  const baseSetInteractionMode = game.UI.setInteractionMode.bind(game.UI);
  const media = root.matchMedia?.('(max-width: 768px)') || null;
  let lastState = null;
  let resizeFrame = 0;
  let settleFrame = 0;

  const SOURCE_SLOTS = {
    center: { x: 50, y: 50 },
    tainan: { x: 50, y: 20 },
    mengxia: { x: 79, y: 50 },
    zhuluo: { x: 21, y: 50 },
    madou: { x: 50, y: 80 }
  };

  const COMPACT_SLOTS = {
    center: { x: 50, y: 48 },
    tainan: { x: 50, y: 22 },
    mengxia: { x: 71, y: 48 },
    zhuluo: { x: 29, y: 48 },
    madou: { x: 50, y: 74 }
  };

  function isMobile() {
    return media ? media.matches : root.innerWidth <= 768;
  }

  function tokenOffset(index, total) {
    if (total <= 1) return { x: 0, y: 0 };
    if (total === 2) return [{ x: -11, y: -7 }, { x: 11, y: -7 }][index] || { x: 0, y: 0 };
    return [{ x: -12, y: -8 }, { x: 12, y: -8 }, { x: 0, y: 11 }][index] || { x: 0, y: 0 };
  }

  function samePoint(element, point) {
    if (!element || !point) return false;
    const left = parseFloat(element.style.left);
    const top = parseFloat(element.style.top);
    return Number.isFinite(left) && Number.isFinite(top) &&
      Math.abs(left - point.x) < 0.05 && Math.abs(top - point.y) < 0.05;
  }

  function findLocationNode(overlay, locationId) {
    if (locationId === 'center') return overlay.querySelector('.board-node--center');

    const byData = overlay.querySelector(`.board-node[data-location-id="${locationId}"]`);
    if (byData) return byData;

    const nodes = Array.from(overlay.querySelectorAll('.board-node--location'));
    const sourcePoint = SOURCE_SLOTS[locationId];
    const compactPoint = COMPACT_SLOTS[locationId];
    const byPoint = nodes.find(node => samePoint(node, sourcePoint) || samePoint(node, compactPoint));
    if (byPoint) return byPoint;

    const expectedName = game.LOCATIONS?.[locationId]?.name;
    if (!expectedName) return null;
    return nodes.find(node => node.querySelector('.board-node__title')?.textContent?.trim() === expectedName) || null;
  }

  function forcePoint(element, point) {
    if (!element || !point) return;
    element.style.setProperty('left', `${point.x}%`, 'important');
    element.style.setProperty('top', `${point.y}%`, 'important');
  }

  function applyMobileBoard(state) {
    if (!isMobile()) return;
    const overlay = document.getElementById('board-overlay');
    if (!overlay) return;

    for (const [locationId, point] of Object.entries(layout.MOBILE_BOARD_SLOTS)) {
      const node = findLocationNode(overlay, locationId);
      const target = overlay.querySelector(`[data-board-target="${locationId}"]`) ||
        overlay.querySelector(`.board-target[data-location-id="${locationId}"]`);

      if (node) {
        node.dataset.locationId = locationId;
        forcePoint(node, point);
      }
      if (target) {
        target.dataset.locationId = locationId;
        forcePoint(target, point);
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
        token.style.setProperty('left', `calc(${point.x}% + ${offset.x}px)`, 'important');
        token.style.setProperty('top', `calc(${point.y}% + ${offset.y}px)`, 'important');
      });
    }
  }

  function settleMobileBoard(state) {
    applyMobileBoard(state);
    if (settleFrame) root.cancelAnimationFrame?.(settleFrame);
    settleFrame = root.requestAnimationFrame?.(() => {
      settleFrame = 0;
      applyMobileBoard(state);
    }) || 0;
  }

  function afterRender(state) {
    lastState = state;
    document.documentElement.classList.toggle('is-v25-mobile', isMobile());
    settleMobileBoard(state);
  }

  game.UI.render = function renderV25Mobile(state) {
    baseRender(state);
    afterRender(state);
  };

  game.UI.setInteractionMode = function setInteractionModeV25Mobile(mode, payload) {
    baseSetInteractionMode(mode, payload);
    settleMobileBoard(lastState);
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
