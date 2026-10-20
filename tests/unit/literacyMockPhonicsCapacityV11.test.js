import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { buildLiteracyMockPhonicsCapacityV11 } from '../../src/data/literacyMockPhonicsCapacityV11.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
const base = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v10', includeUnavailable: true });
const normalize = source => normalizeLiteracyMockItem(source, { contentVersion: 'literacy-mock-v11' });
const additions = buildLiteracyMockPhonicsCapacityV11(base, normalize);

test('phonics stock adds forty genuinely different CVC targets rather than fresh ids for old targets', () => {
  const existing = new Set(base.filter(q => q.adaptiveMixedEligible && q.domainId === 'phonics' && q.adaptiveAreaBand === 1).map(q => q.targetWord || q.canonicalPassageId));
  assert.ok(additions.length >= 40);
  assert.equal(new Set(additions.map(q => q.targetWord)).size, additions.length);
  for (const q of additions) {
    assert.ok(!existing.has(q.targetWord), q.id);
    assert.equal(q.canonicalPassageId, q.targetWord);
    assert.equal(q.exposureFamilyId, `mock-foundation-word:${q.targetWord}`);
    assert.equal(q.adaptiveAreaBand, 1);
    assert.equal(q.adaptiveDemand.operation, 'decode_cvc');
  }
});

test('every added CVC has one literal key and three real close silent printed alternatives', () => {
  for (const q of additions) {
    assert.equal(q.choices.length, 4);
    assert.equal(new Set(q.choices.map(c => c.label)).size, 4);
    assert.equal(q.choices.find(c => c.id === q.answer).label, q.targetWord);
    for (const c of q.choices) {
      assert.match(c.label, /^[a-z]{3}$/);
      assert.equal(c.audioPath, undefined);
      if (c.id !== q.answer) {
        assert.ok([...c.label].filter((letter, i) => letter !== q.targetWord[i]).length <= 2, q.id);
        assert.ok(q.distractorRationales[c.id]);
      }
    }
    assert.equal(q.requiredAudioCues.filter(c => c.role === 'choice').length, 0);
    assert.ok(q.requiredAudioCues.some(c => c.role === 'target_word' && c.text === q.targetWord));
    for (const path of [...q.requiredAudioPaths, ...q.requiredImagePaths]) assert.ok(existsSync(`public${path.split('#')[0]}`), `${q.id}: ${path}`);
  }
});

test('previous reading or sound exposure to the same word still excludes the added phonics target', () => {
  for (const q of additions) {
    const history = buildLiteracyExposureIndex({ exposures: [{ exposureFamilyId: `mock-foundation-word:${q.targetWord}` }] });
    assert.equal(getLiteracyExposure(q, history).knownFamiliar, true, q.id);
  }
});

test('capacity generation is idempotent and cannot count another id for an already admitted target', () => {
  assert.deepEqual(buildLiteracyMockPhonicsCapacityV11([...base, ...additions], normalize), []);
});

test('at least thirty new audio-only CVC targets add phonics stock without consuming required reading pictures', () => {
  const spoken = additions.filter(q => !q.image);
  assert.ok(spoken.length > 30, `Only ${spoken.length} genuinely new audio-only targets`);
  const forbiddenFourPhonemeTargets = new Set(['mix','fix','six']);
  for (const item of spoken) {
    assert.equal(item.evidenceModality, 'audio+print');
    assert.deepEqual(item.requiredImagePaths, []);
    assert.deepEqual(item.mediaDecision.paths, []);
    assert.ok(item.mediaDecision.constructReview === 'approved');
    assert.equal(item.taskDemand.proof.targetPhonemes.length, 3);
    assert.ok(!forbiddenFourPhonemeTargets.has(item.targetWord));
    assert.equal(item.requiredAudioCues.filter(c => c.role === 'target_word').length, 1);
    assert.equal(item.requiredAudioCues.filter(c => c.role === 'choice').length, 0);
  }
});
