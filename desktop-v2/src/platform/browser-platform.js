export function createBrowserPlatform({ storage = globalThis.localStorage } = {}) {
  const SAVE_KEY = 'jiaqing-v2-save';
  const SETTINGS_PREFIX = 'jiaqing-v2-setting:';

  return {
    window: {
      async toggleFullscreen() {
        if (typeof document === 'undefined') return false;
        if (!document.fullscreenElement) await document.documentElement?.requestFullscreen?.();
        else await document.exitFullscreen?.();
        return Boolean(document.fullscreenElement);
      },
      async isFullscreen() {
        return typeof document !== 'undefined' && Boolean(document.fullscreenElement);
      }
    },
    settings: {
      async get(key, fallback) {
        const raw = storage?.getItem?.(SETTINGS_PREFIX + key);
        return raw == null ? fallback : JSON.parse(raw);
      },
      async set(key, value) {
        storage?.setItem?.(SETTINGS_PREFIX + key, JSON.stringify(value));
      }
    },
    save: {
      async load() {
        const raw = storage?.getItem?.(SAVE_KEY);
        return raw ? JSON.parse(raw) : null;
      },
      async write(state) {
        storage?.setItem?.(SAVE_KEY, JSON.stringify(state));
      },
      async clear() {
        storage?.removeItem?.(SAVE_KEY);
      }
    }
  };
}
