import { createQuestFrameBudgetState, sampleQuestFrameBudget } from '../../../../utils/questPerformance.js';
import { QUALITY_TIERS } from '../shared/threeShell.js';

const policies = { high: 'rich', medium: 'balanced', low: 'low' };
const tiers = { rich: 'high', balanced: 'medium', low: 'low', '2d': 'canvas' };

// The existing tested frame-budget authority owns every decision threshold.
// A hardware hint selects the opening pixel cap; only actual active rendered
// intervals can request a later downgrade. Pause/loading gaps are not samples.
export function createWordClimbRenderBudget(initialTier = 'high') {
  let state = createQuestFrameBudgetState(policies[initialTier] || 'rich'), previous = null;
  const reports = [];
  return {
    get tier() { return tiers[state.tierId]; },
    observe(at, active) {
      if (!active || !Number.isFinite(at)) { previous = null; return null; }
      const elapsed = previous === null ? null : at - previous; previous = at;
      if (elapsed === null) return null;
      const result = sampleQuestFrameBudget(state, elapsed);
      if (!result) return null;
      state = result.state;
      reports.push({ ...result.signal }); if (reports.length > 12) reports.shift();
      return result.signal.type === 'quality-change' ? tiers[state.tierId] : null;
    },
    pixelRatio(deviceRatio = 1) {
      const cap = QUALITY_TIERS[tiers[state.tierId]]?.pixelRatioCap || 1;
      return Math.min(Math.max(1, Number(deviceRatio) || 1), 1.5, cap);
    },
    inspect() { return { tier: tiers[state.tierId], policy: state.tierId, reports: structuredClone(reports) }; }
  };
}
