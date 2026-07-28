import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(
  new URL(
    "../../supabase/migrations/20260728127000_teacher_account_decision_history_and_school_boundary.sql",
    import.meta.url
  ),
  "utf8"
);
const settings = fs.readFileSync(
  new URL("../../src/components/teacher/TeacherSettingsPage.jsx", import.meta.url),
  "utf8"
);

test("teacher-account decisions append immutable server-owned history", () => {
  assert.match(
    migration,
    /create table if not exists public\.teacher_account_decision_events/
  );
  assert.match(
    migration,
    /before update or delete on public\.teacher_account_decision_events[\s\S]*reject_teacher_account_decision_event_mutation/
  );
  assert.match(
    migration,
    /revoke all on table public\.teacher_account_decision_events[\s\S]*grant select[\s\S]*to authenticated/
  );
  assert.match(
    migration,
    /using \(public\.is_app_admin\(auth\.uid\(\)\)\)/
  );

  const decision = migration.slice(
    migration.indexOf(
      "create or replace function public.admin_set_teacher_account_status"
    ),
    migration.indexOf(
      "create or replace function public.teacher_set_school"
    )
  );
  assert.match(decision, /v_actor_id uuid := auth\.uid\(\)/);
  assert.match(decision, /v_decided_at timestamptz := clock_timestamp\(\)/);
  assert.match(
    decision,
    /insert into public\.teacher_account_decision_events/
  );
  assert.doesNotMatch(decision, /\bp_(?:decided|reviewed)_(?:by|at)\b/);
  assert.match(
    decision,
    /v_status = 'approved'[\s\S]*Resolve the teacher account school before approving access/
  );
});

test("school settings cannot masquerade as a tenant transfer", () => {
  assert.match(settings, /<h3>Current school<\/h3>/);
  assert.match(settings, /Ask an administrator to correct this if it is wrong\./);
  assert.doesNotMatch(settings, /name="schoolName"/);
  assert.doesNotMatch(settings, /Save school information/);

  const setSchool = migration.slice(
    migration.indexOf("create or replace function public.teacher_set_school")
  );
  assert.match(
    setSchool,
    /v_account\.school_id is not null and not v_is_admin/
  );
  assert.match(
    setSchool,
    /School transfers must be completed by an administrator\./
  );
  assert.match(
    setSchool,
    /perform public\.assert_current_actor_teacher_access\(\)/
  );
});
