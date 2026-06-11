import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { markMissionDone } from "../../utils/dailyMission.js";
import { BookQuiz } from "./BookQuiz.jsx";
import { ConfettiCelebration } from "../learn/games/shared/ConfettiCelebration.jsx";
import { playCelebrationFanfare } from "../../utils/audio/gameSfx.js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  formatGuidedReadingType,
  getGuidedReadingProgress,
  guidedReadingBooks,
  normalizeGuidedReadingType,
  summarizeGuidedReadingRecord,
  summarizeGuidedReadingRecords
} from "../../data/guidedReadingBooks";
import { analyzeGuidedReadingPage, enrichGuidedReadingBook } from "../../utils/guidedReading/phonicsPageAnalyzer.js";
import { recommendBooksForStudent } from "../../utils/guidedReading/recommendBooksForStudent.js";
import { applyGuidedReadingLevelOverride, readGuidedReadingLevelOverrides } from "../../utils/guidedReading/bookLevelOverrides.js";
import {
  isGuidedReadingAssetDeleted,
  isGuidedReadingBookDeleted
} from "../../data/deletedMediaManifest.js";
import {
  getGuidedReadingBookAudioPath,
  getGuidedReadingBookSyncPath,
  getGuidedReadingReadAloudState,
  getGuidedReadingPageAudioPath
} from "../../utils/guidedReading/readAloudPolicy.js";
import { preloadMediaSet } from "../../utils/preloadMedia.js";

const GUIDED_READING_MEDIA_VERSION = "20260603-continuity-1";

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
    if (/^[A-Za-z0-9'-]+$/.test(token)) {
      wordIndex += 1;
      return { token, index, type: "word", wordIndex };
    }

    return { token, index, type: "text", wordIndex: null };
  });
}

