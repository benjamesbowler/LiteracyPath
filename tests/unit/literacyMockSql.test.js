import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { loadLiteracyMockBank, scoreLiteracyMockResponse } from "../../src/data/literacyMockBank.js";
import { selectLiteracyMockPlan } from "../../src/utils/literacyMockPlanner.js";

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
const prepare = (db, options = {}) => query(db, "select teacher_prepare_literacy_mock_session($1,$2,$3,$4,$5,$6) value", [options.classId || classId, options.studentIds || [], options.wholeClass ?? true, options.minutes ?? 20, options.count ?? 24, options.requestId || null]);
const control = (db, id, action, revision, requestId = `${action}-${revision}`) => query(db, "select teacher_control_literacy_mock_session($1,$2,$3,$4) value", [id, action, revision, requestId]);
const save = (db, id, requestId, revision, nextPlan = null, response = null, token = "synthetic-token") => query(db, "select student_save_literacy_mock_run($1,$2,$3,$4,$5,$6) value", [token, id, requestId, revision, nextPlan, response]);

test("mock SQL owns classroom windows and immutable token-scoped evidence", async t => {
  const db = await fixture();
  try {
    await t.test("private tables/helpers and public RPC grants fail closed", async () => {
      for (const table of ["literacy_mock_sessions", "literacy_mock_controls", "literacy_mock_preparations", "literacy_mock_runs", "literacy_mock_items", "literacy_mock_run_requests"]) {
        assert.equal(await query(db, "select has_table_privilege('authenticated',$1,'select') value", [`public.${table}`]), false);
        assert.equal(await query(db, "select relrowsecurity value from pg_class where relname=$1", [table]), true);
      }
      for (const fn of ["lp_literacy_mock_state(uuid)", "lp_literacy_mock_run_json(uuid,uuid)", "lp_literacy_mock_media_paths(jsonb)",
        "lp_literacy_mock_item_blocked(jsonb,jsonb)", "student_get_focus_session_before_mock(text,text,boolean)", "teacher_get_student_focus_session_before_mock(uuid)"]) {
        assert.equal(await query(db, "select has_function_privilege('anon',$1,'execute') value", [`public.${fn}`]), false);
        assert.equal(await query(db, "select has_function_privilege('authenticated',$1,'execute') value", [`public.${fn}`]), false);
      }
      assert.equal(await query(db, "select has_function_privilege('anon','public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb)','execute') value"), true);
      assert.equal(await query(db, "select has_function_privilege('anon','public.teacher_control_literacy_mock_session(uuid,text,integer,text)','execute') value"), false);
      await assert.rejects(db.query("update literacy_mock_items set item=jsonb_set(item,'{answer}','\"forged\"') where id='q0'"), /immutable/);
    });
    await t.test("SQL grading matches canonical runtime answer modes across the complete authored bank", async () => {
      const bank = await loadLiteracyMockBank({ includeUnavailable: true });
      const cases = bank.flatMap(item => {
        const selected = item.answerMode === "set" ? [...item.answer].reverse() : item.answer;
        const wrong = Array.isArray(item.answer) ? [...item.answer, "wrong-token"] : "wrong-token";
        return [selected, wrong].map(value => ({ itemId: item.id, mode: item.answerMode, answer: item.answer, selected: value, expected: scoreLiteracyMockResponse(item, value) }));
      });
      const mismatches = await query(db, `select coalesce(jsonb_agg(c->>'itemId'),'[]'::jsonb) value
        from jsonb_array_elements($1::jsonb) c where (public.lp_literacy_mock_normalize_answer(c->'selected',c->>'mode')
          =public.lp_literacy_mock_normalize_answer(c->'answer',c->>'mode')) is distinct from (c->>'expected')::boolean`, [cases]);
      assert.deepEqual(mismatches, []);
      assert.deepEqual([...new Set(cases.map(row => row.mode))].sort(), ["exact", "sequence", "set"]);
    });
    await t.test("whole class derives active roster, rejects foreign pupils and leaves prior assignment intact", async () => {
      assert.equal((await prepare(db, { classId: foreignClass })).error, "class_not_found");
      assert.equal((await prepare(db, { studentIds: [foreignStudent], wholeClass: false })).error, "student_not_in_class");
      assert.equal((await prepare(db, { studentIds: [studentId], wholeClass: true })).error, "whole_class_ids_must_be_empty");
      for (const options of [{ count: 32 }, { count: null }, { minutes: 120 }]) {
        if (options.count === null) continue;
        assert.equal((await prepare(db, options)).ok, false);
      }
    });
    const prepared = await prepare(db, { requestId: "prepare-once" });
    assert.equal(prepared.ok, true);
    const id = prepared.session.id;
    assert.equal(prepared.members.length, 2);
    assert.equal(prepared.session.mock.state, "prepared");
    assert.equal(prepared.session.mock.remaining_seconds, 1200);
    await t.test("an uncertain prepare response retries the same session and rejects changed options", async () => {
      const retried = await prepare(db, { requestId: "prepare-once" });
      assert.equal(retried.duplicate, true); assert.equal(retried.session.id, id);
      assert.equal((await prepare(db, { requestId: "prepare-once", minutes: 30 })).error, "request_conflict");
      assert.equal(await query(db, "select count(*)::integer value from student_focus_sessions where status='active'"), 1);
    });
    await t.test("null payloads, unknown protocol and changed assignment owner are rejected", async () => {
      assert.equal((await query(db, "select teacher_prepare_literacy_mock_session($1,'{}',true,null,24,null) value", [classId])).error, "invalid_mock_options");
      assert.equal((await save(db, id, "empty", 0)).error, "invalid_payload");
      assert.equal((await save(db, id, "null-revision", null, plan)).error, "invalid_payload");
      await db.query("update student_focus_sessions set content_version='unknown-version' where id=$1", [id]);
      assert.equal((await save(db, id, "wrong-version", 0, plan)).error, "assignment_not_found");
      await db.query("update student_focus_sessions set content_version='literacy-mock-v1' where id=$1", [id]);
      await db.query("update students set class_id=$1,teacher_id=$2 where id=$3", [foreignClass, other, studentId]);
      assert.equal((await save(db, id, "moved-pupil", 0, plan)).error, "assignment_not_found");
      await db.query("update students set class_id=$1,teacher_id=$2 where id=$3", [classId, teacher, studentId]);
    });
    await t.test("plan persists before start and no answer can precede teacher start", async () => {
      assert.equal((await save(db, id, "bad-token", 0, plan, null, "wrong-token")).error, "invalid_session");
      assert.equal((await save(db, id, "foreign", 0, plan, null, "foreign-token")).error, "assignment_not_found");
      assert.equal((await save(db, id, "unknown", 0, { ...plan, itemIds: ["missing", ...plan.itemIds.slice(1)] })).error, "unknown_item");
      assert.equal((await save(db, id, "tutorial-initial", 0, { ...plan, itemIds: ["tutorial", ...plan.itemIds.slice(1)] })).error, "tutorial_item_not_scored");
      assert.equal((await save(db, id, "tutorial-alias", 0, { ...plan, itemIds: ["tutorial-alias", ...plan.itemIds.slice(1)] })).error, "tutorial_item_not_scored");
      const result = await save(db, id, "plan", 0, plan);
      assert.equal(result.ok, true); assert.equal(result.run.revision, 1); assert.equal(result.run.status, "ready");
      assert.deepEqual(result.run.plan, plan);
      assert.equal((await save(db, id, "before-start", 1, null, answer(0))).error, "assessment_not_running");
      const focus = await query(db, "select student_get_focus_session('synthetic-token','progress_check',true) value");
      assert.equal(focus.session.mock.state, "prepared");
      assert.equal((await query(db, "select student_complete_focus_session('synthetic-token',$1) value", [id])).ok, false);
    });
    await t.test("teacher commands are revision guarded and replay safely without double added time", async () => {
      const started = await control(db, id, "start", 0);
      assert.equal(started.session.mock.state, "running"); assert.equal(started.session.mock.revision, 1);
      assert.equal((await control(db, id, "pause", 0)).error, "stale_revision");
      const duplicate = await control(db, id, "start", 0);
      assert.equal(duplicate.duplicate, true); assert.equal(duplicate.session.mock.revision, 1);
      assert.equal((await control(db, id, "pause", 0, "start-0")).error, "request_conflict");
      const added = await control(db, id, "add_time", 1);
      assert.equal(added.session.mock.revision, 2);
      const retry = await control(db, id, "add_time", 1);
      assert.equal(retry.duplicate, true); assert.equal(retry.session.mock.revision, 2);
      assert.ok(retry.session.mock.remaining_seconds <= 1500);
    });
    await t.test("server grades a canonical item and requires all exact audio receipts", async () => {
      assert.equal((await save(db, id, "no-audio", 1, null, answer(0, { audioDelivery: {} }))).error, "audio_not_delivered");
      assert.equal((await save(db, id, "forged-score", 1, null, { ...answer(0), isCorrect: true })).error, "invalid_response");
      assert.equal((await save(db, id, "wrong-question", 1, null, answer(1))).error, "invalid_response");
      const result = await save(db, id, "answer-0", 1, null, answer(0));
      assert.equal(result.ok, true); assert.equal(result.run.responses[0].isCorrect, true);
      assert.deepEqual(result.run.responses[0].itemSnapshot, items[0].itemSnapshot);
      assert.equal(result.run.responses[0].knownFamiliar, null);
      assert.equal(result.run.responses[0].evidenceType, "independent");
      assert.equal(result.run.revision, 2);
      assert.equal((await save(db, id, "answer-0", 1, null, answer(0))).duplicate, true);
      assert.equal((await save(db, id, "answer-0", 1, null, answer(0, { selected: "no" }))).error, "request_conflict");
      assert.equal((await save(db, id, "stale-answer", 1, null, answer(1))).error, "stale_revision");
    });
    await t.test("adaptive suffix preserves answered history and skill placement", async () => {
      const changed = { ...plan, itemIds: [...plan.itemIds] }; changed.itemIds[8] = "extension";
      const tutorialPlan = { ...plan, itemIds: [...plan.itemIds] }; tutorialPlan.itemIds[8] = "tutorial";
      assert.equal((await save(db, id, "tutorial-adapt", 2, tutorialPlan)).error, "tutorial_item_not_scored");
      assert.equal((await save(db, id, "adapt", 2, changed)).ok, true);
      const bad = { ...changed, itemIds: [...changed.itemIds] }; [bad.itemIds[0], bad.itemIds[1]] = [bad.itemIds[1], bad.itemIds[0]];
      assert.equal((await save(db, id, "rewrite", 3, bad)).error, "plan_conflict");
      const acrossSkill = { ...changed, itemIds: [...changed.itemIds] }; [acrossSkill.itemIds[2], acrossSkill.itemIds[3]] = [acrossSkill.itemIds[3], acrossSkill.itemIds[2]];
      assert.equal((await save(db, id, "across-skill", 3, acrossSkill)).error, "plan_conflict");
      const record = await query(db, "select student_get_literacy_mock_run('synthetic-token',$1) value", [id]);
      assert.deepEqual(record.run.planHistory[0].previousPlan, plan);
      await assert.rejects(db.query("update literacy_mock_runs set responses=jsonb_set(responses,'{0,isCorrect}','false') where session_id=$1", [id]), /immutable/);
    });
    await t.test("pause stops acceptance, resume preserves remaining window and support stays distinct", async () => {
      assert.equal((await control(db, id, "pause", 2)).session.mock.state, "paused");
      assert.equal((await save(db, id, "paused-answer", 3, null, answer(1))).error, "assessment_not_running");
      assert.equal((await control(db, id, "resume", 3)).session.mock.state, "running");
      const result = await save(db, id, "supported-answer", 3, null, answer(1, { supportUsed: true }));
      assert.equal(result.run.responses[1].evidenceType, "supported");
      const failed = await save(db, id, "media-failed", 4, null, answer(2, { selected: null, responseStatus: "media_failed", audioDelivery: { "/cue.mp3": "failed" }, failedMediaPaths: ["/cue.mp3"] }));
      assert.equal(failed.run.responses.length, 2); assert.equal(failed.run.mediaFailures[0].isCorrect, null);
      assert.equal(failed.run.mediaFailures[0].evidenceType, "unscored");
    });
    await t.test("expiry is server authoritative, keeps focus lock, and retains unsampled questions", async () => {
      await db.query("update literacy_mock_sessions set deadline_at=clock_timestamp()-interval '1 second' where session_id=$1", [id]);
      const result = await save(db, id, "late-answer", 5, null, answer(3));
      assert.equal(result.error, "assessment_finished"); assert.equal(result.mock.state, "completed");
      const current = await query(db, "select student_get_literacy_mock_run('synthetic-token',$1) value", [id]);
      assert.equal(current.run.responses.length, 2); assert.equal(current.run.unsampledItemIds.length, 22);
      assert.equal(current.run.mediaFailures.length, 1);
      assert.equal(current.run.status, "completed");
      const focus = await query(db, "select student_get_focus_session('synthetic-token','progress_check',true) value");
      assert.equal(focus.session.id, id); assert.equal(focus.session.mock.state, "completed");
      assert.equal((await save(db, id, "answer-0", 1, null, answer(0))).duplicate, true);
      assert.equal((await control(db, id, "resume", 5)).ok, false);
    });
    await t.test("reports/history require original teacher and persist after explicit close", async () => {
      await db.exec(`set fixture.actor='${other}';`);
      assert.equal((await control(db, id, "finish", 5)).error, "session_not_found");
      assert.equal((await query(db, "select teacher_get_literacy_mock_report($1) value", [id])).error, "session_not_found");
      assert.equal((await query(db, "select teacher_list_literacy_mock_sessions($1) value", [classId])).error, "class_not_found");
      await db.exec(`set fixture.actor='${teacher}';`);
      await query(db, "select teacher_end_student_focus_session($1,'return_home') value", [id]);
      assert.equal((await query(db, "select student_get_focus_session('synthetic-token','progress_check',true) value")).session, null);
      const report = await query(db, "select teacher_get_literacy_mock_report($1) value", [id]);
      assert.equal(report.ok, true); assert.equal(report.session.status, "ended");
      assert.equal(report.members.find(row => row.student_id === studentId).run.responses.length, 2);
      assert.equal(report.members.find(row => row.student_id === secondStudent).run, null);
      assert.equal((await query(db, "select teacher_list_literacy_mock_sessions($1) value", [classId])).sessions.length, 1);
    });
    await t.test("legacy practice and independent config remain accepted, unknown versions rejected", async () => {
      for (const [kind, track, version] of [["practice", "reading", "literacy-practice-v1"], ["focused", "printed_words", "legacy-bank"], ["mock", "all", "literacy-mock-v1"]]) {
        assert.equal(await query(db, "select lp_progress_config_valid($1,$2) value", [{ plan_kind: kind, track_id: track, bank_version: version }, version]), true);
      }
      assert.equal(await query(db, "select lp_progress_config_valid($1,$2) value", [{ plan_kind: "mock", track_id: "reading", bank_version: "literacy-mock-v1" }, "literacy-mock-v1"]), false);
      assert.equal(await query(db, "select lp_progress_config_valid(null,null) value"), false);
    });
    await t.test("mock evidence survives operational cleanup, contributes activity, and exports only this learner", async () => {
      await db.query("update student_focus_sessions set ended_at=now()-interval '40 days' where id=$1", [id]);
      await db.query("insert into student_focus_sessions(teacher_id,class_id,target,status,ended_at,expires_at) values($1,$2,'letters','ended',now()-interval '40 days',now()-interval '40 days')", [teacher, classId]);
      assert.equal(await query(db, "select admin_purge_expired_error_events()::integer value"), 1);
      const report = await query(db, "select teacher_get_literacy_mock_report($1) value", [id]);
      assert.equal(report.members.find(row => row.student_id === studentId).run.responses.length, 2);
      assert.equal(report.members.find(row => row.student_id === studentId).run.mediaFailures.length, 1);
      assert.ok(Date.parse(await query(db, "select retention_last_learner_activity($1) value", [studentId])) > Date.parse("2020-01-01"));
      const exported = await query(db, "select teacher_export_learner_data($1,'school','school-record') value", [studentId]);
      assert.equal(exported.literacyMockAssessments.length, 1);
      assert.equal(exported.literacyMockAssessments[0].run.responses.length, 2);
      assert.equal(exported.literacyMockAssessments[0].run.mediaFailures.length, 1);
      assert.equal(JSON.stringify(exported).includes(secondStudent), false);
      assert.equal(JSON.stringify(exported).includes("synthetic-token"), false);
      await db.exec(`set fixture.actor='${other}';`);
      await assert.rejects(query(db, "select teacher_export_learner_data($1,'school','school-record') value", [studentId]), /forbidden/);
      await db.exec(`set fixture.actor='${teacher}';`);
    });
    await t.test("two queued commands sharing a revision apply exactly once", async () => {
      const selected = await prepare(db, { wholeClass: false, studentIds: [studentId], requestId: "selected" });
      assert.equal(selected.members.length, 1);
      const results = await Promise.all([control(db, selected.session.id, "start", 0, "race-a"), control(db, selected.session.id, "start", 0, "race-b")]);
      assert.equal(results.filter(result => result.ok).length, 1);
      assert.equal(results.filter(result => result.error === "stale_revision").length, 1);
      const finished = await control(db, selected.session.id, "finish", 1);
      assert.equal(finished.session.mock.state, "completed");
      assert.equal(finished.session.status, "active");
      assert.equal((await save(db, selected.session.id, "after-teacher-finish", 0, plan)).error, "assessment_finished");
    });
    await t.test("learner deletion cascades all own mock answers and retry payloads", async () => {
      await db.query("delete from students where id=$1", [studentId]);
      assert.equal(await query(db, "select count(*)::integer value from literacy_mock_runs where student_id=$1", [studentId]), 0);
      assert.equal(await query(db, "select count(*)::integer value from literacy_mock_run_requests where student_id=$1", [studentId]), 0);
      assert.equal(await query(db, "select count(*)::integer value from student_focus_session_members where student_id=$1", [studentId]), 0);
      const report = await query(db, "select teacher_get_literacy_mock_report($1) value", [id]);
      assert.equal(JSON.stringify(report).includes(studentId), false);
      assert.equal(report.members.length, 1);
    });
  } finally { await db.close(); }
});

