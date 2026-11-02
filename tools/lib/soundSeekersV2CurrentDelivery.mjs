// The sealed Task4 receipt remains historical truth. This join describes later
// exact-path replacements without rewriting their original generation history.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import {
  assertSoundSeekersV2AssetManifest, readSoundSeekersV2AssetManifest,
  sha256Bytes, sha256Canonical, SOUND_SEEKERS_V2_SOURCE_PATH
} from './soundSeekersV2AssetManifest.mjs';

export const SOUND_SEEKERS_V2_CURRENT_DELIVERY = 'source-art/sound-seekers/v2-current-delivery.json';

function exactKeys(value, keys, label) {
  if (!value || !isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort())) throw new Error(`${label}: current delivery keys drifted`);
}

export function readCurrentSoundSeekersV2Delivery({ root = process.cwd(), historicalManifest } = {}) {
  const historical = historicalManifest ?? readSoundSeekersV2AssetManifest({ root });
  assertSoundSeekersV2AssetManifest(historical);
  const currentPath = path.join(root, SOUND_SEEKERS_V2_CURRENT_DELIVERY);
  if (!existsSync(currentPath)) return { historical, assets: historical.assets, replacements: [] };
  const current = JSON.parse(readFileSync(currentPath, 'utf8'));
  exactKeys(current, ['schemaVersion', 'historicalSourceSha256', 'replacementManifest', 'replacementManifestSha256', 'replacements', 'cropReview'], 'V2');
  if (current.schemaVersion !== 1 || current.historicalSourceSha256 !== sha256Bytes(readFileSync(path.join(root, SOUND_SEEKERS_V2_SOURCE_PATH)))) throw new Error('V2 historical receipt binding drifted');
  if (current.replacementManifest !== 'source-art/app-clean-cartoon/resumed-backgrounds/manifest.json') throw new Error('V2 replacement source authority drifted');
  const sourceBytes = readFileSync(path.join(root, current.replacementManifest));
  if (sha256Bytes(sourceBytes) !== current.replacementManifestSha256) throw new Error('V2 replacement source manifest drifted');
  const source = JSON.parse(sourceBytes);
  const replacements = new Map();
  for (const row of current.replacements) {
    exactKeys(row, ['chapterId', 'path', 'jobId', 'recordSha256'], 'replacement');
    const old = historical.assets.find(asset => asset.chapterId === row.chapterId);
    const record = source.assets.find(asset => asset.path === row.path && asset.jobId === row.jobId);
    if (!old || old.path !== row.path || replacements.has(row.path) || !record
      || record.originalSha256 !== old.final.sha256 || sha256Canonical(record) !== row.recordSha256) throw new Error('V2 replacement identity or original-byte binding drifted');
    for (const [file, expected] of [[record.nativeSaved, record.nativeSha256], [record.promptFile, record.promptSha256], [record.sourceReceipt, record.sourceReceiptSha256]]) {
      if (!file || !expected || sha256Bytes(readFileSync(path.resolve(root, file))) !== expected) throw new Error(`${row.chapterId}: replacement source/provenance drifted`);
    }
    if (record.width !== 1536 || record.height !== 864 || record.hasAlpha !== false || record.review?.decision !== 'accept') throw new Error(`${row.chapterId}: replacement raster contract or review drifted`);
    replacements.set(row.path, record);
  }
  const declared = source.assets.filter(record => historical.assets.some(old => old.path === record.path));
  if (declared.length !== replacements.size || declared.some(record => !replacements.has(record.path))) throw new Error('V2 replacement set is incomplete');
  if (!Array.isArray(current.cropReview) || current.cropReview.length !== historical.assets.length) throw new Error('V2 current crop set is incomplete');
  const assets = historical.assets.map((old, index) => {
    const record = replacements.get(old.path), crop = current.cropReview[index];
    exactKeys(crop, ['chapterId', 'manifestSha256', 'profiles'], 'crop');
    if (crop.chapterId !== old.chapterId || crop.profiles.length !== 3
      || !/^[a-f0-9]{64}$/.test(crop.manifestSha256)
      || crop.manifestSha256 !== current.cropReview[0].manifestSha256) throw new Error('V2 current crop order drifted');
    for (const [profileIndex, profile] of crop.profiles.entries()) {
      const { panelSha256, ...geometry } = profile;
      const expectedGeometry = { ...old.cropReview.profiles[profileIndex] };
      delete expectedGeometry.panelSha256;
      if (!/^[a-f0-9]{64}$/.test(panelSha256) || !isDeepStrictEqual(geometry, expectedGeometry)) throw new Error(`${old.chapterId}: current crop geometry or semantics drifted`);
    }
    return { ...old,
      source: record ? { ...old.source, width: record.nativeWidth, height: record.nativeHeight, sha256: record.nativeSha256 } : old.source,
      final: record ? { ...old.final, sha256: record.outputSha256, byteLength: record.bytes } : old.final,
      cropReview: { manifestSha256: crop.manifestSha256, profiles: crop.profiles },
      currentReplacement: record ?? null
    };
  });
  return { historical, assets, replacements: [...replacements.values()] };
}
