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
 * Child publication is fail-closed. A book is visible only after an app admin
 * records an explicit approval. Missing rows, an unreadable review service, and
 * newly authored books remain off child and teacher-assignment surfaces until
 * their content and media have been reviewed.
 */
export async function loadGuidedReadingBookReviews({ client } = {}) {
  if (!client?.table) {
    return {
      complete: false,
      error: null,
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
