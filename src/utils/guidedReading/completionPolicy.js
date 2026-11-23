import { currentGuidedReadingRecord, getCurrentGuidedReadingRecord, guidedReadingEdition } from "./editions.js";

// Older records did not store an explicit Finish flag. Only those records
// can use page coverage as historical (inferred) completion evidence.
function historicalCompletion(record, totalPages) {
  if (Number.isInteger(record.legacyReadCount)) {
    return { count: record.legacyReadCount, inferred: record.legacyCompletionInferred === true, completedAt: record.legacyCompletedAt || "" };
  }
  const inferred = typeof record.completed !== "boolean"
    && !record.completedAt
    && !(Number(record.readCount) > 0)
    && totalPages > 0
    && Math.max(Number(record.completedPages) || 0, Object.keys(record.pages || {}).length) >= totalPages;
  const completed = record.completed === true || (record.completed !== false && (
    Boolean(record.completedAt) || Number(record.readCount) > 0 || inferred
  ));
  return { count: completed ? Math.max(1, Number(record.readCount) || 0) : 0, inferred, completedAt: completed ? record.completedAt || "" : "" };
}

function latestGuidedReadingOccurrence(record) {
  const [id, startedAt] = Object.entries(record.readingOccurrences || {})
    .sort(([idA, timeA], [idB, timeB]) => timeB - timeA || idA.localeCompare(idB))[0] || [];
  return id ? { id, startedAt } : null;
}

export function guidedReadingCompletion(record = {}, totalPages = Number(record.totalPages) || 0) {
  const legacy = historicalCompletion(record, totalPages);
  const finishes = Object.values(record.finishedReadingOccurrences || {});
  const readCount = legacy.count + finishes.length;
  const occurrenceId = latestGuidedReadingOccurrence(record)?.id;
  return {
    readCount,
    completed: readCount > 0,
    completionEvidence: finishes.length || (legacy.count && !legacy.inferred)
      ? "confirmed" : legacy.count ? "legacy-inferred" : "",
    completedAt: legacy.completedAt || finishes.sort()[0] || "",
    readingInProgress: Boolean(occurrenceId && !Object.hasOwn(record.finishedReadingOccurrences || {}, occurrenceId))
  };
}

export function startGuidedReadingOccurrence(record, { readAgain = false, totalPages, now = new Date().toISOString() } = {}) {
  const progress = guidedReadingCompletion(record, totalPages);
  if (progress.readingInProgress) return latestGuidedReadingOccurrence(record);
  if (progress.completed && !readAgain) return null;
  const id = globalThis.crypto?.randomUUID?.() || `reading-${now}-${Math.random().toString(36).slice(2)}`;
  return { id, startedAt: Math.max(Date.parse(now), (latestGuidedReadingOccurrence(record)?.startedAt || 0) + 1) };
}

export function guidedReadingVisitPatch(record, { occurrence, pageIndex, totalPages, now }) {
  const legacy = historicalCompletion(record, totalPages);
  const progress = guidedReadingCompletion(record, totalPages);
  // The existing cloud merge takes the numeric maximum at each page key.
  // A delayed save cannot mix the page number from one visit with the
  // timestamp of another or shift a newer reread back to its last page.
  const positions = record.readingPagePositions || {};
  const visitTime = Math.max(Date.parse(now), Math.max(0, ...Object.values(positions)) + 1);
  return {
    legacyReadCount: legacy.count,
    legacyCompletionInferred: legacy.inferred,
    legacyCompletedAt: legacy.completedAt,
    completed: progress.completed,
    readCount: progress.readCount,
    firstReadAt: record.firstReadAt || now,
    lastReadAt: now,
    readingPagePositions: { ...positions, [pageIndex]: visitTime },
    lastPageIndex: pageIndex,
    completedPages: Math.min(totalPages, Math.max(Number(record.completedPages) || 0, pageIndex + 1)),
    totalPages,
    ...(occurrence ? { readingOccurrences: { ...record.readingOccurrences, [occurrence.id]: occurrence.startedAt } } : {})
  };
}

