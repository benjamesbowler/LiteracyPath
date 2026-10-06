import test from 'node:test';
import assert from 'node:assert/strict';
import { starGalleryLadder } from '../../src/utils/starGalleryRounds.js';
import { buildSentenceGroveRounds, commitSentenceGroveRepair, newSentenceGroveEvidence, validSentenceGroveEvidence } from '../../src/components/learn/games/games/starGalleryLearning.js';

const fixture = difficulty => buildSentenceGroveRounds(starGalleryLadder(difficulty, 3), difficulty, 3, 0);

test('Grove retains all four repairs in every chapter and the deliberately accepted speech-mark alternatives', () => {
  let count = 0;
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const rounds = fixture(difficulty); assert.equal(rounds.length, 40); count += rounds.length;
    for (let stage = 0; stage < 10; stage++) assert.equal(rounds.filter(round => round.stage === stage).length, 4);
    assert.deepEqual(rounds, fixture(difficulty));
  }
  assert.equal(count, 120);
  const quotation = fixture('medium').find(round => round.repairId === 'punct-quote');
  assert.deepEqual(quotation.acceptedAnswers, ['"', "'"]);
  for (const accepted of quotation.acceptedAnswers) assert.equal(commitSentenceGroveRepair(newSentenceGroveEvidence(), quotation, accepted).correct, true);
});

test('Grove wrong reachable tree cut freezes first attempt and equal choices, while retry accepts only an authored repair', () => {
  const rounds = fixture('easy'), round = rounds[0], wrong = round.choices.find(choice => !round.acceptedAnswers.includes(choice));
  const first = commitSentenceGroveRepair(newSentenceGroveEvidence(), round, wrong, { responseAt: 10 });
  const retry = commitSentenceGroveRepair(first.evidence, round, round.acceptedAnswers[0], { responseAt: 20 });
  assert.equal(first.correct, false); assert.equal(retry.response.independentPrintedRepairPractice, false);
  assert.deepEqual(retry.evidence.firstResponses, first.evidence.firstResponses);
  assert.deepEqual(retry.response.choices, first.response.choices); assert.deepEqual(retry.evidence.completions, [round.roundId]);
  assert.equal(validSentenceGroveEvidence(retry.evidence, rounds), true);
  assert.equal(commitSentenceGroveRepair(retry.evidence, round, 'unrelated-choice'), null);
  assert.equal(commitSentenceGroveRepair(retry.evidence, round, round.acceptedAnswers[0]), null);
});

test('Grove keeps optional unavailable speech truthful and distinguishes genuinely spoken stimulus or repair models from printed practice', () => {
  const base = fixture('easy')[0], round = { ...base, optionalStimulusAudio: '/retained-exact-stimulus.mp3' };
  const choose = context => commitSentenceGroveRepair(newSentenceGroveEvidence(), round, round.acceptedAnswers[0], { responseAt: 30, ...context });
  const printed = choose({ delivery: 'unavailable' });
  assert.equal(printed.response.optionalAudioRequired, false); assert.equal(printed.response.deliveryAtResponse, 'unavailable');
  assert.equal(printed.response.spokenStimulusDelivered, false); assert.equal(printed.response.independentPrintedRepairPractice, true);
  const spoken = choose({ delivery: 'delivered', deliveryReceipt: { source: round.optionalStimulusAudio, endedAt: 20 } });
  assert.equal(spoken.response.spokenStimulusDelivered, true); assert.equal(spoken.response.independentPrintedRepairPractice, false);
  assert.ok(spoken.response.supportReasons.includes('spoken-broken-stimulus'));
  const future = choose({ delivery: 'delivered', deliveryReceipt: { source: round.optionalStimulusAudio, endedAt: 40 } });
  assert.equal(future.response.spokenStimulusDelivered, false); assert.equal(future.response.independentPrintedRepairPractice, false);
  assert.equal(choose({ modelUsed: true }).response.independentPrintedRepairPractice, false);
  assert.equal(choose({ legacyResume: true }).response.independentPrintedRepairPractice, false);
});

test('Grove driving hazards and empty cuts cannot create repairs, and forged printed/audio provenance is rejected', () => {
  const rounds = fixture('hard'), evidence = newSentenceGroveEvidence();
  evidence.motorEvents.hazardHits = 12; evidence.motorEvents.emptyCuts = 18;
  assert.equal(validSentenceGroveEvidence(evidence, rounds), true); assert.deepEqual(evidence.completions, []);
  const round = rounds[0], result = commitSentenceGroveRepair(evidence, round, round.acceptedAnswers[0], { responseAt: 30 });
  const forged = structuredClone(result.evidence); forged.firstResponses[0].printedBrokenStimulus = 'invented sentence';
  assert.equal(validSentenceGroveEvidence(forged, rounds), false);
  const unearnedSpeech = structuredClone(result.evidence); unearnedSpeech.firstResponses[0].spokenStimulusDelivered = true;
  assert.equal(validSentenceGroveEvidence(unearnedSpeech, rounds), false);
  const wrong = commitSentenceGroveRepair(evidence, round, round.choices.find(choice => !round.acceptedAnswers.includes(choice)), { responseAt: 30 });
  const inventedAcceptance = structuredClone(wrong.evidence);
  inventedAcceptance.acceptedResponses.push(result.response); inventedAcceptance.completions.push(round.roundId);
  assert.equal(validSentenceGroveEvidence(inventedAcceptance, rounds), false);
  const missingCompletion = structuredClone(result.evidence); missingCompletion.completions = [];
  assert.equal(validSentenceGroveEvidence(missingCompletion, rounds), false);
});
