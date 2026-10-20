import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { upgradeMeaningChoicesV11 } from '../../src/data/literacyMockFourChoiceMeaningV11.js';
const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v10' });
const repaired = bank.map(q => upgradeMeaningChoicesV11(q, bank)).filter(q => q.sourceProvenance?.v11MeaningChoices);
const relations = repaired.filter(q => q.skillId === 'antonyms_synonyms');

// The semantic sets include ordinary stronger senses. 'Slam' still means
// closing a door, and 'keep' is a defensible contrast to lending something.
test('known valid near-senses cannot appear as additional wrong relationship answers', () => {
  for (const item of relations) {
    const pairs = item.choices.map(c => ({ ...c, words: c.label.split(' — ') }));
    const target = pairs[0].words[0];
    if (target === 'shut' && item.constructClaim.startsWith('synonym')) {
      const valid = new Set(['close', 'slam']);
      assert.equal(pairs.filter(c => valid.has(c.words[1])).length, 1, item.id);
    }
    if (target === 'lend' && item.constructClaim.startsWith('antonym'))
      assert.ok(!pairs.some(c => c.id !== item.answer && c.words[1] === 'keep'), item.id);
    assert.ok(!pairs.some(c => c.words[0] === 'often' && c.words[1] === 'never'), item.id);
  }
});

test('new main-idea response uses the same summary grammar as the other choices', () => {
  for (const item of repaired.filter(q => q.constructClaim.replace(/^listening_/, '') === 'mostly_about_info')) {
    const stems = item.choices.map(c => /^How\b/.test(c.label));
    assert.equal(new Set(stems).size, 1, item.id);
  }
});

test('the added timeline event does not consume an object already consumed or remove a hung coat', () => {
  for (const item of repaired.filter(q => q.constructClaim.replace(/^listening_/, '') === 'story_event_order')) {
    if (/train-journey/.test(item.id)) assert.ok(!item.choices.some(c => c.label === 'taking off his coat'), item.id);
    if (/\.l2\.walk\./.test(item.id)) assert.ok(!item.choices.some(c => c.label === 'putting away the apples'), item.id);
    assert.match(item.passage, /At the end, /, item.id);
  }
});
