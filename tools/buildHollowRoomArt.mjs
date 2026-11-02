import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { HOLLOW_ARTWORK_REVISION, HOLLOW_ARTWORK_CONTACTS } from '../src/data/hollowArtworkRegistration.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'source-art/hollow/clean-cartoon/manifest.json')));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
if (manifest.revision !== HOLLOW_ARTWORK_REVISION) throw new Error('Hollow art and placement revisions differ');
const pending = [];
for (const asset of manifest.assets) {
  if (JSON.stringify(asset.contacts) !== JSON.stringify(HOLLOW_ARTWORK_CONTACTS[asset.room])) throw new Error(`Hollow contact map changed: ${asset.room}`);
  const source = fs.readFileSync(path.join(root, asset.source));
  if (hash(source) !== asset.sourceSha256) throw new Error(`Hollow source changed: ${asset.room}`);
  if (hash(fs.readFileSync(path.join(root, asset.prompt))) !== asset.promptSha256) throw new Error(`Hollow prompt changed: ${asset.room}`);
  const output = path.join(root, `public${asset.runtime}`);
  if (process.argv.includes('--write')) {
    const bytes = await sharp(source).resize(asset.width, asset.height, { fit: 'fill' }).webp(asset.encoding).toBuffer();
    if (hash(bytes) !== asset.runtimeSha256) throw new Error(`Hollow encoder no longer reproduces reviewed pixels: ${asset.room}`);
    pending.push({ output, bytes });
  }
  const current = fs.readFileSync(output), meta = await sharp(current).metadata();
  if (hash(current) !== asset.runtimeSha256 || meta.width !== asset.width || meta.height !== asset.height || meta.hasAlpha) throw new Error(`Hollow delivery differs: ${asset.room}`);
}
for (const { output, bytes } of pending) {
  fs.writeFileSync(`${output}.tmp`, bytes);
  fs.renameSync(`${output}.tmp`, output);
}
console.log(JSON.stringify({ rooms: manifest.assets.length, write: process.argv.includes('--write'), exactReviewedBytes: true }));
