import { createBrowserPlatform } from './browser-platform.js';

export async function createPlatformApi() {
  if (!globalThis.__TAURI_INTERNALS__) return createBrowserPlatform();
  const { createTauriPlatform } = await import('./tauri-platform.js');
  return createTauriPlatform();
}
