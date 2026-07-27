import assert from "node:assert/strict";
import test from "node:test";

import {
  PROPAGATION_CONFIRMATION,
  RETENTION_CONFIRMATION,
  listDeletionPropagation,
  loadSchoolRetentionPolicy,
  normalizeRetentionPolicy,
  previewSchoolRetention,
  runSchoolRetention,
  saveSchoolRetentionPolicy,
  verifyDeletionPropagation
} from "../../src/data/schoolRetention.js";

const schoolId = "20000000-0000-4000-8000-000000000001";
const rawPolicy = {
  school_id: schoolId,
  inactive_after_days: 365,
  archived_delete_after_days: 90,
  end_of_year_action: "archive",
  academic_year_end_month: 7,
  provider_expiry_days: 30,
  backup_expiry_days: 35,
  last_end_of_year_applied: 2025
};

test("retention policy normalizes database fields without changing periods", () => {
  assert.deepEqual(normalizeRetentionPolicy(rawPolicy), {
    schoolId,
    inactiveAfterDays: 365,
    archivedDeleteAfterDays: 90,
    endOfYearAction: "archive",
    academicYearEndMonth: 7,
    providerExpiryDays: 30,
    backupExpiryDays: 35,
    lastEndOfYearApplied: 2025,
    updatedAt: null
  });
});

test("retention policy rejects unsafe periods and unsupported annual actions", () => {
  assert.throws(
    () => normalizeRetentionPolicy({ ...rawPolicy, inactive_after_days: 10 }),
    /between 90 and 2555/
  );
  assert.throws(
    () => normalizeRetentionPolicy({ ...rawPolicy, end_of_year_action: "keep" }),
    /archive or delete/
  );
});

test("policy load and save use admin-only RPC boundaries", async () => {
  const calls = [];
  const client = {
    async call(name, payload) {
      calls.push([name, payload]);
      return { data: rawPolicy, error: null };
    }
  };
  await loadSchoolRetentionPolicy({ client, schoolId });
  await saveSchoolRetentionPolicy({
    client,
    schoolId,
    policy: normalizeRetentionPolicy(rawPolicy)
  });
  assert.equal(calls[0][0], "admin_get_school_retention_policy");
  assert.equal(calls[1][0], "admin_save_school_retention_policy");
  assert.equal(calls[1][1].p_backup_expiry_days, 35);
});

test("preview requires complete non-negative candidate evidence", async () => {
  const client = {
    async call() {
      return {
        data: {
          inactiveArchiveCandidates: 2,
          archivedDeletionCandidates: 1,
          endOfYearCandidates: 0,
          pendingPropagationRecords: 3,
          propagationEvidenceDue: 1
        },
        error: null
      };
    }
  };
  const preview = await previewSchoolRetention({ client, schoolId });
  assert.equal(preview.archivedDeletionCandidates, 1);
});

test("destructive retention never calls the backend without exact confirmation", async () => {
  let called = false;
  const client = {
    async call() {
      called = true;
      return { data: {}, error: null };
    }
  };
  await assert.rejects(
    runSchoolRetention({ client, schoolId, confirmation: "apply" }),
    /Type APPLY RETENTION POLICY exactly/
  );
  assert.equal(called, false);
});

test("completed retention requires counts and a residual preview", async () => {
  const client = {
    async call(name, payload) {
      assert.equal(name, "admin_run_school_retention");
      assert.equal(payload.p_confirmation, RETENTION_CONFIRMATION);
      return {
        data: {
          archivedLearners: 2,
          deletedLearners: 1,
          deletedStudentIds: ["student-1"],
          propagationRecordsDueForEvidence: 3,
          residualPreview: {
            inactiveArchiveCandidates: 0,
            archivedDeletionCandidates: 0,
            endOfYearCandidates: 0,
            pendingPropagationRecords: 0
          }
        },
        error: null
      };
    }
  };
  const result = await runSchoolRetention({
    client,
    schoolId,
    confirmation: RETENTION_CONFIRMATION
  });
  assert.equal(result.deletedLearners, 1);
});

test("deletion propagation loads only through the admin RPC", async () => {
  const client = {
    async call(name, payload) {
      assert.equal(name, "admin_list_deletion_propagation");
      assert.equal(payload.p_school_id, schoolId);
      return { data: [{ requestId: "request-1", status: "awaiting_expiry" }], error: null };
    }
  };
  const records = await listDeletionPropagation({ client, schoolId });
  assert.equal(records.length, 1);
});

test("a date passing cannot verify provider and backup deletion without evidence", async () => {
  let called = false;
  const client = {
    async call() {
      called = true;
      return { data: {}, error: null };
    }
  };
  await assert.rejects(
    verifyDeletionPropagation({
      client,
      requestId: "request-1",
      evidenceReference: "",
      confirmation: PROPAGATION_CONFIRMATION
    }),
    /evidence reference/
  );
  assert.equal(called, false);
});

test("provider and backup verification requires evidence and exact confirmation", async () => {
  const client = {
    async call(name, payload) {
      assert.equal(name, "admin_verify_deletion_propagation");
      assert.equal(payload.p_evidence_reference, "SUPPORT-12345");
      assert.equal(payload.p_confirmation, PROPAGATION_CONFIRMATION);
      return {
        data: {
          requestId: payload.p_request_id,
          status: "expired_verified",
          evidenceReference: payload.p_evidence_reference
        },
        error: null
      };
    }
  };
  const result = await verifyDeletionPropagation({
    client,
    requestId: "request-1",
    evidenceReference: " SUPPORT-12345 ",
    confirmation: PROPAGATION_CONFIRMATION
  });
  assert.equal(result.status, "expired_verified");
});
