import assert from 'node:assert/strict';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { createLiteracyMockManifest, literacyMockManifestSql } from '../../tools/generateLiteracyMockManifest.mjs';

const mirrored = ['id', 'skillId', 'domainId', 'level', 'format', 'choices', 'answer', 'answerMode', 'requiredAudioPaths'];
const manifest = (items, contentVersion = 'literacy-mock-v3') => ({ contentVersion, itemCount: items.length, unavailableItemIds: [], items });
const database = async () => {
  const db = await PGlite.create();
  await db.exec(`create table public.literacy_mock_items(id text, content_version text, item jsonb, primary key(content_version,id));
    create table public.literacy_mock_publications(content_version text primary key, item_count integer);`);
  return db;
};
const stored = async db => (await db.query("select item from public.literacy_mock_items where content_version='literacy-mock-v3' order by id collate \"C\"")).rows.map(row => row.item);
const snapshot = id => ({ id, skillId: 'nouns', domainId: 'language', level: 1, format: 'choice',
  choices: [{ id: 'c0', label: '雪 — O’Neil’s "cat" \\ path' }, { id: 'c1', label: "O'Brien" }],
  answer: 'c0', answerMode: 'exact', requiredAudioPaths: [],
  extras: JSON.parse('{"null":null,"emptyArray":[],"emptyObject":{},"negative":-7,"decimal":1.25,"zero":0,"yes":true,"no":false,"__proto__":{"literal":"kept"},"1":"numeric key","nested":[null,[],{},0,false]}') });
const outer = value => ({ ...Object.fromEntries(mirrored.map(key => [key, value[key]])), itemSnapshot: value });

test('v3 compact transport reconstructs exact JSON types, unicode, quotes and missing fields in PostgreSQL', async () => {
  const expected = [outer(snapshot('one')), outer({ ...snapshot('two'), optional: null })];
  const sql = literacyMockManifestSql(manifest(expected));
  assert.match(sql, /decoded as materialized/);
  assert.match(sql, /revoke all on function pg_temp\.lp_literacy_mock_unpack\(jsonb,jsonb\) from public/);
  const db = await database();
  try {
    const beforeSearchPath = (await db.query('show search_path')).rows[0].search_path;
    await db.exec(sql);
    assert.equal((await db.query('show search_path')).rows[0].search_path, beforeSearchPath, 'Transaction-local search path is restored after publication.');
    const actual = await stored(db);
    assert.deepEqual(actual, expected);
    assert.equal(Object.hasOwn(actual[0].itemSnapshot, 'optional'), false);
    assert.equal(actual[1].itemSnapshot.optional, null);
    assert.equal((await db.query("select to_regprocedure('pg_temp.lp_literacy_mock_unpack(jsonb,jsonb)') as helper")).rows[0].helper, null);
    await db.exec(sql);
    assert.deepEqual(await stored(db), expected, 'An exact replay preserves all canonical values.');
  } finally { await db.close(); }
});

test('v3 transport preserves distinct outer fields and arbitrary canonical JSON instead of overwriting with snapshots', async () => {
  const item = outer(snapshot('one'));
  item.answer = 'c1';
  item.outerOnly = { retained: true, array: [], absentIsNotNull: null };
  const expected = [item, { id: 'two', arbitrary: 'No snapshot is required by the transport codec.' }];
  const db = await database();
  try {
    await db.exec(literacyMockManifestSql(manifest(expected)));
    assert.deepEqual(await stored(db), expected);
    const changed = structuredClone(expected);
    changed[0].answer = 'changed';
    await assert.rejects(db.exec(literacyMockManifestSql(manifest(changed))), /Published mock content is immutable/);
    await db.exec('rollback;');
    assert.deepEqual(await stored(db), expected, 'A rejected changed catalogue leaves every published row intact.');
  } finally { await db.close(); }
});