test("complete canonical migration executes atomically, replays unchanged, and serves both scored forms", async () => {
  const db = await fixture({ upgrade: false });
  try {
    await db.exec("delete from literacy_mock_items");
    const manifestSql = read("20261006092000_literacy_mock_items.sql");
    await db.exec(manifestSql);
    const bank = await loadLiteracyMockBank({ contentVersion: "literacy-mock-v1" });
    assert.equal(await query(db, "select count(*)::integer value from literacy_mock_items"), bank.length);
    assert.equal(await query(db, "select count(*)::integer value from literacy_mock_items where item#>>'{itemSnapshot,tutorialOnly}'='true'"), 5);
    await db.exec(manifestSql);
    assert.equal(await query(db, "select count(*)::integer value from literacy_mock_items"), bank.length);
    for (const count of [24, 43]) {
      const prepared = await prepare(db, { count });
      assert.equal(prepared.ok, true);
      const sessionId = prepared.session.id;
      const selected = selectLiteracyMockPlan(bank, { sessionId, studentId, itemCount: count });
      const result = await save(db, sessionId, `full-manifest-${count}`, 0, selected);
      assert.equal(result.ok, true);
      assert.equal(result.run.plan.itemIds.length, count);
      assert.equal(new Set(result.run.plan.itemIds.map(id => bank.find(item => item.id === id).domainId)).size, 8);
    }
  } finally { await db.close(); }
});

