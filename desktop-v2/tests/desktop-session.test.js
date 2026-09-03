import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesktopSession } from '../src/state/desktop-session.js';

test('desktop session restores save, can save, and can reset to a new game', async () => {
  const writes = [];
  let cleared = false;
  const saved = { turnNumber: 9, players: [] };
  const platform = {
    save: {
      async load() { return saved; },
      async write(value) { writes.push(value); },
      async clear() { cleared = true; }
    }
  };
  const adapter = {
    createState() { return { turnNumber: 1, players: [{ id: 'human' }] }; },
    snapshot(value) { return structuredClone(value); }
  };

  const session = await createDesktopSession({ adapter, platform });
  assert.equal(session.state.turnNumber, 9);
  await session.save();
  assert.equal(writes[0].turnNumber, 9);
  const next = await session.newGame();
  assert.equal(cleared, true);
  assert.equal(next.turnNumber, 1);
});
