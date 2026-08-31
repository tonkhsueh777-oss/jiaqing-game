(function (root) {
  const game = root.JQGame;

  const ART = {
    mingcha: 'assets/cards/01-mingcha.jpg',
    xunyou: 'assets/cards/02-xunyou.jpg',
    tainan: 'assets/cards/03-tainan.jpg',
    mengxia: 'assets/cards/04-mengxia.jpg',
    zhuluo: 'assets/cards/05-zhuluo.jpg',
    madou: 'assets/cards/06-madou.jpg',
    goldSeal: 'assets/cards/07-gold-seal.jpg',
    sword: 'assets/cards/08-sword.jpg',
    gun: 'assets/cards/09-gun.jpg',
    pomelo: 'assets/cards/10-pomelo.jpg',
    jiaqingOrder: 'assets/cards/11-jiaqing-order.jpg',
    wangOrder: 'assets/cards/12-wang-order.jpg',
    bully: 'assets/cards/13-bully.jpg',
    fire: 'assets/cards/14-fire.jpg',
    flower: 'assets/cards/15-flower.jpg',
    cardBack: 'assets/card-back.jpg'
  };

  game.LOCATIONS = {
    tainan: { id: 'tainan', name: '台南府城', treasure: 'goldSeal', asset: ART.tainan },
    mengxia: { id: 'mengxia', name: '艋舺', treasure: 'gun', asset: ART.mengxia },
    zhuluo: { id: 'zhuluo', name: '诸罗大营', treasure: 'sword', asset: ART.zhuluo },
    madou: { id: 'madou', name: '麻豆古镇', treasure: 'pomelo', asset: ART.madou }
  };

  game.TREASURES = {
    goldSeal: { id: 'goldSeal', name: '嘉庆王金印', shortName: '金印', initialStock: 3, asset: ART.goldSeal },
    sword: { id: 'sword', name: '尚方宝剑', shortName: '宝剑', initialStock: 3, asset: ART.sword },
    gun: { id: 'gun', name: '王发的枪', shortName: '火枪', initialStock: 3, asset: ART.gun },
    pomelo: { id: 'pomelo', name: '文旦柚', shortName: '柚子', initialStock: 3, asset: ART.pomelo }
  };

  const repeated = (type, key, name, count, asset, extra = {}) =>
    Array.from({ length: count }, () => ({ type, key, name, asset, ...extra }));

  game.CATALOG = {
    cardBack: ART.cardBack
  };

  game.buildDeckDefinition = function buildDeckDefinition() {
    return [
      ...repeated('travel', 'travel', '巡游', 34, ART.xunyou),
      ...repeated('inspect', 'inspect', '明察', 19, ART.mingcha),
      ...Object.values(game.LOCATIONS).flatMap(loc => repeated('location', loc.id, loc.name, 3, loc.asset, { locationId: loc.id })),
      { type: 'tactic', key: 'bully', name: '恶霸王豹', asset: ART.bully },
      { type: 'tactic', key: 'fire', name: '火烧百顺楼', asset: ART.fire },
      { type: 'tactic', key: 'flower', name: '假绿菊花', asset: ART.flower },
      { type: 'trump', key: 'jiaqingOrder', name: '嘉庆令', asset: ART.jiaqingOrder },
      { type: 'trump', key: 'wangOrder', name: '王德禄令', asset: ART.wangOrder }
    ];
  };
})(globalThis);
