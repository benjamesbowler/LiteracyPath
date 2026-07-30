/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { announceMissionReturn, notifyMissionTaskDone } from "../../utils/dailyMission.js";
import { BookQuiz } from "./BookQuiz.jsx";
import { printCertificate } from "../../utils/printCertificate.js";
import { countBooksRead } from "../../utils/treasureTrail.js";
import { ConfettiCelebration } from "../learn/games/shared/ConfettiCelebration.jsx";
import { playCelebrationFanfare } from "../../utils/audio/gameSfx.js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  formatGuidedReadingType,
  getGuidedReadingProgress,
  normalizeGuidedReadingType,
  summarizeGuidedReadingRecord,
  summarizeGuidedReadingRecords
} from "../../data/guidedReadingBooks";
import { enrichGuidedReadingBook } from "../../utils/guidedReading/phonicsPageAnalyzer.js";
import { recommendBooksForStudent } from "../../utils/guidedReading/recommendBooksForStudent.js";
// The runtime library (retired books and pages removed, teacher level
// overrides applied) moved to its own module on 2026-07-29 so the child's Books
// screen shelves exactly the list this reader opens. See runtimeBooks.js.
import { getRuntimeGuidedReadingBooks } from "../../utils/guidedReading/runtimeBooks.js";
import { isGuidedReadingAssetDeleted } from "../../data/deletedMediaManifest.js";
import {
  getGuidedReadingBookAudioPath,
  getGuidedReadingWordProductionAudioPath,
  getGuidedReadingBookSyncPath,
  getGuidedReadingReadAloudState,
  getGuidedReadingPageAudioPath
} from "../../utils/guidedReading/readAloudPolicy.js";
import {
  DECODING_SUPPORT_STAGES,
  appendDecodingSupportEvent,
  createDecodingSupportEvent,
  getNextDecodingSupportStep
} from "../../utils/guidedReading/decodingSupport.js";
import { preloadMediaSet } from "../../utils/preloadMedia.js";
import { applyLearnerAudioIntensity } from "../../accessibility/learnerAccessibility.js";
import { getGuidedReadingMeasure } from "../../policy/guidedReadingMeasure.js";
import {
  ChildRecommendationExplanation,
  TeacherRecommendationExplanation
} from "../recommendations/RecommendationExplanation.jsx";
import { CHILD_COPY } from "../../copy/childCopy.js";
import { progressPhrase, TEACHER_COPY } from "../../copy/teacherCopy.js";

const GUIDED_READING_MEDIA_VERSION = "20260603-continuity-1";
const GUIDED_READING_NARRATION_RATE = 0.88;
const GUIDED_READING_WORD_RATE = 0.9;

