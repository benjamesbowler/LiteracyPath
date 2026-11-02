import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { connectedAlphaCrop } from './art/connectedAlphaCrop.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifestPath = path.join(root, 'source-art/sound-seekers/campaign-props/manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const arg = process.argv.find(value => value.startsWith('--output-dir='));
const outputDir = arg && path.resolve(arg.slice('--output-dir='.length));
const check = process.argv.includes('--check');
for (const asset of manifest.assets) {
  const input = await fs.readFile(path.join(root, asset.native.path));
  if (hash(input) !== asset.native.sha256) throw new Error(`Changed provider native: ${asset.id}`);
  const metadata = await sharp(input).metadata();
  if (!metadata.hasAlpha || metadata.width !== asset.native.width || metadata.height !== asset.native.height) throw new Error(`Invalid native geometry: ${asset.id}`);
  const layers = [];
  for (const cell of asset.cells) {
    const [x, y, boxWidth, boxHeight] = cell.targetRect;
    const margin = cell.gutter;
    const isolated = await connectedAlphaCrop(input, cell.sourceRect);
    const { data, info } = await sharp(isolated).resize(boxWidth - margin * 2, boxHeight - margin * 2, { fit: 'inside' }).png().toBuffer({ resolveWithObject: true });
    layers.push({ input: data, left: x + Math.floor((boxWidth - info.width) / 2), top: y + Math.floor((boxHeight - info.height) / 2) });
  }
  const buffer = await sharp({ create: { width: asset.width, height: asset.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(layers).png().toBuffer();
  if (hash(buffer) !== asset.sha256) throw new Error(`Recipe output differs: ${asset.id}`);
  const destination = outputDir ? path.join(outputDir, path.basename(asset.path)) : path.join(root, 'public', asset.path);
  if (check) {
    if (hash(await fs.readFile(destination)) !== asset.sha256) throw new Error(`Delivery differs: ${asset.id}`);
  } else {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, buffer);
  }
}
console.log(JSON.stringify({ assets: manifest.assets.length, check, outputDir, status: 'PASS' }));
