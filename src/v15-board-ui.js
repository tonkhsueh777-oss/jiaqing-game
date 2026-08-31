(function (root) {
  const game = root.JQGame;
  if (!game?.UI) return;

  const DISPLAY_SLOTS = {
    center: { x: 50, y: 50 },
    tainan: { x: 50, y: 22 },
    mengxia: { x: 75, y: 50 },
    zhuluo: { x: 25, y: 50 },
    madou: { x: 50, y: 78 }
  };

  const sourceSlots = game.UI.BOARD_SLOTS || {
    center: { x: 50, y: 50 },
    tainan: { x: 50, y: 20 },
    mengxia: { x: 79, y: 50 },
    zhuluo: { x: 21, y: 50 },
    madou: { x: 50, y: 80 }
  };

  const baseRender = game.UI.render.bind(game.UI);
  const baseSetInteractionMode = game.UI.setInteractionMode.bind(game.UI);
  let lastState = null;

  function samePoint(element, point) {
    if (!element || !point) return false;
    return Math.abs(parseFloat(element.style.left) - point.x) < 0.01 &&
      Math.abs(parseFloat(element.style.top) - point.y) < 0.01;
  }

  function tokenOffset(index, total) {
    if (total <= 1) return { x: 0, y: 0 };
    const offsets = [{ x: -20, y: -14 }, { x: 20, y: -14 }, { x: 0, y: 20 }];
    return offsets[index] || { x: 0, y: 0 };
  }

  function compactBoard(state) {
    const overlay = document.getElementById('board-overlay');
    if (!overlay) return;

    const nodes = Array.from(overlay.querySelectorAll('.board-node'));
    const targets = Array.from(overlay.querySelectorAll('.board-target'));

    for (const [locationId, oldPoint] of Object.entries(sourceSlots)) {
      const nextPoint = DISPLAY_SLOTS[locationId] || oldPoint;
      const node = nodes.find(element => samePoint(element, oldPoint));
      if (node) {
        node.style.left = `${nextPoint.x}%`;
        node.style.top = `${nextPoint.y}%`;
        node.dataset.locationId = locationId;
      }

      const target = targets.find(element => samePoint(element, oldPoint));
      if (target) {
        target.style.left = `${nextPoint.x}%`;
        target.style.top = `${nextPoint.y}%`;
        target.dataset.locationId = locationId;
      }
    }

    if (!state?.players) return;
    const grouped = new Map();
    for (const player of state.players) {
      const list = grouped.get(player.position) || [];
      list.push(player);
      grouped.set(player.position, list);
    }

    for (const [position, players] of grouped.entries()) {
      const point = DISPLAY_SLOTS[position];
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

  game.UI.render = function renderV15Board(state) {
    lastState = state;
    baseRender(state);
    compactBoard(state);
  };

  game.UI.setInteractionMode = function setInteractionModeV15Board(mode, payload) {
    baseSetInteractionMode(mode, payload);
    compactBoard(lastState);
  };

  game.UI.DISPLAY_BOARD_SLOTS = DISPLAY_SLOTS;
})(globalThis);