test("failed media never consumes a slot and every shared source must be replaced before answering", async () => {
  const db = await fixture();
  try {
    await db.exec("delete from literacy_mock_items");
    const bank = items.map((item, index) => ({ ...item, itemSnapshot: { ...item.itemSnapshot,
      requiredImagePaths: index < 2 ? [`/atlas.webp#mock-cell=${index}`] : [] } }));
    const replacement = index => ({ ...bank[index], id: `replacement${index}`,
      itemSnapshot: { ...bank[index].itemSnapshot, id: `replacement${index}`, requiredImagePaths: [`/safe${index}.webp`] } });
    const tooHard = { ...replacement(0), id: "too-hard", level: 2 };
    for (const item of [...bank, replacement(0), replacement(1), tooHard]) {
      await db.query("insert into literacy_mock_items values($1,'literacy-mock-v1',$2)", [item.id, item]);
    }
    const { session } = await prepare(db);
    const id = session.id;
    const registered = await save(db, id, "register-media", 0, plan);
    await control(db, id, "start", 0);
    const failure = answer(0, { selected: null, responseStatus: "media_failed", failedMediaPaths: ["/atlas.webp"] });
    for (const failedMediaPaths of [undefined, [], ["/unrelated.webp"]]) {
      assert.equal((await save(db, id, `bad-media-${String(failedMediaPaths)}`, 1, null, { ...failure, failedMediaPaths })).error, "invalid_media_failure");
    }
    const failed = await save(db, id, "image-failure", 1, null, failure);
    assert.equal(failed.ok, true);
    assert.equal(failed.run.revision, 2);
    assert.equal(failed.run.responses.length, 0);
    assert.equal(failed.run.unsampledItemIds.length, 24);
    assert.equal(failed.run.status, registered.run.status);
    assert.equal(failed.run.completedAt, null);
    assert.deepEqual(failed.run.mediaFailures[0].failedMediaPaths, ["/atlas.webp#mock-cell=0"]);
    assert.deepEqual(failed.run.mediaFailures[0].itemSnapshot, bank[0].itemSnapshot);
    assert.equal(failed.run.mediaFailures[0].isCorrect, null);
    assert.equal((await save(db, id, "image-failure", 1, null, failure)).duplicate, true);
    assert.equal((await save(db, id, "bad-replay", 1, null, failure)).error, "stale_revision");
    assert.equal((await save(db, id, "answer-broken", 2, null, answer(0))).error, "blocked_media_item");
    assert.ok(Date.parse(await query(db, "select retention_last_learner_activity($1) value", [studentId])) > Date.parse("2020-01-01"));
    const partial = { ...plan, itemIds: ["replacement0", ...plan.itemIds.slice(1)] };
    assert.equal((await save(db, id, "partial-refill", 2, partial)).error, "blocked_media_item");
    const repaired = { ...plan, itemIds: ["replacement0", "replacement1", ...plan.itemIds.slice(2)] };
    assert.equal((await save(db, id, "harder-refill", 2, { ...repaired, itemIds: ["too-hard", ...repaired.itemIds.slice(1)] })).error, "invalid_adaptation");
    const repair = await save(db, id, "safe-refill", 2, repaired);
    assert.equal(repair.ok, true);
    assert.equal(repair.run.responses.length, 0);
    assert.equal(repair.run.planHistory[0].afterResponses, 0);
    assert.deepEqual(repair.run.mediaFailures, failed.run.mediaFailures);
    const accepted = await save(db, id, "answer-replacement", 3, null, { ...answer(0), questionId: "replacement0" });
    assert.equal(accepted.run.responses.length, 1);
    assert.equal(accepted.run.responses[0].isCorrect, true);
    await assert.rejects(db.query("update literacy_mock_runs set media_failures='[]' where session_id=$1", [id]), /immutable/);
    await control(db, id, "pause", 1);
    const audioFailure = { ...answer(1), questionId: "replacement1", selected: null, responseStatus: "media_failed",
      audioDelivery: { "/cue.mp3": "failed" }, failedMediaPaths: ["/cue.mp3"] };
    assert.equal((await save(db, id, "paused-media", 4, null, audioFailure)).error, "assessment_not_running");
    await control(db, id, "resume", 2);
    const audioFailed = await save(db, id, "audio-failure", 4, null, audioFailure);
    assert.equal(audioFailed.run.responses.length, 1);
    assert.equal(audioFailed.run.mediaFailures.length, 2);
    assert.equal((await save(db, id, "reuse-shared-audio", 5, repaired)).error, "blocked_media_item");
    await control(db, id, "finish", 3);
    const failureRetry = await save(db, id, "audio-failure", 4, null, audioFailure);
    assert.equal(failureRetry.duplicate, true); assert.equal(failureRetry.run.mediaFailures.length, 2);
    await query(db, "select teacher_end_student_focus_session($1,'return_home') value", [id]);
    await db.query("update student_focus_sessions set ended_at=now()-interval '40 days' where id=$1", [id]);
    assert.equal(await query(db, "select admin_purge_expired_error_events()::integer value"), 0);
    const report = await query(db, "select teacher_get_literacy_mock_report($1) value", [id]);
    const run = report.members.find(member => member.student_id === studentId).run;
    assert.equal(run.responses.length, 1); assert.equal(run.unsampledItemIds.length, 23);
    assert.equal(run.mediaFailures.length, 2);
    const exported = await query(db, "select teacher_export_learner_data($1,'school','school-record') value", [studentId]);
    assert.equal(exported.literacyMockAssessments[0].run.mediaFailures.length, 2);
    await assert.rejects(db.query("update literacy_mock_runs set media_failures=media_failures||media_failures where session_id=$1", [id]), /immutable/);
  } finally { await db.close(); }
});

