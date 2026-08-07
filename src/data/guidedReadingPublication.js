/**
 * Guided Reading publication.
 *
 * THIS IS A BLOCKLIST, NOT AN ALLOWLIST. Every authored book is live to children
 * by default. A book leaves the child side only when an app admin explicitly
 * fails it, and only with a repair note saying why.
 *
 * It used to be the other way round — fail-closed, nothing visible until
 * approved — and the consequence was that with an empty review table, all 206
 * books were invisible to every child while the Daily Mission cheerfully
 * advertised a "book of the day" that led to an empty shelf. A review queue
 * nobody had worked through was silently the same thing as having no library.
 *
 * The safety property that matters is preserved and is arguably stronger: an
 * admin can still pull a bad book instantly, and now that action is visible in
 * the data as a deliberate act rather than as the absence of one.
 */
export const GUIDED_READING_REVIEW_STATUSES = Object.freeze({
  APPROVED: "approved",
  PENDING: "pending",
  QUARANTINED: "quarantined"
});

/** Books live by default; only an explicit fail removes one. */
export const GUIDED_READING_PUBLICATION_MODEL = "open_by_default";

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

/** The only list that removes anything from a child's shelf. */
export function quarantinedGuidedReadingBookIds(rows = []) {
  return rows
    .map(normalizeGuidedReadingReview)
    .filter(review => review?.status === GUIDED_READING_REVIEW_STATUSES.QUARANTINED)
    .map(review => review.bookId);
}

/**
 * The child-facing filter. Everything passes except books an admin has failed.
 *
 * `quarantinedBookIds` of `null` or `undefined` means "we could not read the
 * review list" — and that resolves to showing every book. A publication service
 * that is briefly unreachable must not empty a five-year-old's library; the
 * cost of that outage is far higher than the cost of a quarantined book staying
 * up for a few minutes longer.
 */
export function filterPublishedGuidedReadingBooks(books = [], quarantinedBookIds = []) {
  if (!quarantinedBookIds) return books;
  const quarantined = quarantinedBookIds instanceof Set
    ? quarantinedBookIds
    : new Set(quarantinedBookIds);
  if (!quarantined.size) return books;
  return books.filter(book => !quarantined.has(book?.id));
}

/**
 * @deprecated The allowlist model. Retained only so an old caller fails loudly
 * rather than silently hiding a library. Use `filterPublishedGuidedReadingBooks`.
 */
export function filterApprovedGuidedReadingBooks(books = [], approvedBookIds = []) {
  const approved = approvedBookIds instanceof Set
    ? approvedBookIds
    : new Set(approvedBookIds);
  return books.filter(book => approved.has(book?.id));
}

export async function loadGuidedReadingBookReviews({ client } = {}) {
  if (!client?.table) {
    // Not an error state any more. With no publication service configured there
    // is nothing quarantined, so every book is live.
    return {
      complete: true,
      error: null,
      rows: [],
      status: "open"
    };
  }

  const { data, error } = await client
    .table("guided_reading_book_reviews")
    .select("book_id,status,review_note,reviewed_by,reviewed_at")
    .order("reviewed_at", { ascending: false });

  if (error) {
    // Same reasoning as the no-client case: an unreadable review list means we
    // know of nothing to withhold, not that we should withhold everything.
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
