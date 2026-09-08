import { createQuestFrameBudgetState, sampleQuestFrameBudget } from '../../utils/questPerformance.js';

const TO_BUDGET = Object.freeze({ high: 'rich', medium: 'balanced', low: 'low', fallback: '2d' });
const TO_ARCADE = Object.freeze({ rich: 'high', balanced: 'medium', low: 'low', '2d': 'fallback' });

/** Dedicated mutable rendering telemetry; never pass mission or evidence state. */
export function createRacerPerformanceState(quality = 'high') {
  const normalized = Object.hasOwn(TO_BUDGET, quality) ? quality : 'high';
  return { quality: normalized, budget: createQuestFrameBudgetState(TO_BUDGET[normalized]) };
}

/** Explicitly replace the budget after a hardware tier or viewport reconfiguration. */
export function resetRacerPerformanceState(quality = 'high') {
  return createRacerPerformanceState(quality);
}

/**
 * Feed real rendered-frame intervals, not the simulation's capped fixed step.
 * Ordinary/paused frames allocate no result. The existing Quest policy owns
 * warmup, isolated-hitch tolerance, sustained windows and emergency downgrades.
 * The caller applies quality-step to its renderer or fallback to the semantic
 * board; neither signal authorizes changing answers, progress or difficulty.
 */
export function sampleRacerPerformance(state, frameMs, { paused = false } = {}) {
  if (paused || !state?.budget || typeof frameMs !== 'number' || !Number.isFinite(frameMs)) return null;
  const emitted = sampleQuestFrameBudget(state.budget, frameMs);
  if (!emitted) return null;
  const previousQuality = state.quality;
  state.budget = emitted.state;
  state.quality = TO_ARCADE[emitted.state.tierId];
  return {
    action: emitted.signal.type === 'quality-change'
      ? (state.quality === 'fallback' ? 'fallback' : 'quality-step') : 'report',
    quality: state.quality,
    previousQuality,
    signal: emitted.signal
  };
}
