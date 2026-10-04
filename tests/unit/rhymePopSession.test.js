import test from 'node:test';
import assert from 'node:assert/strict';
import { rhymePopV2Ladder } from '../../src/utils/rhymePopV2Levels.js';
import { newRhymePopEvidence, rhymePopResponse, completeRhymePopFamily, validateRhymePopSession, RHYME_POP_CONTENT_VERSION } from '../../src/utils/rhymePopSession.js';

const seed = 913, ladder = rhymePopV2Ladder('easy', seed), level = ladder[0];
const choices = [level.rhymingWords[0], level.distractors[0]].map((word, id) => ({ id: id + 1, word }));
const receipt = { stage: 0, kind: 'target', word: level.targetWord, src: '/audio/production/en-US/isolated_word/target.mp3', at: .6 };
const decide = (evidence, selected, unit = 0, extra = {}) => rhymePopResponse(evidence, level, { stage: 0, unit, selected, choices,
  source: 'pointer', at: 1, receipt, ...extra });
const state = evidence => ({ version: RHYME_POP_CONTENT_VERSION, seed, journeyIndex: 0, stage: 0, originStage: 0, word: level.targetWord,
  elapsed: 2, nextId: 3, score: evidence.acceptedResponses.reduce((sum, row) => sum + row.points, 0), mistakes: 1, hintMistakes: 1,
  acceptedWords: [level.rhymingWords[0]], celebrating: false, supportReasons: ['rhyme-retry'], evidence,
  balloons: [{ id: 2, word: level.distractors[0], kind: 'distractor', slot: 0, phase: 0, travel: .3, direction: -1 }] });
const context = { seed, stage: 0, ladder };

test('physical wrong then correct keeps the first rhyme decision, fixed choice packet and genuine target receipt', () => {
  let evidence = newRhymePopEvidence(); evidence.audioReceipts.push(receipt);
  const wrong = decide(evidence, level.distractors[0]); evidence = wrong.evidence;
  evidence = decide(evidence, level.rhymingWords[0], 0, { supportReasons: ['rhyme-retry'] }).evidence;
  assert.equal(evidence.firstResponses[0].correct, false); assert.equal(evidence.assistedRetries[0].correct, true);
  assert.deepEqual(evidence.firstResponses[0].choices, evidence.assistedRetries[0].choices);
  assert.equal(evidence.assistedRetries[0].independentRhymePractice, false);
  assert.deepEqual(evidence.assistedRetries[0].deliveryReceipt, receipt);
  assert.deepEqual(validateRhymePopSession(state(evidence), context), state(evidence));
});

test('candidate, future, pending and unowned audio ends cannot claim a delivered target', () => {
  for (const row of [null, { ...receipt, kind: 'candidate' }, { ...receipt, at: 2 }, { ...receipt, stage: 1 }]) {
    const evidence = newRhymePopEvidence(); if (row) evidence.audioReceipts.push(row);
    const response = decide(evidence, level.rhymingWords[0], 0, { receipt: row }).row;
    assert.equal(response.deliveryAtResponse, 'pending'); assert.equal(response.independentRhymePractice, false);
  }
  assert.equal(decide(newRhymePopEvidence(), level.rhymingWords[0]).row.deliveryAtResponse, 'pending');
});

test('resumed balloon identity, wrong history and accepted family prefix reject forged or contradictory sidecars', () => {
  let e = newRhymePopEvidence(); e.audioReceipts.push(receipt); e = decide(e, level.distractors[0]).evidence;
  e = decide(e, level.rhymingWords[0], 0, { supportReasons: ['rhyme-retry'] }).evidence;
  const good = state(e);
  for (const change of [value => { value.seed++; }, value => { value.balloons[0].kind = 'rhyme'; }, value => { value.score++; },
    value => { value.acceptedWords = [level.rhymingWords[1]]; }, value => { value.evidence.assistedRetries[0].deliveryReceipt.at = 10; },
    value => { value.evidence.firstResponses[0].unit = 5; value.evidence.firstResponses[0].responseId = 'rhyme-pop:0:5'; },
    value => { value.nextId = value.balloons[0].id; }]) {
    const bad = structuredClone(good); change(bad); assert.equal(validateRhymePopSession(bad, context), null);
  }
  const observed = validateRhymePopSession(good, context); observed.balloons[0].word = 'mutated';
  assert.equal(good.balloons[0].word, level.distractors[0]);
});

test('a family completes only after every distinct retained rhyme; musical/motor activity creates no completion', () => {
  let e = newRhymePopEvidence(); e.audioReceipts.push(receipt);
  assert.equal(completeRhymePopFamily(e, level, 0), e);
  level.rhymingWords.forEach((selected, unit) => {
    e = decide(e, selected, unit, { choices: [{ id: unit + 1, word: selected }] }).evidence;
  });
  const complete = completeRhymePopFamily(e, level, 0);
  assert.equal(complete.completions.length, 1); assert.deepEqual(complete.completions[0].acceptedWords, level.rhymingWords);
  assert.equal(complete.completions[0].supported, false); assert.equal(complete.completions[0].practiceOnly, true);
  assert.equal(completeRhymePopFamily(complete, level, 0), complete);
});
