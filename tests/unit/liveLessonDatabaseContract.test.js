import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL("../../supabase/migrations/20260809130000_class_quest_live.sql", import.meta.url);

test("Class Quest Live is RPC-only, diagnostic, and cascade-deletable", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  for (const table of ["live_lesson_sessions", "live_lesson_participants", "live_lesson_presence", "live_lesson_responses"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(sql, /diagnostic_not_mastery/);
  assert.match(sql, /references public\.students\(id\) on delete cascade/);
  assert.match(sql, /'liveLessonParticipation'/);
  assert.match(sql, /'liveLessonResponses'/);
  assert.match(sql, /jsonb_agg\(to_jsonb\(live_response\)/);
  assert.doesNotMatch(sql, /jsonb_agg\(to_jsonb\(response\)/);
  assert.doesNotMatch(sql, /audio_url|image_url|video_url|recording|transcript/i);
});

test("student response results never return correctness", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  const body = sql.split("create or replace function public.student_submit_live_response")[1]
    .split("revoke all on function")[0];
  assert.match(body, /'submitted', true/);
  assert.doesNotMatch(body, /json_build_object\([^;]*'is_correct'/s);
});
