import test from 'node:test';
import assert from 'node:assert/strict';
import { soundSafariSoundsEquivalent } from '../../src/data/soundSafariPronunciations.js';
import { soundSafariPresentedStars } from '../../src/utils/soundSafariRounds.js';

import {
  createSafariRun, currentSafariTask, chooseSafari,
  finishSafariFeedback, continueSafariWord, revealSafariModel
} from '../../src/components/learn/games/games/soundSafariRules.js';

const delivered = { audioDelivery: 'completed' };
const expectedWords = {
  easy: 'cat sun mop big hat log pen cup dog jam red wet run bug pig web hen fox zip van top net mud duck bed ten cap bus pot leg'.split(' '),
  medium: 'frog plant crisp drum stone flame brush green splash track clock snail train clap brain sleep float smile chair thread crash string spring bright twist storm shark three slide prize'.split(' '),
  hard: 'sunlight rainbow moon star meadow forest river rabbit silver night dark owl glow badger thunder glimmer squirrel acorn mist fern oak butterfly moss woodland dream mushroom glowing stream shining sunset'.split(' ')
};
const seeds = [0, 1, 5, 42, 65535, -7];

function assertFrozen(value) {
  if (!value || typeof value !== 'object') return;
  assert.equal(Object.isFrozen(value), true);
  Object.values(value).forEach(assertFrozen);
}

function targetChoice(run) {
  const unit = currentSafariTask(run).unit;
  const choices = run.choices.filter(choice => choice.grapheme === unit.grapheme);
  assert.equal(choices.length, 1, 'exactly one authored spelling is accepted');
  return choices[0];
}

function accept(run, options = delivered) {
  const response = chooseSafari(run, targetChoice(run).id, options);
  assert.equal(response?.correct, true);
  return response;
}

function completeWord(run) {
  const count = currentSafariTask(run).units.length - run.unitIndex;
  for (let index = 0; index < count; index++) {
    accept(run);
    finishSafariFeedback(run);
  }
  assert.ok(['word-complete', 'complete'].includes(run.phase));
}

function reachWord(run, word) {
  for (let index = run.wordIndex; index < run.plan.length; index++) {
    if (currentSafariTask(run).word === word) return;
    completeWord(run);
    assert.equal(continueSafariWord(run), true);
  }
  assert.fail(`Missing authored word ${word}`);
}

function completeRun(run) {
  for (let index = run.wordIndex; index < run.plan.length; index++) {
    completeWord(run);
    if (run.phase === 'word-complete') assert.equal(continueSafariWord(run), true);
  }
  return run.receipt;
}

function unchanged(run, action) {
  const before = { ...run };
  assert.equal(action(), null);
  assert.deepEqual({ ...run }, before);
}

test('a flat frozen route preserves all 30 authored words and resumes without invented progress', () => {
  for (const [difficulty, words] of Object.entries(expectedWords)) {
    const run = createSafariRun(difficulty);
    assert.deepEqual(run.plan.map(item => item.word), words);
    assertFrozen(run.plan);
    for (let index = 0; index < 30; index++) {
      assert.equal(run.plan[index].level, Math.floor(index / 3));
      assert.equal(run.plan[index].wordInLevel, index % 3);
      assert.equal(run.plan[index].wordIndex, index);
      assert.equal(run.plan[index].difficulty, difficulty);
    }
    assert.equal(run.phase, 'active');
    assert.equal(run.wordIndex, 0);
    assert.equal(run.unitIndex, 0);
    assert.equal(run.model, true);
    assert.equal(run.revealed, false);
    assert.equal(run.paused, false);
    assert.deepEqual(run.found, []);
    assert.deepEqual(run.firstResponses, []);
    assert.deepEqual(run.assistedRetries, []);
    assert.equal(run.lastResponse, null);
    assert.equal(run.receipt, null);
    assert.equal(run.score + run.words + run.unitsCompleted, 0);
  }
  for (const [start, index] of [[-3, 0], [0, 0], [3.9, 9], [9, 27], [99, 27], [NaN, 0], [Infinity, 0]]) {
    const run = createSafariRun('hard', start);
    assert.equal(run.wordIndex, index);
    assert.equal(run.words, 0);
    assert.equal(run.unitsCompleted, 0);
    assert.equal(run.model, true);
    assert.equal(run.firstResponses.length, 0);
  }
  for (const invalid of ['unknown', 'constructor', '__proto__', null]) {
    assert.deepEqual(createSafariRun(invalid).plan, createSafariRun().plan);
  }
});

