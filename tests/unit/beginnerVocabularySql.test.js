import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { beginnerVocabularyQuarantineSql, BEGINNER_VOCABULARY_MIGRATION } from '../../tools/generateBeginnerVocabularyQuarantine.mjs';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { literacyItemQualityIssue } from '../../src/policy/literacyItemEligibility.js';

test('forward vocabulary quarantine matches client eligibility across every published lower-band item', async () => {
  const sql = await beginnerVocabularyQuarantineSql();
  assert.equal(fs.readFileSync(new URL(`../../supabase/migrations/${BEGINNER_VOCABULARY_MIGRATION}`, import.meta.url), 'utf8'), sql);
  assert.doesNotMatch(sql, /insert into|update public|delete from|alter table|security definer/i);
  const db = await PGlite.create();
  try {
    await db.exec('create role anon; create role authenticated;');
    await db.exec(sql);
    await db.exec(sql); // safe reapplication, with no wrapper recursion
    for (let version = 4; version <= 12; version++) {
      const bank = await loadLiteracyMockBank({contentVersion:`literacy-mock-v${version}`,includeUnavailable:true});
      const values = bank.filter(item => item.adaptiveAreaBand <= 1).map(item => item.itemSnapshot);
      for (let offset = 0; offset < values.length; offset += 150) {
        const batch = values.slice(offset, offset + 150);
        const result = await db.query('select public.lp_literacy_item_quality_issue(q) issue from jsonb_array_elements($1) q', [JSON.stringify(batch)]);
        assert.deepEqual(result.rows.map(row => row.issue), batch.map(literacyItemQualityIssue), `V${version} ${offset}`);
      }
    }
    const historical = await loadLiteracyMockBank({contentVersion:'literacy-mock-v11'});
    const oldVulture = historical.find(q => q.id === 'mock.v8.sounds.initial.vulture.v11');
    assert.equal(literacyItemQualityIssue(oldVulture.itemSnapshot), null, 'The new editorial contract does not regrade historical evidence');
    const bank = await loadLiteracyMockBank({contentVersion:'literacy-mock-v12',includeUnavailable:true});
    const vulture = bank.find(q => q.id === 'mock.v8.sounds.initial.vulture.v11');
    assert.ok(vulture);
    assert.equal(literacyItemQualityIssue(vulture.itemSnapshot)?.code, 'beginner_vocabulary');
    for (const value of [vulture.itemSnapshot, {questionSnapshot:vulture.itemSnapshot}, {question:vulture.itemSnapshot},
      {itemSnapshot:vulture.itemSnapshot}, {itemSnapshot:null,questionSnapshot:vulture.itemSnapshot}, null, {}, [], false]) {
      const result = await db.query('select public.lp_literacy_item_quality_issue($1) issue', [JSON.stringify(value)]);
      assert.deepEqual(result.rows[0].issue, literacyItemQualityIssue(value));
    }
    for (const role of ['anon', 'authenticated']) for (const name of ['lp_literacy_item_quality_issue','lp_literacy_quality_before_beginner_words']) {
      const result = await db.query('select has_function_privilege($1,$2,$3) allowed',[role,`public.${name}(jsonb)`,'execute']);
      assert.equal(result.rows[0].allowed, false);
    }
  } finally { await db.close(); }
});
