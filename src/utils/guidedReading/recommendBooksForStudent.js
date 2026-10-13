import { enrichGuidedReadingBook } from "./phonicsPageAnalyzer.js";
import { getGuidedReadingBookMetadata } from "../../data/guidedReadingBookMetadata.js";
import { APP_READING_LEVELS, getBookTextAnalysis } from "./bookTextAnalysis.js";
import {
  READING_PURPOSES,
  classifyBookReadingPurpose
} from "../../policy/literacyExperiencePolicy.js";

function normalizeNeed(value = "") {
  return String(value || "").toLowerCase().replace(/_/g, "-");
}

function canonicalNeed(value = "") {
  const need = normalizeNeed(value);
  if (!need || need === "other") return "";
  if (need.includes("initial-sound")) return "initial-sounds";
  if (need.includes("final-sound") || need.includes("ending-sound")) return "final-sounds";
  if (need.includes("rhy")) return "rhyming";
  if (need.includes("short-vowel") || need.includes("cvc")) return "cvc-short-vowels";
  if (need.includes("high-frequency") || need.includes("sight") || /^hfw(?:-|$)/u.test(need)) {
    return "high-frequency-words";
  }
  if (need.includes("digraph")) return "digraphs";
  if (need.includes("blend")) return "blends";
  if (need.includes("silent-e") || need.includes("long-vowel")) return "long-vowels";
  if (need.includes("vowel-team")) return "vowel-teams";
  if (need.includes("r-controlled") || need.includes("bossy-r")) return "r-controlled-vowels";
  return "";
}

function collectStudentNeeds(studentProgress = {}) {
  const explicit = [
    ...(studentProgress.unmasteredSkills || []),
    ...(studentProgress.unmasteredPatterns || []),
    ...(studentProgress.needs || []),
    studentProgress.currentSkillId,
    studentProgress.currentMicrophase,
    studentProgress.microphase
  ].map(canonicalNeed).filter(Boolean);

  const masteryEntries = Object.entries(studentProgress.mastery || {});
  const weakMastery = masteryEntries
    .filter(([, value]) => value && value.mastered === false)
    .map(([key]) => canonicalNeed(key))
    .filter(Boolean);

  return [...new Set([...explicit, ...weakMastery])];
}

function needMatchesBook(need, book) {
  const haystack = [
    book.recommendedMicrophase,
    ...(book.recommendedSkillsToReinforce || []),
    ...(book.dominantPhonicsPatterns || []),
    ...(book.targetSkills || []),
    ...(book.decodableFocus || [])
  ].map(normalizeNeed);

  if (need === "initial-sounds" || need === "final-sounds" || need === "rhyming") {
    // A short text is not evidence that it teaches a particular oral skill.
    return [...(book.targetSkills || []), ...(book.decodableFocus || [])].some(value => canonicalNeed(value) === need);
  }
  if (need === "cvc-short-vowels") {
    return haystack.some(item => item === "cvc" || item.includes("short-vowel") || /^short-[aeiou]$/u.test(item));
  }
  if (need === "high-frequency-words") {
    return book.recommendedMicrophase === "high-frequency-fluency"
      || (book.highFrequencyWords || []).length >= (book.decodableWords || []).length;
  }
  if (need === "digraphs") return haystack.some(item => item.includes("digraph"));
  if (need === "blends") return haystack.some(item => item.includes("blend"));
  if (need === "long-vowels") {
    return haystack.some(item => item.includes("silent-e") || item.includes("long-vowel"));
  }
  if (need === "vowel-teams") return haystack.some(item => item.includes("vowel-team"));
  if (need === "r-controlled-vowels") {
    return haystack.some(item => item.includes("r-controlled") || item.includes("bossy-r"));
  }
  return false;
}

function recordIsComplete(book, record = {}) {
  const totalPages = book.pages?.length || Number(record.totalPages || 0);
  const completedPages = Math.max(
    Number(record.completedPages || 0),
    Object.keys(record.pages || {}).length
  );
  return Boolean(record.completed || record.completedAt || (totalPages > 0 && completedPages >= totalPages));
}

