const normalizeWord = value =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const HFW_WORDS_1_25 = [
  "the", "to", "and", "a", "i", "you", "it", "in", "said", "for",
  "up", "look", "is", "go", "we", "little", "can", "see", "me", "my",
  "on", "one", "big", "come", "like"
];

export const HFW_WORDS_26_50 = [
  "down", "not", "play", "all", "are", "as", "be", "but", "came", "from",
  "have", "he", "she", "they", "was", "with", "that", "then", "this", "what",
  "when", "where", "will", "help", "make"
];

export const HFW_WORDS_51_75 = [
  "after", "again", "an", "any", "around", "ask", "away", "before", "by", "could",
  "every", "find", "fly", "found", "funny", "give", "going", "had", "has", "her",
  "here", "him", "his", "how", "into"
];

export const HFW_WORDS_76_100 = [
  "just", "know", "let", "live", "made", "may", "must", "new", "now", "of",
  "old", "once", "open", "our", "out", "over", "please", "pretty", "put", "read",
  "round", "some", "take", "thank", "yes"
];

export const HFW_WORDS_51_100 = [...new Set([...HFW_WORDS_51_75, ...HFW_WORDS_76_100])];

export const HFW_WORD_BANDS = {
  hfw_1_25: HFW_WORDS_1_25,
  hfw_26_50: HFW_WORDS_26_50,
  hfw_51_75: HFW_WORDS_51_75,
  hfw_76_100: HFW_WORDS_76_100
};

export const HFW_WORD_BAND_SETS = Object.fromEntries(
  Object.entries(HFW_WORD_BANDS).map(([band, words]) => [
    band,
    new Set(words.map(normalizeWord).filter(Boolean))
  ])
);

export const ALL_HFW_WORDS = [...new Set(Object.values(HFW_WORDS_1_25)
  .concat(HFW_WORDS_26_50, HFW_WORDS_51_75, HFW_WORDS_76_100)
  .map(normalizeWord)
  .filter(Boolean))].sort();

export const ALL_HFW_WORD_SET = new Set(ALL_HFW_WORDS);

export function normalizeHfwSkillId(value = "") {
  const text = String(value || "").toLowerCase().replace(/_/g, "-");
  if (text.includes("1-25")) return "hfw_1_25";
  if (text.includes("26-50") || text.includes("25-50")) return "hfw_26_50";
  if (text.includes("51-75") || text.includes("50-75")) return "hfw_51_75";
  if (text.includes("76-100") || text.includes("75-100")) return "hfw_76_100";
  if (text.includes("51-100") || text.includes("50-100")) return "";
  const normalized = text.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (HFW_WORD_BANDS[normalized]) return normalized;
  if (normalized === "high_frequency_words_1_25") return "hfw_1_25";
  if (normalized === "high_frequency_words_26_50") return "hfw_26_50";
  if (normalized === "high_frequency_words_51_75") return "hfw_51_75";
  if (normalized === "high_frequency_words_76_100") return "hfw_76_100";
  if (normalized === "high_frequency_words_51_100") return "";
  return "";
}

export function getHfwBandWords(skillId = "") {
  return HFW_WORD_BANDS[normalizeHfwSkillId(skillId)] || [];
}

export function getHfwBandSet(skillId = "") {
  return HFW_WORD_BAND_SETS[normalizeHfwSkillId(skillId)] || null;
}

export function isHighFrequencyWordSkill(skillId = "") {
  return Boolean(normalizeHfwSkillId(skillId));
}

export function getHfwBandDuplicates() {
  const seen = new Map();
  const duplicates = [];
  for (const [band, words] of Object.entries(HFW_WORD_BANDS)) {
    for (const word of words.map(normalizeWord)) {
      const previous = seen.get(word);
      if (previous && !duplicates.some(item => item.word === word && item.bands.includes(band))) {
        duplicates.push({ word, bands: [...previous, band] });
      }
      seen.set(word, [...(previous || []), band]);
    }
  }
  return duplicates;
}
