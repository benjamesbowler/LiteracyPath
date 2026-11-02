import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { connectedAlphaCrop } from './art/connectedAlphaCrop.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await fs.readFile(path.join(root, 'source-art/sound-seekers/cast-clean-cartoon/manifest.json'), 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const output = process.argv.find(value => value.startsWith('--output-dir='));
const outputDir = output && path.resolve(output.slice('--output-dir='.length));
const check = process.argv.includes('--check');
for (const bank of manifest.banks) {
  const input = await fs.readFile(path.join(root, bank.native.path));
  if (hash(input) !== bank.native.sha256) throw new Error(`Changed source bank: ${bank.id}`);
  for (const sprite of bank.sprites) {
    const isolated = await connectedAlphaCrop(input, sprite.rect);
    const padded = await sharp(isolated).extend({ top: sprite.pad, bottom: sprite.pad, left: sprite.pad, right: sprite.pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    const buffer = await sharp(padded).resize(sprite.width, 512, { fit: 'fill' }).webp(manifest.encoding).toBuffer();
    const metadata = await sharp(buffer).metadata();
    if (metadata.width !== sprite.width || metadata.height !== 512 || !metadata.hasAlpha) throw new Error(`Invalid sprite dimensions or alpha: ${sprite.id}`);
    if (hash(buffer) !== sprite.sha256) throw new Error(`Recipe changed: ${sprite.id}`);
    const destination = outputDir ? path.join(outputDir, bank.world, sprite.id + '.webp') : path.join(root, 'public', sprite.path);
    if (check) {
      if (hash(await fs.readFile(destination)) !== sprite.sha256) throw new Error(`Delivery changed: ${sprite.id}`);
    } else {
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, buffer);
    }
  }
}
console.log(JSON.stringify({ banks: manifest.banks.length, sprites: manifest.banks.reduce((n, b) => n + b.sprites.length, 0), check, status: 'PASS' }));
