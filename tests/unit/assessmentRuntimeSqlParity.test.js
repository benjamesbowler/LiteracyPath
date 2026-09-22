import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { skillBlueprints } from "../../src/content/blueprints/skillBlueprints.js";
import { learnerAssessmentStatus } from "../../src/appState/assessmentSitting.js";

const A = "11111111-1111-4111-8111-111111111111", B = "22222222-2222-4222-8222-222222222222";
const TEACHER = "33333333-3333-4333-8333-333333333333", SESSION = "44444444-4444-4444-8444-444444444444";
const migrationUrl = new URL("../../supabase/migrations/20260922160000_skills_assessment_runtime_validity.sql", import.meta.url);
function attempt(id, phase, { count = 8, correct = count, studentId = A, daysAgo = 0, mediaFailed = false } = {}) {
  const timestamp = new Date(Date.now() - daysAgo * 86400000).toISOString();
  const questionRecords = Array.from({ length: count }, (_, i) => ({ questionId: `${id}-${i}`, skillId: "nouns", level: 1, phase, itemKey: "common_nouns", responseStatus: i < correct ? "correct" : "incorrect", isCorrect: i < correct, timestamp }));
  if (mediaFailed) questionRecords.push({ questionId: `${id}-media`, skillId: "nouns", level: 1, phase, responseStatus: "media_failed", isCorrect: null, timestamp });
  return { attemptId: id, studentId, skillId: "nouns", skillName: "Nouns", skillLevel: 1, skillPhase: phase, assessmentType: "skill_checkpoint", administrationStatus: "completed", totalQuestions: count, correctCount: correct, completedAt: timestamp, policySnapshot: { roundLength: 8 }, assessmentVersion: "v3", contentVersion: "v3", policyVersion: "v3", questionRecords };
}

