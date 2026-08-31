(function (root) {
  const game = root.JQGame;
  const embedded = game.ASSETS || {};

  function cardVisual(title, subtitle = '') {
    const safeTitle = String(title).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
    const safeSubtitle = String(subtitle).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="556" viewBox="0 0 360 556"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#173d49"/><stop offset="1" stop-color="#071b24"/></linearGradient></defs><rect width="360" height="556" rx="24" fill="url(#g)"/><rect x="15" y="15" width="330" height="526" rx="18" fill="none" stroke="#d9b76b" stroke-width="5"/><rect x="31" y="31" width="298" height="494" rx="13" fill="none" stroke="#806938" stroke-width="2"/><circle cx="180" cy="205" r="88" fill="#0c2731" stroke="#b9924b" stroke-width="4"/><text x="180" y="223" text-anchor="middle" fill="#f4dfa8" font-family="serif" font-size="38" font-weight="700">${safeTitle}</text><text x="180" y="350" text-anchor="middle" fill="#d9c89f" font-family="sans-serif" font-size="20">${safeSubtitle}</text><text x="180" y="455" text-anchor="middle" fill="#a89262" font-family="serif" font-size="18">御前争霸</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  const asset = (key, title, subtitle) => embedded[key] || cardVisual(title, subtitle);

  game.LOCATIONS = {
    tainan: { id: 'tainan', name: '台南府城', treasure: 'goldSeal', asset: asset('tainan', '台南府城', '地牌') },
    mengxia: { id: 'mengxia', name: '艋舺', treasure: 'gun', asset: asset('mengxia', '艋舺', '地牌') },
    zhuluo: { id: 'zhuluo', name: '诸罗大营', treasure: 'sword', asset: asset('zhuluo', '诸罗大营', '地牌') },
    madou: { id: 'madou', name: '麻豆古镇', treasure: 'pomelo', asset: asset('madou', '麻豆古镇', '地牌') }
  };

  game.TREASURES = {
    goldSeal: { id: 'goldSeal', name: '嘉庆王金印', shortName: '金印', initialStock: 3, asset: asset('goldSeal', '金印', '御前圣物') },
    sword: { id: 'sword', name: '尚方宝剑', shortName: '宝剑', initialStock: 3, asset: asset('sword', '宝剑', '御前圣物') },
    gun: { id: 'gun', name: '王发的枪', shortName: '火枪', initialStock: 3, asset: asset('gun', '火枪', '御前圣物') },
    pomelo: { id: 'pomelo', name: '文旦柚', shortName: '柚子', initialStock: 3, asset: asset('pomelo', '柚子', '御前圣物') }
  };

  const repeated = (type, key, name, count, image, extra = {}) =>
    Array.from({ length: count }, () => ({ type, key, name, asset: image, ...extra }));

  game.CATALOG = {
    cardBack: embedded.cardBack || cardVisual('御前', '牌背')
  };

  game.buildDeckDefinition = function buildDeckDefinition() {
    return [
      ...repeated('travel', 'travel', '巡游', 34, asset('xunyou', '巡游', '移动1格')),
      ...repeated('inspect', 'inspect', '明察', 19, asset('mingcha', '明察', '取得圣物')),
      ...Object.values(game.LOCATIONS).flatMap(loc => repeated('location', loc.id, loc.name, 3, loc.asset, { locationId: loc.id })),
      { type: 'tactic', key: 'bully', name: '恶霸王豹', asset: asset('bully', '恶霸王豹', '计策') },
      { type: 'tactic', key: 'fire', name: '火烧百顺楼', asset: asset('fire', '火烧百顺楼', '计策') },
      { type: 'tactic', key: 'flower', name: '假绿菊花', asset: asset('flower', '假绿菊花', '计策') },
      { type: 'trump', key: 'jiaqingOrder', name: '嘉庆令', asset: asset('jiaqingOrder', '嘉庆令', '王牌') },
      { type: 'trump', key: 'wangOrder', name: '王德禄令', asset: asset('wangOrder', '王德禄令', '王牌') }
    ];
  };
})(globalThis);
