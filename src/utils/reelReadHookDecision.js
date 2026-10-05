import { reelReadExpectedWord, reelReadIsCorrectCatch } from './reelReadLevels.js';

/** Classify only an actual hook contact. Returning or escaping fish never call
 * this to rewrite an accepted language decision. A required escaped fish can
 * be hooked again, but that second contact is a motor recovery, not a new test.
 */
export function reelReadHookDecision(level, word, acceptedWords = [], landedWords = []) {
  if (acceptedWords.includes(word)) return {
    kind: landedWords.includes(word) ? 'already-landed' : 'motor-rehook',
    literacyResponse: false, acceptedWords: [...acceptedWords]
  };
  const correct = reelReadIsCorrectCatch(word, level, acceptedWords);
  return { kind: correct ? 'accepted-hook' : 'wrong-word', literacyResponse: true, correct,
    unit: acceptedWords.length, expected: level.orderMatters ? reelReadExpectedWord(level, acceptedWords) : [...level.correctWords],
    acceptedWords: correct ? [...acceptedWords, word] : [...acceptedWords] };
}

export function reelReadLandAcceptedFish(acceptedWords, landedWords, word) {
  return acceptedWords.includes(word) && !landedWords.includes(word) ? [...landedWords, word] : [...landedWords];
}

export function reelReadTripPartsComplete(level, acceptedWords, landedWords) {
  return acceptedWords.length === level.correctWords.length && new Set(acceptedWords).size === acceptedWords.length
    && acceptedWords.every((word, unit) => level.correctWords.includes(word)
      && (!level.orderMatters || word === level.correctWords[unit]) && landedWords.includes(word))
    && landedWords.length === acceptedWords.length && new Set(landedWords).size === landedWords.length;
}

export function reelReadTaskDescription(level) {
  if (level.mode === 'meaning') return {
    mode: 'meaning', operation: /opposit/i.test(level.prompt) ? 'opposite-meaning' : 'same-meaning', partCategory: null,
    instruction: /opposit/i.test(level.prompt) ? 'Catch words with the opposite meaning.' : 'Catch words with the same meaning.'
  };
  if (level.mode === 'morphology') return {
    mode: 'morphology', operation: level.correctWords.some(word => word.endsWith('-')) ? 'prefix' : 'suffix', partCategory: 'base-and-affix',
    instruction: 'Catch the word parts in order.'
  };
  const compound = level.prompt.includes('compound');
  return { mode: 'wordParts', operation: 'ordered-parts', partCategory: compound ? 'compound-parts' : 'written-word-chunks',
    instruction: 'Catch the word parts in order.' };
}
