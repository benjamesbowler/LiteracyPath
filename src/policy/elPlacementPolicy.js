import { EL_DECODING_MICROPHASES } from "../data/elDecodingMicrophases.js";

const EL_PLACEMENT_ASSESSMENTS = new Set(["el_decoding", "el_encoding"]);

function recordStudentId(record = {}) {
  return String(
    record.studentId
    || record.student_id
    || record.student?.id
    || record.metadata?.studentId
    || record.metadata?.student_id
    || ""
  );
}

function recordTime(record = {}) {
  const parsed = Date.parse(
    record.completedAt
    || record.completed_at
    || record.updatedAt
    || record.updated_at
    || record.createdAt
    || record.created_at
    || record.timestamp
    || ""
  );
  return Number.isFinite(parsed) ? parsed : 0;
}

function assessmentId(record = {}) {
  return String(
    record.assessmentId
    || record.assessment_id
    || record.metadata?.assessmentId
    || record.benchmark?.assessmentId
    || ""
  );
}

function completedRecord(record = {}) {
  const status = String(record.administrationStatus || record.status || "completed").toLowerCase();
  return status === "completed";
}

function normalizePlacement(placement = {}, record = {}) {
  const microphase = String(
    placement.microphase || placement.candidateMicrophase || placement.id || ""
  ).trim();
  if (!microphase) return null;
  const definition = EL_DECODING_MICROPHASES.find(row => row.id === microphase) || null;
  const explicitAnchor = Number(placement.anchorCycle);
  const anchorCycle = Number.isInteger(explicitAnchor) && explicitAnchor > 0
    ? explicitAnchor
    : Number.isInteger(definition?.anchorCycle)
      ? definition.anchorCycle
      : null;
  return {
    microphase,
    label: placement.label || definition?.label || microphase,
    anchorCycle,
    confirmedAt: placement.confirmedAt || record.completedAt || record.updatedAt || "",
    sourceAssessmentId: assessmentId(record),
    sourceAttemptId: record.attemptId || record.id || ""
  };
}

/**
 * Return the latest completed, teacher-confirmed EL placement for one child.
 * Candidate or provisional placements are deliberately ignored.
 */
export function resolveConfirmedElPlacement({ assessmentHistory = [], studentId = "" } = {}) {
  const expectedStudentId = String(studentId || "");
  const records = (Array.isArray(assessmentHistory) ? assessmentHistory : [])
    .filter(record => EL_PLACEMENT_ASSESSMENTS.has(assessmentId(record)))
    .filter(completedRecord)
    .filter(record => !expectedStudentId || recordStudentId(record) === expectedStudentId)
    .map(record => ({
      record,
      placement: normalizePlacement(record.confirmedPlacement, record)
    }))
    .filter(row => row.placement)
    .sort((left, right) => (
      recordTime(right.record) - recordTime(left.record)
      || Number(assessmentId(right.record) === "el_decoding")
        - Number(assessmentId(left.record) === "el_decoding")
    ));
  return records[0]?.placement || null;
}
