(function (root) {
  const game = root.JQGame;
  const spriteUrl = game.CARD_SPRITE || '';
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

  function fallbackCard(title) {
    const safe = String(title || '').replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="124" viewBox="0 0 80 124"><rect width="80" height="124" rx="6" fill="#0b2933"/><rect x="3" y="3" width="74" height="118" rx="5" fill="none" stroke="#d9b76b"/><text x="40" y="66" text-anchor="middle" fill="#f4dfa8" font-size="10" font-family="sans-serif">${safe}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function spriteCard(key, title) {
    if (!spriteUrl) return fallbackCard(title || key);
    const index = artIndex[key];
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = -(col * 64);
    const y = -(row * 96);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="64" height="96" viewBox="0 0 64 96"><image href="${spriteUrl}" xlink:href="${spriteUrl}" x="${x}" y="${y}" width="256" height="384" preserveAspectRatio="none"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  game.LOCATIONS = {
    tainan: { id: 'tainan', name: '台南府城', treasure: 'goldSeal', asset: spriteCard('tainan', '台南府城') },
    mengxia: { id: 'mengxia', name: '艋舺', treasure: 'gun', asset: spriteCard('mengxia', '艋舺') },
    zhuluo: { id: 'zhuluo', name: '诸罗大营', treasure: 'sword', asset: spriteCard('zhuluo', '诸罗大营') },
    madou: { id: 'madou', name: '麻豆古镇', treasure: 'pomelo', asset: spriteCard('madou', '麻豆古镇') }
  };

  game.TREASURES = {
    goldSeal: { id: 'goldSeal', name: '嘉庆王金印', shortName: '金印', initialStock: 3, asset: spriteCard('goldSeal', '金印') },
    sword: { id: 'sword', name: '尚方宝剑', shortName: '宝剑', initialStock: 3, asset: spriteCard('sword', '宝剑') },
    gun: { id: 'gun', name: '王发的枪', shortName: '火枪', initialStock: 3, asset: spriteCard('gun', '火枪') },
    pomelo: { id: 'pomelo', name: '文旦柚', shortName: '柚子', initialStock: 3, asset: spriteCard('pomelo', '柚子') }
  };

  const repeated = (type, key, name, count, image, extra = {}) =>
    Array.from({ length: count }, () => ({ type, key, name, asset: image, ...extra }));

  game.CATALOG = {
    cardBack: spriteCard('cardBack', '牌背')
  };

  game.buildDeckDefinition = function buildDeckDefinition() {
    return [
      ...repeated('travel', 'travel', '巡游', 34, spriteCard('xunyou', '巡游')),
      ...repeated('inspect', 'inspect', '明察', 19, spriteCard('mingcha', '明察')),
      ...Object.values(game.LOCATIONS).flatMap(loc => repeated('location', loc.id, loc.name, 3, loc.asset, { locationId: loc.id })),
      { type: 'tactic', key: 'bully', name: '恶霸王豹', asset: spriteCard('bully', '恶霸王豹') },
      { type: 'tactic', key: 'fire', name: '火烧百顺楼', asset: spriteCard('fire', '火烧百顺楼') },
      { type: 'tactic', key: 'flower', name: '假绿菊花', asset: spriteCard('flower', '假绿菊花') },
      { type: 'trump', key: 'jiaqingOrder', name: '嘉庆令', asset: spriteCard('jiaqingOrder', '嘉庆令') },
      { type: 'trump', key: 'wangOrder', name: '王德禄令', asset: spriteCard('wangOrder', '王德禄令') }
    ];
  };
})(globalThis);
