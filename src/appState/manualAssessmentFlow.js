function cleanIdPart(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "student";
}

const MANUAL_ASSESSMENT_DRAFT_VERSION = 1;
const MANUAL_ASSESSMENT_DRAFT_PREFIX = "literacy-guide:manual-assessment-draft";

function emptyManualAssessmentDrafts() {
  return {
    found: false,
    letterIndex: 0,
    letterAssessment: [],
    patternIndex: 0,
    patternAssessment: []
  };
}

function normalizeDraftEntries(entries, studentId) {
  if (!Array.isArray(entries)) return [];
  return entries.filter(entry => (
    entry
    && typeof entry === "object"
    && (!entry.assessmentStudentId || entry.assessmentStudentId === studentId)
  ));
}

export function getManualAssessmentDraftStorageKey({
  teacherId,
  studentId
} = {}) {
  const teacher = String(teacherId || "").trim();
  const student = String(studentId || "").trim();
  if (!teacher || !student) return "";
  return `${MANUAL_ASSESSMENT_DRAFT_PREFIX}:v${MANUAL_ASSESSMENT_DRAFT_VERSION}:${teacher}:${student}`;
}

export function loadManualAssessmentDrafts({
  teacherId,
  studentId,
  storage = globalThis.localStorage
} = {}) {
  const storageKey = getManualAssessmentDraftStorageKey({ teacherId, studentId });
  if (!storageKey || !storage?.getItem) return emptyManualAssessmentDrafts();

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return emptyManualAssessmentDrafts();
    const saved = JSON.parse(raw);
    if (saved?.version !== MANUAL_ASSESSMENT_DRAFT_VERSION) {
      return emptyManualAssessmentDrafts();
    }
    const letterAssessment = normalizeDraftEntries(saved.letterAssessment, studentId);
    const patternAssessment = normalizeDraftEntries(saved.patternAssessment, studentId);
    return {
      found: true,
      letterIndex: Math.min(
        letterAssessment.length,
        Math.max(0, Number(saved.letterIndex) || 0)
      ),
      letterAssessment,
      patternIndex: Math.min(
        patternAssessment.length,
        Math.max(0, Number(saved.patternIndex) || 0)
      ),
      patternAssessment
    };
  } catch {
    return emptyManualAssessmentDrafts();
  }
}

export function saveManualAssessmentDrafts({
  teacherId,
  studentId,
  letterIndex = 0,
  letterAssessment = [],
  patternIndex = 0,
  patternAssessment = [],
  storage = globalThis.localStorage
} = {}) {
  const storageKey = getManualAssessmentDraftStorageKey({ teacherId, studentId });
  if (!storageKey || !storage?.setItem) return false;

  const ownedLetterAssessment = normalizeDraftEntries(letterAssessment, studentId);
  const ownedPatternAssessment = normalizeDraftEntries(patternAssessment, studentId);
  try {
    if (!ownedLetterAssessment.length && !ownedPatternAssessment.length) {
      storage.removeItem?.(storageKey);
      return true;
    }
    storage.setItem(storageKey, JSON.stringify({
      version: MANUAL_ASSESSMENT_DRAFT_VERSION,
      studentId,
      letterIndex: Math.min(
        ownedLetterAssessment.length,
        Math.max(0, Number(letterIndex) || 0)
      ),
      letterAssessment: ownedLetterAssessment,
      patternIndex: Math.min(
        ownedPatternAssessment.length,
        Math.max(0, Number(patternIndex) || 0)
      ),
      patternAssessment: ownedPatternAssessment
    }));
    return true;
  } catch {
    return false;
  }
}

function manualResponseOutcome(record = {}) {
  const status = String(record.responseStatus || "").trim().toLowerCase();
  if (["correct", "incorrect", "not_administered"].includes(status)) return status;
  if (record.isCorrect === true) return "correct";
  if (record.isCorrect === false) return "incorrect";
  return "not_administered";
}