test("cross-device public practice exposure wins over client freshness and cannot drive adaptation", async () => {
  const db = await fixture();
  try {
    const prior = { v: 3, completions: [{ gameId: "literacy-practice", steps: [{ questionId: "q0", responseStatus: "answered", isCorrect: true }] }] };
    await db.query("insert into student_progress values($1,'practice','literacy-practice',$2)", [studentId, prior]);
    const { session } = await prepare(db);
    await save(db, session.id, "exposure-plan", 0, plan);
    await control(db, session.id, "start", 0);
    const saved = await save(db, session.id, "familiar-answer", 1, null, answer(0, { knownFamiliar: false }));
    assert.equal(saved.ok, true);
    assert.equal(saved.run.responses[0].knownFamiliar, true);
    assert.deepEqual(saved.run.responses[0].familiarityReasons, ["item"]);
    const harder = { ...plan, itemIds: plan.itemIds.map((id, index) => index === 8 ? "extension" : id) };
    assert.equal((await save(db, session.id, "familiar-adaptation", 2, harder)).error, "invalid_adaptation");
    const readBack = await query(db, "select student_get_literacy_mock_run('synthetic-token',$1) value", [session.id]);
    assert.ok(readBack.exposures.some(value => value.exposureItemId === "q0"));
    assert.equal((await query(db, "select student_get_literacy_mock_run('foreign-token',$1) value", [session.id])).error, "assignment_not_found");
    assert.equal(await query(db, "select has_function_privilege('anon','public.lp_literacy_exposures(uuid)','execute') value"), false);
    const passageItem = { id: "different", itemSnapshot: { passage: "Mina's bag is red.", exposureFamilyId: "original-family" } };
    const passagePrior = { completions: [{ gameId: "literacy-practice", steps: [{ questionId: "public-alias", itemSnapshot: { passage: "Mina’s   bag is red.", exposureFamilyId: "original-family" } }] }] };
    await db.query("insert into student_progress values($1,'practice','more',$2)", [studentId, passagePrior]);
    assert.deepEqual(await query(db, "select lp_literacy_familiarity($1,$2) value", [studentId, passageItem]), ["family", "passage"]);
  } finally { await db.close(); }
});

