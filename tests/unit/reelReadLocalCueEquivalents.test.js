import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import { reelReadLadder } from '../../src/utils/reelReadLevels.js';
import { reelReadV2Ladder } from '../../src/utils/reelReadV2Levels.js';

test('local dislike equivalent preserves the negative-prefix construction and the complete retained outings', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) for (const seed of [0, 913, 127, 99999]) {
    const retained = reelReadLadder(difficulty, seed), current = reelReadV2Ladder(difficulty, seed);
    assert.equal(current.length, 10);
    assert.equal(current.reduce((sum, level) => sum + level.correctWords.length, 0), retained.reduce((sum, level) => sum + level.correctWords.length, 0));
    for (const [index, level] of current.entries()) {
      if (retained[index].target !== 'disloyal') { assert.deepEqual(level, retained[index]); continue; }
      assert.equal(level.target, 'dislike'); assert.equal(level.mode, 'morphology'); assert.equal(level.orderMatters, true);
      assert.deepEqual(level.correctWords, ['dis-', 'like']); assert.deepEqual(level.distractors, retained[index].distractors);
      assert.ok(existsSync(new URL('../../public' + getLedaWordAudioPath(level.target), import.meta.url)));
    }
    assert.deepEqual(reelReadLadder(difficulty, seed), retained);
  }
});
