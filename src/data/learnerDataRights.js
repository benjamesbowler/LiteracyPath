export const DATA_RIGHTS_RESPONSE_TARGET_DAYS = 30;
export const LEARNER_DELETION_CONFIRMATION = "DELETE LEARNER DATA";

export const DATA_RIGHTS_REQUESTER_ROLES = Object.freeze([
  Object.freeze({ value: "school", label: "School or district" }),
  Object.freeze({ value: "parent_guardian", label: "Parent or guardian through the school" }),
  Object.freeze({ value: "learner", label: "Learner through the school" })
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
  confirmation
}) {
  assertClient(client);
  assertLearnerId(studentId);
  if (!preparedRequest?.requestId || !preparedRequest?.subjectRef) {
    throw new Error("Prepare and verify the deletion request first.");
  }
  if (confirmation !== LEARNER_DELETION_CONFIRMATION) {
    throw new Error(`Type ${LEARNER_DELETION_CONFIRMATION} exactly.`);
  }
  const result = await client.call("teacher_delete_learner_data", {
    p_request_id: preparedRequest.requestId,
    p_student_id: studentId,
    p_subject_ref: preparedRequest.subjectRef,
    p_confirmation: confirmation
  });
  const data = unwrapRpc(result, "Learner data deletion");
  if (
    data.status !== "completed"
    || data.subjectRef !== preparedRequest.subjectRef
    || data.residualManagedRecords !== 0
  ) {
    throw new Error("Learner deletion did not prove that managed records were removed.");
  }
  return data;
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
  anchor.click();
  URL.revokeObjectURL(url);
  return download;
}
