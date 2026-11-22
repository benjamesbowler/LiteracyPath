import { getCurrentGuidedReadingRecord, isGuidedReadingAssignmentCurrent } from "../utils/guidedReading/editions.js";
import {lazy,Suspense} from "react";
const CycleShortsLibrary = lazy(()=>import("./guided-reading/CycleShortsLibrary.jsx"));
import "../styles/book-levels.css";
import "../styles/books-gallery.css";
// BOOKS — the child's view of the reading library (phase D of the 2026-07-29
// kids-side redesign).
//
// Current authority: child surface rules and the Reporting Bible.
// One compact continuation and a cover gallery with visible page controls.
// Layout lives in src/styles/books-gallery.css; the shared child shell
// supplies its typography, colours and controls.
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

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { bookCoverDeliverySources } from "../utils/guidedReading/coverRenditions.js";
import { BookOpenText } from "@phosphor-icons/react";

import { APP_READING_LEVELS, getBookTextAnalysis, appReadingLevelLabel } from "../utils/guidedReading/bookTextAnalysis.js";
import ChildBookDiscovery from "./guided-reading/ChildBookDiscovery.jsx";
import { HopAndStopUnit } from "./action-songs/HopAndStopUnit.jsx";
import { useHopAndStopPublished } from "./action-songs/useHopAndStopPublished.js";
import { canOpenHopAndStop } from "../data/hopAndStop.js";
import StudentGlassShell from "./StudentGlassShell.jsx";
import ChildPageControls from "./ChildPageControls.jsx";
import { useChildPages } from "../hooks/useChildPages.js";
import { ChildRecommendationExplanation } from "./recommendations/RecommendationExplanation.jsx";
import { getGuidedReadingStorageKey } from "../appState/studentSessionHelpers.js";
import { isGuidedReadingAssetDeleted } from "../data/deletedMediaManifest.js";
import { recommendBooksForStudent } from "../utils/guidedReading/recommendBooksForStudent.js";
import { getRuntimeGuidedReadingBooks } from "../utils/guidedReading/runtimeBooks.js";
import { filterPublishedGuidedReadingBooks } from "../policy/guidedReadingApprovalPolicy.js";
import { filterToEntitlement, sampleBookIds } from "../policy/freeTierContent.js";
import { GUIDED_READING_BOOK_INDEX } from "../data/generated/guidedReadingBookIndex.generated.js";
import { speakStudentRailLabel } from "../policy/studentRailPolicy.js";
import { studentBookPanelAudioText } from "../copy/studentNavigationCopy.js";
import {
  KNOWLEDGE_JOURNEYS,
  knowledgeJourneyBooks
} from "../data/knowledgeJourneys.js";
import { childBookReadingPurpose, classifyBookReadingPurpose } from "../policy/literacyExperiencePolicy.js";
import {
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
  const sources = bookCoverDeliverySources(bookCoverSources(book, isGuidedReadingAssetDeleted));
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
    {/* Keep the same-book fallback's intrinsic space after decode. Its paint is
        hidden when ready, so long/enlarged titles never shrink or move a
        focused choice as the real cover arrives. */}
    {fallback}
    {src && <img key={src} src={src} alt="" loading={eager ? "eager" : loading} decoding="async"
      onLoad={async event => {
        const loadedImage = event.currentTarget;
        try {
          // A lazy image can finish downloading before its pixels are decoded.
          // Keep the truthful title fallback painted until the art is usable.
          if (loadedImage.decode) await loadedImage.decode();
          if (loadedImage.isConnected) setCoverState({ sourceKey, index: current.index, ready: true });
        } catch {
          if (loadedImage.isConnected) setCoverState({ sourceKey, index: current.index + 1, ready: false });
        }
      }}
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

function subscribeToViewport(listener) {
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
}

function booksPerPage() {
  const { innerWidth: width, innerHeight: height } = window;
  if (height <= 430 || width <= 360) return 1;
  if (width < 701) return 2;
  if (width < 950) return 3;
  if (width < 1250) return 4;
  return width < 1600 ? 5 : 6;
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
  // of the full catalogue. `null` means "use the real one" rather than "there are none": a
  // screen that draws an empty library because nobody passed it a list is the
  // "load failure rendered as empty data" mistake with extra steps.
  books = null,
  quarantinedBookIds = null,
  // The sample plan's book ids, or null for an account that sees everything.
  allowedBookIds: suppliedBookIds = null,
  sampleAccess = false,
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
  lockedBookTitle = null,
  onLockedBookAvailabilityChange = null,
  onNavigate,
  onHome,
  onGrownUps,
  headerActions = null,
  onOpenStoryQuests,
  onOpenComprehension,
  // The real reader, handed in by the router so this screen never decides how
  // the guided-reading page is shelled. `onExit` brings the child back HERE,
  // which is where they left from.
  renderReader
}) {
  const allowedBookIds = useMemo(
    () => sampleAccess ? sampleBookIds(GUIDED_READING_BOOK_INDEX) : suppliedBookIds,
    [sampleAccess, suppliedBookIds]
  );
  const exactBookLock = lockedBookId !== null;
  const normalizedLockedBookId = exactBookLock ? String(lockedBookId || "").trim() : "";
  const [hopAndStopOpen, setHopAndStopOpen] = useState(false);
  const hopAndStopPublished = useHopAndStopPublished(!focusLocked && !exactBookLock && allowedBookIds === null && publicationStatus === "ready");
  const hopAndStopAvailable = canOpenHopAndStop({ published: hopAndStopPublished, focusLocked, exactBookLock, restrictedLibrary: allowedBookIds !== null });
  if (hopAndStopOpen && !hopAndStopAvailable) setHopAndStopOpen(false);
  const [openBookId, setOpenBookId] = useState(
    exactBookLock ? normalizedLockedBookId : (initialBookId || "")
  );
  const [openBookFromShelf, setOpenBookFromShelf] = useState(false);
  const [cycleShortsOpen,setCycleShortsOpen] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [shelfMode, setShelfMode] = useState("all");
  const [bookType, setBookType] = useState("all");
  const [appReadingLevel, setAppReadingLevel] = useState("all");
  const [knowledgeJourneyId, setKnowledgeJourneyId] = useState("");
  const [collectionId, setCollectionId] = useState("all");
  const [search, setSearch] = useState("");
  const [largeLabels, setLargeLabels] = useState(false);
  const catalogueRef = useRef(null);
  const returnToBook = useRef(null);
  const filterTriggerRef = useRef(null);
  const pageSize = useSyncExternalStore(subscribeToViewport, booksPerPage, () => 2);
  const observeTitle = useCallback(node => {
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setLargeLabels(entry.contentRect.height > 60));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (openBookId || !returnToBook.current) return;
    const selector = returnToBook.current;
    returnToBook.current = null;
    (catalogueRef.current?.querySelector(selector) || filterTriggerRef.current)?.focus({ preventScroll: true });
  }, [openBookId]);

  function openBook(bookId, recommendedBook = false) {
    returnToBook.current = recommendedBook
      ? ".kg-continue [data-child-primary]"
      : `[data-book-id="${CSS.escape(bookId)}"]`;
    setOpenBookFromShelf(!recommendedBook);
    setOpenBookId(bookId);
  }
  function closeDiscovery() {
    setShowDiscovery(false);
    requestAnimationFrame(() => filterTriggerRef.current?.focus({ preventScroll: true }));
  }

  const recordsOk = useMemo(
    () => readGuidedRecordsState({ teacherId, studentId }),
    [teacherId, studentId]
  );

  // Memoised, not a default parameter: the catalogue is large and every
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
      ? entitled.filter(book => book.id === normalizedLockedBookId && isGuidedReadingAssignmentCurrent(book, lockedBookTitle))
      : entitled;
  }, [allowedBookIds, books, exactBookLock, normalizedLockedBookId, lockedBookTitle, quarantinedBookIds]);

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

  // Suggestions use the reviewed text band of a selected/previous book.
  // This is a browsing choice, not a measure of the child's reading ability.
  const recommended = useMemo(() => recommendBooksForStudent({
    books: library,
    studentProgress: recommendationEvidenceReady && studentProgress ? studentProgress : {},
    readingHistory: guidedReadingRecords
  }), [library, guidedReadingRecords, recommendationEvidenceReady, studentProgress]);

  const suggestedLevel = recommended[0]?.readingLevel || "A";
  const collections = useMemo(() => bookCollectionsForLevel(library), [library]);
  const bookAnalyses = useMemo(() => new Map(library.map(book => [book.id, getBookTextAnalysis(book)])), [library]);
  const availableAppLevels = APP_READING_LEVELS.filter(level => library.some(book => bookAnalyses.get(book.id)?.appReadingLevel === level));
  // A removed/quarantined band must not leave an invisible selected filter.
  if (appReadingLevel !== "all" && !availableAppLevels.includes(appReadingLevel)) setAppReadingLevel("all");
  const shownLibrary = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    let pool = library.filter(book => (appReadingLevel === "all" || bookAnalyses.get(book.id)?.appReadingLevel === appReadingLevel)
      && (collectionId === "all" || bookCollectionId(book) === collectionId)
      && (!query || String(book.title).toLocaleLowerCase().includes(query))
      && (bookType === "all" || String(book.type || "fiction").toLowerCase().replace(/[- ]/g, "") === bookType));
    if (knowledgeJourneyId) pool = knowledgeJourneyBooks(knowledgeJourneyId, pool);
    return pool;
  }, [library, collectionId, bookType, knowledgeJourneyId, appReadingLevel, bookAnalyses, search]);

  const continueRow = useMemo(
    () => pickContinueBook({ books: library, records: guidedReadingRecords }),
    [library, guidedReadingRecords]
  );

  // Nothing started yet: offer the recommender's first book to START. The
  // eyebrow and the button both change with it, because "you stopped here" over
  // a book the child has never opened is a lie with a progress bar on it.
  const firstBook = recommended.find(item => item.readingLevel === suggestedLevel)?.book
    || recommended[0]?.book || library[0] || null;
  const panelBook = continueRow?.book || firstBook;
  const panelProgress = continueRow?.progress
    || (panelBook ? bookReadingProgress(panelBook, getCurrentGuidedReadingRecord(panelBook, guidedReadingRecords)) : null);
  const resuming = Boolean(continueRow);
  const knowledgeJourneys = useMemo(() => KNOWLEDGE_JOURNEYS.filter(journey => knowledgeJourneyBooks(journey.id, library).length), [library]);

  function purposeFor(book) {
    return childBookReadingPurpose(recommended.find(item => item.book.id === book.id)?.readingPurpose
      || classifyBookReadingPurpose(book, recommendationEvidenceReady ? studentProgress || {} : {}));
  }

  const panelPurpose = panelBook ? purposeFor(panelBook) : null;

  const [shelf] = useMemo(() => buildBookShelves({
    books: shownLibrary, records: guidedReadingRecords, level: suggestedLevel,
    order: recommended.map(item => item.book.id), slots: Math.max(1, shownLibrary.length),
    mode: shelfMode
  }), [shownLibrary, guidedReadingRecords, suggestedLevel, recommended, shelfMode]);
  const shelfItems = useMemo(() => {
    if (!sampleLimitCopy || !shelf.books.length) return shelf.books;
    const remaining = (pageSize - shelf.books.length % pageSize) % pageSize;
    return [...shelf.books, ...Array(remaining).fill(null), { sampleNote: true }];
  }, [shelf.books, pageSize, sampleLimitCopy]);
  const { visibleItems, pageIndex, pageCount, setPageIndex } = useChildPages(
    shelfItems, pageSize, JSON.stringify([shelfMode, bookType, collectionId, knowledgeJourneyId, appReadingLevel, search])
  );
  const pictureTopics = collections.filter(collection => collection.id !== "science-and-facts").slice(0, 3)
    .map(collection => ({ ...collection, book: library.find(book => bookCollectionId(book) === collection.id) }));
  const categoryPictures = [
    { id: "all", label: "All books", book: firstBook },
    { id: "fiction", label: "Stories", book: library.find(book => String(book.type || "fiction").toLowerCase().replace(/[- ]/g, "") === "fiction") },
    { id: "nonfiction", label: "Facts", book: library.find(book => String(book.type || "fiction").toLowerCase().replace(/[- ]/g, "") === "nonfiction") }
  ].filter(category => category.book);

  function changeDiscovery(update) {
    update();
    setPageIndex(0);
  }

  function hear(text) {
    const spoken = speakStudentRailLabel(text, window);
    setSpeechStatus(spoken ? "Reading it out." : "Speech is unavailable.");
  }

  if (cycleShortsOpen && !focusLocked && !exactBookLock) return <StudentGlassShell studentName={studentName} scopeKey={progressScopeKey} active="books" onNavigate={onNavigate} onHome={onHome} onGrownUps={onGrownUps}><Suspense fallback={<p role="status">Opening Cycle Shorts…</p>}><CycleShortsLibrary scope={`${teacherId}:${studentId}`} onBack={()=>setCycleShortsOpen(false)}/></Suspense></StudentGlassShell>;
  if (hopAndStopOpen && hopAndStopAvailable) {
    return <StudentGlassShell
      studentName={studentName}
      scopeKey={progressScopeKey}
      active="books"
      onNavigate={onNavigate}
      onHome={onHome}
      onGrownUps={onGrownUps}
      headerActions={headerActions}
    ><HopAndStopUnit onExit={() => setHopAndStopOpen(false)} /></StudentGlassShell>;
  }

  if (openBookId && renderReader && library.some(book => book.id === openBookId)) {
    const openBook = library.find(book => book.id === openBookId);
    const saved = bookReadingProgress(openBook, getCurrentGuidedReadingRecord(openBook, guidedReadingRecords));
    return renderReader({ bookId: openBookId, books: library, initialPageIndex: saved.started ? saved.pageIndex : null, onExit: () => {
      if (openBookFromShelf) {
        const index = shelf.books.findIndex(row => row.book.id === openBookId);
        if (index >= 0) setPageIndex(Math.floor(index / pageSize));
      }
      setOpenBookId("");
    } });
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
        ref={catalogueRef}
        data-child-surface="reading-library"
        data-learning-lane="language_and_meaning"
        data-read-state={recordsOk ? "ready" : "unreadable"}
        data-library-view="books"
        data-discovery-open={showDiscovery ? "true" : "false"}
        data-sample-library={sampleLimitCopy ? "true" : undefined}
        data-book-page={pageIndex + 1}
        data-book-pages={pageCount}
        data-book-count={shelf.total}
        data-large-labels={largeLabels || undefined}
        style={{ "--book-columns": pageSize }}
      >
        <div className="kg-books-head">
          <div>
            <h1 className="kg-title" data-child-title="" ref={observeTitle}>Books</h1>
            <p className="kg-body kg-books-headline" data-child-instruction="">
              {recordsOk
                ? "Carry on, or pick a new one."
                : "We could not open your reading just now."}
            </p>
          </div>
          <span className="kg-spacer" />

          {!focusLocked && !exactBookLock && onOpenComprehension && <button type="button" className="kg-button kg-button--sm kg-glass kg-comprehension-door" aria-label="Reading Comprehension" title="Reading Comprehension" onClick={onOpenComprehension}><BookOpenText size={20} aria-hidden="true" /><span>Read &amp;<br/>answer</span></button>}
          <button ref={filterTriggerRef} type="button" className="kg-button kg-button--sm kg-glass kg-books-find"
            aria-expanded={showDiscovery} aria-controls="kg-book-discovery"
            onClick={() => setShowDiscovery(current => !current)}>
            Find a book
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
                <p className="kg-body kg-book-text-measure">{appReadingLevelLabel(bookAnalyses.get(panelBook.id)?.appReadingLevel)}</p>
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
                  onClick={() => openBook(panelBook.id, true)}
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

        {!focusLocked && <nav className="kg-book-picture-topics" aria-label="Book pictures">
          {!exactBookLock && <button type="button" className="kg-book-picture-topic" onClick={()=>setCycleShortsOpen(true)}><span className="kg-book-topic-cover"><img src="/images/worksheets/muddy-colouring.webp" width="40" height="40" style={{objectFit:"contain"}} alt=""/></span><strong>Cycle Shorts</strong></button>}
          {categoryPictures.map(category => <button type="button" key={category.id} className="kg-book-picture-topic" aria-pressed={bookType === category.id && collectionId === "all" && !knowledgeJourneyId}
            onClick={() => changeDiscovery(() => { setBookType(category.id); setCollectionId("all"); setKnowledgeJourneyId(""); setShelfMode("all"); })}>
            <BookCover book={category.book} className="kg-book-topic-cover" eager /><strong>{category.label}</strong>
          </button>)}
          {pictureTopics.map(topic => <button type="button" key={topic.id} className="kg-book-picture-topic" aria-pressed={collectionId === topic.id}
            onClick={() => changeDiscovery(() => { setCollectionId(topic.id); setBookType("all"); setKnowledgeJourneyId(""); setShelfMode("all"); })}>
            <BookCover book={topic.book} className="kg-book-topic-cover" eager /><strong>{topic.label}</strong>
          </button>)}
        </nav>}

        {!focusLocked && <nav className="kg-book-levels" aria-label="Book levels">
          <button type="button" aria-pressed={appReadingLevel === "all"} onClick={() => changeDiscovery(() => { setAppReadingLevel("all"); setShelfMode("all"); })}>All levels</button>
          {availableAppLevels.map(level => <button key={level} type="button" aria-pressed={appReadingLevel === level}
            onClick={() => changeDiscovery(() => { setAppReadingLevel(level); setShelfMode("all"); })}>{appReadingLevelLabel(level)}</button>)}
        </nav>}

        {showDiscovery && <ChildBookDiscovery
          onClose={closeDiscovery}
          shelfMode={shelfMode}
          onMode={value => changeDiscovery(() => setShelfMode(value))}
          bookType={bookType}
          onType={value => changeDiscovery(() => { setBookType(value); setShelfMode("all"); })}
          collectionId={collectionId}
          collections={collections}
          onCollection={value => changeDiscovery(() => { setCollectionId(value); setShelfMode("all"); })}
          knowledgeJourneyId={knowledgeJourneyId}
          knowledgeJourneys={knowledgeJourneys}
          onJourney={value => changeDiscovery(() => { setKnowledgeJourneyId(value); setShelfMode("all"); })}
          appReadingLevel={appReadingLevel}
          availableAppLevels={availableAppLevels}
          onLevel={value => changeDiscovery(() => { setAppReadingLevel(value); setShelfMode("all"); })}
          search={search}
          onSearch={value => changeDiscovery(() => setSearch(value))}
          onReset={() => changeDiscovery(() => {
            setShelfMode("all"); setBookType("all"); setCollectionId("all");
            setKnowledgeJourneyId(""); setAppReadingLevel("all"); setSearch("");
          })}
          resultCount={shelf.total}
          onCycleShorts={!focusLocked && !exactBookLock ? () => { setShowDiscovery(false); setCycleShortsOpen(true); } : null}
          onStoryQuests={!focusLocked ? onOpenStoryQuests : null}
          onActionSong={hopAndStopAvailable ? () => { setShowDiscovery(false); setHopAndStopOpen(true); } : null}
        />}

        <section className="kg-shelves kg-single-shelf" data-child-choices="" aria-labelledby="kg-books-shelf-title">
          <div className="kg-shelf-head">
            <h2 className="kg-section-title" id="kg-books-shelf-title">{shelfMode === "all" ? "Pick a book" : shelf.title}</h2>
            <span className="kg-spacer" />
            {(bookType !== "all" || collectionId !== "all" || knowledgeJourneyId || search) && <span className="kg-book-filter-state" role="status">{[
              search && "Title search",
              bookType === "fiction" ? "Stories" : bookType === "nonfiction" ? "Facts" : "",
              collections.find(collection => collection.id === collectionId)?.label,
              knowledgeJourneys.find(journey => journey.id === knowledgeJourneyId)?.title
            ].filter(Boolean).join(" · ")}</span>}
          </div>
          <div className="kg-shelf-grid kg-picture-shelf">
            {visibleItems.filter(row => row?.book).map(({ book, progress }) => {
              const purpose = purposeFor(book);
              return <button key={book.id} type="button" className="kg-glass kg-book-card"
                onClick={() => openBook(book.id)} data-book-id={book.id} data-child-emphasis="choice">
                <BookCover book={book} eager />
                <span className="kg-book-card-main"><strong className="kg-book-title">{book.title}</strong>
                  <small className="kg-book-purpose">{purpose.label}</small>
                  <small className="kg-book-text-measure" data-book-level={bookAnalyses.get(book.id)?.appReadingLevel || "pending"}>{appReadingLevelLabel(bookAnalyses.get(book.id)?.appReadingLevel)}</small>
                  {progress.completed && <small className="kg-book-read">✓ Read</small>}
                </span>
              </button>;
            })}
            {visibleItems.at(-1)?.sampleNote && (
              <div className="kg-sample-note" role="note">
                <strong>{sampleLimitCopy.childHeading}</strong>
                <p>{sampleLimitCopy.childBody}</p>
                <p className="kg-sample-adult">{sampleLimitCopy.adultBody}</p>
              </div>
            )}
            {shelf.total === 0 && <p className="kg-body kg-book-no-results" role="status">No books in this search. Try another title, level, friend or topic.</p>}
          </div>
          <ChildPageControls pageIndex={pageIndex} pageCount={pageCount} onPageChange={setPageIndex} label="Books pages" />
        </section>

        <span className="kg-speech" role="status" aria-live="polite">{speechStatus}</span>
      </div>
    </StudentGlassShell>
  );
}
