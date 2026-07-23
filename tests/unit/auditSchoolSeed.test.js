import assert from "node:assert/strict";
import test from "node:test";

import {
  inspectAuditSeed,
  isApprovedAuditDatabaseUrl,
  renderAuditSeed
} from "../../tools/seedAuditSchool.mjs";
import { verifyAuditSchoolLive } from "../../tools/verifyAuditSchoolLive.mjs";

test("canonical audit seed satisfies every deterministic fixture count", () => {
  const result = inspectAuditSeed();
  assert.deepEqual(result.failures, []);
  assert.equal(result.learnerIds, 26);
  assert.equal(result.teacherIds, 2);
  assert.equal(result.classIds, 2);
  assert.equal(result.highVolumeAttempts, 520);
});

test("audit seed renderer replaces secrets in memory and escapes SQL literals", () => {
  const sql = renderAuditSeed({
    password: "audit'password-123",
    anchor: "2026-01-02T03:04:05.000Z",
    sql: "select '__AUDIT_PASSWORD__', '__AUDIT_ANCHOR__';"
  });
  assert.equal(sql, "select 'audit''password-123', '2026-01-02T03:04:05.000Z';");
  assert.throws(
    () => renderAuditSeed({ password: "too-short", sql: "" }),
    /at least 12 characters/
  );
  assert.throws(
    () => renderAuditSeed({ password: "long-enough-password", anchor: "not-a-date", sql: "" }),
    /valid date/
  );
});

test("audit database guard allows local PostgreSQL and rejects unsafe targets", () => {
  assert.deepEqual(
    isApprovedAuditDatabaseUrl("postgresql://postgres:test@127.0.0.1:54322/postgres"),
    { approved: true, local: true, hostname: "127.0.0.1" }
  );
  assert.equal(
    isApprovedAuditDatabaseUrl("https://localhost/database").approved,
    false
  );
  assert.equal(
    isApprovedAuditDatabaseUrl("postgresql://example.com/postgres").approved,
    false
  );
  assert.equal(
    isApprovedAuditDatabaseUrl("postgresql://example.com/postgres", {
      LP_AUDIT_ALLOW_REMOTE_TEST_PROJECT: "I_UNDERSTAND_TEST_ONLY",
      LP_AUDIT_PROJECT_LABEL: "production"
    }).approved,
    false
  );
  assert.deepEqual(
    isApprovedAuditDatabaseUrl("postgresql://example.com/postgres", {
      LP_AUDIT_ALLOW_REMOTE_TEST_PROJECT: "I_UNDERSTAND_TEST_ONLY",
      LP_AUDIT_PROJECT_LABEL: "literacypath-e2e-test"
    }),
    {
      approved: true,
      local: false,
      hostname: "example.com",
      label: "literacypath-e2e-test"
    }
  );
});

test("live audit gate refuses to run without explicit non-production credentials", async () => {
  await assert.rejects(
    verifyAuditSchoolLive({}),
    /LP_AUDIT_SUPABASE_URL/
  );
});
