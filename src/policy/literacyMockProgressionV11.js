import { LITERACY_MOCK_AREA_MAX, LITERACY_MOCK_AREA_ORDER } from './literacyMockAdaptivePolicy.js';
import { isEligibleLiteracyResponse, literacyPrintLetterTarget } from '../utils/literacyEvidence.js';

// Three entry observations, then repeated success on every later operation.
// These are authored task observations, never calibrated ability estimates.
export const LITERACY_MOCK_V11_AREA_VERSION = 'areas-v6';
export const literacyMockSuccessesToAdvanceV11 = band => band === 0 ? 3 : 2;
export const LITERACY_MOCK_V11_ERRORS_TO_LOWER = 2;
export const LITERACY_MOCK_V11_CONFIRMATIONS = 2;
export const LITERACY_MOCK_V11_PRINT_LETTER_LIMIT = 5;
// A complete correct path plus two recovery observations in each area.
export const LITERACY_MOCK_V11_AREA_BUDGETS = Object.freeze(Object.fromEntries(
  Object.entries(LITERACY_MOCK_AREA_MAX).map(([domain, maximum]) => [domain, 2 * maximum + 5])));
export const LITERACY_MOCK_V11_MAX_ITEMS = Object.values(LITERACY_MOCK_V11_AREA_BUDGETS).reduce((a,b) => a+b,0);

const itemBand = item => item?.adaptiveAreaBand ?? item?.itemSnapshot?.adaptiveAreaBand;
const byIdentity = bank => bank instanceof Map ? bank : Array.isArray(bank) ? new Map(bank.map(item => [item.id, item])) : null;
const canonical = (row, byId) => byId ? byId.get(row.questionId) : row.itemSnapshot || row.questionSnapshot || row;

/** The route records repeated observations of authored tasks, never a stable
 * learner level, mastery or calibrated item difficulty. Assistance and known
 * familiarity cannot confirm a boundary. All answered tasks still consume the
 * bounded sitting budget and encountered print targets remain encountered. */
export function literacyMockProgressionV11(rows = [], { bank } = {}) {
  const byId = byIdentity(bank);
  const states = Object.fromEntries(LITERACY_MOCK_AREA_ORDER.map(domainId => [domainId, {
    domainId, nextBand: 0, answered: 0, eligible: 0,
    correctByBand: Array(LITERACY_MOCK_AREA_MAX[domainId] + 1).fill(0),
    incorrectByBand: Array(LITERACY_MOCK_AREA_MAX[domainId] + 1).fill(0),
    lastCorrectByBand: Array(LITERACY_MOCK_AREA_MAX[domainId] + 1).fill(0),
    lastIncorrectByBand: Array(LITERACY_MOCK_AREA_MAX[domainId] + 1).fill(0),
    nonIndependentStreak: 0, nonIndependentBand: null,
    streakBand: null, correctStreak: 0, incorrectStreak: 0,
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
      state.correctStreak = state.incorrectStreak = 0;
      state.nextBand = band;
      continue;
    }
    state.nonIndependentStreak = 0;
    state.nonIndependentBand = null;
    state.eligible++;
    state[row.isCorrect ? 'correctByBand' : 'incorrectByBand'][band]++;
    state[row.isCorrect ? 'lastCorrectByBand' : 'lastIncorrectByBand'][band] = state.answered;
    if (state.streakBand !== band) state.correctStreak = state.incorrectStreak = 0;
    state.streakBand = band;
    state.correctStreak = row.isCorrect ? state.correctStreak + 1 : 0;
    state.incorrectStreak = row.isCorrect ? 0 : state.incorrectStreak + 1;
    state.nextBand = band;
    if (state.correctStreak >= literacyMockSuccessesToAdvanceV11(band)) {
      state.nextBand = Math.min(LITERACY_MOCK_AREA_MAX[domainId], band + 1);
    } else if (state.incorrectStreak >= LITERACY_MOCK_V11_ERRORS_TO_LOWER) {
      state.nextBand = Math.max(0, band - 1);
    }
  }
  states.print.lowerLetterTargets = [...letters];
  for (const state of Object.values(states)) {
    const maximum = LITERACY_MOCK_AREA_MAX[state.domainId];
    if (state.correctByBand[maximum] >= LITERACY_MOCK_V11_CONFIRMATIONS) {
      state.stopReason = 'ceiling_confirmed';
      state.boundary = { lowerBand: maximum, upperBand: null };
    } else if (state.incorrectByBand[0] >= LITERACY_MOCK_V11_CONFIRMATIONS) {
      state.stopReason = 'floor_confirmed';
      state.boundary = { lowerBand: null, upperBand: 0 };
    } else {
      for (let band = maximum - 1; band >= 0; band--) {
        if (state.correctByBand[band] >= literacyMockSuccessesToAdvanceV11(band)
          && state.incorrectByBand[band + 1] >= LITERACY_MOCK_V11_CONFIRMATIONS
          && state.lastCorrectByBand[band] > state.lastIncorrectByBand[band + 1]) {
          state.stopReason = 'adjacent_boundary';
          state.boundary = { lowerBand: band, upperBand: band + 1 };
          break;
        }
      }
    }
    if (!state.stopReason && state.nonIndependentStreak >= 2) state.stopReason = 'independent_followup_needed';
    if (!state.stopReason && state.domainId === 'print' && state.nextBand <= 1
      && letters.size >= LITERACY_MOCK_V11_PRINT_LETTER_LIMIT) state.stopReason = 'letter_limit';
    if (!state.stopReason && state.answered >= LITERACY_MOCK_V11_AREA_BUDGETS[state.domainId]) state.stopReason = 'budget_limit';
    state.complete = state.stopReason !== null;
  }
  return states;
}
