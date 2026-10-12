import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { literacyMockTaskKey } from '../../src/utils/literacyMockConditions.js';
import { hasIndependentLiteracyMockLadder } from '../../src/utils/literacyMockPlanner.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import { buildLiteracyMockContextLaddersV4, correctLiteracyMockContextV4,
  MOCK_V4_CONTEXT_APPROVED_TASKS } from '../../src/data/literacyMockContextCorrectionsV4.js';

const original = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v3', includeUnavailable: true });
const originalBytes = JSON.stringify(original);
const sources = buildLiteracyMockContextLaddersV4(original);
const bank = sources.map(item => normalizeLiteracyMockItem(item, { contentVersion: 'literacy-mock-v4' }));
const key = item => item.choices.find(choice => choice.id === item.answer).label;

// This literal oracle names the two actual uses, their meanings, and the
// queried actor/event. It does not read author demand labels or proof fields.
const senseOracle = {
  bank: ['Lea sat', 'Dad went', 'the edge of a river', 'a place that keeps money', 1, 'beside the flowing water', 'put money into his account'],
  bark: ['Arun then touched', 'A dog gave', 'a tree’s outer covering', 'a dog’s short loud sound', 2, 'covering the tree’s trunk', 'a loud bark'],
  bat: ['Inez saw', 'she had used', 'a flying animal', 'a stick for hitting a ball', 1, 'flying above the cave', 'hit a ball at the field'],
  spring: ['Jo fixed', 'Flowers opened', 'a curled piece of metal', 'the season after winter', 2, 'curled metal spring', 'weather grew warmer'],
  trunk: ['Sal held', 'Her family’s car', 'the main stem of a tree', 'a car’s storage space', 1, 'tree’s thick trunk', 'bags stored in its trunk'],
  glass: ['She lifted', 'The window', 'a container for a drink', 'a clear material for windows', 2, 'water to her lips', 'see outside'],
  wave: ['Noor gave', 'At the shore', 'a greeting made with a hand', 'a rolling rise of water', 1, 'moving her hand', 'splashed around their feet'],
  seal: ['Kit broke', 'A seal swam', 'a closure that keeps a lid shut', 'an animal that swims in the sea', 2, 'around the jar’s lid', 'dived under the water'],
  ring: ['May put', 'she heard', 'jewellery worn on a finger', 'the sound of a telephone', 1, 'on her finger', 'telephone from the hall'],
  match: ['Eli then watched', 'Dad struck', 'a contest between players', 'a small stick for lighting a fire', 2, 'two teams tried to score', 'light the candles'],
};

test('all ten literal pairs require occurrence binding with neutral questions at both levels', () => {
  assert.equal(bank.length, 20);
  const positions = [];
  for (const [word, [queriedEvent, otherEvent, expectedMeaning, otherMeaning, occurrence, queriedClue, otherClue]] of Object.entries(senseOracle)) {
    const entry = bank.find(item => item.id === `mock.v4.context.${word}.l1`);
    const hard = bank.find(item => item.id === `mock.v4.context.${word}.l2`);
    assert.ok(entry && hard, word);
    assert.equal(entry.prompt, `What did "${word}" mean in the sentence?`, word);
    assert.equal(hard.prompt, `What did "${word}" mean the ${occurrence === 1 ? 'first' : 'second'} time it was used?`, word);
    assert.ok(!entry.prompt.includes(queriedClue) && !hard.prompt.includes(queriedClue), word);
    assert.ok(!hard.prompt.includes(queriedEvent) && !hard.prompt.includes(otherEvent), word);
    assert.equal(key(entry), expectedMeaning, word);
    assert.equal(key(hard), expectedMeaning, word);
    assert.equal(hard.choices.filter(choice => choice.label === otherMeaning).length, 1, word);
    assert.notEqual(hard.choices.find(choice => choice.label === otherMeaning).id, hard.answer, word);
    const occurrences = [...hard.passage.matchAll(new RegExp(`\\b${word}\\b`, 'gi'))].map(match => match.index);
    assert.equal(occurrences.length, 2, word);
    assert.equal([...entry.passage.matchAll(new RegExp(`\\b${word}\\b`, 'gi'))].length, 1, word);
    assert.ok(hard.passage.includes(queriedEvent), word);
    assert.ok(hard.passage.includes(otherEvent), word);
    assert.ok(hard.passage.includes(queriedClue) && hard.passage.includes(otherClue), word);
    assert.ok(entry.passage.includes(queriedClue), word);
    assert.ok(!entry.passage.includes(otherClue), word);
    const eventIndex = hard.passage.indexOf(queriedEvent);
    const eventOccurrence = occurrences.findIndex(index => index >= eventIndex) + 1;
    assert.equal(eventOccurrence, occurrence, word);
    positions.push(occurrence);
  }
  assert.equal(positions.filter(position => position === 1).length, 5);
  assert.equal(positions.filter(position => position === 2).length, 5);
});

