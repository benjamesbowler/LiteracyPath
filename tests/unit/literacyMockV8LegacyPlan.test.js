import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureV8 } from '../helpers/literacyMockV8Database.js';
import { read, query, classId, studentId, teacher, other } from '../helpers/literacyMockDatabase.js';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';
import { isLiteracyItemEligible } from '../../src/policy/literacyItemEligibility.js';

const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v7' });
const byId = new Map(bank.map(item => [item.id, item]));
const save = (db, id, key, revision, plan, response = null, token = 'synthetic-token') => query(db,
  'select student_save_literacy_mock_run($1,$2,$3,$4,$5,$6) value', [token, id, key, revision, plan, response]);
const event = (db, id, questionId, kind, key) => query(db,
  'select student_record_literacy_mock_event($1,$2,$3,$4,$5) value', ['synthetic-token', id, questionId, kind, key]);
const prepare = (db, version, key) => query(db,
  `select teacher_prepare_literacy_mock_session_${version}($1,$2,false,20,43,$3,'untimed') value`, [classId, [studentId], key]);

async function registerLegacy(db, key) {
  const prepared = await prepare(db, 'v7', key);
  assert.equal(prepared.ok, true, prepared.error);
  const id = prepared.session.id;
  const plan = selectLiteracyMockPlan(bank, { sessionId: id, studentId });
  const printSlots = plan.itemIds.flatMap((itemId, index) => byId.get(itemId).domainId === 'print' ? [index] : []);
  assert.equal(printSlots.length, 5);
  const oldPrint = ['literacy.letter_knowledge.case-a', 'mock.capacity.foundation.letter-case.l1.a',
    'literacy.letter_knowledge.case-b', 'literacy.letter_knowledge.case-c', 'literacy.letter_knowledge.case-d'];
  printSlots.forEach((slot, index) => { plan.itemIds[slot] = oldPrint[index]; });
  const former = await query(db, `select jsonb_agg(public.lp_literacy_exposure_identity(item)) value
    from literacy_mock_items where content_version='literacy-mock-v7' and id=any($1::text[])`, [oldPrint.slice(0, 2)]);
  assert.equal(new Set(former.map(identity => identity.exposureFamilyId)).size, 2, 'the pre-upgrade server admitted distinct identities');
  assert.equal((await query(db, 'select teacher_control_literacy_mock_session($1,\'start\',0,\'start\') value', [id])).ok, true);
  const registered = await save(db, id, 'register-old-plan', 0, plan);
  assert.equal(registered.ok, true, registered.error);
  assert.equal(registered.run.contentVersion, 'literacy-mock-v7');
  return { id, plan, printSlots, run: registered.run };
}

function replacement(plan, slot) {
  const old = byId.get(plan.itemIds[slot]);
  const history = buildLiteracyExposureIndex({ exposures: plan.itemIds.map(id => byId.get(id)) });
  const candidate = bank.find(item => item.id !== old.id && !item.tutorialOnly && item.mediaReady !== false
    && isLiteracyItemEligible(item) && item.adaptiveMixedEligible && item.adaptiveAreaBand === 1
    && sameLiteracyMockTask(item, old, { includeLevel: true }) && !getLiteracyExposure(item, history).knownFamiliar);
  assert.ok(candidate, `a fresh same-task Starter replacement exists for ${old.id}`);
  return { ...plan, itemIds: plan.itemIds.map((id, index) => index === slot ? candidate.id : id) };
}

const storedResponses = (db, id) => query(db, 'select responses value from literacy_mock_runs where session_id=$1 and student_id=$2', [id, studentId]);

