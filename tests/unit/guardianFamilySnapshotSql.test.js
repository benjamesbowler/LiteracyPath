import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { buildParentReleaseSnapshot } from "../../src/data/parentReleaseSnapshot.js";

const migrations = new URL("../../supabase/migrations/", import.meta.url);
const original = readFileSync(new URL("20260822120000_school_linked_guardian_portal.sql", migrations), "utf8");
const forward = readFileSync(new URL("20261123053429_family_report_controlled_language.sql", migrations), "utf8");
const originalFunction = name => {
  const start = original.indexOf(`create or replace function public.${name}(`);
  return original.slice(start, original.indexOf("$$;", original.indexOf("as $$", start) + 5) + 3);
};
const teacher = "11000000-0000-4000-8000-000000000001";
const other = "11000000-0000-4000-8000-000000000002";
const guardian = "11000000-0000-4000-8000-000000000003";
const school = "22000000-0000-4000-8000-000000000001";
const classroom = "33000000-0000-4000-8000-000000000001";
const learner = "44000000-0000-4000-8000-000000000001";

test("the forward report functions accept verified identity and guard release, reads and withdrawal", async t => {
  const db = await PGlite.create();
  t.after(() => db.close());
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('fixture.actor', true), '')::uuid $$;
    create table public.schools(id uuid primary key, name text);
    create table public.classes(id uuid primary key, school_id uuid, name text);
    create table public.students(id uuid primary key, name text, teacher_id uuid, class_id uuid, archived_at timestamptz);
    create table public.family_report_releases(id uuid primary key default gen_random_uuid(), school_id uuid, student_id uuid,
      teacher_id uuid, title text, schema_version int, snapshot jsonb, released_by uuid, released_at timestamptz,
      withdrawn_at timestamptz, withdrawn_by uuid);
    create table public.guardian_access_audit(teacher_id uuid, school_id uuid, student_id uuid, report_id uuid,
      event_type text, guardian_user_id uuid);
    create table public.guardian_profiles(user_id uuid, email text, display_name text, preferred_language text, report_notifications bool);
    create table public.guardian_learner_links(guardian_user_id uuid, student_id uuid, teacher_id uuid, school_id uuid, revoked_at timestamptz);
    create function public.is_app_admin(uuid) returns boolean language sql stable as $$ select false $$;
    create function public.assert_current_actor_teacher_access() returns void language plpgsql as $$
      begin
        if auth.uid() is distinct from '${teacher}'::uuid and auth.uid() is distinct from '${other}'::uuid then
          raise exception using errcode = '42501', message = 'Teacher account required';
        end if;
      end;
    $$;
    insert into auth.users values ('${teacher}', 'teacher@benchmark.school'), ('${other}', 'other@example.test');
    insert into schools values ('${school}', 'Benchmark School');
    insert into classes values ('${classroom}', '${school}', 'Sample class');
    insert into students values ('${learner}', 'Sample Pupil', '${teacher}', '${classroom}', null);
    insert into guardian_profiles values
      ('${guardian}', 'guardian@example.test', 'Linked adult', 'en', false),
      ('${other}', 'other@example.test', 'Other adult', 'en', false);
    insert into guardian_learner_links values ('${guardian}', '${learner}', '${teacher}', '${school}', null);
  `);
  await db.exec([
    "current_actor_has_guardian_access", "guardian_get_portal",
    "teacher_withdraw_family_report", "guardian_record_report_event"
  ].map(originalFunction).join("\n"));
  await db.exec(forward);
  const asActor = actor => db.query("select set_config('fixture.actor', $1, false)", [actor]);
  const result = async (sql, parameters = []) => (await db.query(sql, parameters)).rows[0].result;
  const snapshot = buildParentReleaseSnapshot({
    workspace: { wholeChild: { concepts: [{ domain: "decoding", construct: "cvc_word", statusId: "needs_support" }] } },
    studentId: learner, studentName: "Sample Pupil", className: "Sample class", schoolName: "Benchmark School",
    teacherName: "Benchmark Teacher", teacherEmail: "teacher@benchmark.school"
  });
  const release = value => result("select public.teacher_release_family_report($1, $2, $3) as result",
    [learner, "Synthetic family update", JSON.stringify(value)]);
  const portal = () => result("select public.guardian_get_portal() as result");
  const print = reportId => result("select public.guardian_record_report_event($1, 'report_printed') as result", [reportId]);

  await asActor(teacher);
  for (const rejected of [
    { ...snapshot, highlight: "The benchmark and raw score are confidential." },
    { ...snapshot, contact: { ...snapshot.contact, email: "other@example.test" } },
    { ...snapshot, learner: { ...snapshot.learner, schoolName: "Different School" } },
    { ...snapshot, progress: [{ ...snapshot.progress[0], privateNotes: "Staff observation" }] }
  ]) assert.deepEqual(await release(rejected), { ok: false, error: "invalid_family_snapshot" });
  const released = await release(snapshot);
  assert.equal(released.ok, true);
  assert.equal(await result("select has_function_privilege('anon', 'public.teacher_release_family_report(uuid,text,jsonb)', 'EXECUTE') as result"), false);
  assert.equal(await result("select has_function_privilege('authenticated', 'public.guardian_family_snapshot_is_valid(jsonb,uuid)', 'EXECUTE') as result"), false);

  await asActor(other);
  await assert.rejects(release(snapshot), { code: "42501" });
  assert.deepEqual((await portal()).children, []);
  await assert.rejects(print(released.report_id), { code: "42501" });
  await asActor(guardian);
  assert.deepEqual((await portal()).children[0].reports[0].snapshot, snapshot);
  assert.equal((await print(released.report_id)).ok, true);

  await asActor(teacher);
  assert.equal((await result("select public.teacher_withdraw_family_report($1) as result", [released.report_id])).ok, true);
  await asActor(guardian);
  assert.deepEqual((await portal()).children[0].reports, []);
  await assert.rejects(print(released.report_id), { code: "42501" });
});
