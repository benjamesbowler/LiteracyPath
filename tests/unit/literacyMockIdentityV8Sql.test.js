import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { canonicalLiteracyIdentity, literacyExposureIdentities, literacyPrintLetterTarget,
  literacyLexicalWordTarget } from '../../src/utils/literacyEvidence.js';
import { literacyMockIdentityV8Sql } from '../../tools/literacyMockIdentityV8Sql.mjs';
import { functionFrom } from '../helpers/literacyMockDatabase.js';

const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v7', includeUnavailable: true });
const snapshots = bank.map(item => item.itemSnapshot);
const sqlIdentity = value => ({ exposureItemId: value.itemId, exposurePassageKey: value.passageKey, exposureFamilyId: value.familyId });
const ordered = values => values.map(value => JSON.stringify(Object.entries(value).sort())).sort();

async function parity(db, records) {
  const failures = [];
  for (let offset = 0; offset < records.length; offset += 250) {
    const values = records.slice(offset, offset + 250);
    const { rows } = await db.query(`select n::integer index, public.lp_literacy_exposure_identity(value) identity,
      public.lp_literacy_exposure_identities(value) aliases, public.lp_literacy_print_letter_target(value) letter,
      public.lp_literacy_lexical_word_target(value) word
      from jsonb_array_elements($1::jsonb) with ordinality entries(value,n) order by n`, [values]);
    for (const row of rows) {
      const value = values[row.index - 1];
      const expected = { identity: sqlIdentity(canonicalLiteracyIdentity(value)),
        aliases: ordered(literacyExposureIdentities(value).map(sqlIdentity)),
        letter: literacyPrintLetterTarget(value), word: literacyLexicalWordTarget(value) };
      const actual = { identity: row.identity, aliases: ordered(row.aliases), letter: row.letter, word: row.word };
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        try { assert.deepEqual(actual, expected); } catch { failures.push({ id: value.id || value.questionId || value.exposureItemId,
          actual, expected }); }
      }
    }
  }
  assert.deepEqual(failures.slice(0, 5), [], `${failures.length} SQL/client identity mismatches`);
}

