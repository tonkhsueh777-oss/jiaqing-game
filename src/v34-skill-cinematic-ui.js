(function (root) {
  const game = root.JQGame;
  const logic = game?.SkillCinematicLogic;
  if (!game || !logic || typeof document === 'undefined') return;

  let overlay = null;
  let video = null;
  let title = null;
  let active = false;
  let activeObjectUrl = null;
  let bundlePromise = null;

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'skill-cinematic';
    overlay.className = 'skill-cinematic';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="skill-cinematic__backdrop"></div>
      <div class="skill-cinematic__frame" role="dialog" aria-modal="true" aria-label="技能动画">
        <video class="skill-cinematic__video" playsinline preload="auto"></video>
        <div class="skill-cinematic__flare" aria-hidden="true"></div>
        <div class="skill-cinematic__title" aria-live="polite"></div>
      </div>`;
    document.body.appendChild(overlay);
    video = overlay.querySelector('.skill-cinematic__video');
    title = overlay.querySelector('.skill-cinematic__title');
    return overlay;
  }

  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('skill-cinematic-active');
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    if (activeObjectUrl) {
      URL.revokeObjectURL(activeObjectUrl);
      activeObjectUrl = null;
    }
    if (title) {
      title.textContent = '';
      title.classList.remove('is-visible');
    }
    active = false;
  }

  async function loadBundleBytes() {
    if (!bundlePromise) {
      bundlePromise = fetch(`${logic.BUNDLE_SRC}?v=34`, { cache: 'force-cache' })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.text();
        })
        .then(text => {
          const encoded = text.trim();
          if (!encoded) throw new Error('empty cinematic bundle');
          const binary = atob(encoded);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
          return bytes;
        })
        .catch(error => {
          bundlePromise = null;
          throw error;
        });
    }
    return bundlePromise;
  }

  async function resolveVideoSource(definition) {
    try {
      if (Array.isArray(definition.range)) {
        const [offset, length] = definition.range;
        const bundle = await loadBundleBytes();
        const bytes = bundle.slice(offset, offset + length);
        activeObjectUrl = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
        return activeObjectUrl;
      }
    } catch (_) {}

    const encodedPath = logic.encodedAssetPath(definition.src);
    try {
      const response = await fetch(`${encodedPath}?v=34`, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const encoded = (await response.text()).trim();
      if (!encoded) throw new Error('empty video payload');
      const binary = atob(encoded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      activeObjectUrl = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
      return activeObjectUrl;
    } catch (_) {
      return `${definition.src}?v=34`;
    }
  }

  async function playCard(card) {
    const definition = logic.getCinematic(card?.key);
    if (!definition || active) return false;
    ensureOverlay();
    active = true;

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('skill-cinematic-active');
    title.textContent = definition.title;
    title.classList.remove('is-visible');
    video.src = await resolveVideoSource(definition);
    video.currentTime = 0;
    video.muted = false;

    return new Promise(resolve => {
      let finished = false;
      let hardStop = null;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(hardStop);
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('ended', finish);
        video.removeEventListener('error', onError);
        closeOverlay();
        resolve(true);
      };
      const onTimeUpdate = () => {
        if (video.currentTime >= 5) title.classList.add('is-visible');
      };
      const onError = () => {
        title.classList.add('is-visible');
        setTimeout(finish, 900);
      };

      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('ended', finish, { once: true });
      video.addEventListener('error', onError, { once: true });
      hardStop = setTimeout(finish, definition.durationMs + 650);

      const started = video.play();
      if (started?.catch) {
        started.catch(() => {
          video.muted = true;
          video.play().catch(onError);
        });
      }
    });
  }

  game.SkillCinematic = { playCard, close: closeOverlay, isActive: () => active };
})(globalThis);
