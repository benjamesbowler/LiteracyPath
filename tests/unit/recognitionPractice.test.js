import test from 'node:test';
import assert from 'node:assert/strict';
import { hfwOptions, memoryBoards, sentencePractice, sentenceTiles, sightWordPool } from '../../src/utils/recognitionPractice.js';
import { SENTENCES, SIGHT_WORDS } from '../../src/data/learnGamesData.js';

for (const [difficulty, level, pairs] of [['easy', 'level1', 24], ['medium', 'level2', 28], ['hard', 'level3', 30]]) {
  test(`${difficulty} memory keeps every pair exactly twice in bounded boards`, () => {
    const {boards, cards} = memoryBoards(difficulty);
    assert.equal(cards.length, pairs * 2);
    assert.equal(new Set(cards.map(c => c.id)).size, cards.length);
    assert.equal(new Set(cards.map(c => c.word)).size, pairs);
    assert.ok(cards.every(c => c.object));
    for (const board of boards) {
      assert.ok(board.length <= 10);
      for (const card of board) {
        assert.equal(board.filter(c => c.pairId === card.pairId).length, 2);
        assert.ok(SIGHT_WORDS[level].includes(card.word));
      }
    }
  });
  test(`${difficulty} recognition offers unique tier words without ambiguous spoken foils`, () => {
    const pool = sightWordPool(difficulty);
    for (const target of pool) {
      const options = hfwOptions(target, pool);
      assert.equal(options.length, 6);
      assert.equal(new Set(options).size, 6);
      assert.equal(options.filter(w => w === target).length, 1);
      assert.ok(options.every(w => SIGHT_WORDS[level].includes(w)));
      for (const group of [['to','too','two'], ['there','their'], ['no','know'], ['for','four'], ['here','hear']]) {
        if (group.includes(target)) assert.equal(options.filter(w => group.includes(w)).length, 1);
      }
    }
  });
  test(`${difficulty} sentence targets are fresh after a separate worked example`, () => {
    const {modelSentence, sentences} = sentencePractice(difficulty, 10);
    assert.ok(!sentences.includes(modelSentence));
    assert.equal(new Set(sentences).size, sentences.length);
    assert.ok(sentences.every(s => SENTENCES[level].includes(s)));
    assert.equal(sentences.length, SENTENCES[level].length - 1);
  });
}

test('high frequency neighbours take priority and repeated words retain separate occurrences', () => {
  const options = hfwOptions('the', ['the','then','them','they','there','at','it','is','big','play'], () => .5);
  for (const word of ['then','them','they','there']) assert.ok(options.includes(word));
  const tiles = sentenceTiles('The cat and the dog can run.');
  assert.equal(tiles.length, 7);
  assert.equal(new Set(tiles.map(t => t.id)).size, 7);
  assert.equal(tiles.filter(t => t.word.toLowerCase() === 'the').length, 2);
});