test('V8 identity upgrade retains an authorized unshown V7 pack and rejects newly introduced aliases', async t => {
  const db = await fixtureV8({ upgrade: false });
  try {
    const legacy = await registerLegacy(db, 'legacy-downloaded-pack');
    const before = await storedResponses(db, legacy.id);
    await db.exec(read('20261016011748_literacy_mock_retake_v8.sql'));
    assert.deepEqual(await storedResponses(db, legacy.id), before);
    const shared = await query(db, `select jsonb_agg(public.lp_literacy_exposure_identity(item)->>'exposureFamilyId') value
      from literacy_mock_items where content_version='literacy-mock-v7' and id=any($1::text[])`,
    [['literacy.letter_knowledge.case-a', 'mock.capacity.foundation.letter-case.l1.a']]);
    assert.deepEqual(shared, ['letter-case:a', 'letter-case:a']);

    const updated = replacement(legacy.plan, 0);
    const accepted = await save(db, legacy.id, 'fresh-other-area', legacy.run.revision, updated);
    assert.equal(accepted.ok, true, accepted.error);
    assert.deepEqual(accepted.run.plan, updated);
    for (const slot of legacy.printSlots) assert.equal(accepted.run.plan.itemIds[slot], legacy.plan.itemIds[slot]);

    await t.test('a new A variant cannot inherit the old authorized alias exception', async () => {
      const invalid = { ...updated, itemIds: [...updated.itemIds] };
      invalid.itemIds[legacy.printSlots[1]] = 'mock.capacity.foundation.letter-case.l2.a';
      const denied = await save(db, legacy.id, 'new-letter-alias', accepted.run.revision, invalid);
      assert.equal(denied.error, 'repeated_exposure_identity');
      const third = { ...updated, itemIds: [...updated.itemIds] };
      third.itemIds[legacy.printSlots[2]] = 'mock.capacity.foundation.letter-case.l2.a';
      assert.equal((await save(db, legacy.id, 'third-letter-stimulus', accepted.run.revision, third)).error, 'repeated_stimulus');
      assert.deepEqual(await query(db, 'select plan value from literacy_mock_runs where session_id=$1 and student_id=$2',
        [legacy.id, studentId]), updated);
    });

    await t.test('the compatibility exception preserves token ownership and null-payload rejection', async () => {
      assert.equal((await save(db, legacy.id, 'foreign-token', accepted.run.revision, updated, null, 'foreign-token')).error, 'assignment_not_found');
      assert.equal((await save(db, legacy.id, 'no-token', accepted.run.revision, updated, null, null)).error, 'invalid_session');
      assert.equal((await save(db, legacy.id, 'null-payload', accepted.run.revision, null)).error, 'invalid_payload');
      assert.equal((await save(db, legacy.id, 'null-revision', null, updated)).error, 'invalid_payload');
      await db.exec(`set fixture.actor='${other}'`);
      try {
        assert.equal((await query(db, 'select teacher_control_literacy_mock_session($1,\'pause\',1,\'foreign-owner\') value', [legacy.id])).error,
          'session_not_found');
      } finally { await db.exec(`set fixture.actor='${teacher}'`); }
      assert.deepEqual(await query(db, 'select plan value from literacy_mock_runs where session_id=$1 and student_id=$2',
        [legacy.id, studentId]), updated);
    });

    await t.test('new V8 plans cannot use the legacy exception even for the same old-media snapshots', async () => {
      // A small isolated publication exercises the V8 version guard without
      // depending on unfinished new recordings or rewriting any V7 item.
      await db.query(`insert into literacy_mock_items(id,content_version,item)
        select id,'literacy-mock-v8',jsonb_set(jsonb_set(item,'{itemSnapshot,contentVersion}','"literacy-mock-v8"'::jsonb),
          '{itemSnapshot,adaptiveAreaVersion}','"areas-v4"'::jsonb)
        from literacy_mock_items where content_version='literacy-mock-v7' and id=any($1::text[])`, [legacy.plan.itemIds]);
      await db.exec("insert into literacy_mock_publications(content_version,item_count) values('literacy-mock-v8',43)");
      const finished = await query(db, 'select teacher_control_literacy_mock_session($1,\'finish\',1,\'finish-old\') value', [legacy.id]);
      assert.equal(finished.ok, true, finished.error);
      const prepared = await prepare(db, 'v8', 'strict-new-version');
      assert.equal(prepared.ok, true, prepared.error);
      const started = await query(db, 'select teacher_control_literacy_mock_session($1,\'start\',0,\'start-new\') value', [prepared.session.id]);
      assert.equal(started.ok, true, started.error);
      const strict = await save(db, prepared.session.id, 'v8-duplicate-alias', 0, legacy.plan);
      assert.equal(strict.error, 'repeated_exposure_identity');
      assert.equal(await query(db, 'select count(*)::integer value from literacy_mock_runs where session_id=$1', [prepared.session.id]), 0);
    });
  } finally { await db.close(); }
});

test('V8 upgrade preserves a real answered V7 prefix and an already shown unanswered question', async () => {
  const db = await fixtureV8({ upgrade: false });
  try {
    const legacy = await registerLegacy(db, 'legacy-shown-prefix');
    let run = legacy.run;
    // Teacher-confirmed assistance holds each area at Starter, so the two
    // formerly distinct A probes can genuinely be answered in the old route.
    for (let index = 0; index < 6; index++) {
      const item = byId.get(legacy.plan.itemIds[index]);
      assert.equal((await event(db, legacy.id, item.id, 'presented', `show-${index}`)).ok, true);
      assert.equal((await event(db, legacy.id, item.id, 'help_requested', `help-${index}`)).ok, true);
      const supported = await query(db, 'select teacher_resolve_literacy_mock_support($1,$2,$3,\'answer\',$4) value',
        [legacy.id, studentId, item.id, `support-${index}`]);
      assert.equal(supported.ok, true, supported.error);
      const answered = await save(db, legacy.id, `answer-${index}`, supported.run.revision, null, {
        questionId: item.id, selected: item.answer, responseStatus: 'answered', supportUsed: false,
        knownFamiliar: false, audioDelivery: Object.fromEntries(item.requiredAudioPaths.map(path => [path, 'completed'])),
      });
      assert.equal(answered.ok, true, answered.error); run = answered.run;
      assert.equal(run.responses[index].evidenceType, 'supported');
    }
    const current = byId.get(legacy.plan.itemIds[6]);
    const shown = await event(db, legacy.id, current.id, 'presented', 'shown-before-upgrade');
    assert.equal(shown.ok, true, shown.error);
    const beforeResponses = await storedResponses(db, legacy.id);
    const beforePresentations = shown.run.presentations;
    await db.exec(read('20261016011748_literacy_mock_retake_v8.sql'));
    const updated = replacement(legacy.plan, 8);
    const saved = await save(db, legacy.id, 'adapt-after-upgrade', run.revision, updated);
    assert.equal(saved.ok, true, saved.error);
    assert.deepEqual(await storedResponses(db, legacy.id), beforeResponses);
    assert.deepEqual(saved.run.presentations, beforePresentations);
    assert.deepEqual(saved.run.plan.itemIds.slice(0, 7), legacy.plan.itemIds.slice(0, 7));
    const invalid = replacement(updated, 6);
    assert.equal((await save(db, legacy.id, 'replace-shown', saved.run.revision, invalid)).error, 'presented_item_frozen');
  } finally { await db.close(); }
});
