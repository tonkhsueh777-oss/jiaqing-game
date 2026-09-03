import './ui/app-shell.css';
import { loadV43Core } from './core/v43-bootstrap.js';
import { createGameAdapter } from './core/game-adapter.js';
import { createPlatformApi } from './platform/platform-api.js';
import { createDesktopSession } from './state/desktop-session.js';
import { renderAppShell } from './ui/app-shell.js';

async function boot() {
  const game = await loadV43Core();
  const adapter = createGameAdapter(game);
  const platform = await createPlatformApi();
  const session = await createDesktopSession({ adapter, platform });
  const root = document.querySelector('#app');
  if (!root) throw new Error('V2 app root not found');

  renderAppShell(root, session);
  root.querySelector('[data-action="toggle-fullscreen"]')?.addEventListener('click', () => {
    platform.window.toggleFullscreen();
  });
}

boot().catch(error => {
  console.error(error);
  const root = document.querySelector('#app');
  if (root) root.textContent = `V2 启动失败：${error.message}`;
});
