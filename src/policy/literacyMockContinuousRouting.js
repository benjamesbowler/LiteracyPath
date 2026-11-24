import { LITERACY_MOCK_AREA_MAX } from './literacyMockAdaptivePolicy.js';
import { isEligibleLiteracyResponse } from '../utils/literacyEvidence.js';

// These capitalization prompts display their answer, and these homophone
// hotspots repeat the keyed spelling. Keep the immutable historical items.
export const LITERACY_MOCK_CONTINUOUS_EXCLUDED_IDS = Object.freeze([
  'literacy.capitalization.sentence-edit.v11',
  ...[1, 4, 5, 6, 7, 8, 9].map(number => `mock.capacity.writing.edit-cap-${number}.v11`),
  ...['sea_see', 'sun_son', 'be_bee', 'no_know', 'one_won', 'ate_eight', 'hear_here',
    'blue_blew', 'to_two', 'there_their', 'right_write', 'new_knew']
    .map(pair => `mock.v4.word-ladder.homophones.l2.${pair}`),
]);

// Carry the position on the previous area's authored ladder to the next
// area. Floor/ceil select the nearest strictly higher/lower destination step
// even when the two ladders have different lengths. Reports remain per area.
export function continuousLiteracyMockBand(response, previousItem, nextArea) {
  if (!response) return 1;
  const previousMaximum = LITERACY_MOCK_AREA_MAX[previousItem.domainId];
  const nextMaximum = LITERACY_MOCK_AREA_MAX[nextArea];
  const position = previousItem.adaptiveAreaBand * nextMaximum / previousMaximum;
  if ((response.classification && response.classification !== 'independent') || !isEligibleLiteracyResponse(response)) {
    return Math.round(position);
  }
  return response.isCorrect
    ? Math.min(nextMaximum, Math.floor(position) + 1)
    : Math.max(0, Math.ceil(position) - 1);
}
