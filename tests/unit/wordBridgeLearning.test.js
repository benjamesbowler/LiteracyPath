import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel, wordBridgeLadder } from '../../src/utils/wordBridgeLevels.js';
import { buildWordBridgeRounds, commitWordBridgePlacement, newWordBridgeEvidence, validWordBridgeEvidence } from '../../src/components/learn/games/games/wordBridgeLearning.js';

const fixture = target => buildWordBridgeRounds([buildLevel({ world: 'meadow', cycle: 0, mode: 'bridge', target, sessionSeed: 3 })], 'easy', 3, 0)[0];

test('Bridge keeps all thirty real models, taught units, shuffled physical instances and exact instruction availability', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const ladder = wordBridgeLadder(difficulty, 3), rounds = buildWordBridgeRounds(ladder, difficulty, 3, 0);
    assert.equal(rounds.length, 10);
    for (let stage = 0; stage < 10; stage++) {
      assert.deepEqual(rounds[stage].units, ladder[stage].units);
      assert.deepEqual(rounds[stage].tiles.map(({ id, ...tile }) => ({ ...tile, id })), ladder[stage].tiles.map((tile, id) => ({ ...tile, id })));
    }
  }
  const missingSentence = fixture(['An', 'unrecorded', 'bridge', 'instruction']);
  assert.equal(missingSentence.audio, '');
  assert.deepEqual(missingSentence.pictures, []);
});

test('Repeated Bridge letters are interchangeable physical pieces, can fill any matching open model slot and cannot be reused', () => {
  const round = fixture('tent'), firstT = round.tiles.find(tile => tile.correct && tile.order === 0), lastT = round.tiles.find(tile => tile.correct && tile.order === 3);
  let evidence = newWordBridgeEvidence();
  let result = commitWordBridgePlacement(evidence, round, 0, lastT.id, { responseAt: 10, delivery: 'unavailable' });
  assert.equal(result.correct, true); evidence = result.evidence;
  assert.equal(commitWordBridgePlacement(evidence, round, 3, lastT.id), null);
  result = commitWordBridgePlacement(evidence, round, 3, firstT.id, { responseAt: 20 }); evidence = result.evidence;
  for (const slot of [2, 1]) {
    const tile = round.tiles.find(tile => tile.correct && tile.order === slot);
    result = commitWordBridgePlacement(evidence, round, slot, tile.id, { responseAt: 30 + slot }); evidence = result.evidence;
  }
  assert.equal(result.finished, true); assert.deepEqual(evidence.completions, [round.roundId]);
  assert.equal(validWordBridgeEvidence(evidence, [round]), true);
  assert.equal(commitWordBridgePlacement(evidence, round, 0, firstT.id), null);
  assert.ok(evidence.acceptedResponses.every(row => row.modelUsed && !row.independentEncodingPractice));
});

test('Bridge wrong placements freeze original choices; accepted responses and completion must come from actual supported placements', () => {
  const round = fixture('cat'), correct = round.tiles.find(tile => tile.correct && tile.order === 0), wrong = round.tiles.find(tile => !tile.correct);
  const first = commitWordBridgePlacement(newWordBridgeEvidence(), round, 0, wrong.id, { responseAt: 10 });
  const retry = commitWordBridgePlacement(first.evidence, round, 0, correct.id, { responseAt: 20, legacyResume: true });
  assert.deepEqual(retry.evidence.firstResponses, first.evidence.firstResponses);
  assert.deepEqual(retry.response.choices, first.response.choices);
  assert.ok(retry.response.supportReasons.includes('repeat-after-response'));
  assert.ok(retry.response.supportReasons.includes('legacy-resume-response-history-unavailable'));
  assert.equal(validWordBridgeEvidence(retry.evidence, [round]), true);
  const forged = structuredClone(retry.evidence);
  forged.acceptedResponses[0] = { ...forged.acceptedResponses[0], responseAt: 15 };
  assert.equal(validWordBridgeEvidence(forged, [round]), false);
  const unearned = structuredClone(first.evidence); unearned.completions = [round.roundId];
  assert.equal(validWordBridgeEvidence(unearned, [round]), false);
});

test('Bridge carried drops, pickups and crossing artistry cannot complete a model or become independent encoding', () => {
  const round = fixture('sock'), evidence = newWordBridgeEvidence();
  evidence.motorEvents = { pickups: 12, looseDrops: 7, crossings: 3 };
  assert.equal(validWordBridgeEvidence(evidence, [round]), true); assert.deepEqual(evidence.completions, []);
  const tile = round.tiles.find(tile => tile.correct && tile.order === 0);
  const result = commitWordBridgePlacement(evidence, round, 0, tile.id, { delivery: 'delivered', deliveryReceipt: { source: round.audio, endedAt: 10 }, responseAt: 20 });
  assert.equal(result.response.independentEncodingPractice, false);
  assert.ok(result.response.supportReasons.includes('guided-construction-practice'));
  assert.equal(result.response.supportReasons.includes('visible-slot-model'), false);
});


test('historical visible-model evidence remains immutable alongside new hidden-target practice', () => {
  const round = fixture('sock'), wrong = round.tiles.find(tile => !tile.correct);
  const correct = round.tiles.find(tile => tile.correct && tile.order === 0);
  const original = commitWordBridgePlacement(newWordBridgeEvidence(), round, 0, wrong.id, { responseAt: 10 });
  const legacy = structuredClone(original.evidence);
  legacy.firstResponses[0].supportReasons = legacy.firstResponses[0].supportReasons.map(reason => reason === 'guided-construction-practice' ? 'visible-slot-model' : reason);
  const held = JSON.stringify(legacy.firstResponses[0]);
  assert.equal(validWordBridgeEvidence(legacy, [round]), true);
  const retry = commitWordBridgePlacement(legacy, round, 0, correct.id, { responseAt: 20 });
  assert.equal(JSON.stringify(retry.evidence.firstResponses[0]), held);
  assert.equal(retry.response.supportReasons.includes('visible-slot-model'), false);
  assert.equal(retry.response.supportReasons.includes('guided-construction-practice'), true);
  assert.equal(retry.response.independentEncodingPractice, false);
  assert.equal(validWordBridgeEvidence(retry.evidence, [round]), true);
});
