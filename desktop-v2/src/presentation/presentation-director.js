import { resolveCardAsset } from '../ui/card-assets.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const TITLES = Object.freeze({
  move: ['巡游', '棋子沿御案路线移动'],
  swap: ['假绿菊花', '双方当前位置交换'],
  burn: ['火烧百顺楼', '随机焚毁目标一张手牌'],
  lock: ['恶霸王豹', '目标下一个完整回合被封锁'],
  treasure: ['明察得宝', '宝物收入玩家收藏'],
  'location-open': ['地牌揭示', '新的地点进入御前战局'],
  'treasure-swap': ['御令发动', '双方宝物强制交换'],
  discard: ['弃牌', '手牌进入弃牌堆']
});

const TREASURES = Object.freeze([
  ['goldSeal', '金印'], ['sword', '宝剑'], ['gun', '火枪'], ['pomelo', '柚子']
]);

function qualityDuration(root, standard, low) {
  return root.dataset.quality === 'low' ? low : standard;
}

function ensureOverlay(root) {
  const stage = root.querySelector('#v2-stage');
  if (!stage) return null;
  let overlay = stage.querySelector('#v2-presentation-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'v2-presentation-overlay';
    overlay.className = 'v2-presentation-overlay';
    overlay.setAttribute('aria-live', 'polite');
    stage.appendChild(overlay);
  }
  return overlay;
}

function cardLike(effect) {
  return {
    type: effect.cardType,
    key: effect.cardKey,
    locationId: effect.locationId
  };
}

function burnedCardLike(effect) {
  return {
    type: effect.burnedCardType,
    key: effect.burnedCardKey,
    locationId: effect.burnedLocationId
  };
}

function clearOverlay(overlay) {
  if (!overlay) return;
  overlay.className = 'v2-presentation-overlay';
  overlay.replaceChildren();
}

async function showCardReveal(root, overlay, effect) {
  if (!overlay) return;
  const src = resolveCardAsset(cardLike(effect));
  overlay.className = 'v2-presentation-overlay is-active is-card-reveal';
  overlay.innerHTML = `
    <div class="v2-reveal-shade"></div>
    <div class="v2-reveal-content">
      <span class="v2-reveal-kicker">${effect.playerId === 'ai1' ? 'AI 玩家一发动' : 'AI 玩家二发动'}</span>
      <div class="v2-reveal-card-wrap">
        ${src ? `<img class="v2-reveal-card" src="${src}" alt="${effect.cardName}">` : '<div class="v2-reveal-card v2-reveal-card--empty"></div>'}
      </div>
      <strong>${effect.cardName}</strong>
    </div>`;
  await sleep(qualityDuration(root, 760, 360));
  overlay.classList.add('is-leaving');
  await sleep(qualityDuration(root, 180, 80));
  clearOverlay(overlay);
}

async function showDraw(root, overlay, effect) {
  if (!overlay) return;
  const hidden = effect.kind === 'draw-hidden';
  const src = hidden ? '' : resolveCardAsset(cardLike(effect));
  const owner = effect.playerId === 'human' ? '补入你的手牌' : `${effect.playerId === 'ai1' ? 'AI 玩家一' : 'AI 玩家二'}补牌`;
  overlay.className = `v2-presentation-overlay is-active is-draw ${hidden ? 'is-draw-hidden' : 'is-draw-visible'}`;
  overlay.innerHTML = `
    <div class="v2-draw-content">
      <small>${owner}</small>
      <div class="v2-draw-card-wrap">
        ${hidden
          ? '<div class="v2-draw-card-back"><span>御</span></div>'
          : `<img class="v2-draw-card" src="${src}" alt="${effect.cardName}">`}
      </div>
      <strong>${hidden ? `补牌 ×${effect.count || 1}` : effect.cardName}</strong>
    </div>`;
  await sleep(qualityDuration(root, 520, 250));
  overlay.classList.add('is-leaving');
  await sleep(qualityDuration(root, 130, 60));
  clearOverlay(overlay);
}

async function showDiscard(root, overlay, effect) {
  if (!overlay) return;
  const src = resolveCardAsset(cardLike(effect));
  overlay.className = 'v2-presentation-overlay is-active is-discard-flight';
  overlay.innerHTML = `
    <div class="v2-discard-label"><small>弃牌</small><strong>${effect.cardName}</strong></div>
    ${src
      ? `<img class="v2-discard-flying-card" src="${src}" alt="${effect.cardName}">`
      : `<div class="v2-discard-flying-card v2-discard-flying-card--empty">${effect.cardName}</div>`}`;
  await sleep(qualityDuration(root, 600, 280));
  overlay.classList.add('is-leaving');
  await sleep(qualityDuration(root, 100, 50));
  clearOverlay(overlay);
}

