import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserPlatform } from '../src/platform/browser-platform.js';

test('platform api persists settings and save state behind one contract', async () => {
  const memory = new Map();
  const storage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: key => memory.delete(key)
  };
  const platform = createBrowserPlatform({ storage });

  await platform.settings.set('quality', 'low');
  assert.equal(await platform.settings.get('quality', 'standard'), 'low');

  await platform.save.write({ turnNumber: 4 });
  assert.deepEqual(await platform.save.load(), { turnNumber: 4 });
  await platform.save.clear();
  assert.equal(await platform.save.load(), null);
});
