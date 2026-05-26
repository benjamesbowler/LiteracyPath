import { useEffect, useRef, useState } from "react";
import { analyzeGuidedReadingPage, enrichGuidedReadingBook } from "../../utils/guidedReading/phonicsPageAnalyzer.js";
import { normalizeReadableBook } from "../../utils/guidedReading/normalizeReadableBook.js";

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

  const previousPageStats = previous.pageStats || {};
  const pageKey = String(currentPage);
  const previousPage = previousPageStats[pageKey] || {};

  records[book.id] = {
    bookId: book.id,
    title: book.title,
    gradeBand: book.gradeBand,
    difficulty: book.difficulty,
    firstReadAt: previous.firstReadAt || now,
    lastReadAt: now,
    currentPage,
    pageStats: {
      ...previousPageStats,
      [pageKey]: {
        ...previousPage,
        openedCount: Number(previousPage.openedCount || 0) + 1,
        rereadCount: Math.max(0, Number(previousPage.openedCount || 0)),
        lastOpenedAt: now
      }
    },
    completed,
    completedAt: completed ? previous.completedAt || now : previous.completedAt || null,
    rereadCount: completed && previous.completed ? Number(previous.rereadCount || 0) + 1 : Number(previous.rereadCount || 0)
  };

  saveStoredProgress(records);
  return records;
}

function savePublicDomainReadPageUsage(book, pageIndex) {
  if (!book?.id || typeof localStorage === "undefined") return {};
  const records = getStoredProgress();
  const previous = records[book.id] || {};
  const pageKey = String(pageIndex + 1);
  const previousPageStats = previous.pageStats || {};
  const previousPage = previousPageStats[pageKey] || {};
  records[book.id] = {
    ...previous,
    bookId: book.id,
    title: book.title,
    lastReadAt: new Date().toISOString(),
    readPageButtonUses: Number(previous.readPageButtonUses || 0) + 1,
    pageStats: {
      ...previousPageStats,
      [pageKey]: {
        ...previousPage,
        readPageButtonUses: Number(previousPage.readPageButtonUses || 0) + 1,
        lastReadPageAt: new Date().toISOString()
      }
    }
  };
  saveStoredProgress(records);
  return records;
}