test('v1 and v2 retain their original literal JSON transport', () => {
  const items = [outer(snapshot('one'))];
  const literal = JSON.stringify(items).replace(/'/g, "''");
  for (const version of ['literacy-mock-v1', 'literacy-mock-v2']) {
    const sql = literacyMockManifestSql(manifest(items, version));
    assert.ok(sql.includes(`insert into literacy_mock_incoming select item from jsonb_array_elements('${literal}'::jsonb) item;`));
    assert.doesNotMatch(sql, /lp_literacy_mock_unpack|decoded as materialized/);
  }
});

test('snapshot optimization never replaces absent properties with null or discards a compensating outer key', async () => {
  const missingOuter = outer(snapshot('one'));
  delete missingOuter.answer;
  missingOuter.extraKey = 'retained';
  const bothMissing = structuredClone(missingOuter);
  delete bothMissing.itemSnapshot.answer;
  const missingSnapshot = outer(snapshot('one'));
  delete missingSnapshot.itemSnapshot.answer;
  const db = await database();
  try {
    for (const expected of [missingOuter, bothMissing, missingSnapshot]) {
      await db.exec('truncate public.literacy_mock_items, public.literacy_mock_publications;');
      await db.exec(literacyMockManifestSql(manifest([expected])));
      assert.deepEqual(await stored(db), [expected]);
    }
  } finally { await db.close(); }
});

test('the temporary decoder rejects malformed references, tags, keys and dictionary shapes', async () => {
  const sql = literacyMockManifestSql(manifest([outer(snapshot('one'))]));
  const helper = sql.slice(sql.indexOf('create function pg_temp.'), sql.indexOf('with packed as'));
  const db = await database();
  try {
    await db.exec('create temporary table initialize_temp_schema(value integer);');
    await db.exec(helper);
    const invalidNodes = [-1, 99, 0.5, null, '0', {}, [], ['0'], ['1'], [2], [1, 0], [1, -1, 0], [1, 99, 0], [1, 1, 0], [1, '0', 0], [0, 99], [1, 0, 1, 0, 0]];
    for (const node of invalidNodes) {
      await assert.rejects(db.query('select pg_temp.lp_literacy_mock_unpack($1::jsonb,$2::jsonb)', [JSON.stringify(node), '["key",42]']),
        /mock catalogue/, `Reject ${JSON.stringify(node)} instead of silently substituting JSON null.`);
    }
    for (const dictionary of [null, {}, 'dictionary']) {
      await assert.rejects(db.query('select pg_temp.lp_literacy_mock_unpack($1::jsonb,$2::jsonb)', ['0', JSON.stringify(dictionary)]), /dictionary/);
    }
    for (const dictionary of [[[]], [{}]]) {
      await assert.rejects(db.query('select pg_temp.lp_literacy_mock_unpack($1::jsonb,$2::jsonb)', ['0', JSON.stringify(dictionary)]), /Nonprimitive/);
    }
    await assert.rejects(db.query('select pg_temp.lp_literacy_mock_unpack($1::jsonb,$2::jsonb)', ['[1,0,2,1,2]', '["key","key","value"]']), /Duplicate/);
    const exposed = (await db.query(`select exists (select 1 from pg_proc p cross join lateral aclexplode(p.proacl) acl
      where p.oid='pg_temp.lp_literacy_mock_unpack(jsonb,jsonb)'::regprocedure and acl.grantee=0 and acl.privilege_type='EXECUTE') as exposed`)).rows[0].exposed;
    assert.equal(exposed, false, 'The temporary helper does not grant default PUBLIC execution.');
  } finally { await db.close(); }
});

test('the entire current ready v3 catalogue fits one bounded migration request without omitting records', async () => {
  const current = await createLiteracyMockManifest({ contentVersion: 'literacy-mock-v3' });
  const sql = literacyMockManifestSql(current);
  const requestBytes = Buffer.byteLength(JSON.stringify({ name: 'literacy_mock_items_v3', project_id: 'ajweixqzejjfvjehofnq', query: sql }));
  assert.ok(requestBytes < 8 * 1024 * 1024, `Complete request is ${requestBytes} bytes; do not split publication to bypass the transport budget.`);
  assert.match(sql, new RegExp(`<> ${current.itemCount} then`));
  assert.match(sql, /begin;[\s\S]*commit;\n$/);
  assert.equal(current.unavailableItemIds.length, 0);
});
