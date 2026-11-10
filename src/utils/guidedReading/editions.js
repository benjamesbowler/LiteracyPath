// Whole-topic replacements only. Public catalogue IDs remain stable; saved
// reading evidence uses a separate key so an old device cannot merge one text's
// marks or completion into another. Ordinary prose corrections keep their key.
// Retired titles/counts are the published b43e872f0 manuscripts, fully audited
// before replacement; they never come from the new text or a guessed level.
export const GUIDED_READING_TOPIC_EDITIONS = Object.freeze({
  "world-discovery-b-21": { retiredTitle: "A Train for Heavy Loads", retiredPageCount: 8, edition: "world-discovery-2026-11-10" },
  "world-discovery-c-21": { retiredTitle: "My Bag at the Airport", retiredPageCount: 8, edition: "world-discovery-2026-11-10" },
  "world-discovery-d-21": { retiredTitle: "A Container's Journey", retiredPageCount: 10, edition: "world-discovery-2026-11-10" },
  "world-discovery-e-21": { retiredTitle: "How Do We Choose a Ride?", retiredPageCount: 10, edition: "world-discovery-2026-11-10" },
  "world-discovery-e-22": { retiredTitle: "City, Town or Village?", retiredPageCount: 10, edition: "world-discovery-2026-11-10" }
});

export function guidedReadingEdition(book = {}) {
  const policy = GUIDED_READING_TOPIC_EDITIONS[book.id];
  // Activation follows the actual manuscript, including in authoring previews.
  return policy && book.title && book.title !== policy.retiredTitle ? policy.edition : "";
}

export function guidedReadingProgressKey(book = {}) {
  const edition = guidedReadingEdition(book);
  return edition ? `${book.id}::${edition}` : book.id;
}

export function guidedReadingContentId(recordKey = "") {
  const [id, edition] = String(recordKey).split("::");
  return GUIDED_READING_TOPIC_EDITIONS[id]?.edition === edition && recordKey === `${id}::${edition}` ? id : recordKey;
}

export function currentGuidedReadingRecord(book = {}, record = {}) {
  const edition = guidedReadingEdition(book);
  if (edition && record?.edition !== edition && record?.bookId !== guidedReadingProgressKey(book)) return {};
  return record || {};
}

export function getCurrentGuidedReadingRecord(book = {}, records = {}) {
  const record = records[guidedReadingProgressKey(book)];
  if (!record) return {};
  // The existing shared-reading RPC stores its frozen internal book key.
  // Its key already identifies the edition; no server schema change is needed.
  return { ...record, bookId: book.id, ...(guidedReadingEdition(book) ? { edition: guidedReadingEdition(book) } : {}) };
}

export function isGuidedReadingAssignmentCurrent(book = {}, frozenTitle) {
  // Assigned-book sessions already freeze this title in resolved_config.
  // A former topic must not silently become a different teacher assignment.
  return !guidedReadingEdition(book) || frozenTitle === book.title;
}

// Reports describe the text actually read, not whatever now occupies its shelf
// ID. Retired records retain their own dates, page counts, notes and word text.
export function guidedReadingHistoryBook(book = {}, record = {}, recordKey = "") {
  const id = guidedReadingContentId(recordKey || record.bookId || book.id);
  const policy = GUIDED_READING_TOPIC_EDITIONS[id];
  const historical = Boolean(policy && record.edition !== policy.edition && recordKey !== `${id}::${policy.edition}`);
  return historical ? {
    id: recordKey || id,
    title: record.title || policy.retiredTitle,
    level: record.level || "",
    type: record.type || book.type,
    seriesTitle: record.seriesTitle || book.seriesTitle,
    historicalEdition: true,
    historicalPageCount: policy.retiredPageCount
  } : { ...book, id: recordKey || book.id || id, ...(policy && record.title ? { title: record.title } : {}) };
}
