import { Application, Assets, Container, Graphics, Sprite, Text } from 'pixi.js';
import { buildStageModel, STAGE_LAYOUT } from './stage-model.js';
import tainanUrl from '../../../assets/cards/03-tainan.jpg';
import mengxiaUrl from '../../../assets/cards/04-mengxia.jpg';
import zhuluoUrl from '../../../assets/cards/05-zhuluo.jpg';
import madouUrl from '../../../assets/cards/06-madou.jpg';
import goldSealUrl from '../../../assets/cards/07-gold-seal.jpg';
import swordUrl from '../../../assets/cards/08-sword.jpg';
import gunUrl from '../../../assets/cards/09-gun.jpg';
import pomeloUrl from '../../../assets/cards/10-pomelo.jpg';
import cardBackUrl from '../../../assets/card-back.jpg';

const LOCATION_ART = Object.freeze({
  tainan: tainanUrl,
  mengxia: mengxiaUrl,
  zhuluo: zhuluoUrl,
  madou: madouUrl
});

const TREASURE_ART = Object.freeze({
  goldSeal: goldSealUrl,
  sword: swordUrl,
  gun: gunUrl,
  pomelo: pomeloUrl
});

const TREASURE_META = Object.freeze({
  goldSeal: { short: '印', label: '金印', color: 0xe4b94c },
  sword: { short: '剑', label: '宝剑', color: 0xd7d2bd },
  gun: { short: '枪', label: '火枪', color: 0xc58d58 },
  pomelo: { short: '柚', label: '柚子', color: 0xd3bf55 }
});

const PLAYER_STYLE = Object.freeze({
  human: { fill: 0xd8aa3d, edge: 0xffe39a, label: '我' },
  ai1: { fill: 0xa93e32, edge: 0xff8779, label: '甲' },
  ai2: { fill: 0x3b8ca8, edge: 0x8bdfff, label: '乙' }
});

const EFFECT_STYLE = Object.freeze({
  burn: { color: 0xd45c35, label: '火烧 · 手牌焚毁' },
  lock: { color: 0xc9a24b, label: '计策封锁 · 跳过回合' },
  treasure: { color: 0xf0c75e, label: '明察得宝' },
  'location-open': { color: 0xd9bd73, label: '地点开放' },
  'treasure-swap': { color: 0xe6c46d, label: '御令 · 宝物交换' }
});

function sizeOf(host) {
  return { width: Math.max(host.clientWidth || 900, 720), height: Math.max(host.clientHeight || 600, 480) };
}

