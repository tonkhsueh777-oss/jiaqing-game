(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.JQGame) root.JQGame.MobileLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MOBILE_BOARD_SLOTS = Object.freeze({
    center: Object.freeze({ x: 50, y: 50 }),
    tainan: Object.freeze({ x: 50, y: 20 }),
    mengxia: Object.freeze({ x: 79, y: 50 }),
    zhuluo: Object.freeze({ x: 21, y: 50 }),
    madou: Object.freeze({ x: 50, y: 80 })
  });

  const MOBILE_SECTION_ORDER = Object.freeze(['main', 'hand', 'right', 'left']);

  return { MOBILE_BOARD_SLOTS, MOBILE_SECTION_ORDER };
});
