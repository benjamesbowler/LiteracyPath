import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const sql = fs.readFileSync(new URL("../../supabase/migrations/20260812110000_maths_assignments.sql", import.meta.url), "utf8");

test("Maths assignments are private and ownership-scoped through RPCs", () => {
  assert.match(sql, /alter table public\.maths_assignments enable row level security/i);
  assert.match(sql, /alter table public\.maths_assignment_students enable row level security/i);
  assert.match(sql, /revoke all on table public\.maths_assignments from public, anon, authenticated/i);
  assert.match(sql, /class\.teacher_id = auth\.uid\(\)/i);
  assert.match(sql, /public\.student_from_token\(p_token\)/i);
  assert.match(sql, /student\.archived_at is null/i);
  assert.doesNotMatch(sql, /grant\s+(select|insert|update|delete|all)\s+on\s+table\s+public\.maths_/i);
});

test("assignment completion is logistics only and carries no mastery claim", () => {
  const completionFunction = sql.match(
    /create function public\.student_complete_maths_assignment[\s\S]*?\n\$\$;/i
  )?.[0] || "";
  assert.match(completionFunction, /completed_at = coalesce\(link\.completed_at, now\(\)\)/i);
  assert.doesNotMatch(completionFunction, /mastery|secure|proficiency/i);
});

test("Maths assignments participate in the verified learner export chain", () => {
  assert.match(sql, /rename to teacher_export_learner_data_without_maths_assignments/i);
  assert.match(sql, /'mathsAssignments'/i);
  assert.match(sql, /where link\.student_id = p_student_id/i);
  assert.match(sql, /assignment\.teacher_id = auth\.uid\(\)/i);
});
