import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { buildAssessmentAttemptRecord } from "../../src/data/assessmentHistoryStore.js";
import { saveStudentFocusAssessmentAttempt } from "../../src/data/studentFocusSessionCore.js";
import { validateSupabaseResponse } from "../../src/data/boundaries/client.js";
import { getActiveAssessmentSkillIds, loadAssessmentSkillBank } from "../../src/data/loadAssessmentSkillBank.js";

const root = resolve(import.meta.dirname, "../..");
const db = await PGlite.create({ extensions: { pgcrypto } });
const sessionId = "a1500000-0000-4000-8000-000000000001";
const studentId = "a1400000-0000-4000-8000-000000000001";
let failure = null;
try {
  await db.exec(readFileSync(join(import.meta.dirname, "bootstrap.sql"), "utf8"));
  for (const name of readdirSync(join(root, "supabase/migrations")).filter(name => name.endsWith(".sql")).sort()) {
    try { await db.exec(readFileSync(join(root, "supabase/migrations", name), "utf8")); }
    catch (error) { throw new Error(`${name}: ${error.message}`, { cause: error }); }
  }
  await db.exec("alter extension pgcrypto set schema extensions");
  // Reuse only synthetic identities; all fixtures stay in this in-memory database.
  const fixture = readFileSync(join(root, "tests/sql/cycle_practice_evidence.sql"), "utf8").split("do $test$")[0];
  await db.exec(fixture);
  await db.exec(`update public.student_focus_sessions set target='skills_assessment',content_version='student-focus-v1';
    update public.student_focus_session_members set resolved_config='{"skill_id":"initial_sounds","skill_label":"Initial Sounds","level":1,"phase":1}'`);
  const { rows: [login] } = await db.query("select public.student_login($1,'123','synthetic-assessment-device','NULL24') as result", [studentId]);
  assert.equal(login.result.ok, true);
  const client = { call: async (name, args) => {
    assert.equal(name, "student_complete_focus_assessment");
    await db.exec("set local role anon");
    try {
      const { rows: [saved] } = await db.query("select public.student_complete_focus_assessment($1,$2,$3::jsonb) as result", [args.p_token, args.p_session_id, JSON.stringify(args.p_attempt)]);
      return validateSupabaseResponse("rpc", name, { data: saved.result, error: null });
    } finally { await db.exec("reset role"); }
  } };
  const attempt = buildAssessmentAttemptRecord({
    studentId, studentName: "Synthetic Login Learner",
    teacherId: "a1100000-0000-4000-8000-000000000001", classId: "a1300000-0000-4000-8000-000000000001",
    stage: { id: "initial_sounds", label: "Initial Sounds" },
    checkpoint: { skillId: "initial_sounds", pathStatus: { level: 1, phase: 1 } },
    questionRecords: Array.from({ length: 10 }, (_, i) => ({
      questionId: `synthetic-q-${i}`, answerEventId: `synthetic-answer-${i}`,
      question: "Choose the sound.", correct: "a", chosen: i < 7 ? "a" : "b", isCorrect: i < 7,
      skillId: "initial_sounds", itemLevel: 1, itemPhase: i % 2 + 1, itemKey: `letter-${i}`
    }))
  });
  const save = (overrides = {}, token = login.result.token, id = sessionId) => saveStudentFocusAssessmentAttempt({ client, token, sessionId: id, attempt: { ...attempt, ...overrides } });
  const oldIdBase = [attempt.teacherId, attempt.studentId, attempt.skillId, attempt.startedAt,
    attempt.questionRecords.map(question => question.questionId).join("-")].join(":");
  const oldId = `attempt_${oldIdBase.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
  assert.ok(oldId.length > 200);
  assert.equal((await save({ attemptId: oldId })).error, "assignment_mismatch");
  assert.ok(attempt.attemptId.length <= 200);
  const saved = await save();
  assert.equal(saved.ok, true, JSON.stringify(saved));
  assert.equal((await save()).duplicate, true);
  assert.equal((await db.query("select count(*)::int as count from public.assessment_attempts")).rows[0].count, 1);
  console.log(`PASS: former ${oldId.length}-character ID rejected; bounded client completion and identical retry accepted`);

  for (const token of [null, "", "unknown-synthetic-token"]) {
    assert.equal((await save({}, token)).error, "invalid_session");
  }
  await db.exec("update public.student_sessions set revoked=true");
  assert.equal((await save()).error, "invalid_session");
  await db.exec("update public.student_sessions set revoked=false,expires_at=now()-interval '1 minute'");
  assert.equal((await save()).error, "invalid_session");
  await db.exec("update public.student_sessions set expires_at=now()+interval '1 hour'");
  assert.equal((await save({ skillId: "unassigned_skill" })).error, "assignment_mismatch");
  assert.equal((await save({ assessmentType: "el_encoding" })).error, "assignment_mismatch");
  assert.equal((await save({}, login.result.token, "a1500000-0000-4000-8000-000000000002")).error, "session_not_found");
  await db.exec("update public.student_focus_sessions set expires_at=now()-interval '1 minute'");
  assert.equal((await save()).error, "session_not_found");
  await db.exec("update public.student_focus_sessions set expires_at=now()+interval '20 minutes'");
  console.log("PASS: missing, invalid, revoked and expired tokens; unassigned skill, type, session and expired focus session rejected");

  const spoofedId = "spoofed-owner-fields";
  assert.equal((await save({ attemptId: spoofedId, teacherId: "spoofed", studentId: "spoofed", classId: "spoofed", administrationMode: "teacher_observed" })).ok, true);
  const { rows: [stored] } = await db.query("select teacher_id,student_id,class_id,payload from public.assessment_attempts where attempt_id=$1", [spoofedId]);
  assert.equal(stored.teacher_id, attempt.teacherId);
  assert.equal(stored.student_id, attempt.studentId);
  assert.equal(stored.class_id, attempt.classId);
  assert.equal(stored.payload.administrationMode, "student_independent");
  assert.equal(stored.payload.focusSessionId, sessionId);
  assert.equal(stored.payload.assignedByTeacher, true);
  await db.exec(`insert into public.classes (id,teacher_id,school_id,name,access_code)
    values ('a1300000-0000-4000-8000-000000000002','a1100000-0000-4000-8000-000000000002',
    'a1200000-0000-4000-8000-000000000001','Other Synthetic Class','OTHER2');
    insert into public.students (id,teacher_id,class_id,name,symbol_password)
    values ('a1400000-0000-4000-8000-000000000002','a1100000-0000-4000-8000-000000000002',
    'a1300000-0000-4000-8000-000000000002','Other Synthetic Learner','123');
    insert into public.student_focus_sessions (id,teacher_id,class_id,target,content_version,expires_at)
    values ('a1500000-0000-4000-8000-000000000002','a1100000-0000-4000-8000-000000000002',
    'a1300000-0000-4000-8000-000000000002','skills_assessment','student-focus-v1',now()+interval '20 minutes');
    insert into public.student_focus_session_members (session_id,student_id,resolved_config)
    values ('a1500000-0000-4000-8000-000000000002','a1400000-0000-4000-8000-000000000002',
    '{"skill_id":"initial_sounds","skill_label":"Initial Sounds","level":1,"phase":1}')`);
  const { rows: [otherLogin] } = await db.query("select public.student_login('a1400000-0000-4000-8000-000000000002','123','synthetic-other-device','OTHER2') as result");
  assert.equal(otherLogin.result.ok, true);
  assert.equal((await save({}, otherLogin.result.token)).error, "session_not_found");
  assert.equal((await save({}, login.result.token, "a1500000-0000-4000-8000-000000000002")).error, "session_not_found");
  assert.equal((await save({}, otherLogin.result.token, "a1500000-0000-4000-8000-000000000002")).error, "attempt_id_conflict");
  console.log("PASS: server owns evidence identity; cross-class access and cross-owner attempt ID reuse denied");

  let rounds = 0;
  for (const skillId of getActiveAssessmentSkillIds()) {
    const bank = await loadAssessmentSkillBank(skillId);
    assert.ok(bank.length >= 10, `${skillId}: fewer than ten runtime questions`);
    for (const level of [1, 2]) {
      const questions = bank.filter(question => (question.assessmentLevel || question.level) === level).slice(0, 10);
      assert.equal(questions.length, 10, `${skillId} level ${level}: incomplete runtime fixture`);
      for (const phase of [1, 2]) {
        const runtimeSkillId = questions[0].skillId;
        await db.query("update public.student_focus_session_members set resolved_config=$1::jsonb where session_id=$2", [JSON.stringify({ skill_id: runtimeSkillId, skill_label: skillId, level, phase }), sessionId]);
        const round = buildAssessmentAttemptRecord({
          teacherId: attempt.teacherId, studentId, classId: attempt.classId,
          stage: { id: runtimeSkillId, label: skillId },
          checkpoint: { skillId: runtimeSkillId, pathStatus: { level, phase } },
          questionRecords: questions.map((question, index) => ({
            questionId: question.id, answerEventId: `synthetic-${rounds}-${index}`,
            question: question.question, correct: question.correctAnswer, chosen: question.correctAnswer,
            isCorrect: true, skillId: runtimeSkillId, itemKey: question.itemKey,
            itemLevel: question.level, itemPhase: question.phase,
            timestamp: new Date(Date.UTC(2026, 8, 19, 0, rounds)).toISOString()
          }))
        });
        assert.ok(round.attemptId.length <= 200, `${skillId}: attempt ID too long`);
        const result = await saveStudentFocusAssessmentAttempt({ client, token: login.result.token, sessionId, attempt: round });
        assert.equal(result.ok, true, `${skillId} level ${level} phase ${phase}: ${JSON.stringify(result)}`);
        const { rows: [archived] } = await db.query("select skill_level,skill_phase,total_questions,correct_count from public.assessment_attempts where attempt_id=$1", [round.attemptId]);
        assert.deepEqual(archived, { skill_level: level, skill_phase: phase, total_questions: 10, correct_count: 10 });
        rounds += 1;
      }
    }
  }
  console.log(`PASS: ${rounds} full real runtime bank rounds accepted across every published skill, level and assigned phase`);
  await db.exec("rollback");
} catch (error) { failure = error; } finally { await db.close(); }
if (failure) { console.error(failure); process.exit(1); }
