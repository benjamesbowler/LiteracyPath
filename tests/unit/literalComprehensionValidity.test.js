import test from 'node:test';
import assert from 'node:assert/strict';
import details from '../../tools/assessmentRebuild/authoring/key_details.mjs';
import sequence from '../../tools/assessmentRebuild/authoring/sequencing.mjs';
import sentence from '../../tools/assessmentRebuild/authoring/sentence_comprehension.mjs';
import { isLiteralSentenceRetrieval, lintBank, scannerAnswer } from '../../tools/assessmentRebuild/lib.mjs';
import { skillBlueprints } from '../../src/content/blueprints/skillBlueprints.js';
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

test('all literal sentence siblings preserve the concrete referent rather than testing a second vocabulary definition', async () => {
  const source = sentence.items.filter(item => item.u.startsWith('literal_'));
  assert.equal(source.length, 36);
  assert.ok(source.every(item => item.lvl === 1));
  assert.ok(source.every(item => item.choices.filter(choice => choice.k).length === 1));
  const bank = await loadLiteracyPracticeBank();
  const literal = bank.filter(isLiteralSentenceRetrieval);
  assert.equal(literal.length, 30, 'Six reserved retention items remain out of public practice.');
  for (const item of literal) {
    assert.doesNotMatch(item.answer, /person who brings letters|beyond the kitchen entrance|wiping water from the yard|closing the room opening/i, item.id);
    assert.equal(scannerAnswer(item), null, item.id);
  }
  const mail = source.find(item => item.passage.includes('mail carrier'));
  assert.equal(mail.choices.find(choice => choice.k).t, 'our mail carrier');
  const kitchen = source.find(item => item.passage.includes('outside the kitchen door'));
  assert.equal(kitchen.choices.find(choice => choice.k).t, 'outside the kitchen door');
});

test('scanner distinguishes literal retrieval from inference and still flags answer-length tells', () => {
  const item = { passage: 'The caretaker fetched water. The gardener brought seedlings.', choices: ['the caretaker', 'the gardener', 'the teacher'], answer: 'the caretaker' };
  for (const skillId of ['key_details', 'sequencing']) assert.equal(scannerAnswer({ ...item, skillId }), null);
  const long = { ...item, choices: ['the caretaker fetched the water for every plant', 'the gardener', 'the teacher'] };
  assert.equal(scannerAnswer({ ...long, skillId: 'key_details' }), long.choices[0]);
  const clue = { passage: 'The caretaker fetched water for every plant.', choices: ['the caretaker fetched water for every plant', 'he enjoyed the sunny morning', 'he wanted to finish lunch'] };
  assert.equal(scannerAnswer({ ...clue, skillId: 'inference' }), clue.choices[0]);
  const literal = { ...clue, skillId: 'sentence_comprehension', level: 1, itemKey: 'literal_action' };
  // Same-length options isolate the overlap probe from the length probe.
  literal.choices = ['the caretaker fetched water for every plant', 'the gardener carried stones beside the wall', 'the teacher painted pictures near the table'];
  assert.equal(scannerAnswer(literal), null);
  assert.equal(isLiteralSentenceRetrieval(literal), true);
  for (const changed of [{ level: 2 }, { itemKey: 'restatement' }, { skillId: 'inference' }]) {
    assert.equal(isLiteralSentenceRetrieval({ ...literal, ...changed }), false);
    assert.equal(scannerAnswer({ ...literal, ...changed }), literal.choices[0]);
  }
  assert.equal(scannerAnswer({ ...literal, choices: long.choices }), long.choices[0]);
});

test('verbatim lint permission is limited to the three authored entry retrieval cells', async () => {
  const literal = (await loadLiteracyPracticeBank()).find(item => item.skillId === 'sentence_comprehension' && item.id.endsWith('.literal_who_what.v3'));
  const codes = item => lintBank([item], skillBlueprints.sentence_comprehension).map(issue => issue.code);
  assert.ok(!codes(literal).includes('L-COMPREHENSION-VERBATIM'));
  assert.ok(codes({ ...literal, level: 2 }).includes('L-COMPREHENSION-VERBATIM'));
  assert.ok(codes({ ...literal, itemKey: 'restatement' }).includes('L-COMPREHENSION-VERBATIM'));
});
