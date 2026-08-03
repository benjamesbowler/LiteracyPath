export const GUIDED_READING_REVIEW_STATUSES = Object.freeze({
  APPROVED: "approved",
  PENDING: "pending",
  QUARANTINED: "quarantined"
});

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

export function filterApprovedGuidedReadingBooks(books = [], approvedBookIds = []) {
  const approved = approvedBookIds instanceof Set
    ? approvedBookIds
    : new Set(approvedBookIds);
  return books.filter(book => approved.has(book?.id));
}

export async function loadGuidedReadingBookReviews({ client } = {}) {
  if (!client?.table) {
    return {
      complete: false,
      error: new Error("Guided Reading publication service is unavailable."),
      rows: [],
      status: "unavailable"
    };
  }

  const { data, error } = await client
    .table("guided_reading_book_reviews")
    .select("book_id,status,review_note,reviewed_by,reviewed_at")
    .order("reviewed_at", { ascending: false });

  if (error) {
    return { complete: false, error, rows: [], status: "error" };
  }

  return {
    complete: true,
    error: null,
    rows: (data || []).map(normalizeGuidedReadingReview).filter(Boolean),
    status: "ready"
  };
}

export async function saveGuidedReadingBookReview({
  client,
  bookId,
  status,
  reviewNote = "",
  reviewerId
} = {}) {
  const normalizedBookId = String(bookId || "").trim();
  const normalizedStatus = String(status || "").toLowerCase();
  const normalizedNote = String(reviewNote || "").trim();

  if (!client?.table || !reviewerId || !normalizedBookId) {
    return { ok: false, error: new Error("Admin review details are incomplete.") };
  }
  if (!["approved", "quarantined"].includes(normalizedStatus)) {
    return { ok: false, error: new Error("Choose Pass or Fail.") };
  }
  if (normalizedStatus === "quarantined" && !normalizedNote) {
    return { ok: false, error: new Error("Describe what needs fixing before quarantining this book.") };
  }

  const reviewedAt = new Date().toISOString();
  const { data, error } = await client
    .table("guided_reading_book_reviews")
    .upsert({
      book_id: normalizedBookId,
      status: normalizedStatus,
      review_note: normalizedStatus === "quarantined" ? normalizedNote : "",
      reviewed_by: reviewerId,
      reviewed_at: reviewedAt,
      updated_at: reviewedAt
    }, { onConflict: "book_id" })
    .select("book_id,status,review_note,reviewed_by,reviewed_at")
    .single();

  if (error) return { ok: false, error };
  return { ok: true, review: normalizeGuidedReadingReview(data) };
}
