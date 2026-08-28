import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(
  new URL("../../supabase/migrations/20260828120000_student_focus_sessions.sql", import.meta.url),
  "utf8"
);

test("student sessions have bounded expiry, one active lock per student and RPC-only membership", () => {
  assert.match(migration, /expires_at <= started_at \+ interval '2 hours'/i);
  assert.match(migration, /student_focus_sessions_one_active_per_teacher_idx[\s\S]*where status = 'active'/i);
  assert.match(migration, /student_focus_members_one_active_session_idx[\s\S]*where active/i);
  assert.match(migration, /alter table public\.student_focus_session_members enable row level security/i);
  assert.match(migration, /revoke all on table public\.student_focus_sessions, public\.student_focus_session_members[\s\S]*from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /grant (?:select|insert|update|delete|all) on table public\.student_focus_/i);
  assert.doesNotMatch(migration, /create policy[\s\S]{0,140}student_focus_session_members/i);
});

test("student reads and assessment writes derive identity only from the opaque token", () => {
  for (const name of [
    "student_get_focus_session",
    "student_complete_focus_session",
    "student_save_focus_assessment_answer",
    "student_save_focus_item_mastery",
    "student_complete_focus_assessment"
  ]) {
    const functionSql = migration.slice(
      migration.indexOf(`create or replace function public.${name}`),
      migration.indexOf("create or replace function public.", migration.indexOf(`create or replace function public.${name}`) + 1)
    );
    assert.match(functionSql, /student_from_token\(p_token\)/i, `${name} must derive the student from the opaque token`);
    assert.doesNotMatch(functionSql, /auth\.uid\(\)/i, `${name} must not trust a browser auth identity`);
  }
  assert.match(migration, /student_save_focus_assessment_answer\(text, uuid, jsonb\)[\s\S]*to anon, authenticated/i);
  assert.match(migration, /student_complete_focus_assessment\(text, uuid, jsonb\)[\s\S]*to anon, authenticated/i);
});

test("student recovery receives repeat-safety metadata without prior answers or answer keys", () => {
  const studentRead = migration.slice(
    migration.indexOf("create or replace function public.student_get_focus_session"),
    migration.indexOf("create or replace function public.student_complete_focus_session")
  );
  assert.match(studentRead, /'prior_attempts', v_attempts/i);
  assert.match(studentRead, /'questionSignature'/i);
  assert.match(studentRead, /'itemKey'/i);
  assert.doesNotMatch(studentRead, /correctAnswer|selectedAnswer/i);
  assert.doesNotMatch(studentRead, /json_agg\(recent\.payload/i);
});

test("teachers can assign only owned active students and cross-feature sessions cannot overlap", () => {
  assert.match(migration, /class\.id = p_class_id and class\.teacher_id = v_actor/i);
  assert.match(migration, /student\.class_id = p_class_id[\s\S]*student\.teacher_id = v_actor[\s\S]*student\.archived_at is null/i);
  assert.match(migration, /join public\.reading_sessions reading[\s\S]*reading\.status = 'active'/i);
  assert.match(migration, /create trigger reading_sessions_focus_conflict_guard/i);
});

test("independent skills evidence is assignment-scoped, idempotent and permanently labelled", () => {
  assert.match(migration, /p_attempt ->> 'skillId' <> v_member\.resolved_config ->> 'skill_id'/i);
  assert.match(migration, /p_attempt ->> 'skillLevel'[\s\S]*v_member\.resolved_config ->> 'level'/i);
  assert.match(migration, /on conflict \(teacher_id, client_event_id\) where client_event_id is not null do nothing/i);
  assert.match(migration, /on conflict \(attempt_id\) do nothing/i);
  assert.match(migration, /'administrationMode', 'student_independent'/i);
  assert.match(migration, /'focusSessionId', v_session\.id::text/i);
  assert.match(migration, /'assignedByTeacher', true/i);
  assert.match(migration, /attempt_id_conflict/i);
  assert.match(migration, /jsonb_array_length\(p_attempt -> 'questionRecords'\)/i);
  assert.match(migration, /v_question_total <> v_total[\s\S]*v_question_correct <> v_correct/i);
  assert.match(migration, /count\(distinct attempt\.skill_phase\)[\s\S]*>= 0\.70/i);
  assert.match(migration, /attempt\.skill_phase in \(1, 2\)/i);
  assert.doesNotMatch(migration, /p_mastery/i);
});

test("operational session records join the existing thirty-day cleanup", () => {
  assert.match(migration, /delete from public\.student_focus_sessions[\s\S]*interval '30 days'/i);
  assert.match(migration, /notify pgrst, 'reload schema';\s*commit;/i);
});
