import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { PROGRESS_BANK as bank } from "../../src/content/assessments/v3/progressBank.generated.js";
import { LITERACY_DOMAINS, LITERACY_PRACTICE_VERSION as version } from "../../src/policy/literacyPracticePolicy.js";
import { buildStudentFocusAssignments } from "../../src/policy/studentFocusAssignments.js";
import { focusSessionContentOkForPoll } from "../../src/hooks/useStudentFocusSession.js";
import { createProgressTestRun, beginProgressTest, commitProgressResponse, finishProgressTest, progressAttemptFromRun } from "../../src/utils/progressTestRouter.js";

const migration = name => readFileSync(new URL(`../../supabase/migrations/${name}.sql`, import.meta.url), "utf8");
const forward = migration("20261005093000_literacy_practice_assignments");
const teacher = "11000000-0000-4000-8000-000000000001";
const otherTeacher = "11000000-0000-4000-8000-000000000002";
const unapprovedTeacher = "11000000-0000-4000-8000-000000000003";
const classId = "22000000-0000-4000-8000-000000000001";
const otherClass = "22000000-0000-4000-8000-000000000002";
const studentId = "33000000-0000-4000-8000-000000000001";
const secondStudent = "33000000-0000-4000-8000-000000000002";
const otherStudent = "33000000-0000-4000-8000-000000000003";
const archivedStudent = "33000000-0000-4000-8000-000000000004";
const config = track => ({ plan_kind: "practice", track_id: track, bank_version: version });
const value = async (db, sql, args = []) => (await db.query(sql, args)).rows[0].value;
const assign = (db, assignment = { "*": config("all") }, ids = [studentId], contentVersion = version, wholeClass = false, ownerClass = classId) => value(db,
  "select teacher_start_progress_check_session($1,$2,$3,60,$4,$5) value", [ownerClass, ids, assignment, contentVersion, wholeClass]);
