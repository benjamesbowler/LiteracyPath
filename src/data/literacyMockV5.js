import { buildLiteracyMockFoundationV5 } from './literacyMockFoundationV5.js';
import { literacyMockAuthoredBand, LITERACY_MOCK_AREA_VERSION } from '../policy/literacyMockAdaptivePolicy.js';

export function buildLiteracyMockV5(base,normalize) {
  const originals=buildLiteracyMockFoundationV5(base,normalize);
  const items=[...base,...originals].map(source=>{
    // Quarantine is a live selection/reporting overlay, never a snapshot rewrite.
    const band=source.tutorialOnly?null:literacyMockAuthoredBand(source);
    const snapshot={...source.itemSnapshot,contentVersion:'literacy-mock-v5',adaptiveAreaVersion:LITERACY_MOCK_AREA_VERSION,
      adaptiveAreaBand:band,adaptiveMixedEligible:band!==null};
    return {...source,...snapshot,itemSnapshot:snapshot};
  });
  if(new Set(items.map(q=>q.id)).size!==items.length)throw Error('V5 item identities must be unique.');
  return items;
}
