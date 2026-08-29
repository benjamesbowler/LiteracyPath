import {
  CVC_WORDS,
  SENTENCES,
  SYLLABLE_WORDS,
  VOWEL_TEAM_WORDS
} from "../data/learnGamesData.js";
import { segmentWord } from "./graphemeSegments.js";
import { starRubric } from "./starRubric.js";

const WORLDS = { easy: "meadow", medium: "dino", hard: "moonwood" };
const BASE_BPM = { easy: 82, medium: 94, hard: 108 };
// Rhythm-feedback window (± ms around the beat). It affects bonus feedback only:
// identifying the required sound/word unit determines whether the sequence advances.
const BASE_WINDOW = { easy: 460, medium: 410, hard: 360 };
const SOUND_BEAT_TWO_SYLLABLES = [
  ...SYLLABLE_WORDS.two.slice(0, 4),
  ["win", "dow"],
  ...SYLLABLE_WORDS.two.slice(5, 8),
  ["rain", "bow"],
  ["kit", "ten"]
];
const SOUND_BEAT_SENTENCES = SENTENCES.level3.filter(sentence => !/^A robot\b/i.test(sentence));
const PHONEME_CHOICE_POOL = [...new Set([
  ...Object.values(CVC_WORDS).flat(),
  ...Object.values(VOWEL_TEAM_WORDS).flat()
].flatMap(segmentWord))];
const SYLLABLE_CHOICE_POOL = [...new Set(Object.values(SYLLABLE_WORDS).flat(2))];
const WORD_CHOICE_POOL = [...new Set(
  Object.values(SENTENCES)
    .flat()
    .flatMap(sentence => String(sentence).match(/[a-z]+/gi) || [])
)];

// Equivalent spellings that occur in the live Sound Beat phoneme pool. The
// child hears one phoneme, so two spellings for that same sound cannot be
// offered as one-right/one-wrong choices. This is intentionally scoped to the
// audited units above; broader spelling equivalence depends on word context.
const SOUND_BEAT_EQUIVALENT_UNITS = Object.freeze([
  Object.freeze(["c", "k", "ck"]),
  Object.freeze(["ch", "tch"]),
  Object.freeze(["ee", "ea"]),
  Object.freeze(["w", "wh"])
]);

export function soundBeatUnitsShareSound(left, right) {
  const a = normalizedChoice(left);
  const b = normalizedChoice(right);
  return a === b || SOUND_BEAT_EQUIVALENT_UNITS.some(group => (
    group.includes(a) && group.includes(b)
  ));
}

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededOrder(values, seed) {
  return [...values].sort((left, right) => (
    hashString(`${seed}:${left}`) - hashString(`${seed}:${right}`)
    || String(left).localeCompare(String(right))
  ));
}

function normalizedChoice(value) {
  return String(value || "").trim().toLowerCase();
}

