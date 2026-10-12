import test from 'node:test';
import assert from 'node:assert/strict';
import { readMockTeacherPending, saveMockTeacherPending, clearMockTeacherPending } from '../../src/utils/literacyMockTeacherPending.js';
import { prepareLiteracyMockSession, requireLiteracyMockSuccess } from '../../src/data/literacyMockSessionCore.js';

function storage() {
  const rows = new Map();
  return { getItem: key => rows.get(key) ?? null, setItem: (key, value) => rows.set(key, value), removeItem: key => rows.delete(key) };
}
const args = { classId: 'class-a', wholeClass: true, studentIds: [], durationMinutes: 20, itemCount: 43, requestId: 'same-request' };

for (const kind of ['preparation', 'control', 'evidence']) {
  test(`${kind} retains its exact retry across a reload, scoped to teacher and class`, () => {
    const target = storage();
    const action = { ...args, sessionId: 'session-a', action: 'add_time', expectedRevision: 3 };
    const record = saveMockTeacherPending('teacher-a', 'class-a', kind, action, target);
    assert.deepEqual(readMockTeacherPending('teacher-a', 'class-a', target), record);
    assert.equal(readMockTeacherPending('teacher-b', 'class-a', target), null);
    assert.equal(readMockTeacherPending('teacher-a', 'class-b', target), null);
    clearMockTeacherPending('teacher-a', 'class-a', 'different-receipt', target);
    assert.deepEqual(readMockTeacherPending('teacher-a', 'class-a', target), record);
    clearMockTeacherPending('teacher-a', 'class-a', action.requestId, target);
    assert.equal(readMockTeacherPending('teacher-a', 'class-a', target), null);
  });
}

test('a competing action or changed payload cannot replace an unconfirmed request', () => {
  const target = storage();
  const record = saveMockTeacherPending('teacher-a', 'class-a', 'preparation', args, target);
  assert.throws(() => saveMockTeacherPending('teacher-a', 'class-a', 'preparation', { ...args, requestId: 'other' }, target), /earlier action/);
  assert.throws(() => saveMockTeacherPending('teacher-a', 'class-a', 'preparation', { ...args, itemCount: 24 }, target), /earlier action/);
  assert.deepEqual(readMockTeacherPending('teacher-a', 'class-a', target), record);
  assert.deepEqual(saveMockTeacherPending('teacher-a', 'class-a', 'preparation', args, target), record);
});

test('unavailable storage and silently failed writes prevent a new dispatch', () => {
  assert.throws(() => saveMockTeacherPending('teacher-a', 'class-a', 'preparation', args, null), /No new action was sent/);
  assert.throws(() => saveMockTeacherPending('teacher-a', 'class-a', 'preparation', args, { getItem: () => null, setItem() {} }), /No new action was sent/);
  assert.throws(() => saveMockTeacherPending('', 'class-a', 'preparation', args, storage()), /No new action was sent/);
});

test('unreadable earlier retry details are not silently discarded', () => {
  assert.throws(() => readMockTeacherPending('teacher-a', 'class-a', { getItem: () => '{bad json' }), /earlier action could not be read/);
});

test('versioned preparations survive reload and legacy retries retain v3 dispatch without rewriting saved args', async () => {
  for (const contentVersion of [undefined, 'literacy-mock-v4']) {
    const target = storage(), saved = { ...args, windowMode: 'pause_at_window_end', ...(contentVersion ? { contentVersion } : {}) };
    saveMockTeacherPending('teacher-a', 'class-a', 'preparation', saved, target);
    const restored = readMockTeacherPending('teacher-a', 'class-a', target);
    const calls = [], client = { call: async (name, payload) => { calls.push({ name, payload }); return { data: { ok: true } }; } };
    await prepareLiteracyMockSession({ client, ...restored.args, legacyPending: true });
    assert.equal(calls[0].name, contentVersion ? 'teacher_prepare_literacy_mock_session_v4' : 'teacher_prepare_literacy_mock_session_v3');
    assert.deepEqual(readMockTeacherPending('teacher-a', 'class-a', target).args, saved);
    assert.equal(calls[0].payload.p_request_id, saved.requestId);
  }
});

test('uncertain teacher results keep the exact retry while explicit server rejection releases it', () => {
  const target = storage();
  for (const result of [null, {}, { ok: 'true' }, { ok: false, error: 'request_conflict' }]) {
    saveMockTeacherPending('teacher-a', 'class-a', 'preparation', args, target);
    try { requireLiteracyMockSuccess(result); clearMockTeacherPending('teacher-a', 'class-a', args.requestId, target); }
    catch (error) { if (error.confirmedRejection) clearMockTeacherPending('teacher-a', 'class-a', args.requestId, target); }
    assert.equal(Boolean(readMockTeacherPending('teacher-a', 'class-a', target)), result?.ok !== false);
  }
});
