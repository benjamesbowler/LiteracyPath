import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRhymeRun, currentRhymeLevel, chooseRhyme,
  finishRhymeFeedback, continueRhymeRound
} from '../../src/components/learn/games/games/rhymePopRules.js';
import { rhymePopLadder, rhymePopStars } from '../../src/utils/rhymePopLevels.js';

const delivered = { audioDelivery: 'completed' };
const difficulties = ['easy', 'medium', 'hard'];
const seeds = [0, 1, 5, 42, 65535, -7];

function accept(state, choice = state.choices.find(item => item.isRhyme), options = delivered) {
  assert.ok(choice, 'an unresolved rhyme must remain reachable');
  const response = chooseRhyme(state, choice.id, options);
  assert.equal(response?.correct, true);
  return response;
}

function finishRound(state, pick = choices => choices[0]) {
  for (let step = 0; step < 6; step++) {
    accept(state, pick(state.choices.filter(choice => choice.isRhyme)));
    finishRhymeFeedback(state);
  }
  assert.ok(['round-complete', 'complete'].includes(state.phase));
}

function finishRun(state) {
  for (let round = state.round; round < state.plan.length; round++) {
    finishRound(state);
    if (state.phase === 'round-complete') assert.equal(continueRhymeRound(state), true);
  }
  return state.receipt;
}

function assertFrozen(value) {
  if (!value || typeof value !== 'object') return;
  assert.equal(Object.isFrozen(value), true);
  Object.values(value).forEach(assertFrozen);
}

test('default and resumed runs start at a whole authored round with no fabricated evidence', () => {
  const state = createRhymeRun();
  assert.deepEqual(state.plan, rhymePopLadder('easy'));
  assert.equal(state.round, 0);
  assert.equal(state.phase, 'active');
  assert.deepEqual(state.resolvedWords, new Set());
  assert.deepEqual(state.firstResponses, []);
  assert.deepEqual(state.assistedRetries, []);
  assert.equal(state.score, 0);
  assert.equal(state.words, 0);
  assert.equal(state.paused, false);
  assert.equal(state.lastResponse, null);
  assert.equal(state.receipt, null);
  for (const [input, expected] of [[0, 0], [9, 9], [99, 9], [-1, 0], [4.9, 4], [NaN, 0], [Infinity, 0]]) {
    const resumed = createRhymeRun('hard', input);
    assert.equal(resumed.round, expected);
    assert.deepEqual(currentRhymeLevel(resumed), rhymePopLadder('hard')[expected]);
    assert.equal(resumed.words, 0);
    assert.equal(resumed.firstResponses.length, 0);
  }
  assert.deepEqual(createRhymeRun('unknown').plan, rhymePopLadder('easy'));
});

test('seeded layouts preserve authored demand, vary on replay and balance correct positions', () => {
  for (const difficulty of difficulties) {
    const ladder = rhymePopLadder(difficulty);
    for (const seed of seeds) {
      const state = createRhymeRun(difficulty, 0, seed);
      assert.deepEqual(state, createRhymeRun(difficulty, 0, seed));
      assert.notDeepEqual(state.choices.map(choice => choice.word), createRhymeRun(difficulty, 0, seed + 1).choices.map(choice => choice.word));
      const counts = Array(ladder[0].visibleBalloons).fill(0);
      for (const level of ladder) {
        const resumed = createRhymeRun(difficulty, level.level, seed);
        assert.deepEqual(state.choices, resumed.choices, 'resume preserves the same seeded round');
        assert.deepEqual(currentRhymeLevel(state), level);
        assert.equal(state.choices.length, level.visibleBalloons);
        assert.equal(state.choices.filter(choice => choice.isRhyme).length, level.correctVisible);
        assert.equal(new Set(state.choices.map(choice => choice.word)).size, state.choices.length);
        assert.deepEqual(state.choices.map(choice => choice.slot), Array.from({ length: level.visibleBalloons }, (_, index) => index));
        for (const choice of state.choices) {
          assert.equal(choice.isRhyme, level.rhymingWords.includes(choice.word));
          assert.ok([...level.rhymingWords, ...level.distractors].includes(choice.word));
          if (choice.isRhyme) counts[choice.slot]++;
        }
        finishRound(state);
        if (level.level < 9) assert.equal(continueRhymeRound(state), true);
      }
      assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, `${difficulty}/${seed}: ${counts}`);
    }
  }
});

