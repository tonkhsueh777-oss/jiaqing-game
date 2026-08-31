(function (root) {
  const game = root.JQGame;
  const embedded = game.ASSETS || {};
  const asset = (key, fallback) => embedded[key] || fallback;

  game.LOCATIONS = {
    tainan: { id: 'tainan', name: '台南府城', treasure: 'goldSeal', asset: asset('tainan', 'assets/cards/03-tainan.jpg') },
    mengxia: { id: 'mengxia', name: '艋舺', treasure: 'gun', asset: asset('mengxia', 'assets/cards/04-mengxia.jpg') },
    zhuluo: { id: 'zhuluo', name: '诸罗大营', treasure: 'sword', asset: asset('zhuluo', 'assets/cards/05-zhuluo.jpg') },
    madou: { id: 'madou', name: '麻豆古镇', treasure: 'pomelo', asset: asset('madou', 'assets/cards/06-madou.jpg') }
  };

  game.TREASURES = {
    goldSeal: { id: 'goldSeal', name: '嘉庆王金印', shortName: '金印', initialStock: 3, asset: asset('goldSeal', 'assets/cards/07-gold-seal.jpg') },
    sword: { id: 'sword', name: '尚方宝剑', shortName: '宝剑', initialStock: 3, asset: asset('sword', 'assets/cards/08-sword.jpg') },
    gun: { id: 'gun', name: '王发的枪', shortName: '火枪', initialStock: 3, asset: asset('gun', 'assets/cards/09-gun.jpg') },
    pomelo: { id: 'pomelo', name: '文旦柚', shortName: '柚子', initialStock: 3, asset: asset('pomelo', 'assets/cards/10-pomelo.jpg') }
  };

  const repeated = (type, key, name, count, image, extra = {}) =>
    Array.from({ length: count }, () => ({ type, key, name, asset: image, ...extra }));

  game.CATALOG = {
    cardBack: asset('cardBack', 'assets/card-back.jpg')
  };

  game.buildDeckDefinition = function buildDeckDefinition() {
    return [
      ...repeated('travel', 'travel', '巡游', 34, asset('xunyou', 'assets/cards/02-xunyou.jpg')),
      ...repeated('inspect', 'inspect', '明察', 19, asset('mingcha', 'assets/cards/01-mingcha.jpg')),
      ...Object.values(game.LOCATIONS).flatMap(loc => repeated('location', loc.id, loc.name, 3, loc.asset, { locationId: loc.id })),
      { type: 'tactic', key: 'bully', name: '恶霸王豹', asset: asset('bully', 'assets/cards/13-bully.jpg') },
      { type: 'tactic', key: 'fire', name: '火烧百顺楼', asset: asset('fire', 'assets/cards/14-fire.jpg') },
      { type: 'tactic', key: 'flower', name: '假绿菊花', asset: asset('flower', 'assets/cards/15-flower.jpg') },
      { type: 'trump', key: 'jiaqingOrder', name: '嘉庆令', asset: asset('jiaqingOrder', 'assets/cards/11-jiaqing-order.jpg') },
      { type: 'trump', key: 'wangOrder', name: '王德禄令', asset: asset('wangOrder', 'assets/cards/12-wang-order.jpg') }
    ];
  };
})(globalThis);