const definition = (file, name) => {
  const result = migration(file).match(new RegExp(`create(?: or replace)? function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, "i"));
  assert.ok(result, `${name} must be taken from the actual migration`);
  return result[0];
};

async function fixture() {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  await db.exec(`create schema auth; create extension pgcrypto; create role anon; create role authenticated;
    create table auth.users(id uuid primary key); insert into auth.users values('${teacher}'),('${otherTeacher}'),('${unapprovedTeacher}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('fixture.actor',true),'')::uuid$$;
    create function public.assert_current_actor_teacher_access() returns void language plpgsql as $$begin if auth.uid() is null or auth.uid()='${unapprovedTeacher}' then raise exception 'Approved teacher required'; end if; end$$;
    create table public.classes(id uuid primary key,teacher_id uuid); insert into classes values('${classId}','${teacher}'),('${otherClass}','${otherTeacher}');
    create table public.students(id uuid primary key,class_id uuid references classes(id),teacher_id uuid,name text,archived_at timestamptz);
    insert into students values('${studentId}','${classId}','${teacher}','Synthetic learner',null),('${secondStudent}','${classId}','${teacher}','Second learner',null),('${otherStudent}','${otherClass}','${otherTeacher}','Other class',null),('${archivedStudent}','${classId}','${teacher}','Archived learner',now());
    create table public.student_sessions(token text primary key, student_id uuid references students(id), revoked boolean default false, expires_at timestamptz default now()+interval '1 hour');
    insert into student_sessions(token,student_id) values('synthetic-token','${studentId}'),('second-token','${secondStudent}'),('other-token','${otherStudent}'),('archived-token','${archivedStudent}'),('expired-token','${studentId}'),('revoked-token','${studentId}');
    update student_sessions set expires_at=now()-interval '1 second' where token='expired-token'; update student_sessions set revoked=true where token='revoked-token';
    create table public.student_progress(id uuid primary key default gen_random_uuid(),student_id uuid references students(id) on delete cascade,area text,key text,payload jsonb,updated_at timestamptz,unique(student_id,area,key));
    create table public.assessment_attempts(attempt_id text primary key,student_id text,class_id text,teacher_id uuid references auth.users(id),assessment_type text,skill_id text,skill_name text,skill_level integer,skill_phase integer,started_at timestamptz,completed_at timestamptz,total_questions integer,correct_count integer,accuracy numeric(5,2) not null default 0,status text,administration_status text,schema_version integer,payload jsonb,created_at timestamptz default now(),updated_at timestamptz default now());
    create table public.student_focus_sessions(id uuid primary key default gen_random_uuid(),teacher_id uuid,class_id uuid,target text,content_version text,selection_scope text,status text default 'active',started_at timestamptz default now(),expires_at timestamptz,updated_at timestamptz default now(),ended_at timestamptz,end_action text default 'return_home',constraint student_focus_sessions_target_check check(target in ('cycle_practice')));
    create table public.student_focus_session_members(session_id uuid references student_focus_sessions(id),student_id uuid references students(id) on delete cascade,resolved_config jsonb,status text default 'assigned',active boolean default true,content_ok boolean default false,current_view text,last_seen_at timestamptz,completed_at timestamptz,updated_at timestamptz,primary key(session_id,student_id));
    create table public.reading_sessions(student_ids uuid[],status text,updated_at timestamptz);
    create function public.end_expired_student_focus_sessions() returns void language sql as $$update public.student_focus_sessions set status='ended' where expires_at<=now()$$;
  `);
  for (const name of ["lp_merge_daily_mission", "lp_merge_phonics_quest", "lp_merge_hollow", "lp_merge_transfer_missions", "lp_merge_el_quest"]) {
    await db.exec(`create function public.${name}(jsonb,jsonb) returns jsonb language sql immutable as $$select $2$$;`);
  }
  for (const name of ["20260614090000_progress_forward_merge", "20260724003000_immutable_assessment_evidence", "20261002165900_progress_bank_manifest_part_one", "20261002165910_progress_bank_manifest_part_two", "20261002170000_adaptive_progress_checks", "20261003023000_progress_check_save_performance"]) await db.exec(migration(name));
  await db.exec(definition("20260727090000_data_rights_and_lifecycle_fixes", "student_from_token"));
  await db.exec(definition("20260822130000_retire_lean_release_features", "student_get_progress"));
  await db.exec(definition("20260822130000_retire_lean_release_features", "student_save_progress"));
  await db.exec(definition("20260922160000_skills_assessment_runtime_validity", "student_get_focus_session"));
  await db.exec(definition("20260828120000_student_focus_sessions", "student_complete_focus_session"));
  await db.exec(`revoke all on function public.student_from_token(text), public.student_get_progress(text), public.student_save_progress(text,text,text,jsonb), public.student_get_focus_session(text,text,boolean), public.student_complete_focus_session(text,uuid) from public, anon, authenticated;
    grant execute on function public.student_get_progress(text), public.student_save_progress(text,text,text,jsonb), public.student_get_focus_session(text,text,boolean), public.student_complete_focus_session(text,uuid) to anon, authenticated;
    set fixture.actor='${teacher}';`);
  return db;
}

test("practice assignments and child content checks use exact versions and valid domains", () => {
  for (const track of ["all", ...LITERACY_DOMAINS.map(domain => domain.id)]) {
    const assignments = buildStudentFocusAssignments({ target: "progress_check", progressPlanKind: "practice", progressTrackId: track, progressBankVersion: version });
    assert.deepEqual(assignments, { "*": config(track) });
    const session = { id: "practice", target: "progress_check", content_version: version, resolved_config: assignments["*"] };
    assert.equal(focusSessionContentOkForPoll(session, null), true);
    assert.equal(focusSessionContentOkForPoll(session, { sessionId: session.id, contentOk: false }), false);
    assert.equal(focusSessionContentOkForPoll(session, { sessionId: "old-session", contentOk: false }), true);
  }
  for (const [track, contentVersion] of [["hear_sounds", version], ["", version], ["all", bank.version], ["all", "literacy-practice-v99"]]) {
    assert.deepEqual(buildStudentFocusAssignments({ target: "progress_check", progressPlanKind: "practice", progressTrackId: track, progressBankVersion: contentVersion }), {});
    assert.equal(focusSessionContentOkForPoll({ id: "practice", target: "progress_check", content_version: contentVersion, resolved_config: { ...config(track), bank_version: contentVersion } }, null), false);
  }
  const legacy = { plan_kind: "focused", track_id: "reading_stories", bank_version: bank.version };
  assert.equal(focusSessionContentOkForPoll({ id: "legacy", target: "progress_check", content_version: bank.version, resolved_config: legacy }, null), true);
  assert.equal(focusSessionContentOkForPoll({ id: "legacy", target: "progress_check", content_version: "unpublished-bank", resolved_config: { ...legacy, bank_version: "unpublished-bank" } }, null), false);
  assert.equal(focusSessionContentOkForPoll({ id: "wrong-target", target: "reading_library", content_version: version, resolved_config: config("all") }, null), false);
});

test("local PostgreSQL preserves legacy checks while adding scoped literacy assignments and practice saves", async t => {
  const db = await fixture();
  try {
    const oldConfig = { plan_kind: "focused", track_id: "printed_words", bank_version: bank.version };
    const oldAssignment = await assign(db, { "*": oldConfig }, [studentId], bank.version);
    assert.equal(oldAssignment.ok, true);
    const draft = createProgressTestRun({ bank, studentId, classId, teacherId: teacher, assignmentId: oldAssignment.session.id, attemptId: "legacy-draft", planKind: "focused", trackId: "printed_words" });
    assert.equal((await value(db, "select student_save_progress_run($1,$2,$3,null) value", ["synthetic-token", oldAssignment.session.id, draft])).ok, true);
    let archived = beginProgressTest(createProgressTestRun({ bank, studentId: secondStudent, classId, teacherId: teacher, attemptId: "legacy-archive", planKind: "focused", trackId: "hear_sounds" }));
    const item = archived.currentItem;
    const audioDelivery = Object.fromEntries(Object.entries(item.audio || {}).flatMap(([role, cue]) => Array.isArray(cue) ? cue.map((_, index) => [`${role}:${index}`, "completed"]) : [[role, "completed"]]));
    archived = finishProgressTest(commitProgressResponse(archived, { itemId: item.id, selected: item.answer, audioDelivery }), "partial");
    assert.equal((await value(db, "select teacher_save_progress_run($1,$2) value", [archived, progressAttemptFromRun(archived)])).ok, true);
    const before = await value(db, "select to_jsonb(a) value from assessment_attempts a where attempt_id='legacy-archive'");
    const bankBefore = await value(db, "select manifest value from progress_test_banks where version=$1", [bank.version]);
    await db.exec(forward);

    await t.test("exact practice configs pass; malformed, extra, missing and mixed-version configs fail", async () => {
      for (const track of ["all", ...LITERACY_DOMAINS.map(domain => domain.id)]) assert.equal(await value(db, "select lp_progress_config_valid($1,$2) value", [config(track), version]), true);
      for (const invalid of [null, [], "practice", {}, { ...config("all"), plan_kind: "focused" }, { ...config("all"), bank_version: bank.version }, { ...config("all"), extra: true }, { ...config("all"), track_id: null }, { ...config("all"), track_id: "hear_sounds" }, { ...config("all"), track_id: "http://example.test" }]) {
        assert.equal(await value(db, "select lp_progress_config_valid($1,$2) value", [JSON.stringify(invalid), version]), false, JSON.stringify(invalid));
      }
      assert.equal(await value(db, "select lp_progress_config_valid($1,$2) value", [oldConfig, bank.version]), true);
      assert.equal(await value(db, "select lp_progress_config_valid($1,$2) value", [{ plan_kind: "broad_profile", bank_version: bank.version }, bank.version]), true);
      assert.equal(await value(db, "select lp_progress_config_valid($1,$2) value", [{ ...oldConfig, bank_version: "unpublished-bank" }, "unpublished-bank"]), false);
      assert.equal(await value(db, "select lp_progress_config_valid($1,null) value", [config("all")]), false);
    });

    await t.test("old drafts, bank snapshots and immutable archives survive unchanged", async () => {
      assert.deepEqual(await value(db, "select to_jsonb(a) value from assessment_attempts a where attempt_id='legacy-archive'"), before);
      assert.deepEqual(await value(db, "select manifest value from progress_test_banks where version=$1", [bank.version]), bankBefore);
      assert.deepEqual((await value(db, "select student_get_progress_run($1,$2) value", ["synthetic-token", oldAssignment.session.id])).run, draft);
      assert.equal((await value(db, "select student_save_progress_run($1,$2,$3,null) value", ["synthetic-token", oldAssignment.session.id, draft])).ok, true);
      await assert.rejects(db.query("update assessment_attempts set total_questions=999 where attempt_id='legacy-archive'"), /immutable|archive/);
      const forged = { ...draft, pool: draft.pool.slice(0, 1), attemptId: "forged" };
      await assert.rejects(value(db, "select teacher_save_progress_run($1,null) value", [forged]), /stock|pool/);
    });

    await t.test("ownership, approved-teacher access and failed replacement retain their boundaries", async () => {
      await db.exec(`set fixture.actor='${otherTeacher}';`);
      assert.equal((await assign(db)).error, "class_not_found");
      await db.exec(`set fixture.actor='${unapprovedTeacher}';`);
      await assert.rejects(assign(db), /Approved teacher/);
      await db.exec(`set fixture.actor='';`);
      await assert.rejects(assign(db), /Approved teacher/);
      await db.exec(`set fixture.actor='${teacher}';`);
      for (const learner of [otherStudent, archivedStudent]) assert.equal((await assign(db, { "*": config("all") }, [learner])).error, "student_not_in_class");
      assert.equal((await assign(db, { "*": config("all"), [studentId]: config("reading") })).error, "invalid_progress_assignment");
      assert.equal((await assign(db, { [secondStudent]: config("reading") })).error, "invalid_progress_assignment");
      assert.equal((await assign(db, {}, [studentId])).error, "missing_progress_assignment");
      assert.equal(await value(db, "select status value from student_focus_sessions where id=$1", [oldAssignment.session.id]), "active");
    });

    let practiceId;
    await t.test("whole-class roster resolution, child reads and completion stay token scoped", async () => {
      const result = await assign(db, { "*": config("all") }, [], version, true);
      assert.equal(result.ok, true);
      practiceId = result.session.id;
      assert.deepEqual(result.session.members.map(member => member.student_id).sort(), [studentId, secondStudent].sort());
      assert.equal(result.session.target, "progress_check");
      assert.equal(result.session.content_version, version);
      const read = await value(db, "select student_get_focus_session($1,null,true) value", ["synthetic-token"]);
      assert.equal(read.session.id, practiceId);
      assert.deepEqual(read.session.resolved_config, config("all"));
      assert.equal((await value(db, "select student_get_focus_session($1,null,true) value", ["other-token"])).session, null);
      assert.equal((await value(db, "select student_complete_focus_session($1,$2) value", ["other-token", practiceId])).ok, false);
      assert.equal((await value(db, "select student_complete_focus_session($1,$2) value", ["synthetic-token", practiceId])).ok, true);
      const perLearner = await assign(db, { [studentId]: config("reading"), [secondStudent]: config("writing") }, [studentId, secondStudent]);
      assert.equal(perLearner.ok, true);
      assert.deepEqual(Object.fromEntries(perLearner.session.members.map(member => [member.student_id, member.resolved_config.track_id])), { [studentId]: "reading", [secondStudent]: "writing" });
      practiceId = perLearner.session.id;
    });

    await t.test("generic learn_games saves round-trip through a real token without creating formal scores", async () => {
      const progress = { v: 1, games: { "literacy-practice": { checkpoints: { practice: { id: "practice-round", domainId: "reading", turn: 2 } }, practiceRecord: { v: 3, completions: [{ id: "practice-event", firstResponseCorrect: false, supportUsed: true }] } } } };
      await db.exec("set role anon;");
      assert.equal((await value(db, "select student_save_progress($1,'learn_games','__all__',$2) value", ["synthetic-token", progress])).ok, true);
      const own = (await db.query("select payload from student_get_progress($1) where area='learn_games'", ["synthetic-token"])).rows;
      assert.deepEqual(own[0].payload, progress);
      assert.equal((await db.query("select * from student_get_progress($1) where area='learn_games'", ["second-token"])).rows.length, 0);
      for (const token of [null, "", "missing-token", "expired-token", "revoked-token", "archived-token"]) {
        assert.equal((await value(db, "select student_save_progress($1,'learn_games','__all__',$2) value", [token, progress])).error, "invalid_session");
        await assert.rejects(db.query("select * from student_get_progress($1)", [token]), /invalid_session/);
      }
      assert.equal((await value(db, "select student_save_progress($1,'progress_check','run:forged',$2) value", ["synthetic-token", draft])).ok, false);
      assert.equal((await value(db, "select student_save_progress($1,'learn_games','__all__',null) value", ["synthetic-token"])).ok, false);
      await assert.rejects(assign(db), /permission denied/);
      await assert.rejects(db.query("select * from student_progress"), /permission denied/);
      await db.exec("reset role;");
      assert.equal(await value(db, "select count(*)::integer value from assessment_attempts"), 1);
      assert.equal(await value(db, "select count(*)::integer value from student_progress where area='learn_games' and student_id<>$1", [studentId]), 0);
      assert.equal((await value(db, "select student_save_progress_run($1,$2,$3,null) value", ["synthetic-token", practiceId, { ...draft, assignmentId: practiceId }])).ok, false);
      await db.query("update student_focus_sessions set expires_at=now()-interval '1 second' where id=$1", [practiceId]);
      assert.equal((await value(db, "select student_complete_focus_session($1,$2) value", ["synthetic-token", practiceId])).ok, false);
      assert.equal((await value(db, "select student_get_focus_session($1,null,true) value", ["synthetic-token"])).session, null);
    });

    await t.test("private validation and bank grants remain closed", async () => {
      for (const role of ["anon", "authenticated"]) {
        assert.equal(await value(db, "select has_function_privilege($1,'public.lp_progress_config_valid(jsonb,text)','execute') value", [role]), false);
        assert.equal(await value(db, "select has_table_privilege($1,'public.progress_test_banks','select') value", [role]), false);
      }
      assert.equal(await value(db, "select has_function_privilege('authenticated','public.teacher_start_progress_check_session(uuid,uuid[],jsonb,integer,text,boolean)','execute') value"), true);
      assert.equal(await value(db, "select has_function_privilege('anon','public.teacher_start_progress_check_session(uuid,uuid[],jsonb,integer,text,boolean)','execute') value"), false);
      assert.equal(await value(db, "select relrowsecurity value from pg_class where oid='public.progress_test_banks'::regclass"), true);
    });
  } finally { await db.close(); }
});
