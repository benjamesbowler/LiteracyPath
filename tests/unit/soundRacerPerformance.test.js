import assert from 'node:assert/strict';
import test from 'node:test';
import { createRacerPerformanceState, resetRacerPerformanceState, sampleRacerPerformance } from '../../src/features/soundRacer/performance.js';
import { createQuestFrameBudgetState, sampleQuestFrameBudget } from '../../src/utils/questPerformance.js';

function untilSignal(state, duration, maximum = 500) {
  for (let index = 0; index < maximum; index += 1) {
    const result = sampleRacerPerformance(state, duration);
    if (result) return result;
  }
  return null;
}

test('Arcade tiers map explicitly and reset discards old render samples', () => {
  for (const [quality, tier] of [['high', 'rich'], ['medium', 'balanced'], ['low', 'low'], ['fallback', '2d']]) {
    const state = createRacerPerformanceState(quality);
    assert.equal(state.budget.tierId, tier);
    sampleRacerPerformance(state, 40);
    const reset = resetRacerPerformanceState(quality);
    assert.notEqual(reset, state);
    assert.notEqual(reset.budget, state.budget);
    assert.equal(reset.budget.warmupFrames, 0);
    assert.equal(reset.quality, quality);
  }
  assert.equal(createRacerPerformanceState('unknown').quality, 'high');
});

test('warmup and an isolated hitch cannot downgrade healthy rendering', () => {
  const state = createRacerPerformanceState('high');
  const budget = state.budget;
  for (let index = 0; index < 40; index += 1) assert.equal(sampleRacerPerformance(state, 40), null);
  assert.equal(sampleRacerPerformance(state, 140), null);
  for (let index = 0; index < 210; index += 1) assert.equal(sampleRacerPerformance(state, 16.7), null);
  assert.equal(state.quality, 'high');
  assert.equal(state.budget, budget);
});

test('sustained window follows the shared policy exactly and resets the new tier', () => {
  const state = createRacerPerformanceState('high');
  let reference = createQuestFrameBudgetState('rich');
  let result;
  for (let index = 0; index < 250; index += 1) {
    const expected = sampleQuestFrameBudget(reference, 40);
    result = sampleRacerPerformance(state, 40);
    if (expected) reference = expected.state;
    assert.deepEqual(state.budget, reference);
    assert.deepEqual(result?.signal, expected?.signal);
    if (result) break;
  }
  assert.equal(result.action, 'quality-step');
  assert.equal(result.previousQuality, 'high');
  assert.equal(result.quality, 'medium');
  assert.equal(state.budget.warmupFrames, 0);
});

test('sustained severe rendering steps through tiers into the semantic fallback', () => {
  const state = createRacerPerformanceState('high');
  for (const quality of ['medium', 'low', 'fallback']) {
    const result = untilSignal(state, 140, 8);
    assert.equal(result.quality, quality);
    assert.equal(result.action, quality === 'fallback' ? 'fallback' : 'quality-step');
    assert.equal(result.signal.reason, 'sustained-severe-frames');
  }
  assert.equal(sampleRacerPerformance(state, 140), null);
});

test('paused and invalid samples leave the budget untouched', () => {
  const state = createRacerPerformanceState('medium');
  const original = structuredClone(state);
  for (const value of [NaN, Infinity, -1, 0, 3, 2001, null, '140']) {
    assert.equal(sampleRacerPerformance(state, value), null);
  }
  for (let index = 0; index < 40; index += 1) assert.equal(sampleRacerPerformance(state, 140, { paused: true }), null);
  assert.deepEqual(state, original);
  assert.equal(sampleRacerPerformance(state, 16.7), null);
  assert.equal(state.budget.warmupFrames, 1);
});

test('healthy reporting windows are telemetry only and retain quality', () => {
  const state = createRacerPerformanceState('medium');
  const result = untilSignal(state, 16.7, 1000);
  assert.equal(result.action, 'report');
  assert.equal(result.quality, 'medium');
  assert.equal(result.signal.type, 'frame-window');
});
