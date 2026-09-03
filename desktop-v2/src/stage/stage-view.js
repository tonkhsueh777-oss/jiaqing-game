import { Application, Assets, Container, Graphics, Sprite, Text } from 'pixi.js';
import { buildStageModel, STAGE_LAYOUT } from './stage-model.js';
import tainanUrl from '../../../assets/cards/03-tainan.jpg';
import mengxiaUrl from '../../../assets/cards/04-mengxia.jpg';
import zhuluoUrl from '../../../assets/cards/05-zhuluo.jpg';
import madouUrl from '../../../assets/cards/06-madou.jpg';

const LOCATION_ART = Object.freeze({
  tainan: tainanUrl,
  mengxia: mengxiaUrl,
  zhuluo: zhuluoUrl,
  madou: madouUrl
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

async function drawLocation(layer, width, height, location, texture) {
  const x = width * location.x;
  const y = height * location.y;
  const landscape = location.slot === 'east' || location.slot === 'west';
  const cardW = Math.min(width * (landscape ? 0.19 : 0.175), 245);
  const cardH = Math.min(height * (landscape ? 0.29 : 0.25), 190);

  const holder = new Container();
  holder.x = x;
  holder.y = y;

  const shadow = new Graphics();
  shadow.roundRect(-cardW / 2 + 8, -cardH / 2 + 12, cardW, cardH, 18).fill({ color: 0x000000, alpha: 0.38 });
  holder.addChild(shadow);

  const frame = new Graphics();
  frame.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 18)
    .fill({ color: 0x1b241d, alpha: 0.96 })
    .stroke({ color: 0xd4a64c, width: 3, alpha: 0.8 });
  holder.addChild(frame);

  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5);
  const targetW = cardW - 14;
  const targetH = cardH - 40;
  const scale = Math.max(targetW / sprite.texture.width, targetH / sprite.texture.height);
  sprite.scale.set(scale);
  const mask = new Graphics();
  mask.roundRect(-targetW / 2, -targetH / 2 - 12, targetW, targetH, 12).fill(0xffffff);
  holder.addChild(mask);
  sprite.mask = mask;
  sprite.y = -12;
  holder.addChild(sprite);

  const labelPlate = new Graphics();
  labelPlate.roundRect(-cardW * 0.36, cardH * 0.26, cardW * 0.72, 34, 9)
    .fill({ color: 0xd4b16b, alpha: 0.96 })
    .stroke({ color: 0x5b3916, width: 2, alpha: 0.9 });
  holder.addChild(labelPlate);
  const label = makeText(location.name, Math.max(13, cardW * 0.075), '#24160b', '800');
  label.anchor.set(0.5);
  label.y = cardH * 0.26 + 17;
  holder.addChild(label);
  layer.addChild(holder);
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

function createPlayerToken(playerId, active = false) {
  const style = PLAYER_STYLE[playerId] || PLAYER_STYLE.ai2;
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
  return holder;
}

function drawPlayers(layer, width, height, players, hiddenIds = new Set()) {
  const grouped = new Map();
  for (const player of players) {
    if (hiddenIds.has(player.id)) continue;
    const key = `${player.slot}:${player.position}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(player);
  }

  for (const group of grouped.values()) {
    group.forEach((player, index) => {
      const spread = (index - (group.length - 1) / 2) * 44;
      const holder = createPlayerToken(player.id, player.active);
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

async function animateToken(app, playerId, from, to, width, height, duration, arc = 28) {
  const holder = createPlayerToken(playerId, true);
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

  function renderState(state, renderOptions = {}) {
    const qualityId = renderOptions.quality || options.quality || 'standard';
    const model = buildStageModel(state, { quality: qualityId });
    const { width, height } = sizeOf(host);
    app.stage.removeChildren();
    const layer = new Container();
    app.stage.addChild(layer);
    drawBackground(layer, width, height, model.quality);
    drawRoutes(layer, width, height, model.locations, model.activePlayerId);
    for (const location of model.locations) drawLocation(layer, width, height, location, textures[location.id]);
    drawCenter(layer, width, height);
    drawPlayers(layer, width, height, model.players, new Set(renderOptions.hiddenPlayerIds || []));
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
      const { width, height } = renderState(beforeState, { quality, hiddenPlayerIds: [effect.playerId] });
      await animateToken(app, effect.playerId, effect.from, effect.to, width, height, duration, 34 * motionScale);
      renderState(afterState, { quality });
      return;
    }

    if (effect.kind === 'swap') {
      const { width, height } = renderState(beforeState, { quality, hiddenPlayerIds: [effect.playerId, effect.targetPlayerId] });
      await Promise.all([
        animateToken(app, effect.playerId, effect.from, effect.to, width, height, duration, 42 * motionScale),
        animateToken(app, effect.targetPlayerId, effect.targetFrom, effect.targetTo, width, height, duration, -42 * motionScale)
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
      return;
    }

    if (effect.kind === 'treasure' || effect.kind === 'location-open') {
      const point = stagePoint(effect.locationId || 'center', width, height);
      await pulseEffect(app, point, effect, quality);
      renderState(afterState, { quality });
      return;
    }

    if (effect.kind === 'treasure-swap') {
      const player = playerById(afterState, effect.playerId);
      const target = playerById(afterState, effect.targetPlayerId);
      const a = stagePoint(player?.position || 'center', width, height);
      const b = stagePoint(target?.position || 'center', width, height);
      await Promise.all([
        pulseEffect(app, a, effect, quality),
        pulseEffect(app, b, effect, quality)
      ]);
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
