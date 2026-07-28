import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL(
  "../../supabase/migrations/20260728123000_teacher_intervention_lifecycle_repairs.sql",
  import.meta.url
);
const integrityMigrationPath = new URL(
  "../../supabase/migrations/20260728126000_teacher_intervention_evidence_integrity.sql",
  import.meta.url
);

test("support-plan migration blocks empty and archived groups at the database boundary", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /cardinality\(new\.student_ids\), 0\) < 1/i);
  assert.match(sql, /and s\.archived_at is null/i);
  assert.match(sql, /must be active and belong to its class and teacher/i);
  assert.match(sql, /teacher_interventions_student_count_check/i);
});

test("the later evidence boundary supersedes direct planned cancellation with narrow RPCs", async () => {
  const sql = await readFile(integrityMigrationPath, "utf8");

  assert.match(sql, /teacher_update_planned_intervention[\s\S]*security definer/i);
  assert.match(sql, /teacher_delete_planned_intervention[\s\S]*security definer/i);
  assert.match(sql, /teacher_cancel_intervention[\s\S]*security definer/i);
  assert.match(sql, /old\.status = 'cancelled' and new\.status <> 'cancelled'/i);
  assert.match(sql, /revoke insert, update, delete on public\.teacher_interventions/i);
  assert.match(sql, /revoke all on function public\.teacher_update_planned_intervention/i);
  assert.match(sql, /revoke all on function public\.teacher_cancel_planned_intervention[\s\S]*authenticated/i);
});

test("the SQL acceptance gate proves archived and empty targets are rejected", async () => {
  const proof = await readFile(
    new URL("../sql/teacher_intervention_lifecycle.sql", import.meta.url),
    "utf8"
  );

  assert.match(proof, /archived learner was accepted into a support plan/i);
  assert.match(proof, /zero-student support plan was accepted/i);
  assert.match(proof, /must be active and belong/i);
  assert.match(proof, /at least one learner/i);
});
