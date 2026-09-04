// Builds real, playable rounds for the EL Skills Quest from the EL cycle
// curriculum data. Every returned round declares its literacy construct,
// mechanic-specific data, and every response that the prompt makes valid:
// hear the sound -> find the sound in words -> read quick words -> build words.
import { LETTER_EXAMPLES, elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { EL_CYCLE_POEMS } from "../../data/elCyclePoems.js";
import { VERIFIED_PICTURE_WORDS } from "../../data/generated/questStoryQuestions.generated.js";
import { AUDIO_QUEST_PATHS } from "../../data/generated/audioQuestPaths.generated.js";
import { hasKnownBadWordAudio, isKnownBadAudioPath } from "../../data/knownBadWordAudio.js";
import { getPreferredPhonemeAudioPath } from "../../data/phonemeAudioBank.js";
import {
  getLedaInstructionAudioPath,
  getLedaProductionAudioPath,
  getLedaWordAudioPath
} from "../../data/ledaProductionAudio.js";
import { constrainedIndexOrder, segmentTaughtGraphemes } from "./adventureRoundModel.js";

export { ADVENTURE_MECHANIC_IDS } from "./adventureRoundModel.js";

const ALL_GRAPHEMES = Object.keys(LETTER_EXAMPLES).filter(g => g.length <= 2 && g !== "qu");

// Graphemes that make the SAME phoneme in this curriculum. A sound-based round
// cues ONE sound, so two spellings that both make it must be accepted together
// whenever they appear (c/k, w/wh, and the final doubled spellings).
const SAME_SOUND_GROUPS = [
  ["c", "k"],
  ["w", "wh"],
  ["f", "ff"],
  ["s", "ss"],
  ["z", "zz"],
  ["l", "ll"]
];
export function sharesSound(a, b) {
  const x = String(a || "").toLowerCase();
  const y = String(b || "").toLowerCase();
  return x === y || SAME_SOUND_GROUPS.some(group => group.includes(x) && group.includes(y));
}

function acceptedSoundSpellings(target, cycleNumber) {
  const taught = taughtGraphemesThrough(cycleNumber);
  return uniqueChoices([target, ...taught.filter(grapheme => sharesSound(grapheme, target))]);
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

const ALL_HIGH_FREQUENCY_WORDS = new Set(
  elSkillsBlockCycles
    .flatMap(cycle => cycle.highFrequencyWords || [])
    .map(word => String(word).toLowerCase())
);

function orthographicEditDistance(left, right) {
  const a = String(left || "").toLowerCase();
  const b = String(right || "").toLowerCase();
  const rows = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let index = 0; index <= a.length; index += 1) rows[index][0] = index;
  for (let index = 0; index <= b.length; index += 1) rows[0][index] = index;
  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1)
      );
    }
  }
  return rows[a.length][b.length];
}

function closeSpellingDistractors(target, authorisedWords, count = 3) {
  const word = String(target || "").toLowerCase();
  const authorised = uniqueChoices(authorisedWords.map(item => String(item || "").toLowerCase()));
  const authorisedSet = new Set(authorised);
  const alphabet = [...new Set(authorised.flatMap(item => [...item]))].sort();
  const candidates = [];
  const add = candidate => {
    const spelling = String(candidate || "").toLowerCase();
    if (
      !/^[a-z]+$/u.test(spelling)
      || spelling === word
      || candidates.includes(spelling)
      || orthographicEditDistance(spelling, word) !== 1
      || [...spelling].some(letter => !alphabet.includes(letter))
      || (ALL_HIGH_FREQUENCY_WORDS.has(spelling) && !authorisedSet.has(spelling))
    ) return;
    candidates.push(spelling);
  };

  authorised
    .filter(candidate => candidate !== word)
    .sort((left, right) => left.localeCompare(right))
    .forEach(add);
  if (word.length > 1) {
    for (let index = 0; index < word.length; index += 1) {
      add(`${word.slice(0, index)}${word.slice(index + 1)}`);
    }
  }
  for (let index = 0; index < word.length; index += 1) {
    for (const letter of alphabet) {
      add(`${word.slice(0, index)}${letter}${word.slice(index + 1)}`);
    }
  }
  for (let index = 0; index <= word.length; index += 1) {
    for (const letter of alphabet) {
      add(`${word.slice(0, index)}${letter}${word.slice(index)}`);
    }
  }
  return candidates.slice(0, count);
}

let activeShuffleRandom = null;

function seededRandom(seedText) {
  let seed = 2166136261;
  for (const character of String(seedText || "")) {
    seed ^= character.codePointAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function withShuffleSeed(seed, build) {
  if (!seed) return build();
  const previous = activeShuffleRandom;
  activeShuffleRandom = seededRandom(seed);
  try {
    return build();
  } finally {
    activeShuffleRandom = previous;
  }
}

export function shuffleItems(items) {
  const copy = [...items];
  const random = activeShuffleRandom || Math.random;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
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

// Code Spot uses an explicit authored inventory. Sort and transfer words are
// separate so the transfer is always novel, and every candidate still has to
// pass the cycle's taught-print boundary before a round is eligible.
const CODE_SPOT_WORD_INVENTORY = Object.freeze({
  sh: { authorizedFromCycle: 15, sort: ["ship", "shop", "shut"], transfer: [{ word: "shin", fits: true }, { word: "fin", fits: false }] },
  ch: { authorizedFromCycle: 15, sort: ["chip", "chin", "chop"], transfer: [{ word: "chat", fits: true }, { word: "map", fits: false }] },
  th: { authorizedFromCycle: 15, sort: ["thumb", "thin", "that"], transfer: [{ word: "then", fits: true }, { word: "ship", fits: false }] },
  wh: { authorizedFromCycle: 21, sort: ["what", "when", "whisk"], transfer: [{ word: "whip", fits: true }, { word: "fin", fits: false }] },
  nk: { authorizedFromCycle: 22, sort: ["sink", "bank", "pink"], transfer: [{ word: "wink", fits: true }, { word: "ship", fits: false }] },
  ng: { authorizedFromCycle: 23, sort: ["ring", "sing", "song"], transfer: [{ word: "long", fits: true }, { word: "ship", fits: false }] },
  ang: { authorizedFromCycle: 23, sort: ["bang", "sang"], transfer: [{ word: "hang", fits: true }, { word: "sing", fits: false }] },
  ing: { authorizedFromCycle: 23, sort: ["ring", "sing", "king"], transfer: [{ word: "wing", fits: true }, { word: "bang", fits: false }] },
  ong: { authorizedFromCycle: 23, sort: ["song", "long"], transfer: [{ word: "gong", fits: true }, { word: "sing", fits: false }] },
  ung: { authorizedFromCycle: 23, sort: ["hung", "sung"], transfer: [{ word: "lung", fits: true }, { word: "song", fits: false }] },
  ff: { authorizedFromCycle: 24, sort: ["puff", "off"], transfer: [{ word: "huff", fits: true }, { word: "miss", fits: false }] },
  ss: { authorizedFromCycle: 24, sort: ["miss", "grass"], transfer: [{ word: "kiss", fits: true }, { word: "puff", fits: false }] },
  zz: { authorizedFromCycle: 24, sort: ["buzz", "fizz"], transfer: [{ word: "jazz", fits: true }, { word: "bell", fits: false }] },
  ll: { authorizedFromCycle: 24, sort: ["ball", "fall", "call"], transfer: [{ word: "bell", fits: true }, { word: "buzz", fits: false }] }
});

const CODE_SPOT_DECOY_WORDS = Object.freeze([
  "map", "sun", "dog", "bed", "run", "top", "pig", "cat", "jam", "fox"
]);

function choosePatternTransfer(transferCandidates, items) {
  const sortedWords = new Set(items.map(item => item.word));
  const candidates = transferCandidates.filter(candidate => (
    candidate?.word
    && typeof candidate.fits === "boolean"
    && !sortedWords.has(candidate.word)
  ));
  const selected = shuffleItems(candidates)[0];
  if (!selected) return null;
  return {
    transferWord: selected.word,
    transferFits: selected.fits,
    transferBinId: selected.fits ? "fits" : "not"
  };
}

const ENDING_SOUND_PATTERNS = new Set([
  "all", "nk", "ng", "ang", "ing", "ong", "ung", "ff", "ss", "zz", "ll"
]);

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
  return all.filter(hasPicture).slice(0, limit);
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
        mechanicId: "letterPair",
        construct: "visual_letter_identity",
        audio: letterNameAudioPath(lower),
        speechFallback: lower,
        prompt: `This is big ${upper}. Find its small letter.`,
        instruction: `This is big ${upper}. Find its small letter.`,
        targetGrapheme: lower,
        modelForm: upper,
        partnerForm: lower,
        display: upper,
        choices: shuffleItems([lower, ...others]),
        answer: lower,
        choiceStyle: "letter"
      },
      {
        type: "letter",
        mechanicId: "letterPair",
        construct: "visual_letter_identity",
        audio: letterNameAudioPath(lower),
        speechFallback: lower,
        prompt: `This is small ${lower}. Find its big letter.`,
        instruction: `This is small ${lower}. Find its big letter.`,
        targetGrapheme: lower,
        modelForm: lower,
        partnerForm: upper,
        display: lower,
        choices: shuffleItems([upper, ...others.map(g => g.toUpperCase())]),
        answer: upper,
        choiceStyle: "letter"
      }
    ];
  });
  return rounds;
}

