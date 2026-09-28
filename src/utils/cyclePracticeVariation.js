import { elSkillsBlockCycles } from '../data/elSkillsBlockCycles.js';

const unique = values => [...new Set(values)];

// Authored final phonemes, rather than a final-letter guess. These familiar
// objects are oral vocabulary; their spelling is never a decoding target.
export const CYCLE_FINAL_SOUND_WORDS = Object.freeze({
  m: ['drum', 'jam', 'ram'], t: ['cat', 'hat', 'goat', 'foot', 'mat', 'net', 'rat'],
  s: ['mouse', 'house', 'horse', 'bus'], n: ['sun', 'moon', 'hen', 'pen', 'fan', 'rain'],
  f: ['leaf', 'wolf'], d: ['bird', 'hand', 'bed'], b: ['web', 'tub'],
  g: ['dog', 'pig', 'egg', 'bag'], p: ['map', 'cup', 'cap', 'sheep'],
  k: ['duck', 'book', 'sock'], l: ['ball', 'bell', 'shell'], v: ['glove'], z: ['nose', 'cheese'],
});

export function cycleCardGraphemes(card) {
  const display = String(typeof card === 'string' ? card : card?.grapheme || '');
  if (/^[A-Z][a-z]$/u.test(display) && display[0].toLowerCase() === display[1]) {
    return [display[1] === 'q' ? 'qu' : display[1]];
  }
  const raw = String(typeof card === 'string' ? card : card?.spelling || card?.grapheme || '');
  return raw.toLowerCase().split(/[\s/,+]+/u).filter(value => /^[a-z]{1,3}$/u.test(value));
}

export function taughtCycleGraphemes(cycleNumber) {
  return unique(elSkillsBlockCycles.filter(cycle => cycle.cycleNumber && cycle.cycleNumber <= cycleNumber)
    .flatMap(cycle => (cycle.focusLetters || []).flatMap(cycleCardGraphemes)));
}

export function taughtCycleHighFrequencyWords(cycleNumber) {
  const seen = new Set();
  return elSkillsBlockCycles.filter(cycle => cycle.cycleNumber && cycle.cycleNumber <= cycleNumber)
    .flatMap(cycle => cycle.highFrequencyWords || [])
    .filter(word => {
      const key = word.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function cycleReviewGraphemes(cycle) {
  const focus = unique((cycle?.focusLetters || []).flatMap(cycleCardGraphemes));
  return taughtCycleGraphemes(cycle?.cycleNumber || 1).filter(value => !focus.includes(value));
}

export function displayGraphemePair(grapheme) {
  return /^[a-z]$/u.test(grapheme) ? `${grapheme.toUpperCase()}${grapheme}` : grapheme;
}

// Count the learning action, not a changed picture, distractor or answer slot.
// Big/small matching, listening, searching, sorting and formation are separate
// formats. Errors can still receive supported retries on their current item.
export function practiceRepetitionKey(round) {
  const target = round.targetGrapheme || round.grapheme || '';
  if (round.variant === 'wordMeaning') return `wordMeaning:${round.vocabularyGrapheme || round.targetWord}`;
  if (round.variant === 'letterCase' || round.mechanicId === 'letterPair') return `letterCase:${round.answer}`;
  if (round.mechanicId === 'soundChoice' || (round.mechanicId === 'letterMatch' && !round.variant)) return `soundChoice:${target}`;
  if (['pictureSound', 'sceneHunt', 'pictureSearch'].includes(round.mechanicId)) return `${round.mechanicId === 'sceneHunt' ? 'pictureSound' : round.mechanicId}:${round.soundPosition || 'first'}:${target}`;
  if (round.mechanicId === 'letterTrace') return `letterTrace:${target}`;
  if (round.mechanicId === 'letterGrid') return `letterGrid:${[...round.targetLetters].sort().join('|')}`;
  if (round.objects && round.mechanicId === 'soundSort') return `soundSort:${round.soundPosition}:${target}`;
  if (round.mechanicId === 'rhymeMatch') return `rhymeMatch:${round.targetWord}`;
  return round.semanticKey || round.roundKey || round.id;
}

// Prefer a real contrast in the taught word, not an unrelated word that can
// be rejected from its first letter alone. The caller still supplies only
// curriculum-authorised choices; this rank never expands the taught code.
export function wordContrast(candidate, target) {
  const left = String(candidate).toLowerCase(), right = String(target).toLowerCase();
  const positions = [...right].flatMap((letter, index) => letter !== left[index] ? [index] : []);
  if (left.length !== right.length) return { rank: 5, kind: 'word_length', positions };
  if (positions.length === 1) return { rank: positions[0] === 1 ? 0 : 1, kind: ['initial_sound', 'medial_vowel', 'final_sound'][positions[0]] || 'letter_position', positions };
  if (left[0] === right[0]) return { rank: 2, kind: 'shared_initial', positions };
  if (left.at(-1) === right.at(-1)) return { rank: 3, kind: 'shared_final', positions };
  return { rank: 4, kind: 'whole_word', positions };
}

// Draw the next window from a stable shuffled bank. Unlike re-shuffling on
// every pass, a target's examples are exhausted before that format repeats.
export function selectPracticePass(rounds, pass = 0, maximum = 3) {
  const groups = new Map();
  for (const round of rounds) {
    const key = practiceRepetitionKey(round);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(round);
  }
  return [...groups.values()].flatMap(group => {
    const size = Math.min(typeof maximum === 'function' ? maximum(group[0]) : maximum, group.length);
    const start = Math.max(0, Math.floor(pass)) * size;
    return Array.from({ length: size }, (_, index) => group[(start + index) % group.length]);
  });
}

export function capPracticeRepetitions(rounds, maximum = 3) {
  const counts = new Map();
  return rounds.filter(round => {
    const key = practiceRepetitionKey(round);
    const count = counts.get(key) || 0;
    if (count >= maximum) return false;
    counts.set(key, count + 1);
    return true;
  });
}
