import assert from "node:assert/strict";
import test from "node:test";

import {
  RECOVERY_TABLES,
  compareRecoverySnapshots,
  parseDatabaseIdentity,
  validateRecoveryTargets
} from "../../tools/recoveryDrill.mjs";

test("recovery target must be a separately named isolated drill database", () => {
  assert.throws(() => validateRecoveryTargets({
    sourceUrl: "postgresql://reader:secret@db.internal/literacypath",
    targetUrl: "postgresql://reader:secret@db.internal/literacypath",
    targetMarker: "literacypath",
    confirmation: "RESTORE:literacypath"
  }), /different databases/);
  assert.throws(() => validateRecoveryTargets({
    sourceUrl: "postgresql://reader:secret@db.internal/literacypath",
    targetUrl: "postgresql://reader:secret@db.internal/literacypath_copy",
    targetMarker: "literacypath_copy",
    confirmation: "RESTORE:literacypath_copy"
  }), /restore-drill or recovery-drill/);

  const result = validateRecoveryTargets({
    sourceUrl: "postgresql://reader:secret@db.internal/literacypath",
    targetUrl: "postgresql://restorer:other@isolated.internal/literacypath_restore-drill",
    targetMarker: "literacypath_restore-drill",
    confirmation: "RESTORE:literacypath_restore-drill"
  });
  assert.equal(result.target.database, "literacypath_restore-drill");
});

test("recovery confirmation and target marker must exactly match the target", () => {
  const input = {
    sourceUrl: "postgresql://db.internal/source",
    targetUrl: "postgresql://isolated.internal/literacypath_recovery-drill",
    targetMarker: "wrong",
    confirmation: "RESTORE:literacypath_recovery-drill"
  };
  assert.throws(() => validateRecoveryTargets(input), /TARGET_MARKER/);
  assert.throws(() => validateRecoveryTargets({
    ...input,
    targetMarker: "literacypath_recovery-drill",
    confirmation: "yes"
  }), /LP_RECOVERY_DRILL_CONFIRM/);
});

test("database identity parsing never returns credentials", () => {
  const parsed = parseDatabaseIdentity(
    "postgresql://sensitive-user:sensitive-password@db.internal:6543/literacypath"
  );
  assert.deepEqual(parsed, {
    protocol: "postgresql:",
    hostname: "db.internal",
    port: "6543",
    database: "literacypath"
  });
  assert.equal(JSON.stringify(parsed).includes("sensitive"), false);
});

test("recovery comparison requires exact counts and fingerprints for every protected table", () => {
  const snapshot = Object.fromEntries(RECOVERY_TABLES.map((table, index) => [
    table,
    { rows: index + 1, fingerprint: String(index).padStart(64, "0") }
  ]));
  assert.deepEqual(compareRecoverySnapshots(snapshot, structuredClone(snapshot)), {
    ok: true,
    mismatches: []
  });

  const changed = structuredClone(snapshot);
  changed.assessment_attempts.rows += 1;
  changed.el_assessment_reports.fingerprint = "f".repeat(64);
  const comparison = compareRecoverySnapshots(snapshot, changed);
  assert.equal(comparison.ok, false);
  assert.match(comparison.mismatches.join(" "), /assessment_attempts/);
  assert.match(comparison.mismatches.join(" "), /el_assessment_reports/);
});
