import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import release from '../config/shared-media-release.json' with { type: 'json' };
import { planSharedMediaPruning, stripPublishedMedia } from './lib/sharedMediaPublisher.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!release.enabled || process.env.SHARED_MEDIA_PREPARE === '1') {
  console.log('[shared-media] Full local deployment media retained. No metered storage is enabled.');
} else {
  const plan = await planSharedMediaPruning({ distRoot: path.join(root, 'dist'), publicRoot: path.join(root, 'public') });
  const result = await stripPublishedMedia(plan, release);
  await fs.mkdir(path.join(root, '.artifacts/shared-media'), { recursive: true });
  await fs.writeFile(path.join(root, '.artifacts/shared-media/build.json'), JSON.stringify(result, null, 2));
  console.log(`[shared-media] Verified pinned Free static catalogs; removed ${result.stripped} deployment copies (${(result.bytes / 1e9).toFixed(2)} GB). ${result.local} new, changed or oversized files remain local.`);
}
