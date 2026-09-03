export function shouldShowGuidedReadingCompletionSummary({ mode, studentId } = {}) {
  return mode === "teacher" && Boolean(String(studentId || "").trim());
}

function normalizeBookType(type = "") {
  const normalized = String(type || "").toLowerCase().replace(/[^a-z]/g, "");
  return normalized === "fiction" ? "fiction" : "nonfiction";
}

export function getGuidedReadingProgressionBooks({ book, books = [] } = {}) {
  if (!book?.level) return [];
  if (book.level === "C") {
    return books.filter(candidate => (
      candidate.level === "C" && candidate.readingBandProfile === "standard"
    ));
  }
  const selectedType = normalizeBookType(book.type);
  return books.filter(candidate => (
    candidate.level === book.level && normalizeBookType(candidate.type) === selectedType
  ));
}

export function getGuidedReadingCompletionMilestone({ book, levelBooks = [], records = {} } = {}) {
  // Extended Level C read-together completions are retained as reading history,
  // but C Standard is the only progression sequence.
  if (book?.level === "C" && book?.readingBandProfile === "extended") return null;
  const progressionBooks = book?.level === "C"
    ? levelBooks.filter(candidate => candidate.readingBandProfile !== "extended")
    : levelBooks;
  const allDone = progressionBooks.length > 1 && progressionBooks.every(candidate =>
    candidate.id === book?.id || Boolean(records[candidate.id]?.completed || records[candidate.id]?.completedAt)
  );
  return allDone ? { level: book.level, count: progressionBooks.length } : null;
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