function buildCodeSpotRounds(cycle) {
  const cycleNumber = cycle.cycleNumber || 1;
  return focusEntries(cycle)
    .filter(entry => entry.spelling.length > 1 && entry.spelling !== "pattern")
    .flatMap(entry => {
      const inventory = CODE_SPOT_WORD_INVENTORY[entry.spelling];
      if (!inventory || cycleNumber < inventory.authorizedFromCycle) return [];
      const matching = uniqueChoices(inventory.sort).filter(word => (
        word.includes(entry.spelling)
        && wordUsesTaughtPrint(word, cycleNumber)
      ));
      const transferCandidates = inventory.transfer.filter(candidate => (
        candidate.word.includes(entry.spelling) === candidate.fits
        && wordUsesTaughtPrint(candidate.word, cycleNumber)
        && !matching.includes(candidate.word)
      ));
      const decoys = CODE_SPOT_DECOY_WORDS.filter(word => (
        !word.includes(entry.spelling)
        && wordUsesTaughtPrint(word, cycleNumber)
      ));
      if (matching.length < 2 || !transferCandidates.length || !decoys.length) return [];
      const items = shuffleItems([
        ...shuffleItems(matching).slice(0, 3).map(word => ({ word, fits: true })),
        ...shuffleItems(decoys).slice(0, 3).map(word => ({ word, fits: false }))
      ]);
      const transfer = choosePatternTransfer(transferCandidates, items);
      if (!transfer) return [];
      const bins = shuffleItems([
        { id: "fits", label: `has ${entry.spelling}` },
        { id: "not", label: `does not have ${entry.spelling}` }
      ]);
      return [{
        type: "pattern",
        mechanicId: "patternSort",
        construct: "visual_grapheme_identity",
        audio: "",
        speechFallback: "",
        prompt: `Put each word in a bin: has ${entry.spelling}, or does not have ${entry.spelling}. Then sort one new word.`,
        instruction: `Pick up one word at a time. Put it in has ${entry.spelling}, or does not have ${entry.spelling}. Then sort the new word.`,
        targetGrapheme: entry.spelling,
        patternLabel: `has ${entry.spelling}`,
        bins,
        items,
        ...transfer,
        choiceStyle: "pattern"
      }];
    });
}

// Station - Sound Catch: hear the sound, tap the matching letter tile.
function buildSoundRounds(cycle) {
  // Two passes per focus sound with fresh distractors each time. Pattern
  // sounds without a recorded phoneme cue with a real word instead.
  return focusEntries(cycle).flatMap(entry => [0, 1].flatMap(() => {
    const phoneme = graphemeAudioPath(entry.spelling);
    // The word cue must be a word that actually HAS a good recording.
    const exampleWord = shuffleItems(exampleWordsFor(entry.spelling)).find(word => wordAudioPath(word)) || "";
    const wordCue = exampleWord ? wordAudioPath(exampleWord) : "";
    const audio = phoneme || wordCue;
    if (!audio) return [];
    const acceptedAnswers = acceptedSoundSpellings(entry.spelling, cycle.cycleNumber || 1);
    const choices = shuffleItems(uniqueChoices([
      ...acceptedAnswers,
      ...distractorGraphemes(entry.spelling, 2, cycle.cycleNumber)
    ]));
    const prompt = acceptedAnswers.length > 1
      ? "Listen. Put either spelling for this sound in the gate."
      : "Listen. Put the spelling for this sound in the gate.";
    return [{
      type: "sound",
      mechanicId: "soundGate",
      construct: ENDING_SOUND_PATTERNS.has(entry.spelling)
        ? "heard_ending_sound_family_mapping"
        : "heard_phoneme_grapheme_mapping",
      audio,
      speechFallback: "",
      prompt,
      instruction: prompt,
      display: "",
      targetGrapheme: entry.spelling,
      acceptedAnswers,
      cueWord: phoneme ? "" : exampleWord,
      choices,
      answer: entry.spelling,
      choiceStyle: "letter"
    }];
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
      pool: pictureWordsFor(entry.spelling)
        .filter(word => sharesSound(onsetGrapheme(word), entry.spelling) && wordAudioPath(word))
    }))
    .filter(({ pool }) => pool.length)
    .flatMap(({ entry, pool }) => {
      const answers = shuffleItems(pool).slice(0, 2);
      return answers.map(answer => {
        const others = shuffleItems(
          ALL_GRAPHEMES
            .filter(g => !sharesSound(g, entry.spelling))
            .flatMap(g => pictureWordsFor(g, 1))
            .filter(word => (
              wordAudioPath(word)
              && !sharesSound(onsetGrapheme(word), entry.spelling)
            ))
        ).slice(0, 2);
        const choices = uniqueChoices(shuffleItems([answer, ...others]));
        if (choices.length < 3) return null;
        return {
          type: "hunt",
          mechanicId: "sceneHunt",
          construct: "initial_phoneme_discrimination",
          audio: graphemeAudioPath(entry.spelling),
          speechFallback: "",
          prompt: `Find the word that starts with the “${entry.spelling}” sound.`,
          instruction: `Find the word that starts with the “${entry.spelling}” sound.`,
          display: "",
          targetGrapheme: entry.spelling,
          objects: choices.map(word => ({
            word,
            matches: sharesSound(onsetGrapheme(word), entry.spelling)
          })),
          choices,
          answer,
          choiceStyle: "picture"
        };
      });
    })
    .filter(Boolean);
  return rounds;
}

function buildSoundSortRounds(cycle) {
  return focusEntries(cycle)
    .filter(entry => ENDING_SOUND_PATTERNS.has(entry.spelling))
    .flatMap(entry => {
      const matches = pictureWordsFor(entry.spelling, 8)
        .filter(word => hasPicture(word) && wordAudioPath(word) && word.endsWith(entry.spelling));
      const decoys = [...PICTURE_WORDS]
        .filter(word => wordAudioPath(word) && !word.endsWith(entry.spelling));
      if (!matches.length || decoys.length < 2) return [];
      const choices = shuffleItems(uniqueChoices([
        ...shuffleItems(matches).slice(0, 2),
        ...shuffleItems(decoys).slice(0, 3)
      ]));
      return [{
        type: "hunt",
        mechanicId: "sceneHunt",
        construct: "ending_grapheme_pattern_discrimination",
        variant: "soundSort",
        audio: graphemeAudioPath(entry.spelling),
        speechFallback: "",
        prompt: `Find every word that ends with the “${entry.spelling}” pattern.`,
        instruction: `Find every word that ends with the “${entry.spelling}” pattern.`,
        targetGrapheme: entry.spelling,
        objects: choices.map(word => ({ word, matches: word.endsWith(entry.spelling) })),
        choices,
        answer: choices.find(word => word.endsWith(entry.spelling)),
        choiceStyle: "picture"
      }];
    });
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
  return sequence.map((word, roundIndex) => {
    const distractors = closeSpellingDistractors(word, taught, 3);
    const choices = shuffleItems([word, ...distractors]);
    return {
      type: "quick",
      mechanicId: "wordWindow",
      roundKey: `word-window:${cycle.id}:${roundIndex}:${word}`,
      construct: "high_frequency_word_recognition",
      audio: wordAudioPath(word),
      speechFallback: word,
      prompt: "Listen, study, close, then choose.",
      instruction: "Listen, study, close, then choose.",
      studyWord: word,
      support: "Learn this high-frequency word as its own word.",
      display: "",
      choices,
      choiceDetails: choices.map(spelling => ({
        spelling,
        matches: spelling === word,
        kind: spelling === word ? "target" : "orthographic-neighbour",
        editDistance: orthographicEditDistance(spelling, word)
      })),
      answer: word,
      choiceStyle: "word"
    };
  });
}