test('forward identity aliases match the client and preserve all immutable V7 snapshots', async t => {
  const db = await PGlite.create();
  try {
    await db.exec(`create role anon; create role authenticated;
      create table public.identity_snapshot_evidence(id text primary key,snapshot jsonb not null);`);
    await db.exec(functionFrom('20261010120000_literacy_mock_evidence_v2.sql', 'lp_literacy_exposure_identity'));
    await db.exec(functionFrom('20261012083202_literacy_mock_adaptive_v4.sql', 'lp_literacy_exposure_identities'));
    const nameA = snapshots.find(item => item.id === 'literacy.letter_knowledge.name-a');
    const beforeAlias = (await db.query('select lp_literacy_exposure_identity($1) identity', [nameA])).rows[0].identity;
    assert.equal(beforeAlias.exposureFamilyId, 'source-item:literacy.letter_knowledge.name-a');
    for (let offset = 0; offset < snapshots.length; offset += 250) await db.query(`insert into identity_snapshot_evidence
      select value->>'id',value from jsonb_array_elements($1::jsonb)value`, [snapshots.slice(offset, offset + 250)]);
    const fingerprints = async () => (await db.query('select id,md5(snapshot::text) digest from identity_snapshot_evidence order by id collate "C"')).rows;
    const before = await fingerprints();
    const forward = literacyMockIdentityV8Sql();
    await db.exec(forward);

    await t.test('every published V7 snapshot has canonical identity and alias parity', async () => {
      await parity(db, snapshots);
    });

    await t.test('compact historical print IDs and trusted lexical family prefixes have parity', async () => {
      const records = [];
      for (const letter of 'abcdefghijklmnopqrstuvwxyz') for (const id of [`literacy.letter_knowledge.name-${letter}`,
        `literacy.letter_knowledge.case-${letter}`, `mock.capacity.foundation.letter-case.l1.${letter}`,
        `mock.capacity.foundation.letter-case.l2.${letter}`]) records.push({ questionId: id }, { exposureItemId: id },
        { exposureFamilyId: `source-item:${id}` }, { questionSnapshot: { id } });
      const families = new Set(snapshots.map(item => item.exposureFamilyId).filter(family => /^(hfw-word|v6-phonics-team|mock-foundation-word|v4-context-word-senses|v8-context-word-senses):[a-z]+$/.test(family)));
      families.add('v8-context-word-senses:glass'); families.add('v8-context-word-senses:wave');
      for (const family of families) records.push({ exposureItemId: `compact:${family}`, exposureFamilyId: family,
        exposurePassageKey: `unchanged:${family}` }, { questionSnapshot: { itemFamilyId: family } });
      records.push({ exposureItemId: 'mock.letters.round' }, { exposureItemId: 'mock.letters.angles' },
        { exposureItemId: 'lp3.long_vowels_silent_e.l2.A.a_e.v1' });
      await parity(db, records);
    });

    await t.test('literal target guards reject unrelated contexts and foil words in both implementations', async () => {
      const records = [
        { id: 'new-case', domainId: 'print', skillId: 'letter_knowledge', constructClaim: 'letter_case_correspondence',
          format: 'match', matchTargets: [{ label: ' A ' }] },
        { id: 'new-name', domainId: 'print', skillId: 'letter_knowledge', constructClaim: 'letter_name', targetWord: ' B ' },
        { id: 'multi-case', domainId: 'print', skillId: 'letter_knowledge', constructClaim: 'letter_case_correspondence',
          format: 'match', matchTargets: [{ label: 'A' }, { label: 'B' }] },
        { id: 'unrelated-case-a', domainId: 'reading', skillId: 'letter_knowledge', constructClaim: 'letter_name', targetWord: 'A' },
        { exposureItemId: 'arbitrary-a', exposurePassageKey: 'response-evidence:["a"]' },
        { id: 'context', domainId: 'vocabulary', constructClaim: 'meaning_at_named_occurrence', targetWord: 'rain', passage: 'Rain is falling.' },
        { id: 'wrong-area', domainId: 'reading', constructClaim: 'spoken_rhyme_discrimination', targetWord: 'rain' },
        { id: 'context-anchor', domainId: 'sound_awareness', constructClaim: 'initial_sound_discrimination', targetWord: 'rain', passage: 'Rain is falling.' },
        { id: 'phrase-anchor', domainId: 'sound_awareness', constructClaim: 'spoken_rhyme_discrimination', targetWord: 'rain cloud' },
        { exposureFamilyId: 'unknown-family:rain' },
        { exposureFamilyId: 'hfw-word:rain cloud' },
      ];
      for (const constructClaim of ['initial_sound_discrimination', 'initial_sound_grapheme_mapping',
        'spoken_medial_vowel_discrimination', 'spoken_rhyme_discrimination']) records.push({ id: constructClaim,
        domainId: 'sound_awareness', constructClaim, targetWord: ' Cat ', choices: [{ label: 'rain' }, { label: 'mat' }],
        stimulusKey: 'cat', exposureFamilyId: `source-item:${constructClaim}` });
      await parity(db, records);
    });

    await t.test('identity helpers remain private, immutable and bound to an empty search path', async () => {
      const signatures = ['lp_literacy_print_letter_target(jsonb)', 'lp_literacy_lexical_word_target(jsonb)',
        'lp_literacy_exposure_identity(jsonb)', 'lp_literacy_exposure_identities(jsonb)'];
      for (const signature of signatures) {
        for (const role of ['anon', 'authenticated']) assert.equal((await db.query('select has_function_privilege($1,$2,\'execute\') allowed',
          [role, `public.${signature}`])).rows[0].allowed, false, `${role}:${signature}`);
        const meta = (await db.query(`select p.provolatile,p.prosecdef,p.proconfig,
          (select count(*)::integer from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner)))acl
            where acl.grantee<>p.proowner) foreign_grants
          from pg_proc p where p.oid=$1::regprocedure`, [`public.${signature}`])).rows[0];
        assert.equal(meta.provolatile, 'i'); assert.equal(meta.prosecdef, false);
        assert.deepEqual(meta.proconfig, ['search_path=""']); assert.equal(meta.foreign_grants, 0, signature);
        await db.exec('set role anon');
        try { await assert.rejects(db.query(`select public.${signature.replace('(jsonb)', '($1)')}`, [{}]), /permission denied/); }
        finally { await db.exec('reset role'); }
      }
    });

    await t.test('reapplying the forward functions changes neither publication bytes nor snapshot count', async () => {
      await db.exec(forward);
      assert.equal(before.length, 9138);
      assert.deepEqual(await fingerprints(), before);
      const stored = (await db.query('select snapshot from identity_snapshot_evidence where id=$1', [nameA.id])).rows[0].snapshot;
      assert.deepEqual(stored, nameA);
      assert.equal(stored.exposureFamilyId, 'source-item:literacy.letter_knowledge.name-a');
    });
  } finally { await db.close(); }
});
