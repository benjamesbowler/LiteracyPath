import test from 'node:test';
import assert from 'node:assert/strict';
import details from '../../tools/assessmentRebuild/authoring/key_details.mjs';
import sequence from '../../tools/assessmentRebuild/authoring/sequencing.mjs';
import { scannerAnswer } from '../../tools/assessmentRebuild/lib.mjs';
import { loadLiteracyPracticeBank } from '../../src/data/literacyPracticeBank.js';

test('detail and sequencing responses keep the stated actors and actions without a vocabulary substitution', async () => {
  const bank = await loadLiteracyPracticeBank();
  for (const prefix of ['', 'listen:']) {
    const caretaker = bank.find(q => q.id === `${prefix}lp3.key_details.l1.A.who.v43`);
    assert.equal(caretaker.answer, 'the caretaker');
    assert.deepEqual(new Set(caretaker.choices), new Set(['the caretaker', 'our teacher', 'the gardener', 'the children']));
    const concert = bank.find(q => q.id === `${prefix}lp3.sequencing.l2.A.before_after_relation.v46`);
    assert.equal(concert.answer, 'the audience became quiet');
    assert.match(concert.passage, /After the audience became quiet, the first song began/);
    assert.ok(concert.choices.every(c => !/silence|second piece/.test(c)));
  }
  for (const source of [details, sequence]) {
    assert.equal(source.items.length, 92);
    assert.ok(source.items.every(q => q.choices.filter(c => c.k).length === 1));
  }
});

test('scanner distinguishes literal retrieval from inference and still flags answer-length tells', () => {
  const item = { passage: 'The caretaker fetched water. The gardener brought seedlings.', choices: ['the caretaker', 'the gardener', 'the teacher'], answer: 'the caretaker' };
  for (const skillId of ['key_details', 'sequencing']) assert.equal(scannerAnswer({ ...item, skillId }), null);
  const long = { ...item, choices: ['the caretaker fetched the water for every plant', 'the gardener', 'the teacher'] };
  assert.equal(scannerAnswer({ ...long, skillId: 'key_details' }), long.choices[0]);
  const clue = { passage: 'The caretaker fetched water for every plant.', choices: ['the caretaker fetched water for every plant', 'he enjoyed the sunny morning', 'he wanted to finish lunch'] };
  assert.equal(scannerAnswer({ ...clue, skillId: 'inference' }), clue.choices[0]);
});
