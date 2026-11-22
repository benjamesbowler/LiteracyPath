import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import test from 'node:test';
import { LITERACY_MOCK_RUNTIME_V12 as historical } from '../../src/data/generated/literacyMockRuntimeV12.generated.js';
import { LITERACY_MOCK_RUNTIME_V13 as scored } from '../../src/data/generated/literacyMockRuntimeV13.generated.js';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { buildLiteracyMockV13, cvcChoiceUsesSingleLetter, LITERACY_MOCK_V13_WITHDRAWN } from '../../src/data/literacyMockV13.js';
import { literacyMockBeginnerVocabularyIssue } from '../../src/policy/literacyMockBeginnerVocabulary.js';
import { resolveLiteracyMockImagePath } from '../../src/data/literacyMockImageDelivery.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { selectLiteracyMockPlan, adaptLiteracyMockPlan, shuffleLiteracyMock } from '../../src/utils/literacyMockPlanner.js';
import { mockOfflineMediaAssetLimit } from '../../src/utils/literacyMockOfflineMedia.js';
import { scoreLiteracyMockResponse, literacyMockTutorialIdsForVersion } from '../../src/data/literacyMockRuntimeContract.js';
import { auditLiteracyMockBank } from '../../tools/lib/literacyMockContracts.mjs';

const originalSerialized = JSON.stringify(historical);
const beforePartition = buildLiteracyMockV13(historical);
const byId = new Map(scored.map(item => [item.id, item]));
const oldById = new Map(historical.map(item => [item.id, item]));
const repeatedFoils = new Set(['apple', 'bus', 'cat']);
const occurrences = ['listening:0', 'listening:1', 'vocabulary:0'];
const cell = item => `${item.domainId}:${item.adaptiveAreaBand}`;
const choicesOtherThanRepeats = item => item.choices.filter(choice => !repeatedFoils.has(choice.label));

test('V13 authored catalogue and mixed runtime have exact matching snapshots and pass the question contracts', async () => {
  const contentVersion = 'literacy-mock-v13';
  const authored = await loadLiteracyMockBank({ contentVersion });
  assert.deepEqual(auditLiteracyMockBank(authored, { contentVersion }), []);
  const eligible = authored.filter(item => item.tutorialOnly || item.adaptiveMixedEligible);
  assert.equal(eligible.length, scored.length);
  for (const item of eligible) assert.deepEqual(JSON.parse(JSON.stringify(item)), byId.get(item.id), item.id);
});

test('V13 keeps distinct familiar picture contrasts and the old answer-only shortcut is near guessing', () => {
  for (const pool of occurrences) {
    const candidates = beforePartition.filter(item => cell(item) === pool && item.adaptiveMixedEligible);
    const delivered = scored.filter(item => cell(item) === pool && item.adaptiveMixedEligible);
    const foilSignatures = new Set();
    for (const item of candidates) {
      const foilLabels = item.choices.filter(choice => choice.id !== item.answer).map(choice => choice.label).sort();
      const signature = foilLabels.join(' ');
      assert.ok(!foilSignatures.has(signature), `${item.id} repeats all three foils`);
      foilSignatures.add(signature);
      assert.equal(literacyMockBeginnerVocabularyIssue(item), null, item.id);
      const spokenWords = new Set(item.passage.toLowerCase().match(/[a-z]+/g) || []);
      assert.ok(foilLabels.every(label => !spokenWords.has(label)), `${item.id} names a foil`);
      assert.equal(new Set(item.choices.map(choice => resolveLiteracyMockImagePath(choice.image))).size, 4, item.id);
      assert.ok(item.choices.every(choice => choice.image && choice.imageAlt && !choice.audioPath), item.id);
      assert.deepEqual(item.requiredAudioCues, oldById.get(item.id).requiredAudioCues, item.id);
    }
    const expected = delivered.reduce((sum, item) => {
      const remaining = choicesOtherThanRepeats(item);
      return sum + (remaining.some(choice => choice.id === item.answer) ? 1 / remaining.length : 0);
    }, 0) / delivered.length;
    assert.ok(expected <= 0.28, `${pool} has an answer-only expectation of ${expected}`);
  }
});

test('V13 removes single-position CVC keys and keeps the original audio and exposure identity', () => {
  const candidates = beforePartition.filter(item => item.adaptiveMixedEligible && item.adaptiveAreaBand === 1
    && ['reading', 'phonics'].includes(item.domainId));
  assert.equal(candidates.length, 156);
  assert.ok(candidates.every(item => !cvcChoiceUsesSingleLetter(item.choices, item.answer)), 'A single letter identifies the keyed word.');
  for (const item of candidates) {
    const previous = oldById.get(item.id);
    assert.equal(literacyMockBeginnerVocabularyIssue(item), null, item.id);
    assert.equal(item.answer, previous.answer, item.id);
    assert.equal(item.exposureFamilyId, previous.exposureFamilyId, item.id);
    assert.equal(item.stimulusKey, previous.stimulusKey, item.id);
    assert.deepEqual(item.requiredAudioCues, previous.requiredAudioCues, item.id);
    assert.ok(item.choices.every(choice => !choice.audioPath), item.id);
  }
  for (const word of ['sat', 'dug']) {
    const item = candidates.find(item => item.id === `mock.v11.phonics.cvc-capacity.${word}`);
    assert.ok(oldById.get(item.id).requiredImagePaths.length);
    assert.deepEqual(item.requiredImagePaths, []);
    assert.equal(item.image, '');
    assert.equal(item.evidenceModality, 'audio+print');
  }
});

