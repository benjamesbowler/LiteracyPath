import test from 'node:test';
import assert from 'node:assert/strict';
import { rememberTeacherSessionReturn, readTeacherSessionReturn } from '../../src/utils/teacherSessionReturn.js';
import { APP_VIEWS } from '../../src/appState/appViews.js';
const session = { id: 'session-a', class_id: 'class-a', teacher_id: 'teacher-a' };
const store = () => { const values = new Map(); return { values, getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) }; };

test('session return survives a fresh read and keeps only allowlisted token-free context', () => {
  const storage = store();
  assert.equal(rememberTeacherSessionReturn({ teacherId: 'teacher-a', session, storage, context: {
    returnView: APP_VIEWS.TEACHER_GUIDED_READING, returnBookId: 'original-book', audience: 'selected_students', studentIds: ['one', 'two', 'one'],
    token: 'must-not-store', learnerId: 'hidden-learner', readingSession: 'foreign-session', returnLabel: 'untrusted label'
  } }), true);
  const reloaded = readTeacherSessionReturn({ teacherId: 'teacher-a', session: { ...session }, storage });
  assert.deepEqual(reloaded, { classId: 'class-a', returnView: APP_VIEWS.TEACHER_GUIDED_READING, returnLabel: 'Back to Books', audience: 'selected_students', studentIds: ['one', 'two'], bookId: 'original-book' });
  const raw = [...storage.values.values()][0];
  assert.doesNotMatch(raw, /must-not-store|hidden-learner|foreign-session|untrusted label/);
});

test('foreign teacher, changed class, missing storage and unsafe destinations deliberately fall back to Teach', () => {
  const storage = store();
  rememberTeacherSessionReturn({ teacherId: 'teacher-a', session, storage, context: { returnView: APP_VIEWS.REPORTS } });
  for (const options of [
    { teacherId: 'teacher-b', session: { ...session, teacher_id: 'teacher-b' }, storage },
    { teacherId: 'teacher-b', session, storage },
    { teacherId: 'teacher-a', session: { ...session, class_id: 'class-b' }, storage },
    { teacherId: 'teacher-a', session, storage: store() }
  ]) {
    const result = readTeacherSessionReturn(options);
    assert.equal(result.returnView, APP_VIEWS.TEACHER_RESOURCES); assert.equal(result.returnLabel, 'Back to Teach'); assert.deepEqual(result.studentIds, []);
  }
  rememberTeacherSessionReturn({ teacherId: 'teacher-a', session, storage, context: { returnView: 'https://external.example', returnLabel: 'Go elsewhere' } });
  assert.equal(readTeacherSessionReturn({ teacherId: 'teacher-a', session, storage }).returnView, APP_VIEWS.TEACHER_RESOURCES);
});

test('tampered descriptors cannot inject navigation context', () => {
  const storage = store();
  rememberTeacherSessionReturn({ teacherId: 'teacher-a', session, storage, context: { returnView: APP_VIEWS.PRESENT } });
  const [key, raw] = [...storage.values][0];
  storage.setItem(key, JSON.stringify({ ...JSON.parse(raw), learnerId: 'hidden', token: 'secret', readingSession: 'old' }));
  const value = readTeacherSessionReturn({ teacherId: 'teacher-a', session, storage });
  assert.equal(value.returnView, APP_VIEWS.PRESENT);
  assert.equal(Object.hasOwn(value, 'learnerId'), false); assert.equal(Object.hasOwn(value, 'token'), false); assert.equal(Object.hasOwn(value, 'readingSession'), false);
  storage.setItem(key, JSON.stringify({ ...JSON.parse(raw), teacherId: 'foreign' }));
  assert.equal(readTeacherSessionReturn({ teacherId: 'teacher-a', session, storage }).returnView, APP_VIEWS.TEACHER_RESOURCES);
});

test('assessment origin uses the full visible destination name', () => {
  const storage = store();
  rememberTeacherSessionReturn({ teacherId: 'teacher-a', session, storage, context: { returnView: APP_VIEWS.ASSESSMENTS } });
  assert.equal(readTeacherSessionReturn({ teacherId: 'teacher-a', session, storage }).returnLabel, 'Back to Assessments');
  rememberTeacherSessionReturn({ teacherId: 'teacher-a', session, storage, context: { returnView: APP_VIEWS.TEACHER_DASHBOARD } });
  assert.equal(readTeacherSessionReturn({ teacherId: 'teacher-a', session, storage }).returnLabel, 'Back to Dashboard');
});
