import { buildLiteracyMockSoundTransformationsV10, listLiteracyMockSoundTransformationsV10AudioGaps } from './literacyMockSoundTransformationsV10.js';
import { literacyMockDemandV10, LITERACY_MOCK_V10_LADDERS } from '../policy/literacyMockDemandV10.js';

/** New snapshots retain the V9 route and replace its weak sound transformations.
 * Every V1–V9 publication remains immutable. New identities retain semantic
 * operation families, so a foil repair cannot manufacture a fresh target. */
export function buildLiteracyMockV10(base, normalize) {
  const additions = buildLiteracyMockSoundTransformationsV10(base).map(source => ({ ...normalize(source),
    sourceWord: source.sourceWord, anchorWord: source.anchorWord, correctWord: source.correctWord,
    lexicalExposureWords: source.lexicalExposureWords, canonicalPassageId: source.canonicalPassageId,
  }));
  const items = [...base, ...additions];
  if (new Set(items.map(item => item.id)).size !== items.length) throw Error('Duplicate V10 question id.');
  return items.map(source => {
    const item = { ...source };
    delete item.itemSnapshot;
    const band = literacyMockDemandV10(item);
    const snapshot = { ...item, contentVersion: 'literacy-mock-v10', adaptiveAreaVersion: 'areas-v5',
      adaptiveAreaBand: band, adaptiveMixedEligible: band !== null,
      adaptiveDemand: band === null ? null : LITERACY_MOCK_V10_LADDERS[item.domainId][band] };
    return { ...snapshot, itemSnapshot: { ...snapshot } };
  });
}

export const listLiteracyMockV10AudioGaps = listLiteracyMockSoundTransformationsV10AudioGaps;
