import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import * as flight from '../../src/components/learn/games/games/rocketRunFlight.js';
import { getLedaWordAudioPath, getLedaInstructionAudioPath } from '../../src/data/ledaProductionAudio.js';
import { getPreferredPhonemeAudioPath } from '../../src/data/phonemeAudioBank.js';
import { ROCKET_RUN_VERTICAL_SLICE_BRIEF } from '../../src/components/learn/games/games/rocketRunContract.js';
import { validateGameVerticalSliceBrief } from '../../src/components/learn/games/shared/premiumGameStandard.js';
import {
  FLIGHT_STEP, buildFlightPlan, flightRandom, flightChoices, flightLayout,
  createFlightRun, currentFlightGate, currentFlightChoices, steerFlight,
  nominateFlight, flightCanCommit, commitFlight, advanceFlight, continueFlight, flightBonus
} from '../../src/components/learn/games/games/rocketRunFlight.js';
import { rocketRunLadder, buildRocketRunRound, wordStartsWithTargetSound } from '../../src/utils/rocketRunRounds.js';
import { onsetGrapheme, sharesSound } from '../../src/components/elQuest/elQuestEngine.js';

function decision(state) {
  while (state.phase === 'approach') advanceFlight(state);
}

function answer(state, correct = true) {
  decision(state);
  const expected = currentFlightGate(state).word;
  const choice = currentFlightChoices(state).find(item => (item.word === expected) === correct);
  assert.equal(nominateFlight(state, choice.lane), true);
  return commitFlight(state);
}

function settle(state) {
  for (let frame = 0; frame < 100 && ['commit', 'return'].includes(state.phase); frame++) advanceFlight(state);
}

function finish(state, withBonuses = false) {
  while (!state.receipt) {
    if (state.phase === 'checkpoint') assert.equal(continueFlight(state), true);
    if (withBonuses) flightBonus(state);
    state.audio = 'completed';
    assert.equal(answer(state)?.correct, true);
    if (!state.receipt) settle(state);
  }
  return state.receipt;
}

test('exported vertical-slice brief validates directly and names real evidence files without claiming hardware approval', () => {
  const brief = ROCKET_RUN_VERTICAL_SLICE_BRIEF;
  assert.deepEqual(validateGameVerticalSliceBrief(brief), []);
  assert.equal(brief.gameId, 'rocket-run');
  assert.equal(brief.validation.physicalDevice.status, 'unknown');
  for (const path of [...brief.validation.unit, ...brief.validation.browser]) assert.ok(existsSync(path), path);
  assert.throws(() => { brief.learning.movementCreatesEvidence = true; }, TypeError);
});

test('seeded plans retain all ten curriculum targets and exactly one defensible word per choice group', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    for (const seed of [0, 1, 5, 42, 65535]) {
      const plan = buildFlightPlan(difficulty, seed);
      assert.deepEqual(plan, buildFlightPlan(difficulty, seed));
      assert.notDeepEqual(plan, buildFlightPlan(difficulty, seed + 1));
      assert.equal(plan.length, 10);
      assert.deepEqual(plan.map(round => round.target), rocketRunLadder(difficulty));
      for (const round of plan) {
        assert.ok(round.gates.length >= 3);
        assert.equal(new Set(round.gates.map(gate => gate.word)).size, round.gates.length);
        for (const gate of round.gates) {
          for (let attempt = 0; attempt < 8; attempt++) {
            const choices = flightChoices(gate, attempt);
            assert.equal(choices.length, 3);
            assert.equal(new Set(choices.map(choice => choice.word)).size, 3);
            assert.equal(choices.filter(choice => wordStartsWithTargetSound(choice.word, round.target)).length, 1);
            for (const { word } of choices.filter(choice => choice.word !== gate.word)) {
              assert.equal(sharesSound(onsetGrapheme(word), round.target), false, `${round.target}: ${word}`);
            }
          }
        }
      }
      assert.throws(() => { plan[0].gates[0].distractors[0] = 'changed'; }, TypeError);
    }
  }
});

test('difficulty aliases retain the same seeded curriculum and number of gates', () => {
  for (const [name, alias] of [['easy', 'low'], ['medium', 'mid'], ['hard', 'high'], ['hard', 'HARD']]) {
    assert.deepEqual(buildFlightPlan(name, 42), buildFlightPlan(alias, 42));
  }
});

test('seeded round builder does not read ambient randomness', () => {
  const expected = buildRocketRunRound('sh', { count: 12, difficulty: 'hard', random: flightRandom(4) });
  assert.deepEqual(expected, buildRocketRunRound('sh', { count: 12, difficulty: 'hard', random: flightRandom(4) }));
});

