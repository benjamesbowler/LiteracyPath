import { LITERACY_MOCK_AREA_MAX, LITERACY_MOCK_AREA_ORDER } from './literacyMockAdaptivePolicy.js';
import { isEligibleLiteracyResponse, literacyPrintLetterTarget } from '../utils/literacyEvidence.js';

export const LITERACY_MOCK_V9_AREA_VERSION = 'areas-v5';
export const LITERACY_MOCK_V9_AREA_BUDGETS = Object.freeze({
  sound_awareness: 8, phonics: 9, print: 8, vocabulary: 8,
  listening: 9, language: 8, reading: 9, writing: 8,
});
export const LITERACY_MOCK_V9_MAX_ITEMS = Object.values(LITERACY_MOCK_V9_AREA_BUDGETS).reduce((sum, count) => sum + count, 0);
export const LITERACY_MOCK_V9_PRINT_LETTER_LIMIT = 5;
export const LITERACY_MOCK_V9_CONFIRMATIONS = 2;

const itemBand = item => item?.adaptiveAreaBand ?? item?.itemSnapshot?.adaptiveAreaBand;
const byIdentity = bank => bank instanceof Map ? bank : Array.isArray(bank) ? new Map(bank.map(item => [item.id, item])) : null;
const canonical = (row, byId) => byId ? byId.get(row.questionId) : row.itemSnapshot || row.questionSnapshot || row;

/** The route records repeated observations of authored tasks, never a stable
 * learner level, mastery or calibrated item difficulty. Assistance and known
 * familiarity cannot confirm a boundary. All answered tasks still consume the
 * bounded sitting budget and encountered print targets remain encountered. */
export function literacyMockBoundaryStateV9(rows = [], { bank } = {}) {
  const byId = byIdentity(bank);
  const states = Object.fromEntries(LITERACY_MOCK_AREA_ORDER.map(domainId => [domainId, {
    domainId, nextBand: 0, answered: 0, eligible: 0,
    correctByBand: Array(LITERACY_MOCK_AREA_MAX[domainId] + 1).fill(0),
    incorrectByBand: Array(LITERACY_MOCK_AREA_MAX[domainId] + 1).fill(0),
    nonIndependentStreak: 0, nonIndependentBand: null,
    lowerLetterTargets: [], stopReason: null, boundary: null, complete: false,
  }]));
  const letters = new Set();
  for (const row of rows) {
    // Media repair does not spend an answer slot. Its target exposure is still
    // excluded independently by the ordinary item/passage/family history.
    if (row?.responseStatus === 'media_failed') continue;
    const item = canonical(row, byId), domainId = item?.domainId, band = itemBand(item);
    const state = states[domainId];
    if (!state || !Number.isInteger(band) || band < 0 || band > LITERACY_MOCK_AREA_MAX[domainId]) continue;
    state.answered++;
    if (domainId === 'print' && band <= 1) {
      const letter = literacyPrintLetterTarget(item);
      // A malformed missing target cannot bypass the finite-letter stop.
      letters.add(letter || `question:${row.questionId || item.id || state.answered}`);
    }
    if ((row.classification && row.classification !== 'independent') || !isEligibleLiteracyResponse(row)) {
      state.nonIndependentStreak = state.nonIndependentBand === band ? state.nonIndependentStreak + 1 : 1;
      state.nonIndependentBand = band;
      continue;
    }
    state.nonIndependentStreak = 0;
    state.nonIndependentBand = null;
    state.eligible++;
    state[row.isCorrect ? 'correctByBand' : 'incorrectByBand'][band]++;
    state.nextBand = Math.max(0, Math.min(LITERACY_MOCK_AREA_MAX[domainId], band + (row.isCorrect ? 1 : -1)));
  }
  states.print.lowerLetterTargets = [...letters];
  for (const state of Object.values(states)) {
    const maximum = LITERACY_MOCK_AREA_MAX[state.domainId];
    if (state.correctByBand[maximum] >= LITERACY_MOCK_V9_CONFIRMATIONS) {
      state.stopReason = 'ceiling_confirmed';
      state.boundary = { lowerBand: maximum, upperBand: null };
    } else if (state.incorrectByBand[0] >= LITERACY_MOCK_V9_CONFIRMATIONS) {
      state.stopReason = 'floor_confirmed';
      state.boundary = { lowerBand: null, upperBand: 0 };
    } else {
      for (let band = maximum - 1; band >= 0; band--) {
        if (state.correctByBand[band] >= LITERACY_MOCK_V9_CONFIRMATIONS
          && state.incorrectByBand[band + 1] >= LITERACY_MOCK_V9_CONFIRMATIONS) {
          state.stopReason = 'adjacent_boundary';
          state.boundary = { lowerBand: band, upperBand: band + 1 };
          break;
        }
      }
    }
    if (!state.stopReason && state.nonIndependentStreak >= 2) state.stopReason = 'independent_followup_needed';
    if (!state.stopReason && state.domainId === 'print' && state.nextBand <= 1
      && letters.size >= LITERACY_MOCK_V9_PRINT_LETTER_LIMIT) state.stopReason = 'letter_limit';
    if (!state.stopReason && state.answered >= LITERACY_MOCK_V9_AREA_BUDGETS[state.domainId]) state.stopReason = 'budget_limit';
    state.complete = state.stopReason !== null;
  }
  return states;
}

/** Full maximum paired schedule. Removing each area's first answered slots
 * and its stopped future slots yields the deterministic remaining schedule.
 * Recomputing from effective responses permits bounded re-expansion after
 * late assistance, while callers preserve every answered and shown question. */
export function literacyMockBoundaryScheduleV9(rows = [], options = {}) {
  const byId = byIdentity(options.bank);
  const prefix = rows.filter(row => row?.responseStatus !== 'media_failed').map(row => canonical(row, byId)?.domainId);
  if (prefix.some(domainId => !LITERACY_MOCK_V9_AREA_BUDGETS[domainId]) || prefix.length > LITERACY_MOCK_V9_MAX_ITEMS) throw new Error('Invalid adaptive boundary history.');
  const states = literacyMockBoundaryStateV9(rows, options), seen = Object.fromEntries(LITERACY_MOCK_AREA_ORDER.map(domain => [domain, 0]));
  const maximum = [], remaining = { ...LITERACY_MOCK_V9_AREA_BUDGETS };
  while (maximum.length < LITERACY_MOCK_V9_MAX_ITEMS) {
    for (const domain of LITERACY_MOCK_AREA_ORDER) {
      const take = Math.min(2, remaining[domain]);
      for (let index = 0; index < take; index++) maximum.push(domain);
      remaining[domain] -= take;
    }
  }
  const future = maximum.filter(domain => ++seen[domain] > states[domain].answered && !states[domain].complete);
  if (Object.values(states).some(state => state.answered > LITERACY_MOCK_V9_AREA_BUDGETS[state.domainId])) throw new Error('Invalid adaptive boundary history.');
  return [...prefix, ...future];
}

/** Only the next unseen observation uses nextBand. Remaining placeholders do
 * not make a prediction about future answers or consume eight fresh letters. */
export function literacyMockBoundaryPlaceholderBandV9(domainId, ordinal) {
  return domainId === 'print' && ordinal > LITERACY_MOCK_V9_PRINT_LETTER_LIMIT ? 2 : 0;
}