function attemptTimestamp(attempt = {}) {
  for (const value of [
    attempt.updatedAt,
    attempt.completedAt,
    attempt.startedAt,
    attempt.createdAt,
    attempt.date
  ]) {
    const timestamp = Date.parse(value || "");
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return 0;
}

export function chooseNewestManualAssessmentEntries(
  localEntries = [],
  archivedEntries = [],
  {
    archivedStatus = "",
    archivedAt = 0
  } = {}
) {
  const local = Array.isArray(localEntries) ? localEntries : [];
  const archived = Array.isArray(archivedEntries) ? archivedEntries : [];
  const localStartedAt = Date.parse(local[0]?.assessmentStartedAt || "") || 0;
  if (
    local.length
    && archivedStatus
    && archivedStatus !== "partial"
    && Number(archivedAt || 0) >= localStartedAt
  ) {
    return [];
  }
  if (!local.length) return archived;
  if (!archived.length) return local;
  const archivedStartedAt = Date.parse(archived[0]?.assessmentStartedAt || "") || 0;
  if (localStartedAt !== archivedStartedAt) {
    return archivedStartedAt > localStartedAt ? archived : local;
  }
  return archived.length > local.length ? archived : local;
}

function latestManualAttempt({
  assessmentHistory = [],
  assessmentType,
  studentId
} = {}) {
  return (Array.isArray(assessmentHistory) ? assessmentHistory : [])
    .filter(attempt => (
      attempt?.assessmentType === assessmentType
      && (!studentId || attempt.studentId === studentId)
    ))
    .sort((left, right) => attemptTimestamp(right) - attemptTimestamp(left))[0];
}

function attemptOwnership(attempt = {}, studentId = "") {
  return {
    assessmentAttemptId: attempt.attemptId || "",
    assessmentStartedAt: attempt.startedAt || attempt.createdAt || "",
    assessmentStudentId: studentId || attempt.studentId || ""
  };
}

function entriesFromPairedRecords(records = [], builder) {
  const entries = [];
  for (let index = 0; index < records.length; index += 2) {
    const first = records[index];
    const second = records[index + 1];
    if (!first || !second) break;
    const entry = builder(first, second);
    if (entry) entries.push(entry);
  }
  return entries;
}

export function restoreManualAssessmentDraftsFromHistory({
  assessmentHistory = [],
  studentId
} = {}) {
  const latestLetterAttempt = latestManualAttempt({
    assessmentHistory,
    assessmentType: "el_letter_assessment",
    studentId
  });
  const latestPatternAttempt = latestManualAttempt({
    assessmentHistory,
    assessmentType: "advanced_phonics_patterns",
    studentId
  });
  const latestLetterStatus = String(
    latestLetterAttempt?.administrationStatus || latestLetterAttempt?.status || ""
  ).toLowerCase();
  const latestPatternStatus = String(
    latestPatternAttempt?.administrationStatus || latestPatternAttempt?.status || ""
  ).toLowerCase();
  const letterAttempt = latestLetterStatus === "partial" ? latestLetterAttempt : null;
  const patternAttempt = latestPatternStatus === "partial" ? latestPatternAttempt : null;

  const letterAssessment = letterAttempt
    ? entriesFromPairedRecords(letterAttempt.questionRecords, (nameRecord, soundRecord) => {
        const letter = nameRecord.targetLetter || soundRecord.targetLetter || "";
        if (!letter) return null;
        const nameOutcome = manualResponseOutcome(nameRecord);
        const soundOutcome = manualResponseOutcome(soundRecord);
        return {
          letter,
          type: letter === letter.toUpperCase() ? "uppercase" : "lowercase",
          nameOutcome,
          soundOutcome,
          knowsName: nameOutcome === "correct",
          knowsSound: soundOutcome === "correct",
          ...attemptOwnership(letterAttempt, studentId)
        };
      })
    : [];
  const patternAssessment = patternAttempt
    ? entriesFromPairedRecords(patternAttempt.questionRecords, (soundRecord, wordRecord) => {
        const pattern = soundRecord.targetPattern || wordRecord.targetPattern || "";
        if (!pattern) return null;
        const soundOutcome = manualResponseOutcome(soundRecord);
        const wordOutcome = manualResponseOutcome(wordRecord);
        return {
          pattern,
          exampleWord: wordRecord.targetWord || soundRecord.targetWord || "",
          soundOutcome,
          wordOutcome,
          soundCorrect: soundOutcome === "correct",
          wordCorrect: wordOutcome === "correct",
          ...attemptOwnership(patternAttempt, studentId)
        };
      })
    : [];

  return {
    found: Boolean(letterAssessment.length || patternAssessment.length),
    letterLatestStatus: latestLetterStatus,
    letterLatestAt: attemptTimestamp(latestLetterAttempt),
    letterIndex: letterAssessment.length,
    letterAssessment,
    patternLatestStatus: latestPatternStatus,
    patternLatestAt: attemptTimestamp(latestPatternAttempt),
    patternIndex: patternAssessment.length,
    patternAssessment
  };
}

export function createManualAssessmentAttemptSession({
  assessmentType,
  studentId,
  startedAt = new Date().toISOString(),
  nonce = Math.random().toString(36).slice(2, 10)
} = {}) {
  const type = String(assessmentType || "").trim();
  const learner = String(studentId || "").trim();
  return {
    assessmentType: type,
    studentId: learner,
    startedAt,
    attemptId: `${type}_${cleanIdPart(learner)}_${Date.parse(startedAt)}_${nonce}`
  };
}

export function restoreManualAssessmentAttemptSession({
  assessmentType,
  studentId,
  savedEntries = []
} = {}) {
  const saved = (Array.isArray(savedEntries) ? savedEntries : []).find(entry => (
    entry?.assessmentAttemptId
    && entry?.assessmentStartedAt
    && entry?.assessmentStudentId === studentId
  ));
  if (!saved) return null;
  return {
    assessmentType,
    studentId,
    startedAt: saved.assessmentStartedAt,
    attemptId: saved.assessmentAttemptId
  };
}

export function manualAssessmentEntryOwnership(session = {}) {
  return {
    assessmentAttemptId: session.attemptId || "",
    assessmentStartedAt: session.startedAt || "",
    assessmentStudentId: session.studentId || ""
  };
}

export function replaceManualAssessmentEntry(entries = [], index = 0, entry = {}) {
  const safeIndex = Math.max(0, Number(index) || 0);
  return [
    ...(Array.isArray(entries) ? entries : []).slice(0, safeIndex),
    entry
  ];
}

export function manualAssessmentAdministrationStatus(entryCount = 0, plannedItemCount = 0) {
  return Number(entryCount || 0) >= Number(plannedItemCount || 0)
    ? "completed"
    : "partial";
}

export async function runSingleFlight(saveRef, operation) {
  if (saveRef.current) return saveRef.current;
  const pending = Promise.resolve().then(operation);
  saveRef.current = pending;
  try {
    return await pending;
  } finally {
    if (saveRef.current === pending) saveRef.current = null;
  }
}
