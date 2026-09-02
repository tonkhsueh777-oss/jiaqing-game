(function (root) {
  const game = root.JQGame;
  const logic = game?.EndgamePresentation;
  if (!game?.UI || !logic || typeof document === 'undefined') return;

  const baseShowWinner = game.UI.showWinner.bind(game.UI);
  let lastScheduledState = null;
  let pendingResult = Promise.resolve();

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'\"]/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[ch]));
  }

  function victoryParticles() {
    return Array.from({ length: 28 }, (_, index) => `<i style="--i:${index};--x:${(index * 37) % 100}%;--d:${(index % 7) * 90}ms"></i>`).join('');
  }

  function decorateResult(state) {
    const winner = state.players.find(player => player.id === state.winnerId);
    const modalRoot = document.getElementById('modal-root');
    const modal = modalRoot?.querySelector('.winner-overlay');
    if (!winner || !modalRoot || !modal) return;

    const outcome = logic.outcomeFor(state.winnerId);
    modalRoot.classList.add('v40-endgame-root', `v40-endgame-root--${outcome}`);
    modal.classList.add('v40-endgame', `v40-endgame--${outcome}`);

    const title = modal.querySelector('h2');
    const detail = modal.querySelector('p');
    if (title) title.textContent = logic.resultTitle(outcome, winner.name);
    if (detail) detail.textContent = logic.resultDetail(outcome, winner.name);

    modal.insertAdjacentHTML('afterbegin', outcome === 'victory'
      ? `<div class="v40-endgame__atmosphere v40-endgame__atmosphere--victory" aria-hidden="true"><div class="v40-endgame__rays"></div><div class="v40-endgame__particles">${victoryParticles()}</div></div><div class="v40-endgame__seal">胜</div><div class="v40-endgame__kicker">御前争霸 · 最终结算</div>`
      : `<div class="v40-endgame__atmosphere v40-endgame__atmosphere--defeat" aria-hidden="true"><div class="v40-endgame__rain"></div></div><div class="v40-endgame__seal">败</div><div class="v40-endgame__kicker">御前争霸 · 最终结算</div>`);

    const winnerFour = modal.querySelector('.winner-four');
    if (winnerFour) winnerFour.setAttribute('aria-label', `${escapeHtml(winner.name)}已集齐四件御前圣物`);

    const closeButton = modal.querySelector('[data-win="close"]');
    if (closeButton) closeButton.textContent = '查看最终牌局';

    if (outcome === 'victory') game.UI.V23VisualEffects?.playSound('victory');
    else game.UI.V23VisualEffects?.playSound('defeat');
  }

  game.UI.showWinner = function showWinnerV40(state) {
    if (!state?.winnerId) return;
    if (lastScheduledState === state) return pendingResult;
    lastScheduledState = state;

    pendingResult = Promise.resolve()
      .then(() => game.UI.V23VisualEffects?.whenIdle?.())
      .catch(() => {})
      .then(() => {
        if (!state?.winnerId) return;
        baseShowWinner(state);
        decorateResult(state);
      });

    return pendingResult;
  };
})(globalThis);
