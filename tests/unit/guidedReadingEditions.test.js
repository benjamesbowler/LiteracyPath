import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { GUIDED_READING_TOPIC_EDITIONS, guidedReadingContentId, guidedReadingEdition, guidedReadingHistoryBook, guidedReadingProgressKey, getCurrentGuidedReadingRecord, isGuidedReadingAssignmentCurrent } from '../../src/utils/guidedReading/editions.js';
import { getPublicBookMetadata, getGuidedReadingEvidenceMetadata } from '../../src/utils/guidedReading/bookLevelMetadata.js';
import { guidedReadingBookmark } from '../../src/utils/guidedReading/bookmark.js';
import { mergeGuidedReadingRecord, getGuidedReadingCompletionMilestone } from '../../src/utils/guidedReading/completionPolicy.js';
import { getGuidedReadingProgress } from '../../src/data/guidedReadingBooks.js';
import { computeHydratedValue } from '../../src/utils/progressMerge.js';
import { mergeProgressQueueEntries } from '../../src/utils/progressQueue.js';
import { collectGuidedReadingCompletionRecords, createGuidedReadingCompletionWorkbook } from '../../src/utils/exportGuidedReadingCompletionExcel.js';
import { bookReadingProgress, pickContinueBook } from '../../src/policy/childLibraryPolicy.js';
import { countBooksRead } from '../../src/utils/treasureTrail.js';
import { earnedCoins, earnedBerries } from '../../src/utils/hollowEconomy.js';
import { buildGuidedReadingReportRows, buildGuidedReadingSummary } from '../../src/utils/reportSections.js';
import * as readingModule from '../../src/data/guidedReadingBooks.js';
import { buildGuidedReadingReportModel } from '../../src/data/studentReportingWorkspaceModel.js';
import { recoverPreviousTopicReadingChanges } from '../../src/hooks/useReadingSessionHost.js';
import { startReadingSession, isReadingSessionCompatible, readingSessionContentVersion, readingSessionBook, READING_SESSION_CONTENT_VERSION } from '../../src/data/readingSessionCore.js';
import { teacherReadingRouteContext } from '../../src/utils/teacherWorkflowContext.js';
import { resolveFollowerPage } from '../../src/hooks/readingSessionFollowerState.js';

const stamp = '2026-11-08T08:00:00.000Z';
// Stable synthetic fixtures: tests must not depend on ignored authoring drafts.
const titles = ['People Power', 'Vehicles That Fly', 'Gasoline and Electric Cars', 'Transport Through Time', 'Different Countries, Different Places'];
const books = Object.keys(GUIDED_READING_TOPIC_EDITIONS).map((id, i) => ({ id, title: titles[i], level: i ? 'D' : 'B', type: 'nonfiction', pages: [{ pageNumber: 1, text: 'People move.' }, { pageNumber: 2, text: 'Wheels turn.' }] }));
function legacy(book) {
  return { bookId: book.id, title: GUIDED_READING_TOPIC_EDITIONS[book.id].retiredTitle, level: 'E', completed: true, completedAt: stamp, firstReadAt: stamp, lastReadAt: stamp, readCount: 2, completedPages: 10, totalPages: 10, lastPageIndex: 8, wholeBookNote: 'Original teacher note', pages: { 0: { wordTexts: ['train'], wordMarks: { 0: 'support' }, note: 'Original page note', updatedAt: stamp } } };
}