function detailFor(effect) {
  if (effect.kind === 'burn') return `被烧掉：${effect.burnedCardName || '1张手牌'}`;
  if (effect.kind === 'swap') return '双方棋子沿交叉轨迹完成换位';
  if (effect.kind === 'lock') return '目标玩家的下一完整回合无法行动';
  if (effect.kind === 'treasure') return '宝物从地点进入玩家收藏';
  if (effect.kind === 'treasure-swap') return '御令强制完成双方宝物交换';
  return TITLES[effect.kind]?.[1] || '';
}

function extraEffectMarkup(effect) {
  if (effect.kind !== 'burn') return '';
  const src = resolveCardAsset(burnedCardLike(effect));
  if (!src) return '';
  return `<div class="v2-burned-card-wrap"><img class="v2-burned-card" src="${src}" alt="${effect.burnedCardName}"></div>`;
}

async function showEffectBanner(root, overlay, effect, stagePromise) {
  if (!overlay) {
    await stagePromise;
    return;
  }
  const [title] = TITLES[effect.kind] || [effect.cardName || '御前行动'];
  overlay.className = `v2-presentation-overlay is-active is-effect is-${effect.kind}`;
  overlay.innerHTML = `
    ${extraEffectMarkup(effect)}
    <div class="v2-effect-banner">
      <small>${effect.cardName && effect.cardName !== title ? effect.cardName : '御前战局'}</small>
      <strong>${title}</strong>
      <span>${detailFor(effect)}</span>
    </div>`;
  await Promise.all([
    stagePromise,
    sleep(qualityDuration(root, effect.kind === 'move' ? 520 : 680, effect.kind === 'move' ? 260 : 340))
  ]);
  overlay.classList.add('is-leaving');
  await sleep(qualityDuration(root, 150, 70));
  clearOverlay(overlay);
}

function treasureStrip() {
  return TREASURES.map(([id, label]) => {
    const src = resolveCardAsset({ key: id });
    return `<div class="v2-endgame-treasure">${src ? `<img src="${src}" alt="${label}">` : ''}<span>${label}</span></div>`;
  }).join('');
}

async function showEndgame(root, overlay, effect) {
  if (!overlay) return;
  const victory = effect.kind === 'victory';
  overlay.className = `v2-presentation-overlay is-active is-endgame ${victory ? 'is-victory' : 'is-defeat'}`;
  overlay.innerHTML = `
    <div class="v2-endgame-shade"></div>
    <div class="v2-endgame-panel">
      <small>${victory ? '四宝齐聚 · 御前定胜' : '牌局终了 · 对手捷足先登'}</small>
      <strong>${victory ? '御前大胜' : '挑战失败'}</strong>
      <p>${victory ? '你率先集齐四类宝物。' : `${effect.winnerName}率先集齐四类宝物。`}</p>
      <div class="v2-endgame-treasures">${treasureStrip()}</div>
    </div>`;
  await sleep(qualityDuration(root, 2300, 1200));
  overlay.classList.add('is-leaving');
  await sleep(qualityDuration(root, 260, 100));
  clearOverlay(overlay);
}

export function createPresentationDirector({ root, stage, audio = null }) {
  if (!root || !stage) throw new Error('presentation director requires root and stage');
  const overlay = ensureOverlay(root);

  async function play(sequence, event) {
    const beforeState = event.beforeState || event.state;
    const afterState = event.state;
    for (const effect of sequence || []) {
      if (audio?.playPresentation) void audio.playPresentation(effect);
      if (effect.kind === 'card-reveal') {
        await showCardReveal(root, overlay, effect);
        continue;
      }
      if (effect.kind === 'draw-card' || effect.kind === 'draw-hidden') {
        await showDraw(root, overlay, effect);
        continue;
      }
      if (effect.kind === 'discard') {
        await showDiscard(root, overlay, effect);
        continue;
      }
      if (effect.kind === 'victory' || effect.kind === 'defeat') {
        await showEndgame(root, overlay, effect);
        continue;
      }
      const stagePromise = typeof stage.present === 'function'
        ? stage.present(effect, beforeState, afterState, { quality: root.dataset.quality || 'standard' })
        : Promise.resolve();
      await showEffectBanner(root, overlay, effect, stagePromise);
    }
  }

  return Object.freeze({ play });
}
