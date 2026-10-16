import { buildLiteracyMockCorrectionsV9, listLiteracyMockCorrectionsV9AudioGaps } from './literacyMockCorrectionsV9.js';
import { buildLiteracyMockBoundaryComprehensionV9, listLiteracyMockBoundaryComprehensionV9AudioGaps } from './literacyMockBoundaryComprehensionV9.js';
import { literacyMockDemandV9, LITERACY_MOCK_V9_LADDERS } from '../policy/literacyMockDemandV9.js';

/** Publish new snapshots and correction identities without mutating V1–V8. */
export function buildLiteracyMockV9(base, normalize) {
  const additions = [...buildLiteracyMockCorrectionsV9(base), ...buildLiteracyMockBoundaryComprehensionV9()]
    .map(source => ({ ...normalize(source), ...(source.foundationBand !== undefined ? { foundationBand: source.foundationBand } : {}) }));
  const items = [...base, ...additions];
  if (new Set(items.map(q => q.id)).size !== items.length) throw Error('Duplicate V9 question id.');
  return items.map(source => {
    const item = { ...source };
    delete item.itemSnapshot;
    if (item.domainId === 'listening') item.displayPassageDuringResponse = false;
    const band = literacyMockDemandV9(item);
    if (item.domainId === 'phonics' && band === 3) item.taskDemand = {
      reviewed: true, operation: 'construct_four_phoneme_short_blend',
      features: { phonemeCount: 4, responseUnitCount: 4, consonantBlend: true },
      proof: { targetWord: item.targetWord || item.answer, responseUnits: 4,
        reason: 'A regular four-letter CCVC/CVCC target has four distinct consonant/vowel phonemes; digraphs, doubled consonants, x and five-letter forms are excluded.' },
    };
    const snapshot = { ...item, contentVersion: 'literacy-mock-v9', adaptiveAreaVersion: 'areas-v5',
      adaptiveAreaBand: band, adaptiveMixedEligible: band !== null,
      adaptiveDemand: band === null ? null : LITERACY_MOCK_V9_LADDERS[item.domainId][band] };
    return { ...snapshot, itemSnapshot: { ...snapshot } };
  });
}

/** Exact unresolved requests across all V9 sources, sharing repeated recordings. */
export function listLiteracyMockV9AudioGaps(base) {
  const requests = new Map();
  for (const request of [...listLiteracyMockCorrectionsV9AudioGaps(base), ...listLiteracyMockBoundaryComprehensionV9AudioGaps()]) {
    const key = `${request.role}:${request.text}`, existing = requests.get(key);
    requests.set(key, existing ? { ...existing, itemIds: [...new Set([...existing.itemIds, ...request.itemIds])] } : request);
  }
  return [...requests.values()];
}