function speakWithBrowserVoice(text = "", onEnd) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) {
    onEnd?.();
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.86;
  utterance.pitch = 1;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
  return true;
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

function getRuntimeGuidedReadingBooks() {
  const levelOverrides = readGuidedReadingLevelOverrides();
  return guidedReadingBooks
    .filter(book => !isGuidedReadingBookDeleted(book.id))
    .map(book => applyGuidedReadingLevelOverride(book, levelOverrides))
    .map(book => ({
      ...book,
      pages: (book.pages || []).filter(page =>
        page.active !== false &&
        (!page.qaStatus || page.qaStatus === "approved") &&
        !isGuidedReadingAssetDeleted({
          bookId: book.id,
          path: page.image,
          pageNumber: page.pageNumber
        })
      )
    }))
    .filter(book => (book.pages || []).length > 0);
}

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

export function GuidedReadingPage({
  studentId,
  studentName,
  guidedReadingRecords = {},
  saveGuidedReadingRecord,
  speakText,
  mode = "teacher",
  launchBookId = "",
  onLaunchBookHandled = null
}) {
  const [selectedBookId, setSelectedBookId] = useState(() => getRuntimeGuidedReadingBooks()[0]?.id || "");
  const [selectedLibraryType, setSelectedLibraryType] = useState("");
  const [selectedLibraryLevel, setSelectedLibraryLevel] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [levelUp, setLevelUp] = useState(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readingMode, setReadingMode] = useState("reading");
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(null);
  const [highlightedSentenceIndex, setHighlightedSentenceIndex] = useState(null);
  const [audioNotice, setAudioNotice] = useState("");
  const [isPageAudioPlaying, setIsPageAudioPlaying] = useState(false);
  const [isWholeBookReading, setIsWholeBookReading] = useState(false);
  const [isReadAloudLoading, setIsReadAloudLoading] = useState(false);
  const [loadingWordAudioIndex, setLoadingWordAudioIndex] = useState(null);
  const [isReadAloudPaused, setIsReadAloudPaused] = useState(false);
  const [autoAdvanceReadAloud, setAutoAdvanceReadAloud] = useState(true);
  const [wholeBookSyncData, setWholeBookSyncData] = useState(null);
  const [teacherNotesOpen, setTeacherNotesOpen] = useState(false);
  const [isReaderFullscreen, setIsReaderFullscreen] = useState(false);
  const [readerLayoutVersion, setReaderLayoutVersion] = useState(0);
  const guidedReaderShellRef = useRef(null);
  const pageAudioRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const sentenceTimersRef = useRef([]);
  const lastVisitedPageRef = useRef("");
  const readAloudPageChangeRef = useRef(false);
  const autoAdvanceReadAloudRef = useRef(autoAdvanceReadAloud);
  const touchStartRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const runtimeGuidedReadingBooks = getRuntimeGuidedReadingBooks();
  const selectedBook = runtimeGuidedReadingBooks.find(book => book.id === selectedBookId) || runtimeGuidedReadingBooks[0];
  const page = selectedBook?.pages?.[pageIndex];
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
  const pageAnalysis = page ? analyzeGuidedReadingPage(page) : null;
  const readAloudState = selectedBook && page
    ? getGuidedReadingReadAloudState(selectedBook, page, "guided_support")
    : getGuidedReadingReadAloudState({}, {}, "guided_support");
  const currentPageAudioPath = readAloudState.pageAudioPath;
  const fullBookAudioPath = selectedBook ? getGuidedReadingBookAudioPath(selectedBook) : "";
  const allPagesHaveAudio = Boolean(selectedBook?.pages?.length) &&
    selectedBook.pages.every(item => Boolean(getGuidedReadingPageAudioPath(item)));
  const canReadWholeBook = Boolean(fullBookAudioPath || allPagesHaveAudio);
  const isStudentMode = mode === "student";

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
    setReaderOpen(true);
    setReadingMode("reading");
    onLaunchBookHandled?.();
  }, [launchBookId, onLaunchBookHandled, runtimeGuidedReadingBooks]);

  const recommendedBooks = recommendBooksForStudent({
    books: runtimeGuidedReadingBooks,
    studentProgress: {
      currentMicrophase: enrichedSelectedBook?.recommendedMicrophase,
      needs: enrichedSelectedBook?.recommendedSkillsToReinforce || []
    },
    readingHistory: guidedReadingRecords
  }).slice(0, 5);
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
    stopPageAudio();
  }, [selectedBookId, pageIndex]);

  useEffect(() => {
    if (!readerOpen || !selectedBook || !page) return;
    recordGuidedPageVisit(pageIndex);
  }, [readerOpen, selectedBookId, pageIndex]);

  useEffect(() => {
    autoAdvanceReadAloudRef.current = autoAdvanceReadAloud;
  }, [autoAdvanceReadAloud]);

  useEffect(() => {
    let cancelled = false;
    setWholeBookSyncData(null);
    if (!selectedBook || !fullBookAudioPath) return undefined;

    fetchWholeBookSyncData(selectedBook, fullBookAudioPath).then(syncData => {
      if (!cancelled) setWholeBookSyncData(syncData);
    });

    return () => {
      cancelled = true;
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
    if (!readerOpen || showSummary) return undefined;

    function handleKeyDown(event) {
      const tagName = event.target?.tagName?.toLowerCase();
      if (tagName === "textarea" || tagName === "input" || tagName === "select") return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousPage();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextPage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readerOpen, showSummary, pageIndex, selectedBook?.pages?.length]);

  function updateRecord(patch) {
    if (!selectedBook) return;
    saveGuidedReadingRecord(selectedBook.id, {
      ...record,
      studentId,
      bookId: selectedBook.id,
      title: selectedBook.title,
      type: selectedBook.type,
      level: selectedBook.level,
      updatedAt: new Date().toISOString(),
      ...patch
    });
  }

  function touchBookProgress(nextPageIndex = pageIndex, patch = {}) {
    if (!selectedBook) return;
    const now = new Date().toISOString();
    const totalPages = selectedBook.pages.length;
    const previous = guidedReadingRecords[selectedBook.id] || record || {};

    saveGuidedReadingRecord(selectedBook.id, {
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
    });
  }

  function recordGuidedPageVisit(nextPageIndex = pageIndex) {
    if (!selectedBook) return;
    const visitKey = `${selectedBook.id}:${nextPageIndex}`;
    if (lastVisitedPageRef.current === visitKey) {
      touchBookProgress(nextPageIndex);
      return;
    }
    lastVisitedPageRef.current = visitKey;
    const previous = guidedReadingRecords[selectedBook.id] || record || {};
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
    updateRecord({
      pages: {
        ...record.pages,
        [pageIndex]: {
          ...currentPageRecord,
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
    markMissionDone(studentId || studentName || "default", "book");
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
    setReaderOpen(true);
    setReadingMode("reading");
  }

  function closeReader() {
    stopPageAudio();
    if (typeof document !== "undefined" && document.fullscreenElement === guidedReaderShellRef.current) {
      document.exitFullscreen?.().catch(() => {});
    }
    setReaderOpen(false);
    setShowSummary(false);
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

  async function togglePageAudio() {
    if (pageAudioRef.current && isPageAudioPlaying) {
      stopPageAudio();
      return;
    }
    if (isPageAudioPlaying) {
      stopPageAudio();
      return;
    }

    stopPageAudio();
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

    if (!currentPageAudioPath) {
      setAudioNotice("Read-aloud audio is not available for this page yet.");
      return;
    }

    setIsReadAloudLoading(true);
    try {
      const audio = new Audio(currentPageAudioPath);
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
      selectedBook?.id ? `/guided-reading/audio/words/${selectedBook.id}-${guidedReadingWordSlug}.mp3` : "",
      word?.audioPath,
      `/audio/child-mode/clean-human/words/${guidedReadingWordSlug}.mp3`,
      `/audio/child-mode/clean-human/hfw/${guidedReadingWordSlug}.mp3`,
      `/audio/child-mode/words/${guidedReadingWordSlug}.mp3`,
      `/audio/child-mode/hfw/${guidedReadingWordSlug}.mp3`,
      `/guided-reading/audio/words/${guidedReadingWordSlug}.mp3`
    ].filter(Boolean).filter(audioPath =>
      String(audioPath).includes("/words/") || String(audioPath).includes("/hfw/")
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

  async function playWordAudio(word, wordIndex) {
    setLoadingWordAudioIndex(wordIndex);
    const resolvedAudioPath = await findExistingGuidedReadingWordAudio(word);
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
      return;
    }

    setAudioNotice("");
    brieflyHighlightWord(wordIndex);
    try {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      const audio = new Audio(resolvedAudioPath);
      await audio.play();
      setLoadingWordAudioIndex(null);
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
    }
  }

  function handleWordClick(wordIndex, event) {
    const word = (page.words || [])[wordIndex] || (pageAnalysis?.words?.[wordIndex] ? { text: pageAnalysis.words[wordIndex] } : null);
    if (!word) return;

    if (!isStudentMode && readingMode === "marking" && !event.altKey) {
      cycleWordMark(wordIndex);
      return;
    }

    playWordAudio(word, wordIndex);
  }

  const recordSummaries = summarizeGuidedReadingRecords(guidedReadingRecords);
  const completedLibraryBooks = getRuntimeGuidedReadingBooks()
    .filter(book => getGuidedReadingProgress(book, guidedReadingRecords[book.id]).completed)
    .slice(0, 8);

  if (!selectedBook) {
    return (
      <div className={`teacher-product-page guided-reading-page ${guidedReadingModeClass}`}>
        <section className="teacher-page-header guided-reading-hero">
          <div>
            <p className="panel-label">Guided Reading</p>
            <h2>{studentName || "Student"} Reading Library</h2>
            <p>Guided Reading books are temporarily paused while the page images and app text are regenerated to match correctly.</p>
          </div>
          <span className="guided-reading-mode-pill">{isStudentMode ? "Student reader" : "Teacher tools"}</span>
        </section>

        <section className="guided-reader-empty">
          <h3>No approved Guided Reading books are active right now.</h3>
          <p>
            The imported book pack was disabled because page illustrations include embedded text and story details that conflict with the app text.
            The QA report lists the exact books/pages Kimi needs to regenerate.
          </p>
        </section>

        {!isStudentMode && recordSummaries.length > 0 && (
          <section className="teacher-action-panel">
            <h3>Saved guided reading summaries</h3>
            <div className="guided-record-list">
              {recordSummaries.map(item => (
                <article key={item.bookId}>
                  <strong>{item.title}</strong>
                  <span>{item.correct}/{item.attempted} correct · {item.accuracy}%</span>
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
    <div className={guidedReadingPageClassName}>
      {showQuiz && selectedBook && (
        <BookQuiz book={selectedBook} onFinish={handleQuizFinish} />
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
          </div>
        </div>
      )}

      <section className="teacher-page-header guided-reading-hero">
        <div>
          <p className="panel-label">Guided Reading</p>
          <h2>{studentName || "Student"} Reading Library</h2>
          <p>{isStudentMode ? "Choose a book to listen, read, and reread." : "Choose a guided reading book to listen, read, reread, and capture teacher notes."}</p>
        </div>
        <span className="guided-reading-mode-pill">{isStudentMode ? "Student reader" : "Teacher tools"}</span>
      </section>

      {!readerOpen && (selectedLibraryType || selectedLibraryLevel) && (
      <section className="guided-library-breadcrumb" aria-label="Guided reading library path">
        {selectedLibraryType && (
          <>
            <button
              className={!selectedLibraryLevel ? "active" : ""}
              onClick={() => setSelectedLibraryLevel("")}
              type="button"
            >
              {formatGuidedReadingType(selectedLibraryType)}
            </button>
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

      {!readerOpen && completedLibraryBooks.length > 0 && (
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
      </section>
      )}

      {!readerOpen && recommendedBooks.length > 0 && (
        <section className="guided-recommendation-panel" aria-label="Guided reading recommendations">
          <div>
            <p className="panel-label">{isStudentMode ? "Up Next" : "Adaptive Recommendations"}</p>
            <h3>{isStudentMode ? "Try one of these books" : "Suggested next reads"}</h3>
            <p>{isStudentMode ? "Books matched to recent reading practice." : "Based on phonics patterns, decodable percentage, rereading history, and current review-safe book status."}</p>
          </div>
          <div className="guided-recommendation-list">
            {recommendedBooks.map(item => (
              <button key={item.book.id} onClick={() => changeBook(item.book.id)} type="button">
                <strong>{item.book.title}</strong>
                <span>Level {item.book.level} · {item.book.recommendedMicrophase || "early reading"}</span>
                <small>{item.reasons.slice(0, 2).join(" · ")}</small>
              </button>
            ))}
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
                  <p className="panel-label">{selectedBook.type} · Level {selectedBook.level}</p>
                  <span className="guided-reading-mode-pill compact">
                    {isStudentMode ? "Student reader" : "Teacher conference"}
                  </span>
                </div>
                <h3>{selectedBook.title}</h3>
                <p>{(selectedBook.targetSkills || selectedBook.recommendedSkillsToReinforce || []).join(" · ")}</p>
              </div>
              <div className="guided-page-controls">
                {isReaderFullscreen && (
                  <button
                    className="lp-button lp-button-secondary"
                    disabled={pageIndex === 0}
                    onClick={goToPreviousPage}
                    type="button"
                  >
                    Previous
                  </button>
                )}
                <button
                  className={[
                    "lp-button lp-button-secondary",
                    isPageAudioPlaying ? "active audio-feedback-playing" : "",
                    isReadAloudLoading && !isWholeBookReading ? "audio-feedback-loading" : ""
                  ].filter(Boolean).join(" ")}
                  disabled={!currentPageAudioPath || isWholeBookReading || isReadAloudLoading}
                  onClick={togglePageAudio}
                  type="button"
                >
                  {isReadAloudLoading && !isWholeBookReading && <span className="audio-loading-dot" aria-hidden="true" />}
                  {isReadAloudLoading && !isWholeBookReading ? "Loading Page" : isPageAudioPlaying ? "Stop Reading" : "Read Page"}
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
                  {isReadAloudLoading && isWholeBookReading ? "Loading Book" : isWholeBookReading ? "Stop Book" : "Read Whole Book"}
                </button>
                {!isReaderFullscreen && (isPageAudioPlaying || isWholeBookReading) && (
                  <button className="lp-button lp-button-secondary" onClick={toggleReadAloudPause} type="button">
                    {isReadAloudPaused ? "Resume" : "Pause"}
                  </button>
                )}
                {!isReaderFullscreen && <strong>Page {pageIndex + 1} of {selectedBook.pages.length}</strong>}
                {!isReaderFullscreen && (
                  <label className="guided-auto-advance-toggle">
                    <input
                      checked={autoAdvanceReadAloud}
                      onChange={event => setAutoAdvanceReadAloud(event.target.checked)}
                      type="checkbox"
                    />
                    Auto-advance
                  </label>
                )}
                {!isStudentMode && !isReaderFullscreen && (
                  <button className="lp-button lp-button-secondary" onClick={() => setTeacherNotesOpen(value => !value)} type="button">
                    Teacher Notes
                  </button>
                )}
                {isReaderFullscreen && (
                  <button
                    className="lp-button lp-button-primary"
                    disabled={pageIndex >= selectedBook.pages.length - 1}
                    onClick={goToNextPage}
                    type="button"
                  >
                    Next
                  </button>
                )}
                <button className="lp-button lp-button-secondary" onClick={toggleReaderFullscreen} type="button">
                  {isReaderFullscreen ? "Exit" : "Full Screen"}
                </button>
                {!isReaderFullscreen && (
                  <button className="lp-button lp-button-secondary" onClick={closeReader} type="button">
                    {isStudentMode ? "Back to Library" : "Close Reader"}
                  </button>
                )}
              </div>
            </div>

            {isReaderFullscreen && (
              <p className="guided-fullscreen-info">
                Page {pageIndex + 1} of {selectedBook.pages.length}
              </p>
            )}

            {!isReaderFullscreen && <div className={isStudentMode ? "guided-reader-modebar student" : "guided-reader-modebar"} aria-label="Guided Reading mode">
              {isStudentMode ? (
                <div className="guided-student-mode-note">
                  <strong>Reading mode</strong>
                  <span>Tap words to hear them.</span>
                </div>
              ) : (
                <div className="guided-mode-toggle" role="group" aria-label="Reader mode">
                  <button
                    className={readingMode === "reading" ? "active" : ""}
                    onClick={() => setReadingMode("reading")}
                    type="button"
                  >
                    Reading Mode
                  </button>
                  <button
                    className={readingMode === "marking" ? "active" : ""}
                    onClick={() => setReadingMode("marking")}
                    type="button"
                  >
                    Marking Mode
                  </button>
                </div>
              )}
              <p>
                {readingMode === "reading"
                  ? "Tap a word to hear it when approved word audio is available."
                  : isStudentMode
                    ? "Tap words to hear them."
                    : "Tap words to cycle neutral, read correctly, and needs support. Alt-click a word to hear it."}
              </p>
            </div>}

            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="guided-page-layout"
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -18 }}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 18 }}
                key={`${selectedBook.id}-${pageIndex}`}
                onTouchEnd={handlePageTouchEnd}
                onTouchStart={handlePageTouchStart}
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
                    className={`guided-page-text ${readingMode}`}
                    layoutVersion={readerLayoutVersion}
                    text={`${selectedBook.id}-${pageIndex}-${page.text || ""}-${readingMode}-${isReaderFullscreen ? "fullscreen" : "windowed"}`}
                  >
                    {sentenceTokenGroups.map(group => (
                      <span
                        className={highlightedSentenceIndex === group.sentenceIndex ? "guided-sentence active" : "guided-sentence"}
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
                              aria-label={isWordAudioLoading ? `Loading audio for ${item.token}` : `${readingMode === "marking" ? "Mark" : "Hear"} ${item.token}`}
                              className={`guided-word ${readingMode} ${mark || "neutral"} ${isHighlighted ? "heard audio-feedback-playing" : ""} ${isWordAudioLoading ? "audio-feedback-loading" : ""}`}
                              key={`word-${group.sentenceIndex}-${item.index}-${item.wordIndex}`}
                              onClick={event => handleWordClick(item.wordIndex, event)}
                              onContextMenu={event => {
                                event.preventDefault();
                                playWordAudio((page.words || [])[item.wordIndex] || { text: item.token }, item.wordIndex);
                              }}
                              title={readingMode === "marking" ? "Mark word. Right-click or Alt-click to hear audio if available." : "Tap to hear word audio if available."}
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

                  {audioNotice && <p className="guided-audio-notice">{audioNotice}</p>}
                  {!audioNotice && !readAloudState.readAloudAvailable && (
                    <p className="guided-audio-notice">{readAloudState.message}</p>
                  )}
                  {pageIndex === selectedBook.pages.length - 1 && readingProgress?.completed && (
                    <p className="guided-complete-message">Book completed. You can finish again to record a reread.</p>
                  )}

                  {!isStudentMode && !isReaderFullscreen && readingMode === "marking" && (
                    <div className="guided-mark-legend" aria-label="Word marking legend">
                      <span><b className="legend-dot correct"></b> Read correctly</span>
                      <span><b className="legend-dot support"></b> Needs support</span>
                      <span><b className="legend-dot neutral"></b> Unmarked</span>
                    </div>
                  )}

                  {!isStudentMode && !isReaderFullscreen && <details className="guided-note-drawer">
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
                        <button key={prompt} className="guided-comprehension-chip" onClick={() => speakWithBrowserVoice(prompt)} type="button">
                          {prompt}
                        </button>
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
                Previous Page
              </button>
              {pageIndex < selectedBook.pages.length - 1 ? (
                <button
                  className="lp-button lp-button-primary"
                  onClick={goToNextPage}
                  type="button"
                >
                  Next Page
                </button>
              ) : (
                <button className="lp-button lp-button-primary" onClick={completeBook} type="button">
                  Finish Book
                </button>
              )}
            </div>}
          </div>

          {!isStudentMode && !isReaderFullscreen && <aside className={teacherNotesOpen ? "guided-notes-panel open" : "guided-notes-panel"} aria-hidden={!teacherNotesOpen}>
            <div className="guided-notes-header">
              <h3>Teacher Notes</h3>
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
            <p className="panel-label">Book Complete</p>
            <h3>{selectedBook.title}</h3>
            <p>{readingProgress?.lastReadAt ? `Last read ${new Date(readingProgress.lastReadAt).toLocaleString()}` : "Summary saved locally."}</p>
          </div>

          <div className="checkpoint-result-grid">
            <div>
              <span>Read count</span>
              <strong>{readingProgress?.readCount || 1}</strong>
            </div>
            <div>
              <span>Pages completed</span>
              <strong>{readingProgress?.completedPages || selectedBook.pages.length}/{selectedBook.pages.length}</strong>
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

          {!isStudentMode && (
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
              {isStudentMode ? "Read Again" : "Continue Marking"}
            </button>
            <button className="lp-button lp-button-secondary" onClick={closeReader} type="button">
              Back to Library
            </button>
          </div>
        </section>
      ) : (
        <section className="guided-reader-empty">
          <h3>Select a book to open the reader.</h3>
          <p>Books open in a focused reader with large images, page narration, normal reading text, and optional teacher marking tools.</p>
        </section>
      )}

      {!isStudentMode && recordSummaries.length > 0 && (
        <section className="teacher-action-panel">
          <h3>Saved guided reading summaries</h3>
          <div className="guided-record-list">
            {recordSummaries.map(item => (
              <article key={item.bookId}>
                <strong>{item.title}</strong>
                <span>{item.correct}/{item.attempted} correct · {item.accuracy}%</span>
                <span>{item.supportWords.length ? `Support: ${item.supportWords.join(", ")}` : "No support words marked"}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
