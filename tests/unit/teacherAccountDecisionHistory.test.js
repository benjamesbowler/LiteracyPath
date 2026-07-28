import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  loadTeacherAccountDecisionHistory
} from "../../src/data/teacherAccountDecisionHistory.js";

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
const adminDashboard = fs.readFileSync(
  new URL("../../src/components/AdminDashboardPage.jsx", import.meta.url),
  "utf8"
);
const sqlGate = fs.readFileSync(
  new URL("../sql/teacher_account_decision_history.sql", import.meta.url),
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

test("legacy backfill is transactional, truthful, bounded and idempotent", () => {
  assert.match(migration, /^\s*begin;/m);
  assert.match(
    migration,
    /lock table public\.pending_teacher_accounts in share row exclusive mode/
  );
  assert.match(migration, /notify pgrst, 'reload schema';\s*commit;/);
  assert.match(
    migration,
    /previous_status in \([\s\S]*'unknown'[\s\S]*'pending'/
  );
  assert.match(
    migration,
    /The summary-only legacy row does not preserve the earlier status\.[\s\S]*'unknown'/
  );
  assert.match(migration, /Legacy reason: /);
  assert.match(migration, /Legacy reason \(truncated\): /);
  assert.match(
    migration,
    /not exists \([\s\S]*teacher_account_decision_events existing[\s\S]*existing\.account_id = account\.id/
  );
});

test("event constraints enforce status-specific reason semantics", () => {
  assert.match(
    migration,
    /decision_status = 'approved'[\s\S]*reason is null[\s\S]*decision_status in \('rejected', 'disabled'\)[\s\S]*reason is not null[\s\S]*reason = btrim\(reason\)[\s\S]*char_length\(reason\) between 5 and 500/
  );
  assert.match(
    sqlGate,
    /rejected event without a reason unexpectedly succeeded/
  );
  assert.match(
    sqlGate,
    /approved event with a reason unexpectedly succeeded/
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
  assert.ok(
    setSchool.indexOf(
      "perform public.assert_current_actor_teacher_access()"
    ) < setSchool.indexOf(
      "if found and v_account.school_id is not null and not v_is_admin"
    ),
    "teacher access must be checked before the same-school early return"
  );
});

test("SQL gate exercises real roles and exact decision evidence", () => {
  assert.match(sqlGate, /set local role authenticated/);
  assert.match(sqlGate, /set local role anon/);
  assert.match(
    sqlGate,
    /ordinary teacher read administrator decision history/
  );
  assert.match(sqlGate, /anonymous role unexpectedly selected decision history/);
  assert.match(sqlGate, /first decision event was not the expected disable snapshot/);
  assert.match(sqlGate, /second decision event was not the expected approval snapshot/);
  assert.match(sqlGate, /third decision event was not the expected rejection snapshot/);
  assert.match(sqlGate, /rejected teacher reached the same-school result/);
});

test("legacy unknown status is explained without inventing an earlier state", () => {
  assert.match(adminDashboard, /Earlier status unavailable/);
  assert.doesNotMatch(adminDashboard, /Previously \$\{event\.previous_status\}[\s\S]*unknown/);
});

function createHistoryClient(pages) {
  const requestedRanges = [];
  const builder = {
    select() {
      return builder;
    },
    order() {
      return builder;
    },
    range(from, to) {
      requestedRanges.push([from, to]);
      const page = pages.shift() ?? { data: [], error: null };
      return Promise.resolve(page);
    }
  };
  return {
    requestedRanges,
    table(name) {
      assert.equal(name, "teacher_account_decision_events");
      return builder;
    }
  };
}

test("history loader proves a complete paginated read", async () => {
  const client = createHistoryClient([
    { data: [{ id: "one" }, { id: "two" }], error: null },
    { data: [{ id: "three" }], error: null }
  ]);
  const result = await loadTeacherAccountDecisionHistory({
    client,
    pageSize: 2,
    maxRows: 10
  });
  assert.equal(result.status, "complete");
  assert.equal(result.complete, true);
  assert.deepEqual(result.rows.map(row => row.id), ["one", "two", "three"]);
  assert.deepEqual(client.requestedRanges, [[0, 1], [2, 3]]);
});

test("history loader fails closed on read errors or an unproven row limit", async () => {
  const failed = await loadTeacherAccountDecisionHistory({
    client: createHistoryClient([
      { data: null, error: new Error("network unavailable") }
    ]),
    pageSize: 2,
    maxRows: 4
  });
  assert.equal(failed.status, "error");
  assert.equal(failed.complete, false);
  assert.deepEqual(failed.rows, []);

  const truncated = await loadTeacherAccountDecisionHistory({
    client: createHistoryClient([
      { data: [{ id: "one" }, { id: "two" }], error: null },
      { data: [{ id: "three" }, { id: "four" }], error: null }
    ]),
    pageSize: 2,
    maxRows: 4
  });
  assert.equal(truncated.status, "error");
  assert.equal(truncated.complete, false);
  assert.equal(truncated.truncated, true);
  assert.deepEqual(truncated.rows, []);
});
