import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createLiteracyMockManifest, literacyMockManifestSql } from '../../tools/generateLiteracyMockManifest.mjs';
import { loadLiteracyPracticeBank } from '../../src/data/literacyPracticeBank.js';

test('all v1 mock labels, server keys, snapshots and media match the published SQL contract', async () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261006092000_literacy_mock_items.sql', import.meta.url), 'utf8');
  const published = JSON.parse(sql.match(/from jsonb_array_elements\('([\s\S]*)'::jsonb\) item/)[1].replace(/''/g, "'"));
  const manifest = await createLiteracyMockManifest({ contentVersion: 'literacy-mock-v1' });
  assert.equal(manifest.items.length, 3958);
  const expected = new Map(published.map(item => [item.id, item]));
  for (const item of manifest.items) assert.deepEqual(item, expected.get(item.id), item.id);

  // The independent practice editorial repair remains available to learners.
  const practice = await loadLiteracyPracticeBank({ includeReference: false });
  const caretaker = practice.find(item => item.id === 'lp3.key_details.l1.A.who.v43');
  assert.ok(caretaker);
  assert.equal(caretaker.answer, 'the caretaker');
  assert.notDeepEqual(caretaker.choices, expected.get(caretaker.id).choices.map(choice => choice.label));
});

test('all v2 mock labels, server keys, snapshots and media match the immutable published SQL contract', async () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261010121000_literacy_mock_items_v2.sql', import.meta.url), 'utf8');
  const published = JSON.parse(sql.match(/from jsonb_array_elements\('([\s\S]*)'::jsonb\) item/)[1].replace(/''/g, "'"));
  const manifest = await createLiteracyMockManifest({ contentVersion: 'literacy-mock-v2' });
  assert.equal(manifest.items.length, 3976);
  const expected = new Map(published.map(item => [item.id, item]));
  for (const item of manifest.items) assert.deepEqual(item, expected.get(item.id), item.id);
});

test('the v3 publication contains every authored item with exact ready media and current evidence conditions', async () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261010141000_literacy_mock_items_v3.sql', import.meta.url), 'utf8');
  const manifest = await createLiteracyMockManifest({ contentVersion: 'literacy-mock-v3' });
  assert.equal(manifest.itemCount, 4198);
  assert.deepEqual(manifest.unavailableItemIds, []);
  assert.equal(sql, literacyMockManifestSql(manifest));
});
