(function (root) {
  const game = root.JQGame;
  const math = game?.DrawRitual;
  if (!game?.UI || !math || typeof document === 'undefined') return;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const reduceMotion = () => root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  function ensureRoot() {
    let node = document.getElementById('draw-ritual-root');
    if (!node) {
      node = document.createElement('div');
      node.id = 'draw-ritual-root';
      document.body.appendChild(node);
    }
    return node;
  }

  function cardBack() {
    return game.CATALOG?.cardBack || '';
  }

  function buzz(pattern) {
    try { root.navigator?.vibrate?.(pattern); } catch (_) {}
  }

  function tone(kind) {
    try {
      const AudioCtor = root.AudioContext || root.webkitAudioContext;
      if (!AudioCtor) return;
      const ctx = tone.ctx || (tone.ctx = new AudioCtor());
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const start = kind === 'commit' ? 390 : kind === 'reveal' ? 540 : 250;
      const end = kind === 'commit' ? 560 : kind === 'reveal' ? 760 : 320;
      osc.type = kind === 'reveal' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(start, now);
      osc.frequency.exponentialRampToValueAtTime(end, now + 0.07);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(kind === 'reveal' ? 0.05 : 0.025, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch (_) {}
  }

  function ritualMarkup(card, interactive) {
    const front = card?.asset || cardBack();
    const label = interactive ? '搓牌揭晓' : '补牌揭晓';
    return `
      <div class="draw-ritual-overlay is-open" role="dialog" aria-modal="true" aria-label="${label}">
        <div class="draw-ritual-vignette"></div>
        <div class="draw-ritual-stage">
          <div class="draw-ritual-title">${label}</div>
          <div class="draw-ritual-stack" aria-hidden="true">
            <img src="${cardBack()}" alt="">
            <img src="${cardBack()}" alt="">
          </div>
          <div class="draw-ritual-card" tabindex="0" role="button" aria-label="按住并向上搓出牌">
            <div class="draw-ritual-card__inner">
              <div class="draw-ritual-card__face draw-ritual-card__back"><img src="${cardBack()}" alt="牌背"></div>
              <div class="draw-ritual-card__face draw-ritual-card__front"><img src="${front}" alt="${card?.name || '新牌'}"></div>
            </div>
            <div class="draw-ritual-glint"></div>
          </div>
          <div class="draw-ritual-meter"><span></span></div>
          <div class="draw-ritual-prompt">${interactive ? math.dragPrompt(0) : '新牌正在入手…'}</div>
          <div class="draw-ritual-subprompt">${interactive ? '未过临界点松手，牌会退回牌堆' : '保持未知，直到翻牌瞬间'}</div>
        </div>
      </div>`;
  }

  function setPull(cardEl, meterEl, promptEl, progress, tilt) {
    const lift = Math.round(progress * 118);
    cardEl.style.setProperty('--ritual-lift', `${lift}px`);
    cardEl.style.setProperty('--ritual-tilt', `${tilt}deg`);
    cardEl.style.setProperty('--ritual-progress', String(progress));
    meterEl.style.setProperty('--ritual-progress', String(progress));
    promptEl.textContent = math.dragPrompt(progress);
    cardEl.classList.toggle('is-committed', progress >= math.COMMIT_THRESHOLD);
  }

  async function snapBack(cardEl, meterEl, promptEl) {
    cardEl.classList.add('is-snapping-back');
    setPull(cardEl, meterEl, promptEl, 0, 0);
    await sleep(reduceMotion() ? 20 : 260);
    cardEl.classList.remove('is-snapping-back');
  }

  async function revealAndFly(rootNode, cardEl, promptEl, card) {
    promptEl.textContent = '揭牌';
    cardEl.classList.add('is-revealing');
    tone('reveal');
    buzz(22);
    await sleep(reduceMotion() ? 40 : 520);
    cardEl.classList.add('is-revealed');
    promptEl.textContent = card?.name || '新牌入手';
    await sleep(reduceMotion() ? 40 : 620);

    const target = document.querySelector('.hand-zone');
    if (target && cardEl.animate && !reduceMotion()) {
      const from = cardEl.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const dx = (to.left + to.width * 0.68) - (from.left + from.width / 2);
      const dy = (to.top + to.height * 0.48) - (from.top + from.height / 2);
      const animation = cardEl.animate([
        { transform: 'translate3d(0,0,0) scale(1) rotate(0deg)', opacity: 1 },
        { transform: `translate3d(${dx * 0.55}px,${dy * 0.25 - 36}px,0) scale(.82) rotate(2deg)`, opacity: 1, offset: .55 },
        { transform: `translate3d(${dx}px,${dy}px,0) scale(.46) rotate(-2deg)`, opacity: .15 }
      ], { duration: 520, easing: 'cubic-bezier(.2,.82,.22,1)', fill: 'forwards' });
      await animation.finished.catch(() => {});
    } else {
      await sleep(reduceMotion() ? 20 : 220);
    }
    rootNode.innerHTML = '';
  }

  async function interactiveCard(rootNode, card) {
    rootNode.innerHTML = ritualMarkup(card, true);
    const cardEl = rootNode.querySelector('.draw-ritual-card');
    const meterEl = rootNode.querySelector('.draw-ritual-meter');
    const promptEl = rootNode.querySelector('.draw-ritual-prompt');
    let startX = 0;
    let startY = 0;
    let progress = 0;
    let dragging = false;
    let committedBuzzed = false;

    const finishReveal = async () => {
      cardEl.style.pointerEvents = 'none';
      setPull(cardEl, meterEl, promptEl, 1, 0);
      tone('commit');
      buzz(14);
      await sleep(reduceMotion() ? 20 : 120);
      await revealAndFly(rootNode, cardEl, promptEl, card);
    };

    return new Promise(resolve => {
      const pointerDown = event => {
        dragging = true;
        startX = event.clientX;
        startY = event.clientY;
        progress = 0;
        committedBuzzed = false;
        cardEl.setPointerCapture?.(event.pointerId);
        cardEl.classList.add('is-dragging');
        tone('touch');
      };
      const pointerMove = event => {
        if (!dragging) return;
        const distance = Math.max(0, startY - event.clientY);
        progress = math.dragProgress(distance, 168);
        const tilt = math.dragTilt(event.clientX - startX);
        setPull(cardEl, meterEl, promptEl, progress, tilt);
        if (progress >= math.COMMIT_THRESHOLD && !committedBuzzed) {
          committedBuzzed = true;
          tone('commit');
          buzz(10);
        }
      };
      const pointerUp = async event => {
        if (!dragging) return;
        dragging = false;
        cardEl.releasePointerCapture?.(event.pointerId);
        cardEl.classList.remove('is-dragging');
        if (math.releaseOutcome(progress) === 'reveal') {
          await finishReveal();
          resolve();
        } else {
          await snapBack(cardEl, meterEl, promptEl);
        }
      };

      cardEl.addEventListener('pointerdown', pointerDown);
      cardEl.addEventListener('pointermove', pointerMove);
      cardEl.addEventListener('pointerup', pointerUp);
      cardEl.addEventListener('pointercancel', pointerUp);
      cardEl.addEventListener('keydown', async event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          await finishReveal();
          resolve();
        }
      });
    });
  }

  async function automaticCard(rootNode, card) {
    rootNode.innerHTML = ritualMarkup(card, false);
    const cardEl = rootNode.querySelector('.draw-ritual-card');
    const meterEl = rootNode.querySelector('.draw-ritual-meter');
    const promptEl = rootNode.querySelector('.draw-ritual-prompt');
    if (reduceMotion()) {
      await revealAndFly(rootNode, cardEl, promptEl, card);
      return;
    }
    await sleep(120);
    cardEl.classList.add('is-auto-pulling');
    setPull(cardEl, meterEl, promptEl, .68, -1.5);
    await sleep(330);
    tone('commit');
    setPull(cardEl, meterEl, promptEl, 1, 0);
    await sleep(100);
    await revealAndFly(rootNode, cardEl, promptEl, card);
  }

  game.UI.showDrawRitual = async function showDrawRitual(cards, options = {}) {
    const list = Array.isArray(cards) ? cards.filter(Boolean) : cards ? [cards] : [];
    if (!list.length) return;
    const rootNode = ensureRoot();
    document.body.classList.add('draw-ritual-active');
    try {
      for (const card of list) {
        if (options.interactive) await interactiveCard(rootNode, card);
        else await automaticCard(rootNode, card);
      }
    } finally {
      rootNode.innerHTML = '';
      document.body.classList.remove('draw-ritual-active');
    }
  };
})(globalThis);
