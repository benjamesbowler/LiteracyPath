import test from 'node:test';
import assert from 'node:assert/strict';
import { reelReadLadder, reelReadIsCorrectCatch, reelReadExpectedWord } from '../../src/utils/reelReadLevels.js';

test('Reel & Read meaning targets omit context-dependent calm/historic judgements', () => {
  const noisy = reelReadLadder('medium').find(level => level.target === 'noisy');
  const ancient = reelReadLadder('hard').find(level => level.target === 'ancient');
  assert.deepEqual(noisy.correctWords, ['quiet', 'silent']);
  assert.deepEqual(ancient.correctWords, ['old', 'aged']);
  assert.ok(!noisy.distractors.includes('calm'));
  assert.ok(!ancient.distractors.includes('historic'));
});

test('all Reel & Read constructions retain ordered valid parts and finite recoverable targets', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const ladder = reelReadLadder(difficulty);
    assert.equal(ladder.length, 10);
    for (const level of ladder) {
      assert.ok(level.correctWords.length >= 2);
      assert.equal(new Set(level.correctWords).size, level.correctWords.length);
      assert.ok(level.correctWords.every(word => !level.distractors.includes(word)));
      if (level.orderMatters) {
        assert.equal(level.correctWords.join('').replaceAll('-', ''), level.target);
        const caught = [];
        for (const word of level.correctWords) {
          assert.equal(reelReadExpectedWord(level, caught), word);
          assert.ok(reelReadIsCorrectCatch(word, level, caught));
          caught.push(word);
        }
        assert.equal(reelReadExpectedWord(level, caught), null);
      } else {
        for (const word of level.correctWords) assert.ok(reelReadIsCorrectCatch(word, level));
      }
    }
  }
});
