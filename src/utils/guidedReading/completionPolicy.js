export function shouldShowGuidedReadingCompletionSummary({ mode, studentId } = {}) {
  return mode === "teacher" && Boolean(String(studentId || "").trim());
}

export function getGuidedReadingCompletionMilestone({ book, levelBooks = [], records = {} } = {}) {
  const allDone = levelBooks.length > 1 && levelBooks.every(candidate =>
    candidate.id === book?.id || Boolean(records[candidate.id]?.completed || records[candidate.id]?.completedAt)
  );
  return allDone ? { level: book.level, count: levelBooks.length } : null;
}

export function mergeGuidedReadingRecord({
  previous = {},
  studentId = "",
  book = {},
  now = new Date().toISOString(),
  patch = {}
} = {}) {
  return {
    ...previous,
    studentId,
    bookId: book.id,
    title: book.title,
    type: book.type,
    level: book.level,
    updatedAt: now,
    ...patch
  };
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
