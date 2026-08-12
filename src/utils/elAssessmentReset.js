import {
  clearAndVerifyAssessmentAttemptsForStudent,
  loadAssessmentAttempts
} from "../data/assessmentHistoryStore.js";
import {
  blockAndWaitForElAssessmentReportOperations,
  deleteSavedElAssessmentReportsForStudent,
  getSavedElAssessmentReports,
  redactSavedClassElAssessmentReportsForStudent,
  savedClassElAssessmentReportContainsStudent
} from "../data/elAssessmentReportStore.js";
import { deleteElBenchmarkDraft } from "../appState/studentSessionHelpers.js";
import {
  clearAndVerifyInsertQueueForStudent,
  readInsertQueue
} from "./insertQueue.js";
import {
  clearAndVerifyMathsEvidenceForStudent,
  readMathsEvidenceQueue
} from "../maths/data/mathsEvidenceStore.js";

const ASSESSMENT_HISTORY_PREFIX = "lpAssessmentHistory:v1:";
const EL_ASSESSMENT_REPORT_PREFIX = "lpElAssessmentReports:v1:";
const EL_BENCHMARK_DRAFT_PREFIX = "elBenchmarkDraft:v1:";
const TEACHER_PROFILE_PREFIX = "readingMasteryProfile:";
const GUIDED_READING_ASSESSMENT_PREFIX = "guidedReadingAssessment:";
const GUIDED_READING_RECORDS_PREFIX = "literacyPath.guidedReadingRecords.";
const MANUAL_ASSESSMENT_DRAFT_PREFIX =
  "literacy-guide:manual-assessment-draft:v1:";
const STUDENT_SESSION_STORAGE_KEY = "lp-student-session-v1";
export const LEARNER_EVIDENCE_CLEANUP_STORES = Object.freeze([
  "assessment_attempts",
  "assessment_write_queue",
  "el_reports",
  "el_benchmark_drafts",
  "guided_reading_assessment",
  "manual_assessment_drafts",
  "maths_evidence_queue",
  "student_session",
  "teacher_profile"
]);

const SELECTED_LEARNER_PROFILE_FIELDS = Object.freeze([
  "teacherStudentName",
  "teacherStudentId",
  "studentName",
  "studentId",
  "assessmentMode",
  "currentSkillIndex",
  "roundAnswers",
  "roundItemKeys",
  "roundQuestionIds",
  "usedByStage",
  "mastery",
  "totalAnswered",
  "correctAnswered",
  "letterIndex",
  "letterAssessment",
  "patternIndex",
  "patternAssessment",
  "patternAttempt",
  "answerHistory",
  "itemMastery",
  "elBenchmarkSession"
]);

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
  const explicitTeacherId = String(teacherId || "").trim();
  if (explicitTeacherId) return [explicitTeacherId];

  const teacherIds = new Set();

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

function removeAndVerifyStorageKey(storage, key, description) {
  if (!key || storage.getItem(key) === null) return false;
  storage.removeItem(key);
  if (storage.getItem(key) !== null) {
    const error = new Error(`Could not clear ${description}.`);
    error.code = "LP_LOCAL_CLEANUP_INCOMPLETE";
    throw error;
  }
  return true;
}

