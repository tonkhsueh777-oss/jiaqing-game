let loaded = null;

export async function loadV43Core() {
  if (loaded) return loaded;

  globalThis.JQGame = {};
  await import('../../../src/namespace.js');
  await import('../../../src/catalog.js');
  await import('../../../src/state.js');
  await import('../../../src/rules.js');
  await import('../../../src/ai.js');
  await import('../../../src/storage.js');

  loaded = globalThis.JQGame;
  return loaded;
}