// Word Build is encoding practice, so its content cannot be inferred from
// spelling alone. Each entry below is a reviewed spoken-word segmentation: one
// tile per sound-spelling unit the child has met by `authorizedFromCycle`.
// Irregular HFWs and picture-bank words stay out unless this inventory names an
// exact defensible segmentation.
export const ADVENTURE_WORD_BUILD_INVENTORY = Object.freeze([
  { word: "am", graphemes: ["a", "m"], authorizedFromCycle: 1 },
  { word: "at", graphemes: ["a", "t"], authorizedFromCycle: 2 },
  { word: "mat", graphemes: ["m", "a", "t"], authorizedFromCycle: 2 },
  { word: "sat", graphemes: ["s", "a", "t"], authorizedFromCycle: 2 },
  { word: "sit", graphemes: ["s", "i", "t"], authorizedFromCycle: 3 },
  { word: "tin", graphemes: ["t", "i", "n"], authorizedFromCycle: 3 },
  { word: "man", graphemes: ["m", "a", "n"], authorizedFromCycle: 3 },
  { word: "ant", graphemes: ["a", "n", "t"], authorizedFromCycle: 3 },
  { word: "fan", graphemes: ["f", "a", "n"], authorizedFromCycle: 4 },
  { word: "fin", graphemes: ["f", "i", "n"], authorizedFromCycle: 4 },
  { word: "fit", graphemes: ["f", "i", "t"], authorizedFromCycle: 4 },
  { word: "did", graphemes: ["d", "i", "d"], authorizedFromCycle: 4 },
  { word: "log", graphemes: ["l", "o", "g"], authorizedFromCycle: 10 },
  { word: "lot", graphemes: ["l", "o", "t"], authorizedFromCycle: 5 },
  { word: "on", graphemes: ["o", "n"], authorizedFromCycle: 5 },
  { word: "hat", graphemes: ["h", "a", "t"], authorizedFromCycle: 6 },
  { word: "hot", graphemes: ["h", "o", "t"], authorizedFromCycle: 6 },
  { word: "ram", graphemes: ["r", "a", "m"], authorizedFromCycle: 6 },
  { word: "rat", graphemes: ["r", "a", "t"], authorizedFromCycle: 6 },
  { word: "bat", graphemes: ["b", "a", "t"], authorizedFromCycle: 8 },
  { word: "win", graphemes: ["w", "i", "n"], authorizedFromCycle: 8 },
  { word: "wig", graphemes: ["w", "i", "g"], authorizedFromCycle: 10 },
  { word: "sun", graphemes: ["s", "u", "n"], authorizedFromCycle: 9 },
  { word: "fun", graphemes: ["f", "u", "n"], authorizedFromCycle: 9 },
  { word: "run", graphemes: ["r", "u", "n"], authorizedFromCycle: 9 },
  { word: "mug", graphemes: ["m", "u", "g"], authorizedFromCycle: 10 },
  { word: "hum", graphemes: ["h", "u", "m"], authorizedFromCycle: 9 },
  { word: "cat", graphemes: ["c", "a", "t"], authorizedFromCycle: 10 },
  { word: "can", graphemes: ["c", "a", "n"], authorizedFromCycle: 10 },
  { word: "cup", graphemes: ["c", "u", "p"], authorizedFromCycle: 11 },
  { word: "gum", graphemes: ["g", "u", "m"], authorizedFromCycle: 10 },
  { word: "gap", graphemes: ["g", "a", "p"], authorizedFromCycle: 11 },
  { word: "got", graphemes: ["g", "o", "t"], authorizedFromCycle: 10 },
  { word: "pan", graphemes: ["p", "a", "n"], authorizedFromCycle: 11 },
  { word: "pig", graphemes: ["p", "i", "g"], authorizedFromCycle: 11 },
  { word: "pin", graphemes: ["p", "i", "n"], authorizedFromCycle: 11 },
  { word: "pot", graphemes: ["p", "o", "t"], authorizedFromCycle: 11 },
  { word: "pup", graphemes: ["p", "u", "p"], authorizedFromCycle: 11 },
  { word: "yum", graphemes: ["y", "u", "m"], authorizedFromCycle: 11 },
  { word: "vet", graphemes: ["v", "e", "t"], authorizedFromCycle: 12 },
  { word: "van", graphemes: ["v", "a", "n"], authorizedFromCycle: 12 },
  { word: "hen", graphemes: ["h", "e", "n"], authorizedFromCycle: 12 },
  { word: "net", graphemes: ["n", "e", "t"], authorizedFromCycle: 12 },
  { word: "red", graphemes: ["r", "e", "d"], authorizedFromCycle: 12 },
  { word: "ten", graphemes: ["t", "e", "n"], authorizedFromCycle: 12 },
  { word: "kit", graphemes: ["k", "i", "t"], authorizedFromCycle: 13 },
  { word: "kid", graphemes: ["k", "i", "d"], authorizedFromCycle: 13 },
  { word: "jam", graphemes: ["j", "a", "m"], authorizedFromCycle: 13 },
  { word: "jet", graphemes: ["j", "e", "t"], authorizedFromCycle: 13 },
  { word: "zip", graphemes: ["z", "i", "p"], authorizedFromCycle: 13 },
  { word: "zap", graphemes: ["z", "a", "p"], authorizedFromCycle: 13 },
  { word: "ship", graphemes: ["sh", "i", "p"], authorizedFromCycle: 15 },
  { word: "shop", graphemes: ["sh", "o", "p"], authorizedFromCycle: 15 },
  { word: "shut", graphemes: ["sh", "u", "t"], authorizedFromCycle: 15 },
  { word: "chat", graphemes: ["ch", "a", "t"], authorizedFromCycle: 15 },
  { word: "chop", graphemes: ["ch", "o", "p"], authorizedFromCycle: 15 },
  { word: "thin", graphemes: ["th", "i", "n"], authorizedFromCycle: 15 },
  { word: "that", graphemes: ["th", "a", "t"], authorizedFromCycle: 15 },
  { word: "when", graphemes: ["wh", "e", "n"], authorizedFromCycle: 21 },
  { word: "which", graphemes: ["wh", "i", "ch"], authorizedFromCycle: 21 },
  { word: "whisk", graphemes: ["wh", "i", "s", "k"], authorizedFromCycle: 21 },
  // In -nk words, the n tile records the contextual /ŋ/ sound and k records
  // /k/: four phonemes and four boxes, while `focusSpellings` retains the
  // taught visual nk pattern for cycle selection.
  {
    word: "sink",
    graphemes: ["s", "i", "n", "k"],
    focusSpellings: ["nk"],
    authorizedFromCycle: 22
  },
  {
    word: "bank",
    graphemes: ["b", "a", "n", "k"],
    focusSpellings: ["nk"],
    authorizedFromCycle: 22
  },
  {
    word: "pink",
    graphemes: ["p", "i", "n", "k"],
    focusSpellings: ["nk"],
    authorizedFromCycle: 22
  },
  {
    word: "wink",
    graphemes: ["w", "i", "n", "k"],
    focusSpellings: ["nk"],
    authorizedFromCycle: 22
  },
  { word: "ring", graphemes: ["r", "i", "ng"], authorizedFromCycle: 23 },
  { word: "sing", graphemes: ["s", "i", "ng"], authorizedFromCycle: 23 },
  { word: "king", graphemes: ["k", "i", "ng"], authorizedFromCycle: 23 },
  { word: "song", graphemes: ["s", "o", "ng"], authorizedFromCycle: 23 },
  { word: "long", graphemes: ["l", "o", "ng"], authorizedFromCycle: 23 },
  { word: "hung", graphemes: ["h", "u", "ng"], authorizedFromCycle: 23 },
  { word: "puff", graphemes: ["p", "u", "ff"], authorizedFromCycle: 24 },
  { word: "miss", graphemes: ["m", "i", "ss"], authorizedFromCycle: 24 },
  { word: "buzz", graphemes: ["b", "u", "zz"], authorizedFromCycle: 24 },
  { word: "will", graphemes: ["w", "i", "ll"], authorizedFromCycle: 24 }
]);