function sanitizeTeacherProfileForLearner({
  profileKey,
  rawProfile,
  studentId,
  storage
}) {
  let profile;
  try {
    profile = JSON.parse(rawProfile);
  } catch {
    // A malformed profile cannot be inspected field-by-field. Delete the
    // entire bounded teacher cache and verify the deletion; retaining an
    // unreadable document and declaring privacy cleanup complete is unsafe.
    removeAndVerifyStorageKey(
      storage,
      profileKey,
      "the unreadable teacher profile cache"
    );
    return { changed: true, malformedRemoved: true };
  }
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    removeAndVerifyStorageKey(
      storage,
      profileKey,
      "the invalid teacher profile cache"
    );
    return { changed: true, malformedRemoved: true };
  }

  let changed = false;
  const profileStudentId = String(
    profile.teacherStudentId || profile.studentId || ""
  );
  if (profileStudentId === String(studentId)) {
    SELECTED_LEARNER_PROFILE_FIELDS.forEach(field => {
      if (!Object.prototype.hasOwnProperty.call(profile, field)) return;
      delete profile[field];
      changed = true;
    });
  }
  if (profile.elBenchmarkSession?.studentId === studentId) {
    delete profile.elBenchmarkSession;
    changed = true;
  }
  if (Array.isArray(profile.assessmentHistory)) {
    const filteredHistory = profile.assessmentHistory.filter(record => (
      String(record?.studentId || "") !== String(studentId)
    ));
    if (filteredHistory.length !== profile.assessmentHistory.length) {
      profile.assessmentHistory = filteredHistory;
      changed = true;
    }
  }

  if (changed) storage.setItem(profileKey, JSON.stringify(profile));
  const verifiedRaw = storage.getItem(profileKey);
  let verifiedProfile;
  try {
    verifiedProfile = JSON.parse(verifiedRaw || "null");
  } catch (error) {
    const cleanupError = new Error(
      "The teacher profile could not be read back after learner cleanup."
    );
    cleanupError.code = "LP_LOCAL_CLEANUP_INCOMPLETE";
    cleanupError.cause = error;
    throw cleanupError;
  }
  if (
    verifiedRaw?.includes(String(studentId))
    || SELECTED_LEARNER_PROFILE_FIELDS.some(field => (
      profileStudentId === String(studentId)
      && Object.prototype.hasOwnProperty.call(verifiedProfile || {}, field)
    ))
  ) {
    const error = new Error(
      "The teacher profile still contains the learner after local cleanup."
    );
    error.code = "LP_LOCAL_CLEANUP_INCOMPLETE";
    throw error;
  }
  return { changed, malformedRemoved: false };
}

