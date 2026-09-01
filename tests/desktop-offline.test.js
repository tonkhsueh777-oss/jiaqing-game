const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function entryAssetRefs(markup) {
  const refs = [];
  const pattern = /<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/gi;
  let match;
  while ((match = pattern.exec(markup))) refs.push(match[1]);
  return refs;
}

test('desktop entry uses only local script and stylesheet references', () => {
  const refs = entryAssetRefs(html);
  assert.equal(refs.length > 0, true);
  refs.forEach(ref => {
    assert.equal(/^https?:\/\//i.test(ref), false, `remote runtime reference found: ${ref}`);
    const localPath = ref.split('?')[0].replace(/^\.\//, '');
    assert.equal(fs.existsSync(path.join(root, localPath)), true, `missing local runtime asset: ${localPath}`);
  });
});
