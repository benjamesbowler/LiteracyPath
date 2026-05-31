export function getTeacherProfileStorageKey(teacherId) {
  return teacherId ? `readingMasteryProfile:${teacherId}` : null;
}

export function getGuidedReadingStorageKey({ teacherId, studentId } = {}) {
  if (!teacherId || !studentId) return null;
  return `guidedReadingAssessment:${teacherId}:${studentId}`;
}

export function getStudentDisplayName(studentName, fallback = "Unnamed student") {
  return String(studentName || "").trim() || fallback;
}

export function getSelectedClassName(classList = [], selectedClassId = null, fallback = "Selected class") {
  return classList.find(cls => cls.id === selectedClassId)?.name || fallback;
}
