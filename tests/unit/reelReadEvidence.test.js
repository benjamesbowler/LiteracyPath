import test from 'node:test';
import assert from 'node:assert/strict';
import { reelReadV2Ladder } from '../../src/utils/reelReadV2Levels.js';
import { newReelReadEvidence, reelReadHookResponse, completeReelReadTrip } from '../../src/utils/reelReadEvidence.js';

const levels = reelReadV2Ladder('medium', 0), level = levels.find(item => item.target === 'rabbit');
const receipt = { stage: 0, round: 0, word: level.target, kind: 'target', src: '/audio/production/en-US/isolated_word/rabbit.mp3', at: .4 };
const decide = (evidence, selected, acceptedWords = [], extra = {}) => reelReadHookResponse(evidence, level, { stage: 0,
  selected, acceptedWords, landedWords: [], choices: [level.correctWords[0], level.correctWords[1], level.distractors[0]].map((word, id) => ({ id: id+1, word })),
  source: 'keyboard', at: 1, receipt, ...extra });

test('first hook accepts the written part while motor escape/rehook never re-awards language evidence', () => {
  let evidence = newReelReadEvidence(); evidence.audioReceipts.push(receipt);
  const first = decide(evidence, 'rab'); evidence = first.evidence;
  assert.equal(first.row.correct, true); assert.equal(first.row.partCategory, 'written-word-chunks');
  assert.equal(first.row.deliveryAtResponse, 'delivered'); assert.equal(first.row.independentPartOrMeaningPractice, true);
  const recovery = decide(evidence, 'rab', ['rab']);
  assert.equal(recovery.decision.kind, 'motor-rehook'); assert.equal(recovery.row, null); assert.equal(recovery.evidence, evidence);
  assert.equal(completeReelReadTrip(evidence, level, 0, ['rab'], []), evidence);
  evidence = decide(evidence, 'bit', ['rab']).evidence;
  assert.equal(evidence.acceptedResponses.length, 2);
  assert.equal(completeReelReadTrip(evidence, level, 0, ['rab', 'bit'], ['rab']), evidence);
  const completed = completeReelReadTrip(evidence, level, 0, ['rab', 'bit'], ['rab', 'bit']);
  assert.equal(completed.completions.length, 1); assert.equal(completed.completions[0].points, 240);
  assert.equal(completeReelReadTrip(completed, level, 0, ['rab', 'bit'], ['rab', 'bit']), completed);
});

test('wrong written-part order retains the first response and honest supported retry, including actual cue receipt', () => {
  let evidence = newReelReadEvidence(); evidence.audioReceipts.push(receipt);
  evidence = decide(evidence, 'bit').evidence;
  evidence = decide(evidence, 'rab', [], { supportReasons: ['part-retry'] }).evidence;
  assert.equal(evidence.firstResponses[0].correct, false); assert.equal(evidence.firstResponses[0].expected, 'rab');
  assert.equal(evidence.assistedRetries[0].correct, true); assert.deepEqual(evidence.assistedRetries[0].deliveryReceipt, receipt);
  assert.equal(evidence.assistedRetries[0].independentPartOrMeaningPractice, false);
  assert.equal(evidence.assistedRetries[0].wordVisible, false);
});

test('unowned, future or candidate voice cannot provide target delivery context at a hook', () => {
  for (const changed of [null, { ...receipt, stage: 1 }, { ...receipt, round: 1 }, { ...receipt, word: 'rab' },
    { ...receipt, kind: 'candidate' }, { ...receipt, at: 4 }]) {
    const evidence = newReelReadEvidence(); if (changed) evidence.audioReceipts.push(changed);
    const row = decide(evidence, 'rab', [], { receipt: changed }).row;
    assert.equal(row.deliveryAtResponse, 'pending'); assert.equal(row.independentPartOrMeaningPractice, false);
  }
  assert.equal(decide(newReelReadEvidence(), 'rab').row.deliveryAtResponse, 'pending');
});

test('meaning uses the explicit source operation and accepts unique fish without inventing a written order', () => {
  const meaning = levels.find(item => item.mode === 'meaning' && /opposit/i.test(item.prompt));
  let evidence = newReelReadEvidence(), prefix = [];
  for (const selected of [...meaning.correctWords].reverse()) {
    const result = reelReadHookResponse(evidence, meaning, { stage: 4, selected, acceptedWords: prefix,
      choices: meaning.correctWords.map((word, id) => ({ id: id+1, word })), source: 'pointer', at: 3, cueKind: 'meaning-context' });
    evidence = result.evidence; prefix = result.decision.acceptedWords;
    assert.equal(result.row.operation, 'opposite-meaning'); assert.equal(result.row.partCategory, null);
    assert.equal(result.row.cueKind, 'meaning-context'); assert.deepEqual(result.row.expected, meaning.correctWords);
  }
  const done = completeReelReadTrip(evidence, meaning, 4, prefix, [...prefix]);
  assert.equal(done.completions.length, 1); assert.equal(done.completions[0].supported, true);
});
