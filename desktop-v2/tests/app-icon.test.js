import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

test('desktop build has a square SVG source icon and generates platform icons before build', () => {
  const iconPath = path.join(root, 'app-icon.svg');
  assert.equal(fs.existsSync(iconPath), true, 'desktop-v2/app-icon.svg should exist');
  const svg = fs.readFileSync(iconPath, 'utf8');
  assert.match(svg, /<svg\b/);
  assert.match(svg, /viewBox="0 0 512 512"/);

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.icons, 'tauri icon app-icon.svg');
  assert.equal(pkg.scripts['predesktop:dev'], 'npm run icons');
  assert.equal(pkg.scripts['predesktop:build:mac'], 'npm run icons');
});
