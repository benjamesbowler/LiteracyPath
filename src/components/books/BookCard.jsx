import ReadingProgressBadge from "./ReadingProgressBadge.jsx";

function coverIsAvailable(book) {
  return Boolean(book?.cover && book?.processingStatus === "processed");
}

function getLibraryStatus(book, canOpen) {
  if (canOpen && book?.active) return "Available";
  if (!book?.pdfUrl) return "Needs PDF";
  if (book?.downloadStatus !== "downloaded") return "Needs PDF";
  if (book?.processingStatus !== "processed") return "Needs processing";
  if (book?.libraryStatus === "needs_review") return "Needs review";
  return "Coming soon";
}

export default function BookCard({ book, progress, onRead }) {
  const pageCount = Number(book?.pageCount || book?.pages?.length || 0);
  const canOpen = Boolean(book?.active && pageCount > 0);
  const status = getLibraryStatus(book, canOpen);

  return (
    <article className={canOpen ? "pd-book-card" : "pd-book-card pending"}>
      <span className={canOpen ? "pd-book-status available" : "pd-book-status"}>{status}</span>
      <div className="pd-book-cover">
        {coverIsAvailable(book) ? (
          <img alt="" src={book.cover} />
        ) : (
          <div className="pd-book-cover-fallback" aria-label={`${book.title} cover pending`}>
            <span>{book.gradeBand}</span>
            <strong>{book.title}</strong>
            <small>{book.difficulty}</small>
          </div>
        )}
      </div>

      <div className="pd-book-card-body">
        <h3>{book.title}</h3>
        <p>{book.author || "Public domain"} · {book.gradeBand} · {book.difficulty}</p>
        <div className="pd-book-tags" aria-label="Book tags">
          {(book.tags || []).slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}
        </div>
        <ReadingProgressBadge book={book} progress={progress} />
        <button
          className={canOpen ? "lp-button lp-button-primary" : "lp-button lp-button-secondary"}
          disabled={!canOpen}
          onClick={() => canOpen && onRead(book)}
          type="button"
        >
          {progress?.completed ? "Read Again" : canOpen ? "Read" : status}
        </button>
      </div>
    </article>
  );
}
