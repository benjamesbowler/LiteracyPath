import assert from "node:assert/strict";
import test from "node:test";

import {
  auditTeacherTablePolicies,
  resolveLivePolicies
} from "../../tools/databasePolicyContract.mjs";

/**
 * WHY THIS EXISTS.
 *
 * 20260728100000_teacher_account_status_rls.sql established that every
 * teacher-facing table gates on public.current_actor_has_teacher_access(), so a
 * rejected or disabled account loses access the moment the decision is made
 * rather than whenever its token happens to expire.
 *
 * Four tables created after it missed the gate — reading_sessions and the three
 * MLL tables — and checked only `teacher_id = auth.uid()`. All four hold direct
 * table grants to `authenticated`, so those policies were the entire boundary.
 * The existing drift guard did not catch it because it only inspects SECURITY
 * DEFINER functions named `teacher_*`; tables were never in scope.
 *
 * WHY IT IS A TEST AND NOT A MIGRATION GUARD. The first attempt was a DO block
 * in 20260807100000 that raised if any browser-reachable table had a policy
 * mentioning auth.uid() without the gate. Run against a real PostgreSQL it
 * flagged sixteen tables and aborted the migration — `is_app_admin(auth.uid())`
 * contains `auth.uid()`, so every admin policy matched. A check that can halt a
 * production deploy on a false positive is worse than no check. Here it fails in
 * CI instead, where a human reads it and nothing is broken meanwhile.
 */

test("every teacher-owned table policy gates on the account approval check", () => {
  const report = auditTeacherTablePolicies();
  assert.deepEqual(report.failures, []);

  // Cross-checked against a real PostgreSQL with all migrations applied, via
  // tools/db/checkTeacherGateDrift.mjs: PGlite reports exactly 27 gated
  // policies over the same 23 tables. The counts agreeing is what proves this
  // source-text audit is reading the schema correctly rather than approximately.
  assert.equal(report.teacherPolicyCount, 27);
  assert.equal(report.teacherTables.length, 23);
});

test("the four tables that were found ungated are covered by name", () => {
  // Named individually so that deleting one of these policies is a test failure
  // rather than a silently smaller count.
  const { teacherTables } = auditTeacherTablePolicies();
  for (const table of [
    "reading_sessions",
    "mll_language_assessments",
    "mll_exit_criteria",
    "mll_family_contacts"
  ]) {
    assert.ok(teacherTables.includes(table), `${table} lost its teacher policy`);
  }

  // reading_sessions splits into four single-command policies, and every one of
  // them has to carry the gate — a read-only leak is still a leak.
  const readingSessionPolicies = resolveLivePolicies()
    .filter(policy => policy.table === "reading_sessions");
  assert.equal(readingSessionPolicies.length, 4);
  for (const policy of readingSessionPolicies) {
    assert.match(policy.body, /current_actor_has_teacher_access/);
  }
});

test("the audit fails when a teacher policy loses its gate", () => {
  // A guard nobody has watched fail is a guard nobody knows works. This feeds
  // the auditor a policy with the gate stripped out and asserts it complains.
  const report = auditTeacherTablePolicies({
    files: ["0001_fake.sql"],
    read: () => `
      create policy "Teachers manage owned students"
        on public.students for all to authenticated
        using (teacher_id = auth.uid());
    `
  });

  assert.equal(report.failures.length, 1);
  assert.match(report.failures[0], /Teachers manage owned students/);
  assert.match(report.failures[0], /rejected or disabled teacher/);
});

test("admin and public policies are not treated as teacher surfaces", () => {
  // The false positive that made the migration-time version unshippable.
  const report = auditTeacherTablePolicies({
    files: ["0001_fake.sql"],
    read: () => `
      create policy "App admins manage all students"
        on public.students for all to authenticated
        using (is_app_admin(auth.uid()));
      create policy "Anyone can read app config"
        on public.app_config for select to anon, authenticated
        using (true);
    `
  });

  assert.deepEqual(report.failures, []);
  assert.equal(report.teacherPolicyCount, 0);
});

test("a dropped policy is not counted as live", () => {
  // Policies are recreated across migrations; reading one file in isolation
  // would report a policy that no longer exists.
  const files = { "0001_a.sql": "", "0002_b.sql": "" };
  files["0001_a.sql"] = `
    create policy "Teachers read old thing"
      on public.legacy for select to authenticated
      using (teacher_id = auth.uid());
  `;
  files["0002_b.sql"] = `drop policy if exists "Teachers read old thing" on public.legacy;`;

  const report = auditTeacherTablePolicies({
    files: ["0001_a.sql", "0002_b.sql"],
    read: file => files[file]
  });

  assert.deepEqual(report.failures, []);
  assert.equal(report.totalPolicyCount, 0);
});