for (const difficulty of difficulties) {
  for (const seed of seeds) {
    for (const order of ['first', 'last', 'middle']) {
      test(`${difficulty}/${seed}/${order}: every round reaches every rhyme once with stable untouched slots`, () => {
        const state = createRhymeRun(difficulty, 0, seed);
        const retiredIds = new Set();
        const responseSlots = new Set();
        for (const level of rhymePopLadder(difficulty)) {
          assert.deepEqual(state.resolvedWords, new Set(), 'resolution is local to this round');
          for (let count = 0; count < 6; count++) {
            const remaining = state.choices.filter(choice => level.rhymingWords.includes(choice.word));
            assert.ok(remaining.length > 0, 'distractors cannot starve rhymes');
            const index = order === 'last' ? remaining.length - 1 : order === 'middle' ? Math.floor(remaining.length / 2) : 0;
            const selected = remaining[index];
            const untouched = state.choices.filter(choice => choice.id !== selected.id);
            const response = accept(state, selected);
            assert.equal(response.target, level.targetWord);
            assert.equal(response.expectedResponse, selected.word);
            assert.equal(response.response, selected.word);
            assert.equal(response.responseId, selected.id);
            assert.equal(responseSlots.has(response.learningSlot), false);
            responseSlots.add(response.learningSlot);
            retiredIds.add(selected.id);
            assert.equal(state.phase, 'feedback');
            assert.equal(state.resolvedWords.size, count + 1);
            assert.equal(chooseRhyme(state, selected.id, delivered), null, 'a second hit cannot count');
            assert.equal(continueRhymeRound(state), false, 'feedback cannot skip the checkpoint');
            const phase = finishRhymeFeedback(state);
            assert.equal(phase, count < 5 ? 'active' : level.level === 9 ? 'complete' : 'round-complete');
            for (const choice of untouched) assert.equal(state.choices.find(item => item.id === choice.id), choice);
            for (const choice of state.choices) {
              assert.equal(state.resolvedWords.has(choice.word), false, 'a resolved word never returns');
              assert.equal(retiredIds.has(choice.id), false, 'replacement and round IDs are fresh');
            }
            assert.equal(new Set(state.choices.map(choice => choice.word)).size, state.choices.length);
            assert.equal(new Set(state.choices.map(choice => choice.slot)).size, state.choices.length);
            const replacement = state.choices.find(choice => choice.slot === selected.slot);
            if (count < 6 - level.correctVisible) assert.equal(replacement?.isRhyme, true);
            assert.equal(chooseRhyme(state, selected.id, delivered), null, 'a retired ID stays stale after feedback');
          }
          assert.deepEqual(state.resolvedWords, new Set(level.rhymingWords));
          if (level.level < 9) {
            const oldIds = state.choices.map(choice => choice.id);
            assert.equal(continueRhymeRound(state), true);
            for (const id of oldIds) assert.equal(chooseRhyme(state, id, delivered), null);
          }
        }
        assert.equal(state.words, 60);
        assert.equal(state.score, 600);
        assert.equal(state.firstResponses.length, 60);
        assert.equal(state.assistedRetries.length, 0);
        assert.equal(state.receipt.words, 60);
        assert.equal(state.receipt.stars, 3);
      });
    }
  }
}

test('every possible replenishment selection order reaches all six rhymes', () => {
  // Branch over the actual visible semantic choices, including the two easy
  // rounds that repeat a family later in the ladder.
  for (const difficulty of difficulties) for (const level of rhymePopLadder(difficulty)) {
    const orders = [[]];
    while (orders.length) {
      const path = orders.pop();
      const state = createRhymeRun(difficulty, level.level, 42);
      for (const word of path) {
        accept(state, state.choices.find(choice => choice.word === word));
        finishRhymeFeedback(state);
      }
      if (path.length === 6) {
        assert.deepEqual(new Set(path), new Set(level.rhymingWords));
        assert.equal(state.words, 6);
      } else {
        const choices = state.choices.filter(choice => choice.isRhyme);
        assert.ok(choices.length > 0);
        for (const choice of choices) orders.push([...path, choice.word]);
      }
    }
  }
});

test('repeated wrong choices retain the target and immutable first response with separate same-word retries', () => {
  const state = createRhymeRun('hard');
  const target = currentRhymeLevel(state).targetWord;
  const [wrong, otherWrong] = state.choices.filter(choice => !choice.isRhyme);
  const originalChoices = state.choices;
  const first = chooseRhyme(state, wrong.id, delivered);
  assert.equal(first.correct, false);
  assert.equal(first.target, target);
  assert.equal(first.expectedResponse, target);
  assert.equal(first.response, wrong.word);
  assert.equal(first.attempts, 1);
  assert.equal(state.score, 0);
  assert.equal(state.words, 0);
  for (let attempt = 2; attempt <= 4; attempt++) {
    assert.equal(finishRhymeFeedback(state), 'active');
    assert.equal(state.choices, originalChoices);
    const retry = chooseRhyme(state, wrong.id, delivered);
    assert.equal(retry.learningSlot, first.learningSlot);
    assert.equal(retry.attempts, attempt);
    assert.ok(retry.supportUsed.includes('retry_same_target'));
    assert.ok(retry.supportUsed.includes('specific_rhyme_feedback'));
  }
  finishRhymeFeedback(state);
  chooseRhyme(state, otherWrong.id, delivered);
  assert.equal(state.firstResponses.length, 2, 'a different word has its own first selection');
  finishRhymeFeedback(state);
  const correct = accept(state);
  assert.equal(correct.attempts, 1);
  assert.equal(currentRhymeLevel(state).targetWord, target);
  assert.equal(state.firstResponses[0], first);
  assert.equal(state.firstResponses.length, 3);
  assert.equal(state.assistedRetries.length, 3);
  assert.equal(state.words, 1);
  assert.equal(state.score, 10);
});