test('every default/retry word has an existing recording without reducing hard targets to a repeated tiny pool', () => {
  assert.equal(typeof flight.rocketRunWordAudioPath, 'function');
  for (const difficulty of ['easy', 'medium', 'hard']) {
    for (const seed of [1, 41, 701]) {
      for (const round of buildFlightPlan(difficulty, seed)) {
        assert.ok(existsSync(`public${getPreferredPhonemeAudioPath(round.target)}`));
        assert.ok(round.gates.length >= (difficulty === 'easy' ? 5 : 6), `${difficulty}/${round.target} lacks varied recorded coverage`);
        for (const gate of round.gates) for (let attempt = 0; attempt < 8; attempt++) {
          for (const { word } of flightChoices(gate, attempt)) {
            const source = flight.rocketRunWordAudioPath(word);
            assert.ok(source, `missing ${difficulty}/${round.target}/${word}`);
            assert.ok(existsSync(`public${source}`), source);
          }
        }
      }
    }
  }
  const instructionOnlyWord = 'arcade';
  assert.equal(getLedaWordAudioPath(instructionOnlyWord), '');
  assert.equal(flight.rocketRunWordAudioPath(instructionOnlyWord), getLedaInstructionAudioPath(instructionOnlyWord));
  assert.equal(flight.rocketRunWordAudioPath('no-such-recorded-word'), '');
});

test('the unvoiced th cue excludes voiced words from both accepted words and alternatives', () => {
  assert.match(getPreferredPhonemeAudioPath('th'), /th-unvoiced/);
  for (let seed = 0; seed < 25; seed++) {
    const round = buildFlightPlan('hard', seed).find(item => item.target === 'th');
    const voiced = new Set(['the', 'than', 'that', 'them', 'then', 'they', 'this', 'those']);
    for (const gate of round.gates) for (const { word } of flightChoices(gate)) assert.equal(voiced.has(word), false);
  }
});

test('first-choice lanes are balanced without repeating an identical lane pattern on replay', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    for (let seed = 0; seed < 20; seed++) {
      const counts = [0, 0, 0];
      buildFlightPlan(difficulty, seed).flatMap(round => round.gates).forEach(gate => counts[gate.lane]++);
      assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, `${difficulty}/${seed}: ${counts}`);
    }
  }
});

test('retry rebuilds all choice identities and brings new distractors while preserving the intended word', () => {
  const gate = buildFlightPlan('hard', 3)[0].gates[0];
  for (let attempt = 1; attempt < 8; attempt++) {
    const previous = flightChoices(gate, attempt - 1);
    const next = flightChoices(gate, attempt);
    assert.ok(next.every(choice => previous.every(old => old.id !== choice.id)));
    assert.ok(next.filter(choice => choice.word !== gate.word).every(choice => previous.every(old => old.word !== choice.word)));
    assert.equal(next.filter(choice => choice.word === gate.word).length, 1);
  }
});

test('compact layout reserves the prompt, feedback and controls with equally sized reachable labels', () => {
  for (const [width, height] of [[320, 568], [568, 320], [1024, 768], [568, 247]]) {
    const layout = flightLayout(width, height);
    assert.ok(layout.labelWidth >= 88, 'six-letter words need room for legible type and padding');
    assert.ok(layout.labelHeight >= 56);
    assert.ok(layout.labelY - layout.labelHeight / 2 >= 64);
    assert.ok(layout.labelY + layout.labelHeight / 2 <= height - 126);
    layout.centres.forEach((centre, lane) => {
      assert.ok(centre - layout.labelWidth / 2 >= 8);
      assert.ok(centre + layout.labelWidth / 2 <= width - 8);
      if (lane) assert.ok(centre - layout.centres[lane - 1] - layout.labelWidth >= 8 - 1e-9);
    });
  }
});

test('resume inputs always select an existing whole round, including first and last', () => {
  for (const [input, expected] of [[0, 0], [9, 9], [99, 9], [-1, 0], [4.5, 4], [NaN, 0], [Infinity, 0]]) {
    const state = createFlightRun('easy', input);
    assert.equal(state.round, expected);
    assert.ok(currentFlightGate(state));
    assert.equal(state.firstResponses.length, 0);
    assert.equal(state.deliveries.length, 0);
  }
});

test('invalid steering and timing cannot nominate a lane, poison time or answer a gate', () => {
  for (const input of [0, NaN, Infinity, -Infinity, undefined, 'left']) {
    const state = createFlightRun();
    assert.equal(steerFlight(state, input), false);
    assert.equal(state.lane, 1);
    assert.equal(state.nominated, false);
  }
  for (const delta of [0, -1, NaN, Infinity, -Infinity]) {
    const state = createFlightRun();
    assert.equal(advanceFlight(state, delta), null);
    assert.equal(state.time, 0);
  }
});

