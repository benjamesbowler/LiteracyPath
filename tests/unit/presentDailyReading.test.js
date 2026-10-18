import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PRESENT_DAILY_READING, dailyPresentReading, presentGameSchedule } from '../../src/data/presentDailyReading.js';
import { PRESENT_NARRATION_AUDIO, PRESENT_NARRATION_METADATA } from '../../src/data/generated/presentNarration.generated.js';
import { PRESENT_VOCABULARY } from '../../src/data/presentVocabulary.js';
import { normalizeLedaAudioText } from '../../src/data/normalizeLedaAudioText.js';

const allCards = Object.values(PRESENT_DAILY_READING).flat();
const commands = /^(Count|Trace|Raise|Pretend|Point)\b/;
const genericPointing = /^(?:This is|Here is|Can you (?:see|find)|Show me|Find the|Look at)\b/;

test('all 135 lessons have ten useful weekly ESL sentences, current vocabulary and familiar review', () => {
  assert.equal(Object.keys(PRESENT_DAILY_READING).length, 27);
  const introduced = new Set();
  for (let cycle = 1; cycle <= 27; cycle++) {
    const cards = PRESENT_DAILY_READING[cycle];
    assert.equal(cards.length, 10);
    assert.equal(new Set(cards.map(card => card.sentence)).size, 10);
    assert.ok(new Set(cards.map(card => card.word)).size >= 4);
    const currentWords = PRESENT_VOCABULARY[cycle].map(card => card.word);
    for (const word of currentWords) assert.ok(cards.some(card => card.word === word));
    if (cycle > 1) assert.ok(cards.some(card => introduced.has(card.word)));
    for (const word of currentWords) introduced.add(word);
    for (const card of cards) {
      assert.ok(card.sentence.trim().split(/\s+/).length <= 9, card.sentence);
      assert.ok(fs.existsSync('public' + card.imagePath), card.word);
      assert.equal(card.childReadingClaim, false);
      assert.doesNotMatch(card.sentence, genericPointing);
    }
    assert.ok(cards.some(card => card.sentence.endsWith('?')));
    assert.ok(cards.some(card => commands.test(card.sentence)));
    assert.ok(cards.filter(card => !commands.test(card.sentence) && !card.sentence.endsWith('?')).length >= 7);
    assert.deepEqual(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].flatMap(day => dailyPresentReading(cycle, day)), cards);
  }
});

test('all daily readings and factual detective repairs have exact whole-sentence recordings', () => {
  assert.equal(new Set(allCards.map(card => card.id)).size, 270);
  for (const card of allCards) {
    assert.equal(card.readingPurpose, 'supported-shared-reading');
    assert.ok(card.sceneRequirements.includes(card.sentence));
    assert.ok(card.meaningPrompt.length > 5);
    assert.ok(card.acceptedResponses.length > 0);
    assert.notEqual(card.meaningPrompt, 'What does this sentence help us notice?');
    for (const text of [card.sentence, card.detectiveSource.correctSentence]) {
      const key = normalizeLedaAudioText(text);
      assert.ok(PRESENT_NARRATION_AUDIO[key], `Missing exact recording: ${text}`);
      assert.equal(PRESENT_NARRATION_METADATA[key].transcript, text);
    }
  }
});

test('inspected picture details determine colour, count, action and location language', () => {
  assert.equal(PRESENT_DAILY_READING[10][0].sentence, 'This cup is blue.');
  assert.equal(PRESENT_DAILY_READING[10][1].sentence, 'The goat has brown fur.');
  assert.equal(PRESENT_DAILY_READING[10][3].sentence, 'The goat has two horns.');
  assert.equal(PRESENT_DAILY_READING[3][0].sentence, 'Two eggs are in the nest.');
  assert.equal(PRESENT_DAILY_READING[4][2].sentence, 'The fan has four blades.');
  assert.equal(PRESENT_DAILY_READING[14][3].sentence, 'The boy is jumping.');
  assert.deepEqual(PRESENT_DAILY_READING[19][3].acceptedResponses, ['under the table']);
  assert.equal(PRESENT_DAILY_READING[26][2].sentence, "Tears are on the child's cheeks.");
  assert.equal(PRESENT_DAILY_READING[26][3].sentence, 'The child is holding a book.');
  assert.ok(allCards.every(card => !/^The (dog|ball|kite|wheel) (runs|rolls|flies|turns)/.test(card.sentence)));
  assert.ok(allCards.filter(card => card.word === 'shy').every(card => !/\b(is|feels) shy\b/.test(card.sentence)));
});

test('every card supplies a visibly checkable factual detective contrast with an existing true reading', () => {
  const spokenDailySentences = new Set(allCards.map(card => card.sentence));
  for (const card of allCards) {
    const { correctSentence, wrongSentence, contrastKind } = card.detectiveSource;
    assert.notEqual(wrongSentence, correctSentence);
    assert.ok(spokenDailySentences.has(correctSentence), correctSentence);
    assert.ok(contrastKind);
    assert.notEqual(contrastKind, 'referent');
    assert.ok(!correctSentence.endsWith('?'));
    assert.doesNotMatch(correctSentence, commands);
    assert.doesNotMatch(wrongSentence, /\ban dog\b|This is dog\./);
  }
  assert.deepEqual(PRESENT_DAILY_READING[10][0].detectiveSource, {
    correctSentence: 'This cup is blue.', wrongSentence: 'This cup is green.', contrastKind: 'colour'
  });
  assert.equal(PRESENT_DAILY_READING[10][1].detectiveSource.wrongSentence, 'The goat has one horn.');
  assert.equal(PRESENT_DAILY_READING[19][3].detectiveSource.wrongSentence, 'The cat is on the table.');
  assert.throws(() => dailyPresentReading(0, 'monday'), RangeError);
  assert.throws(() => dailyPresentReading(1, 'saturday'), RangeError);
  assert.throws(() => presentGameSchedule(28, 'monday'), RangeError);
});

test('each week repeats the selected games, oral skills and hidden sight words', () => {
  for (let cycle = 1; cycle <= 27; cycle++) {
    const schedule = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => presentGameSchedule(cycle, day));
    assert.deepEqual(schedule.slice(0, 4), [['detective','syllables'], ['scramble','rhyme'], ['missing','syllables'], ['detective','pairs']]);
    assert.deepEqual(schedule[4], ['detective', 'scramble', 'missing', 'pairs', 'rhyme']);
  }
});
