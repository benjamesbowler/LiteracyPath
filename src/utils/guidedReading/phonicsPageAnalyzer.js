import {
  inferFinalSound,
  inferInitialSound,
  inferMedialVowel,
  inferPhonicsTags,
  inferRime,
  inferSyllables,
  inferVowelPattern,
  normalizeLexiconWord
} from "../phonics/phonicsHeuristics.js";
import { fingerprintBookReadingText, getAnalysisPages } from "./textMetrics.js";

const HIGH_FREQUENCY_WORDS = new Set([
  "a", "i", "the", "my", "is", "can", "go", "to", "we", "me", "you", "and", "it", "in", "on", "at", "up",
  "look", "like", "here", "come", "said", "for", "he", "she", "they", "was", "with", "are", "have", "this", "that",
  "of", "do", "what", "little", "big", "play", "run", "jump", "not", "yes", "no", "where", "down", "away", "help", "make", "see", "went", "get", "has", "as", "his", "her", "from", "into", "out", "one", "two"
]);

const DIGRAPHS = ["sh", "ch", "th", "wh", "ph", "ck", "ng"];
const BLENDS = ["bl", "br", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "pl", "pr", "sc", "sk", "sl", "sm", "sn", "sp", "st", "sw", "tr", "tw", "nd", "nt", "mp", "nk", "ft", "lt"];
const VOWEL_TEAMS = ["ai", "ay", "ea", "ee", "oa", "oe", "oi", "oy", "oo", "ou", "ow", "ue", "ui"];
const R_CONTROLLED = ["ar", "er", "ir", "or", "ur"];

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function extractReadingWords(text = "") {
  return String(text || "")
    .toLowerCase()
    .match(/[a-z]+(?:[-'][a-z]+)?/g)?.map(word => word.replace(/^'+|'+$/g, ""))
    .filter(Boolean) || [];
}

function isCvc(word = "") {
  return /^[bcdfghjklmnpqrstvwxyz]?[aeiou][bcdfghjklmnpqrstvwxyz]$/u.test(word) && word.length === 3;
}

function getWordPatterns(word = "") {
  const normalized = normalizeLexiconWord(word).replace(/[^a-z]/g, "");
  if (!normalized) return [];
  const tags = new Set(inferPhonicsTags(normalized));
  if (isCvc(normalized)) tags.add("cvc");
  if (/[aeiou]/.test(normalized) && isCvc(normalized)) tags.add(`short-${inferMedialVowel(normalized)}`);
  DIGRAPHS.forEach(pattern => {
    if (normalized.includes(pattern)) tags.add(`digraph-${pattern}`);
  });
  BLENDS.forEach(pattern => {
    if (normalized.startsWith(pattern)) tags.add(`initial-blend-${pattern}`);
    if (normalized.endsWith(pattern)) tags.add(`final-blend-${pattern}`);
  });
  VOWEL_TEAMS.forEach(pattern => {
    if (normalized.includes(pattern)) tags.add(`vowel-team-${pattern}`);
  });
  R_CONTROLLED.forEach(pattern => {
    if (normalized.includes(pattern)) tags.add(`r-controlled-${pattern}`);
  });
  if (/^[a-z]*[aeiou][bcdfghjklmnpqrstvwxyz]e$/u.test(normalized)) tags.add("silent-e");
  return [...tags].sort();
}

const phonicsByWord = new Map();

function compactWordDetails(word) {
  const cached = phonicsByWord.get(word);
  if (cached) return cached;
  const phonicsPatterns = getWordPatterns(word);
  const details = {
    word,
    phonicsPatterns,
    highFrequency: HIGH_FREQUENCY_WORDS.has(word),
    decodable: isCvc(word) || phonicsPatterns.some(pattern => /short-|digraph-|blend|silent-e|vowel-team/.test(pattern))
  };
  phonicsByWord.set(word, details);
  return details;
}

export function analyzeGuidedReadingPage(page = {}) {
  const words = extractReadingWords(page.text || "");
  const uniqueWords = unique(words);
  const wordDetails = uniqueWords.map(word => ({
    ...compactWordDetails(word),
    initialSound: inferInitialSound(word),
    finalSound: inferFinalSound(word),
    medialVowel: inferMedialVowel(word),
    rime: inferRime(word),
    syllables: inferSyllables(word),
    vowelPattern: inferVowelPattern(word)
  }));
  const highFrequencyWords = wordDetails.filter(item => item.highFrequency).map(item => item.word);
  const decodableWords = wordDetails.filter(item => item.decodable && !item.highFrequency).map(item => item.word);
  const phonicsPatterns = unique(wordDetails.flatMap(item => item.phonicsPatterns));
  const sentenceCount = Math.max(1, (String(page.text || "").match(/[.!?]+/g) || []).length);
  const cvcCount = wordDetails.filter(item => item.phonicsPatterns.includes("cvc")).length;
  const complexCount = phonicsPatterns.filter(pattern => /digraph|blend|silent-e|vowel-team|r-controlled/.test(pattern)).length;
  const estimatedDifficulty = complexCount >= 4 || words.length / sentenceCount > 12
    ? "developing"
    : cvcCount >= 2 || words.length / sentenceCount > 7
      ? "early"
      : "emergent";

  return {
    words,
    wordDetails,
    decodableWords,
    highFrequencyWords,
    phonicsPatterns,
    skillLinks: unique([
      ...wordDetails.map(item => item.initialSound ? `initial:${item.initialSound}` : ""),
      ...wordDetails.map(item => item.finalSound ? `final:${item.finalSound}` : ""),
      ...wordDetails.map(item => item.medialVowel ? `short-vowel:${item.medialVowel}` : ""),
      ...wordDetails.map(item => item.rime ? `rime:${item.rime}` : "")
    ]),
    estimatedDifficulty
  };
}

const bookPhonicsByFingerprint = new Map();

// Ranking and eligibility need whole-book word/pattern evidence. They share
// summaries for the exact text without generating word-by-word reader markup.
export function summarizeGuidedReadingBookPhonics(book, fingerprint = fingerprintBookReadingText(book)) {
  const cached = bookPhonicsByFingerprint.get(fingerprint);
  if (cached) return cached;
  const detailsByWord = new Map();
  const pageCountsByPattern = new Map();
  let wordCount = 0;
  for (const page of getAnalysisPages(book)) {
    const words = extractReadingWords(page.text);
    wordCount += words.length;
    const pagePatterns = new Set();
    for (const word of new Set(words)) {
      const details = compactWordDetails(word);
      detailsByWord.set(word, details);
      for (const pattern of details.phonicsPatterns) pagePatterns.add(pattern);
    }
    for (const pattern of pagePatterns) {
      pageCountsByPattern.set(pattern, (pageCountsByPattern.get(pattern) || 0) + 1);
    }
  }
  const wordDetails = [...detailsByWord.values()];
  const highFrequencyWords = wordDetails.filter(detail => detail.highFrequency).map(detail => detail.word);
  const decodableWords = wordDetails.filter(detail => detail.decodable && !detail.highFrequency).map(detail => detail.word);
  const dominantPhonicsPatterns = [...pageCountsByPattern]
    .sort(([patternA, countA], [patternB, countB]) => countB - countA || patternA.localeCompare(patternB))
    .slice(0, 10)
    .map(([pattern]) => pattern);
  const summary = {
    wordCount, wordDetails, highFrequencyWords, decodableWords, dominantPhonicsPatterns,
    recommendedMicrophase: recommendedMicrophase(dominantPhonicsPatterns, highFrequencyWords, decodableWords),
    recommendedSkillsToReinforce: dominantPhonicsPatterns.slice(0, 6)
  };
  bookPhonicsByFingerprint.set(fingerprint, summary);
  return summary;
}

function recommendedMicrophase(patterns, highFrequencyWords, decodableWords) {
  if (patterns.some(pattern => /digraph|blend/.test(pattern))) return "digraphs-and-blends";
  if (patterns.some(pattern => /short-/.test(pattern)) || patterns.includes("cvc")) return "cvc-short-vowels";
  return highFrequencyWords.length >= decodableWords.length ? "high-frequency-fluency" : "early-reading";
}

export function enrichGuidedReadingBook(book = {}) {
  const pages = (book.pages || []).map(page => ({
    ...page,
    analysis: analyzeGuidedReadingPage(page)
  }));
  const allWords = pages.flatMap(page => page.analysis.words);
  const uniqueWords = unique(allWords);
  const sentenceCount = Math.max(1, pages.reduce((sum, page) => sum + ((String(page.text || "").match(/[.!?]+/g) || []).length || 1), 0));
  const phonicsPatterns = unique(pages.flatMap(page => page.analysis.phonicsPatterns));
  const highFrequencyWords = unique(pages.flatMap(page => page.analysis.highFrequencyWords));
  const decodableWords = unique(pages.flatMap(page => page.analysis.decodableWords));
  const repeatedWords = unique(allWords.filter((word, index) => allWords.indexOf(word) !== index));
  const decodablePercentage = allWords.length ? Math.round((allWords.filter(word => decodableWords.includes(word) || HIGH_FREQUENCY_WORDS.has(word)).length / allWords.length) * 100) : 0;
  const dominantPhonicsPatterns = phonicsPatterns
    .map(pattern => ({ pattern, count: pages.filter(page => page.analysis.phonicsPatterns.includes(pattern)).length }))
    .sort((a, b) => b.count - a.count || a.pattern.localeCompare(b.pattern))
    .slice(0, 10)
    .map(item => item.pattern);

  return {
    ...book,
    pages,
    wordCount: allWords.length,
    sentenceCount,
    uniqueWordCount: uniqueWords.length,
    averageSentenceLength: Number((allWords.length / sentenceCount).toFixed(1)),
    repeatedWords,
    highFrequencyWords,
    decodableWords,
    decodablePercentage,
    dominantPhonicsPatterns,
    recommendedMicrophase: recommendedMicrophase(dominantPhonicsPatterns, highFrequencyWords, decodableWords),
    recommendedSkillsToReinforce: dominantPhonicsPatterns.slice(0, 6),
    estimatedDifficulty: pages.some(page => page.analysis.estimatedDifficulty === "developing") ? "developing" : pages.some(page => page.analysis.estimatedDifficulty === "early") ? "early" : "emergent"
  };
}