export function finishGuidedReadingOccurrence(record, { occurrence, totalPages, now }) {
  if (!occurrence?.id || Object.hasOwn(record.finishedReadingOccurrences || {}, occurrence.id)) return null;
  const visit = guidedReadingVisitPatch(record, { occurrence, pageIndex: totalPages - 1, totalPages, now });
  return {
    ...visit,
    completed: true,
    completedAt: guidedReadingCompletion(record, totalPages).completedAt || now,
    readCount: visit.readCount + 1,
    finishedReadingOccurrences: { ...record.finishedReadingOccurrences, [occurrence.id]: now }
  };
}

export function mergeGuidedReadingEvidence(previous = {}, incoming = {}, merged = { ...previous, ...incoming }) {
  previous ||= {};
  incoming ||= {};
  // Flagless legacy records alone keep the old merge behavior. Once the
  // occurrence format exists, completion is append-only and position is dated.
  if (!Number.isInteger(previous.legacyReadCount) && !Number.isInteger(incoming.legacyReadCount)) return merged;
  const totalPages = Number(merged.totalPages) || 0;
  const previousLegacy = historicalCompletion(previous, totalPages);
  const incomingLegacy = historicalCompletion(incoming, totalPages);
  // A flagless full-page row may predate a modern explicit unfinished record.
  // Keep the latter authoritative while keeping genuine archived Finish events.
  const legacy = previousLegacy.inferred && !Number.isInteger(previous.legacyReadCount) && typeof incoming.completed === "boolean"
    ? incomingLegacy
    : incomingLegacy.inferred && !Number.isInteger(incoming.legacyReadCount) && typeof previous.completed === "boolean"
      ? previousLegacy : previousLegacy.count > incomingLegacy.count ? previousLegacy : incomingLegacy;
  const finished = { ...previous.finishedReadingOccurrences, ...incoming.finishedReadingOccurrences };
  const readCount = legacy.count + Object.keys(finished).length;
  const latestVisit = (Date.parse(previous.lastReadAt) || 0) > (Date.parse(incoming.lastReadAt) || 0) ? previous : incoming;
  const readingPagePositions = { ...previous.readingPagePositions };
  for (const [page, time] of Object.entries(incoming.readingPagePositions || {})) {
    readingPagePositions[page] = Math.max(time, readingPagePositions[page] || 0);
  }
  return {
    ...merged,
    completed: readCount > 0,
    completedAt: legacy.completedAt || Object.values(finished).sort()[0] || "",
    readCount,
    legacyReadCount: legacy.count,
    legacyCompletionInferred: legacy.inferred,
    legacyCompletedAt: legacy.completedAt,
    finishedReadingOccurrences: finished,
    readingOccurrences: { ...previous.readingOccurrences, ...incoming.readingOccurrences },
    readingPagePositions,
    ...(latestVisit.lastReadAt ? { lastReadAt: latestVisit.lastReadAt } : {})
  };
}

export function shouldShowGuidedReadingCompletionSummary({ mode, studentId } = {}) {
  return mode === "teacher" && Boolean(String(studentId || "").trim());
}

function normalizeBookType(type = "") {
  const normalized = String(type || "").toLowerCase().replace(/[^a-z]/g, "");
  return normalized === "fiction" ? "fiction" : "nonfiction";
}

export function getGuidedReadingProgressionBooks({ book, books = [] } = {}) {
  if (book?.readingBandProfile === "read-aloud") return [];
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
  if (book?.readingBandProfile === "read-aloud") return null;
  // Extended Level C read-together completions are retained as reading history,
  // but C Standard is the only progression sequence.
  if (book?.level === "C" && book?.readingBandProfile === "extended") return null;
  const progressionBooks = book?.level === "C"
    ? levelBooks.filter(candidate => candidate.readingBandProfile !== "extended")
    : levelBooks;
  const allDone = progressionBooks.length > 1 && progressionBooks.every(candidate =>
    candidate.id === book?.id || guidedReadingCompletion(getCurrentGuidedReadingRecord(candidate, records), candidate.pages?.length).completed
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
  previous = currentGuidedReadingRecord(book, previous);
  const edition = guidedReadingEdition(book);
  return {
    ...previous,
    ...(edition ? { edition } : {}),
    studentId,
    bookId: book.id,
    title: book.title,
    type: book.type,
    level: book.level,
    updatedAt: now,
    ...patch
  };
}
