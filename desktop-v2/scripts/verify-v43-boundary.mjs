import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const protectedV43Paths = new Set([
  'index.html',
  'src/catalog.js',
  'src/state.js',
  'src/rules.js',
  'src/ai.js',
  'src/main.js',
  'src/ui.js',
  'src/v23-visual-effects.js'
]);

export function findProtectedChanges(paths) {
  return paths.filter(path => protectedV43Paths.has(path));
}

export function verifyBoundary({ base = process.env.V43_BASE || '2518d190b4b38d7373aff625039c3f5acccafb85' } = {}) {
  const output = execFileSync('git', ['diff', '--name-only', base, '--'], { encoding: 'utf8' });
  const paths = output.trim().split('\n').filter(Boolean);
  const changed = findProtectedChanges(paths);
  if (changed.length) {
    throw new Error(`V2 must not modify protected V43 files:\n${changed.join('\n')}`);
  }
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    verifyBoundary();
    console.log('V43 boundary OK');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
