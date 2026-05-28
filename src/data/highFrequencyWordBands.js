const normalizeWord = value =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const HFW_WORDS_1_25 = [
  "a", "am", "and", "big", "can", "come", "down", "for", "go", "i", "in", "is", "it", "like", "little", "look",
  "me", "my", "not", "on", "one", "play", "said", "see", "that", "the", "to", "up", "want", "we", "with", "you"
];

export const HFW_WORDS_26_50 = [
  "after", "all", "are", "around", "asked", "away", "blue", "but", "came", "cold", "find", "for", "from", "funny",
  "have", "he", "help", "helps", "here", "into", "jump", "just", "made", "make", "now", "open", "play", "red",
  "round", "run", "she", "sleep", "that", "then", "they", "this", "three", "two", "under", "very", "was", "went",
  "were", "what", "when", "where", "will", "with", "yellow"
];

export const HFW_WORDS_51_75 = [
  "after", "again", "an", "any", "around", "as", "ask", "away", "be", "before", "by", "came", "cold", "come",
  "could", "down", "every", "find", "fly", "found", "from", "funny", "give", "going", "had", "has", "have", "help",
  "helps", "her", "here", "him", "his", "how", "into", "just", "know", "let", "like", "little", "live"
];

export const HFW_WORDS_76_100 = [
  "look", "made", "may", "must", "new", "now", "of", "old", "once", "open", "our", "out", "over", "please", "pretty",
  "put", "read", "round", "saw", "say", "some", "soon", "stop", "take", "thank", "them", "think", "this", "under",
  "walk", "want", "well", "went", "were", "what", "when", "white", "who", "will", "yes"
];

export const HFW_WORDS_51_100 = [...new Set([...HFW_WORDS_51_75, ...HFW_WORDS_76_100])];

export const HFW_WORD_BANDS = {
  hfw_1_25: HFW_WORDS_1_25,
  hfw_26_50: HFW_WORDS_26_50,
  hfw_51_75: HFW_WORDS_51_75,
  hfw_76_100: HFW_WORDS_76_100,
  hfw_51_100: HFW_WORDS_51_100
};

export const HFW_WORD_BAND_SETS = Object.fromEntries(
  Object.entries(HFW_WORD_BANDS).map(([band, words]) => [
    band,
    new Set(words.map(normalizeWord).filter(Boolean))
  ])
);

export const ALL_HFW_WORDS = [...new Set(Object.values(HFW_WORDS_1_25)
  .concat(HFW_WORDS_26_50, HFW_WORDS_51_100)
  .map(normalizeWord)
  .filter(Boolean))].sort();

export const ALL_HFW_WORD_SET = new Set(ALL_HFW_WORDS);

export function normalizeHfwSkillId(value = "") {
  const text = String(value || "").toLowerCase().replace(/_/g, "-");
  if (text.includes("1-25")) return "hfw_1_25";
  if (text.includes("26-50") || text.includes("25-50")) return "hfw_26_50";
  if (text.includes("51-75") || text.includes("50-75")) return "hfw_51_75";
  if (text.includes("76-100") || text.includes("75-100")) return "hfw_76_100";
  if (text.includes("51-100") || text.includes("50-100")) return "hfw_51_100";
  const normalized = text.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (HFW_WORD_BANDS[normalized]) return normalized;
  if (normalized === "high_frequency_words_1_25") return "hfw_1_25";
  if (normalized === "high_frequency_words_26_50") return "hfw_26_50";
  if (normalized === "high_frequency_words_51_100") return "hfw_51_100";
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
