export const DATA_RIGHTS_RESPONSE_TARGET_DAYS = 30;
export const LEARNER_DELETION_CONFIRMATION = "DELETE LEARNER DATA";
export const PENDING_LEARNER_DELETION_PREFIX = "lp-pending-learner-deletion:v1:";
export const LEARNER_LOCAL_CLEANUP_PROOF_STORES = Object.freeze([
  "assessment_attempts",
  "assessment_write_queue",
  "el_benchmark_drafts",
  "el_reports",
  "guided_reading_assessment",
  "manual_assessment_drafts",
  "maths_evidence_queue",
  "progress",
  "student_session",
  "teacher_profile"
]);

export const DATA_RIGHTS_REQUESTER_ROLES = Object.freeze([
  Object.freeze({ value: "school", label: "School or district" }),
  Object.freeze({ value: "parent_guardian", label: "Parent or guardian through the school" }),
  Object.freeze({ value: "learner", label: "Student through the school" })
]);

export const DATA_RIGHTS_VERIFICATION_METHODS = Object.freeze([
  Object.freeze({
    value: "school_record_match",
    label: "Matched against the school record"
  }),
  Object.freeze({
    value: "verified_parent_via_school",
    label: "Parent or guardian verified by the school"
  }),
  Object.freeze({
    value: "authorised_school_official",
    label: "Authorised school official"
  })
]);

export function isLearnerDataRightsVerificationComplete({
  requesterRole,
  verificationMethod
}) {
  return DATA_RIGHTS_REQUESTER_ROLES.some(option => option.value === requesterRole)
    && DATA_RIGHTS_VERIFICATION_METHODS.some(option => option.value === verificationMethod);
}

function assertClient(client) {
  if (!client?.call) {
    throw new Error("The managed data-rights service is unavailable.");
  }
}

function assertLearnerId(studentId) {
  if (!String(studentId || "").trim()) {
    throw new Error("Select a learner before using the data-rights workflow.");
  }
}

function assertRequestInputs({ requesterRole, verificationMethod }) {
  if (!DATA_RIGHTS_REQUESTER_ROLES.some(option => option.value === requesterRole)) {
    throw new Error("Choose who made the request.");
  }
  if (!DATA_RIGHTS_VERIFICATION_METHODS.some(option => option.value === verificationMethod)) {
    throw new Error("Record how identity and authority were verified.");
  }
}

/**
 * Carry the database's own failure code up to the caller.
 *
 * This used to throw a bare `new Error(message)`, which discarded `code`. The
 * consequence was not cosmetic: `describeRosterOperationError` branches on
 * `PGRST202` to say "the database is missing a pending update", so with the
 * code stripped every missing-function failure fell through to the last-resort
 * branch and a teacher was shown raw PostgREST schema-cache text. Preserving
 * the code is what makes the plain-English branch reachable at all.
 */
function rpcError(source, fallbackMessage) {
  const error = new Error(source?.message || fallbackMessage);
  if (source?.code) error.code = source.code;
  if (source?.details) error.details = source.details;
  if (source?.hint) error.hint = source.hint;
  error.cause = source;
  return error;
}

function unwrapRpc(result, operation) {
  if (result?.error) {
    throw rpcError(result.error, `${operation} failed.`);
  }
  if (!result?.data || typeof result.data !== "object") {
    throw new Error(`${operation} returned an invalid response.`);
  }
  return result.data;
}

function deletionStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function pendingDeletionKey(requestId) {
  return `${PENDING_LEARNER_DELETION_PREFIX}${requestId}`;
}

function sameStringSet(actual = [], expected = []) {
  if (!Array.isArray(actual)) return false;
  const normalized = [...new Set(actual.map(value => String(value || "")))].sort();
  const required = [...new Set(expected.map(value => String(value || "")))].sort();
  return JSON.stringify(normalized) === JSON.stringify(required);
}