for (const book of books) test(`${book.id}: old completion, bookmark and marks never apply to replacement`, () => {
  const old = legacy(book), before = JSON.stringify(old), key = guidedReadingProgressKey(book);
  const records = { [book.id]: old };
  assert.notEqual(key, book.id);
  assert.equal(guidedReadingContentId(key), book.id);
  assert.equal(isGuidedReadingAssignmentCurrent(book, old.title), false);
  assert.equal(isGuidedReadingAssignmentCurrent(book, null), false);
  assert.equal(isGuidedReadingAssignmentCurrent(book, book.title), true);
  assert.equal(getGuidedReadingProgress(book, old).completed, false);
  assert.equal(getGuidedReadingProgress(book, old).completedPages, 0);
  assert.equal(guidedReadingBookmark(book, old), 0);
  assert.equal(bookReadingProgress(book, old).started, false);
  assert.equal(pickContinueBook({ books: [book], records }), null);
  assert.deepEqual(getCurrentGuidedReadingRecord(book, records), {});
  const next = mergeGuidedReadingRecord({ book, previous: old, studentId: 'child', now: '2026-11-10T08:00:00Z', patch: { completedPages: 1, totalPages: 2, lastPageIndex: 0 } });
  assert.equal(next.edition, guidedReadingEdition(book));
  assert.equal(next.completed, undefined);
  assert.equal(next.pages, undefined);
  assert.equal(next.wholeBookNote, undefined);
  const saved = { ...records, [key]: next };
  assert.equal(JSON.stringify(saved[book.id]), before);
  assert.equal(getCurrentGuidedReadingRecord(book, saved).completedPages, 1);
  assert.equal(guidedReadingBookmark(book, getCurrentGuidedReadingRecord(book, saved)), 0);
  assert.equal(getGuidedReadingCompletionMilestone({ book: { id: 'another', level: 'D' }, levelBooks: [book, { id: 'another', level: 'D' }], records }), null);
  // Rewards are lifetime effort: a new unfinished edition cannot take them away.
  const oldBooks = countBooksRead(records), newBooks = countBooksRead(saved);
  assert.equal(newBooks, oldBooks);
  assert.equal(earnedCoins({ booksRead: newBooks }), earnedCoins({ booksRead: oldBooks }));
  assert.equal(earnedBerries({ booksRead: newBooks }), earnedBerries({ booksRead: oldBooks }));
  assert.equal(countBooksRead({ ...saved, [key]: { ...next, completed: true } }), oldBooks + 1);
});

test('ordinary books, tiny prose fixes and the original five manuscripts retain their keys', () => {
  for (const book of books) assert.equal(guidedReadingProgressKey({ ...book, title: GUIDED_READING_TOPIC_EDITIONS[book.id].retiredTitle }), book.id);
  const ordinary = { id: 'dino-pals-27-bossys-three-paths', title: 'A small wording correction' };
  assert.equal(guidedReadingProgressKey(ordinary), ordinary.id);
  assert.equal(isGuidedReadingAssignmentCurrent(ordinary, "Earlier title"), true);
  assert.equal(guidedReadingContentId('ordinary::unrelated'), 'ordinary::unrelated');
  assert.equal(guidedReadingContentId(guidedReadingProgressKey(books[0]) + '::forged'), guidedReadingProgressKey(books[0]) + '::forged');
});

test('internal edition keys retain exact current public text calibration', () => {
  const current = readingModule.guidedReadingBooks.find(book => book.id === books[0].id);
  const alias = `${current.id}::${GUIDED_READING_TOPIC_EDITIONS[current.id].edition}`;
  assert.equal(getPublicBookMetadata({ ...current, id: alias }).levelStatus, getPublicBookMetadata(current).levelStatus);
  assert.equal(getPublicBookMetadata({ ...current, id: alias }).appReadingLevel, getPublicBookMetadata(current).appReadingLevel);
});

test('local/cloud hydration and offline queue merge both editions independently', () => {
  const book = books[0], old = legacy(book), key = guidedReadingProgressKey(book);
  const fresh = mergeGuidedReadingRecord({ book, patch: { completedPages: 1, totalPages: 2 } });
  let map = computeHydratedValue('guided_reading', key, { [book.id]: old }, fresh);
  map = computeHydratedValue('guided_reading', book.id, map, { ...old, readCount: 3 });
  assert.equal(map[key].completed, undefined);
  assert.equal(map[key].completedPages, 1);
  assert.equal(map[book.id].readCount, 3);
  assert.equal(map[book.id].wholeBookNote, old.wholeBookNote);
  const queued = mergeProgressQueueEntries({ studentId: 's', area: 'guided_reading', key, payload: fresh }, { studentId: 's', area: 'guided_reading', key, payload: { ...fresh, completedPages: 2, completed: true } });
  assert.equal(queued.payload.completed, true);
  assert.throws(() => mergeProgressQueueEntries({ studentId: 's', area: 'guided_reading', key: book.id, payload: old }, { studentId: 's', area: 'guided_reading', key, payload: fresh }), /identity mismatch/);
});

