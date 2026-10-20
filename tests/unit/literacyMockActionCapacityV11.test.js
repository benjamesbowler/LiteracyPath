import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { buildLiteracyMockActionCapacityV11 } from '../../src/data/literacyMockActionCapacityV11.js';
import { isQuestionBlockedByMediaQa } from '../../src/data/mediaQaManifest.js';
const base = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v10', includeUnavailable: true });
const normalize = source => normalizeLiteracyMockItem(source, { contentVersion: 'literacy-mock-v11' });
const additions = buildLiteracyMockActionCapacityV11(base, normalize);

test('at least eight new action families add real capacity beyond the prior fifty-two targets', () => {
  const old = new Set(base.filter(q => q.adaptiveMixedEligible && q.domainId === 'language' && q.adaptiveAreaBand < 2).map(q => q.targetWord));
  const words = new Set(additions.map(q => q.targetWord));
  assert.ok(words.size >= 8);
  assert.equal(additions.length, words.size * 2);
  for (const q of additions) {
    assert.ok(!old.has(q.targetWord));
    assert.equal(q.routeReservationArea, 'language');
    assert.equal(q.exposureFamilyId, `mock-foundation-word:${q.targetWord}`);
    assert.ok([0,1].includes(q.adaptiveAreaBand));
    assert.equal(q.choices.length, 4);
    assert.equal(new Set(q.choices.map(c => c.label)).size, 4);
    assert.equal(q.choices.find(c => c.id === q.answer).label, q.targetWord);
  }
});

test('every action uses literal unblocked art and complete exact recordings for all four responses', () => {
  for (const q of additions) {
    assert.ok(!isQuestionBlockedByMediaQa(q), q.id);
    assert.equal(q.imageAlt, q.targetWord);
    assert.ok(existsSync(`public${q.image}`));
    for (const choice of q.choices) {
      const cue = q.requiredAudioCues.find(c => c.role === 'choice' && c.choiceId === choice.id);
      assert.equal(cue?.text, choice.label);
      assert.equal(cue?.path, choice.audioPath);
      assert.ok(existsSync(`public${choice.audioPath}`));
    }
    for (const c of q.choices.filter(c => c.id !== q.answer)) assert.ok(q.distractorRationales[c.id]);
  }
});

test('known depicted objects and concurrent actions are not introduced as ambiguous foils', () => {
  for (const q of additions) {
    const foils = q.choices.filter(c => c.id !== q.answer).map(c => c.label);
    if (q.targetWord === 'spill') assert.ok(!['cup','mug','table','pour'].some(w => foils.includes(w)));
    if (q.targetWord === 'roll') assert.ok(!['push','ball','stand'].some(w => foils.includes(w)));
    if (q.targetWord === 'wear') assert.ok(!['sit','hat','coat','dog'].some(w => foils.includes(w)));
    if (q.targetWord === 'shout') assert.ok(!foils.includes('sing'));
  }
  assert.deepEqual(buildLiteracyMockActionCapacityV11([...base, ...additions], normalize), []);
});
