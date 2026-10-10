import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { loadLiteracyMockBank, scoreLiteracyMockResponse } from "../../src/data/literacyMockBank.js";
import { selectLiteracyMockPlan, selectLiteracyMockFreshCheck } from "../../src/utils/literacyMockPlanner.js";
import { literacyMockFocus } from "../../src/utils/literacyMockConditions.js";
import { canonicalLiteracyIdentity } from "../../src/utils/literacyEvidence.js";
import { createLiteracyMockManifest, literacyMockManifestSql } from "../../tools/generateLiteracyMockManifest.mjs";

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

test('v3 preserves old contracts and records resumable, offered and assisted evidence', async t => {
  const db = await fixture();
  const event = (id, questionId, kind, requestId, token = 'synthetic-token') => query(db,
    'select student_record_literacy_mock_event($1,$2,$3,$4,$5) value', [token, id, questionId, kind, requestId]);
  const support = (id, questionId, assistance, requestId) => query(db,
    'select teacher_resolve_literacy_mock_support($1,$2,$3,$4,$5) value', [id, studentId, questionId, assistance, requestId]);
  const prepareV3 = (options = {}) => query(db, 'select teacher_prepare_literacy_mock_session_v3($1,$2,$3,$4,$5,$6,$7) value',
    [classId, [studentId], false, 20, 24, options.requestId || null, options.mode || 'pause_at_window_end']);
  try {
    await db.exec(read('20261010140000_literacy_mock_evidence_v3.sql'));
    await t.test('SQL focus matches authored oral access and protected reading conditions', async () => {
      const bank = await loadLiteracyMockBank({ includeUnavailable: true });
      for (const [id, expected] of [
        ['literacy.writing_purpose.invite', { skillId: 'writing_purpose', domainId: 'writing', construct: 'invitation', modality: 'recognition|audio+text||oral_language|visible', level: 1 }],
        ['literacy.print_concepts.book-title', { skillId: 'print_concepts', domainId: 'print', construct: 'title', modality: 'reading|text|||visible', level: 1 }],
      ]) {
        const item = bank.find(value => value.id === id);
        assert.ok(item, id);
        assert.deepEqual(literacyMockFocus(item), expected);
        assert.deepEqual(await query(db, 'select lp_literacy_mock_conditions($1) value', [item]), expected);
        assert.deepEqual(await query(db, 'select lp_literacy_mock_conditions($1) value', [{ skillId: item.skillId, domainId: item.domainId, level: item.level, itemSnapshot: item.itemSnapshot }]), expected);
      }
    });
    assert.equal((await prepareV3()).error, 'mock_v3_unavailable');
    const v3Items = [...items, ...Array.from({ length: 8 }, (_, n) => ({ ...items[0], id: `fresh${n}` })),
      { ...items[0], id: 'fresh0-alias' },
      { ...items[8], id: 'v3-extension', level: 2 }, { ...items[8], id: 'v3-different-construct', level: 2 }]
      .map(item => ({ ...item, itemSnapshot: { ...item.itemSnapshot, id: item.id, level: item.level,
        canonicalItemId: item.id === 'fresh0-alias' ? 'fresh0' : item.id, stimulusKey: `stimulus:${item.id}`, exposureFamilyId: `family:${item.id}`,
        constructClaim: item.id === 'v3-different-construct' ? 'different-construct' : item.skillId, modality: 'recognition' } }));
    await db.query(`insert into literacy_mock_items(id,content_version,item)
      select i->>'id','literacy-mock-v3',i from jsonb_array_elements($1::jsonb) i`, [v3Items]);
    await db.query("insert into literacy_mock_publications(content_version,item_count) values('literacy-mock-v3',$1)", [v3Items.length]);
    const made = await prepareV3({ requestId: 'v3-prepare' });
    assert.equal(made.ok, true); const id = made.session.id;
    assert.equal(made.session.mock.window_mode, 'pause_at_window_end');
    assert.equal(made.session.mock.capabilities.presentationReceipts, true);
    assert.equal((await prepareV3({ requestId: 'v3-prepare' })).duplicate, true);
    assert.equal((await prepareV3({ requestId: 'v3-prepare', mode: 'timed_sample' })).error, 'request_conflict');
    await save(db, id, 'v3-plan', 0, plan);
    await control(db, id, 'start', 0, 'v3-start');
    await t.test('events are private, token-scoped, idempotent and do not change answer revision', async () => {
      assert.equal(await query(db, "select has_table_privilege('authenticated','public.literacy_mock_events','select') value"), false);
      assert.equal(await query(db, "select relrowsecurity value from pg_class where relname='literacy_mock_events'"), true);
      assert.equal(await query(db, "select has_function_privilege('anon','public.teacher_resolve_literacy_mock_support(uuid,uuid,text,text,text)','execute') value"), false);
      assert.equal(await query(db, "select has_function_privilege('authenticated','public.lp_literacy_mock_effective_response(uuid,uuid,jsonb)','execute') value"), false);
      assert.equal((await event(id, 'q0', 'presented', 'bad', null)).error, 'invalid_session');
      assert.equal((await event(id, 'q0', 'presented', 'bad', 'foreign-token')).error, 'assignment_not_found');
      assert.equal((await event(id, 'q1', 'presented', 'wrong-question')).error, 'question_not_current');
      assert.equal((await save(db, id, 'no-presentation', 1, null, answer(0))).error, 'presentation_required');
      const shown = await event(id, 'q0', 'presented', 'show-q0');
      assert.equal(shown.ok, true); assert.equal(shown.run.revision, 1); assert.equal(shown.run.presentationTracking, true);
      assert.equal(shown.run.presentations.length, 1); assert.equal(shown.run.presentations[0].knownFamiliar, null);
      assert.ok(shown.run.eventRevision > 0);
      assert.equal((await event(id, 'q0', 'presented', 'show-q0')).duplicate, true);
      assert.equal((await event(id, 'q0', 'presented', 'show-q0-again')).run.presentations.length, 1);
      assert.equal((await event(id, 'q0', 'help_requested', 'show-q0')).error, 'request_conflict');
      for (const [kind, request] of [[null, 'null-kind'], ['bogus', 'wrong-kind'], ['presented', null]]) {
        assert.equal((await event(id, 'q0', kind, request)).error, 'invalid_event');
      }
      await db.query('update students set archived_at=clock_timestamp() where id=$1', [studentId]);
      assert.equal((await event(id, 'q0', 'presented', 'archived')).error, 'invalid_session');
      await db.query('update students set archived_at=null where id=$1', [studentId]);
      const differentShown = { ...plan, itemIds: [...plan.itemIds] }; differentShown.itemIds[0] = 'fresh0';
      assert.equal((await save(db, id, 'swap-presented', 1, differentShown)).error, 'presented_item_frozen');
    });
    await t.test('help requests do not claim answer help and accidental requests can be cancelled', async () => {
      const asked = await event(id, 'q0', 'help_requested', 'ask-q0');
      assert.equal(asked.run.helpRequests[0].pending, true); assert.equal(asked.run.helpRequests[0].assistanceType, 'none');
      const cancelled = await event(id, 'q0', 'help_cancelled', 'cancel-q0');
      assert.equal(cancelled.run.helpRequests[0].status, 'cancelled'); assert.equal(cancelled.run.helpRequests[0].pending, false);
      assert.equal((await event(id, 'q0', 'help_cancelled', 'cancel-again')).error, 'help_not_pending');
      await event(id, 'q0', 'help_requested', 'ask-again-q0');
      const access = await support(id, 'q0', 'access', 'resolve-access-q0');
      assert.equal(access.run.helpRequests[0].pending, false); assert.equal(access.run.helpRequests[0].assistanceType, 'access');
      const saved = await save(db, id, 'v3-answer-q0', 1, null, answer(0));
      assert.equal(saved.ok, true); assert.equal(saved.run.responses[0].knownFamiliar, null);
      assert.equal(saved.run.responses[0].evidenceType, 'independent'); assert.equal(saved.run.responses[0].supportUsed, false);
      assert.equal(saved.run.responses[0].accessAssistance, true);
    });
    await t.test('late teacher answer assistance changes effective evidence without altering first answer', async () => {
      const raw = await query(db, 'select responses->0 value from literacy_mock_runs where session_id=$1 and student_id=$2', [id, studentId]);
      const helped = await support(id, 'q0', 'answer', 'resolve-answer-q0');
      assert.equal(helped.run.responses[0].evidenceType, 'supported'); assert.equal(helped.run.responses[0].supportUsed, true);
      assert.equal(helped.run.revision, 2);
      assert.deepEqual(await query(db, 'select responses->0 value from literacy_mock_runs where session_id=$1 and student_id=$2', [id, studentId]), raw);
      const undo = await support(id, 'q0', 'none', 'resolve-none-q0');
      assert.equal(undo.run.responses[0].evidenceType, 'supported');
      const changed = { ...plan, itemIds: [...plan.itemIds] }; changed.itemIds[8] = 'v3-extension';
      assert.equal((await save(db, id, 'late-supported-adapt', 2, changed)).error, 'invalid_adaptation');
      const wrong = { ...plan, itemIds: [...plan.itemIds] }; wrong.itemIds[8] = 'v3-different-construct';
      assert.equal((await save(db, id, 'construct-adapt', 2, wrong)).error, 'plan_condition_conflict');
      await db.exec(`set fixture.actor='${other}'`);
      assert.equal((await support(id, 'q0', 'answer', 'foreign-support')).error, 'session_not_found');
      await db.exec(`set fixture.actor='${teacher}'`);
    });
    await t.test('window expiry pauses unfinished work and resume retains the same plan and answers', async () => {
      await event(id, 'q1', 'presented', 'show-q1');
      await db.query("update literacy_mock_sessions set deadline_at=clock_timestamp()-interval '1 second' where session_id=$1", [id]);
      const paused = await query(db, "select student_get_literacy_mock_run('synthetic-token',$1) value", [id]);
      assert.equal(paused.mock.state, 'paused'); assert.equal(paused.mock.pause_reason, 'window_elapsed');
      assert.notEqual(paused.run.status, 'completed'); assert.equal(paused.run.responses.length, 1); assert.equal(paused.run.presentations.length, 2);
      assert.equal(paused.run.completedAt, null); assert.deepEqual(paused.run.plan, plan);
      assert.equal((await save(db, id, 'paused-q1', 2, null, answer(1))).error, 'assessment_not_running');
      const resumed = await control(db, id, 'resume', paused.mock.revision, 'resume-break');
      assert.equal(resumed.session.mock.state, 'running'); assert.equal(resumed.session.mock.pause_reason, null);
      assert.equal((await save(db, id, 'resumed-q1', 2, null, answer(1))).ok, true);
    });
    await t.test('fresh checks derive exact focus, filter all known exposure, and preserve short counts', async () => {
      const fresh = await query(db, 'select teacher_prepare_literacy_mock_fresh_check($1,$2,$3,$4) value', [id, studentId, 'q0', 'fresh-from-q0']);
      assert.equal(fresh.ok, true); assert.equal(fresh.session.mock.plan_kind, 'fresh_check'); assert.equal(fresh.session.mock.item_count, 6);
      assert.deepEqual(fresh.session.mock.focus, { skillId: 'skill0', domainId: 'sound_awareness', construct: 'skill0', modality: 'recognition||||visible', level: 1 });
      assert.ok(!fresh.session.mock.candidate_item_ids.includes('q0'));
      assert.ok(!fresh.session.mock.candidate_item_ids.includes('v3-extension'));
      assert.ok(fresh.session.mock.candidate_item_ids.includes('fresh0'));
      assert.ok(!fresh.session.mock.candidate_item_ids.includes('fresh0-alias'));
      assert.equal((await query(db, 'select teacher_prepare_literacy_mock_fresh_check($1,$2,$3,$4) value', [id, studentId, 'q0', 'fresh-from-q0'])).duplicate, true);
      assert.equal((await query(db, 'select teacher_prepare_literacy_mock_fresh_check($1,$2,$3,$4) value', [id, studentId, 'q7', 'fresh-unseen-source'])).error, 'source_question_not_observed');
      const freshPlan = { itemIds: fresh.session.mock.candidate_item_ids.slice(0, 6), seed: 'fresh-seed' };
      const saved = await save(db, fresh.session.id, 'fresh-plan', 0, freshPlan);
      assert.equal(saved.ok, true);
      const forged = { ...freshPlan, itemIds: ['q0', ...freshPlan.itemIds.slice(1)] };
      assert.equal((await save(db, fresh.session.id, 'forged-fresh', 1, forged)).ok, false);
      const expose = async questionId => db.query("insert into student_progress(student_id,area,key,payload) values($1,'progress','literacy',$2)", [studentId,
        { completions: [{ gameId: 'literacy-practice', steps: [{ questionId, questionSnapshot: { canonicalItemId: questionId, stimulusKey: `stimulus:${questionId}`, exposureFamilyId: `family:${questionId}` } }] }] }]);
      await expose('q9');
      const sparse = await query(db, 'select teacher_prepare_literacy_mock_fresh_check($1,$2,$3,$4) value', [id, studentId, 'q1', 'sparse-fresh-q1']);
      assert.equal(sparse.ok, true); assert.equal(sparse.session.mock.item_count, 1);
      assert.deepEqual(sparse.session.mock.candidate_item_ids, ['q17']);
      assert.equal((await save(db, sparse.session.id, 'single-plan', 0, { itemIds: ['q17'], seed: 'single-fresh' })).ok, true);
      await expose('q17');
      const before = await query(db, 'select count(*)::integer value from student_focus_sessions');
      const exhausted = await query(db, 'select teacher_prepare_literacy_mock_fresh_check($1,$2,$3,$4) value', [id, studentId, 'q1', 'exhausted-fresh-q1']);
      assert.equal(exhausted.error, 'fresh_items_unavailable');
      assert.equal(await query(db, 'select count(*)::integer value from student_focus_sessions'), before);
      const exported = await query(db, "select teacher_export_learner_data($1,'teacher','authenticated') value", [studentId]);
      const exportedSession = exported.literacyMockAssessments.find(s => s.sessionId === id);
      assert.ok(exportedSession.run.presentations.length > 0);
      assert.equal(exportedSession.windowMode, 'pause_at_window_end');
      const administrationEvents = exportedSession.administrationEvents;
      assert.equal(administrationEvents.length, await query(db, 'select count(*)::integer value from literacy_mock_events where session_id=$1 and student_id=$2', [id, studentId]));
      assert.ok(administrationEvents.some(row => row.eventType === 'help_cancelled' && row.actorRole === 'student'));
      assert.ok(administrationEvents.some(row => row.eventType === 'support_resolved' && row.actorRole === 'teacher' && row.payload.assistance === 'answer'));
      assert.ok(administrationEvents.every(row => !('requestId' in row) && !('actorKey' in row)));
    });
    await t.test('explicit timed samples still finish at expiry and historical reads stay untracked', async () => {
      const timed = await prepareV3({ mode: 'timed_sample' }); const timedId = timed.session.id;
      await save(db, timedId, 'timed-plan', 0, plan); await control(db, timedId, 'start', 0, 'timed-start');
      await db.query("update literacy_mock_sessions set deadline_at=clock_timestamp()-interval '1 second' where session_id=$1", [timedId]);
      const ended = await query(db, "select student_get_literacy_mock_run('synthetic-token',$1) value", [timedId]);
      assert.equal(ended.mock.state, 'completed'); assert.equal(ended.mock.end_reason, 'time_finished');
      const legacy = await prepare(db); await save(db, legacy.session.id, 'legacy-plan', 0, plan);
      const old = await query(db, "select student_get_literacy_mock_run('synthetic-token',$1) value", [legacy.session.id]);
      assert.equal(old.mock.content_version, 'literacy-mock-v1'); assert.equal(old.run.presentationTracking, false);
      assert.equal((await event(legacy.session.id, 'q0', 'presented', 'legacy-event')).error, 'unsupported_event_version');
      const expiring = await prepareV3();
      await save(db, expiring.session.id, 'expire-plan', 0, plan); await control(db, expiring.session.id, 'start', 0, 'expire-start');
      await db.query("update student_focus_sessions set expires_at=clock_timestamp()-interval '1 second' where id=$1", [expiring.session.id]);
      const expired = await event(expiring.session.id, 'q0', 'presented', 'expired-offer');
      assert.equal(expired.error, 'assessment_not_running'); assert.equal(expired.mock.end_reason, 'session_expired');
      await db.exec("set fixture.actor=''");
      await assert.rejects(support(id, 'q0', 'none', 'anonymous-support'), /Teacher required/);
      await db.exec(`set fixture.actor='${teacher}'`);
    });
    await t.test('late support retracts only unoffered extensions and pending requests remain distinct', async () => {
      const made = await prepareV3(); const nextId = made.session.id;
      // q2 has not been presented in any earlier fixture run.
      const nextPlan = { ...plan, itemIds: [...plan.itemIds] };
      [nextPlan.itemIds[0], nextPlan.itemIds[2]] = [nextPlan.itemIds[2], nextPlan.itemIds[0]];
      const extension = { ...items[10], id: 'condition-extension', level: 2,
        itemSnapshot: { ...items[10].itemSnapshot, id: 'condition-extension', level: 2,
          canonicalItemId: 'condition-extension', stimulusKey: 'new-extension', exposureFamilyId: 'new-extension', constructClaim: 'skill2', modality: 'recognition' } };
      await db.query("insert into literacy_mock_items(id,content_version,item) values($1,'literacy-mock-v3',$2)", [extension.id, extension]);
      await save(db, nextId, 'late-plan', 0, nextPlan); await control(db, nextId, 'start', 0, 'late-start');
      await event(nextId, 'q2', 'presented', 'late-present-q2');
      await event(nextId, 'q2', 'help_requested', 'late-help-q2');
      const pendingAnswer = await save(db, nextId, 'late-answer', 1, null, answer(2));
      assert.equal(pendingAnswer.run.responses[0].supportPending, true);
      assert.equal(pendingAnswer.run.responses[0].supportUsed, false);
      assert.equal(pendingAnswer.run.responses[0].evidenceType, 'unscored');
      await support(nextId, 'q2', 'none', 'late-no-assistance');
      const extendedPlan = { ...nextPlan, itemIds: [...nextPlan.itemIds] }; extendedPlan.itemIds[10] = extension.id;
      const extended = await save(db, nextId, 'late-extension', 2, extendedPlan);
      assert.equal(extended.ok, true);
      await support(nextId, 'q2', 'answer', 'late-answer-help');
      const restored = await save(db, nextId, 'late-restore', 3, nextPlan);
      assert.equal(restored.ok, true); assert.equal(restored.run.responses[0].evidenceType, 'supported');
      assert.equal(restored.run.plan.itemIds[10], 'q10');
      // The additional fixture item is intentionally not a complete publication;
      // no later new preparation may silently accept its stale count.
      assert.equal((await prepareV3()).error, 'mock_v3_unavailable');
    });
    await t.test('learner deletion cascades durable receipt and assistance records', async () => {
      assert.ok(await query(db, 'select count(*)::integer value from literacy_mock_events where student_id=$1', [studentId]) > 0);
      await db.query('delete from students where id=$1', [studentId]);
      assert.equal(await query(db, 'select count(*)::integer value from literacy_mock_events where student_id=$1', [studentId]), 0);
    });
  } finally { await db.close(); }
});

