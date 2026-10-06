import test from 'node:test';
import assert from 'node:assert/strict';
import { soundSafariLadder } from '../../src/utils/soundSafariRounds.js';
import { buildSoundSafariRounds, commitSoundSafariCapture, newSoundSafariEvidence, soundSafariChoiceSoundKey, validSoundSafariEvidence } from '../../src/components/learn/games/games/soundSafariLearning.js';

const fixture = (difficulty = 'easy', word = 'cat', pictureKind = 'word') => {
  const rounds = buildSoundSafariRounds(soundSafariLadder(difficulty, 3), difficulty, 3, 0,
    { pictureCue: target => ({ image: `/retained-${target}.webp`, kind: pictureKind }) });
  return { rounds, round: rounds.find(round => round.word === word) };
};
const delivered = round => ({ responseAt: 30, delivery: 'delivered', pictureDelivery: 'delivered',
  deliveryReceipt: { source: round.audio, endedAt: 10 }, pictureReceipt: { source: round.pictures[0], decodedAt: 20 } });

test('caught-sound correction preserves authored alternate keys and refuses ambiguous or unpresented labels', () => {
  for(const difficulty of ['easy','medium','hard'])for(const round of fixture(difficulty).rounds) {
    for(let slot=0;slot<round.units.length;slot++)assert.equal(soundSafariChoiceSoundKey(round,slot,round.units[slot]),round.soundKeys[slot]);
  }
  const thread=fixture('medium','thread').round;
  const contrast={...thread,choicesBySlot:[['th','ea','sh'],...thread.choicesBySlot.slice(1)]};
  assert.equal(soundSafariChoiceSoundKey(contrast,0,'ea'),'ea_e','A selected existing vowel team uses its authored pronunciation');
  assert.equal(soundSafariChoiceSoundKey(contrast,0,'sh'),'sh','A real decoy keeps its whole digraph');
  assert.equal(soundSafariChoiceSoundKey(contrast,0,'unpresented'),'');
  const ambiguous={units:['e','a','e'],soundKeys:['ee','a','e'],choicesBySlot:[['e','a'],['a','e'],['e','a']]};
  assert.equal(soundSafariChoiceSoundKey(ambiguous,1,'e'),'','Different actual e pronunciations cannot be silently collapsed');
  assert.equal(soundSafariChoiceSoundKey(ambiguous,0,'e'),'ee','The current authored e still has a definite target sound');
});

test('Safari keeps all ninety literal targets and authored alternate sound keys with stable fresh encounter choices', () => {
  let total = 0;
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const { rounds } = fixture(difficulty), again = fixture(difficulty).rounds;
    assert.equal(rounds.length, 30); total += rounds.length;
    assert.equal(new Set(rounds.map(round => round.word)).size, 30);
    assert.deepEqual(rounds, again);
    for (const round of rounds) for (let slot = 0; slot < round.units.length; slot++) {
      assert.ok(round.choicesBySlot[slot].includes(round.units[slot]));
      assert.equal(new Set(round.choicesBySlot[slot]).size, round.choicesBySlot[slot].length);
    }
    const fresh = buildSoundSafariRounds(soundSafariLadder(difficulty, 4), difficulty, 4, 0);
    assert.notDeepEqual(rounds.map(round => round.choicesBySlot), fresh.map(round => round.choicesBySlot));
    const production = buildSoundSafariRounds(soundSafariLadder(difficulty, 3), difficulty, 3, 0);
    for (const round of production) { assert.ok(round.audio); assert.ok(round.pictures.length, round.word); }
  }
  assert.equal(total, 90);
  assert.deepEqual(fixture('medium', 'thread').round.soundKeys, ['th', 'r', 'ea_e', 'd']);
  assert.deepEqual(fixture('hard', 'owl').round.soundKeys, ['ow_ou', 'l']);
});

