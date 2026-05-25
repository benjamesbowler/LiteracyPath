import { useEffect, useRef, useState } from "react";

function getStoredProgress() {
  try {
    return JSON.parse(localStorage.getItem("lpPublicDomainReadingProgress") || "{}");
  } catch {
    return {};
  }
}

function saveStoredProgress(records) {
  localStorage.setItem("lpPublicDomainReadingProgress", JSON.stringify(records));
}

export function loadPublicDomainReadingProgress() {
  if (typeof localStorage === "undefined") return {};
  return getStoredProgress();
}

export function savePublicDomainPageProgress(book, pageIndex) {
  if (!book?.id || typeof localStorage === "undefined") return {};
  const now = new Date().toISOString();
  const records = getStoredProgress();
  const previous = records[book.id] || {};
  const totalPages = Number(book.pageCount || book.pages?.length || 0);
  const currentPage = Math.min(totalPages, pageIndex + 1);
  const completed = totalPages > 0 && currentPage >= totalPages;

  records[book.id] = {
    bookId: book.id,
    title: book.title,
    gradeBand: book.gradeBand,
    difficulty: book.difficulty,
    firstReadAt: previous.firstReadAt || now,
    lastReadAt: now,
    currentPage,
    completed,
    completedAt: completed ? previous.completedAt || now : previous.completedAt || null,
    rereadCount: completed && previous.completed ? Number(previous.rereadCount || 0) + 1 : Number(previous.rereadCount || 0)
  };

  saveStoredProgress(records);
  return records;
}

export default function PageTurnReader({ book, onClose, onProgressChange }) {
  const pages = book?.pages || [];
  const [pageIndex, setPageIndex] = useState(0);
  const touchStartRef = useRef(null);
  const currentPage = pages[pageIndex];
  const hasPages = pages.length > 0;

  useEffect(() => {
    if (!book?.id) return;
    const records = savePublicDomainPageProgress(book, pageIndex);
    onProgressChange?.(records);
  }, [book?.id, pageIndex]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "ArrowLeft") setPageIndex(index => Math.max(0, index - 1));
      if (event.key === "ArrowRight") setPageIndex(index => Math.min(pages.length - 1, index + 1));
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pages.length, onClose]);

  function handleTouchStart(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event) {
    const start = touchStartRef.current;
    const touch = event.changedTouches?.[0];
    touchStartRef.current = null;
    if (!start || !touch) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > 70) return;
    setPageIndex(index => deltaX < 0 ? Math.min(pages.length - 1, index + 1) : Math.max(0, index - 1));
  }

  return (
    <section className="pd-reader" aria-label={`${book?.title || "Book"} reader`}>
      <header className="pd-reader-header">
        <div>
          <p className="panel-label">Public-Domain Library</p>
          <h2>{book?.title}</h2>
          <p>{book?.author || "Public domain"} · {book?.gradeBand} · {book?.difficulty}</p>
        </div>
        <button className="lp-button lp-button-secondary" onClick={onClose} type="button">
          Back to Library
        </button>
      </header>

      <div className="pd-reader-stage" onTouchEnd={handleTouchEnd} onTouchStart={handleTouchStart}>
        {hasPages && currentPage?.image ? (
          <img alt={currentPage.text || `${book.title} page ${pageIndex + 1}`} src={currentPage.image} />
        ) : (
          <div className="pd-reader-page-missing">
            <strong>Page images are pending.</strong>
            <p>
              This curated book is ready in the library index, but the original PDF and rendered page images still need to be downloaded and processed.
            </p>
            {book?.sourceUrl && <a href={book.sourceUrl} rel="noreferrer" target="_blank">Open source lookup</a>}
          </div>
        )}
      </div>

      <footer className="pd-reader-controls">
        <button
          className="lp-button lp-button-secondary"
          disabled={!hasPages || pageIndex === 0}
          onClick={() => setPageIndex(index => Math.max(0, index - 1))}
          type="button"
        >
          Previous
        </button>
        <strong>{hasPages ? `Page ${pageIndex + 1} of ${pages.length}` : "Pages pending"}</strong>
        <button
          className="lp-button lp-button-primary"
          disabled={!hasPages || pageIndex >= pages.length - 1}
          onClick={() => setPageIndex(index => Math.min(pages.length - 1, index + 1))}
          type="button"
        >
          Next
        </button>
      </footer>
    </section>
  );
}