// Two-box words need special handling: after cycle 1, an already-taught third
// tile prevents the bank position from becoming an answer key. Cycle 1 has
// only a and m available, so `am` truthfully varies its two target tiles rather
// than presenting an indistinguishable duplicate as a wrong answer.
export const ADVENTURE_TWO_UNIT_SOUND_BOX_BANKS = Object.freeze({
  am: Object.freeze({
    authorizedFromCycle: 1,
    cycleOneTargetOnly: true,
    distractors: Object.freeze(["t"])
  }),
  at: Object.freeze({
    authorizedFromCycle: 2,
    distractors: Object.freeze(["m"])
  }),
  on: Object.freeze({
    authorizedFromCycle: 5,
    distractors: Object.freeze(["m"])
  })
});

// Station - Word Build is phonics/encoding practice. The dedicated Quick
// Words station remains responsible for irregular whole-word recognition.
function buildWordBuildRounds(cycle) {
  const cycleNumber = cycle.cycleNumber || 1;
  const focus = new Set(focusEntries(cycle).map(entry => entry.spelling));
  const eligible = ADVENTURE_WORD_BUILD_INVENTORY.filter(entry => (
    entry.authorizedFromCycle <= cycleNumber && wordAudioPath(entry.word)
  ));
  const focused = eligible.filter(entry => (
    entry.graphemes.some(grapheme => focus.has(grapheme))
    || entry.focusSpellings?.some(spelling => focus.has(spelling))
  ));
  const review = eligible.filter(entry => !focused.includes(entry));
  const entries = [...shuffleItems(focused), ...shuffleItems(review)].slice(0, 4);
  return entries.flatMap((entry, roundIndex) => {
    const graphemes = [...entry.graphemes];
    const twoUnitBank = graphemes.length === 2
      ? ADVENTURE_TWO_UNIT_SOUND_BOX_BANKS[entry.word]
      : null;
    if (graphemes.length === 2 && (
      !twoUnitBank
      || twoUnitBank.authorizedFromCycle > cycleNumber
    )) return [];
    const tileBankPolicy = twoUnitBank?.cycleOneTargetOnly && cycleNumber === 1
      ? "cycle-one-target-only-permutation"
      : twoUnitBank
        ? "target-plus-reviewed-distractor"
        : undefined;
    const eligibleDistractors = twoUnitBank?.distractors.filter(grapheme => (
      taughtGraphemesThrough(cycleNumber).includes(grapheme)
      && !graphemes.includes(grapheme)
    )) || [];
    const distractorGrapheme = tileBankPolicy === "target-plus-reviewed-distractor"
      ? shuffleItems(eligibleDistractors)[0]
      : undefined;
    if (tileBankPolicy === "target-plus-reviewed-distractor" && !distractorGrapheme) {
      return [];
    }
    const bankGraphemes = twoUnitBank
      ? [...graphemes, ...(distractorGrapheme ? [distractorGrapheme] : [])]
      : graphemes;
    const proposedOrder = shuffleItems(bankGraphemes.map((_, index) => index));
    const tileOrder = tileBankPolicy === "cycle-one-target-only-permutation"
      ? proposedOrder
      : constrainedIndexOrder(bankGraphemes, proposedOrder, { avoidReverse: true });
    return [{
      type: "build",
      mechanicId: "soundBoxes",
      roundKey: `sound-boxes:${cycle.id}:${roundIndex}:${entry.word}:${distractorGrapheme || "targets-only"}:${tileOrder.join("-")}`,
      construct: "phoneme_grapheme_encoding",
      audio: wordAudioPath(entry.word),
      speechFallback: entry.word,
      prompt: "Build the word you hear.",
      instruction: "Build the word you hear. Put one grapheme in each sound box.",
      display: "",
      word: entry.word,
      graphemes,
      ...(twoUnitBank ? {
        bankGraphemes,
        tileBankPolicy
      } : {}),
      ...(distractorGrapheme ? { distractorGrapheme } : {}),
      tileOrder,
      inventoryAuthorization: "reviewed-phoneme-grapheme-v1",
      choiceStyle: "build"
    }];
  });
}

// Station - Word Play: change the first sound, take it away, join words.
export const REVIEWED_ONSET_SUBSTITUTION_FAMILIES = Object.freeze([
  { rime: "at", authorizedFromCycle: 15, words: ["mat", "bat", "cat", "hat", "rat", "chat"] },
  { rime: "ap", authorizedFromCycle: 15, words: ["map", "tap", "nap", "cap", "lap"] },
  { rime: "it", authorizedFromCycle: 15, words: ["sit", "fit", "kit"] },
  { rime: "an", authorizedFromCycle: 15, words: ["fan", "can", "pan", "van"] },
  { rime: "ig", authorizedFromCycle: 15, words: ["fig", "dig", "pig", "wig"] },
  { rime: "ox", authorizedFromCycle: 15, words: ["fox", "box"] },
  { rime: "un", authorizedFromCycle: 15, words: ["run", "sun"] },
  { rime: "ed", authorizedFromCycle: 15, words: ["red", "bed"] },
  { rime: "ug", authorizedFromCycle: 15, words: ["rug", "mug"] },
  { rime: "op", authorizedFromCycle: 15, words: ["hop", "top", "chop", "shop"] },
  { rime: "ish", authorizedFromCycle: 15, words: ["fish", "dish"] },
  { rime: "et", authorizedFromCycle: 15, words: ["jet", "net"] },
  { rime: "up", authorizedFromCycle: 15, words: ["cup", "pup"] },
  { rime: "ip", authorizedFromCycle: 15, words: ["ship", "chip", "lip"] },
  { rime: "in", authorizedFromCycle: 15, words: ["thin", "fin", "pin", "chin"] },
  { rime: "ing", authorizedFromCycle: 23, words: ["ring", "sing", "king"] },
  { rime: "ong", authorizedFromCycle: 23, words: ["song", "long"] },
  { rime: "all", authorizedFromCycle: 24, words: ["ball", "fall", "call"] }
]);