for (const difficulty of Object.keys(expectedWords)) for (const seed of seeds) {
  test(`${difficulty}/${seed}: every authored word and unit resolves once with six distinct stable choices`, () => {
    const run = createSafariRun(difficulty, 0, seed);
    const same = createSafariRun(difficulty, 0, seed);
    assert.deepEqual(run.choices, same.choices);
    const retired = new Set();
    const slots = new Set();
    const positions = new Set();
    let completed = 0;
    for (let wordIndex = 0; wordIndex < 30; wordIndex++) {
      const task = currentSafariTask(run);
      assert.equal(task.word, expectedWords[difficulty][wordIndex]);
      assert.equal(task.level, Math.floor(wordIndex / 3));
      assert.equal(task.wordInLevel, wordIndex % 3);
      assert.equal(run.model, wordIndex % 3 === 0);
      assert.equal(run.revealed, false);
      assert.deepEqual(run.found, []);
      if (wordIndex % 3 === 0) {
        assert.deepEqual(run.choices, createSafariRun(difficulty, task.level, seed).choices);
      }
      for (let unitIndex = 0; unitIndex < task.units.length; unitIndex++) {
        const unit = task.units[unitIndex];
        assert.equal(run.unitIndex, unitIndex);
        assert.deepEqual(currentSafariTask(run).unit, unit);
        const choices = run.choices;
        assert.equal(choices.length, 6);
        assertFrozen(choices);
        assert.deepEqual(choices.map(choice => choice.slot), [0, 1, 2, 3, 4, 5]);
        assert.equal(new Set(choices.map(choice => choice.id)).size, 6);
        assert.equal(new Set(choices.map(choice => choice.grapheme)).size, 6);
        for (const [index, choice] of choices.entries()) {
          assert.equal(retired.has(choice.id), false);
          for (const other of choices.slice(0, index)) {
            assert.equal(soundSafariSoundsEquivalent(choice, other), false);
          }
        }
        const chosen = targetChoice(run);
        positions.add(chosen.slot);
        const response = accept(run);
        assert.equal(response.target, task.word);
        assert.equal(response.expectedResponse, unit.grapheme);
        assert.equal(response.response, unit.grapheme);
        assert.equal(response.responseId, chosen.id);
        assert.equal(response.occurrenceId, unit.occurrenceId);
        assert.equal(response.unitIndex, unitIndex);
        assert.equal(response.soundKey, unit.soundKey);
        assert.equal(response.expectedSoundKey, unit.soundKey);
        assert.equal(response.selectedSoundKey, chosen.soundKey);
        assert.deepEqual(response.letterIndices, unit.letterIndices);
        assert.equal(response.attempts, 1);
        assert.equal(response.independent, wordIndex % 3 !== 0);
        assert.equal(response.construct, run.model ? 'modeled_grapheme_construction' : 'spoken_word_grapheme_encoding');
        assert.equal(response.practiceOnly, true);
        assert.equal(slots.has(response.learningSlot), false);
        slots.add(response.learningSlot);
        completed++;
        assert.equal(run.unitsCompleted, completed);
        assert.equal(run.score, completed * 10);
        assert.equal(run.words, wordIndex + (unitIndex === task.units.length - 1 ? 1 : 0));
        assert.deepEqual(run.found.map(found => found.occurrenceId), task.units.slice(0, unitIndex + 1).map(item => item.occurrenceId));
        assert.equal(run.choices, choices, 'choices rebuild only after feedback');
        assert.equal(run.unitIndex, unitIndex);
        assert.equal(run.phase, 'feedback');
        unchanged(run, () => chooseSafari(run, chosen.id, delivered));
        unchanged(run, () => continueSafariWord(run));
        choices.forEach(choice => retired.add(choice.id));
        assert.equal(finishSafariFeedback(run), unitIndex < task.units.length - 1 ? 'active'
          : wordIndex === 29 ? 'complete' : 'word-complete');
        unchanged(run, () => finishSafariFeedback(run));
        for (const id of choices.map(choice => choice.id)) unchanged(run, () => chooseSafari(run, id, delivered));
      }
      if (wordIndex < 29) {
        const responses = run.firstResponses;
        assert.equal(continueSafariWord(run), true);
        assert.equal(run.firstResponses, responses, 'navigation creates no evidence');
        assert.equal(run.lastResponse, null);
        unchanged(run, () => continueSafariWord(run));
      }
    }
    assert.ok(positions.size > 1, 'a fixed answer position cannot solve the route');
    assert.equal(run.words, 30);
    assert.equal(run.firstResponses.length, completed);
    assert.equal(run.assistedRetries.length, 0);
    assert.equal(run.receipt.words, 30);
    assert.equal(run.receipt.score, completed * 10);
    assert.equal(run.receipt.stars, 3);
    assert.equal(run.receipt.evidence.independent, false);
    assert.equal(run.receipt.evidence.practiceOnly, true);
    assertFrozen(run.receipt);
  });
}

