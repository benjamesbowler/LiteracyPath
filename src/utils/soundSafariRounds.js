import { starRubric } from "./starRubric.js";
import { SOUND_SAFARI_WORDS } from "../data/soundSafariWords.js";
import {
  getSoundSafariPronunciation,
  soundSafariDecoyUnits,
  soundSafariUnitAudio,
  soundSafariWordAudio
} from "../data/soundSafariPronunciations.js";

export { SOUND_SAFARI_WORDS } from "../data/soundSafariWords.js";

const WORLDS = { easy: "meadow", medium: "dino", hard: "moonwood" };
function safariWord(word, seed) {
  const record = getSoundSafariPronunciation(word);
  if (!record) throw new Error(`Missing authored Safari pronunciation: ${word}`);
  const units = record.units.map(unit => ({ ...unit, audio: soundSafariUnitAudio(unit, word) }));
  const decoyUnits = soundSafariDecoyUnits(record, seed);
  return {
    ...record,
    units,
    wordAudio: soundSafariWordAudio(word),
    graphemes: units.map(unit => unit.grapheme),
    decoyUnits,
    decoys: decoyUnits.map(unit => unit.grapheme)
  };
}

export function soundSafariLevel(difficulty = "easy", levelIndex = 0) {
  const safeDifficulty = WORLDS[difficulty] ? difficulty : "easy";
  const level = Math.max(0, Math.min(9, Number(levelIndex) || 0));
  // Availability is explicit on each word/unit; missing media cannot silently
  // remove authored content or shift its level. The parent engine owns recovery.
  const source = SOUND_SAFARI_WORDS[safeDifficulty];
  const start = level * 3;
  return {
    difficulty: safeDifficulty,
    level,
    world: WORLDS[safeDifficulty],
    words: source.slice(start, start + 3).map((word, index) => safariWord(word, level + index))
  };
}

export function soundSafariLadder(difficulty = "easy") {
  return Array.from({ length: 10 }, (_, index) => soundSafariLevel(difficulty, index));
}

export function soundSafariStars({ correct, total, mistakes } = {}) {
  return starRubric({ correct, total, mistakes, deaths: 0 });
}

export function soundSafariPresentedStars({ correct, presentedUnits, mistakes } = {}) {
  return soundSafariStars({
    correct,
    total: Math.max(1, Number(presentedUnits) || 0),
    mistakes
  });
}

export function soundSafariAudioCoverage() {
  return Object.fromEntries(Object.entries(SOUND_SAFARI_WORDS).map(([difficulty, words]) => [
    difficulty,
    {
      total: words.length,
      recorded: words.filter(word => soundSafariWordAudio(word).available),
      missing: words.filter(word => !soundSafariWordAudio(word).available)
    }
  ]));
}
