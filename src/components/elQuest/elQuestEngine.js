// Adventure Map practice uses one direct child action per game. Printed code
// stays inside the taught cycle; pictured and spoken oral-language games may
// use richer vocabulary without claiming independent decoding evidence.
import { LETTER_EXAMPLES } from "../../data/elSkillsBlockCycles.js";
import { CYCLE_WORD_BUILD_INVENTORY as ADVENTURE_WORD_BUILD_INVENTORY } from "../../data/cycleWordBuildInventory.js";
import { getChildWordAsset } from "../../data/childAssets.js";
import { findAssessmentMediaCandidates } from "../../data/assessmentMediaRegistry.js";
import { assessmentImageStyleBlockedPaths } from "../../data/assessmentImageStyleBlocklist.js";
import { imageQaReviewBlockedPaths } from "../../data/generated/imageQaReviewBlocklist.generated.js";
import { AUDIO_QUEST_PATHS } from "../../data/generated/audioQuestPaths.generated.js";
import { hasKnownBadWordAudio, isKnownBadAudioPath } from "../../data/knownBadWordAudio.js";
import { getPreferredPhonemeAudioPath } from "../../data/phonemeAudioBank.js";
import { getLedaProductionAudioPath, getLedaWordAudioPath } from "../../data/ledaProductionAudio.js";

import { CYCLE_SOUND_WORDS, cycleSoundPosition, isCyclePictureWordEligible } from "../../data/cycleSoundWords.js";
import { cycleCardGraphemes, taughtCycleGraphemes, taughtCycleHighFrequencyWords, capPracticeRepetitions } from "../../utils/cyclePracticeVariation.js";

export { ADVENTURE_MECHANIC_IDS } from "./adventureRoundModel.js";
export { ADVENTURE_WORD_BUILD_INVENTORY };

const SAME_SOUND_GROUPS = [
  ["c", "k"], ["w", "wh"], ["f", "ff"], ["s", "ss"], ["z", "zz"], ["l", "ll"]
];
export function sharesSound(a, b) {
  const left = String(a || "").toLowerCase();
  const right = String(b || "").toLowerCase();
  return left === right || SAME_SOUND_GROUPS.some(group => group.includes(left) && group.includes(right));
}

