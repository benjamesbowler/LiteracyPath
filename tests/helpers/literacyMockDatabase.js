import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const teacher = "11000000-0000-4000-8000-000000000001";
const other = "11000000-0000-4000-8000-000000000002";
const classId = "22000000-0000-4000-8000-000000000001";
const foreignClass = "22000000-0000-4000-8000-000000000002";
const studentId = "33000000-0000-4000-8000-000000000001";
const secondStudent = "33000000-0000-4000-8000-000000000002";
const foreignStudent = "33000000-0000-4000-8000-000000000003";
const read = file => readFileSync(new URL(`../../supabase/migrations/${file}`, import.meta.url), "utf8");
const functionFrom = (file, name) => read(file).match(new RegExp(`create (?:or replace )?function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`))[0];
const query = async (db, sql, args = []) => (await db.query(sql, args)).rows[0].value;
const domains = ["sound_awareness", "phonics", "vocabulary", "listening", "reading", "language", "print", "writing"];
const items = Array.from({ length: 24 }, (_, index) => ({
  id: `q${index}`, skillId: `skill${index % 8}`, domainId: domains[index % 8], level: 1,
  choices: ["yes", "no"], answer: "yes", answerMode: "exact", requiredAudioPaths: ["/cue.mp3"],
  itemSnapshot: { id: `q${index}`, prompt: "Which one?", skillId: `skill${index % 8}`, domainId: domains[index % 8], level: 1, choices: ["yes", "no"] }
}));
const plan = { itemIds: items.map(item => item.id), seed: "synthetic-seed" };
const answer = (index, overrides = {}) => ({ questionId: `q${index}`, selected: "yes", responseStatus: "answered",
  supportUsed: false, knownFamiliar: null, audioDelivery: { "/cue.mp3": "completed" }, ...overrides });

