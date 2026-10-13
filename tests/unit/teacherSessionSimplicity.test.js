import test from 'node:test';
import assert from 'node:assert/strict';
import { readTeacherFocusWithTimeout } from '../../src/hooks/useStudentFocusSessionHost.js';
import { createTeacherLaunchContext, resolveLaunchAudience } from '../../src/utils/teacherLaunchContext.js';
import { sessionActivityLabel, sessionActivityDescription, teacherSessionModel, prioritySessionMembers } from '../../src/utils/teacherSessionModel.js';
import { buildTeacherActivityHistory } from '../../src/data/teacherActivityHistory.js';
import { listLiteracyMockHistoryPage } from '../../src/data/literacyMockSessionCore.js';
import { createReadingSessionRetryQueue, readingQueueRecovery } from '../../src/hooks/useReadingSessionHost.js';

test('launch context retains explicit selections and exposes stale membership without silently broadening', () => {
  const context = createTeacherLaunchContext({ classId: 'c', audience: 'selected_students', studentIds: ['a', 'b', 'b'], purpose: 'read', administration: 'teacher_paced' });
  const resolved = resolveLaunchAudience(context, [{ id: 'a' }, { id: 'b', archived_at: 'yesterday' }, { id: 'c' }]);
  assert.deepEqual(context.studentIds, ['a', 'b']);
  assert.deepEqual(resolved.missingIds, ['b']);
  assert.deepEqual(resolved.students.map(row => row.id), ['a']);
  assert.throws(() => createTeacherLaunchContext({ classId: 'c', audience: 'selected_students', studentIds: [] }));
  const whole = createTeacherLaunchContext({ classId: 'c', audience: 'whole_class', studentIds: ['a'] });
  assert.deepEqual(whole.studentIds, []);
  assert.equal(resolveLaunchAudience(whole, [{ id: 'a' }, { id: 'c' }]).students.length, 2);
});

test('retired literacy plans retain their historical labels and evidence distinctions', () => {
  assert.equal(sessionActivityLabel('progress_check', { plan_kind: 'practice' }), 'Literacy practice');
  assert.match(sessionActivityDescription('progress_check', { plan_kind: 'practice' }), /teaching and feedback/);
  assert.equal(sessionActivityLabel('progress_check', { plan_kind: 'broad_profile' }), 'Independent literacy snapshot');
  assert.equal(sessionActivityLabel('progress_check', { plan_kind: 'focused' }), 'Independent literacy snapshot');
  assert.match(sessionActivityDescription('progress_check', { plan_kind: 'focused' }), /without teaching feedback/);
});

test('actual mock configurations share the Mock MAP name without recasting historical forms', () => {
  for (const config of [{ mock: true }, { mock_session: 'saved-mock' }, { plan_kind: 'mock' }, { mock: { item_count: 24, window_mode: 'timed_sample' } }]) {
    assert.equal(sessionActivityLabel('progress_check', config), 'Mock MAP test');
    const description = sessionActivityDescription('progress_check', config);
    assert.match(description, /teacher-launched Mock MAP test/);
    assert.match(description, /Saved answers, support and unanswered questions remain distinct/);
    assert.doesNotMatch(description, /snapshot|43 questions|teaching and feedback/);
  }
});

test('saved history separates legacy practice and snapshots from original mock sessions', () => {
  const practice = { attemptId: 'practice', classId: 'class', studentId: 'child', assessmentType: 'literacy-practice' };
  const snapshot = { attemptId: 'snapshot', classId: 'class', studentId: 'child', assessmentType: 'adaptive_progress_test', metadata: { planKind: 'focused' } };
  const mock = { id: 'mock', class_id: 'class', member_student_ids: ['child'], mock: { item_count: 24, window_mode: 'timed_sample', state: 'completed' } };
  const rows = buildTeacherActivityHistory({ classId: 'class', studentId: 'child', records: [practice, snapshot], sessions: [mock] });
  for (const [id, original, category, label] of [
    ['assessment:practice', practice, 'practice', 'Literacy practice'],
    ['assessment:snapshot', snapshot, 'assessment', 'Independent literacy snapshot'],
    ['mock:mock', mock, 'mock', 'Mock MAP test']
  ]) {
    const row = rows.find(item => item.id === id);
    assert.equal(row.original, original);
    assert.equal(row.category, category);
    assert.equal(row.label, label);
  }
  assert.equal(mock.mock.item_count, 24);
  assert.equal(mock.mock.window_mode, 'timed_sample');
});

