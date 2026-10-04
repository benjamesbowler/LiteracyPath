import { rhymePopLadder } from './rhymePopLevels.js';

// Local v2 spoken-rime admission. The global reviewed ladder is retained.
// These recorded equivalents keep /ʌn/ and seven unique family members;
// `-un` remains a sound-family ID, never a printed spelling rule for `ton`.
export const RHYME_POP_V2_EQUIVALENTS = Object.freeze({ nun: 'pun', shun: 'ton' });
// These two near-rime distractors have no retained spoken names. Recorded
// local equivalents preserve the /ɪt/ versus /aɪt/ and /ʊk/ versus /ɒk/
// contrasts, with no changes to global curriculum targets or rhyme members.
export const RHYME_POP_V2_DISTRACTOR_EQUIVALENTS = Object.freeze({ knit: 'spit', rook: 'took' });
const equivalent = word => RHYME_POP_V2_EQUIVALENTS[word] || word;

export function rhymePopV2Ladder(difficulty = 'easy', sessionSeed = 0) {
  return rhymePopLadder(difficulty, sessionSeed).map(level => ({
    ...level,
    targetWord: equivalent(level.targetWord),
    rhymingWords: level.rhymingWords.map(equivalent),
    distractors: level.distractors.map(word => RHYME_POP_V2_DISTRACTOR_EQUIVALENTS[word] || equivalent(word)),
    rimeKind: 'spoken-ending-sound'
  }));
}
