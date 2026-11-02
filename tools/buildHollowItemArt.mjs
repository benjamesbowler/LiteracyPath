import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';

const manifestPath = 'source-art/hollow/items-clean-cartoon/manifest.json';
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const write = process.argv.includes('--write');
if (process.argv.some((arg, index) => index > 1 && !['--write', '--check'].includes(arg))) throw new Error('Use --write or --check');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
let checked = 0;
for (const bank of manifest.banks) {
  if (hash(await fs.readFile(bank.source)) !== bank.sourceSha256 || hash(await fs.readFile(bank.promptFile)) !== bank.promptSha256) throw new Error('Source drift: ' + bank.jobId);
}
for (const asset of manifest.assets) {
  const source = await fs.readFile(asset.source);
  if (hash(source) !== asset.sourceSha256) throw new Error('Source drift: ' + asset.id);
  const output = await sharp(source).extract(asset.crop).resize(asset.resize).webp(asset.encoding).toBuffer();
  if (hash(output) !== asset.sha256) throw new Error('Recipe drift: ' + asset.id);
  const destination = 'public' + asset.path;
  const current = hash(await fs.readFile(destination));
  if (write && current !== asset.sha256) {
    if (current !== asset.originalSha256) throw new Error('Concurrent delivery change: ' + asset.path);
    await fs.writeFile(destination, output);
  } else if (current !== asset.sha256) throw new Error('Delivery drift: ' + asset.path);
  checked++;
}
console.log(JSON.stringify({ checked, mode: write ? 'write' : 'check' }));
