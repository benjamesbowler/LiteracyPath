import assert from 'node:assert/strict';
import test from 'node:test';
import { benchmarkObservationSummary as summary } from '../../src/data/benchmarkObservationSummary.js';
const profile = domainKey => ({ domainKey, hasSavedEvidence: true });
test('missing and suppressed results never become a zero score', () => {
  assert.equal(summary({}), 'Not checked yet.');
  assert.match(summary(profile('encoding')), /No score/);
  assert.match(summary(profile('encoding'), { performanceSuppressed: true, exactSpellingCount: 0 }), /No score/);
});
test('spelling reports conventional and plausible spellings separately', () => {
  assert.equal(summary(profile('encoding'), { administeredCount: 12, exactSpellingCount: 7, plausibleSpellingCount: 3 }), '7 of 12 words spelled correctly. 3 more represented the sounds with a different spelling.');
});
test('word reading does not count sounding out as automatic', () => {
  assert.equal(summary(profile('decoding'), { administeredCount: 8, accurateCount: 7, automaticCount: 4 }), '7 of 8 words read correctly; 4 read straight away.');
});
test('oral observations use administered evidence rather than all planned questions', () => {
  assert.equal(summary(profile('phonologicalAwareness'), { administeredCount: 3, correctCount: 0 }), '0 of 3 spoken answers correct.');
  assert.doesNotMatch(summary(profile('phonologicalAwareness'), { administeredCount: 0, correctCount: 0 }), /0 of 0/);
});
test('each passage retains its own count and early finishes have no invented rate', () => {
  const result = summary(profile('oralReadingFluency'), { passageRows: [{ passageTitle: 'First', wordsAttempted: 20, wordsCorrect: 18, wcpm: 18 }, { passageTitle: 'Next', wordsAttempted: 15, wordsCorrect: 15, wcpm: null }] });
  assert.match(result, /First: 18 of 20 words read correctly. 18 correct words per minute/);
  assert.match(result, /Next: 15 of 15 words read correctly. No per-minute score/);
  assert.match(summary(profile('oralReadingFluency'), { wordsCorrect: 0, wordsAttempted: 0, wcpm: 0 }), /0 correct words per minute/);
});
