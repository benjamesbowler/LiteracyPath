import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { HOLLOW_ITEMS } from '../src/utils/hollowEconomy.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = {};
for (const { id } of HOLLOW_ITEMS) {
  const filename = path.join(root, 'public/images/hollow', `${id}.webp`);
  const bytes = fs.readFileSync(filename);
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bounds = [info.width, info.height, 0, 0];
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] < 192) continue;
    bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y);
    bounds[2] = Math.max(bounds[2], x + 1); bounds[3] = Math.max(bounds[3], y + 1);
  }
  if (bounds[2] <= bounds[0] || bounds[3] <= bounds[1]) throw new Error(`No visible Hollow decoration: ${id}`);
  rows[id] = { width: info.width, height: info.height, bounds, alphaThreshold: 192, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
}
const output = path.join(root, 'src/data/hollowDecorationBounds.generated.js');
const text = '// Generated from delivered alpha bodies. Run node tools/buildHollowDecorationBounds.mjs after replacing a decoration.\nexport const HOLLOW_DECORATION_BOUNDS = ' + JSON.stringify(rows, null, 2) + ';\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(output, 'utf8') !== text) throw new Error('Hollow decoration bounds are stale');
} else fs.writeFileSync(output, text);
console.log(JSON.stringify({ decorations: HOLLOW_ITEMS.length, check: process.argv.includes('--check') }));