test('one exact access/response task has ten independent families at each level', () => {
  assert.deepEqual(new Set(bank.map(literacyMockTaskKey)), new Set(MOCK_V4_CONTEXT_APPROVED_TASKS.map(literacyMockTaskKey)));
  for (const item of bank) {
    assert.equal(item.format, 'choice');
    assert.equal(item.choices.length, 3);
    assert.equal(new Set(item.choices.map(choice => choice.label)).size, 3);
    assert.equal(item.evidenceModality, 'audio+text');
    assert.equal(item.passageAccess, 'audio+text');
    assert.equal(item.oralLanguageAccess, true);
    assert.equal(item.displayPassageDuringResponse, true);
    assert.equal(item.demandCeiling, undefined);
  }
  for (const level of [1, 2]) {
    const items = bank.filter(item => item.level === level);
    assert.equal(new Set(items.map(item => item.exposureFamilyId)).size, 10);
    assert.equal(new Set(items.map(item => item.passage)).size, 10);
  }
  for (const family of new Set(bank.map(item => item.exposureFamilyId))) {
    assert.equal(bank.filter(item => item.exposureFamilyId === family).length, 2);
    const fresh = bank.filter(item => item.exposureFamilyId !== family);
    assert.equal(hasIndependentLiteracyMockLadder(fresh.filter(item => item.level === 1), fresh.filter(item => item.level === 2)), true);
  }
});

test('every audio cue matches the literal question, passage and option; missing files fail closed', () => {
  for (const item of bank) {
    assert.equal(item.requiredAudioCues.length, 5, item.id);
    assert.deepEqual(item.requiredAudioCues.filter(cue => cue.role === 'passage').map(cue => cue.text), [item.passage]);
    assert.deepEqual(item.requiredAudioCues.filter(cue => cue.role === 'instruction').map(cue => cue.text), [item.prompt]);
    for (const cue of item.requiredAudioCues) {
      const mapped = cue.role === 'choice' ? getLedaWordAudioPath(cue.text) || getLedaInstructionAudioPath(cue.text) : getLedaInstructionAudioPath(cue.text);
      assert.equal(cue.path || null, mapped || null, `${item.id} ${cue.role}`);
      if (cue.role === 'choice') assert.equal(item.choices.find(choice => choice.id === cue.choiceId).label, cue.text);
      if (mapped) assert.equal(fs.existsSync(`public${mapped}`), true, mapped);
    }
    assert.equal(item.mediaReady, item.requiredAudioCues.every(cue => Boolean(cue.path)), item.id);
    assert.equal(sources.find(source => source.id === item.id).missingAudioCues.length, item.requiredAudioCues.filter(cue => !cue.path).length, item.id);
  }
});