/**
 * Remove every local EL assessment artefact owned by one learner.
 *
 * Teacher-level attempt/report caches contain several learners, so this
 * filters only the reset learner while preserving classmates. When an older
 * progress-sync session genuinely has no teacher id, all locally discoverable
 * teacher caches are checked so a reset cannot leave a stale draft or report
 * behind. When an owning teacher is known, no other account's cache is opened:
 * legacy ID-less evidence can match by display name and names are not globally
 * unique on shared school devices.
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
      reportsDeleted: 0,
      reportsRedacted: 0,
      queuedWritesDeleted: 0
    };
  }

  const teacherIds = getCandidateTeacherIds({ teacherId, studentId, storage });
  let draftsDeleted = 0;
  let legacyDraftsDeleted = 0;
  let attemptsDeleted = 0;
  let reportsDeleted = 0;
  let reportsRedacted = 0;
  let queuedWritesDeleted = 0;
  let teacherProfilesSanitized = 0;
  let malformedProfilesRemoved = 0;
  let guidedReadingAssessmentsDeleted = 0;
  let manualAssessmentDraftsDeleted = 0;

  const mathsEvidenceCleanup = await clearAndVerifyMathsEvidenceForStudent({
    studentId,
    storage
  });

  for (const candidateTeacherId of teacherIds) {
    await blockAndWaitForElAssessmentReportOperations({
      teacherId: candidateTeacherId,
      studentId,
      studentName
    });
    const queueCleanup = await clearAndVerifyInsertQueueForStudent({
      accountId: candidateTeacherId,
      studentId,
      storage
    });
    queuedWritesDeleted += queueCleanup.removed;
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
      let legacyDraftPresent = false;
      try {
        legacyDraftPresent = JSON.parse(storedProfile)?.elBenchmarkSession?.studentId === studentId;
      } catch {
        // The sanitizer below removes the whole unreadable bounded cache.
      }
      const profileCleanup = sanitizeTeacherProfileForLearner({
        profileKey,
        rawProfile: storedProfile,
        studentId,
        storage
      });
      if (legacyDraftPresent) legacyDraftsDeleted += 1;
      if (profileCleanup.changed) teacherProfilesSanitized += 1;
      if (profileCleanup.malformedRemoved) malformedProfilesRemoved += 1;
    }

    const guidedReadingAssessmentKey =
      `${GUIDED_READING_ASSESSMENT_PREFIX}${candidateTeacherId}:${studentId}`;
    if (removeAndVerifyStorageKey(
      storage,
      guidedReadingAssessmentKey,
      `the Guided Reading assessment for student ${studentId}`
    )) {
      guidedReadingAssessmentsDeleted += 1;
    }
    const guidedReadingRecordsKey =
      `${GUIDED_READING_RECORDS_PREFIX}${encodeURIComponent(studentId)}`;
    if (removeAndVerifyStorageKey(
      storage,
      guidedReadingRecordsKey,
      `the Guided Reading record for student ${studentId}`
    )) {
      guidedReadingAssessmentsDeleted += 1;
    }

    const manualAssessmentDraftKey =
      `${MANUAL_ASSESSMENT_DRAFT_PREFIX}${candidateTeacherId}:${studentId}`;
    if (removeAndVerifyStorageKey(
      storage,
      manualAssessmentDraftKey,
      `the manual assessment draft for student ${studentId}`
    )) {
      manualAssessmentDraftsDeleted += 1;
    }

    const attemptsBefore = loadAssessmentAttempts({ teacherId: candidateTeacherId });
    // Stable IDs take precedence over names; duplicate learner names must not
    // erase another child's evidence from a shared teacher cache.
    await clearAndVerifyAssessmentAttemptsForStudent({
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
    const classReportCleanup = redactSavedClassElAssessmentReportsForStudent({
      teacherId: candidateTeacherId,
      studentId,
      studentName
    });
    reportsRedacted += classReportCleanup.redactedReportIds.length;
    const reportsAfter = getSavedElAssessmentReports({ teacherId: candidateTeacherId });
    if (reportsAfter.some(report => (
      individualEvidenceBelongsToStudent(report, { studentId, studentName }) ||
      savedClassElAssessmentReportContainsStudent(report, { studentId, studentName })
    ))) {
      throw new Error(`Could not clear cached EL assessment reports for student ${studentId}.`);
    }
    reportsDeleted += Math.max(0, reportsBefore.length - reportsAfter.length);

    if (readInsertQueue({ accountId: candidateTeacherId, storage }).some(record => (
      String(record.entry?.row?.student_id || "") === String(studentId)
    ))) {
      throw new Error(`Could not clear queued assessment writes for student ${studentId}.`);
    }
  }

  if (readMathsEvidenceQueue({ storage }).some(record => (
    String(record.entry?.studentId || "") === String(studentId)
  ))) {
    throw new Error(`Could not clear queued Maths evidence for student ${studentId}.`);
  }

  const rawSavedSession = storage.getItem(STUDENT_SESSION_STORAGE_KEY);
  if (rawSavedSession) {
    let savedSession = null;
    let malformedSession = false;
    try {
      savedSession = JSON.parse(rawSavedSession);
    } catch {
      malformedSession = true;
    }
    if (
      malformedSession ||
      String(savedSession?.studentId || "") === String(studentId)
      || rawSavedSession.includes(String(studentId))
    ) {
      storage.removeItem(STUDENT_SESSION_STORAGE_KEY);
    }
    const remainingSession = storage.getItem(STUDENT_SESSION_STORAGE_KEY);
    if (
      malformedSession && remainingSession !== null
      || remainingSession?.includes(String(studentId))
    ) {
      throw new Error(`Could not clear the saved sign-in session for student ${studentId}.`);
    }
  }

  return {
    teacherIds,
    draftsDeleted,
    legacyDraftsDeleted,
    attemptsDeleted,
    reportsDeleted,
    reportsRedacted,
    queuedWritesDeleted,
    teacherProfilesSanitized,
    malformedProfilesRemoved,
    guidedReadingAssessmentsDeleted,
    manualAssessmentDraftsDeleted,
    mathsEvidenceWritesDeleted: mathsEvidenceCleanup.removed,
    storageAvailable: true,
    residualCount: 0,
    storesChecked: [...LEARNER_EVIDENCE_CLEANUP_STORES]
  };
}
