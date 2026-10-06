import assert from 'node:assert/strict';
import test from 'node:test';
import { literacyPracticeAssignment, literacyPracticeOwner, decorateLiteracyPracticeSession, canResumeLiteracyPracticeSession, isCompletedLiteracyPracticeSession, completeLiteracyPracticeAssignment } from '../../src/utils/literacyPracticeAssignment.js';
import { LITERACY_PRACTICE_ID, LITERACY_PRACTICE_VERSION } from '../../src/policy/literacyPracticePolicy.js';

const at = Date.parse('2026-10-05T09:30:00Z');
const focus = { id: 'assignment-one', target: 'progress_check', status: 'active', expires_at: '2026-10-05T10:30:00Z', content_version: LITERACY_PRACTICE_VERSION,
  resolved_config: { plan_kind: 'practice', track_id: 'reading', bank_version: LITERACY_PRACTICE_VERSION } };
const owner = literacyPracticeOwner('learner-one', literacyPracticeAssignment(focus, at));
const makeSession = () => decorateLiteracyPracticeSession({ id: 'round-one', skillId: 'reading', index: 6,
  questionIds: Array.from({ length: 6 }, (_, i) => `question-${i}`), completedAt: '2026-10-05T09:35:00Z' }, owner);
const progress = session => ({ v: 1, games: { [LITERACY_PRACTICE_ID]: { checkpoints: { practice: session }, practiceRecord: { completions: [{ id: 'response-one', sessionId: session.id }] } }, unrelated: { stars: 3 } } });
const options = (session, client, extra = {}) => ({ owner, session, client, token: 'opaque-child-token', readProgress: () => progress(session), ...extra });

test('only an active exact literacy assignment establishes a classroom practice owner', () => {
  assert.deepEqual(literacyPracticeAssignment(focus, at), { assignmentId: focus.id, focusId: 'reading' });
  for (const changed of [
    { ...focus, status: 'ended' }, { ...focus, target: 'skills_assessment' }, { ...focus, expires_at: '2026-10-05T09:00:00Z' },
    { ...focus, content_version: 'progress-legacy' }, { ...focus, resolved_config: { ...focus.resolved_config, plan_kind: 'focused' } },
    { ...focus, resolved_config: { ...focus.resolved_config, track_id: 'unknown' } }, { ...focus, resolved_config: { ...focus.resolved_config, unexpected: true } }
  ]) assert.equal(literacyPracticeAssignment(changed, at), null);
});

test('a saved free, mixed, other-child or old-assignment round cannot resume as the assigned round', () => {
  const session = makeSession();
  assert.equal(canResumeLiteracyPracticeSession(session, owner), true);
  for (const changed of [
    { ...session, practiceOwner: undefined },
    { ...session, practiceOwner: { ...owner, assignmentId: '' } },
    { ...session, practiceOwner: { ...owner, studentId: 'learner-two' } },
    { ...session, practiceOwner: { ...owner, assignmentId: 'older-assignment' } },
    { ...session, practiceOwner: { ...owner, contentVersion: 'literacy-practice-v0' } },
    { ...session, skillId: 'all', practiceOwner: { ...owner, focusId: 'all' } },
    { ...session, questionIds: [...session.questionIds, 'stale-cloud-question'] },
    { ...session, questionIds: session.questionIds.map(() => 'duplicate') }
  ]) assert.equal(canResumeLiteracyPracticeSession(changed, owner), false);
  const freeOwner = literacyPracticeOwner('learner-one');
  const free = decorateLiteracyPracticeSession({ ...session, skillId: 'writing' }, freeOwner);
  assert.equal(canResumeLiteracyPracticeSession(free, freeOwner), true);
  assert.equal(canResumeLiteracyPracticeSession(free, owner), false);
});

