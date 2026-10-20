import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { buildLiteracyMockEverydayCapacityV11 } from '../../src/data/literacyMockEverydayCapacityV11.js';
const base = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v10', includeUnavailable: true });
const normalize = source => normalizeLiteracyMockItem(source, { contentVersion: 'literacy-mock-v11' });
const additions = buildLiteracyMockEverydayCapacityV11(base, normalize);
const everyday = additions.filter(q => q.skillId !== 'picture_word_reading');

test('forty new everyday lexical families are fresh against the full previous three-skill union', () => {
  const existing = new Set(base.filter(q => q.adaptiveMixedEligible && ['picture_vocabulary','picture_word_reading','listen_words_phrases'].includes(q.skillId)).map(q => q.targetWord));
  const words = new Set(everyday.map(q => q.targetWord));
  assert.ok(words.size >= 40);
  assert.equal(everyday.length, words.size * 4);
  for (const word of words) {
    assert.ok(!existing.has(word), word);
    const variants = everyday.filter(q => q.targetWord === word);
    assert.deepEqual(new Set(variants.map(q => `${q.domainId}/${q.adaptiveAreaBand}`)), new Set(['vocabulary/0','vocabulary/1','listening/0','listening/1']));
    assert.ok(variants.every(q => q.exposureFamilyId === `mock-foundation-word:${word}`));
  }
});

test('every picture option has exact meaningful evidence and one literal target', () => {
  for (const q of everyday) {
    assert.equal(q.choices.length, 4);
    assert.equal(new Set(q.choices.map(c => c.label)).size, 4);
    assert.equal(q.choices.find(c => c.id === q.answer).label, q.targetWord);
    for (const choice of q.choices) {
      assert.equal(choice.imageAlt, choice.label);
      assert.ok(existsSync(`public${choice.image.split('#')[0]}`), `${q.id}: ${choice.image}`);
    }
    assert.ok(q.hideWrittenLabels);
    assert.ok(!q.requiredAudioCues.some(c => c.role === 'choice'));
    if (q.domainId === 'listening' && q.adaptiveAreaBand === 1) {
      assert.match(q.passage, new RegExp(`\\b${q.targetWord}\\b`));
      assert.equal(q.requiredAudioCues.filter(c => c.role === 'passage').length, 1);
      for (const c of q.choices.filter(c => c.id !== q.answer)) assert.ok(!new RegExp(`\\b${c.label}\\b`).test(q.passage), `${q.id}: foil in sentence`);
    } else assert.ok(q.requiredAudioCues.some(c => c.role === 'target_word' && c.text === q.targetWord && c.path));
  }
});

test('reading capacity adds nine real fresh target families with silent print and meaningful exact images', () => {
  const reading = additions.filter(q => q.skillId === 'picture_word_reading');
  const old = new Set(base.filter(q => q.adaptiveMixedEligible && q.skillId === 'picture_word_reading').map(q => q.targetWord));
  assert.equal(new Set(reading.map(q => q.targetWord)).size, 9);
  assert.equal(reading.length, 18);
  for (const item of reading) {
    assert.ok(!old.has(item.targetWord), item.id);
    assert.equal(item.routeReservationArea, 'reading');
    assert.equal(item.exposureFamilyId, `mock-foundation-word:${item.targetWord}`);
    assert.equal(item.choices.length, 4);
    assert.equal(new Set(item.choices.map(c => c.label)).size, 4);
    assert.equal(item.choices.find(c => c.id === item.answer).label, item.targetWord);
    assert.equal(item.taskDemand.proof.targetPhonemes.length, 3);
    assert.ok(item.requiredAudioCues.every(c => c.role === 'instruction'));
    assert.ok(item.choices.every(c => !c.audioPath));
    assert.ok(existsSync(`public${item.image}`));
    if (item.adaptiveAreaBand === 0) assert.equal(new Set(item.choices.map(c => c.label[0])).size, 4);
    if (item.targetWord === 'cop') assert.ok(!item.choices.some(c => c.label === 'cap'));
  }
});

test('lexical area reservations stay fixed when a previously authored family is already present', () => {
  const history = [...base, ...everyday.filter(q => q.targetWord === 'lion')];
  const filtered = buildLiteracyMockEverydayCapacityV11(history, normalize);
  for (const item of filtered) {
    const original = additions.find(q => q.id === item.id);
    assert.equal(item.routeReservationArea, original.routeReservationArea, item.id);
  }
  assert.equal(new Set(everyday.filter(q => q.routeReservationArea === 'vocabulary').map(q => q.targetWord)).size, 20);
  assert.equal(new Set(everyday.filter(q => q.routeReservationArea === 'listening').map(q => q.targetWord)).size, 19);
  assert.ok(additions.filter(q => q.targetWord === 'leg').every(q => q.routeReservationArea === 'reading'));
  assert.deepEqual(buildLiteracyMockEverydayCapacityV11([...base, ...additions], normalize), []);
});

test('body and weather option imagery avoids the specific ambiguous scene and low-contrast glyph', () => {
  for (const item of everyday) for (const c of item.choices) {
    if (c.label === 'hand') assert.equal(c.image, '/media/initial-sounds/images/h/hand.webp');
    if (c.label === 'rain') assert.equal(c.image, '/images/assessment/long-vowels/rain.webp');
    if (item.targetWord === 'cloud' && item.adaptiveAreaBand === 1 && item.domainId === 'vocabulary')
      assert.ok(!['rain','snow'].includes(c.label));
    if (item.targetWord === 'tooth' && item.adaptiveAreaBand === 1 && item.domainId === 'vocabulary')
      assert.notEqual(c.label, 'mouth');
  }
});
