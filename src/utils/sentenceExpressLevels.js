// SENTENCE EXPRESS - pure level engine (no DOM, no React).
//
// A "train" is one sentence with generated FAULTS the child must fix in the
// shunt yard: order (scrambled carriages), engine (lowercase first word),
// caboose (missing end mark), rusty (a wrong word to swap at the repair
// shed), gap (a missing word to load from crates). Faults are generated FROM
// a correct curated sentence, so the fix is always recoverable and unique.
// Deterministic: same difficulty+level => same trains (seeded PRNG), like
// rocketRunRounds/wordBridgeLevels.

export const DIFFICULTIES = ["easy", "medium", "hard"];
export const LEVELS_PER_LINE = 10;
export const TRAINS_PER_LEVEL = 3;

// ── Curated sentence banks ───────────────────────────────────────────────────
// K-level vocabulary, gold-voice-friendly words. endMark drives the caboose.
// 30 per difficulty: 10 levels x 3 trains, nothing repeats within a line.
const BANK = {
  easy: [
    ["I can run", "."], ["We can play", "."], ["The cat sat", "."],
    ["I see a dog", "."], ["The sun is up", "."], ["I like to hop", "."],
    ["The dog is big", "."], ["We go to bed", "."], ["I can sit", "."],
    ["The pig is pink", "."], ["I can see mum", "."], ["The bus is red", "."],
    ["We like jam", "."], ["The hen sat", "."], ["I had fun", "."],
    ["The frog can hop", "."], ["I see the moon", "."], ["We run fast", "."],
    ["The fox is red", "."], ["I like my hat", "."], ["The duck can swim", "."],
    ["We see a star", "."], ["My cup is big", "."], ["The bug is small", "."],
    ["I sit on a mat", "."], ["We dig in mud", "."], ["The bee can buzz", "."],
    ["I hug my dog", "."], ["The map is old", "."], ["We nap at two", "."]
  ],
  medium: [
    ["Can you see the ship", "?"], ["The dog can run fast", "."],
    ["We like to play games", "."], ["Is the cat on the bed", "?"],
    ["The red fox can jump", "."], ["I see six little hens", "."],
    ["Can we go to the park", "?"], ["The duck swims in the pond", "."],
    ["My dad has a big van", "."], ["Is the sun hot today", "?"],
    ["The frog sat on a log", "."], ["We ran to the big tree", "."],
    ["Can the fish swim fast", "?"], ["The hen has ten eggs", "."],
    ["I like jam on my bread", "."], ["Is that your red hat", "?"],
    ["The bus stops at the shop", "."], ["We can see the stars", "."],
    ["My cat sits on the rug", "."], ["Can you hop like a frog", "?"],
    ["The crab hid in the mud", "."], ["We swim in the blue sea", "."],
    ["Is the moon up yet", "?"], ["The frogs play in the mud", "."],
    ["I can spell my name", "."], ["The ship is very big", "."],
    ["Can she see the nest", "?"], ["The king has a gold ring", "."],
    ["We sit under the big tree", "."], ["My sock has a hole", "."]
  ],
  hard: [
    ["The little dog runs to the park", "."], ["We can see the ship at sea", "."],
    ["What a fast red fox that is", "!"], ["Can you see the owl in the tree", "?"],
    ["The duck and the frog can swim", "."], ["My best friend likes to play games", "."],
    ["The king kept his ring in a box", "."], ["We ran and ran up the big hill", "."],
    ["Is the black cat under the bed", "?"], ["The crab dug a hole in the mud", "."],
    ["What a big splash the fish made", "!"], ["We like jam and fresh bread", "."],
    ["Can the little hen see her eggs", "?"], ["We sat by the pond at sunset", "."],
    ["The strong wind bent the old tree", "."], ["My mum sang a song to the baby", "."],
    ["What a mess the dog made today", "!"], ["The bus and the van stop at ten", "."],
    ["Did the frog jump over the log", "?"], ["We must not run near the pond", "."],
    ["The star shone over the dark hill", "."], ["Can we camp by the pond tonight", "?"],
    ["The king made a strong steel pot", "."], ["What a big old clock that is", "!"],
    ["The children swim in the cool sea", "."], ["Did you spot the nest in the tree", "?"],
    ["The moth slept on the soft moss", "."], ["We fed the hens at six today", "."],
    ["What a long trip the ants took", "!"], ["The small mouse crept past the cat", "."]
  ]
};

