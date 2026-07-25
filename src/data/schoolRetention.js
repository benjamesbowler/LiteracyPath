export const RETENTION_CONFIRMATION = "APPLY RETENTION POLICY";
export const PROPAGATION_CONFIRMATION = "VERIFY PROVIDER AND BACKUP EXPIRY";

export const RETENTION_LIMITS = Object.freeze({
  inactiveAfterDays: Object.freeze({ min: 90, max: 2555 }),
  archivedDeleteAfterDays: Object.freeze({ min: 7, max: 730 }),
  expiryDays: Object.freeze({ min: 1, max: 365 })
});

export const YEAR_END_MONTHS = Object.freeze([
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
].map((label, index) => Object.freeze({ value: index + 1, label })));

function assertClient(client) {
  if (!client?.rpc) throw new Error("The managed retention service is unavailable.");
}

function assertSchoolId(schoolId) {
  if (!String(schoolId || "").trim()) throw new Error("Choose a school first.");
}

function unwrap(result, operation) {
  if (result?.error) throw new Error(result.error.message || `${operation} failed.`);
  if (!result?.data || typeof result.data !== "object") {
    throw new Error(`${operation} returned an invalid response.`);
  }
  return result.data;
}

function integerWithin(value, limits, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < limits.min || parsed > limits.max) {
    throw new Error(`${label} must be between ${limits.min} and ${limits.max} days.`);
  }
  return parsed;
}

export function normalizeRetentionPolicy(raw = {}) {
  const policy = {
    schoolId: raw.schoolId || raw.school_id || "",
    inactiveAfterDays: Number(raw.inactiveAfterDays ?? raw.inactive_after_days ?? 365),
    archivedDeleteAfterDays: Number(
      raw.archivedDeleteAfterDays ?? raw.archived_delete_after_days ?? 90
    ),
    endOfYearAction: raw.endOfYearAction || raw.end_of_year_action || "archive",
    academicYearEndMonth: Number(
      raw.academicYearEndMonth ?? raw.academic_year_end_month ?? 7
    ),
    providerExpiryDays: Number(raw.providerExpiryDays ?? raw.provider_expiry_days ?? 30),
    backupExpiryDays: Number(raw.backupExpiryDays ?? raw.backup_expiry_days ?? 35),
    lastEndOfYearApplied:
      raw.lastEndOfYearApplied ?? raw.last_end_of_year_applied ?? null,
    updatedAt: raw.updatedAt || raw.updated_at || null
  };
  integerWithin(
    policy.inactiveAfterDays,
    RETENTION_LIMITS.inactiveAfterDays,
    "Inactive archive period"
  );
  integerWithin(
    policy.archivedDeleteAfterDays,
    RETENTION_LIMITS.archivedDeleteAfterDays,
    "Archived deletion period"
  );
  integerWithin(
    policy.providerExpiryDays,
    RETENTION_LIMITS.expiryDays,
    "Provider expiry period"
  );
  integerWithin(
    policy.backupExpiryDays,
    RETENTION_LIMITS.expiryDays,
    "Backup expiry period"
  );
  if (!["archive", "delete"].includes(policy.endOfYearAction)) {
    throw new Error("Choose archive or delete for the end-of-year action.");
  }
  if (
    !Number.isInteger(policy.academicYearEndMonth)
    || policy.academicYearEndMonth < 1
    || policy.academicYearEndMonth > 12
  ) {
    throw new Error("Choose a valid school year-end month.");
  }
  return policy;
}

export async function loadSchoolRetentionPolicy({ client, schoolId }) {
  assertClient(client);
  assertSchoolId(schoolId);
  const result = await client.rpc("admin_get_school_retention_policy", {
    p_school_id: schoolId
  });
  return normalizeRetentionPolicy(unwrap(result, "Retention policy load"));
}

export async function saveSchoolRetentionPolicy({ client, schoolId, policy }) {
  assertClient(client);
  assertSchoolId(schoolId);
  const normalized = normalizeRetentionPolicy({ ...policy, schoolId });
  const result = await client.rpc("admin_save_school_retention_policy", {
    p_school_id: schoolId,
    p_inactive_after_days: normalized.inactiveAfterDays,
    p_archived_delete_after_days: normalized.archivedDeleteAfterDays,
    p_end_of_year_action: normalized.endOfYearAction,
    p_academic_year_end_month: normalized.academicYearEndMonth,
    p_provider_expiry_days: normalized.providerExpiryDays,
    p_backup_expiry_days: normalized.backupExpiryDays
  });
  return normalizeRetentionPolicy(unwrap(result, "Retention policy save"));
}

export async function previewSchoolRetention({ client, schoolId }) {
  assertClient(client);
  assertSchoolId(schoolId);
  const result = await client.rpc("admin_preview_school_retention", {
    p_school_id: schoolId
  });
  const data = unwrap(result, "Retention preview");
  for (const field of [
    "inactiveArchiveCandidates",
    "archivedDeletionCandidates",
    "endOfYearCandidates",
    "pendingPropagationRecords",
    "propagationEvidenceDue"
  ]) {
    if (!Number.isInteger(Number(data[field])) || Number(data[field]) < 0) {
      throw new Error("Retention preview omitted its candidate counts.");
    }
  }
  return data;
}

export async function listDeletionPropagation({ client, schoolId }) {
  assertClient(client);
  assertSchoolId(schoolId);
  const result = await client.rpc("admin_list_deletion_propagation", {
    p_school_id: schoolId
  });
  if (result?.error) {
    throw new Error(result.error.message || "Deletion propagation load failed.");
  }
  if (!Array.isArray(result?.data)) {
    throw new Error("Deletion propagation load returned an invalid response.");
  }
  return result.data;
}

export async function verifyDeletionPropagation({
  client,
  requestId,
  evidenceReference,
  confirmation
}) {
  assertClient(client);
  if (!String(requestId || "").trim()) {
    throw new Error("Choose a deletion propagation record.");
  }
  if (String(evidenceReference || "").trim().length < 8) {
    throw new Error("Add the provider or backup evidence reference.");
  }
  if (confirmation !== PROPAGATION_CONFIRMATION) {
    throw new Error(`Type ${PROPAGATION_CONFIRMATION} exactly.`);
  }
  const result = await client.rpc("admin_verify_deletion_propagation", {
    p_request_id: requestId,
    p_evidence_reference: String(evidenceReference).trim(),
    p_confirmation: confirmation
  });
  return unwrap(result, "Deletion propagation verification");
}

export async function runSchoolRetention({
  client,
  schoolId,
  confirmation
}) {
  assertClient(client);
  assertSchoolId(schoolId);
  if (confirmation !== RETENTION_CONFIRMATION) {
    throw new Error(`Type ${RETENTION_CONFIRMATION} exactly.`);
  }
  const result = await client.rpc("admin_run_school_retention", {
    p_school_id: schoolId,
    p_confirmation: confirmation
  });
  const data = unwrap(result, "Retention policy run");
  if (
    !Number.isInteger(Number(data.archivedLearners))
    || !Number.isInteger(Number(data.deletedLearners))
    || !Number.isInteger(Number(data.propagationRecordsDueForEvidence))
    || !Array.isArray(data.deletedStudentIds)
    || !data.residualPreview
  ) {
    throw new Error("Retention policy run omitted its completion evidence.");
  }
  return data;
}
