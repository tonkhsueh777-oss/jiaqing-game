import mingcha from '../../../assets/cards/01-mingcha.jpg';
import xunyou from '../../../assets/cards/02-xunyou.jpg';
import tainan from '../../../assets/cards/03-tainan.jpg';
import mengxia from '../../../assets/cards/04-mengxia.jpg';
import zhuluo from '../../../assets/cards/05-zhuluo.jpg';
import madou from '../../../assets/cards/06-madou.jpg';
import goldSeal from '../../../assets/cards/07-gold-seal.jpg';
import sword from '../../../assets/cards/08-sword.jpg';
import gun from '../../../assets/cards/09-gun.jpg';
import pomelo from '../../../assets/cards/10-pomelo.jpg';
import jiaqingOrder from '../../../assets/cards/11-jiaqing-order.jpg';
import wangOrder from '../../../assets/cards/12-wang-order.jpg';
import bully from '../../../assets/cards/13-bully.jpg';
import fire from '../../../assets/cards/14-fire.jpg';
import flower from '../../../assets/cards/15-flower.jpg';

const BY_KEY = Object.freeze({
  mingcha,
  xunyou,
  tainan,
  mengxia,
  zhuluo,
  madou,
  goldSeal,
  sword,
  gun,
  pomelo,
  jiaqingOrder,
  wangOrder,
  bully,
  fire,
  flower
});

export function resolveCardAsset(card) {
  if (!card) return '';
  if (card.type === 'travel') return BY_KEY.xunyou;
  if (card.type === 'inspect') return BY_KEY.mingcha;
  if (card.type === 'location') return BY_KEY[card.locationId || card.key] || '';
  return BY_KEY[card.key] || '';
}
