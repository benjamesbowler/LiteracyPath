import { literacyMockDemandV8, LITERACY_MOCK_V8_LADDERS } from '../policy/literacyMockDemandV8.js';
import { buildLiteracyMockRetakeFoundations } from './literacyMockRetakeFoundations.js';
import { buildLiteracyMockRetakeComprehension } from './literacyMockRetakeComprehension.js';
import { buildLiteracyMockRetakeVocabulary } from './literacyMockRetakeVocabulary.js';
import { buildLiteracyMockTutorialV8 } from './literacyMockTutorialV8.js';

/** Append reviewed material; earlier publications and saved snapshots stay
 * unchanged. Media is resolved by the same normalizer as the original bank. */
export function buildLiteracyMockV8(base, normalize) {
  const additions = [...buildLiteracyMockRetakeFoundations(base),
    ...buildLiteracyMockRetakeComprehension(), ...buildLiteracyMockRetakeVocabulary(), buildLiteracyMockTutorialV8()]
    .map(source => ({ ...normalize(source), ...(source.foundationBand !== undefined ? { foundationBand: source.foundationBand } : {}) }));
  const bank = [...base, ...additions];
  if (new Set(bank.map(q => q.id)).size !== bank.length) throw new Error('Duplicate V8 question id.');
  return bank.map(q => {
    const band = literacyMockDemandV8(q);
    const snapshot = { ...q.itemSnapshot, ...(q.foundationBand !== undefined ? { foundationBand: q.foundationBand } : {}),
      contentVersion: 'literacy-mock-v8', adaptiveAreaVersion: 'areas-v4', adaptiveAreaBand: band,
      adaptiveMixedEligible: band !== null, adaptiveDemand: band === null ? null : LITERACY_MOCK_V8_LADDERS[q.domainId][band] };
    return { ...q, ...snapshot, itemSnapshot: snapshot };
  });
}