// Wrong-word bank for RUSTY swaps and GAP distractors: same broad class,
// clearly wrong in context, real K-readable words. Keyed by the word they
// replace; fallback pools by rough part of speech.
const CONFUSION = {
  run: ["nap", "sit"], play: ["dig", "nap"], see: ["hug", "pat"],
  big: ["wet", "sad"], red: ["wet", "old"], hop: ["sip", "dig"],
  swim: ["hop", "clap"], jump: ["clap", "nap"], fast: ["wet", "sad"],
  sat: ["ran", "hid"], like: ["dig", "pat"], stops: ["digs", "sits"],
  runs: ["digs", "sits"], hot: ["wet", "old"], small: ["wet", "old"],
  gold: ["wet", "old"], strong: ["wet", "sad"], little: ["wet", "old"]
};
const FALLBACK_VERBS = ["nap", "dig", "clap", "sip", "pat", "sit"];
const FALLBACK_ADJ = ["wet", "old", "sad", "damp"];
const FALLBACK_NOUNS = ["mop", "pot", "log", "bin", "cot"];

// ── Seeded PRNG (mulberry32, same idiom as the other game builders) ─────────
function seedFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled(list, rand) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Which faults each level teaches (mirrors the design-doc ramp table).
export function faultsForLevel(difficulty, level) {
  const table = {
    easy: [["order"], ["order"], ["order", "engine"], ["order", "engine"],
      ["order", "caboose"], ["order", "caboose"], ["order", "gap"],
      ["order", "gap"], ["order", "engine", "caboose"], ["order", "engine", "caboose", "gap"]],
    medium: [["order", "engine"], ["order", "engine"], ["order", "caboose"], ["order", "caboose"],
      ["order", "rusty"], ["order", "rusty"], ["order", "gap"], ["order", "gap"],
      ["order", "rusty", "caboose"], ["order", "rusty", "gap", "engine"]],
    hard: [["order", "engine", "caboose"], ["order", "engine", "caboose"],
      ["order", "rusty"], ["order", "rusty"], ["order", "gap"], ["order", "gap"],
      ["order", "rusty", "gap"], ["order", "rusty", "gap"],
      ["order", "rusty", "caboose", "engine"], ["order", "rusty", "gap", "engine", "caboose"]]
  };
  const rows = table[difficulty] || table.easy;
  return rows[Math.max(0, Math.min(LEVELS_PER_LINE - 1, level))];
}

function looksLikeVerb(word) { return /(s|ed|ing)$/.test(word) || FALLBACK_VERBS.includes(word) || CONFUSION[word]; }

function wrongWordsFor(word, sentenceWords, rand) {
  const base = CONFUSION[word.toLowerCase()]
    || (looksLikeVerb(word.toLowerCase()) ? FALLBACK_VERBS : /[aeiou]/.test(word) && word.length <= 4 ? FALLBACK_ADJ : FALLBACK_NOUNS);
  const clean = base.filter(w => !sentenceWords.includes(w) && w !== word.toLowerCase());
  return shuffled(clean, rand).slice(0, 2);
}

// Pick a swappable content word (never the first word, never 1-2 letter glue).
function pickContentIndex(words, rand, exclude = -1) {
  const candidates = words
    .map((w, i) => ({ w: w.toLowerCase(), i }))
    .filter(({ w, i }) => i > 0 && i !== exclude && w.length >= 3 && !["the", "and", "his", "her", "you"].includes(w));
  if (!candidates.length) return words.length - 1;
  return candidates[Math.floor(rand() * candidates.length)].i;
}