export function buildLearnerLocalCleanupProof({
  preparedRequest,
  studentId,
  progressCleanup,
  evidenceCleanup,
  checkedAt = new Date().toISOString()
} = {}) {
  if (!preparedRequest?.subjectRef || !String(studentId || "").trim()) {
    throw new Error("A tracked learner and deletion request are required for local cleanup proof.");
  }
  if (
    progressCleanup?.storageAvailable !== true
    || Number(progressCleanup?.residualCount) !== 0
    || (progressCleanup?.residuals || []).length !== 0
  ) {
    const error = new Error("The progress cache has not been cleared and verified.");
    error.code = "LP_LOCAL_CLEANUP_INCOMPLETE";
    throw error;
  }
  const evidenceStores = LEARNER_LOCAL_CLEANUP_PROOF_STORES
    .filter(store => store !== "progress");
  if (
    evidenceCleanup?.storageAvailable !== true
    || Number(evidenceCleanup?.residualCount) !== 0
    || !sameStringSet(evidenceCleanup?.storesChecked, evidenceStores)
  ) {
    const error = new Error("The assessment and profile caches have not been cleared and verified.");
    error.code = "LP_LOCAL_CLEANUP_INCOMPLETE";
    throw error;
  }
  const checkedTimestamp = Date.parse(checkedAt);
  if (!Number.isFinite(checkedTimestamp)) {
    throw new Error("The local cleanup proof needs a valid check time.");
  }

  return Object.freeze({
    schemaVersion: 1,
    subjectRef: String(preparedRequest.subjectRef),
    studentId: String(studentId),
    checkedAt: new Date(checkedTimestamp).toISOString(),
    storageAvailable: true,
    residualCount: 0,
    storesChecked: [...LEARNER_LOCAL_CLEANUP_PROOF_STORES]
  });
}

export function isValidLearnerLocalCleanupProof(
  proof,
  { preparedRequest, studentId } = {}
) {
  return Boolean(
    proof?.schemaVersion === 1
    && proof?.subjectRef === preparedRequest?.subjectRef
    && proof?.studentId === String(studentId || "")
    && proof?.storageAvailable === true
    && Number(proof?.residualCount) === 0
    && Number.isFinite(Date.parse(proof?.checkedAt || ""))
    && sameStringSet(
      proof?.storesChecked,
      LEARNER_LOCAL_CLEANUP_PROOF_STORES
    )
  );
}

function writePendingLearnerDeletion(record, storage) {
  const target = deletionStorage(storage);
  if (!target) {
    if (typeof window === "undefined") return false;
    throw new Error("Browser storage is required before permanent deletion can start.");
  }
  try {
    target.setItem(
      pendingDeletionKey(record.requestId),
      JSON.stringify({
        schemaVersion: 1,
        requestId: record.requestId,
        subjectRef: record.subjectRef,
        studentId: record.studentId,
        studentName: record.studentName || "",
        accountId: record.accountId || "",
        phase: record.phase || "prepared",
        updatedAt: new Date().toISOString()
      })
    );
    const verified = JSON.parse(
      target.getItem(pendingDeletionKey(record.requestId)) || "null"
    );
    if (
      verified?.requestId !== record.requestId
      || verified?.subjectRef !== record.subjectRef
      || verified?.studentId !== record.studentId
    ) {
      throw new Error("The deletion continuation marker could not be verified.");
    }
    return true;
  } catch (error) {
    const markerError = new Error(
      "This browser cannot safely retain the deletion step. Enable site storage and try again."
    );
    markerError.code = "LP_DELETION_MARKER_UNAVAILABLE";
    markerError.cause = error;
    throw markerError;
  }
}

export function listPendingLearnerDeletions({ accountId = "", storage } = {}) {
  const target = deletionStorage(storage);
  if (!target) return [];
  const rows = [];
  try {
    for (let index = 0; index < Number(target.length || 0); index += 1) {
      const key = target.key(index);
      if (!key?.startsWith(PENDING_LEARNER_DELETION_PREFIX)) continue;
      const row = JSON.parse(target.getItem(key) || "null");
      if (!row?.requestId || !row?.subjectRef || !row?.studentId) continue;
      if (accountId && row.accountId && row.accountId !== accountId) continue;
      rows.push(row);
    }
  } catch {
    return [];
  }
  return rows.sort((left, right) => (
    String(left.updatedAt || "").localeCompare(String(right.updatedAt || ""))
  ));
}

export function findPendingLearnerDeletion({
  accountId = "",
  studentId,
  storage
} = {}) {
  return listPendingLearnerDeletions({ accountId, storage })
    .find(row => String(row.studentId) === String(studentId)) || null;
}

export function clearPendingLearnerDeletion(requestId, { storage } = {}) {
  const target = deletionStorage(storage);
  if (!target || !requestId) return false;
  try {
    target.removeItem(pendingDeletionKey(requestId));
    return target.getItem(pendingDeletionKey(requestId)) === null;
  } catch {
    return false;
  }
}

