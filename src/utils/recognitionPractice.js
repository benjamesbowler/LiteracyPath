import { SENTENCES, SIGHT_WORDS } from "../data/learnGamesData.js";
import { hasKnownBadWordAudio } from "../data/knownBadWordAudio.js";

export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const WORD_NEIGHBOURS = [
  ["the", "they", "then", "them", "there"], ["he", "her", "here", "she"],
  ["was", "saw", "has", "had"], ["of", "off", "for", "from"],
  ["on", "no", "in", "an"], ["is", "it", "if", "its"],
  ["with", "what", "when", "which", "where"], ["could", "would", "should"],
  ["some", "same", "come", "came"], ["were", "where", "we", "went"],
  ["through", "though", "thought", "thorough"], ["every", "ever", "very"],
  ["because", "become", "before", "between"], ["their", "there", "these", "those"]
];

// A bare spoken word cannot distinguish these spellings. Do not offer one as
// a wrong answer to its homophone; the game does not supply sentence context.
const SAME_SPOKEN_WORD = [
  ["to", "too", "two"], ["there", "their", "they're"], ["here", "hear"],
  ["one", "won"], ["no", "know"], ["for", "four"], ["by", "buy", "bye"],
  ["see", "sea"], ["be", "bee"], ["i", "eye"], ["are", "our", "hour"],
  ["right", "write", "rite"], ["which", "witch"], ["son", "sun"],
  ["ate", "eight"], ["read", "red", "reed"], ["new", "knew"],
  ["whole", "hole"], ["some", "sum"], ["blue", "blew"], ["would", "wood"],
  ["made", "maid"], ["meet", "meat"], ["week", "weak"], ["wear", "where", "ware"],
  ["piece", "peace"], ["plain", "plane"], ["pair", "pear", "pare"],
  ["break", "brake"], ["flower", "flour"]
];

export function sightWordPool(difficulty = "easy") {
  const level = difficulty === "hard" ? "level3" : difficulty === "medium" ? "level2" : "level1";
  return [...new Set(SIGHT_WORDS[level])].filter(word => !hasKnownBadWordAudio(word));
}

export function hfwOptions(target, pool, random = Math.random) {
  const normalized = target.toLowerCase();
  const ambiguous = new Set(SAME_SPOKEN_WORD.filter(group => group.includes(normalized)).flat());
  const neighbours = new Set(WORD_NEIGHBOURS.filter(group => group.includes(normalized)).flat());
  const candidates = shuffled([...new Set(pool)], random)
    .filter(word => word !== target && !ambiguous.has(word.toLowerCase()));
  candidates.sort((a, b) => {
    const rank = word => neighbours.has(word.toLowerCase()) ? 0 : word[0] === target[0] ? 1 : Math.abs(word.length - target.length) <= 1 ? 2 : 3;
    return rank(a) - rank(b);
  });
  return shuffled([target, ...candidates.slice(0, 5)], random);
}

const COLLECTION_OBJECTS = ["cat", "bat", "fan", "hat", "tree", "flag", "frog", "lamp", "fish", "train"];

export function memoryBoards(difficulty = "easy", random = Math.random) {
  const count = difficulty === "hard" ? 30 : difficulty === "medium" ? 28 : 24;
  const words = shuffled(sightWordPool(difficulty), random).slice(0, count);
  const perBoard = difficulty === "hard" ? 5 : difficulty === "medium" ? 4 : 3;
  const boards = [];
  for (let start = 0; start < words.length; start += perBoard) {
    const cards = words.slice(start, start + perBoard).flatMap((word, offset) => {
      const pairId = `pair-${start + offset}`;
      const object = COLLECTION_OBJECTS[(start + offset) % COLLECTION_OBJECTS.length];
      return ["a", "b"].map(side => ({ id: `${pairId}-${side}`, pairId, word, object }));
    });
    boards.push(shuffled(cards, random));
  }
  return { boards, cards: boards.flat() };
}

export function sentencePractice(difficulty = "easy", limit = 6, random = Math.random) {
  const level = difficulty === "hard" ? "level3" : difficulty === "medium" ? "level2" : "level1";
  const source = SENTENCES[level];
  // One worked example is excluded from every target in this session.
  return { modelSentence: source[0], sentences: shuffled(source.slice(1), random).slice(0, limit) };
}

export function sentenceTiles(sentence) {
  return String(sentence).replace(/[.?!]/g, "").split(/\s+/).filter(Boolean)
    .map((word, index) => ({ id: `word-${index}`, word, index }));
}
