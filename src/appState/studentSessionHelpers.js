export function getTeacherProfileStorageKey(teacherId) {
  return teacherId ? `readingMasteryProfile:${teacherId}` : null;
}

export function getGuidedReadingStorageKey({ studentId } = {}) {
  if (!studentId) return null;
  return `literacyPath.guidedReadingRecords.${encodeURIComponent(studentId)}`;
}

export function migrateGuidedReadingStorage({
  teacherId,
  studentId,
  storage = globalThis.localStorage
} = {}) {
  if (!teacherId || !studentId || !storage) return false;
  const legacyKey = `guidedReadingAssessment:${teacherId}:${studentId}`;
  const canonicalKey = getGuidedReadingStorageKey({ studentId });
  try {
    const legacy = JSON.parse(storage.getItem(legacyKey) || "null");
    if (!legacy || typeof legacy !== "object" || Array.isArray(legacy)) return false;
    const canonical = JSON.parse(storage.getItem(canonicalKey) || "{}");
    storage.setItem(canonicalKey, JSON.stringify({ ...legacy, ...canonical }));
    storage.removeItem(legacyKey);
    return true;
  } catch {
    return false;
  }
}

export function getElBenchmarkDraftStorageKey({ teacherId, studentId } = {}) {
  if (!teacherId || !studentId) return null;
  return `elBenchmarkDraft:v1:${teacherId}:${studentId}`;
}

export function loadElBenchmarkDraft({ teacherId, studentId, storage = globalThis.localStorage } = {}) {
  const key = getElBenchmarkDraftStorageKey({ teacherId, studentId });
  if (!key || !storage) return null;

  try {
    const session = JSON.parse(storage.getItem(key) || "null");
    return session?.studentId === studentId ? session : null;
  } catch {
    return null;
  }
}

export function saveElBenchmarkDraft({ teacherId, studentId, session, storage = globalThis.localStorage } = {}) {
  const key = getElBenchmarkDraftStorageKey({ teacherId, studentId });
  if (!key || !storage || !session || session.studentId !== studentId) return false;

  try {
    storage.setItem(key, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function deleteElBenchmarkDraft({ teacherId, studentId, storage = globalThis.localStorage } = {}) {
  const key = getElBenchmarkDraftStorageKey({ teacherId, studentId });
  if (!key || !storage) return false;

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function normalizedOwnershipId(value) {
  return String(value || "").trim();
}

/**
 * Treat the ownership captured when an EL assessment started as immutable.
 *
 * `activeSession` is the session held by App state and is therefore the
 * authority. `session` is the updated copy returned by the assessment screen.
 * The screen may add responses and completion metadata, but it may never move
 * the attempt to a different learner, class, teacher or session identity.
 *
 * The selected teacher context is checked as well. This means that changing
 * from Class A to Class B while a Class A assessment is unfinished cannot save
 * or resume that assessment under Class B.
 */
export function resolveElBenchmarkSessionOwnership({
  session = null,
  activeSession = session,
  currentTeacherId = "",
  currentStudentId = "",
  selectedClassId = ""
} = {}) {
  const authority = {
    sessionId: normalizedOwnershipId(activeSession?.sessionId),
    studentId: normalizedOwnershipId(activeSession?.studentId),
    classId: normalizedOwnershipId(activeSession?.classId),
    teacherId: normalizedOwnershipId(activeSession?.teacherId)
  };
  const candidate = {
    sessionId: normalizedOwnershipId(session?.sessionId),
    studentId: normalizedOwnershipId(session?.studentId),
    classId: normalizedOwnershipId(session?.classId),
    teacherId: normalizedOwnershipId(session?.teacherId)
  };

  if (!authority.sessionId || !authority.studentId || !authority.classId || !authority.teacherId) {
    return {
      ok: false,
      reason: "missing_session_ownership",
      ...authority
    };
  }

  if (
    candidate.sessionId !== authority.sessionId
    || candidate.studentId !== authority.studentId
    || candidate.classId !== authority.classId
    || candidate.teacherId !== authority.teacherId
  ) {
    return {
      ok: false,
      reason: "session_ownership_changed",
      ...authority
    };
  }

  const currentContext = {
    teacherId: normalizedOwnershipId(currentTeacherId),
    studentId: normalizedOwnershipId(currentStudentId),
    classId: normalizedOwnershipId(selectedClassId)
  };
  if (
    currentContext.teacherId !== authority.teacherId
    || currentContext.studentId !== authority.studentId
    || currentContext.classId !== authority.classId
  ) {
    return {
      ok: false,
      reason: "different_teacher_context",
      ...authority
    };
  }

  return {
    ok: true,
    reason: "ownership_confirmed",
    ...authority
  };
}

export function getStudentDisplayName(studentName, fallback = "Unnamed student") {
  return String(studentName || "").trim() || fallback;
}

export function getSelectedClassName(classList = [], selectedClassId = null, fallback = "No class selected") {
  return classList.find(cls => cls.id === selectedClassId)?.name || fallback;
}
