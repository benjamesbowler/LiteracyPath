import { useEffect, useRef } from "react";
import { BookOpen, CaretLeft, CaretRight, Check, DotsThree, Pause, Play, SpeakerHigh, Stop, X } from "@phosphor-icons/react";
import BookDiscussionPanel from "./BookDiscussionPanel.jsx";
import "./guidedReadingTransport.css";

export default function GuidedReadingTransport({
  title, pageIndex, pageCount, readerCopy, audio, onPrevious, onNext, onFinish,
  isReviewMode, isFullscreen, onToggleFullscreen, onClose, lineFocusEnabled,
  onToggleLineFocus, discussion, onGoToPage
}) {
  const optionsRef = useRef(null);
  const lastPage = pageIndex === pageCount - 1;
  const pageLabel = audio.loading && !audio.wholeBook
    ? readerCopy.loadingPage
    : audio.playing ? readerCopy.stopReading : readerCopy.readPage;
  const bookLabel = audio.loading && audio.wholeBook
    ? readerCopy.loadingBook
    : audio.wholeBook ? readerCopy.stopBook : readerCopy.readWholeBook;

  useEffect(() => {
    const closeOptions = event => {
      const options = optionsRef.current;
      if (!options?.open) return;
      if (event.type === "keydown" && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        options.open = false;
        options.querySelector("summary")?.focus();
      } else if (event.type === "pointerdown" && !options.contains(event.target)) {
        options.open = false;
      }
    };
    document.addEventListener("keydown", closeOptions, true);
    document.addEventListener("pointerdown", closeOptions);
    return () => {
      document.removeEventListener("keydown", closeOptions, true);
      document.removeEventListener("pointerdown", closeOptions);
    };
  }, []);

  return (
    <header className="guided-transport" aria-label="Book controls">
      <div className="guided-transport-book">
        <strong title={title}>{title}</strong>
        <p role="status" aria-live="polite" aria-label="Reading progress">
          Page {pageIndex + 1} of {pageCount}
        </p>
      </div>
      {audio.enabled && (
        <div className="guided-read-aloud-controls" role="group" aria-label="Read aloud controls">
          <button
            aria-label={pageLabel}
            className={`lp-button lp-button-secondary guided-read-page-audio ${audio.playing ? "active audio-feedback-playing" : ""}`}
            data-control-priority="secondary"
            disabled={!audio.pageAvailable || audio.wholeBook || audio.loading}
            onClick={audio.onPage}
            type="button"
          >
            {audio.loading && !audio.wholeBook ? <span className="audio-loading-dot" aria-hidden="true" /> : audio.playing ? <Stop aria-hidden="true" /> : <SpeakerHigh aria-hidden="true" />}
            <span className="guided-transport-label">{pageLabel}</span>
          </button>
          <button
            aria-label={bookLabel}
            className={`lp-button lp-button-secondary ${audio.wholeBook ? "active audio-feedback-playing" : ""}`}
            disabled={!audio.bookAvailable || (audio.loading && !audio.wholeBook)}
            onClick={audio.onBook}
            type="button"
          >
            {audio.loading && audio.wholeBook ? <span className="audio-loading-dot" aria-hidden="true" /> : audio.wholeBook ? <Stop aria-hidden="true" /> : <BookOpen aria-hidden="true" />}
            <span className="guided-transport-label">{bookLabel}</span>
          </button>
          {(audio.playing || audio.wholeBook) && (
            <button
              aria-label={audio.paused ? "Resume" : "Pause"}
              className="lp-button lp-button-secondary"
              disabled={audio.loading}
              onClick={audio.onPause}
              type="button"
            >
              {audio.paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
              <span className="guided-transport-label">{audio.paused ? "Resume" : "Pause"}</span>
            </button>
          )}
        </div>
      )}
      <div className="guided-page-pagination" role="group" aria-label="Page navigation">
        <button aria-label="Previous page" className="lp-button lp-button-secondary" disabled={pageIndex === 0} onClick={onPrevious} type="button">
          <CaretLeft aria-hidden="true" /><span className="guided-transport-label">Previous</span>
        </button>
        <button
          aria-label={lastPage && !isReviewMode ? readerCopy.finishBook : "Next page"}
          className="lp-button lp-button-primary"
          disabled={lastPage && isReviewMode}
          onClick={lastPage && !isReviewMode ? onFinish : onNext}
          type="button"
        >
          {lastPage ? <Check aria-hidden="true" /> : <CaretRight aria-hidden="true" />}
          <span className="guided-transport-label">{lastPage && !isReviewMode ? readerCopy.finishBook : "Next"}</span>
        </button>
      </div>
      <div className="guided-reader-secondary-controls" role="group" aria-label="Reader view controls">
        <details className="guided-transport-options" ref={optionsRef}>
          <summary aria-label="More reader controls"><DotsThree aria-hidden="true" /><span className="guided-transport-label">More</span></summary>
          <div className="guided-transport-options-panel">
            <button aria-pressed={lineFocusEnabled} className="lp-button lp-button-secondary" onClick={onToggleLineFocus} type="button">
              {readerCopy.lineFocus}
            </button>
            {!isFullscreen && <button className="lp-button lp-button-secondary" onClick={() => {
              optionsRef.current.open = false;
              optionsRef.current.querySelector("summary")?.focus();
              onToggleFullscreen();
            }} type="button">{readerCopy.fullScreen}</button>}
            <p>Tap a word to hear it and get reading help.</p>
            {discussion && <BookDiscussionPanel discussion={discussion} onGoToPage={pageNumber => {
              optionsRef.current.open = false;
              optionsRef.current.querySelector("summary")?.focus();
              onGoToPage(pageNumber);
            }} />}
          </div>
        </details>
        <button aria-label={isFullscreen ? readerCopy.exitFullScreen : readerCopy.closeReader || readerCopy.backToLibrary} className="lp-button lp-button-secondary" onClick={isFullscreen ? onToggleFullscreen : onClose} type="button">
          <X aria-hidden="true" /><span className="guided-transport-label">Exit</span>
        </button>
      </div>
    </header>
  );
}
