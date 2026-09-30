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
test("leaderboard scope is derived from a valid student token, never a caller school id", () => {
  assert.match(migration, /p_student_token text/);
  assert.match(migration, /student_from_token\(p_student_token\)/);
  assert.match(migration, /raise exception 'invalid_session'/);
  assert.doesNotMatch(migration, /create or replace function public\.get_game_leaderboard\([\s\S]*p_school_id/);
  assert.doesNotMatch(arcade, /get_game_leaderboard|leaderboardClient|leaderboardStudentToken|readStudentToken|Top Readers/);
  assert.match(arcade, /personalRecords = allGames/);
  assert.match(arcade, /getLearnGameProgress\(progress, game.id\)/);
});

test("leaderboard responses are pseudonymous and class-only by default", () => {
  assert.match(migration, /leaderboard_scope set default 'class'/);
  assert.match(migration, /'Reader ' \|\| upper/);
  assert.doesNotMatch(
    migration.slice(migration.indexOf("create or replace function public.get_game_leaderboard")),
    /s\.name|sc\.name|school_name|class_name/
  );
  assert.doesNotMatch(arcade, /student_name|total_points|ranking|Nickname-only/);
  assert.match(arcade, /These are your own game records/);
});

test("legacy school-scope administration requires an authenticated teacher", () => {
  assert.match(migration, /teacher_set_class_leaderboard_scope/);
  assert.match(migration, /c\.teacher_id = v_user_id/);
  assert.match(migration, /grant execute[\s\S]*to authenticated/);

});

test("retired peer-score endpoint is revoked for both API roles and their inherited PUBLIC grant", () => {
  const retirement = readFileSync("supabase/migrations/20260930161040_retire_child_game_leaderboard.sql", "utf8");
  assert.match(retirement, /revoke all privileges on function public\.get_game_leaderboard\(text, integer\)\s+from public, anon, authenticated/);
  assert.match(retirement, /to_regprocedure\('public\.get_game_leaderboard\(integer\)'\)/);
  assert.match(retirement, /to_regprocedure\('public\.get_game_leaderboard\(integer,uuid\)'\)/);
  for (const file of ["src/data/boundaries/content.js", "src/data/boundaries/facade.js", "src/components/learn/phonics/PhonicsLearnTab.jsx"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /get_game_leaderboard|leaderboardClient|leaderboardStudentToken/);
  }
});