test('pause, absent IDs and lifecycle-only calls cannot answer or change counters', () => {
  const state = createRhymeRun();
  const choice = state.choices[0];
  for (const id of [undefined, null, '', 0, {}, 'stale']) assert.equal(chooseRhyme(state, id, delivered), null);
  assert.equal(chooseRhyme(state, choice.id), null);
  assert.equal(finishRhymeFeedback(state), 'active');
  assert.equal(continueRhymeRound(state), false);
  state.paused = true;
  const before = structuredClone(state);
  assert.equal(chooseRhyme(state, choice.id, delivered), null);
  assert.equal(finishRhymeFeedback(state), 'active');
  assert.equal(continueRhymeRound(state), false);
  assert.deepEqual(state, before);
  state.paused = false;
  accept(state);
  state.paused = true;
  assert.equal(finishRhymeFeedback(state), 'feedback');
  assert.equal(state.words, 1);
  state.paused = false;
  finishRhymeFeedback(state);
  for (let index = 0; index < 10; index++) finishRhymeFeedback(state);
  assert.equal(state.words, 1);
});

test('only completed audio or explicit printed support admits a deliberate selection', () => {
  for (const audioDelivery of [undefined, 'pending', 'playing', 'muted', 'failed', 'unavailable', 'interrupted', 'cancelled']) {
    const state = createRhymeRun();
    const choice = state.choices.find(item => item.isRhyme);
    const before = structuredClone(state);
    assert.equal(chooseRhyme(state, choice.id, { audioDelivery }), null);
    assert.equal(chooseRhyme(state, choice.id, { audioDelivery, supportUsed: ['printed_target', 'printed_choices'] }), null);
    assert.deepEqual(state, before, 'blocked media is not a response');
    const response = chooseRhyme(state, choice.id, { audioDelivery, supportUsed: ['printed_rhyme_support'] });
    assert.equal(response.correct, true);
    assert.equal(response.audioDelivery, audioDelivery ?? 'pending');
    assert.equal(response.independent, false);
    assert.ok(response.supportUsed.includes('printed_rhyme_support'));
  }
  const state = createRhymeRun();
  const response = accept(state);
  assert.equal(response.audioDelivery, 'completed');
  assert.equal(response.practiceOnly, true);
  assert.equal(response.independent, false);
  assert.equal(response.construct, 'printed_word_rhyme_selection');
});

test('response and final-action receipt keep deep frozen caller-independent cue and support snapshots', () => {
  const state = createRhymeRun('hard', 9, 42);
  const cueHistory = [{ status: 'completed', clips: [{ word: 'cake', delivery: ['started', 'ended'] }] }];
  const supportUsed = ['printed_rhyme_support', { model: { words: ['bake'] } }];
  const response = accept(state, undefined, { audioDelivery: 'failed', cueHistory, supportUsed });
  const savedResponse = structuredClone(response);
  assertFrozen(response);
  assert.notEqual(response.cueHistory, cueHistory);
  cueHistory[0].clips[0].delivery[1] = 'changed';
  cueHistory.push({ status: 'failed' });
  supportUsed[1].model.words.push('changed');
  supportUsed.push('later_support');
  assert.deepEqual(response, savedResponse);
  finishRhymeFeedback(state);
  for (let count = 1; count < 5; count++) {
    accept(state);
    assert.equal(state.receipt, null);
    finishRhymeFeedback(state);
  }
  const final = accept(state);
  const receipt = state.receipt;
  assert.equal(state.phase, 'feedback');
  assert.equal(receipt.words, 6);
  assert.equal(receipt.score, 60);
  assert.equal(receipt.stars, 3);
  assert.equal(receipt.evidence.firstResponses.at(-1), final);
  assert.equal(receipt.evidence.firstResponses[0], response);
  assert.equal(receipt.evidence.practiceOnly, true);
  assert.equal(receipt.evidence.independent, false);
  assert.ok(receipt.evidence.supportUsed.includes('printed_rhyme_support'));
  assert.equal(receipt.evidence.supportUsed.includes('later_support'), false);
  assertFrozen(receipt);
  const savedReceipt = structuredClone(receipt);
  assert.equal(chooseRhyme(state, final.responseId, delivered), null);
  assert.equal(continueRhymeRound(state), false);
  assert.equal(finishRhymeFeedback(state), 'complete');
  assert.equal(finishRhymeFeedback(state), 'complete');
  assert.equal(chooseRhyme(state, state.choices[0]?.id, delivered), null);
  assert.equal(continueRhymeRound(state), false);
  assert.equal(state.words, 6);
  assert.equal(state.score, 60);
  state.firstResponses.length = 0;
  state.assistedRetries.push({ correct: false });
  state.words = 999;
  assert.equal(state.receipt, receipt);
  assert.deepEqual(receipt, savedReceipt);
});

