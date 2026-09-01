(function (root) {
  const game = root.JQGame;
  const logic = game?.BeginnerAssistLogic;
  if (!game?.UI || !logic || typeof document === 'undefined') return;

  const baseRender = game.UI.render.bind(game.UI);
  const baseSetInteractionMode = game.UI.setInteractionMode.bind(game.UI);
  let lastState = null;
  let enabled = true;

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[ch]));

  function loadMode() {
    try {
      enabled = logic.readSavedMode(root.localStorage?.getItem(logic.STORAGE_KEY));
    } catch (_) {
      enabled = true;
    }
  }

  function saveMode() {
    try {
      root.localStorage?.setItem(logic.STORAGE_KEY, enabled ? '1' : '0');
    } catch (_) {}
  }

  function selectedCard(state) {
    const runtimeId = document.querySelector('.hand-card-button.is-selected')?.dataset.cardId;
    if (!runtimeId) return null;
    return state?.players?.find(player => player.id === 'human')?.hand?.find(card => card.runtimeId === runtimeId) || null;
  }

  function ensureToggle() {
    const heading = document.querySelector('.operation-panel .panel-heading');
    if (!heading) return null;
    let button = heading.querySelector('[data-beginner-assist-toggle]');
    if (button) return button;

    button = document.createElement('button');
    button.type = 'button';
    button.className = 'beginner-assist-toggle';
    button.dataset.beginnerAssistToggle = 'true';
    button.setAttribute('role', 'switch');
    button.addEventListener('click', () => {
      enabled = !enabled;
      saveMode();
      applyMode(lastState);
    });
    heading.appendChild(button);
    return button;
  }

  function updateToggle(button) {
    if (!button) return;
    button.setAttribute('aria-checked', enabled ? 'true' : 'false');
    button.setAttribute('aria-label', `初学者辅助：${enabled ? '开启' : '关闭'}`);
    button.classList.toggle('is-on', enabled);
    button.innerHTML = `<span class="beginner-assist-toggle__label">初学者辅助</span><span class="beginner-assist-toggle__track"><span class="beginner-assist-toggle__thumb"></span></span><strong>${enabled ? '开' : '关'}</strong>`;
  }

  function renderExtraHelp(state) {
    const target = document.getElementById('action-guide');
    if (!target) return;
    target.querySelector('.beginner-extra-help')?.remove();
    if (!enabled) return;

    const hint = document.querySelector('.human-actions .action-hint')?.textContent?.trim() || '';
    const card = selectedCard(state);
    const selectedRule = card ? game.UI.cardRuleText(card) : '';
    const helpText = logic.buildHelpText({ hint, selectedRule });
    const block = document.createElement('div');
    block.className = 'beginner-extra-help';
    block.innerHTML = `<strong>新手提示</strong><p>${escapeHtml(helpText)}</p>`;
    target.appendChild(block);
  }

  function applyMode(state) {
    const toggle = ensureToggle();
    document.documentElement.classList.toggle('beginner-assist-off', !enabled);
    document.documentElement.classList.toggle('beginner-assist-on', enabled);
    updateToggle(toggle);
    renderExtraHelp(state);
  }

  game.UI.render = function renderV30BeginnerAssist(state) {
    baseRender(state);
    lastState = state;
    applyMode(state);
  };

  game.UI.setInteractionMode = function setInteractionModeV30BeginnerAssist(mode, payload) {
    baseSetInteractionMode(mode, payload);
    applyMode(lastState);
  };

  loadMode();
  applyMode(lastState);
})(globalThis);
