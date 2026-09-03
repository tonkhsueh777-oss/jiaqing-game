import './ui/app-shell.css';
import './ui/hud.css';
import { loadV43Core } from './core/v43-bootstrap.js';
import { createGameAdapter } from './core/game-adapter.js';
import { createTurnController } from './gameplay/turn-controller.js';
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
  root.dataset.activity = 'booting';
  renderAppShell(root, session);

  let selectedRuntimeId = null;
  let interaction = {};
  let hud = renderHud(root, game, session, selectedRuntimeId, interaction);

  const stageHost = root.querySelector('#v2-stage-canvas-host');
  const stage = await mountStage(stageHost, session, { quality: qualityFromRoot(root) });

  function refresh() {
    hud = renderHud(root, game, session, selectedRuntimeId, interaction);
    stage.render(session.state, { quality: qualityFromRoot(root) });
  }

  const controller = createTurnController({
    adapter,
    session,
    aiDelayMs: qualityFromRoot(root) === 'low' ? 360 : 520,
    onChange(event) {
      root.dataset.activity = event.type;
      refresh();
    }
  });

  async function executeSelected(action) {
    if (!selectedRuntimeId) return;
    const previousId = selectedRuntimeId;
    const previousInteraction = interaction;
    selectedRuntimeId = null;
    interaction = {};
    refresh();

    const result = await controller.executeHuman({
      ...action,
      runtimeId: previousId
    });
    if (!result?.ok) {
      selectedRuntimeId = previousId;
      interaction = previousInteraction;
      refresh();
    }
  }

  root.addEventListener('click', async event => {
    const cardButton = event.target.closest?.('[data-card-id]');
    if (cardButton) {
      if (controller.busy || hud.turn.activePlayerId !== 'human') return;
      selectedRuntimeId = selectedRuntimeId === cardButton.dataset.cardId ? null : cardButton.dataset.cardId;
      interaction = {};
      refresh();
      return;
    }

    const actionButton = event.target.closest?.('[data-pending-action]');
    if (!actionButton || controller.busy) return;
    const pending = actionButton.dataset.pendingAction;

    if (pending === 'special-reset') {
      interaction = {};
      refresh();
      return;
    }

    if (pending === 'tactic-target') {
      interaction = { tacticTargetId: actionButton.dataset.target };
      refresh();
      return;
    }
    if (pending === 'tactic-confirm') {
      await executeSelected({ type: 'tactic', targetPlayerId: interaction.tacticTargetId });
      return;
    }

    if (pending === 'trump-target') {
      interaction = { trump: { targetPlayerId: actionButton.dataset.target } };
      refresh();
      return;
    }
    if (pending === 'trump-own') {
      interaction = { trump: { ...(interaction.trump || {}), ownTreasureId: actionButton.dataset.treasureId } };
      refresh();
      return;
    }
    if (pending === 'trump-target-treasure') {
      interaction = { trump: { ...(interaction.trump || {}), targetTreasureId: actionButton.dataset.treasureId } };
      refresh();
      return;
    }
    if (pending === 'trump-confirm') {
      const flow = interaction.trump || {};
      await executeSelected({
        type: 'trump',
        targetPlayerId: flow.targetPlayerId,
        ownTreasureId: flow.ownTreasureId,
        targetTreasureId: flow.targetTreasureId
      });
      return;
    }

    if (pending === 'travel') {
      await executeSelected({ type: 'travel', destination: actionButton.dataset.target });
      return;
    }
    if (pending === 'swap-pass') {
      await executeSelected({ type: 'swapPass' });
      return;
    }
    if (pending === 'location' || pending === 'inspect' || pending === 'discard') {
      await executeSelected({ type: pending });
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

  await controller.start();
  root.dataset.activity = 'human-ready';
  refresh();
}

boot().catch(error => {
  console.error(error);
  const root = document.querySelector('#app');
  if (root) root.textContent = `V2 启动失败：${error.message}`;
});
