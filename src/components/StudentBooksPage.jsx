import "../styles/child-browse.css";
// BOOKS — the child's view of the reading library (phase D of the 2026-07-29
// kids-side redesign).
//
// Current authority: child surface rules and the Reporting Bible.
// One continuation, one picture shelf, and deliberate catalogue discovery.
// Layout lives in src/styles/kids-library.css; every glass surface, radius,
// blur, type step and control comes from src/styles/kids-glass.css (phase A).
// What the panel and the shelves may claim comes from
// src/policy/childLibraryPolicy.js, shared with Story Quests.
//
// IT IS A FRONT DOOR, NOT A REPLACEMENT. Tapping a book opens the real reader,
// which keeps every capability it has: page turns and swipe, whole-book and
// per-page read-aloud with sentence highlighting, tap-a-word decoding support,
// line focus, fullscreen, the level-up celebration and
// its printable certificate. Nothing was moved out of it and nothing was culled;
// this screen replaces the old shelf page in front of it.
//
// EVERY NUMBER IS REAL. The mock's "The Rain Cycle - page 5 of 12" is
// a placeholder (the spec says so). Here the book, the page and the percentage
// come from the child's own guided-reading records, and a read that
// FAILED says so rather than drawing an empty library — an empty library is a
// claim about the child.
//
// Coins live in the shell header. "Page 5 of 12" is a position in the book
// being read, not a score. The old
// shelf page's reading-goal panel ("7 of 10 books", with a bar and a target) was
// a third one, and it does not come back here.

import { useEffect, useMemo, useState } from "react";
import { useChildBrowseMedia, useCompactChildBrowse } from "../hooks/useCompactChildBrowse.js";
import { withRepairedGuidedReadingImageVersion } from "../utils/guidedReading/mediaVersion.js";
import { BookOpenText } from "@phosphor-icons/react";

import StudentGlassShell from "./StudentGlassShell.jsx";
import { ChildRecommendationExplanation } from "./recommendations/RecommendationExplanation.jsx";
import { getGuidedReadingStorageKey } from "../appState/studentSessionHelpers.js";
import { isGuidedReadingAssetDeleted } from "../data/deletedMediaManifest.js";
import { recommendBooksForStudent } from "../utils/guidedReading/recommendBooksForStudent.js";
import { getRuntimeGuidedReadingBooks } from "../utils/guidedReading/runtimeBooks.js";
import { filterPublishedGuidedReadingBooks } from "../policy/guidedReadingApprovalPolicy.js";
import { filterToEntitlement } from "../policy/freeTierContent.js";
import { speakStudentRailLabel } from "../policy/studentRailPolicy.js";
import { studentBookPanelAudioText } from "../copy/studentNavigationCopy.js";
import {
  KNOWLEDGE_JOURNEYS,
  knowledgeJourneyBooks
} from "../data/knowledgeJourneys.js";
import { childBookReadingPurpose, classifyBookReadingPurpose } from "../policy/literacyExperiencePolicy.js";
import {
  BOOK_SHELF_SLOTS,
  bookCollectionId,
  bookCollectionsForLevel,
  bookCoverSources,
  bookReadingProgress,
  buildBookShelves,
  pickContinueBook
} from "../policy/childLibraryPolicy.js";

// A missing cover is a media problem, not an empty book. Keep the title/cover
// pairing truthful and show a stable, explicit fallback instead of preserving
// a blank image well after an error.
export function BookCover({ book, className = "kg-book-cover", loading = "lazy", eager = false }) {
  const sources = bookCoverSources(book, isGuidedReadingAssetDeleted)
    .map(src => withRepairedGuidedReadingImageVersion(src));
  const sourceKey = sources.join("|");
  const [coverState, setCoverState] = useState({ sourceKey, index: 0, ready: false });
  const current = coverState.sourceKey === sourceKey ? coverState : { sourceKey, index: 0, ready: false };
  const src = sources[current.index] || "";
  const fallback = <span className="kg-book-cover-fallback-art">
    <BookOpenText size={44} weight="duotone" aria-hidden="true" />
    <strong>{book?.title || "Book"}</strong>
  </span>;
  return <span className={`${className} kg-book-cover-frame${!src ? " kg-book-cover--fallback" : ""}`}
    data-book-cover-state={!src ? "fallback" : current.ready ? "ready" : "loading"} aria-hidden="true">
    {(!src || !current.ready) && fallback}
    {src && <img key={src} src={src} alt="" loading={eager ? "eager" : loading} decoding="async"
      onLoad={() => setCoverState({ sourceKey, index: current.index, ready: true })}
      onError={() => setCoverState({ sourceKey, index: current.index + 1, ready: false })} />}
  </span>;
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path d="M7 4.5v15l13-7.5-13-7.5Z" fill="currentColor" />
    </svg>
  );
}