function rotate(values, amount) {
  if (!values.length) return [];
  const offset = ((amount % values.length) + values.length) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function syllableItems(parts) {
  return parts.map(beats => ({
    word: beats.join(""),
    beats,
    say: beats.join(""),
    beatUnit: "syllable"
  }));
}

function wordItem(word) {
  return { word, beats: segmentWord(word), say: word, beatUnit: "phoneme" };
}

function sentenceItem(sentence) {
  const clean = String(sentence || "").replace(/[.!?]/g, "");
  const words = clean.split(/\s+/).filter(Boolean);
  return {
    word: clean,
    beats: words,
    say: sentence,
    beatUnit: "word"
  };
}

function levelItems(difficulty, levelIndex) {
  if (difficulty === "hard" && levelIndex >= 6) {
    return [sentenceItem(SOUND_BEAT_SENTENCES[levelIndex - 6])];
  }

  if (difficulty === "easy") {
    return rotate(CVC_WORDS.easy, levelIndex * 3).slice(0, 3).map(wordItem);
  }

  if (difficulty === "medium") {
    const words = rotate(CVC_WORDS.medium, levelIndex * 2).slice(0, 2).map(wordItem);
    const syllables = syllableItems(SOUND_BEAT_TWO_SYLLABLES);
    return [...words, syllables[levelIndex % syllables.length]];
  }

  const vowelTeamWords = Object.values(VOWEL_TEAM_WORDS).flat();
  const words = rotate(vowelTeamWords, levelIndex * 2).slice(0, 2).map(wordItem);
  const syllables = syllableItems(SYLLABLE_WORDS.three);
  return [...words, syllables[levelIndex % syllables.length]];
}

export function soundBeatLevel(difficulty = "easy", levelIndex = 0) {
  const safeDifficulty = WORLDS[difficulty] ? difficulty : "easy";
  const level = Math.max(0, Math.min(9, Number(levelIndex) || 0));
  return {
    difficulty: safeDifficulty,
    level,
    world: WORLDS[safeDifficulty],
    bpm: BASE_BPM[safeDifficulty] + level * 3,
    mode: safeDifficulty === "hard" && level >= 6 ? "sentence" : (safeDifficulty === "medium" || safeDifficulty === "hard" ? "mixed" : "sounds"),
    hitWindowMs: Math.max(300, BASE_WINDOW[safeDifficulty] - level * 6),
    // Minimum seconds of play before a stop/countdown: the engine groups
    // consecutive levels into one continuous round until this floor is met.
    minPlaySeconds: 60,
    items: levelItems(safeDifficulty, level)
  };
}

export function soundBeatLadder(difficulty = "easy") {
  return Array.from({ length: 10 }, (_, index) => soundBeatLevel(difficulty, index));
}

/**
 * Build a fresh, deterministic four-pad literacy decision for one beat. The
 * correct pad changes position with the stage/task/beat seed, and phoneme
 * distractors exclude curriculum-equivalent spellings such as c/k and w/wh.
 * The final GO action is a single blend control rather than another choice.
 */
export function soundBeatChoiceSet(item, beatIndex = 0, { seed = "" } = {}) {
  const beats = Array.isArray(item?.beats) ? item.beats : [];
  const safeIndex = Math.max(0, Number(beatIndex) || 0);
  if (safeIndex >= beats.length) {
    return Object.freeze({
      answer: "GO",
      answerIndex: 0,
      beatUnit: "blend",
      choices: Object.freeze(["GO"])
    });
  }

  const answer = String(beats[safeIndex]);
  const beatUnit = item?.beatUnit || "phoneme";
  const pool = beatUnit === "syllable"
    ? SYLLABLE_CHOICE_POOL
    : beatUnit === "word"
      ? WORD_CHOICE_POOL
      : PHONEME_CHOICE_POOL;
  const distractors = seededOrder(
    pool.filter(candidate => beatUnit === "phoneme"
      ? !soundBeatUnitsShareSound(candidate, answer)
      : normalizedChoice(candidate) !== normalizedChoice(answer)),
    `${seed}:${item?.word || "task"}:${safeIndex}:distractors`
  ).slice(0, 3);
  const choices = seededOrder(
    [answer, ...distractors],
    `${seed}:${item?.word || "task"}:${safeIndex}:positions`
  );
  const answerIndex = choices.findIndex(choice => normalizedChoice(choice) === normalizedChoice(answer));

  return Object.freeze({
    answer,
    answerIndex,
    beatUnit,
    choices: Object.freeze(choices)
  });
}

export function soundBeatMaskedPrompt(item, beatIndex = 0) {
  const beats = Array.isArray(item?.beats) ? item.beats.map(value => String(value)) : [];
  const safeIndex = Math.max(0, Math.min(beats.length, Number(beatIndex) || 0));
  if (safeIndex >= beats.length) return String(item?.say || item?.word || "");
  const separator = item?.beatUnit === "word" ? " " : "";
  return beats.map((unit, index) => (
    // One fixed marker per unreached unit preserves sequence position without
    // revealing whether the required pad has one, two or three characters.
    index < safeIndex ? unit : "•"
  )).join(separator);
}

/**
 * Sound Beat normally asks the child to identify a heard unit, so unreached
 * units stay masked. With sound disabled there is no auditory stimulus: the
 * game explicitly becomes supported reconstruction and prints the model
 * instead of leaving a child to guess. That support mode is labelled in the
 * canvas and is not presented as independent sound discrimination.
 */
export function soundBeatVisiblePrompt(item, beatIndex = 0, { soundEnabled = true } = {}) {
  if (soundEnabled) return soundBeatMaskedPrompt(item, beatIndex);
  return String(item?.say || item?.word || "");
}

export function soundBeatBlendCompletionAction({ paused = false, ended = false, sameTask = true } = {}) {
  if (ended || !sameTask) return "ignore";
  return paused ? "defer" : "advance";
}

export function soundBeatStars({ correct, total, mistakes } = {}) {
  return starRubric({ correct, total, mistakes, deaths: 0 });
}

// Sound Beat 2.0 invariant: the selected unit determines literacy correctness.
// Timing can make a correct choice feel rewarding, but never reject it or block
// progress once the required sound/word unit has been identified.
export function soundBeatTapFeedback({ deltaMs, windowMs, isBlend = false } = {}) {
  const safeWindow = Math.max(1, Math.abs(Number(windowMs)) || 1);
  const offset = Math.abs(Number(deltaMs));
  const ratio = Number.isFinite(offset) ? offset / safeWindow : Number.POSITIVE_INFINITY;

  let rhythmLabel = "SOUND ON!";
  let rhythmBonus = 0;
  let pulse = 0.52;
  if (ratio <= 0.34) {
    rhythmLabel = "PERFECT";
    rhythmBonus = 40;
    pulse = 1;
  } else if (ratio <= 0.67) {
    rhythmLabel = "GREAT";
    rhythmBonus = 25;
    pulse = 0.82;
  } else if (ratio <= 1) {
    rhythmLabel = "GOOD";
    rhythmBonus = 15;
    pulse = 0.65;
  }

  return {
    advance: true,
    literacyAccepted: true,
    rhythmLabel: isBlend ? "BLENDED!" : rhythmLabel,
    rhythmBonus,
    pulse
  };
}