function recordHasStarted(record = {}) {
  return Boolean(
    record.completed
    || record.completedAt
    || record.firstReadAt
    || record.lastReadAt
    || record.updatedAt
    || Number(record.completedPages || 0) > 0
    || Object.keys(record.pages || {}).length > 0
  );
}

function recordDateValue(record = {}) {
  const value = Date.parse(
    record.lastReadAt
    || record.completedAt
    || record.updatedAt
    || record.firstReadAt
    || ""
  );
  return Number.isFinite(value) ? value : 0;
}

function resolveReadingLevel(enrichedBooks, studentProgress, readingHistory) {
  // A/B/C instructional placement is deliberately not an app text band.
  const explicitLevel = String(studentProgress.appReadingLevel || "").toUpperCase();
  if (APP_READING_LEVELS.includes(explicitLevel)) {
    return { level: explicitLevel, source: "teacher-selected-text" };
  }

  const savedReading = enrichedBooks
    // Listening to a supported read-aloud must not replace the graded book
    // that anchors these suggestions. Its App text band remains available
    // when the teacher explicitly chooses that band for browsing.
    .filter(book => APP_READING_LEVELS.includes(book.appReadingLevel)
      && book.level !== "READ_ALOUD" && book.readingBandProfile !== "read-aloud")
    .map(book => ({ book, record: readingHistory[book.id] || {} }))
    .filter(({ record }) => recordHasStarted(record))
    .sort((a, b) => (
      recordDateValue(b.record) - recordDateValue(a.record)
      || Number(recordIsComplete(b.book, b.record)) - Number(recordIsComplete(a.book, a.record))
    ))[0];

  if (savedReading?.book?.appReadingLevel) {
    return { level: savedReading.book.appReadingLevel, source: "saved-reading", bookTitle: savedReading.book.title };
  }
  return { level: APP_READING_LEVELS.find(level => enrichedBooks.some(book => book.appReadingLevel === level)) || null, source: "starting-text" };
}

function historyReason(book, history) {
  if (recordIsComplete(book, history)) return "Ready to reread for fluency";
  if (recordHasStarted(history)) return "Continue a book already started";
  return "Not read yet";
}

export function recommendBooksForStudent({ books = [], studentProgress = {}, readingHistory = {} } = {}) {
  const needs = collectStudentNeeds(studentProgress);
  const enriched = books
    .map(book => ({ ...book, ...getGuidedReadingBookMetadata(book), appReadingLevel: getBookTextAnalysis(book).appReadingLevel }))
    .map(enrichGuidedReadingBook)
    .filter(book => book.active !== false && (!book.qaStatus || book.qaStatus === "approved") && APP_READING_LEVELS.includes(book.appReadingLevel));
  const instructionalLevel = String(studentProgress.guidedReadingLevel || studentProgress.readingLevel || "").toUpperCase();
  const placementBooks = instructionalLevel ? enriched.filter(book => book.level === instructionalLevel) : enriched;
  const standardBooks = instructionalLevel === "C" ? placementBooks.filter(book => book.readingBandProfile === "standard") : placementBooks;
  const eligibleBooks = standardBooks.length ? standardBooks : placementBooks;
  const readingLevel = resolveReadingLevel(eligibleBooks, studentProgress, readingHistory);
  // Do not fill a five-card quota with other bands while claiming a same-band match.
  const candidates = eligibleBooks.filter(book => book.appReadingLevel === readingLevel.level);

  return candidates
    .map(book => {
      const history = readingHistory[book.id] || {};
      const needMatches = needs.filter(need => needMatchesBook(need, book));
      const readingPurpose = classifyBookReadingPurpose(book, studentProgress);
      const unreadBonus = recordIsComplete(book, history) ? 0 : recordHasStarted(history) ? 16 : 12;
      const patternScore = needMatches.length * 20;
      const independentPracticeBonus = readingPurpose.id === READING_PURPOSES.INDEPENDENT ? 24 : 0;
      const score = patternScore + independentPracticeBonus + unreadBonus;
      return {
        book,
        score,
        matchedNeeds: needMatches,
        readingPurpose,
        readingLevel: book.appReadingLevel,
        readingLevelSource: readingLevel.source,
        referenceBookTitle: readingLevel.bookTitle || "",
        reasons: [
          historyReason(book, history),
          readingPurpose.reason
        ]
      };
    })
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title));
}
