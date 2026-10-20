import { shuffleLiteracyMock } from '../../utils/literacyMockPlanner.js';
import { isLiteracyItemEligible } from '../../policy/literacyItemEligibility.js';
import { LITERACY_MOCK_AREA_ORDER } from '../../policy/literacyMockAdaptivePolicy.js';

export const WHOLE_CLASS_CYCLE_ACTIVITIES = Object.freeze([
  ['pictureSound', 'Sound Safari'], ['letterMatch', 'Letter Friends'],
  ['rhymeMatch', 'Rhyme Picnic'], ['wordBuild', 'Word Workshop'],
  ['soundSort', 'Sound Delivery'], ['letterTrace', 'Rainbow Writing']
]);

export function wholeClassMockPool(bank, area = 'all', band = '0') {
  return bank.filter(item => !item.tutorialOnly && item.mediaReady && item.adaptiveMixedEligible
    && isLiteracyItemEligible(item) && (area === 'all' || item.domainId === area)
    && (band === 'all' || item.adaptiveAreaBand === Number(band)));
}

// Interleave the available areas after shuffling their questions. Practice never adapts a
// learner, submits an assessment event or claims a fresh independent result.
export function wholeClassMockRounds(bank, { area = 'all', band = '0', seed, count = 12 } = {}) {
  const shuffled = shuffleLiteracyMock(wholeClassMockPool(bank, area, band), seed);
  const groups = new Map(LITERACY_MOCK_AREA_ORDER.map(id => [id, []]));
  const seen = new Set();
  for (const item of shuffled) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    groups.get(item.domainId)?.push(item);
  }
  const rounds = [];
  while ([...groups.values()].some(group => group.length)) {
    for (const group of groups.values()) if (group.length) rounds.push(group.shift());
  }
  return count === 'all' ? rounds : rounds.slice(0, Number(count));
}

export function wholeClassMockAnswer(item) {
  if (item.format === 'build_word') return String(item.answer);
  const ids = Array.isArray(item.answer) ? item.answer : [item.answer];
  return ids.map((id, index) => {
    const label = item.choices.find(choice => choice.id === id)?.label || 'Picture answer';
    if (item.format === 'select_text') {
      const position = item.choices.find(choice => choice.id === id)?.tokenIndex;
      return Number.isInteger(position) ? `${label} (word ${position + 1})` : label;
    }
    return item.format === 'match' ? `${item.matchTargets[index]?.label || `Space ${index + 1}`}: ${label}` : label;
  }).join(item.format === 'order' ? ' ' : ' · ');
}
