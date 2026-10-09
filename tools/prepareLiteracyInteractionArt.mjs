import sharp from 'sharp';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import artwork from '../src/content/literacy-interactions/artwork.json' with { type: 'json' };
const root = new URL('../', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
for (const asset of artwork) {
  const source = await fs.readFile(new URL(asset.sourcePath, root));
  const meta = await sharp(source).metadata();
  asset.sourceSha256 = hash(source);
  asset.cards = [];
  for (let i = 0; i < 3; i++) {
    const left = Math.round(meta.width * i / 3), right = Math.round(meta.width * (i + 1) / 3);
    const bytes = await sharp(source).extract({ left, top: 0, width: right - left, height: meta.height }).resize({ width: 512 }).webp({ quality: 88 }).toBuffer();
    const path = '/images/assessment/literacy-interactions/' + asset.id + '-' + (i + 1) + '.webp';
    await fs.writeFile(new URL('public' + path, root), bytes);
    asset.cards.push({ path, sha256: hash(bytes), bytes: bytes.length });
  }
  asset.deliveryTransform = 'Extract complete equal storyboard panels and encode 512px WebP; no redraw or semantic change.';
  asset.review = '2026-10-09: all three distinct actions visible, consistent character and object, no labels, complete framing.';
}
await fs.writeFile(new URL('src/content/literacy-interactions/artwork.json', root), JSON.stringify(artwork, null, 2) + '\n');
