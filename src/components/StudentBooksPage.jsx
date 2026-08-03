// BOOKS — the child's view of the reading library (phase D of the 2026-07-29
// kids-side redesign).
//
// Binding spec: mockups/design-handoff-kids-side/README.md, "### 4. Books".
// Layout lives in src/styles/kids-library.css; every glass surface, radius,
// blur, type step and control comes from src/styles/kids-glass.css (phase A).
// What the panel and the shelves may claim comes from
// src/policy/childLibraryPolicy.js, shared with Story Quests.
//
// IT IS A FRONT DOOR, NOT A REPLACEMENT. Tapping a book opens the real reader,
// which keeps every capability it has: page turns and swipe, whole-book and
// per-page read-aloud with sentence highlighting, tap-a-word decoding support,
// line focus, fullscreen, the end-of-book quiz, the level-up celebration and
// its printable certificate. Nothing was moved out of it and nothing was culled;
// this screen replaces the old shelf page in front of it.
//
// EVERY NUMBER IS REAL. The mock's "The Rain Cycle - page 5 of 12 - 1 star" is
// a placeholder (the spec says so). Here the book, the page, the percentage and
// every star come from the child's own guided-reading records, and a read that
// FAILED says so rather than drawing an empty library — an empty library is a
// claim about the child.
//
// TWO NUMERIC SYSTEMS, AND ONLY TWO: stars and coins, both in the shell header.
// "Page 5 of 12" is a position in the book being read, not a currency. The old
// shelf page's reading-goal panel ("7 of 10 books", with a bar and a target) was
// a third one, and it does not come back here.

import { useMemo, useState } from "react";

import StudentGlassShell from "./StudentGlassShell.jsx";
import { ChildRecommendationExplanation } from "./recommendations/RecommendationExplanation.jsx";
import { getGuidedReadingStorageKey } from "../appState/studentSessionHelpers.js";
import { isGuidedReadingAssetDeleted } from "../data/deletedMediaManifest.js";
import { recommendBooksForStudent } from "../utils/guidedReading/recommendBooksForStudent.js";
import { getRuntimeGuidedReadingBooks } from "../utils/guidedReading/runtimeBooks.js";
import { filterApprovedGuidedReadingBooks } from "../data/guidedReadingPublication.js";
import { speakStudentRailLabel } from "../policy/studentRailPolicy.js";
import {
  KNOWLEDGE_JOURNEYS,
  getKnowledgeJourney,
  knowledgeJourneyBooks
} from "../data/knowledgeJourneys.js";
import { classifyBookReadingPurpose } from "../policy/literacyExperiencePolicy.js";
import {
  BOOK_SHELF_SLOTS,
  bookCollectionId,
  bookCollectionsForLevel,
  bookCoverSrc,
  bookReadingProgress,
  buildBookShelves,
  pickContinueBook
} from "../policy/childLibraryPolicy.js";

