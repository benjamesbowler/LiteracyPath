import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { CYCLE_WORD_BUILD_INVENTORY } from '../../src/data/cycleWordBuildInventory.js';
import { cycleSoundMatches } from '../../src/data/cycleSoundWords.js';
import { buildCyclePracticePools, buildCyclePracticePlan, cyclePracticeReadiness } from '../../src/components/cycle-practice/cyclePracticeContent.js';
import { resolveCyclePracticeAudio } from '../../src/components/cycle-practice/cyclePracticeAudio.js';
import { buildAdventureMissingLetterInventory, buildStationRounds } from '../../src/components/elQuest/elQuestEngine.js';
import { resolveAdventureRoundAudio } from '../../src/components/elQuest/adventureRoundAudio.js';
import { chooseSimpleAnswer } from '../../src/components/elQuest/mechanics/simpleMechanicState.js';
import { selectPracticePass, taughtCycleGraphemes, wordContrast, CYCLE_FINAL_SOUND_WORDS } from '../../src/utils/cyclePracticeVariation.js';

const cycles = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);
const inventory = new Map(CYCLE_WORD_BUILD_INVENTORY.map(item => [item.word, item]));
const exists = file => file && fs.existsSync(new URL(`../../public${file}`, import.meta.url));

test('all 27 cycles teach explicit pictured oral vocabulary without sounding out untaught print', () => {
  for (const cycle of cycles) {
    const pool = buildCyclePracticePools(cycle, 'vocabulary-depth');
    const words = pool.pictureSound.filter(round => round.variant === 'wordMeaning');
    assert.ok(words.length >= 10, cycle.id);
    for (const round of words) {
      assert.equal(round.targetGrapheme, undefined, 'a lexical cue must not be presented as a sound cue');
      assert.equal(round.construct, 'spoken_word_picture_matching');
      assert.equal(round.checkEligible, false);
      assert.equal(round.choices.filter(choice => choice.value === round.targetWord).length, 1);
      assert.equal(new Set(round.choices.map(choice => choice.value)).size, 3);
      assert.ok(round.choices.every(choice => exists(choice.image) && exists(choice.audio)));
      assert.deepEqual(resolveCyclePracticeAudio(round).targetAudio, [round.audio]);
      assert.equal(resolveCyclePracticeAudio(round).instructionText, 'Listen. Tap the picture.');
    }
    const map = buildStationRounds(cycle, 'hunt', { seed: 'vocabulary-depth' });
    assert.ok(map.some(round => round.variant === 'wordMeaning'));
    for (const round of map.filter(round => round.variant === 'wordMeaning')) {
      assert.equal(round.objects.filter(object => object.matches).length, 1);
      assert.equal(round.objects.find(object => object.matches).word, round.targetWord);
      assert.equal(resolveAdventureRoundAudio(round).instructionText, 'Listen. Tap the picture.');
      assert.deepEqual(resolveAdventureRoundAudio(round).targetAudio, [round.audio]);
    }
  }
});

test('CVC completion changes the position being analysed and never introduces an untaught vowel', () => {
  for (const cycle of cycles) {
    const taught = taughtCycleGraphemes(cycle.cycleNumber);
    const cycleItems = buildCyclePracticePools(cycle, 'position-depth').wordBuild.filter(round => round.variant === 'wordComplete');
    const mapItems = buildAdventureMissingLetterInventory(cycle);
    assert.equal(cycleItems.length, mapItems.length, `${cycle.id}: both surfaces offer the same reviewed position inventory`);
    for (const round of cycleItems) {
      const item = inventory.get(round.targetWord);
      assert.ok(item && item.authorizedFromCycle <= cycle.cycleNumber);
      assert.equal(round.image, item.image);
      assert.equal(round.initialLetters.filter(letter => !letter).length, 1);
      assert.equal(round.initialLetters[round.missingIndex], '');
      assert.deepEqual(round.answer, item.graphemes);
      assert.equal(round.choices.filter(choice => choice.value === item.graphemes[round.missingIndex]).length, 1);
      assert.ok(round.choices.length >= 2);
      assert.ok(round.choices.every(choice => taught.includes(choice.value)));
      assert.equal(round.checkEligible, false);
      assert.equal(resolveCyclePracticeAudio(round).instructionText, 'Listen. Tap the missing letter.');
    }
    for (const round of mapItems) {
      assert.equal(chooseSimpleAnswer(round, round.missingGrapheme).correct, true);
      assert.equal(chooseSimpleAnswer(round, round.choices.find(choice => choice !== round.missingGrapheme)).correct, false);
      assert.equal(chooseSimpleAnswer(round, round.missingGrapheme).evidence.providedLetters, true);
      assert.equal(chooseSimpleAnswer(round, round.missingGrapheme).evidence.evidenceScope, 'single_grapheme_completion');
      assert.equal(chooseSimpleAnswer(round, round.missingGrapheme).evidence.independent, undefined, 'an unprompted blank choice stays independent within its limited construct');
      assert.ok(round.choices.every(choice => taught.includes(choice)));
      if (round.missingIndex === 1) assert.equal(round.choices.every(choice => /^[aeiou]$/u.test(choice)), true);
    }
    if (cycle.cycleNumber === 2) assert.deepEqual(new Set(mapItems.map(round => round.missingIndex)), new Set([0, 2]));
    if (cycle.cycleNumber >= 3) assert.deepEqual(new Set(mapItems.map(round => round.missingIndex)), new Set([0, 1, 2]));
  }
});

