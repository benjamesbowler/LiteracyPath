// Pure round builder for Rocket Run (the 3D catch-the-sound game). Kept free of
// DOM/Three.js so every round can be play-tested: the child steers into words
// that START with the target sound and dodges the rest, so a round is only fair
// if the "correct" words truly begin with the target grapheme and the distractors
// begin with a DIFFERENT sound (c/k and w/wh are homophones and must be kept apart).
import { LETTER_EXAMPLES } from "../data/elSkillsBlockCycles.js";
import { onsetGrapheme, sharesSound } from "../components/elQuest/elQuestEngine.js";

const CLEAN = word => /^[a-z]{2,6}$/.test(word);
const ALL_WORDS = [...new Set(Object.values(LETTER_EXAMPLES).flat())].filter(CLEAN);

// Extra onset words per grapheme, vetted by hand for this game: 2-6 letters
// (CLEAN-passing), genuinely starting with the grapheme (hard c/g only, no
// silent letters like knee/knit, no soft c/g like city/gem), and concrete and
// age-appropriate for ages 4-8. LETTER_EXAMPLES alone yields only 3-6 usable
// words per sound after CLEAN filtering, so rounds recycled the same handful;
// with these extras every grapheme the game targets reaches 12+ onset words.
// Keys intentionally match the existing rocketRunTargets() set exactly, so no
// new grapheme (u, qu, x) is promoted into a target by accident.
const EXTRA_WORDS = {
  a: ["add", "am", "an", "and", "as", "ask", "at", "act", "ash", "alley", "ankle", "arrow", "actor", "after", "angry", "animal", "answer", "apple", "attic", "action", "adder", "album", "anchor"],
  m: ["mad", "man", "men", "milk", "mop", "mud", "mug", "mom", "mitt", "moss", "melon", "muffin"],
  t: ["tag", "tan", "ten", "tin", "tip", "toe", "toy", "tub", "tug", "tall", "tick", "toast"],
  s: ["sad", "sap", "set", "six", "sob", "sand", "seed", "sick", "sing", "soap", "soft", "sour"],
  n: ["nag", "new", "nod", "not", "nut", "nail", "near", "neck", "need", "nine", "noon", "note"],
  i: ["if", "ill", "in", "inn", "it", "inch", "into", "issue", "image", "indoor", "inbox", "invent", "itchy", "index", "insect", "igloo", "infant"],
  f: ["fat", "fed", "fin", "fit", "fog", "fun", "fur", "fall", "fast", "feet", "five", "flag"],
  d: ["dad", "dam", "day", "den", "did", "dim", "dip", "dot", "dark", "dish", "doll", "down"],
  o: ["odd", "odds", "off", "on", "ox", "oxen", "onto", "offer", "often", "office", "option", "orange", "omelet", "oblong"],
  l: ["lab", "leg", "lid", "lip", "lit", "lot", "luck", "lamb", "lake", "list", "lock"],
  r: ["rag", "rat", "ray", "rib", "rip", "rob", "rod", "row", "rain", "rest", "ring", "rock"],
  h: ["had", "ham", "hay", "hid", "hit", "hot", "hug", "hut", "hand", "hard", "help", "hill"],
  b: ["bad", "bed", "bee", "big", "bit", "boy", "bug", "bus", "back", "bike", "bird", "boat"],
  w: ["wag", "way", "wet", "win", "wait", "walk", "wash", "week", "well", "west", "will", "wish"],
  c: ["cab", "car", "cod", "cop", "cow", "cub", "cut", "cake", "call", "camp", "card", "coat", "cold", "cook", "cool", "corn"],
  g: ["gas", "get", "got", "guy", "game", "gate", "girl", "give", "glad", "goal", "gold", "golf", "good", "grin"],
  p: ["pad", "paw", "pay", "pen", "pet", "pie", "pin", "pop", "pack", "park", "pick", "play", "pond", "pool"],
  y: ["yam", "yap", "yet", "yum", "yard", "yawn", "year", "yell", "yoga", "yolk", "your", "young", "yours", "youth"],
  e: ["ebb", "elf", "elk", "elm", "edge", "else", "envy", "epic", "elbow", "enter", "error", "edgy", "ember", "engine"],
  v: ["vat", "vow", "vast", "veil", "vent", "verb", "very", "veto", "void", "vote"],
  k: ["key", "kid", "keep", "kick", "kite", "kind", "king", "kiss", "kitten", "kettle", "kiwi", "koala"],
  j: ["jar", "jaw", "job", "jog", "joy", "jeep", "joke", "jelly", "juice", "jacket"],
  z: ["zag", "zen", "zig", "zit", "zany", "zest", "zinc", "zone", "zoom", "zebra", "zipper", "zero", "zigzag", "zesty", "zippy", "zombie"],
  sh: ["she", "shy", "shed", "shoe", "shot", "show", "shade", "shake", "share", "sharp", "sheet", "shine", "shirt", "short"],
  ch: ["chew", "chain", "chalk", "champ", "chase", "check", "cheek", "cheer", "chest", "chick", "child", "chill", "chime", "chunk"],
  th: ["than", "the", "them", "then", "they", "this", "thud", "thank", "thick", "thief", "thorn", "those", "throw", "thump"],
  wh: ["why", "whip", "whiz", "whale", "wheat", "wheel", "where", "which", "while", "white"]
};

