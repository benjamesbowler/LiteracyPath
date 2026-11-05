import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mediaQaReviewItems} from '../../src/data/generated/mediaQaReviewItems.generated.js';
import {loadLiteracyMockBank} from '../../src/data/literacyMockBank.js';
import {buildLiteracyMockLanguageCapacityItems} from '../../src/data/literacyMockLanguageCapacity.js';
import {retirePlaceholderQaRows} from '../../tools/retirePrepositionPlaceholderScenes.mjs';

const manifest = JSON.parse(fs.readFileSync(new URL('../../tools/manifests/retired-preposition-placeholder-scenes.json', import.meta.url)));
const retired = new Set(manifest.assets.map(asset => asset.path));

test('retired generic spatial placeholders cannot return through the QA inventory or public files', () => {
  assert.equal(retired.size, 60);
  assert.equal(mediaQaReviewItems.filter(item => retired.has(item.imagePath)).length, 0);
  assert.equal(fs.existsSync(new URL('../../' + manifest.authorModule, import.meta.url)), false);
  for (const asset of retired) assert.equal(fs.existsSync(new URL('../../public' + asset, import.meta.url)), false, asset);
});

test('current spatial assessment expansion retains semantic webps and all 104 tasks', async () => {
  const bank = (await loadLiteracyMockBank({includeUnavailable: true, contentVersion: 'literacy-mock-v3'})).filter(item => !item.id.startsWith('mock.capacity.language.'));
  const spatial = buildLiteracyMockLanguageCapacityItems(bank).filter(item => item.skillId === 'prepositions');
  assert.equal(spatial.length, 104);
  const paths = new Set(spatial.map(item => item.image));
  for (const asset of manifest.preservedRuntimePaths) assert.ok(paths.has(asset), asset);
  for (const item of [...bank.filter(item => item.skillId === 'prepositions'), ...spatial]) {
    assert.ok(item.image && !retired.has(item.image), item.id);
    assert.doesNotMatch(item.image, /\/variants\/prepositions\/.*\.svg$/);
    assert.ok(fs.existsSync(new URL('../../public' + item.image, import.meta.url)), item.image);
  }
});

test('scoped retirement preserves unrelated QA IDs, quarantine and review observations', () => {
  const unrelated = {reviewId: 'stable-review-id', imagePath: manifest.preservedRuntimePaths[0], status: 'quarantined', notes: 'reported defect retained'};
  const result = retirePlaceholderQaRows([{reviewId: 'old', imagePath: manifest.assets[0].path}, unrelated], manifest.assets);
  assert.deepEqual(result.items, [unrelated]);
  assert.equal(result.items[0], unrelated);
  assert.equal(result.removed.length, 1);
});

test('obsolete QA-only thumbnails cannot return in public assets or QA rows', () => {
  const thumbnails = JSON.parse(fs.readFileSync(new URL('../../tools/manifests/retired-obsolete-assessment-thumbnails.json', import.meta.url)));
  assert.equal(thumbnails.assets.length, 5);
  const paths = new Set(thumbnails.assets.map(asset => asset.path));
  assert.equal(mediaQaReviewItems.filter(item => paths.has(item.imagePath)).length, 0);
  for (const asset of paths) assert.equal(fs.existsSync(new URL('../../public' + asset, import.meta.url)), false, asset);
  const unrelated = {reviewId: 'retain-observation', imagePath: '/images/assessment/blends/crab.webp', notes: 'Keep this observation'};
  const result = retirePlaceholderQaRows([{reviewId: 'obsolete-square', imagePath: thumbnails.assets[0].path}, unrelated], thumbnails.assets);
  assert.deepEqual(result.items, [unrelated]);
  assert.equal(result.items[0], unrelated);
});