test('changing the seed changes arrangements while preserving authored targets', () => {
  const arrangements = seeds.map(seed => createSafariRun('easy', 0, seed).choices.map(choice => choice.grapheme));
  assert.ok(new Set(arrangements.map(value => JSON.stringify(value))).size > 1);
});

test('a wrong label cannot change the route or first response; every later attempt is a same-slot retry', () => {
  const run = createSafariRun();
  completeWord(run);
  continueSafariWord(run);
  const choices = run.choices;
  const target = targetChoice(run);
  const wrong = choices.filter(choice => choice.id !== target.id);
  const before = { units: run.unitsCompleted, words: run.words, score: run.score, first: run.firstResponses.length };
  const first = chooseSafari(run, wrong[0].id, delivered);
  assert.equal(first.correct, false);
  assert.equal(first.independent, true);
  assert.equal(first.expectedResponse, 's');
  assert.equal(first.target, 'sun');
  for (let index = 1; index <= 3; index++) {
    unchanged(run, () => continueSafariWord(run));
    assert.equal(finishSafariFeedback(run), 'active');
    assert.equal(run.choices, choices);
    const response = chooseSafari(run, wrong[index].id, delivered);
    assert.equal(response.correct, false);
    assert.equal(response.learningSlot, first.learningSlot);
    assert.equal(response.attempts, index + 1);
    assert.equal(response.independent, false);
    assert.ok(response.supportUsed.includes('retry_same_target'));
    assert.ok(response.supportUsed.includes('specific_grapheme_feedback'));
    assert.equal(run.wordIndex, 1);
    assert.equal(run.unitIndex, 0);
    assert.equal(run.unitsCompleted, before.units);
    assert.equal(run.words, before.words);
    assert.equal(run.score, before.score);
  }
  finishSafariFeedback(run);
  const retry = accept(run);
  assert.equal(retry.attempts, 5);
  assert.equal(retry.learningSlot, first.learningSlot);
  assert.equal(retry.independent, false);
  assert.equal(run.firstResponses.length, before.first + 1);
  assert.equal(run.firstResponses.at(-1), first);
  assert.equal(first.correct, false);
  assert.equal(run.assistedRetries.length, 4);
  finishSafariFeedback(run);
  assert.equal(run.unitIndex, 1);
  assert.notEqual(accept(run).learningSlot, first.learningSlot);
});