export async function exportLearnerData({
  client,
  studentId,
  requesterRole,
  verificationMethod
}) {
  assertClient(client);
  assertLearnerId(studentId);
  assertRequestInputs({ requesterRole, verificationMethod });
  const result = await client.call("teacher_export_learner_data", {
    p_student_id: studentId,
    p_requester_role: requesterRole,
    p_verification_method: verificationMethod
  });
  const data = unwrapRpc(result, "Learner data export");
  if (data.schemaVersion !== 1 || !data.request?.id || !data.request?.subjectRef) {
    throw new Error("Learner data export omitted its request evidence.");
  }
  return data;
}

export async function loadLearnerDataRightsHistory({ client, studentId }) {
  assertClient(client);
  assertLearnerId(studentId);
  const result = await client.call("teacher_list_learner_data_rights", {
    p_student_id: studentId
  });
  const data = unwrapRpc(result, "Learner data-rights history");
  if (
    !/^[0-9a-f]{64}$/.test(String(data.subjectRef || ""))
    || !Array.isArray(data.requests)
  ) {
    throw new Error("Learner data-rights history returned an invalid response.");
  }
  return data;
}

export async function prepareLearnerDeletion({
  client,
  studentId,
  requesterRole,
  verificationMethod
}) {
  assertClient(client);
  assertLearnerId(studentId);
  assertRequestInputs({ requesterRole, verificationMethod });
  const result = await client.call("teacher_prepare_learner_deletion", {
    p_student_id: studentId,
    p_requester_role: requesterRole,
    p_verification_method: verificationMethod
  });
  const data = unwrapRpc(result, "Learner deletion request");
  if (
    !data.requestId
    || !/^[0-9a-f]{64}$/.test(String(data.subjectRef || ""))
    || data.confirmationPhrase !== LEARNER_DELETION_CONFIRMATION
  ) {
    throw new Error("Learner deletion request omitted its verification evidence.");
  }
  return data;
}

export async function deleteLearnerData({
  client,
  studentId,
  preparedRequest,
  confirmation,
  studentName = "",
  accountId = "",
  storage
}) {
  assertClient(client);
  assertLearnerId(studentId);
  if (!preparedRequest?.requestId || !preparedRequest?.subjectRef) {
    throw new Error("Prepare and verify the deletion request first.");
  }
  if (confirmation !== LEARNER_DELETION_CONFIRMATION) {
    throw new Error(`Type ${LEARNER_DELETION_CONFIRMATION} exactly.`);
  }
  writePendingLearnerDeletion({
    requestId: preparedRequest.requestId,
    subjectRef: preparedRequest.subjectRef,
    studentId,
    studentName,
    accountId,
    phase: "prepared"
  }, storage);

  const result = await client.call("teacher_delete_learner_data_staged", {
    p_request_id: preparedRequest.requestId,
    p_student_id: studentId,
    p_subject_ref: preparedRequest.subjectRef,
    p_confirmation: confirmation
  });
  let data;
  if (result?.error) {
    // The HTTP response can be lost after PostgreSQL commits. Ask the tracked
    // request before deciding whether the deletion failed; never retry a
    // destructive phase blindly or discard its continuation marker.
    try {
      const status = await loadLearnerDeletionStatus({
        client,
        preparedRequest
      });
      if (status.databaseDeleted && status.residualManagedRecords === 0) {
        data = status;
      } else {
        throw rpcError(result.error, "Learner data deletion failed.");
      }
    } catch {
      throw rpcError(result.error, "Learner data deletion failed.");
    }
  } else {
    data = unwrapRpc(result, "Learner data deletion");
  }
  if (
    !["awaiting_local_cleanup", "completed"].includes(data.status)
    || data.subjectRef !== preparedRequest.subjectRef
    || data.residualManagedRecords !== 0
  ) {
    throw new Error("Learner deletion did not prove that managed records were removed.");
  }
  writePendingLearnerDeletion({
    requestId: preparedRequest.requestId,
    subjectRef: preparedRequest.subjectRef,
    studentId,
    studentName,
    accountId,
    phase: data.status === "completed" ? "completed" : "database_deleted"
  }, storage);
  return data;
}

export async function loadLearnerDeletionStatus({
  client,
  preparedRequest
}) {
  assertClient(client);
  if (!preparedRequest?.requestId || !preparedRequest?.subjectRef) {
    throw new Error("A tracked deletion request is required.");
  }
  const result = await client.call("teacher_get_learner_deletion_status", {
    p_request_id: preparedRequest.requestId,
    p_subject_ref: preparedRequest.subjectRef
  });
  const data = unwrapRpc(result, "Learner deletion status");
  if (
    data.requestId !== preparedRequest.requestId
    || data.subjectRef !== preparedRequest.subjectRef
    || !["in_progress", "awaiting_local_cleanup", "completed"].includes(data.status)
  ) {
    throw new Error("Learner deletion status returned an invalid response.");
  }
  return data;
}

