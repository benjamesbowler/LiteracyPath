import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLiteracyMockTutorialV8 } from '../../src/data/literacyMockTutorialV8.js';
import { loadLiteracyMockBank, normalizeLiteracyMockItem, scoreLiteracyMockResponse } from '../../src/data/literacyMockBank.js';
import { canonicalLiteracyIdentity } from '../../src/utils/literacyEvidence.js';
import { literacyMockDemandV8 } from '../../src/policy/literacyMockDemandV8.js';

test('words exposed in worked tutorials cannot return as fresh scored targets in another area', async () => {
  const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v8', includeUnavailable: true });
  const words = ['cat', 'cup', 'hat', 'dog', 'the', 'puppy', 'sleeps', 'clouds', 'cover', 'moon'];
  const families = new Set(words.map(word => `mock-foundation-word:${word}`));
  const targets = bank.filter(q => words.includes(q.targetWord?.toLowerCase()) || words.includes(q.passage?.trim().toLowerCase()) || families.has(canonicalLiteracyIdentity(q).familyId));
  assert.ok(targets.some(q => q.id === 'mock.v5.listening.phrase.cat'));
  assert.ok(targets.some(q => q.id === 'mock.capacity.foundation.print.first_letter.l1.dog'));
  assert.ok(targets.every(q => q.adaptiveMixedEligible === false && q.adaptiveAreaBand === null));
  const historical = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v7', includeUnavailable: true });
  assert.equal(historical.find(q => q.id === 'mock.v5.listening.phrase.cat').adaptiveMixedEligible, true);
});

test('worked matching tutorial contains only neutral geometry and remains outside scored demand', () => {
  const raw = buildLiteracyMockTutorialV8();
  const item = normalizeLiteracyMockItem(raw, { contentVersion: 'literacy-mock-v8' });
  assert.equal(item.id, 'mock.v8.tutorial.match-shapes');
  assert.equal(item.tutorialOnly, true);
  assert.equal(item.itemSnapshot.tutorialOnly, true);
  assert.equal(literacyMockDemandV8(item), null);
  assert.equal(item.targetWord, '');
  assert.equal(item.passage, '');
  assert.deepEqual(item.requiredImagePaths, []);
  assert.deepEqual(new Set(item.choices.map(choice => choice.label)), new Set(['●', '▲', '■']));
  assert.deepEqual(new Set(item.matchTargets.map(target => target.label)), new Set(['●', '▲', '■']));
  assert.ok([...item.choices, ...item.matchTargets].every(value => !/[a-z]/i.test(value.label)));
  assert.equal(item.requiredAudioCues.length, 1);
  assert.equal(item.requiredAudioCues[0].role, 'instruction');
  assert.equal(item.requiredAudioCues[0].text, 'Match each shape to the same shape.');
  assert.equal(item.mediaReady, Boolean(raw.requiredAudioCues[0].path));
});

test('matching answer uses target order and stable choice identities', () => {
  const item = normalizeLiteracyMockItem(buildLiteracyMockTutorialV8(), { contentVersion: 'literacy-mock-v8' });
  const byId = new Map(item.choices.map(choice => [choice.id, choice]));
  assert.equal(item.answerMode, 'sequence');
  assert.equal(item.sequenceLength, item.matchTargets.length);
  for (const [index, target] of item.matchTargets.entries()) {
    assert.equal(byId.get(item.answer[index]).label, target.label);
  }
  assert.equal(scoreLiteracyMockResponse(item, ['c1', 'c2', 'c0']), true);
  assert.equal(scoreLiteracyMockResponse(item, ['c0', 'c1', 'c2']), false);
  assert.equal(scoreLiteracyMockResponse(item, ['c1', 'c0', 'c2']), false);
  assert.equal(scoreLiteracyMockResponse(item, ['c1', 'c2']), false);
  // Rendering may shuffle cards; their stable IDs still carry the same key.
  assert.equal(scoreLiteracyMockResponse({ ...item, choices: [...item.choices].reverse() }, item.answer), true);
});
