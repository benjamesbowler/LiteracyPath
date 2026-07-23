import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260723110000_leaderboard_student_token_privacy.sql", import.meta.url),
  "utf8"
);
const arcade = readFileSync(
  new URL("../../src/components/learn/games/GameArcadeHub.jsx", import.meta.url),
  "utf8"
);
const dashboard = readFileSync(
  new URL("../../src/components/TeacherDashboardPage.jsx", import.meta.url),
  "utf8"
);

test("leaderboard scope is derived from a valid student token, never a caller school id", () => {
  assert.match(migration, /p_student_token text/);
  assert.match(migration, /student_from_token\(p_student_token\)/);
  assert.match(migration, /raise exception 'invalid_session'/);
  assert.doesNotMatch(migration, /create or replace function public\.get_game_leaderboard\([\s\S]*p_school_id/);
  assert.match(arcade, /p_student_token: token/);
  assert.doesNotMatch(arcade, /p_school_id|readSchoolId/);
  assert.match(arcade, /\?\.token \|\| ""/);
});

test("leaderboard responses are pseudonymous and class-only by default", () => {
  assert.match(migration, /leaderboard_scope set default 'class'/);
  assert.match(migration, /'Reader ' \|\| upper/);
  assert.doesNotMatch(
    migration.slice(migration.indexOf("create or replace function public.get_game_leaderboard")),
    /s\.name|sc\.name|school_name|class_name/
  );
  assert.match(arcade, /Nickname-only scores stay in your/);
});

test("school scope requires an authenticated teacher's explicit class control", () => {
  assert.match(migration, /teacher_set_class_leaderboard_scope/);
  assert.match(migration, /c\.teacher_id = v_user_id/);
  assert.match(migration, /grant execute[\s\S]*to authenticated/);
  assert.match(dashboard, /teacher_set_class_leaderboard_scope/);
  assert.match(dashboard, /Include this school/);
  assert.match(dashboard, /No student names are shown/);
});
