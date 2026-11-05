import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { LITERACY_MOCK_IMAGE_DELIVERY, resolveLiteracyMockImagePath } from '../../src/data/literacyMockImageDelivery.js';
import { withRepairedImageVersion } from '../../src/utils/repairedImageVersion.js';
import { prepareMockOfflineMedia } from '../../src/utils/literacyMockOfflineMedia.js';
import { appVisualAssetReview } from '../../src/content/appVisualAssetReviews.generated.js';
import { ASSESSMENT_MEDIA_AUDIT_REJECTED_HASHES } from '../../src/content/assessments/v3/assessmentMediaAuditRejectedHashes.generated.js';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { createLiteracyMockManifest } from '../../tools/generateLiteracyMockManifest.mjs';

const original = '/images/assessment/hfw/look.webp';
const current = '/images/assessment/release-support/targets/look-e09315.webp';
const publicFile = src => new URL('../../public' + src, import.meta.url);

test('frozen image delivery uses an exact reviewed target without reviving retired art', () => {
  assert.equal(fs.existsSync(publicFile(original)), false);
  for (const [source, target] of Object.entries(LITERACY_MOCK_IMAGE_DELIVERY)) {
    assert.equal(resolveLiteracyMockImagePath(source), target);
    const bytes = fs.readFileSync(publicFile(target));
    const hash = createHash('sha256').update(bytes).digest('hex');
    const review = appVisualAssetReview.assets.find(row => row.path === target);
    assert.equal(review?.status, 'approved');
    assert.equal(review.sha256, hash);
    assert.equal(Object.hasOwn(ASSESSMENT_MEDIA_AUDIT_REJECTED_HASHES, hash), false);
  }
  assert.equal(resolveLiteracyMockImagePath(original + '?mode=picture#cell=3'), current + '?mode=picture#cell=3');
  for (const src of ['/images/missing.webp', '/images/atlas.webp#mock-cell=3', '/audio/word.mp3', 'blob:fixture', 'https://example.com/look.webp']) {
    assert.equal(resolveLiteracyMockImagePath(src), src);
  }
});

test('offline fetch and cache use current bytes while caller receipts keep the frozen image identity', async () => {
  const entries = new Map([[original, new Response('stale', { headers: { 'content-type': 'image/webp' } })]]);
  const fetched = [], transport = withRepairedImageVersion(current), bytes = fs.readFileSync(publicFile(current));
  let served;
  const options = {
    cacheStorage: { open: async () => ({
      match: async key => entries.get(key)?.clone(),
      delete: async key => entries.delete(key),
      put: async (key, value) => entries.set(key, value.clone())
    }) },
    fetcher: async url => { fetched.push(url); return new Response(bytes, { headers: { 'content-type': 'image/webp' } }); },
    createObjectURL: blob => { served = blob; return 'blob:current-look'; }, revokeObjectURL: () => {}
  };
  const media = await prepareMockOfflineMedia([original], options);
  assert.deepEqual(fetched, [transport]);
  assert.equal(media.has([original]), true);
  assert.equal(media.resolve(original), 'blob:current-look#' + encodeURIComponent(original));
  assert.deepEqual(Buffer.from(await served.arrayBuffer()), bytes);
  media.dispose();
  const offline = await prepareMockOfflineMedia([original], { ...options, fetcher: () => { throw Error('offline'); } });
  assert.equal(offline.has([original]), true);
  offline.dispose();
});

test('manifest validation resolves current files without modifying published V12 snapshots', async () => {
  const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v12', includeUnavailable: true });
  const targets = bank.filter(item => item.requiredImagePaths.includes(original));
  assert.ok(targets.length > 0);
  const before = JSON.stringify(targets);
  const manifest = await createLiteracyMockManifest({ contentVersion: 'literacy-mock-v12' });
  assert.equal(JSON.stringify(targets), before);
  for (const item of targets) {
    const published = manifest.items.find(row => row.id === item.id);
    assert.deepEqual(published.itemSnapshot, item.itemSnapshot);
    assert.ok(published.itemSnapshot.requiredImagePaths.includes(original));
  }
  const renderer = fs.readFileSync(new URL('../../src/components/progress/LiteracyMockImage.jsx', import.meta.url), 'utf8');
  assert.match(renderer, /withRepairedImageVersion\(resolveLiteracyMockImagePath\(mediaSource \|\| currentSource\)\)/);
});
