export function getTeacherProfileStorageKey(teacherId) {
  return teacherId ? `readingMasteryProfile:${teacherId}` : null;
}

export function getGuidedReadingStorageKey({ teacherId, studentId } = {}) {
  if (!teacherId || !studentId) return null;
  return `guidedReadingAssessment:${teacherId}:${studentId}`;
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

export function getStudentDisplayName(studentName, fallback = "Unnamed student") {
  return String(studentName || "").trim() || fallback;
}

export function getSelectedClassName(classList = [], selectedClassId = null, fallback = "Selected class") {
  return classList.find(cls => cls.id === selectedClassId)?.name || fallback;
}
