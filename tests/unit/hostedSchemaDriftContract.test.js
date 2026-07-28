import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  AUTHENTICATED_TABLE_PRIVILEGES,
  HOSTED_DRIFT_POLICIES,
  HOSTED_ONLY_TABLES,
  TABLE_PRIVILEGES,
  auditHostedSchemaDriftCatalog,
  auditHostedSchemaDriftSource
} from "../../tools/hostedSchemaDriftContract.mjs";

function tableRow(tableName, authenticatedPrivileges = []) {
  const row = { table_name: tableName };
  for (const privilege of TABLE_PRIVILEGES) {
    const key = privilege.toLowerCase();
    row[`anon_${key}`] = false;
    row[`authenticated_${key}`] = authenticatedPrivileges.includes(privilege);
  }
  return row;
}

function validCatalog() {
  return {
    tables: [
      ...Object.entries(AUTHENTICATED_TABLE_PRIVILEGES)
        .map(([table, privileges]) => tableRow(table, privileges)),
      ...HOSTED_ONLY_TABLES.map(table => tableRow(table))
    ],
    policies: [],
    allFunctions: [{
      signature: "teacher_create_demo_class()",
      public_execute: false,
      anon_execute: false,
      authenticated_execute: true
    }],
    sequences: [{
      sequence_name: "data_rights_audit_events_id_seq",
      anon_select: false,
      anon_usage: false,
      anon_update: false,
      authenticated_select: false,
      authenticated_usage: false,
      authenticated_update: false
    }]
  };
}

test("hosted-schema cleanup removes every known bypass and preserves retained tables", () => {
  const report = auditHostedSchemaDriftSource();
  assert.deepEqual(report.failures, []);
  assert.equal(report.historicalPolicyCount, 49);
  assert.equal(report.retainedTableCount, 4);
  assert.equal(report.exactGrantTableCount, 16);
});

test("hosted-schema cleanup contains no row or table deletion", () => {
  const source = fs.readFileSync(
    new URL(
      "../../supabase/migrations/20260728129000_hosted_schema_drift_cleanup.sql",
      import.meta.url
    ),
    "utf8"
  );
  assert.doesNotMatch(source, /\bdrop\s+table\b|\bdelete\s+from\b|\btruncate\s+(?:table\s+)?public\./i);
  assert.equal(HOSTED_DRIFT_POLICIES.length, 49);
});

test("live hosted-drift catalogue accepts locked retained data and exact grants", () => {
  const report = auditHostedSchemaDriftCatalog(validCatalog());
  assert.deepEqual(report.failures, []);
  assert.equal(report.retainedHostedTablesPresent, 4);
  assert.equal(report.exactGrantTableCount, 16);
});

test("live hosted-drift catalogue rejects a historical permissive policy", () => {
  const catalog = validCatalog();
  catalog.policies.push({
    table_name: "answers",
    policy_name: "Teachers can read own answers"
  });
  assert.match(
    auditHostedSchemaDriftCatalog(catalog).failures.join("\n"),
    /historical permissive policy remains/
  );
});

test("live hosted-drift catalogue rejects retained-table and canonical grant drift", () => {
  const catalog = validCatalog();
  catalog.tables.find(row => row.table_name === "question_flags").authenticated_select = true;
  catalog.tables.find(row => row.table_name === "answers").authenticated_delete = true;
  const failures = auditHostedSchemaDriftCatalog(catalog).failures.join("\n");
  assert.match(failures, /question_flags: retained hosted-only table is browser-accessible/);
  assert.match(failures, /answers: authenticated privileges are .*DELETE/);
});

test("live hosted-drift catalogue rejects obsolete helpers and browser sequence access", () => {
  const catalog = validCatalog();
  catalog.allFunctions.push({
    signature: "is_app_admin()",
    public_execute: false,
    anon_execute: false,
    authenticated_execute: false
  });
  catalog.allFunctions[0].anon_execute = true;
  catalog.sequences[0].authenticated_usage = true;
  const failures = auditHostedSchemaDriftCatalog(catalog).failures.join("\n");
  assert.match(failures, /obsolete hosted-only function still exists: is_app_admin\(\)/);
  assert.match(failures, /teacher_create_demo_class\(\): anonymous execution is still allowed/);
  assert.match(failures, /data_rights_audit_events_id_seq: browser access remains/);
});
