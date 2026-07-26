import assert from "node:assert/strict";
import test from "node:test";

import {
  LEARNER_DELETION_CONFIRMATION,
  buildLearnerDataDownload,
  deleteLearnerData,
  exportLearnerData,
  isLearnerDataRightsVerificationComplete,
  loadLearnerDataRightsHistory,
  prepareLearnerDeletion
} from "../../src/data/learnerDataRights.js";

const studentId = "40000000-0000-4000-8000-000000000099";
const subjectRef = "a".repeat(64);

test("verified privacy actions do not depend on request-history availability", () => {
  assert.equal(isLearnerDataRightsVerificationComplete({
    requesterRole: "school",
    verificationMethod: "authorised_school_official"
  }), true);
  assert.equal(isLearnerDataRightsVerificationComplete({
    requesterRole: "school",
    verificationMethod: ""
  }), false);
});

test("verified export uses the owned learner RPC and requires request evidence", async () => {
  const calls = [];
  const client = {
    async call(name, payload) {
      calls.push([name, payload]);
      return {
        data: {
          schemaVersion: 1,
          request: {
            id: "request-export",
            subjectRef,
            completedAt: "2026-07-25T12:00:00.000Z"
          },
          learner: { id: studentId, displayName: "Reader" },
          answers: []
        },
        error: null
      };
    }
  };

  const data = await exportLearnerData({
    client,
    studentId,
    requesterRole: "parent_guardian",
    verificationMethod: "verified_parent_via_school"
  });
  assert.equal(data.request.id, "request-export");
  assert.deepEqual(calls, [[
    "teacher_export_learner_data",
    {
      p_student_id: studentId,
      p_requester_role: "parent_guardian",
      p_verification_method: "verified_parent_via_school"
    }
  ]]);
});

test("deletion must be prepared and confirmed exactly before the destructive RPC", async () => {
  const calls = [];
  const client = {
    async call(name, payload) {
      calls.push([name, payload]);
      if (name === "teacher_prepare_learner_deletion") {
        return {
          data: {
            requestId: "request-delete",
            subjectRef,
            status: "in_progress",
            dueAt: "2026-08-24T12:00:00.000Z",
            confirmationPhrase: LEARNER_DELETION_CONFIRMATION
          },
          error: null
        };
      }
      return {
        data: {
          requestId: "request-delete",
          subjectRef,
          status: "completed",
          residualManagedRecords: 0,
          deletedCounts: { answers: 2 }
        },
        error: null
      };
    }
  };

  const preparedRequest = await prepareLearnerDeletion({
    client,
    studentId,
    requesterRole: "school",
    verificationMethod: "authorised_school_official"
  });
  await assert.rejects(
    deleteLearnerData({
      client,
      studentId,
      preparedRequest,
      confirmation: "delete"
    }),
    /Type DELETE LEARNER DATA exactly/
  );

  const result = await deleteLearnerData({
    client,
    studentId,
    preparedRequest,
    confirmation: LEARNER_DELETION_CONFIRMATION
  });
  assert.equal(result.residualManagedRecords, 0);
  assert.deepEqual(calls.map(([name]) => name), [
    "teacher_prepare_learner_deletion",
    "teacher_delete_learner_data"
  ]);
});

test("deletion rejects a backend response that cannot prove zero residual records", async () => {
  const client = {
    async call() {
      return {
        data: {
          requestId: "request-delete",
          subjectRef,
          status: "completed",
          residualManagedRecords: 1
        },
        error: null
      };
    }
  };
  await assert.rejects(
    deleteLearnerData({
      client,
      studentId,
      preparedRequest: { requestId: "request-delete", subjectRef },
      confirmation: LEARNER_DELETION_CONFIRMATION
    }),
    /did not prove/
  );
});

test("request history is loaded through an owned learner RPC", async () => {
  const calls = [];
  const client = {
    async call(name, payload) {
      calls.push([name, payload]);
      return {
        data: {
          subjectRef,
          requests: [{
            id: "request-export",
            requestType: "access_export",
            status: "completed"
          }]
        },
        error: null
      };
    }
  };
  const result = await loadLearnerDataRightsHistory({ client, studentId });
  assert.equal(result.requests.length, 1);
  assert.deepEqual(calls, [[
    "teacher_list_learner_data_rights",
    { p_student_id: studentId }
  ]]);
});

test("request history fails closed on malformed audit evidence", async () => {
  const client = {
    async call() {
      return { data: { subjectRef: "not-a-hash", requests: [] }, error: null };
    }
  };
  await assert.rejects(
    loadLearnerDataRightsHistory({ client, studentId }),
    /invalid response/
  );
});

test("request inputs fail closed before any backend call", async () => {
  let called = false;
  const client = {
    async call() {
      called = true;
      return { data: {}, error: null };
    }
  };
  await assert.rejects(
    exportLearnerData({
      client,
      studentId,
      requesterRole: "",
      verificationMethod: "school_record_match"
    }),
    /Choose who made/
  );
  assert.equal(called, false);
});

test("download is deterministic, readable JSON, and uses a safe filename", () => {
  const data = {
    schemaVersion: 1,
    request: {
      id: "request-export",
      completedAt: "2026-07-25T12:00:00.000Z"
    },
    sessionHistory: [{ createdAt: "2026-07-25T10:00:00.000Z", revoked: true }]
  };
  const download = buildLearnerDataDownload(data, "A Reader / 2026");
  assert.equal(download.fileName, "literacypath-a-reader-2026-data-2026-07-25.json");
  assert.equal(download.mimeType, "application/json");
  assert.deepEqual(JSON.parse(download.text), data);
  assert.doesNotMatch(download.text, /token|device_id/i);
});