test('the complete v3 publication preserves prior banks, replays exactly, and runs actual mixed and fresh checks', async t => {
  const db = await fixture({ upgrade: false });
  const fingerprints = () => db.query(`select content_version, count(*)::integer item_count,
    md5(string_agg(md5(to_jsonb(i)::text),'' order by id collate "C")) row_fingerprint,
    encode(sha256(convert_to(string_agg(id||chr(10)||item::text,chr(10) order by id collate "C"),'UTF8')),'hex') sha256
    from literacy_mock_items i group by content_version order by content_version`);
  try {
    await db.exec('delete from literacy_mock_items');
    await db.exec(read('20261006092000_literacy_mock_items.sql'));
    await db.exec(read('20261010120000_literacy_mock_evidence_v2.sql'));
    await db.exec(read('20261010121000_literacy_mock_items_v2.sql'));
    const original = (await fingerprints()).rows;
    await db.exec(read('20261010140000_literacy_mock_evidence_v3.sql'));
    const manifest = await createLiteracyMockManifest({ contentVersion: 'literacy-mock-v3' });
    assert.equal(manifest.itemCount, 3976);
    assert.deepEqual(manifest.unavailableItemIds, []);
    const sql = read('20261010141000_literacy_mock_items_v3.sql');
    assert.equal(sql, literacyMockManifestSql(manifest), 'The reviewed migration must be the complete current generated bank.');
    await db.exec(sql);
    const canonicalRows = (await db.query("select id,item,lp_literacy_mock_conditions(item) focus,lp_literacy_exposure_identity(item) exposure from literacy_mock_items where content_version='literacy-mock-v3'")).rows;
    const canonical = new Map(canonicalRows.map(row => [row.id, row.item]));
    assert.equal(canonical.size, manifest.itemCount);
    for (const item of manifest.items) assert.deepEqual(canonical.get(item.id), item, item.id);
    for (const row of canonicalRows) {
      assert.deepEqual(row.focus, literacyMockFocus(row.item), `${row.id}: SQL/client task identity`);
      const identity = canonicalLiteracyIdentity(row.item);
      assert.deepEqual(row.exposure, { exposureItemId: identity.itemId, exposurePassageKey: identity.passageKey, exposureFamilyId: identity.familyId }, `${row.id}: SQL/client familiarity identity`);
    }
    assert.equal(await query(db, "select count(distinct item->>'domainId')::integer value from literacy_mock_items where content_version='literacy-mock-v3'"), 8);
    assert.equal(await query(db, "select item_count value from literacy_mock_publications where content_version='literacy-mock-v3'"), manifest.itemCount);
    const published = (await fingerprints()).rows;
    assert.deepEqual(published.filter(row => row.content_version !== 'literacy-mock-v3'), original);
    await db.exec(sql);
    assert.deepEqual((await fingerprints()).rows, published, 'Identical manifest replay leaves all versions unchanged.');

    const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v3' });
    assert.equal(bank.length, 3976);
    const prepared = await query(db, 'select teacher_prepare_literacy_mock_session_v3($1,$2,false,20,43,$3) value', [classId, [studentId], 'actual-v3-prepare']);
    assert.equal(prepared.ok, true);
    const sessionId = prepared.session.id;
    const planned = selectLiteracyMockPlan(bank, { sessionId, studentId, itemCount: 43 });
    const registered = await save(db, sessionId, 'actual-v3-plan', 0, planned);
    assert.equal(registered.ok, true, registered.error);
    assert.equal(registered.run.contentVersion, 'literacy-mock-v3');
    assert.equal(registered.run.presentationTracking, true);
    assert.equal((await control(db, sessionId, 'start', 0)).ok, true);
    const first = bank.find(item => item.id === planned.itemIds[0]);
    const presented = await query(db, 'select student_record_literacy_mock_event($1,$2,$3,$4,$5) value', ['synthetic-token', sessionId, first.id, 'presented', 'actual-v3-presentation']);
    assert.equal(presented.ok, true, presented.error);
    assert.equal(presented.run.presentations[0].knownFamiliar, null);
    const answered = await save(db, sessionId, 'actual-v3-answer', registered.run.revision, null, {
      questionId: first.id, selected: first.answer, responseStatus: 'answered', supportUsed: false, knownFamiliar: null,
      audioDelivery: Object.fromEntries(first.requiredAudioPaths.map(path => [path, 'completed'])),
    });
    assert.equal(answered.ok, true, answered.error);
    assert.equal(answered.run.responses[0].isCorrect, true);
    assert.equal(answered.run.responses[0].evidenceType, 'independent');
    assert.equal(answered.run.responses[0].knownFamiliar, null);
    assert.deepEqual(answered.run.responses[0].itemSnapshot, first.itemSnapshot);

    const fresh = await query(db, 'select teacher_prepare_literacy_mock_fresh_check($1,$2,$3,$4) value', [sessionId, studentId, first.id, 'actual-v3-fresh']);
    assert.equal(fresh.ok, true, fresh.error);
    assert.deepEqual(fresh.session.mock.focus, literacyMockFocus(first));
    assert.ok(fresh.session.mock.item_count >= 1 && fresh.session.mock.item_count <= 6);
    assert.ok(!fresh.session.mock.candidate_item_ids.includes(first.id));
    const selected = selectLiteracyMockFreshCheck(bank, { sessionId: fresh.session.id, studentId,
      focus: fresh.session.mock.focus, itemCount: fresh.session.mock.item_count, eligibleItemIds: fresh.session.mock.candidate_item_ids });
    assert.equal(selected.unavailable, false);
    const freshSaved = await save(db, fresh.session.id, 'actual-v3-fresh-plan', 0, selected.plan);
    assert.equal(freshSaved.ok, true, freshSaved.error);
    assert.equal(freshSaved.run.plan.itemIds.length, fresh.session.mock.item_count);

    const changed = sql.replace('"prompt":', '"prompt":"tampered","_originalPrompt":');
    await assert.rejects(db.exec(changed), /Published mock content is immutable/);
    await db.exec('rollback');
    assert.deepEqual((await fingerprints()).rows, published);
    t.diagnostic(`Canonical catalogue fingerprints: ${JSON.stringify(published)}`);
  } finally { await db.close(); }
});