test("v2 publication keeps v1 snapshots immutable and session version chooses canonical scoring", async () => {
  const db = await fixture();
  try {
    const old = await prepare(db); const oldId = old.session.id;
    assert.equal(old.session.mock.content_version, "literacy-mock-v1");
    await save(db, oldId, "old-plan", 0, plan); await control(db, oldId, "start", 0);
    const oldAnswer = await save(db, oldId, "old-answer", 1, null, answer(0));
    await control(db, oldId, "finish", 1);
    await db.exec(`insert into literacy_mock_items(id,content_version,item) select id,'literacy-mock-v2',
      jsonb_set(jsonb_set(item,'{answer}','"no"'),'{itemSnapshot,prompt}','"Revised question"') from literacy_mock_items where content_version='literacy-mock-v1'`);
    const beforePublication = await prepare(db);
    assert.equal(beforePublication.session.mock.content_version, "literacy-mock-v1");
    await control(db, beforePublication.session.id, "finish", 0);
    await db.exec("insert into literacy_mock_publications(content_version,item_count) select 'literacy-mock-v2',count(*) from literacy_mock_items where content_version='literacy-mock-v2'");
    const current = await prepare(db); const currentId = current.session.id;
    assert.equal(current.session.mock.content_version, "literacy-mock-v2");
    await save(db, currentId, "new-plan", 0, plan); await control(db, currentId, "start", 0);
    const newAnswer = await save(db, currentId, "new-answer", 1, null, answer(0));
    assert.equal(newAnswer.run.contentVersion, "literacy-mock-v2");
    assert.equal(newAnswer.run.responses[0].isCorrect, false);
    assert.equal(newAnswer.run.responses[0].itemSnapshot.prompt, "Revised question");
    assert.equal(newAnswer.run.responses[0].knownFamiliar, true);
    const oldRead = await query(db, "select lp_literacy_mock_run_json($1,$2) value", [oldId, studentId]);
    assert.equal(oldRead.contentVersion, "literacy-mock-v1");
    assert.deepEqual(oldRead.responses, oldAnswer.run.responses);
    await control(db, currentId, "finish", 1);
    await db.exec("update literacy_mock_publications set available_for_new_sessions=false where content_version='literacy-mock-v2'");
    assert.equal((await prepare(db)).session.mock.content_version, "literacy-mock-v1");
    const retainedV2 = await query(db, "select lp_literacy_mock_run_json($1,$2) value", [currentId, studentId]);
    assert.equal(retainedV2.contentVersion, "literacy-mock-v2");
    assert.deepEqual(retainedV2.responses, newAnswer.run.responses);
    await assert.rejects(db.exec("update literacy_mock_items set item='{}' where content_version='literacy-mock-v1'"), /immutable/);
  } finally { await db.close(); }
});

