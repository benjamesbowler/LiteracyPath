import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import { rhymePopLadder } from '../../src/utils/rhymePopLevels.js';
import { rhymePopV2Ladder } from '../../src/utils/rhymePopV2Levels.js';

test('local recorded spoken-rime equivalents preserve all families, counts and distinct target choices', () => {
  const encountered = new Set();
  for (const difficulty of ['easy', 'medium', 'hard']) for (let seed = 0; seed < 32; seed++) {
    const retained = rhymePopLadder(difficulty, seed), current = rhymePopV2Ladder(difficulty, seed);
    assert.equal(current.length, retained.length);
    for (const [index, level] of current.entries()) {
      assert.equal(level.rimeKind, 'spoken-ending-sound');
      assert.equal(level.rhymingWords.length, retained[index].rhymingWords.length);
      assert.equal(new Set([level.targetWord, ...level.rhymingWords]).size, 7);
      assert.ok(!level.rhymingWords.includes(level.targetWord));
      assert.ok(!level.distractors.some(word => word === level.targetWord || level.rhymingWords.includes(word)));
      assert.ok(![level.targetWord, ...level.rhymingWords].some(word => word === 'nun' || word === 'shun'));
      if (level.rime === '-un') [level.targetWord, ...level.rhymingWords].forEach(word => encountered.add(word));
    }
    assert.deepEqual(rhymePopLadder(difficulty, seed), retained);
  }
  assert.deepEqual(encountered, new Set(['sun', 'bun', 'fun', 'run', 'pun', 'spun', 'ton']));
  for (const word of ['pun', 'ton']) assert.ok(existsSync(new URL('../../public' + getLedaWordAudioPath(word), import.meta.url)));
});