function SpeakerGlyph({ size = 26 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path d="M5 9.5v5h3.6l4.4 3.4V6.1L8.6 9.5H5Z" fill="currentColor" />
      <path
        d="M16.4 9a4.6 4.6 0 0 1 0 6M19.2 6.2a8.6 8.6 0 0 1 0 11.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronGlyph() {
  return (
    <svg className="kg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// Keyboard focus must reveal the whole choice, not merely the first visible
// pixels. Pointer focus is deliberately ignored: moving a partially visible
// choice between pointer-down and pointer-up cancels the child's tap. Calling
// this from the choice itself lets the browser resolve every nested horizontal
// scroller without changing DOM order.
function revealFocusedChoice(event) {
  if (!event.currentTarget.matches(":focus-visible")) return;
  event.currentTarget.scrollIntoView({
    behavior: "auto",
    block: "nearest",
    inline: "nearest"
  });
}

function MoreGlyph() {
  return (
    <svg className="kg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// A READ THAT FAILED IS NOT A CHILD WHO HAS READ NOTHING. The session
// controller's loader swallows a corrupt record store and hands back {}, which
// this screen would draw as a library with no progress in it — a claim about
// the child produced by a storage error. The raw blob is parsed here purely to
// learn whether it was readable, the same way the Sound Trail checks its save
// file. With no key to check (no teacher signed in) nothing is claimed either
// way: `ok` stays true, because an unprovable failure is not a failure.
function readGuidedRecordsState({ teacherId = "", studentId = "" } = {}) {
  if (typeof window === "undefined") return true;
  const key = getGuidedReadingStorageKey({ teacherId, studentId });
  if (!key) return true;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}

export function StudentBooksPage({
  studentName,
  progressScopeKey = "default",
  teacherId = "",
  studentId = "",
  // The runtime library, injectable so a harness can shelve four books instead
  // of 176. `null` means "use the real one" rather than "there are none": a
  // screen that draws an empty library because nobody passed it a list is the
  // "load failure rendered as empty data" mistake with extra steps.
  books = null,
  quarantinedBookIds = null,
  // The sample plan's book ids, or null for an account that sees everything.
  allowedBookIds = null,
  // Shown where the shelf stops. Null for a full-content account, which is why
  // an existing child never sees an explanation for a limit they do not have.
  sampleLimitCopy = null,
  publicationStatus = "ready",
  guidedReadingRecords = {},
  studentProgress = null,
  recommendationEvidenceReady = true,
  initialBookId = "",
  focusLocked = false,
  lockedBookId = null,
  onLockedBookAvailabilityChange = null,
  onNavigate,
  onHome,
  onGrownUps,
  headerActions = null,
  onOpenStoryQuests,
  // The real reader, handed in by the router so this screen never decides how
  // the guided-reading page is shelled. `onExit` brings the child back HERE,
  // which is where they left from.
  renderReader
}) {
  const exactBookLock = lockedBookId !== null;
  const normalizedLockedBookId = exactBookLock ? String(lockedBookId || "").trim() : "";
  const [openBookId, setOpenBookId] = useState(
    exactBookLock ? normalizedLockedBookId : (initialBookId || "")
  );
  const [speechStatus, setSpeechStatus] = useState("");
  const [shelfPage, setShelfPage] = useState(0);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [shelfMode, setShelfMode] = useState("for-you");
  const [bookType, setBookType] = useState("all");
  const [knowledgeJourneyId, setKnowledgeJourneyId] = useState("");
  const [collectionId, setCollectionId] = useState("all");
  const compactBrowse = useCompactChildBrowse();
  const phoneBrowse = useChildBrowseMedia("(max-width: 500px)");
  const narrowPhoneBrowse = useChildBrowseMedia("(max-width: 350px) and (orientation: portrait)");
  const shelfSlots = compactBrowse || narrowPhoneBrowse ? 2 : phoneBrowse ? 3 : BOOK_SHELF_SLOTS;

  const recordsOk = useMemo(
    () => readGuidedRecordsState({ teacherId, studentId }),
    [teacherId, studentId]
  );

  // Memoised, not a default parameter: the list is 176 books deep and every
  // call rebuilds it, which would also hand a new array identity to every
  // memo below on every render.
  const library = useMemo(() => {
    const runtimeBooks = books || getRuntimeGuidedReadingBooks();
    // Quarantine is applied before entitlement, so no plan can restore a book
    // with a reported defect. A missing blocklist caused by a real service
    // failure remains fail-closed.
    const live = filterPublishedGuidedReadingBooks(runtimeBooks, quarantinedBookIds);
    const entitled = filterToEntitlement(live, allowedBookIds, { hasFullContent: !allowedBookIds });
    return exactBookLock
      ? entitled.filter(book => book.id === normalizedLockedBookId)
      : entitled;
  }, [allowedBookIds, books, exactBookLock, normalizedLockedBookId, quarantinedBookIds]);

  useEffect(() => {
    if (!exactBookLock || publicationStatus === "loading") return;
    onLockedBookAvailabilityChange?.(
      Boolean(normalizedLockedBookId && library.some(book => book.id === normalizedLockedBookId))
    );
  }, [
    exactBookLock,
    library,
    normalizedLockedBookId,
    onLockedBookAvailabilityChange,
    publicationStatus
  ]);

  // The app's existing answer to "what level is this child on": a teacher-set
  // level, else the level of the last book they actually read, else A. It is
  // not invented here and it is not a second opinion.
  const recommended = useMemo(() => recommendBooksForStudent({
    books: library,
    studentProgress: recommendationEvidenceReady && studentProgress ? studentProgress : {},
    readingHistory: guidedReadingRecords
  }), [library, guidedReadingRecords, recommendationEvidenceReady, studentProgress]);

  const suggestedLevel = recommended[0]?.readingLevel || "A";
  const collections = useMemo(() => bookCollectionsForLevel(library), [library]);
  const shownLibrary = useMemo(() => {
    let pool = library.filter(book => (collectionId === "all" || bookCollectionId(book) === collectionId)
      && (bookType === "all" || String(book.type || "fiction").toLowerCase().replace(/[- ]/g, "") === bookType));
    if (knowledgeJourneyId) pool = knowledgeJourneyBooks(knowledgeJourneyId, pool);
    return pool;
  }, [library, collectionId, bookType, knowledgeJourneyId]);

  const continueRow = useMemo(
    () => pickContinueBook({ books: library, records: guidedReadingRecords }),
    [library, guidedReadingRecords]
  );

  // Nothing started yet: offer the recommender's first book to START. The
  // eyebrow and the button both change with it, because "you stopped here" over
  // a book the child has never opened is a lie with a progress bar on it.
  const firstBook = recommended.find(item => item.book.level === suggestedLevel
    && (suggestedLevel !== "C" || item.book.readingBandProfile !== "extended"))?.book
    || recommended[0]?.book || library[0] || null;
  const panelBook = continueRow?.book || firstBook;
  const panelProgress = continueRow?.progress
    || (panelBook ? bookReadingProgress(panelBook, guidedReadingRecords[panelBook.id] || {}) : null);
  const resuming = Boolean(continueRow);
  const knowledgeJourneys = useMemo(() => KNOWLEDGE_JOURNEYS.filter(journey => knowledgeJourneyBooks(journey.id, library).length), [library]);

  function purposeFor(book) {
    return childBookReadingPurpose(recommended.find(item => item.book.id === book.id)?.readingPurpose
      || classifyBookReadingPurpose(book, recommendationEvidenceReady ? studentProgress || {} : {}));
  }

  const panelPurpose = panelBook ? purposeFor(panelBook) : null;

  const [shelf] = useMemo(() => buildBookShelves({
    books: shownLibrary, records: guidedReadingRecords, level: suggestedLevel,
    order: recommended.map(item => item.book.id), slots: shelfSlots,
    mode: shelfMode, justRightPage: shelfPage, excludeBookId: panelBook?.id
  }), [shownLibrary, guidedReadingRecords, suggestedLevel, recommended, shelfMode, shelfPage, panelBook?.id, shelfSlots]);

  function changeDiscovery(update) {
    update();
    setShelfPage(0);
  }

  function hear(text) {
    const spoken = speakStudentRailLabel(text, window);
    setSpeechStatus(spoken ? "Reading it out." : "Speech is unavailable.");
  }

  if (openBookId && renderReader && library.some(book => book.id === openBookId)) {
    const saved = bookReadingProgress(library.find(book => book.id === openBookId), guidedReadingRecords[openBookId] || {});
    return renderReader({ bookId: openBookId, books: library, initialPageIndex: saved.started ? saved.pageIndex : null, onExit: () => setOpenBookId("") });
  }

  if (library.length === 0) {
    const assignedBookLoading = exactBookLock && publicationStatus === "loading";
    const libraryMessage = assignedBookLoading
      ? "Your assigned book is getting ready."
      : exactBookLock
        ? "This assigned book is unavailable. Stay here and ask your teacher for help."
        : publicationStatus === "loading"
      ? "Your books are getting ready."
      : publicationStatus === "ready"
        ? "There are no books here yet."
        : "Your approved books could not be checked. Ask a grown-up to try again.";
    return (
      <StudentGlassShell
        studentName={studentName}
        scopeKey={progressScopeKey}
        active="books"
        onNavigate={onNavigate}
        onHome={focusLocked ? undefined : onHome}
        onGrownUps={focusLocked ? undefined : onGrownUps}
        profileInteractive={!focusLocked}
        showGrownUps={!focusLocked}
        showWallet={!focusLocked}
        tabs={focusLocked ? [] : undefined}
        headerActions={headerActions}
      >
        <div
          className="kg-screen kg-books kg-books-empty"
          data-child-surface="reading-library"
          data-library-empty="true"
          data-assigned-content-unavailable={exactBookLock && !assignedBookLoading ? "book" : undefined}
        >
          <div className="kg-books-head">
            <div>
              <h1 className="kg-title" data-child-title="">Books</h1>
              <p className="kg-body kg-books-headline" data-child-instruction="">{libraryMessage}</p>
            </div>
          </div>
          <div className="kg-glass kg-library-preparing" role={exactBookLock && !assignedBookLoading ? "alert" : "status"}>
            <BookOpenText size={34} weight="duotone" aria-hidden="true" />
            <strong>{exactBookLock
              ? assignedBookLoading ? "Book getting ready" : "Ask your teacher for help"
              : publicationStatus === "ready" ? "No books available" : "Try again in a moment"}</strong>
            <p>{exactBookLock
              ? assignedBookLoading
                ? "Stay on this screen while the book is checked."
                : "The assigned book cannot be opened on this iPad."
              : publicationStatus === "ready"
                ? "Ask your teacher to help find a book."
                : "Approved books could not be checked right now."}</p>
          </div>
        </div>
      </StudentGlassShell>
    );
  }

  return (
    <StudentGlassShell
      studentName={studentName}
      scopeKey={progressScopeKey}
      active="books"
      onNavigate={onNavigate}
      onHome={focusLocked ? undefined : onHome}
      onGrownUps={focusLocked ? undefined : onGrownUps}
      profileInteractive={!focusLocked}
      showGrownUps={!focusLocked}
      showWallet={!focusLocked}
      tabs={focusLocked ? [] : undefined}
      headerActions={headerActions}
    >
      <div
        className="kg-screen kg-books"
        data-child-surface="reading-library"
        data-learning-lane="language_and_meaning"
        data-read-state={recordsOk ? "ready" : "unreadable"}
        data-library-view="books"
        data-discovery-open={showDiscovery ? "true" : "false"}
        data-sample-library={sampleLimitCopy ? "true" : undefined}
      >
        <div className="kg-books-head">
          <div>
            <h1 className="kg-title" data-child-title="">Books</h1>
            <p className="kg-body kg-books-headline" data-child-instruction="">
              {recordsOk
                ? "Carry on, or pick a new one."
                : "We could not open your reading just now."}
            </p>
          </div>
          <span className="kg-spacer" />

          <button type="button" className="kg-button kg-button--sm kg-glass kg-books-find"
            aria-expanded={showDiscovery} aria-controls="kg-book-discovery"
            onClick={() => setShowDiscovery(current => !current)}>
            {showDiscovery ? "Close search" : "Find a book"}
          </button>

        </div>

        {(panelBook
          ? (
            <section
              className="kg-glass kg-glass--strong kg-glass--tinted kg-glass--raised kg-continue"
              aria-labelledby="kg-continue-title"
              data-child-progress=""
            >
              <BookCover
                className="kg-continue-cover"
                book={panelBook}
                eager
              />
              <div>
                <span className="kg-eyebrow">{resuming ? "You stopped here" : "Start here"}</span>
                <h2 className="kg-panel-title kg-continue-title" id="kg-continue-title">
                  {panelBook.title}
                </h2>
                {/* A BOOK THIS SCREEN CHOSE HAS TO SAY WHY IT CHOSE IT. The old
                    shelf page put that line on its primary card and the
                    recommendation policy requires it; the panel is that card
                    now. A book the child is RESUMING needs no reason — they
                    chose it themselves — so it gets the progress meter here. */}
                {!resuming && (
                  <ChildRecommendationExplanation
                    className="kg-body kg-continue-reason"
                    surface="guided-reading"
                    reason={panelPurpose.reason}
                  />
                )}
                {resuming && panelProgress?.totalPages > 0 && (
                  <div className="kg-continue-meter">
                    <span
                      className="kg-meter"
                      role="img"
                      aria-label={`Page ${panelProgress.page} of ${panelProgress.totalPages}`}
                    >
                      <i style={{ width: `${panelProgress.percent}%` }} />
                    </span>
                    <small className="kg-continue-page" aria-hidden="true">
                      Page {panelProgress.page} of {panelProgress.totalPages}
                    </small>
                  </div>
                )}
              </div>
              <div className="kg-continue-actions">
                <button
                  type="button"
                  className="kg-button kg-button--md kg-glass-accent"
                  onClick={() => setOpenBookId(panelBook.id)}
                  data-child-primary=""
                  data-child-emphasis="primary"
                >
                  <PlayGlyph />
                  <span data-child-emphasis-cue="">{resuming ? "Keep reading" : "Start reading"}</span>
                </button>
                <button
                  type="button"
                  className="kg-speaker kg-speaker--md kg-glass kg-glass--strong kg-continue-hear"
                  aria-label="Hear this"
                  onClick={() => hear([
                    studentBookPanelAudioText(resuming, panelBook.title),
                    ...(resuming ? [] : [panelPurpose.reason])
                  ])}
                >
                  <SpeakerGlyph />
                </button>
              </div>
            </section>
          )
          : (
            <section
              className="kg-glass kg-glass--strong kg-library-empty"
              role="status"
              data-child-progress=""
            >
              <h2 className="kg-panel-title">Your books are getting ready</h2>
              <p className="kg-body">New reading books are on the way. Check back soon.</p>
            </section>
          ))}

        {showDiscovery && <section className="kg-glass kg-book-discovery" id="kg-book-discovery" aria-label="Find a book" onKeyDown={event => { if (event.key === "Escape") setShowDiscovery(false); }}>
          <button type="button" className="kg-button kg-glass" onClick={() => setShowDiscovery(false)}>Back to shelf</button>
          <div className="kg-book-discovery-modes" role="group" aria-label="Choose books">
            {[['for-you', 'Books for you'], ['all', 'All books'], ['read-again', 'Read again'], ['together', 'Read together']].map(([id, label]) =>
              <button key={id} type="button" aria-pressed={shelfMode === id} onClick={() => changeDiscovery(() => setShelfMode(id))}>{label}</button>)}
          </div>
          <label>Stories or facts<select aria-label="Stories or facts" value={bookType} onChange={event => changeDiscovery(() => { setBookType(event.target.value); setShelfMode("all"); })}>
            <option value="all">Stories and facts</option><option value="fiction">Stories</option><option value="nonfiction">Facts</option>
          </select></label>
          <label>Friends or topic<select aria-label="Friends or topic" value={collectionId} onChange={event => changeDiscovery(() => { setCollectionId(event.target.value); setShelfMode("all"); })}>
            <option value="all">All friends and topics</option>{collections.map(collection => <option key={collection.id} value={collection.id}>{collection.label}</option>)}
          </select></label>
          {knowledgeJourneys.length > 0 && <label>Explore an idea<select aria-label="Explore an idea" value={knowledgeJourneyId} onChange={event => changeDiscovery(() => { setKnowledgeJourneyId(event.target.value); setShelfMode("all"); })}>
            <option value="">All ideas</option>{knowledgeJourneys.map(journey => <option key={journey.id} value={journey.id}>{journey.title}</option>)}
          </select></label>}
          {!focusLocked && onOpenStoryQuests && <button type="button" className="kg-button kg-glass" onClick={onOpenStoryQuests}>Choose what happens in a story <ChevronGlyph /></button>}
        </section>}

        <section className="kg-shelves kg-single-shelf" data-child-choices="" aria-labelledby="kg-books-shelf-title">
          <div className="kg-shelf-head">
            <h2 className="kg-section-title" id="kg-books-shelf-title">{shelf.title}</h2>
            <span className="kg-spacer" />
            {shelf.hasMore && <button type="button" className="kg-button kg-glass kg-books-more" onClick={() => setShelfPage(page => page + shelf.step)}>More books <MoreGlyph /></button>}
          </div>
          <div className="kg-shelf-grid kg-picture-shelf">
            {shelf.books.map(({ book, progress }) => {
              const purpose = purposeFor(book);
              return <button key={book.id} type="button" className="kg-glass kg-book-card" onFocus={revealFocusedChoice}
                onClick={() => setOpenBookId(book.id)} data-book-id={book.id} data-child-emphasis="choice">
                <BookCover book={book} loading="lazy" />
                <span className="kg-book-card-main"><strong className="kg-book-title">{book.title}</strong>
                  <small className="kg-book-purpose">{purpose.label}</small>
                  {progress.completed && <small className="kg-book-read">✓ Read</small>}
                </span>
              </button>;
            })}
          </div>
          {shelf.total === 0 && <p className="kg-body" role="status">No books in this search. Try another friend or topic.</p>}
        </section>

        {/* WHERE THE SHELF STOPS, AND WHY — and note where this sits: AFTER the
            books, not above them.
            It was above them, which meant a child opening the shelf for the
            first time was greeted with "That's the end of the try-out books.
            You read everything in the free set. Well done!" before they had
            read anything. Congratulating a five-year-old for work they have not
            done is worse than saying nothing, and it made the shelf look empty
            even though it was full.
            The copy is written for the end of a shelf, so it belongs at the end
            of the shelf. The child sentence is readable by a five-year-old; the
            second is for the grown-up beside them, who is the one who can act
            on it — never a padlock with nothing behind it. */}
        {sampleLimitCopy && (
          <div className="kg-sample-note" role="note">
            <strong>{sampleLimitCopy.childHeading}</strong>
            <p>{sampleLimitCopy.childBody}</p>
            <p className="kg-sample-adult">{sampleLimitCopy.adultBody}</p>
          </div>
        )}

        <span className="kg-speech" role="status" aria-live="polite">{speechStatus}</span>
      </div>
    </StudentGlassShell>
  );
}