test('Safari actual wrong capture retains first response and choices; correction stays supported and only ordered accepted units complete', () => {
  const { round, rounds } = fixture(), choices = round.choicesBySlot[0];
  const first = commitSoundSafariCapture(newSoundSafariEvidence(), round, 0, choices.find(label => label !== round.units[0]), choices, delivered(round));
  const frozen = structuredClone(first.evidence.firstResponses);
  const retry = commitSoundSafariCapture(first.evidence, round, 0, round.units[0], choices, { ...delivered(round), responseAt: 40 });
  assert.equal(first.correct, false); assert.equal(retry.first, false);
  assert.deepEqual(retry.evidence.firstResponses, frozen); assert.deepEqual(retry.response.choices, first.response.choices);
  assert.equal(retry.response.independentOrderedSoundPractice, false);
  assert.equal(retry.evidence.completions.length, 0);
  let evidence = retry.evidence;
  for (let slot = 1; slot < round.units.length; slot++) evidence = commitSoundSafariCapture(evidence, round, slot, round.units[slot], round.choicesBySlot[slot], delivered(round)).evidence;
  assert.deepEqual(evidence.completions, [round.roundId]); assert.equal(validSoundSafariEvidence(evidence, rounds), true);
  const forged = structuredClone(evidence); forged.assistedRetries[0].independentOrderedSoundPractice = true;
  assert.equal(validSoundSafariEvidence(forged, rounds), false);
});

test('Safari picture/audio response receipts must genuinely precede response; hints, muted play and meaning-context scenes retain explicit support', () => {
  const { round } = fixture(), choices = round.choicesBySlot[0], choose = context => commitSoundSafariCapture(newSoundSafariEvidence(), round, 0, round.units[0], choices, context).response;
  assert.ok(round.audio); assert.equal(choose(delivered(round)).independentOrderedSoundPractice, true);
  for (const context of [{ ...delivered(round), pictureDelivery: 'unavailable' }, { ...delivered(round), delivery: 'pending' },
    { ...delivered(round), soundEnabled: false }, { ...delivered(round), supportReasons: ['needed-unit-hint'], modelUsed: true },
    { ...delivered(round), deliveryReceipt: { source: round.audio, endedAt: 31 } },
    { ...delivered(round), pictureReceipt: { source: '/another-word.webp', decodedAt: 20 } }]) {
    assert.equal(choose(context).independentOrderedSoundPractice, false);
  }
  const contextRound = fixture('hard', 'sunlight', 'meaning-context').round;
  const context = commitSoundSafariCapture(newSoundSafariEvidence(), contextRound, 0, contextRound.units[0], contextRound.choicesBySlot[0], delivered(contextRound));
  assert.equal(context.response.independentOrderedSoundPractice, false);
  assert.ok(context.response.supportReasons.includes('recorded-word-meaning-context-picture'));
  const actual = buildSoundSafariRounds(soundSafariLadder('hard', 3), 'hard', 3, 0).find(item => item.word === 'sunlight');
  assert.equal(actual.pictureKind, 'meaning-context');
  const actualCapture = commitSoundSafariCapture(newSoundSafariEvidence(), actual, 0, actual.units[0], actual.choicesBySlot[0], delivered(actual));
  assert.equal(actualCapture.response.independentOrderedSoundPractice, false);
});

test('Safari rejects impossible choices and forged cue provenance while empty swings carry no learning credit', () => {
  const { round, rounds } = fixture(), evidence = newSoundSafariEvidence();
  evidence.motorEvents.emptySwings = 16; evidence.motorEvents.catches = 2;
  assert.equal(validSoundSafariEvidence(evidence, rounds), true); assert.deepEqual(evidence.completions, []);
  assert.equal(commitSoundSafariCapture(evidence, round, 0, 'not-authored', [round.units[0], 'not-authored']), null);
  const result = commitSoundSafariCapture(evidence, round, 0, round.units[0], round.choicesBySlot[0], delivered(round));
  const forged = structuredClone(result.evidence); forged.firstResponses[0].deliveryReceipt.endedAt = 31;
  assert.equal(validSoundSafariEvidence(forged, rounds), false);
  assert.equal(commitSoundSafariCapture(evidence, round, 1, round.units[1], round.choicesBySlot[1], delivered(round)), null);
  assert.equal(commitSoundSafariCapture(evidence, round, '0', round.units[0], round.choicesBySlot[0], delivered(round)), null);
  assert.equal(commitSoundSafariCapture(result.evidence, round, 0, round.units[0], round.choicesBySlot[0], delivered(round)), null);
  const wrong = commitSoundSafariCapture(evidence, round, 0, round.choicesBySlot[0].find(label => label !== round.units[0]), round.choicesBySlot[0], delivered(round));
  const inventedAcceptance = structuredClone(wrong.evidence);
  inventedAcceptance.acceptedResponses.push(result.response);
  assert.equal(validSoundSafariEvidence(inventedAcceptance, rounds), false);
});