export async function completeLearnerDeletion({
  client,
  preparedRequest,
  localCleanupProof,
  storage
}) {
  assertClient(client);
  if (!preparedRequest?.requestId || !preparedRequest?.subjectRef) {
    throw new Error("A tracked deletion request is required.");
  }
  if (!isValidLearnerLocalCleanupProof(localCleanupProof, {
    preparedRequest,
    studentId: localCleanupProof?.studentId
  })) {
    const error = new Error(
      "Verified browser-local cleanup evidence is required before completing deletion."
    );
    error.code = "LP_LOCAL_CLEANUP_PROOF_REQUIRED";
    throw error;
  }
  const result = await client.call("teacher_complete_learner_deletion", {
    p_request_id: preparedRequest.requestId,
    p_subject_ref: preparedRequest.subjectRef,
    p_cleanup_proof: localCleanupProof
  });
  const data = unwrapRpc(result, "Learner deletion completion");
  if (
    data.status !== "completed"
    || data.requestId !== preparedRequest.requestId
    || data.subjectRef !== preparedRequest.subjectRef
    || data.residualManagedRecords !== 0
  ) {
    throw new Error("Learner deletion completion could not be verified.");
  }
  const targetStorage = deletionStorage(storage);
  if (
    targetStorage
    && !clearPendingLearnerDeletion(preparedRequest.requestId, { storage: targetStorage })
  ) {
    const error = new Error(
      "The deletion completed, but this browser could not remove its privacy continuation marker."
    );
    error.code = "LP_DELETION_MARKER_CLEANUP_FAILED";
    throw error;
  }
  return data;
}

/**
 * Finish browser-local cleanup after a reload, power loss, or lost completion
 * response. A prepared-only request is intentionally left alone: it can still
 * be continued from the learner's roster row, while a database-deleted learner
 * no longer has a row and therefore needs this account-level recovery pass.
 */
export async function resumePendingLearnerDeletions({
  client,
  accountId = "",
  cleanup,
  storage
}) {
  assertClient(client);
  if (typeof cleanup !== "function") {
    throw new Error("A verified local cleanup step is required to resume learner deletion.");
  }

  const pending = listPendingLearnerDeletions({ accountId, storage });
  const results = [];
  for (const record of pending) {
    try {
      const status = await loadLearnerDeletionStatus({
        client,
        preparedRequest: record
      });
      if (!status.databaseDeleted && status.status !== "completed") {
        results.push({
          requestId: record.requestId,
          studentId: record.studentId,
          status: "prepared"
        });
        continue;
      }

      const cleanupResult = await cleanup(record, status);
      const localCleanupProof = buildLearnerLocalCleanupProof({
        preparedRequest: record,
        studentId: record.studentId,
        progressCleanup: cleanupResult?.progressCleanup,
        evidenceCleanup: cleanupResult?.evidenceCleanup
      });
      const completed = status.status === "completed"
        ? status
        : await completeLearnerDeletion({
            client,
            preparedRequest: record,
            localCleanupProof,
            storage
          });
      if (
        status.status === "completed"
        && !clearPendingLearnerDeletion(record.requestId, { storage })
      ) {
        const error = new Error(
          "The completed deletion marker could not be removed from this browser."
        );
        error.code = "LP_DELETION_MARKER_CLEANUP_FAILED";
        throw error;
      }
      results.push({
        requestId: record.requestId,
        studentId: record.studentId,
        status: "completed",
        result: completed
      });
    } catch (error) {
      results.push({
        requestId: record.requestId,
        studentId: record.studentId,
        status: "error",
        error
      });
    }
  }
  return results;
}

export function buildLearnerDataDownload(data, learnerName = "learner") {
  if (data?.schemaVersion !== 1 || !data.request?.id) {
    throw new Error("Cannot download an invalid learner data package.");
  }
  const safeName = String(learnerName || "learner")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 48) || "learner";
  const created = String(data.request.completedAt || new Date().toISOString()).slice(0, 10);
  return {
    fileName: `literacypath-${safeName}-data-${created}.json`,
    mimeType: "application/json",
    text: `${JSON.stringify(data, null, 2)}\n`
  };
}

export function downloadLearnerDataPackage(data, learnerName) {
  const download = buildLearnerDataDownload(data, learnerName);
  if (
    typeof document === "undefined"
    || typeof URL === "undefined"
    || typeof Blob === "undefined"
  ) {
    return download;
  }
  const url = URL.createObjectURL(new Blob([download.text], { type: download.mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = download.fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return download;
}