test('predecessor context and fixed literary tasks cannot claim an adaptive harder level', () => {
  for (const item of original.filter(item => item.skillId === 'context_clues' || (item.skillId === 'literary_craft' && ['fiction', 'sensory_language'].includes(item.constructClaim)))) {
    const result = correctLiteracyMockContextV4(item, original);
    assert.equal(result.level, 1, item.id);
    assert.equal(result.demandCeiling, 1, item.id);
    assert.equal(result.adaptiveMixedEligible, false, item.id);
    assert.deepEqual(correctLiteracyMockContextV4(result, original), result, item.id);
    assert.equal(result.canonicalItemId, item.canonicalItemId, item.id);
    assert.equal(result.exposureFamilyId, item.exposureFamilyId, item.id);
  }
});

test('printed sound-word choices carry no capitalization shortcut and sole-sound metal is entry', () => {
  for (const item of original.filter(item => item.skillId === 'literary_craft' && item.constructClaim === 'sound_words')) {
    const result = correctLiteracyMockContextV4(item, original);
    assert.ok(result.choices.every(choice => choice.label === choice.label.toLowerCase()), item.id);
    assert.equal(result.answer, item.answer, item.id);
    assert.deepEqual(result.requiredAudioCues, item.requiredAudioCues, item.id);
    assert.deepEqual(correctLiteracyMockContextV4(result, original), result, item.id);
  }
  assert.equal(correctLiteracyMockContextV4(original.find(item => item.id === 'mock.depth.metal')).level, 1);
  const source = original.find(item => item.id === 'mock.capacity.literary_craft.sound-duck-quack');
  const duck = correctLiteracyMockContextV4(source);
  assert.deepEqual(duck.choices.map(choice => choice.label), ['quack', 'caw', 'moo']);
  assert.equal(key(duck), 'quack');
});

test('direct book-credit/title lookups are fixed while return sweep and punctuation word boundaries retain their ladder', () => {
  for (const item of original.filter(item => item.skillId === 'print_concepts' && ['title', 'author', 'illustrator'].includes(item.constructClaim))) {
    const result = correctLiteracyMockContextV4(item);
    assert.equal(result.level, 1, item.id);
    assert.equal(result.demandCeiling, 1, item.id);
    assert.equal(result.adaptiveMixedEligible, false, item.id);
    assert.equal(result.passage, item.passage, item.id);
    assert.deepEqual(result.choices, item.choices, item.id);
    assert.deepEqual(result.requiredAudioCues, item.requiredAudioCues, item.id);
  }
  const titleEntry = original.find(item => item.id === 'literacy.print_concepts.cover-title');
  const titleHard = original.find(item => item.id === 'mock.capacity.print.title.l2.title-and-dedication');
  assert.equal(key(titleEntry), titleEntry.passage.split('\n')[0]);
  assert.equal(key(titleHard), titleHard.passage.split('\n')[0]);
  for (const claim of ['reading_direction', 'word_spaces']) {
    const pool = original.filter(item => item.skillId === 'print_concepts' && item.constructClaim === claim);
    assert.equal(hasIndependentLiteracyMockLadder(pool.filter(item => item.level === 1), pool.filter(item => item.level === 2)), true);
    for (const item of pool) assert.equal(correctLiteracyMockContextV4(item), item);
    for (const hard of pool.filter(item => item.level === 2)) {
      if (claim === 'reading_direction') {
        const after = hard.prompt.match(/after (.+)\?/)[1];
        const lines = hard.passage.split('\n');
        assert.equal(lines.length, 2, hard.id);
        assert.equal(lines[0].split(/\s+/).at(-1).toLowerCase(), after.toLowerCase(), hard.id);
        assert.equal(key(hard).toLowerCase(), lines[1].split(/\s+/)[0].toLowerCase(), hard.id);
      } else {
        assert.match(hard.passage, /[’“”]/, hard.id);
        assert.equal(Number(key(hard)), hard.passage.trim().split(/\s+/).length, hard.id);
      }
    }
  }
});

