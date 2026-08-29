// Builds real, playable rounds for the EL Skills Quest from the EL cycle
// curriculum data. Every round has a spoken cue, real choices, and one
// correct answer - mirroring how the EL skills block is taught:
// hear the sound -> find the sound in words -> read quick words -> build words.
import { LETTER_EXAMPLES, elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { EL_CYCLE_POEMS } from "../../data/elCyclePoems.js";
import { QUEST_STORY_QUESTIONS, VERIFIED_PICTURE_WORDS } from "../../data/generated/questStoryQuestions.generated.js";
import { AUDIO_QUEST_PATHS } from "../../data/generated/audioQuestPaths.generated.js";
import { hasKnownBadWordAudio, isKnownBadAudioPath } from "../../data/knownBadWordAudio.js";
import { getPreferredPhonemeAudioPath } from "../../data/phonemeAudioBank.js";
import {
  getLedaInstructionAudioPath,
  getLedaProductionAudioPath,
  getLedaWordAudioPath
} from "../../data/ledaProductionAudio.js";

const ALL_GRAPHEMES = Object.keys(LETTER_EXAMPLES).filter(g => g.length <= 2 && g !== "qu");

// Graphemes that make the SAME phoneme in this curriculum. A sound-based round
// cues ONE sound, so two letters that both make it would BOTH be correct - they
// must never appear together as choices (c/k both /k/, w/wh both /w/).
const SAME_SOUND_GRAPHEMES = {
  c: ["k"],
  k: ["c"],
  w: ["wh"],
  wh: ["w"]
};
export function sharesSound(a, b) {
  const x = String(a || "").toLowerCase();
  const y = String(b || "").toLowerCase();
  return x === y || (SAME_SOUND_GRAPHEMES[x] || []).includes(y);
}

// The leading grapheme a word actually STARTS with (digraph-aware). Used so
// "which starts with this sound?" only offers words that truly begin with the
// cued sound - LETTER_EXAMPLES lists words that CONTAIN a grapheme (e.g. "teeth"
// for th, "six" for x), which is not the same as starting with it.
const ONSET_DIGRAPHS = ["sh", "ch", "th", "wh"];
// Irregular taught words whose first SOUND differs from their first letters.
// Spelling rules alone would score these as correct for the wrong cue, or as
// fair distractors for the sound they actually start with, so check this
// audited table before the spelling rules. Keep singular forms alongside the
// current live pools so future authored variants inherit the same boundary.
const PHONETIC_ONSETS = {
  cell: "s", cells: "s", cent: "s", center: "s", cents: "s", circle: "s", city: "s",
  europe: "y", unit: "y", use: "y",
  knew: "n", know: "n", known: "n",
  one: "w", once: "w",
  phrase: "f",
  whole: "h", who: "h", whose: "h",
  write: "r", wrong: "r", wrote: "r"
};
export function onsetGrapheme(word) {
  const w = String(word || "").toLowerCase();
  if (PHONETIC_ONSETS[w]) return PHONETIC_ONSETS[w];
  const digraph = ONSET_DIGRAPHS.find(d => w.startsWith(d));
  return digraph || w[0] || "";
}

// Words a child has been TAUGHT by the end of a given cycle - review and
// distractor words must never run ahead of the curriculum.
function taughtHfwThrough(cycleNumber) {
  const words = [];
  for (const cycle of elSkillsBlockCycles) {
    if (!cycle.cycleNumber || cycle.cycleNumber > cycleNumber) continue;
    for (const word of cycle.highFrequencyWords || []) {
      const clean = word.toLowerCase();
      if (!words.includes(clean)) words.push(clean);
    }
  }
  return words;
}

export function shuffleItems(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function firstExisting(paths) {
  // Skip clips verified defective by ear - the chain falls through to the
  // next good recording instead of playing a wrong one.
  return paths.find(path => AUDIO_QUEST_PATHS.has(path) && !isKnownBadAudioPath(path)) || "";
}

// Spoken cue for a grapheme: pure phoneme recordings first, then the
// grapheme bank (digraphs etc.), with the spelling text as speech fallback.
export function graphemeAudioPath(spelling) {
  return getPreferredPhonemeAudioPath(spelling);
}

export function wordAudioPath(word) {
  const slug = String(word || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const ledaPath = getLedaWordAudioPath(word);
  // Words whose only recordings are defective count as having no recording.
  if (hasKnownBadWordAudio(slug) && !ledaPath) return "";
  return firstExisting([ledaPath]);
}

function focusEntries(cycle) {
  if (cycle.focusLetters?.length) {
    // A focus row can bundle several graphemes ("ff ss zz ll" - the fizzle
    // letters). Split them so every station builds real per-sound rounds
    // instead of failing to match "ff ss zz ll" against the word banks.
    return cycle.focusLetters.flatMap(item => {
      const raw = (item.spelling || "").toLowerCase();
      const parts = raw.split(/[\s/,+]+/).filter(part => /^[a-z]{1,3}$/.test(part));
      if (parts.length <= 1) {
        return [{
          grapheme: item.grapheme || item.spelling,
          sound: item.sound || "",
          spelling: raw
        }];
      }
      return parts.map(part => ({
        grapheme: part,
        sound: item.sound || "",
        spelling: part
      }));
    });
  }
  // Review/wrap-up cycles: sample from the letters under review.
  // Entries can be plain strings or {grapheme, spelling} objects.
  return shuffleItems(cycle.reviewLetters || []).slice(0, 4).map(item => {
    const label = typeof item === "string"
      ? item
      : String(item?.spelling || item?.grapheme || "");
    return {
      grapheme: label,
      sound: "",
      spelling: label.replace(/[^a-zA-Z]/g, "").slice(0, label.length > 2 ? 2 : 1).toLowerCase()
    };
  }).filter(entry => entry.spelling);
}

// Distractor letters come from material the child has already met where
// possible, so early cycles never test against never-seen letters.
function taughtGraphemesThrough(cycleNumber) {
  const taught = [];
  for (const cycle of elSkillsBlockCycles) {
    if (!cycle.cycleNumber || cycle.cycleNumber > cycleNumber) continue;
    for (const item of cycle.focusLetters || []) {
      const spelling = (item.spelling || "").toLowerCase();
      const parts = spelling.split(/[\s/,+]+/u).filter(part => /^[a-z]{1,2}$/u.test(part));
      for (const part of parts) {
        if (!taught.includes(part)) taught.push(part);
      }
    }
  }
  return taught;
}

const ADVANCED_PRINT_PATTERNS = [
  "sh", "ch", "th", "wh", "ph", "ck", "ng",
  "ff", "ss", "zz", "ll"
];

function wordUsesTaughtPrint(word = "", cycleNumber = 1) {
  const clean = String(word || "").toLowerCase();
  const taught = new Set(taughtGraphemesThrough(cycleNumber));
  const singleLetters = new Set([...taught].filter(grapheme => grapheme.length === 1));
  if (![...clean].every(letter => singleLetters.has(letter))) return false;
  return ADVANCED_PRINT_PATTERNS.every(pattern => (
    !clean.includes(pattern) || taught.has(pattern)
  ));
}

function distractorGraphemes(correct, count, cycleNumber) {
  // Never offer a letter that makes the SAME sound as the target (c vs k,
  // w vs wh) - the cue is one sound, so both would be correct.
  const taught = cycleNumber
    ? taughtGraphemesThrough(cycleNumber).filter(g => !sharesSound(g, correct))
    : [];
  // A two-choice early round is preferable to introducing an untaught printed
  // letter merely to fill a three-choice layout.
  const pool = taught.length
    ? taught
    : ALL_GRAPHEMES.filter(g => !sharesSound(g, correct));
  return shuffleItems(pool.filter(g => !sharesSound(g, correct))).slice(0, count);
}

// Pattern spellings without their own example list borrow real recorded
// words that contain the pattern, so their rounds always have a word cue.
const PATTERN_EXAMPLES = {
  ang: ["bang", "sang"],
  ing: ["ring", "sing", "king"],
  ong: ["song", "long"],
  ung: ["hung"],
  ff: ["puff", "off"],
  ss: ["miss", "grass"],
  zz: ["buzz"],
  ll: ["ball", "fall", "call", "bell"]
};

function exampleWordsFor(spelling, limit = 4) {
  const own = LETTER_EXAMPLES[spelling] || [];
  const list = own.length ? own : (PATTERN_EXAMPLES[spelling] || []);
  return list.slice(0, limit);
}

const PICTURE_WORDS = new Set(VERIFIED_PICTURE_WORDS);
function hasPicture(word) {
  return PICTURE_WORDS.has(String(word || "").toLowerCase());
}

function pictureWordsFor(spelling, limit = 4) {
  const all = LETTER_EXAMPLES[spelling] || [];
  const withImages = all.filter(hasPicture);
  return (withImages.length ? withImages : all).slice(0, limit);
}

// Station - Letter Spot: match big and small letters. The cue speaks the
// letter's NAME (ay, bee...), matching the "This is big A" prompt.
function letterNameAudioPath(letter) {
  return firstExisting([
    getLedaProductionAudioPath(letter, ["letter_name"])
  ]) || graphemeAudioPath(letter);
}

const SINGLE_LETTERS = ALL_GRAPHEMES.filter(g => g.length === 1);
function buildLetterRounds(cycle) {
  const singles = focusEntries(cycle).filter(entry => entry.spelling.length === 1);
  const rounds = singles.flatMap(entry => {
    const lower = entry.spelling;
    const upper = lower.toUpperCase();
    const taughtOthers = taughtGraphemesThrough(cycle.cycleNumber || 1)
      .filter(grapheme => grapheme.length === 1 && grapheme !== lower);
    const others = shuffleItems(taughtOthers.length
      ? taughtOthers
      : SINGLE_LETTERS.filter(g => g !== lower)).slice(0, 2);
    return [
      {
        type: "letter",
        audio: letterNameAudioPath(lower),
        speechFallback: lower,
        prompt: `This is big ${upper}. Find its small letter.`,
        display: upper,
        choices: shuffleItems([lower, ...others]),
        answer: lower,
        choiceStyle: "letter"
      },
      {
        type: "letter",
        audio: letterNameAudioPath(lower),
        speechFallback: lower,
        prompt: `This is small ${lower}. Find its big letter.`,
        display: lower,
        choices: shuffleItems([upper, ...others.map(g => g.toUpperCase())]),
        answer: upper,
        choiceStyle: "letter"
      }
    ];
  });
  return rounds.length ? rounds : buildSoundRounds(cycle);
}

// Station - Sound Catch: hear the sound, tap the matching letter tile.
function buildSoundRounds(cycle) {
  // Two passes per focus sound with fresh distractors each time. Pattern
  // sounds without a recorded phoneme cue with a real word instead.
  return focusEntries(cycle).flatMap(entry => [0, 1].map(() => {
    const phoneme = graphemeAudioPath(entry.spelling);
    // The word cue must be a word that actually HAS a good recording.
    const exampleWord = shuffleItems(exampleWordsFor(entry.spelling)).find(word => wordAudioPath(word)) || "";
    const wordCue = exampleWord ? wordAudioPath(exampleWord) : "";
    return {
      type: "sound",
      audio: phoneme || wordCue,
      speechFallback: "",
      prompt: phoneme
        ? "Tap the letter that makes this sound."
        : exampleWord
          ? `Listen to the word. Tap the letters you hear in "${exampleWord}".`
          : `Find the letters that say "${entry.grapheme}".`,
      display: "",
      choices: shuffleItems([entry.spelling, ...distractorGraphemes(entry.spelling, 2, cycle.cycleNumber)]),
      answer: entry.spelling,
      choiceStyle: "letter"
    };
  }));
}

// Station - Sound Hunt: which picture starts with the sound?
function buildHuntRounds(cycle) {
  const rounds = focusEntries(cycle)
    // Only words that TRULY start with the cued grapheme can answer a
    // "which starts with this sound?" round. This drops non-initial example
    // words (six/box for x, teeth for th, ball/call for all) and, with the
    // sharesSound filter below, keeps homophones (c/k, w/wh) out of the choices.
    .map(entry => ({
      entry,
      pool: pictureWordsFor(entry.spelling).filter(word => onsetGrapheme(word) === entry.spelling)
    }))
    .filter(({ pool }) => pool.length)
    .flatMap(({ entry, pool }) => {
      const answers = shuffleItems(pool).slice(0, 2);
      return answers.map(answer => {
        const others = shuffleItems(
          ALL_GRAPHEMES
            .filter(g => !sharesSound(g, entry.spelling))
            .flatMap(g => pictureWordsFor(g, 1))
            .filter(word => !sharesSound(onsetGrapheme(word), entry.spelling))
        ).slice(0, 2);
        return {
          type: "hunt",
          audio: graphemeAudioPath(entry.spelling),
          speechFallback: entry.spelling,
          prompt: "Which one starts with this sound?",
          display: "",
          choices: shuffleItems([answer, ...others]),
          answer,
          choiceStyle: "picture"
        };
      });
    });
  // A station must never open empty: if no focus grapheme has picture
  // words (e.g. double-letter patterns), hunt becomes a Sound Catch run.
  return rounds.length ? rounds : buildSoundRounds(cycle);
}

// Station - Quick Words is the parallel high-frequency/sight-word strand.
// These words follow their own EL order and do not wait for every letter or
// spelling inside them to appear in the phonics strand.
function buildQuickWordRounds(cycle) {
  const own = (cycle.highFrequencyWords || []).map(w => w.toLowerCase());
  const taught = taughtHfwThrough(cycle.cycleNumber || 1);
  const earlier = taught.filter(w => !own.includes(w));
  const review = shuffleItems(earlier).slice(0, Math.max(0, 6 - own.length));
  const hfw = [...own, ...review].slice(0, 6);
  // A listen-and-tap round is impossible without a good recording, so only
  // voiced words become targets (unvoiced ones may still appear as choices).
  const voiced = hfw.filter(word => wordAudioPath(word));
  const pool = voiced.length ? voiced : hfw.filter(word => !hasKnownBadWordAudio(word));
  // Early cycles with few taught words: practise each word twice instead.
  const sequence = pool.length >= 4 ? pool : [...pool, ...pool];
  return sequence.map(word => {
    const distractors = shuffleItems([
      ...hfw.filter(item => item !== word),
      ...earlier.filter(item => item !== word && !hfw.includes(item))
    ]).slice(0, Math.min(3, Math.max(1, hfw.length - 1 + earlier.length)));
    return {
      type: "quick",
      audio: wordAudioPath(word),
      speechFallback: word,
      prompt: "Listen. Find the whole word. Tap it.",
      support: "Learn this high-frequency word as its own word.",
      display: "",
      choices: shuffleItems([word, ...distractors]),
      answer: word,
      choiceStyle: "word"
    };
  });
}

// Station - Word Build is phonics/encoding practice. A high-frequency word may
// appear here only when its print also uses code taught through this cycle; the
// dedicated Quick Words station remains free to teach it earlier.
function buildWordBuildRounds(cycle) {
  const pool = [
    ...focusEntries(cycle).flatMap(entry => exampleWordsFor(entry.spelling)),
    ...(cycle.highFrequencyWords || []).map(word => String(word || "").toLowerCase()),
    ...Object.values(LETTER_EXAMPLES).flat(),
    ...taughtHfwThrough(cycle.cycleNumber || 1)
  ]
    // Only clean 2-5 letter words: a single letter or a stray space would
    // render the wrong number of boxes and make the round impossible to pass.
    // And only words with a real recording - the round says the word aloud.
    .filter(word => /^[a-z]{2,5}$/.test(word) && wordAudioPath(word));
  // Building print is decoding/encoding practice, so it never falls forward
  // to untaught letters merely to fill a station. An empty build station falls
  // back to a sound round in buildStationRounds().
  const candidates = pool.filter(word => wordUsesTaughtPrint(word, cycle.cycleNumber || 1));
  const words = shuffleItems([...new Set(candidates)]).slice(0, 4);
  return words.map(word => ({
    type: "build",
    audio: wordAudioPath(word),
    speechFallback: word,
    prompt: "Build the word you hear.",
    display: "",
    word,
    choiceStyle: "build"
  }));
}

// Station - Word Play: change the first sound, take it away, join words.
const COMPOUND_WORDS = [
  ["sun", "set"], ["star", "fish"], ["cup", "cake"], ["pan", "cake"],
  ["back", "pack"], ["pop", "corn"], ["bed", "time"], ["sand", "box"],
  ["rain", "coat"], ["dog", "house"]
];

function uniqueChoices(items) {
  return [...new Set(items)];
}

function buildWordPlayRounds(cycle) {
  const rounds = [];
  const focusWords = uniqueChoices(
    [
      ...focusEntries(cycle).flatMap(entry => exampleWordsFor(entry.spelling)),
      ...(cycle.highFrequencyWords || []).map(word => String(word || "").toLowerCase())
    ]
  ).filter(word => /^[a-z]{2,5}$/.test(word) && wordUsesTaughtPrint(word, cycle.cycleNumber || 1));
  const allWords = uniqueChoices(Object.values(LETTER_EXAMPLES).flat())
    .filter(word => (
      /^[a-z]{2,5}$/.test(word)
      && wordUsesTaughtPrint(word, cycle.cycleNumber || 1)
    ));

  // Change the first sound: same rime, different onset.
  for (const word of shuffleItems(focusWords)) {
    const partner = allWords.find(other =>
      other !== word && other.slice(1) === word.slice(1) && other[0] !== word[0]);
    if (!partner || !wordAudioPath(partner)) continue;
    // The decoy must NOT share the target's rime, or it would be a second
    // valid "change the first sound" answer (e.g. ring -> sing AND king).
    const decoy = shuffleItems(
      allWords.filter(o => o !== word && o !== partner && o.slice(1) !== word.slice(1))
    )[0];
    const choices = uniqueChoices([partner, word, decoy]);
    if (choices.length < 3) continue;
    rounds.push({
      type: "play",
      audio: wordAudioPath(word),
      speechFallback: word,
      prompt: `Change the first sound of "${word}". Which new word can you make?`,
      display: word,
      choices: shuffleItems(choices),
      answer: partner,
      choiceStyle: "word"
    });
    if (rounds.length >= 2) break;
  }

  // Take the first sound away.
  for (const word of shuffleItems(focusWords)) {
    const rest = word.slice(1);
    if (rest.length < 2) continue;
    const choices = uniqueChoices([rest, word.slice(0, 2), word[0] + word.slice(-1)]);
    if (choices.length < 3) continue;
    rounds.push({
      type: "play",
      audio: wordAudioPath(word),
      speechFallback: word,
      prompt: `Take the first sound away from "${word}". What is left?`,
      display: word,
      choices: shuffleItems(choices),
      answer: rest,
      choiceStyle: "word"
    });
    break;
  }

  // Join two small words into one big compound word.
  const pair = shuffleItems(COMPOUND_WORDS).find(([a, b]) => (
    wordAudioPath(a + b)
    && wordUsesTaughtPrint(a, cycle.cycleNumber || 1)
    && wordUsesTaughtPrint(b, cycle.cycleNumber || 1)
    && wordUsesTaughtPrint(a + b, cycle.cycleNumber || 1)
  ));
  if (pair) {
    const full = pair[0] + pair[1];
    const decoys = shuffleItems(
      COMPOUND_WORDS.filter(p => p !== pair).map(([a, b]) => a + b)
    ).slice(0, 2);
    rounds.push({
      type: "play",
      audio: wordAudioPath(full),
      speechFallback: full,
      prompt: `"${pair[0]}" and "${pair[1]}" join to make one big word. Which is it?`,
      display: `${pair[0]} + ${pair[1]}`,
      choices: shuffleItems([full, ...decoys]),
      answer: full,
      choiceStyle: "word"
    });
  }

  return rounds.length ? rounds : buildQuickWordRounds(cycle);
}

// Station - Poem Time: read the cycle poem, then find words inside it.
function buildPoemRounds(cycle) {
  const poem = EL_CYCLE_POEMS.find(p => p.cycle === cycle.cycleNumber);
  if (!poem) return buildQuickWordRounds(cycle);
  const text = poem.lines.join("\n");
  const poemWords = uniqueChoices(
    text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(w => w.length > 1)
  );
  const poemAudio = getLedaInstructionAudioPath(text);
  return poem.findWords.map(word => ({
    type: "poem",
    audio: poemAudio || wordAudioPath(word),
    speechFallback: word,
    prompt: `Read the poem, then tap the word "${word}".`,
    display: text,
    poem: true,
    poemTitle: poem.title,
    choices: shuffleItems([word, ...shuffleItems(poemWords.filter(w => w !== word)).slice(0, 3)]),
    answer: word,
    choiceStyle: "word"
  }));
}

// Station - Story Stop: cover-reading riddles from the world's own books.
// Each round SHOWS the book's cover with its printed title, so the child
// answers by reading the title in front of them - no prior reading assumed.
function buildStoryRounds(cycle) {
  const n = cycle.cycleNumber || 1;
  const world = n >= 19 ? "moonwood" : n >= 10 ? "dino" : "meadow";
  const bank = QUEST_STORY_QUESTIONS[world];
  if (!bank?.questions?.length) return buildQuickWordRounds(cycle);
  const picks = shuffleItems(bank.questions).slice(0, 4);
  return picks.map(item => {
    const decoys = shuffleItems(bank.names.filter(name => name !== item.answer)).slice(0, 2);
    return {
      type: "story",
      audio: "",
      speechFallback: "",
      prompt: item.prompt,
      display: "",
      cover: item.cover || "",
      bookTitle: item.title || "",
      choices: shuffleItems([item.answer, ...decoys]),
      answer: item.answer,
      choiceStyle: "word"
    };
  });
}

// Station - Letter Trace: write the focus letters with a finger.
function buildTraceRounds(cycle) {
  const rounds = focusEntries(cycle)
    .filter(entry => entry.spelling.length <= 2)
    .map(entry => ({
      type: "trace",
      audio: graphemeAudioPath(entry.spelling),
      speechFallback: entry.spelling,
      prompt: "Trace the letter with your finger.",
      display: "",
      letter: entry.spelling.length === 1
        ? `${entry.spelling.toUpperCase()}${entry.spelling}`
        : entry.spelling,
      choiceStyle: "trace"
    }));
  return rounds.length ? rounds : buildLetterRounds(cycle);
}

// ── Fluency & Patterns games (cycles 25-27: no new letters) ──────────────────
// These wrap-up cycles consolidate reading fluency, spelling patterns, sight
// words and poems instead of teaching new letter-sounds, so they get their own
// set of games. Every word is decodable / already taught by this point.

// Curated spelling-pattern families. The child sorts by the PATTERN, not a sound.
const PATTERN_FAMILIES = [
  { label: "end with y", members: ["by", "my", "why", "try", "fly", "sky", "cry", "dry"], decoys: ["sun", "map", "run", "top", "bed", "net"] },
  { label: "end with -ay", members: ["day", "say", "may", "play", "stay", "way"], decoys: ["dog", "sit", "cup", "ten", "mud", "log"] },
  { label: "end with -ll", members: ["ball", "fall", "call", "tall", "bell", "fill"], decoys: ["bat", "mop", "sun", "net", "rug", "pin"] },
  { label: "have -ng", members: ["ring", "king", "song", "bang", "hang", "long"], decoys: ["rat", "pig", "cup", "red", "mud", "tap"] },
  { label: "start with sh", members: ["ship", "shop", "shed", "shell", "shut", "shin"], decoys: ["pig", "top", "run", "bed", "map", "sun"] },
  { label: "end with -ck", members: ["duck", "sock", "kick", "lock", "back", "pick"], decoys: ["dog", "sun", "map", "ten", "bus", "fan"] }
];

// Each fluency cycle leads with the pattern its OWN sight words follow
// (25: again/day/say -> -ay; 26: by/my/why/try -> -y; 27: mixed review),
// then mixes in review families for variety.
const CYCLE_PATTERN_LEADS = {
  25: ["end with -ay", "end with -ll"],
  26: ["end with y", "have -ng"],
  27: ["end with -ck", "start with sh"]
};

function patternFamiliesForCycle(cycle) {
  const leads = (CYCLE_PATTERN_LEADS[cycle?.cycleNumber] || [])
    .map(label => PATTERN_FAMILIES.find(family => family.label === label))
    .filter(Boolean);
  const rest = shuffleItems(PATTERN_FAMILIES.filter(family => !leads.includes(family)));
  return [...leads, ...rest];
}

// Station - Pattern Power: tap EVERY word that fits the pattern (multi-select).
function buildPatternPowerRounds(cycle) {
  return patternFamiliesForCycle(cycle).slice(0, 4).map(family => {
    const fits = shuffleItems(family.members).slice(0, 3);
    const decoys = shuffleItems(family.decoys).slice(0, 3);
    const items = shuffleItems([
      ...fits.map(word => ({ word, fits: true })),
      ...decoys.map(word => ({ word, fits: false }))
    ]);
    return {
      type: "pattern",
      audio: "",
      speechFallback: "",
      prompt: `Tap all the words that ${family.label}.`,
      patternLabel: family.label,
      items,
      choiceStyle: "pattern"
    };
  });
}

// Curated chains where each step changes exactly one letter / sound.
const WORD_CHAINS = [
  ["sat", "sit", "sip", "lip"],
  ["man", "mat", "map", "cap"],
  ["pig", "pin", "pan", "pat"],
  ["hot", "hop", "top", "tap"],
  ["bed", "bad", "bag", "big"],
  ["run", "ran", "rat", "sat"]
];

function changedSlot(from, to) {
  for (let i = 0; i < Math.min(from.length, to.length); i += 1) {
    if (from[i] !== to[i]) return i;
  }
  return -1;
}

// Station - Word Chains: change one sound to turn one word into the next.
// Each cycle draws from its own half of the chain bank so cycles differ.
function buildWordChainRounds(cycle) {
  const n = Number(cycle?.cycleNumber) || 25;
  const offset = ((n - 25) * 2) % WORD_CHAINS.length;
  const pool = [...WORD_CHAINS.slice(offset), ...WORD_CHAINS.slice(0, offset)].slice(0, 4);
  const rounds = [];
  for (const chain of shuffleItems(pool).slice(0, 2)) {
    for (let i = 0; i < chain.length - 1; i += 1) {
      const from = chain[i];
      const to = chain[i + 1];
      const slot = changedSlot(from, to);
      if (slot < 0 || from.length !== to.length) continue;
      const answer = to[slot];
      const distractors = shuffleItems("aeioubdgmnpst".split("")
        .filter(l => l !== answer && l !== from[slot])).slice(0, 2);
      rounds.push({
        type: "chain",
        audio: wordAudioPath(to),
        speechFallback: to,
        prompt: `Change "${from}" into "${to}". Tap the missing letter.`,
        display: to.split("").map((ch, idx) => (idx === slot ? "_" : ch)).join(" "),
        choices: shuffleItems([answer, ...distractors]),
        answer,
        choiceStyle: "letter"
      });
    }
  }
  return rounds;
}

// Station - Speedy Words: read the sight word and tap it fast (gentle timer).
function buildSpeedyWordRounds(cycle) {
  return buildQuickWordRounds(cycle).map(round => ({
    ...round,
    type: "speed",
    prompt: "Read the whole word, then tap it.",
    support: "Use the sounds and spelling, not its shape.",
    display: round.answer
  }));
}

// Station - Spell It: hear (or read) a sight word and build its spelling.
function buildSpellRounds(cycle) {
  const words = uniqueChoices((cycle.highFrequencyWords || []).map(w => w.toLowerCase()))
    .filter(word => /^[a-z]{2,6}$/.test(word));
  if (!words.length) return buildWordBuildRounds(cycle);
  return words.slice(0, 5).map(word => {
    const audio = wordAudioPath(word);
    return {
      type: "build",
      audio,
      speechFallback: word,
      prompt: audio ? "Spell the word you hear." : "Spell this word.",
      display: audio ? "" : word,
      word,
      choiceStyle: "build"
    };
  });
}

const STANDARD_STATIONS = [
  { id: "letters", title: "Letter Spot", subtitle: "Big and small letters", icon: "🔤", build: buildLetterRounds },
  { id: "sounds", title: "Sound Catch", subtitle: "Hear it, find it", icon: "👂", build: buildSoundRounds },
  { id: "hunt", title: "Sound Hunt", subtitle: "Pictures and first sounds", icon: "🔎", build: buildHuntRounds },
  { id: "quick", title: "Quick Words", subtitle: "Words you just know", icon: "⚡", build: buildQuickWordRounds },
  { id: "build", title: "Word Build", subtitle: "Make it yourself", icon: "🧱", build: buildWordBuildRounds },
  { id: "play", title: "Word Play", subtitle: "Change it, shrink it, join it", icon: "🎲", build: buildWordPlayRounds },
  { id: "poem", title: "Poem Time", subtitle: "Read it, find the words", icon: "📜", build: buildPoemRounds },
  { id: "story", title: "Story Stop", subtitle: "Read the cover, solve the riddle", icon: "📚", build: buildStoryRounds },
  { id: "trace", title: "Letter Trace", subtitle: "Write it with your finger", icon: "✏️", build: buildTraceRounds },
  { id: "check", title: "Cycle Check", subtitle: "Show what you know", icon: "⭐", build: null }
];

// Cycles 25-27 swap the letter-sound games for fluency, pattern and poem games.
const FLUENCY_STATIONS = [
  { id: "pattern", title: "Pattern Power", subtitle: "Sort the word patterns", icon: "🧩", build: buildPatternPowerRounds },
  { id: "chain", title: "Word Chains", subtitle: "Change one sound", icon: "🔗", build: buildWordChainRounds },
  { id: "speed", title: "Speedy Words", subtitle: "Read them fast", icon: "🚀", build: buildSpeedyWordRounds },
  { id: "poem", title: "Poem Play", subtitle: "Read it, find the words", icon: "📜", build: buildPoemRounds },
  { id: "spell", title: "Spell It", subtitle: "Build the word", icon: "🐝", build: buildSpellRounds },
  { id: "check", title: "Cycle Check", subtitle: "Show what you know", icon: "⭐", build: null }
];

// Backwards-compatible default export (the standard letter-sound set).
export const STATIONS = STANDARD_STATIONS;

// Cycles 25+ have no new focus letters - they are fluency / pattern wrap-ups.
export function isFluencyCycle(cycle) {
  return (cycle?.cycleNumber || 0) >= 25;
}

export function stationsForCycle(cycle) {
  return isFluencyCycle(cycle) ? FLUENCY_STATIONS : STANDARD_STATIONS;
}

export function buildStationRounds(cycle, stationId) {
  if (stationId === "check") {
    const everything = isFluencyCycle(cycle)
      ? [
          ...buildPatternPowerRounds(cycle),
          ...buildWordChainRounds(cycle),
          ...buildSpeedyWordRounds(cycle),
          ...buildSpellRounds(cycle),
          ...buildPoemRounds(cycle)
        ]
      : [
          ...buildLetterRounds(cycle),
          ...buildSoundRounds(cycle),
          ...buildHuntRounds(cycle),
          ...buildQuickWordRounds(cycle),
          ...buildWordBuildRounds(cycle),
          ...buildWordPlayRounds(cycle)
        ];
    return shuffleItems(everything).slice(0, 10);
  }
  const station = [...STANDARD_STATIONS, ...FLUENCY_STATIONS].find(item => item.id === stationId);
  const rounds = station?.build ? station.build(cycle) : [];
  if (rounds.length) return rounds;
  return isFluencyCycle(cycle) ? buildSpeedyWordRounds(cycle) : buildSoundRounds(cycle);
}

export function starsForAccuracy(correct, total, wrongs) {
  if (!total) return 0;
  if (correct >= total && wrongs === 0) return 3;
  if (correct >= Math.ceil(total * 0.7)) return 2;
  return correct > 0 ? 1 : 0;
}
