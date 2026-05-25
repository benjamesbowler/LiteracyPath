const VOWELS = ["a", "e", "i", "o", "u"];
const COMMON_FINAL_PATTERNS = [
  "sh",
  "ch",
  "th",
  "ck",
  "ng",
  "nd",
  "nk",
  "st",
  "sk",
  "ft",
  "lt",
  "mp",
  "nt",
  "ll",
  "ss",
  "ff"
];
const COMMON_INITIAL_DIGRAPHS = ["sh", "ch", "th", "wh", "ph", "kn", "wr"];
const COMMON_INITIAL_BLENDS = [
  "bl",
  "br",
  "cl",
  "cr",
  "dr",
  "fl",
  "fr",
  "gl",
  "gr",
  "pl",
  "pr",
  "sc",
  "sk",
  "sl",
  "sm",
  "sn",
  "sp",
  "st",
  "sw",
  "tr",
  "tw"
];
const VOWEL_TEAMS = ["ai", "ay", "ea", "ee", "oa", "oe", "oi", "oy", "oo", "ou", "ow", "ue", "ui"];
const BOSSY_R = ["ar", "er", "ir", "or", "ur"];
const DIPHTHONGS = ["oi", "oy", "ou", "ow", "au", "aw"];

export function normalizeLexiconWord(word = "") {
  return String(word)
    .toLowerCase()
    .replace(/[^a-z\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function makeWordId(word = "") {
  return normalizeLexiconWord(word).replace(/[\s-]+/g, "_");
}

export function inferInitialSound(word = "") {
  const normalized = normalizeLexiconWord(word).replace(/[\s-]/g, "");
  if (!normalized) return "";
  const digraph = COMMON_INITIAL_DIGRAPHS.find(pattern => normalized.startsWith(pattern));
  if (digraph) return digraph;
  return normalized[0];
}

export function inferFinalSound(word = "") {
  const normalized = normalizeLexiconWord(word).replace(/[\s-]/g, "");
  if (!normalized) return "";
  const pattern = COMMON_FINAL_PATTERNS.find(ending => normalized.endsWith(ending));
  if (pattern) return pattern;
  return normalized.at(-1) || "";
}

export function inferMedialVowel(word = "") {
  const normalized = normalizeLexiconWord(word).replace(/[\s-]/g, "");
  if (!normalized) return "";
  const middle = normalized.slice(1, -1);
  return VOWELS.find(vowel => middle.includes(vowel)) || VOWELS.find(vowel => normalized.includes(vowel)) || "";
}

export function inferRime(word = "") {
  const normalized = normalizeLexiconWord(word).replace(/[\s-]/g, "");
  const vowelIndex = [...normalized].findIndex(letter => VOWELS.includes(letter));
  return vowelIndex >= 0 ? normalized.slice(vowelIndex) : normalized;
}

export function inferOnset(word = "") {
  const normalized = normalizeLexiconWord(word).replace(/[\s-]/g, "");
  const vowelIndex = [...normalized].findIndex(letter => VOWELS.includes(letter));
  return vowelIndex >= 0 ? normalized.slice(0, vowelIndex) : "";
}

export function inferSyllables(word = "") {
  const normalized = normalizeLexiconWord(word).replace(/[\s-]/g, "");
  if (!normalized) return 0;
  const groups = normalized.replace(/e$/u, "").match(/[aeiouy]+/gu);
  return Math.max(1, groups?.length || 1);
}

export function inferVowelPattern(word = "") {
  const normalized = normalizeLexiconWord(word).replace(/[\s-]/g, "");
  if (!normalized) return "";
  if (BOSSY_R.some(pattern => normalized.includes(pattern))) return "bossy-r";
  if (VOWEL_TEAMS.some(pattern => normalized.includes(pattern))) return "vowel-team";
  if (DIPHTHONGS.some(pattern => normalized.includes(pattern))) return "diphthong";
  if (/^[a-z]*[aeiou][bcdfghjklmnpqrstvwxyz]e$/u.test(normalized)) return "silent-e";
  if (/^[bcdfghjklmnpqrstvwxyz]?[aeiou][bcdfghjklmnpqrstvwxyz]$/u.test(normalized)) return "short-vowel-cvc";
  return "other";
}

export function inferPhonicsTags(word = "") {
  const normalized = normalizeLexiconWord(word).replace(/[\s-]/g, "");
  const tags = new Set();
  const initialBlend = COMMON_INITIAL_BLENDS.find(pattern => normalized.startsWith(pattern));
  const initialDigraph = COMMON_INITIAL_DIGRAPHS.find(pattern => normalized.startsWith(pattern));
  const finalPattern = COMMON_FINAL_PATTERNS.find(pattern => normalized.endsWith(pattern));
  const vowelPattern = inferVowelPattern(normalized);

  if (initialBlend) tags.add("initial-blend");
  if (initialDigraph) tags.add("initial-digraph");
  if (finalPattern && finalPattern.length > 1) tags.add("complex-final-sound");
  if (VOWEL_TEAMS.some(pattern => normalized.includes(pattern))) tags.add("vowel-team");
  if (DIPHTHONGS.some(pattern => normalized.includes(pattern))) tags.add("diphthong");
  if (BOSSY_R.some(pattern => normalized.includes(pattern))) tags.add("bossy-r");
  if (vowelPattern) tags.add(vowelPattern);
  if (/^[bcdfghjklmnpqrstvwxyz]?[aeiou][bcdfghjklmnpqrstvwxyz]$/u.test(normalized)) tags.add("cvc");

  return [...tags].sort();
}

export function inferSyllableType(word = "") {
  const vowelPattern = inferVowelPattern(word);
  if (vowelPattern === "short-vowel-cvc") return "closed";
  if (vowelPattern === "silent-e") return "vowel-consonant-e";
  if (vowelPattern === "vowel-team") return "vowel-team";
  if (vowelPattern === "bossy-r") return "r-controlled";
  return "unknown";
}

export function inferWordDifficulty(word = "", sourceLevel = null) {
  const normalized = normalizeLexiconWord(word).replace(/[\s-]/g, "");
  const syllables = inferSyllables(normalized);
  const phonicsTags = inferPhonicsTags(normalized);
  if (Number(sourceLevel) >= 2) return "level-2";
  if (syllables > 1 || phonicsTags.some(tag => ["initial-blend", "initial-digraph", "vowel-team", "bossy-r"].includes(tag))) {
    return "developing";
  }
  return "early";
}