test("the exact v2 manifest publishes atomically, replays unchanged, and refuses changed snapshots", async () => {
  const db = await fixture({ upgrade: false });
  try {
    await db.exec("delete from literacy_mock_items");
    await db.exec(read("20261006092000_literacy_mock_items.sql"));
    await db.exec(read("20261010120000_literacy_mock_evidence_v2.sql"));
    const manifest = read("20261010121000_literacy_mock_items_v2.sql");
    await db.exec(manifest);
    const bank = await loadLiteracyMockBank({ includeUnavailable: true, contentVersion: "literacy-mock-v2" });
    assert.equal(await query(db, "select count(*)::integer value from literacy_mock_items where content_version='literacy-mock-v1'"), 3958);
    assert.equal(await query(db, "select item_count value from literacy_mock_publications where content_version='literacy-mock-v2'"), bank.length);
    await db.exec(manifest);
    const prepared = await prepare(db);
    assert.equal(prepared.session.mock.content_version, "literacy-mock-v2");
    const planned = selectLiteracyMockPlan(bank, { sessionId: prepared.session.id, studentId, itemCount: 24 });
    const registered = await save(db, prepared.session.id, "actual-v2-plan", 0, planned);
    assert.equal(registered.ok, true);
    assert.equal(registered.run.contentVersion, "literacy-mock-v2");
    const changed = manifest.replace('"prompt":', '"prompt":"tampered","_originalPrompt":');
    await assert.rejects(db.exec(changed), /Published mock content is immutable/);
    await db.exec("rollback");
    assert.equal(await query(db, "select count(*)::integer value from literacy_mock_items where content_version='literacy-mock-v2'"), bank.length);
  } finally { await db.close(); }
});
