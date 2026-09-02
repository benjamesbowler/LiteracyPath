export function shouldShowGuidedReadingCompletionSummary({ mode, studentId } = {}) {
  return mode === "teacher" && Boolean(String(studentId || "").trim());
}

export function getGuidedReadingCompletionMilestone({ book, levelBooks = [], records = {} } = {}) {
  const allDone = levelBooks.length > 1 && levelBooks.every(candidate =>
    candidate.id === book?.id || Boolean(records[candidate.id]?.completed || records[candidate.id]?.completedAt)
  );
  return allDone ? { level: book.level, count: levelBooks.length } : null;
}

export function buildGuidedReadingCompletionPatch({
  now = new Date().toISOString(),
  totalPages = 0,
  wasCompleted = false,
  readCount = 0,
  completedAt = ""
} = {}) {
  return {
    completed: true,
    completedAt: completedAt || now,
    lastReadAt: now,
    readCount: wasCompleted ? Number(readCount || 1) + 1 : Math.max(1, Number(readCount || 0) + 1),
    completedPages: totalPages,
    totalPages
  };
}