// Targets whose spelling does not guarantee one initial phoneme need an
// explicit, dialect-conscious pool. These lists match the production cue used
// by the listening games: short a/e/i/o, hard c/g and unvoiced th. Without this
// boundary, words such as city, item or them can be scored against a different
// sound even though their first printed grapheme matches.
const TARGET_SOUND_OVERRIDES = Object.freeze({
  a: Object.freeze(["add", "am", "an", "and", "as", "at", "act", "ash", "alley", "ankle", "actor", "angry", "animal", "apple", "attic", "action", "adder", "album", "anchor"]),
  e: Object.freeze(["ebb", "elf", "elk", "elm", "edge", "else", "envy", "epic", "elbow", "enter", "error", "engine", "empty", "echo", "ember"]),
  i: Object.freeze(["if", "ill", "in", "inn", "it", "inch", "into", "issue", "image", "indoor", "inbox", "invent", "itchy", "index", "insect", "igloo", "infant"]),
  o: Object.freeze(["odd", "odds", "off", "on", "ox", "oxen", "onto", "offer", "often", "office", "option", "orange", "omelet", "oblong"]),
  c: Object.freeze(["cab", "cat", "can", "cap", "car", "cod", "cop", "cow", "cub", "cut", "cake", "call", "camp", "card", "coat", "cold", "cook", "cool", "corn"]),
  g: Object.freeze(["gas", "get", "got", "guy", "game", "gate", "girl", "give", "glad", "goal", "gold", "golf", "good", "grin", "green", "grow", "grab", "glow", "grape", "grass"]),
  th: Object.freeze(["thin", "thud", "thank", "thick", "thief", "thorn", "throw", "thump", "thumb", "three", "thread", "thrill", "throat", "thing"])
});

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Example words that TRULY start with the grapheme (drops "six"/"teeth"/"ball"
// style entries where the grapheme is not the onset - see elQuestEngine onset fix).
// Merges the vetted EXTRA_WORDS so every target has a deep enough pool that
// rounds serve distinct words instead of recycling the same 3-6.
export function wordsStartingWith(grapheme) {
  const g = String(grapheme || "").toLowerCase();
  return [...new Set([...(LETTER_EXAMPLES[g] || []), ...(EXTRA_WORDS[g] || [])])]
    .filter(CLEAN)
    .filter(word => onsetGrapheme(word) === g);
}

export function wordStartsWithTargetSound(word, grapheme) {
  const g = String(grapheme || "").toLowerCase();
  const normalizedWord = String(word || "").toLowerCase();
  const override = TARGET_SOUND_OVERRIDES[g];
  return override
    ? override.includes(normalizedWord)
    : onsetGrapheme(normalizedWord) === g;
}

export function wordsStartingWithTargetSound(grapheme) {
  const g = String(grapheme || "").toLowerCase();
  const override = TARGET_SOUND_OVERRIDES[g];
  const source = override || wordsStartingWith(g);
  return [...new Set(source)].filter(CLEAN).filter(word => wordStartsWithTargetSound(word, g));
}

// Graphemes that make a valid "which starts with this sound?" target: at least a
// few decodable words genuinely begin with them. Naturally excludes final-only
// graphemes (x, all, ng, nk) and multi-letter pattern rows.
export function rocketRunTargets(minCorrect = 3) {
  return Object.keys(LETTER_EXAMPLES)
    .filter(g => /^[a-z]{1,2}$/.test(g) && !["qu", "u"].includes(g))
    .filter(g => wordsStartingWithTargetSound(g).length >= minCorrect);
}

function uniqueSample(pool, n) {
  return shuffle([...new Set(pool)]).slice(0, Math.max(0, n));
}

// Word length band per difficulty, so the words a round shows suit the level.
const LEN_RANGE = { easy: [2, 4], low: [2, 4], medium: [3, 5], mid: [3, 5], hard: [4, 6], high: [4, 6] };

// One round: DISTINCT correct words to catch (never "vest, vest, vest") + MORE,
// also-distinct, sound-distinct distractors, interleaved into a fair spawn order.
export function buildRocketRunRound(targetGrapheme, { count = 6, difficulty } = {}) {
  const g = String(targetGrapheme || "").toLowerCase();
  const range = LEN_RANGE[String(difficulty || "").toLowerCase()];
  const inRange = w => !range || (w.length >= range[0] && w.length <= range[1]);

  const correctPool = wordsStartingWithTargetSound(g);
  let cp = correctPool.filter(inRange);
  if (cp.length < 3) cp = correctPool;                 // never starve a small sound
  const correct = uniqueSample(cp, count);             // distinct, no cycling/repeats

  const correctSet = new Set(correct);
  const distractorPool = ALL_WORDS.filter(w => !sharesSound(onsetGrapheme(w), g) && !correctSet.has(w));
  let dp = distractorPool.filter(inRange);
  if (dp.length < count) dp = distractorPool;
  const distractors = uniqueSample(dp, count + Math.ceil(count / 2)); // more, all distinct

  const sequence = shuffle([
    ...correct.map(word => ({ word, correct: true })),
    ...distractors.map(word => ({ word, correct: false }))
  ]);
  return { targetGrapheme: g, correct, distractors, sequence, needed: correct.length };
}

export function rocketRunStars(caught, needed, wrongHits) {
  if (!needed) return 0;
  if (caught >= needed && wrongHits === 0) return 3;
  if (caught >= Math.ceil(needed * 0.7)) return 2;
  return caught > 0 ? 1 : 0;
}

export const ROCKET_RUN_LEVELS = 10;

// Order sound targets easiest -> hardest: single consonants < short vowels < digraphs.
export function targetHardness(g) {
  if (/^(sh|ch|th|ng|ck|qu)$/.test(g)) return 30;
  if (/^[aeiou]$/.test(g)) return 20;
  return 10;
}

// A ramped, no-repeat ladder of sound targets for a difficulty (mirrors the
// curriculum framework): easy = easiest sounds, medium = middle, hard = hardest
// incl. digraphs. Returns up to ROCKET_RUN_LEVELS distinct targets, ramped.
export function rocketRunLadder(difficulty) {
  const all = rocketRunTargets().slice().sort((a, b) => targetHardness(a) - targetHardness(b) || a.localeCompare(b));
  const n = all.length;
  const d = String(difficulty || "").toLowerCase();
  const start = (d === "hard" || d === "high") ? Math.max(0, n - ROCKET_RUN_LEVELS)
    : (d === "medium" || d === "mid") ? Math.max(0, Math.min(Math.floor(n * 0.25), n - ROCKET_RUN_LEVELS))
      : 0;
  const out = all.slice(start, start + ROCKET_RUN_LEVELS);
  let lo = start - 1, hi = start + ROCKET_RUN_LEVELS;
  while (out.length < ROCKET_RUN_LEVELS && (lo >= 0 || hi < n)) {
    if (hi < n) { out.push(all[hi]); hi += 1; }
    else if (lo >= 0) { out.unshift(all[lo]); lo -= 1; }
  }
  return out.slice(0, ROCKET_RUN_LEVELS);
}
