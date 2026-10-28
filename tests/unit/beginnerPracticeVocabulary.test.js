import test from 'node:test';
import assert from 'node:assert/strict';
import { isCyclePictureWordEligible, cycleSoundMatches } from '../../src/data/cycleSoundWords.js';
import { initialSoundWordBank } from '../../src/content/initialSounds/initialSoundWordBank.js';
import { getAllLetters, getLessonByLetter } from '../../src/data/phonicsLessons.js';
import { buildRocketRunRound, rocketRunTargets, rocketRunLadder, isBeginnerSoundGameWord } from '../../src/utils/rocketRunRounds.js';
import { rocketRunV2Outing } from '../../src/utils/rocketRunV2Rounds.js';
import { buildSoundRacerRace } from '../../src/utils/soundRacerRace.js';
import { createWordClimbSession, wordClimbChoicesForStep } from '../../src/utils/wordClimbLevels.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';

const obscure = ['vulture', 'narwhal', 'quiver', 'thimble', 'quail', 'inchworm', 'umpire', 'yacht', 'zucchini'];

test('beginner picture selectors reject niche labels while retaining their historical sound mappings', () => {
  for (const word of obscure) assert.equal(isCyclePictureWordEligible(word), false, word);
  assert.equal(cycleSoundMatches('vulture', 'v'), true, 'retained evidence does not change pronunciation');
  for (const word of ['cat', 'dog', 'van', 'apple', 'elephant']) assert.equal(isCyclePictureWordEligible(word), true, word);
  for (const item of initialSoundWordBank.filter(item => item.level === 1 && obscure.includes(item.targetWord))) {
    assert.equal(item.active, false, item.id);
    assert.equal(item.qaStatus, 'excluded_unsuitable_word');
  }
  for (const letter of getAllLetters()) for (const word of [...getLessonByLetter(letter).words, ...getLessonByLetter(letter).distractors]) {
    assert.equal(obscure.includes(word.word), false, `${letter}: ${word.word}`);
  }
});

test('short spellings cannot qualify unfamiliar words or foils for easy games', () => {
  for (const word of ['ebb', 'elm', 'cod', 'vat', 'veto', 'void', 'zinc', 'zest', 'zen']) assert.equal(isBeginnerSoundGameWord(word), false, word);
  for (const target of rocketRunTargets()) for (const difficulty of ['easy', 'low', undefined]) {
    const round = buildRocketRunRound(target, { difficulty, count: 20, random: () => .37 });
    assert.ok(round.correct.length > 0 && round.distractors.length >= 2, `${target}: a playable simple pool`);
    assert.ok(round.sequence.every(row => isBeginnerSoundGameWord(row.word)), `${target}: no unrestricted fallback`);
    assert.equal(new Set(round.sequence.map(row => row.word)).size, round.sequence.length);
  }
});

test('complete easy Rocket, Racer and Climb outings keep familiar targets and every foil after repair', () => {
  for (const seed of [0, 7, 42, 4294967295]) {
    for (const plan of rocketRunV2Outing('easy', seed)) {
      assert.equal(plan.needed, 5);
      for (const row of plan.choices) {
        assert.ok(isBeginnerSoundGameWord(row.word), row.word);
        assert.ok(getLedaWordAudioPath(row.word), `${row.word}: recorded cue`);
      }
    }
    for (const target of rocketRunLadder('easy')) {
      const race = buildSoundRacerRace(target, { difficulty: 'easy', seed });
      assert.equal(race.laps, 3);
      assert.ok(race.needed >= 9);
      for (const gate of race.gates.filter(gate => gate.kind === 'word')) assert.ok(isBeginnerSoundGameWord(gate.word), gate.word);
    }
    const session = createWordClimbSession('easy', () => (seed % 97) / 97);
    for (let step = 0; step < session.summit; step++) {
      const choices = wordClimbChoicesForStep(session.round, step, () => .37);
      assert.equal(choices.length, 3);
      assert.equal(choices.filter(choice => choice.correct).length, 1);
      assert.ok(choices.every(choice => isBeginnerSoundGameWord(choice.word)));
    }
  }
});
