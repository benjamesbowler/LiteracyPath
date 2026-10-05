import test from 'node:test';
import assert from 'node:assert/strict';
import { reelReadV2Ladder } from '../../src/utils/reelReadV2Levels.js';
import { reelReadHookDecision, reelReadLandAcceptedFish, reelReadTripPartsComplete, reelReadTaskDescription } from '../../src/utils/reelReadHookDecision.js';

test('correct ordered hook survives motor escape and its rehook cannot re-award a response', () => {
  const level = reelReadV2Ladder('easy', 0)[0];
  const first = reelReadHookDecision(level, 'rain', [], []);
  assert.equal(first.kind, 'accepted-hook'); assert.equal(first.unit, 0);
  const afterEscape = first.acceptedWords;
  const rehook = reelReadHookDecision(level, 'rain', afterEscape, []);
  assert.equal(rehook.kind, 'motor-rehook'); assert.equal(rehook.literacyResponse, false);
  assert.deepEqual(rehook.acceptedWords, ['rain']);
  const landed = reelReadLandAcceptedFish(afterEscape, [], 'rain');
  assert.deepEqual(landed, ['rain']);
  assert.equal(reelReadHookDecision(level, 'rain', afterEscape, landed).kind, 'already-landed');
  assert.equal(reelReadTripPartsComplete(level, afterEscape, landed), false);
  const second = reelReadHookDecision(level, 'bow', afterEscape, landed);
  assert.equal(second.kind, 'accepted-hook'); assert.equal(second.unit, 1);
  assert.equal(reelReadTripPartsComplete(level, second.acceptedWords, landed), false);
  assert.equal(reelReadTripPartsComplete(level, second.acceptedWords,
    reelReadLandAcceptedFish(second.acceptedWords, landed, 'bow')), true);
});

test('wrong order remains a language response without clearing prefix; an unrelated motor landing adds no credit', () => {
  const level = reelReadV2Ladder('easy', 0)[0];
  const wrong = reelReadHookDecision(level, 'bow', [], []);
  assert.equal(wrong.kind, 'wrong-word'); assert.equal(wrong.literacyResponse, true); assert.equal(wrong.expected, 'rain');
  assert.deepEqual(wrong.acceptedWords, []);
  assert.deepEqual(reelReadLandAcceptedFish([], [], 'bow'), []);
  assert.deepEqual(reelReadLandAcceptedFish(['rain'], ['rain'], 'rain'), ['rain']);
});

test('meaning catches may land in any order but every unique correct choice is required', () => {
  const level = reelReadV2Ladder('easy', 0).find(row => row.target === 'happy');
  let accepted = [], landed = [];
  for (const word of ['cheerful', 'glad', 'joyful']) {
    accepted = reelReadHookDecision(level, word, accepted, landed).acceptedWords;
    landed = reelReadLandAcceptedFish(accepted, landed, word);
  }
  assert.equal(reelReadTripPartsComplete(level, accepted, landed), true);
  assert.equal(reelReadTripPartsComplete(level, ['glad', 'glad', 'joyful'], ['glad', 'joyful']), false);
  assert.equal(reelReadHookDecision(level, 'sad', [], []).kind, 'wrong-word');
});

test('task descriptions distinguish semantic parts from written chunks and never print the hidden target', () => {
  const levels = ['easy', 'medium', 'hard'].flatMap(difficulty => reelReadV2Ladder(difficulty, 0));
  assert.deepEqual(['easy', 'medium', 'hard'].map(difficulty => reelReadV2Ladder(difficulty, 0)
    .reduce((sum, row) => sum+row.correctWords.length, 0)), [23, 22, 24]);
  for (const level of levels) assert.equal(reelReadTaskDescription(level).instruction.includes(level.target), false);
  assert.equal(reelReadTaskDescription(levels.find(row => row.target === 'rabbit')).partCategory, 'written-word-chunks');
  assert.equal(reelReadTaskDescription(levels.find(row => row.target === 'rainbow')).partCategory, 'compound-parts');
  assert.equal(reelReadTaskDescription(levels.find(row => row.target === 'dislike')).operation, 'prefix');
  assert.equal(reelReadTaskDescription(levels.find(row => row.target === 'hot')).operation, 'opposite-meaning');
});