test('model and reveal support persist through a whole word then reset for both fresh words', () => {
  const run = createSafariRun();
  const model = accept(run);
  assert.ok(model.supportUsed.includes('modeled_word'));
  assert.ok(model.supportUsed.includes('spelling_sequence'));
  assert.equal(model.independent, false);
  finishSafariFeedback(run);
  completeWord(run);
  continueSafariWord(run);
  const first = accept(run);
  assert.equal(first.independent, true);
  assert.deepEqual(first.supportUsed, ['printed_choices']);
  finishSafariFeedback(run);
  assert.ok(revealSafariModel(run, 'requested_model'));
  assert.equal(run.revealed, true);
  const choices = run.choices;
  unchanged(run, () => revealSafariModel(run));
  for (let index = run.unitIndex; index < 3; index++) {
    const response = accept(run);
    assert.ok(response.supportUsed.includes('printed_word'));
    assert.ok(response.supportUsed.includes('revealed_spelling_sequence'));
    assert.ok(response.supportUsed.includes('requested_model'));
    assert.equal(response.independent, false);
    assert.equal(response.construct, 'modeled_grapheme_construction');
    if (index === 1) assert.equal(run.choices, choices);
    finishSafariFeedback(run);
  }
  continueSafariWord(run);
  assert.equal(currentSafariTask(run).word, 'mop');
  assert.equal(run.revealed, false);
  assert.equal(run.model, false);
  assert.deepEqual(run.wordSupport, []);
  assert.equal(accept(run).independent, true);
  finishSafariFeedback(run);
  completeWord(run);
  continueSafariWord(run);
  assert.equal(run.model, true, 'the next stop begins with its own model');
});

test('every incomplete audio status blocks selections even for modeled or revealed print', () => {
  const blocked = ['pending', 'failed', 'muted', 'unavailable', 'interrupted', 'cancelled', 'stalled', 'blocked', 'available', 'playing', 'complete', '', null, false];
  for (const mode of ['model', 'fresh', 'revealed']) for (const audioDelivery of blocked) {
    const run = createSafariRun();
    if (mode !== 'model') { completeWord(run); continueSafariWord(run); }
    if (mode === 'revealed') revealSafariModel(run);
    unchanged(run, () => chooseSafari(run, targetChoice(run).id, { audioDelivery }));
    unchanged(run, () => chooseSafari(run, targetChoice(run).id, {
      audioDelivery, cueHistory: [{ status: 'completed' }], supportUsed: ['printed_word', 'printed_choices']
    }));
    unchanged(run, () => chooseSafari(run, targetChoice(run).id));
  }
});

test('print recovery must be explicit and remains disclosed for every later unit of that word', () => {
  const run = createSafariRun();
  completeWord(run);
  continueSafariWord(run);
  const response = accept(run, { audioDelivery: 'failed', supportUsed: ['printed_model_recovery'] });
  assert.equal(response.audioDelivery, 'failed');
  assert.equal(response.independent, false);
  assert.equal(response.construct, 'modeled_grapheme_construction');
  assert.ok(response.supportUsed.includes('printed_model_recovery'));
  assert.ok(response.supportUsed.includes('printed_word'));
  assert.equal(run.revealed, true);
  finishSafariFeedback(run);
  unchanged(run, () => chooseSafari(run, targetChoice(run).id, { audioDelivery: 'muted' }));
  const later = accept(run);
  assert.ok(later.supportUsed.includes('printed_model_recovery'));
  assert.equal(later.independent, false);
});

test('caller-disclosed answer help persists and unknown help is conservatively non-independent', () => {
  for (const support of ['printed_word', 'modeled_word', 'spelling_sequence', 'revealed_spelling_sequence', 'adult_hint']) {
    const run = createSafariRun();
    completeWord(run); continueSafariWord(run);
    const first = accept(run, { ...delivered, supportUsed: [support] });
    assert.equal(first.independent, false, support);
    finishSafariFeedback(run);
    const next = accept(run);
    assert.equal(next.independent, false, `${support} cannot be erased by the next call`);
    assert.ok(next.supportUsed.includes(support));
    if (support !== 'adult_hint') assert.equal(next.construct, 'modeled_grapheme_construction');
  }
});

test('deep cue and support snapshots cannot be edited retroactively', () => {
  const run = createSafariRun();
  const cueHistory = [{ kind: 'word', status: 'completed', media: { paths: ['/word.mp3'] } }];
  const supportUsed = ['adult_hint', { kind: 'pointing', details: { letters: ['c'] } }];
  const first = accept(run, { ...delivered, cueHistory, supportUsed });
  const snapshot = JSON.stringify(first);
  cueHistory[0].status = 'failed';
  cueHistory[0].media.paths.push('/different.mp3');
  supportUsed[1].details.letters[0] = 'z';
  supportUsed.push('new_help');
  assert.equal(JSON.stringify(first), snapshot);
  assertFrozen(first);
  assertFrozen(run.wordSupport);
  assertFrozen(run.firstResponses);
});

