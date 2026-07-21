import {
  deleteAssessmentAttemptsForStudent,
  loadAssessmentAttempts
} from "../data/assessmentHistoryStore.js";
import {
  deleteSavedClassElAssessmentReportsForStudent,
  deleteSavedElAssessmentReportsForStudent,
  getSavedElAssessmentReports,
  savedClassElAssessmentReportContainsStudent
} from "../data/elAssessmentReportStore.js";
import { deleteElBenchmarkDraft } from "../appState/studentSessionHelpers.js";

const ASSESSMENT_HISTORY_PREFIX = "lpAssessmentHistory:v1:";
const EL_ASSESSMENT_REPORT_PREFIX = "lpElAssessmentReports:v1:";
const EL_BENCHMARK_DRAFT_PREFIX = "elBenchmarkDraft:v1:";
const TEACHER_PROFILE_PREFIX = "readingMasteryProfile:";

function listStorageKeys(storage) {
  if (!storage || typeof storage.key !== "function") return [];
  const keys = [];
  for (let index = 0; index < Number(storage.length || 0); index += 1) {
    const key = storage.key(index);
    if (key) keys.push(key);
  }
  return keys;
}

function teacherIdFromScopedKey(key, prefix) {
  return key.startsWith(prefix) ? key.slice(prefix.length) : "";
}

function teacherIdFromDraftKey(key, studentId) {
  if (!key.startsWith(EL_BENCHMARK_DRAFT_PREFIX)) return "";
  const studentSuffix = `:${studentId}`;
  if (!key.endsWith(studentSuffix)) return "";
  return key.slice(EL_BENCHMARK_DRAFT_PREFIX.length, -studentSuffix.length);
}

function getCandidateTeacherIds({ teacherId = "", studentId = "", storage }) {
  const teacherIds = new Set();
  if (teacherId) teacherIds.add(String(teacherId));

  for (const key of listStorageKeys(storage)) {
    const assessmentTeacherId = teacherIdFromScopedKey(key, ASSESSMENT_HISTORY_PREFIX);
    const reportTeacherId = teacherIdFromScopedKey(key, EL_ASSESSMENT_REPORT_PREFIX);
    const profileTeacherId = teacherIdFromScopedKey(key, TEACHER_PROFILE_PREFIX);
    const draftTeacherId = teacherIdFromDraftKey(key, studentId);
    if (assessmentTeacherId) teacherIds.add(assessmentTeacherId);
    if (reportTeacherId) teacherIds.add(reportTeacherId);
    if (profileTeacherId) teacherIds.add(profileTeacherId);
    if (draftTeacherId) teacherIds.add(draftTeacherId);
  }

  return [...teacherIds];
}

function individualEvidenceBelongsToStudent(record = {}, { studentId = "", studentName = "" } = {}) {
  const recordStudentId = String(record.studentId || "").trim();
  const normalizedStudentId = String(studentId || "").trim();
  if (normalizedStudentId && recordStudentId === normalizedStudentId) return true;
  return Boolean(
    !recordStudentId &&
    studentName &&
    String(record.studentName || "").trim().toLowerCase() === String(studentName).trim().toLowerCase()
  );
}

/**
 * Remove every local EL assessment artefact owned by one learner.
 *
 * Teacher-level attempt/report caches contain several learners, so this
 * filters only the reset learner while preserving classmates. When an older
 * progress-sync session has no teacher id, all locally discoverable teacher
 * caches are checked so a reset cannot leave a stale draft or report behind.
 */