function makeText(text, size, fill = '#f8e7bd', weight = '700') {
  return new Text({ text, style: { fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif', fontSize: size, fill, fontWeight: weight } });
}

function drawBackground(layer, width, height, quality) {
  const base = new Graphics();
  base.roundRect(8, 8, width - 16, height - 16, 24).fill({ color: 0x071d20, alpha: 0.98 });
  base.roundRect(width * 0.08, height * 0.07, width * 0.84, height * 0.84, 28)
    .fill({ color: 0x183f3f, alpha: 0.45 })
    .stroke({ color: 0xb98a37, width: 2, alpha: 0.42 });
  layer.addChild(base);

  const map = new Graphics();
  map.ellipse(width / 2, height / 2, width * 0.42, height * 0.31)
    .fill({ color: 0x7a6332, alpha: 0.10 })
    .stroke({ color: 0xd6ad59, width: 2, alpha: 0.18 });
  if (quality.glow > 0.7) {
    map.ellipse(width / 2, height / 2, width * 0.34, height * 0.255)
      .stroke({ color: 0xf1c66c, width: 3, alpha: 0.11 });
  }
  layer.addChild(map);
}

function drawRoutes(layer, width, height, locations, activePlayerId) {
  const routes = new Graphics();
  const cx = width * 0.5;
  const cy = height * 0.5;
  for (const location of locations) {
    const lx = width * location.x;
    const ly = height * location.y;
    routes.moveTo(cx, cy).lineTo(lx, ly).stroke({ color: 0xe9b94f, width: 3, alpha: activePlayerId ? 0.62 : 0.38 });
    routes.circle(lx, ly, 6).fill({ color: 0xffd56b, alpha: 0.9 });
  }
  layer.addChild(routes);
}

function drawLocationPedestal(holder, cardW, cardH, location, quality) {
  const stage = location.stage || { pedestalDepth: 14, revealLift: 36, tilt: 0.02, sceneScale: 1.06 };
  const depthLayers = quality.id === 'low' ? 2 : 4;
  const layerStep = Math.max(3, stage.pedestalDepth / depthLayers);

  const floorShadow = new Graphics();
  floorShadow.ellipse(7, cardH * 0.47 + stage.pedestalDepth, cardW * 0.60, cardH * 0.17)
    .fill({ color: 0x000000, alpha: quality.shadows ? 0.34 : 0.18 });
  holder.addChild(floorShadow);

  for (let i = depthLayers; i >= 1; i -= 1) {
    const depth = i * layerStep;
    const slab = new Graphics();
    slab.roundRect(-cardW / 2 + 5, -cardH / 2 + depth, cardW - 10, cardH, 16)
      .fill({ color: i === 1 ? 0x604920 : 0x2d2a20, alpha: 0.98 })
      .stroke({ color: 0xb28b43, width: 1.2, alpha: 0.30 + i * 0.06 });
    holder.addChild(slab);
  }

  if (location.opened && quality.glow > 0.7) {
    const halo = new Graphics();
    halo.ellipse(0, -cardH * 0.10, cardW * 0.58, cardH * 0.46)
      .fill({ color: 0xf0c86c, alpha: 0.055 })
      .stroke({ color: 0xe9bc58, width: 2, alpha: 0.16 });
    holder.addChild(halo);
  }
}

function drawLocation(layer, width, height, location, texture, quality) {
  const x = width * location.x;
  const y = height * location.y;
  const landscape = location.slot === 'east' || location.slot === 'west';
  const cardW = Math.min(width * (landscape ? 0.19 : 0.175), 245);
  const cardH = Math.min(height * (landscape ? 0.29 : 0.25), 190);
  const stage = location.stage || { pedestalDepth: 14, revealLift: 36, tilt: 0.02, sceneScale: 1.06 };

  const holder = new Container();
  holder.x = x;
  holder.y = y - (location.opened ? stage.revealLift * 0.10 : 0);
  holder.rotation = location.opened ? stage.tilt : stage.tilt * 0.25;

  drawLocationPedestal(holder, cardW, cardH, location, quality);

  const shadow = new Graphics();
  shadow.roundRect(-cardW / 2 + 9, -cardH / 2 + 14, cardW, cardH, 18)
    .fill({ color: 0x000000, alpha: quality.shadows ? 0.42 : 0.24 });
  holder.addChild(shadow);

  const frame = new Graphics();
  frame.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 18)
    .fill({ color: location.opened ? 0x1b241d : 0x0c2426, alpha: 0.98 })
    .stroke({ color: location.opened ? 0xe0b65b : 0x8b7440, width: location.opened ? 3.5 : 2.5, alpha: location.opened ? 0.92 : 0.62 });
  holder.addChild(frame);

  const innerRim = new Graphics();
  innerRim.roundRect(-cardW / 2 + 6, -cardH / 2 + 6, cardW - 12, cardH - 12, 13)
    .stroke({ color: location.opened ? 0x7d5a24 : 0x5d593f, width: 1.3, alpha: 0.65 });
  holder.addChild(innerRim);

  const targetW = cardW - 14;
  const targetH = cardH - 40;

  if (location.opened) {
    const scene = new Container();
    scene.y = -12;
    scene.scale.set(stage.sceneScale);

    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    const scale = Math.max(targetW / sprite.texture.width, targetH / sprite.texture.height);
    sprite.scale.set(scale);
    const mask = new Graphics();
    mask.roundRect(-targetW / 2, -targetH / 2, targetW, targetH, 12).fill(0xffffff);
    scene.addChild(mask);
    sprite.mask = mask;
    scene.addChild(sprite);

    if (quality.glow > 0.7) {
      const topLight = new Graphics();
      topLight.roundRect(-targetW * 0.46, -targetH * 0.45, targetW * 0.92, targetH * 0.20, 10)
        .fill({ color: 0xffe8a1, alpha: 0.07 });
      scene.addChild(topLight);
    }

    holder.addChild(scene);

    const frontLip = new Graphics();
    frontLip.roundRect(-cardW * 0.43, cardH * 0.34, cardW * 0.86, 12, 6)
      .fill({ color: 0x765724, alpha: 0.98 })
      .stroke({ color: 0xe3ba61, width: 1, alpha: 0.68 });
    holder.addChild(frontLip);
  } else {
    const back = new Graphics();
    back.roundRect(-targetW / 2, -targetH / 2 - 12, targetW, targetH, 12)
      .fill({ color: 0x092c2e, alpha: 0.98 })
      .stroke({ color: 0x927a40, width: 1.5, alpha: 0.55 });
    back.roundRect(-targetW * 0.42, -targetH * 0.37 - 12, targetW * 0.84, targetH * 0.74, 9)
      .stroke({ color: 0xb0954e, width: 1, alpha: 0.28 });
    back.circle(0, -12, Math.min(targetW, targetH) * 0.22)
      .fill({ color: 0x715620, alpha: 0.18 })
      .stroke({ color: 0xd0ac55, width: 2, alpha: 0.32 });
    holder.addChild(back);

    const seal = makeText('御', Math.max(25, cardW * 0.15), '#c9aa5a', '900');
    seal.anchor.set(0.5);
    seal.y = -14;
    holder.addChild(seal);
    const waiting = makeText('待揭示', Math.max(10, cardW * 0.055), '#8f9c94', '800');
    waiting.anchor.set(0.5);
    waiting.y = targetH * 0.28;
    holder.addChild(waiting);
  }

  const labelPlate = new Graphics();
  labelPlate.roundRect(-cardW * 0.36, cardH * 0.26, cardW * 0.72, 34, 9)
    .fill({ color: location.opened ? 0xd4b16b : 0x594b2b, alpha: 0.96 })
    .stroke({ color: 0x5b3916, width: 2, alpha: 0.9 });
  holder.addChild(labelPlate);
  const label = makeText(location.opened ? location.name : '封存地牌', Math.max(13, cardW * 0.075), location.opened ? '#24160b' : '#d5c695', '800');
  label.anchor.set(0.5);
  label.y = cardH * 0.26 + 17;
  holder.addChild(label);
  layer.addChild(holder);
}

function drawDeckStacks(layer, width, height, deck, cardBackTexture) {
  const stackW = Math.min(74, width * 0.075);
  const stackH = stackW / 0.68;

  function baseStack(point, count, label, accent) {
    const holder = new Container();
    holder.x = width * point.x;
    holder.y = height * point.y;
    const depth = Math.min(4, Math.max(1, Math.ceil(count / 10)));
    for (let i = depth - 1; i >= 0; i -= 1) {
      const card = new Graphics();
      const offset = i * 3;
      card.roundRect(-stackW / 2 + offset, -stackH / 2 + offset, stackW, stackH, 8)
        .fill({ color: 0x092426, alpha: 0.98 })
        .stroke({ color: accent, width: 1.4, alpha: 0.58 });
      holder.addChild(card);
    }
    const plate = new Graphics();
    plate.roundRect(-stackW * 0.55, stackH * 0.42, stackW * 1.1, 31, 8)
      .fill({ color: 0x07191b, alpha: 0.94 })
      .stroke({ color: accent, width: 1, alpha: 0.42 });
    holder.addChild(plate);
    const title = makeText(label, 10, '#d4bd7b', '900');
    title.anchor.set(0.5);
    title.y = stackH * 0.42 + 9;
    holder.addChild(title);
    const total = makeText(String(count), 13, '#ffe39a', '900');
    total.anchor.set(0.5);
    total.y = stackH * 0.42 + 22;
    holder.addChild(total);
    layer.addChild(holder);
    return holder;
  }

  const draw = baseStack(deck.draw, deck.drawCount, '抽牌堆', 0xc6a34e);
  if (cardBackTexture && deck.drawCount > 0) {
    const sprite = new Sprite(cardBackTexture);
    sprite.anchor.set(0.5);
    const scale = Math.max(stackW / sprite.texture.width, stackH / sprite.texture.height);
    sprite.scale.set(scale);
    const mask = new Graphics();
    mask.roundRect(-stackW / 2 + 2, -stackH / 2 + 2, stackW - 4, stackH - 4, 7).fill(0xffffff);
    draw.addChild(mask);
    sprite.mask = mask;
    draw.addChild(sprite);
  }

  const discard = baseStack(deck.discard, deck.discardCount, '弃牌堆', 0x9d6e47);
  const face = new Graphics();
  face.roundRect(-stackW / 2 + 3, -stackH / 2 + 3, stackW - 6, stackH - 6, 7)
    .fill({ color: deck.discardCount ? 0x4a3527 : 0x102a2c, alpha: 0.96 })
    .stroke({ color: 0xd09862, width: 1, alpha: deck.discardCount ? 0.58 : 0.24 });
  discard.addChild(face);
  const discardName = makeText(deck.topDiscard?.name || '空', 9, deck.discardCount ? '#eed3a2' : '#718984', '800');
  discardName.anchor.set(0.5);
  discardName.style.wordWrap = true;
  discardName.style.wordWrapWidth = stackW - 12;
  discard.addChild(discardName);
}

function drawCenter(layer, width, height) {
  const cx = width * 0.5;
  const cy = height * 0.5;
  const r = Math.min(width, height) * 0.115;
  const shadow = new Graphics();
  shadow.ellipse(cx + 6, cy + 12, r * 1.22, r * 0.62).fill({ color: 0x000000, alpha: 0.42 });
  layer.addChild(shadow);
  const platform = new Graphics();
  platform.circle(cx, cy, r * 1.02).fill({ color: 0x43351f, alpha: 0.98 }).stroke({ color: 0xefc15e, width: 4, alpha: 0.85 });
  platform.circle(cx, cy, r * 0.78).fill({ color: 0x8f7236, alpha: 0.48 }).stroke({ color: 0xf1d07b, width: 2, alpha: 0.65 });
  platform.circle(cx, cy, r * 0.25).fill({ color: 0xd5a743, alpha: 0.34 });
  layer.addChild(platform);
  const title = makeText('中央起点', Math.max(12, r * 0.18), '#ffe7a1');
  title.anchor.set(0.5);
  title.x = cx;
  title.y = cy + r * 0.56;
  layer.addChild(title);
}

function drawTreasureRack(holder, player, treasureTextures) {
  const ids = Object.keys(TREASURE_META);
  const slotSize = 19;
  const gap = 4;
  const totalW = ids.length * slotSize + (ids.length - 1) * gap;
  const rack = new Container();
  rack.x = -totalW / 2 + slotSize / 2;
  rack.y = 37;

  const plate = new Graphics();
  plate.roundRect(-8, -7, totalW + 16, slotSize + 14, 10)
    .fill({ color: 0x061719, alpha: 0.92 })
    .stroke({ color: player.treasureKinds >= 3 ? 0xe7be5b : 0x8c784a, width: 1.2, alpha: 0.66 });
  rack.addChild(plate);

  ids.forEach((id, index) => {
    const meta = TREASURE_META[id];
    const count = player.treasures?.[id] || 0;
    const x = index * (slotSize + gap);
    const slot = new Graphics();
    slot.circle(x, slotSize / 2, slotSize / 2)
      .fill({ color: count ? 0x25352e : 0x0b2729, alpha: 0.98 })
      .stroke({ color: count ? meta.color : 0x5f6c65, width: count ? 1.6 : 1, alpha: count ? 0.9 : 0.35 });
    rack.addChild(slot);

    if (count && treasureTextures[id]) {
      const sprite = new Sprite(treasureTextures[id]);
      sprite.anchor.set(0.5);
      const target = slotSize - 4;
      const scale = Math.max(target / sprite.texture.width, target / sprite.texture.height);
      sprite.scale.set(scale);
      sprite.x = x;
      sprite.y = slotSize / 2;
      const mask = new Graphics();
      mask.circle(x, slotSize / 2, target / 2).fill(0xffffff);
      rack.addChild(mask);
      sprite.mask = mask;
      rack.addChild(sprite);
    } else {
      const empty = makeText(meta.short, 8, '#71847b', '800');
      empty.anchor.set(0.5);
      empty.x = x;
      empty.y = slotSize / 2;
      rack.addChild(empty);
    }

    if (count > 1) {
      const badge = new Graphics();
      badge.circle(x + 7, 2, 6).fill({ color: 0x7b5226, alpha: 0.98 }).stroke({ color: 0xf0cf7a, width: 1, alpha: 0.9 });
      rack.addChild(badge);
      const countText = makeText(String(count), 7, '#fff3c9', '900');
      countText.anchor.set(0.5);
      countText.x = x + 7;
      countText.y = 2;
      rack.addChild(countText);
    }
  });

  holder.addChild(rack);
}

function createPlayerToken(player, treasureTextures, active = false) {
  const style = PLAYER_STYLE[player.id] || PLAYER_STYLE.ai2;
  const holder = new Container();
  const token = new Graphics();
  if (active) token.circle(0, 0, 27).fill({ color: style.edge, alpha: 0.18 });
  token.circle(0, 0, 19).fill({ color: style.fill, alpha: 1 }).stroke({ color: style.edge, width: active ? 4 : 2, alpha: 1 });
  token.roundRect(-16, 15, 32, 13, 6).fill({ color: 0x101516, alpha: 0.92 });
  holder.addChild(token);
  const label = makeText(style.label, 16, '#fff6df', '900');
  label.anchor.set(0.5);
  label.y = -1;
  holder.addChild(label);
  drawTreasureRack(holder, player, treasureTextures);
  return holder;
}

function drawPlayers(layer, width, height, players, treasureTextures, hiddenIds = new Set()) {
  const grouped = new Map();
  for (const player of players) {
    if (hiddenIds.has(player.id)) continue;
    const key = `${player.slot}:${player.position}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(player);
  }

  for (const group of grouped.values()) {
    group.forEach((player, index) => {
      const spread = (index - (group.length - 1) / 2) * 92;
      const holder = createPlayerToken(player, treasureTextures, player.active);
      holder.x = width * player.x + spread;
      holder.y = height * player.y - 8;
      layer.addChild(holder);
    });
  }
}

function stagePoint(position, width, height) {
  const slot = position === 'center' ? STAGE_LAYOUT.center : (STAGE_LAYOUT.locations[position] || STAGE_LAYOUT.center);
  return { x: width * slot.x, y: height * slot.y - 8 };
}

function playerTreasurePoint(state, playerId, width, height) {
  const player = playerById(state, playerId);
  const base = stagePoint(player?.position || 'center', width, height);
  return { x: base.x, y: base.y + 48 };
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function tween(duration, update) {
  return new Promise(resolve => {
    const start = performance.now();
    function frame(now) {
      const raw = Math.min(1, (now - start) / Math.max(1, duration));
      update(easeOutCubic(raw), raw);
      if (raw >= 1) resolve();
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

async function animateToken(app, player, treasureTextures, from, to, width, height, duration, arc = 28) {
  const holder = createPlayerToken(player, treasureTextures, true);
  const start = stagePoint(from, width, height);
  const end = stagePoint(to, width, height);
  holder.x = start.x;
  holder.y = start.y;
  app.stage.addChild(holder);
  await tween(duration, (eased, raw) => {
    holder.x = start.x + (end.x - start.x) * eased;
    holder.y = start.y + (end.y - start.y) * eased - Math.sin(Math.PI * raw) * arc;
    holder.scale.set(1 + Math.sin(Math.PI * raw) * 0.12);
  });
  holder.destroy({ children: true });
}

async function animateTreasure(app, texture, treasureId, start, end, duration, arc = 52) {
  const meta = TREASURE_META[treasureId] || TREASURE_META.goldSeal;
  const holder = new Container();
  holder.x = start.x;
  holder.y = start.y;

  const glow = new Graphics();
  glow.circle(0, 0, 30).fill({ color: meta.color, alpha: 0.18 });
  glow.circle(0, 0, 23).stroke({ color: meta.color, width: 2.5, alpha: 0.8 });
  holder.addChild(glow);

  if (texture) {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    const targetW = 36;
    const targetH = 52;
    const scale = Math.max(targetW / sprite.texture.width, targetH / sprite.texture.height);
    sprite.scale.set(scale);
    const mask = new Graphics();
    mask.roundRect(-targetW / 2, -targetH / 2, targetW, targetH, 7).fill(0xffffff);
    holder.addChild(mask);
    sprite.mask = mask;
    holder.addChild(sprite);
  }

  const tag = makeText(meta.label, 10, '#fff0bd', '900');
  tag.anchor.set(0.5);
  tag.y = 38;
  holder.addChild(tag);
  app.stage.addChild(holder);

  await tween(duration, (eased, raw) => {
    holder.x = start.x + (end.x - start.x) * eased;
    holder.y = start.y + (end.y - start.y) * eased - Math.sin(Math.PI * raw) * arc;
    holder.rotation = Math.sin(Math.PI * raw) * 0.12;
    holder.scale.set(0.88 + Math.sin(Math.PI * raw) * 0.22);
    glow.alpha = 0.72 + Math.sin(Math.PI * raw) * 0.28;
  });
  holder.destroy({ children: true });
}

async function animateLocationReveal(app, texture, location, point, quality) {
  const stage = location?.stage || { revealLift: 42, tilt: 0.03, sceneScale: 1.08 };
  const holder = new Container();
  holder.x = point.x;
  holder.y = point.y + (quality === 'low' ? 16 : 28);
  holder.rotation = stage.tilt * 0.25;

  const glow = new Graphics();
  glow.ellipse(0, 12, 88, 52).fill({ color: 0xf0c86c, alpha: quality === 'low' ? 0.08 : 0.15 });
  glow.ellipse(0, 12, 72, 42).stroke({ color: 0xf3ce74, width: 2, alpha: 0.52 });
  holder.addChild(glow);

  const frame = new Graphics();
  frame.roundRect(-58, -44, 116, 88, 12)
    .fill({ color: 0x162523, alpha: 0.98 })
    .stroke({ color: 0xe0b65b, width: 3, alpha: 0.92 });
  holder.addChild(frame);

  if (texture) {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    const targetW = 106;
    const targetH = 70;
    const scale = Math.max(targetW / sprite.texture.width, targetH / sprite.texture.height);
    sprite.scale.set(scale * stage.sceneScale);
    const mask = new Graphics();
    mask.roundRect(-targetW / 2, -targetH / 2, targetW, targetH, 9).fill(0xffffff);
    holder.addChild(mask);
    sprite.mask = mask;
    holder.addChild(sprite);
  }

  const label = makeText(location?.name || '地点揭示', 12, '#ffe5a2', '900');
  label.anchor.set(0.5);
  label.y = 58;
  holder.addChild(label);
  app.stage.addChild(holder);

  const duration = quality === 'low' ? 360 : 760;
  const lift = stage.revealLift * (quality === 'low' ? 0.45 : 0.72);
  await tween(duration, (eased, raw) => {
    holder.y = point.y + (quality === 'low' ? 16 : 28) - lift * eased;
    holder.rotation = stage.tilt * (0.25 + eased * 0.75);
    holder.scale.set(0.76 + eased * 0.28 + Math.sin(Math.PI * raw) * 0.04);
    glow.alpha = 0.58 + Math.sin(Math.PI * raw) * 0.42;
  });
  await tween(quality === 'low' ? 90 : 150, (eased) => {
    holder.y += eased * 5;
    holder.alpha = 1 - eased;
  });
  holder.destroy({ children: true });
}

async function pulseEffect(app, point, effect, quality) {
  const style = EFFECT_STYLE[effect.kind] || EFFECT_STYLE['location-open'];
  const holder = new Container();
  holder.x = point.x;
  holder.y = point.y;
  const ring = new Graphics();
  ring.circle(0, 0, 34).fill({ color: style.color, alpha: 0.13 }).stroke({ color: style.color, width: 4, alpha: 0.9 });
  ring.circle(0, 0, 48).stroke({ color: style.color, width: 2, alpha: 0.45 });
  holder.addChild(ring);
  const label = makeText(style.label, 14, '#fff0bd', '900');
  label.anchor.set(0.5);
  label.y = -58;
  holder.addChild(label);
  app.stage.addChild(holder);
  const duration = quality === 'low' ? 300 : 620;
  await tween(duration, (eased, raw) => {
    holder.scale.set(0.78 + eased * 0.48);
    holder.alpha = raw < 0.68 ? 1 : Math.max(0, 1 - (raw - 0.68) / 0.32);
  });
  holder.destroy({ children: true });
}

export async function mountStage(host, session, options = {}) {
  const app = new Application();
  await app.init({
    resizeTo: host,
    backgroundAlpha: 0,
    antialias: options.quality !== 'low',
    preference: 'webgl',
    powerPreference: options.quality === 'low' ? 'low-power' : 'high-performance'
  });
  host.replaceChildren(app.canvas);
  app.canvas.className = 'v2-stage-canvas';

  const textures = {};
  for (const [key, url] of Object.entries(LOCATION_ART)) textures[key] = await Assets.load(url);
  for (const [key, url] of Object.entries(TREASURE_ART)) textures[key] = await Assets.load(url);
  textures.cardBack = await Assets.load(cardBackUrl);

  const treasureTextures = Object.fromEntries(Object.keys(TREASURE_ART).map(id => [id, textures[id]]));

  function renderState(state, renderOptions = {}) {
    const qualityId = renderOptions.quality || options.quality || 'standard';
    const model = buildStageModel(state, { quality: qualityId });
    const { width, height } = sizeOf(host);
    app.stage.removeChildren();
    const layer = new Container();
    app.stage.addChild(layer);
    drawBackground(layer, width, height, model.quality);
    drawRoutes(layer, width, height, model.locations, model.activePlayerId);
    for (const location of model.locations) drawLocation(layer, width, height, location, textures[location.id], model.quality);
    drawDeckStacks(layer, width, height, model.deck, textures.cardBack);
    drawCenter(layer, width, height);
    drawPlayers(layer, width, height, model.players, treasureTextures, new Set(renderOptions.hiddenPlayerIds || []));
    return { model, width, height };
  }

  function render(state, renderOptions = {}) {
    renderState(state, renderOptions);
  }

  async function present(effect, beforeState, afterState, renderOptions = {}) {
    const quality = renderOptions.quality || options.quality || 'standard';
    const motionScale = quality === 'low' ? 0.55 : 1;
    const duration = Math.round(620 * motionScale);

    if (effect.kind === 'move') {
      const beforePlayer = playerById(beforeState, effect.playerId) || { id: effect.playerId, treasures: {} };
      const { width, height } = renderState(beforeState, { quality, hiddenPlayerIds: [effect.playerId] });
      await animateToken(app, beforePlayer, treasureTextures, effect.from, effect.to, width, height, duration, 34 * motionScale);
      renderState(afterState, { quality });
      return;
    }

    if (effect.kind === 'swap') {
      const beforePlayer = playerById(beforeState, effect.playerId) || { id: effect.playerId, treasures: {} };
      const beforeTarget = playerById(beforeState, effect.targetPlayerId) || { id: effect.targetPlayerId, treasures: {} };
      const { width, height } = renderState(beforeState, { quality, hiddenPlayerIds: [effect.playerId, effect.targetPlayerId] });
      await Promise.all([
        animateToken(app, beforePlayer, treasureTextures, effect.from, effect.to, width, height, duration, 42 * motionScale),
        animateToken(app, beforeTarget, treasureTextures, effect.targetFrom, effect.targetTo, width, height, duration, -42 * motionScale)
      ]);
      renderState(afterState, { quality });
      return;
    }

    if (effect.kind === 'location-open') {
      const { width, height } = renderState(beforeState, { quality });
      const location = STAGE_LAYOUT.locations[effect.locationId] || STAGE_LAYOUT.locations.tainan;
      const point = stagePoint(effect.locationId || 'center', width, height);
      await animateLocationReveal(app, textures[effect.locationId], location, point, quality);
      renderState(afterState, { quality });
      await pulseEffect(app, point, effect, quality);
      renderState(afterState, { quality });
      return;
    }

    if (effect.kind === 'treasure') {
      const { width, height } = renderState(beforeState, { quality });
      const start = stagePoint(effect.locationId || 'center', width, height);
      const end = playerTreasurePoint(afterState, effect.playerId, width, height);
      await animateTreasure(app, treasureTextures[effect.treasureId], effect.treasureId, start, end, Math.round(720 * motionScale), 64 * motionScale);
      await pulseEffect(app, end, effect, quality);
      renderState(afterState, { quality });
      return;
    }

    if (effect.kind === 'treasure-swap') {
      const { width, height } = renderState(beforeState, { quality });
      const a = playerTreasurePoint(beforeState, effect.playerId, width, height);
      const b = playerTreasurePoint(beforeState, effect.targetPlayerId, width, height);
      await Promise.all([
        animateTreasure(app, treasureTextures[effect.ownTreasureId], effect.ownTreasureId, a, b, Math.round(760 * motionScale), 70 * motionScale),
        animateTreasure(app, treasureTextures[effect.targetTreasureId], effect.targetTreasureId, b, a, Math.round(760 * motionScale), -70 * motionScale)
      ]);
      await Promise.all([
        pulseEffect(app, a, effect, quality),
        pulseEffect(app, b, effect, quality)
      ]);
      renderState(afterState, { quality });
      return;
    }

    const { width, height } = renderState(afterState, { quality });
    if (effect.kind === 'burn' || effect.kind === 'lock') {
      const target = playerById(afterState, effect.targetPlayerId);
      const point = stagePoint(target?.position || 'center', width, height);
      await pulseEffect(app, point, effect, quality);
      renderState(afterState, { quality });
    }
  }

  render(session.state);
  return {
    render,
    present,
    destroy() { app.destroy(true, { children: true, texture: false }); }
  };
}

function playerById(state, playerId) {
  return state?.players?.find(player => player.id === playerId) || null;
}