test('common phase frame preserves protocol controls and evidence distinctions', () => {
  const mock = teacherSessionModel({ protocol: 'mock', session: { mock: { state: 'prepared' } } });
  assert.equal(mock.phase, 'prepare'); assert.equal(mock.canStart, true); assert.equal(mock.canPause, false);
  const paused = teacherSessionModel({ protocol: 'mock', session: { mock: { state: 'paused' } } });
  assert.equal(paused.canResume, true); assert.equal(paused.canStart, false);
  const reading = teacherSessionModel({ protocol: 'reading', session: { id: 'r' }, pendingWrites: 1 });
  assert.equal(reading.canEnd, false); assert.match(reading.receiptLabel, /waiting to save/);
  assert.deepEqual(prioritySessionMembers([{ id: 'done', status: 'completed' }, { id: 'work' }, { id: 'offline', connected: false }, { id: 'media', content_ok: false }]).map(row => row.id), ['media', 'offline', 'work', 'done']);
});

test('mock history forwards cursor and student scope and rejects incomplete/foreign pages', async () => {
  let args;
  let data = { ok: true, sessions: [{ id: 's', class_id: 'c', member_student_ids: ['p'] }], hasMore: true, nextCursor: { startedAt: '2026-10-01T00:00:00Z', id: 's' } };
  const client = { call: async (name, input) => { assert.equal(name, 'teacher_list_literacy_mock_history_page'); args = input; return { data }; } };
  const page = await listLiteracyMockHistoryPage({ client, classId: 'c', studentId: 'p', cursor: { startedAt: '2026-10-02T00:00:00Z', id: 'before' } });
  assert.equal(page.hasMore, true); assert.equal(args.p_student_id, 'p'); assert.equal(args.p_before_id, 'before');
  for (const invalid of [{ ok: false }, { ok: true }, { ...data, sessions: [{ id: 's', class_id: 'other', member_student_ids: ['p'] }] }, { ...data, nextCursor: null }]) {
    data = invalid;
    await assert.rejects(listLiteracyMockHistoryPage({ client, classId: 'c', studentId: 'p' }));
  }
});

test('reading recovery retains an uncertain mark and replays its original idempotency key after reload', async () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const session = { teacher_id: 'teacher-a', id: 'reading-a' };
  const saved = new Set(); let writes = 0;
  const first = createReadingSessionRetryQueue({ ...readingQueueRecovery({ session, kind: 'marks', storage }), send: async payload => { saved.add(payload.clientEventId); writes++; throw new Error('receipt lost'); }, setTimer: () => 1, clearTimer: () => {} });
  first.enqueue({ studentId: 'p', pageIndex: 0, marks: { 0: 'correct' }, clientEventId: 'original-event' });
  await new Promise(resolve => setImmediate(resolve)); first.dispose();
  assert.equal(values.size, 1);
  const recovered = readingQueueRecovery({ session, kind: 'marks', storage });
  assert.equal(recovered.initialOperations[0].payload.clientEventId, 'original-event');
  assert.equal(readingQueueRecovery({ session: { ...session, teacher_id: 'teacher-b' }, kind: 'marks', storage }).initialOperations.length, 0);
  const second = createReadingSessionRetryQueue({ ...recovered, send: async payload => { saved.add(payload.clientEventId); writes++; } });
  await second.flush();
  assert.equal(writes, 2); assert.equal(saved.size, 1); assert.equal(values.size, 0);
});


test('a stalled teacher focus read times out and can be retried without accepting a late response', async () => {
  let aborted = false;
  const client = { call: () => ({ abortSignal(signal) { signal.addEventListener('abort', () => { aborted = true; }); return new Promise(() => {}); } }) };
  await assert.rejects(readTeacherFocusWithTimeout({ client, sessionId: 's' }, 10), /teacher_focus_timeout/);
  assert.equal(aborted, true);
  const recovered = { call: async () => ({ data: { ok: true, session: { id: 's' } } }) };
  assert.equal((await readTeacherFocusWithTimeout({ client: recovered, sessionId: 's' }, 100)).session.id, 's');
});