test('teacher report rows preserve both titles, dates, notes and original page counts', () => {
  const book = books[0], old = legacy(book), key = guidedReadingProgressKey(book);
  const current = mergeGuidedReadingRecord({ book, patch: { completedPages: 1, totalPages: 2, lastReadAt: '2026-11-10T08:00:00Z', pages: { 0: { wordTexts: ['people'], wordMarks: { 0: 'correct' } } } } });
  const records = { [book.id]: old, [key]: current };
  const rows = buildGuidedReadingReportRows(records, { ...readingModule, guidedReadingBooks: [book] });
  const historical = rows.find(row => row.bookId === book.id);
  assert.equal(historical.title, old.title);
  assert.equal(historical.totalPages, 10);
  assert.equal(historical.lastReadAt, stamp);
  assert.deepEqual(historical.supportWords, ['train']);
  assert.ok(historical.notes.some(row => row.note === old.wholeBookNote));
  assert.equal(historical.appReadingLevel, null, 'do not assign replacement complexity to retired text');
  assert.equal(getGuidedReadingEvidenceMetadata(historical).appReadingLevel, null);
  assert.ok(buildGuidedReadingSummary([historical]).byLevel.some(row => row.level === 'pending' && row.count === 1));
  assert.equal(rows.find(row => row.bookId === key).title, book.title);
  const workspace = buildGuidedReadingReportModel({ guidedReadingRecords: records });
  assert.equal(workspace.books.length, 2);
  assert.equal(workspace.books.find(row => row.bookId === book.id).title, old.title);
  assert.equal(workspace.books.find(row => row.bookId === key).title, book.title);
  assert.equal(workspace.wordRows.find(row => row.word === 'train').title, old.title);
  assert.equal(guidedReadingHistoryBook(book, {}, book.id).title, old.title);
  const partial = { ...old, completed: false, completedAt: "", totalPages: undefined, completedPages: 4, pages: {} };
  const historicalProgress = getGuidedReadingProgress(guidedReadingHistoryBook(book, partial, book.id), partial);
  assert.equal(historicalProgress.completedPages, 4);
  assert.equal(historicalProgress.totalPages, GUIDED_READING_TOPIC_EDITIONS[book.id].retiredPageCount);
});

test('completion Excel keeps old and new titles as separate reading evidence', async () => {
  const book = books[0], old = legacy(book), key = guidedReadingProgressKey(book);
  const current = mergeGuidedReadingRecord({ book, patch: { completed: true, completedAt: '2026-11-10T08:00:00Z', readCount: 1, completedPages: 2, totalPages: 2 } });
  const rows = collectGuidedReadingCompletionRecords({ students: [{ id: 's', name: 'Synthetic Reader' }], guidedReadingRecordsByStudent: [{ studentId: 's', records: { [book.id]: old, [key]: current } }] });
  assert.equal(rows.length, 2);
  assert.equal(rows.find(row => row.bookId === book.id).bookTitle, old.title);
  assert.equal(rows.find(row => row.bookId === key).bookTitle, book.title);
  assert.equal(rows.find(row => row.bookId === book.id).totalPages, 10);
  assert.equal(rows.find(row => row.bookId === book.id).readCount, 2);
  assert.match(rows.find(row => row.bookId === book.id).notes, /Original teacher note/);
  const { workbook } = await createGuidedReadingCompletionWorkbook({ students: [{ id: 's', name: 'Synthetic Reader' }], guidedReadingRecordsByStudent: [{ studentId: 's', records: { [book.id]: old, [key]: current } }] });
  const cells = []; workbook.eachSheet(sheet => sheet.eachRow(row => cells.push(row.values)));
  assert.ok(JSON.stringify(cells).includes(old.title));
  assert.ok(JSON.stringify(cells).includes(book.title));
});

