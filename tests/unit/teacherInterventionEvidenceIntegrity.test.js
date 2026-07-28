import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL(
  "../../supabase/migrations/20260728126000_teacher_intervention_evidence_integrity.sql",
  import.meta.url
);

test("support evidence writes use guarded SECURITY DEFINER lifecycle RPCs", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const rpc of [
    "teacher_create_intervention_plan",
    "teacher_update_planned_intervention",
    "teacher_delete_planned_intervention",
    "teacher_mark_intervention_delivered",
    "teacher_record_intervention_outcome",
    "teacher_review_intervention",
    "teacher_cancel_intervention",
    "teacher_create_intervention_follow_up"
  ]) {
    assert.match(
      sql,
      new RegExp(
        `create or replace function public\\.${rpc}[\\s\\S]*?security definer[\\s\\S]*?perform public\\.assert_current_actor_teacher_access\\(\\);`,
        "i"
      ),
      `${rpc} must validate the signed-in actor inside a SECURITY DEFINER boundary`
    );
  }

  assert.match(
    sql,
    /revoke insert, update, delete on public\.teacher_interventions from authenticated/i
  );
  assert.match(
    sql,
    /revoke all on function public\.teacher_cancel_planned_intervention[\s\S]*authenticated/i
  );
});

test("delivery, outcome, review, and cancellation use server-owned times", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /status = 'delivered',\s*delivered_at = clock_timestamp\(\)/i);
  assert.match(sql, /status = 'recorded'[\s\S]*recorded_at = clock_timestamp\(\)/i);
  assert.match(sql, /status = 'reviewed'[\s\S]*reviewed_at = clock_timestamp\(\)/i);
  assert.match(sql, /status = 'cancelled'[\s\S]*cancelled_at = clock_timestamp\(\)/i);
  assert.match(sql, /and status = 'delivered'[\s\S]*and delivered_at is not null/i);
  assert.match(sql, /old\.status = 'recorded' and new\.status not in \('recorded', 'reviewed'\)/i);
  assert.match(sql, /old\.status = 'reviewed' and new\.status <> 'reviewed'/i);
});

test("the append-only event stream records every lifecycle phase without learner text", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /create table if not exists public\.teacher_intervention_events/i);
  assert.match(sql, /revoke all on public\.teacher_intervention_events from public, anon, authenticated/i);
  assert.match(sql, /grant select on public\.teacher_intervention_events to authenticated/i);
  assert.match(sql, /after insert or update or delete on public\.teacher_interventions/i);
  for (const eventType of [
    "plan_created",
    "plan_updated",
    "plan_deleted",
    "delivered",
    "outcome_recorded",
    "reviewed",
    "follow_up_planned",
    "cancelled"
  ]) {
    assert.match(sql, new RegExp(`'${eventType}'`));
  }
  assert.doesNotMatch(
    sql,
    /jsonb_build_object\([\s\S]{0,180}'studentIds'/i,
    "immutable event payloads must not duplicate learner identifiers"
  );
});

test("the browser support workflow never writes the evidence table directly", async () => {
  const source = await readFile(
    new URL("../../src/components/teacher/InterventionLoop.jsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /\.table\("teacher_interventions"\)\s*\.(?:insert|update|delete)/);
  for (const rpc of [
    "teacher_create_intervention_plan",
    "teacher_update_planned_intervention",
    "teacher_delete_planned_intervention",
    "teacher_mark_intervention_delivered",
    "teacher_record_intervention_outcome",
    "teacher_review_intervention",
    "teacher_cancel_intervention"
  ]) {
    assert.match(source, new RegExp(`"${rpc}"`));
  }
  assert.match(source, /loadSupportEventHistory/);
  assert.match(source, /\.range\(offset, offset \+ pageSize - 1\)/);
  assert.match(source, /Support history/);
  assert.match(source, /We couldn&apos;t load the support history/);
  assert.match(source, /Times are saved by the school system/);
  assert.match(source, /Saved by you/);
  assert.match(source, /Saved by an administrator/);
  assert.match(source, /Saved by the school system/);
});
