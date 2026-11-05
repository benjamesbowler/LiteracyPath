import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const digest = value => createHash('sha256').update(value).digest('hex');
export async function extractAssessmentPanel(bytes, asset) {
  const {left, top, width, height} = asset.crop;
  if (![left, top, width, height].every(Number.isInteger) || left < 0 || top < 0 || width < 1 || height < 1 || left + width > asset.width || top + height > asset.height) throw new Error('Invalid reviewed panel bounds: ' + asset.path);
  return sharp(bytes).extract({left, top, width, height}).resize(asset.width, asset.height, {fit: 'contain', background: asset.hasAlpha ? '#0000' : '#ffffff'}).webp({quality: 95}).toBuffer();
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--stage', '--write', '--check'].includes(arg))) throw new Error('Usage: node tools/repairAssessmentPanelCrops.mjs [--stage|--write|--check]');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const manifestPath = path.join(root, 'tools/manifests/assessment-panel-crop-repairs.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath));
  const staging = path.join(root, '.artifacts/app-image-logic-audit/shard-1/crop-staged');
  fs.mkdirSync(staging, {recursive: true});
  const receipts = [];
  for (const asset of manifest.assets) {
    const filename = path.join(root, 'public', asset.path);
    const bytes = fs.readFileSync(filename), currentSha256 = digest(bytes);
    if (currentSha256 === asset.afterSha256) {receipts.push({...asset, status: 'already-corrected'}); continue;}
    if (currentSha256 !== asset.beforeSha256) throw new Error('Source changed since visual review: ' + asset.path);
    const result = await extractAssessmentPanel(bytes, asset);
    const afterSha256 = digest(result);
    if (asset.afterSha256 && asset.afterSha256 !== afterSha256) throw new Error('Extraction differs from recorded output: ' + asset.path);
    asset.afterSha256 = afterSha256;
    const staged = path.join(staging, asset.index + '.webp');
    if (args.includes('--stage') || args.includes('--write')) fs.writeFileSync(staged, result);
    if (args.includes('--write')) fs.writeFileSync(filename, result);
    receipts.push({...asset, status: args.includes('--write') ? 'installed' : 'staged-pending-visual-review', staged});
  }
  if (args.includes('--stage') || args.includes('--write')) fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  const report = path.join(root, '.artifacts/app-image-logic-audit/shard-1/crop-receipts.json');
  fs.writeFileSync(report, JSON.stringify(receipts, null, 2) + '\n');
  console.log(JSON.stringify({assets: receipts.length, installed: receipts.filter(r => ['installed', 'already-corrected'].includes(r.status)).length, report: path.relative(root, report)}));
  if (args.includes('--check') && receipts.some(r => r.status !== 'already-corrected')) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {console.error(error.message); process.exitCode = 1;});
