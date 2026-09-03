import { Application, Assets, Container, Graphics, Sprite, Text } from 'pixi.js';
import { buildStageModel } from './stage-model.js';
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

function drawPlayers(layer, width, height, players) {
  const grouped = new Map();
  for (const player of players) {
    const key = `${player.slot}:${player.position}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(player);
  }

  for (const group of grouped.values()) {
    group.forEach((player, index) => {
      const style = PLAYER_STYLE[player.id] || PLAYER_STYLE.ai2;
      const spread = (index - (group.length - 1) / 2) * 44;
      const x = width * player.x + spread;
      const y = height * player.y - 8;
      const token = new Graphics();
      if (player.active) token.circle(x, y, 27).fill({ color: style.edge, alpha: 0.18 });
      token.circle(x, y, 19).fill({ color: style.fill, alpha: 1 }).stroke({ color: style.edge, width: player.active ? 4 : 2, alpha: 1 });
      token.roundRect(x - 16, y + 15, 32, 13, 6).fill({ color: 0x101516, alpha: 0.92 });
      layer.addChild(token);
      const label = makeText(style.label, 16, '#fff6df', '900');
      label.anchor.set(0.5);
      label.x = x;
      label.y = y - 1;
      layer.addChild(label);
    });
  }
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

  function render(state, renderOptions = {}) {
    const model = buildStageModel(state, { quality: renderOptions.quality || options.quality || 'standard' });
    const { width, height } = sizeOf(host);
    app.stage.removeChildren();
    const layer = new Container();
    app.stage.addChild(layer);
    drawBackground(layer, width, height, model.quality);
    drawRoutes(layer, width, height, model.locations, model.activePlayerId);
    for (const location of model.locations) drawLocation(layer, width, height, location, textures[location.id]);
    drawCenter(layer, width, height);
    drawPlayers(layer, width, height, model.players);
  }

  render(session.state);
  return {
    render,
    destroy() { app.destroy(true, { children: true, texture: false }); }
  };
}
