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
const adventureMigration = fs.readFileSync(
  new URL("../../supabase/migrations/20260831233417_extend_student_focus_sessions_adventure_map.sql", import.meta.url),
  "utf8"
);
const adventureProgressEpochMigration = fs.readFileSync(
  new URL("../../supabase/migrations/20260902090000_reset_adventure_map_progress_epoch_2.sql", import.meta.url),
  "utf8"
);
const cyclePracticeMigration = fs.readFileSync(
  new URL("../../supabase/migrations/20260907090000_cycle_practice_focus_sessions.sql", import.meta.url),
  "utf8"
);
const assignmentCheckMigration = fs.readFileSync(
  new URL("../../supabase/migrations/20260903013233_student_focus_answer_assignment_check.sql", import.meta.url),
  "utf8"
);
const forwardMergeSelftest = fs.readFileSync(
  new URL("../../supabase/verify/progress_forward_merge_selftest.sql", import.meta.url),
  "utf8"
);
const mapStopsSource = fs.readFileSync(
  new URL("../../src/data/mapStops.js", import.meta.url),
  "utf8"
);

test("Adventure Map v2 progress is normalized at the database boundary without changing focus sessions", () => {
  assert.match(adventureProgressEpochMigration, /create or replace function public\.lp_merge_el_quest_cycle\(existing jsonb, incoming jsonb\)[\s\S]*sampledConstructs[\s\S]*lastPlayedAt/i);
  assert.match(adventureProgressEpochMigration, /'cycles', public\.lp_merge_el_quest_cycles\(local_payload -> 'cycles', incoming_payload -> 'cycles'\)/i);
  assert.match(adventureProgressEpochMigration, /create or replace function public\.lp_merge_el_quest\(existing jsonb, incoming jsonb\)[\s\S]*returns jsonb[\s\S]*immutable/i);
  assert.match(adventureProgressEpochMigration, /when p_area = 'el_quest' then public\.lp_merge_el_quest\(p_existing, p_incoming\)/i);
  assert.match(adventureProgressEpochMigration, /before insert on public\.student_progress/i);
  assert.match(adventureProgressEpochMigration, /new\.area = 'el_quest' and new\.key = '__all__'/i);
  assert.match(adventureProgressEpochMigration, /update public\.student_progress[\s\S]*set payload = public\.lp_normalize_el_quest\(payload\)[\s\S]*where area = 'el_quest'[\s\S]*and key = '__all__'/i);
  assert.doesNotMatch(adventureProgressEpochMigration, /set[\s\S]{0,100}updated_at\s*=/i);
  assert.doesNotMatch(adventureProgressEpochMigration, /student_focus_session/i);
});

test("Cycle Practice is a bounded 30-minute locked session with an end check", () => {
  assert.match(cyclePracticeMigration, /'cycle_practice'/i);
  assert.match(cyclePracticeMigration, /practice_seconds integer not null check \(practice_seconds >= 1800\)/i);
  assert.match(cyclePracticeMigration, /create or replace function public\.teacher_start_cycle_practice_session/i);
  assert.match(cyclePracticeMigration, /join public\.reading_sessions reading[\s\S]*reading\.status = 'active'/i);
  assert.match(cyclePracticeMigration, /create or replace function public\.student_complete_focus_cycle_practice/i);
  assert.match(cyclePracticeMigration, /p_attempt ->> 'contentVersion' <> 'cycle-practice-v1'/i);
  assert.match(cyclePracticeMigration, /notify pgrst, 'reload schema';\s*commit;/i);
});

test("Adventure Map epoch SQL verification exercises the insert trigger and leaves focus sessions unchanged", () => {
  assert.match(forwardMergeSelftest, /begin;[\s\S]*insert into public\.student_progress[\s\S]*'el_quest'[\s\S]*'__all__'/i);
  assert.match(forwardMergeSelftest, /select payload into [\w_]+\s+from public\.student_progress/i);
  assert.match(forwardMergeSelftest, /progressEpoch/i);
  assert.match(forwardMergeSelftest, /future schema at current epoch was normalized/i);
  assert.match(forwardMergeSelftest, /future schema existing-first was downgraded/i);
  assert.match(forwardMergeSelftest, /future schema incoming-first was downgraded/i);
  assert.match(forwardMergeSelftest, /latest construct manifest was unioned/i);
  assert.match(forwardMergeSelftest, /reverse merge lost latest recovery count/i);
  assert.match(forwardMergeSelftest, /student_focus_sessions/i);
  assert.match(forwardMergeSelftest, /rollback;/i);
});

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
  // The client's skillLevel/skillPhase are NOT compared any more (see the
  // assignment-check migration below); the stored values come from the
  // assignment either way, which is what makes the evidence assignment-scoped.
  assert.match(
    assignmentCheckMigration,
    /skill_id, skill_name, skill_level, skill_phase[\s\S]*\(v_member\.resolved_config ->> 'level'\)::integer,\s*\n\s*\(v_member\.resolved_config ->> 'phase'\)::integer,/i
  );
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

