(function (root) {
  const game = root.JQGame;
  const logic = game?.VisualEffectsLogic;
  if (!game?.UI || !logic || typeof document === 'undefined') return;

  const baseRender = game.UI.render.bind(game.UI);
  let previous = null;
  let effectQueue = Promise.resolve();
  let audioCtx = null;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const reducedMotion = () => root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const escapeHtml = value => String(value ?? '').replace(/[&<>'\"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[ch]));

  function getAudioContext() {
    try {
      const Ctor = root.AudioContext || root.webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = audioCtx || new Ctor();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      return audioCtx;
    } catch (_) {
      return null;
    }
  }

  function primeAudio() {
    getAudioContext();
  }

  document.addEventListener('pointerdown', primeAudio, { once: true, passive: true });
  document.addEventListener('keydown', primeAudio, { once: true });

  function oscillator({ frequency = 440, endFrequency = frequency, duration = .1, volume = .024, type = 'sine', delay = 0 }) {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (endFrequency !== frequency) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), now + duration);
    }
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(.018, duration * .25));
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + .02);
  }

  function noise({ duration = .08, volume = .012, delay = 0, highpass = 600 }) {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(ctx.currentTime + delay);
  }

  function playSound(kind) {
    if (!kind) return;
    if (kind === 'move') {
      noise({ duration: .11, volume: .010, highpass: 900 });
      oscillator({ frequency: 300, endFrequency: 410, duration: .10, volume: .018 });
      return;
    }
    if (kind === 'location') {
      oscillator({ frequency: 294, duration: .14, volume: .022, type: 'triangle' });
      oscillator({ frequency: 440, duration: .18, volume: .018, type: 'triangle', delay: .08 });
      return;
    }
    if (kind === 'command') {
      oscillator({ frequency: 155, endFrequency: 210, duration: .16, volume: .026, type: 'sawtooth' });
      oscillator({ frequency: 310, duration: .10, volume: .014, delay: .05 });
      return;
    }
    if (kind === 'turn') {
      oscillator({ frequency: 523, duration: .12, volume: .014, type: 'triangle' });
      return;
    }
    if (kind === 'skip') {
      oscillator({ frequency: 220, endFrequency: 145, duration: .18, volume: .018, type: 'triangle' });
      return;
    }
    if (kind === 'discard') {
      noise({ duration: .07, volume: .012, highpass: 1200 });
      oscillator({ frequency: 260, endFrequency: 210, duration: .07, volume: .010 });
      return;
    }
    if (kind === 'end') {
      oscillator({ frequency: 392, endFrequency: 330, duration: .09, volume: .010 });
      return;
    }
    if (kind === 'treasure') {
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        oscillator({ frequency, duration: .32 + index * .04, volume: .024, type: 'triangle', delay: index * .07 });
      });
      oscillator({ frequency: 1046.5, duration: .26, volume: .012, type: 'sine', delay: .25 });
      return;
    }
    if (kind === 'victory') {
      [392, 523.25, 659.25, 783.99].forEach((frequency, index) => {
        oscillator({ frequency, duration: .52, volume: .025, type: 'triangle', delay: index * .09 });
      });
      oscillator({ frequency: 1046.5, duration: .62, volume: .018, type: 'sine', delay: .34 });
      return;
    }
    if (kind === 'defeat') {
      oscillator({ frequency: 330, endFrequency: 247, duration: .42, volume: .024, type: 'triangle' });
      oscillator({ frequency: 220, endFrequency: 147, duration: .68, volume: .027, type: 'sine', delay: .16 });
      oscillator({ frequency: 147, endFrequency: 110, duration: .74, volume: .018, type: 'triangle', delay: .48 });
      noise({ duration: .32, volume: .006, delay: .22, highpass: 180 });
      return;
    }
  }

  function particlesMarkup() {
    return Array.from({ length: 18 }, (_, index) => {
      const angle = index * 20;
      const distance = 115 + (index % 4) * 18;
      const delay = (index % 6) * 28;
      return `<i class="v23-treasure-particle" style="--v23-angle:${angle}deg;--v23-distance:${distance}px;--v23-delay:${delay}ms"></i>`;
    }).join('');
  }

  function ensureFxRoot() {
    let node = document.getElementById('v23-treasure-fx-root');
    if (!node) {
      node = document.createElement('div');
      node.id = 'v23-treasure-fx-root';
      document.body.appendChild(node);
    }
    return node;
  }

  async function flyTreasureToPlayer(cardEl, playerId) {
    const target = document.querySelector(`[data-overview-player="${playerId}"]`);
    if (!target || reducedMotion() || typeof cardEl.animate !== 'function') return;
    const from = cardEl.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const ghost = cardEl.cloneNode(true);
    ghost.classList.add('v23-treasure-fly-ghost');
    Object.assign(ghost.style, {
      left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`
    });
    document.body.appendChild(ghost);
    const dx = (to.left + to.width * .74) - (from.left + from.width / 2);
    const dy = (to.top + to.height * .5) - (from.top + from.height / 2);
    const animation = ghost.animate([
      { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
      { transform: `translate3d(${dx * .52}px,${dy * .32 - 54}px,0) scale(.72)`, opacity: .96, offset: .52 },
      { transform: `translate3d(${dx}px,${dy}px,0) scale(.18)`, opacity: .10 }
    ], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    await animation.finished.catch(() => {});
    ghost.remove();
  }

  async function showTreasureGain(gain, state) {
    const treasure = game.TREASURES?.[gain.treasureId];
    if (!treasure) return;
    const player = state?.players?.find?.(item => item.id === gain.playerId);
    const playerName = player?.id === 'human' ? '玩家（你）' : (player?.name || '玩家');
    const rootNode = ensureFxRoot();
    rootNode.innerHTML = `
      <div class="v23-treasure-fx" role="status" aria-live="polite">
        <div class="v23-treasure-fx__shade"></div>
        <div class="v23-treasure-fx__burst"></div>
        <div class="v23-treasure-fx__particles">${particlesMarkup()}</div>
        <div class="v23-treasure-fx__content">
          <div class="v23-treasure-fx__eyebrow">获得宝物</div>
          <div class="v23-treasure-fx__card">
            <span class="v23-treasure-fx__halo"></span>
            <img src="${escapeHtml(treasure.asset)}" alt="${escapeHtml(treasure.name)}">
          </div>
          <div class="v23-treasure-fx__name">${escapeHtml(treasure.name)}${gain.amount > 1 ? ` ×${gain.amount}` : ''}</div>
          <div class="v23-treasure-fx__owner">${escapeHtml(playerName)} · 宝物入手</div>
        </div>
      </div>`;
    const fx = rootNode.firstElementChild;
    const cardEl = fx?.querySelector('.v23-treasure-fx__card');
    playSound('treasure');
    fx?.classList.add('is-visible');
    if (reducedMotion()) {
      await sleep(420);
    } else {
      await sleep(980);
      if (cardEl) await flyTreasureToPlayer(cardEl, gain.playerId);
      await sleep(180);
    }
    fx?.classList.add('is-leaving');
    await sleep(reducedMotion() ? 50 : 240);
    rootNode.innerHTML = '';
  }

  function processVisualEvents(state, snapshot) {
    if (!previous) return;
    if (snapshot.logLength < previous.logLength) return;

    const gains = logic.detectTreasureGains(previous, snapshot);
    const newLogs = Array.isArray(state.log) ? state.log.slice(previous.logLength) : [];
    const hasGain = gains.length > 0;

    newLogs.forEach(line => {
      const kind = logic.classifyLog(line);
      if (kind && !(kind === 'treasure' && hasGain)) playSound(kind);
    });

    gains.forEach(gain => {
      effectQueue = effectQueue.then(() => showTreasureGain(gain, state));
    });

    if (!previous.winnerId && snapshot.winnerId && !game.EndgamePresentation) {
      effectQueue = effectQueue.then(async () => {
        playSound('victory');
        await sleep(120);
      });
    }
  }

  game.UI.render = function renderWithV23VisualEffects(state) {
    const snapshot = logic.snapshotState(state);
    baseRender(state);
    processVisualEvents(state, snapshot);
    previous = snapshot;
  };

  game.UI.V23VisualEffects = { playSound, whenIdle: () => effectQueue };
})(globalThis);
