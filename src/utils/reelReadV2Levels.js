import { reelReadLadder } from './reelReadLevels.js';

// A recorded local equivalent for the same negative-prefix operation. The
// original shared bank and its ordering/shuffle rules remain authoritative.
export function reelReadV2Ladder(difficulty = 'easy', sessionSeed = 0) {
  return reelReadLadder(difficulty, sessionSeed).map(level => level.target === 'disloyal'
    ? { ...level, target: 'dislike', cue: 'Target word: dislike', correctWords: ['dis-', 'like'] }
    : { ...level, correctWords: [...level.correctWords], distractors: [...level.distractors] });
}
