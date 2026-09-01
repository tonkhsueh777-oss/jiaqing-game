import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(root, 'desktop-dist');

const rootFiles = fs.readdirSync(root, { withFileTypes: true });
const allowedRootFiles = rootFiles
  .filter(entry => entry.isFile())
  .map(entry => entry.name)
  .filter(name => name === 'index.html' || name.endsWith('.css'));

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDirectory(sourceDir, targetDir, options = {}) {
  ensureDir(targetDir);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(source, target, options);
      continue;
    }
    if (options.transpileJs && entry.name.endsWith('.js')) {
      const sourceText = fs.readFileSync(source, 'utf8');
      const result = transformSync(sourceText, {
        loader: 'js',
        target: 'safari12',
        charset: 'utf8',
        legalComments: 'none'
      });
      fs.writeFileSync(target, result.code, 'utf8');
      continue;
    }
    fs.copyFileSync(source, target);
  }
}

fs.rmSync(out, { recursive: true, force: true });
ensureDir(out);

for (const file of allowedRootFiles) {
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}

copyDirectory(path.join(root, 'src'), path.join(out, 'src'), { transpileJs: true });
copyDirectory(path.join(root, 'assets'), path.join(out, 'assets'));

console.log(`Desktop staging complete: ${out}`);