export function buildTrain(difficulty, level, trainIndex) {
  const bank = BANK[difficulty] || BANK.easy;
  // Rotate through the bank so no sentence repeats anywhere in a line:
  // level L train T -> bank[(L * TRAINS_PER_LEVEL + T)].
  const pick = bank[(level * TRAINS_PER_LEVEL + trainIndex) % bank.length];
  const [text, endMark] = pick;
  const words = text.split(" ");
  const rand = mulberry32(seedFrom(`${difficulty}:${level}:${trainIndex}:${text}`));
  const faults = faultsForLevel(difficulty, level);

  const train = {
    id: `${difficulty}-l${level}-t${trainIndex}`,
    words,                       // correct order, first word capitalised as authored
    endMark,                     // the one true caboose
    faults,
    // Sidings: the coupling order the child must rebuild, scrambled.
    sidingOrder: null,
    engine: null,                // { options: [correct, wrong] } when engine fault
    caboose: null,               // { options: [".","?","!"] } when caboose fault
    rusty: null,                 // { index, wrong, options } when rusty fault
    gap: null                    // { index, options } when gap fault
  };

  // ORDER: scramble siding order; guarantee it differs from the solution.
  let order = words.map((_w, i) => i);
  if (faults.includes("order") && words.length > 2) {
    let tries = 0;
    do { order = shuffled(order, rand); tries += 1; } while (tries < 10 && order.every((v, i) => v === i));
    if (order.every((v, i) => v === i)) [order[0], order[1]] = [order[1], order[0]];
  }
  train.sidingOrder = order;

  if (faults.includes("engine")) {
    const first = words[0];
    train.engine = { options: shuffled([first, first.toLowerCase()], rand), correct: first };
  }
  if (faults.includes("caboose")) {
    train.caboose = { options: shuffled([".", "?", "!"], rand), correct: endMark };
  }
  if (faults.includes("rusty")) {
    const index = pickContentIndex(words, rand);
    const wrongs = wrongWordsFor(words[index], words.map(w => w.toLowerCase()), rand);
    train.rusty = {
      index,
      wrong: wrongs[0] || "mop",
      options: shuffled([words[index], ...(wrongs.length ? wrongs : ["mop", "bin"])], rand),
      correct: words[index]
    };
  }
  if (faults.includes("gap")) {
    const index = pickContentIndex(words, rand, train.rusty?.index ?? -1);
    const wrongs = wrongWordsFor(words[index], words.map(w => w.toLowerCase()), rand);
    train.gap = {
      index,
      options: shuffled([words[index], ...(wrongs.length ? wrongs : ["log", "pot"])], rand),
      correct: words[index]
    };
  }
  return train;
}

export function buildLevel(difficulty, level) {
  const trains = Array.from({ length: TRAINS_PER_LEVEL }, (_u, t) => buildTrain(difficulty, level, t));
  return {
    difficulty,
    level,
    trains,
    isGoldRun: level === LEVELS_PER_LINE - 1,
    // Coupling targets for the star rubric: every carriage + every fault choice.
    totalTargets: trains.reduce((sum, tr) =>
      sum + tr.words.length + (tr.engine ? 1 : 0) + (tr.caboose ? 1 : 0) + (tr.rusty ? 1 : 0) + (tr.gap ? 1 : 0), 0)
  };
}

export function buildLine(difficulty) {
  return Array.from({ length: LEVELS_PER_LINE }, (_u, l) => buildLevel(difficulty, l));
}

// Every word the engine can show (for the audio-coverage test).
export function allBankWords() {
  const words = new Set();
  for (const diff of DIFFICULTIES) {
    for (const [text] of BANK[diff]) text.split(" ").forEach(w => words.add(w.toLowerCase()));
  }
  [...FALLBACK_VERBS, ...FALLBACK_ADJ, ...FALLBACK_NOUNS].forEach(w => words.add(w));
  Object.entries(CONFUSION).forEach(([k, v]) => { words.add(k); v.forEach(w => words.add(w)); });
  return [...words];
}

export const WORLD_BY_DIFFICULTY = { easy: "meadow", medium: "dino", hard: "moonwood" };
