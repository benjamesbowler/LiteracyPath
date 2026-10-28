import { buildLiteracyMockBeginnerV12 } from './literacyMockBeginnerV12.js';
import { literacyMockBeginnerVocabularyIssue } from '../policy/literacyMockBeginnerVocabulary.js';
import { LITERACY_MOCK_V12_LADDERS } from '../policy/literacyMockDemandV12.js';

// A new publication carries the corrected admission and fresh simple stock.
// Every historical version keeps its exact text, answer, media and exposure.
export function buildLiteracyMockV12(base, normalize) {
  const publish = source => {
    const snapshot = {...source, contentVersion:'literacy-mock-v12', adaptiveAreaVersion:'areas-v6',
      ...(source.adaptiveMixedEligible ? {adaptiveDemand:LITERACY_MOCK_V12_LADDERS[source.domainId][source.adaptiveAreaBand]} : {})};
    delete snapshot.itemSnapshot;
    if (literacyMockBeginnerVocabularyIssue(snapshot)) snapshot.adaptiveMixedEligible = false;
    return {...snapshot, itemSnapshot:{...snapshot}};
  };
  const items = [...base, ...buildLiteracyMockBeginnerV12(base, normalize)].map(publish);
  if (new Set(items.map(item=>item.id)).size !== items.length) throw Error('Duplicate V12 question identity.');
  return items;
}