export default function PageTurnReader({ book, onClose, onProgressChange }) {
  const readableBook = normalizeReadableBook(book || {});
  const pages = readableBook.pages || [];
  const [pageIndex, setPageIndex] = useState(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(null);
  const [isReadingPage, setIsReadingPage] = useState(false);
  const [audioNotice, setAudioNotice] = useState("");
  const touchStartRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const currentPage = pages[pageIndex];
  const hasPages = pages.length > 0;
  const isTitlePage = currentPage?.type === "title";
  const enrichedBook = enrichGuidedReadingBook(readableBook || {});
  const pageAnalysis = analyzeGuidedReadingPage(currentPage || {});
  const wordTokens = String(currentPage?.text || "").match(/[A-Za-z0-9'-]+|[^A-Za-z0-9'-]+/g) || [];
  let wordIndex = -1;

  function speakWithBrowserVoice(text = "", onEnd) {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) {
      onEnd?.();
      return false;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.86;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
    return true;
  }

  useEffect(() => {
    if (!readableBook?.id || !readableBook.validForReader) return;
    const records = savePublicDomainPageProgress(readableBook, pageIndex);
    onProgressChange?.(records);
  }, [readableBook?.id, readableBook.validForReader, pageIndex]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "ArrowLeft") setPageIndex(index => Math.max(0, index - 1));
      if (event.key === "ArrowRight") setPageIndex(index => Math.min(pages.length - 1, index + 1));
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pages.length, onClose]);

  useEffect(() => {
    setHighlightedWordIndex(null);
    setAudioNotice("");
    setIsReadingPage(false);
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
  }, [pageIndex, readableBook?.id]);

  useEffect(() => () => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
  }, []);

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

  function highlightWord(index) {
    setHighlightedWordIndex(index);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedWordIndex(null), 650);
  }

  function readWord(word, index) {
    highlightWord(index);
    setAudioNotice("Using browser voice while word audio is pending.");
    speakWithBrowserVoice(word);
  }

  function readPage() {
    if (!currentPage?.text) return;
    if (isReadingPage) {
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
      setIsReadingPage(false);
      return;
    }
    setIsReadingPage(true);
    onProgressChange?.(savePublicDomainReadPageUsage(readableBook, pageIndex));
    setAudioNotice(currentPage.audio ? "" : "Using browser voice while page narration is pending.");
    if (currentPage.audio) {
      const audio = new Audio(currentPage.audio);
      audio.onended = () => setIsReadingPage(false);
      audio.onerror = () => {
        setAudioNotice("Using browser voice because page narration could not be loaded.");
        speakWithBrowserVoice(currentPage.text, () => setIsReadingPage(false));
      };
      audio.play().catch(() => {
        setAudioNotice("Using browser voice because page narration could not be played.");
        speakWithBrowserVoice(currentPage.text, () => setIsReadingPage(false));
      });
      return;
    }
    speakWithBrowserVoice(currentPage.text, () => setIsReadingPage(false));
  }

  if (!readableBook.validForReader) {
    if (import.meta.env.DEV) {
      console.warn("[Guided Reading] Invalid readable book", {
        id: readableBook.id,
        sourceType: readableBook.sourceType,
        missingFields: readableBook.missingFields
      });
    }

    return (
      <section className="pd-reader" aria-label="Book not ready">
        <header className="pd-reader-header">
          <div>
            <p className="panel-label">Public-Domain Library</p>
            <h2>{readableBook.title}</h2>
            <p>{readableBook.sourceType} · {readableBook.id || "missing id"}</p>
          </div>
          <button className="lp-button lp-button-secondary" onClick={onClose} type="button">
            Back to Library
          </button>
        </header>

        <div className="pd-reader-page-missing">
          <strong>This book is not ready yet.</strong>
          <p>The book needs processed page images and page text before students can read it.</p>
          {readableBook.missingFields.length > 0 && <small>Missing: {readableBook.missingFields.join(", ")}</small>}
        </div>
      </section>
    );
  }

  return (
    <section className="pd-reader" aria-label={`${readableBook?.title || "Book"} reader`}>
      <header className="pd-reader-header">
        <div>
          <p className="panel-label">{readableBook.sourceType === "public-domain" ? "Public-Domain Library" : "Guided Reading"}</p>
          <h2>{readableBook?.title}</h2>
          <p>{readableBook?.author || "Public domain"} · {readableBook?.gradeBand} · {readableBook?.difficulty}</p>
        </div>
        <button className="lp-button lp-button-secondary" onClick={onClose} type="button">
          Back to Library
        </button>
      </header>

      <div className="pd-reader-stage" onTouchEnd={handleTouchEnd} onTouchStart={handleTouchStart}>
        {hasPages && currentPage?.image ? (
          <div className="pd-reader-spread">
            <img alt={currentPage.text || `${readableBook.title} page ${pageIndex + 1}`} src={currentPage.image} />
            <section className={isTitlePage ? "pd-reader-text-panel pd-reader-title-panel" : "pd-reader-text-panel"} aria-label="Page text">
              <button className="lp-button lp-button-secondary" onClick={readPage} type="button">
                {isReadingPage ? "Stop Reading" : "Read Page"}
              </button>
              <p>
                {wordTokens.map((token, index) => {
                  if (!/^[A-Za-z0-9'-]+$/.test(token)) return <span key={`text-${index}`}>{token}</span>;
                  wordIndex += 1;
                  const currentWordIndex = wordIndex;
                  return (
                    <button
                      className={highlightedWordIndex === currentWordIndex ? "pd-reader-word active" : "pd-reader-word"}
                      key={`word-${index}-${currentWordIndex}`}
                      onClick={() => readWord(token, currentWordIndex)}
                      type="button"
                    >
                      {token}
                    </button>
                  );
                })}
              </p>
              {audioNotice && <small>{audioNotice}</small>}
              {!isTitlePage && (
                <div className="guided-phonics-strip">
                  <span>{pageAnalysis.words.length} words</span>
                  {pageAnalysis.phonicsPatterns.slice(0, 4).map(pattern => <span key={pattern}>{pattern.replace(/-/g, " ")}</span>)}
                  <span>{enrichedBook.recommendedMicrophase}</span>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="pd-reader-page-missing">
            <strong>Page images are pending.</strong>
            <p>
              This curated book is ready in the library index, but the original PDF and rendered page images still need to be downloaded and processed.
            </p>
            {readableBook?.sourceUrl && <a href={readableBook.sourceUrl} rel="noreferrer" target="_blank">Open source lookup</a>}
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
