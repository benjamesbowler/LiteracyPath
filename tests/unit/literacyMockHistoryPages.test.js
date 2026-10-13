import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { validateClassRpcData } from '../../src/data/boundaries/classes.js';
import { listLiteracyMockHistoryPage } from '../../src/data/literacyMockSessionCore.js';
const teacher = '11000000-0000-4000-8000-000000000001';
const other = '11000000-0000-4000-8000-000000000002';
const classId = '22000000-0000-4000-8000-000000000001';
const student = '33000000-0000-4000-8000-000000000001';
const migration = readFileSync(new URL('../../supabase/migrations/20261013051103_teacher_mock_history_pages.sql', import.meta.url), 'utf8');

test('mock history traverses beyond 50 tied timestamps, retains archived membership and never reconciles state', async () => {
  const db = await PGlite.create();
  try {
    await db.exec(`create schema auth; create role anon; create role authenticated;
      create function auth.uid() returns uuid language sql stable as $$select current_setting('fixture.actor')::uuid$$;
      create function public.assert_current_actor_teacher_access() returns void language plpgsql as $$begin if auth.uid() is null then raise exception 'Teacher required'; end if; end$$;
      create table classes(id uuid primary key,teacher_id uuid);
      create table student_focus_sessions(id uuid primary key,class_id uuid,teacher_id uuid,started_at timestamptz,status text,selection_scope text);
      create table literacy_mock_sessions(session_id uuid primary key,state text,item_count integer,revision integer,remaining_seconds integer);
      create table student_focus_session_members(session_id uuid,student_id uuid);
      insert into classes values('${classId}','${teacher}');
      set fixture.actor='${teacher}';
      insert into student_focus_sessions select ('44000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,'${classId}','${teacher}','2026-10-01','active','selected_students' from generate_series(1,73) n;
      insert into literacy_mock_sessions select id,'running',24,2,600 from student_focus_sessions;
      insert into student_focus_session_members select id,'${student}' from student_focus_sessions;
      create function public.lp_literacy_mock_state(uuid) returns jsonb language plpgsql volatile as $$begin raise exception 'History must not mutate session state'; end$$;`);
    await db.exec(migration);
    const page = async (cursor = null, pupil = student) => {
      const result = (await db.query('select teacher_list_literacy_mock_history_page($1,$2,$3,$4,20) value', [classId, pupil, cursor?.startedAt || null, cursor?.id || null])).rows[0].value;
      return validateClassRpcData('teacher_list_literacy_mock_history_page', result);
    };
    const ids = []; let cursor = null; let pages = 0;
    do { const result = await page(cursor); assert.equal(result.ok, true); assert.ok(result.sessions.every(row => row.mock.snapshot_only)); ids.push(...result.sessions.map(row => row.id)); cursor = result.nextCursor; pages++; } while (cursor);
    assert.equal(pages, 4); assert.equal(ids.length, 73); assert.equal(new Set(ids).size, 73);
    const actualFirstPage = await page();
    assert.ok(actualFirstPage.sessions.every(row => !Object.hasOwn(row.mock, 'server_now')));
    const originalSnapshot = structuredClone(actualFirstPage);
    assert.equal(validateClassRpcData('teacher_list_literacy_mock_history_page', actualFirstPage), actualFirstPage);
    assert.deepEqual(actualFirstPage, originalSnapshot);
    const frontendPage = await listLiteracyMockHistoryPage({ classId, studentId: student,
      client: { call: async () => ({ data: actualFirstPage }) } });
    assert.equal(frontendPage.sessions.length, 20);
    assert.equal(frontendPage.hasMore, true);
    // A history marker cannot grant a clock exception to any live receipt.
    for (const rpc of ['teacher_list_literacy_mock_sessions', 'teacher_get_literacy_mock_report',
      'teacher_control_literacy_mock_session', 'student_get_literacy_mock_run', 'student_get_focus_session']) {
      for (const envelope of [{ sessions: actualFirstPage.sessions }, { session: actualFirstPage.sessions[0] }, { mock: actualFirstPage.sessions[0].mock }]) {
        assert.throws(() => validateClassRpcData(rpc, { ok: true, ...envelope }), /invalid mock session clock/);
      }
    }
    for (const patch of [{ snapshot_only: false }, { snapshot_only: undefined }, { state: 'unknown' }, { revision: -1 }, { remaining_seconds: -1 }]) {
      const malformed = structuredClone(actualFirstPage);
      Object.assign(malformed.sessions[0].mock, patch);
      assert.throws(() => validateClassRpcData('teacher_list_literacy_mock_history_page', malformed));
    }
    for (const missingMock of [undefined, null]) {
      const malformed = structuredClone(actualFirstPage);
      malformed.sessions[0].mock = missingMock;
      assert.throws(() => validateClassRpcData('teacher_list_literacy_mock_history_page', malformed));
    }
    const liveSession = structuredClone(actualFirstPage.sessions[0]);
    liveSession.mock.server_now = '2026-10-13T09:00:00Z';
    assert.equal(validateClassRpcData('teacher_get_literacy_mock_report', { ok: true, session: liveSession }).session, liveSession);
    assert.equal((await db.query("select count(*)::integer n from literacy_mock_sessions where state='running'")).rows[0].n, 73);
    assert.equal((await db.query("select has_function_privilege('anon','public.teacher_list_literacy_mock_history_page(uuid,uuid,timestamptz,uuid,integer)','execute') ok")).rows[0].ok, false);
    await db.exec(`set fixture.actor='${other}'`);
    assert.deepEqual(await page(), { ok: false, error: 'class_not_found' });
    await db.exec(`set fixture.actor='${teacher}'`);
    assert.deepEqual(await page(null, other), { ok: true, sessions: [], hasMore: false, nextCursor: null });
    assert.equal((await db.query('select teacher_list_literacy_mock_history_page($1,null,now(),null,20) value', [classId])).rows[0].value.error, 'invalid_page');
  } finally { await db.close(); }
});
