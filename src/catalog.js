(function (root) {
  const game = root.JQGame;
  const artIndex = {
    mingcha: 0,
    xunyou: 1,
    tainan: 2,
    mengxia: 3,
    zhuluo: 4,
    madou: 5,
    goldSeal: 6,
    sword: 7,
    gun: 8,
    pomelo: 9,
    jiaqingOrder: 10,
    wangOrder: 11,
    bully: 12,
    fire: 13,
    flower: 14,
    cardBack: 15
  };

  function spriteAsset(key) {
    return `sprite:${artIndex[key]}`;
  }

  game.LOCATIONS = {
    tainan: { id: 'tainan', name: '台南府城', treasure: 'goldSeal', asset: spriteAsset('tainan') },
    mengxia: { id: 'mengxia', name: '艋舺', treasure: 'gun', asset: spriteAsset('mengxia') },
    zhuluo: { id: 'zhuluo', name: '诸罗大营', treasure: 'sword', asset: spriteAsset('zhuluo') },
    madou: { id: 'madou', name: '麻豆古镇', treasure: 'pomelo', asset: spriteAsset('madou') }
  };

  game.TREASURES = {
    goldSeal: { id: 'goldSeal', name: '嘉庆王金印', shortName: '金印', initialStock: 3, asset: spriteAsset('goldSeal') },
    sword: { id: 'sword', name: '尚方宝剑', shortName: '宝剑', initialStock: 3, asset: spriteAsset('sword') },
    gun: { id: 'gun', name: '王发的枪', shortName: '火枪', initialStock: 3, asset: spriteAsset('gun') },
    pomelo: { id: 'pomelo', name: '文旦柚', shortName: '柚子', initialStock: 3, asset: spriteAsset('pomelo') }
  };

  const repeated = (type, key, name, count, image, extra = {}) =>
    Array.from({ length: count }, () => ({ type, key, name, asset: image, ...extra }));

  game.CATALOG = {
    cardBack: spriteAsset('cardBack')
  };

  game.buildDeckDefinition = function buildDeckDefinition() {
    return [
      ...repeated('travel', 'travel', '巡游', 34, spriteAsset('xunyou')),
      ...repeated('inspect', 'inspect', '明察', 19, spriteAsset('mingcha')),
      ...Object.values(game.LOCATIONS).flatMap(loc => repeated('location', loc.id, loc.name, 3, loc.asset, { locationId: loc.id })),
      { type: 'tactic', key: 'bully', name: '恶霸王豹', asset: spriteAsset('bully') },
      { type: 'tactic', key: 'fire', name: '火烧百顺楼', asset: spriteAsset('fire') },
      { type: 'tactic', key: 'flower', name: '假绿菊花', asset: spriteAsset('flower') },
      { type: 'trump', key: 'jiaqingOrder', name: '嘉庆令', asset: spriteAsset('jiaqingOrder') },
      { type: 'trump', key: 'wangOrder', name: '王德禄令', asset: spriteAsset('wangOrder') }
    ];
  };
})(globalThis);