test('word recognition foils exercise medial and final contrasts rather than only first-letter guessing', () => {
  assert.equal(wordContrast('pin', 'pan').kind, 'medial_vowel');
  assert.equal(wordContrast('cap', 'cat').kind, 'final_sound');
  assert.equal(wordContrast('hat', 'cat').kind, 'initial_sound');
  for (const cycle of cycles.filter(item => item.cycleNumber >= 3)) {
    const rounds = buildStationRounds(cycle, cycle.cycleNumber >= 25 ? 'spell' : 'quick', { seed: 'word-transfer' }).filter(round => round.decodableWord);
    assert.ok(rounds.length > 0 && rounds.length <= 6);
    for (const round of rounds) {
      assert.equal(round.construct, 'auditory_word_recognition');
      assert.equal(round.choices.filter(choice => choice === round.answer).length, 1);
      assert.ok(round.choices.every(choice => inventory.get(choice).authorizedFromCycle <= cycle.cycleNumber));
      assert.deepEqual(resolveAdventureRoundAudio(round).targetAudio, [round.audio]);
    }
  }
});

test('final-sound transfer has one answer and never treats an oral picture as untaught decoding', () => {
  for (const cycle of cycles) for (const round of buildStationRounds(cycle, 'hunt', { seed: 'final-transfer' }).filter(item => item.variant === 'finalSound')) {
    assert.equal(round.soundPosition, 'ending');
    assert.equal(round.objects.filter(object => cycleSoundMatches(object.word, round.targetGrapheme, 'ending')).length, 1);
    assert.equal(round.objects.find(object => object.matches).word, round.answer);
    assert.ok(taughtCycleGraphemes(cycle.cycleNumber).includes(round.targetGrapheme));
    assert.ok(round.objects.every(object => exists(object.image) && exists(object.audio)));
    assert.equal(resolveAdventureRoundAudio(round).instructionText, round.endingUnit === 'chunk' ? 'Listen. Tap the picture with this ending.' : 'Listen. Tap the picture that ends with this sound.');
    if (round.targetGrapheme === 'x') assert.equal(round.construct, 'ending_pattern_picture_identification');
  }
  for (const [sound, words] of Object.entries(CYCLE_FINAL_SOUND_WORDS)) for (const word of words) assert.ok(cycleSoundMatches(word, sound, 'ending'), `${word} ends with ${sound}`);
  for (const [word, sound] of Object.entries({ thumb: 'm', glove: 'v', cake: 'k', snake: 'k', kite: 't', gate: 't', ambulance: 's', nurse: 's', envelope: 'p', engine: 'n', vine: 'n', kettle: 'l', thimble: 'l', whistle: 'l', vegetable: 'l', waffle: 'l', motorcycle: 'l' })) {
    assert.equal(cycleSoundMatches(word, sound, 'ending'), true, `${word}: authored spoken ending`);
    assert.equal(cycleSoundMatches(word, word.at(-1), 'ending'), false, `${word}: silent final letter must not become sound evidence`);
  }
  for (const spelling of ['s', 'ss', 'z', 'zz']) assert.equal(cycleSoundMatches('vase', spelling, 'ending'), true, 'ordinary accent alternatives cannot become wrong distractors');
  for (const word of ['queen', 'quilt', 'quail']) for (const spelling of ['c', 'k']) assert.equal(cycleSoundMatches(word, spelling, 'first'), true, '/kw/ starts with /k/');
  for (const word of ['box', 'fox', 'six', 'wax', 'ax']) assert.equal(cycleSoundMatches(word, 's', 'ending'), true, '/ks/ ends with /s/');
});

test('replay windows exhaust each target-format inventory before repeating an example', () => {
  const rows = Array.from({ length: 9 }, (_, index) => ({ mechanicId: 'pictureSound', targetGrapheme: 'm', targetWord: `word${index}` }));
  const passes = [0, 1, 2].map(pass => selectPracticePass(rows, pass));
  assert.equal(new Set(passes.flat().map(round => round.targetWord)).size, 9);
  assert.deepEqual(selectPracticePass(rows, 3), passes[0]);
  const cycle = cycles[0];
  const snapshots = [0, 1].map(pass => buildCyclePracticePlan(cycle, 'fresh-sound-examples', pass).rounds.filter(round => round.mechanicId === 'pictureSound' && !round.variant && round.targetGrapheme === 'm').map(round => round.targetWord));
  assert.equal(new Set(snapshots.flat()).size, 6);
});

test('richer banks preserve the 30-minute gate, assigned check and compact initial coverage', () => {
  for (const cycle of cycles) {
    const plan = buildCyclePracticePlan(cycle, 'richer-core');
    const records = plan.rounds.slice(0, 36).map(round => ({ semanticKey: round.semanticKey, activityCompleted: true }));
    assert.equal(cyclePracticeReadiness(cycle, records, 1799).ready, false);
    assert.equal(cyclePracticeReadiness(cycle, records, 1800).ready, true, cycle.id);
    const check = buildCyclePracticePlan(cycle, 'richer-core', 0, true).rounds;
    assert.equal(check.some(round => ['wordMeaning', 'wordComplete'].includes(round.variant)), false);
    assert.ok(check.length <= 24, `${cycle.id}: finishing check remains short`);
  }
});