test("Adventure Map and end actions extend the schema in a new forward migration", () => {
  assert.match(
    adventureMigration,
    /target in \([\s\S]*'assigned_book'[\s\S]*'arcade_game'[\s\S]*'adventure_map'[\s\S]*\)/i
  );
  assert.match(
    adventureMigration,
    /add column end_action text not null default 'return_home'/i
  );
  assert.match(
    adventureMigration,
    /end_action in \('return_home', 'student_picker'\)/i
  );
  assert.match(
    adventureMigration,
    /student_focus_members_student_history_idx[\s\S]*\(student_id, session_id\)/i
  );
  assert.doesNotMatch(
    `${migration}\n${extensionMigration}`,
    /adventure_map|end_action/i,
    "historical migrations must stay immutable"
  );
});

test("the effective start RPC retains teacher ownership, locking and atomic conflict checks", () => {
  const startFunction = adventureMigration.slice(
    adventureMigration.indexOf("create or replace function public.teacher_start_student_focus_session"),
    adventureMigration.indexOf("revoke all on function public.teacher_end_student_focus_session")
  );
  const replacementBoundary = startFunction.indexOf("update public.student_focus_session_members member");
  assert.match(startFunction, /assert_current_actor_teacher_access\(\)/i);
  assert.match(
    startFunction,
    /from public\.classes class[\s\S]*class\.id = p_class_id and class\.teacher_id = v_actor[\s\S]*for update/i
  );
  assert.match(
    startFunction,
    /where student\.id = any\(v_student_ids\)[\s\S]*order by student\.id[\s\S]*for update/i
  );
  assert.match(
    startFunction,
    /student\.class_id = p_class_id[\s\S]*student\.teacher_id = v_actor[\s\S]*student\.archived_at is null/i
  );
  assert.match(startFunction, /perform public\.end_expired_student_focus_sessions\(\)/i);
  assert.match(startFunction, /join public\.reading_sessions reading[\s\S]*reading\.status = 'active'/i);
  assert.ok(startFunction.indexOf("if v_busy_student is not null", 0) < replacementBoundary);
  assert.match(startFunction, /when unique_violation then[\s\S]*session_conflict/i);
  assert.match(
    adventureMigration,
    /revoke all on function public\.teacher_start_student_focus_session\(uuid, text, uuid\[\], jsonb, integer, text, boolean\)[\s\S]*grant execute[\s\S]*to authenticated/i
  );
});

test("Adventure Map accepts only the two bounded wildcard assignment modes", () => {
  const startFunction = adventureMigration.slice(
    adventureMigration.indexOf("create or replace function public.teacher_start_student_focus_session"),
    adventureMigration.indexOf("revoke all on function public.teacher_end_student_focus_session")
  );
  assert.match(startFunction, /p_target not in \([\s\S]*'adventure_map'/i);
  assert.match(startFunction, /p_assignments -> '\*'/i);
  assert.match(startFunction, /count\(\*\) from jsonb_object_keys\(p_assignments\)\) <> 1/i);
  assert.match(startFunction, /map_mode[\s\S]*each_child_current[\s\S]*one_space_for_everyone/i);
  assert.match(startFunction, /cycle_id[\s\S]*cycle_number[\s\S]*space_name/i);
  assert.match(startFunction, /jsonb_object_keys\(v_config\)[\s\S]*config_key not in/i);
  assert.match(startFunction, /v_cycle_id <> 'cycle-' \|\| v_cycle_number::text/i);
  assert.match(startFunction, /v_space_name <> v_space_names\[v_cycle_number\]/i);
  assert.match(startFunction, /char_length\(v_cycle_number_text\) > 2/i);
  assert.match(startFunction, /when p_target = 'adventure_map' and v_map_mode = 'each_child_current'/i);
  assert.match(startFunction, /when p_target = 'adventure_map' then v_shared_config/i);
});

test("Adventure Map database labels stay aligned with the 27 painted runtime landmarks", () => {
  const sqlBlock = adventureMigration.match(/v_space_names text\[\] := array\[([\s\S]*?)\n {2}\];/i)?.[1] || "";
  const runtimeBlock = mapStopsSource.match(/export const WORLD_LANDMARKS_WIDE = \{([\s\S]*?)\n\};/i)?.[1] || "";
  const sqlNames = [...sqlBlock.matchAll(/'([^']+)'/g)].map(match => match[1]);
  const runtimeNames = [...runtimeBlock.matchAll(/"([^"]+)"/g)].map(match => match[1]);
  assert.equal(sqlNames.length, 27);
  assert.deepEqual(sqlNames, runtimeNames);
});

