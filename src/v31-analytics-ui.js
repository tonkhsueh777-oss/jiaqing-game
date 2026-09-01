(function (root) {
  const game = root.JQGame;
  if (!game?.Analytics || typeof document === 'undefined') return;

  const REASON_LABELS = {
    rules: '规则不容易懂',
    controls: '操作不顺',
    mobile: '手机版问题',
    pace: '游戏节奏',
    visual_audio: '画面 / 音效',
    other: '其他'
  };

  let mounted = false;
  let submitting = false;

  function panelHtml() {
    return `
      <section class="dashboard-panel analytics-panel" aria-label="匿名体验统计与玩家评价">
        <div class="panel-heading">玩家体验</div>
        <div class="analytics-stats" aria-live="polite">
          <div><span>今日体验</span><strong data-stat="today">—</strong></div>
          <div><span>累计体验</span><strong data-stat="total">—</strong></div>
          <div><span>👍 好玩</span><strong data-stat="likes">—</strong></div>
          <div><span>👎 需改进</span><strong data-stat="dislikes">—</strong></div>
        </div>
        <div class="analytics-feedback-actions">
          <button type="button" class="analytics-feedback-button analytics-like" data-feedback="like">👍 好玩</button>
          <button type="button" class="analytics-feedback-button analytics-dislike" data-feedback="dislike">👎 需要改进</button>
        </div>
        <div class="analytics-feedback-note">匿名统计，不需要填写姓名或联系方式。</div>
      </section>`;
  }

  function ensurePanel() {
    let panel = document.querySelector('.analytics-panel');
    if (panel) return panel;
    const left = document.querySelector('.left-dashboard');
    if (!left) return null;
    const actions = left.querySelector('.left-actions');
    const holder = document.createElement('div');
    holder.innerHTML = panelHtml().trim();
    panel = holder.firstElementChild;
    left.insertBefore(panel, actions || null);
    return panel;
  }

  async function refresh() {
    const panel = ensurePanel();
    if (!panel) return;
    const stats = await game.Analytics.fetchStats();
    panel.querySelector('[data-stat="today"]').textContent = stats.todayVisits.toLocaleString();
    panel.querySelector('[data-stat="total"]').textContent = stats.totalVisits.toLocaleString();
    panel.querySelector('[data-stat="likes"]').textContent = stats.likes.toLocaleString();
    panel.querySelector('[data-stat="dislikes"]').textContent = stats.dislikes.toLocaleString();
  }

  function closeFeedbackModal() {
    document.querySelector('.analytics-feedback-modal')?.remove();
  }

  function showThanks(message = '感谢你的反馈。') {
    game.UI?.showToast?.(message);
  }

  async function submitLike() {
    if (submitting) return;
    submitting = true;
    try {
      await game.Analytics.submitFeedback({ rating: 'like' });
      showThanks('谢谢！已收到你的点赞。');
      await refresh();
    } finally {
      submitting = false;
    }
  }

  function openDislikeModal() {
    closeFeedbackModal();
    const modal = document.createElement('div');
    modal.className = 'analytics-feedback-modal';
    modal.innerHTML = `
      <div class="analytics-feedback-dialog" role="dialog" aria-modal="true" aria-label="需要改进的地方">
        <button type="button" class="analytics-feedback-close" aria-label="关闭">×</button>
        <h3>哪里需要改进？</h3>
        <p>点一个最接近的原因即可，也可以补充一句。</p>
        <div class="analytics-reason-grid">
          ${Object.entries(REASON_LABELS).map(([value, label]) => `<button type="button" data-reason="${value}">${label}</button>`).join('')}
        </div>
        <textarea maxlength="500" rows="3" placeholder="补充建议（选填）"></textarea>
        <button type="button" class="analytics-submit-dislike" disabled>提交反馈</button>
      </div>`;
    document.body.appendChild(modal);

    let selectedReason = null;
    const submit = modal.querySelector('.analytics-submit-dislike');
    modal.querySelectorAll('[data-reason]').forEach(button => {
      button.addEventListener('click', () => {
        selectedReason = button.dataset.reason;
        modal.querySelectorAll('[data-reason]').forEach(item => item.classList.toggle('is-selected', item === button));
        submit.disabled = false;
      });
    });
    modal.querySelector('.analytics-feedback-close')?.addEventListener('click', closeFeedbackModal);
    modal.addEventListener('click', event => { if (event.target === modal) closeFeedbackModal(); });
    submit.addEventListener('click', async () => {
      if (!selectedReason || submitting) return;
      submitting = true;
      submit.disabled = true;
      try {
        const comment = modal.querySelector('textarea')?.value?.trim() || '';
        await game.Analytics.submitFeedback({ rating: 'dislike', reason: selectedReason, comment });
        closeFeedbackModal();
        showThanks('谢谢，改进意见已经收到。');
        await refresh();
      } finally {
        submitting = false;
      }
    });
  }

  function mount() {
    if (mounted) return;
    const panel = ensurePanel();
    if (!panel) return;
    mounted = true;
    panel.querySelector('[data-feedback="like"]')?.addEventListener('click', submitLike);
    panel.querySelector('[data-feedback="dislike"]')?.addEventListener('click', openDislikeModal);
    refresh();
  }

  game.AnalyticsUI = { mount, refresh };
  document.addEventListener('DOMContentLoaded', mount);
})(globalThis);
