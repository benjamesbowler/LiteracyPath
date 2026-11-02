import fs from 'node:fs/promises';
import path from 'node:path';
import { withRepairedImageVersion } from '../src/utils/repairedImageVersion.js';
const root = path.resolve(import.meta.dirname, '..');
export async function syncCleanCartoonBackgroundVersions({ write = false } = {}) {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'source-art/app-clean-cartoon/resumed-backgrounds/manifest.json')));
  const selected = new Set(manifest.assets.map(asset => asset.path));
  const changed = [], seen = new Set();
  for await (const relative of fs.glob('src/**/*.css', { cwd: root })) {
    const filename = path.join(root, relative), before = await fs.readFile(filename, 'utf8');
    const after = before.replace(/url\(\s*(['"]?)([^'"()\s]+)\1\s*\)/g, (match, quote, src) => {
      const canonical = src.split(/[?#]/, 1)[0];
      if (!selected.has(canonical)) return match;
      const versioned = withRepairedImageVersion(src);
      if (!versioned.includes('?v=') && !versioned.includes('&v=')) throw Error(`Background has no current transport revision: ${canonical}`);
      seen.add(canonical);
      return `url(${quote}${versioned}${quote})`;
    });
    if (before !== after) { changed.push(relative); if (write) await fs.writeFile(filename, after); }
  }
  if (!write && changed.length) throw Error(`Current background CSS versions differ: ${changed.join(', ')}`);
  return { selectedAssets: selected.size, cssAssets: seen.size, changed, write };
}
if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  console.log(JSON.stringify(await syncCleanCartoonBackgroundVersions({ write: process.argv.includes('--write') })));
}
