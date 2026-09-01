(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.JQGame) root.JQGame.BeginnerAssistLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STORAGE_KEY = 'jiaqing_beginner_assist';

  function readSavedMode(value) {
    if (value == null || value === '') return true;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === '0' || normalized === 'false' || normalized === 'off') return false;
    if (normalized === '1' || normalized === 'true' || normalized === 'on') return true;
    return true;
  }

  function buildHelpText({ hint = '', selectedRule = '' } = {}) {
    const live = String(hint || '').trim();
    if (live) return live;
    const rule = String(selectedRule || '').trim();
    if (rule) return rule;
    return '先选择一张手牌。地点牌可以开放地点；巡游用来移动；明察要在已开放地点使用；没有合适动作时可以换1张并结束。';
  }

  return { STORAGE_KEY, readSavedMode, buildHelpText };
});