test('paused, unsupported, forged and malformed calls have no effect in every phase', () => {
  const run = createSafariRun();
  for (const invalid of [null, {}, { ...run }]) {
    assert.equal(currentSafariTask(invalid), null);
    assert.equal(chooseSafari(invalid, 'fake', delivered), null);
    assert.equal(finishSafariFeedback(invalid), null);
    assert.equal(continueSafariWord(invalid), null);
    assert.equal(revealSafariModel(invalid), null);
  }
  for (const options of [null, { cueHistory: {} }, { supportUsed: 'printed_model_recovery' }]) {
    unchanged(run, () => chooseSafari(run, targetChoice(run).id, options));
  }
  unchanged(run, () => chooseSafari(run, 'unknown', delivered));
  const pausable = () => {
    run.paused = true;
    unchanged(run, () => chooseSafari(run, run.choices[0]?.id, delivered));
    unchanged(run, () => finishSafariFeedback(run));
    unchanged(run, () => continueSafariWord(run));
    unchanged(run, () => revealSafariModel(run));
    run.paused = false;
  };
  pausable();
  accept(run);
  pausable();
  unchanged(run, () => revealSafariModel(run));
  finishSafariFeedback(run);
  completeWord(run);
  pausable();
  assert.equal(continueSafariWord(run), true);
});

test('external writes cannot forge score, attempts, resolved units, phase or receipts', () => {
  const run = createSafariRun();
  const before = JSON.stringify(run);
  for (const [key, value] of Object.entries({ wordIndex: 29, unitIndex: 2, phase: 'complete', score: 9999,
    words: 30, unitsCompleted: 900, choices: [], found: [], model: false, revealed: true,
    firstResponses: [], assistedRetries: [], lastResponse: { correct: true }, receipt: {} })) {
    assert.equal(Reflect.set(run, key, value), false, key);
  }
  assert.equal(JSON.stringify(run), before);
  assert.throws(() => run.firstResponses.push({ correct: true }));
  assert.throws(() => { targetChoice(run).grapheme = 'fake'; });
  assert.throws(() => Object.defineProperty(run, 'score', { value: 9999 }));
  accept(run);
  assert.equal(run.score, 10);
  assert.equal(run.unitsCompleted, 1);
});

test('digraphs, split spelling indices and repeated printed labels keep separate occurrence identities', () => {
  for (const [difficulty, word, expected] of [
    ['medium', 'stone', [['s', 's', [0]], ['t', 't', [1]], ['o_e', 'o_e', [2, 4]], ['n', 'n', [3]]]],
    ['medium', 'thread', [['th', 'th', [0, 1]], ['r', 'r', [2]], ['ea', 'ea_e', [3, 4]], ['d', 'd', [5]]]],
    ['hard', 'shining', [['sh', 'sh', [0, 1]], ['i', 'i_e', [2]], ['n', 'n', [3]], ['i', 'short_i', [4]], ['ng', 'ng', [5, 6]]]],
    ['hard', 'sunset', [['s', 's', [0]], ['u', 'short_u', [1]], ['n', 'n', [2]], ['s', 's', [3]], ['e', 'short_e', [4]], ['t', 't', [5]]]]
  ]) {
    const run = createSafariRun(difficulty, Math.floor(expectedWords[difficulty].indexOf(word) / 3));
    reachWord(run, word);
    const old = [];
    for (const [grapheme, soundKey, letterIndices] of expected) {
      for (const id of old) unchanged(run, () => chooseSafari(run, id, delivered));
      const response = accept(run);
      assert.equal(response.response, grapheme);
      assert.equal(response.soundKey, soundKey);
      assert.deepEqual(response.letterIndices, letterIndices);
      assert.equal(response.attempts, 1);
      old.push(response.responseId);
      finishSafariFeedback(run);
    }
    assert.equal(new Set(run.found.map(unit => unit.occurrenceId)).size, expected.length);
    assert.deepEqual(run.found.flatMap(unit => unit.letterIndices).sort((a, b) => a - b), Array.from(word, (_, index) => index));
  }
});

