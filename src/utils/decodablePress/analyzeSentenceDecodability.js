const WORD_PATTERN = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;

function normalizedSet(values = []) {
  return new Set(values.map(value => String(value).toLocaleLowerCase("en").replaceAll("’", "'").replace(/[^a-z']/g, "")).filter(Boolean));
}

export function classifyPressWord({ word, decodableWords = [], knownHighFrequencyWords = [], approvedChallenges = [] }) {
  const normalized = String(word || "").toLocaleLowerCase("en").replaceAll("’", "'").replace(/[^a-z']/g, "");
  if (!normalized) return { word, normalized, state: "punctuation_or_empty", explanation: null };
  if (normalizedSet(decodableWords).has(normalized)) return { word, normalized, state: "decodable", explanation: "Uses the word bank for this project." };
  if (normalizedSet(knownHighFrequencyWords).has(normalized)) return { word, normalized, state: "known_hfw", explanation: "Included in the approved known-word set." };
  if (normalizedSet(approvedChallenges).has(normalized)) return { word, normalized, state: "approved_challenge", explanation: "Teacher-approved challenge word." };
  return { word, normalized, state: "needs_review", explanation: "Keep your word and ask your teacher to help with it." };
}

export function analyzeSentenceDecodability({ sentence, decodableWords = [], knownHighFrequencyWords = [], approvedChallenges = [] }) {
  const tokens = String(sentence || "").match(WORD_PATTERN) || [];
  const words = tokens.map(word => classifyPressWord({ word, decodableWords, knownHighFrequencyWords, approvedChallenges }));
  return Object.freeze({
    words: Object.freeze(words),
    needsReview: Object.freeze([...new Set(words.filter(result => result.state === "needs_review").map(result => result.normalized))]),
    supportedCount: words.filter(result => result.state !== "needs_review").length,
    totalWords: words.length,
    purpose: "writing_support_not_assessment"
  });
}
