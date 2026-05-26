import { enrichGuidedReadingBook } from "./phonicsPageAnalyzer.js";

function normalizeNeed(value = "") {
  return String(value || "").toLowerCase().replace(/_/g, "-");
}

function collectStudentNeeds(studentProgress = {}) {
  const explicit = [
    ...(studentProgress.unmasteredSkills || []),
    ...(studentProgress.unmasteredPatterns || []),
    ...(studentProgress.needs || []),
    studentProgress.currentSkillId,
    studentProgress.currentMicrophase,
    studentProgress.microphase
  ].map(normalizeNeed).filter(Boolean);

  const masteryEntries = Object.entries(studentProgress.mastery || {});
  const weakMastery = masteryEntries
    .filter(([, value]) => value && value.mastered === false)
    .map(([key]) => normalizeNeed(key));

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

  if (need.includes("short-o")) return haystack.some(item => item.includes("short-o") || item.includes("short-vowel:o"));
  if (need.includes("short-a")) return haystack.some(item => item.includes("short-a") || item.includes("short-vowel:a"));
  if (need.includes("short-e")) return haystack.some(item => item.includes("short-e") || item.includes("short-vowel:e"));
  if (need.includes("short-i")) return haystack.some(item => item.includes("short-i") || item.includes("short-vowel:i"));
  if (need.includes("short-u")) return haystack.some(item => item.includes("short-u") || item.includes("short-vowel:u"));
  if (need.includes("final") || need.includes("ending")) return haystack.some(item => item.includes("final"));
  if (need.includes("digraph")) return haystack.some(item => item.includes("digraph"));
  if (need.includes("blend")) return haystack.some(item => item.includes("blend"));
  if (need.includes("cvc")) return haystack.some(item => item.includes("cvc") || item.includes("short-vowel"));
  if (need.includes("high-frequency") || need.includes("sight")) return haystack.some(item => item.includes("high-frequency"));
  return haystack.some(item => item.includes(need) || need.includes(item));
}

export function recommendBooksForStudent({ books = [], studentProgress = {}, readingHistory = {} } = {}) {
  const needs = collectStudentNeeds(studentProgress);
  const enriched = books.map(enrichGuidedReadingBook);
  return enriched
    .filter(book => book.active !== false || book.reviewMode)
    .map(book => {
      const history = readingHistory[book.id] || {};
      const needMatches = needs.filter(need => needMatchesBook(need, book));
      const statusPenalty = book.qaStatus && !["approved", "needs_image_alignment_review"].includes(book.qaStatus) ? -25 : 0;
      const unreadBonus = history.completed ? 0 : 12;
      const patternScore = needMatches.length * 20;
      const decodableScore = Math.min(20, Math.round((book.decodablePercentage || 0) / 5));
      const score = patternScore + decodableScore + unreadBonus + statusPenalty;
      return {
        book,
        score,
        reasons: [
          ...needMatches.map(need => `matches ${need}`),
          unreadBonus ? "not completed yet" : "available for reread",
          `${book.decodablePercentage || 0}% decodable/HFW words`,
          book.qaStatus && book.qaStatus !== "approved" ? `QA status: ${book.qaStatus}` : "QA approved"
        ]
      };
    })
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title));
}