test('supplied heading summaries are fixed and the sole explicit action-door method is entry', () => {
  for (const item of original.filter(item => item.skillId === 'informational_features' && item.constructClaim === 'heading')) {
    const result = correctLiteracyMockContextV4(item);
    assert.equal(result.level, 1, item.id);
    assert.equal(result.demandCeiling, 1, item.id);
    assert.equal(result.adaptiveMixedEligible, false, item.id);
    assert.equal(result.passage, item.passage);
    assert.deepEqual(result.requiredAudioCues, item.requiredAudioCues);
  }
  const door = original.find(item => item.id === 'mock.capacity.language.action-door');
  assert.ok(door.passage.includes('using her elbow'));
  assert.equal(key(door), 'She used her elbow.');
  const revised = correctLiteracyMockContextV4(door);
  assert.equal(revised.level, 1);
  assert.equal(revised.demandCeiling, undefined);
  assert.equal(revised.passage, door.passage);
});

test('missing-I and person-name capitalization retain the same entry convention despite longer context', () => {
  for (const [id, expected] of [['mock.capacity.writing.locate-detail-4', 'i'], ['mock.capacity.writing.locate-detail-6', 'amir']]) {
    const source = original.find(item => item.id === id);
    assert.equal(key(source), expected);
    const result = correctLiteracyMockContextV4(source);
    assert.equal(result.level, 1);
    assert.equal(result.demandCeiling, undefined);
    assert.equal(result.passage, source.passage);
    assert.deepEqual(result.choices, source.choices);
    assert.deepEqual(result.requiredAudioCues, source.requiredAudioCues);
  }
});

test('lonely behavior has two neutral literal foils; the independent isolation clue is removed', () => {
  const source = original.find(item => item.id === 'mock.capacity.literary_craft.words-lonely-lunch');
  const item = correctLiteracyMockContextV4(source);
  assert.equal(key(item), 'watched the laughing group, then lowered her eyes');
  assert.deepEqual(item.choices.filter(choice => choice.id !== item.answer).map(choice => choice.label), ['the lunch table', 'a blue cup']);
  assert.ok(!item.passage.includes('empty chair'));
  for (const choice of item.choices) assert.ok(item.passage.toLowerCase().includes(choice.label.toLowerCase()), choice.label);
  assert.deepEqual(item.requiredAudioCues, source.requiredAudioCues);
  assert.equal(item.canonicalItemId, source.canonicalItemId);
  assert.equal(item.exposureFamilyId, source.exposureFamilyId);
  assert.deepEqual(correctLiteracyMockContextV4(item), item);
});

test('the narrator clue-selection item is kept outside the narrator-identity operation', () => {
  const source = original.find(item => item.id === 'literacy.literary_craft.viewpoint-first');
  assert.equal(source.prompt, 'Which clue shows the narrator is a character?');
  assert.equal(key(source), 'The storyteller says I hid.');
  const result = correctLiteracyMockContextV4(source);
  assert.equal(result.constructClaim, 'identify_narrator_evidence');
  assert.equal(result.level, 1);
  assert.equal(result.demandCeiling, 1);
  assert.equal(result.adaptiveMixedEligible, false);
  assert.equal(result.taskDemand.operation, 'identify_narrator_evidence');
  assert.deepEqual(result.requiredAudioCues, source.requiredAudioCues);
  const identity = original.find(item => item.id === 'literacy.literary_craft.narrator-i');
  assert.equal(identity.prompt, 'Who tells this story?');
  assert.equal(key(identity), 'Pip the mouse');
  assert.notEqual(literacyMockTaskKey(result), literacyMockTaskKey(identity));
  assert.deepEqual(correctLiteracyMockContextV4(result), result);
});

test('authoring and correction never mutate the frozen v3 input', () => {
  for (const item of original) correctLiteracyMockContextV4(item, original);
  assert.equal(JSON.stringify(original), originalBytes);
});