function withGuidedReadingMediaVersion(src = "") {
  if (!src || !src.startsWith("/guided-reading/")) return src;
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}v=${GUIDED_READING_MEDIA_VERSION}`;
}

function GuidedReadingImage({
  src,
  alt,
  className = "",
  decoding = "async",
  fetchPriority,
  loading = "lazy",
  onLoad
}) {
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setMissing(false);
  }, [src]);

  if (!src || missing) {
    return (
      <div className={`guided-reading-image-fallback ${className}`} role="img" aria-label={alt || "Book page image unavailable"}>
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={className}
      decoding={decoding}
      fetchPriority={fetchPriority}
      loading={loading}
      onError={() => setMissing(true)}
      onLoad={onLoad}
      src={withGuidedReadingMediaVersion(src)}
    />
  );
}

const DEBUG_AUTOFIT = false;

function AutoFitReadingText({
  children,
  className = "",
  text = "",
  layoutVersion = 0,
  maxFontSize = 30,
  minFontSize = 16,
  lineHeight = 1.28,
  ...props
}) {
  const frameRef = useRef(null);
  const contentRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [fitReady, setFitReady] = useState(false);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return undefined;

    let cancelled = false;
    let fitCompleted = false;
    const rafIds = [];
    const timerIds = [];
    setFitReady(false);

    const fitText = (trigger = "layout") => {
      if (cancelled) return false;
      if (!frame.clientWidth || !frame.clientHeight) return false;

      content.style.fontSize = `${maxFontSize}px`;
      content.style.lineHeight = String(lineHeight);
      content.style.overflowY = "hidden";

      let fittedSize = maxFontSize;
      for (let size = maxFontSize; size >= minFontSize; size -= 1) {
        content.style.fontSize = `${size}px`;
        fittedSize = size;
        if (
          content.scrollHeight <= frame.clientHeight + 1 &&
          content.scrollWidth <= frame.clientWidth + 1
        ) {
          break;
        }
      }

      const stillOverflowing =
        content.scrollHeight > frame.clientHeight + 1 ||
        content.scrollWidth > frame.clientWidth + 1;

      content.style.fontSize = `${fittedSize}px`;
      content.style.overflowY = stillOverflowing ? "auto" : "hidden";
      setIsOverflowing(stillOverflowing);
      fitCompleted = true;
      setFitReady(true);

      if (DEBUG_AUTOFIT) {
        console.debug("[Guided Reading autofit]", {
          trigger,
          textLength: String(text || "").length,
          frameWidth: frame.clientWidth,
          frameHeight: frame.clientHeight,
          fontSize: fittedSize,
          scrollHeight: content.scrollHeight,
          clientHeight: frame.clientHeight,
          overflow: stillOverflowing
        });
      }

      return true;
    };

    const scheduleFit = (trigger = "resize") => {
      const rafId = window.requestAnimationFrame(() => fitText(trigger));
      rafIds.push(rafId);
    };

    fitText("initial");
    const raf1 = window.requestAnimationFrame(() => {
      fitText("raf-1");
      const raf2 = window.requestAnimationFrame(() => fitText("raf-2"));
      rafIds.push(raf2);
    });
    rafIds.push(raf1);
    timerIds.push(window.setTimeout(() => fitText("timeout-0"), 0));
    timerIds.push(window.setTimeout(() => fitText("timeout-100"), 100));
    timerIds.push(window.setTimeout(() => {
      if (!cancelled && !fitCompleted) setFitReady(true);
    }, 350));

    if (typeof document !== "undefined" && document.fonts?.ready) {
      const fontReadyTimeout = new Promise(resolve => {
        const timeoutId = window.setTimeout(resolve, 1200);
        timerIds.push(timeoutId);
      });
      Promise.race([document.fonts.ready, fontReadyTimeout])
        .then(() => {
          if (!cancelled) fitText("fonts-ready");
        })
        .catch(() => {
          if (!cancelled) fitText("fonts-ready-fallback");
        });
    }

    let frameObserver;
    let parentObserver;
    if (typeof ResizeObserver !== "undefined") {
      frameObserver = new ResizeObserver(() => scheduleFit("frame-resize"));
      frameObserver.observe(frame);
      if (frame.parentElement) {
        parentObserver = new ResizeObserver(() => scheduleFit("parent-resize"));
        parentObserver.observe(frame.parentElement);
      }
    } else {
      window.addEventListener("resize", scheduleFit);
    }

    window.addEventListener("orientationchange", scheduleFit);

    return () => {
      cancelled = true;
      rafIds.forEach(id => window.cancelAnimationFrame(id));
      timerIds.forEach(id => window.clearTimeout(id));
      if (frameObserver) frameObserver.disconnect();
      if (parentObserver) parentObserver.disconnect();
      if (!frameObserver) window.removeEventListener("resize", scheduleFit);
      window.removeEventListener("orientationchange", scheduleFit);
    };
  }, [text, layoutVersion, maxFontSize, minFontSize, lineHeight]);

  return (
    <div className={isOverflowing ? "guided-page-text-frame overflowing" : "guided-page-text-frame"} ref={frameRef}>
      <div
        {...props}
        className={[
          className,
          "auto-fit-reading-text",
          fitReady ? "is-ready" : "is-fitting"
        ].filter(Boolean).join(" ")}
        ref={contentRef}
      >
        {children}
      </div>
    </div>
  );
}

function getGuidedBookCover(book = {}) {
  const firstPage = (book.pages || []).find(page => page?.image || page?.imageUrl || page?.pageImage);
  const firstPageSrc = firstPage?.image || firstPage?.imageUrl || firstPage?.pageImage || "";
  const src = firstPageSrc || book.coverImage || book.cover || book.coverUrl || "";
  if (src && isGuidedReadingAssetDeleted({ bookId: book.id, path: src, pageNumber: 0 })) {
    return {
      src: "",
      isGenerated: true
    };
  }
  return {
    src,
    isGenerated: !src
  };
}

function GuidedBookCover({ book }) {
  const cover = getGuidedBookCover(book);

  if (!cover.src) {
    return (
      <div className="guided-book-generated-cover" role="img" aria-label={`${book.title} generated cover`}>
        <span>{formatGuidedReadingType(book.type)}</span>
        <strong>{book.title}</strong>
        <small>Level {book.level}</small>
      </div>
    );
  }

  return (
    <GuidedReadingImage
      alt={`${book.title} cover`}
      className="guided-book-cover"
      loading="lazy"
      src={cover.src}
    />
  );
}

function tokenizeReadingText(text = "") {
  const normalizedText = String(text || "")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  const tokens = normalizedText.match(/[A-Za-z0-9'-]+|[^A-Za-z0-9'-]+/g) || [];
  let wordIndex = -1;

  return tokens.map((token, index) => {
    if (/^[A-Za-z0-9'-]+$/.test(token) && /[A-Za-z0-9]/.test(token)) {
      wordIndex += 1;
      return { token, index, type: "word", wordIndex };
    }

    return { token, index, type: "text", wordIndex: null };
  });
}

function sentenceParts(text = "") {
  const matches = String(text || "").match(/[^.!?]+[.!?]*/g) || [];
  return matches.map(sentence => sentence.trim()).filter(Boolean);
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function pageAudioCue(page = {}) {
  const start = numberOrNull(
    page.audioStartSeconds ??
    page.audioStart ??
    page.startSeconds ??
    page.startTime ??
    page.syncStart
  );
  const end = numberOrNull(
    page.audioEndSeconds ??
    page.audioEnd ??
    page.endSeconds ??
    page.endTime ??
    page.syncEnd
  );
  const duration = numberOrNull(page.audioDurationSeconds ?? page.audioDuration ?? page.duration);

  if (start === null) return null;
  return {
    start,
    end: end ?? (duration === null ? null : start + duration)
  };
}

function countReadingWordsForSync(page = {}) {
  const text = page.pageAudioText || page.text || "";
  return Math.max(1, (String(text).match(/[A-Za-z0-9'-]+/g) || []).length);
}

function normalizeWholeBookSyncData(syncData = {}, book = {}, audioPath = "") {
  const syncAccuracy = String(syncData.syncAccuracy || "").toLowerCase();
  if (!["explicit", "estimated"].includes(syncAccuracy)) return null;
  if (syncData.bookId && book.id && syncData.bookId !== book.id) return null;
  if (syncData.audioPath && audioPath && syncData.audioPath !== audioPath) return null;
  if (!Array.isArray(syncData.pageTimings) || !syncData.pageTimings.length) return null;

  const pageTimings = syncData.pageTimings
    .map(item => {
      const pageIndex = Number(item.pageIndex);
      const startMs = Number(item.startMs);
      const endMs = Number(item.endMs);
      if (!Number.isInteger(pageIndex) || pageIndex < 0 || !Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
        return null;
      }
      return {
        pageIndex,
        startMs,
        endMs
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.startMs - b.startMs);

  if (!pageTimings.length) return null;
  return {
    syncAccuracy,
    durationMs: Number(syncData.durationMs) || 0,
    pageTimings
  };
}

function hasInlinePageLevelAudioTiming(pages = []) {
  return pages.some(page => pageAudioCue(page));
}

function buildWholeBookPageCues(pages = [], duration = 0, syncData = null) {
  if (!pages.length) return [];
  if (syncData?.pageTimings?.length) {
    return syncData.pageTimings.map(item => ({
      start: item.startMs / 1000,
      end: item.endMs / 1000,
      pageIndex: item.pageIndex
    }));
  }

  const explicitCues = pages.map(pageAudioCue);
  if (explicitCues.every(Boolean)) {
    return explicitCues.map((cue, index) => ({
      start: cue.start,
      end: cue.end ?? explicitCues[index + 1]?.start ?? duration,
      pageIndex: index
    }));
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    return pages.map((_, index) => ({ start: index, end: index + 1, pageIndex: index }));
  }

  const weights = pages.map(countReadingWordsForSync);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || pages.length;
  let elapsed = 0;
  return pages.map((_, index) => {
    const start = elapsed;
    const end = index === pages.length - 1
      ? duration
      : Math.min(duration, start + (duration * weights[index]) / totalWeight);
    elapsed = end;
    return { start, end, pageIndex: index };
  });
}

function findWholeBookPageIndex(cues = [], currentTime = 0) {
  if (!cues.length) return 0;
  const cue = cues.find(item => currentTime >= item.start && currentTime < item.end);
  return cue?.pageIndex ?? cues[cues.length - 1].pageIndex;
}

async function fetchWholeBookSyncData(book = {}, audioPath = "") {
  if (typeof fetch === "undefined" || !book?.id) return null;
  try {
    const response = await fetch(getGuidedReadingBookSyncPath(book), { cache: "no-cache" });
    if (!response.ok) return null;
    const syncData = await response.json();
    return normalizeWholeBookSyncData(syncData, book, audioPath);
  } catch (error) {
    if (import.meta.env.DEV) console.warn("Guided Reading sync data unavailable.", book.id, error);
    return null;
  }
}

const guidedReadingLevels = ["A", "B", "C", "D", "E", "F"];

function getGuidedReadingTypeStats(type) {
  const normalizedType = normalizeGuidedReadingType(type);
  const books = getRuntimeGuidedReadingBooks().filter(book => normalizeGuidedReadingType(book.type) === normalizedType);
  return {
    type: normalizedType,
    label: formatGuidedReadingType(normalizedType),
    books,
    count: books.length,
    levels: [...new Set(books.map(book => book.level).filter(Boolean))].sort()
  };
}

function getGuidedReadingLevelBooks(type, level) {
  return getRuntimeGuidedReadingBooks().filter(book =>
    normalizeGuidedReadingType(book.type) === normalizeGuidedReadingType(type) &&
    book.level === level
  );
}

function getGuidedReadingSeries(type) {
  const normalizedType = normalizeGuidedReadingType(type);
  const groups = new Map();
  getRuntimeGuidedReadingBooks()
    .filter(book => normalizeGuidedReadingType(book.type) === normalizedType)
    .forEach(book => {
      const id = book.seriesId || `${normalizedType}-more`;
      const title = book.seriesTitle || (normalizedType === "fiction" ? "More stories" : "More non-fiction");
      if (!groups.has(id)) groups.set(id, { id, title, books: [] });
      groups.get(id).books.push(book);
    });
  return [...groups.values()];
}

export function GuidedReadingPage({
  initialBookId = "",
  studentId,
  studentName,
  studentProgress = null,
  recommendationEvidenceReady = true,
  guidedReadingRecords = {},
  saveGuidedReadingRecord,
  speakText,
  mode = "teacher",
  autoNarration = false,
  launchBookId = "",
  onLaunchBookHandled = null,
  // Phase D (2026-07-29): the child's Books screen is the front door for this
  // page in student mode, so "back to library" has somewhere to go that is not
  // the old shelf underneath. Absent (teacher and whole-class modes), closing
  // the reader behaves exactly as it always did.
  onCloseReader = null
}) {
  const [selectedBookId, setSelectedBookId] = useState(() => getRuntimeGuidedReadingBooks()[0]?.id || "");
  const [selectedLibraryType, setSelectedLibraryType] = useState("");
  const [selectedLibraryLevel, setSelectedLibraryLevel] = useState("");
  const [selectedLibrarySeries, setSelectedLibrarySeries] = useState("");
  const [libraryPage, setLibraryPage] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const initialBookHandledRef = useRef(false);

  const [levelUp, setLevelUp] = useState(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readingMode, setReadingMode] = useState("reading");
  const [lineFocusEnabled, setLineFocusEnabled] = useState(false);
  const [focusedSentenceIndex, setFocusedSentenceIndex] = useState(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(null);
  const [highlightedSentenceIndex, setHighlightedSentenceIndex] = useState(null);
  const [audioNotice, setAudioNotice] = useState("");
  const [isPageAudioPlaying, setIsPageAudioPlaying] = useState(false);
  const [isWholeBookReading, setIsWholeBookReading] = useState(false);
  const [isReadAloudLoading, setIsReadAloudLoading] = useState(false);
  const [loadingWordAudioIndex, setLoadingWordAudioIndex] = useState(null);
  const [activeDecodingSupport, setActiveDecodingSupport] = useState(null);
  const [isReadAloudPaused, setIsReadAloudPaused] = useState(false);
  const [autoAdvanceReadAloud, setAutoAdvanceReadAloud] = useState(true);
  const [wholeBookSyncData, setWholeBookSyncData] = useState(null);
  const [teacherNotesOpen, setTeacherNotesOpen] = useState(false);
  const [isReaderFullscreen, setIsReaderFullscreen] = useState(false);
  const [readerLayoutVersion, setReaderLayoutVersion] = useState(0);
  const guidedReaderShellRef = useRef(null);
  const missionReturnPendingRef = useRef(false);
  const pageAudioRef = useRef(null);
  const wordSupportAudioRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const sentenceTimersRef = useRef([]);
  const lastVisitedPageRef = useRef("");
  const readAloudPageChangeRef = useRef(false);
  const autoAdvanceReadAloudRef = useRef(autoAdvanceReadAloud);
  const autoNarratedPageRef = useRef("");
  const touchStartRef = useRef(null);
  const decodingSupportStageRef = useRef(new Map());
  const decodingSupportEventCounterRef = useRef(0);
  const wordSupportPlaybackTokenRef = useRef(0);
  const recordDraftRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const runtimeGuidedReadingBooks = getRuntimeGuidedReadingBooks();
  const selectedBook = runtimeGuidedReadingBooks.find(book => book.id === selectedBookId) || runtimeGuidedReadingBooks[0];
  const page = selectedBook?.pages?.[pageIndex];
  const readingMeasure = getGuidedReadingMeasure(selectedBook?.level);
  const record = guidedReadingRecords[selectedBook?.id] || {
    bookId: selectedBook?.id,
    title: selectedBook?.title,
    type: selectedBook?.type,
    level: selectedBook?.level,
    pages: {},
    wholeBookNote: ""
  };
  const currentPageRecord = record.pages?.[pageIndex] || {
    wordMarks: {},
    wordTexts: page?.words?.map(word => word.text) || [],
    note: ""
  };
  const summary = summarizeGuidedReadingRecord(record);
  const readingProgress = selectedBook ? getGuidedReadingProgress(selectedBook, record) : null;
  const enrichedSelectedBook = selectedBook ? enrichGuidedReadingBook(selectedBook) : null;
  const readAloudState = selectedBook && page
    ? getGuidedReadingReadAloudState(selectedBook, page, "guided_support")
    : getGuidedReadingReadAloudState({}, {}, "guided_support");
  const currentPageAudioPath = readAloudState.pageAudioPath;
  const fullBookAudioPath = selectedBook ? getGuidedReadingBookAudioPath(selectedBook) : "";
  const allPagesHaveAudio = Boolean(selectedBook?.pages?.length) &&
    selectedBook.pages.every(item => Boolean(getGuidedReadingPageAudioPath(item)));
  const canReadWholeBook = Boolean(fullBookAudioPath || allPagesHaveAudio);
  const isStudentMode = mode === "student";
  // "class" is the whole-class read opened from the Resources shelf: a teacher
  // reading to the room, with no single student to attribute anything to. It
  // keeps every reading tool and drops every capture control, because a note or
  // a running record with nobody to save it against is discarded silently.
  const isClassMode = mode === "class";
  const canRecord = !isStudentMode && !isClassMode;
  const guidedReadingSurfaceLabel = isStudentMode
    ? "Reading library"
    : isClassMode
      ? "Whole-class guided reading"
      : `${studentName || "Student"} guided reading`;
  const readerCopy = isStudentMode
    ? CHILD_COPY.guidedReading
    : TEACHER_COPY.guidedReading.controls;
  const changeInitialBook = useEffectEvent(bookId => changeBook(bookId));
  const stopCurrentPageAudio = useEffectEvent(() => stopPageAudio());
  const recordCurrentGuidedPageVisit = useEffectEvent(nextPageIndex => {
    recordGuidedPageVisit(nextPageIndex);
  });
  const autoNarrateCurrentPage = useEffectEvent(() => {
    void togglePageAudio({ automatic: true });
  });
  const fetchCurrentWholeBookSyncData = useEffectEvent(audioPath => (
    fetchWholeBookSyncData(selectedBook, audioPath)
  ));
  const turnReaderPage = useEffectEvent(direction => {
    if (direction < 0) goToPreviousPage();
    else goToNextPage();
  });

  useEffect(() => {
    if (!initialBookId || initialBookHandledRef.current) return;
    initialBookHandledRef.current = true;
    const target = getRuntimeGuidedReadingBooks().find(book => book.id === initialBookId);
    if (!target) return;
    const timer = window.setTimeout(() => changeInitialBook(initialBookId), 0);
    return () => window.clearTimeout(timer);
  }, [initialBookId]);

  useEffect(() => {
    if (!readerOpen || !selectedBook || !page) return;
    const nextPage = selectedBook.pages?.[pageIndex + 1] || null;
    const previousPage = selectedBook.pages?.[pageIndex - 1] || null;

    void preloadMediaSet({
      images: [
        withGuidedReadingMediaVersion(page.image),
        withGuidedReadingMediaVersion(nextPage?.image),
        withGuidedReadingMediaVersion(previousPage?.image)
      ],
      audio: [
        currentPageAudioPath,
        nextPage ? getGuidedReadingPageAudioPath(nextPage) : ""
      ]
    });
  }, [currentPageAudioPath, page, pageIndex, readerOpen, selectedBook]);

  useEffect(() => {
    setActiveDecodingSupport(null);
    decodingSupportStageRef.current.clear();
    setHighlightedSentenceIndex(null);
    setFocusedSentenceIndex(0);
    wordSupportPlaybackTokenRef.current += 1;
    stopWordSupportAudio();
  }, [pageIndex, selectedBookId]);

  useEffect(() => {
    if (!launchBookId) return;
    const launchedBook = runtimeGuidedReadingBooks.find(book => book.id === launchBookId);
    if (!launchedBook) {
      onLaunchBookHandled?.();
      return;
    }
    setSelectedBookId(launchedBook.id);
    setSelectedLibraryType(normalizeGuidedReadingType(launchedBook.type));
    setSelectedLibraryLevel(launchedBook.level || "");
    setPageIndex(0);
    setShowSummary(false);
    setShowQuiz(false);
    setReaderOpen(true);
    setReadingMode("reading");
    onLaunchBookHandled?.();
  }, [launchBookId, onLaunchBookHandled, runtimeGuidedReadingBooks]);

  const recommendedBooks = recommendBooksForStudent({
    books: runtimeGuidedReadingBooks,
    studentProgress: recommendationEvidenceReady && studentProgress ? studentProgress : {},
    readingHistory: guidedReadingRecords
  }).slice(0, 5);
  const recommendationLevel = recommendedBooks[0]?.readingLevel || "A";
  const recommendationFocus = recommendationEvidenceReady
    ? String(studentProgress?.currentSkillLabel || "").trim()
    : "";
  const recommendationDescription = !recommendationEvidenceReady
    ? TEACHER_COPY.guidedReading.descriptionWithoutResults(recommendationLevel)
    : recommendationFocus
      ? TEACHER_COPY.guidedReading.descriptionWithFocus(
        studentName || "the student",
        recommendationFocus,
        recommendationLevel
      )
      : TEACHER_COPY.guidedReading.descriptionWithoutFocus(recommendationLevel);
  const selectedBookFocusLabels = [...new Set(
    (enrichedSelectedBook?.recommendedSkillsToReinforce || [])
      .map(TEACHER_COPY.guidedReading.patternLabel)
      .filter(Boolean)
  )].slice(0, 3);
  const readingTokens = tokenizeReadingText(page?.text || "");
  const pageSentences = sentenceParts(page?.text || "");
  let sentenceWordOffset = -1;
  const sentenceTokenGroups = pageSentences.length
    ? pageSentences.map((sentence, sentenceIndex) => ({
      sentenceIndex,
      tokens: tokenizeReadingText(sentence).map(item => {
        if (item.type !== "word") return item;
        sentenceWordOffset += 1;
        return { ...item, wordIndex: sentenceWordOffset };
      })
    }))
    : [{
      sentenceIndex: 0,
      tokens: readingTokens
    }];
  const typeCards = ["fiction", "nonfiction"]
    .map(getGuidedReadingTypeStats)
    .filter(card => card.count > 0);
  const availableLevels = selectedLibraryType
    ? guidedReadingLevels.filter(level => getGuidedReadingLevelBooks(selectedLibraryType, level).length > 0)
    : [];
  const visibleLibraryBooks = selectedLibraryType && selectedLibraryLevel
    ? getGuidedReadingLevelBooks(selectedLibraryType, selectedLibraryLevel)
    : [];
  const guidedReadingModeClass = isStudentMode ? "student-guided-reading-page" : "teacher-guided-reading-page";
  const guidedReadingPageClassName = [
    readerOpen ? "guided-reading-page guided-reading-reader-open" : "teacher-product-page guided-reading-page",
    guidedReadingModeClass
  ].join(" ");

  useEffect(() => {
    return () => {
      if (pageAudioRef.current) {
        pageAudioRef.current.pause();
        pageAudioRef.current = null;
      }
      wordSupportPlaybackTokenRef.current += 1;
      stopWordSupportAudio();
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      if (sentenceTimersRef.current.length) {
        sentenceTimersRef.current.forEach(clearTimeout);
        sentenceTimersRef.current = [];
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    setAudioNotice("");
    setHighlightedWordIndex(null);
    setHighlightedSentenceIndex(null);
    if (readAloudPageChangeRef.current) {
      readAloudPageChangeRef.current = false;
      return;
    }
    stopCurrentPageAudio();
  }, [selectedBookId, pageIndex]);

  useEffect(() => {
    if (!readerOpen || !selectedBookId || !page) return;
    recordCurrentGuidedPageVisit(pageIndex);
  }, [readerOpen, selectedBookId, pageIndex, page]);

  useEffect(() => {
    if (
      !autoNarration
      || !isStudentMode
      || !readerOpen
      || showSummary
      || showQuiz
      || !currentPageAudioPath
    ) return undefined;
    const pageKey = `${selectedBookId}:${pageIndex}`;
    if (autoNarratedPageRef.current === pageKey) return undefined;
    autoNarratedPageRef.current = pageKey;
    const timer = window.setTimeout(autoNarrateCurrentPage, 0);
    return () => window.clearTimeout(timer);
  }, [
    autoNarration,
    currentPageAudioPath,
    isStudentMode,
    pageIndex,
    readerOpen,
    selectedBookId,
    showQuiz,
    showSummary
  ]);

  useEffect(() => {
    autoAdvanceReadAloudRef.current = autoAdvanceReadAloud;
  }, [autoAdvanceReadAloud]);

  useEffect(() => {
    let cancelled = false;
    setWholeBookSyncData(null);
    if (!selectedBookId || !fullBookAudioPath) return undefined;

    fetchCurrentWholeBookSyncData(fullBookAudioPath).then(syncData => {
      if (!cancelled) setWholeBookSyncData(syncData);
    });

    // Start downloading the whole-book audio the moment the book opens,
    // so "Read Book" plays instantly instead of buffering on press.
    const warm = new Audio();
    warm.preload = "auto";
    warm.src = fullBookAudioPath;

    return () => {
      cancelled = true;
      warm.removeAttribute("src");
    };
  }, [selectedBookId, fullBookAudioPath]);

  useEffect(() => {
    if (readerOpen) setTeacherNotesOpen(false);
  }, [readerOpen, selectedBookId]);

  useEffect(() => {
    if (isStudentMode && readingMode === "marking") {
      const timeoutId = window.setTimeout(() => {
        setReadingMode("reading");
        setTeacherNotesOpen(false);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [isStudentMode, readingMode]);

  useEffect(() => {
    if (!readerOpen) return;
    setReaderLayoutVersion(version => version + 1);
  }, [
    readerOpen,
    selectedBookId,
    pageIndex,
    page?.image,
    page?.text,
    readingMode,
    teacherNotesOpen,
    isReaderFullscreen
  ]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    function handleFullscreenChange() {
      setIsReaderFullscreen(document.fullscreenElement === guidedReaderShellRef.current);
      setReaderLayoutVersion(version => version + 1);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!readerOpen || showSummary || showQuiz) return undefined;

    function handleKeyDown(event) {
      const tagName = event.target?.tagName?.toLowerCase();
      if (tagName === "textarea" || tagName === "input" || tagName === "select") return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        turnReaderPage(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        turnReaderPage(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readerOpen, showSummary, showQuiz, pageIndex, selectedBook?.pages?.length]);

  function getWorkingRecord() {
    const externalRecord = guidedReadingRecords[selectedBook?.id] || record || {};
    const draftRecord = recordDraftRef.current;
    if (
      draftRecord?.bookId === selectedBook?.id &&
      draftRecord?.studentId === studentId
    ) {
      const externalUpdatedAt = Date.parse(externalRecord.updatedAt || externalRecord.lastReadAt || "") || 0;
      const draftUpdatedAt = Date.parse(draftRecord.updatedAt || draftRecord.lastReadAt || "") || 0;
      if (externalUpdatedAt > draftUpdatedAt) {
        recordDraftRef.current = externalRecord;
        return externalRecord;
      }
      return draftRecord;
    }
    recordDraftRef.current = externalRecord;
    return externalRecord;
  }

  function updateRecord(patch) {
    if (!selectedBook || isClassMode) return;
    const previous = getWorkingRecord();
    const nextRecord = {
      ...previous,
      studentId,
      bookId: selectedBook.id,
      title: selectedBook.title,
      type: selectedBook.type,
      level: selectedBook.level,
      updatedAt: new Date().toISOString(),
      ...patch
    };
    recordDraftRef.current = nextRecord;
    saveGuidedReadingRecord(selectedBook.id, nextRecord);
  }

  function touchBookProgress(nextPageIndex = pageIndex, patch = {}) {
    if (!selectedBook || isClassMode) return;
    const now = new Date().toISOString();
    const totalPages = selectedBook.pages.length;
    const previous = getWorkingRecord();

    const nextRecord = {
      ...previous,
      studentId,
      bookId: selectedBook.id,
      title: selectedBook.title,
      type: normalizeGuidedReadingType(selectedBook.type),
      level: selectedBook.level,
      firstReadAt: previous.firstReadAt || now,
      lastReadAt: now,
      completedPages: Math.min(totalPages, Math.max(Number(previous.completedPages || 0), nextPageIndex + 1)),
      totalPages,
      completed: Boolean(previous.completed || previous.completedAt),
      readCount: Number(previous.readCount || (previous.completed || previous.completedAt ? 1 : 0)),
      updatedAt: now,
      ...patch
    };
    recordDraftRef.current = nextRecord;
    saveGuidedReadingRecord(selectedBook.id, nextRecord);
  }

  function recordGuidedPageVisit(nextPageIndex = pageIndex) {
    if (!selectedBook) return;
    const visitKey = `${selectedBook.id}:${nextPageIndex}`;
    if (lastVisitedPageRef.current === visitKey) {
      touchBookProgress(nextPageIndex);
      return;
    }
    lastVisitedPageRef.current = visitKey;
    const previous = getWorkingRecord();
    const previousStats = previous.pageStats || {};
    const pageKey = String(nextPageIndex + 1);
    const previousPageStats = previousStats[pageKey] || {};
    const openedCount = Number(previousPageStats.openedCount || 0) + 1;

    touchBookProgress(nextPageIndex, {
      pageStats: {
        ...previousStats,
        [pageKey]: {
          ...previousPageStats,
          openedCount,
          rereadCount: Math.max(0, openedCount - 1),
          lastOpenedAt: new Date().toISOString()
        }
      }
    });
  }

  function updatePageRecord(nextPageRecord) {
    if (!page) return;
    const previous = getWorkingRecord();
    const previousPageRecord = previous.pages?.[pageIndex] || currentPageRecord;
    updateRecord({
      pages: {
        ...previous.pages,
        [pageIndex]: {
          ...previousPageRecord,
          wordTexts: (page.words || []).map(word => word.text),
          updatedAt: new Date().toISOString(),
          ...nextPageRecord
        }
      }
    });
  }

  function cycleWordMark(wordIndex) {
    const existing = currentPageRecord.wordMarks?.[wordIndex] || "";
    const next =
      existing === ""
        ? "correct"
        : existing === "correct"
          ? "support"
          : "";
    const wordMarks = { ...(currentPageRecord.wordMarks || {}) };

    if (next) wordMarks[wordIndex] = next;
    else delete wordMarks[wordIndex];

    updatePageRecord({ wordMarks });
  }

  function updatePageNote(note) {
    updatePageRecord({ note });
  }

  function updateWholeBookNote(wholeBookNote) {
    updateRecord({ wholeBookNote });
  }

  function completeBook() {
    if (!selectedBook) return;
    stopPageAudio();
    const now = new Date().toISOString();
    const wasCompleted = Boolean(record.completed || record.completedAt);
    const nextReadCount = wasCompleted
      ? Number(record.readCount || 1) + 1
      : Math.max(1, Number(record.readCount || 0) + 1);

    touchBookProgress(selectedBook.pages.length - 1, {
      completed: true,
      completedAt: record.completedAt || now,
      lastReadAt: now,
      readCount: nextReadCount,
      completedPages: selectedBook.pages.length,
      totalPages: selectedBook.pages.length
    });
    // Credit the book on READING completion (not on finishing the quiz), so a
    // child who reads the whole book always gets the mission, even if they skip
    // the quiz. Coins for the book are derived in the Hollow economy - no gems.
    const scope = studentId || studentName || "default";
    // In student mode the quiz follows: credit the task now, but hold the
    // auto-return to the mission screen until the reader closes, so the
    // quiz and its summary are never unmounted mid-flow.
    const newlyDone = notifyMissionTaskDone(scope, "book", { deferReturn: isStudentMode });
    if (newlyDone && isStudentMode) missionReturnPendingRef.current = true;
    if (isStudentMode) {
      setShowQuiz(true);
    } else {
      setShowSummary(true);
    }
  }

  function handleQuizFinish(quizCorrect, quizTotal) {
    setShowQuiz(false);
    updateRecord({
      quizScore: quizCorrect,
      quizTotal,
      quizAt: new Date().toISOString()
    });

    // Level-up: every book of this type + level is now completed.
    const levelBooks = getGuidedReadingLevelBooks(selectedBook.type, selectedBook.level);
    const allDone = levelBooks.length > 1 && levelBooks.every(book =>
      book.id === selectedBook.id ||
      Boolean(guidedReadingRecords[book.id]?.completed || guidedReadingRecords[book.id]?.completedAt)
    );
    if (allDone) {
      playCelebrationFanfare();
      setLevelUp({ level: selectedBook.level, count: levelBooks.length });
    } else {
      setShowSummary(true);
    }
  }

  function changeBook(bookId) {
    setSelectedBookId(bookId);
    setPageIndex(0);
    setShowSummary(false);
    setShowQuiz(false);
    setReaderOpen(true);
    setReadingMode("reading");
  }

  function closeReader() {
    stopPageAudio();
    // The held mission-return from finishing today's first book fires now,
    // once the child is done with the quiz/summary and closes the reader.
    if (missionReturnPendingRef.current) {
      missionReturnPendingRef.current = false;
      announceMissionReturn("book");
    }
    if (typeof document !== "undefined" && document.fullscreenElement === guidedReaderShellRef.current) {
      document.exitFullscreen?.().catch(() => {});
    }
    setReaderOpen(false);
    setShowSummary(false);
    setShowQuiz(false);
    // Phase D: hand the child back to the Books screen they opened this from.
    onCloseReader?.();
  }

  async function toggleReaderFullscreen() {
    const shell = guidedReaderShellRef.current;
    if (!shell || typeof document === "undefined") {
      setIsReaderFullscreen(value => !value);
      return;
    }

    try {
      if (document.fullscreenElement === shell) {
        await document.exitFullscreen();
      } else if (shell.requestFullscreen) {
        await shell.requestFullscreen();
      } else {
        setIsReaderFullscreen(value => !value);
      }
    } catch (error) {
      console.warn("Guided Reading fullscreen toggle unavailable.", error);
      setIsReaderFullscreen(value => !value);
    }
  }

  function goToPreviousPage() {
    setPageIndex(index => Math.max(0, index - 1));
  }

  function goToNextPage() {
    setPageIndex(index => Math.min(selectedBook.pages.length - 1, index + 1));
  }

  function handlePageTouchStart(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  }

  function handlePageTouchEnd(event) {
    const start = touchStartRef.current;
    const touch = event.changedTouches?.[0];
    touchStartRef.current = null;
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 54 || Math.abs(deltaY) > 70) return;

    if (deltaX < 0) goToNextPage();
    else goToPreviousPage();
  }

  function stopPageAudio() {
    if (pageAudioRef.current) {
      pageAudioRef.current.pause();
      pageAudioRef.current.currentTime = 0;
      pageAudioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    sentenceTimersRef.current.forEach(clearTimeout);
    sentenceTimersRef.current = [];
    setHighlightedSentenceIndex(null);
    setIsPageAudioPlaying(false);
    setIsWholeBookReading(false);
    setIsReadAloudLoading(false);
    setIsReadAloudPaused(false);
  }

  async function togglePageAudio(options = {}) {
    const automatic = options?.automatic === true;
    if (automatic && (pageAudioRef.current || isPageAudioPlaying || isReadAloudLoading)) {
      return;
    }
    if (pageAudioRef.current && isPageAudioPlaying) {
      stopPageAudio();
      return;
    }
    if (isPageAudioPlaying) {
      stopPageAudio();
      return;
    }

    stopPageAudio();
    if (!automatic) {
      const previous = guidedReadingRecords[selectedBook.id] || record || {};
      const previousStats = previous.pageStats || {};
      const pageKey = String(pageIndex + 1);
      const previousPageStats = previousStats[pageKey] || {};
      touchBookProgress(pageIndex, {
        readPageButtonUses: Number(previous.readPageButtonUses || 0) + 1,
        pageStats: {
          ...previousStats,
          [pageKey]: {
            ...previousPageStats,
            readPageButtonUses: Number(previousPageStats.readPageButtonUses || 0) + 1,
            lastReadPageAt: new Date().toISOString()
          }
        }
      });
    }

    if (!currentPageAudioPath) {
      setAudioNotice("Read-aloud audio is not available for this page yet.");
      return;
    }

    setIsReadAloudLoading(true);
    try {
      const audio = new Audio(currentPageAudioPath);
      audio.playbackRate = GUIDED_READING_NARRATION_RATE;
      audio.volume = applyLearnerAudioIntensity(1);
      pageAudioRef.current = audio;
      setIsReadAloudPaused(false);
      runSentenceHighlights(pageSentences);
      audio.onended = () => {
        pageAudioRef.current = null;
        setIsPageAudioPlaying(false);
        setIsReadAloudLoading(false);
        setHighlightedSentenceIndex(null);
      };
      audio.onerror = () => {
        pageAudioRef.current = null;
        setIsPageAudioPlaying(false);
        setIsReadAloudLoading(false);
        setAudioNotice("Read-aloud audio could not be loaded for this page.");
      };
      await audio.play();
      setIsReadAloudLoading(false);
      setIsPageAudioPlaying(true);
    } catch (error) {
      console.warn("Guided Reading page audio unavailable.", error);
      pageAudioRef.current = null;
      setIsPageAudioPlaying(false);
      setIsReadAloudLoading(false);
      setAudioNotice("Read-aloud audio could not be played for this page.");
    }
  }

  function toggleReadAloudPause() {
    const audio = pageAudioRef.current;
    if (!audio) return;
    if (isReadAloudPaused) {
      audio.play().then(() => setIsReadAloudPaused(false)).catch(() => setAudioNotice("Read-aloud could not resume."));
    } else {
      audio.pause();
      setIsReadAloudPaused(true);
    }
  }

  async function readWholeBookFrom(startIndex = pageIndex) {
    if (!selectedBook) return;
    const audioPath = getGuidedReadingPageAudioPath(selectedBook.pages[startIndex] || {});
    if (!audioPath) {
      setIsWholeBookReading(false);
      setAudioNotice("Read-aloud audio is not available for the whole book yet.");
      return;
    }

    readAloudPageChangeRef.current = true;
    setPageIndex(startIndex);
    setIsReadAloudLoading(true);
    try {
      const audio = new Audio(audioPath);
      audio.playbackRate = GUIDED_READING_NARRATION_RATE;
      audio.volume = applyLearnerAudioIntensity(1);
      pageAudioRef.current = audio;
      setIsWholeBookReading(true);
      setIsReadAloudPaused(false);
      audio.onended = () => {
        pageAudioRef.current = null;
        setIsPageAudioPlaying(false);
        setIsReadAloudLoading(false);
        if (autoAdvanceReadAloudRef.current && startIndex < selectedBook.pages.length - 1) {
          readWholeBookFrom(startIndex + 1);
        } else {
          setIsWholeBookReading(false);
          setHighlightedSentenceIndex(null);
        }
      };
      audio.onerror = () => {
        pageAudioRef.current = null;
        setIsPageAudioPlaying(false);
        setIsWholeBookReading(false);
        setIsReadAloudLoading(false);
        setAudioNotice("Read-aloud audio could not be loaded for this book.");
      };
      await audio.play();
      setIsReadAloudLoading(false);
      setIsPageAudioPlaying(true);
    } catch (error) {
      console.warn("Guided Reading whole-book audio unavailable.", error);
      setIsPageAudioPlaying(false);
      setIsWholeBookReading(false);
      setIsReadAloudLoading(false);
      setAudioNotice("Read-aloud audio could not be played for this book.");
    }
  }

  async function startWholeBookReadAloud() {
    if (!selectedBook) return;
    stopPageAudio();
    touchBookProgress(pageIndex, {
      readWholeBookButtonUses: Number(record.readWholeBookButtonUses || 0) + 1,
      lastReadWholeBookAt: new Date().toISOString()
    });

    if (fullBookAudioPath) {
      setIsReadAloudLoading(true);
      try {
        const syncData = wholeBookSyncData || await fetchWholeBookSyncData(selectedBook, fullBookAudioPath);
        if (syncData && !wholeBookSyncData) setWholeBookSyncData(syncData);
        const audio = new Audio(fullBookAudioPath);
        audio.playbackRate = GUIDED_READING_NARRATION_RATE;
        audio.volume = applyLearnerAudioIntensity(1);
        const fullBookStartIndex = Math.min(pageIndex, selectedBook.pages.length - 1);
        let pageCues = [];
        const syncPageToFullBookAudio = () => {
          if (!autoAdvanceReadAloudRef.current) return;
          if (!pageCues.length) {
            pageCues = buildWholeBookPageCues(selectedBook.pages, audio.duration, syncData);
          }
          const nextPageIndex = findWholeBookPageIndex(pageCues, audio.currentTime);
          readAloudPageChangeRef.current = true;
          setPageIndex(currentIndex => currentIndex === nextPageIndex ? currentIndex : nextPageIndex);
        };

        pageAudioRef.current = audio;
        setIsWholeBookReading(true);
        setIsReadAloudPaused(false);
        setAudioNotice(syncData?.syncAccuracy === "explicit" || hasInlinePageLevelAudioTiming(selectedBook.pages)
          ? ""
          : syncData?.syncAccuracy === "estimated"
            ? "Syncing pages with estimated timings pending verification."
            : "Syncing pages with runtime fallback timings until page-level timing data is added.");
        readAloudPageChangeRef.current = true;
        setPageIndex(fullBookStartIndex);
        audio.onloadedmetadata = () => {
          pageCues = buildWholeBookPageCues(selectedBook.pages, audio.duration, syncData);
          const startCue = pageCues[fullBookStartIndex];
          if (startCue?.start && Number.isFinite(startCue.start)) {
            audio.currentTime = startCue.start;
          }
          syncPageToFullBookAudio();
        };
        audio.ontimeupdate = syncPageToFullBookAudio;
        audio.onended = () => {
          pageAudioRef.current = null;
          setIsWholeBookReading(false);
          setIsPageAudioPlaying(false);
          setIsReadAloudLoading(false);
          if (autoAdvanceReadAloudRef.current) {
            readAloudPageChangeRef.current = true;
            setPageIndex(selectedBook.pages.length - 1);
          }
        };
        audio.onerror = () => {
          pageAudioRef.current = null;
          setIsWholeBookReading(false);
          setIsPageAudioPlaying(false);
          setIsReadAloudLoading(false);
          setAudioNotice("Whole-book audio could not be loaded.");
        };
        await audio.play();
        setIsReadAloudLoading(false);
        setIsPageAudioPlaying(true);
      } catch (error) {
        console.warn("Guided Reading full-book audio unavailable.", error);
        setIsWholeBookReading(false);
        setIsPageAudioPlaying(false);
        setIsReadAloudLoading(false);
        setIsReadAloudPaused(false);
        setAudioNotice("Whole-book audio could not be played.");
      }
      return;
    }

    if (!allPagesHaveAudio) {
      setAudioNotice("Read-aloud audio is not available for this whole book yet.");
      return;
    }

    readWholeBookFrom(pageIndex);
  }

  function runSentenceHighlights(sentences = []) {
    sentenceTimersRef.current.forEach(clearTimeout);
    sentenceTimersRef.current = [];
    if (!sentences.length) return;
    const totalWords = sentences.join(" ").split(/\s+/).filter(Boolean).length || 1;
    let elapsed = 0;
    sentences.forEach((sentence, index) => {
      const wordsInSentence = sentence.split(/\s+/).filter(Boolean).length || 1;
      sentenceTimersRef.current.push(setTimeout(() => setHighlightedSentenceIndex(index), elapsed));
      elapsed += Math.max(900, wordsInSentence * 420);
    });
    sentenceTimersRef.current.push(setTimeout(() => setHighlightedSentenceIndex(null), Math.max(elapsed, totalWords * 360)));
  }

  function brieflyHighlightWord(wordIndex) {
    setHighlightedWordIndex(wordIndex);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedWordIndex(null), 700);
  }

  function getGuidedReadingWordAudioCandidates(word = {}) {
    const guidedReadingWordSlug = String(word?.text || "")
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!guidedReadingWordSlug) return [];

    return [
      getGuidedReadingWordProductionAudioPath(word)
    ].filter(Boolean).filter(audioPath =>
      String(audioPath).includes("/audio/production/en-US/")
    );
  }

  async function findExistingGuidedReadingWordAudio(word = {}) {
    const candidates = [...new Set(getGuidedReadingWordAudioCandidates(word))];
    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate, { method: "HEAD" });
        if (response.ok) return candidate;
      } catch {
        // Try the next candidate. Missing word audio is reported below in development.
      }
    }
    return "";
  }

  function stopWordSupportAudio() {
    const activeAudio = wordSupportAudioRef.current;
    if (!activeAudio) return;
    wordSupportAudioRef.current = null;
    const finish = activeAudio.onended;
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio.pause();
    finish?.();
  }

  async function playWordAudio(word, wordIndex, requestedPlaybackToken = null) {
    const playbackToken = requestedPlaybackToken ?? wordSupportPlaybackTokenRef.current + 1;
    if (requestedPlaybackToken === null) {
      wordSupportPlaybackTokenRef.current = playbackToken;
      stopWordSupportAudio();
    }
    setLoadingWordAudioIndex(wordIndex);
    const resolvedAudioPath = await findExistingGuidedReadingWordAudio(word);
    if (playbackToken !== wordSupportPlaybackTokenRef.current) {
      return resolvedAudioPath;
    }
    if (!resolvedAudioPath) {
      if (import.meta.env.DEV) {
        console.warn("Missing Guided Reading word audio:", {
          word: word?.text || "",
          bookId: selectedBook?.id || "",
          pageNumber: page?.pageNumber || pageIndex + 1
        });
      }
      setAudioNotice("Word audio is not ready for this word yet.");
      brieflyHighlightWord(wordIndex);
      setLoadingWordAudioIndex(null);
      return "";
    }

    setAudioNotice("");
    brieflyHighlightWord(wordIndex);
    try {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopWordSupportAudio();
      const audio = new Audio(resolvedAudioPath);
      wordSupportAudioRef.current = audio;
      audio.playbackRate = GUIDED_READING_WORD_RATE;
      audio.volume = applyLearnerAudioIntensity(1);
      audio.onended = () => {
        if (wordSupportAudioRef.current === audio) wordSupportAudioRef.current = null;
      };
      await audio.play();
      setLoadingWordAudioIndex(null);
      return resolvedAudioPath;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Guided Reading word audio failed to play:", {
          word: word?.text || "",
          audioPath: resolvedAudioPath,
          bookId: selectedBook?.id || "",
          pageNumber: page?.pageNumber || pageIndex + 1,
          error
        });
      }
      setAudioNotice("Word audio is not ready for this word yet.");
      setLoadingWordAudioIndex(null);
      return "";
    }
  }

  async function playRecordedSupportSequence(audioPaths = [], playbackToken) {
    if (!audioPaths.length) return;
    stopWordSupportAudio();

    for (const audioPath of audioPaths) {
      if (playbackToken !== wordSupportPlaybackTokenRef.current) return;
      await new Promise(resolve => {
        const audio = new Audio(audioPath);
        wordSupportAudioRef.current = audio;
        audio.playbackRate = 0.88;
        audio.volume = applyLearnerAudioIntensity(1);
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(resolve);
      });
    }
    if (playbackToken === wordSupportPlaybackTokenRef.current) {
      wordSupportAudioRef.current = null;
    }
  }

  function sentenceIndexForWord(wordIndex) {
    return sentenceTokenGroups.find(group =>
      group.tokens.some(token => token.type === "word" && token.wordIndex === wordIndex)
    )?.sentenceIndex ?? null;
  }

  function saveDecodingSupportUse(step, wordIndex, audioAvailable) {
    const previous = getWorkingRecord();
    const previousPageRecord = previous.pages?.[pageIndex] || currentPageRecord;
    decodingSupportEventCounterRef.current += 1;
    const event = createDecodingSupportEvent({
      eventId: `${selectedBook.id}:${pageIndex + 1}:${wordIndex}:${Date.now()}:${decodingSupportEventCounterRef.current}`,
      stage: step.stage,
      word: step.word,
      wordIndex,
      pageNumber: page?.pageNumber || pageIndex + 1,
      occurredAt: step.occurredAt,
      segments: step.segments,
      audioAvailable
    });
    updatePageRecord({
      supportUseEvents: appendDecodingSupportEvent(previousPageRecord.supportUseEvents, event)
    });
  }

  async function requestDecodingSupport(word, wordIndex) {
    const playbackToken = wordSupportPlaybackTokenRef.current + 1;
    wordSupportPlaybackTokenRef.current = playbackToken;
    stopWordSupportAudio();
    const supportKey = `${selectedBook.id}:${pageIndex}:${wordIndex}`;
    const step = {
      ...getNextDecodingSupportStep({
        previousStage: decodingSupportStageRef.current.get(supportKey) || "",
        word: word.text
      }),
      occurredAt: new Date().toISOString()
    };
    decodingSupportStageRef.current.set(supportKey, step.stage);
    setActiveDecodingSupport({ ...step, wordIndex });
    setAudioNotice("");

    if (step.stage !== DECODING_SUPPORT_STAGES.REREAD_PROMPT) {
      setHighlightedSentenceIndex(null);
    }

    if (step.stage === DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO) {
      const audioPath = await playWordAudio(word, wordIndex, playbackToken);
      saveDecodingSupportUse(step, wordIndex, Boolean(audioPath));
      return;
    }

    if (step.stage === DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES) {
      brieflyHighlightWord(wordIndex);
      saveDecodingSupportUse(step, wordIndex, step.hasCompletePhonemeAudio);
      if (step.hasCompletePhonemeAudio) {
        await playRecordedSupportSequence(step.phonemeAudioPaths, playbackToken);
      } else {
        setAudioNotice("Use the sound parts shown below. Recorded sound audio is not ready for every part yet.");
      }
      return;
    }

    setHighlightedSentenceIndex(sentenceIndexForWord(wordIndex));
    saveDecodingSupportUse(step, wordIndex, false);
  }

  function handleWordClick(displayedWord, wordIndex, event) {
    const word = displayedWord ? { text: displayedWord } : null;
    if (!word) return;

    if (lineFocusEnabled) {
      setFocusedSentenceIndex(sentenceIndexForWord(wordIndex) ?? 0);
    }

    if (!isStudentMode && readingMode === "marking" && !event.altKey) {
      cycleWordMark(wordIndex);
      return;
    }

    requestDecodingSupport(word, wordIndex);
  }

  const recordSummaries = summarizeGuidedReadingRecords(guidedReadingRecords);
  const completedLibraryBooks = getRuntimeGuidedReadingBooks()
    .filter(book => getGuidedReadingProgress(book, guidedReadingRecords[book.id]).completed)
    .slice(0, 8);

  if (!selectedBook) {
    return (
      <div
        aria-label={guidedReadingSurfaceLabel}
        className={`teacher-product-page guided-reading-page ${guidedReadingModeClass}`}
        role="main"
      >
        <section className="teacher-page-header guided-reading-hero">
          <div>
            <p className="panel-label">{isStudentMode ? "Reading library" : "Guided reading"}</p>
            <h2>{isClassMode ? "Whole-class reading library" : `${studentName || "Reader"}'s reading library`}</h2>
            <p>{isStudentMode
              ? "New books are on the way. Check back soon!"
              : "Guided reading books are paused while their page images and text are checked."}</p>
          </div>
          {!isStudentMode && <span className="guided-reading-mode-pill">Teacher tools</span>}
        </section>

        <section className="guided-reader-empty">
          {isStudentMode ? (
            <>
              <h3>Your books are getting ready!</h3>
              <p>New reading books are on the way. Check back soon.</p>
            </>
          ) : (
            <>
              <h3>{TEACHER_COPY.guidedReading.unavailableTitle}</h3>
              <p>{TEACHER_COPY.guidedReading.unavailableBody}</p>
            </>
          )}
        </section>

        {canRecord && recordSummaries.length > 0 && (
          <section className="teacher-action-panel">
            <h3>Saved guided reading summaries</h3>
            <div className="guided-record-list">
              {recordSummaries.map(item => (
                <article key={item.bookId}>
                  <strong>{item.title}</strong>
                  <span>{progressPhrase(item.correct, item.attempted)} correct · {item.accuracy}% accuracy</span>
                  <span>{item.supportWords.length ? `Support: ${item.supportWords.join(", ")}` : "No support words marked"}</span>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div
      aria-label={guidedReadingSurfaceLabel}
      className={guidedReadingPageClassName}
      data-child-surface={isStudentMode ? "reading-library" : undefined}
      data-auto-narration={isStudentMode && autoNarration ? "true" : "false"}
      role="main"
    >
      {showQuiz && selectedBook && (
        <BookQuiz key={selectedBook.id} book={selectedBook} onFinish={handleQuizFinish} />
      )}

      {levelUp && (
        <div className="guided-levelup" role="dialog" aria-label="Level complete">
          <ConfettiCelebration show />
          <div className="guided-levelup-card">
            <img src="/images/learn-games/phinny-cheering.webp" alt="" />
            <h2>Level {levelUp.level} complete!</h2>
            <p>You read all {levelUp.count} books. A new shelf is waiting for you.</p>
            <button
              className="main-button"
              type="button"
              onClick={() => {
                setLevelUp(null);
                setShowSummary(true);
              }}
            >
              Amazing!
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => printCertificate({
                studentName: studentName || "Reader",
                achievement: `Finished every Level ${levelUp.level} book`,
                detail: `${levelUp.count} books read from start to finish`
              })}
            >
              Print certificate
            </button>
          </div>
        </div>
      )}

      {!isStudentMode && (
      <section className="teacher-page-header guided-reading-hero">
        <div>
          <p className="panel-label">Guided reading</p>
          <h2>{isClassMode ? "Whole-class reading library" : `${studentName || "Child"}'s reading library`}</h2>
          <p>{isClassMode
            ? "Choose a book to read with the whole class: listen, read and reread together. Notes and reading records belong to a single student, so open a student's own reader for those."
            : "Choose a guided reading book to listen, read, reread, and capture teacher notes."}</p>
        </div>
        <span className="guided-reading-mode-pill">Teacher tools</span>
      </section>
      )}

      {!readerOpen && (selectedLibraryType || selectedLibraryLevel || selectedLibrarySeries) && (
      <section className="guided-library-breadcrumb" aria-label="Guided reading library path">
        {selectedLibraryType && (
          <>
            <button
              className={!selectedLibraryLevel && !selectedLibrarySeries ? "active" : ""}
              onClick={() => {
                setSelectedLibraryType("");
                setSelectedLibraryLevel("");
                setSelectedLibrarySeries("");
                setLibraryPage(0);
              }}
              type="button"
            >
              {formatGuidedReadingType(selectedLibraryType)}
            </button>
          </>
        )}
        {selectedLibrarySeries && (
          <>
            <span>/</span>
            <strong>{getGuidedReadingSeries(selectedLibraryType).find(item => item.id === selectedLibrarySeries)?.title}</strong>
          </>
        )}
        {selectedLibraryLevel && (
          <>
            <span>/</span>
          <strong>Level {selectedLibraryLevel}</strong>
          </>
        )}
      </section>
      )}

      {!readerOpen && !isStudentMode && completedLibraryBooks.length > 0 && (
        <section className="guided-completed-strip" aria-label="Books already read">
          <span>Already read</span>
          <div>
            {completedLibraryBooks.map(book => (
              <button key={book.id} onClick={() => changeBook(book.id)} type="button" title={`${book.title} · Level ${book.level}`}>
                <GuidedBookCover book={book} />
              </button>
            ))}
          </div>
        </section>
      )}

      {!readerOpen && (
      <section className="guided-reading-library" aria-label="Guided reading library">
        {!isStudentMode && (
          <div className="guided-library-logo"><img src="/images/comic/reading-library-logo.webp" alt="Reading Library" /></div>
        )}
        {/* NOT THE CHILD'S FRONT DOOR ANY MORE (phase D, 2026-07-29).
            src/components/StudentBooksPage.jsx is the shelf a child lands on;
            this page is entered with a book already chosen, so `readerOpen` is
            true and the block below does not render for them. It is kept as the
            fallback for a mount with no book (a retired id, a preview harness),
            which is why its reading-goal panel — a third numeric system the
            redesign removed — is not reachable from the child area. */}
        {isStudentMode && (() => {
          const booksRead = countBooksRead(guidedReadingRecords);
          const prog = book => getGuidedReadingProgress(book, guidedReadingRecords[book.id]);
          const selectedSeries = getGuidedReadingSeries(selectedLibraryType)
            .find(item => item.id === selectedLibrarySeries);
          const orderedBooks = [...(selectedSeries?.books || [])].sort((a, b) => {
            const aProgress = prog(a);
            const bProgress = prog(b);
            const rank = progress => progress.completed ? 2 : progress.completedPages > 0 ? 0 : 1;
            return rank(aProgress) - rank(bProgress);
          });
          const pageSize = 8;
          const pageCount = Math.max(1, Math.ceil(orderedBooks.length / pageSize));
          const safePage = Math.min(libraryPage, pageCount - 1);
          const visibleBooks = orderedBooks.slice(safePage * pageSize, (safePage + 1) * pageSize);
          const seriesGroups = selectedLibraryType ? getGuidedReadingSeries(selectedLibraryType) : [];
          const openType = type => {
            setSelectedLibraryType(type);
            setSelectedLibrarySeries("");
            setLibraryPage(0);
          };
          return (
            <>
              <div className="guided-library-header">
                <div className="guided-child-library-heading">
                  <h1 className="guided-library-logo" data-child-title="">
                    <span className="child-surface-title-text">Reading library</span>
                    <img src="/images/comic/reading-library-logo.webp" alt="" />
                  </h1>
                  <p data-child-instruction="">
                    {!selectedLibraryType
                      ? "Choose fiction or non-fiction."
                      : !selectedLibrarySeries
                        ? "Choose a series."
                        : "Choose a book."}
                  </p>
                </div>
                <div className="guided-library-progress" data-child-progress="">
                  <strong>{booksRead}</strong><span>books read</span>
                </div>
              </div>

              {!selectedLibraryType && (
                <div className="guided-child-category-grid" data-child-choices="">
                  {typeCards.map((card, index) => (
                    <button
                      key={card.type}
                      type="button"
                      className={`guided-child-category ${card.type}`}
                      onClick={() => openType(card.type)}
                      data-child-primary={index === 0 ? "" : undefined}
                      data-child-emphasis={index === 0 ? "primary" : "choice"}
                    >
                      <span>{card.type === "fiction" ? "Story books" : "True books"}</span>
                      <strong>{card.label}</strong>
                      <em>{card.count} books · {getGuidedReadingSeries(card.type).length} groups</em>
                    </button>
                  ))}
                </div>
              )}

              {selectedLibraryType && !selectedLibrarySeries && (
                <div className="guided-series-grid" data-child-choices="">
                  {seriesGroups.map((series, index) => {
                    const completed = series.books.filter(book => prog(book).completed).length;
                    return (
                      <button
                        key={series.id}
                        type="button"
                        onClick={() => {
                          setSelectedLibrarySeries(series.id);
                          setLibraryPage(0);
                        }}
                        data-child-primary={index === 0 ? "" : undefined}
                        data-child-emphasis={index === 0 ? "primary" : "choice"}
                      >
                        <span className="guided-series-cover"><GuidedBookCover book={series.books[0]} /></span>
                        <span>
                          <strong>{series.title}</strong>
                          <em>{series.books.length} books</em>
                          <small>{completed}/{series.books.length} read</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSeries && (
                <>
                  <div className="guided-child-book-grid" data-child-choices="">
                    {visibleBooks.map((book, index) => {
                      const progress = prog(book);
                      return (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => changeBook(book.id)}
                          data-child-primary={index === 0 ? "" : undefined}
                          data-child-emphasis={index === 0 ? "primary" : "choice"}
                        >
                          {progress.completed && <span className="guided-child-read-tick" aria-label="Already read">✓</span>}
                          <span className="guided-shelf-card-cover"><GuidedBookCover book={book} /></span>
                          <strong>{book.title}</strong>
                          <small>Level {book.level}{progress.completedPages > 0 && !progress.completed ? ` · ${progress.completedPages}/${book.pages.length} pages` : ""}</small>
                        </button>
                      );
                    })}
                  </div>
                  {pageCount > 1 && (
                    <nav className="guided-library-pages" aria-label={`${selectedSeries.title} pages`}>
                      <button type="button" disabled={safePage === 0} onClick={() => setLibraryPage(page => Math.max(0, page - 1))}>← Previous</button>
                      <span>{safePage + 1} of {pageCount}</span>
                      <button type="button" disabled={safePage === pageCount - 1} onClick={() => setLibraryPage(page => Math.min(pageCount - 1, page + 1))}>Next →</button>
                    </nav>
                  )}
                </>
              )}
            </>
          );
        })()}
        {!isStudentMode && (<>
        {!selectedLibraryType && (
          <div className="guided-category-grid">
            {typeCards.map(card => (
              <button
                className="guided-category-card"
                key={card.type}
                onClick={() => {
                  setSelectedLibraryType(card.type);
                  setSelectedLibraryLevel("");
                }}
                type="button"
              >
                <span className={`guided-category-icon ${card.type}`}>
                  {card.type === "nonfiction" ? "NF" : "F"}
                </span>
                <strong>{card.label}</strong>
                <small>{card.count} books · Levels {card.levels.join(", ")}</small>
              </button>
            ))}
          </div>
        )}

        {selectedLibraryType && !selectedLibraryLevel && (
          <div className="guided-level-grid">
            {availableLevels.map(level => {
              const books = getGuidedReadingLevelBooks(selectedLibraryType, level);
              const completedCount = books.filter(book =>
                getGuidedReadingProgress(book, guidedReadingRecords[book.id]).completed
              ).length;

              return (
                <button
                  className="guided-level-card"
                  key={level}
                  onClick={() => setSelectedLibraryLevel(level)}
                  type="button"
                >
                  <strong>Level {level}</strong>
                  <span>{books.length} books</span>
                  <small>{completedCount}/{books.length} completed</small>
                </button>
              );
            })}
          </div>
        )}

        {selectedLibraryType && selectedLibraryLevel && (
          <div className="guided-book-grid">
            {visibleLibraryBooks.map(book => {
              const progress = getGuidedReadingProgress(book, guidedReadingRecords[book.id]);
              const hasStarted = Boolean(progress.lastReadAt || progress.completedPages > 0);
              const actionLabel = progress.completed
                ? "Read Again"
                : hasStarted
                  ? "Continue"
                  : isStudentMode
                    ? "Start Book"
                    : "Open Book";

              return (
                <article
                  className={book.id === selectedBook.id ? "guided-book-card active" : "guided-book-card"}
                  key={book.id}
                >
                  {progress.completed && <span className="guided-complete-badge" aria-label="Completed">✓</span>}
                  <div className="guided-book-cover-wrap">
                    <GuidedBookCover book={book} />
                  </div>
                  <div className="guided-book-info">
                    <h3 className="guided-book-title">{book.title}</h3>
                    <p className="guided-book-meta">{book.seriesTitle ? `${book.seriesTitle} · ` : ""}{formatGuidedReadingType(book.type)} · Level {book.level} · {book.pages.length} pages</p>
                    <p className="guided-book-progress">
                      {progress.completed ? "Completed" : hasStarted ? `${progress.completedPages}/${book.pages.length} pages read` : "Not started"}
                    </p>
                    <button
                      className="guided-book-action"
                      onClick={() => changeBook(book.id)}
                      type="button"
                    >
                      {actionLabel}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </>)}
      </section>
      )}

      {!readerOpen && !isStudentMode && recommendedBooks.length > 0 && (
        <section className="guided-recommendation-panel" aria-label="Guided reading recommendations">
          <div>
            <p className="panel-label">{TEACHER_COPY.guidedReading.suggestionLabel}</p>
            <h3>{TEACHER_COPY.guidedReading.suggestionTitle}</h3>
            <p>{recommendationDescription}</p>
          </div>
          <div className="guided-recommendation-list">
            {recommendedBooks.map(item => {
              const matchedFocusLabels = item.matchedNeeds
                .map(TEACHER_COPY.guidedReading.needLabel)
                .filter(Boolean);
              const shortReason = matchedFocusLabels.length
                ? TEACHER_COPY.guidedReading.matchedFocusReason(matchedFocusLabels)
                : TEACHER_COPY.guidedReading.levelReason(item.readingLevel, item.readingLevelSource);
              return (
                <article key={item.book.id} data-teacher-recommendation="guided-reading">
                  <button onClick={() => changeBook(item.book.id)} type="button">
                    <strong>{item.book.title}</strong>
                    <span>
                      Level {item.book.level} · {formatGuidedReadingType(item.book.type)}
                    </span>
                    <small>{shortReason} {item.reasons[0]}</small>
                  </button>
                  <TeacherRecommendationExplanation
                    surface="guided-reading"
                    explanation={{
                      evidence: [
                        TEACHER_COPY.guidedReading.matchedFocusReason(matchedFocusLabels),
                        ...item.reasons
                      ].join(" "),
                      dependency: TEACHER_COPY.guidedReading.levelReason(
                        item.readingLevel,
                        item.readingLevelSource
                      ),
                      confidence: recommendationEvidenceReady
                        ? TEACHER_COPY.guidedReading.confidenceWithResults
                        : TEACHER_COPY.guidedReading.confidenceWithoutResults,
                      unlock: TEACHER_COPY.guidedReading.nextStep
                    }}
                  />
                </article>
              );
            })}
          </div>
        </section>
      )}

      {readerOpen && !showSummary ? (
        <section
          className={[
            "guided-reader-shell",
            teacherNotesOpen ? "notes-open" : "",
            isReaderFullscreen ? "fullscreen" : ""
          ].filter(Boolean).join(" ")}
          ref={guidedReaderShellRef}
          aria-label={`${selectedBook.title} full-screen reader`}
        >
          <div className="guided-reader-card">
            <div className="guided-reader-header">
              <div>
                <div className="guided-reader-title-row">
                  {!isStudentMode && <p className="panel-label">{formatGuidedReadingType(selectedBook.type)} · Level {selectedBook.level}</p>}
                  {!isStudentMode && (
                    <span className="guided-reading-mode-pill compact">Teacher conference</span>
                  )}
                  {isStudentMode && (
                    <span className="guided-child-level-badge">Level {selectedBook.level}</span>
                  )}
                </div>
                <h3>{selectedBook.title}</h3>
                {!isStudentMode && selectedBookFocusLabels.length > 0 && (
                  <p>{TEACHER_COPY.guidedReading.bookFocus(selectedBookFocusLabels)}</p>
                )}
              </div>
              <div className="guided-page-controls">
                {isStudentMode && autoNarration && (
                  <p className="guided-narration-status" role="status">
                    Narration is on — each page reads aloud.
                  </p>
                )}
                <div className="guided-read-aloud-controls" role="group" aria-label="Read aloud controls">
                  <button
                    className={[
                      "lp-button lp-button-primary guided-read-page-primary",
                      isPageAudioPlaying ? "active audio-feedback-playing" : "",
                      isReadAloudLoading && !isWholeBookReading ? "audio-feedback-loading" : ""
                    ].filter(Boolean).join(" ")}
                    data-control-priority="primary"
                    disabled={!currentPageAudioPath || isWholeBookReading || isReadAloudLoading}
                    onClick={togglePageAudio}
                    type="button"
                  >
                    {isReadAloudLoading && !isWholeBookReading && <span className="audio-loading-dot" aria-hidden="true" />}
                    {isReadAloudLoading && !isWholeBookReading
                      ? readerCopy.loadingPage
                      : isPageAudioPlaying
                        ? readerCopy.stopReading
                        : readerCopy.readPage}
                  </button>
                  <button
                    className={[
                      "lp-button lp-button-secondary",
                      isWholeBookReading ? "active audio-feedback-playing" : "",
                      isReadAloudLoading && isWholeBookReading ? "audio-feedback-loading" : ""
                    ].filter(Boolean).join(" ")}
                    disabled={!canReadWholeBook || (isReadAloudLoading && !isWholeBookReading)}
                    onClick={isWholeBookReading ? stopPageAudio : startWholeBookReadAloud}
                    type="button"
                  >
                    {isReadAloudLoading && isWholeBookReading && <span className="audio-loading-dot" aria-hidden="true" />}
                    {isReadAloudLoading && isWholeBookReading
                      ? readerCopy.loadingBook
                      : isWholeBookReading
                        ? readerCopy.stopBook
                        : readerCopy.readWholeBook}
                  </button>
                  {!isReaderFullscreen && (isPageAudioPlaying || isWholeBookReading) && (
                    <button className="lp-button lp-button-secondary" onClick={toggleReadAloudPause} type="button">
                      {isReadAloudPaused ? "Resume" : "Pause"}
                    </button>
                  )}
                </div>
                {!isReaderFullscreen && (
                  <p className="guided-page-status" role="status" aria-live="polite" aria-label="Reading progress">
                    Page {pageIndex + 1} of {selectedBook.pages.length}
                  </p>
                )}
                {!isReaderFullscreen && !isStudentMode && (
                  <label className="guided-auto-advance-toggle">
                    <input
                      checked={autoAdvanceReadAloud}
                      onChange={event => setAutoAdvanceReadAloud(event.target.checked)}
                      type="checkbox"
                    />
                    Auto-advance
                  </label>
                )}
                {isReaderFullscreen && (
                  <div className="guided-page-pagination" role="group" aria-label="Page navigation">
                    <button
                      className="lp-button lp-button-secondary"
                      disabled={pageIndex === 0}
                      onClick={goToPreviousPage}
                      type="button"
                    >
                      Previous
                    </button>
                    <button
                      className="lp-button lp-button-primary"
                      disabled={pageIndex >= selectedBook.pages.length - 1}
                      onClick={goToNextPage}
                      type="button"
                    >
                      Next
                    </button>
                  </div>
                )}
                <div className="guided-reader-secondary-controls" role="group" aria-label="Reader view controls">
                  {canRecord && !isReaderFullscreen && (
                    <button className="lp-button lp-button-secondary" onClick={() => setTeacherNotesOpen(value => !value)} type="button">
                      {TEACHER_COPY.guidedReading.controls.teacherNotes}
                    </button>
                  )}
                  <button
                    aria-pressed={lineFocusEnabled}
                    className={`lp-button lp-button-secondary ${lineFocusEnabled ? "active" : ""}`}
                    onClick={() => {
                      setLineFocusEnabled(value => !value);
                      setFocusedSentenceIndex(0);
                    }}
                    type="button"
                  >
                    {readerCopy.lineFocus}
                  </button>
                  <button className="lp-button lp-button-secondary" onClick={toggleReaderFullscreen} type="button">
                    {isReaderFullscreen ? readerCopy.exitFullScreen : readerCopy.fullScreen}
                  </button>
                  {!isReaderFullscreen && (
                    <button className="lp-button lp-button-secondary" onClick={closeReader} type="button">
                      {isStudentMode ? readerCopy.backToLibrary : readerCopy.closeReader}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isReaderFullscreen && (
              <p className="guided-fullscreen-info guided-page-status" role="status" aria-live="polite" aria-label="Reading progress">
                Page {pageIndex + 1} of {selectedBook.pages.length}
              </p>
            )}

            {!isReaderFullscreen && <div className={isStudentMode ? "guided-reader-modebar student" : "guided-reader-modebar"} aria-label="Guided reading mode">
              {isStudentMode ? (
                <div className="guided-student-mode-note">
                  <strong>Reading</strong>
                  <span>Tap words to hear them.</span>
                </div>
              ) : canRecord ? (
                <div className="guided-mode-toggle" role="group" aria-label="Reader mode">
                  <button
                    className={readingMode === "reading" ? "active" : ""}
                    onClick={() => setReadingMode("reading")}
                    type="button"
                  >
                    {readerCopy.readingMode}
                  </button>
                  <button
                    className={readingMode === "marking" ? "active" : ""}
                    onClick={() => setReadingMode("marking")}
                    type="button"
                  >
                    {readerCopy.markingMode}
                  </button>
                </div>
              ) : null}
              {!isStudentMode && (
                <p>
                  {isClassMode
                    ? "Tap a word for help: hear the word, use its sounds, then reread the sentence. Nothing is saved against a student on a whole-class read."
                    : readingMode === "reading"
                      ? "Tap a word for help: hear the word, use its sounds, then reread the sentence."
                      : "Tap words to cycle neutral, read correctly, and needs support. Alt-click a word to hear it."}
                </p>
              )}
            </div>}

            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="guided-page-layout"
                data-page-number={pageIndex + 1}
                data-reading-level={readingMeasure.level}
                data-reading-template={readingMeasure.templateId}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -18 }}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 18 }}
                key={`${selectedBook.id}-${pageIndex}`}
                onTouchEnd={handlePageTouchEnd}
                onTouchStart={handlePageTouchStart}
                style={{
                  "--guided-image-track": `${readingMeasure.imageFraction}fr`,
                  "--guided-text-track": `${readingMeasure.textFraction}fr`,
                  "--guided-max-line-measure": `${readingMeasure.maxLineMeasureCh}ch`,
                  "--guided-stacked-image-height": `${readingMeasure.stackedImageViewportHeight}dvh`
                }}
                transition={{ duration: prefersReducedMotion ? 0.01 : 0.18, ease: "easeOut" }}
              >
                <div className="guided-page-image-card">
                  <GuidedReadingImage
                    alt=""
                    className="guided-page-image"
                    fetchPriority="high"
                    loading="eager"
                    onLoad={() => setReaderLayoutVersion(version => version + 1)}
                    src={page.image}
                  />
                </div>

                <div className="guided-page-reading">
                  <AutoFitReadingText
                    aria-label="Page text"
                    className={`guided-page-text ${readingMode} ${lineFocusEnabled ? "line-focus-enabled" : ""}`}
                    layoutVersion={readerLayoutVersion}
                    lineHeight={readingMeasure.lineHeight}
                    maxFontSize={readingMeasure.maxFontSizePx}
                    minFontSize={readingMeasure.minFontSizePx}
                    text={`${selectedBook.id}-${pageIndex}-${page.text || ""}-${readingMode}-${readingMeasure.templateId}-${isReaderFullscreen ? "fullscreen" : "windowed"}`}
                  >
                    {sentenceTokenGroups.map(group => (
                      <span
                        className={[
                          "guided-sentence",
                          highlightedSentenceIndex === group.sentenceIndex ? "active" : "",
                          lineFocusEnabled && focusedSentenceIndex === group.sentenceIndex ? "line-focused" : ""
                        ].filter(Boolean).join(" ")}
                        key={`sentence-${group.sentenceIndex}`}
                      >
                        {group.tokens.map(item => {
                          if (item.type === "text") {
                            return <span aria-hidden="true" key={`text-${group.sentenceIndex}-${item.index}`}>{item.token}</span>;
                          }

                          const mark = currentPageRecord.wordMarks?.[item.wordIndex] || "";
                          const isHighlighted = highlightedWordIndex === item.wordIndex;
                          const isWordAudioLoading = loadingWordAudioIndex === item.wordIndex;

                          return (
                            <button
                              aria-label={isWordAudioLoading ? `Loading support for ${item.token}` : `${readingMode === "marking" ? "Mark" : "Get reading help for"} ${item.token}`}
                              className={`guided-word ${readingMode} ${mark || "neutral"} ${isHighlighted ? "heard audio-feedback-playing" : ""} ${isWordAudioLoading ? "audio-feedback-loading" : ""}`}
                              key={`word-${group.sentenceIndex}-${item.index}-${item.wordIndex}`}
                              onClick={event => handleWordClick(item.token, item.wordIndex, event)}
                              onContextMenu={event => {
                                event.preventDefault();
                                playWordAudio({ text: item.token }, item.wordIndex);
                              }}
                              title={readingMode === "marking" ? "Mark word. Alt-click for the reading-help ladder or right-click to hear the whole word." : "Tap again for the next reading-help step."}
                              type="button"
                            >
                              {item.token}
                            </button>
                          );
                        })}
                        {" "}
                      </span>
                    ))}
                  </AutoFitReadingText>

                  {activeDecodingSupport && (
                    <div
                      aria-live="polite"
                      className={`guided-decoding-support stage-${activeDecodingSupport.stage}`}
                      role="status"
                    >
                      <div>
                        <span>Reading help {activeDecodingSupport.stageNumber} of {activeDecodingSupport.totalStages}</span>
                        <strong>{activeDecodingSupport.stageLabel}</strong>
                      </div>
                      <p>{activeDecodingSupport.message}</p>
                      {activeDecodingSupport.stage === DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES && (
                        <div aria-label={`Sound parts for ${activeDecodingSupport.word}`} className="guided-decoding-segments">
                          {activeDecodingSupport.displaySegments.map((segment, index) => (
                            <span key={`${segment}-${index}`}>{segment}</span>
                          ))}
                        </div>
                      )}
                      <small>Use the letters and sounds. Do not guess from the picture.</small>
                    </div>
                  )}
                  {audioNotice && <p className="guided-audio-notice">{audioNotice}</p>}
                  {!audioNotice && !readAloudState.readAloudAvailable && (
                    <p className="guided-audio-notice">{readAloudState.message}</p>
                  )}
                  {pageIndex === selectedBook.pages.length - 1 && readingProgress?.completed && (
                    <p className="guided-complete-message">Book completed. You can finish again to record a reread.</p>
                  )}

                  {canRecord && !isReaderFullscreen && readingMode === "marking" && (
                    <div className="guided-mark-legend" aria-label="Word marking legend">
                      <span><b className="legend-dot correct"></b> Read correctly</span>
                      <span><b className="legend-dot support"></b> Needs support</span>
                      <span><b className="legend-dot neutral"></b> Unmarked</span>
                    </div>
                  )}

                  {canRecord && !isReaderFullscreen && <details className="guided-note-drawer">
                    <summary>Page notes</summary>
                    <label className="guided-note-field">
                      <strong>Page note</strong>
                      <textarea
                        value={currentPageRecord.note || ""}
                        onChange={event => updatePageNote(event.target.value)}
                        placeholder="Add miscues, strategy use, fluency notes, or comprehension observations."
                      />
                    </label>
                  </details>}

                  {!isStudentMode && !isReaderFullscreen && <details className="guided-note-drawer">
                    <summary>Comprehension prompts</summary>
                    <div className="guided-comprehension-prompts">
                      {(enrichedSelectedBook?.comprehensionQuestionSeeds || []).map(prompt => (
                        <span key={prompt} className="guided-comprehension-chip">
                          {prompt}
                        </span>
                      ))}
                    </div>
                  </details>}
                </div>
              </motion.div>
            </AnimatePresence>

            {!isReaderFullscreen && <div className="guided-reader-actions">
              <button
                className="lp-button lp-button-secondary"
                disabled={pageIndex === 0}
                onClick={goToPreviousPage}
                type="button"
              >
                {readerCopy.previousPage}
              </button>
              {pageIndex < selectedBook.pages.length - 1 ? (
                <button
                  className="lp-button lp-button-primary"
                  onClick={goToNextPage}
                  type="button"
                >
                  {readerCopy.nextPage}
                </button>
              ) : (
                <button className="lp-button lp-button-primary" onClick={completeBook} type="button">
                  {readerCopy.finishBook}
                </button>
              )}
            </div>}
          </div>

          {canRecord && !isReaderFullscreen && <aside className={teacherNotesOpen ? "guided-notes-panel open" : "guided-notes-panel"} aria-hidden={!teacherNotesOpen}>
            <div className="guided-notes-header">
                <h3>Teacher notes</h3>
              <button className="lp-button lp-button-secondary" onClick={() => setTeacherNotesOpen(false)} type="button">
                Hide
              </button>
            </div>
            <textarea
              value={record.wholeBookNote || ""}
              onChange={event => updateWholeBookNote(event.target.value)}
              placeholder="Overall reading behavior, confidence, prompt level, next teaching point."
            />
            <div className="guided-mini-summary">
              <span>Attempted: {summary.attempted}</span>
              <span>Correct: {summary.correct}</span>
              <span>Support: {summary.support}</span>
              <span>Accuracy: {summary.accuracy}%</span>
            </div>
          </aside>}
        </section>
      ) : showSummary ? (
        <section className="guided-reading-summary">
          <div>
            <p className="panel-label">Book complete</p>
            <h3>{selectedBook.title}</h3>
            <p>{readingProgress?.lastReadAt
              ? `Last read ${new Date(readingProgress.lastReadAt).toLocaleString()}`
              : TEACHER_COPY.guidedReading.summarySaved}</p>
          </div>

          <div className="checkpoint-result-grid">
            <div>
              <span>Read count</span>
              <strong>{readingProgress?.readCount || 1}</strong>
            </div>
            <div>
              <span>Pages completed</span>
              <strong>{progressPhrase(readingProgress?.completedPages || selectedBook.pages.length, selectedBook.pages.length)}</strong>
            </div>
            <div>
              <span>Total words attempted</span>
              <strong>{summary.attempted}</strong>
            </div>
            <div>
              <span>Read correctly</span>
              <strong>{summary.correct}</strong>
            </div>
            <div>
              <span>Accuracy</span>
              <strong>{summary.accuracy}%</strong>
            </div>
          </div>

          {canRecord && (
            <div className="checkpoint-detail-grid">
              <section>
                <h3>Support words</h3>
                <p>{summary.supportWords.length ? summary.supportWords.join(", ") : "No support words marked."}</p>
              </section>
              <section>
                <h3>Teacher notes</h3>
                <p>{summary.wholeBookNote || "No whole-book note yet."}</p>
                {summary.pageNotes.map(item => (
                  <p key={item.page}><strong>Page {item.page}:</strong> {item.note}</p>
                ))}
              </section>
            </div>
          )}

          <div className="teacher-action-list">
            <button className="lp-button lp-button-primary" onClick={() => {
              setReaderOpen(true);
              setShowSummary(false);
            }} type="button">
              {isStudentMode ? CHILD_COPY.actions.readAgain : "Continue marking"}
            </button>
            <button className="lp-button lp-button-secondary" onClick={closeReader} type="button">
              {readerCopy.backToLibrary}
            </button>
          </div>
        </section>
      ) : (
        <section className="guided-reader-empty">
          <h3>{isStudentMode ? "Pick a book!" : "Select a book to open the reader."}</h3>
          <p>{isStudentMode
            ? "Tap any word to hear it."
            : "Books open in a focused reader with large images, page narration, normal reading text, and optional teacher marking tools."}</p>
        </section>
      )}

      {!isStudentMode && recordSummaries.length > 0 && (
        <section className="teacher-action-panel">
          <h3>Saved guided reading summaries</h3>
          <div className="guided-record-list">
            {recordSummaries.map(item => (
              <article key={item.bookId}>
                <strong>{item.title}</strong>
                <span>{progressPhrase(item.correct, item.attempted)} correct · {item.accuracy}% accuracy</span>
                <span>{item.supportWords.length ? `Support: ${item.supportWords.join(", ")}` : "No support words marked"}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
