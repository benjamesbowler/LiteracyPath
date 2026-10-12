import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const migration = await readFile(new URL('../../supabase/migrations/20261012041604_literacy_mock_tutorial_lookup_index.sql', import.meta.url), 'utf8');

test('tutorial stimulus checks use a private version-scoped index without changing published items', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create table public.literacy_mock_items (
      content_version text not null, id text not null, item jsonb not null,
      primary key(content_version,id));
      alter table public.literacy_mock_items enable row level security;
      revoke all on public.literacy_mock_items from public;`);
    const items = [
      ['literacy-mock-v1', 'tutorial-old', { itemSnapshot: { tutorialOnly: true, stimulusKey: 'old-model' } }],
      ['literacy-mock-v3', 'tutorial', { itemSnapshot: { tutorialOnly: true, stimulusKey: 'shared-model' } }],
      ['literacy-mock-v3', 'scored-copy', { itemSnapshot: { stimulusKey: 'shared-model' } }],
      ['literacy-mock-v3', 'scored', { itemSnapshot: { stimulusKey: 'fresh-scored' } }],
    ];
    for (const [version, id, item] of items) await db.query('insert into public.literacy_mock_items values ($1,$2,$3)', [version, id, item]);
    const digest = async () => (await db.query("select md5(string_agg(item::text,'' order by content_version,id)) digest from public.literacy_mock_items")).rows[0].digest;
    const before = await digest();
    await db.exec(migration);
    assert.equal(await digest(), before);
    await db.exec('set enable_seqscan=off');
    const lookup = "select id from public.literacy_mock_items where content_version=$1 and item#>>'{itemSnapshot,tutorialOnly}'='true' and item#>>'{itemSnapshot,stimulusKey}'=$2";
    assert.deepEqual((await db.query(lookup, ['literacy-mock-v3', 'shared-model'])).rows, [{ id: 'tutorial' }]);
    for (const stimulus of ['old-model', 'fresh-scored', 'missing']) assert.deepEqual((await db.query(lookup, ['literacy-mock-v3', stimulus])).rows, []);
    const plan = (await db.query(`explain (format json) ${lookup}`, ['literacy-mock-v3', 'missing'])).rows[0]['QUERY PLAN'][0].Plan;
    assert.equal(plan['Index Name'], 'literacy_mock_items_tutorial_stimulus_idx');
    const boundary = (await db.query("select relrowsecurity,relacl::text from pg_class where oid='public.literacy_mock_items'::regclass")).rows[0];
    assert.equal(boundary.relrowsecurity, true);
    assert.equal(boundary.relacl.includes('=r/'), false);
  } finally { await db.close(); }
});
