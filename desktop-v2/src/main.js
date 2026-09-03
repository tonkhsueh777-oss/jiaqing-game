import './ui/app-shell.css';
import './ui/hud.css';
import { loadV43Core } from './core/v43-bootstrap.js';
import { createGameAdapter } from './core/game-adapter.js';
import { createPlatformApi } from './platform/platform-api.js';
import { createDesktopSession } from './state/desktop-session.js';
import { renderAppShell } from './ui/app-shell.js';
import { renderHud } from './ui/hud-view.js';
import { mountStage } from './stage/stage-view.js';

function qualityFromRoot(root) {
  return root.dataset.quality || 'standard';
}

async function boot() {
  const game = await loadV43Core();
  const adapter = createGameAdapter(game);
  const platform = await createPlatformApi();
  const session = await createDesktopSession({ adapter, platform });
  const root = document.querySelector('#app');
  if (!root) throw new Error('V2 app root not found');

  root.dataset.quality = 'standard';
  renderAppShell(root, session);
  let selectedRuntimeId = null;
  let hud = renderHud(root, game, session, selectedRuntimeId);

  const stageHost = root.querySelector('#v2-stage-canvas-host');
  const stage = await mountStage(stageHost, session, { quality: qualityFromRoot(root) });

  function refresh() {
    hud = renderHud(root, game, session, selectedRuntimeId);
    stage.render(session.state, { quality: qualityFromRoot(root) });
  }

  root.addEventListener('click', event => {
    const cardButton = event.target.closest?.('[data-card-id]');
    if (cardButton) {
      selectedRuntimeId = selectedRuntimeId === cardButton.dataset.cardId ? null : cardButton.dataset.cardId;
      refresh();
      return;
    }
  });

  root.querySelector('[data-action="toggle-fullscreen"]')?.addEventListener('click', () => {
    platform.window.toggleFullscreen();
  });

  root.querySelectorAll('[data-quality]').forEach(button => {
    button.addEventListener('click', () => {
      const quality = button.dataset.quality === 'low' ? 'low' : 'standard';
      root.dataset.quality = quality;
      root.querySelectorAll('[data-quality]').forEach(item => item.classList.toggle('is-active', item === button));
      stage.render(session.state, { quality });
    });
  });

  window.addEventListener('resize', () => stage.render(session.state, { quality: qualityFromRoot(root) }));
  void hud;
}

boot().catch(error => {
  console.error(error);
  const root = document.querySelector('#app');
  if (root) root.textContent = `V2 启动失败：${error.message}`;
});