async function fixture({ upgrade = true } = {}) {
  const db = await PGlite.create();
  await db.exec(`
    create schema auth; create role anon; create role authenticated;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('fixture.actor',true),'')::uuid$$;
    create function public.assert_current_actor_teacher_access() returns void language plpgsql as $$begin if auth.uid() is null then raise exception 'Teacher required'; end if; end$$;
    create table public.classes(id uuid primary key,teacher_id uuid);
    insert into classes values('${classId}','${teacher}'),('${foreignClass}','${other}');
    create table public.students(id uuid primary key,class_id uuid references classes(id),teacher_id uuid,name text,archived_at timestamptz);
    insert into students values('${studentId}','${classId}','${teacher}','Synthetic learner',null),('${secondStudent}','${classId}','${teacher}','Second learner',null),('${foreignStudent}','${foreignClass}','${other}','Foreign learner',null);
    create function public.student_from_token(token text) returns public.students language sql stable as $$select s.* from public.students s where s.id=case when token='synthetic-token' then '${studentId}'::uuid when token='foreign-token' then '${foreignStudent}'::uuid else null end and archived_at is null$$;
    create table public.student_focus_sessions(id uuid primary key default gen_random_uuid(),teacher_id uuid,class_id uuid,target text,content_version text,selection_scope text,status text default 'active',started_at timestamptz default now(),expires_at timestamptz,updated_at timestamptz default now(),ended_at timestamptz,end_action text default 'return_home');
    create table public.student_focus_session_members(session_id uuid references student_focus_sessions(id),student_id uuid references students(id) on delete cascade,resolved_config jsonb,status text default 'assigned',active boolean default true,content_ok boolean default false,completed_at timestamptz,updated_at timestamptz,current_view text,last_seen_at timestamptz,primary key(session_id,student_id));
    create table public.reading_sessions(student_ids uuid[],status text,updated_at timestamptz,ended_at timestamptz);
    create table public.student_progress(student_id uuid,area text,key text,payload jsonb);
    create table public.app_error_events(expires_at timestamptz);
    create function public.is_app_admin(actor uuid) returns boolean language sql stable as $$select actor='${teacher}'::uuid$$;
    create function public.retention_last_learner_activity(uuid) returns timestamptz language sql stable as $$select '2020-01-01'::timestamptz$$;
    create function public.teacher_export_learner_data(p_student_id uuid,p_requester_role text,p_verification_method text) returns jsonb language plpgsql as $$begin
      if not exists(select 1 from public.students where id=p_student_id and teacher_id=auth.uid()) then raise exception 'forbidden'; end if;
      return jsonb_build_object('learner',jsonb_build_object('id',p_student_id)); end$$;
    create table public.progress_test_banks(version text);
    insert into progress_test_banks values('legacy-bank');
    create table public.student_focus_cycle_practice_attempts(id uuid,session_id uuid,student_id uuid,teacher_id uuid,attempt_id text,cycle_id text,created_at timestamptz,completed_at timestamptz,payload jsonb,total_questions integer,scored_questions integer,correct_count integer,supported_count integer,media_failed_count integer,practice_seconds integer,session_elapsed_seconds integer,check_seconds integer,evidence_verified boolean);
  `);
  await db.exec(functionFrom("20260828120000_student_focus_sessions.sql", "end_expired_student_focus_sessions"));
  await db.exec(read("20261005093000_literacy_practice_assignments.sql"));
  await db.exec(functionFrom("20261002170000_adaptive_progress_checks.sql", "teacher_start_progress_check_session"));
  await db.exec(functionFrom("20261002180000_learning_response_evidence.sql", "teacher_get_student_focus_session"));
  await db.exec(functionFrom("20260922160000_skills_assessment_runtime_validity.sql", "student_get_focus_session"));
  await db.exec(functionFrom("20260828120000_student_focus_sessions.sql", "student_complete_focus_session"));
  await db.exec(functionFrom("20260831233417_extend_student_focus_sessions_adventure_map.sql", "teacher_end_student_focus_session"));
  // Optional release preflight: exercise exact read-only hosted definitions in
  // this isolated database before applying the local forward migrations.
  if (process.env.LP_MOCK_HOSTED_DEPENDENCIES) {
    const definitions = JSON.parse(readFileSync(process.env.LP_MOCK_HOSTED_DEPENDENCIES, "utf8"));
    const allowed = new Set(["admin_purge_expired_error_events", "end_expired_student_focus_sessions", "lp_progress_config_valid",
      "student_complete_focus_session", "student_get_focus_session", "teacher_get_student_focus_session", "teacher_start_progress_check_session"]);
    for (const row of definitions) {
      assert.ok(allowed.has(row.name));
      assert.match(row.definition, /^CREATE OR REPLACE FUNCTION public\./);
      await db.exec(row.definition);
    }
  }
  await db.exec(read("20261006090000_literacy_mock_sessions.sql"));
  await db.exec(read("20261006091000_literacy_mock_evidence.sql"));
  await db.exec(read("20261006093000_literacy_mock_history_retention.sql"));
  if (upgrade) await db.exec(read("20261010120000_literacy_mock_evidence_v2.sql"));
  await db.exec(`set fixture.actor='${teacher}';`);
  for (const item of items) await db.query("insert into literacy_mock_items values($1,'literacy-mock-v1',$2)", [item.id, item]);
  const extension = { ...items[8], id: "extension", level: 2, itemSnapshot: { ...items[8].itemSnapshot, id: "extension", level: 2 } };
  await db.query("insert into literacy_mock_items values($1,'literacy-mock-v1',$2)", [extension.id, extension]);
  const tutorial = { ...extension, id: "tutorial", itemSnapshot: { ...extension.itemSnapshot, id: "tutorial", tutorialOnly: true, stimulusKey: "tutorial-stimulus" } };
  await db.query("insert into literacy_mock_items values($1,'literacy-mock-v1',$2)", [tutorial.id, tutorial]);
  const tutorialAlias = { ...tutorial, id: "tutorial-alias", itemSnapshot: { ...tutorial.itemSnapshot, id: "tutorial-alias", tutorialOnly: false } };
  await db.query("insert into literacy_mock_items values($1,'literacy-mock-v1',$2)", [tutorialAlias.id, tutorialAlias]);
  return db;
}
export { teacher, other, classId, foreignClass, studentId, secondStudent, foreignStudent, read, functionFrom, query, domains, items, plan, answer, fixture };