test('resumed receipt grades only played words and retains mistakes without inventing earlier completions', () => {
  const state = createRhymeRun('medium', 8, 5);
  const wrong = state.choices.find(choice => !choice.isRhyme);
  for (let count = 0; count < 4; count++) {
    chooseRhyme(state, wrong.id, delivered);
    finishRhymeFeedback(state);
  }
  const receipt = finishRun(state);
  assert.equal(receipt.words, 12);
  assert.equal(receipt.score, 120);
  assert.equal(receipt.evidence.firstResponses.length, 13);
  assert.equal(receipt.evidence.assistedRetries.length, 3);
  assert.equal(receipt.stars, rhymePopStars({ correct: 12, total: 12, mistakes: 1 }));
  assert.equal(receipt.stars, 3, 'unplayed rounds and supported retry repeats do not reduce first-choice stars');
});

test('distinct wrong first responses affect the shared star rubric', () => {
  const state = createRhymeRun('hard', 9);
  for (const wrong of state.choices.filter(choice => !choice.isRhyme).slice(0, 2)) {
    chooseRhyme(state, wrong.id, delivered);
    finishRhymeFeedback(state);
  }
  const receipt = finishRun(state);
  assert.equal(receipt.stars, 2);
  assert.equal(receipt.stars, rhymePopStars({ correct: 6, total: 6, mistakes: 2 }));
});

test('pause at round completion prevents continuing and resumed continuation preserves run evidence', () => {
  const state = createRhymeRun('easy', 8);
  finishRound(state);
  state.paused = true;
  assert.equal(continueRhymeRound(state), false);
  assert.equal(state.round, 8);
  state.paused = false;
  assert.equal(continueRhymeRound(state), true);
  assert.equal(state.round, 9);
  assert.deepEqual(state.resolvedWords, new Set());
  assert.equal(state.firstResponses.length, 6);
  assert.equal(state.words, 6);
  assert.equal(state.lastResponse, null);
});

test('cross-spelling chair/share/square rhymes are accepted and snow/now/cow/how look-alikes are rejected', () => {
  for (const difficulty of ['medium', 'hard']) {
    const round = rhymePopLadder(difficulty).findIndex(level => level.targetWord === 'chair');
    const state = createRhymeRun(difficulty, round);
    const words = [];
    for (let count = 0; count < 6; count++) {
      const response = accept(state);
      words.push(response.response);
      assert.equal(response.target, 'chair');
      finishRhymeFeedback(state);
    }
    assert.ok(words.includes('share'));
    assert.ok(words.includes('square'));
  }
  const round = rhymePopLadder('hard').findIndex(level => level.targetWord === 'snow');
  const seen = new Set();
  for (let seed = 0; seed < 30; seed++) {
    const state = createRhymeRun('hard', round, seed);
    for (const choice of state.choices.filter(item => ['now', 'cow', 'how'].includes(item.word))) {
      const response = chooseRhyme(state, choice.id, delivered);
      assert.equal(response.correct, false);
      assert.equal(response.target, 'snow');
      assert.equal(response.expectedResponse, 'snow');
      assert.equal(response.response, choice.word);
      seen.add(choice.word);
      finishRhymeFeedback(state);
    }
  }
  assert.deepEqual(seen, new Set(['now', 'cow', 'how']));
});

test('all authored hard distractors keep their non-rhyme meaning across seeded layouts', () => {
  for (const level of rhymePopLadder('hard')) {
    const seen = new Set();
    for (let seed = 0; seed < 128; seed++) {
      const state = createRhymeRun('hard', level.level, seed);
      for (const choice of state.choices.filter(item => !level.rhymingWords.includes(item.word))) {
        const response = chooseRhyme(state, choice.id, delivered);
        assert.equal(response.correct, false);
        assert.equal(response.target, level.targetWord);
        assert.equal(response.response, choice.word);
        assert.equal(state.resolvedWords.size, 0);
        seen.add(choice.word);
        finishRhymeFeedback(state);
      }
    }
    assert.deepEqual(seen, new Set(level.distractors));
  }
});
