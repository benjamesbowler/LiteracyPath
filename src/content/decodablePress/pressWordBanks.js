const PACKS = [
  {
    id: "cycles-1-12",
    cycleMin: 1,
    cycleMax: 12,
    version: 1,
    words: ["a", "am", "at", "can", "cat", "did", "dig", "fit", "got", "had", "has", "him", "in", "is", "it", "mat", "not", "on", "ran", "sat", "sit", "the", "to", "up"],
    highFrequencyWords: ["a", "I", "the", "and", "is", "of", "to", "my", "said", "was"]
  },
  {
    id: "cycles-13-24",
    cycleMin: 13,
    cycleMax: 24,
    version: 1,
    words: ["back", "best", "black", "bring", "brush", "camp", "chop", "clap", "crash", "drip", "fast", "fish", "frog", "grin", "help", "jump", "lost", "much", "plan", "pond", "rock", "shop", "stop", "think", "went"],
    highFrequencyWords: ["all", "are", "come", "do", "for", "go", "have", "he", "like", "look", "one", "see", "she", "they", "was", "we", "you"]
  },
  {
    id: "cycles-25-36",
    cycleMin: 25,
    cycleMax: 36,
    version: 1,
    words: ["bright", "cheer", "dream", "float", "green", "light", "moon", "night", "paint", "rain", "road", "sail", "seed", "shine", "storm", "team", "train", "turn", "wait", "whisper"],
    highFrequencyWords: ["because", "could", "every", "from", "little", "make", "people", "their", "there", "what", "when", "where", "would"]
  }
].map(pack => Object.freeze({ ...pack, words: Object.freeze(pack.words), highFrequencyWords: Object.freeze(pack.highFrequencyWords), review: Object.freeze({ status: "approved", reviewedAt: "2026-08-09", source: "Literacy Guide taught-sequence editorial pack" }) }));

export const PRESS_WORD_BANKS = Object.freeze(PACKS);

export function getPressWordBank(cycleNumber) {
  const cycle = Math.max(1, Math.min(36, Number(cycleNumber) || 1));
  return PRESS_WORD_BANKS.find(pack => cycle >= pack.cycleMin && cycle <= pack.cycleMax) || PRESS_WORD_BANKS[0];
}