test('new shared groups use internal edition keys and scoped versions, preserving ordinary v1', async () => {
  const calls = [], client = { call: async (name, args) => { calls.push([name, args]); return { data: { ok: true } }; } };
  for (const book of books) {
    await startReadingSession({ client, classId: 'class', bookId: book.id, book, pageNumbers: [1, 2], studentIds: ['s'] });
    const args = calls.at(-1)[1];
    assert.equal(args.p_book_id, guidedReadingProgressKey(book));
    assert.equal(args.p_content_version, readingSessionContentVersion(book));
    const session = { book_id: args.p_book_id, content_version: args.p_content_version, page_numbers: [1, 2], page_index: 1 };
    assert.equal(isReadingSessionCompatible(session, book), true);
    assert.equal(readingSessionBook(session, books), book);
    assert.equal(teacherReadingRouteContext({ session: { ...session, id: "shared", teacher_id: "t", class_id: "c" }, teacherId: "t", classId: "c", params: new URLSearchParams("readingSession=shared") }).bookId, book.id);
    assert.equal(resolveFollowerPage({ books, session, contentVersion: READING_SESSION_CONTENT_VERSION }).contentOk, true);
    assert.equal(resolveFollowerPage({ books, session: { ...session, book_id: book.id, content_version: READING_SESSION_CONTENT_VERSION }, contentVersion: READING_SESSION_CONTENT_VERSION }).contentOk, false);
    assert.equal(isReadingSessionCompatible({ ...session, book_id: book.id }, book), false);
  }
  const ordinary = { id: 'ordinary', title: 'Still the same book', pages: [{ pageNumber: 1 }] };
  await startReadingSession({ client, bookId: ordinary.id, book: ordinary, pageNumbers: [1], studentIds: ['s'] });
  assert.equal(calls.at(-1)[1].p_book_id, ordinary.id);
  assert.equal(calls.at(-1)[1].p_content_version, READING_SESSION_CONTENT_VERSION);
  assert.equal(isReadingSessionCompatible({ book_id: ordinary.id, content_version: READING_SESSION_CONTENT_VERSION }, ordinary), true);
});

test('old pending operations recover only to their original validated session and remain queued on failure', async () => {
  const book = books[0];
  const session = { id: 'old-session', teacher_id: 'teacher', class_id: 'class', book_id: book.id, content_version: READING_SESSION_CONTENT_VERSION };
  const store = new Map();
  const storage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
  const markKey = 'lp:reading-pending:v1:teacher:old-session:marks';
  const operation = { createdAt: 1, payload: { studentId: 'child', pageIndex: 2, marks: { 0: 'support' }, clientEventId: 'old-event' } };
  store.set(markKey, JSON.stringify([operation]));
  const calls = [];
  const client = { call: async (name, args) => { calls.push([name, args]); return { data: name === 'teacher_resume_reading_session' ? { ok: true, session } : { ok: true } }; } };
  await recoverPreviousTopicReadingChanges({ client, session, storage, book });
  assert.equal(store.has(markKey), false);
  assert.equal(calls[1][0], 'teacher_save_reading_marks');
  assert.equal(calls[1][1].p_session_id, session.id);
  assert.deepEqual(calls[1][1].p_marks, operation.payload.marks);
  assert.equal(calls[1][1].p_client_event_id, 'old-event');
  store.set(markKey, JSON.stringify([operation]));
  const failing = { call: async name => ({ data: name === 'teacher_resume_reading_session' ? { ok: true, session } : { ok: false, error: 'offline' } }) };
  await assert.rejects(recoverPreviousTopicReadingChanges({ client: failing, session, storage, book }), /waiting to save/);
  assert.deepEqual(JSON.parse(store.get(markKey)), [operation]);
  await assert.rejects(recoverPreviousTopicReadingChanges({ client, session: { ...session, book_id: guidedReadingProgressKey(book), content_version: readingSessionContentVersion(book) }, storage, book }), /Not a previous-topic/);
});

