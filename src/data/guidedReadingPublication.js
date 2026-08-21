import { normalizeGuidedReadingReview } from "../policy/guidedReadingApprovalPolicy.js";

export {
  GUIDED_READING_PUBLICATION_MODEL,
  GUIDED_READING_REVIEW_STATUSES,
  approvedGuidedReadingBookIds,
  filterApprovedGuidedReadingBooks,
  filterPublishedGuidedReadingBooks,
  guidedReadingReviewMap,
  normalizeGuidedReadingReview,
  quarantinedGuidedReadingBookIds
} from "../policy/guidedReadingApprovalPolicy.js";

/**
 * Guided Reading publication.
 *
 * Child publication follows continuous review. New and unreported books are
 * accepted; a recorded quarantine removes a book immediately. The public read
 * uses a projection containing book ids only, so repair notes remain private.
 */
export async function loadGuidedReadingBookReviews({ client, includeAll = false } = {}) {
  if (!client?.table) {
    return {
      complete: false,
      error: null,
      rows: [],
      status: "unavailable"
    };
  }

  const query = includeAll
    ? client
      .table("guided_reading_book_reviews")
      .select("book_id,status,review_note,reviewed_by,reviewed_at")
      .order("reviewed_at", { ascending: false })
    : client
      .table("guided_reading_quarantines")
      .select("book_id,status")
      .order("book_id", { ascending: true });
  const { data, error } = await query;

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
    return { ok: false, error: new Error("Choose Keep accepted or Report defect.") };
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
