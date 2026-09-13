import { elSkillsBlockCycles } from '../data/elSkillsBlockCycles.js';

const unique = values => [...new Set(values)];

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
  if (round.variant === 'letterCase' || round.mechanicId === 'letterPair') return `letterCase:${round.answer}`;
  if (round.mechanicId === 'soundChoice' || (round.mechanicId === 'letterMatch' && !round.variant)) return `soundChoice:${target}`;
  if (['pictureSound', 'sceneHunt', 'pictureSearch'].includes(round.mechanicId)) return `${round.mechanicId === 'sceneHunt' ? 'pictureSound' : round.mechanicId}:${round.soundPosition || 'first'}:${target}`;
  if (round.mechanicId === 'letterTrace') return `letterTrace:${target}`;
  if (round.mechanicId === 'letterGrid') return `letterGrid:${[...round.targetLetters].sort().join('|')}`;
  if (round.objects && round.mechanicId === 'soundSort') return `soundSort:${round.soundPosition}:${target}`;
  if (round.mechanicId === 'rhymeMatch') return `rhymeMatch:${round.targetWord}`;
  return round.semanticKey || round.roundKey || round.id;
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
