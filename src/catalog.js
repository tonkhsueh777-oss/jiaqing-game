(function (root) {
  const game = root.JQGame;
  const spriteUrl = 'https://tonkhsueh777-oss.github.io/jiaqing-game/assets/cards-sprite-v2.jpg?v=2';
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

  function spriteCard(key) {
    const index = artIndex[key];
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = -(col * 80);
    const y = -(row * 124);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="124" viewBox="0 0 80 124"><image href="${spriteUrl}" x="${x}" y="${y}" width="320" height="496" preserveAspectRatio="none"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  game.LOCATIONS = {
    tainan: { id: 'tainan', name: '台南府城', treasure: 'goldSeal', asset: spriteCard('tainan') },
    mengxia: { id: 'mengxia', name: '艋舺', treasure: 'gun', asset: spriteCard('mengxia') },
    zhuluo: { id: 'zhuluo', name: '诸罗大营', treasure: 'sword', asset: spriteCard('zhuluo') },
    madou: { id: 'madou', name: '麻豆古镇', treasure: 'pomelo', asset: spriteCard('madou') }
  };

  game.TREASURES = {
    goldSeal: { id: 'goldSeal', name: '嘉庆王金印', shortName: '金印', initialStock: 3, asset: spriteCard('goldSeal') },
    sword: { id: 'sword', name: '尚方宝剑', shortName: '宝剑', initialStock: 3, asset: spriteCard('sword') },
    gun: { id: 'gun', name: '王发的枪', shortName: '火枪', initialStock: 3, asset: spriteCard('gun') },
    pomelo: { id: 'pomelo', name: '文旦柚', shortName: '柚子', initialStock: 3, asset: spriteCard('pomelo') }
  };

  const repeated = (type, key, name, count, image, extra = {}) =>
    Array.from({ length: count }, () => ({ type, key, name, asset: image, ...extra }));

  game.CATALOG = {
    cardBack: spriteCard('cardBack')
  };

  game.buildDeckDefinition = function buildDeckDefinition() {
    return [
      ...repeated('travel', 'travel', '巡游', 34, spriteCard('xunyou')),
      ...repeated('inspect', 'inspect', '明察', 19, spriteCard('mingcha')),
      ...Object.values(game.LOCATIONS).flatMap(loc => repeated('location', loc.id, loc.name, 3, loc.asset, { locationId: loc.id })),
      { type: 'tactic', key: 'bully', name: '恶霸王豹', asset: spriteCard('bully') },
      { type: 'tactic', key: 'fire', name: '火烧百顺楼', asset: spriteCard('fire') },
      { type: 'tactic', key: 'flower', name: '假绿菊花', asset: spriteCard('flower') },
      { type: 'trump', key: 'jiaqingOrder', name: '嘉庆令', asset: spriteCard('jiaqingOrder') },
      { type: 'trump', key: 'wangOrder', name: '王德禄令', asset: spriteCard('wangOrder') }
    ];
  };
})(globalThis);
