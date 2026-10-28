import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { LITERACY_MOCK_RUNTIME_V11 } from '../../src/data/generated/literacyMockRuntimeV11.generated.js';
import { normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { buildLiteracyMockBeginnerV12 } from '../../src/data/literacyMockBeginnerV12.js';
import { literacyMockDemandV12 } from '../../src/policy/literacyMockDemandV12.js';
import { literacyMockBeginnerVocabularyIssue } from '../../src/policy/literacyMockBeginnerVocabulary.js';

const base = LITERACY_MOCK_RUNTIME_V11;
const additions = buildLiteracyMockBeginnerV12(base, source => normalizeLiteracyMockItem(source, { contentVersion: 'literacy-mock-v12' }))
  .map(q => ({ ...q, adaptiveAreaVersion: 'areas-v6' }));

test('V12 adds real new reading targets and sentences while leaving all published V11 snapshots unchanged', () => {
  const before = JSON.stringify(base);
  assert.equal(additions.length, 22);
  assert.equal(new Set(additions.map(q => q.id)).size, additions.length);
  const reading = additions.filter(q => q.domainId === 'reading');
  assert.equal(new Set(reading.map(q => q.targetWord)).size, 7);
  const oldReading = new Set(base.filter(q => q.skillId === 'picture_word_reading').map(q => q.targetWord));
  for (const q of reading) {
    assert.ok(!oldReading.has(q.targetWord));
    assert.equal(q.exposureFamilyId, `mock-foundation-word:${q.targetWord}`, 'Same word in another area stays familiar');
  }
  assert.deepEqual(buildLiteracyMockBeginnerV12([...base, ...additions], source => source), []);
  assert.equal(JSON.stringify(base), before);
});

test('new beginner items use familiar language, exact existing media and silent reading/capitalization responses', () => {
  for (const q of additions) {
    assert.equal(literacyMockBeginnerVocabularyIssue(q), null, q.id);
    assert.equal(literacyMockDemandV12(q), q.adaptiveAreaBand, q.id);
    assert.equal(q.mediaReady, true, q.id);
    assert.equal(q.choices.length, 4);
    assert.equal(new Set(q.choices.map(c => c.label)).size, 4);
    assert.ok(q.choices.every(c => !c.audioPath));
    assert.deepEqual(q.requiredAudioCues.map(c => c.role), ['instruction']);
    for (const path of [...q.requiredAudioPaths, ...q.requiredImagePaths]) assert.ok(statSync(`public${path}`).size > 0, path);
  }
  for (const q of additions.filter(q => q.targetWord === 'run')) assert.ok(q.choices.every(c => c.label !== 'red'));
  for (const q of additions.filter(q => q.targetWord === 'sad')) assert.ok(q.choices.every(c => !['sit', 'sat'].includes(c.label)));
  assert.ok(!additions.some(q => q.targetWord === 'wet'), 'Keep this scarce blending target in sound awareness rather than reserving it for reading');
});

test('sentence-case options retain identical wording, one defensible conventional case pattern and no extra reading task', () => {
  for (const q of additions.filter(q => q.domainId === 'writing')) {
    const labels = q.choices.map(c => c.label);
    assert.equal(new Set(labels.map(label => label.toLowerCase())).size, 1);
    assert.equal(labels.filter(label => /^[A-Z][^A-Z]*[.?]$/.test(label)).length, 1);
    assert.match(q.prompt, /uses capital letters correctly/);
    assert.equal(q.passage, '');
    assert.equal(q.image, '');
    assert.equal(q.adaptiveAreaBand, 1);
  }
});

test('demand review rejects narrated printed answers, fake targets and altered case-task words', () => {
  const reading = additions.find(q => q.domainId === 'reading' && q.adaptiveAreaBand === 1);
  assert.equal(literacyMockDemandV12({ ...reading, choices: reading.choices.map((c, i) => i ? c : { ...c, audioPath: '/answer.mp3' }) }), null);
  assert.equal(literacyMockDemandV12({ ...reading, targetWord: 'bad' }), null);
  const writing = additions.find(q => q.domainId === 'writing');
  assert.equal(literacyMockDemandV12({ ...writing, choices: writing.choices.map((c, i) => i === 1 ? { ...c, label: 'a different sentence.' } : c) }), null);
  assert.equal(literacyMockDemandV12({ ...writing, requiredAudioCues: [...writing.requiredAudioCues, { role: 'choice', text: writing.choices[0].label }] }), null);
});