test("Skills RPC executes full-sitting, learner and unscored-media contracts in isolated PostgreSQL", async t => {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated;
    create table public.students(id uuid primary key, name text);
    create function public.student_from_token(token text) returns public.students language sql stable as $$ select * from public.students where id::text = token; $$;
    create function public.end_expired_student_focus_sessions() returns void language sql as $$ select; $$;
    create table public.student_focus_sessions(id uuid primary key, teacher_id uuid, class_id uuid, target text, selection_scope text, content_version text, status text, started_at timestamptz default now(), expires_at timestamptz default now()+interval '1 hour', ended_at timestamptz, end_action text);
    create table public.student_focus_session_members(session_id uuid, student_id uuid, resolved_config jsonb, active boolean default true, status text default 'assigned', completed_at timestamptz, current_view text, content_ok boolean, last_seen_at timestamptz, updated_at timestamptz);
    create table public.assessment_attempts(attempt_id text primary key, student_id text, class_id text, teacher_id uuid, assessment_type text, skill_id text, skill_name text, skill_level integer, skill_phase integer, started_at timestamptz, completed_at timestamptz, total_questions integer, correct_count integer, accuracy numeric, status text, administration_status text, schema_version integer, evidence_schema_version integer, assessment_version text, content_version text, policy_version text, payload jsonb, raw_evidence jsonb, updated_at timestamptz);
    create table public.mastery(student_id uuid, teacher_id uuid, checkpoint_id text, skill_id text, skill_label text, mastered boolean, attempts integer, last_score integer, last_total integer, updated_at timestamptz);
    create unique index mastery_checkpoint_test on public.mastery(teacher_id,checkpoint_id) where checkpoint_id is not null;
    insert into public.students values ('${A}','A'),('${B}','B');
    insert into public.student_focus_sessions(id,teacher_id,class_id,target,status) values ('${SESSION}','${TEACHER}','${TEACHER}','skills_assessment','active');
    insert into public.student_focus_session_members(session_id,student_id,resolved_config) values ('${SESSION}','${A}','{"skill_id":"nouns","skill_label":"Nouns","level":1,"phase":2}');
  `);
  const migration = await readFile(migrationUrl, "utf8");
  await db.exec(migration);
  const summary = async record => (await db.query("select public.lp_skill_assessment_sitting_summary($1::jsonb) result", [JSON.stringify(record)])).rows[0].result;
  const save = async record => (await db.query("select public.student_complete_focus_assessment($1,$2::uuid,$3::jsonb) result", [A, SESSION, JSON.stringify(record)])).rows[0].result;
  const seed = async record => db.query("insert into public.assessment_attempts(attempt_id,student_id,teacher_id,skill_id,skill_name,skill_level,skill_phase,total_questions,completed_at,administration_status,assessment_type,payload) values($1,$2,$3,$4,$5,$6,$7,$8,$9,'completed','skill_checkpoint',$10::jsonb)", [record.attemptId, record.studentId, TEACHER, record.skillId, record.skillName, record.skillLevel, record.skillPhase, record.totalQuestions, record.completedAt, JSON.stringify(record)]);
  await t.test("database lengths match all30 current blueprints", async () => {
    for (const [id, blueprint] of Object.entries(skillBlueprints)) assert.equal((await db.query("select public.lp_skill_assessment_sitting_size($1) size", [id])).rows[0].size, blueprint.sitting, id);
    assert.equal((await db.query("select public.lp_skill_assessment_sitting_size('invented') size")).rows[0].size, null);
  });
  await t.test("short, duplicate and mixed-phase forms cannot complete or award progress", async () => {
    const short = attempt("short", 2, { count: 1 });
    const duplicate = attempt("duplicate", 2); duplicate.questionRecords.forEach(row => { row.questionId = "same"; });
    const mixed = attempt("mixed", 2); mixed.questionRecords.slice(0, 4).forEach(row => { row.phase = 1; });
    for (const record of [short, duplicate, mixed]) {
      assert.equal((await summary(record)).complete, false);
      assert.equal((await save(record)).error, "assignment_mismatch");
      assert.equal(learnerAssessmentStatus([record], "nouns", A).level1.phases[2].passed, false);
    }
    assert.equal((await db.query("select count(*)::integer total from public.assessment_attempts")).rows[0].total, 0);
  });
  await t.test("supported evidence and an explicit partial cannot supply a missing scored answer", async () => {
    const record = attempt("supported", 2); record.questionRecords[0].supported = true;
    assert.equal((await summary(record)).complete, false);
    assert.equal((await save(record)).error, "assignment_mismatch");
    const partial = attempt("partial", 2); partial.administrationStatus = "partial";
    assert.equal((await summary(partial)).complete, false);
  });
  await t.test("another learner's or expired phase1 pass cannot unlock this learner", async () => {
    await seed(attempt("other-learner", 1, { studentId: B }));
    await seed(attempt("expired", 1, { daysAgo: 100 }));
    assert.equal((await save(attempt("phase-two-only", 2))).ok, true);
    assert.equal((await db.query("select mastered from public.mastery where checkpoint_id='phase-two-only'")).rows[0].mastered, false);
  });
  await t.test("six of eight scored answers plus a media failure remains6/8 and matches the reducer", async () => {
    const first = attempt("phase-one-valid", 1), current = attempt("media-recovered", 2, { correct: 6, mediaFailed: true });
    await seed(first);
    const stats = await summary(current);
    assert.equal(stats.scoredCount, 8); assert.equal(stats.correctCount, 6); assert.equal(stats.passed, true);
    assert.equal((await save(current)).ok, true);
    assert.equal((await db.query("select total_questions,accuracy from public.assessment_attempts where attempt_id='media-recovered'")).rows[0].total_questions, 8);
    assert.equal(Number((await db.query("select accuracy from public.assessment_attempts where attempt_id='media-recovered'")).rows[0].accuracy), 75);
    assert.equal((await db.query("select mastered from public.mastery where checkpoint_id='media-recovered'")).rows[0].mastered, learnerAssessmentStatus([first, current], "nouns", A).nextSkillUnlocked);
    assert.equal((await save(current)).duplicate, true);
  });
  await t.test("token read preserves owner, full-sitting metadata and unscored states without answer keys", async () => {
    const result = (await db.query("select public.student_get_focus_session($1,'assessment',true) result", [A])).rows[0].result;
    assert.equal(result.ok, true);
    const rows = result.session.prior_attempts;
    assert.ok(rows.length > 0);
    assert.equal(rows.some(row => row.attemptId === "other-learner"), false);
    for (const row of rows) { assert.equal(row.studentId, A); assert.equal(row.policySnapshot.roundLength, 8); assert.equal(row.administrationStatus, "completed"); }
    assert.equal(rows.find(row => row.attemptId === "media-recovered").questionRecords.at(-1).responseStatus, "media_failed");
    assert.doesNotMatch(JSON.stringify(rows), /correctAnswer|selectedAnswer/);
    assert.equal(learnerAssessmentStatus(rows, "nouns", A).nextSkillUnlocked, true);
  });
});
