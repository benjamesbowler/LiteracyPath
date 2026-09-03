import { enrichGuidedReadingBook } from "./phonicsPageAnalyzer.js";
import { getGuidedReadingBookMetadata } from "../../data/guidedReadingBookMetadata.js";
import {
  READING_PURPOSES,
  classifyBookReadingPurpose
} from "../../policy/literacyExperiencePolicy.js";

const GUIDED_READING_LEVELS = ["A", "B", "C", "D", "E", "F"];

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
    return book.level === "A";
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
  const explicitLevel = String(
    studentProgress.guidedReadingLevel
    || studentProgress.readingLevel
    || ""
  ).toUpperCase();
  if (GUIDED_READING_LEVELS.includes(explicitLevel)) {
    return { level: explicitLevel, source: "teacher-set" };
  }

  const savedReading = enrichedBooks
    .map(book => ({ book, record: readingHistory[book.id] || {} }))
    .filter(({ record }) => recordHasStarted(record))
    .sort((a, b) => (
      recordDateValue(b.record) - recordDateValue(a.record)
      || Number(recordIsComplete(b.book, b.record)) - Number(recordIsComplete(a.book, a.record))
    ))[0];

  if (savedReading?.book?.level && GUIDED_READING_LEVELS.includes(savedReading.book.level)) {
    return { level: savedReading.book.level, source: "saved-reading" };
  }

  return { level: "A", source: "starting-level" };
}

function historyReason(book, history) {
  if (recordIsComplete(book, history)) return "Ready to reread for fluency";
  if (recordHasStarted(history)) return "Continue a book already started";
  return "Not read yet";
}

export function recommendBooksForStudent({ books = [], studentProgress = {}, readingHistory = {} } = {}) {
  const needs = collectStudentNeeds(studentProgress);
  const enriched = books
    .map(book => ({ ...book, ...getGuidedReadingBookMetadata(book) }))
    .map(enrichGuidedReadingBook)
    .filter(book => book.active !== false && (!book.qaStatus || book.qaStatus === "approved"));
  const readingLevel = resolveReadingLevel(enriched, studentProgress, readingHistory);
  const sameLevelBooks = enriched.filter(book => book.level === readingLevel.level);
  const standardLevelBooks = readingLevel.level === "C"
    ? sameLevelBooks.filter(book => book.readingBandProfile === "standard")
    : sameLevelBooks;
  const candidates = standardLevelBooks.length >= 5 ? standardLevelBooks : enriched;

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
        readingLevel: readingLevel.level,
        readingLevelSource: readingLevel.source,
        reasons: [
          historyReason(book, history),
          readingPurpose.reason
        ]
      };
    })
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title));
}
