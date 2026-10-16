import { isLiteracyItemEligible } from '../policy/literacyItemEligibility.js';
import { literacyPrintLetterTarget } from './literacyEvidence.js';
import { sameLiteracyMockTask } from './literacyMockConditions.js';
import { shuffleLiteracyMock } from './literacyMockPlanner.js';

const band = item => item?.adaptiveAreaBand ?? item?.itemSnapshot?.adaptiveAreaBand;
const paths = item => [...(item.requiredAudioPaths || []), ...(item.requiredImagePaths || [])].map(path => path.split('#')[0]);
const capacityError = () => Object.assign(new Error('Not enough fresh print letters for a complete test and offline reserve.'),
  { code: 'mock_fresh_capacity' });

/** Reserve N+1 fresh semantic letters for N print slots. The caller supplies
 * already fresh candidates and includes this only in the new sitting route.
 * Every eligible name/case variant of the chosen letters is retained; they
 * are alternative snapshots, never additional independent observations.
 * Actual plans must still enforce all canonical identity constraints.
 * Throws mock_fresh_capacity if the initial form or spare cannot fit. */
export function selectLiteracyMockPrintRetakePool(candidates, plan, byId) {
  const planned = plan.itemIds.map(id => byId.get(id));
  if (planned.some(item => !item)) throw capacityError();
  const print = planned.filter(item => item.domainId === 'print');
  if (!print.length) return [];
  const tutorials = new Set(candidates.filter(item => item.tutorialOnly).map(item => item.stimulusKey));
  const eligible = candidates.filter(item => item.domainId === 'print' && !item.tutorialOnly && item.mediaReady !== false
    && !tutorials.has(item.stimulusKey) && isLiteracyItemEligible(item)
    && (band(item) === 0 && item.constructClaim === 'letter_name'
      || band(item) === 1 && ['letter_case', 'letter_case_correspondence'].includes(item.constructClaim)));
  const groups = new Map();
  for (const item of eligible) {
    const letter = literacyPrintLetterTarget(item);
    if (!letter) continue;
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(item);
  }
  // Both demands must be available for each reserved target. Names alone or
  // an additional case snapshot cannot manufacture another fresh letter.
  for (const [letter, items] of groups) if (!items.some(item => band(item) === 0) || !items.some(item => band(item) === 1)) groups.delete(letter);
  const selected = new Set(print.map(literacyPrintLetterTarget));
  if (selected.size !== print.length || selected.has(null) || print.some(item => band(item) !== 1
    || !groups.get(literacyPrintLetterTarget(item))?.some(candidate => candidate.id === item.id))) throw capacityError();
  const assets = new Set(planned.flatMap(paths));
  const spare = shuffleLiteracyMock([...groups.keys()].filter(letter => !selected.has(letter)
    && print.every(item => groups.get(letter).some(candidate => sameLiteracyMockTask(item, candidate, { includeLevel: true })))),
  `${plan.seed}:print:retake`);
  const extraAssets = letter => new Set(groups.get(letter).flatMap(paths).filter(path => !assets.has(path))).size;
  spare.sort((left, right) => extraAssets(left) - extraAssets(right));
  if (!spare.length) throw capacityError();
  selected.add(spare[0]);
  return [...new Map([...selected].flatMap(letter => groups.get(letter)).map(item => [item.id, item])).values()];
}