// These are sound exceptions, not spelling guesses. A containing letter never
// authorizes an initial-sound answer (map is /m/; ham is not).
const PHONETIC_ONSETS = Object.freeze({
  cell: "s", cells: "s", cent: "s", center: "s", cents: "s", circle: "s", city: "s",
  europe: "y", unit: "y", use: "y", knew: "n", know: "n", known: "n",
  one: "w", once: "w", phrase: "f", whole: "h", who: "h", whose: "h",
  write: "r", wrong: "r", wrote: "r"
});
export function onsetGrapheme(word) {
  const clean = String(word || "").toLowerCase();
  return PHONETIC_ONSETS[clean]
    || ["sh", "ch", "th", "wh", "qu"].find(part => clean.startsWith(part))
    || clean[0] || "";
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
  try { return build(); } finally { activeShuffleRandom = previous; }
}
export function shuffleItems(items) {
  const copy = [...items];
  const random = activeShuffleRandom || Math.random;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [copy[index], copy[next]] = [copy[next], copy[index]];
  }
  return copy;
}
const unique = values => [...new Set(values)];
const phonemeAudioCache = new Map();
const wordAudioCache = new Map();
const letterNameAudioCache = new Map();
function firstExisting(paths) {
  return paths.find(path => path && AUDIO_QUEST_PATHS.has(path) && !isKnownBadAudioPath(path)) || "";
}
export function graphemeAudioPath(spelling) {
  const key = String(spelling || "");
  if (!phonemeAudioCache.has(key)) phonemeAudioCache.set(key, getPreferredPhonemeAudioPath(spelling));
  return phonemeAudioCache.get(key);
}
export function wordAudioPath(word) {
  const key = String(word || "");
  if (wordAudioCache.has(key)) return wordAudioCache.get(key);
  const slug = String(word || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const ledaPath = getLedaWordAudioPath(word);
  const path = hasKnownBadWordAudio(slug) && !ledaPath ? "" : firstExisting([ledaPath]);
  wordAudioCache.set(key, path);
  return path;
}
function letterNameAudioPath(letter) {
  if (!letterNameAudioCache.has(letter)) letterNameAudioCache.set(letter, firstExisting([getLedaProductionAudioPath(letter, ["letter_name"])]));
  return letterNameAudioCache.get(letter);
}

const imageCache = new Map();
const blockedImageStems = new Set([...assessmentImageStyleBlockedPaths, ...imageQaReviewBlockedPaths]
  .map(path => path.replace(/\.(png|webp|jpe?g)$/iu, "")));
// The exact sunflower object has not yet joined the shared registry. This
// already-owned illustration is the only local semantic image supplement.
const EXACT_PICTURE_SUPPLEMENTS = Object.freeze({
  sunflower: "/images/assessment/generated/initial-sounds-l2/sunflower.webp"
});
export function adventureWordImage(word) {
  if (imageCache.has(word)) return imageCache.get(word);
  const owned = getChildWordAsset(word);
  const choices = [owned?.image, EXACT_PICTURE_SUPPLEMENTS[word],
    ...findAssessmentMediaCandidates({ word, mediaType: "image", role: "target_object" }).map(item => item.path)];
  const image = choices.find(path => path && !blockedImageStems.has(path.replace(/\.(png|webp|jpe?g)$/iu, ""))) || "";
  imageCache.set(word, image);
  return image;
}
function picturedWord(word) {
  if (!isCyclePictureWordEligible(word)) return null;
  const image = adventureWordImage(word);
  const audio = wordAudioPath(word);
  return image && audio ? { word, image, audio } : null;
}

export const taughtGraphemesThrough = taughtCycleGraphemes;
function focusSpellings(cycle) {
  const taught = taughtGraphemesThrough(cycle?.cycleNumber || 1);
  const own = unique((cycle?.focusLetters || []).flatMap(cycleCardGraphemes)).filter(value => taught.includes(value));
  if (own.length) return own;
  const review = unique((cycle?.reviewLetters || []).flatMap(cycleCardGraphemes)).filter(value => taught.includes(value));
  return review.length ? review : taught;
}
function practiceTargets(cycle, eligible = () => true) {
  const focus = shuffleItems(focusSpellings(cycle).filter(eligible));
  const review = shuffleItems(taughtGraphemesThrough(cycle.cycleNumber).filter(value => eligible(value) && !focus.includes(value)));
  const targets = [];
  for (let index = 0; index < Math.max(focus.length, review.length); index += 1) {
    if (focus[index]) targets.push(focus[index]);
    if (review[index]) targets.push(review[index]);
  }
  return targets;
}
function letterFocus(cycle) { return practiceTargets(cycle, value => value.length === 1); }
function sightWordForm(word) {
  const lower = String(word || "").trim().toLowerCase();
  return lower === "i" ? "I" : lower;
}
function taughtHfwThrough(cycleNumber) {
  return taughtCycleHighFrequencyWords(cycleNumber).map(sightWordForm);
}
function round(cycle, mechanicId, key, data) {
  return { mechanicId, roundKey: `${cycle.id}:${mechanicId}:${key}`, recoverable: true, ...data };
}

function buildLetterRounds(cycle) {
  const taught = taughtGraphemesThrough(cycle.cycleNumber).filter(value => value.length === 1);
  const targets = letterFocus(cycle);
  return [false, true].flatMap(chooseUpper => targets.map(letter => {
    const modelForm = chooseUpper ? letter : letter.toUpperCase();
    const partnerForm = chooseUpper ? letter.toUpperCase() : letter;
    const prompt = chooseUpper ? "Find the big letter." : "Find the small letter.";
    const decoys = shuffleItems(taught.filter(value => value !== letter)).slice(0, 2);
    return round(cycle, "letterPair", `${letter}:${chooseUpper}`, {
      type: "letter", construct: "visual_letter_identity", prompt, instruction: prompt,
      targetGrapheme: letter, modelForm, partnerForm, display: modelForm,
      audio: letterNameAudioPath(letter), speechFallback: letter,
      choices: shuffleItems([partnerForm, ...decoys.map(value => chooseUpper ? value.toUpperCase() : value)]),
      answer: partnerForm, choiceStyle: "letter"
    });
  }));
}

const ENDING_PATTERNS = new Set(["all", "nk", "ng", "ang", "ing", "ong", "ung", "ff", "ss", "zz", "ll"]);
const PATTERN_EXAMPLES = Object.freeze({
  ang: ["bang"], ing: ["ring"], ong: ["song"], ung: ["hung"], ff: ["puff"], ss: ["miss"], zz: ["buzz"], ll: ["bell"]
});
function buildSoundRounds(cycle, passes = 2) {
  const taught = taughtGraphemesThrough(cycle.cycleNumber);
  const targets = practiceTargets(cycle);
  return Array.from({ length: passes }, (_, pass) => pass).flatMap(pass => targets.flatMap(target => {
    const phoneme = graphemeAudioPath(target);
    const cueWord = (LETTER_EXAMPLES[target] || PATTERN_EXAMPLES[target] || []).find(word => wordAudioPath(word)) || "";
    const audio = phoneme || wordAudioPath(cueWord);
    if (!audio) return [];
    // Equivalent spellings are never wrong alternatives for the same sound.
    const decoys = shuffleItems(taught.filter(value => !sharesSound(value, target)
      && !(ENDING_PATTERNS.has(target) && (target.endsWith(value) || value.endsWith(target))))).slice(0, 2);
    if (!decoys.length) return [];
    const prompt = ENDING_PATTERNS.has(target)
      ? "Choose the ending letters." : "Choose the letter for this sound.";
    return [round(cycle, "soundChoice", `${target}:${pass}`, {
      type: "sound", construct: ENDING_PATTERNS.has(target) ? "heard_ending_sound_family_mapping" : "heard_phoneme_grapheme_mapping",
      prompt, instruction: prompt, targetGrapheme: target, acceptedAnswers: [target],
      soundPosition: ENDING_PATTERNS.has(target) ? "end" : "first",
      audio, audioRequired: true, speechFallback: "", cueWord: phoneme ? "" : cueWord,
      choices: shuffleItems([target, ...decoys]), answer: target, choiceStyle: "letter"
    })];
  }));
}

// Cycle Practice and Adventure Map share the authored phoneme examples.
// In particular, short vowels never inherit a picture just from its spelling.
const INITIAL_PICTURE_WORDS = Object.freeze(Object.fromEntries(Object.entries(CYCLE_SOUND_WORDS)
  .filter(([target]) => cycleSoundPosition(target) === "first")));
function initialPicturePool(target) {
  return (INITIAL_PICTURE_WORDS[target] || []).filter(word => sharesSound(onsetGrapheme(word), target)).map(picturedWord).filter(Boolean);
}
function huntTargets(cycle, minimum = 1) {
  const valid = target => graphemeAudioPath(target) && initialPicturePool(target).length >= minimum;
  return practiceTargets(cycle, valid);
}
function pictureDecoyPool(cycle) {
  const taught = taughtGraphemesThrough(cycle.cycleNumber);
  return unique(Object.entries(INITIAL_PICTURE_WORDS)
    .filter(([target]) => taught.some(grapheme => sharesSound(grapheme, target)))
    .flatMap(([, words]) => words)).map(picturedWord).filter(Boolean);
}
function isInitialSoundDecoy(word, target) {
  const onset = onsetGrapheme(word);
  // Queen and quilt begin /k w/: they cannot be wrong choices for /k/.
  // Keep the /qu/ picture family separate without teaching a false negative.
  return !sharesSound(onset, target) && !(onset === "qu" && sharesSound(target, "k"));
}
function buildHuntRounds(cycle) {
  return huntTargets(cycle).flatMap(target => shuffleItems(initialPicturePool(target)).slice(0, 2).map((answer, index) => {
    const decoys = shuffleItems(pictureDecoyPool(cycle).filter(item => isInitialSoundDecoy(item.word, target))).slice(0, 2);
    const objects = shuffleItems([answer, ...decoys]).map(item => ({ ...item, matches: item.word === answer.word }));
    return round(cycle, "sceneHunt", `${target}:${index}:${answer.word}`, {
      type: "hunt", construct: "initial_phoneme_discrimination",
      prompt: "Find the picture that starts with this sound.", instruction: "Find the picture that starts with this sound.",
      targetGrapheme: target, audio: graphemeAudioPath(target), audioRequired: true, speechFallback: "",
      objects, choices: objects.map(item => item.word), answer: answer.word, choiceStyle: "picture"
    });
  }));
}

function practiceSightWords(cycle) {
  const taught = taughtHfwThrough(cycle.cycleNumber).filter(word => wordAudioPath(word));
  const own = (cycle.highFrequencyWords || []).map(sightWordForm).filter(word => taught.includes(word));
  // Early outings revisit every taught sight word. Later ones mix the current
  // words with fresh earlier review instead of presenting an ever-longer deck.
  return unique([...shuffleItems(own), ...shuffleItems(taught)]).slice(0, 12);
}
function sightWordFoilRank(candidate, word) {
  const left = candidate.toLowerCase(), right = word.toLowerCase();
  if (left.length !== right.length) return 3;
  const differences = [...right].filter((letter, index) => letter !== left[index]).length;
  return differences === 1 ? 0 : left[0] === right[0] ? 1 : 2;
}
function buildSightWordRounds(cycle, targets) {
  const taught = taughtHfwThrough(cycle.cycleNumber).filter(word => wordAudioPath(word));
  return [0, 1].flatMap(pass => targets.map(word => {
    const decoys = shuffleItems(taught.filter(candidate => candidate !== word))
      .sort((left, right) => sightWordFoilRank(left, word) - sightWordFoilRank(right, word)).slice(0, 2);
    return round(cycle, "sightWordChoice", `${word}:${pass}`, {
      type: "word", construct: "auditory_word_recognition",
      prompt: "Listen. Tap the word.", instruction: "Listen. Tap the word.",
      word, targetWord: word, answer: word, acceptedAnswers: [word],
      choices: shuffleItems([word, ...decoys]), audio: wordAudioPath(word), audioRequired: true,
      speechFallback: "", choiceStyle: "word", semanticKey: `sightWordChoice:${word}`,
      evidenceScope: "auditory_word_recognition_practice"
    });
  }));
}
function buildMemoryRounds(cycle, targets) {
  const pairCount = Math.min(cycle.cycleNumber <= 3 ? 3 : 4, targets.length);
  if (pairCount < 2) return [];
  const boardCount = Math.min(3, Math.ceil(targets.length / pairCount));
  return Array.from({ length: boardCount }, (_, pass) => {
    const words = Array.from({ length: pairCount }, (_, index) => targets[(pass * pairCount + index) % targets.length]);
    const cards = shuffleItems(words.flatMap(word => [word, word]))
      .map((word, index) => ({ id: `card-${pass}-${index}`, word }));
    return round(cycle, "wordMemory", `${pass}:${words.join("-")}`, {
      type: "memory", construct: "high_frequency_word_matching", prompt: "Find the matching words.", instruction: "Find the matching words.",
      cards, words, answer: words, audio: "", speechFallback: "",
      choiceStyle: "word", evidenceScope: "visual_word_matching_practice"
    });
  });
}
function buildWordRounds(cycle) {
  const targets = practiceSightWords(cycle);
  return [...buildSightWordRounds(cycle, targets), ...buildMemoryRounds(cycle, targets)];
}

// Exact short-vowel CVC spellings paired with visually reviewed, text-free
// pictures. Pin the reviewed image so registry changes cannot reveal a word
// that the child is completing. Sat's labelled art and ambiguous man, fin,
// dad, lot, gum, gap and vet pictures are deliberately absent. No HFW
// membership authorizes phonics code; x represents /k s/ and is not CVC here.
function buildMissingLetterRounds(cycle) {
  const taught = taughtGraphemesThrough(cycle.cycleNumber);
  const focus = focusSpellings(cycle);
  const eligible = ADVENTURE_WORD_BUILD_INVENTORY.filter(item => item.authorizedFromCycle <= cycle.cycleNumber
    && item.graphemes.every(letter => taught.includes(letter)) && wordAudioPath(item.word)
    && !blockedImageStems.has(item.image.replace(/\.(png|webp|jpe?g)$/iu, "")));
  const focused = eligible.filter(item => item.graphemes.some(letter => focus.includes(letter)));
  const entries = [...shuffleItems(focused), ...shuffleItems(eligible.filter(item => !focused.includes(item)))].slice(0, 4);
  return entries.flatMap(entry => [0, 2].map(missingIndex => {
    const missingGrapheme = entry.graphemes[missingIndex];
    const missingPosition = missingIndex === 0 ? "start" : "end";
    const choices = shuffleItems([missingGrapheme, ...shuffleItems(taught.filter(letter => letter.length === 1
      && !/[aeiou]/u.test(letter) && !sharesSound(letter, missingGrapheme))).slice(0, 2)]);
    const prompt = missingIndex === 0 ? "Choose the first letter." : "Choose the last letter.";
    return round(cycle, "missingLetter", `${entry.word}:${missingPosition}`, {
      type: "build", construct: missingIndex === 0 ? "initial_phoneme_completion" : "final_phoneme_completion",
      prompt, instruction: prompt, word: entry.word, answer: entry.word, targetWord: entry.word,
      graphemes: [...entry.graphemes], missingIndex, missingPosition, missingGrapheme,
      display: entry.graphemes.map((letter, index) => index === missingIndex ? "_" : letter).join(" "),
      image: entry.image, audio: wordAudioPath(entry.word), audioRequired: true, speechFallback: entry.word,
      choices, choiceStyle: "letter", inventoryAuthorization: "reviewed-short-vowel-cvc-v2"
    });
  }));
}

function buildGridRounds(cycle) {
  const taught = taughtGraphemesThrough(cycle.cycleNumber).filter(value => value.length === 1);
  const focus = shuffleItems(focusSpellings(cycle).filter(letter => letter.length === 1));
  const review = shuffleItems(taught.filter(letter => !focus.includes(letter)));
  // Each letter appears on one board only. A child finds at most three of
  // either case, rather than finding A again on several near-identical grids.
  const targetSets = [];
  const groupSize = taught.length > 2 ? 2 : 1;
  for (const group of [focus, review]) {
    for (let index = 0; index < group.length; index += groupSize) targetSets.push(group.slice(index, index + groupSize));
  }
  return targetSets.map((targetLetters, pass) => {
    const decoys = taught.filter(letter => !targetLetters.includes(letter));
    const targetForms = targetLetters.flatMap(letter => [letter, letter.toUpperCase()]);
    const distractorLetters = shuffleItems(decoys).slice(0, 3);
    const wrongForms = distractorLetters.flatMap(letter => [letter, letter.toUpperCase()]);
    const labels = [...Array.from({ length: 6 }, (_, index) => targetForms[index % targetForms.length]),
      ...Array.from({ length: 6 }, (_, index) => wrongForms[index % wrongForms.length])];
    const cells = shuffleItems(labels).map((letter, index) => ({ id: `${pass}:${index}`, letter, matches: targetLetters.includes(letter.toLowerCase()) }));
    return round(cycle, "letterGrid", `${pass}:${targetLetters.join("-")}`, {
      type: "grid", construct: "visual_letter_search", prompt: "Find all the big and small letters.", instruction: "Find all the big and small letters.",
      targetLetters, cells, answer: cells.filter(cell => cell.matches).map(cell => cell.id),
      audio: letterNameAudioPath(targetLetters[0]), speechFallback: targetLetters.join(" and "), choiceStyle: "letter"
    });
  });
}

// Spoken rhyme families are authored, not inferred from the last letter.
// The extra vocabulary is pictured and named; these are oral sound games.
export const ADVENTURE_RHYME_FAMILIES = Object.freeze([
  ["cat", "hat", "bat", "rat", "mat"], ["map", "cap", "tap"], ["dog", "log", "frog"],
  ["sun", "bun", "run"], ["pig", "wig", "fig"], ["fox", "box"], ["moon", "spoon"],
  ["boat", "goat", "coat"], ["bell", "shell"], ["ring", "king", "wing"], ["duck", "truck"],
  ["fish", "dish"], ["chair", "bear", "pear"], ["bed", "red"], ["cake", "snake", "lake"]
].map(words => Object.freeze(words)));
export function adventureWordsRhyme(left, right) {
  return left !== right && ADVENTURE_RHYME_FAMILIES.some(words => words.includes(left) && words.includes(right));
}
function buildRhymeRounds(cycle) {
  const families = ADVENTURE_RHYME_FAMILIES.map(words => words.filter(word => picturedWord(word))).filter(words => words.length >= 2);
  const selected = shuffleItems(families).slice(0, 3);
  const pool = unique(families.flat());
  return selected.flatMap((family, pass) => {
    const pair = shuffleItems(family).slice(0, 2);
    const decoy = shuffleItems(pool.filter(word => !family.includes(word)))[0];
    const choices = shuffleItems([...pair, decoy]);
    const prompt = "Find the two words that rhyme.";
    return [round(cycle, "rhymePair", `${pass}:${pair.join("-")}:${decoy}`, {
        type: "rhyme", construct: "rhyme_matching",
        prompt, instruction: prompt, choices,
        answer: pair, correctPairs: [pair], rhymingWords: pair,
        objects: choices.map(word => ({ ...picturedWord(word), matches: pair.includes(word) })),
        audio: "", audioRequired: true, speechFallback: "", choiceStyle: "picture",
        languageSupport: "pictured_and_spoken_oral_vocabulary", comparison: "same_rime"
      })];
  });
}

export const ADVENTURE_COMPOUNDS = Object.freeze([
  { parts: ["sun", "flower"], word: "sunflower" },
  { parts: ["tooth", "brush"], word: "toothbrush" },
  { parts: ["foot", "ball"], word: "football" },
  { parts: ["rain", "bow"], word: "rainbow" }
].map(item => Object.freeze(item)));
function buildCompoundRounds(cycle) {
  const compounds = ADVENTURE_COMPOUNDS.filter(item => picturedWord(item.word) && item.parts.every(part => picturedWord(part)));
  return shuffleItems(compounds).slice(0, 3).map(item => {
    const choices = shuffleItems([item.word, ...shuffleItems(compounds.filter(other => other.word !== item.word)).slice(0, 2).map(other => other.word)]);
    return round(cycle, "compoundPicture", item.word, {
      type: "compound", construct: "oral_compound_blending", prompt: "What word do these two pictures make?", instruction: "What word do these two pictures make?",
      parts: item.parts.map(picturedWord), choices, answer: item.word,
      objects: choices.map(word => ({ ...picturedWord(word), matches: word === item.word })),
      audio: "", audioRequired: true, speechFallback: "", choiceStyle: "picture",
      languageSupport: "pictured_and_spoken_oral_vocabulary"
    });
  });
}

const SEARCH_POSITIONS = Object.freeze([
  [17, 20], [50, 20], [82, 20], [17, 50], [50, 50], [82, 50], [17, 80], [50, 80], [82, 80]
]);
function buildPictureSearchRounds(cycle) {
  const targets = huntTargets(cycle, 2);
  const world = cycle.cycleNumber <= 9 ? "meadow" : cycle.cycleNumber <= 18 ? "dino" : "moonwood";
  return targets.map((target, pass) => {
    const matches = shuffleItems(initialPicturePool(target)).slice(0, 3);
    const decoys = shuffleItems(pictureDecoyPool(cycle).filter(item => isInitialSoundDecoy(item.word, target))).slice(0, 9 - matches.length);
    const objects = shuffleItems([...matches, ...decoys]).map((item, index) => ({
      ...item, id: `${pass}:${item.word}`, matches: sharesSound(onsetGrapheme(item.word), target),
      x: SEARCH_POSITIONS[index][0], y: SEARCH_POSITIONS[index][1]
    }));
    const sceneBackground = `/images/learn-games/word-bridge/${world}-background-clean-v2.webp`;
    return round(cycle, "pictureSearch", `${target}:${pass}`, {
      type: "search", construct: "initial_phoneme_picture_search",
      prompt: "Find all the pictures that start with this sound.", instruction: "Find all the pictures that start with this sound.",
      targetGrapheme: target, objects, choices: objects.map(item => item.word), answer: objects.filter(item => item.matches).map(item => item.word),
      scene: sceneBackground, sceneBackground, sceneAlt: "A picture hunt with animals and familiar objects.",
      audio: graphemeAudioPath(target), audioRequired: true, speechFallback: "", choiceStyle: "picture"
    });
  });
}

const STANDARD_STATIONS = [
  { id: "letters", title: "Letter Match", subtitle: "Match big and small letters", icon: "letters", mechanicIds: ["letterPair"], build: buildLetterRounds },
  { id: "sounds", title: "Sound Match", subtitle: "Hear a sound and choose", icon: "sounds", mechanicIds: ["soundChoice"], build: buildSoundRounds },
  { id: "hunt", title: "Picture Sounds", subtitle: "Find the first sound", icon: "hunt", mechanicIds: ["sceneHunt"], build: buildHuntRounds },
  { id: "quick", title: "Word Match", subtitle: "Hear, find and pair words", icon: "quick", mechanicIds: ["sightWordChoice", "wordMemory"], build: buildWordRounds },
  { id: "build", title: "Missing Letters", subtitle: "Start or finish the word", icon: "build", mechanicIds: ["missingLetter"], build: buildMissingLetterRounds },
  { id: "play", title: "Rhyme Time", subtitle: "Listen for rhyming words", icon: "play", optional: true, mechanicIds: ["rhymePair"], build: buildRhymeRounds },
  { id: "poem", title: "Picture Words", subtitle: "Two pictures make one word", icon: "poem", optional: true, mechanicIds: ["compoundPicture"], build: buildCompoundRounds },
  { id: "trace", title: "Letter Find", subtitle: "Find letters in the grid", icon: "trace", mechanicIds: ["letterGrid"], build: buildGridRounds },
  { id: "search", title: "Picture Search", subtitle: "Find sounds in a big picture", icon: "hunt", mechanicIds: ["pictureSearch"], build: buildPictureSearchRounds }
];
// Teacher assignments retain their saved station IDs while children see the
// simple current game. No retired activity is restored through an old ID.
const FLUENCY_STATIONS = [
  { ...STANDARD_STATIONS[7], id: "pattern", title: "Sound and Letter Match", subtitle: "Hear sounds and find letters", icon: "pattern",
    mechanicIds: ["soundChoice", "letterGrid"], build: cycle => [...buildSoundRounds(cycle, 1), ...buildGridRounds(cycle)] },
  { ...STANDARD_STATIONS[4], id: "chain", icon: "chain" },
  { ...STANDARD_STATIONS[5], id: "speed", icon: "speed" },
  STANDARD_STATIONS[6],
  { ...STANDARD_STATIONS[3], id: "spell", icon: "spell" },
  STANDARD_STATIONS[8]
];
export const STATIONS = STANDARD_STATIONS;
export function isFluencyCycle(cycle) { return (cycle?.cycleNumber || 0) >= 25; }
const CYCLE_QUEST_MECHANICS = new Set([
  "letterPair", "soundChoice", "sceneHunt", "sightWordChoice", "missingLetter", "letterGrid", "pictureSearch"
]);
const stationAvailability = new WeakMap();
export function stationsForCycle(cycle) {
  if (!cycle?.cycleNumber) return [];
  if (!stationAvailability.has(cycle)) {
    // Availability is immutable for an authored cycle and loaded media bank.
    // Its one-time probe has its own seed, so opening the map cannot consume
    // a player's round randomness or rebuild every game on each render.
    const definitions = withShuffleSeed(`availability:${cycle.id}:${cycle.cycleNumber}`, () => {
      const templates = isFluencyCycle(cycle) ? FLUENCY_STATIONS : STANDARD_STATIONS;
      return templates.filter(definition => definition.build(cycle).length > 0);
    });
    const mechanicIds = unique(definitions.flatMap(station => station.mechanicIds)).filter(id => CYCLE_QUEST_MECHANICS.has(id));
    if (mechanicIds.length) definitions.push({ id: "check", title: "Cycle Quest", subtitle: "Play a mix of your games", icon: "check", mechanicIds, build: null });
    stationAvailability.set(cycle, definitions);
  }
  return stationAvailability.get(cycle).map(definition => ({ ...definition, mechanicIds: [...definition.mechanicIds] }));
}
function createCycleQuestBlueprint(cycle, limit = 10) {
  const requested = Math.max(1, Math.floor(Number(limit) || 10));
  const candidates = stationsForCycle(cycle).filter(station => station.build)
    .flatMap(station => station.build(cycle)).filter(isCycleQuestEligibleRound);
  const byConstruct = new Map();
  for (const candidate of candidates) {
    if (!byConstruct.has(candidate.construct)) byConstruct.set(candidate.construct, []);
    byConstruct.get(candidate.construct).push(candidate);
  }
  // The mixed outing concentrates on taught code and word recognition. Rhyme,
  // compound and hidden-card games remain short optional station choices.
  // Visual case matching/search is useful practice, but cannot establish
  // hearing and mapping a sound. Count only a spoken phonics decision here.
  const targetsOf = item => ["soundChoice", "sceneHunt", "pictureSearch"].includes(item.mechanicId)
    ? [item.targetGrapheme].filter(Boolean)
    : item.mechanicId === "missingLetter" ? [item.missingGrapheme].filter(Boolean) : [];
  const wordOf = item => item.mechanicId === "sightWordChoice" ? item.targetWord : "";
  const availableTargets = new Set(candidates.flatMap(targetsOf));
  const assigned = cycle.focusLetters?.length ? cycle.focusLetters : cycle.reviewLetters || [];
  const focus = unique(assigned.flatMap(cycleCardGraphemes)).filter(value => availableTargets.has(value));
  const review = taughtGraphemesThrough(cycle.cycleNumber).filter(value => !focus.includes(value) && availableTargets.has(value));
  const wanted = cycle.cycleNumber <= 4
    ? taughtGraphemesThrough(cycle.cycleNumber).filter(value => availableTargets.has(value))
    : unique([...focus, ...review.slice(0, 2), ...shuffleItems(review.slice(2)).slice(0, 2)]);
  const availableWords = unique(candidates.map(wordOf).filter(Boolean));
  const ownWords = (cycle.highFrequencyWords || []).map(sightWordForm).filter(word => availableWords.includes(word));
  const wantedWords = cycle.cycleNumber <= 4 ? availableWords : unique([
    ...ownWords,
    ...shuffleItems(availableWords.filter(word => !ownWords.includes(word))).slice(0, Math.max(2, 6 - ownWords.length))
  ]);
  const covered = new Set();
  const coveredWords = new Set();
  const recordCoverage = item => {
    targetsOf(item).forEach(target => covered.add(target));
    if (wordOf(item)) coveredWords.add(wordOf(item));
  };
  const gain = item => targetsOf(item).filter(target => wanted.includes(target) && !covered.has(target)).length
    + (wantedWords.includes(wordOf(item)) && !coveredWords.has(wordOf(item)) ? 1 : 0);
  const firstPass = [...byConstruct.values()].map(rows => {
    const chosen = shuffleItems(rows).reduce((best, item) => gain(item) > gain(best) ? item : best);
    recordCoverage(chosen);
    return chosen;
  });
  for (const target of wanted.filter(value => !covered.has(value))) {
    if (covered.has(target)) continue;
    const extra = shuffleItems(candidates).find(item => targetsOf(item).includes(target) && !firstPass.includes(item));
    if (extra) { firstPass.push(extra); recordCoverage(extra); }
  }
  for (const word of wantedWords.filter(value => !coveredWords.has(value))) {
    const extra = shuffleItems(candidates).find(item => wordOf(item) === word && !firstPass.includes(item));
    if (extra) { firstPass.push(extra); recordCoverage(extra); }
  }
  const selected = new Set(firstPass);
  const keys = new Set(firstPass.map(item => item.roundKey));
  const remaining = shuffleItems(candidates.filter(candidate => !selected.has(candidate) && !keys.has(candidate.roundKey)));
  const selectedRounds = [...firstPass];
  const targetLength = Math.max(requested, firstPass.length);
  const minimumWordRounds = Math.min(availableWords.length * 2, Math.ceil(targetLength * 0.35));
  while (selectedRounds.length < targetLength && remaining.length) {
    const needsWord = selectedRounds.filter(item => wordOf(item)).length < minimumWordRounds;
    const index = needsWord ? remaining.findIndex(item => wordOf(item)) : 0;
    selectedRounds.push(...remaining.splice(Math.max(0, index), 1));
  }
  const rounds = spaceMixedRounds(capPracticeRepetitions(selectedRounds));
  if (!rounds.length) throw new Error(`Adventure Map Cycle Quest has no truthful rounds for cycle ${cycle?.cycleNumber || "unknown"}.`);
  return { rounds, manifest: rounds.map(item => item.construct), requiredGraphemes: wanted, requiredHighFrequencyWords: wantedWords };
}
export function buildCycleQuestBlueprint(cycle, limit = 10, options = {}) {
  return withShuffleSeed(options.seed, () => createCycleQuestBlueprint(cycle, limit));
}
export function isCycleQuestEligibleRound(round) {
  return Boolean(round?.construct && CYCLE_QUEST_MECHANICS.has(round?.mechanicId) && round?.recoverable !== false);
}
function spaceMixedRounds(rounds) {
  const groups = new Map();
  for (const item of shuffleItems(rounds)) {
    if (!groups.has(item.mechanicId)) groups.set(item.mechanicId, []);
    groups.get(item.mechanicId).push(item);
  }
  const ordered = [];
  while ([...groups.values()].some(items => items.length)) {
    const queues = [...groups.entries()].filter(([, items]) => items.length).sort((left, right) => right[1].length - left[1].length);
    const [, queue] = queues.find(([id]) => id !== ordered.at(-1)?.mechanicId) || queues[0];
    ordered.push(queue.shift());
  }
  return ordered;
}
function spaceStationRounds(rounds, cycle) {
  const focus = focusSpellings(cycle);
  const ownWords = (cycle.highFrequencyWords || []).map(sightWordForm);
  const isFocus = item => (item.targetLetters || [item.targetGrapheme]).some(target => focus.includes(target)) || ownWords.includes(item.targetWord);
  const targetOf = item => item?.targetWord || item?.targetGrapheme || item?.targetLetters?.join("-");
  const remaining = capPracticeRepetitions(shuffleItems(rounds));
  const focusQueue = remaining.filter(isFocus);
  const reviewQueue = remaining.filter(item => !isFocus(item));
  const ordered = [];
  while (focusQueue.length || reviewQueue.length) {
    const previous = ordered.at(-1);
    const preferred = ordered.length % 2 === 0 ? focusQueue : reviewQueue;
    const queue = preferred.length ? preferred : focusQueue.length ? focusQueue : reviewQueue;
    const index = queue.findIndex(item => !targetOf(previous) || targetOf(item) !== targetOf(previous));
    ordered.push(...queue.splice(Math.max(0, index), 1));
  }
  return ordered;
}
export function buildStationRounds(cycle, stationId, options = {}) {
  if (stationId === "check") return buildCycleQuestBlueprint(cycle, 10, options).rounds;
  return withShuffleSeed(options.seed, () => {
    // Retain old Cycle 1 links without offering the same grid twice in its menu.
    const currentId = cycle.cycleNumber === 1 && stationId === 'build' ? 'trace' : stationId;
    const station = stationsForCycle(cycle).find(item => item.id === currentId);
    if (!station?.build) throw new Error(`Adventure Map station "${stationId}" is unknown or ineligible for cycle ${cycle?.cycleNumber || "unknown"}.`);
    const rounds = station.build(cycle);
    if (!rounds.length) throw new Error(`Adventure Map station "${stationId}" has no truthful rounds for cycle ${cycle?.cycleNumber || "unknown"}.`);
    return station.mechanicIds.includes("missingLetter") ? rounds : spaceStationRounds(rounds, cycle);
  });
}
export function starsForAccuracy(correct, total, wrongs) {
  if (!total) return 0;
  if (correct >= total && wrongs === 0) return 3;
  if (correct >= Math.ceil(total * 0.7)) return 2;
  return correct > 0 ? 1 : 0;
}
