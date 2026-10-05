import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordClimbSession } from '../../src/utils/wordClimbLevels.js';
import { createClimbJourney } from '../../src/components/learn/games/games/wordClimbJourney.js';
import { commitWordClimbLanding, newWordClimbEvidence, validWordClimbEvidence, wordClimbRounds } from '../../src/components/learn/games/games/wordClimbLearning.js';

function fixture(originStep = 0) {
  const session = createWordClimbSession('easy', () => .32), world = createClimbJourney(session, 0, originStep, () => .32);
  const rounds = wordClimbRounds(world, session, { difficulty: 'easy', seed: 3, journeyIndex: 0, originStep });
  return { world, rounds, round: rounds[0] };
}

test('Climb actual wrong landing freezes first attempt; retry/accepted ledge keeps equal original order and valid evidence', () => {
  const { round, rounds } = fixture();
  const correct = round.choices.find(choice => choice.correct), wrong = round.choices.find(choice => !choice.correct);
  const heard = { delivery: 'delivered', deliveryReceipt: { source: round.audio[0], endedAt: 10 }, responseAt: 20 };
  const first = commitWordClimbLanding(newWordClimbEvidence(), round, wrong.id, heard);
  assert.equal(first.response.correct, false); assert.equal(first.evidence.completions.length, 0);
  const retry = commitWordClimbLanding(first.evidence, round, correct.id, { ...heard, responseAt: 30 });
  assert.equal(retry.response.independentInitialPhonemePractice, false);
  assert.deepEqual(retry.evidence.firstResponses, first.evidence.firstResponses);
  assert.deepEqual(retry.response.choices, first.response.choices);
  assert.equal(retry.evidence.completions.length, 1); assert.equal(validWordClimbEvidence(retry.evidence, rounds), true);
  const forged = structuredClone(retry.evidence); forged.assistedRetries[0].independentInitialPhonemePractice = true;
  assert.equal(validWordClimbEvidence(forged, rounds), false);
});

test('Climb requires the current real ended phoneme and treats unavailable, future/other receipt, help and legacy as supported practice', () => {
  const { round } = fixture(), choice = round.choices.find(item => item.correct);
  const valid = { delivery: 'delivered', deliveryReceipt: { source: round.audio[0], endedAt: 10 }, responseAt: 20 };
  assert.ok(round.audio[0]);
  assert.equal(commitWordClimbLanding(newWordClimbEvidence(), round, choice.id, valid).response.independentInitialPhonemePractice, true);
  for (const context of [ { delivery: 'unavailable' }, { ...valid, deliveryReceipt: { source: round.audio[0], endedAt: 30 } },
    { ...valid, deliveryReceipt: { source: '/wrong.mp3', endedAt: 10 } }, { ...valid, supportReasons: ['mission-help'] }, { ...valid, legacyResume: true }, { ...valid, soundEnabled: false } ]) {
    assert.equal(commitWordClimbLanding(newWordClimbEvidence(), round, choice.id, context).response.independentInitialPhonemePractice, false);
  }
});

test('Positive legacy cursor makes only remaining real reading rounds; motor events alone cannot complete any word', () => {
  const { rounds } = fixture(3), evidence = newWordClimbEvidence();
  assert.deepEqual(rounds.map(round => round.row), [4, 5, 6]);
  evidence.motorEvents.falls = 9; evidence.motorEvents.lights = 3; evidence.motorEvents.jumps = 15;
  assert.equal(validWordClimbEvidence(evidence, rounds), true); assert.deepEqual(evidence.completions, []);
  assert.equal(commitWordClimbLanding(evidence, rounds[0], 'branch-0'), null);
});

test('Climb accepted landings must be actual immutable responses with one matching completion and no duplicate credit', () => {
  const { round, rounds } = fixture(), correct = round.choices.find(item => item.correct);
  const wrong = round.choices.find(item => !item.correct);
  const first = commitWordClimbLanding(newWordClimbEvidence(), round, wrong.id, { responseAt: 10, delivery: 'unavailable' });
  const retry = commitWordClimbLanding(first.evidence, round, correct.id, { responseAt: 20, delivery: 'unavailable' });
  assert.equal(validWordClimbEvidence(retry.evidence, rounds), true);
  assert.equal(commitWordClimbLanding(retry.evidence, round, correct.id, { responseAt: 30 }), null);

  const forgedAccepted = structuredClone(retry.evidence);
  forgedAccepted.acceptedResponses[0] = { ...forgedAccepted.acceptedResponses[0], responseAt: 19 };
  assert.equal(validWordClimbEvidence(forgedAccepted, rounds), false);
  const lostCompletion = structuredClone(retry.evidence);
  lostCompletion.completions = [];
  assert.equal(validWordClimbEvidence(lostCompletion, rounds), false);
  const lostAccepted = structuredClone(retry.evidence);
  lostAccepted.acceptedResponses = [];
  assert.equal(validWordClimbEvidence(lostAccepted, rounds), false);
  const orphanRetry = structuredClone(retry.evidence);
  orphanRetry.firstResponses = [];
  assert.equal(validWordClimbEvidence(orphanRetry, rounds), false);
  const earlyRetry = structuredClone(retry.evidence);
  earlyRetry.assistedRetries[0].responseAt = 9;
  earlyRetry.acceptedResponses[0].responseAt = 9;
  assert.equal(validWordClimbEvidence(earlyRetry, rounds), false);
});
