(function (root) {
  const game = root.JQGame;
  const doc = root.document;
  if (!game || !doc?.body?.classList?.contains('desktop-mode')) return;

  const reducedMotion = doc.body.classList.contains('reduced-motion');

  try {
    game.DesktopScene?.init({ root: doc.documentElement, document: doc, window: root, reducedMotion });
  } catch (_) {}

  try {
    game.DesktopCardMotion?.bind(doc.getElementById('app'), { reducedMotion });
  } catch (_) {}

  try {
    game.DesktopDrawCinematic?.install(game.UI, doc);
  } catch (_) {}

  try {
    game.DesktopAiCinematic?.install(game.UI, game.VisualEffectsLogic, doc, root);
  } catch (_) {}

  try {
    game.DesktopAudioController = game.DesktopAudio?.createController?.();
  } catch (_) {
    game.DesktopAudioController = null;
  }
})(globalThis);