test("each-child Adventure Map assignments are resolved from the owned progress row", () => {
  const startFunction = adventureMigration.slice(
    adventureMigration.indexOf("create or replace function public.teacher_start_student_focus_session"),
    adventureMigration.indexOf("revoke all on function public.teacher_end_student_focus_session")
  );
  assert.match(startFunction, /public\.student_progress progress/i);
  assert.match(startFunction, /progress\.student_id = requested\.id/i);
  assert.match(startFunction, /progress\.area = 'el_quest'/i);
  assert.match(startFunction, /progress\.key = '__all__'/i);
  assert.match(startFunction, /generate_series\(1, 27\)/i);
  assert.match(startFunction, /select coalesce\([\s\S]*limit 1[\s\S]*\),\s*27\s*\) as cycle_number/i);
  assert.match(
    startFunction,
    /payload #> array\[[\s\S]*'cycles',[\s\S]*'cycle-' \|\| candidate\.cycle_number::text,[\s\S]*'stars'[\s\S]*\]/i
  );
  assert.match(startFunction, /jsonb_build_object\([\s\S]*'map_mode', 'each_child_current'[\s\S]*'cycle_id'[\s\S]*'cycle_number'[\s\S]*'space_name'/i);
});

test("teacher end action replaces the old RPC without creating an ambiguous overload", () => {
  const endFunction = adventureMigration.slice(
    adventureMigration.indexOf("create function public.teacher_end_student_focus_session"),
    adventureMigration.indexOf("create or replace function public.student_get_focus_session")
  );
  assert.match(
    adventureMigration,
    /drop function public\.teacher_end_student_focus_session\(uuid\)/i
  );
  assert.match(
    adventureMigration,
    /create function public\.teacher_end_student_focus_session\([\s\S]*p_end_action text default 'return_home'[\s\S]*\)\s*returns json/i
  );
  assert.match(
    adventureMigration,
    /p_end_action not in \('return_home', 'student_picker'\)[\s\S]*invalid_end_action/i
  );
  assert.match(endFunction, /assert_current_actor_teacher_access\(\)/i);
  assert.match(
    endFunction,
    /where id = p_session_id and teacher_id = auth\.uid\(\)[\s\S]*for update/i
  );
  assert.match(
    adventureMigration,
    /set status = 'ended'[\s\S]*end_action = p_end_action/i
  );
  assert.match(
    adventureMigration,
    /grant execute on function public\.teacher_end_student_focus_session\(uuid, text\)[\s\S]*to authenticated/i
  );
  assert.doesNotMatch(
    adventureMigration,
    /grant execute on function public\.teacher_end_student_focus_session\(uuid\)\s/i
  );
});

test("student polling ranks active and newest-ended state in one database snapshot", () => {
  const studentRead = adventureMigration.slice(
    adventureMigration.indexOf("create or replace function public.student_get_focus_session"),
    adventureMigration.indexOf("revoke all on function public.teacher_start_student_focus_session")
  );
  assert.match(studentRead, /student_from_token\(p_token\)/i);
  assert.doesNotMatch(studentRead, /auth\.uid\(\)/i);
  assert.doesNotMatch(studentRead, /v_ended_session/i);
  const candidateLookup = studentRead.slice(
    studentRead.indexOf("select\n    session.id as session_id"),
    studentRead.indexOf("if v_candidate.session_id is null")
  );
  assert.match(studentRead, /v_candidate record/i);
  assert.match(candidateLookup, /into v_candidate/i);
  assert.match(candidateLookup, /member\.student_id = v_student\.id/i);
  assert.match(
    candidateLookup,
    /member\.active[\s\S]*session\.status = 'active'[\s\S]*session\.expires_at > now\(\)[\s\S]*or session\.status = 'ended'/i
  );
  assert.match(candidateLookup, /or session\.status = 'ended'\s*\)\s*order by/i);
  assert.match(
    candidateLookup,
    /order by[\s\S]*when member\.active[\s\S]*session\.status = 'active'[\s\S]*then 0[\s\S]*else 1[\s\S]*session\.ended_at end desc nulls last[\s\S]*session\.started_at desc,[\s\S]*session\.id desc/i
  );
  assert.equal([...candidateLookup.matchAll(/\bselect\b/gi)].length, 1);
  assert.doesNotMatch(
    candidateLookup.slice(candidateLookup.indexOf("from public.student_focus_sessions")),
    /end_action/i
  );
  const actionCheck = studentRead.indexOf("v_candidate.end_action = 'student_picker'");
  assert.ok(actionCheck > studentRead.indexOf("if v_candidate.session_status = 'ended'"));
  assert.match(
    studentRead,
    /if v_candidate\.session_status = 'ended'[\s\S]*if v_candidate\.end_action = 'student_picker'[\s\S]*and v_candidate\.expires_at > now\(\)/i
  );
  assert.match(studentRead, /'session', null/i);
  assert.match(studentRead, /'end_action', v_candidate\.end_action/i);
  assert.match(studentRead, /'ended_session_id', v_candidate\.session_id/i);
  assert.match(
    adventureMigration,
    /grant execute on function public\.student_get_focus_session\(text, text, boolean\)[\s\S]*to anon, authenticated/i
  );
});