export const REVIEWED_ONSET_REMOVAL_PAIRS = Object.freeze([
  { before: "fan", after: "an", beforeGraphemes: ["f", "a", "n"], afterGraphemes: ["a", "n"], authorizedFromCycle: 8 },
  { before: "man", after: "an", beforeGraphemes: ["m", "a", "n"], afterGraphemes: ["a", "n"], authorizedFromCycle: 8 },
  { before: "mat", after: "at", beforeGraphemes: ["m", "a", "t"], afterGraphemes: ["a", "t"], authorizedFromCycle: 8 },
  { before: "hat", after: "at", beforeGraphemes: ["h", "a", "t"], afterGraphemes: ["a", "t"], authorizedFromCycle: 8 },
  { before: "bat", after: "at", beforeGraphemes: ["b", "a", "t"], afterGraphemes: ["a", "t"], authorizedFromCycle: 8 },
  { before: "sit", after: "it", beforeGraphemes: ["s", "i", "t"], afterGraphemes: ["i", "t"], authorizedFromCycle: 8 },
  { before: "fit", after: "it", beforeGraphemes: ["f", "i", "t"], afterGraphemes: ["i", "t"], authorizedFromCycle: 8 },
  { before: "cat", after: "at", beforeGraphemes: ["c", "a", "t"], afterGraphemes: ["a", "t"], authorizedFromCycle: 10 },
  { before: "can", after: "an", beforeGraphemes: ["c", "a", "n"], afterGraphemes: ["a", "n"], authorizedFromCycle: 10 },
  { before: "cup", after: "up", beforeGraphemes: ["c", "u", "p"], afterGraphemes: ["u", "p"], authorizedFromCycle: 11 },
  { before: "pan", after: "an", beforeGraphemes: ["p", "a", "n"], afterGraphemes: ["a", "n"], authorizedFromCycle: 11 },
  { before: "pin", after: "in", beforeGraphemes: ["p", "i", "n"], afterGraphemes: ["i", "n"], authorizedFromCycle: 11 },
  { before: "pup", after: "up", beforeGraphemes: ["p", "u", "p"], afterGraphemes: ["u", "p"], authorizedFromCycle: 11 },
  { before: "box", after: "ox", beforeGraphemes: ["b", "o", "x"], afterGraphemes: ["o", "x"], authorizedFromCycle: 11 },
  { before: "fox", after: "ox", beforeGraphemes: ["f", "o", "x"], afterGraphemes: ["o", "x"], authorizedFromCycle: 11 },
  { before: "van", after: "an", beforeGraphemes: ["v", "a", "n"], afterGraphemes: ["a", "n"], authorizedFromCycle: 12 },
  { before: "jam", after: "am", beforeGraphemes: ["j", "a", "m"], afterGraphemes: ["a", "m"], authorizedFromCycle: 13 },
  { before: "kit", after: "it", beforeGraphemes: ["k", "i", "t"], afterGraphemes: ["i", "t"], authorizedFromCycle: 13 },
  { before: "thin", after: "in", beforeGraphemes: ["th", "i", "n"], afterGraphemes: ["i", "n"], authorizedFromCycle: 15 },
  { before: "chat", after: "at", beforeGraphemes: ["ch", "a", "t"], afterGraphemes: ["a", "t"], authorizedFromCycle: 15 },
  { before: "ball", after: "all", beforeGraphemes: ["b", "all"], afterGraphemes: ["all"], authorizedFromCycle: 16 },
  { before: "fall", after: "all", beforeGraphemes: ["f", "all"], afterGraphemes: ["all"], authorizedFromCycle: 16 },
  { before: "call", after: "all", beforeGraphemes: ["c", "all"], afterGraphemes: ["all"], authorizedFromCycle: 16 },
  { before: "sink", after: "ink", beforeGraphemes: ["s", "i", "nk"], afterGraphemes: ["i", "nk"], authorizedFromCycle: 22 },
  { before: "pink", after: "ink", beforeGraphemes: ["p", "i", "nk"], afterGraphemes: ["i", "nk"], authorizedFromCycle: 22 },
  { before: "wink", after: "ink", beforeGraphemes: ["w", "i", "nk"], afterGraphemes: ["i", "nk"], authorizedFromCycle: 22 },
  { before: "think", after: "ink", beforeGraphemes: ["th", "i", "nk"], afterGraphemes: ["i", "nk"], authorizedFromCycle: 22 },
  { before: "will", after: "ill", beforeGraphemes: ["w", "i", "ll"], afterGraphemes: ["i", "ll"], authorizedFromCycle: 24 }
]);

const REVIEWED_COMPOUND_WORDS = Object.freeze([
  {
    parts: ["sun", "set"],
    distractors: ["hat", "tan"],
    word: "sunset",
    authorizedFromCycle: 12
  }
]);

function uniqueChoices(items) {
  return [...new Set(items)];
}

function buildWordPlayRounds(cycle) {
  const rounds = [];
  const cycleNumber = cycle.cycleNumber || 1;
  const taughtGraphemes = taughtGraphemesThrough(cycle.cycleNumber || 1);
  const substitutionPairs = REVIEWED_ONSET_SUBSTITUTION_FAMILIES
    .filter(family => family.authorizedFromCycle <= cycleNumber)
    .flatMap(family => {
      const words = family.words.filter(word => wordAudioPath(word));
      return words.flatMap(word => words
        .filter(partner => partner !== word)
        .map(partner => ({ word, partner, familyWords: words })));
    });

  // Change the first sound: same rime, different onset.
  for (const { word, partner, familyWords } of shuffleItems(substitutionPairs)) {
    const beforeGraphemes = segmentTaughtGraphemes(word, taughtGraphemes);
    const rime = beforeGraphemes.slice(1).join("");
    const afterGraphemes = segmentTaughtGraphemes(partner, taughtGraphemes);
    if (
      beforeGraphemes[0] === afterGraphemes[0]
      || afterGraphemes.slice(1).join("") !== rime
    ) continue;
    const decoyOnsets = shuffleItems(uniqueChoices(
      familyWords.map(other => segmentTaughtGraphemes(other, taughtGraphemes)[0])
    ).filter(onset => onset && onset !== beforeGraphemes[0] && onset !== afterGraphemes[0]));
    const onsetChoices = uniqueChoices([
      afterGraphemes[0],
      beforeGraphemes[0],
      ...decoyOnsets.slice(0, 1)
    ]);
    if (onsetChoices.length < 2) continue;
    const onsetPieces = shuffleItems(onsetChoices).map(grapheme => {
      const resultGraphemes = [grapheme, ...beforeGraphemes.slice(1)];
      const projectedWord = resultGraphemes.join("");
      return {
        grapheme,
        resultGraphemes,
        projectedWord,
        matches: projectedWord === partner
      };
    });
    rounds.push({
      type: "play",
      mechanicId: "wordMachine",
      roundKey: `word-machine:${cycle.id}:substituteOnset:${rounds.length}:${word}:${partner}`,
      construct: "onset_substitution",
      operation: "substituteOnset",
      audio: wordAudioPath(partner),
      speechFallback: partner,
      prompt: `Change the first sound of "${word}" to make "${partner}". Choose the new onset.`,
      instruction: `Change the first sound of "${word}" to make "${partner}".`,
      beforeWord: word,
      afterWord: partner,
      beforeGraphemes,
      afterGraphemes,
      targetOnset: afterGraphemes[0],
      onsetPieces,
      display: word,
      answer: partner,
      inventoryAuthorization: "reviewed-onset-substitution-v1",
      choiceStyle: "onset-piece"
    });
    if (rounds.length >= 2) break;
  }

  // Take the first sound away.
  const removalPairs = REVIEWED_ONSET_REMOVAL_PAIRS.filter(pair => (
    pair.authorizedFromCycle <= cycleNumber
    && wordAudioPath(pair.before)
    && wordAudioPath(pair.after)
  ));
  for (const pair of shuffleItems(removalPairs)) {
    const beforeGraphemes = [...pair.beforeGraphemes];
    const afterGraphemes = [...pair.afterGraphemes];
    const rest = afterGraphemes.join("");
    const projectedWords = new Set();
    const removablePositions = beforeGraphemes.flatMap((_, position) => {
      const projectedWord = beforeGraphemes
        .filter((__, graphemeIndex) => graphemeIndex !== position)
        .join("");
      if (projectedWords.has(projectedWord)) return [];
      projectedWords.add(projectedWord);
      return [{ position, projectedWord }];
    });
    const removalChoices = removablePositions.map(choice => choice.projectedWord);
    if (
      beforeGraphemes.slice(1).join("") !== rest
      || removalChoices.length < 2
    ) continue;
    const pieceOrder = shuffleItems(removablePositions.map(choice => choice.position));
    rounds.push({
      type: "play",
      mechanicId: "wordMachine",
      roundKey: `word-machine:${cycle.id}:removeOnset:${rounds.length}:${pair.before}:${rest}:${pieceOrder.join("-")}`,
      construct: "onset_removal",
      operation: "removeOnset",
      audio: wordAudioPath(pair.before),
      speechFallback: pair.before,
      prompt: `Take the first sound away from "${pair.before}". What is left?`,
      instruction: `Take the first sound away from "${pair.before}".`,
      beforeWord: pair.before,
      afterWord: rest,
      beforeGraphemes,
      afterGraphemes,
      pieceOrder,
      display: pair.before,
      choices: shuffleItems(removalChoices),
      answer: rest,
      inventoryAuthorization: "reviewed-onset-removal-v1",
      choiceStyle: "word"
    });
    break;
  }

  // Join two small words into one big compound word.
  const compound = shuffleItems(REVIEWED_COMPOUND_WORDS).find(candidate => (
    candidate.authorizedFromCycle <= cycleNumber
    && wordAudioPath(candidate.parts[0])
    && wordAudioPath(candidate.parts[1])
    && wordAudioPath(candidate.word)
    && candidate.distractors?.some(part => wordAudioPath(part))
  ));
  if (compound) {
    const [left, right] = compound.parts;
    const full = compound.word;
    const distractor = shuffleItems(
      compound.distractors.filter(part => (
        part !== left && part !== right && wordAudioPath(part)
      ))
    )[0];
    const leftGraphemes = segmentTaughtGraphemes(left, taughtGraphemes);
    const rightGraphemes = segmentTaughtGraphemes(right, taughtGraphemes);
    const compoundPieces = [
      {
        id: "target-left",
        label: left,
        graphemes: leftGraphemes,
        semanticIndex: 0
      },
      {
        id: "target-right",
        label: right,
        graphemes: rightGraphemes,
        semanticIndex: 1
      },
      {
        id: `distractor-${distractor}`,
        label: distractor,
        graphemes: segmentTaughtGraphemes(distractor, taughtGraphemes),
        semanticIndex: null
      }
    ];
    const pieceOrder = constrainedIndexOrder(
      compoundPieces.map(piece => piece.label),
      shuffleItems(compoundPieces.map((_, index) => index))
    );
    rounds.push({
      type: "play",
      mechanicId: "wordMachine",
      roundKey: `word-machine:${cycle.id}:joinCompound:${rounds.length}:${full}:${distractor}:${pieceOrder.join("-")}`,
      construct: "compound_word_joining",
      operation: "joinCompound",
      audio: wordAudioPath(full),
      speechFallback: full,
      prompt: `"${left}" and "${right}" join to make one big word. Which is it?`,
      instruction: `Join "${left}" and "${right}" to make one word.`,
      beforeWord: `${left} + ${right}`,
      afterWord: full,
      beforeGraphemes: [
        ...leftGraphemes,
        "+",
        ...rightGraphemes
      ],
      afterGraphemes: segmentTaughtGraphemes(full, taughtGraphemes),
      compoundPieces,
      pieceOrder,
      display: `${left} + ${right}`,
      choices: [full],
      answer: full,
      inventoryAuthorization: "reviewed-compound-v1",
      choiceStyle: "word"
    });
  }

  return rounds;
}

