import { canonicalLiteracyIdentity, literacyExposureIdentities } from '../utils/literacyEvidence.js';
import { isLiteracyItemEligible } from '../policy/literacyItemEligibility.js';

const identityKeys = item => literacyExposureIdentities(item).flatMap(identity =>
  Object.entries(identity).filter(([, value]) => value).map(([kind, value]) => `${kind}:${value}`));
const cellFor = item => `${item.domainId}:${item.adaptiveAreaBand}`;
const familyFor = item => {
  const identity = canonicalLiteracyIdentity(item);
  return identity.familyId || identity.passageKey || identity.itemId;
};

/** Reserve V13 practice families before publishing the scored catalogue. */
export function partitionLiteracyMockV13(items) {
  const scoredCandidates = items.filter(item => !item.tutorialOnly && item.mediaReady
    && item.adaptiveMixedEligible && isLiteracyItemEligible(item));
  const cells = new Map();
  const rowsByIdentity = new Map();
  for (const item of scoredCandidates) {
    const cell = cellFor(item);
    if (!cells.has(cell)) cells.set(cell, []);
    cells.get(cell).push(item);
    for (const key of new Set(identityKeys(item))) {
      if (!rowsByIdentity.has(key)) rowsByIdentity.set(key, []);
      rowsByIdentity.get(key).push(item);
    }
  }

  const reserve = new Set();
  const retired = new Set();
  const practice = [];
  const minimum = new Map([...cells].map(([cell, rows]) => [cell,
    Math.min(16, new Set(rows.map(familyFor)).size)]));
  for (const rows of cells.values()) {
    const [first] = rows;
    // All 26 letter-name/case families are scarce across repeated pupil
    // sittings. Use word-position questions for the early class Print steps.
    if (first.domainId === 'print' && first.adaptiveAreaBand < 2) continue;
    const earlyPrint = first.domainId === 'print' && first.adaptiveAreaBand === 2;
    const desired = earlyPrint ? 18 : 8;
    let selected = 0;
    const candidates = rows.map(item => {
      const keys = new Set(identityKeys(item));
      return { item, keys, overlaps: new Set([...keys].flatMap(key => rowsByIdentity.get(key))) };
    }).sort((a, b) => a.overlaps.size - b.overlaps.size || (a.item.id < b.item.id ? -1 : 1));
    for (const { item, keys, overlaps } of candidates) {
      if (selected === desired) break;
      if ([...keys].some(key => reserve.has(key))) continue;
      const affectedCells = new Set([...overlaps].map(cellFor));
      const leavesCapacity = [...affectedCells].every(cell => {
        const remaining = cells.get(cell).filter(row => !retired.has(row.id) && !overlaps.has(row));
        return new Set(remaining.map(familyFor)).size >= minimum.get(cell);
      });
      if (!leavesCapacity) continue;
      for (const key of keys) reserve.add(key);
      for (const row of overlaps) retired.add(row.id);
      const practiceBand = earlyPrint ? Math.floor(selected / 6) : item.adaptiveAreaBand;
      practice.push(practiceBand === item.adaptiveAreaBand ? item : {
        ...item, adaptiveAreaBand: practiceBand, itemSnapshot: { ...item.itemSnapshot, adaptiveAreaBand: practiceBand },
      });
      selected++;
    }
  }

  // The manifest also carries a few non-mixed items. Presentation as class
  // practice must stay disjoint from those as well as the adaptive pools.
  const scored = items.filter(item => item.tutorialOnly || !identityKeys(item).some(key => reserve.has(key)));
  return { scored, practice };
}
