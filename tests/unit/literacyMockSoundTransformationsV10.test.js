import assert from 'node:assert/strict';
import test from 'node:test';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { buildLiteracyMockV10 } from '../../src/data/literacyMockV10.js';
import { buildLiteracyMockSoundTransformationsV10, listLiteracyMockSoundTransformationsV10AudioGaps,
  LITERACY_MOCK_V10_SOUND_ROWS } from '../../src/data/literacyMockSoundTransformationsV10.js';
import { literacyMockDemandV10, literacyMockV10TransformationProofValid } from '../../src/policy/literacyMockDemandV10.js';
import { isLiteracyMockWorkedTutorialTarget } from '../../src/policy/literacyMockDemandV8.js';
import { buildLiteracyExposureIndex, canonicalLiteracyIdentity, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { isLiteracyItemEligible } from '../../src/policy/literacyItemEligibility.js';

const base = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v9', includeUnavailable: true });
const sources = buildLiteracyMockSoundTransformationsV10(base);
const full = buildLiteracyMockV10(base, source => normalizeLiteracyMockItem(source, { contentVersion: 'literacy-mock-v10' }));
const current = full.filter(q => q.id.startsWith('mock.v10.sounds.transform.'));
const old = new Map(base.map(q => [q.id, q]));
const byClaim = claim => current.find(q => q.constructClaim === claim);
const clone = value => JSON.parse(JSON.stringify(value));

test('40 literal source-dependent transformations survive normalization with ten genuine tasks per operation', () => {
  assert.equal(sources.length, 40);
  assert.equal(LITERACY_MOCK_V10_SOUND_ROWS.length, 40);
  assert.equal(current.length, 40);
  assert.equal(new Set(current.map(q => q.id)).size, 40);
  assert.equal(new Set(current.map(q => q.exposureFamilyId)).size, 40);
  assert.deepEqual(Object.fromEntries(['substitute_initial', 'substitute_final', 'delete_phoneme', 'add_phoneme']
    .map(claim => [claim, current.filter(q => q.constructClaim === claim).length])),
  { substitute_initial: 10, substitute_final: 10, delete_phoneme: 10, add_phoneme: 10 });
  for (const q of current) {
    assert.equal(q.adaptiveAreaBand, 5, q.id);
    assert.equal(q.adaptiveDemand.operation, 'manipulate_and_retain_phonemes');
    assert.equal(literacyMockDemandV10(q), 5, q.id);
    assert.equal(isLiteracyItemEligible(q), true, q.id);
    assert.equal(q.sourceWord, q.taskDemand.proof.sourceWord);
    assert.equal(q.targetWord, q.correctWord);
    assert.equal(isLiteracyMockWorkedTutorialTarget(q), false);
    assert.equal(isLiteracyMockWorkedTutorialTarget({ targetWord: q.sourceWord }), false);
    assert.equal(q.requiredAudioCues.length, 5);
    assert.ok(q.requiredAudioCues.every(c => c.role === 'instruction' || c.role === 'choice'));
    assert.ok(q.hideWrittenLabels && !q.renderTargetText && !q.image && !q.passage);
  }
  assert.ok(base.filter(q => q.domainId === 'sound_awareness' && q.adaptiveAreaBand === 5).every(q => literacyMockDemandV10(q) === null),
    'a legacy task label cannot bypass the literal V10 proof');
});

test('four diagnostic choices require the operation and retained pattern together; no single edge or count selects the key', () => {
  for (const q of current) {
    const p = q.taskDemand.proof, sounds = q.choices.map(c => ({ id: c.id, value: p.choicePhonemes[c.id] }));
    const key = sounds.find(c => c.id === q.answer).value;
    const changed = sounds.filter(c => c.id !== p.unchangedSourceFoilId);
    assert.equal(new Set(changed.map(c => c.value.length)).size, 1, `${q.id}: three changed options have equal phoneme counts`);
    assert.ok(sounds.filter(c => c.value.length === key.length).length >= 3, `${q.id}: count cannot select the key`);
    const changedEdge = q.constructClaim === 'substitute_final' ? key.length - 1 : 0;
    assert.equal(new Set(changed.map(c => c.value[changedEdge])).size, 1, `${q.id}: changed edge leaves three options`);
    if (q.constructClaim === 'add_phoneme') assert.equal(new Set(changed.map(c => c.value[1])).size, 1, `${q.id}: retained cluster still leaves three options`);
    if (q.constructClaim === 'delete_phoneme') assert.ok(changed.every(c => c.value[0] !== p.sourcePhonemes[0]), `${q.id}: three options omit removed source onset`);
    const vi = p.retainedVowelIndex, ei = p.retainedOtherEdgeIndex;
    assert.equal(changed.filter(c => c.value[vi] === key[vi]).length, 2, `${q.id}: vowel alone leaves two changed choices`);
    assert.equal(changed.filter(c => c.value[ei] === key[ei]).length, 2, `${q.id}: other retained edge alone leaves two changed choices`);
    const pattern = value => q.constructClaim === 'substitute_final' ? value.slice(0, -1).join(' ')
      : value.slice(value.findIndex(phone => /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/.test(phone))).join(' ');
    const retaining = sounds.filter(c => pattern(c.value) === pattern(key));
    assert.deepEqual(retaining.map(c => c.id).sort(), [q.answer, p.unchangedSourceFoilId].sort(), `${q.id}: source pattern alone leaves two`);
    const rightEdge = value => q.constructClaim === 'substitute_final' ? value.at(-1) === key.at(-1) : value[0] === key[0];
    assert.equal(sounds.filter(c => rightEdge(c.value)).length, 3, `${q.id}: operation edge alone leaves three`);
    assert.deepEqual(retaining.filter(c => rightEdge(c.value)).map(c => c.id), [q.answer], `${q.id}: operation and retention together required`);
  }
  const fan = current.find(q => q.correctWord === 'fan');
  assert.equal(fan.sourceWord, 'pan');
  assert.deepEqual(fan.choices.map(c => c.label), ['fan', 'fat', 'fin', 'pan']);
  assert.deepEqual(fan.taskDemand.proof.sourcePhonemes, ['P', 'AE', 'N']);
  assert.deepEqual(fan.taskDemand.proof.resultPhonemes, ['F', 'AE', 'N']);
  const lap = current.find(q => q.constructClaim === 'delete_phoneme' && q.sourceWord === 'clap');
  assert.deepEqual(lap.choices.map(c => c.label), ['lap', 'lad', 'lip', 'clap']);
  const stop = current.find(q => q.constructClaim === 'add_phoneme' && q.sourceWord === 'top');
  assert.deepEqual(stop.choices.map(c => c.label), ['stop', 'stock', 'step', 'top']);
  assert.deepEqual(stop.taskDemand.proof.resultPhonemes, ['S', 'T', 'AA', 'P']);
});

test('changed foils and equivalent sound anchors preserve earlier semantic exposure identities', () => {
  const replacements = current.filter(q => q.sourceProvenance.priorSemanticItemId);
  assert.equal(replacements.length, 28);
  for (const q of replacements) {
    const prior = old.get(q.sourceProvenance.priorSemanticItemId);
    assert.deepEqual(canonicalLiteracyIdentity(q), canonicalLiteracyIdentity(prior), q.id);
    assert.equal(q.stimulusKey, prior.stimulusKey);
    assert.equal(q.exposureFamilyId, prior.exposureFamilyId);
    assert.equal(getLiteracyExposure(q, buildLiteracyExposureIndex({ exposures: [prior] })).knownFamiliar, true, q.id);
    assert.equal(q.sourceItemId, q.id, 'quality review of an old demand must not invalidate its new literal correction');
  }
  const lip = current.find(q => q.constructClaim === 'add_phoneme' && q.sourceWord === 'lip');
  assert.equal(lip.anchorWord, 'kite');
  assert.equal(old.get(lip.sourceProvenance.priorSemanticItemId).exposureFamilyId, 'oral-operation:add_phoneme:lip:cat',
    'switching between equivalent /k/ cue words cannot manufacture a new operation family');
});

test('literal admission rejects missing source units, response shortcuts, answer audio and incorrect spoken operations', () => {
  const mutations = [
    q => { q.sourceWord = ''; },
    q => { q.taskDemand.proof.sourcePhonemes[0] = 'Z'; },
    q => { q.taskDemand.proof.choicePhonemes.c2[1] = 'AE'; },
    q => { q.taskDemand.proof.vowelFoilId = q.taskDemand.proof.otherEdgeFoilId; },
    q => { q.choices.pop(); q.requiredAudioCues.pop(); },
    q => { q.requiredAudioCues.push({ role: 'target_word', text: q.correctWord, path: '/answer.mp3' }); },
    q => { q.hideWrittenLabels = false; },
    q => { q.taskDemand.proof.instructionText = `Say ${q.correctWord}.`; q.requiredAudioCues[0].text = q.taskDemand.proof.instructionText; },
    q => { q.sourceProvenance.file = 'unreviewed-source.js'; },
  ];
  for (const mutate of mutations) { const q = clone(byClaim('substitute_initial')); mutate(q); assert.equal(literacyMockV10TransformationProofValid(q), false); }
  const addition = clone(byClaim('add_phoneme'));
  addition.taskDemand.proof.choicePhonemes.c1.pop();
  assert.equal(literacyMockV10TransformationProofValid(addition), false);
  const tutorial = clone(byClaim('substitute_initial'));
  tutorial.targetWord = 'hat'; tutorial.correctWord = 'hat';
  assert.equal(literacyMockDemandV10(tutorial), null);
});

test('source authoring does not mutate the frozen base and unresolved audio requests describe only exact authored cues', () => {
  const before = JSON.stringify(base);
  const again = buildLiteracyMockSoundTransformationsV10(base), gaps = listLiteracyMockSoundTransformationsV10AudioGaps(base);
  assert.equal(JSON.stringify(base), before);
  assert.deepEqual(again, sources);
  for (const gap of gaps) {
    assert.ok(['assessment_prompt', 'isolated_word'].includes(gap.role));
    assert.ok(gap.itemIds.length > 0);
    for (const id of gap.itemIds) assert.ok(sources.find(q => q.id === id).requiredAudioCues.some(c => c.text === gap.text && !c.path));
  }
});