// Station - Poem Time: read the cycle poem, then find words inside it.
function buildPoemRounds(cycle) {
  const poem = EL_CYCLE_POEMS.find(p => p.cycle === cycle.cycleNumber);
  if (!poem) return [];
  const text = poem.lines.join("\n");
  const tokens = poem.lines.map((line, lineIndex) => (
    line.split(/\s+/).filter(Boolean).map((token, tokenIndex) => ({
      text: token,
      normalized: token.toLowerCase().replace(/[^a-z']/g, ""),
      lineIndex,
      tokenIndex
    }))
  ));
  const poemWords = uniqueChoices(tokens.flat().map(token => token.normalized).filter(word => word.length > 1));
  const poemAudio = getLedaInstructionAudioPath(text);
  return poem.findWords.flatMap(word => {
    const targetToken = tokens.flat().find(token => token.normalized === word.toLowerCase());
    if (!targetToken) return [];
    const prompt = `Find the word “${word}” in the poem.`;
    return [{
      type: "poem",
      mechanicId: "poemSpotlight",
      construct: "connected_print_tracking",
      audio: poemAudio || wordAudioPath(word),
      speechFallback: "",
      prompt,
      instruction: prompt,
      display: text,
      poem: true,
      poemTitle: poem.title,
      lines: [...poem.lines],
      tokens,
      targetToken,
      choices: shuffleItems([word, ...shuffleItems(poemWords.filter(item => item !== word)).slice(0, 3)]),
      answer: word,
      choiceStyle: "word"
    }];
  });
}

// Station - Letter Trace: write the focus letters with a finger.
function buildTraceRounds(cycle) {
  const rounds = focusEntries(cycle)
    .filter(entry => entry.spelling.length <= 2)
    .flatMap(entry => {
      const letterForms = entry.spelling.length === 1
        ? [entry.spelling.toUpperCase(), entry.spelling.toLowerCase()]
        : [entry.spelling];

      return letterForms.map(letterForm => ({
        type: "trace",
        mechanicId: "letterTrace",
        construct: entry.spelling.length === 1
          ? "letter_formation_practice"
          : "grapheme_pattern_formation_practice",
        audio: graphemeAudioPath(entry.spelling),
        speechFallback: entry.spelling,
        prompt: entry.spelling.length === 1
          ? "Trace the letter with your finger."
          : "Trace the whole grapheme with your finger.",
        instruction: entry.spelling.length === 1
          ? "Watch the letter path, then trace it."
          : "Watch the whole grapheme path, then trace it.",
        display: "",
        letter: letterForm,
        choiceStyle: "trace"
      }));
    });
  return rounds;
}

// ── Fluency & Patterns games (cycles 25-27: no new letters) ──────────────────
// These wrap-up cycles consolidate reading fluency, spelling patterns, sight
// words and poems instead of teaching new letter-sounds, so they get their own
// set of games. Every word is decodable / already taught by this point.

// Pattern Power reviews only patterns explicitly taught in the phonics strand.
// HFW membership never authorizes a spelling generalization on its own.
const TAUGHT_PATTERN_REVIEW_INVENTORY = Object.freeze([
  {
    id: "initial-sh",
    label: "start with sh",
    requiredGraphemes: ["sh"],
    members: ["ship", "shop", "shed", "shut"],
    transfer: [{ word: "shin", fits: true }, { word: "fin", fits: false }],
    decoys: ["pig", "top", "run", "bed", "map", "sun"]
  },
  {
    id: "final-ng",
    label: "have -ng",
    requiredGraphemes: ["ng"],
    members: ["ring", "king", "song", "bang", "hang", "long"],
    transfer: [{ word: "wing", fits: true }, { word: "win", fits: false }],
    decoys: ["rat", "pig", "cup", "red", "mud", "tap"]
  },
  {
    id: "final-ll",
    label: "end with -ll",
    requiredGraphemes: ["ll"],
    members: ["ball", "fall", "call", "tall", "bell", "fill"],
    transfer: [{ word: "hill", fits: true }, { word: "him", fits: false }],
    decoys: ["bat", "mop", "sun", "net", "rug", "pin"]
  }
]);

function patternFamiliesForCycle(cycle) {
  const cycleNumber = cycle?.cycleNumber || 0;
  const taught = new Set(taughtGraphemesThrough(cycleNumber));
  return TAUGHT_PATTERN_REVIEW_INVENTORY.flatMap(family => {
    if (!family.requiredGraphemes.every(grapheme => taught.has(grapheme))) return [];
    const members = family.members.filter(word => wordUsesTaughtPrint(word, cycleNumber));
    const transfer = family.transfer.filter(candidate => (
      wordUsesTaughtPrint(candidate.word, cycleNumber)
      && !members.includes(candidate.word)
    ));
    const decoys = family.decoys.filter(word => wordUsesTaughtPrint(word, cycleNumber));
    if (members.length < 2 || !transfer.length || !decoys.length) return [];
    return [{ ...family, members, transfer, decoys }];
  });
}

// Station - Pattern Power: sort every word into a labelled pattern bin.
function buildPatternPowerRounds(cycle) {
  return patternFamiliesForCycle(cycle).flatMap(family => {
    const fits = shuffleItems(family.members).slice(0, 3);
    const decoys = shuffleItems(family.decoys).slice(0, 3);
    const items = shuffleItems([
      ...fits.map(word => ({ word, fits: true })),
      ...decoys.map(word => ({ word, fits: false }))
    ]);
    const transfer = choosePatternTransfer(family.transfer, items);
    if (!transfer) return [];
    const bins = shuffleItems([
      { id: "fits", label: family.label },
      { id: "not", label: `do not ${family.label}` }
    ]);
    return [{
      type: "pattern",
      mechanicId: "patternSort",
      construct: "orthographic_pattern_sort",
      audio: "",
      speechFallback: "",
      prompt: "Put each word in its labelled pattern bin. Then sort one new word.",
      instruction: "Pick up one word at a time and put it in the matching pattern bin. Then sort the new word.",
      patternLabel: family.label,
      bins,
      items,
      ...transfer,
      choiceStyle: "pattern"
    }];
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
  const taughtGraphemes = taughtGraphemesThrough(cycle.cycleNumber || 1);
  for (const chain of shuffleItems(pool).slice(0, 2)) {
    for (let i = 0; i < chain.length - 1; i += 1) {
      const from = chain[i];
      const to = chain[i + 1];
      const fromGraphemes = segmentTaughtGraphemes(from, taughtGraphemes);
      const toGraphemes = segmentTaughtGraphemes(to, taughtGraphemes);
      const slot = changedSlot(fromGraphemes, toGraphemes);
      if (slot < 0 || fromGraphemes.length !== toGraphemes.length) continue;
      const answer = toGraphemes[slot];
      const distractors = shuffleItems("aeioubdgmnpst".split("")
        .filter(l => l !== answer && l !== fromGraphemes[slot])).slice(0, 2);
      rounds.push({
        type: "chain",
        mechanicId: "wordChain",
        construct: "grapheme_substitution_chain",
        audio: wordAudioPath(to),
        speechFallback: to,
        prompt: `Change one grapheme in "${from}". Listen for the next word.`,
        instruction: `Listen to the next word. Change one grapheme in "${from}".`,
        fromWord: from,
        toWord: to,
        fromGraphemes,
        toGraphemes,
        changeIndex: slot,
        display: toGraphemes.map((grapheme, idx) => (idx === slot ? "_" : grapheme)).join(" "),
        choices: shuffleItems([answer, ...distractors]),
        answer,
        choiceStyle: "letter"
      });
    }
  }
  return rounds;
}

// Station - Phrase Flow: follow authored poem-line chunks without a timer or
// an oral-fluency score.
function phraseWords(text) {
  return String(text || "").trim().split(/\s+/u).filter(Boolean);
}

function endsWithPhrasePunctuation(word) {
  return /[.!?,;:]["'’”)]*$/u.test(String(word || ""));
}

function phraseBoundaryWordLabel(word) {
  return String(word || "")
    .replace(/^["'“‘]+/gu, "")
    .replace(/[.!?,;:"'”’…)]+$/gu, "");
}

const PHRASE_FLOW_MAX_WORDS = 12;

// Boundary choices are reviewed against exact poem-pair positions. The correct
// answer remains the source poem's first line ending; alternatives are authored
// seams that visibly break that line rather than freshly inferred pause points.
const PHRASE_FLOW_BOUNDARY_INVENTORY = Object.freeze({
  "25:0": { correctAfterWord: "say,", alternatives: [{ position: 4, afterWord: "the", beforeWord: "friends" }, { position: 8, afterWord: "a", beforeWord: "brand" }] },
  "25:2": { correctAfterWord: "play,", alternatives: [{ position: 2, afterWord: "and", beforeWord: "Luna" }, { position: 5, afterWord: "and", beforeWord: "play," }] },
  "26:0": { correctAfterWord: "high?\"", alternatives: [{ position: 2, afterWord: "does", beforeWord: "Glimmer's" }] },
  "26:2": { correctAfterWord: "high,", alternatives: [{ position: 6, afterWord: "and", beforeWord: "waves" }, { position: 8, afterWord: "the", beforeWord: "clouds" }] },
  "27:2": { correctAfterWord: "each,", alternatives: [{ position: 3, afterWord: "a", beforeWord: "berry," }, { position: 8, afterWord: "the", beforeWord: "Whispering" }] }
});

function phraseBoundaryChoices(firstLine, secondLine, authored) {
  const firstWords = phraseWords(firstLine);
  const secondWords = phraseWords(secondLine);
  const words = [...firstWords, ...secondWords];
  const correctBoundary = firstWords.length;
  const correctAfterWord = words[correctBoundary - 1];
  if (
    !authored
    || authored.correctAfterWord !== correctAfterWord
    || !endsWithPhrasePunctuation(correctAfterWord)
  ) {
    return { correctBoundary, boundaryChoices: [] };
  }
  const alternatives = authored.alternatives.filter(choice => (
    choice.position > 0
    && choice.position < words.length
    && choice.position !== correctBoundary
    && words[choice.position - 1] === choice.afterWord
    && words[choice.position] === choice.beforeWord
    && !endsWithPhrasePunctuation(choice.afterWord)
  ));
  if (alternatives.length !== authored.alternatives.length || !alternatives.length) {
    return { correctBoundary, boundaryChoices: [] };
  }
  const boundaryChoices = shuffleItems([
    {
      position: correctBoundary,
      afterWord: correctAfterWord,
      beforeWord: words[correctBoundary],
      label: `After “${phraseBoundaryWordLabel(correctAfterWord)}”`
    },
    ...alternatives.map(choice => ({
      ...choice,
      label: `After “${phraseBoundaryWordLabel(choice.afterWord)}”`
    }))
  ]);
  return { correctBoundary, boundaryChoices };
}

function buildPhraseFlowRounds(cycle) {
  const poem = EL_CYCLE_POEMS.find(item => item.cycle === cycle.cycleNumber);
  if (!poem?.lines?.length) return [];
  const pairs = [];
  for (let index = 0; index < poem.lines.length; index += 2) {
    const phraseChunks = poem.lines.slice(index, index + 2);
    if (phraseChunks.length < 2) continue;
    const trailWords = phraseWords(phraseChunks.join(" "));
    if (trailWords.length > PHRASE_FLOW_MAX_WORDS) continue;
    const { correctBoundary, boundaryChoices } = phraseBoundaryChoices(
      phraseChunks[0],
      phraseChunks[1],
      PHRASE_FLOW_BOUNDARY_INVENTORY[`${cycle.cycleNumber}:${index}`]
    );
    if (boundaryChoices.length < 2) continue;
    pairs.push({
      type: "speed",
      mechanicId: "phraseFlow",
      construct: "supported_phrase_reading",
      audio: getLedaInstructionAudioPath(phraseChunks.join(" ")),
      speechFallback: "",
      prompt: "Read the word trail. Choose where the first poetry line ends.",
      instruction: "Read the word trail. Choose where the first poetry line ends, then follow the model and echo-read it.",
      phraseChunks,
      trailWords,
      displayTrailWords: trailWords.map(phraseBoundaryWordLabel),
      correctBoundary,
      boundaryChoices
    });
  }
  return pairs;
}

// Station - Heart Word Studio: study, hide, and rebuild an authorised HFW.
export const ADVENTURE_TWO_UNIT_HEART_WORD_BANKS = Object.freeze({
  by: Object.freeze({ authorizedFromCycle: 26, distractors: Object.freeze(["m"]) }),
  my: Object.freeze({ authorizedFromCycle: 26, distractors: Object.freeze(["b"]) }),
  why: Object.freeze({ authorizedFromCycle: 26, distractors: Object.freeze(["w"]) })
});

function buildSpellRounds(cycle) {
  const words = uniqueChoices((cycle.highFrequencyWords || []).map(w => w.toLowerCase()))
    .filter(word => /^[a-z]{2,6}$/.test(word));
  if (!words.length) return [];
  return words.slice(0, 5).flatMap((word, roundIndex) => {
    const audio = wordAudioPath(word);
    const graphemes = segmentTaughtGraphemes(
      word,
      taughtGraphemesThrough(cycle.cycleNumber || 1)
    );
    const twoUnitBank = graphemes.length === 2
      ? ADVENTURE_TWO_UNIT_HEART_WORD_BANKS[word]
      : null;
    const eligibleDistractors = twoUnitBank?.authorizedFromCycle <= (cycle.cycleNumber || 1)
      ? twoUnitBank.distractors.filter(grapheme => (
          taughtGraphemesThrough(cycle.cycleNumber || 1).includes(grapheme)
          && !graphemes.includes(grapheme)
        ))
      : [];
    const distractorGrapheme = graphemes.length === 2
      ? shuffleItems(eligibleDistractors)[0]
      : undefined;
    if (graphemes.length === 2 && !distractorGrapheme) return [];
    const bankGraphemes = distractorGrapheme
      ? [...graphemes, distractorGrapheme]
      : graphemes;
    const tileOrder = constrainedIndexOrder(
      bankGraphemes,
      shuffleItems(bankGraphemes.map((_, index) => index))
    );
    return [{
      type: "build",
      mechanicId: "heartWord",
      roundKey: `heart-word:${cycle.id}:${roundIndex}:${word}:${distractorGrapheme || "targets-only"}:${tileOrder.join("-")}`,
      construct: "orthographic_memory",
      audio,
      speechFallback: word,
      prompt: "Study the heart word. Hide it, then spell it from memory.",
      instruction: "Study the heart word. Hide it, then spell it from memory.",
      display: word,
      word,
      graphemes,
      ...(distractorGrapheme ? {
        bankGraphemes,
        distractorGrapheme,
        tileBankPolicy: "target-plus-reviewed-distractor"
      } : {}),
      tileOrder,
      choiceStyle: "build"
    }];
  });
}

const STANDARD_STATIONS = [
  { id: "letters", title: "Letter Spot", subtitle: "Big and small letters", icon: "letters", mechanicIds: ["letterPair"], build: buildLetterRounds },
  { id: "sounds", title: "Sound Catch", subtitle: "Hear it, find it", icon: "sounds", mechanicIds: ["soundGate"], build: buildSoundRounds },
  { id: "hunt", title: "Sound Hunt", subtitle: "Pictures and first sounds", icon: "hunt", mechanicIds: ["sceneHunt"], build: buildHuntRounds },
  { id: "quick", title: "Quick Words", subtitle: "Remember the whole word", icon: "quick", mechanicIds: ["wordWindow"], build: buildQuickWordRounds },
  { id: "build", title: "Word Build", subtitle: "Build with sound boxes", icon: "build", mechanicIds: ["soundBoxes"], build: buildWordBuildRounds },
  { id: "play", title: "Word Play", subtitle: "Change, remove, or join word parts", icon: "play", mechanicIds: ["wordMachine"], build: buildWordPlayRounds },
  { id: "poem", title: "Poem Time", subtitle: "Follow the poem's print", icon: "poem", mechanicIds: ["poemSpotlight"], build: buildPoemRounds },
  { id: "trace", title: "Letter Trace", subtitle: "Practise the letter path", icon: "trace", mechanicIds: ["letterTrace"], build: buildTraceRounds }
];

// Cycles 25-27 swap the letter-sound games for fluency, pattern and poem games.
const FLUENCY_STATIONS = [
  { id: "pattern", title: "Pattern Power", subtitle: "Sort the word patterns", icon: "pattern", mechanicIds: ["patternSort"], build: buildPatternPowerRounds },
  { id: "chain", title: "Word Chains", subtitle: "Change one grapheme", icon: "chain", mechanicIds: ["wordChain"], build: buildWordChainRounds },
  { id: "speed", title: "Phrase Flow", subtitle: "Follow a phrase trail", icon: "speed", mechanicIds: ["phraseFlow"], build: buildPhraseFlowRounds },
  { id: "poem", title: "Poem Play", subtitle: "Follow the poem's print", icon: "poem", mechanicIds: ["poemSpotlight"], build: buildPoemRounds },
  { id: "spell", title: "Heart Word Studio", subtitle: "Study, hide, spell, repair", icon: "spell", mechanicIds: ["heartWord"], build: buildSpellRounds }
];

// Backwards-compatible default export (the standard letter-sound set).
export const STATIONS = STANDARD_STATIONS;

// Cycles 25+ have no new focus letters - they are fluency / pattern wrap-ups.
export function isFluencyCycle(cycle) {
  return (cycle?.cycleNumber || 0) >= 25;
}

export function stationsForCycle(cycle) {
  const templates = isFluencyCycle(cycle) ? FLUENCY_STATIONS : STANDARD_STATIONS;
  const focus = focusEntries(cycle);
  const hasSingleFocus = focus.some(entry => entry.spelling.length === 1);
  const hasMultiTraceFocus = focus.some(entry => entry.spelling.length === 2);
  const hasOnlyEndingSoundFocus = focus.length > 0
    && focus.every(entry => ENDING_SOUND_PATTERNS.has(entry.spelling));
  const hasEndingSoundFocus = focus.some(entry => ENDING_SOUND_PATTERNS.has(entry.spelling));
  const definitions = templates.map(template => {
    if (template.id === "sounds" && hasOnlyEndingSoundFocus) {
      return {
        ...template,
        title: "Ending Sound Gate",
        subtitle: "Hear an ending sound family"
      };
    }
    if (template.id === "sounds" && hasEndingSoundFocus) {
      return {
        ...template,
        title: "Sound & Ending Gate",
        subtitle: "Hear a sound or ending family"
      };
    }
    if (template.id === "letters" && buildLetterRounds(cycle).length === 0) {
      return {
        ...template,
        title: "Code Spot",
        subtitle: "Find the whole grapheme in words",
        mechanicIds: ["patternSort"],
        build: buildCodeSpotRounds
      };
    }
    if (template.id === "hunt" && buildHuntRounds(cycle).length === 0) {
      return {
        ...template,
        title: "Sound Sort",
        subtitle: "Sort words by their ending spelling",
        mechanicIds: ["sceneHunt"],
        build: buildSoundSortRounds
      };
    }
    if (template.id === "trace" && !hasSingleFocus) {
      return {
        ...template,
        title: "Code Trace",
        subtitle: "Practise the whole grapheme path"
      };
    }
    if (template.id === "trace" && hasMultiTraceFocus) {
      return {
        ...template,
        title: "Letter & Code Trace",
        subtitle: "Practise a letter or whole grapheme path"
      };
    }
    return template;
  }).filter(definition => definition.build(cycle).length > 0);

  const mechanicIds = uniqueChoices(definitions.flatMap(station => station.mechanicIds));
  if (mechanicIds.length) {
    definitions.push({
      id: "check",
      title: "Cycle Quest",
      subtitle: "Show what you can do, then recover with support",
      icon: "check",
      mechanicIds,
      build: null
    });
  }
  return definitions;
}

function createCycleQuestBlueprint(cycle, limit = 10) {
  const requestedLength = Math.max(1, Math.floor(Number(limit) || 10));
  const candidates = stationsForCycle(cycle)
    .filter(station => station.id !== "check" && station.build)
    .flatMap(station => station.build(cycle))
    .filter(isCycleQuestEligibleRound);
  const byConstruct = new Map();

  for (const round of candidates) {
    const construct = String(round?.construct || "").trim();
    if (!construct) continue;
    if (!byConstruct.has(construct)) byConstruct.set(construct, []);
    byConstruct.get(construct).push(round);
  }

  // Ten is the normal run length, not a licence to drop an available
  // construct. Later cycles expose up to twelve distinct eligible constructs,
  // so extend those quests until every construct has one representative.
  const maximum = Math.max(requestedLength, byConstruct.size);

  // Sample every eligible literacy construct before adding a second example
  // of any construct. This keeps the Cycle Quest broad even when one station
  // happens to generate many more rounds than its neighbours.
  const firstPass = [...byConstruct.values()]
    .map(rounds => rounds[0])
    .filter(Boolean);
  const selected = new Set(firstPass);
  const remaining = shuffleItems(candidates.filter(round => !selected.has(round)));
  const rounds = [...firstPass, ...remaining].slice(0, maximum);

  if (!rounds.length) {
    throw new Error(`Adventure Map Cycle Quest has no truthful rounds for cycle ${cycle?.cycleNumber || "unknown"}.`);
  }

  return {
    rounds,
    manifest: rounds.map(round => round.construct)
  };
}

export function buildCycleQuestBlueprint(cycle, limit = 10, options = {}) {
  return withShuffleSeed(options.seed, () => createCycleQuestBlueprint(cycle, limit));
}

export function isCycleQuestEligibleRound(round) {
  // Phrase Flow is valuable supported oral rehearsal, but its model-and-echo
  // completion is deliberately support-only and cannot provide an independent
  // first-attempt result. Keep it in practice without making a perfect Cycle
  // Quest score impossible by construction.
  return round?.mechanicId !== "phraseFlow"
    && round?.construct !== "supported_phrase_reading";
}

export function buildStationRounds(cycle, stationId, options = {}) {
  if (stationId === "check") {
    return buildCycleQuestBlueprint(cycle, 10, options).rounds;
  }
  return withShuffleSeed(options.seed, () => {
    const station = stationsForCycle(cycle).find(item => item.id === stationId);
    if (!station?.build) {
      throw new Error(`Adventure Map station "${stationId}" is unknown or ineligible for cycle ${cycle?.cycleNumber || "unknown"}.`);
    }
    const rounds = station.build(cycle);
    if (!rounds.length) {
      throw new Error(`Adventure Map station "${stationId}" has no truthful rounds for cycle ${cycle?.cycleNumber || "unknown"}.`);
    }
    return rounds;
  });
}

export function starsForAccuracy(correct, total, wrongs) {
  if (!total) return 0;
  if (correct >= total && wrongs === 0) return 3;
  if (correct >= Math.ceil(total * 0.7)) return 2;
  return correct > 0 ? 1 : 0;
}