export async function clearLocalElAssessmentDataForStudent({
  teacherId = "",
  studentId = "",
  studentName = "",
  storage = globalThis.localStorage
} = {}) {
  if (!studentId || !storage) {
    return {
      teacherIds: [],
      draftsDeleted: 0,
      legacyDraftsDeleted: 0,
      attemptsDeleted: 0,
      reportsDeleted: 0
    };
  }

  const teacherIds = getCandidateTeacherIds({ teacherId, studentId, storage });
  let draftsDeleted = 0;
  let legacyDraftsDeleted = 0;
  let attemptsDeleted = 0;
  let reportsDeleted = 0;

  for (const candidateTeacherId of teacherIds) {
    const draftKey = `${EL_BENCHMARK_DRAFT_PREFIX}${candidateTeacherId}:${studentId}`;
    if (storage.getItem(draftKey) !== null) draftsDeleted += 1;
    deleteElBenchmarkDraft({
      teacherId: candidateTeacherId,
      studentId,
      storage
    });
    if (storage.getItem(draftKey) !== null) {
      throw new Error(`Could not clear the EL benchmark draft for student ${studentId}.`);
    }

    // Early benchmark builds embedded the draft in the teacher profile. Strip
    // that legacy copy as well or a reload could resurrect it after the new
    // student-scoped draft key has been correctly removed.
    const profileKey = `${TEACHER_PROFILE_PREFIX}${candidateTeacherId}`;
    const storedProfile = storage.getItem(profileKey);
    if (storedProfile) {
      let profile;
      try {
        profile = JSON.parse(storedProfile);
      } catch {
        // A corrupt legacy profile cannot contain a safely addressable draft.
      }
      if (profile && typeof profile === "object") {
        let profileChanged = false;
        if (profile.elBenchmarkSession?.studentId === studentId) {
          delete profile.elBenchmarkSession;
          legacyDraftsDeleted += 1;
          profileChanged = true;
        }
        if (Array.isArray(profile.assessmentHistory)) {
          const filteredHistory = profile.assessmentHistory.filter(record => (
            String(record?.studentId || "") !== String(studentId)
          ));
          if (filteredHistory.length !== profile.assessmentHistory.length) {
            profile.assessmentHistory = filteredHistory;
            profileChanged = true;
          }
        }
        if (profileChanged) storage.setItem(profileKey, JSON.stringify(profile));
        const verifiedProfile = JSON.parse(storage.getItem(profileKey) || "null");
        if (verifiedProfile?.elBenchmarkSession?.studentId === studentId) {
          throw new Error(`Could not clear the legacy EL benchmark draft for student ${studentId}.`);
        }
      }
    }

    const attemptsBefore = loadAssessmentAttempts({ teacherId: candidateTeacherId });
    // Stable IDs take precedence over names; duplicate learner names must not
    // erase another child's evidence from a shared teacher cache.
    deleteAssessmentAttemptsForStudent({
      teacherId: candidateTeacherId,
      studentId,
      studentName
    });
    const attemptsAfter = loadAssessmentAttempts({ teacherId: candidateTeacherId });
    if (attemptsAfter.some(record => individualEvidenceBelongsToStudent(record, { studentId, studentName }))) {
      throw new Error(`Could not clear cached EL assessment attempts for student ${studentId}.`);
    }
    attemptsDeleted += Math.max(0, attemptsBefore.length - attemptsAfter.length);

    const reportsBefore = getSavedElAssessmentReports({ teacherId: candidateTeacherId });
    deleteSavedElAssessmentReportsForStudent({
      teacherId: candidateTeacherId,
      studentId,
      studentName
    });
    await deleteSavedClassElAssessmentReportsForStudent({
      teacherId: candidateTeacherId,
      studentId,
      studentName
    });
    const reportsAfter = getSavedElAssessmentReports({ teacherId: candidateTeacherId });
    if (reportsAfter.some(report => (
      individualEvidenceBelongsToStudent(report, { studentId, studentName }) ||
      savedClassElAssessmentReportContainsStudent(report, { studentId, studentName })
    ))) {
      throw new Error(`Could not clear cached EL assessment reports for student ${studentId}.`);
    }
    reportsDeleted += Math.max(0, reportsBefore.length - reportsAfter.length);
  }

  return {
    teacherIds,
    draftsDeleted,
    legacyDraftsDeleted,
    attemptsDeleted,
    reportsDeleted
  };
}
