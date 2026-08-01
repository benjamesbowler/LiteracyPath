import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(
  new URL("../../supabase/migrations/20260801090000_synced_guided_reading.sql", import.meta.url),
  "utf8"
);
const boundary = fs.readFileSync(
  new URL("../../supabase/migrations/20260801091000_security_definer_boundary.sql", import.meta.url),
  "utf8"
);

test("shared reading creates exactly the two operational tables with the intended RLS boundary", () => {
  assert.equal((migration.match(/create table if not exists public\.reading_/g) || []).length, 2);
  assert.match(migration, /alter table public\.reading_sessions enable row level security/i);
  assert.match(migration, /alter table public\.reading_session_presence enable row level security/i);
  assert.match(migration, /revoke all on table public\.reading_session_presence\s+from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /create policy[\s\S]{0,100}reading_session_presence/i);
  assert.match(migration, /foreign key \(class_id, teacher_id\)[\s\S]*references public\.classes\(id, teacher_id\)/i);
  assert.match(migration, /create trigger reading_sessions_membership_guard/i);
});

test("all six reading RPCs revoke default execution and expose only the intended roles", () => {
  const teacherFunctions = [
    "teacher_start_reading_session",
    "teacher_set_reading_session_page",
    "teacher_end_reading_session",
    "teacher_get_reading_session_presence",
    "teacher_save_reading_marks"
  ];
  for (const name of teacherFunctions) {
    assert.match(migration, new RegExp(`revoke all on function public\\.${name}\\(`, "i"));
    assert.match(boundary, new RegExp(`grant execute on function public\\.${name}\\([\\s\\S]*?\\)\\s+to authenticated`, "i"));
    assert.match(migration, new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?begin\\s+perform public\\.assert_current_actor_teacher_access\\(\\);`, "i"));
  }
  assert.match(migration, /revoke all on function public\.student_get_reading_session\(text, integer, boolean\)[\s\S]*grant execute[\s\S]*to anon, authenticated/i);
  assert.match(boundary, /grant execute on function public\.student_get_reading_session\(text, integer, boolean\)\s+to anon, authenticated/i);
});

test("polling, stale-session, presence, retry and retention safeguards remain explicit", () => {
  assert.match(migration, /interval '250 milliseconds'/i);
  assert.match(migration, /interval '6 seconds'/i);
  assert.match(migration, /interval '90 minutes'/i);
  assert.match(migration, /interval '30 days'/i);
  assert.match(migration, /p_client_event_id = any\(v_session\.mark_event_ids\)/i);
  assert.match(migration, /reading_session_residual_records/i);
  assert.doesNotMatch(migration + boundary, /websocket|eventsource|\.channel\(|broadcast/i);
});
