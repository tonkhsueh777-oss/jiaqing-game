(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.JQGame = root.JQGame || {};
    root.JQGame.DesktopCardMotion = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CARD_SELECTOR = '[data-card-id], .pile-card, .location-card-on-board';
  let boundContainer = null;
  let activeCard = null;
  let moveHandler = null;
  let overHandler = null;
  let outHandler = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function tiltFromPointer(x, y, width, height, maxTilt = 5) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !width || !height) return { x: 0, y: 0 };
    const nx = clamp((x / width - 0.5) * 2, -1, 1);
    const ny = clamp((y / height - 0.5) * 2, -1, 1);
    return {
      x: Number((-ny * maxTilt).toFixed(3)),
      y: Number((nx * maxTilt).toFixed(3))
    };
  }

  function findCard(target) {
    return target?.closest?.(CARD_SELECTOR) || null;
  }

  function resetCard(card) {
    if (!card) return;
    card.classList?.remove('desktop-card-hover');
    card.style?.removeProperty('--tilt-x');
    card.style?.removeProperty('--tilt-y');
  }

  function activateCard(card) {
    if (activeCard && activeCard !== card) resetCard(activeCard);
    activeCard = card;
    activeCard?.classList?.add('desktop-card-hover');
  }

  function bind(container, options = {}) {
    unbind();
    if (!container?.addEventListener) return false;
    boundContainer = container;
    const reducedMotion = Boolean(options.reducedMotion);

    overHandler = event => {
      const card = findCard(event.target);
      if (!card || !boundContainer.contains(card)) return;
      activateCard(card);
    };

    moveHandler = event => {
      const card = findCard(event.target);
      if (!card || card !== activeCard || reducedMotion) return;
      const rect = card.getBoundingClientRect?.();
      if (!rect?.width || !rect?.height) return;
      const tilt = tiltFromPointer(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);
      card.style.setProperty('--tilt-x', `${tilt.x}deg`);
      card.style.setProperty('--tilt-y', `${tilt.y}deg`);
    };

    outHandler = event => {
      const card = findCard(event.target);
      if (!card || card !== activeCard) return;
      if (event.relatedTarget && card.contains?.(event.relatedTarget)) return;
      resetCard(card);
      activeCard = null;
    };

    container.addEventListener('pointerover', overHandler);
    container.addEventListener('pointermove', moveHandler);
    container.addEventListener('pointerout', outHandler);
    return true;
  }

  function unbind() {
    if (boundContainer) {
      if (overHandler) boundContainer.removeEventListener('pointerover', overHandler);
      if (moveHandler) boundContainer.removeEventListener('pointermove', moveHandler);
      if (outHandler) boundContainer.removeEventListener('pointerout', outHandler);
    }
    resetCard(activeCard);
    boundContainer = null;
    activeCard = null;
    moveHandler = null;
    overHandler = null;
    outHandler = null;
  }

  return { CARD_SELECTOR, tiltFromPointer, bind, unbind };
});
