import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(root, 'desktop-dist');

const rootFiles = fs.readdirSync(root, { withFileTypes: true });
const allowedRootFiles = rootFiles
  .filter(entry => entry.isFile())
  .map(entry => entry.name)
  .filter(name => name === 'index.html' || name.endsWith('.css'));

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of allowedRootFiles) {
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}

for (const dir of ['src', 'assets']) {
  fs.cpSync(path.join(root, dir), path.join(out, dir), { recursive: true });
}

console.log(`Desktop staging complete: ${out}`);
