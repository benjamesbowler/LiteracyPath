import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createLiteracyMockManifest } from '../../tools/generateLiteracyMockManifest.mjs';
import { loadLiteracyPracticeBank } from '../../src/data/literacyPracticeBank.js';

test('all v1 mock labels, server keys, snapshots and media match the published SQL contract', async () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261006092000_literacy_mock_items.sql', import.meta.url), 'utf8');
  const published = JSON.parse(sql.match(/from jsonb_array_elements\('([\s\S]*)'::jsonb\) item/)[1].replace(/''/g, "'"));
  const manifest = await createLiteracyMockManifest();
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
