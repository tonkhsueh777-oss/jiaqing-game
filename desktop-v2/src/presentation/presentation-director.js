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

function detailFor(effect) {
  if (effect.kind === 'burn') return `被烧掉：${effect.burnedCardName || '1张手牌'}`;
  if (effect.kind === 'swap') return '双方棋子沿交叉轨迹完成换位';
  if (effect.kind === 'lock') return '目标玩家的下一完整回合无法行动';
  if (effect.kind === 'treasure') return '宝物从地点进入玩家收藏';
  if (effect.kind === 'treasure-swap') return '御令强制完成双方宝物交换';
  return TITLES[effect.kind]?.[1] || '';
}

async function showEffectBanner(root, overlay, effect, stagePromise) {
  if (!overlay) {
    await stagePromise;
    return;
  }
  const [title] = TITLES[effect.kind] || [effect.cardName || '御前行动'];
  overlay.className = `v2-presentation-overlay is-active is-effect is-${effect.kind}`;
  overlay.innerHTML = `
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

export function createPresentationDirector({ root, stage }) {
  if (!root || !stage) throw new Error('presentation director requires root and stage');
  const overlay = ensureOverlay(root);

  async function play(sequence, event) {
    const beforeState = event.beforeState || event.state;
    const afterState = event.state;
    for (const effect of sequence || []) {
      if (effect.kind === 'card-reveal') {
        await showCardReveal(root, overlay, effect);
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