test('named content defects are withdrawn from V13 while V12 stays immutable', () => {
  for (const id of Object.keys(LITERACY_MOCK_V13_WITHDRAWN)) {
    assert.equal(oldById.get(id)?.adaptiveMixedEligible, true, id);
    assert.equal(beforePartition.find(item => item.id === id)?.adaptiveMixedEligible, false, id);
    assert.equal(byId.has(id), false, id);
  }
  assert.equal(JSON.stringify(historical), originalSerialized);
  for (const item of scored) {
    assert.equal(item.stimulusKey, oldById.get(item.id).stimulusKey, item.id);
    assert.equal(item.exposureFamilyId, oldById.get(item.id).exposureFamilyId, item.id);
    assert.equal(item.contentVersion, 'literacy-mock-v13', item.id);
  }
});

test('V13 scored routes retain real fresh capacity and the old shortcut stays near chance at each length', () => {
  const tutorials = Object.values(literacyMockTutorialIdsForVersion('literacy-mock-v13')).map(id => byId.get(id));
  const bytes = new Map();
  for (const itemCount of [15, 25, 40]) {
    let correct = 0, attempted = 0;
    for (let seed = 0; seed < 12; seed++) {
      const sessionId = `v13-foil-audit-${itemCount}-${seed}`;
      let ids;
      let plan = selectLiteracyMockPlan(scored, { sessionId, studentId: 'synthetic', itemCount, onOfflineItems: value => { ids = value; } });
      const pool = ids.map(id => byId.get(id));
      const paths = new Set([...pool, ...tutorials].flatMap(item => [...item.requiredImagePaths, ...item.requiredAudioPaths])
        .map(path => resolveLiteracyMockImagePath(path).split(/[?#]/)[0]));
      assert.ok(paths.size <= mockOfflineMediaAssetLimit('literacy-mock-v13'), sessionId);
      for (const path of paths) {
        if (!bytes.has(path)) bytes.set(path, statSync(new URL(`../../public${path}`, import.meta.url)).size);
        assert.ok(bytes.get(path) > 0 && bytes.get(path) <= 4 * 1024 ** 2, path);
      }
      assert.ok([...paths].reduce((sum, path) => sum + bytes.get(path), 0) <= 48 * 1024 ** 2, sessionId);
      const responses = [];
      while (responses.length < plan.itemIds.length) {
        const item = byId.get(plan.itemIds[responses.length]);
        const tested = occurrences.includes(cell(item));
        const selected = tested ? shuffleLiteracyMock(choicesOtherThanRepeats(item), `${sessionId}:${item.id}:blind`)[0].id : item.answer;
        const isCorrect = scoreLiteracyMockResponse(item, selected);
        if (tested) { attempted++; correct += Number(isCorrect); }
        responses.push({ questionId: item.id, domainId: item.domainId, skillId: item.skillId, level: item.level,
          itemSnapshot: item.itemSnapshot, selected, isCorrect, responseStatus: 'answered', evidenceType: 'independent' });
        plan = adaptLiteracyMockPlan(pool, plan, responses, [], [], { itemCount });
        assert.equal(new Set(responses.map(response => response.itemSnapshot.exposureFamilyId)).size, responses.length);
      }
      assert.equal(responses.length, itemCount, sessionId);
    }
    assert.ok(attempted >= 36, `Insufficient ${itemCount}-answer route data`);
    assert.ok(correct / attempted <= 0.42, `Old foil rule answered ${correct}/${attempted} at ${itemCount} answers`);
  }
});

test('five 40-answer retakes preserve fresh letter and word capacity after the practice partition', () => {
  const exposures = [];
  const itemCount = 40;
  for (let sitting = 1; sitting <= 5; sitting++) {
    const sessionId = `v13-content-retake-${sitting}`;
    let ids;
    let plan = selectLiteracyMockPlan(scored, { sessionId, studentId: 'same-learner', exposures, itemCount,
      onOfflineItems: value => { ids = value; } });
    const pool = ids.map(id => byId.get(id));
    const responses = [];
    while (responses.length < plan.itemIds.length) {
      const item = byId.get(plan.itemIds[responses.length]);
      assert.equal(getLiteracyExposure(item, buildLiteracyExposureIndex({ exposures, responses })).knownFamiliar, null, item.id);
      responses.push({ questionId: item.id, domainId: item.domainId, skillId: item.skillId, level: item.level,
        itemSnapshot: item.itemSnapshot, selected: item.answer, isCorrect: true, responseStatus: 'answered', evidenceType: 'independent' });
      plan = adaptLiteracyMockPlan(pool, plan, responses, [], [], { itemCount, exposures });
    }
    assert.equal(responses.length, itemCount, sessionId);
    exposures.push(...responses);
  }
});