// Decorative art must never show a broken-image icon to a child.
function hideOnError(event) {
  event.currentTarget.style.display = "none";
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

function MoreGlyph() {
  return (
    <svg className="kg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const STAR_PATH =
  "M12 2.6l2.9 6.2 6.6.8-4.8 4.6 1.2 6.6L12 17.6 6.1 20.8l1.2-6.6L2.5 9.6l6.6-.8L12 2.6z";

function StarGlyph({ earned }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path d={STAR_PATH} fill={earned ? "#F2B33D" : "rgba(62,119,107,.2)"} />
    </svg>
  );
}

// The book's own cover, with the media manifest's retirements applied. The rule
// lives in the policy module so a unit test can hold it to the title/cover
// pairing without mounting React.
function coverFor(book) {
  return bookCoverSrc(book, isGuidedReadingAssetDeleted);
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
  approvedBookIds = null,
  publicationStatus = "ready",
  guidedReadingRecords = {},
  studentProgress = null,
  recommendationEvidenceReady = true,
  initialBookId = "",
  onNavigate,
  onHome,
  onGrownUps,
  onOpenStoryQuests,
  // The real reader, handed in by the router so this screen never decides how
  // the guided-reading page is shelled. `onExit` brings the child back HERE,
  // which is where they left from.
  renderReader
}) {
  const [openBookId, setOpenBookId] = useState(initialBookId || "");
  const [speechStatus, setSpeechStatus] = useState("");
  const [shelfPages, setShelfPages] = useState({ "just-right": 0, second: 0 });
  const [knowledgeJourneyId, setKnowledgeJourneyId] = useState(KNOWLEDGE_JOURNEYS[0]?.id || "");
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [collectionId, setCollectionId] = useState("all");

  const recordsOk = useMemo(
    () => readGuidedRecordsState({ teacherId, studentId }),
    [teacherId, studentId]
  );

  // Memoised, not a default parameter: the list is 176 books deep and every
  // call rebuilds it, which would also hand a new array identity to every
  // memo below on every render.
  const library = useMemo(() => {
    const runtimeBooks = books || getRuntimeGuidedReadingBooks();
    return approvedBookIds === null
      ? runtimeBooks
      : filterApprovedGuidedReadingBooks(runtimeBooks, approvedBookIds);
  }, [approvedBookIds, books]);

  // The app's existing answer to "what level is this child on": a teacher-set
  // level, else the level of the last book they actually read, else A. It is
  // not invented here and it is not a second opinion.
  const recommended = useMemo(() => recommendBooksForStudent({
    books: library,
    studentProgress: recommendationEvidenceReady && studentProgress ? studentProgress : {},
    readingHistory: guidedReadingRecords
  }), [library, guidedReadingRecords, recommendationEvidenceReady, studentProgress]);

  const suggestedLevel = recommended[0]?.readingLevel || "A";
  const [level, setLevel] = useState(suggestedLevel);

  const levels = useMemo(
    () => [...new Set(library.map(book => book.level).filter(Boolean))].sort(),
    [library]
  );
  const shownLevel = levels.includes(level) ? level : (levels[0] || suggestedLevel);
  const collections = useMemo(
    () => bookCollectionsForLevel(library, shownLevel),
    [library, shownLevel]
  );
  const shownCollectionId = collectionId === "all"
    || collections.some(collection => collection.id === collectionId)
    ? collectionId
    : "all";
  const shownLibrary = useMemo(
    () => shownCollectionId === "all"
      ? library
      : library.filter(book => (
        book.level === shownLevel && bookCollectionId(book) === shownCollectionId
      )),
    [library, shownCollectionId, shownLevel]
  );

  const continueRow = useMemo(
    () => pickContinueBook({ books: library, records: guidedReadingRecords }),
    [library, guidedReadingRecords]
  );

  // Nothing started yet: offer the recommender's first book to START. The
  // eyebrow and the button both change with it, because "you stopped here" over
  // a book the child has never opened is a lie with a progress bar on it.
  const firstBook = recommended.find(item => (
    item.book.level === shownLevel
    && (shownCollectionId === "all" || bookCollectionId(item.book) === shownCollectionId)
  ))?.book
    || shownLibrary.find(book => book.level === shownLevel)
    || recommended[0]?.book
    || library[0]
    || null;
  const panelBook = continueRow?.book || firstBook;
  const panelProgress = continueRow?.progress
    || (panelBook ? bookReadingProgress(panelBook, guidedReadingRecords[panelBook.id] || {}) : null);
  const resuming = Boolean(continueRow);
  const panelRecommendation = recommended.find(item => item.book.id === panelBook?.id) || null;

  const knowledgeJourneys = useMemo(
    () => KNOWLEDGE_JOURNEYS.filter(journey => (
      knowledgeJourneyBooks(journey.id, library, shownLevel).length > 0
    )),
    [library, shownLevel]
  );
  const knowledgeJourney = knowledgeJourneys.find(journey => journey.id === knowledgeJourneyId)
    || knowledgeJourneys[0]
    || getKnowledgeJourney(knowledgeJourneyId);
  const journeyBooks = useMemo(
    () => knowledgeJourneyBooks(knowledgeJourney.id, library, shownLevel).slice(0, 4),
    [knowledgeJourney.id, library, shownLevel]
  );

  function purposeFor(book) {
    return recommended.find(item => item.book.id === book.id)?.readingPurpose
      || classifyBookReadingPurpose(book, studentProgress || {});
  }

  const shelves = useMemo(() => buildBookShelves({
    books: shownLibrary,
    records: guidedReadingRecords,
    level: shownLevel,
    order: recommended.map(item => item.book.id),
    justRightPage: shelfPages["just-right"],
    readAgainPage: shelfPages.second,
    slots: BOOK_SHELF_SLOTS
  }), [shownLibrary, guidedReadingRecords, recommended, shelfPages, shownLevel]);

  function hear(text) {
    const spoken = speakStudentRailLabel(text, window);
    setSpeechStatus(spoken ? "Reading it out." : "Speech is unavailable.");
  }

  function turnShelf(key, step) {
    setShelfPages(current => ({ ...current, [key]: (current[key] || 0) + step }));
  }

  if (openBookId && renderReader && library.some(book => book.id === openBookId)) {
    return renderReader({ bookId: openBookId, books: library, onExit: () => setOpenBookId("") });
  }

  if (library.length === 0) {
    const libraryMessage = publicationStatus === "loading"
      ? "Your books are getting ready."
      : publicationStatus === "ready"
        ? "Your grown-ups are preparing your reading choices."
        : "Books are not available right now. Ask a grown-up to try again later.";
    return (
      <StudentGlassShell
        studentName={studentName}
        scopeKey={progressScopeKey}
        active="books"
        onNavigate={onNavigate}
        onHome={onHome}
        onGrownUps={onGrownUps}
      >
        <div className="kg-screen kg-books kg-books-empty" data-child-surface="reading-library" data-library-empty="true">
          <div className="kg-books-head">
            <div>
              <h1 className="kg-title" data-child-title="">Books</h1>
              <p className="kg-body kg-books-headline" data-child-instruction="">{libraryMessage}</p>
            </div>
          </div>
          <div className="kg-glass kg-library-preparing" role="status">
            <span aria-hidden="true">📚</span>
            <strong>Come back soon</strong>
            <p>There are no reading books to choose just yet.</p>
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
      onHome={onHome}
      onGrownUps={onGrownUps}
    >
      <div
        className="kg-screen kg-books"
        data-child-surface="reading-library"
        data-learning-lane="language_and_meaning"
        data-read-state={recordsOk ? "ready" : "unreadable"}
        data-library-view={showKnowledge ? "knowledge" : "books"}
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

          {/* THE LEVEL FILTER, KEPT. The old shelf page had a row of level
              chips and a child could browse any level with them; they live in
              the title row now. The chips change which books shelf one shows —
              they never hide the child's own level from them. */}
          {levels.length > 1 && (
            <div className="kg-glass kg-segment-tray" role="group" aria-label="Book levels">
              {levels.map(entry => (
                <button
                  key={entry}
                  type="button"
                  className={`kg-segment${entry === shownLevel ? " is-active" : ""}`}
                  aria-pressed={entry === shownLevel}
                  onClick={() => {
                    setLevel(entry);
                    setCollectionId("all");
                    setShelfPages({ "just-right": 0, second: 0 });
                  }}
                >
                  Level {entry}
                </button>
              ))}
            </div>
          )}

          {collections.length > 1 && !showKnowledge && (
            <div
              className="kg-glass kg-collection-tray"
              role="group"
              aria-label={`Level ${shownLevel} book collections`}
            >
              <button
                type="button"
                className={`kg-collection-chip${shownCollectionId === "all" ? " is-active" : ""}`}
                aria-pressed={shownCollectionId === "all"}
                onClick={() => {
                  setCollectionId("all");
                  setShelfPages({ "just-right": 0, second: 0 });
                }}
              >
                All books
              </button>
              {collections.map(collection => (
                <button
                  key={collection.id}
                  type="button"
                  className={`kg-collection-chip${collection.id === shownCollectionId ? " is-active" : ""}`}
                  aria-pressed={collection.id === shownCollectionId}
                  onClick={() => {
                    setCollectionId(collection.id);
                    setShelfPages({ "just-right": 0, second: 0 });
                  }}
                >
                  {collection.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            className="kg-button kg-button--sm kg-glass kg-glass--strong kg-books-stories"
            aria-pressed={showKnowledge}
            onClick={() => setShowKnowledge(current => !current)}
          >
            {showKnowledge ? "All books" : "Explore ideas"}
          </button>

          <button
            type="button"
            className="kg-button kg-button--sm kg-glass kg-glass--strong kg-books-stories"
            onClick={onOpenStoryQuests}
          >
            Story Quests
            <ChevronGlyph />
          </button>
        </div>

        {!showKnowledge && (panelBook
          ? (
            <section
              className="kg-glass kg-glass--strong kg-glass--tinted kg-glass--raised kg-continue"
              aria-labelledby="kg-continue-title"
              data-child-progress=""
            >
              <img
                className="kg-continue-cover"
                src={coverFor(panelBook)}
                alt=""
                loading="eager"
                decoding="async"
                onError={hideOnError}
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
                    reason={panelRecommendation?.readingPurpose?.reason || "Open this book with reading help."}
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
                  onClick={() => hear(
                    `${resuming ? "You stopped here." : "Start here."} ${panelBook.title}.`
                  )}
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

        {showKnowledge && <section
          className="kg-glass kg-glass--quiet kg-knowledge"
          aria-labelledby="kg-knowledge-title"
          data-reading-level={shownLevel}
        >
          <div className="kg-knowledge-head">
            <div>
              <span className="kg-eyebrow">Explore an idea</span>
              <h2 className="kg-section-title" id="kg-knowledge-title">{knowledgeJourney.title}</h2>
              <p className="kg-body">{knowledgeJourney.guidingQuestion}</p>
            </div>
            <div className="kg-knowledge-tabs" role="group" aria-label="Choose an idea to explore">
              {knowledgeJourneys.map(journey => (
                <button
                  key={journey.id}
                  type="button"
                  className={journey.id === knowledgeJourney.id ? "is-active" : ""}
                  aria-pressed={journey.id === knowledgeJourney.id}
                  onClick={() => setKnowledgeJourneyId(journey.id)}
                >
                  {journey.title}
                </button>
              ))}
            </div>
          </div>
          <p className="kg-knowledge-words">
            Words to notice: {knowledgeJourney.vocabulary.join(" · ")}
          </p>
          <div className="kg-knowledge-books" data-child-choices="">
            {journeyBooks.map(book => {
              const purpose = purposeFor(book);
              return (
                <button
                  key={book.id}
                  type="button"
                  className="kg-knowledge-book"
                  onClick={() => setOpenBookId(book.id)}
                  data-book-level={book.level}
                >
                  <img src={coverFor(book)} alt="" loading="lazy" onError={hideOnError} />
                  <span>
                    <strong>{book.title}</strong>
                    <small>{purpose.shortLabel}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>}

        {!showKnowledge && <div className="kg-shelves" data-child-choices="">
          {shelves.map((shelf, shelfIndex) => (
            <section className="kg-shelf" key={shelf.id} aria-labelledby={`kg-shelf-${shelf.id}`}>
              <div className="kg-shelf-head">
                <span
                  className="kg-shelf-swatch"
                  style={{ "--kg-shelf-tint": shelf.tint }}
                  aria-hidden="true"
                />
                <h2 className="kg-section-title kg-shelf-title" id={`kg-shelf-${shelf.id}`}>
                  {shelf.title}
                </h2>
                <small className="kg-shelf-note">{shelf.note}</small>
              </div>
              <div className="kg-shelf-grid">
                {shelf.books.map(({ book, stars }) => {
                  const purpose = purposeFor(book);
                  return (
                    <button
                      key={book.id}
                      type="button"
                      className="kg-glass kg-book-card"
                      onClick={() => setOpenBookId(book.id)}
                      data-child-emphasis="choice"
                      data-reading-purpose={purpose.id}
                    >
                      <span className="kg-book-card-main">
                        <img
                          className="kg-book-cover"
                          src={coverFor(book)}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          onError={hideOnError}
                        />
                        <strong className="kg-book-title">{book.title}</strong>
                        <small className="kg-book-purpose">{purpose.shortLabel}</small>
                      </span>
                      <span
                        className="kg-book-stars"
                        role="img"
                        aria-label={stars === 1 ? "1 star won" : `${stars} stars won`}
                      >
                        <StarGlyph earned={stars > 0} />
                        {stars}
                      </span>
                    </button>
                  );
                })}
                {shelf.hasMore && (
                  <button
                    type="button"
                    className="kg-glass kg-glass--quiet kg-book-card kg-book-card--more"
                    onClick={() => turnShelf(shelfIndex === 0 ? "just-right" : "second", shelf.step)}
                  >
                    <span className="kg-book-card-main">
                      <span className="kg-book-more-glyph" aria-hidden="true"><MoreGlyph /></span>
                      <strong className="kg-book-title">More books</strong>
                    </span>
                  </button>
                )}
              </div>
            </section>
          ))}
        </div>}

        <span className="kg-speech" role="status" aria-live="polite">{speechStatus}</span>
      </div>
    </StudentGlassShell>
  );
}
