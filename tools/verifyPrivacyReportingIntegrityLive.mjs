#!/usr/bin/env node
/**
 * Prove the privacy/reporting-integrity migration is present in the linked
 * hosted database. Source and local SQL tests cannot establish deployment.
 *
 * Usage:
 *   node tools/verifyPrivacyReportingIntegrityLive.mjs
 *
 * The check uses SUPABASE_DB_URL when supplied; otherwise it uses the Supabase
 * project linked to this checkout. It never prints a database URL.
 */

import { spawnSync } from "node:child_process";

const REQUIRED_MIGRATION = "20260728124000";
const dbUrl = String(
  process.env.SUPABASE_DB_URL
  || process.env.DATABASE_URL
  || ""
).trim();
const connectionArgs = dbUrl
  ? ["--db-url", dbUrl]
  : ["--linked"];
const targetLabel = dbUrl ? "configured database" : "linked hosted database";

const result = spawnSync(
  "supabase",
  ["migration", "list", ...connectionArgs],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      SUPABASE_TELEMETRY_DISABLED: "1"
    },
    timeout: 60_000
  }
);

if (result.error) {
  console.error(
    `Live privacy/reporting migration check is INCONCLUSIVE: ${
      result.error.message || "Supabase CLI could not start"
    }`
  );
  process.exit(2);
}

const output = `${result.stdout || ""}\n${result.stderr || ""}`;
if (result.status !== 0) {
  const reason = /cannot find project ref/i.test(output)
    ? "this checkout is not linked and SUPABASE_DB_URL was not supplied"
    : "the remote migration list could not be read";
  console.error(
    `Live privacy/reporting migration check is INCONCLUSIVE: ${reason}.`
  );
  process.exit(2);
}

const appliedPattern = new RegExp(
  `^\\s*${REQUIRED_MIGRATION}\\s*\\|\\s*${REQUIRED_MIGRATION}\\s*\\|`,
  "m"
);
const migrationRows = (() => {
  try {
    const payload = JSON.parse(String(result.stdout || "").trim());
    return Array.isArray(payload?.migrations) ? payload.migrations : [];
  } catch {
    return [];
  }
})();
const appliedInStructuredOutput = migrationRows.some(migration =>
  String(migration?.local || "") === REQUIRED_MIGRATION
  && String(migration?.remote || "") === REQUIRED_MIGRATION
);

if (!appliedInStructuredOutput && !appliedPattern.test(output)) {
  console.error(
    `Live privacy/reporting migration check failed: ${REQUIRED_MIGRATION} `
      + `is not recorded on the ${targetLabel}.`
  );
  process.exit(1);
}

console.log(
  `Live privacy/reporting migration check passed: ${REQUIRED_MIGRATION} `
    + `is recorded locally and on the ${targetLabel}.`
);
