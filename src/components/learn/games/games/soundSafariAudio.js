import { soundSafariWordAudio, soundSafariUnitAudio } from '../../../../data/soundSafariPronunciations.js';

export const SAFARI_AUDIO_SCRIPTS = Object.freeze({
  instruction: 'Listen to the word. Catch its word parts in order. Some letters stay together.',
  model: 'Watch this word. Then you will try a different word.',
  turn: 'Now try a new word. Listen and catch its word parts.',
  retry: 'Listen to the word again. Which part comes next?',
  home: 'The path is ready. Guide the creatures home!'
});

export const safariInstructionPath = id => `/audio/sound-safari/${id}-v3.mp3`;

// Accept the authored word record or the engine's { item } task wrapper.
// Resolve on every cue so stale cached availability cannot bypass quarantine.
export function safariWordClips(task) {
  const item = task?.item ?? task;
  return [soundSafariWordAudio(item?.word).path];
}

// The parent owns model acceptance and the optional introductory instruction.
// Keep missing entries in place: an incomplete cue must not count as heard.
export function safariModelClips(task, unitIndex) {
  const item = task?.item ?? task;
  const unit = Number.isInteger(unitIndex) && unitIndex >= 0 ? item?.units?.[unitIndex] : undefined;
  return [soundSafariWordAudio(item?.word).path, soundSafariUnitAudio(unit, item?.word).path];
}
