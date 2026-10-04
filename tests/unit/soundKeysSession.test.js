import assert from 'node:assert/strict';
import test from 'node:test';
import { SOUNDKEYS_CONTENT_VERSION, newSoundKeysEvidence, soundKeysResponse, completeSoundKeysWord, validateSoundKeysSession } from '../../src/utils/soundKeysSession.js';

const rounds = [{ id: 'cat', tokens: ['c', 'a', 't'] }, { id: 'ship', tokens: ['sh', 'i', 'p'] }];
const context = round => ({ seed: 913, round, journeyIndex: 0, rounds });
const receipt = { round: 0, word: 'cat', kind: 'target', src: '/audio/production/cat.mp3', at: 1 };
function response(evidence, unit, selected, extra = {}) {
  return soundKeysResponse(evidence, rounds[0], { round: 0, unit, selected, source: 'computer', at: 2 + unit, receipt, ...extra });
}
function fixture({ evidence, prefix = [], round = 0, originRound = 0, celebrating = false, supportReasons = [] }) {
  const errors = [...evidence.firstResponses, ...evidence.assistedRetries].filter(row => !row.correct);
  return { version: SOUNDKEYS_CONTENT_VERSION, seed: 913, journeyIndex: 0, originRound, round,
    word: rounds[round].id, prefix, bank: 0, voice: 'bells', freePlay: false, celebrating,
    score: evidence.completions.reduce((sum, row) => sum + row.points, 0), mistakes: errors.length,
    roundMistakes: errors.filter(row => row.round === round).length, elapsed: 10, supportReasons, evidence };
}

test('first wrong key remains immutable through delivered supported retry and valid prefix restore', () => {
  let evidence = { ...newSoundKeysEvidence(), audioReceipts: [receipt] };
  const wrong = response(evidence, 0, 'k'); evidence = wrong.evidence;
  evidence = response(evidence, 0, 'c').evidence;
  assert.deepEqual(evidence.firstResponses, [wrong.row]);
  assert.equal(evidence.assistedRetries[0].independentEncodingPractice, false);
  assert.deepEqual(evidence.acceptedResponses, evidence.assistedRetries);
  const saved = fixture({ evidence, prefix: ['c'] });
  assert.deepEqual(validateSoundKeysSession(saved, context(0)), saved);
  assert.equal(saved.mistakes, 1);
});

test('pending or aborted target and musical/phoneme end cannot fabricate delivered word evidence', () => {
  const empty = newSoundKeysEvidence();
  const pending = response(empty, 0, 'c').row;
  assert.equal(pending.deliveryAtResponse, 'pending');
  assert.equal(pending.independentEncodingPractice, false);
  const unit = { ...receipt, kind: 'unit' };
  const phoneme = response({ ...empty, audioReceipts: [unit] }, 0, 'c', { receipt: unit }).row;
  assert.equal(phoneme.deliveryAtResponse, 'pending');
  const later = { ...receipt, at: 3 };
  assert.equal(response({ ...empty, audioReceipts: [later] }, 0, 'c', { receipt: later }).row.deliveryAtResponse, 'pending');
});

test('undo and replay remain supported at completion even after previously independent accepted keys', () => {
  let evidence = { ...newSoundKeysEvidence(), audioReceipts: [receipt] };
  for (const [unit, token] of rounds[0].tokens.entries()) evidence = response(evidence, unit, token).evidence;
  assert.ok(evidence.acceptedResponses.every(row => row.independentEncodingPractice));
  evidence = completeSoundKeysWord(evidence, rounds[0], 0, ['undo', 'word-replay']);
  assert.equal(evidence.completions[0].supported, true);
  assert.deepEqual(evidence.completions[0].supportReasons, ['undo', 'word-replay']);
  const saved = fixture({ evidence, prefix: rounds[0].tokens, celebrating: true });
  assert.ok(validateSoundKeysSession(saved, context(0)));
  const forged = structuredClone(saved); forged.evidence.completions[0].supported = false;
  assert.equal(validateSoundKeysSession(forged, context(0)), null);
});

test('session rejects corrupt seed, prefix, forged accepted decision and future receipt without discarding honest history', () => {
  let evidence = { ...newSoundKeysEvidence(), audioReceipts: [receipt] };
  evidence = response(evidence, 0, 'c').evidence;
  const saved = fixture({ evidence, prefix: ['c'] });
  for (const mutate of [value => { value.seed = -1; }, value => { value.prefix = ['k']; },
    value => { value.evidence.acceptedResponses[0] = { ...value.evidence.acceptedResponses[0], source: 'midi' }; },
    value => { value.evidence.audioReceipts[0].at = 50; },
    value => { value.evidence.firstResponses[0].independentEncodingPractice = undefined; }]) {
    const forged = structuredClone(saved); mutate(forged);
    assert.equal(validateSoundKeysSession(forged, context(0)), null);
  }
  assert.equal(validateSoundKeysSession(saved, { ...context(0), seed: Number.MAX_SAFE_INTEGER }), null);
  assert.ok(validateSoundKeysSession({ ...saved, prefix: [] }, context(0)), 'Undo retains original immutable response history');
});

test('legacy positive checkpoint starts an honest partial outing without inventing earlier completions or points', () => {
  const saved = fixture({ evidence: newSoundKeysEvidence(), round: 1, originRound: 1, supportReasons: ['resume-without-support-record'] });
  assert.ok(validateSoundKeysSession(saved, context(1)));
  assert.equal(saved.score, 0);
  assert.equal(saved.evidence.completions.length, 0);
  assert.equal(validateSoundKeysSession({ ...saved, originRound: 0 }, context(1)), null);
});
