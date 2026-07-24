import {
  ASSESSMENT_EVIDENCE_SCHEMA_VERSION,
  normalizeAssessmentAttempt
} from "./assessmentHistoryStore.js";

function normalizedCaptureTime(value) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function replayAssessmentEvidence(archive = {}) {
  if (
    Number(archive?.schemaVersion) !== ASSESSMENT_EVIDENCE_SCHEMA_VERSION
    || !archive?.attemptId
    || !archive?.assessmentVersion
    || !archive?.contentVersion
    || !archive?.policyVersion
    || !archive?.result
    || typeof archive.result !== "object"
    || Array.isArray(archive.result)
  ) {
    throw new Error("Assessment evidence archive has an invalid schema.");
  }
  for (const field of [
    "attemptId",
    "assessmentVersion",
    "contentVersion",
    "policyVersion"
  ]) {
    if (
      archive.result[field] !== undefined
      && archive.result[field] !== archive[field]
    ) {
      throw new Error("Assessment evidence archive provenance does not match its result.");
    }
  }
  const replayed = normalizeAssessmentAttempt({
    ...archive.result,
    assessmentVersion: archive.assessmentVersion,
    contentVersion: archive.contentVersion,
    policyVersion: archive.policyVersion,
    evidenceSchemaVersion: archive.schemaVersion
  });
  if (
    replayed.attemptId !== archive.attemptId
    || replayed.completedAt !== normalizedCaptureTime(archive.capturedAt)
    || replayed.assessmentVersion !== archive.assessmentVersion
    || replayed.contentVersion !== archive.contentVersion
    || replayed.policyVersion !== archive.policyVersion
  ) {
    throw new Error("Assessment evidence archive provenance does not match its result.");
  }
  return replayed;
}
