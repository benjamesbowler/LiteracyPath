import { useMemo, useState } from "react";

import { guidedReadingReviewMap } from "../../data/guidedReadingPublication.js";
import { getRuntimeGuidedReadingBooks } from "../../utils/guidedReading/runtimeBooks.js";
import { GuidedReadingPage } from "../guided-reading/GuidedReadingPage.jsx";

const FILTERS = Object.freeze([
  { id: "pending", label: "Awaiting review" },
  { id: "quarantined", label: "Quarantine" },
  { id: "approved", label: "Live" },
  { id: "all", label: "All books" }
]);

function reviewStatusFor(bookId, reviewByBookId) {
  return reviewByBookId[bookId]?.status || "pending";
}

export function GuidedReadingReviewPanel({
  reviews = [],
  reviewStatus = "loading",
  reviewError = null,
  onRefresh,
  onReviewBook
}) {
  const books = useMemo(() => getRuntimeGuidedReadingBooks(), []);
  const reviewByBookId = useMemo(() => guidedReadingReviewMap(reviews), [reviews]);
  const [filter, setFilter] = useState("pending");
  const [selectedBookId, setSelectedBookId] = useState("");

  const counts = useMemo(() => books.reduce((result, book) => {
    const status = reviewStatusFor(book.id, reviewByBookId);
    result[status] += 1;
    result.all += 1;
    return result;
  }, { pending: 0, quarantined: 0, approved: 0, all: 0 }), [books, reviewByBookId]);

  const filteredBooks = useMemo(() => books.filter(book => (
    filter === "all" || reviewStatusFor(book.id, reviewByBookId) === filter
  )), [books, filter, reviewByBookId]);
  const selectedBook = books.find(book => book.id === selectedBookId) || null;

  return (
    <section className="admin-guided-review page-stack" data-review-load-status={reviewStatus}>
      <header className="admin-section-heading">
        <div>
          <p className="panel-label">Child publication gate</p>
          <h3>Guided Reading review</h3>
          <p className="muted-text">
            Children only receive books marked Live. New and failed books stay hidden everywhere on the child side.
          </p>
        </div>
        <button className="lp-button lp-button-secondary" disabled={reviewStatus === "loading"} onClick={onRefresh} type="button">
          {reviewStatus === "loading" ? "Refreshing…" : "Refresh reviews"}
        </button>
      </header>

      {reviewError && (
        <div className="admin-section-warning" role="alert">
          Reviews could not be loaded. Child libraries remain closed until the publication service is available.
        </div>
      )}

      <div className="admin-guided-review-filters" role="group" aria-label="Filter guided reading reviews">
        {FILTERS.map(item => (
          <button
            aria-pressed={filter === item.id}
            className={filter === item.id ? "active" : ""}
            key={item.id}
            onClick={() => {
              setFilter(item.id);
              setSelectedBookId("");
            }}
            type="button"
          >
            <span>{item.label}</span>
            <strong>{counts[item.id]}</strong>
          </button>
        ))}
      </div>

      {!selectedBook ? (
        <div className="admin-guided-review-queue">
          {filteredBooks.length === 0 ? (
            <p className="admin-guided-review-empty">No books in this queue.</p>
          ) : filteredBooks.map(book => {
            const review = reviewByBookId[book.id];
            const status = review?.status || "pending";
            return (
              <button
                className="admin-guided-review-book"
                data-review-status={status}
                key={book.id}
                onClick={() => setSelectedBookId(book.id)}
                type="button"
              >
                <img alt="" src={book.coverImage || book.pages?.[0]?.image} />
                <span>
                  <small>Level {book.level} · {book.pages.length} pages</small>
                  <strong>{book.title}</strong>
                  <em>
                    {status === "approved" ? "Live for children" : status === "quarantined" ? "Quarantined" : "Awaiting review"}
                  </em>
                  {status === "quarantined" && review.reviewNote && <b>{review.reviewNote}</b>}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="admin-guided-review-reader page-stack">
          <button className="lp-button lp-button-secondary admin-guided-review-back" onClick={() => setSelectedBookId("")} type="button">
            Back to review queue
          </button>
          <GuidedReadingPage
            books={books}
            guidedReadingRecords={{}}
            initialBookId={selectedBook.id}
            key={selectedBook.id}
            mode="adminReview"
            onReviewBook={onReviewBook}
            reviewByBookId={reviewByBookId}
            saveGuidedReadingRecord={() => {}}
            speakText={() => {}}
            studentId=""
            studentName=""
          />
        </div>
      )}
    </section>
  );
}