test('completion requires a terminal locally persisted checkpoint before any network call', async () => {
  const session = makeSession();
  let calls = 0;
  const client = { call: async () => { calls++; return { data: { ok: true } }; } };
  assert.equal(isCompletedLiteracyPracticeSession(session, owner), true);
  assert.equal(isCompletedLiteracyPracticeSession({ ...session, index: 5 }, owner), false);
  assert.equal(isCompletedLiteracyPracticeSession({ ...session, completedAt: null }, owner), false);
  await assert.rejects(completeLiteracyPracticeAssignment(options(session, client, { readProgress: () => progress({ ...session, index: 5 }) })), /save your finished/);
  await assert.rejects(completeLiteracyPracticeAssignment(options(session, client, { readProgress: () => progress({ ...session, id: 'replacement-round' }) })), /save your finished/);
  await assert.rejects(completeLiteracyPracticeAssignment(options({ ...session, completedAt: null }, client)), /not ready/);
  assert.equal(calls, 0);
});

test('cloud practice save acknowledgement precedes the token-scoped completion call', async () => {
  const session = makeSession(), calls = [];
  let release;
  const client = { call: async (name, args) => {
    calls.push({ name, args });
    if (name === 'student_save_progress') return new Promise(resolve => { release = () => resolve({ data: { ok: true } }); });
    return { data: { ok: true, status: 'completed' } };
  } };
  const pending = completeLiteracyPracticeAssignment(options(session, client));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'student_save_progress');
  assert.equal(calls[0].args.p_area, 'learn_games');
  assert.equal(calls[0].args.p_token, 'opaque-child-token');
  assert.deepEqual(calls[0].args.p_payload.games.unrelated, { stars: 3 });
  release();
  assert.equal((await pending).ok, true);
  assert.deepEqual(calls[1], { name: 'student_complete_focus_session', args: { p_token: 'opaque-child-token', p_session_id: focus.id } });
  assert.equal(calls.some(call => /progress_run|assessment/.test(call.name)), false);
});

test('missing or negative cloud receipts never mark the assignment complete, and retry preserves the same checkpoint', async () => {
  const session = makeSession();
  for (const response of [{ error: new Error('offline') }, { data: { ok: false, error: 'invalid_session' } }, { data: null }]) {
    const calls = [];
    const client = { call: async name => { calls.push(name); return response; } };
    await assert.rejects(completeLiteracyPracticeAssignment(options(session, client)));
    assert.deepEqual(calls, ['student_save_progress']);
  }
  const calls = [];
  const client = { call: async (name, args) => { calls.push({ name, args }); return { data: { ok: true } }; } };
  assert.equal((await completeLiteracyPracticeAssignment(options(session, client))).ok, true);
  assert.equal(calls[0].args.p_payload.games[LITERACY_PRACTICE_ID].checkpoints.practice.id, session.id);
});

test('a changed learner or assignment cancels completion after an earlier save finishes', async () => {
  const session = makeSession(), calls = [];
  let current = true;
  const client = { call: async name => { calls.push(name); current = false; return { data: { ok: true } }; } };
  const result = await completeLiteracyPracticeAssignment(options(session, client, { isCurrent: () => current }));
  assert.deepEqual(result, { ok: false, cancelled: true });
  assert.deepEqual(calls, ['student_save_progress']);
  const cancelled = await completeLiteracyPracticeAssignment(options(session, client, { isCurrent: () => false }));
  assert.equal(cancelled.cancelled, true);
  assert.equal(calls.length, 1);
});

test('server completion rejection stays pending and free practice never completes a classroom assignment', async () => {
  const session = makeSession(), calls = [];
  const client = { call: async name => { calls.push(name); return { data: name === 'student_save_progress' ? { ok: true } : { ok: false, error: 'session_not_found' } }; } };
  await assert.rejects(completeLiteracyPracticeAssignment(options(session, client)), /session_not_found/);
  assert.equal(calls.length, 2);
  await assert.rejects(completeLiteracyPracticeAssignment(options(session, client, { owner: literacyPracticeOwner('learner-one') })), /not ready/);
  assert.equal(calls.length, 2);
});
