import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pkgPath = path.resolve('package.json');
const stagePath = path.resolve('src/stage/stage-view.js');

test('V2 desktop stage uses PixiJS for the 2.5D presentation layer', () => {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.ok(pkg.dependencies?.['pixi.js']);
  const stageSource = fs.readFileSync(stagePath, 'utf8');
  assert.match(stageSource, /from 'pixi\.js'/);
  assert.match(stageSource, /preference: 'webgl'/);
});
