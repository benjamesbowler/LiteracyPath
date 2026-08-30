import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(
  new URL("../../supabase/migrations/20260828120000_student_focus_sessions.sql", import.meta.url),
  "utf8"
);
const extensionMigration = fs.readFileSync(
  new URL("../../supabase/migrations/20260830213034_extend_student_focus_sessions_whole_class_targets.sql", import.meta.url),
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

test("whole-class and exact destinations extend the existing session schema additively", () => {
  assert.match(extensionMigration, /add column selection_scope text not null default 'selected_students'/i);
  assert.match(
    extensionMigration,
    /selection_scope in \('selected_students', 'whole_class'\)/i
  );
  assert.match(
    extensionMigration,
    /target in \([\s\S]*'assigned_book'[\s\S]*'arcade_game'[\s\S]*\)/i
  );
  assert.doesNotMatch(
    migration,
    /selection_scope|assigned_book|arcade_game/i,
    "the historical migration must stay immutable"
  );
});

test("the start RPC has one backward-compatible non-overloaded signature", () => {
  assert.match(
    extensionMigration,
    /drop function public\.teacher_start_student_focus_session\(uuid, text, uuid\[\], jsonb, integer, text\)/i
  );
  assert.match(
    extensionMigration,
    /create function public\.teacher_start_student_focus_session\([\s\S]*p_whole_class boolean default false[\s\S]*\)\s*returns json/i
  );
  assert.doesNotMatch(
    extensionMigration,
    /create or replace function public\.teacher_start_student_focus_session/i
  );
  assert.match(
    extensionMigration,
    /grant execute on function public\.teacher_start_student_focus_session\(uuid, text, uuid\[\], jsonb, integer, text, boolean\)[\s\S]*to authenticated/i
  );
});

test("whole-class membership is derived and locked server-side before an atomic launch", () => {
  const startFunction = extensionMigration.slice(
    extensionMigration.indexOf("create function public.teacher_start_student_focus_session"),
    extensionMigration.indexOf("create or replace function public.teacher_get_student_focus_session")
  );
  assert.match(startFunction, /coalesce\(cardinality\(p_student_ids\), 0\) <> 0/i);
  assert.match(startFunction, /array_agg\(student\.id order by student\.id\)/i);
  assert.match(startFunction, /student\.class_id = p_class_id[\s\S]*student\.teacher_id = v_actor[\s\S]*student\.archived_at is null/i);
  assert.match(startFunction, /from public\.classes class[\s\S]*for update/i);
  assert.match(startFunction, /where student\.id = any\(v_student_ids\)[\s\S]*order by student\.id[\s\S]*for update/i);
  assert.match(startFunction, /cardinality\(v_student_ids\) > 200[\s\S]*class_too_large/i);
  assert.match(startFunction, /unnest\(v_student_ids\)[\s\S]*student_busy/i);
  assert.match(startFunction, /conflict validation happens before replacement/i);
});

test("book and game assignments use one bounded wildcard config and reject routes", () => {
  const startFunction = extensionMigration.slice(
    extensionMigration.indexOf("create function public.teacher_start_student_focus_session"),
    extensionMigration.indexOf("create or replace function public.teacher_get_student_focus_session")
  );
  assert.match(startFunction, /v_config := p_assignments -> '\*'/i);
  assert.match(startFunction, /count\(\*\) from jsonb_object_keys\(p_assignments\)\) <> 1/i);
  assert.match(startFunction, /book_id[\s\S]*book_title/i);
  assert.match(startFunction, /game_id[\s\S]*game_title/i);
  assert.match(startFunction, /v_resource_id !~ '\^\[a-z0-9\]\[a-z0-9\._-\]\{0,119\}\$'/i);
  assert.match(startFunction, /v_resource_id like '%\.\.%'/i);
  assert.match(startFunction, /v_resource_title[\s\S]*:\/\//i);
  assert.match(startFunction, /guided_reading_book_reviews[\s\S]*status = 'quarantined'/i);
  assert.match(startFunction, /when p_target in \('assigned_book', 'arcade_game'\) then v_shared_config/i);
  assert.match(startFunction, /p_target = 'skills_assessment'[\s\S]*p_assignments \? '\*'[\s\S]*unexpected_shared_assignment/i);
});

test("teacher and student session reads include the authoritative audience", () => {
  assert.ok(
    [...extensionMigration.matchAll(/'audience', v_session\.selection_scope/g)].length >= 3
  );
  assert.ok(
    [...extensionMigration.matchAll(/'selection_scope', v_session\.selection_scope/g)].length >= 3
  );
});
