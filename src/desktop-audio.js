(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.JQGame = root.JQGame || {};
    root.JQGame.DesktopAudio = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STORAGE_KEY = 'jiaqing.desktop.audio.v1';
  const DEFAULTS = Object.freeze({ master: 0.8, music: 0.45, effects: 0.82 });

  function clampVolume(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(1, numeric));
  }

  function normalizeVolumes(input = {}) {
    return {
      master: clampVolume(input.master ?? DEFAULTS.master),
      music: clampVolume(input.music ?? DEFAULTS.music),
      effects: clampVolume(input.effects ?? DEFAULTS.effects)
    };
  }

  function loadVolumes(storage = globalThis.localStorage) {
    try {
      const raw = storage?.getItem?.(STORAGE_KEY);
      return raw ? normalizeVolumes(JSON.parse(raw)) : { ...DEFAULTS };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  function saveVolumes(volumes, storage = globalThis.localStorage) {
    const normalized = normalizeVolumes(volumes);
    try {
      storage?.setItem?.(STORAGE_KEY, JSON.stringify(normalized));
      return true;
    } catch (_) {
      return false;
    }
  }

  function createController(options = {}) {
    const storage = options.storage || globalThis.localStorage;
    const AudioCtor = options.AudioCtor || globalThis.Audio;
    let volumes = loadVolumes(storage);
    const active = new Set();

    function setVolumes(next = {}) {
      volumes = normalizeVolumes({ ...volumes, ...next });
      saveVolumes(volumes, storage);
      return { ...volumes };
    }

    function getVolumes() {
      return { ...volumes };
    }

    async function play(src, playOptions = {}) {
      if (!src || typeof AudioCtor !== 'function') return false;
      const channel = playOptions.channel === 'music' ? 'music' : 'effects';
      const volume = clampVolume(volumes.master * volumes[channel] * clampVolume(playOptions.gain ?? 1));
      if (volume <= 0) return false;
      try {
        const audio = new AudioCtor(src);
        audio.volume = volume;
        audio.loop = Boolean(playOptions.loop);
        active.add(audio);
        const cleanup = () => active.delete(audio);
        audio.addEventListener?.('ended', cleanup, { once: true });
        audio.addEventListener?.('error', cleanup, { once: true });
        await audio.play?.();
        return true;
      } catch (_) {
        return false;
      }
    }

    function stopAll() {
      active.forEach(audio => {
        try {
          audio.pause?.();
          audio.currentTime = 0;
        } catch (_) {}
      });
      active.clear();
    }

    return { getVolumes, setVolumes, play, stopAll };
  }

  return { STORAGE_KEY, DEFAULTS, clampVolume, normalizeVolumes, loadVolumes, saveVolumes, createController };
});
