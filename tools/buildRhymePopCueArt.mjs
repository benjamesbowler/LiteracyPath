import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';

const manifest = JSON.parse(await fs.readFile('source-art/app-clean-cartoon/rhyme-v2-cues/manifest.json', 'utf8'));
const write = process.argv.includes('--write');
if (process.argv.some((arg, index) => index > 1 && !['--write', '--check'].includes(arg))) throw new Error('Use --write or --check');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const asset of manifest.assets) {
  const source = await fs.readFile(asset.source);
  for (const [file, expected] of [[asset.source, asset.sourceSha256], [asset.promptFile, asset.promptSha256], [asset.receipt, asset.receiptSha256], [asset.reference, asset.originalSha256]]) {
    if (hash(await fs.readFile(file)) !== expected) throw new Error('Source or provenance drift: ' + file);
  }
  const output = await sharp(source).resize(asset.resize).webp(asset.encoding).toBuffer();
  if (hash(output) !== asset.sha256) throw new Error('Recipe drift: ' + asset.word);
  const destination = 'public' + asset.path;
  const current = hash(await fs.readFile(destination));
  if (write && current !== asset.sha256) {
    if (current !== asset.originalSha256) throw new Error('Concurrent delivery change: ' + asset.path);
    await fs.writeFile(destination, output);
  } else if (current !== asset.sha256) throw new Error('Delivery drift: ' + asset.path);
}
for (const asset of manifest.retainedAssets || []) {
  if (hash(await fs.readFile(asset.source)) !== asset.sourceSha256 || hash(await fs.readFile('public' + asset.path)) !== asset.sha256) {
    throw new Error('Retained clean source or delivery drift: ' + asset.word);
  }
}
console.log(JSON.stringify({ checked: manifest.assets.length, mode: write ? 'write' : 'check' }));