test('the final action freezes one receipt before feedback; resume counts three actual words', () => {
  const run = createSafariRun('easy', 9);
  completeWord(run); continueSafariWord(run);
  completeWord(run); continueSafariWord(run);
  accept(run); finishSafariFeedback(run);
  accept(run); finishSafariFeedback(run);
  assert.equal(run.words, 2);
  assert.equal(run.receipt, null);
  assert.equal(run.unitsCompleted, 8);
  const last = accept(run);
  const receipt = run.receipt;
  assert.equal(run.phase, 'feedback');
  assert.equal(run.words, 3);
  assert.equal(run.unitsCompleted, 9);
  assert.equal(receipt.words, 3);
  assert.equal(receipt.score, 90);
  assert.equal(receipt.stars, 3);
  assert.equal(receipt.evidence.firstResponses.length, 9);
  assert.equal(receipt.evidence.firstResponses.at(-1), last);
  assert.equal(receipt.evidence.assistedRetries.length, 0);
  assert.equal(receipt.evidence.independent, false);
  assert.equal(receipt.evidence.practiceOnly, true);
  assertFrozen(receipt);
  for (let index = 0; index < 3; index++) unchanged(run, () => chooseSafari(run, last.responseId, delivered));
  run.paused = true;
  unchanged(run, () => finishSafariFeedback(run));
  run.paused = false;
  assert.equal(finishSafariFeedback(run), 'complete');
  unchanged(run, () => finishSafariFeedback(run));
  unchanged(run, () => continueSafariWord(run));
  unchanged(run, () => revealSafariModel(run));
  assert.equal(run.receipt, receipt, 'host can use identity to save only once');
  assert.equal(createSafariRun('easy', 9).receipt, null);
});

test('stars use actual presented unit counts and count every wrong retry', () => {
  for (const [misses, expectedStars] of [[0, 3], [1, 3], [2, 2], [6, 2]]) {
    const run = createSafariRun('easy', 9);
    const wrong = run.choices.find(choice => choice.id !== targetChoice(run).id);
    for (let index = 0; index < misses; index++) {
      assert.equal(chooseSafari(run, wrong.id, delivered).correct, false);
      finishSafariFeedback(run);
    }
    const receipt = completeRun(run);
    assert.equal(receipt.stars, expectedStars);
    assert.equal(receipt.stars, soundSafariPresentedStars({ correct: 9, presentedUnits: 9, mistakes: misses }));
    assert.equal(receipt.score, 90);
    assert.equal(receipt.evidence.firstResponses.length, 9);
    assert.equal(receipt.evidence.assistedRetries.length, misses);
  }
});

test('checkpoint indices appear only at a fully resolved three-word habitat stop', () => {
  const run = createSafariRun('easy', 7);
  assert.equal(run.nextCheckpoint, null);
  for (let local = 0; local < 3; local++) {
    const task = currentSafariTask(run);
    assert.equal(task.model, local === 0);
    assert.equal(task.revealed, false);
    assert.equal(task.unitIndex, 0);
    assert.deepEqual(task.unit, task.units[0]);
    assert.deepEqual(task.unitAudio, task.unit.audio);
    assert.ok(task.wordAudio);
    for (let unit = 0; unit < task.units.length; unit++) {
      accept(run);
      assert.equal(run.nextCheckpoint, local === 2 && unit === task.units.length - 1 ? 8 : null);
      finishSafariFeedback(run);
    }
    assert.equal(continueSafariWord(run), true);
    assert.equal(run.nextCheckpoint, null, 'checkpoint is a boundary signal, not a repeating save request');
  }
  assert.equal(run.wordIndex, 24);
  completeRun(run);
  assert.equal(run.nextCheckpoint, null, 'final completion uses its receipt, not a nonexistent level ten');
});