test('existing protected marks RPC saves an edition without touching historical progress', async () => {
  const db = await PGlite.create();
  const teacher = '11000000-0000-4000-8000-000000000001', other = '11000000-0000-4000-8000-000000000002', student = '22000000-0000-4000-8000-000000000001', outsider = '22000000-0000-4000-8000-000000000002', sessionId = '33000000-0000-4000-8000-000000000001', classId = '44000000-0000-4000-8000-000000000001';
  const book = books[0], old = legacy(book), key = guidedReadingProgressKey(book);
  const migration = fs.readFileSync(new URL('../../supabase/migrations/20260801090000_synced_guided_reading.sql', import.meta.url), 'utf8');
  const sql = migration.slice(migration.indexOf('create or replace function public.teacher_save_reading_marks('), migration.indexOf('create or replace function public.student_get_reading_session('));
  try {
    await db.exec(`create schema auth; create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('fixture.actor',true),'')::uuid $$; create function assert_current_actor_teacher_access() returns void language plpgsql as $$ begin if auth.uid() is null then raise exception 'Teacher required'; end if; end $$; create table reading_sessions(id uuid,teacher_id uuid,class_id uuid,book_id text,page_numbers integer[],student_ids uuid[],status text,updated_at timestamptz,mark_event_ids text[]); create table students(id uuid,class_id uuid,teacher_id uuid,archived_at timestamptz); create table student_progress(student_id uuid,area text,key text,payload jsonb,updated_at timestamptz,unique(student_id,area,key));`);
    await db.exec(sql);
    await db.query(`insert into students values($1,$2,$3,null)`, [student, classId, teacher]);
    await db.query(`insert into reading_sessions values($1,$2,$3,$4,array[1,2],array[$5]::uuid[],'active',now(),array[]::text[])`, [sessionId, teacher, classId, key, student]);
    await db.query(`insert into student_progress values($1,'guided_reading',$2,$3,now())`, [student, book.id, old]);
    await db.exec(`set fixture.actor='${teacher}'`);
    const save = async (id = student, marks = { 0: 'correct' }, event = 'event') => (await db.query('select teacher_save_reading_marks($1,$2,0,$3,$4) value', [sessionId, id, marks, event])).rows[0].value;
    assert.equal((await save()).ok, true);
    assert.equal((await save()).duplicate, true);
    const rows = (await db.query('select key,payload from student_progress')).rows;
    assert.deepEqual(rows.find(row => row.key === book.id).payload, old);
    const shared = rows.find(row => row.key === key).payload;
    assert.equal(shared.bookId, key);
    assert.equal(shared.completed, undefined);
    assert.equal(getCurrentGuidedReadingRecord(book, { [key]: shared }).pages[0].wordMarks[0], 'correct');
    assert.equal((await save(outsider, {}, 'outsider')).error, 'student_not_in_session');
    assert.equal((await save(student, { 0: 'fabricated' }, 'bad')).error, 'invalid_payload');
    await db.exec(`set fixture.actor='${other}'`);
    assert.equal((await save(student, {}, 'foreign')).error, 'session_not_found');
    await db.exec(`set fixture.actor='${teacher}'; update students set archived_at=now();`);
    assert.equal((await save(student, {}, 'archived')).error, 'student_not_in_class');
    await db.exec(`update students set archived_at=null; update reading_sessions set status='ended';`);
    assert.equal((await save(student, {}, 'ended')).error, 'session_ended');
    assert.equal((await db.query('select payload from student_progress where key=$1', [book.id])).rows[0].payload.title, old.title);
  } finally { await db.close(); }
});
