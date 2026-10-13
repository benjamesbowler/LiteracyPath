import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { readingQueueRecovery } from '../../src/hooks/useReadingSessionHost.js';
const teacher = '11000000-0000-4000-8000-000000000001', other = '11000000-0000-4000-8000-000000000002';
const classId = '22000000-0000-4000-8000-000000000001', student = '33000000-0000-4000-8000-000000000001', sessionId = '44000000-0000-4000-8000-000000000001';
const sql = readFileSync(new URL('../../supabase/migrations/20261013151000_teacher_resume_reading_session.sql', import.meta.url), 'utf8');

test('session recovery tolerates a blocked sessionStorage getter', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
  try { const state = readingQueueRecovery({ session: { id: 's', teacher_id: 't' }, kind: 'marks' }); assert.deepEqual(state.initialOperations, []); assert.doesNotThrow(() => state.persist([{ payload: {}, createdAt: 1 }])); }
  finally { if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous); else delete globalThis.sessionStorage; }
});

test('explicit reading resume preserves identity and rejects ended, foreign, archived or competing assignments', async () => {
  const db = await PGlite.create();
  try {
    await db.exec(`create schema auth; create role anon; create role authenticated;
      create function auth.uid() returns uuid language sql stable as $$select current_setting('fixture.actor')::uuid$$;
      create function assert_current_actor_teacher_access() returns void language plpgsql as $$begin if auth.uid() is null then raise exception 'Teacher required'; end if; end$$;
      create table classes(id uuid,teacher_id uuid);
      create table students(id uuid,teacher_id uuid,class_id uuid,archived_at timestamptz);
      create table reading_sessions(id uuid,teacher_id uuid,class_id uuid,status text,student_ids uuid[],book_id text,page_index integer,updated_at timestamptz,mark_event_ids text[]);
      create table student_focus_sessions(id uuid,status text,expires_at timestamptz);
      create table student_focus_session_members(session_id uuid,student_id uuid,active boolean);
      insert into classes values('${classId}','${teacher}');
      insert into students values('${student}','${teacher}','${classId}',null);
      insert into reading_sessions values('${sessionId}','${teacher}','${classId}','active',array['${student}']::uuid[],'original-book',2,now()-interval '2 hours',array['original-event']);
      set fixture.actor='${teacher}';`);
    await db.exec(sql);
    const resume = async () => (await db.query('select teacher_resume_reading_session($1) value', [sessionId])).rows[0].value;
    const received = await resume();
    assert.equal(received.ok, true); assert.equal(received.session.id, sessionId); assert.equal(received.session.book_id, 'original-book'); assert.equal(received.session.page_index, 2); assert.deepEqual(received.session.mark_event_ids, ['original-event']);
    assert.ok(Date.now() - Date.parse(received.session.updated_at) < 10000);
    await db.exec(`set fixture.actor='${other}'`); assert.equal((await resume()).error, 'session_not_found');
    await db.exec(`set fixture.actor='${teacher}'; update reading_sessions set status='ended';`); assert.equal((await resume()).error, 'session_ended');
    await db.exec(`update reading_sessions set status='active'; update students set archived_at=now();`); assert.equal((await resume()).error, 'student_not_in_class');
    await db.exec(`update students set archived_at=null; insert into student_focus_sessions values('${other}','active',now()+interval '1 hour'); insert into student_focus_session_members values('${other}','${student}',true);`); assert.equal((await resume()).error, 'student_busy');
    await db.exec(`delete from student_focus_session_members; insert into reading_sessions select '${other}',teacher_id,class_id,'active',student_ids,book_id,0,now(),array[]::text[] from reading_sessions;`); assert.equal((await resume()).error, 'student_busy');
    assert.equal((await db.query("select has_function_privilege('anon','public.teacher_resume_reading_session(uuid)','execute') ok")).rows[0].ok, false);
  } finally { await db.close(); }
});
