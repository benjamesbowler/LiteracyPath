/** Child publication is fail-closed: only an explicit approval is live. */
export const GUIDED_READING_REVIEW_STATUSES = Object.freeze({
  APPROVED: "approved",
  PENDING: "pending",
  QUARANTINED: "quarantined"
});

export const GUIDED_READING_PUBLICATION_MODEL = "approved_only";

export function normalizeGuidedReadingReview(row = {}) {
  const status = String(row.status || "").toLowerCase();
  const bookId = row.book_id || row.bookId;
  if (!bookId || !["approved", "quarantined"].includes(status)) return null;
  return Object.freeze({
    bookId: String(bookId),
    status,
    reviewNote: String(row.review_note ?? row.reviewNote ?? ""),
    reviewedAt: row.reviewed_at || row.reviewedAt || "",
    reviewedBy: row.reviewed_by || row.reviewedBy || ""
  });
}

export function guidedReadingReviewMap(rows = []) {
  return Object.fromEntries(
    rows
      .map(normalizeGuidedReadingReview)
      .filter(Boolean)
      .map(review => [review.bookId, review])
  );
}

export function approvedGuidedReadingBookIds(rows = []) {
  return rows
    .map(normalizeGuidedReadingReview)
    .filter(review => review?.status === GUIDED_READING_REVIEW_STATUSES.APPROVED)
    .map(review => review.bookId);
}

export function quarantinedGuidedReadingBookIds(rows = []) {
  return rows
    .map(normalizeGuidedReadingReview)
    .filter(review => review?.status === GUIDED_READING_REVIEW_STATUSES.QUARANTINED)
    .map(review => review.bookId);
}

export function filterPublishedGuidedReadingBooks(books = [], approvedBookIds = []) {
  const approved = approvedBookIds instanceof Set
    ? approvedBookIds
    : new Set(approvedBookIds || []);
  if (!approved.size) return [];
  return books.filter(book => approved.has(book?.id));
}

export function filterApprovedGuidedReadingBooks(books = [], approvedBookIds = []) {
  const approved = approvedBookIds instanceof Set
    ? approvedBookIds
    : new Set(approvedBookIds || []);
  return books.filter(book => approved.has(book?.id));
}
