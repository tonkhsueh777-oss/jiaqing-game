(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.JQGame) root.JQGame.MobileLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MOBILE_BOARD_SLOTS = Object.freeze({
    tainan: Object.freeze({ x: 28, y: 21 }),
    mengxia: Object.freeze({ x: 72, y: 21 }),
    zhuluo: Object.freeze({ x: 28, y: 58 }),
    madou: Object.freeze({ x: 72, y: 58 }),
    center: Object.freeze({ x: 50, y: 87 })
  });

  const MOBILE_SECTION_ORDER = Object.freeze(['main', 'hand', 'right', 'left']);

  return { MOBILE_BOARD_SLOTS, MOBILE_SECTION_ORDER };
});
