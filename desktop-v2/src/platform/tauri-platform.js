import { getCurrentWindow } from '@tauri-apps/api/window';
import { createBrowserPlatform } from './browser-platform.js';

export function createTauriPlatform() {
  const base = createBrowserPlatform();
  const appWindow = getCurrentWindow();

  return {
    ...base,
    window: {
      async toggleFullscreen() {
        const next = !(await appWindow.isFullscreen());
        await appWindow.setFullscreen(next);
        return next;
      },
      async isFullscreen() {
        return appWindow.isFullscreen();
      }
    }
  };
}
