(function (root) {
  const game = root.JQGame;
  const transparentPixel = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1' viewBox='0 0 1 1'%3E%3C/svg%3E";

  function ensureSpriteStyle() {
    if (document.getElementById('jq-card-sprite-style')) return;
    const sprite = String(game.CARD_SPRITE || '').replace(/'/g, "\\'");
    if (!sprite) return;
    const style = document.createElement('style');
    style.id = 'jq-card-sprite-style';
    style.textContent = `.jq-sprite-art{background-image:url('${sprite}')!important;background-size:400% 400%!important;background-repeat:no-repeat!important;background-color:#0a2530!important;object-fit:contain!important;}`;
    document.head.appendChild(style);
  }

  function applySpriteArt(rootNode = document) {
    if (!game.CARD_SPRITE) return;
    ensureSpriteStyle();
    rootNode.querySelectorAll?.('img[src^="sprite:"]').forEach(img => {
      const raw = img.getAttribute('src') || '';
      const index = Number(raw.slice(7));
      if (!Number.isInteger(index) || index < 0 || index > 15) return;
      const col = index % 4;
      const row = Math.floor(index / 4);
      img.src = transparentPixel;
      img.classList.add('jq-sprite-art');
      img.style.backgroundPosition = `${(col / 3) * 100}% ${(row / 3) * 100}%`;
    });
  }

  function observe() {
    applySpriteArt(document);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches?.('img[src^="sprite:"]')) applySpriteArt(node.parentElement || document);
          else applySpriteArt(node);
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
})(globalThis);