// Regression: students saw "That answer could not be saved on this device or to
// the cloud" on a healthy connection. The RPC rejects an answer whose
// level/phase differ from the assignment, and the client was sending the
// QUESTION's authored phase. Those two numbers mean different things: in the v3
// bank, phase is an alphabet split (Initial Sounds level 1 is a-m phase 1, n-z
// phase 2), while the round selectors choose items with no regard to it. Every
// answer on a letter from the other half was rejected as `assignment_mismatch`
// and surfaced to the child as a network error.
test("student answers report the assigned level and phase, not the question's authored ones", async () => {
  const controllerSource = fs.readFileSync(
    new URL("../../src/appState/assessmentRoundController.js", import.meta.url),
    "utf8"
  );

  // The original RPC compared both against resolved_config while storing
  // neither, so a question whose authored phase differed from the assignment
  // was refused outright.
  assert.match(
    migration,
    /coalesce\(\(p_answer ->> 'phase'\)::integer, -1\) <> \(v_member\.resolved_config ->> 'phase'\)::integer/i
  );

  // That comparison is gone; the skill_id guard, which is stored, remains.
  assert.doesNotMatch(assignmentCheckMigration, /p_answer ->> 'level'/i);
  assert.doesNotMatch(assignmentCheckMigration, /p_answer ->> 'phase'/i);
  assert.doesNotMatch(assignmentCheckMigration, /p_attempt ->> 'skillLevel'/i);
  assert.doesNotMatch(assignmentCheckMigration, /p_attempt ->> 'skillPhase'/i);
  assert.match(
    assignmentCheckMigration,
    /if p_answer ->> 'skill_id' <> v_member\.resolved_config ->> 'skill_id' then\s*\n\s*return json_build_object\('ok', false, 'error', 'assignment_mismatch'\);/i
  );
  assert.match(
    assignmentCheckMigration,
    /p_attempt ->> 'skillId' <> v_member\.resolved_config ->> 'skill_id'/i
  );
  // Both the answer RPC and the completion RPC must be replaced together.
  assert.match(assignmentCheckMigration, /create or replace function public\.student_save_focus_assessment_answer\(/i);
  assert.match(assignmentCheckMigration, /create or replace function public\.student_complete_focus_assessment\(/i);
  assert.match(
    assignmentCheckMigration,
    /grant execute on function public\.student_save_focus_assessment_answer\(text, uuid, jsonb\)\s*\n\s*to anon, authenticated;/i
  );

  // The client sends the assignment too, so either change fixes the fault alone.
  assert.match(controllerSource, /function getAssignedFocusStep\(\)[\s\S]{0,400}resolved_config/);
  assert.match(controllerSource, /level: assignedStep\.level \?\? normalizedRecord\.itemLevel/);
  assert.match(controllerSource, /phase: assignedStep\.phase \?\? normalizedRecord\.itemPhase/);
  assert.match(controllerSource, /skillLevel: assignedStep\.level \?\? enrichedAttempt\.skillLevel/);
  assert.match(controllerSource, /skillPhase: assignedStep\.phase \?\? enrichedAttempt\.skillPhase/);

  // Sending the question's own phase cannot work: no Initial Sounds letter has
  // items in both phases at a given level, so a phase-1 assignment inevitably
  // reaches letters the bank authored as phase 2.
  const { questions } = await import("../../src/data/v3/banks/initial_sounds.v3.generated.js");
  const phasesByLetter = new Map();
  for (const question of questions.filter(item => Number(item.level) === 1)) {
    const seen = phasesByLetter.get(question.itemKey) || new Set();
    seen.add(Number(question.phase));
    phasesByLetter.set(question.itemKey, seen);
  }
  const letters = [...phasesByLetter.entries()];
  assert.ok(letters.some(([, phases]) => phases.has(1)));
  assert.ok(letters.some(([, phases]) => phases.has(2)));
  assert.equal(letters.filter(([, phases]) => phases.size > 1).length, 0);
});
