import { currentGuidedReadingRecord } from "./editions.js";
// Page position is separate from the furthest page reached and book completion.
export function guidedReadingBookmark(book, record = {}, requestedIndex = null) {
  if (!book?.historicalEdition) record = currentGuidedReadingRecord(book, record);
  const pageCount = book?.pages?.length || book?.historicalPageCount || Number(record.totalPages) || 0;
  const valid = value => Number.isInteger(value) && value >= 0 && value < pageCount;
  if (valid(requestedIndex)) return requestedIndex;
  const latestPosition = Object.entries(record.readingPagePositions || {})
    .map(([index, at]) => ({ index: Number(index), at }))
    .filter(position => valid(position.index) && Number.isFinite(position.at))
    .sort((a, b) => b.at - a.at)[0];
  if (latestPosition) return latestPosition.index;
  if (valid(record.lastPageIndex)) return record.lastPageIndex;
  const visits = Object.entries(record.pageStats || {})
    .map(([page, stats]) => ({ index: Number(page) - 1, at: Date.parse(stats?.lastOpenedAt || '') }))
    .filter(visit => valid(visit.index) && Number.isFinite(visit.at))
    .sort((a, b) => b.at - a.at);
  if (visits.length) return visits[0].index;
  const legacyIndex = Number(record.completedPages || 0) - 1;
  return valid(legacyIndex) ? legacyIndex : 0;
}