test('all audio failures hold an answer until complete delivery or explicit printed support', () => {
  const state = createFlightRun();
  decision(state);
  nominateFlight(state, 1);
  for (const status of ['pending', 'playing', 'failed', 'unavailable', 'interrupted']) {
    state.audio = status;
    assert.equal(flightCanCommit(state), false);
    assert.equal(commitFlight(state), null);
  }
  assert.equal(state.firstResponses.length, 0);
  state.support.push('printed_sound_support');
  assert.ok(commitFlight(state));
});

test('pausing freezes all actions and timers in every playable phase', () => {
  for (const phase of ['approach', 'decision', 'return', 'commit', 'checkpoint', 'complete']) {
    const state = createFlightRun();
    state.phase = phase; state.audio = 'completed'; state.nominated = true; state.paused = true;
    const before = JSON.stringify(state);
    assert.equal(steerFlight(state, 1), false);
    assert.equal(nominateFlight(state, 0), false);
    assert.equal(flightCanCommit(state), false);
    assert.equal(commitFlight(state), null);
    assert.equal(continueFlight(state), false);
    assert.equal(advanceFlight(state, 60), null);
    flightBonus(state);
    assert.equal(JSON.stringify(state), before);
  }
});

test('first responses deeply snapshot audio history and remain unchanged through supported retries', () => {
  const state = createFlightRun();
  state.audio = 'completed';
  const media = { role: 'target', status: 'completed', detail: { clips: ['recorded-target'] } };
  state.mediaEvents.push(media);
  const first = answer(state, false);
  const saved = JSON.stringify(first);
  media.detail.clips.push('later delivery');
  assert.equal(JSON.stringify(first), saved);
  assert.throws(() => first.cueHistory[0].detail.clips.push('rewrite'), TypeError);
  assert.equal(commitFlight(state), null);
  settle(state);
  assert.equal(state.audio, 'pending');
  assert.equal(state.nominated, false);
  state.audio = 'failed'; state.support.push('printed_sound_support');
  const retry = answer(state);
  assert.equal(state.firstResponses.length, 1);
  assert.equal(state.assistedRetries.length, 1);
  assert.equal(retry.learningSlot, first.learningSlot);
  assert.equal(retry.attempts, 2);
  assert.equal(retry.audioDelivery, 'failed');
  assert.ok(retry.supportUsed.includes('specific_onset_feedback'));
  assert.equal(JSON.stringify(first), saved);
});

test('final action fixes one receipt before docking, includes retry support, and does not invent earlier rounds on resume', () => {
  const state = createFlightRun('easy', 9, 71);
  state.audio = 'completed';
  answer(state, false); settle(state);
  state.audio = 'failed'; state.support.push('printed_sound_support');
  answer(state); settle(state);
  const receipt = finish(state);
  assert.equal(state.phase, 'commit');
  assert.ok(receipt.evidence.supportUsed.includes('printed_sound_support'));
  assert.ok(receipt.evidence.supportUsed.includes('specific_onset_feedback'));
  assert.equal(receipt.evidence.firstResponses.length, state.plan[9].gates.length);
  assert.equal(receipt.evidence.assistedRetries.length, 1);
  assert.deepEqual(receipt.evidence.deliveries.map(item => item.round), [9]);
  assert.equal(receipt.evidence.practiceOnly, true);
  assert.equal(receipt.evidence.independent, false);
  const saved = JSON.stringify(receipt);
  assert.equal(commitFlight(state), null);
  state.mediaEvents.push({ status: 'interrupted' });
  state.support.push('later support');
  settle(state);
  assert.equal(state.phase, 'complete');
  const terminalTime = state.time;
  advanceFlight(state, FLIGHT_STEP);
  assert.equal(state.time, terminalTime);
  assert.equal(state.receipt, receipt);
  assert.equal(JSON.stringify(receipt), saved);
});

test('all ten rounds finish and optional flight motion never changes reading score, stars or evidence', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const basic = createFlightRun(difficulty, 0, 11);
    const decorated = createFlightRun(difficulty, 0, 11);
    const receipt = finish(basic);
    assert.deepEqual(finish(decorated, true), receipt);
    assert.equal(receipt.evidence.deliveries.length, 10);
    assert.equal(receipt.words, basic.plan.reduce((sum, round) => sum + round.gates.length, 0));
    assert.equal(receipt.stars, 3);
    assert.ok(decorated.flightBonuses > 0);
  }
});
