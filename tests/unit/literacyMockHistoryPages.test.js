import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
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
      create table literacy_mock_sessions(session_id uuid primary key,state text,item_count integer);
      create table student_focus_session_members(session_id uuid,student_id uuid);
      insert into classes values('${classId}','${teacher}');
      set fixture.actor='${teacher}';
      insert into student_focus_sessions select ('44000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,'${classId}','${teacher}','2026-10-01','active','selected_students' from generate_series(1,73) n;
      insert into literacy_mock_sessions select id,'running',24 from student_focus_sessions;
      insert into student_focus_session_members select id,'${student}' from student_focus_sessions;
      create function public.lp_literacy_mock_state(uuid) returns jsonb language plpgsql volatile as $$begin raise exception 'History must not mutate session state'; end$$;`);
    await db.exec(migration);
    const page = async (cursor = null, pupil = student) => (await db.query('select teacher_list_literacy_mock_history_page($1,$2,$3,$4,20) value', [classId, pupil, cursor?.startedAt || null, cursor?.id || null])).rows[0].value;
    const ids = []; let cursor = null; let pages = 0;
    do { const result = await page(cursor); assert.equal(result.ok, true); assert.ok(result.sessions.every(row => row.mock.snapshot_only)); ids.push(...result.sessions.map(row => row.id)); cursor = result.nextCursor; pages++; } while (cursor);
    assert.equal(pages, 4); assert.equal(ids.length, 73); assert.equal(new Set(ids).size, 73);
    assert.equal((await db.query("select count(*)::integer n from literacy_mock_sessions where state='running'")).rows[0].n, 73);
    assert.equal((await db.query("select has_function_privilege('anon','public.teacher_list_literacy_mock_history_page(uuid,uuid,timestamptz,uuid,integer)','execute') ok")).rows[0].ok, false);
    await db.exec(`set fixture.actor='${other}'`);
    assert.deepEqual(await page(), { ok: false, error: 'class_not_found' });
    await db.exec(`set fixture.actor='${teacher}'`);
    assert.equal((await page(null, other)).sessions.length, 0);
    assert.equal((await db.query('select teacher_list_literacy_mock_history_page($1,null,now(),null,20) value', [classId])).rows[0].value.error, 'invalid_page');
  } finally { await db.close(); }
});
